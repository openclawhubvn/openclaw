---
summary: "Tìm hiểu cách cấu hình bộ điều hợp RPC cho CLI bên ngoài và mẫu gateway, tối ưu hóa tích hợp hệ thống hiệu quả."
read_when:
  - Thêm hoặc thay đổi tích hợp CLI bên ngoài
  - Gỡ lỗi bộ điều hợp RPC (signal-cli, imsg)
title: "Hướng Dẫn Cấu Hình Bộ Điều Hợp RPC"
---

# Bộ điều hợp RPC

OpenClaw tích hợp các CLI bên ngoài thông qua JSON-RPC. Hiện tại có hai mẫu được sử dụng.

## Mẫu A: HTTP daemon (signal-cli)

- `signal-cli` chạy dưới dạng daemon với JSON-RPC qua HTTP.
- Dòng sự kiện là SSE (`/api/v1/events`).
- Kiểm tra sức khỏe: `/api/v1/check`.
- OpenClaw quản lý vòng đời khi `channels.signal.autoStart=true`.

Xem [Signal](/channels/signal) để biết cách thiết lập và các điểm cuối.

## Mẫu B: Tiến trình con stdio (cũ: imsg)

> **Lưu ý:** Đối với các thiết lập iMessage mới, sử dụng [BlueBubbles](/channels/bluebubbles) thay thế.

- OpenClaw khởi chạy `imsg rpc` dưới dạng tiến trình con (tích hợp iMessage cũ).
- JSON-RPC được phân tách theo dòng qua stdin/stdout (một đối tượng JSON mỗi dòng).
- Không cần cổng TCP, không cần daemon.

Các phương thức cốt lõi được sử dụng:

- `watch.subscribe` → thông báo (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (kiểm tra/chẩn đoán)

Xem [iMessage](/channels/imessage) để biết cách thiết lập cũ và địa chỉ (`chat_id` được ưu tiên).

## Hướng dẫn sử dụng bộ điều hợp

- Gateway quản lý tiến trình (bắt đầu/dừng gắn liền với vòng đời của nhà cung cấp).
- Giữ cho các client RPC bền bỉ: timeout, khởi động lại khi thoát.
- Ưu tiên sử dụng ID ổn định (ví dụ: `chat_id`) thay vì chuỗi hiển thị.
