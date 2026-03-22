---
summary: "Truy cập và xác thực Gateway dashboard (Control UI)"
read_when:
  - Thay đổi chế độ xác thực hoặc phơi bày dashboard
title: "Dashboard"
---

# Dashboard (Control UI)

Gateway dashboard là Control UI trên trình duyệt, mặc định chạy tại `/` (có thể thay đổi với `gateway.controlUi.basePath`).

Mở nhanh (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))

Tham khảo chính:

- [Control UI](/web/control-ui) để biết cách dùng và khả năng UI.
- [Tailscale](/gateway/tailscale) cho tự động hóa Serve/Funnel.
- [Web surfaces](/web) cho chế độ bind và lưu ý bảo mật.

Xác thực thực hiện tại WebSocket handshake qua `connect.params.auth` (token hoặc password). Xem `gateway.auth` trong [Gateway configuration](/gateway/configuration).

Lưu ý bảo mật: Control UI là **admin surface** (chat, config, exec approvals). Không phơi bày công khai. UI giữ token URL dashboard trong sessionStorage cho phiên tab trình duyệt hiện tại và URL gateway đã chọn, và xóa khỏi URL sau khi tải. Ưu tiên dùng localhost, Tailscale Serve, hoặc SSH tunnel.

## Fast path (khuyến nghị)

- Sau onboarding, CLI tự động mở dashboard và in ra link sạch (không có token).
- Mở lại bất kỳ lúc nào: `openclaw dashboard` (sao chép link, mở trình duyệt nếu có thể, hiển thị gợi ý SSH nếu headless).
- Nếu UI yêu cầu xác thực, dán token từ `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`) vào cài đặt Control UI.

## Token cơ bản (local vs remote)

- **Localhost**: mở `http://127.0.0.1:18789/`.
- **Nguồn token**: `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` có thể truyền qua URL fragment cho bootstrap một lần, và Control UI giữ trong sessionStorage cho phiên tab trình duyệt hiện tại và URL gateway đã chọn thay vì localStorage.
- Nếu `gateway.auth.token` được quản lý bởi SecretRef, `openclaw dashboard` in/sao chép/mở URL không có token theo thiết kế. Điều này tránh phơi bày token được quản lý bên ngoài trong shell logs, clipboard history, hoặc browser-launch arguments.
- Nếu `gateway.auth.token` được cấu hình là SecretRef và chưa được giải quyết trong shell hiện tại, `openclaw dashboard` vẫn in URL không có token cùng hướng dẫn thiết lập xác thực có thể thực hiện.
- **Không phải localhost**: dùng Tailscale Serve (không cần token cho Control UI/WebSocket nếu `gateway.auth.allowTailscale: true`, giả định host gateway tin cậy; HTTP APIs vẫn cần token/password), tailnet bind với token, hoặc SSH tunnel. Xem [Web surfaces](/web).

## Nếu thấy "unauthorized" / 1008

- Đảm bảo gateway có thể truy cập (local: `openclaw status`; remote: SSH tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host` rồi mở `http://127.0.0.1:18789/`).
- Với `AUTH_TOKEN_MISMATCH`, client có thể thử lại một lần với token thiết bị đã cache khi gateway trả về gợi ý retry. Nếu xác thực vẫn thất bại sau retry, tự xử lý token drift.
- Để sửa token drift, làm theo [Token drift recovery checklist](/cli/devices#token-drift-recovery-checklist).
- Lấy hoặc cung cấp token từ host gateway:
  - Cấu hình plaintext: `openclaw config get gateway.auth.token`
  - Cấu hình SecretRef-managed: giải quyết secret provider bên ngoài hoặc export `OPENCLAW_GATEWAY_TOKEN` trong shell này, rồi chạy lại `openclaw dashboard`
  - Không có token cấu hình: `openclaw doctor --generate-gateway-token`
- Trong cài đặt dashboard, dán token vào trường xác thực, rồi kết nối.\n