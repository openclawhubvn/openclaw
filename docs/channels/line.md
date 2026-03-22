---
summary: "Tìm hiểu cách thiết lập và cấu hình LINE Messaging API để tối ưu hóa giao tiếp và tích hợp với hệ thống của bạn."
read_when:
  - Bạn muốn kết nối OpenClaw với LINE
  - Bạn cần thiết lập webhook và thông tin xác thực LINE
  - Bạn muốn tùy chọn tin nhắn đặc thù cho LINE
title: "Hướng Dẫn Cấu Hình LINE Messaging API"
---

# LINE (plugin)

LINE kết nối với OpenClaw thông qua LINE Messaging API. Plugin này hoạt động như một webhook receiver trên gateway và sử dụng channel access token cùng channel secret để xác thực.

Trạng thái: hỗ trợ qua plugin. Hỗ trợ tin nhắn trực tiếp, trò chuyện nhóm, media, vị trí, tin nhắn Flex, tin nhắn mẫu và trả lời nhanh. Không hỗ trợ phản hồi và luồng hội thoại.

## Yêu cầu plugin

Cài đặt plugin LINE:

```bash
openclaw plugins install @openclaw/line
```

Kiểm tra cục bộ (khi chạy từ repo git):

```bash
openclaw plugins install ./extensions/line
```

## Thiết lập

1. Tạo tài khoản LINE Developers và mở Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Tạo (hoặc chọn) một Provider và thêm một kênh **Messaging API**.
3. Sao chép **Channel access token** và **Channel secret** từ cài đặt kênh.
4. Bật **Use webhook** trong cài đặt Messaging API.
5. Đặt URL webhook đến endpoint của gateway (yêu cầu HTTPS):

```
https://gateway-host/line/webhook
```

Gateway sẽ phản hồi xác minh webhook của LINE (GET) và các sự kiện inbound (POST). Nếu cần đường dẫn tùy chỉnh, đặt `channels.line.webhookPath` hoặc `channels.line.accounts.<id>.webhookPath` và cập nhật URL tương ứng.

Lưu ý bảo mật:

- Xác minh chữ ký của LINE phụ thuộc vào nội dung (HMAC trên nội dung gốc), do đó OpenClaw áp dụng giới hạn và thời gian chờ trước khi xác minh.
- OpenClaw xử lý các sự kiện webhook từ byte yêu cầu gốc đã được xác minh. Các giá trị `req.body` đã được middleware biến đổi sẽ bị bỏ qua để đảm bảo tính toàn vẹn của chữ ký.

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

Tệp token/secret:

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

`tokenFile` và `secretFile` phải trỏ đến các tệp thông thường. Symlinks bị từ chối.

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

Tin nhắn trực tiếp mặc định là pairing. Người gửi không xác định sẽ nhận mã pairing và tin nhắn của họ bị bỏ qua cho đến khi được chấp thuận.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Danh sách cho phép và chính sách:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: danh sách cho phép ID người dùng LINE cho DMs
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: danh sách cho phép ID người dùng LINE cho nhóm
- Ghi đè theo nhóm: `channels.line.groups.<groupId>.allowFrom`
- Lưu ý khi chạy: nếu `channels.line` hoàn toàn thiếu, runtime sẽ quay lại `groupPolicy="allowlist"` cho kiểm tra nhóm (ngay cả khi `channels.defaults.groupPolicy` đã được đặt).

ID LINE phân biệt chữ hoa chữ thường. ID hợp lệ trông như:

- Người dùng: `U` + 32 ký tự hex
- Nhóm: `C` + 32 ký tự hex
- Phòng: `R` + 32 ký tự hex

## Hành vi tin nhắn

- Văn bản được chia nhỏ ở 5000 ký tự.
- Định dạng Markdown bị loại bỏ; các khối mã và bảng được chuyển thành thẻ Flex khi có thể.
- Phản hồi streaming được đệm; LINE nhận các khối đầy đủ với hoạt ảnh tải trong khi agent làm việc.
- Tải xuống media bị giới hạn bởi `channels.line.mediaMaxMb` (mặc định 10).

## Dữ liệu kênh (tin nhắn phong phú)

Sử dụng `channelData.line` để gửi trả lời nhanh, vị trí, thẻ Flex hoặc tin nhắn mẫu.

```json5
{
  text: "Đây là thông tin của bạn",
  channelData: {
    line: {
      quickReplies: ["Trạng thái", "Trợ giúp"],
      location: {
        title: "Văn phòng",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Thẻ trạng thái",
        contents: {
          /* Payload Flex */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Tiếp tục?",
        confirmLabel: "Có",
        confirmData: "yes",
        cancelLabel: "Không",
        cancelData: "no",
      },
    },
  },
}
```

Plugin LINE cũng cung cấp lệnh `/card` cho các mẫu tin nhắn Flex:

```
/card info "Chào mừng" "Cảm ơn bạn đã tham gia!"
```

## Khắc phục sự cố

- **Xác minh webhook thất bại:** đảm bảo URL webhook là HTTPS và `channelSecret` khớp với console LINE.
- **Không có sự kiện inbound:** xác nhận đường dẫn webhook khớp với `channels.line.webhookPath` và gateway có thể truy cập từ LINE.
- **Lỗi tải xuống media:** tăng `channels.line.mediaMaxMb` nếu media vượt quá giới hạn mặc định.
