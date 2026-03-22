---
summary: "Vòng đời của voice overlay khi wake-word và push-to-talk trùng nhau"
read_when:
  - Điều chỉnh hành vi voice overlay
title: "Voice Overlay"
---

# Vòng đời Voice Overlay (macOS)

Đối tượng: Người đóng góp ứng dụng macOS. Mục tiêu: giữ cho voice overlay hoạt động dự đoán được khi wake-word và push-to-talk trùng nhau.

## Ý định hiện tại

- Nếu overlay đã hiển thị từ wake-word và người dùng nhấn hotkey, session hotkey _nhận_ văn bản hiện có thay vì reset. Overlay giữ nguyên khi hotkey được giữ. Khi người dùng thả: gửi nếu có văn bản đã cắt, nếu không thì bỏ qua.
- Wake-word tự động gửi khi im lặng; push-to-talk gửi ngay khi thả.

## Đã triển khai (9/12/2025)

- Các session overlay giờ mang một token cho mỗi lần capture (wake-word hoặc push-to-talk). Các cập nhật partial/final/send/dismiss/level bị loại bỏ khi token không khớp, tránh callback cũ.
- Push-to-talk nhận văn bản overlay hiện có làm tiền tố (nhấn hotkey khi overlay wake đang bật giữ văn bản và thêm lời nói mới). Chờ tối đa 1.5s cho transcript cuối trước khi quay lại văn bản hiện tại.
- Chime/overlay logging được phát ra ở mức `info` trong các danh mục `voicewake.overlay`, `voicewake.ptt`, và `voicewake.chime` (bắt đầu session, partial, final, send, dismiss, lý do chime).

## Bước tiếp theo

1. **VoiceSessionCoordinator (actor)**
   - Chỉ sở hữu một `VoiceSession` tại một thời điểm.
   - API (dựa trên token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Loại bỏ callback mang token cũ (ngăn nhận diện cũ mở lại overlay).
2. **VoiceSession (model)**
   - Trường: `token`, `source` (wakeWord|pushToTalk), văn bản đã cam kết/tạm thời, cờ chime, bộ đếm thời gian (auto-send, idle), `overlayMode` (display|editing|sending), thời hạn cooldown.
3. **Overlay binding**
   - `VoiceSessionPublisher` (`ObservableObject`) phản ánh session hoạt động vào SwiftUI.
   - `VoiceWakeOverlayView` chỉ render qua publisher; không bao giờ thay đổi singleton toàn cục trực tiếp.
   - Hành động người dùng overlay (`sendNow`, `dismiss`, `edit`) gọi lại vào coordinator với session token.
4. **Đường gửi hợp nhất**
   - Khi `endCapture`: nếu văn bản đã cắt trống → bỏ qua; nếu không `performSend(session:)` (phát chime gửi một lần, chuyển tiếp, bỏ qua).
   - Push-to-talk: không trễ; wake-word: trễ tùy chọn cho auto-send.
   - Áp dụng cooldown ngắn cho runtime wake sau khi push-to-talk kết thúc để wake-word không kích hoạt lại ngay lập tức.
5. **Logging**
   - Coordinator phát `.info` logs trong subsystem `ai.openclaw`, danh mục `voicewake.overlay` và `voicewake.chime`.
   - Sự kiện chính: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Checklist Debugging

- Stream logs khi tái tạo overlay dính:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Xác minh chỉ có một session token hoạt động; callback cũ nên bị loại bỏ bởi coordinator.
- Đảm bảo push-to-talk release luôn gọi `endCapture` với token hoạt động; nếu văn bản trống, mong đợi `dismiss` không có chime hoặc send.

## Bước di chuyển (đề xuất)

1. Thêm `VoiceSessionCoordinator`, `VoiceSession`, và `VoiceSessionPublisher`.
2. Refactor `VoiceWakeRuntime` để tạo/cập nhật/kết thúc session thay vì chạm trực tiếp `VoiceWakeOverlayController`.
3. Refactor `VoicePushToTalk` để nhận session hiện có và gọi `endCapture` khi thả; áp dụng cooldown runtime.
4. Kết nối `VoiceWakeOverlayController` với publisher; loại bỏ các cuộc gọi trực tiếp từ runtime/PTT.
5. Thêm test tích hợp cho session adoption, cooldown, và empty-text dismissal.\n