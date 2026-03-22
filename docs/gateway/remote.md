---
summary: "Tìm hiểu cách cấu hình truy cập từ xa an toàn qua SSH tunnels và tailnets, đảm bảo kết nối bảo mật và hiệu quả."
read_when:
  - Đang chạy hoặc xử lý sự cố cài đặt gateway từ xa
title: "Hướng Dẫn Truy Cập Từ Xa Qua SSH Tunnels"
---

# Truy cập từ xa (SSH, tunnels và tailnets)

Repo này hỗ trợ "truy cập từ xa qua SSH" bằng cách duy trì một Gateway (master) chạy trên một máy chủ chuyên dụng (desktop/server) và kết nối các client với nó.

- Đối với **người vận hành (bạn / ứng dụng macOS)**: SSH tunneling là phương án dự phòng phổ biến.
- Đối với **các node (iOS/Android và các thiết bị tương lai)**: kết nối với Gateway qua **WebSocket** (LAN/tailnet hoặc SSH tunnel khi cần).

## Ý tưởng cốt lõi

- Gateway WebSocket kết nối với **loopback** trên cổng đã cấu hình của bạn (mặc định là 18789).
- Để sử dụng từ xa, bạn chuyển tiếp cổng loopback đó qua SSH (hoặc sử dụng tailnet/VPN và giảm thiểu việc tunneling).

## Cài đặt VPN/tailnet phổ biến (nơi agent hoạt động)

Hãy xem **máy chủ Gateway** như "nơi agent hoạt động". Nó sở hữu các phiên, hồ sơ xác thực, kênh và trạng thái.
Laptop/desktop của bạn (và các node) kết nối với máy chủ đó.

### 1) Gateway luôn hoạt động trong tailnet của bạn (VPS hoặc máy chủ tại nhà)

Chạy Gateway trên một máy chủ liên tục và truy cập nó qua **Tailscale** hoặc SSH.

- **Trải nghiệm người dùng tốt nhất:** giữ `gateway.bind: "loopback"` và sử dụng **Tailscale Serve** cho giao diện điều khiển.
- **Phương án dự phòng:** giữ loopback + SSH tunnel từ bất kỳ máy nào cần truy cập.
- **Ví dụ:** [exe.dev](/install/exe-dev) (VM dễ dàng) hoặc [Hetzner](/install/hetzner) (VPS sản xuất).

Điều này lý tưởng khi laptop của bạn thường xuyên ngủ nhưng bạn muốn agent luôn hoạt động.

### 2) Máy tính để bàn tại nhà chạy Gateway, laptop là điều khiển từ xa

Laptop **không** chạy agent. Nó kết nối từ xa:

- Sử dụng chế độ **Remote over SSH** của ứng dụng macOS (Cài đặt → Chung → “OpenClaw chạy”).
- Ứng dụng mở và quản lý tunnel, do đó WebChat + kiểm tra sức khỏe hoạt động "ngay lập tức".

Hướng dẫn: [truy cập từ xa macOS](/platforms/mac/remote).

### 3) Laptop chạy Gateway, truy cập từ xa từ các máy khác

Giữ Gateway cục bộ nhưng mở rộng nó một cách an toàn:

- SSH tunnel đến laptop từ các máy khác, hoặc
- Tailscale Serve giao diện điều khiển và giữ Gateway chỉ loopback.

Hướng dẫn: [Tailscale](/gateway/tailscale) và [Tổng quan web](/web).

## Luồng lệnh (chạy ở đâu)

Một dịch vụ gateway sở hữu trạng thái + kênh. Các node là thiết bị ngoại vi.

Ví dụ luồng (Telegram → node):

- Tin nhắn Telegram đến **Gateway**.
- Gateway chạy **agent** và quyết định có gọi công cụ node hay không.
- Gateway gọi **node** qua Gateway WebSocket (`node.*` RPC).
- Node trả về kết quả; Gateway phản hồi lại Telegram.

Lưu ý:

- **Các node không chạy dịch vụ gateway.** Chỉ một gateway nên chạy trên mỗi máy chủ trừ khi bạn cố ý chạy các hồ sơ cách ly (xem [Nhiều gateway](/gateway/multiple-gateways)).
- Chế độ "node mode" của ứng dụng macOS chỉ là một client node qua Gateway WebSocket.

## SSH tunnel (CLI + công cụ)

Tạo một tunnel cục bộ đến Gateway WS từ xa:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Khi tunnel đã hoạt động:

- `openclaw health` và `openclaw status --deep` giờ đây có thể truy cập gateway từ xa qua `ws://127.0.0.1:18789`.
- `openclaw gateway {status,health,send,agent,call}` cũng có thể nhắm đến URL đã chuyển tiếp qua `--url` khi cần.

