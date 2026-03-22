---
summary: "Tham khảo CLI cho `openclaw node` (máy chủ node không giao diện)"
read_when:
  - Chạy máy chủ node không giao diện
  - Ghép nối một node không phải macOS cho system.run
title: "node"
---

# `openclaw node`

Chạy một **máy chủ node không giao diện** kết nối với Gateway WebSocket và cung cấp
`system.run` / `system.which` trên máy này.

## Tại sao sử dụng máy chủ node?

Sử dụng máy chủ node khi cần các agent **chạy lệnh trên các máy khác** trong mạng mà không cần cài đặt ứng dụng đồng hành đầy đủ trên macOS.

Các trường hợp sử dụng phổ biến:

- Chạy lệnh trên các máy Linux/Windows từ xa (máy chủ build, máy trong phòng thí nghiệm, NAS).
- Giữ việc thực thi **trong sandbox** trên gateway, nhưng ủy quyền các lần chạy đã được phê duyệt cho các máy chủ khác.
- Cung cấp mục tiêu thực thi nhẹ, không giao diện cho tự động hóa hoặc các node CI.

Việc thực thi vẫn được bảo vệ bởi **phê duyệt thực thi** và danh sách cho phép theo từng agent trên máy chủ node, giúp kiểm soát và rõ ràng quyền truy cập lệnh.

## Proxy trình duyệt (không cần cấu hình)

Máy chủ node tự động quảng cáo một proxy trình duyệt nếu `browser.enabled` không bị vô hiệu hóa trên node. Điều này cho phép agent sử dụng tự động hóa trình duyệt trên node đó mà không cần cấu hình thêm.

Vô hiệu hóa trên node nếu cần:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Chạy (chế độ nền trước)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Tùy chọn:

- `--host <host>`: Máy chủ Gateway WebSocket (mặc định: `127.0.0.1`)
- `--port <port>`: Cổng Gateway WebSocket (mặc định: `18789`)
- `--tls`: Sử dụng TLS cho kết nối gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS mong đợi (sha256)
- `--node-id <id>`: Ghi đè id node (xóa token ghép nối)
- `--display-name <name>`: Ghi đè tên hiển thị của node

## Xác thực Gateway cho máy chủ node

`openclaw node run` và `openclaw node install` giải quyết xác thực gateway từ cấu hình/môi trường (không có cờ `--token`/`--password` trên lệnh node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` được kiểm tra trước.
- Sau đó là cấu hình cục bộ dự phòng: `gateway.auth.token` / `gateway.auth.password`.
- Ở chế độ cục bộ, máy chủ node không kế thừa `gateway.remote.token` / `gateway.remote.password`.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef và không giải quyết được, xác thực node sẽ thất bại (không có dự phòng từ xa).
- Ở `gateway.mode=remote`, các trường khách hàng từ xa (`gateway.remote.token` / `gateway.remote.password`) cũng đủ điều kiện theo quy tắc ưu tiên từ xa.
- Các biến môi trường `CLAWDBOT_GATEWAY_*` cũ bị bỏ qua cho việc giải quyết xác thực máy chủ node.

## Dịch vụ (chạy nền)

Cài đặt một máy chủ node không giao diện như một dịch vụ người dùng.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Tùy chọn:

- `--host <host>`: Máy chủ Gateway WebSocket (mặc định: `127.0.0.1`)
- `--port <port>`: Cổng Gateway WebSocket (mặc định: `18789`)
- `--tls`: Sử dụng TLS cho kết nối gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS mong đợi (sha256)
- `--node-id <id>`: Ghi đè id node (xóa token ghép nối)
- `--display-name <name>`: Ghi đè tên hiển thị của node
- `--runtime <runtime>`: Thời gian chạy dịch vụ (`node` hoặc `bun`)
- `--force`: Cài đặt lại/ghi đè nếu đã cài đặt

Quản lý dịch vụ:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Sử dụng `openclaw node run` cho máy chủ node nền trước (không phải dịch vụ).

Các lệnh dịch vụ chấp nhận `--json` để xuất đầu ra có thể đọc được bằng máy.

## Ghép nối

Kết nối đầu tiên tạo ra một yêu cầu ghép nối thiết bị đang chờ (`role: node`) trên Gateway.
Phê duyệt qua:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Nếu node thử lại ghép nối với thông tin xác thực thay đổi (vai trò/phạm vi/khóa công khai),
yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo.
Chạy `openclaw devices list` lại trước khi phê duyệt.

Máy chủ node lưu trữ id node, token, tên hiển thị và thông tin kết nối gateway trong
`~/.openclaw/node.json`.

## Phê duyệt thực thi

`system.run` được kiểm soát bởi phê duyệt thực thi cục bộ:

- `~/.openclaw/exec-approvals.json`
- [Phê duyệt thực thi](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (chỉnh sửa từ Gateway)
