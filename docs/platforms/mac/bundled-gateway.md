---
summary: "Chạy Gateway trên macOS (dịch vụ launchd bên ngoài)"
read_when:
  - Đóng gói OpenClaw.app
  - Gỡ lỗi dịch vụ launchd gateway trên macOS
  - Cài đặt gateway CLI cho macOS
title: "Gateway trên macOS"
---

# Gateway trên macOS (dịch vụ launchd bên ngoài)

OpenClaw.app không còn tích hợp Node/Bun hay runtime Gateway. Ứng dụng macOS yêu cầu cài đặt CLI `openclaw` **bên ngoài**, không khởi chạy Gateway như một tiến trình con, và quản lý một dịch vụ launchd cho từng người dùng để giữ Gateway hoạt động (hoặc kết nối với Gateway cục bộ nếu đã chạy).

## Cài đặt CLI (cần thiết cho chế độ cục bộ)

Node 24 là runtime mặc định trên Mac. Node 22 LTS, hiện tại là `22.16+`, vẫn hoạt động để tương thích. Sau đó, cài đặt `openclaw` toàn cầu:

```bash
npm install -g openclaw@<version>
```

Nút **Cài đặt CLI** của ứng dụng macOS thực hiện cùng quy trình qua npm/pnpm (không khuyến nghị dùng bun cho runtime Gateway).

## Launchd (Gateway như LaunchAgent)

Nhãn:

- `ai.openclaw.gateway` (hoặc `ai.openclaw.<profile>`; có thể còn `com.openclaw.*` cũ)

Vị trí Plist (theo người dùng):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (hoặc `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Quản lý:

- Ứng dụng macOS sở hữu việc cài đặt/cập nhật LaunchAgent trong chế độ cục bộ.
- CLI cũng có thể cài đặt: `openclaw gateway install`.

Hành vi:

- “OpenClaw Active” bật/tắt LaunchAgent.
- Thoát ứng dụng **không** dừng gateway (launchd giữ nó hoạt động).
- Nếu Gateway đã chạy trên cổng cấu hình, ứng dụng sẽ kết nối thay vì khởi chạy mới.

Ghi log:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## Tương thích phiên bản

Ứng dụng macOS kiểm tra phiên bản gateway so với phiên bản của nó. Nếu không tương thích, cập nhật CLI toàn cầu để khớp với phiên bản ứng dụng.

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
```
