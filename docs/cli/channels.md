---
summary: "Khám phá cách sử dụng OpenClaw Channels CLI để quản lý tài khoản, trạng thái, và thực hiện đăng nhập/đăng xuất hiệu quả."
read_when:
  - Bạn muốn thêm/xóa tài khoản kênh (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage)
  - Bạn muốn kiểm tra trạng thái kênh hoặc theo dõi nhật ký kênh
title: "Hướng Dẫn Sử Dụng OpenClaw Channels CLI"
---

# `openclaw channels`

Quản lý tài khoản kênh chat và trạng thái hoạt động của chúng trên Gateway.

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

Mẹo: `openclaw channels add --help` hiển thị các cờ cho từng kênh (token, private key, app token, đường dẫn signal-cli, v.v.).

Khi chạy `openclaw channels add` mà không có cờ, trình hướng dẫn tương tác có thể yêu cầu:

- ID tài khoản cho từng kênh đã chọn
- Tên hiển thị tùy chọn cho các tài khoản đó
- `Liên kết tài khoản kênh đã cấu hình với agents ngay bây giờ?`

Nếu xác nhận liên kết ngay, trình hướng dẫn sẽ hỏi agent nào nên sở hữu từng tài khoản kênh đã cấu hình và ghi các liên kết định tuyến theo tài khoản.

Bạn cũng có thể quản lý các quy tắc định tuyến tương tự sau này với `openclaw agents bindings`, `openclaw agents bind`, và `openclaw agents unbind` (xem [agents](/cli/agents)).

Khi thêm tài khoản không mặc định vào kênh vẫn đang sử dụng cài đặt cấp cao nhất cho một tài khoản (chưa có mục `channels.<channel>.accounts`), OpenClaw sẽ chuyển các giá trị cấp cao nhất cho một tài khoản vào `channels.<channel>.accounts.default`, sau đó ghi tài khoản mới. Điều này giữ nguyên hành vi tài khoản gốc trong khi chuyển sang cấu trúc nhiều tài khoản.

Hành vi định tuyến vẫn nhất quán:

- Các liên kết chỉ có kênh hiện tại (không có `accountId`) tiếp tục khớp với tài khoản mặc định.
- `channels add` không tự động tạo hoặc viết lại liên kết trong chế độ không tương tác.
- Cài đặt tương tác có thể thêm các liên kết theo tài khoản tùy chọn.

Nếu cấu hình của bạn đã ở trạng thái hỗn hợp (có tài khoản được đặt tên, thiếu `default`, và các giá trị cấp cao nhất cho một tài khoản vẫn được đặt), chạy `openclaw doctor --fix` để chuyển các giá trị theo tài khoản vào `accounts.default`.

## Đăng nhập / đăng xuất (tương tác)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

## Khắc phục sự cố

- Chạy `openclaw status --deep` để kiểm tra tổng quát.
- Sử dụng `openclaw doctor` để được hướng dẫn sửa lỗi.
- `openclaw channels list` in ra `Claude: HTTP 403 ... user:profile` → ảnh chụp nhanh sử dụng cần phạm vi `user:profile`. Sử dụng `--no-usage`, hoặc cung cấp khóa phiên claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), hoặc xác thực lại qua Claude Code CLI.
- `openclaw channels status` sẽ dựa vào tóm tắt cấu hình khi gateway không thể truy cập. Nếu thông tin xác thực kênh được hỗ trợ được cấu hình qua SecretRef nhưng không có sẵn trong đường dẫn lệnh hiện tại, nó sẽ báo cáo tài khoản đó là đã cấu hình với ghi chú suy giảm thay vì hiển thị là chưa cấu hình.

## Khả năng thăm dò

Lấy gợi ý khả năng của nhà cung cấp (ý định/phạm vi nếu có) cùng với hỗ trợ tính năng tĩnh:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Ghi chú:

- `--channel` là tùy chọn; bỏ qua để liệt kê mọi kênh (bao gồm cả phần mở rộng).
- `--target` chấp nhận `channel:<id>` hoặc ID kênh số thô và chỉ áp dụng cho Discord.
- Thăm dò là cụ thể cho từng nhà cung cấp: ý định Discord + quyền kênh tùy chọn; phạm vi bot + người dùng Slack; cờ bot Telegram + webhook; phiên bản daemon Signal; token ứng dụng Microsoft Teams + vai trò/phạm vi Graph (được chú thích nếu biết). Các kênh không có thăm dò báo cáo `Probe: unavailable`.

## Giải quyết tên thành ID

Giải quyết tên kênh/người dùng thành ID bằng cách sử dụng thư mục nhà cung cấp:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Ghi chú:

- Sử dụng `--kind user|group|auto` để ép kiểu mục tiêu.
- Giải quyết ưu tiên các kết quả khớp đang hoạt động khi nhiều mục có cùng tên.
- `channels resolve` chỉ đọc. Nếu tài khoản được chọn được cấu hình qua SecretRef nhưng thông tin xác thực đó không có sẵn trong đường dẫn lệnh hiện tại, lệnh sẽ trả về kết quả chưa giải quyết suy giảm với ghi chú thay vì hủy bỏ toàn bộ quá trình chạy.
