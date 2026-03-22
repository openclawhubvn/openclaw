---
summary: "Truy cập từ xa qua SSH tunnels (Gateway WS) và tailnets"
read_when:
  - Đang chạy hoặc xử lý sự cố thiết lập gateway từ xa
title: "Truy cập từ xa"
---

# Truy cập từ xa (SSH, tunnels, và tailnets)

Repo này hỗ trợ "truy cập từ xa qua SSH" bằng cách giữ một Gateway (master) chạy trên một host chuyên dụng (desktop/server) và kết nối các client với nó.

- **Đối với operator (bạn / ứng dụng macOS)**: SSH tunneling là phương án dự phòng phổ biến.
- **Đối với node (iOS/Android và các thiết bị tương lai)**: kết nối với Gateway qua **WebSocket** (LAN/tailnet hoặc SSH tunnel khi cần).

## Ý tưởng cốt lõi

- Gateway WebSocket bind vào **loopback** trên cổng đã cấu hình (mặc định là 18789).
- Để sử dụng từ xa, forward cổng loopback đó qua SSH (hoặc dùng tailnet/VPN để giảm tunnel).

## Cấu hình VPN/tailnet phổ biến (nơi agent hoạt động)

Xem **Gateway host** như "nơi agent hoạt động". Nó sở hữu session, auth profile, channel và state. Laptop/desktop (và node) kết nối đến host đó.

### 1) Gateway luôn bật trong tailnet (VPS hoặc server tại nhà)

Chạy Gateway trên host liên tục và truy cập qua **Tailscale** hoặc SSH.

- **Trải nghiệm tốt nhất:** giữ `gateway.bind: "loopback"` và dùng **Tailscale Serve** cho Control UI.
- **Dự phòng:** giữ loopback + SSH tunnel từ bất kỳ máy nào cần truy cập.
- **Ví dụ:** [exe.dev](/install/exe-dev) (VM dễ dàng) hoặc [Hetzner](/install/hetzner) (VPS sản xuất).

Lý tưởng khi laptop thường xuyên ngủ nhưng bạn muốn agent luôn bật.

### 2) Desktop tại nhà chạy Gateway, laptop điều khiển từ xa

Laptop **không** chạy agent. Nó kết nối từ xa:

- Dùng chế độ **Remote over SSH** của ứng dụng macOS (Settings → General → “OpenClaw runs”).
- Ứng dụng mở và quản lý tunnel, nên WebChat + kiểm tra sức khỏe "chỉ cần hoạt động".

Runbook: [macOS remote access](/platforms/mac/remote).

### 3) Laptop chạy Gateway, truy cập từ xa từ máy khác

Giữ Gateway local nhưng expose an toàn:

- SSH tunnel đến laptop từ máy khác, hoặc
- Tailscale Serve Control UI và giữ Gateway chỉ loopback.

Hướng dẫn: [Tailscale](/gateway/tailscale) và [Web overview](/web).

## Luồng lệnh (chạy ở đâu)

Một dịch vụ gateway sở hữu state + channel. Node là thiết bị ngoại vi.

Ví dụ luồng (Telegram → node):

- Tin nhắn Telegram đến **Gateway**.
- Gateway chạy **agent** và quyết định có gọi công cụ node không.
- Gateway gọi **node** qua Gateway WebSocket (`node.*` RPC).
- Node trả kết quả; Gateway phản hồi lại Telegram.

Ghi chú:

- **Node không chạy dịch vụ gateway.** Chỉ một gateway nên chạy trên mỗi host trừ khi bạn cố tình chạy profile cách ly (xem [Multiple gateways](/gateway/multiple-gateways)).
- Ứng dụng macOS "node mode" chỉ là một node client qua Gateway WebSocket.

## SSH tunnel (CLI + công cụ)

Tạo một tunnel local đến remote Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Khi tunnel hoạt động:

- `openclaw health` và `openclaw status --deep` giờ có thể truy cập gateway từ xa qua `ws://127.0.0.1:18789`.
- `openclaw gateway {status,health,send,agent,call}` cũng có thể nhắm đến URL đã forward qua `--url` khi cần.

