---
summary: "Khám phá cách cài đặt OpenClaw Gateway trên VPS Hetzner giá rẻ, đảm bảo hoạt động 24/7 với Docker và tích hợp sẵn binary."
read_when:
  - Bạn muốn OpenClaw chạy 24/7 trên VPS đám mây (không phải laptop của bạn)
  - Bạn muốn một Gateway chất lượng sản xuất, luôn hoạt động trên VPS của riêng mình
  - Bạn muốn kiểm soát hoàn toàn về tính bền vững, các binary và hành vi khởi động lại
  - Bạn đang chạy OpenClaw trong Docker trên Hetzner hoặc nhà cung cấp tương tự
title: "Hướng Dẫn Cài Đặt OpenClaw Trên Hetzner"
---

# OpenClaw trên Hetzner (Docker, Hướng dẫn VPS sản xuất)

## Mục tiêu

Chạy một OpenClaw Gateway bền vững trên VPS của Hetzner sử dụng Docker, với trạng thái bền vững, nhúng sẵn các binary và hành vi khởi động lại an toàn.

Nếu bạn muốn "OpenClaw 24/7 với chi phí khoảng $5", đây là cấu hình đơn giản và đáng tin cậy nhất.
Giá của Hetzner có thể thay đổi; chọn VPS Debian/Ubuntu nhỏ nhất và nâng cấp nếu gặp vấn đề về bộ nhớ.

Nhắc nhở về mô hình bảo mật:

- Các agent chia sẻ trong công ty là ổn khi mọi người đều trong cùng một phạm vi tin cậy và runtime chỉ dành cho công việc.
- Giữ sự tách biệt nghiêm ngặt: VPS/runtime riêng + tài khoản riêng; không sử dụng hồ sơ cá nhân Apple/Google/trình duyệt/quản lý mật khẩu trên máy chủ đó.
- Nếu người dùng có thể gây hại cho nhau, hãy tách biệt theo gateway/host/người dùng hệ điều hành.

Xem [Bảo mật](/gateway/security) và [Lưu trữ VPS](/vps).

## Chúng ta đang làm gì (đơn giản)?

- Thuê một máy chủ Linux nhỏ (VPS Hetzner)
- Cài đặt Docker (runtime ứng dụng cách ly)
- Khởi động OpenClaw Gateway trong Docker
- Lưu trữ `~/.openclaw` + `~/.openclaw/workspace` trên máy chủ (tồn tại qua các lần khởi động lại/xây dựng lại)
- Truy cập giao diện điều khiển từ laptop của bạn qua SSH tunnel

Gateway có thể được truy cập qua:

- Chuyển tiếp cổng SSH từ laptop của bạn
- Tiếp xúc cổng trực tiếp nếu bạn tự quản lý firewall và token

Hướng dẫn này giả định sử dụng Ubuntu hoặc Debian trên Hetzner.  
Nếu bạn sử dụng VPS Linux khác, hãy điều chỉnh các gói tương ứng.
Đối với quy trình Docker chung, xem [Docker](/install/docker).

---

## Đường tắt (dành cho người vận hành có kinh nghiệm)

1. Cung cấp VPS Hetzner
2. Cài đặt Docker
3. Clone repository OpenClaw
4. Tạo thư mục lưu trữ bền vững trên máy chủ
5. Cấu hình `.env` và `docker-compose.yml`
6. Nhúng các binary cần thiết vào image
7. `docker compose up -d`
8. Xác minh tính bền vững và truy cập Gateway

---

## Bạn cần gì

- VPS Hetzner với quyền truy cập root
- Truy cập SSH từ laptop của bạn
- Thoải mái cơ bản với SSH + copy/paste
- Khoảng 20 phút
- Docker và Docker Compose
- Thông tin xác thực mô hình
- Thông tin xác thực nhà cung cấp tùy chọn
  - Mã QR WhatsApp
  - Token bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Cung cấp VPS">
    Tạo một VPS Ubuntu hoặc Debian trên Hetzner.

    Kết nối với quyền root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Hướng dẫn này giả định VPS là có trạng thái.
    Không coi nó là hạ tầng có thể vứt bỏ.

  </Step>

  <Step title="Cài đặt Docker (trên VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Xác minh:

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

    Hướng dẫn này giả định bạn sẽ xây dựng một image tùy chỉnh để đảm bảo tính bền vững của binary.

  </Step>

  <Step title="Tạo thư mục lưu trữ bền vững trên máy chủ">
    Các container Docker là tạm thời.
    Tất cả trạng thái lâu dài phải được lưu trên máy chủ.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Đặt quyền sở hữu cho người dùng container (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Cấu hình biến môi trường">
    Tạo `.env` trong thư mục gốc của repository.

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

    Tạo các secret mạnh:

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
          # Khuyến nghị: giữ Gateway chỉ trong loopback trên VPS; truy cập qua SSH tunnel.
          # Để công khai, loại bỏ tiền tố `127.0.0.1:` và cấu hình firewall tương ứng.
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

    `--allow-unconfigured` chỉ để tiện lợi khi khởi động, không thay thế cho cấu hình gateway đúng cách. Vẫn cần thiết lập xác thực (`gateway.auth.token` hoặc mật khẩu) và sử dụng cài đặt bind an toàn cho triển khai của bạn.

  </Step>

  <Step title="Các bước runtime Docker VM chia sẻ">
    Sử dụng hướng dẫn runtime chia sẻ cho quy trình Docker host chung:

    - [Nhúng các binary cần thiết vào image](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Xây dựng và khởi chạy](/install/docker-vm-runtime#build-and-launch)
    - [Những gì tồn tại ở đâu](/install/docker-vm-runtime#what-persists-where)
    - [Cập nhật](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Truy cập đặc thù Hetzner">
    Sau các bước xây dựng và khởi chạy chia sẻ, tạo tunnel từ laptop của bạn:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Mở:

    `http://127.0.0.1:18789/`

    Dán token gateway của bạn.

  </Step>
</Steps>

Bản đồ lưu trữ chia sẻ nằm trong [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where).

## Hạ tầng dưới dạng mã (Terraform)

Đối với các nhóm ưa thích quy trình làm việc hạ tầng dưới dạng mã, một thiết lập Terraform do cộng đồng duy trì cung cấp:

- Cấu hình Terraform module với quản lý trạng thái từ xa
- Cung cấp tự động qua cloud-init
- Kịch bản triển khai (khởi động, triển khai, sao lưu/khôi phục)
- Tăng cường bảo mật (firewall, UFW, chỉ truy cập SSH)
- Cấu hình SSH tunnel để truy cập gateway

**Kho lưu trữ:**

- Hạ tầng: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Cấu hình Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Cách tiếp cận này bổ sung cho thiết lập Docker ở trên với các triển khai có thể tái tạo, hạ tầng được kiểm soát phiên bản và khôi phục thảm họa tự động.

> **Lưu ý:** Được duy trì bởi cộng đồng. Đối với các vấn đề hoặc đóng góp, xem các liên kết kho lưu trữ ở trên.

## Bước tiếp theo

- Thiết lập các kênh nhắn tin: [Channels](/channels)
- Cấu hình Gateway: [Cấu hình Gateway](/gateway/configuration)
- Giữ OpenClaw luôn cập nhật: [Cập nhật](/install/updating)
