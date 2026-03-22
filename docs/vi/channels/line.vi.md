---
summary: "Hướng dẫn cài đặt, cấu hình và sử dụng plugin LINE Messaging API"
read_when:
  - Muốn kết nối OpenClaw với LINE
  - Cần thiết lập webhook + credential cho LINE
  - Muốn tùy chọn gửi tin nhắn đặc thù của LINE
title: LINE
---

# LINE (plugin)

LINE kết nối với OpenClaw qua LINE Messaging API. Plugin hoạt động như một webhook receiver trên gateway và dùng channel access token + channel secret để xác thực.

Trạng thái: hỗ trợ qua plugin. Hỗ trợ tin nhắn trực tiếp, chat nhóm, media, địa điểm, Flex messages, template messages, và quick replies. Không hỗ trợ reactions và threads.

## Cần cài plugin

Cài đặt plugin LINE:

```bash
openclaw plugins install @openclaw/line
```

Chạy local (khi chạy từ git repo):

```bash
openclaw plugins install ./extensions/line
```

## Thiết lập

1. Tạo tài khoản LINE Developers và mở Console: [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Tạo (hoặc chọn) một Provider và thêm một kênh **Messaging API**.
3. Sao chép **Channel access token** và **Channel secret** từ cài đặt kênh.
4. Bật **Use webhook** trong cài đặt Messaging API.
5. Đặt URL webhook tới endpoint của gateway (yêu cầu HTTPS):

```
https://gateway-host/line/webhook
```

Gateway phản hồi LINE’s webhook verification (GET) và inbound events (POST). Nếu cần path tùy chỉnh, đặt `channels.line.webhookPath` hoặc `channels.line.accounts.<id>.webhookPath` và cập nhật URL tương ứng.

Lưu ý bảo mật:

- LINE signature verification phụ thuộc vào body (HMAC trên raw body), nên OpenClaw áp dụng giới hạn body và timeout trước khi xác thực.
- OpenClaw xử lý sự kiện webhook từ raw request bytes đã xác thực. Middleware upstream biến đổi `req.body` bị bỏ qua để đảm bảo an toàn chữ ký.

## Cấu hình

Cấu hình tối thiểu:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Biến môi trường (chỉ tài khoản mặc định):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

File token/secret:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` và `secretFile` phải trỏ tới file thường. Symlinks bị từ chối.

Nhiều tài khoản:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Kiểm soát truy cập

Tin nhắn trực tiếp mặc định là pairing. Người gửi không xác định nhận mã pairing và tin nhắn của họ bị bỏ qua cho đến khi được chấp thuận.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Danh sách cho phép và chính sách:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: LINE user ID được phép cho DMs
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: LINE user ID được phép cho nhóm
- Ghi đè theo nhóm: `channels.line.groups.<groupId>.allowFrom`
- Lưu ý runtime: nếu `channels.line` hoàn toàn thiếu, runtime sẽ mặc định `groupPolicy="allowlist"` cho kiểm tra nhóm (dù `channels.defaults.groupPolicy` đã được đặt).

LINE ID phân biệt chữ hoa/thường. ID hợp lệ trông như:

- User: `U` + 32 ký tự hex
- Group: `C` + 32 ký tự hex
- Room: `R` + 32 ký tự hex

## Hành vi tin nhắn

- Text bị chia nhỏ tại 5000 ký tự.
- Định dạng Markdown bị loại bỏ; code block và bảng được chuyển thành Flex cards khi có thể.
- Phản hồi streaming được buffer; LINE nhận các phần đầy đủ với hoạt ảnh loading trong khi agent xử lý.
- Tải xuống media bị giới hạn bởi `channels.line.mediaMaxMb` (mặc định 10).

## Dữ liệu kênh (tin nhắn phong phú)

Sử dụng `channelData.line` để gửi quick replies, địa điểm, Flex cards, hoặc template messages.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

Plugin LINE cũng cung cấp lệnh `/card` cho các preset Flex message:

```
/card info "Welcome" "Thanks for joining!"
```

## Khắc phục sự cố

- **Webhook verification thất bại:** đảm bảo URL webhook là HTTPS và `channelSecret` khớp với LINE console.
- **Không có sự kiện inbound:** xác nhận path webhook khớp với `channels.line.webhookPath` và gateway có thể truy cập từ LINE.
- **Lỗi tải xuống media:** tăng `channels.line.mediaMaxMb` nếu media vượt quá giới hạn mặc định.\n