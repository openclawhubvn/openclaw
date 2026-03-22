---
summary: "Tổng quan về Pairing: phê duyệt ai có thể nhắn tin cho bạn + thiết bị nào có thể tham gia"
read_when:
  - Thiết lập kiểm soát truy cập DM
  - Ghép nối một node iOS/Android mới
  - Xem xét tư thế bảo mật của OpenClaw
title: "Pairing"
---

# Pairing

"Pairing" là bước **phê duyệt chủ sở hữu** rõ ràng của OpenClaw.
Nó được sử dụng trong hai trường hợp:

1. **Ghép nối DM** (ai được phép trò chuyện với bot)
2. **Ghép nối node** (thiết bị/nodes nào được phép tham gia mạng gateway)

Ngữ cảnh bảo mật: [Bảo mật](/gateway/security)

## 1) Ghép nối DM (truy cập chat đến)

Khi một kênh được cấu hình với chính sách DM `pairing`, người gửi không xác định sẽ nhận được một mã ngắn và tin nhắn của họ **không được xử lý** cho đến khi bạn phê duyệt.

Các chính sách DM mặc định được ghi lại tại: [Bảo mật](/gateway/security)

Mã ghép nối:

- 8 ký tự, chữ hoa, không có ký tự dễ nhầm lẫn (`0O1I`).
- **Hết hạn sau 1 giờ**. Bot chỉ gửi tin nhắn ghép nối khi có yêu cầu mới được tạo (khoảng một lần mỗi giờ cho mỗi người gửi).
- Yêu cầu ghép nối DM đang chờ xử lý bị giới hạn ở **3 mỗi kênh** theo mặc định; các yêu cầu bổ sung sẽ bị bỏ qua cho đến khi một yêu cầu hết hạn hoặc được phê duyệt.

### Phê duyệt người gửi

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Các kênh hỗ trợ: `telegram`, `whatsapp`, `signal`, `imessage`, `discord`, `slack`, `feishu`.

### Nơi lưu trữ trạng thái

Lưu trữ dưới `~/.openclaw/credentials/`:

- Yêu cầu đang chờ xử lý: `<channel>-pairing.json`
- Lưu trữ danh sách cho phép đã phê duyệt:
  - Tài khoản mặc định: `<channel>-allowFrom.json`
  - Tài khoản không mặc định: `<channel>-<accountId>-allowFrom.json`

Hành vi phạm vi tài khoản:

- Tài khoản không mặc định chỉ đọc/ghi tệp danh sách cho phép theo phạm vi của chúng.
- Tài khoản mặc định sử dụng tệp danh sách cho phép không theo phạm vi của kênh.

Xem đây là thông tin nhạy cảm (chúng kiểm soát quyền truy cập vào trợ lý của bạn).

## 2) Ghép nối thiết bị node (iOS/Android/macOS/nodes không giao diện)

Nodes kết nối với Gateway dưới dạng **thiết bị** với `role: node`. Gateway tạo một yêu cầu ghép nối thiết bị cần được phê duyệt.

### Ghép nối qua Telegram (khuyến nghị cho iOS)

Nếu bạn sử dụng plugin `device-pair`, bạn có thể thực hiện ghép nối thiết bị lần đầu hoàn toàn từ Telegram:

1. Trong Telegram, nhắn tin cho bot của bạn: `/pair`
2. Bot trả lời với hai tin nhắn: một tin nhắn hướng dẫn và một tin nhắn **mã thiết lập** riêng biệt (dễ sao chép/dán trong Telegram).
3. Trên điện thoại của bạn, mở ứng dụng OpenClaw iOS → Cài đặt → Gateway.
4. Dán mã thiết lập và kết nối.
5. Quay lại Telegram: `/pair pending` (xem xét ID yêu cầu, vai trò và phạm vi), sau đó phê duyệt.

Mã thiết lập là một payload JSON được mã hóa base64 chứa:

- `url`: URL WebSocket của Gateway (`ws://...` hoặc `wss://...`)
- `bootstrapToken`: một token khởi động ngắn hạn cho một thiết bị duy nhất được sử dụng cho quá trình bắt tay ghép nối ban đầu

Xem mã thiết lập như một mật khẩu trong khi nó còn hiệu lực.

### Phê duyệt thiết bị node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Nếu cùng một thiết bị thử lại với thông tin xác thực khác (ví dụ: vai trò/phạm vi/khóa công khai khác), yêu cầu đang chờ xử lý trước đó sẽ bị thay thế và một `requestId` mới được tạo.

### Lưu trữ trạng thái ghép nối node

Lưu trữ dưới `~/.openclaw/devices/`:

- `pending.json` (ngắn hạn; yêu cầu đang chờ xử lý hết hạn)
- `paired.json` (các thiết bị đã ghép nối + token)

### Ghi chú

- API `node.pair.*` cũ (CLI: `openclaw nodes pending/approve`) là một kho ghép nối riêng thuộc về gateway. Các node WS vẫn yêu cầu ghép nối thiết bị.

## Tài liệu liên quan

- Mô hình bảo mật + tiêm lệnh nhắc: [Bảo mật](/gateway/security)
- Cập nhật an toàn (chạy doctor): [Cập nhật](/install/updating)
- Cấu hình kênh:
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/channels/bluebubbles)
  - iMessage (cũ): [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)
