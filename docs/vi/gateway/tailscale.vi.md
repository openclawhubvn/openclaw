---
summary: "Tích hợp Tailscale Serve/Funnel cho Gateway dashboard"
read_when:
  - Exposing the Gateway Control UI outside localhost
  - Automating tailnet or public dashboard access
title: "Tailscale"
---

# Tailscale (Gateway dashboard)

OpenClaw có thể tự động cấu hình Tailscale **Serve** (tailnet) hoặc **Funnel** (public) cho Gateway dashboard và cổng WebSocket. Điều này giúp Gateway chỉ cần bind vào loopback trong khi Tailscale cung cấp HTTPS, routing và (với Serve) identity headers.

## Chế độ

- `serve`: Chỉ Tailnet Serve qua `tailscale serve`. Gateway giữ nguyên `127.0.0.1`.
- `funnel`: Public HTTPS qua `tailscale funnel`. OpenClaw yêu cầu mật khẩu chia sẻ.
- `off`: Mặc định (không tự động hóa Tailscale).

## Xác thực

Cài `gateway.auth.mode` để điều khiển handshake:

- `token` (mặc định khi `OPENCLAW_GATEWAY_TOKEN` được thiết lập)
- `password` (mật khẩu chia sẻ qua `OPENCLAW_GATEWAY_PASSWORD` hoặc config)

Khi `tailscale.mode = "serve"` và `gateway.auth.allowTailscale` là `true`, Control UI/WebSocket auth có thể dùng Tailscale identity headers (`tailscale-user-login`) mà không cần token/mật khẩu. OpenClaw xác minh danh tính bằng cách giải quyết địa chỉ `x-forwarded-for` qua daemon Tailscale local (`tailscale whois`) và đối chiếu với header trước khi chấp nhận. OpenClaw chỉ coi yêu cầu là Serve khi nó đến từ loopback với các headers `x-forwarded-for`, `x-forwarded-proto`, và `x-forwarded-host` của Tailscale. Các endpoint API HTTP (ví dụ `/v1/*`, `/tools/invoke`, và `/api/channels/*`) vẫn yêu cầu xác thực token/mật khẩu. Luồng không cần token này giả định host gateway là đáng tin cậy. Nếu có thể chạy mã local không tin cậy trên cùng host, tắt `gateway.auth.allowTailscale` và yêu cầu xác thực token/mật khẩu. Để yêu cầu thông tin xác thực rõ ràng, đặt `gateway.auth.allowTailscale: false` hoặc buộc `gateway.auth.mode: "password"`.

## Ví dụ cấu hình

### Chỉ Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Mở: `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình)

### Chỉ Tailnet (bind vào IP Tailnet)

Dùng khi muốn Gateway lắng nghe trực tiếp trên IP Tailnet (không Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Kết nối từ thiết bị Tailnet khác:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Lưu ý: loopback (`http://127.0.0.1:18789`) sẽ **không** hoạt động trong chế độ này.

### Internet công cộng (Funnel + mật khẩu chia sẻ)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Ưu tiên `OPENCLAW_GATEWAY_PASSWORD` thay vì lưu mật khẩu vào ổ đĩa.

## Ví dụ CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Lưu ý

- Tailscale Serve/Funnel yêu cầu cài đặt và đăng nhập CLI `tailscale`.
- `tailscale.mode: "funnel"` từ chối khởi động trừ khi chế độ xác thực là `password` để tránh lộ công khai.
- Đặt `gateway.tailscale.resetOnExit` nếu muốn OpenClaw hoàn tác cấu hình `tailscale serve` hoặc `tailscale funnel` khi tắt.
- `gateway.bind: "tailnet"` là bind trực tiếp Tailnet (không HTTPS, không Serve/Funnel).
- `gateway.bind: "auto"` ưu tiên loopback; dùng `tailnet` nếu chỉ muốn Tailnet.
- Serve/Funnel chỉ expose **Gateway control UI + WS**. Nodes kết nối qua cùng endpoint Gateway WS, nên Serve có thể hoạt động cho truy cập node.

## Điều khiển trình duyệt (Gateway từ xa + trình duyệt local)

Nếu chạy Gateway trên một máy nhưng muốn điều khiển trình duyệt trên máy khác, chạy một **node host** trên máy trình duyệt và giữ cả hai trên cùng tailnet. Gateway sẽ proxy hành động trình duyệt đến node; không cần server điều khiển riêng hoặc URL Serve.

Tránh dùng Funnel cho điều khiển trình duyệt; coi việc ghép đôi node như truy cập operator.

## Yêu cầu và giới hạn Tailscale

- Serve yêu cầu bật HTTPS cho tailnet; CLI sẽ nhắc nếu thiếu.
- Serve chèn identity headers của Tailscale; Funnel thì không.
- Funnel yêu cầu Tailscale v1.38.3+, MagicDNS, bật HTTPS, và thuộc tính node funnel.
- Funnel chỉ hỗ trợ các cổng `443`, `8443`, và `10000` qua TLS.
- Funnel trên macOS yêu cầu biến thể ứng dụng Tailscale mã nguồn mở.

## Tìm hiểu thêm

- Tổng quan Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Lệnh `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tổng quan Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Lệnh `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)\n