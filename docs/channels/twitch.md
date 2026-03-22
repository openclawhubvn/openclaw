---
summary: "Khám phá cách cấu hình và thiết lập bot chat trên Twitch để nâng cao trải nghiệm người xem và quản lý kênh hiệu quả."
read_when:
  - Thiết lập tích hợp chat Twitch cho OpenClaw
title: "Hướng Dẫn Cấu Hình Bot Chat Twitch"
---

# Twitch (plugin)

Hỗ trợ chat Twitch thông qua kết nối IRC. OpenClaw kết nối như một người dùng Twitch (tài khoản bot) để nhận và gửi tin nhắn trong các kênh.

## Yêu cầu plugin

Twitch được cung cấp dưới dạng plugin và không đi kèm với cài đặt gốc.

Cài đặt qua CLI (npm registry):

```bash
openclaw plugins install @openclaw/twitch
```

Kiểm tra cục bộ (khi chạy từ repo git):

```bash
openclaw plugins install ./extensions/twitch
```

Chi tiết: [Plugins](/tools/plugin)

## Thiết lập nhanh (cho người mới bắt đầu)

1. Tạo một tài khoản Twitch riêng cho bot (hoặc sử dụng tài khoản hiện có).
2. Tạo thông tin xác thực: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Chọn **Bot Token**
   - Đảm bảo các phạm vi `chat:read` và `chat:write` đã được chọn
   - Sao chép **Client ID** và **Access Token**
3. Tìm ID người dùng Twitch của bạn: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
4. Cấu hình token:
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (chỉ tài khoản mặc định)
   - Hoặc config: `channels.twitch.accessToken`
   - Nếu cả hai đều được thiết lập, config sẽ được ưu tiên (env chỉ là tài khoản mặc định).
5. Khởi động gateway.

**⚠️ Quan trọng:** Thêm kiểm soát truy cập (`allowFrom` hoặc `allowedRoles`) để ngăn người dùng không được phép kích hoạt bot. `requireMention` mặc định là `true`.

Cấu hình tối thiểu:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Tài khoản Twitch của bot
      accessToken: "oauth:abc123...", // OAuth Access Token (hoặc sử dụng biến môi trường OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID từ Token Generator
      channel: "vevisk", // Kênh Twitch nào để tham gia chat (bắt buộc)
      allowFrom: ["123456789"], // (khuyến nghị) Chỉ ID người dùng Twitch của bạn - lấy từ https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Nó là gì

- Một kênh Twitch thuộc sở hữu của Gateway.
- Định tuyến xác định: trả lời luôn quay lại Twitch.
- Mỗi tài khoản ánh xạ tới một khóa phiên riêng biệt `agent:<agentId>:twitch:<accountName>`.
- `username` là tài khoản của bot (người xác thực), `channel` là phòng chat nào để tham gia.

## Thiết lập (chi tiết)

### Tạo thông tin xác thực

