---
summary: "Host OpenClaw trên DigitalOcean Droplet"
read_when:
  - Cài đặt OpenClaw trên DigitalOcean
  - Tìm VPS trả phí đơn giản cho OpenClaw
title: "DigitalOcean"
---

# DigitalOcean

Chạy OpenClaw Gateway liên tục trên DigitalOcean Droplet.

## Yêu cầu

- Tài khoản DigitalOcean ([đăng ký](https://cloud.digitalocean.com/registrations/new))
- Cặp khóa SSH (hoặc sẵn sàng dùng xác thực mật khẩu)
- Khoảng 20 phút

## Cài đặt

<Steps>
  <Step title="Tạo Droplet">
    <Warning>
    Dùng image gốc sạch (Ubuntu 24.04 LTS). Tránh dùng image 1-click từ Marketplace bên thứ ba trừ khi đã kiểm tra script khởi động và cấu hình firewall mặc định.
    </Warning>

    1. Đăng nhập [DigitalOcean](https://cloud.digitalocean.com/).
    2. Nhấn **Create > Droplets**.
    3. Chọn:
       - **Region:** Gần nhất
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH key (khuyến nghị) hoặc mật khẩu
    4. Nhấn **Create Droplet** và ghi lại địa chỉ IP.

  </Step>

  <Step title="Kết nối và cài đặt">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Cài Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Cài OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Chạy onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Wizard sẽ hướng dẫn qua các bước xác thực model, thiết lập channel, tạo token gateway và cài daemon (systemd).

  </Step>

  <Step title="Thêm swap (khuyến nghị cho Droplet 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Kiểm tra gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Truy cập Control UI">
    Gateway mặc định bind vào loopback. Chọn một trong các cách sau.

    **Cách A: SSH tunnel (đơn giản nhất)**

    ```bash
    # Từ máy local
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Sau đó mở `http://localhost:18789`.

    **Cách B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Sau đó mở `https://<magicdns>/` từ bất kỳ thiết bị nào trên tailnet.

    **Cách C: Tailnet bind (không Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Sau đó mở `http://<tailscale-ip>:18789` (cần token).

  </Step>
</Steps>

## Khắc phục sự cố

**Gateway không khởi động** -- Chạy `openclaw doctor --non-interactive` và kiểm tra log với `journalctl --user -u openclaw-gateway.service -n 50`.

**Port đã được sử dụng** -- Chạy `lsof -i :18789` để tìm process, sau đó dừng nó.

**Hết bộ nhớ** -- Kiểm tra swap đã kích hoạt với `free -h`. Nếu vẫn gặp OOM, dùng model API-based (Claude, GPT) thay vì model local, hoặc nâng cấp lên Droplet 2 GB.

## Bước tiếp theo

- [Channels](/channels) -- kết nối Telegram, WhatsApp, Discord và nhiều hơn nữa
- [Gateway configuration](/gateway/configuration) -- tất cả tùy chọn cấu hình
- [Updating](/install/updating) -- giữ OpenClaw luôn cập nhật\n