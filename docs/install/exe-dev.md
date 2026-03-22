---
summary: "Cài đặt OpenClaw Gateway trên exe.dev để truy cập từ xa qua VM và proxy HTTPS. Hướng dẫn chi tiết từng bước."
read_when:
  - Bạn cần một máy chủ Linux luôn hoạt động với chi phí thấp cho Gateway
  - Bạn muốn truy cập Control UI từ xa mà không cần chạy VPS riêng
title: "Hướng Dẫn Cài Đặt OpenClaw Trên exe.dev"
---

# exe.dev

Mục tiêu: Chạy OpenClaw Gateway trên một VM của exe.dev, có thể truy cập từ laptop qua: `https://<vm-name>.exe.xyz`

Trang này giả định bạn đang sử dụng image mặc định **exeuntu** của exe.dev. Nếu chọn distro khác, hãy điều chỉnh các gói tương ứng.

## Lộ trình nhanh cho người mới bắt đầu

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Điền khóa xác thực/token khi cần
3. Nhấp vào "Agent" bên cạnh VM và chờ Shelley hoàn tất việc cung cấp
4. Mở `https://<vm-name>.exe.xyz/` và dán token gateway để xác thực
5. Phê duyệt các yêu cầu ghép nối thiết bị đang chờ với `openclaw devices approve <requestId>`

## Những gì bạn cần

- Tài khoản exe.dev
- Quyền truy cập `ssh exe.dev` vào máy ảo [exe.dev](https://exe.dev) (tùy chọn)

## Cài đặt tự động với Shelley

Shelley, agent của [exe.dev](https://exe.dev), có thể cài đặt OpenClaw ngay lập tức với prompt của chúng tôi. Prompt sử dụng như sau:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Cài đặt thủ công

## 1) Tạo VM

Từ thiết bị của bạn:

```bash
ssh exe.dev new
```

Sau đó kết nối:

```bash
ssh <vm-name>.exe.xyz
```

Mẹo: giữ VM này ở trạng thái **stateful**. OpenClaw lưu trữ trạng thái dưới `~/.openclaw/` và `~/.openclaw/workspace/`.

## 2) Cài đặt các gói cần thiết (trên VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Cài đặt OpenClaw

Chạy script cài đặt OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Cấu hình nginx để proxy OpenClaw đến cổng 8000

Chỉnh sửa `/etc/nginx/sites-enabled/default` với

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # Hỗ trợ WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Header proxy tiêu chuẩn
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cài đặt timeout cho kết nối dài
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

## 5) Truy cập OpenClaw và cấp quyền

Truy cập `https://<vm-name>.exe.xyz/` (xem output Control UI từ onboarding). Nếu yêu cầu xác thực, dán token từ `gateway.auth.token` trên VM (lấy bằng `openclaw config get gateway.auth.token`, hoặc tạo một token mới với `openclaw doctor --generate-gateway-token`). Phê duyệt thiết bị với `openclaw devices list` và `openclaw devices approve <requestId>`. Khi gặp khó khăn, hãy sử dụng Shelley từ trình duyệt của bạn!

## Truy cập từ xa

Truy cập từ xa được xử lý bởi xác thực của [exe.dev](https://exe.dev). Mặc định, lưu lượng HTTP từ cổng 8000 được chuyển tiếp đến `https://<vm-name>.exe.xyz` với xác thực email.

## Cập nhật

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Hướng dẫn: [Cập nhật](/install/updating)
