---
summary: "Cấu hình và thiết lập bot chat Twitch"
read_when:
  - Thiết lập tích hợp chat Twitch cho OpenClaw
title: "Twitch"
---

# Twitch (plugin)

Hỗ trợ chat Twitch qua kết nối IRC. OpenClaw kết nối như một tài khoản Twitch (bot) để nhận và gửi tin nhắn trong các kênh.

## Plugin cần thiết

Twitch là plugin, không đi kèm với cài đặt gốc.

Cài qua CLI (npm registry):

```bash
openclaw plugins install @openclaw/twitch
```

Checkout local (khi chạy từ git repo):

```bash
openclaw plugins install ./extensions/twitch
```

Chi tiết: [Plugins](/tools/plugin)

## Thiết lập nhanh (cho người mới)

1. Tạo tài khoản Twitch riêng cho bot (hoặc dùng tài khoản có sẵn).
2. Tạo thông tin xác thực: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Chọn **Bot Token**
   - Đảm bảo chọn scopes `chat:read` và `chat:write`
   - Sao chép **Client ID** và **Access Token**
3. Tìm user ID Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
4. Cấu hình token:
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (chỉ tài khoản mặc định)
   - Hoặc config: `channels.twitch.accessToken`
   - Nếu cả hai được thiết lập, config ưu tiên (env chỉ là fallback cho tài khoản mặc định).
5. Khởi động gateway.

**⚠️ Quan trọng:** Thêm kiểm soát truy cập (`allowFrom` hoặc `allowedRoles`) để ngăn người dùng không được phép kích hoạt bot. `requireMention` mặc định là `true`.

Cấu hình tối thiểu:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Tài khoản Twitch của bot
      accessToken: "oauth:abc123...", // OAuth Access Token (hoặc dùng biến môi trường OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID từ Token Generator
      channel: "vevisk", // Kênh Twitch để tham gia chat (bắt buộc)
      allowFrom: ["123456789"], // (khuyến nghị) Chỉ user ID Twitch của bạn - lấy từ https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Nó là gì

- Một kênh Twitch thuộc sở hữu của Gateway.
- Routing xác định: phản hồi luôn quay lại Twitch.
- Mỗi tài khoản ánh xạ tới một session key riêng `agent:<agentId>:twitch:<accountName>`.
- `username` là tài khoản bot (người xác thực), `channel` là phòng chat để tham gia.

## Thiết lập chi tiết

### Tạo thông tin xác thực

