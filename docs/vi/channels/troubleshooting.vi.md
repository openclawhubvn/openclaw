---
summary: "Khắc phục sự cố kênh nhanh với chữ ký lỗi và cách sửa cho từng kênh"
read_when:
  - Kênh báo kết nối nhưng phản hồi thất bại
  - Cần kiểm tra kênh cụ thể trước khi đọc sâu tài liệu provider
title: "Khắc phục sự cố kênh"
---

# Khắc phục sự cố kênh

Dùng trang này khi kênh kết nối nhưng hoạt động không đúng.

## Lệnh kiểm tra

Chạy các lệnh sau theo thứ tự:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Trạng thái bình thường:

- `Runtime: running`
- `RPC probe: ok`
- Kênh báo kết nối/sẵn sàng

## WhatsApp

### Chữ ký lỗi WhatsApp

| Triệu chứng                     | Kiểm tra nhanh                                    | Cách sửa                                                |
| ------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| Kết nối nhưng không có phản hồi DM | `openclaw pairing list whatsapp`                    | Duyệt người gửi hoặc đổi chính sách DM/danh sách cho phép. |
| Tin nhắn nhóm bị bỏ qua         | Kiểm tra `requireMention` + mẫu mention trong config | Mention bot hoặc nới lỏng chính sách mention cho nhóm đó. |
| Ngắt kết nối/ngắt đăng nhập ngẫu nhiên | `openclaw channels status --probe` + logs           | Đăng nhập lại và kiểm tra thư mục thông tin đăng nhập.   |

Khắc phục chi tiết: [/channels/whatsapp#troubleshooting](/channels/whatsapp#troubleshooting)

## Telegram

### Chữ ký lỗi Telegram

| Triệu chứng                           | Kiểm tra nhanh                                 | Cách sửa                                                                     |
| ------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `/start` nhưng không có luồng phản hồi | `openclaw pairing list telegram`                | Duyệt ghép đôi hoặc thay đổi chính sách DM.                                 |
| Bot online nhưng nhóm im lặng         | Kiểm tra yêu cầu mention và chế độ riêng tư bot | Tắt chế độ riêng tư để nhóm thấy bot hoặc mention bot.                      |
| Gửi thất bại với lỗi mạng             | Kiểm tra logs lỗi gọi API Telegram              | Sửa DNS/IPv6/proxy routing tới `api.telegram.org`.                          |
| `setMyCommands` bị từ chối khi khởi động | Kiểm tra logs cho `BOT_COMMANDS_TOO_MUCH`        | Giảm số lệnh plugin/skill/custom Telegram hoặc tắt menu gốc.                |
| Nâng cấp và danh sách cho phép chặn   | `openclaw security audit` và config danh sách cho phép | Chạy `openclaw doctor --fix` hoặc thay `@username` bằng ID người gửi số. |

Khắc phục chi tiết: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Chữ ký lỗi Discord

| Triệu chứng                     | Kiểm tra nhanh                       | Cách sửa                                                   |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| Bot online nhưng không phản hồi guild | `openclaw channels status --probe`  | Cho phép guild/kênh và kiểm tra ý định nội dung tin nhắn. |
| Tin nhắn nhóm bị bỏ qua         | Kiểm tra logs cho mention gating drops | Mention bot hoặc đặt guild/kênh `requireMention: false`.  |
| Phản hồi DM bị thiếu            | `openclaw pairing list discord`     | Duyệt ghép đôi DM hoặc điều chỉnh chính sách DM.          |

Khắc phục chi tiết: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Chữ ký lỗi Slack

| Triệu chứng                                | Kiểm tra nhanh                             | Cách sửa                                           |
| ------------------------------------------ | ----------------------------------------- | ------------------------------------------------- |
| Kết nối socket mode nhưng không phản hồi   | `openclaw channels status --probe`        | Kiểm tra token app + token bot và các scope cần thiết. |
| DM bị chặn                                 | `openclaw pairing list slack`             | Duyệt ghép đôi hoặc nới lỏng chính sách DM.       |
| Tin nhắn kênh bị bỏ qua                    | Kiểm tra `groupPolicy` và danh sách cho phép kênh | Cho phép kênh hoặc chuyển chính sách sang `open`. |

Khắc phục chi tiết: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage và BlueBubbles

### Chữ ký lỗi iMessage và BlueBubbles

| Triệu chứng                          | Kiểm tra nhanh                                                           | Cách sửa                                               |
| ------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Không có sự kiện inbound             | Kiểm tra khả năng truy cập webhook/server và quyền ứng dụng             | Sửa URL webhook hoặc trạng thái server BlueBubbles.   |
| Có thể gửi nhưng không nhận trên macOS | Kiểm tra quyền riêng tư macOS cho tự động hóa Messages                  | Cấp lại quyền TCC và khởi động lại quá trình kênh.    |
| Người gửi DM bị chặn                 | `openclaw pairing list imessage` hoặc `openclaw pairing list bluebubbles` | Duyệt ghép đôi hoặc cập nhật danh sách cho phép.      |

Khắc phục chi tiết:

- [/channels/imessage#troubleshooting](/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

## Signal

### Chữ ký lỗi Signal

| Triệu chứng                     | Kiểm tra nhanh                              | Cách sửa                                                   |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Daemon có thể truy cập nhưng bot im lặng | `openclaw channels status --probe`         | Kiểm tra URL/account daemon `signal-cli` và chế độ nhận. |
| DM bị chặn                      | `openclaw pairing list signal`             | Duyệt người gửi hoặc điều chỉnh chính sách DM.            |
| Phản hồi nhóm không kích hoạt   | Kiểm tra danh sách cho phép nhóm và mẫu mention | Thêm người gửi/nhóm hoặc nới lỏng gating.                |

Khắc phục chi tiết: [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## Matrix

### Chữ ký lỗi Matrix

| Triệu chứng                             | Kiểm tra nhanh                                | Cách sửa                                         |
| --------------------------------------- | -------------------------------------------- | ----------------------------------------------- |
| Đăng nhập nhưng bỏ qua tin nhắn phòng   | `openclaw channels status --probe`           | Kiểm tra `groupPolicy` và danh sách cho phép phòng. |
| DM không xử lý                          | `openclaw pairing list matrix`               | Duyệt người gửi hoặc điều chỉnh chính sách DM.   |
| Phòng mã hóa thất bại                   | Kiểm tra module mã hóa và cài đặt mã hóa     | Bật hỗ trợ mã hóa và tham gia/đồng bộ lại phòng. |

Khắc phục chi tiết: [/channels/matrix#troubleshooting](/channels/matrix#troubleshooting)\n