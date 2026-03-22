# Linux Server

Chạy OpenClaw Gateway trên bất kỳ server Linux hoặc cloud VPS nào. Trang này giúp chọn provider, giải thích cách triển khai trên cloud và hướng dẫn tối ưu hóa Linux chung.

## Chọn provider

<CardGroup cols={2}>
  <Card title="Railway" href="/install/railway">Thiết lập một-click qua trình duyệt</Card>
  <Card title="Northflank" href="/install/northflank">Thiết lập một-click qua trình duyệt</Card>
  <Card title="DigitalOcean" href="/install/digitalocean">VPS trả phí đơn giản</Card>
  <Card title="Oracle Cloud" href="/install/oracle">Luôn miễn phí ARM tier</Card>
  <Card title="Fly.io" href="/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/install/hetzner">Docker trên Hetzner VPS</Card>
  <Card title="GCP" href="/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/install/exe-dev">VM với HTTPS proxy</Card>
  <Card title="Raspberry Pi" href="/install/raspberry-pi">ARM tự host</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** cũng hoạt động tốt. Video hướng dẫn cộng đồng có tại [x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547) (nguồn cộng đồng - có thể không còn khả dụng).

## Cách hoạt động của triển khai cloud

- **Gateway chạy trên VPS** và quản lý state + workspace.
- Kết nối từ laptop hoặc điện thoại qua **Control UI** hoặc **Tailscale/SSH**.
- Xem VPS là nguồn dữ liệu chính và **backup** state + workspace thường xuyên.
- Mặc định an toàn: giữ Gateway trên loopback và truy cập qua SSH tunnel hoặc Tailscale Serve. Nếu bind vào `lan` hoặc `tailnet`, yêu cầu `gateway.auth.token` hoặc `gateway.auth.password`.

Trang liên quan: [Gateway remote access](/gateway/remote), [Platforms hub](/platforms).

## Agent công ty dùng chung trên VPS

Chạy một agent cho cả team là hợp lý khi mọi người dùng chung một môi trường tin cậy và agent chỉ phục vụ công việc.

- Giữ trên runtime riêng (VPS/VM/container + OS user/accounts riêng).
- Không đăng nhập runtime vào tài khoản Apple/Google cá nhân hoặc profile trình duyệt/quản lý mật khẩu cá nhân.
- Nếu người dùng có thể gây hại lẫn nhau, tách biệt theo gateway/host/OS user.

Chi tiết mô hình bảo mật: [Security](/gateway/security).

## Sử dụng nodes với VPS

Có thể giữ Gateway trên cloud và ghép **nodes** trên thiết bị local (Mac/iOS/Android/headless). Nodes cung cấp khả năng màn hình/camera/canvas local và `system.run` trong khi Gateway vẫn ở cloud.

Tài liệu: [Nodes](/nodes), [Nodes CLI](/cli/nodes).

## Tối ưu hóa khởi động cho VM nhỏ và host ARM

Nếu lệnh CLI chạy chậm trên VM yếu (hoặc host ARM), bật cache biên dịch module của Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` cải thiện thời gian khởi động lệnh lặp lại.
- `OPENCLAW_NO_RESPAWN=1` tránh overhead khởi động từ đường tự khởi động lại.
- Lệnh đầu tiên chạy sẽ làm ấm cache; các lần chạy sau nhanh hơn.
- Chi tiết cho Raspberry Pi, xem [Raspberry Pi](/install/raspberry-pi).

### Danh sách kiểm tra tối ưu hóa systemd (tùy chọn)

Với host VM dùng `systemd`, cân nhắc:

- Thêm biến môi trường cho đường khởi động ổn định:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Giữ hành vi khởi động lại rõ ràng:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Ưu tiên ổ đĩa SSD cho đường dẫn state/cache để giảm thiểu độ trễ I/O ngẫu nhiên khi khởi động lạnh.

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

Cách `Restart=` giúp tự động khôi phục dịch vụ: [systemd có thể tự động khôi phục dịch vụ](https://www.redhat.com/en/blog/systemd-automate-recovery).\n