---
summary: "Tìm hiểu cách cấu hình voice overlay trên Mac khi wake-word và push-to-talk trùng nhau, đảm bảo hiệu suất tối ưu."
read_when:
  - Điều chỉnh hành vi của voice overlay
title: "Hướng Dẫn Cấu Hình Voice Overlay Trên Mac"
---

# Vòng Đời Voice Overlay (macOS)

Đối tượng: Những người đóng góp cho ứng dụng macOS. Mục tiêu: giữ cho voice overlay hoạt động dự đoán được khi wake-word và push-to-talk trùng nhau.

## Ý định hiện tại

- Nếu overlay đã hiển thị từ wake-word và người dùng nhấn phím nóng, phiên làm việc của phím nóng sẽ _nhận_ văn bản hiện có thay vì đặt lại. Overlay sẽ duy trì khi phím nóng được giữ. Khi người dùng thả phím: gửi nếu có văn bản đã cắt, nếu không thì bỏ qua.
- Wake-word tự động gửi khi im lặng; push-to-talk gửi ngay khi thả phím.

## Đã triển khai (9 Tháng 12, 2025)

- Các phiên overlay hiện mang một token cho mỗi lần ghi (wake-word hoặc push-to-talk). Các cập nhật partial/final/send/dismiss/level bị loại bỏ khi token không khớp, tránh các callback cũ.
- Push-to-talk nhận văn bản overlay hiện có làm tiền tố (vì vậy khi nhấn phím nóng trong khi overlay wake đang hoạt động sẽ giữ văn bản và thêm lời nói mới). Nó chờ tối đa 1,5 giây để có bản ghi cuối cùng trước khi quay lại văn bản hiện tại.
- Ghi nhật ký chime/overlay được phát ra ở mức `info` trong các danh mục `voicewake.overlay`, `voicewake.ptt`, và `voicewake.chime` (bắt đầu phiên, partial, final, gửi, bỏ qua, lý do chime).

## Các bước tiếp theo

1. **VoiceSessionCoordinator (actor)**
   - Chỉ sở hữu một `VoiceSession` tại một thời điểm.
   - API (dựa trên token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Loại bỏ các callback mang token cũ (ngăn các bộ nhận dạng cũ mở lại overlay).
2. **VoiceSession (model)**
   - Các trường: `token`, `source` (wakeWord|pushToTalk), văn bản đã cam kết/biến động, cờ chime, bộ đếm thời gian (tự động gửi, không hoạt động), `overlayMode` (hiển thị|chỉnh sửa|gửi), thời hạn cooldown.
3. **Liên kết Overlay**
   - `VoiceSessionPublisher` (`ObservableObject`) phản ánh phiên hoạt động vào SwiftUI.
   - `VoiceWakeOverlayView` chỉ hiển thị qua publisher; không bao giờ thay đổi các singleton toàn cục trực tiếp.
   - Các hành động của người dùng trên overlay (`sendNow`, `dismiss`, `edit`) gọi lại vào coordinator với token phiên.
4. **Đường dẫn gửi hợp nhất**
   - Khi `endCapture`: nếu văn bản đã cắt trống → bỏ qua; nếu không `performSend(session:)` (phát chime gửi một lần, chuyển tiếp, bỏ qua).
   - Push-to-talk: không có độ trễ; wake-word: độ trễ tùy chọn cho tự động gửi.
   - Áp dụng một thời gian cooldown ngắn cho runtime wake sau khi push-to-talk kết thúc để wake-word không kích hoạt lại ngay lập tức.
5. **Ghi nhật ký**
   - Coordinator phát ra nhật ký `.info` trong hệ thống con `ai.openclaw`, các danh mục `voicewake.overlay` và `voicewake.chime`.
   - Các sự kiện chính: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Danh sách kiểm tra gỡ lỗi

- Stream nhật ký trong khi tái tạo overlay bị kẹt:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Xác minh chỉ có một token phiên hoạt động; các callback cũ nên bị loại bỏ bởi coordinator.
- Đảm bảo việc thả phím push-to-talk luôn gọi `endCapture` với token hoạt động; nếu văn bản trống, mong đợi `dismiss` mà không có chime hoặc gửi.

## Các bước di chuyển (đề xuất)

1. Thêm `VoiceSessionCoordinator`, `VoiceSession`, và `VoiceSessionPublisher`.
2. Tái cấu trúc `VoiceWakeRuntime` để tạo/cập nhật/kết thúc các phiên thay vì can thiệp trực tiếp vào `VoiceWakeOverlayController`.
3. Tái cấu trúc `VoicePushToTalk` để nhận các phiên hiện có và gọi `endCapture` khi thả phím; áp dụng cooldown cho runtime.
4. Kết nối `VoiceWakeOverlayController` với publisher; loại bỏ các cuộc gọi trực tiếp từ runtime/PTT.
5. Thêm các bài kiểm tra tích hợp cho việc nhận phiên, cooldown, và bỏ qua văn bản trống.
