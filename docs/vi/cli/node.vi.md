# `openclaw node`

Chạy **headless node host** kết nối với Gateway WebSocket và cung cấp `system.run` / `system.which` trên máy này.

## Tại sao cần node host?

Dùng node host khi cần agent **chạy lệnh trên máy khác** trong mạng mà không cần cài app macOS đầy đủ.

Trường hợp hay gặp:

- Chạy lệnh trên máy Linux/Windows từ xa (server build, máy lab, NAS).
- Giữ exec **sandboxed** trên gateway, nhưng ủy quyền chạy lệnh cho host khác.
- Cung cấp mục tiêu chạy nhẹ, không giao diện cho automation hoặc CI node.

Exec vẫn được bảo vệ bởi **exec approvals** và danh sách cho phép từng agent trên node host, giúp kiểm soát quyền truy cập lệnh rõ ràng.

## Browser proxy (zero-config)

Node host tự động quảng cáo browser proxy nếu `browser.enabled` không bị tắt trên node. Điều này cho phép agent dùng browser automation trên node mà không cần cấu hình thêm.

Tắt nếu cần:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Chạy (foreground)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Tùy chọn:

- `--host <host>`: Gateway WebSocket host (mặc định: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket port (mặc định: `18789`)
- `--tls`: Dùng TLS cho kết nối gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS mong đợi (sha256)
- `--node-id <id>`: Ghi đè node id (xóa token ghép đôi)
- `--display-name <name>`: Ghi đè tên hiển thị của node

## Gateway auth cho node host

`openclaw node run` và `openclaw node install` lấy thông tin auth từ config/env (không dùng `--token`/`--password` trên lệnh node):

- Kiểm tra `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` trước.
- Sau đó dùng config local: `gateway.auth.token` / `gateway.auth.password`.
- Ở chế độ local, node host không thừa kế `gateway.remote.token` / `gateway.remote.password`.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình qua SecretRef và không giải quyết được, auth node sẽ thất bại (không có fallback từ xa).
- Ở `gateway.mode=remote`, các trường client từ xa (`gateway.remote.token` / `gateway.remote.password`) cũng được xét theo quy tắc ưu tiên từ xa.
- Biến môi trường cũ `CLAWDBOT_GATEWAY_*` bị bỏ qua cho auth node host.

## Service (background)

Cài đặt headless node host như một user service.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Tùy chọn:

- `--host <host>`: Gateway WebSocket host (mặc định: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket port (mặc định: `18789`)
- `--tls`: Dùng TLS cho kết nối gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS mong đợi (sha256)
- `--node-id <id>`: Ghi đè node id (xóa token ghép đôi)
- `--display-name <name>`: Ghi đè tên hiển thị của node
- `--runtime <runtime>`: Service runtime (`node` hoặc `bun`)
- `--force`: Cài lại/ghi đè nếu đã cài

Quản lý service:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Dùng `openclaw node run` cho node host foreground (không service).

Lệnh service chấp nhận `--json` để xuất kết quả dạng máy đọc được.

## Pairing

Kết nối đầu tiên tạo yêu cầu ghép đôi thiết bị chờ xử lý (`role: node`) trên Gateway. Duyệt qua:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Nếu node thử ghép đôi lại với thông tin auth thay đổi (role/scopes/public key), yêu cầu chờ trước đó bị thay thế và tạo `requestId` mới. Chạy `openclaw devices list` lại trước khi duyệt.

Node host lưu trữ node id, token, tên hiển thị và thông tin kết nối gateway trong `~/.openclaw/node.json`.

## Exec approvals

`system.run` được kiểm soát bởi exec approvals local:

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (chỉnh sửa từ Gateway)\n