Lưu ý: thay `18789` bằng `gateway.port` đã cấu hình (hoặc `--port`/`OPENCLAW_GATEWAY_PORT`).
Lưu ý: khi truyền `--url`, CLI không sử dụng lại config hoặc credential môi trường. Bao gồm `--token` hoặc `--password` rõ ràng. Thiếu credential rõ ràng là lỗi.

## Mặc định remote CLI

Có thể lưu một target remote để CLI dùng mặc định:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Khi gateway chỉ loopback, giữ URL tại `ws://127.0.0.1:18789` và mở SSH tunnel trước.

## Thứ tự ưu tiên credential

Giải quyết credential Gateway tuân theo một hợp đồng chung trên các đường call/probe/status và giám sát exec-approval Discord. Node-host dùng cùng hợp đồng cơ bản với một ngoại lệ local-mode (nó cố tình bỏ qua `gateway.remote.*`):

- Credential rõ ràng (`--token`, `--password`, hoặc công cụ `gatewayToken`) luôn thắng trên các đường call chấp nhận auth rõ ràng.
- An toàn override URL:
  - CLI URL override (`--url`) không bao giờ tái sử dụng credential config/env ngầm.
  - Env URL override (`OPENCLAW_GATEWAY_URL`) chỉ có thể dùng credential môi trường (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Mặc định local mode:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (remote fallback chỉ áp dụng khi input token auth local không được đặt)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (remote fallback chỉ áp dụng khi input password auth local không được đặt)
- Mặc định remote mode:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Ngoại lệ node-host local-mode: `gateway.remote.token` / `gateway.remote.password` bị bỏ qua.
- Kiểm tra token probe/status remote nghiêm ngặt mặc định: chỉ dùng `gateway.remote.token` (không có fallback token local) khi nhắm đến remote mode.
- Biến môi trường `CLAWDBOT_GATEWAY_*` chỉ dùng cho đường call tương thích; giải quyết probe/status/auth chỉ dùng `OPENCLAW_GATEWAY_*`.

## Chat UI qua SSH

WebChat không còn dùng cổng HTTP riêng. SwiftUI chat UI kết nối trực tiếp đến Gateway WebSocket.

- Forward `18789` qua SSH (xem trên), sau đó kết nối client đến `ws://127.0.0.1:18789`.
- Trên macOS, ưu tiên chế độ “Remote over SSH” của ứng dụng, quản lý tunnel tự động.

## Ứng dụng macOS "Remote over SSH"

Ứng dụng menu bar macOS có thể điều khiển cùng thiết lập từ đầu đến cuối (kiểm tra trạng thái từ xa, WebChat, và chuyển tiếp Voice Wake).

Runbook: [macOS remote access](/platforms/mac/remote).

## Quy tắc bảo mật (remote/VPN)

Phiên bản ngắn: **giữ Gateway chỉ loopback** trừ khi chắc chắn cần bind.

- **Loopback + SSH/Tailscale Serve** là mặc định an toàn nhất (không phơi bày công khai).
- `ws://` plaintext mặc định chỉ loopback. Đối với mạng riêng tin cậy,
  đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trên process client như một biện pháp khẩn cấp.
- **Non-loopback binds** (`lan`/`tailnet`/`custom`, hoặc `auto` khi loopback không khả dụng) phải dùng auth token/password.
- `gateway.remote.token` / `.password` là nguồn credential client. Chúng **không** tự cấu hình auth server.
- Đường call local có thể dùng `gateway.remote.*` như fallback chỉ khi `gateway.auth.*` không được đặt.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef và không giải quyết được, giải quyết thất bại đóng (không có remote fallback che giấu).
- `gateway.remote.tlsFingerprint` ghim cert TLS remote khi dùng `wss://`.
- **Tailscale Serve** có thể xác thực lưu lượng Control UI/WebSocket qua header identity khi `gateway.auth.allowTailscale: true`; endpoint API HTTP vẫn
  yêu cầu auth token/password. Luồng không token này giả định host gateway được tin cậy. Đặt nó thành `false` nếu muốn token/password ở mọi nơi.
- Xem điều khiển trình duyệt như truy cập operator: chỉ tailnet + ghép nối node có chủ ý.

Khám phá sâu: [Security](/gateway/security).\n