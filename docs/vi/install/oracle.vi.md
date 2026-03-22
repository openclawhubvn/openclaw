# Oracle Cloud

Chạy OpenClaw Gateway liên tục trên Oracle Cloud's **Always Free** ARM tier (tối đa 4 OCPU, 24 GB RAM, 200 GB storage) mà không tốn phí.

## Yêu cầu

- Tài khoản Oracle Cloud ([đăng ký](https://www.oracle.com/cloud/free/)) -- xem [hướng dẫn đăng ký cộng đồng](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) nếu gặp vấn đề
- Tài khoản Tailscale (miễn phí tại [tailscale.com](https://tailscale.com))
- Cặp khóa SSH
- Khoảng 30 phút

## Thiết lập

<Steps>
  <Step title="Tạo một OCI instance">
    1. Đăng nhập vào [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Điều hướng đến **Compute > Instances > Create Instance**.
    3. Cấu hình:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (hoặc tối đa 4)
       - **Memory:** 12 GB (hoặc tối đa 24 GB)
       - **Boot volume:** 50 GB (tối đa 200 GB miễn phí)
       - **SSH key:** Thêm public key
    4. Nhấn **Create** và ghi lại địa chỉ IP công cộng.

    <Tip>
    Nếu tạo instance thất bại với lỗi "Out of capacity", thử một availability domain khác hoặc thử lại sau. Dung lượng free tier có giới hạn.
    </Tip>

  </Step>

  <Step title="Kết nối và cập nhật hệ thống">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` cần thiết để biên dịch ARM cho một số dependency.

  </Step>

  <Step title="Cấu hình user và hostname">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Bật linger để giữ các dịch vụ user chạy sau khi logout.

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
    Dùng token auth với Tailscale Serve để truy cập từ xa an toàn.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway
    ```

  </Step>

  <Step title="Siết chặt bảo mật VCN">
    Chặn mọi traffic trừ Tailscale ở rìa mạng:

    1. Vào **Networking > Virtual Cloud Networks** trong OCI Console.
    2. Nhấp vào VCN của bạn, sau đó **Security Lists > Default Security List**.
    3. **Xóa** tất cả ingress rules trừ `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Giữ nguyên egress rules mặc định (cho phép tất cả outbound).

    Điều này chặn SSH trên port 22, HTTP, HTTPS và mọi thứ khác ở rìa mạng. Chỉ có thể kết nối qua Tailscale từ giờ.

  </Step>

  <Step title="Kiểm tra">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway
    tailscale serve status
    curl http://localhost:18789
    ```

    Truy cập Control UI từ bất kỳ thiết bị nào trên tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Thay `<tailnet-name>` bằng tên tailnet của bạn (hiển thị trong `tailscale status`).

  </Step>
</Steps>

## Phương án dự phòng: SSH tunnel

Nếu Tailscale Serve không hoạt động, dùng SSH tunnel từ máy local:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Sau đó mở `http://localhost:18789`.

## Khắc phục sự cố

**Tạo instance thất bại ("Out of capacity")** -- Các instance ARM free tier rất phổ biến. Thử một availability domain khác hoặc thử lại vào giờ thấp điểm.

**Tailscale không kết nối** -- Chạy `sudo tailscale up --ssh --hostname=openclaw --reset` để xác thực lại.

**Gateway không khởi động** -- Chạy `openclaw doctor --non-interactive` và kiểm tra log với `journalctl --user -u openclaw-gateway -n 50`.

**Vấn đề binary ARM** -- Hầu hết npm package hoạt động trên ARM64. Với binary native, tìm các bản phát hành `linux-arm64` hoặc `aarch64`. Kiểm tra kiến trúc với `uname -m`.

## Bước tiếp theo

- [Channels](/channels) -- kết nối Telegram, WhatsApp, Discord và nhiều hơn nữa
- [Gateway configuration](/gateway/configuration) -- tất cả tùy chọn cấu hình
- [Updating](/install/updating) -- giữ OpenClaw luôn cập nhật\n