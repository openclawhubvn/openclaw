---
title: Fly.io
summary: "Hướng dẫn triển khai OpenClaw trên Fly.io với lưu trữ bền vững và HTTPS"
read_when:
  - Triển khai OpenClaw trên Fly.io
  - Thiết lập Fly volumes, secrets và cấu hình lần đầu
---

# Triển khai trên Fly.io

**Mục tiêu:** Chạy OpenClaw Gateway trên máy Fly.io với lưu trữ bền vững, HTTPS tự động và truy cập Discord/channel.

## Cần chuẩn bị

- Cài [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Tài khoản Fly.io (dùng gói miễn phí được)
- Model auth: API key từ nhà cung cấp model
- Thông tin channel: Discord bot token, Telegram token, v.v.

## Lộ trình nhanh cho người mới

1. Clone repo → tùy chỉnh `fly.toml`
2. Tạo app + volume → thiết lập secrets
3. Triển khai với `fly deploy`
4. SSH vào để tạo config hoặc dùng Control UI

<Steps>
  <Step title="Tạo Fly app">
    ```bash
    # Clone repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Tạo Fly app mới (chọn tên riêng)
    fly apps create my-openclaw

    # Tạo volume bền vững (1GB thường đủ)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Mẹo:** Chọn region gần bạn. Các lựa chọn phổ biến: `lhr` (London), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Cấu hình fly.toml">
    Sửa `fly.toml` để khớp với tên app và yêu cầu của bạn.

    **Lưu ý bảo mật:** Cấu hình mặc định mở URL công khai. Để triển khai bảo mật hơn không có IP công khai, xem [Private Deployment](#private-deployment-hardened) hoặc dùng `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Tên app của bạn
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

    **Cài đặt chính:**

    | Cài đặt                        | Lý do                                                                         |
    | ------------------------------ | ----------------------------------------------------------------------------- |
    | `--bind lan`                   | Kết nối với `0.0.0.0` để proxy của Fly có thể truy cập gateway                |
    | `--allow-unconfigured`         | Khởi động không cần file config (sẽ tạo sau)                                  |
    | `internal_port = 3000`         | Phải khớp với `--port 3000` (hoặc `OPENCLAW_GATEWAY_PORT`) cho health checks  |
    | `memory = "2048mb"`            | 512MB quá nhỏ; khuyến nghị 2GB                                                |
    | `OPENCLAW_STATE_DIR = "/data"` | Lưu trạng thái trên volume                                                    |

  </Step>

  <Step title="Thiết lập secrets">
    ```bash
    # Bắt buộc: Gateway token (cho non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Tuỳ chọn: Các provider khác
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Ghi chú:**

    - Non-loopback binds (`--bind lan`) cần `OPENCLAW_GATEWAY_TOKEN` để bảo mật.
    - Đối xử với các token này như mật khẩu.
    - **Ưu tiên dùng env vars thay vì file config** cho tất cả API keys và tokens. Điều này giữ secrets không bị lộ trong `openclaw.json`.

  </Step>

  <Step title="Triển khai">
    ```bash
    fly deploy
    ```

    Lần triển khai đầu tiên sẽ build Docker image (~2-3 phút). Các lần sau nhanh hơn.

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

  <Step title="Tạo file config">
    SSH vào máy để tạo config chuẩn:

    ```bash
    fly ssh console
    ```

    Tạo thư mục và file config:

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

    **Lưu ý:** Với `OPENCLAW_STATE_DIR=/data`, đường dẫn config là `/data/openclaw.json`.

    **Lưu ý:** Discord token có thể lấy từ:

    - Biến môi trường: `DISCORD_BOT_TOKEN` (khuyến nghị cho secrets)
    - File config: `channels.discord.token`

    Nếu dùng env var, không cần thêm token vào config. Gateway tự đọc `DISCORD_BOT_TOKEN`.

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

    Dán gateway token (từ `OPENCLAW_GATEWAY_TOKEN`) để xác thực.

    ### Logs

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### SSH Console

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Khắc phục sự cố

### "App is not listening on expected address"

Gateway đang kết nối với `127.0.0.1` thay vì `0.0.0.0`.

**Khắc phục:** Thêm `--bind lan` vào lệnh process trong `fly.toml`.

### Health checks failing / connection refused

Fly không thể kết nối gateway trên cổng đã cấu hình.

**Khắc phục:** Đảm bảo `internal_port` khớp với cổng gateway (đặt `--port 3000` hoặc `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Vấn đề bộ nhớ

Container liên tục khởi động lại hoặc bị kill. Dấu hiệu: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, hoặc khởi động lại không thông báo.

**Khắc phục:** Tăng bộ nhớ trong `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Hoặc cập nhật máy hiện có:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Lưu ý:** 512MB quá nhỏ. 1GB có thể hoạt động nhưng dễ OOM khi tải nặng hoặc log chi tiết. **Khuyến nghị 2GB.**

### Vấn đề khóa Gateway

Gateway từ chối khởi động với lỗi "đã chạy".

Xảy ra khi container khởi động lại nhưng file khóa PID vẫn còn trên volume.

**Khắc phục:** Xóa file khóa:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

File khóa nằm tại `/data/gateway.*.lock` (không nằm trong thư mục con).

### Config không được đọc

Nếu dùng `--allow-unconfigured`, gateway tạo config tối thiểu. Config tùy chỉnh tại `/data/openclaw.json` sẽ được đọc khi khởi động lại.

Xác minh config tồn tại:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Viết Config qua SSH

Lệnh `fly ssh console -C` không hỗ trợ shell redirection. Để viết file config:

```bash
# Dùng echo + tee (pipe từ local đến remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Hoặc dùng sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Lưu ý:** `fly sftp` có thể thất bại nếu file đã tồn tại. Xóa trước:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### State không được lưu

Nếu mất thông tin đăng nhập hoặc sessions sau khi khởi động lại, thư mục state đang ghi vào filesystem của container.

**Khắc phục:** Đảm bảo `OPENCLAW_STATE_DIR=/data` được đặt trong `fly.toml` và triển khai lại.

## Cập nhật

```bash
# Pull thay đổi mới nhất
git pull

# Triển khai lại
fly deploy

# Kiểm tra sức khỏe
fly status
fly logs
```

### Cập nhật lệnh máy

Nếu cần thay đổi lệnh khởi động mà không cần triển khai lại toàn bộ:

```bash
# Lấy machine ID
fly machines list

# Cập nhật lệnh
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Hoặc với tăng bộ nhớ
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Lưu ý:** Sau `fly deploy`, lệnh máy có thể reset về `fly.toml`. Nếu có thay đổi thủ công, áp dụng lại sau triển khai.

## Triển khai riêng tư (Hardened)

Mặc định, Fly cấp IP công khai, làm cho gateway của bạn truy cập được tại `https://your-app.fly.dev`. Điều này tiện lợi nhưng cũng có nghĩa là triển khai của bạn có thể bị phát hiện bởi các scanner internet (Shodan, Censys, v.v.).

Để triển khai bảo mật hơn với **không có phơi bày công khai**, dùng template riêng tư.

### Khi nào dùng triển khai riêng tư

- Chỉ thực hiện **gọi/nhắn tin ra ngoài** (không có webhook inbound)
- Dùng **ngrok hoặc Tailscale** tunnels cho bất kỳ webhook callbacks
- Truy cập gateway qua **SSH, proxy, hoặc WireGuard** thay vì trình duyệt
- Muốn triển khai **ẩn khỏi scanner internet**

### Thiết lập

Dùng `fly.private.toml` thay vì cấu hình chuẩn:

```bash
# Triển khai với cấu hình riêng tư
fly deploy -c fly.private.toml
```

Hoặc chuyển đổi triển khai hiện có:

```bash
# Liệt kê IP hiện tại
fly ips list -a my-openclaw

# Giải phóng IP công khai
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Chuyển sang cấu hình riêng tư để các lần triển khai sau không cấp lại IP công khai
# (xóa [http_service] hoặc triển khai với template riêng tư)
fly deploy -c fly.private.toml

# Cấp phát IPv6 chỉ riêng tư
fly ips allocate-v6 --private -a my-openclaw
```

Sau đó, `fly ips list` chỉ hiển thị IP loại `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Truy cập triển khai riêng tư

Vì không có URL công khai, dùng một trong các phương pháp sau:

**Option 1: Local proxy (đơn giản nhất)**

```bash
# Chuyển tiếp cổng local 3000 đến app
fly proxy 3000:3000 -a my-openclaw

# Sau đó mở http://localhost:3000 trong trình duyệt
```

**Option 2: WireGuard VPN**

```bash
# Tạo cấu hình WireGuard (một lần)
fly wireguard create

# Import vào client WireGuard, sau đó truy cập qua IPv6 nội bộ
# Ví dụ: http://[fdaa:x:x:x:x::x]:3000
```

**Option 3: Chỉ SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks với triển khai riêng tư

Nếu cần webhook callbacks (Twilio, Telnyx, v.v.) mà không phơi bày công khai:

1. **ngrok tunnel** - Chạy ngrok trong container hoặc như một sidecar
2. **Tailscale Funnel** - Phơi bày các đường dẫn cụ thể qua Tailscale
3. **Outbound-only** - Một số nhà cung cấp (Twilio) hoạt động tốt cho các cuộc gọi ra ngoài mà không cần webhooks

Cấu hình voice-call ví dụ với ngrok:

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

Ngrok tunnel chạy trong container và cung cấp URL webhook công khai mà không phơi bày app Fly. Đặt `webhookSecurity.allowedHosts` thành hostname tunnel công khai để chấp nhận forwarded host headers.

### Lợi ích bảo mật

| Khía cạnh          | Công khai    | Riêng tư   |
| ------------------ | ------------ | ---------- |
| Scanner internet   | Có thể phát hiện | Ẩn       |
| Tấn công trực tiếp | Có thể       | Bị chặn    |
| Truy cập Control UI| Trình duyệt  | Proxy/VPN  |
| Giao hàng webhook  | Trực tiếp    | Qua tunnel |

## Ghi chú

- Fly.io dùng **kiến trúc x86** (không phải ARM)
- Dockerfile tương thích với cả hai kiến trúc
- Để onboarding WhatsApp/Telegram, dùng `fly ssh console`
- Dữ liệu bền vững nằm trên volume tại `/data`
- Signal yêu cầu Java + signal-cli; dùng image tùy chỉnh và giữ bộ nhớ ở mức 2GB+.

## Chi phí

Với cấu hình khuyến nghị (`shared-cpu-2x`, 2GB RAM):

- ~10-15 USD/tháng tùy theo sử dụng
- Gói miễn phí bao gồm một số hạn mức

Xem chi tiết [Fly.io pricing](https://fly.io/docs/about/pricing/).

## Bước tiếp theo

- Thiết lập các kênh nhắn tin: [Channels](/channels)
- Cấu hình Gateway: [Gateway configuration](/gateway/configuration)
- Giữ OpenClaw luôn cập nhật: [Updating](/install/updating)\n