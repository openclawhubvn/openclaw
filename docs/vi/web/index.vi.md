---
summary: "Giao diện web Gateway: UI điều khiển, chế độ bind, và bảo mật"
read_when:
  - Muốn truy cập Gateway qua Tailscale
  - Muốn dùng trình duyệt để điều khiển UI và chỉnh cấu hình
title: "Web"
---

# Web (Gateway)

Gateway cung cấp một **UI điều khiển qua trình duyệt** (Vite + Lit) từ cùng cổng với Gateway WebSocket:

- mặc định: `http://<host>:18789/`
- prefix tùy chọn: cấu hình `gateway.controlUi.basePath` (ví dụ: `/openclaw`)

Khả năng của [Control UI](/web/control-ui).
Trang này tập trung vào chế độ bind, bảo mật, và giao diện web.

## Webhooks

Khi `hooks.enabled=true`, Gateway cũng mở một endpoint webhook nhỏ trên cùng server HTTP.
Xem [Cấu hình Gateway](/gateway/configuration) → `hooks` để biết thêm về auth + payloads.

## Cấu hình (mặc định bật)

Control UI **bật mặc định** khi có assets (`dist/control-ui`).
Có thể điều chỉnh qua cấu hình:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath tùy chọn
  },
}
```

## Truy cập Tailscale

### Serve tích hợp (khuyến nghị)

Giữ Gateway trên loopback và để Tailscale Serve proxy:

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

- `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình)

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

Sau đó khởi động gateway (cần token cho bind không phải loopback):

```bash
openclaw gateway
```

Mở:

- `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` đã cấu hình)

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

- Mặc định yêu cầu auth cho Gateway (token/password hoặc Tailscale identity headers).
- Bind không phải loopback vẫn **cần** token/password chia sẻ (`gateway.auth` hoặc env).
- Wizard tạo token gateway mặc định (ngay cả trên loopback).
- UI gửi `connect.params.auth.token` hoặc `connect.params.auth.password`.
- Với Control UI không phải loopback, cần đặt `gateway.controlUi.allowedOrigins`
  rõ ràng (đầy đủ origins). Nếu không, gateway sẽ từ chối khởi động.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` kích hoạt
  chế độ fallback Host-header origin, nhưng là hạ cấp bảo mật nguy hiểm.
- Với Serve, Tailscale identity headers có thể thỏa mãn auth cho Control UI/WebSocket
  khi `gateway.auth.allowTailscale` là `true` (không cần token/password).
  Endpoint HTTP API vẫn cần token/password. Đặt
  `gateway.auth.allowTailscale: false` để yêu cầu thông tin xác thực rõ ràng. Xem
  [Tailscale](/gateway/tailscale) và [Bảo mật](/gateway/security). Luồng không token này giả định host gateway được tin cậy.
- `gateway.tailscale.mode: "funnel"` yêu cầu `gateway.auth.mode: "password"` (password chia sẻ).

## Xây dựng UI

Gateway phục vụ file tĩnh từ `dist/control-ui`. Xây dựng với:

```bash
pnpm ui:build # tự động cài đặt UI deps lần đầu chạy
```\n