Dùng [Twitch Token Generator](https://twitchtokengenerator.com/):

- Chọn **Bot Token**
- Đảm bảo chọn scopes `chat:read` và `chat:write`
- Sao chép **Client ID** và **Access Token**

Không cần đăng ký app thủ công. Tokens hết hạn sau vài giờ.

### Cấu hình bot

**Biến môi trường (chỉ tài khoản mặc định):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Hoặc config:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

Nếu cả env và config được thiết lập, config ưu tiên.

### Kiểm soát truy cập (khuyến nghị)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (khuyến nghị) Chỉ user ID Twitch của bạn
    },
  },
}
```

Ưu tiên `allowFrom` cho danh sách cho phép cứng. Dùng `allowedRoles` nếu muốn truy cập dựa trên vai trò.

**Vai trò có sẵn:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Tại sao dùng user ID?** Usernames có thể thay đổi, dễ bị giả mạo. User ID là cố định.

Tìm user ID Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Chuyển username Twitch thành ID)

## Làm mới token (tùy chọn)

Tokens từ [Twitch Token Generator](https://twitchtokengenerator.com/) không thể tự động làm mới - tạo lại khi hết hạn.

Để tự động làm mới token, tạo ứng dụng Twitch của riêng bạn tại [Twitch Developer Console](https://dev.twitch.tv/console) và thêm vào config:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

Bot tự động làm mới tokens trước khi hết hạn và ghi log sự kiện làm mới.

## Hỗ trợ nhiều tài khoản

Dùng `channels.twitch.accounts` với tokens cho từng tài khoản. Xem [`gateway/configuration`](/gateway/configuration) cho mẫu chung.

Ví dụ (một tài khoản bot trong hai kênh):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**Lưu ý:** Mỗi tài khoản cần token riêng (một token mỗi kênh).

## Kiểm soát truy cập

### Hạn chế dựa trên vai trò

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### Danh sách cho phép theo User ID (bảo mật nhất)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### Truy cập dựa trên vai trò (thay thế)

`allowFrom` là danh sách cho phép cứng. Khi thiết lập, chỉ những user ID đó được phép.
Nếu muốn truy cập dựa trên vai trò, để `allowFrom` trống và cấu hình `allowedRoles`:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### Tắt yêu cầu @mention

Mặc định, `requireMention` là `true`. Để tắt và phản hồi tất cả tin nhắn:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## Khắc phục sự cố

Đầu tiên, chạy lệnh chẩn đoán:

```bash
openclaw doctor
openclaw channels status --probe
```

### Bot không phản hồi tin nhắn

**Kiểm tra kiểm soát truy cập:** Đảm bảo user ID của bạn có trong `allowFrom`, hoặc tạm thời xóa
`allowFrom` và đặt `allowedRoles: ["all"]` để thử nghiệm.

**Kiểm tra bot có trong kênh:** Bot phải tham gia kênh được chỉ định trong `channel`.

### Vấn đề token

**"Failed to connect" hoặc lỗi xác thực:**

- Đảm bảo `accessToken` là giá trị OAuth access token (thường bắt đầu với tiền tố `oauth:`)
- Kiểm tra token có scopes `chat:read` và `chat:write`
- Nếu dùng làm mới token, đảm bảo `clientSecret` và `refreshToken` được thiết lập

### Làm mới token không hoạt động

**Kiểm tra log cho sự kiện làm mới:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Nếu thấy "token refresh disabled (no refresh token)":

- Đảm bảo `clientSecret` được cung cấp
- Đảm bảo `refreshToken` được cung cấp

## Cấu hình

**Cấu hình tài khoản:**

- `username` - Tên tài khoản bot
- `accessToken` - OAuth access token với `chat:read` và `chat:write`
- `clientId` - Twitch Client ID (từ Token Generator hoặc app của bạn)
- `channel` - Kênh để tham gia (bắt buộc)
- `enabled` - Kích hoạt tài khoản này (mặc định: `true`)
- `clientSecret` - Tùy chọn: Để tự động làm mới token
- `refreshToken` - Tùy chọn: Để tự động làm mới token
- `expiresIn` - Thời gian hết hạn token tính bằng giây
- `obtainmentTimestamp` - Thời điểm lấy token
- `allowFrom` - Danh sách cho phép User ID
- `allowedRoles` - Kiểm soát truy cập dựa trên vai trò (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - Yêu cầu @mention (mặc định: `true`)

**Tùy chọn Provider:**

- `channels.twitch.enabled` - Bật/tắt khởi động kênh
- `channels.twitch.username` - Tên tài khoản bot (cấu hình đơn giản cho một tài khoản)
- `channels.twitch.accessToken` - OAuth access token (cấu hình đơn giản cho một tài khoản)
- `channels.twitch.clientId` - Twitch Client ID (cấu hình đơn giản cho một tài khoản)
- `channels.twitch.channel` - Kênh để tham gia (cấu hình đơn giản cho một tài khoản)
- `channels.twitch.accounts.<accountName>` - Cấu hình nhiều tài khoản (tất cả các trường tài khoản ở trên)

Ví dụ đầy đủ:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Hành động công cụ

Agent có thể gọi `twitch` với hành động:

- `send` - Gửi tin nhắn đến một kênh

Ví dụ:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## An toàn & vận hành

- **Xử lý tokens như mật khẩu** - Không bao giờ commit tokens vào git
- **Dùng tự động làm mới token** cho bot chạy lâu dài
- **Dùng danh sách cho phép user ID** thay vì usernames để kiểm soát truy cập
- **Theo dõi log** cho sự kiện làm mới token và trạng thái kết nối
- **Giới hạn scopes token tối thiểu** - Chỉ yêu cầu `chat:read` và `chat:write`
- **Nếu bị kẹt**: Khởi động lại gateway sau khi xác nhận không có process nào khác sở hữu session

## Giới hạn

- **500 ký tự** mỗi tin nhắn (tự động chia nhỏ tại ranh giới từ)
- Markdown bị loại bỏ trước khi chia nhỏ
- Không giới hạn tốc độ (dùng giới hạn tốc độ tích hợp của Twitch)\n