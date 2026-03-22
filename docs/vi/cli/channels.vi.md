---
summary: "CLI tham khảo cho `openclaw channels` (tài khoản, trạng thái, đăng nhập/đăng xuất, logs)"
read_when:
  - Muốn thêm/xóa tài khoản kênh (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage)
  - Muốn kiểm tra trạng thái kênh hoặc xem logs kênh
title: "channels"
---

# `openclaw channels`

Quản lý tài khoản kênh chat và trạng thái runtime trên Gateway.

Tài liệu liên quan:

- Hướng dẫn kênh: [Channels](/channels/index)
- Cấu hình Gateway: [Configuration](/gateway/configuration)

## Lệnh thông dụng

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Thêm / xóa tài khoản

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Mẹo: `openclaw channels add --help` hiển thị các flag theo từng kênh (token, private key, app token, signal-cli paths, v.v.).

Khi chạy `openclaw channels add` không có flag, wizard tương tác có thể hỏi:

- ID tài khoản cho từng kênh đã chọn
- Tên hiển thị tùy chọn cho các tài khoản đó
- `Bind configured channel accounts to agents now?`

Nếu xác nhận bind ngay, wizard sẽ hỏi agent nào sở hữu từng tài khoản kênh đã cấu hình và ghi các routing bindings theo tài khoản.

Có thể quản lý các quy tắc routing tương tự sau này với `openclaw agents bindings`, `openclaw agents bind`, và `openclaw agents unbind` (xem [agents](/cli/agents)).

Khi thêm tài khoản không mặc định vào kênh vẫn dùng cài đặt single-account top-level (chưa có mục `channels.<channel>.accounts`), OpenClaw chuyển các giá trị single-account top-level vào `channels.<channel>.accounts.default`, rồi ghi tài khoản mới. Điều này giữ nguyên hành vi tài khoản gốc khi chuyển sang dạng multi-account.

Hành vi routing vẫn nhất quán:

- Các bindings chỉ có kênh (không `accountId`) tiếp tục khớp với tài khoản mặc định.
- `channels add` không tự động tạo hoặc ghi đè bindings ở chế độ không tương tác.
- Thiết lập tương tác có thể thêm bindings theo tài khoản.

Nếu cấu hình đã ở trạng thái hỗn hợp (có tài khoản được đặt tên, thiếu `default`, và giá trị single-account top-level vẫn còn), chạy `openclaw doctor --fix` để chuyển các giá trị theo tài khoản vào `accounts.default`.

## Đăng nhập / đăng xuất (tương tác)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

## Khắc phục sự cố

- Chạy `openclaw status --deep` để kiểm tra tổng quát.
- Dùng `openclaw doctor` để được hướng dẫn sửa lỗi.
- `openclaw channels list` in ra `Claude: HTTP 403 ... user:profile` → snapshot sử dụng cần scope `user:profile`. Dùng `--no-usage`, hoặc cung cấp session key của claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), hoặc xác thực lại qua Claude Code CLI.
- `openclaw channels status` sẽ dùng tóm tắt từ config khi gateway không truy cập được. Nếu credential kênh được cấu hình qua SecretRef nhưng không có sẵn trong command path hiện tại, nó sẽ báo tài khoản đó là đã cấu hình với ghi chú suy giảm thay vì hiển thị là chưa cấu hình.

## Khả năng probe

Lấy gợi ý khả năng của provider (intents/scopes nếu có) cùng hỗ trợ tính năng tĩnh:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Ghi chú:

- `--channel` là tùy chọn; bỏ qua để liệt kê mọi kênh (bao gồm extensions).
- `--target` chấp nhận `channel:<id>` hoặc id kênh số thô và chỉ áp dụng cho Discord.
- Probes là đặc thù provider: Discord intents + quyền kênh tùy chọn; Slack bot + user scopes; Telegram bot flags + webhook; Signal daemon version; Microsoft Teams app token + Graph roles/scopes (được chú thích nếu biết). Kênh không có probes báo `Probe: unavailable`.

## Giải quyết tên thành ID

Giải quyết tên kênh/người dùng thành ID bằng thư mục provider:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Ghi chú:

- Dùng `--kind user|group|auto` để ép kiểu mục tiêu.
- Giải quyết ưu tiên khớp hoạt động khi nhiều mục có cùng tên.
- `channels resolve` chỉ đọc. Nếu tài khoản được chọn cấu hình qua SecretRef nhưng credential đó không có sẵn trong command path hiện tại, lệnh trả về kết quả không giải quyết được với ghi chú thay vì hủy toàn bộ chạy.\n