Sử dụng [Twitch Token Generator](https://twitchtokengenerator.com/):

- Chọn **Bot Token**
- Đảm bảo các phạm vi `chat:read` và `chat:write` đã được chọn
- Sao chép **Client ID** và **Access Token**

Không cần đăng ký ứng dụng thủ công. Token hết hạn sau vài giờ.

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

Nếu cả biến môi trường và config đều được thiết lập, config sẽ được ưu tiên.

### Kiểm soát truy cập (khuyến nghị)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (khuyến nghị) Chỉ ID người dùng Twitch của bạn
    },
  },
}
```

Ưu tiên `allowFrom` cho danh sách cho phép cứng. Sử dụng `allowedRoles` nếu bạn muốn truy cập dựa trên vai trò.

**Vai trò có sẵn:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Tại sao sử dụng ID người dùng?** Tên người dùng có thể thay đổi, cho phép giả mạo. ID người dùng là vĩnh viễn.

Tìm ID người dùng Twitch của bạn: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Chuyển đổi tên người dùng Twitch của bạn thành ID)

## Làm mới token (tùy chọn)

Token từ [Twitch Token Generator](https://twitchtokengenerator.com/) không thể tự động làm mới - tạo lại khi hết hạn.

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

Bot tự động làm mới token trước khi hết hạn và ghi lại sự kiện làm mới.

## Hỗ trợ nhiều tài khoản

Sử dụng `channels.twitch.accounts` với token cho từng tài khoản. Xem [`gateway/configuration`](/gateway/configuration) cho mẫu chia sẻ.

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

**Lưu ý:** Mỗi tài khoản cần token riêng (một token cho mỗi kênh).

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

### Danh sách cho phép theo ID người dùng (an toàn nhất)

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

`allowFrom` là danh sách cho phép cứng. Khi được thiết lập, chỉ những ID người dùng đó được phép.
Nếu bạn muốn truy cập dựa trên vai trò, để trống `allowFrom` và cấu hình `allowedRoles` thay thế:

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

### Vô hiệu hóa yêu cầu @mention

Mặc định, `requireMention` là `true`. Để vô hiệu hóa và phản hồi tất cả tin nhắn:

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

Đầu tiên, chạy các lệnh chẩn đoán:

```bash
openclaw doctor
openclaw channels status --probe
```

### Bot không phản hồi tin nhắn

**Kiểm tra kiểm soát truy cập:** Đảm bảo ID người dùng của bạn có trong `allowFrom`, hoặc tạm thời xóa
`allowFrom` và thiết lập `allowedRoles: ["all"]` để kiểm tra.

**Kiểm tra bot có trong kênh:** Bot phải tham gia kênh được chỉ định trong `channel`.

### Vấn đề về token

**"Không thể kết nối" hoặc lỗi xác thực:**

- Xác minh `accessToken` là giá trị OAuth access token (thường bắt đầu với tiền tố `oauth:`)
- Kiểm tra token có các phạm vi `chat:read` và `chat:write`
- Nếu sử dụng làm mới token, xác minh `clientSecret` và `refreshToken` đã được thiết lập

### Làm mới token không hoạt động

**Kiểm tra nhật ký cho các sự kiện làm mới:**

```
Sử dụng nguồn token môi trường cho mybot
Access token đã được làm mới cho người dùng 123456 (hết hạn trong 14400s)
```

Nếu bạn thấy "làm mới token bị vô hiệu hóa (không có token làm mới)":

- Đảm bảo `clientSecret` đã được cung cấp
- Đảm bảo `refreshToken` đã được cung cấp

## Cấu hình

**Cấu hình tài khoản:**

- `username` - Tên người dùng bot
- `accessToken` - OAuth access token với `chat:read` và `chat:write`
- `clientId` - Twitch Client ID (từ Token Generator hoặc ứng dụng của bạn)
- `channel` - Kênh để tham gia (bắt buộc)
- `enabled` - Kích hoạt tài khoản này (mặc định: `true`)
- `clientSecret` - Tùy chọn: Để tự động làm mới token
- `refreshToken` - Tùy chọn: Để tự động làm mới token
- `expiresIn` - Thời gian hết hạn token tính bằng giây
- `obtainmentTimestamp` - Thời điểm lấy token
- `allowFrom` - Danh sách cho phép ID người dùng
- `allowedRoles` - Kiểm soát truy cập dựa trên vai trò (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - Yêu cầu @mention (mặc định: `true`)

**Tùy chọn nhà cung cấp:**

- `channels.twitch.enabled` - Bật/tắt khởi động kênh
- `channels.twitch.username` - Tên người dùng bot (cấu hình đơn giản cho một tài khoản)
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

- `send` - Gửi một tin nhắn đến một kênh

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

- **Xử lý token như mật khẩu** - Không bao giờ commit token vào git
- **Sử dụng làm mới token tự động** cho bot chạy lâu dài
- **Sử dụng danh sách cho phép ID người dùng** thay vì tên người dùng để kiểm soát truy cập
- **Giám sát nhật ký** cho các sự kiện làm mới token và trạng thái kết nối
- **Giới hạn phạm vi token tối thiểu** - Chỉ yêu cầu `chat:read` và `chat:write`
- **Nếu gặp khó khăn**: Khởi động lại gateway sau khi xác nhận không có quá trình nào khác sở hữu phiên

## Giới hạn

- **500 ký tự** mỗi tin nhắn (tự động chia nhỏ tại ranh giới từ)
- Markdown bị loại bỏ trước khi chia nhỏ
- Không giới hạn tốc độ (sử dụng giới hạn tốc độ tích hợp của Twitch)
