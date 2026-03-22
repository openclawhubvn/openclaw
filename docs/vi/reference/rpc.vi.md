# RPC adapters

OpenClaw tích hợp các CLI bên ngoài qua JSON-RPC. Hiện có hai mô hình được sử dụng.

## Mô hình A: HTTP daemon (signal-cli)

- `signal-cli` chạy dưới dạng daemon với JSON-RPC qua HTTP.
- Stream sự kiện là SSE (`/api/v1/events`).
- Kiểm tra sức khỏe: `/api/v1/check`.
- OpenClaw quản lý vòng đời khi `channels.signal.autoStart=true`.

Xem [Signal](/channels/signal) để biết cách thiết lập và các endpoint.

## Mô hình B: stdio child process (legacy: imsg)

> **Lưu ý:** Với các thiết lập iMessage mới, dùng [BlueBubbles](/channels/bluebubbles).

- OpenClaw khởi chạy `imsg rpc` như một child process (tích hợp iMessage cũ).
- JSON-RPC được phân tách dòng qua stdin/stdout (mỗi đối tượng JSON trên một dòng).
- Không cần cổng TCP, không cần daemon.

Các phương thức chính:

- `watch.subscribe` → thông báo (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (kiểm tra/chẩn đoán)

Xem [iMessage](/channels/imessage) để biết cách thiết lập cũ và địa chỉ (`chat_id` được ưu tiên).

## Hướng dẫn sử dụng Adapter

- Gateway quản lý tiến trình (bắt đầu/dừng gắn với vòng đời provider).
- Giữ cho RPC client ổn định: timeout, khởi động lại khi thoát.
- Ưu tiên dùng ID ổn định (ví dụ: `chat_id`) thay vì chuỗi hiển thị.\n