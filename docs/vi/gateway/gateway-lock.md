---
summary: "Cơ chế bảo vệ đơn nhất cho Gateway bằng cách sử dụng WebSocket listener bind"
read_when:
  - Khi chạy hoặc gỡ lỗi quá trình gateway
  - Khi điều tra việc thực thi đơn nhất
title: "Khóa Gateway"
---

# Khóa Gateway

Cập nhật lần cuối: 2025-12-11

## Tại sao

- Đảm bảo chỉ có một instance gateway chạy trên mỗi cổng cơ bản trên cùng một máy chủ; các gateway bổ sung phải sử dụng hồ sơ riêng biệt và cổng duy nhất.
- Khả năng phục hồi sau sự cố/SIGKILL mà không để lại file khóa cũ.
- Nhanh chóng báo lỗi rõ ràng khi cổng điều khiển đã bị chiếm dụng.

## Cơ chế

- Gateway gắn WebSocket listener (mặc định `ws://127.0.0.1:18789`) ngay khi khởi động bằng cách sử dụng một TCP listener độc quyền.
- Nếu việc gắn kết thất bại với `EADDRINUSE`, quá trình khởi động sẽ ném ra lỗi `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Hệ điều hành tự động giải phóng listener khi bất kỳ quá trình nào kết thúc, bao gồm cả sự cố và SIGKILL—không cần file khóa riêng hoặc bước dọn dẹp.
- Khi tắt, gateway đóng máy chủ WebSocket và máy chủ HTTP cơ bản để giải phóng cổng ngay lập tức.

## Bề mặt lỗi

- Nếu một quá trình khác giữ cổng, quá trình khởi động sẽ ném ra lỗi `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Các lỗi gắn kết khác sẽ xuất hiện dưới dạng `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Ghi chú vận hành

- Nếu cổng bị chiếm bởi một quá trình _khác_, lỗi sẽ giống nhau; giải phóng cổng hoặc chọn cổng khác với `openclaw gateway --port <port>`.
- Ứng dụng macOS vẫn duy trì một cơ chế bảo vệ PID nhẹ trước khi khởi chạy gateway; khóa runtime được thực thi bởi WebSocket bind.
