---
summary: "Tham khảo CLI cho `openclaw message` (gửi + hành động kênh)"
read_when:
  - Thêm hoặc chỉnh sửa hành động CLI message
  - Thay đổi hành vi kênh outbound
title: "message"
---

# `openclaw message`

Lệnh outbound đơn cho việc gửi tin nhắn và hành động kênh (Discord/Google Chat/Slack/Mattermost (plugin)/Telegram/WhatsApp/Signal/iMessage/Microsoft Teams).

## Cách dùng

```
openclaw message <subcommand> [flags]
```

Chọn kênh:

- `--channel` bắt buộc nếu cấu hình nhiều hơn một kênh.
- Nếu chỉ có một kênh, nó sẽ là mặc định.
- Giá trị: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams` (Mattermost cần plugin)

Định dạng mục tiêu (`--target`):

- WhatsApp: E.164 hoặc group JID
- Telegram: chat id hoặc `@username`
- Discord: `channel:<id>` hoặc `user:<id>` (hoặc `<@id>` mention; id số thô được coi là kênh)
- Google Chat: `spaces/<spaceId>` hoặc `users/<userId>`
- Slack: `channel:<id>` hoặc `user:<id>` (chấp nhận id kênh thô)
- Mattermost (plugin): `channel:<id>`, `user:<id>`, hoặc `@username` (id thô được coi là kênh)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>`, hoặc `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>`, hoặc `chat_identifier:<id>`
- Microsoft Teams: conversation id (`19:...@thread.tacv2`) hoặc `conversation:<id>` hoặc `user:<aad-object-id>`

Tra cứu tên:

- Với các provider hỗ trợ (Discord/Slack/etc), tên kênh như `Help` hoặc `#help` được giải qua cache thư mục.
- Nếu cache miss, OpenClaw sẽ thử tra cứu thư mục trực tiếp nếu provider hỗ trợ.

