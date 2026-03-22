---
summary: "Giao diện web Gateway: UI điều khiển, chế độ bind, và bảo mật"
read_when:
  - Bạn muốn truy cập Gateway qua Tailscale
  - Bạn muốn sử dụng giao diện điều khiển trên trình duyệt và chỉnh sửa cấu hình
title: "Web"
---

# Web (Gateway)

Gateway cung cấp một **giao diện điều khiển trên trình duyệt** (Vite + Lit) từ cùng cổng với Gateway WebSocket:

- mặc định: `http://<host>:18789/`
- tiền tố tùy chọn: thiết lập `gateway.controlUi.basePath` (ví dụ: `/openclaw`)

Các khả năng có trong [Control UI](/web/control-ui).
Trang này tập trung vào chế độ bind, bảo mật và các bề mặt web.

## Webhooks

Khi `hooks.enabled=true`, Gateway cũng cung cấp một endpoint webhook nhỏ trên cùng máy chủ HTTP.
Xem [Cấu hình Gateway](/gateway/configuration) → `hooks` để biết thông tin xác thực và payloads.

## Cấu hình (mặc định bật)

Giao diện điều khiển **được bật mặc định** khi có tài sản (`dist/control-ui`).
Bạn có thể điều chỉnh qua cấu hình:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath tùy chọn
  },
}
```

## Truy cập Tailscale

### Serve tích hợp (khuyến nghị)

Giữ Gateway trên loopback và để Tailscale Serve proxy nó:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Sau đó khởi động gateway:

```bash
openclaw gateway
```

Mở:

- `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` bạn đã cấu hình)

### Bind Tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Sau đó khởi động gateway (cần token cho các bind không phải loopback):

```bash
openclaw gateway
```

Mở:

- `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` bạn đã cấu hình)

### Internet công cộng (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // hoặc OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Ghi chú bảo mật

- Xác thực Gateway là bắt buộc theo mặc định (token/mật khẩu hoặc Tailscale identity headers).
- Các bind không phải loopback vẫn **cần** một token/mật khẩu chia sẻ (`gateway.auth` hoặc môi trường).
- Wizard tạo token gateway theo mặc định (ngay cả trên loopback).
- UI gửi `connect.params.auth.token` hoặc `connect.params.auth.password`.
- Đối với các triển khai Control UI không phải loopback, thiết lập `gateway.controlUi.allowedOrigins`
  rõ ràng (đầy đủ nguồn gốc). Nếu không, khởi động gateway sẽ bị từ chối theo mặc định.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` kích hoạt
  chế độ fallback Host-header origin, nhưng là một hạ cấp bảo mật nguy hiểm.
- Với Serve, Tailscale identity headers có thể đáp ứng xác thực Control UI/WebSocket
  khi `gateway.auth.allowTailscale` là `true` (không cần token/mật khẩu).
  Các endpoint API HTTP vẫn yêu cầu token/mật khẩu. Thiết lập
  `gateway.auth.allowTailscale: false` để yêu cầu thông tin xác thực rõ ràng. Xem
  [Tailscale](/gateway/tailscale) và [Bảo mật](/gateway/security). Luồng không cần token này giả định máy chủ gateway được tin cậy.
- `gateway.tailscale.mode: "funnel"` yêu cầu `gateway.auth.mode: "password"` (mật khẩu chia sẻ).

## Xây dựng UI

Gateway phục vụ các file tĩnh từ `dist/control-ui`. Xây dựng chúng với:

```bash
pnpm ui:build # tự động cài đặt các phụ thuộc UI lần đầu chạy
```
