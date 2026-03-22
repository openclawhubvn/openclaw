---
summary: "Tìm hiểu cách triển khai OpenClaw trên DigitalOcean Droplet nhanh chóng và hiệu quả. Tối ưu hóa hệ thống của bạn ngay hôm nay."
read_when:
  - Cài đặt OpenClaw trên DigitalOcean
  - Tìm kiếm VPS trả phí đơn giản cho OpenClaw
title: "Hướng Dẫn Cài Đặt OpenClaw Trên DigitalOcean"
---

# DigitalOcean

Chạy OpenClaw Gateway liên tục trên DigitalOcean Droplet.

## Yêu cầu

- Tài khoản DigitalOcean ([đăng ký](https://cloud.digitalocean.com/registrations/new))
- Cặp khóa SSH (hoặc sẵn sàng sử dụng xác thực bằng mật khẩu)
- Khoảng 20 phút

## Thiết lập

<Steps>
  <Step title="Tạo Droplet">
    <Warning>
    Sử dụng hình ảnh cơ bản sạch (Ubuntu 24.04 LTS). Tránh sử dụng hình ảnh 1-click từ Marketplace bên thứ ba trừ khi đã kiểm tra kỹ script khởi động và cấu hình tường lửa mặc định.
    </Warning>

    1. Đăng nhập vào [DigitalOcean](https://cloud.digitalocean.com/).
    2. Nhấp vào **Create > Droplets**.
    3. Chọn:
       - **Region:** Gần bạn nhất
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** Khóa SSH (khuyến nghị) hoặc mật khẩu
    4. Nhấp vào **Create Droplet** và ghi lại địa chỉ IP.

  </Step>

  <Step title="Kết nối và cài đặt">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Cài đặt Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Cài đặt OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Chạy onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Trình hướng dẫn sẽ dẫn bạn qua các bước xác thực mô hình, thiết lập kênh, tạo token gateway và cài đặt daemon (systemd).

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

  <Step title="Xác minh gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Truy cập Control UI">
    Gateway mặc định kết nối với loopback. Chọn một trong các tùy chọn sau.

    **Tùy chọn A: SSH tunnel (đơn giản nhất)**

    ```bash
    # Từ máy tính của bạn
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Sau đó mở `http://localhost:18789`.

    **Tùy chọn B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Sau đó mở `https://<magicdns>/` từ bất kỳ thiết bị nào trên tailnet của bạn.

    **Tùy chọn C: Tailnet bind (không dùng Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Sau đó mở `http://<tailscale-ip>:18789` (cần token).

  </Step>
</Steps>

## Khắc phục sự cố

**Gateway không khởi động** -- Chạy `openclaw doctor --non-interactive` và kiểm tra log với `journalctl --user -u openclaw-gateway.service -n 50`.

**Cổng đã được sử dụng** -- Chạy `lsof -i :18789` để tìm tiến trình, sau đó dừng nó.

**Thiếu bộ nhớ** -- Kiểm tra swap đã hoạt động với `free -h`. Nếu vẫn gặp lỗi OOM, sử dụng mô hình dựa trên API (Claude, GPT) thay vì mô hình cục bộ, hoặc nâng cấp lên Droplet 2 GB.

## Bước tiếp theo

- [Channels](/channels) -- kết nối Telegram, WhatsApp, Discord và nhiều hơn nữa
- [Cấu hình Gateway](/gateway/configuration) -- tất cả tùy chọn cấu hình
- [Cập nhật](/install/updating) -- giữ OpenClaw luôn cập nhật