## Các flag thông dụng

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (kênh hoặc người dùng cho send/poll/read/etc)
- `--targets <name>` (lặp lại; chỉ broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## Hành vi SecretRef

- `openclaw message` giải quyết các SecretRef kênh hỗ trợ trước khi chạy hành động đã chọn.
- Giải quyết theo phạm vi mục tiêu hành động khi có thể:
  - theo kênh khi `--channel` được đặt (hoặc suy ra từ mục tiêu có tiền tố như `discord:...`)
  - theo tài khoản khi `--account` được đặt (toàn cầu kênh + bề mặt tài khoản đã chọn)
  - khi `--account` bị bỏ qua, OpenClaw không ép buộc phạm vi SecretRef tài khoản `default`
- SecretRef chưa giải quyết trên kênh không liên quan không chặn hành động tin nhắn mục tiêu.
- Nếu SecretRef kênh/tài khoản đã chọn chưa giải quyết, lệnh sẽ thất bại cho hành động đó.

## Hành động

### Core

- `send`
  - Kênh: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Microsoft Teams
  - Bắt buộc: `--target`, cộng `--message` hoặc `--media`
  - Tùy chọn: `--media`, `--reply-to`, `--thread-id`, `--gif-playback`
  - Chỉ Telegram: `--buttons` (cần `channels.telegram.capabilities.inlineButtons` để cho phép)
  - Chỉ Telegram: `--force-document` (gửi ảnh và GIF dưới dạng tài liệu để tránh nén Telegram)
  - Chỉ Telegram: `--thread-id` (id chủ đề diễn đàn)
  - Chỉ Slack: `--thread-id` (dấu thời gian thread; `--reply-to` dùng cùng trường)
  - Chỉ WhatsApp: `--gif-playback`

- `poll`
  - Kênh: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Bắt buộc: `--target`, `--poll-question`, `--poll-option` (lặp lại)
  - Tùy chọn: `--poll-multi`
  - Chỉ Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Chỉ Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kênh: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal
  - Bắt buộc: `--message-id`, `--target`
  - Tùy chọn: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Lưu ý: `--remove` cần `--emoji` (bỏ qua `--emoji` để xóa phản ứng của mình nếu được hỗ trợ; xem /tools/reactions)
  - Chỉ WhatsApp: `--participant`, `--from-me`
  - Phản ứng nhóm Signal: cần `--target-author` hoặc `--target-author-uuid`

- `reactions`
  - Kênh: Discord/Google Chat/Slack
  - Bắt buộc: `--message-id`, `--target`
  - Tùy chọn: `--limit`

- `read`
  - Kênh: Discord/Slack
  - Bắt buộc: `--target`
  - Tùy chọn: `--limit`, `--before`, `--after`
  - Chỉ Discord: `--around`

- `edit`
  - Kênh: Discord/Slack
  - Bắt buộc: `--message-id`, `--message`, `--target`

- `delete`
  - Kênh: Discord/Slack/Telegram
  - Bắt buộc: `--message-id`, `--target`

- `pin` / `unpin`
  - Kênh: Discord/Slack
  - Bắt buộc: `--message-id`, `--target`

- `pins` (danh sách)
  - Kênh: Discord/Slack
  - Bắt buộc: `--target`

- `permissions`
  - Kênh: Discord
  - Bắt buộc: `--target`

- `search`
  - Kênh: Discord
  - Bắt buộc: `--guild-id`, `--query`
  - Tùy chọn: `--channel-id`, `--channel-ids` (lặp lại), `--author-id`, `--author-ids` (lặp lại), `--limit`

### Threads

- `thread create`
  - Kênh: Discord
  - Bắt buộc: `--thread-name`, `--target` (id kênh)
  - Tùy chọn: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Kênh: Discord
  - Bắt buộc: `--guild-id`
  - Tùy chọn: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Kênh: Discord
  - Bắt buộc: `--target` (id thread), `--message`
  - Tùy chọn: `--media`, `--reply-to`

### Emojis

- `emoji list`
  - Discord: `--guild-id`
  - Slack: không cần flag thêm

- `emoji upload`
  - Kênh: Discord
  - Bắt buộc: `--guild-id`, `--emoji-name`, `--media`
  - Tùy chọn: `--role-ids` (lặp lại)

### Stickers

- `sticker send`
  - Kênh: Discord
  - Bắt buộc: `--target`, `--sticker-id` (lặp lại)
  - Tùy chọn: `--message`

- `sticker upload`
  - Kênh: Discord
  - Bắt buộc: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Roles / Channels / Members / Voice

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` cho Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Events

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Tùy chọn: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderation (Discord)

- `timeout`: `--guild-id`, `--user-id` (tùy chọn `--duration-min` hoặc `--until`; bỏ qua cả hai để xóa timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` cũng hỗ trợ `--reason`

### Broadcast

- `broadcast`
  - Kênh: bất kỳ kênh nào đã cấu hình; dùng `--channel all` để nhắm đến tất cả các provider
  - Bắt buộc: `--targets` (lặp lại)
  - Tùy chọn: `--message`, `--media`, `--dry-run`

## Ví dụ

Gửi một reply trên Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Gửi một tin nhắn Discord với components:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --components '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve","style":"success"},{"label":"Decline","style":"danger"}]}]}'
```

Xem [Discord components](/channels/discord#interactive-components) để biết schema đầy đủ.

Tạo một poll trên Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Tạo một poll trên Telegram (tự động đóng sau 2 phút):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Gửi một tin nhắn proactive trên Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Tạo một poll trên Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

React trên Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

React trong một nhóm Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Gửi nút inline trên Telegram:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --buttons '[ [{"text":"Yes","callback_data":"cmd:yes"}], [{"text":"No","callback_data":"cmd:no"}] ]'
```

Gửi một ảnh trên Telegram dưới dạng tài liệu để tránh nén:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```\n