---
summary: "Sử dụng Loopback WebChat làm host tĩnh và Gateway WS cho giao diện chat"
read_when:
  - Gặp sự cố hoặc cấu hình truy cập WebChat
title: "WebChat"
---

# WebChat (Giao diện WebSocket của Gateway)

Trạng thái: Giao diện chat SwiftUI trên macOS/iOS kết nối trực tiếp với Gateway WebSocket.

## Giới thiệu

- Giao diện chat gốc cho gateway (không cần trình duyệt nhúng và không cần server tĩnh cục bộ).
- Sử dụng cùng phiên và quy tắc định tuyến như các kênh khác.
- Định tuyến xác định: phản hồi luôn quay lại WebChat.

## Bắt đầu nhanh

1. Khởi động gateway.
2. Mở giao diện WebChat (ứng dụng macOS/iOS) hoặc tab chat trong Control UI.
3. Đảm bảo cấu hình xác thực gateway (mặc định yêu cầu, ngay cả khi loopback).

## Cách hoạt động (hành vi)

- Giao diện kết nối với Gateway WebSocket và sử dụng `chat.history`, `chat.send`, và `chat.inject`.
- `chat.history` được giới hạn để đảm bảo ổn định: Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua metadata nặng, và thay thế các mục quá lớn bằng `[chat.history omitted: message too large]`.
- `chat.inject` thêm ghi chú trợ lý trực tiếp vào bản ghi và phát tới giao diện (không cần chạy agent).
- Các lần chạy bị hủy có thể giữ lại một phần đầu ra của trợ lý hiển thị trên giao diện.
- Gateway lưu trữ văn bản trợ lý bị hủy vào lịch sử bản ghi khi có đầu ra được đệm, và đánh dấu các mục đó với metadata hủy.
- Lịch sử luôn được lấy từ gateway (không theo dõi file cục bộ).
- Nếu gateway không thể truy cập, WebChat chỉ có thể đọc.

## Bảng công cụ của Control UI agents

- Bảng Công cụ `/agents` của Control UI lấy danh mục runtime qua `tools.catalog` và gắn nhãn mỗi công cụ là `core` hoặc `plugin:<id>` (cộng thêm `optional` cho các công cụ plugin tùy chọn).
- Nếu `tools.catalog` không khả dụng, bảng sẽ sử dụng danh sách tĩnh tích hợp sẵn.
- Bảng chỉnh sửa cấu hình profile và override, nhưng quyền truy cập runtime hiệu quả vẫn tuân theo thứ tự ưu tiên chính sách (`allow`/`deny`, theo từng agent và override của provider/kênh).

## Sử dụng từ xa

- Chế độ từ xa tạo đường hầm cho Gateway WebSocket qua SSH/Tailscale.
- Không cần chạy server WebChat riêng biệt.

## Tham khảo cấu hình (WebChat)

Cấu hình đầy đủ: [Configuration](/gateway/configuration)

Tùy chọn kênh:

- Không có khối `webchat.*` riêng biệt. WebChat sử dụng endpoint của gateway + cài đặt xác thực dưới đây.

Các tùy chọn toàn cầu liên quan:

- `gateway.port`, `gateway.bind`: host/port của WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`: xác thực WebSocket (token/mật khẩu).
- `gateway.auth.mode: "trusted-proxy"`: xác thực reverse-proxy cho trình duyệt (xem [Trusted Proxy Auth](/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: mục tiêu gateway từ xa.
- `session.*`: lưu trữ phiên và các khóa chính mặc định.
