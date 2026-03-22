---
summary: "Cơ chế bảo vệ singleton cho Gateway bằng WebSocket listener bind"
read_when:
  - Chạy hoặc debug quá trình gateway
  - Điều tra việc đảm bảo chỉ chạy một instance
title: "Khóa Gateway"
---

# Khóa Gateway

Cập nhật lần cuối: 2025-12-11

## Tại sao

- Đảm bảo chỉ một instance gateway chạy trên mỗi base port trên cùng host; các gateway khác phải dùng profile riêng và port khác.
- Tồn tại sau khi crash/SIGKILL mà không để lại file khóa cũ.
- Báo lỗi nhanh và rõ ràng khi port điều khiển đã bị chiếm.

## Cơ chế

- Gateway bind WebSocket listener (mặc định `ws://127.0.0.1:18789`) ngay khi khởi động bằng TCP listener độc quyền.
- Nếu bind thất bại với `EADDRINUSE`, khởi động ném `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Hệ điều hành tự động giải phóng listener khi bất kỳ process nào thoát, kể cả crash và SIGKILL—không cần file khóa riêng hay bước dọn dẹp.
- Khi tắt, gateway đóng WebSocket server và HTTP server để giải phóng port ngay lập tức.

## Bề mặt lỗi

- Nếu process khác giữ port, khởi động ném `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Các lỗi bind khác hiện ra dưới dạng `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Ghi chú vận hành

- Nếu port bị chiếm bởi process _khác_, lỗi vẫn như cũ; giải phóng port hoặc chọn port khác với `openclaw gateway --port <port>`.
- Ứng dụng macOS vẫn duy trì PID guard nhẹ trước khi spawn gateway; khóa runtime được thực thi qua WebSocket bind.\n