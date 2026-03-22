---
summary: "Tìm hiểu cách chọn nhà cung cấp, cấu hình và tối ưu hóa máy chủ Linux để chạy OpenClaw hiệu quả."
read_when:
  - Muốn chạy Gateway trên máy chủ Linux hoặc VPS đám mây
  - Cần bản đồ nhanh về hướng dẫn hosting
  - Muốn tối ưu hóa máy chủ Linux chung cho OpenClaw
title: "Hướng Dẫn Cài Đặt OpenClaw Trên VPS Linux"
sidebarTitle: "Máy chủ Linux"
---

# Máy chủ Linux

Chạy OpenClaw Gateway trên bất kỳ máy chủ Linux hoặc VPS đám mây nào. Trang này giúp chọn nhà cung cấp, giải thích cách triển khai đám mây hoạt động và bao gồm tối ưu hóa Linux chung áp dụng mọi nơi.

## Chọn nhà cung cấp

<CardGroup cols={2}>
  <Card title="Railway" href="/install/railway">Thiết lập một lần nhấp, qua trình duyệt</Card>
  <Card title="Northflank" href="/install/northflank">Thiết lập một lần nhấp, qua trình duyệt</Card>
  <Card title="DigitalOcean" href="/install/digitalocean">VPS trả phí đơn giản</Card>
  <Card title="Oracle Cloud" href="/install/oracle">Tầng ARM miễn phí mãi mãi</Card>
  <Card title="Fly.io" href="/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/install/hetzner">Docker trên Hetzner VPS</Card>
  <Card title="GCP" href="/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/install/exe-dev">VM với proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/install/raspberry-pi">Tự host ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** cũng hoạt động tốt. Có video hướng dẫn cộng đồng tại [x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547) (nguồn cộng đồng — có thể không còn khả dụng).

## Cách triển khai đám mây hoạt động

- **Gateway chạy trên VPS** và quản lý trạng thái + workspace.
- Kết nối từ laptop hoặc điện thoại qua **Control UI** hoặc **Tailscale/SSH**.
- Xem VPS như nguồn dữ liệu chính và **sao lưu** trạng thái + workspace thường xuyên.
- Mặc định an toàn: giữ Gateway trên loopback và truy cập qua SSH tunnel hoặc Tailscale Serve. Nếu kết nối với `lan` hoặc `tailnet`, yêu cầu `gateway.auth.token` hoặc `gateway.auth.password`.

Trang liên quan: [Truy cập từ xa Gateway](/gateway/remote), [Trung tâm nền tảng](/platforms).

## Agent công ty dùng chung trên VPS

Chạy một agent duy nhất cho một nhóm là cấu hình hợp lý khi mọi người dùng đều trong cùng một phạm vi tin cậy và agent chỉ phục vụ cho công việc.

- Giữ nó trên một runtime riêng biệt (VPS/VM/container + người dùng/hệ điều hành riêng biệt).
- Không đăng nhập runtime đó vào tài khoản Apple/Google cá nhân hoặc hồ sơ trình duyệt/quản lý mật khẩu cá nhân.
- Nếu người dùng có mâu thuẫn với nhau, tách biệt theo gateway/host/người dùng hệ điều hành.

Chi tiết mô hình bảo mật: [Bảo mật](/gateway/security).

## Sử dụng nodes với VPS

Có thể giữ Gateway trên đám mây và ghép nối **nodes** trên thiết bị cục bộ (Mac/iOS/Android/headless). Nodes cung cấp khả năng màn hình/camera/canvas cục bộ và `system.run` trong khi Gateway vẫn ở trên đám mây.

Tài liệu: [Nodes](/nodes), [Nodes CLI](/cli/nodes).

## Tối ưu hóa khởi động cho VM nhỏ và máy chủ ARM

Nếu lệnh CLI chạy chậm trên VM công suất thấp (hoặc máy chủ ARM), hãy bật bộ nhớ đệm biên dịch module của Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` cải thiện thời gian khởi động lệnh lặp lại.
- `OPENCLAW_NO_RESPAWN=1` tránh chi phí khởi động thêm từ đường dẫn tự khởi động lại.
- Lệnh đầu tiên chạy sẽ làm ấm bộ nhớ đệm; các lần chạy sau sẽ nhanh hơn.
- Đối với chi tiết cụ thể của Raspberry Pi, xem [Raspberry Pi](/install/raspberry-pi).

### Danh sách kiểm tra tối ưu hóa systemd (tùy chọn)

Đối với máy chủ VM sử dụng `systemd`, hãy xem xét:

- Thêm biến môi trường dịch vụ cho đường dẫn khởi động ổn định:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Giữ hành vi khởi động lại rõ ràng:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Ưu tiên đĩa hỗ trợ SSD cho đường dẫn trạng thái/bộ nhớ đệm để giảm thiểu chi phí khởi động lạnh I/O ngẫu nhiên.

Ví dụ:

```bash
sudo systemctl edit openclaw
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Cách chính sách `Restart=` giúp tự động khôi phục: [systemd có thể tự động khôi phục dịch vụ](https://www.redhat.com/en/blog/systemd-automate-recovery).