Lưu ý: thay thế `18789` bằng `gateway.port` đã cấu hình của bạn (hoặc `--port`/`OPENCLAW_GATEWAY_PORT`).
Lưu ý: khi bạn truyền `--url`, CLI không sử dụng lại cấu hình hoặc thông tin xác thực môi trường.
Bao gồm `--token` hoặc `--password` rõ ràng. Thiếu thông tin xác thực rõ ràng là một lỗi.

## Mặc định từ xa của CLI

Bạn có thể duy trì một mục tiêu từ xa để các lệnh CLI sử dụng mặc định:

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

## Quy tắc thông tin xác thực

Giải quyết thông tin xác thực Gateway tuân theo một hợp đồng chung trên các đường dẫn call/probe/status và giám sát phê duyệt exec của Discord. Node-host sử dụng cùng một hợp đồng cơ bản với một ngoại lệ chế độ cục bộ (nó cố ý bỏ qua `gateway.remote.*`):

- Thông tin xác thực rõ ràng (`--token`, `--password`, hoặc công cụ `gatewayToken`) luôn thắng trên các đường dẫn call chấp nhận xác thực rõ ràng.
- An toàn ghi đè URL:
  - Ghi đè URL CLI (`--url`) không bao giờ sử dụng lại thông tin xác thực cấu hình/môi trường ngầm định.
  - Ghi đè URL môi trường (`OPENCLAW_GATEWAY_URL`) chỉ có thể sử dụng thông tin xác thực môi trường (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Mặc định chế độ cục bộ:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (phương án dự phòng từ xa chỉ áp dụng khi đầu vào token xác thực cục bộ chưa được đặt)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (phương án dự phòng từ xa chỉ áp dụng khi đầu vào password xác thực cục bộ chưa được đặt)
- Mặc định chế độ từ xa:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Ngoại lệ chế độ cục bộ node-host: `gateway.remote.token` / `gateway.remote.password` bị bỏ qua.
- Kiểm tra token probe/status từ xa nghiêm ngặt theo mặc định: chúng chỉ sử dụng `gateway.remote.token` (không có phương án dự phòng token cục bộ) khi nhắm đến chế độ từ xa.
- Biến môi trường `CLAWDBOT_GATEWAY_*` cũ chỉ được sử dụng bởi các đường dẫn call tương thích; giải quyết probe/status/auth chỉ sử dụng `OPENCLAW_GATEWAY_*`.

## Giao diện chat qua SSH

WebChat không còn sử dụng một cổng HTTP riêng biệt. Giao diện chat SwiftUI kết nối trực tiếp với Gateway WebSocket.

- Chuyển tiếp `18789` qua SSH (xem ở trên), sau đó kết nối các client đến `ws://127.0.0.1:18789`.
- Trên macOS, ưu tiên chế độ “Remote over SSH” của ứng dụng, chế độ này quản lý tunnel tự động.

## Ứng dụng macOS "Remote over SSH"

Ứng dụng thanh menu macOS có thể điều khiển cùng một thiết lập từ đầu đến cuối (kiểm tra trạng thái từ xa, WebChat và chuyển tiếp Voice Wake).

Hướng dẫn: [truy cập từ xa macOS](/platforms/mac/remote).

## Quy tắc bảo mật (từ xa/VPN)

Phiên bản ngắn: **giữ Gateway chỉ loopback** trừ khi bạn chắc chắn cần một bind.

- **Loopback + SSH/Tailscale Serve** là mặc định an toàn nhất (không phơi bày công khai).
- `ws://` dạng văn bản chỉ là loopback theo mặc định. Đối với các mạng riêng tư đáng tin cậy,
  đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trên tiến trình client như một biện pháp khẩn cấp.
- **Non-loopback binds** (`lan`/`tailnet`/`custom`, hoặc `auto` khi loopback không khả dụng) phải sử dụng token/password xác thực.
- `gateway.remote.token` / `.password` là nguồn thông tin xác thực client. Chúng **không** tự cấu hình xác thực máy chủ.
- Các đường dẫn call cục bộ có thể sử dụng `gateway.remote.*` như phương án dự phòng chỉ khi `gateway.auth.*` chưa được đặt.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef và không được giải quyết, giải quyết sẽ thất bại (không có phương án dự phòng từ xa).
- `gateway.remote.tlsFingerprint` ghim chứng chỉ TLS từ xa khi sử dụng `wss://`.
- **Tailscale Serve** có thể xác thực lưu lượng Control UI/WebSocket qua các tiêu đề nhận dạng khi `gateway.auth.allowTailscale: true`; các điểm cuối API HTTP vẫn
  yêu cầu xác thực token/password. Luồng không cần token này giả định máy chủ gateway là đáng tin cậy. Đặt nó thành `false` nếu bạn muốn token/password ở mọi nơi.
- Xem điều khiển trình duyệt như truy cập của người vận hành: chỉ tailnet + ghép nối node có chủ ý.

Khám phá sâu: [Bảo mật](/gateway/security).
