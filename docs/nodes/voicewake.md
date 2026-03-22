---
summary: "Khám phá cách cấu hình từ khóa đánh thức giọng nói toàn cầu và đồng bộ hóa trên các node dễ dàng."
read_when:
  - Thay đổi hành vi hoặc mặc định của từ khóa đánh thức giọng nói
  - Thêm nền tảng node mới cần đồng bộ từ khóa đánh thức
title: "Hướng Dẫn Cấu Hình Đánh Thức Giọng Nói"
---

# Đánh Thức Giọng Nói (Từ Khóa Đánh Thức Toàn Cầu)

OpenClaw coi **từ khóa đánh thức là một danh sách toàn cầu duy nhất** do **Gateway** quản lý.

- **Không có từ khóa đánh thức tùy chỉnh cho từng node**.
- **Bất kỳ node hoặc giao diện ứng dụng nào cũng có thể chỉnh sửa** danh sách này; các thay đổi được Gateway lưu trữ và phát sóng đến tất cả mọi người.
- macOS và iOS giữ các công tắc **bật/tắt Đánh Thức Giọng Nói** cục bộ (UX cục bộ + quyền khác nhau).
- Android hiện giữ Đánh Thức Giọng Nói tắt và sử dụng luồng mic thủ công trong tab Giọng Nói.

## Lưu trữ (máy chủ Gateway)

Từ khóa đánh thức được lưu trữ trên máy Gateway tại:

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

- Các từ khóa được chuẩn hóa (cắt bỏ khoảng trắng, loại bỏ mục rỗng). Danh sách rỗng sẽ quay về mặc định.
- Giới hạn được áp dụng để đảm bảo an toàn (giới hạn số lượng/độ dài).

### Sự kiện

- `voicewake.changed` payload `{ triggers: string[] }`

Ai nhận được:

- Tất cả các client WebSocket (ứng dụng macOS, WebChat, v.v.)
- Tất cả các node kết nối (iOS/Android), và cũng khi node kết nối như một đẩy trạng thái "hiện tại" ban đầu.

## Hành vi của client

### Ứng dụng macOS

- Sử dụng danh sách toàn cầu để kiểm soát các từ khóa trong `VoiceWakeRuntime`.
- Chỉnh sửa “Từ khóa kích hoạt” trong cài đặt Đánh Thức Giọng Nói sẽ gọi `voicewake.set` và sau đó dựa vào phát sóng để giữ các client khác đồng bộ.

### Node iOS

- Sử dụng danh sách toàn cầu cho việc phát hiện từ khóa trong `VoiceWakeManager`.
- Chỉnh sửa Từ Khóa Đánh Thức trong Cài đặt sẽ gọi `voicewake.set` (qua Gateway WS) và cũng giữ cho việc phát hiện từ khóa cục bộ nhạy bén.

### Node Android

- Đánh Thức Giọng Nói hiện đang bị vô hiệu hóa trong runtime/Cài đặt Android.
- Giọng nói trên Android sử dụng ghi âm mic thủ công trong tab Giọng Nói thay vì các từ khóa đánh thức.
