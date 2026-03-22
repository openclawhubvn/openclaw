---
summary: "Tham khảo CLI cho `openclaw qr` (tạo mã QR ghép nối iOS + mã thiết lập)"
read_when:
  - Bạn muốn ghép nối ứng dụng iOS với gateway nhanh chóng
  - Bạn cần xuất mã thiết lập để chia sẻ từ xa/thủ công
title: "qr"
---

# `openclaw qr`

Tạo mã QR ghép nối iOS và mã thiết lập từ cấu hình Gateway hiện tại.

## Cách sử dụng

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Tùy chọn

- `--remote`: sử dụng `gateway.remote.url` cùng với token/mật khẩu từ cấu hình
- `--url <url>`: ghi đè URL gateway được sử dụng trong payload
- `--public-url <url>`: ghi đè URL công khai được sử dụng trong payload
- `--token <token>`: ghi đè token gateway mà luồng khởi động xác thực
- `--password <password>`: ghi đè mật khẩu gateway mà luồng khởi động xác thực
- `--setup-code-only`: chỉ in mã thiết lập
- `--no-ascii`: bỏ qua việc hiển thị mã QR dưới dạng ASCII
- `--json`: xuất JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Lưu ý

- `--token` và `--password` không thể sử dụng cùng lúc.
- Mã thiết lập hiện mang một `bootstrapToken` ngắn hạn, không phải token/mật khẩu gateway chia sẻ.
- Với `--remote`, nếu thông tin đăng nhập từ xa được cấu hình dưới dạng SecretRefs và bạn không truyền `--token` hoặc `--password`, lệnh sẽ lấy từ ảnh chụp gateway hiện tại. Nếu gateway không khả dụng, lệnh sẽ thất bại ngay lập tức.
- Không sử dụng `--remote`, SecretRefs xác thực gateway cục bộ được giải quyết khi không có ghi đè xác thực CLI:
  - `gateway.auth.token` được giải quyết khi xác thực token có thể thắng (chế độ `gateway.auth.mode="token"` rõ ràng hoặc chế độ suy diễn khi không có nguồn mật khẩu thắng).
  - `gateway.auth.password` được giải quyết khi xác thực mật khẩu có thể thắng (chế độ `gateway.auth.mode="password"` rõ ràng hoặc chế độ suy diễn không có token thắng từ xác thực/môi trường).
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình (bao gồm SecretRefs) và `gateway.auth.mode` chưa được đặt, việc giải quyết mã thiết lập sẽ thất bại cho đến khi chế độ được đặt rõ ràng.
- Lưu ý về phiên bản gateway: đường dẫn lệnh này yêu cầu một gateway hỗ trợ `secrets.resolve`; các gateway cũ hơn sẽ trả về lỗi phương thức không xác định.
- Sau khi quét, phê duyệt ghép nối thiết bị với:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
