---
summary: "Tổng quan Pairing: duyệt ai có thể DM + node nào có thể tham gia"
read_when:
  - Thiết lập kiểm soát truy cập DM
  - Pairing node iOS/Android mới
  - Xem xét bảo mật OpenClaw
title: "Pairing"
---

# Pairing

“Pairing” là bước **duyệt quyền** của OpenClaw.
Dùng trong hai trường hợp:

1. **DM pairing** (ai được phép nói chuyện với bot)
2. **Node pairing** (thiết bị/node nào được phép tham gia mạng gateway)

Ngữ cảnh bảo mật: [Security](/gateway/security)

## 1) DM pairing (truy cập chat inbound)

Khi channel có cấu hình DM policy `pairing`, sender lạ sẽ nhận mã ngắn và tin nhắn **không được xử lý** cho đến khi được duyệt.

DM policies mặc định: [Security](/gateway/security)

Mã pairing:

- 8 ký tự, chữ hoa, không có ký tự dễ nhầm (`0O1I`).
- **Hết hạn sau 1 giờ**. Bot chỉ gửi tin nhắn pairing khi có yêu cầu mới (khoảng 1 lần/giờ/sender).
- Yêu cầu DM pairing chờ duyệt giới hạn **3 mỗi channel**; yêu cầu thêm bị bỏ qua cho đến khi có yêu cầu hết hạn hoặc được duyệt.

### Duyệt sender

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Các channel hỗ trợ: `telegram`, `whatsapp`, `signal`, `imessage`, `discord`, `slack`, `feishu`.

### Lưu trữ trạng thái

Lưu tại `~/.openclaw/credentials/`:

- Yêu cầu chờ duyệt: `<channel>-pairing.json`
- Danh sách cho phép đã duyệt:
  - Tài khoản mặc định: `<channel>-allowFrom.json`
  - Tài khoản không mặc định: `<channel>-<accountId>-allowFrom.json`

Hành vi phạm vi tài khoản:

- Tài khoản không mặc định chỉ đọc/ghi file danh sách cho phép theo phạm vi.
- Tài khoản mặc định dùng file danh sách cho phép không phạm vi theo channel.

Xem đây là thông tin nhạy cảm (kiểm soát truy cập trợ lý).

## 2) Node device pairing (iOS/Android/macOS/headless nodes)

Nodes kết nối Gateway dưới dạng **devices** với `role: node`. Gateway tạo yêu cầu pairing thiết bị cần được duyệt.

### Pair qua Telegram (khuyến nghị cho iOS)

Nếu dùng plugin `device-pair`, có thể pair thiết bị lần đầu hoàn toàn qua Telegram:

1. Trong Telegram, nhắn bot: `/pair`
2. Bot trả lời với hai tin nhắn: tin nhắn hướng dẫn và tin nhắn **setup code** riêng (dễ copy/paste trong Telegram).
3. Trên điện thoại, mở app OpenClaw iOS → Settings → Gateway.
4. Dán setup code và kết nối.
5. Quay lại Telegram: `/pair pending` (xem request ID, role, và scopes), rồi duyệt.

Setup code là payload JSON mã hóa base64 chứa:

- `url`: Gateway WebSocket URL (`ws://...` hoặc `wss://...`)
- `bootstrapToken`: token bootstrap ngắn hạn cho pairing handshake ban đầu

Xem setup code như mật khẩu khi còn hiệu lực.

### Duyệt node device

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Nếu cùng thiết bị thử lại với thông tin auth khác (ví dụ role/scopes/public key khác), yêu cầu chờ duyệt trước đó bị thay thế và tạo `requestId` mới.

### Lưu trữ trạng thái node pairing

Lưu tại `~/.openclaw/devices/`:

- `pending.json` (ngắn hạn; yêu cầu chờ duyệt hết hạn)
- `paired.json` (thiết bị đã pair + tokens)

### Ghi chú

- API `node.pair.*` cũ (CLI: `openclaw nodes pending/approve`) là kho lưu trữ pairing riêng của gateway. WS nodes vẫn cần pairing thiết bị.

## Tài liệu liên quan

- Mô hình bảo mật + prompt injection: [Security](/gateway/security)
- Cập nhật an toàn (chạy doctor): [Updating](/install/updating)
- Cấu hình channel:
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/channels/bluebubbles)
  - iMessage (cũ): [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)\n