# Gateway trên macOS (external launchd)

OpenClaw.app không còn tích hợp Node/Bun hay Gateway runtime. App trên macOS yêu cầu cài đặt CLI `openclaw` **bên ngoài**, không chạy Gateway như một child process, và quản lý một dịch vụ launchd cho từng người dùng để giữ Gateway chạy (hoặc kết nối với Gateway local nếu đã chạy sẵn).

## Cài đặt CLI (bắt buộc cho chế độ local)

Node 24 là runtime mặc định trên Mac. Node 22 LTS, hiện tại là `22.16+`, vẫn hoạt động để tương thích. Cài đặt `openclaw` toàn cục:

```bash
npm install -g openclaw@<version>
```

Nút **Install CLI** của app macOS chạy cùng quy trình qua npm/pnpm (không khuyến nghị dùng bun cho Gateway runtime).

## Launchd (Gateway như LaunchAgent)

Label:

- `ai.openclaw.gateway` (hoặc `ai.openclaw.<profile>`; legacy `com.openclaw.*` có thể vẫn còn)

Vị trí Plist (theo người dùng):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (hoặc `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Quản lý:

- App macOS quản lý cài đặt/cập nhật LaunchAgent ở chế độ Local.
- CLI cũng có thể cài đặt: `openclaw gateway install`.

Hành vi:

- “OpenClaw Active” bật/tắt LaunchAgent.
- Thoát app **không** dừng gateway (launchd giữ nó chạy).
- Nếu Gateway đã chạy trên cổng cấu hình, app kết nối thay vì khởi động mới.

Logging:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## Tương thích phiên bản

App macOS kiểm tra phiên bản gateway với phiên bản của nó. Nếu không tương thích, cập nhật CLI toàn cục để khớp với phiên bản app.

## Kiểm tra nhanh

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Sau đó:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```\n