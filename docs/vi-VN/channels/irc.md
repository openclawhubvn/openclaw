---
title: IRC
summary: "Thiết lập plugin IRC, kiểm soát truy cập và xử lý sự cố"
read_when:
  - Bạn muốn kết nối OpenClaw với các kênh hoặc tin nhắn trực tiếp trên IRC
  - Bạn đang cấu hình danh sách cho phép IRC, chính sách nhóm, hoặc điều kiện nhắc tên
---

# IRC

Sử dụng IRC khi bạn muốn OpenClaw hoạt động trong các kênh truyền thống (`#room`) và tin nhắn trực tiếp. IRC được cung cấp dưới dạng plugin mở rộng, nhưng được cấu hình trong phần cấu hình chính dưới `channels.irc`.

## Bắt đầu nhanh

1. Kích hoạt cấu hình IRC trong `~/.openclaw/openclaw.json`.
2. Thiết lập ít nhất:

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
- Với `groupPolicy="allowlist"`, thiết lập `channels.irc.groups` để xác định các kênh được phép.
- Sử dụng TLS (`channels.irc.tls=true`) trừ khi bạn chấp nhận truyền tải không mã hóa.

## Kiểm soát truy cập

Có hai "cổng" riêng biệt cho các kênh IRC:

1. **Truy cập kênh** (`groupPolicy` + `groups`): liệu bot có chấp nhận tin nhắn từ một kênh hay không.
2. **Truy cập người gửi** (`groupAllowFrom` / `groups["#channel"].allowFrom` cho từng kênh): ai được phép kích hoạt bot trong kênh đó.

Các khóa cấu hình:

- Danh sách cho phép DM (truy cập người gửi DM): `channels.irc.allowFrom`
- Danh sách cho phép người gửi nhóm (truy cập người gửi kênh): `channels.irc.groupAllowFrom`
- Kiểm soát từng kênh (quy tắc kênh + người gửi + nhắc tên): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` cho phép các kênh chưa cấu hình (**vẫn bị điều kiện nhắc tên theo mặc định**)

Các mục trong danh sách cho phép nên sử dụng định danh người gửi ổn định (`nick!user@host`).
Khớp tên nick không ổn định và chỉ được kích hoạt khi `channels.irc.dangerouslyAllowNameMatching: true`.

### Lưu ý thường gặp: `allowFrom` dành cho DM, không phải kênh

Nếu bạn thấy các log như:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...điều đó có nghĩa là người gửi không được phép cho tin nhắn **nhóm/kênh**. Khắc phục bằng cách:

- thiết lập `channels.irc.groupAllowFrom` (toàn cầu cho tất cả các kênh), hoặc
- thiết lập danh sách cho phép người gửi từng kênh: `channels.irc.groups["#channel"].allowFrom`

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

## Kích hoạt trả lời (nhắc tên)

Ngay cả khi một kênh được phép (qua `groupPolicy` + `groups`) và người gửi được phép, OpenClaw mặc định **điều kiện nhắc tên** trong các ngữ cảnh nhóm.

Điều đó có nghĩa là bạn có thể thấy các log như `drop channel … (missing-mention)` trừ khi tin nhắn bao gồm một mẫu nhắc tên khớp với bot.

Để bot trả lời trong một kênh IRC **mà không cần nhắc tên**, tắt điều kiện nhắc tên cho kênh đó:

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

Hoặc để cho phép **tất cả** các kênh IRC (không có danh sách cho phép từng kênh) và vẫn trả lời mà không cần nhắc tên:

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

## Lưu ý bảo mật (khuyến nghị cho các kênh công khai)

Nếu bạn cho phép `allowFrom: ["*"]` trong một kênh công khai, bất kỳ ai cũng có thể kích hoạt bot.
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

Sử dụng `toolsBySender` để áp dụng chính sách nghiêm ngặt hơn cho `"*"` và lỏng lẻo hơn cho nick của bạn:

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

Lưu ý:

- Các khóa `toolsBySender` nên sử dụng `id:` cho các giá trị định danh người gửi IRC:
  `id:eigen` hoặc `id:eigen!~eigen@174.127.248.171` để khớp mạnh hơn.
- Các khóa không có tiền tố vẫn được chấp nhận và khớp như `id:` chỉ.
- Chính sách người gửi khớp đầu tiên sẽ thắng; `"*"` là dự phòng wildcard.

Để biết thêm về truy cập nhóm so với điều kiện nhắc tên (và cách chúng tương tác), xem: [/channels/groups](/channels/groups).

## NickServ

Để xác định với NickServ sau khi kết nối:

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

Tắt `register` sau khi nick đã được đăng ký để tránh các lần thử REGISTER lặp lại.

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

- Nếu bot kết nối nhưng không bao giờ trả lời trong các kênh, hãy kiểm tra `channels.irc.groups` **và** liệu điều kiện nhắc tên có đang loại bỏ tin nhắn (`missing-mention`). Nếu bạn muốn nó trả lời mà không cần nhắc tên, đặt `requireMention:false` cho kênh.
- Nếu đăng nhập thất bại, kiểm tra tính khả dụng của nick và mật khẩu máy chủ.
- Nếu TLS thất bại trên một mạng tùy chỉnh, kiểm tra thiết lập host/port và chứng chỉ.
