---
summary: "Tìm hiểu cách nhận diện và sửa lỗi kênh nhanh chóng, đảm bảo hoạt động ổn định cho hệ thống của bạn."
read_when:
  - Kênh truyền tải báo kết nối nhưng phản hồi thất bại
  - Cần kiểm tra cụ thể từng kênh trước khi xem tài liệu nhà cung cấp chi tiết
title: "Hướng Dẫn Khắc Phục Sự Cố Kênh OpenClaw"
---

# Khắc phục sự cố kênh

Sử dụng trang này khi kênh kết nối nhưng hành vi không đúng.

## Thứ tự lệnh

Chạy các lệnh này theo thứ tự:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Tiêu chuẩn hoạt động bình thường:

- `Runtime: running`
- `RPC probe: ok`
- Kênh kiểm tra cho thấy đã kết nối/sẵn sàng

## WhatsApp

### Dấu hiệu lỗi của WhatsApp

| Triệu chứng                       | Kiểm tra nhanh nhất                                | Cách sửa chữa                                           |
| --------------------------------- | -------------------------------------------------- | ------------------------------------------------------- |
| Kết nối nhưng không có phản hồi DM | `openclaw pairing list whatsapp`                   | Phê duyệt người gửi hoặc thay đổi chính sách DM/danh sách cho phép. |
| Tin nhắn nhóm bị bỏ qua           | Kiểm tra `requireMention` + mẫu đề cập trong cấu hình | Đề cập bot hoặc nới lỏng chính sách đề cập cho nhóm đó. |
| Ngắt kết nối/đăng nhập lại ngẫu nhiên | `openclaw channels status --probe` + logs          | Đăng nhập lại và kiểm tra thư mục thông tin xác thực.   |

Khắc phục sự cố đầy đủ: [/channels/whatsapp#troubleshooting](/channels/whatsapp#troubleshooting)

## Telegram

### Dấu hiệu lỗi của Telegram

| Triệu chứng                             | Kiểm tra nhanh nhất                             | Cách sửa chữa                                                             |
| --------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| `/start` nhưng không có luồng phản hồi khả dụng | `openclaw pairing list telegram`                | Phê duyệt ghép đôi hoặc thay đổi chính sách DM.                           |
| Bot trực tuyến nhưng nhóm không có phản hồi | Kiểm tra yêu cầu đề cập và chế độ riêng tư của bot | Tắt chế độ riêng tư để nhóm có thể thấy hoặc đề cập bot.                  |
| Gửi thất bại với lỗi mạng               | Kiểm tra logs cho lỗi gọi API Telegram          | Sửa DNS/IPv6/định tuyến proxy tới `api.telegram.org`.                     |
| `setMyCommands` bị từ chối khi khởi động | Kiểm tra logs cho `BOT_COMMANDS_TOO_MUCH`       | Giảm số lệnh plugin/kỹ năng/Telgram tùy chỉnh hoặc tắt menu gốc.         |
| Nâng cấp và danh sách cho phép chặn bạn | `openclaw security audit` và cấu hình danh sách cho phép | Chạy `openclaw doctor --fix` hoặc thay `@username` bằng ID người gửi số. |

Khắc phục sự cố đầy đủ: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Dấu hiệu lỗi của Discord

| Triệu chứng                         | Kiểm tra nhanh nhất                       | Cách sửa chữa                                           |
| ----------------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| Bot trực tuyến nhưng không có phản hồi từ guild | `openclaw channels status --probe`        | Cho phép guild/kênh và kiểm tra ý định nội dung tin nhắn. |
| Tin nhắn nhóm bị bỏ qua             | Kiểm tra logs cho việc bỏ qua đề cập      | Đề cập bot hoặc đặt `requireMention: false` cho guild/kênh. |
| Phản hồi DM bị thiếu                | `openclaw pairing list discord`           | Phê duyệt ghép đôi DM hoặc điều chỉnh chính sách DM.     |

Khắc phục sự cố đầy đủ: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Dấu hiệu lỗi của Slack

| Triệu chứng                                | Kiểm tra nhanh nhất                         | Cách sửa chữa                                       |
| ------------------------------------------ | ------------------------------------------- | --------------------------------------------------- |
| Kết nối chế độ socket nhưng không có phản hồi | `openclaw channels status --probe`          | Kiểm tra token ứng dụng + token bot và các phạm vi cần thiết. |
| DM bị chặn                                 | `openclaw pairing list slack`               | Phê duyệt ghép đôi hoặc nới lỏng chính sách DM.     |
| Tin nhắn kênh bị bỏ qua                    | Kiểm tra `groupPolicy` và danh sách cho phép kênh | Cho phép kênh hoặc chuyển chính sách sang `open`.   |

Khắc phục sự cố đầy đủ: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage và BlueBubbles

### Dấu hiệu lỗi của iMessage và BlueBubbles

| Triệu chứng                          | Kiểm tra nhanh nhất                                                           | Cách sửa chữa                                           |
| ------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| Không có sự kiện đầu vào             | Kiểm tra khả năng truy cập webhook/máy chủ và quyền ứng dụng                  | Sửa URL webhook hoặc trạng thái máy chủ BlueBubbles.    |
| Có thể gửi nhưng không nhận trên macOS | Kiểm tra quyền riêng tư macOS cho tự động hóa Messages                        | Cấp lại quyền TCC và khởi động lại quá trình kênh.      |
| Người gửi DM bị chặn                 | `openclaw pairing list imessage` hoặc `openclaw pairing list bluebubbles`     | Phê duyệt ghép đôi hoặc cập nhật danh sách cho phép.    |

Khắc phục sự cố đầy đủ:

- [/channels/imessage#troubleshooting](/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

## Signal

### Dấu hiệu lỗi của Signal

| Triệu chứng                         | Kiểm tra nhanh nhất                              | Cách sửa chữa                                           |
| ----------------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Daemon có thể truy cập nhưng bot im lặng | `openclaw channels status --probe`               | Kiểm tra URL/ tài khoản daemon `signal-cli` và chế độ nhận. |
| DM bị chặn                          | `openclaw pairing list signal`                   | Phê duyệt người gửi hoặc điều chỉnh chính sách DM.       |
| Phản hồi nhóm không kích hoạt       | Kiểm tra danh sách cho phép nhóm và mẫu đề cập   | Thêm người gửi/nhóm hoặc nới lỏng điều kiện.            |

Khắc phục sự cố đầy đủ: [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## Matrix

### Dấu hiệu lỗi của Matrix

| Triệu chứng                             | Kiểm tra nhanh nhất                                | Cách sửa chữa                                       |
| --------------------------------------- | -------------------------------------------------- | --------------------------------------------------- |
| Đã đăng nhập nhưng bỏ qua tin nhắn phòng | `openclaw channels status --probe`                 | Kiểm tra `groupPolicy` và danh sách cho phép phòng. |
| DM không xử lý                          | `openclaw pairing list matrix`                     | Phê duyệt người gửi hoặc điều chỉnh chính sách DM.   |
| Phòng mã hóa thất bại                   | Kiểm tra mô-đun mã hóa và cài đặt mã hóa           | Bật hỗ trợ mã hóa và tham gia/đồng bộ lại phòng.    |

Khắc phục sự cố đầy đủ: [/channels/matrix#troubleshooting](/channels/matrix#troubleshooting)
