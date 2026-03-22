---
summary: "Tình trạng hỗ trợ, khả năng và cấu hình Tlon/Urbit"
read_when:
  - Làm việc với tính năng kênh Tlon/Urbit
title: "Tlon"
---

# Tlon (plugin)

Tlon là một ứng dụng nhắn tin phi tập trung xây dựng trên Urbit. OpenClaw kết nối với Urbit ship và có thể phản hồi DMs và tin nhắn nhóm. Mặc định, phản hồi nhóm yêu cầu @ mention và có thể siết chặt hơn qua allowlists.

Trạng thái: hỗ trợ qua plugin. Hỗ trợ DMs, group mentions, thread replies, định dạng rich text và tải ảnh lên. Chưa hỗ trợ reactions và polls.

## Cần plugin

Tlon là plugin, không đi kèm cài đặt core.

Cài qua CLI (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

Local checkout (khi chạy từ git repo):

```bash
openclaw plugins install ./extensions/tlon
```

Chi tiết: [Plugins](/tools/plugin)

## Cài đặt

1. Cài plugin Tlon.
2. Thu thập ship URL và mã đăng nhập.
3. Cấu hình `channels.tlon`.
4. Khởi động lại gateway.
5. DM bot hoặc mention trong kênh nhóm.

Cấu hình tối thiểu (tài khoản đơn):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // khuyến nghị: ship của bạn, luôn được phép
    },
  },
}
```

## Private/LAN ships

Mặc định, OpenClaw chặn hostname và IP nội bộ để bảo vệ SSRF. Nếu ship chạy trên mạng nội bộ (localhost, LAN IP, hoặc hostname nội bộ), cần bật thủ công:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Áp dụng cho các URL như:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Chỉ bật nếu tin tưởng mạng nội bộ. Cài đặt này tắt bảo vệ SSRF cho yêu cầu đến ship URL.

## Kênh nhóm

Auto-discovery bật mặc định. Có thể ghim kênh thủ công:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Tắt auto-discovery:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Kiểm soát truy cập

DM allowlist (trống = không cho phép DMs, dùng `ownerShip` cho luồng phê duyệt):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Ủy quyền nhóm (mặc định bị hạn chế):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## Hệ thống chủ sở hữu và phê duyệt

Đặt một owner ship để nhận yêu cầu phê duyệt khi người dùng không được phép cố gắng tương tác:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Owner ship **tự động được phép mọi nơi** — DM invites tự động chấp nhận và tin nhắn kênh luôn được phép. Không cần thêm owner vào `dmAllowlist` hoặc `defaultAuthorizedShips`.

Khi thiết lập, owner nhận thông báo DM cho:

- Yêu cầu DM từ ships không trong allowlist
- Mentions trong kênh không có ủy quyền
- Yêu cầu mời nhóm

## Cài đặt tự động chấp nhận

Tự động chấp nhận DM invites (cho ships trong dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Tự động chấp nhận mời nhóm:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Mục tiêu gửi (CLI/cron)

Dùng với `openclaw message send` hoặc cron delivery:

- DM: `~sampel-palnet` hoặc `dm/~sampel-palnet`
- Group: `chat/~host-ship/channel` hoặc `group:~host-ship/channel`

## Kỹ năng đi kèm

Plugin Tlon bao gồm một kỹ năng đi kèm ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)) cung cấp truy cập CLI cho các thao tác Tlon:

- **Contacts**: lấy/cập nhật hồ sơ, danh sách liên hệ
- **Channels**: danh sách, tạo, gửi tin nhắn, lấy lịch sử
- **Groups**: danh sách, tạo, quản lý thành viên
- **DMs**: gửi tin nhắn, phản hồi tin nhắn
- **Reactions**: thêm/xóa emoji reactions cho bài viết và DMs
- **Settings**: quản lý quyền plugin qua slash commands

Kỹ năng tự động có sẵn khi plugin được cài đặt.

## Khả năng

| Tính năng       | Trạng thái                              |
| --------------- | --------------------------------------- |
| Tin nhắn trực tiếp | ✅ Hỗ trợ                            |
| Nhóm/kênh       | ✅ Hỗ trợ (mặc định cần mention)       |
| Threads         | ✅ Hỗ trợ (tự động phản hồi trong thread) |
| Rich text       | ✅ Markdown chuyển sang định dạng Tlon  |
| Hình ảnh        | ✅ Tải lên lưu trữ Tlon                |
| Reactions       | ✅ Qua [kỹ năng đi kèm](#bundled-skill) |
| Polls           | ❌ Chưa hỗ trợ                         |
| Lệnh gốc        | ✅ Hỗ trợ (mặc định chỉ owner)         |

## Khắc phục sự cố

Chạy các lệnh sau:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Các lỗi thường gặp:

- **DMs bị bỏ qua**: người gửi không trong `dmAllowlist` và không có `ownerShip` cấu hình cho luồng phê duyệt.
- **Tin nhắn nhóm bị bỏ qua**: kênh không được phát hiện hoặc người gửi không được phép.
- **Lỗi kết nối**: kiểm tra ship URL có thể truy cập; bật `allowPrivateNetwork` cho ships nội bộ.
- **Lỗi xác thực**: xác minh mã đăng nhập còn hiệu lực (mã xoay vòng).

## Tham khảo cấu hình

Cấu hình đầy đủ: [Configuration](/gateway/configuration)

Tùy chọn provider:

- `channels.tlon.enabled`: bật/tắt khởi động kênh.
- `channels.tlon.ship`: tên Urbit ship của bot (ví dụ: `~sampel-palnet`).
- `channels.tlon.url`: ship URL (ví dụ: `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: mã đăng nhập ship.
- `channels.tlon.allowPrivateNetwork`: cho phép URL localhost/LAN (bypass SSRF).
- `channels.tlon.ownerShip`: owner ship cho hệ thống phê duyệt (luôn được phép).
- `channels.tlon.dmAllowlist`: ships được phép DM (trống = không có).
- `channels.tlon.autoAcceptDmInvites`: tự động chấp nhận DMs từ ships trong allowlist.
- `channels.tlon.autoAcceptGroupInvites`: tự động chấp nhận tất cả lời mời nhóm.
- `channels.tlon.autoDiscoverChannels`: tự động phát hiện kênh nhóm (mặc định: true).
- `channels.tlon.groupChannels`: kênh ghim thủ công.
- `channels.tlon.defaultAuthorizedShips`: ships được phép cho tất cả kênh.
- `channels.tlon.authorization.channelRules`: quy tắc ủy quyền theo kênh.
- `channels.tlon.showModelSignature`: thêm tên model vào tin nhắn.

## Ghi chú

- Phản hồi nhóm yêu cầu mention (ví dụ: `~your-bot-ship`) để phản hồi.
- Phản hồi thread: nếu tin nhắn đến trong thread, OpenClaw phản hồi trong thread.
- Rich text: Định dạng Markdown (bold, italic, code, headers, lists) chuyển sang định dạng gốc của Tlon.
- Hình ảnh: URLs được tải lên lưu trữ Tlon và nhúng dưới dạng image blocks.\n