---
summary: "Triển khai OpenClaw trên Oracle Cloud với gói Always Free ARM"
read_when:
  - Cài đặt OpenClaw trên Oracle Cloud
  - Tìm kiếm dịch vụ VPS miễn phí cho OpenClaw
  - Muốn chạy OpenClaw 24/7 trên máy chủ nhỏ
title: "Oracle Cloud"
---

# Oracle Cloud

Chạy OpenClaw Gateway liên tục trên gói **Always Free** ARM của Oracle Cloud (tối đa 4 OCPU, 24 GB RAM, 200 GB lưu trữ) mà không tốn phí.

## Yêu cầu

- Tài khoản Oracle Cloud ([đăng ký](https://www.oracle.com/cloud/free/)) -- xem [hướng dẫn đăng ký cộng đồng](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) nếu gặp vấn đề
- Tài khoản Tailscale (miễn phí tại [tailscale.com](https://tailscale.com))
- Cặp khóa SSH
- Khoảng 30 phút

## Thiết lập

<Steps>
  <Step title="Tạo một instance OCI">
    1. Đăng nhập vào [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Điều hướng đến **Compute > Instances > Create Instance**.
    3. Cấu hình:
       - **Tên:** `openclaw`
       - **Hình ảnh:** Ubuntu 24.04 (aarch64)
       - **Hình dạng:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (hoặc tối đa 4)
       - **Bộ nhớ:** 12 GB (hoặc tối đa 24 GB)
       - **Dung lượng khởi động:** 50 GB (tối đa 200 GB miễn phí)
       - **Khóa SSH:** Thêm khóa công khai của bạn
    4. Nhấn **Create** và ghi lại địa chỉ IP công khai.

    <Tip>
    Nếu tạo instance thất bại với thông báo "Out of capacity", thử một miền khả dụng khác hoặc thử lại sau. Dung lượng gói miễn phí có giới hạn.
    </Tip>

  </Step>

  <Step title="Kết nối và cập nhật hệ thống">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` cần thiết để biên dịch ARM cho một số phụ thuộc.

  </Step>

  <Step title="Cấu hình người dùng và hostname">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Kích hoạt linger để giữ các dịch vụ người dùng chạy sau khi đăng xuất.

  </Step>

  <Step title="Cài đặt Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Từ giờ, kết nối qua Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Cài đặt OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Khi được hỏi "How do you want to hatch your bot?", chọn **Do this later**.

  </Step>

  <Step title="Cấu hình gateway">
    Sử dụng xác thực token với Tailscale Serve để truy cập từ xa an toàn.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway
    ```

  </Step>

  <Step title="Bảo mật VCN">
    Chặn tất cả lưu lượng trừ Tailscale tại rìa mạng:

    1. Đi đến **Networking > Virtual Cloud Networks** trong OCI Console.
    2. Nhấp vào VCN của bạn, sau đó **Security Lists > Default Security List**.
    3. **Xóa** tất cả các quy tắc ingress trừ `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Giữ nguyên các quy tắc egress mặc định (cho phép tất cả outbound).

    Điều này chặn SSH trên cổng 22, HTTP, HTTPS và mọi thứ khác tại rìa mạng. Bạn chỉ có thể kết nối qua Tailscale từ thời điểm này.

  </Step>

  <Step title="Xác minh">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway
    tailscale serve status
    curl http://localhost:18789
    ```

    Truy cập Control UI từ bất kỳ thiết bị nào trên tailnet của bạn:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Thay `<tailnet-name>` bằng tên tailnet của bạn (có thể thấy trong `tailscale status`).

  </Step>
</Steps>

## Phương án dự phòng: SSH tunnel

Nếu Tailscale Serve không hoạt động, sử dụng SSH tunnel từ máy cục bộ của bạn:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Sau đó mở `http://localhost:18789`.

## Khắc phục sự cố

**Tạo instance thất bại ("Out of capacity")** -- Các instance ARM gói miễn phí rất phổ biến. Thử một miền khả dụng khác hoặc thử lại vào giờ thấp điểm.

**Tailscale không kết nối được** -- Chạy `sudo tailscale up --ssh --hostname=openclaw --reset` để xác thực lại.

**Gateway không khởi động được** -- Chạy `openclaw doctor --non-interactive` và kiểm tra log với `journalctl --user -u openclaw-gateway -n 50`.

**Vấn đề với binary ARM** -- Hầu hết các gói npm hoạt động trên ARM64. Đối với các binary gốc, tìm các bản phát hành `linux-arm64` hoặc `aarch64`. Kiểm tra kiến trúc với `uname -m`.

## Bước tiếp theo

- [Channels](/channels) -- kết nối Telegram, WhatsApp, Discord và nhiều hơn nữa
- [Cấu hình Gateway](/gateway/configuration) -- tất cả các tùy chọn cấu hình
- [Cập nhật](/install/updating) -- giữ OpenClaw luôn cập nhật
