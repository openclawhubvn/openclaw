---
summary: "Khám phá cách tích hợp Tailscale Serve/Funnel vào bảng điều khiển Gateway để tối ưu hóa kết nối mạng an toàn và hiệu quả."
read_when:
  - Khi cần mở rộng giao diện điều khiển Gateway ra ngoài localhost
  - Khi cần tự động hóa truy cập dashboard qua tailnet hoặc công khai
title: "Hướng Dẫn Tích Hợp Tailscale Trên Gateway"
---

# Tailscale (bảng điều khiển Gateway)

OpenClaw có thể tự động cấu hình Tailscale **Serve** (tailnet) hoặc **Funnel** (công khai) cho bảng điều khiển Gateway và cổng WebSocket. Điều này giúp Gateway chỉ cần kết nối nội bộ, trong khi Tailscale cung cấp HTTPS, định tuyến và (với Serve) các header nhận diện.

## Chế độ

- `serve`: Chỉ dùng Tailnet Serve qua `tailscale serve`. Gateway vẫn giữ trên `127.0.0.1`.
- `funnel`: HTTPS công khai qua `tailscale funnel`. OpenClaw yêu cầu mật khẩu chia sẻ.
- `off`: Mặc định (không tự động hóa Tailscale).

## Xác thực

Thiết lập `gateway.auth.mode` để kiểm soát quá trình bắt tay:

- `token` (mặc định khi `OPENCLAW_GATEWAY_TOKEN` được thiết lập)
- `password` (bí mật chia sẻ qua `OPENCLAW_GATEWAY_PASSWORD` hoặc cấu hình)

Khi `tailscale.mode = "serve"` và `gateway.auth.allowTailscale` là `true`, xác thực giao diện điều khiển/WebSocket có thể sử dụng các header nhận diện của Tailscale (`tailscale-user-login`) mà không cần cung cấp token/mật khẩu. OpenClaw xác minh danh tính bằng cách giải quyết địa chỉ `x-forwarded-for` qua daemon Tailscale cục bộ (`tailscale whois`) và đối chiếu với header trước khi chấp nhận. OpenClaw chỉ coi một yêu cầu là Serve khi nó đến từ loopback với các header `x-forwarded-for`, `x-forwarded-proto`, và `x-forwarded-host` của Tailscale. Các endpoint API HTTP (ví dụ `/v1/*`, `/tools/invoke`, và `/api/channels/*`) vẫn yêu cầu xác thực token/mật khẩu. Luồng không cần token này giả định máy chủ gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin có thể chạy trên cùng máy chủ, hãy tắt `gateway.auth.allowTailscale` và yêu cầu xác thực token/mật khẩu. Để yêu cầu thông tin xác thực rõ ràng, thiết lập `gateway.auth.allowTailscale: false` hoặc buộc `gateway.auth.mode: "password"`.

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

### Chỉ Tailnet (kết nối trực tiếp IP Tailnet)

Sử dụng khi muốn Gateway lắng nghe trực tiếp trên IP Tailnet (không dùng Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Kết nối từ thiết bị Tailnet khác:

- Giao diện điều khiển: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Lưu ý: loopback (`http://127.0.0.1:18789`) sẽ **không** hoạt động trong chế độ này.

### Internet công khai (Funnel + mật khẩu chia sẻ)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Ưu tiên `OPENCLAW_GATEWAY_PASSWORD` thay vì lưu mật khẩu vào đĩa.

## Ví dụ CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Ghi chú

- Tailscale Serve/Funnel yêu cầu cài đặt và đăng nhập CLI `tailscale`.
- `tailscale.mode: "funnel"` từ chối khởi động trừ khi chế độ xác thực là `password` để tránh lộ công khai.
- Thiết lập `gateway.tailscale.resetOnExit` nếu muốn OpenClaw hoàn tác cấu hình `tailscale serve` hoặc `tailscale funnel` khi tắt.
- `gateway.bind: "tailnet"` là kết nối trực tiếp Tailnet (không HTTPS, không Serve/Funnel).
- `gateway.bind: "auto"` ưu tiên loopback; sử dụng `tailnet` nếu chỉ muốn Tailnet.
- Serve/Funnel chỉ mở giao diện điều khiển Gateway + WS. Các node kết nối qua cùng endpoint Gateway WS, nên Serve có thể hoạt động cho truy cập node.

## Điều khiển trình duyệt (Gateway từ xa + trình duyệt cục bộ)

Nếu chạy Gateway trên một máy nhưng muốn điều khiển trình duyệt trên máy khác, hãy chạy một **node host** trên máy trình duyệt và giữ cả hai trên cùng tailnet. Gateway sẽ chuyển tiếp hành động trình duyệt đến node; không cần máy chủ điều khiển riêng hoặc URL Serve.

Tránh dùng Funnel cho điều khiển trình duyệt; coi việc ghép đôi node như truy cập của người vận hành.

## Yêu cầu và giới hạn của Tailscale

- Serve yêu cầu bật HTTPS cho tailnet; CLI sẽ nhắc nếu thiếu.
- Serve chèn các header nhận diện của Tailscale; Funnel thì không.
- Funnel yêu cầu Tailscale v1.38.3+, MagicDNS, bật HTTPS, và thuộc tính node funnel.
- Funnel chỉ hỗ trợ các cổng `443`, `8443`, và `10000` qua TLS.
- Funnel trên macOS yêu cầu phiên bản ứng dụng Tailscale mã nguồn mở.

## Tìm hiểu thêm

- Tổng quan về Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Lệnh `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tổng quan về Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Lệnh `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
