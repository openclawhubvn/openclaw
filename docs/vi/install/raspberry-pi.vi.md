---
summary: "Tự host OpenClaw trên Raspberry Pi để chạy liên tục"
read_when:
  - Cài đặt OpenClaw trên Raspberry Pi
  - Chạy OpenClaw trên thiết bị ARM
  - Xây dựng AI cá nhân giá rẻ chạy liên tục
title: "Raspberry Pi"
---

# Raspberry Pi

Chạy OpenClaw Gateway liên tục trên Raspberry Pi. Pi chỉ đóng vai trò gateway (model chạy trên cloud qua API), nên ngay cả Pi cấu hình thấp cũng xử lý tốt.

## Yêu cầu

- Raspberry Pi 4 hoặc 5 với RAM 2 GB+ (khuyến nghị 4 GB)
- Thẻ MicroSD (16 GB+) hoặc USB SSD (hiệu năng tốt hơn)
- Nguồn điện chính hãng cho Pi
- Kết nối mạng (Ethernet hoặc WiFi)
- Raspberry Pi OS 64-bit (bắt buộc -- không dùng 32-bit)
- Khoảng 30 phút

## Cài đặt

<Steps>
  <Step title="Flash hệ điều hành">
    Dùng **Raspberry Pi OS Lite (64-bit)** -- không cần desktop cho server headless.

    1. Tải [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Chọn OS: **Raspberry Pi OS Lite (64-bit)**.
    3. Trong phần cài đặt, cấu hình trước:
       - Hostname: `gateway-host`
       - Bật SSH
       - Đặt username và password
       - Cấu hình WiFi (nếu không dùng Ethernet)
    4. Flash vào thẻ SD hoặc USB, cắm vào và khởi động Pi.

  </Step>

  <Step title="Kết nối qua SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Cập nhật hệ thống">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Đặt múi giờ (quan trọng cho cron và nhắc nhở)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Cài đặt Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Thêm swap (quan trọng cho 2 GB RAM hoặc ít hơn)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Giảm swappiness cho thiết bị ít RAM
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Cài đặt OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Chạy onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Làm theo hướng dẫn. Khuyến nghị dùng API keys thay vì OAuth cho thiết bị headless. Telegram là kênh dễ bắt đầu nhất.

  </Step>

  <Step title="Kiểm tra">
    ```bash
    openclaw status
    sudo systemctl status openclaw
    journalctl -u openclaw -f
    ```
  </Step>

  <Step title="Truy cập Control UI">
    Trên máy tính, lấy URL dashboard từ Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Sau đó tạo SSH tunnel trong terminal khác:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Mở URL đã in ra trong trình duyệt local. Để truy cập từ xa liên tục, xem [Tích hợp Tailscale](/gateway/tailscale).

  </Step>
</Steps>

## Mẹo cải thiện hiệu năng

**Dùng USB SSD** -- Thẻ SD chậm và dễ hỏng. USB SSD cải thiện hiệu năng đáng kể. Xem [hướng dẫn boot USB cho Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Bật compile cache cho module** -- Tăng tốc khi gọi CLI nhiều lần trên Pi cấu hình thấp:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Giảm sử dụng bộ nhớ** -- Với setup headless, giải phóng bộ nhớ GPU và tắt dịch vụ không dùng:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Khắc phục sự cố

**Thiếu bộ nhớ** -- Kiểm tra swap đã kích hoạt với `free -h`. Tắt dịch vụ không dùng (`sudo systemctl disable cups bluetooth avahi-daemon`). Chỉ dùng model qua API.

**Hiệu năng chậm** -- Dùng USB SSD thay vì thẻ SD. Kiểm tra CPU throttling với `vcgencmd get_throttled` (nên trả về `0x0`).

**Dịch vụ không khởi động** -- Kiểm tra log với `journalctl -u openclaw --no-pager -n 100` và chạy `openclaw doctor --non-interactive`.

**Vấn đề binary ARM** -- Nếu skill lỗi "exec format error", kiểm tra binary có build ARM64 không. Xác minh kiến trúc với `uname -m` (nên là `aarch64`).

**WiFi bị ngắt** -- Tắt quản lý nguồn WiFi: `sudo iwconfig wlan0 power off`.

## Bước tiếp theo

- [Channels](/channels) -- kết nối Telegram, WhatsApp, Discord, và nhiều hơn nữa
- [Cấu hình Gateway](/gateway/configuration) -- tất cả tùy chọn cấu hình
- [Cập nhật](/install/updating) -- giữ OpenClaw luôn mới nhất\n