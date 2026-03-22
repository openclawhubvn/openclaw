# Kênh Chat

OpenClaw có thể kết nối với bất kỳ ứng dụng chat nào bạn đang dùng. Mỗi kênh kết nối qua Gateway. Hỗ trợ text ở mọi nơi; media và reactions tùy thuộc vào từng kênh.

## Các kênh hỗ trợ

- [BlueBubbles](/channels/bluebubbles) — **Khuyến nghị cho iMessage**; dùng BlueBubbles macOS server REST API với đầy đủ tính năng (chỉnh sửa, thu hồi, hiệu ứng, reactions, quản lý nhóm — chỉnh sửa hiện không hoạt động trên macOS 26 Tahoe).
- [Discord](/channels/discord) — Discord Bot API + Gateway; hỗ trợ server, channel và DM.
- [Feishu](/channels/feishu) — Bot Feishu/Lark qua WebSocket (plugin, cài đặt riêng).
- [Google Chat](/channels/googlechat) — Ứng dụng Google Chat API qua HTTP webhook.
- [iMessage (legacy)](/channels/imessage) — Tích hợp macOS cũ qua imsg CLI (đã lỗi thời, dùng BlueBubbles cho thiết lập mới).
- [IRC](/channels/irc) — Server IRC cổ điển; channel + DM với kiểm soát pairing/allowlist.
- [LINE](/channels/line) — Bot LINE Messaging API (plugin, cài đặt riêng).
- [Matrix](/channels/matrix) — Giao thức Matrix (plugin, cài đặt riêng).
- [Mattermost](/channels/mattermost) — Bot API + WebSocket; channel, nhóm, DM (plugin, cài đặt riêng).
- [Microsoft Teams](/channels/msteams) — Bot Framework; hỗ trợ doanh nghiệp (plugin, cài đặt riêng).
- [Nextcloud Talk](/channels/nextcloud-talk) — Chat tự host qua Nextcloud Talk (plugin, cài đặt riêng).
- [Nostr](/channels/nostr) — DM phi tập trung qua NIP-04 (plugin, cài đặt riêng).
- [Signal](/channels/signal) — signal-cli; tập trung vào bảo mật.
- [Synology Chat](/channels/synology-chat) — Synology NAS Chat qua webhook gửi đi + nhận về (plugin, cài đặt riêng).
- [Slack](/channels/slack) — Bolt SDK; ứng dụng workspace.
- [Telegram](/channels/telegram) — Bot API qua grammY; hỗ trợ nhóm.
- [Tlon](/channels/tlon) — Messenger dựa trên Urbit (plugin, cài đặt riêng).
- [Twitch](/channels/twitch) — Chat Twitch qua kết nối IRC (plugin, cài đặt riêng).
- [WebChat](/web/webchat) — Gateway WebChat UI qua WebSocket.
- [WhatsApp](/channels/whatsapp) — Phổ biến nhất; dùng Baileys và yêu cầu ghép đôi QR.
- [Zalo](/channels/zalo) — Zalo Bot API; messenger phổ biến tại Việt Nam (plugin, cài đặt riêng).
- [Zalo Personal](/channels/zalouser) — Tài khoản cá nhân Zalo qua đăng nhập QR (plugin, cài đặt riêng).

## Ghi chú

- Các kênh có thể chạy đồng thời; cấu hình nhiều kênh và OpenClaw sẽ định tuyến theo chat.
- Thiết lập nhanh nhất thường là **Telegram** (token bot đơn giản). WhatsApp yêu cầu ghép đôi QR và lưu nhiều trạng thái trên đĩa.
- Hành vi nhóm thay đổi theo kênh; xem [Groups](/channels/groups).
- DM pairing và allowlists được áp dụng để đảm bảo an toàn; xem [Security](/gateway/security).
- Khắc phục sự cố: [Channel troubleshooting](/channels/troubleshooting).
- Nhà cung cấp mô hình được tài liệu riêng; xem [Model Providers](/providers/models).\n