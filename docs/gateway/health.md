---
summary: "Khám phá cách kiểm tra sức khỏe kết nối kênh Gateway để đảm bảo hiệu suất và độ tin cậy tối ưu."
read_when:
  - Chẩn đoán sức khỏe kênh WhatsApp
title: "Hướng Dẫn Kiểm Tra Sức Khỏe Gateway"
---

# Kiểm tra sức khỏe (CLI)

Hướng dẫn ngắn gọn để xác minh kết nối kênh mà không cần đoán mò.

## Kiểm tra nhanh

- `openclaw status` — tóm tắt cục bộ: khả năng kết nối/mode của gateway, gợi ý cập nhật, tuổi xác thực kênh liên kết, phiên và hoạt động gần đây.
- `openclaw status --all` — chẩn đoán cục bộ đầy đủ (chỉ đọc, có màu, an toàn để dán khi gỡ lỗi).
- `openclaw status --deep` — cũng kiểm tra Gateway đang chạy (kiểm tra từng kênh khi được hỗ trợ).
- `openclaw health --json` — yêu cầu Gateway đang chạy cung cấp ảnh chụp sức khỏe đầy đủ (chỉ WS; không có socket Baileys trực tiếp).
- Gửi `/status` như một tin nhắn độc lập trong WhatsApp/WebChat để nhận phản hồi trạng thái mà không cần kích hoạt agent.
- Nhật ký: theo dõi `/tmp/openclaw/openclaw-*.log` và lọc các mục `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Chẩn đoán sâu

- Thông tin xác thực trên đĩa: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (thời gian sửa đổi gần đây).
- Lưu trữ phiên: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (đường dẫn có thể được ghi đè trong cấu hình). Số lượng và người nhận gần đây được hiển thị qua `status`.
- Quy trình liên kết lại: `openclaw channels logout && openclaw channels login --verbose` khi mã trạng thái 409–515 hoặc `loggedOut` xuất hiện trong nhật ký. (Lưu ý: quy trình đăng nhập QR tự động khởi động lại một lần cho trạng thái 515 sau khi ghép đôi.)

## Cấu hình giám sát sức khỏe

- `gateway.channelHealthCheckMinutes`: tần suất gateway kiểm tra sức khỏe kênh. Mặc định: `5`. Đặt `0` để vô hiệu hóa khởi động lại giám sát sức khỏe toàn cầu.
- `gateway.channelStaleEventThresholdMinutes`: thời gian một kênh kết nối có thể không hoạt động trước khi giám sát sức khỏe coi nó là không hoạt động và khởi động lại. Mặc định: `30`. Giữ giá trị này lớn hơn hoặc bằng `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: giới hạn khởi động lại giám sát sức khỏe trong một giờ cho mỗi kênh/tài khoản. Mặc định: `10`.
- `channels.<provider>.healthMonitor.enabled`: vô hiệu hóa khởi động lại giám sát sức khỏe cho một kênh cụ thể trong khi vẫn giữ giám sát toàn cầu.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: ghi đè đa tài khoản có ưu tiên hơn cài đặt cấp kênh.
- Các ghi đè theo kênh này áp dụng cho các giám sát kênh tích hợp hiện có: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram, và WhatsApp.

## Khi có sự cố

- `logged out` hoặc trạng thái 409–515 → liên kết lại với `openclaw channels logout` sau đó `openclaw channels login`.
- Gateway không thể truy cập → khởi động nó: `openclaw gateway --port 18789` (sử dụng `--force` nếu cổng bận).
- Không có tin nhắn đến → xác nhận điện thoại liên kết đang trực tuyến và người gửi được phép (`channels.whatsapp.allowFrom`); đối với trò chuyện nhóm, đảm bảo danh sách cho phép và quy tắc đề cập khớp (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Lệnh "health" chuyên dụng

`openclaw health --json` yêu cầu Gateway đang chạy cung cấp ảnh chụp sức khỏe (không có socket kênh trực tiếp từ CLI). Nó báo cáo thông tin xác thực liên kết/tuổi xác thực khi có, tóm tắt kiểm tra từng kênh, tóm tắt lưu trữ phiên và thời gian kiểm tra. Nó thoát với mã khác 0 nếu Gateway không thể truy cập hoặc kiểm tra thất bại/hết thời gian. Sử dụng `--timeout <ms>` để ghi đè mặc định 10 giây.
