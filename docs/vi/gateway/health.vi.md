# Health Checks (CLI)

Hướng dẫn nhanh kiểm tra kết nối channel mà không cần đoán mò.

## Kiểm tra nhanh

- `openclaw status` — tóm tắt local: khả năng kết nối/mode của gateway, gợi ý cập nhật, tuổi xác thực channel liên kết, sessions + hoạt động gần đây.
- `openclaw status --all` — chẩn đoán đầy đủ local (chỉ đọc, có màu, an toàn để paste khi debug).
- `openclaw status --deep` — kiểm tra sâu Gateway đang chạy (kiểm tra từng channel khi hỗ trợ).
- `openclaw health --json` — yêu cầu Gateway đang chạy cung cấp snapshot sức khỏe đầy đủ (chỉ WS; không socket Baileys trực tiếp).
- Gửi `/status` như một tin nhắn độc lập trong WhatsApp/WebChat để nhận phản hồi trạng thái mà không cần gọi agent.
- Logs: theo dõi `/tmp/openclaw/openclaw-*.log` và lọc `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Chẩn đoán sâu

- Creds trên đĩa: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime nên gần đây).
- Session store: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (có thể override path trong config). Số lượng và người nhận gần đây được hiển thị qua `status`.
- Relink flow: `openclaw channels logout && openclaw channels login --verbose` khi status code 409–515 hoặc `loggedOut` xuất hiện trong logs. (Lưu ý: QR login flow tự động khởi động lại một lần cho status 515 sau khi ghép đôi.)

## Cấu hình giám sát sức khỏe

- `gateway.channelHealthCheckMinutes`: tần suất gateway kiểm tra sức khỏe channel. Mặc định: `5`. Đặt `0` để vô hiệu hóa khởi động lại health-monitor toàn cầu.
- `gateway.channelStaleEventThresholdMinutes`: thời gian tối đa một channel kết nối có thể không hoạt động trước khi health monitor coi là cũ và khởi động lại. Mặc định: `30`. Giữ giá trị này lớn hơn hoặc bằng `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: giới hạn một giờ cho khởi động lại health-monitor mỗi channel/account. Mặc định: `10`.
- `channels.<provider>.healthMonitor.enabled`: vô hiệu hóa khởi động lại health-monitor cho một channel cụ thể trong khi vẫn giữ giám sát toàn cầu.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override nhiều account ưu tiên hơn cài đặt cấp channel.
- Các override theo channel này áp dụng cho các channel monitors tích hợp hiện có: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram, và WhatsApp.

## Khi có sự cố

- `logged out` hoặc status 409–515 → relink với `openclaw channels logout` rồi `openclaw channels login`.
- Gateway không thể truy cập → khởi động: `openclaw gateway --port 18789` (dùng `--force` nếu port bận).
- Không có tin nhắn inbound → xác nhận điện thoại liên kết đang online và người gửi được phép (`channels.whatsapp.allowFrom`); với group chat, đảm bảo allowlist + quy tắc mention khớp (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Lệnh "health" chuyên dụng

`openclaw health --json` yêu cầu Gateway đang chạy cung cấp snapshot sức khỏe (không socket channel trực tiếp từ CLI). Nó báo cáo tuổi creds/auth liên kết khi có, tóm tắt kiểm tra từng channel, tóm tắt session-store, và thời gian kiểm tra. Thoát với mã khác 0 nếu Gateway không thể truy cập hoặc kiểm tra thất bại/hết thời gian. Dùng `--timeout <ms>` để override mặc định 10s.\n