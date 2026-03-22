---
summary: "Cài đặt webhook Synology Chat và cấu hình OpenClaw"
read_when:
  - Cài đặt Synology Chat với OpenClaw
  - Debug routing webhook Synology Chat
title: "Synology Chat"
---

# Synology Chat (plugin)

Trạng thái: hỗ trợ qua plugin như một kênh direct-message dùng webhooks của Synology Chat. Plugin nhận tin nhắn từ outgoing webhook của Synology Chat và gửi phản hồi qua incoming webhook.

## Yêu cầu plugin

Synology Chat dựa trên plugin, không có sẵn trong cài đặt core channel mặc định.

Cài đặt từ local checkout:

```bash
openclaw plugins install ./extensions/synology-chat
```

Chi tiết: [Plugins](/tools/plugin)

## Cài đặt nhanh

1. Cài và kích hoạt plugin Synology Chat.
   - `openclaw onboard` giờ sẽ hiển thị Synology Chat trong danh sách setup channel như `openclaw channels add`.
   - Setup không tương tác: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Trong phần tích hợp Synology Chat:
   - Tạo incoming webhook và copy URL.
   - Tạo outgoing webhook với secret token.
3. Trỏ URL outgoing webhook tới OpenClaw gateway:
   - Mặc định: `https://gateway-host/webhook/synology`.
   - Hoặc custom `channels.synology-chat.webhookPath`.
4. Hoàn tất setup trong OpenClaw.
   - Hướng dẫn: `openclaw onboard`
   - Trực tiếp: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Khởi động lại gateway và gửi DM tới bot Synology Chat.

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

Cho tài khoản mặc định, có thể dùng env vars:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (phân tách bằng dấu phẩy)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Giá trị config sẽ ghi đè env vars.

## Chính sách DM và kiểm soát truy cập

- `dmPolicy: "allowlist"` là mặc định khuyến nghị.
- `allowedUserIds` nhận danh sách (hoặc chuỗi phân tách bằng dấu phẩy) các Synology user ID.
- Trong chế độ `allowlist`, danh sách `allowedUserIds` rỗng bị coi là cấu hình sai và route webhook sẽ không khởi động (dùng `dmPolicy: "open"` để cho phép tất cả).
- `dmPolicy: "open"` cho phép mọi sender.
- `dmPolicy: "disabled"` chặn DMs.
- Phê duyệt pairing hoạt động với:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Gửi tin outbound

Dùng Synology Chat user ID dạng số làm target.

Ví dụ:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Gửi media hỗ trợ qua URL-based file delivery.

## Multi-account

Hỗ trợ nhiều tài khoản Synology Chat dưới `channels.synology-chat.accounts`. Mỗi tài khoản có thể ghi đè token, incoming URL, webhook path, DM policy và giới hạn.

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

## Lưu ý bảo mật

- Giữ bí mật `token` và thay đổi nếu bị lộ.
- Giữ `allowInsecureSsl: false` trừ khi tin tưởng cert NAS tự ký.
- Yêu cầu webhook inbound được xác thực token và giới hạn tốc độ theo sender.
- Ưu tiên `dmPolicy: "allowlist"` cho môi trường production.\n