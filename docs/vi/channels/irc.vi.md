---
title: IRC
summary: "Cài đặt plugin IRC, kiểm soát truy cập và xử lý sự cố"
read_when:
  - Muốn kết nối OpenClaw với kênh IRC hoặc tin nhắn trực tiếp
  - Đang cấu hình danh sách cho phép IRC, chính sách nhóm, hoặc kiểm soát mention
---

# IRC

Dùng IRC khi muốn OpenClaw hoạt động trong các kênh cổ điển (`#room`) và tin nhắn trực tiếp. IRC là plugin mở rộng, nhưng cấu hình trong file chính dưới `channels.irc`.

## Bắt đầu nhanh

1. Bật cấu hình IRC trong `~/.openclaw/openclaw.json`.
2. Cài đặt ít nhất:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.libera.chat",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

3. Khởi động lại gateway:

```bash
openclaw gateway run
```

## Mặc định bảo mật

- `channels.irc.dmPolicy` mặc định là `"pairing"`.
- `channels.irc.groupPolicy` mặc định là `"allowlist"`.
- Với `groupPolicy="allowlist"`, đặt `channels.irc.groups` để định nghĩa kênh được phép.
- Dùng TLS (`channels.irc.tls=true`) trừ khi chấp nhận truyền tải plaintext.

## Kiểm soát truy cập

Có hai "cổng" riêng biệt cho kênh IRC:

1. **Truy cập kênh** (`groupPolicy` + `groups`): bot có chấp nhận tin nhắn từ kênh không.
2. **Truy cập người gửi** (`groupAllowFrom` / `groups["#channel"].allowFrom`): ai được phép kích hoạt bot trong kênh đó.

Các khóa cấu hình:

- Danh sách cho phép DM (truy cập người gửi DM): `channels.irc.allowFrom`
- Danh sách cho phép người gửi nhóm (truy cập người gửi kênh): `channels.irc.groupAllowFrom`
- Kiểm soát từng kênh (kênh + người gửi + quy tắc mention): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` cho phép kênh chưa cấu hình (**vẫn kiểm soát mention mặc định**)

Danh sách cho phép nên dùng định danh người gửi ổn định (`nick!user@host`).
Khớp nick trần có thể thay đổi và chỉ bật khi `channels.irc.dangerouslyAllowNameMatching: true`.

### Lưu ý thường gặp: `allowFrom` dành cho DM, không phải kênh

Nếu thấy log như:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...nghĩa là người gửi không được phép cho tin nhắn **nhóm/kênh**. Sửa bằng cách:

- đặt `channels.irc.groupAllowFrom` (toàn cầu cho tất cả kênh), hoặc
- đặt danh sách cho phép người gửi từng kênh: `channels.irc.groups["#channel"].allowFrom`

Ví dụ (cho phép bất kỳ ai trong `#tuirc-dev` nói chuyện với bot):

```json55
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Kích hoạt trả lời (mentions)

Dù kênh được phép (qua `groupPolicy` + `groups`) và người gửi được phép, OpenClaw mặc định **kiểm soát mention** trong ngữ cảnh nhóm.

Điều này có nghĩa có thể thấy log như `drop channel … (missing-mention)` trừ khi tin nhắn có mẫu mention khớp với bot.

Để bot trả lời trong kênh IRC **mà không cần mention**, tắt kiểm soát mention cho kênh đó:

```json55
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Hoặc cho phép **tất cả** kênh IRC (không có danh sách cho phép từng kênh) và vẫn trả lời không cần mention:

```json55
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Lưu ý bảo mật (khuyến nghị cho kênh công khai)

Nếu cho phép `allowFrom: ["*"]` trong kênh công khai, bất kỳ ai cũng có thể kích hoạt bot.
Để giảm rủi ro, hạn chế công cụ cho kênh đó.

### Cùng công cụ cho mọi người trong kênh

```json55
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Công cụ khác nhau cho từng người gửi (chủ sở hữu có nhiều quyền hơn)

Dùng `toolsBySender` để áp dụng chính sách nghiêm ngặt hơn cho `"*"` và lỏng hơn cho nick của bạn:

```json55
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Ghi chú:

- Khóa `toolsBySender` nên dùng `id:` cho giá trị định danh người gửi IRC:
  `id:eigen` hoặc `id:eigen!~eigen@174.127.248.171` để khớp mạnh hơn.
- Các khóa không có tiền tố vẫn được chấp nhận và khớp như `id:`.
- Chính sách người gửi khớp đầu tiên sẽ thắng; `"*"` là dự phòng wildcard.

Để biết thêm về truy cập nhóm và kiểm soát mention (và cách chúng tương tác), xem: [/channels/groups](/channels/groups).

## NickServ

Để xác thực với NickServ sau khi kết nối:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Đăng ký một lần tùy chọn khi kết nối:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Tắt `register` sau khi nick đã được đăng ký để tránh lặp lại yêu cầu REGISTER.

## Biến môi trường

Tài khoản mặc định hỗ trợ:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (phân tách bằng dấu phẩy)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

## Xử lý sự cố

- Nếu bot kết nối nhưng không bao giờ trả lời trong kênh, kiểm tra `channels.irc.groups` **và** xem kiểm soát mention có đang bỏ qua tin nhắn không (`missing-mention`). Nếu muốn bot trả lời không cần ping, đặt `requireMention:false` cho kênh.
- Nếu đăng nhập thất bại, kiểm tra khả dụng của nick và mật khẩu server.
- Nếu TLS thất bại trên mạng tùy chỉnh, kiểm tra host/port và thiết lập chứng chỉ.\n