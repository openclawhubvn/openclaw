---
summary: "Trạng thái hỗ trợ, khả năng và cấu hình của Tlon/Urbit"
read_when:
  - Đang làm việc với các tính năng kênh Tlon/Urbit
title: "Tlon"
---

# Tlon (plugin)

Tlon là một ứng dụng nhắn tin phi tập trung được xây dựng trên Urbit. OpenClaw kết nối với tàu Urbit của bạn và có thể phản hồi tin nhắn trực tiếp (DM) và tin nhắn nhóm. Mặc định, để phản hồi trong nhóm cần có @ mention và có thể giới hạn thêm qua danh sách cho phép.

Trạng thái: hỗ trợ qua plugin. Hỗ trợ DMs, @ mention trong nhóm, trả lời theo chuỗi, định dạng văn bản phong phú và tải lên hình ảnh. Chưa hỗ trợ phản ứng và khảo sát.

## Cần cài đặt plugin

Tlon được cung cấp dưới dạng plugin và không đi kèm với cài đặt gốc.

Cài đặt qua CLI (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

Kiểm tra cục bộ (khi chạy từ git repo):

```bash
openclaw plugins install ./extensions/tlon
```

Chi tiết: [Plugins](/tools/plugin)

## Thiết lập

1. Cài đặt plugin Tlon.
2. Thu thập URL tàu và mã đăng nhập của bạn.
3. Cấu hình `channels.tlon`.
4. Khởi động lại gateway.
5. Gửi DM cho bot hoặc nhắc đến nó trong kênh nhóm.

Cấu hình tối thiểu (tài khoản đơn):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // khuyến nghị: tàu của bạn, luôn được phép
    },
  },
}
```

## Tàu riêng/LAN

Mặc định, OpenClaw chặn các hostname và dải IP nội bộ để bảo vệ SSRF. Nếu tàu của bạn chạy trên mạng riêng (localhost, IP LAN, hoặc hostname nội bộ), bạn cần cho phép rõ ràng:

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

⚠️ Chỉ bật tính năng này nếu bạn tin tưởng mạng cục bộ của mình. Cài đặt này vô hiệu hóa bảo vệ SSRF cho các yêu cầu đến URL tàu của bạn.

## Kênh nhóm

Tự động phát hiện được bật mặc định. Bạn cũng có thể ghim kênh thủ công:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Tắt tự động phát hiện:

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

Danh sách cho phép DM (trống = không cho phép DM, sử dụng `ownerShip` cho luồng phê duyệt):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Ủy quyền nhóm (bị hạn chế mặc định):

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

Đặt một tàu chủ sở hữu để nhận yêu cầu phê duyệt khi người dùng không được phép cố gắng tương tác:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Tàu chủ sở hữu **tự động được phép ở mọi nơi** — lời mời DM được chấp nhận tự động và tin nhắn kênh luôn được phép. Bạn không cần thêm chủ sở hữu vào `dmAllowlist` hoặc `defaultAuthorizedShips`.

Khi được đặt, chủ sở hữu nhận thông báo DM cho:

- Yêu cầu DM từ các tàu không có trong danh sách cho phép
- Nhắc đến trong các kênh không có ủy quyền
- Yêu cầu mời nhóm

## Cài đặt tự động chấp nhận

Tự động chấp nhận lời mời DM (cho các tàu trong danh sách cho phép DM):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Tự động chấp nhận lời mời nhóm:

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

Sử dụng với `openclaw message send` hoặc cron delivery:

- DM: `~sampel-palnet` hoặc `dm/~sampel-palnet`
- Nhóm: `chat/~host-ship/channel` hoặc `group:~host-ship/channel`

## Kỹ năng đi kèm

Plugin Tlon bao gồm một kỹ năng đi kèm ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)) cung cấp truy cập CLI cho các hoạt động Tlon:

- **Liên hệ**: lấy/cập nhật hồ sơ, danh sách liên hệ
- **Kênh**: danh sách, tạo, gửi tin nhắn, lấy lịch sử
- **Nhóm**: danh sách, tạo, quản lý thành viên
- **DMs**: gửi tin nhắn, phản hồi tin nhắn
- **Phản ứng**: thêm/xóa phản ứng emoji cho bài viết và DMs
- **Cài đặt**: quản lý quyền plugin qua lệnh slash

Kỹ năng này tự động có sẵn khi plugin được cài đặt.

## Khả năng

| Tính năng       | Trạng thái                              |
| --------------- | --------------------------------------- |
| Tin nhắn trực tiếp | ✅ Hỗ trợ                            |
| Nhóm/kênh       | ✅ Hỗ trợ (mặc định cần mention)       |
| Chuỗi           | ✅ Hỗ trợ (tự động trả lời trong chuỗi) |
| Văn bản phong phú | ✅ Markdown chuyển đổi sang định dạng Tlon |
| Hình ảnh        | ✅ Tải lên lưu trữ Tlon                |
| Phản ứng        | ✅ Qua [kỹ năng đi kèm](#bundled-skill) |
| Khảo sát        | ❌ Chưa hỗ trợ                         |
| Lệnh gốc        | ✅ Hỗ trợ (mặc định chỉ chủ sở hữu)    |

## Khắc phục sự cố

Chạy các lệnh sau trước:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Các lỗi phổ biến:

- **DMs bị bỏ qua**: người gửi không có trong `dmAllowlist` và không có `ownerShip` được cấu hình cho luồng phê duyệt.
- **Tin nhắn nhóm bị bỏ qua**: kênh không được phát hiện hoặc người gửi không được ủy quyền.
- **Lỗi kết nối**: kiểm tra URL tàu có thể truy cập; bật `allowPrivateNetwork` cho tàu cục bộ.
- **Lỗi xác thực**: xác minh mã đăng nhập hiện tại (mã xoay vòng).

## Tham chiếu cấu hình

Cấu hình đầy đủ: [Configuration](/gateway/configuration)

Tùy chọn nhà cung cấp:

- `channels.tlon.enabled`: bật/tắt khởi động kênh.
- `channels.tlon.ship`: tên tàu Urbit của bot (ví dụ: `~sampel-palnet`).
- `channels.tlon.url`: URL tàu (ví dụ: `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: mã đăng nhập tàu.
- `channels.tlon.allowPrivateNetwork`: cho phép URL localhost/LAN (bỏ qua SSRF).
- `channels.tlon.ownerShip`: tàu chủ sở hữu cho hệ thống phê duyệt (luôn được phép).
- `channels.tlon.dmAllowlist`: các tàu được phép DM (trống = không có).
- `channels.tlon.autoAcceptDmInvites`: tự động chấp nhận DMs từ các tàu trong danh sách cho phép.
- `channels.tlon.autoAcceptGroupInvites`: tự động chấp nhận tất cả lời mời nhóm.
- `channels.tlon.autoDiscoverChannels`: tự động phát hiện kênh nhóm (mặc định: true).
- `channels.tlon.groupChannels`: các kênh được ghim thủ công.
- `channels.tlon.defaultAuthorizedShips`: các tàu được ủy quyền cho tất cả các kênh.
- `channels.tlon.authorization.channelRules`: quy tắc ủy quyền theo kênh.
- `channels.tlon.showModelSignature`: thêm tên mô hình vào tin nhắn.

## Ghi chú

- Trả lời nhóm yêu cầu một mention (ví dụ: `~your-bot-ship`) để phản hồi.
- Trả lời theo chuỗi: nếu tin nhắn đến nằm trong một chuỗi, OpenClaw sẽ trả lời trong chuỗi đó.
- Văn bản phong phú: Định dạng Markdown (in đậm, in nghiêng, mã, tiêu đề, danh sách) được chuyển đổi sang định dạng gốc của Tlon.
- Hình ảnh: URL được tải lên lưu trữ Tlon và nhúng dưới dạng khối hình ảnh.
