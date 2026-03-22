---
summary: "Từ khóa đánh thức giọng nói toàn cầu (do Gateway quản lý) và cách đồng bộ trên các node"
read_when:
  - Thay đổi hành vi hoặc mặc định của từ khóa đánh thức giọng nói
  - Thêm nền tảng node mới cần đồng bộ từ khóa đánh thức
title: "Voice Wake"
---

# Voice Wake (Từ Khóa Đánh Thức Toàn Cầu)

OpenClaw quản lý **từ khóa đánh thức như một danh sách toàn cầu** do **Gateway** sở hữu.

- **Không có từ khóa đánh thức tùy chỉnh cho từng node**.
- **Bất kỳ node/app UI nào cũng có thể chỉnh sửa** danh sách; thay đổi được Gateway lưu và phát tới tất cả.
- macOS và iOS giữ tùy chọn bật/tắt **Voice Wake cục bộ** (UX + quyền khác nhau).
- Android hiện tắt Voice Wake và dùng mic thủ công trong tab Voice.

## Lưu trữ (Gateway host)

Từ khóa đánh thức được lưu trên máy gateway tại:

- `~/.openclaw/settings/voicewake.json`

Cấu trúc:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Giao thức

### Phương thức

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` với tham số `{ triggers: string[] }` → `{ triggers: string[] }`

Ghi chú:

- Triggers được chuẩn hóa (cắt gọn, loại bỏ rỗng). Danh sách rỗng sẽ quay về mặc định.
- Giới hạn được áp dụng để đảm bảo an toàn (giới hạn số lượng/độ dài).

### Sự kiện

- `voicewake.changed` payload `{ triggers: string[] }`

Ai nhận:

- Tất cả client WebSocket (app macOS, WebChat, v.v.)
- Tất cả node kết nối (iOS/Android), và cũng khi node kết nối như một đẩy trạng thái “hiện tại” ban đầu.

## Hành vi client

### App macOS

- Sử dụng danh sách toàn cầu để kiểm soát triggers `VoiceWakeRuntime`.
- Chỉnh sửa “Trigger words” trong cài đặt Voice Wake gọi `voicewake.set` và dựa vào phát sóng để giữ đồng bộ với các client khác.

### Node iOS

- Sử dụng danh sách toàn cầu cho phát hiện trigger `VoiceWakeManager`.
- Chỉnh sửa Wake Words trong Settings gọi `voicewake.set` (qua Gateway WS) và cũng giữ phát hiện từ khóa đánh thức cục bộ nhạy bén.

### Node Android

- Voice Wake hiện bị tắt trong runtime/Settings của Android.
- Giọng nói Android dùng mic thủ công trong tab Voice thay vì triggers từ khóa đánh thức.\n