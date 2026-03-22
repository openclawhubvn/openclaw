---
summary: "Tìm hiểu cách cài đặt và cấu hình webhook cho Synology Chat, giúp tích hợp hiệu quả với OpenClaw. Đơn giản và nhanh chóng."
read_when:
  - Cài đặt Synology Chat với OpenClaw
  - Khắc phục sự cố định tuyến webhook Synology Chat
title: "Hướng Dẫn Cấu Hình Synology Chat Webhook"
---

# Synology Chat (plugin)

Trạng thái: được hỗ trợ qua plugin như một kênh tin nhắn trực tiếp sử dụng webhooks của Synology Chat. Plugin này nhận tin nhắn từ các outgoing webhook của Synology Chat và gửi phản hồi qua incoming webhook của Synology Chat.

## Yêu cầu plugin

Synology Chat dựa trên plugin và không phải là một phần của cài đặt kênh mặc định.

Cài đặt từ bản sao cục bộ:

```bash
openclaw plugins install ./extensions/synology-chat
```

Chi tiết: [Plugins](/tools/plugin)

## Cài đặt nhanh

1. Cài đặt và kích hoạt plugin Synology Chat.
   - `openclaw onboard` hiện hiển thị Synology Chat trong danh sách cài đặt kênh như `openclaw channels add`.
   - Cài đặt không tương tác: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Trong phần tích hợp của Synology Chat:
   - Tạo một incoming webhook và sao chép URL của nó.
   - Tạo một outgoing webhook với secret token của bạn.
3. Trỏ URL của outgoing webhook đến gateway của OpenClaw:
   - Mặc định là `https://gateway-host/webhook/synology`.
   - Hoặc `channels.synology-chat.webhookPath` tùy chỉnh của bạn.
4. Hoàn tất cài đặt trong OpenClaw.
   - Hướng dẫn: `openclaw onboard`
   - Trực tiếp: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Khởi động lại gateway và gửi tin nhắn trực tiếp đến bot Synology Chat.

Cấu hình tối thiểu:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Biến môi trường

Đối với tài khoản mặc định, bạn có thể sử dụng các biến môi trường:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (phân tách bằng dấu phẩy)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Giá trị cấu hình sẽ ghi đè các biến môi trường.

## Chính sách DM và kiểm soát truy cập

- `dmPolicy: "allowlist"` là mặc định được khuyến nghị.
- `allowedUserIds` chấp nhận danh sách (hoặc chuỗi phân tách bằng dấu phẩy) các ID người dùng Synology.
- Trong chế độ `allowlist`, danh sách `allowedUserIds` trống được coi là cấu hình sai và tuyến webhook sẽ không khởi động (sử dụng `dmPolicy: "open"` để cho phép tất cả).
- `dmPolicy: "open"` cho phép bất kỳ người gửi nào.
- `dmPolicy: "disabled"` chặn tin nhắn trực tiếp.
- Phê duyệt ghép đôi hoạt động với:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Gửi đi

Sử dụng ID người dùng Synology Chat dạng số làm mục tiêu.

Ví dụ:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Gửi media được hỗ trợ qua việc chuyển file dựa trên URL.

## Nhiều tài khoản

Hỗ trợ nhiều tài khoản Synology Chat dưới `channels.synology-chat.accounts`. Mỗi tài khoản có thể ghi đè token, URL incoming, đường dẫn webhook, chính sách DM và giới hạn.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Ghi chú bảo mật

- Giữ bí mật `token` và thay đổi nó nếu bị lộ.
- Giữ `allowInsecureSsl: false` trừ khi bạn tin tưởng vào chứng chỉ NAS tự ký cục bộ.
- Các yêu cầu webhook inbound được xác minh bằng token và giới hạn tốc độ theo từng người gửi.
- Ưu tiên `dmPolicy: "allowlist"` cho môi trường sản xuất.
