---
summary: "Hướng dẫn sử dụng WebChat với Gateway WebSocket cho giao diện chat"
read_when:
  - Debug hoặc cấu hình truy cập WebChat
title: "WebChat"
---

# WebChat (Giao diện WebSocket của Gateway)

Trạng thái: Giao diện chat SwiftUI trên macOS/iOS kết nối trực tiếp với Gateway WebSocket.

## Giới thiệu

- Giao diện chat native cho gateway (không dùng trình duyệt nhúng, không cần server tĩnh local).
- Sử dụng session và quy tắc routing giống các kênh khác.
- Routing xác định: phản hồi luôn quay lại WebChat.

## Bắt đầu nhanh

1. Khởi động gateway.
2. Mở giao diện WebChat (ứng dụng macOS/iOS) hoặc tab chat trong Control UI.
3. Đảm bảo cấu hình xác thực gateway (mặc định yêu cầu, kể cả khi loopback).

## Cách hoạt động

- UI kết nối với Gateway WebSocket và sử dụng `chat.history`, `chat.send`, và `chat.inject`.
- `chat.history` có giới hạn để ổn định: Gateway có thể cắt ngắn trường văn bản dài, bỏ qua metadata nặng, và thay thế các mục quá lớn bằng `[chat.history omitted: message too large]`.
- `chat.inject` thêm ghi chú trợ lý trực tiếp vào transcript và phát tới UI (không chạy agent).
- Các lần chạy bị hủy có thể giữ lại một phần output trợ lý trên UI.
- Gateway lưu lại văn bản trợ lý bị hủy vào lịch sử transcript khi có output đệm, và đánh dấu các mục đó với metadata hủy.
- Lịch sử luôn được lấy từ gateway (không theo dõi file local).
- Nếu gateway không thể truy cập, WebChat chỉ đọc.

## Bảng công cụ Control UI agents

- Bảng Tools trong Control UI `/agents` lấy catalog runtime qua `tools.catalog` và gắn nhãn mỗi công cụ là `core` hoặc `plugin:<id>` (thêm `optional` cho công cụ plugin tùy chọn).
- Nếu `tools.catalog` không khả dụng, bảng sẽ dùng danh sách tĩnh tích hợp sẵn.
- Bảng chỉnh sửa cấu hình profile và override, nhưng quyền truy cập runtime thực tế vẫn theo thứ tự ưu tiên chính sách (`allow`/`deny`, override theo agent và provider/channel).

## Sử dụng từ xa

- Chế độ từ xa tunnel Gateway WebSocket qua SSH/Tailscale.
- Không cần chạy server WebChat riêng.

## Tham khảo cấu hình (WebChat)

Cấu hình đầy đủ: [Configuration](/gateway/configuration)

Tùy chọn Channel:

- Không có block `webchat.*` riêng. WebChat sử dụng endpoint gateway + cấu hình auth dưới đây.

Tùy chọn global liên quan:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`: xác thực WebSocket (token/password).
- `gateway.auth.mode: "trusted-proxy"`: xác thực reverse-proxy cho client trình duyệt (xem [Trusted Proxy Auth](/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: mục tiêu gateway từ xa.
- `session.*`: lưu trữ session và key mặc định chính.\n