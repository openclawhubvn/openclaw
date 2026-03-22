---
summary: "Chạy OpenClaw Gateway 24/7 trên VPS Hetzner giá rẻ (Docker) với trạng thái bền vững và nhúng sẵn binaries"
read_when:
  - Muốn chạy OpenClaw 24/7 trên cloud VPS (không phải laptop)
  - Cần Gateway luôn sẵn sàng trên VPS tự quản lý
  - Muốn kiểm soát hoàn toàn về lưu trữ, binaries và hành vi khởi động lại
  - Đang chạy OpenClaw trong Docker trên Hetzner hoặc nhà cung cấp tương tự
title: "Hetzner"
---

# OpenClaw trên Hetzner (Docker, Hướng dẫn VPS Production)

## Mục tiêu

Chạy OpenClaw Gateway bền vững trên VPS Hetzner bằng Docker, với trạng thái bền vững, nhúng sẵn binaries và hành vi khởi động lại an toàn.

Nếu muốn "OpenClaw 24/7 với giá ~$5", đây là cách thiết lập đơn giản và đáng tin cậy nhất. Giá Hetzner có thể thay đổi; chọn VPS Debian/Ubuntu nhỏ nhất và nâng cấp nếu gặp OOM.

Nhắc nhở về mô hình bảo mật:

- Agent chia sẻ trong công ty ổn khi mọi người cùng trong một phạm vi tin cậy và runtime chỉ dùng cho công việc.
- Giữ tách biệt nghiêm ngặt: VPS/runtime riêng + tài khoản riêng; không dùng profile cá nhân Apple/Google/trình duyệt/quản lý mật khẩu trên host đó.
- Nếu người dùng có thể gây hại lẫn nhau, tách biệt theo gateway/host/người dùng OS.

Xem thêm [Security](/gateway/security) và [VPS hosting](/vps).

## Chúng ta đang làm gì (nói đơn giản)?

- Thuê một server Linux nhỏ (VPS Hetzner)
- Cài Docker (runtime ứng dụng cách ly)
- Khởi động OpenClaw Gateway trong Docker
- Lưu trữ `~/.openclaw` + `~/.openclaw/workspace` trên host (tồn tại qua các lần khởi động lại/xây dựng lại)
- Truy cập Control UI từ laptop qua SSH tunnel

Có thể truy cập Gateway qua:

- SSH port forwarding từ laptop
- Mở cổng trực tiếp nếu tự quản lý firewall và tokens

Hướng dẫn này giả định dùng Ubuntu hoặc Debian trên Hetzner.  
Nếu dùng VPS Linux khác, map package tương ứng.
Để biết luồng Docker chung, xem [Docker](/install/docker).

---

## Đường tắt (dành cho người có kinh nghiệm)

1. Cấp phát VPS Hetzner
2. Cài Docker
3. Clone repository OpenClaw
4. Tạo thư mục host bền vững
5. Cấu hình `.env` và `docker-compose.yml`
6. Nhúng binaries cần thiết vào image
7. `docker compose up -d`
8. Kiểm tra lưu trữ và truy cập Gateway

---

## Cần chuẩn bị

- VPS Hetzner với quyền root
- Truy cập SSH từ laptop
- Thoải mái cơ bản với SSH + copy/paste
- ~20 phút
- Docker và Docker Compose
- Thông tin xác thực mô hình
- Thông tin xác thực nhà cung cấp tùy chọn
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="Cấp phát VPS">
    Tạo VPS Ubuntu hoặc Debian trên Hetzner.

    Kết nối với quyền root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Hướng dẫn này giả định VPS có trạng thái.
    Không coi nó là hạ tầng có thể vứt bỏ.

  </Step>

  <Step title="Cài Docker (trên VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Kiểm tra:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone repository OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Hướng dẫn này giả định bạn sẽ build một image tùy chỉnh để đảm bảo lưu trữ binary.

  </Step>

  <Step title="Tạo thư mục host bền vững">
    Docker containers là tạm thời.
    Tất cả trạng thái lâu dài phải lưu trên host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Đặt quyền sở hữu cho người dùng container (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Cấu hình biến môi trường">
    Tạo `.env` trong thư mục gốc repository.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Tạo secrets mạnh:

    ```bash
    openssl rand -hex 32
    ```

    **Không commit file này.**

  </Step>

  <Step title="Cấu hình Docker Compose">
    Tạo hoặc cập nhật `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Khuyến nghị: giữ Gateway chỉ loopback trên VPS; truy cập qua SSH tunnel.
          # Để công khai, bỏ tiền tố `127.0.0.1:` và cấu hình firewall tương ứng.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` chỉ để tiện bootstrap, không thay thế cho cấu hình gateway đúng chuẩn. Vẫn cần đặt auth (`gateway.auth.token` hoặc password) và dùng cài đặt bind an toàn cho triển khai.

  </Step>

  <Step title="Các bước runtime Docker VM chia sẻ">
    Sử dụng hướng dẫn runtime chia sẻ cho luồng host Docker chung:

    - [Nhúng binaries cần thiết vào image](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build và khởi chạy](/install/docker-vm-runtime#build-and-launch)
    - [Cái gì lưu trữ ở đâu](/install/docker-vm-runtime#what-persists-where)
    - [Cập nhật](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Truy cập đặc thù Hetzner">
    Sau các bước build và khởi chạy chia sẻ, tunnel từ laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Mở:

    `http://127.0.0.1:18789/`

    Dán token gateway.

  </Step>
</Steps>

Bản đồ lưu trữ chia sẻ nằm trong [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Với các team ưa thích workflows hạ tầng-as-code, một thiết lập Terraform do cộng đồng duy trì cung cấp:

- Cấu hình Terraform module với quản lý trạng thái từ xa
- Cấp phát tự động qua cloud-init
- Script triển khai (bootstrap, deploy, backup/restore)
- Củng cố bảo mật (firewall, UFW, chỉ truy cập SSH)
- Cấu hình SSH tunnel cho truy cập gateway

**Repositories:**

- Hạ tầng: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Cấu hình Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Cách tiếp cận này bổ sung cho thiết lập Docker trên với triển khai có thể tái tạo, hạ tầng được kiểm soát phiên bản và khôi phục thảm họa tự động.

> **Lưu ý:** Do cộng đồng duy trì. Để báo lỗi hoặc đóng góp, xem các liên kết repository trên.

## Bước tiếp theo

- Thiết lập kênh nhắn tin: [Channels](/channels)
- Cấu hình Gateway: [Gateway configuration](/gateway/configuration)
- Giữ OpenClaw luôn cập nhật: [Updating](/install/updating)\n