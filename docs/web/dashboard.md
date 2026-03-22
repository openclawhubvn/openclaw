---
summary: "Tìm hiểu cách truy cập và xác thực Dashboard Gateway dễ dàng, tối ưu hóa quản lý hệ thống của bạn."
read_when:
  - Thay đổi chế độ xác thực hoặc phơi bày dashboard
title: "Hướng Dẫn Cấu Hình Dashboard Gateway"
---

# Dashboard (Control UI)

Dashboard Gateway là giao diện điều khiển trên trình duyệt, mặc định được phục vụ tại `/` (có thể thay đổi với `gateway.controlUi.basePath`).

Mở nhanh (Gateway cục bộ):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))

Tham khảo chính:

- [Control UI](/web/control-ui) để biết cách sử dụng và khả năng của giao diện.
- [Tailscale](/gateway/tailscale) để tự động hóa Serve/Funnel.
- [Web surfaces](/web) cho các chế độ kết nối và ghi chú bảo mật.

Xác thực được thực hiện tại bước bắt tay WebSocket qua `connect.params.auth` (token hoặc mật khẩu). Xem `gateway.auth` trong [Cấu hình Gateway](/gateway/configuration).

Lưu ý bảo mật: Control UI là một **bề mặt quản trị** (chat, cấu hình, phê duyệt thực thi). Không nên phơi bày công khai. Giao diện giữ token URL dashboard trong sessionStorage cho phiên tab trình duyệt hiện tại và URL gateway đã chọn, và loại bỏ chúng khỏi URL sau khi tải. Nên sử dụng localhost, Tailscale Serve, hoặc một SSH tunnel.

## Đường dẫn nhanh (khuyến nghị)

- Sau khi onboard, CLI tự động mở dashboard và in ra một liên kết sạch (không chứa token).
- Mở lại bất kỳ lúc nào: `openclaw dashboard` (sao chép liên kết, mở trình duyệt nếu có thể, hiển thị gợi ý SSH nếu không có giao diện).
- Nếu giao diện yêu cầu xác thực, dán token từ `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`) vào cài đặt Control UI.

## Cơ bản về token (cục bộ vs từ xa)

- **Localhost**: mở `http://127.0.0.1:18789/`.
- **Nguồn token**: `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` có thể truyền nó qua URL fragment cho khởi động một lần, và Control UI giữ nó trong sessionStorage cho phiên tab trình duyệt hiện tại và URL gateway đã chọn thay vì localStorage.
- Nếu `gateway.auth.token` được quản lý bởi SecretRef, `openclaw dashboard` sẽ in/sao chép/mở một URL không chứa token theo thiết kế. Điều này tránh phơi bày token được quản lý bên ngoài trong nhật ký shell, lịch sử clipboard, hoặc các tham số khởi động trình duyệt.
- Nếu `gateway.auth.token` được cấu hình như một SecretRef và chưa được giải quyết trong shell hiện tại, `openclaw dashboard` vẫn in ra một URL không chứa token cùng với hướng dẫn thiết lập xác thực có thể thực hiện.
- **Không phải localhost**: sử dụng Tailscale Serve (không cần token cho Control UI/WebSocket nếu `gateway.auth.allowTailscale: true`, giả định máy chủ gateway đáng tin cậy; các API HTTP vẫn cần token/mật khẩu), kết nối tailnet với token, hoặc một SSH tunnel. Xem [Web surfaces](/web).

## Nếu thấy "unauthorized" / 1008

- Đảm bảo gateway có thể truy cập được (cục bộ: `openclaw status`; từ xa: SSH tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host` sau đó mở `http://127.0.0.1:18789/`).
- Với `AUTH_TOKEN_MISMATCH`, các client có thể thực hiện một lần thử lại đáng tin cậy với token thiết bị đã lưu khi gateway trả về gợi ý thử lại. Nếu xác thực vẫn thất bại sau lần thử lại đó, cần tự giải quyết sự lệch token.
- Để biết các bước sửa chữa sự lệch token, hãy làm theo [Danh sách kiểm tra khôi phục lệch token](/cli/devices#token-drift-recovery-checklist).
- Lấy hoặc cung cấp token từ máy chủ gateway:
  - Cấu hình văn bản thuần: `openclaw config get gateway.auth.token`
  - Cấu hình được quản lý bởi SecretRef: giải quyết nhà cung cấp bí mật bên ngoài hoặc xuất `OPENCLAW_GATEWAY_TOKEN` trong shell này, sau đó chạy lại `openclaw dashboard`
  - Không có token được cấu hình: `openclaw doctor --generate-gateway-token`
- Trong cài đặt dashboard, dán token vào trường xác thực, sau đó kết nối.
