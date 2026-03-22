# `openclaw qr`

Tạo QR code và setup code để pair iOS app với Gateway từ cấu hình hiện tại.

## Cách dùng

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Tùy chọn

- `--remote`: dùng `gateway.remote.url` cùng token/password từ config
- `--url <url>`: ghi đè URL Gateway trong payload
- `--public-url <url>`: ghi đè URL công khai trong payload
- `--token <token>`: ghi đè token Gateway để xác thực trong bootstrap flow
- `--password <password>`: ghi đè password Gateway để xác thực trong bootstrap flow
- `--setup-code-only`: chỉ in setup code
- `--no-ascii`: bỏ qua render QR dưới dạng ASCII
- `--json`: xuất JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Lưu ý

- `--token` và `--password` không dùng chung được.
- Setup code mang `bootstrapToken` ngắn hạn, không phải token/password Gateway chia sẻ.
- Với `--remote`, nếu đã cấu hình remote credentials dưới dạng SecretRefs và không truyền `--token` hay `--password`, lệnh sẽ lấy từ snapshot Gateway hiện tại. Nếu Gateway không sẵn sàng, lệnh sẽ fail ngay.
- Không dùng `--remote`, SecretRefs auth Gateway local được giải quyết khi không có CLI auth override:
  - `gateway.auth.token` được giải quyết khi token auth thắng (cài `gateway.auth.mode="token"` hoặc suy luận khi không có nguồn password thắng).
  - `gateway.auth.password` được giải quyết khi password auth thắng (cài `gateway.auth.mode="password"` hoặc suy luận khi không có token thắng từ auth/env).
- Nếu cả `gateway.auth.token` và `gateway.auth.password` được cấu hình (bao gồm SecretRefs) và `gateway.auth.mode` chưa cài, setup-code sẽ không giải quyết được cho đến khi mode được cài rõ ràng.
- Lưu ý phiên bản Gateway: lệnh này yêu cầu Gateway hỗ trợ `secrets.resolve`; Gateway cũ hơn sẽ trả lỗi unknown-method.
- Sau khi quét, duyệt pair thiết bị với:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`\n