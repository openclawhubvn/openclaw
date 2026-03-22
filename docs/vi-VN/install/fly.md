---
title: Fly.io
summary: "Hướng dẫn triển khai OpenClaw trên Fly.io với lưu trữ dữ liệu và HTTPS tự động"
read_when:
  - Triển khai OpenClaw trên Fly.io
  - Thiết lập Fly volumes, secrets và cấu hình lần đầu
---

# Triển khai trên Fly.io

**Mục tiêu:** Chạy OpenClaw Gateway trên máy Fly.io với lưu trữ dữ liệu, HTTPS tự động và truy cập Discord/kênh.

## Bạn cần chuẩn bị

- Đã cài đặt [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Tài khoản Fly.io (miễn phí cũng được)
- Xác thực mô hình: API key cho nhà cung cấp mô hình bạn chọn
- Thông tin đăng nhập kênh: token bot Discord, token Telegram, v.v.

## Lộ trình nhanh cho người mới

1. Clone repo → tùy chỉnh `fly.toml`
2. Tạo ứng dụng + volume → thiết lập secrets
3. Triển khai với `fly deploy`
4. SSH vào để tạo cấu hình hoặc sử dụng Control UI

<Steps>
  <Step title="Tạo ứng dụng Fly">
    ```bash
    # Clone repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Tạo ứng dụng Fly mới (chọn tên riêng)
    fly apps create my-openclaw

    # Tạo volume lưu trữ dữ liệu (1GB thường đủ)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Mẹo:** Chọn khu vực gần bạn. Các lựa chọn phổ biến: `lhr` (London), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Cấu hình fly.toml">
    Chỉnh sửa `fly.toml` để phù hợp với tên ứng dụng và yêu cầu của bạn.

    **Lưu ý bảo mật:** Cấu hình mặc định mở URL công khai. Để triển khai an toàn hơn không có IP công khai, xem [Triển khai riêng tư](#private-deployment-hardened) hoặc sử dụng `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Tên ứng dụng của bạn
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **Các thiết lập chính:**

    | Thiết lập                      | Lý do                                                                         |
    | ------------------------------ | ----------------------------------------------------------------------------- |
    | `--bind lan`                   | Kết nối với `0.0.0.0` để proxy của Fly có thể truy cập gateway                |
    | `--allow-unconfigured`         | Khởi động mà không cần file cấu hình (bạn sẽ tạo sau)                         |
    | `internal_port = 3000`         | Phải khớp với `--port 3000` (hoặc `OPENCLAW_GATEWAY_PORT`) để kiểm tra sức khỏe của Fly |
    | `memory = "2048mb"`            | 512MB là quá nhỏ; khuyến nghị 2GB                                             |
    | `OPENCLAW_STATE_DIR = "/data"` | Lưu trữ trạng thái trên volume                                                |

  </Step>

  <Step title="Thiết lập secrets">
    ```bash
    # Bắt buộc: Gateway token (cho kết nối không phải loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # API key của nhà cung cấp mô hình
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Tùy chọn: Các nhà cung cấp khác
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Token kênh
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Ghi chú:**

    - Kết nối không phải loopback (`--bind lan`) yêu cầu `OPENCLAW_GATEWAY_TOKEN` để bảo mật.
    - Đối xử với các token này như mật khẩu.
    - **Ưu tiên biến môi trường hơn file cấu hình** cho tất cả API key và token. Điều này giữ bí mật không bị lộ trong `openclaw.json`.

  </Step>

  <Step title="Triển khai">
    ```bash
    fly deploy
    ```

    Triển khai đầu tiên sẽ build Docker image (~2-3 phút). Các lần triển khai sau nhanh hơn.

    Sau khi triển khai, kiểm tra:

    ```bash
    fly status
    fly logs
    ```

    Bạn sẽ thấy:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Tạo file cấu hình">
    SSH vào máy để tạo cấu hình đúng:

    ```bash
    fly ssh console
    ```

    Tạo thư mục và file cấu hình:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-4o"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **Lưu ý:** Với `OPENCLAW_STATE_DIR=/data`, đường dẫn cấu hình là `/data/openclaw.json`.

    **Lưu ý:** Token Discord có thể đến từ:

    - Biến môi trường: `DISCORD_BOT_TOKEN` (khuyến nghị cho bảo mật)
    - File cấu hình: `channels.discord.token`

    Nếu sử dụng biến môi trường, không cần thêm token vào cấu hình. Gateway sẽ tự động đọc `DISCORD_BOT_TOKEN`.

    Khởi động lại để áp dụng:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Truy cập Gateway">
    ### Control UI

    Mở trong trình duyệt:

    ```bash
    fly open
    ```

    Hoặc truy cập `https://my-openclaw.fly.dev/`

    Dán token gateway của bạn (từ `OPENCLAW_GATEWAY_TOKEN`) để xác thực.

    ### Logs

    ```bash
    fly logs              # Logs trực tiếp
    fly logs --no-tail    # Logs gần đây
    ```

    ### SSH Console

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Khắc phục sự cố

### "Ứng dụng không lắng nghe trên địa chỉ mong đợi"

Gateway đang kết nối với `127.0.0.1` thay vì `0.0.0.0`.

**Khắc phục:** Thêm `--bind lan` vào lệnh process trong `fly.toml`.

### Kiểm tra sức khỏe thất bại / kết nối bị từ chối

Fly không thể truy cập gateway trên cổng đã cấu hình.

**Khắc phục:** Đảm bảo `internal_port` khớp với cổng gateway (đặt `--port 3000` hoặc `OPENCLAW_GATEWAY_PORT=3000`).

### Vấn đề OOM / Bộ nhớ

Container liên tục khởi động lại hoặc bị dừng. Dấu hiệu: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, hoặc khởi động lại không thông báo.

**Khắc phục:** Tăng bộ nhớ trong `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Hoặc cập nhật máy hiện tại:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Lưu ý:** 512MB là quá nhỏ. 1GB có thể hoạt động nhưng có thể gặp OOM khi tải nặng hoặc log chi tiết. **Khuyến nghị 2GB.**

### Vấn đề khóa Gateway

Gateway từ chối khởi động với lỗi "đã chạy".

Điều này xảy ra khi container khởi động lại nhưng file khóa PID vẫn tồn tại trên volume.

**Khắc phục:** Xóa file khóa:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

File khóa nằm tại `/data/gateway.*.lock` (không nằm trong thư mục con).

### Cấu hình không được đọc

Nếu sử dụng `--allow-unconfigured`, gateway tạo cấu hình tối thiểu. Cấu hình tùy chỉnh của bạn tại `/data/openclaw.json` nên được đọc khi khởi động lại.

Xác minh cấu hình tồn tại:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Viết cấu hình qua SSH

Lệnh `fly ssh console -C` không hỗ trợ chuyển hướng shell. Để viết file cấu hình:

```bash
# Sử dụng echo + tee (pipe từ local đến remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Hoặc sử dụng sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Lưu ý:** `fly sftp` có thể thất bại nếu file đã tồn tại. Xóa trước:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Trạng thái không được lưu

Nếu bạn mất thông tin đăng nhập hoặc phiên sau khi khởi động lại, thư mục trạng thái đang ghi vào hệ thống file của container.

**Khắc phục:** Đảm bảo `OPENCLAW_STATE_DIR=/data` được đặt trong `fly.toml` và triển khai lại.

## Cập nhật

```bash
# Kéo các thay đổi mới nhất
git pull

# Triển khai lại
fly deploy

# Kiểm tra sức khỏe
fly status
fly logs
```

### Cập nhật lệnh máy

Nếu bạn cần thay đổi lệnh khởi động mà không cần triển khai lại hoàn toàn:

```bash
# Lấy ID máy
fly machines list

# Cập nhật lệnh
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Hoặc với tăng bộ nhớ
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Lưu ý:** Sau `fly deploy`, lệnh máy có thể được đặt lại theo `fly.toml`. Nếu bạn đã thực hiện thay đổi thủ công, hãy áp dụng lại sau khi triển khai.

## Triển khai riêng tư (An toàn hơn)

Theo mặc định, Fly cấp phát IP công khai, làm cho gateway của bạn có thể truy cập tại `https://your-app.fly.dev`. Điều này tiện lợi nhưng cũng có nghĩa là triển khai của bạn có thể bị phát hiện bởi các máy quét internet (Shodan, Censys, v.v.).

Để triển khai an toàn hơn với **không có phơi bày công khai**, sử dụng mẫu riêng tư.

### Khi nào nên sử dụng triển khai riêng tư

- Bạn chỉ thực hiện các cuộc gọi/tin nhắn **ra ngoài** (không có webhook inbound)
- Bạn sử dụng **ngrok hoặc Tailscale** tunnels cho bất kỳ webhook callback nào
- Bạn truy cập gateway qua **SSH, proxy, hoặc WireGuard** thay vì trình duyệt
- Bạn muốn triển khai **ẩn khỏi các máy quét internet**

### Thiết lập

Sử dụng `fly.private.toml` thay vì cấu hình tiêu chuẩn:

```bash
# Triển khai với cấu hình riêng tư
fly deploy -c fly.private.toml
```

Hoặc chuyển đổi một triển khai hiện có:

```bash
# Liệt kê các IP hiện tại
fly ips list -a my-openclaw

# Giải phóng các IP công khai
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Chuyển sang cấu hình riêng tư để các triển khai trong tương lai không cấp phát lại IP công khai
# (xóa [http_service] hoặc triển khai với mẫu riêng tư)
fly deploy -c fly.private.toml

# Cấp phát IPv6 chỉ riêng tư
fly ips allocate-v6 --private -a my-openclaw
```

Sau đó, `fly ips list` chỉ nên hiển thị một IP loại `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Truy cập triển khai riêng tư

Vì không có URL công khai, sử dụng một trong các phương pháp sau:

**Lựa chọn 1: Proxy cục bộ (đơn giản nhất)**

```bash
# Chuyển tiếp cổng cục bộ 3000 đến ứng dụng
fly proxy 3000:3000 -a my-openclaw

# Sau đó mở http://localhost:3000 trong trình duyệt
```

**Lựa chọn 2: VPN WireGuard**

```bash
# Tạo cấu hình WireGuard (một lần)
fly wireguard create

# Nhập vào client WireGuard, sau đó truy cập qua IPv6 nội bộ
# Ví dụ: http://[fdaa:x:x:x:x::x]:3000
```

**Lựa chọn 3: Chỉ SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks với triển khai riêng tư

Nếu bạn cần webhook callback (Twilio, Telnyx, v.v.) mà không phơi bày công khai:

1. **ngrok tunnel** - Chạy ngrok bên trong container hoặc như một sidecar
2. **Tailscale Funnel** - Phơi bày các đường dẫn cụ thể qua Tailscale
3. **Chỉ outbound** - Một số nhà cung cấp (Twilio) hoạt động tốt cho các cuộc gọi outbound mà không cần webhooks

Cấu hình cuộc gọi thoại ví dụ với ngrok:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

Ngrok tunnel chạy bên trong container và cung cấp một URL webhook công khai mà không phơi bày ứng dụng Fly. Đặt `webhookSecurity.allowedHosts` thành tên miền công khai của tunnel để các tiêu đề host được chuyển tiếp được chấp nhận.

### Lợi ích bảo mật

| Khía cạnh           | Công khai    | Riêng tư   |
| ------------------- | ------------ | ---------- |
| Máy quét internet   | Có thể phát hiện | Ẩn        |
| Tấn công trực tiếp  | Có thể       | Bị chặn    |
| Truy cập Control UI | Trình duyệt  | Proxy/VPN  |
| Giao hàng webhook   | Trực tiếp    | Qua tunnel |

## Ghi chú

- Fly.io sử dụng kiến trúc **x86** (không phải ARM)
- Dockerfile tương thích với cả hai kiến trúc
- Để onboarding WhatsApp/Telegram, sử dụng `fly ssh console`
- Dữ liệu lưu trữ nằm trên volume tại `/data`
- Signal yêu cầu Java + signal-cli; sử dụng image tùy chỉnh và giữ bộ nhớ ở mức 2GB+.

## Chi phí

Với cấu hình khuyến nghị (`shared-cpu-2x`, RAM 2GB):

- ~10-15 USD/tháng tùy thuộc vào mức sử dụng
- Gói miễn phí bao gồm một số hạn mức

Xem chi tiết [giá Fly.io](https://fly.io/docs/about/pricing/).

## Bước tiếp theo

- Thiết lập các kênh nhắn tin: [Channels](/channels)
- Cấu hình Gateway: [Gateway configuration](/gateway/configuration)
- Giữ OpenClaw luôn cập nhật: [Updating](/install/updating)
