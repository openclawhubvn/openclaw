---
summary: "Các nền tảng nhắn tin mà OpenClaw có thể kết nối"
read_when:
  - Bạn muốn chọn kênh chat cho OpenClaw
  - Bạn cần cái nhìn tổng quan nhanh về các nền tảng nhắn tin được hỗ trợ
title: "Kênh Chat"
---

# Kênh Chat

OpenClaw có thể giao tiếp với bạn trên bất kỳ ứng dụng chat nào bạn đang sử dụng. Mỗi kênh kết nối thông qua Gateway. Văn bản được hỗ trợ ở mọi nơi; phương tiện và phản ứng có thể khác nhau tùy theo kênh.

## Các kênh được hỗ trợ

- [BlueBubbles](/channels/bluebubbles) — **Khuyến nghị cho iMessage**; sử dụng REST API của máy chủ BlueBubbles trên macOS với đầy đủ tính năng (chỉnh sửa, thu hồi, hiệu ứng, phản ứng, quản lý nhóm — chỉnh sửa hiện không hoạt động trên macOS 26 Tahoe).
- [Discord](/channels/discord) — Sử dụng Discord Bot API + Gateway; hỗ trợ máy chủ, kênh và tin nhắn trực tiếp.
- [Feishu](/channels/feishu) — Bot Feishu/Lark qua WebSocket (plugin, cài đặt riêng).
- [Google Chat](/channels/googlechat) — Ứng dụng API Google Chat qua HTTP webhook.
- [iMessage (cũ)](/channels/imessage) — Tích hợp macOS cũ qua imsg CLI (đã ngừng hỗ trợ, sử dụng BlueBubbles cho các thiết lập mới).
- [IRC](/channels/irc) — Máy chủ IRC cổ điển; kênh và tin nhắn trực tiếp với kiểm soát ghép đôi/danh sách cho phép.
- [LINE](/channels/line) — Bot API LINE Messaging (plugin, cài đặt riêng).
- [Matrix](/channels/matrix) — Giao thức Matrix (plugin, cài đặt riêng).
- [Mattermost](/channels/mattermost) — Bot API + WebSocket; kênh, nhóm, tin nhắn trực tiếp (plugin, cài đặt riêng).
- [Microsoft Teams](/channels/msteams) — Bot Framework; hỗ trợ doanh nghiệp (plugin, cài đặt riêng).
- [Nextcloud Talk](/channels/nextcloud-talk) — Chat tự lưu trữ qua Nextcloud Talk (plugin, cài đặt riêng).
- [Nostr](/channels/nostr) — Tin nhắn trực tiếp phi tập trung qua NIP-04 (plugin, cài đặt riêng).
- [Signal](/channels/signal) — signal-cli; tập trung vào quyền riêng tư.
- [Synology Chat](/channels/synology-chat) — Chat Synology NAS qua webhooks gửi đi và nhận vào (plugin, cài đặt riêng).
- [Slack](/channels/slack) — Bolt SDK; ứng dụng workspace.
- [Telegram](/channels/telegram) — Bot API qua grammY; hỗ trợ nhóm.
- [Tlon](/channels/tlon) — Messenger dựa trên Urbit (plugin, cài đặt riêng).
- [Twitch](/channels/twitch) — Chat Twitch qua kết nối IRC (plugin, cài đặt riêng).
- [WebChat](/web/webchat) — Giao diện WebChat Gateway qua WebSocket.
- [WhatsApp](/channels/whatsapp) — Phổ biến nhất; sử dụng Baileys và yêu cầu ghép đôi QR.
- [Zalo](/channels/zalo) — Zalo Bot API; messenger phổ biến tại Việt Nam (plugin, cài đặt riêng).
- [Zalo Personal](/channels/zalouser) — Tài khoản cá nhân Zalo qua đăng nhập QR (plugin, cài đặt riêng).

## Ghi chú

- Các kênh có thể chạy đồng thời; cấu hình nhiều kênh và OpenClaw sẽ định tuyến theo từng chat.
- Thiết lập nhanh nhất thường là **Telegram** (token bot đơn giản). WhatsApp yêu cầu ghép đôi QR và lưu trữ nhiều trạng thái hơn trên đĩa.
- Hành vi nhóm khác nhau tùy theo kênh; xem [Nhóm](/channels/groups).
- Ghép đôi tin nhắn trực tiếp và danh sách cho phép được thực thi để đảm bảo an toàn; xem [Bảo mật](/gateway/security).
- Khắc phục sự cố: [Khắc phục sự cố kênh](/channels/troubleshooting).
- Các nhà cung cấp mô hình được tài liệu riêng; xem [Nhà cung cấp mô hình](/providers/models).
