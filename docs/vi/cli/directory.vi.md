# `openclaw directory`

Tra cứu Directory cho các channel hỗ trợ (contacts/peers, groups, và “me”).

## Common flags

- `--channel <name>`: id/alias của channel (bắt buộc khi có nhiều channel; tự động khi chỉ có một channel)
- `--account <id>`: id account (mặc định: channel default)
- `--json`: xuất ra JSON

## Ghi chú

- `directory` giúp tìm ID để dán vào lệnh khác (đặc biệt là `openclaw message send --target ...`).
- Với nhiều channel, kết quả dựa trên cấu hình (allowlists / configured groups) hơn là directory của provider.
- Mặc định xuất ra `id` (và đôi khi `name`) cách nhau bằng tab; dùng `--json` để scripting.

## Dùng kết quả với `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Định dạng ID (theo channel)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (group)
- Telegram: `@username` hoặc chat id số; groups là id số
- Slack: `user:U…` và `channel:C…`
- Discord: `user:<id>` và `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server`, hoặc `#alias:server`
- Microsoft Teams (plugin): `user:<id>` và `conversation:<id>`
- Zalo (plugin): user id (Bot API)
- Zalo Personal / `zalouser` (plugin): thread id (DM/group) từ `zca` (`me`, `friend list`, `group list`)

## Self ("me")

```bash
openclaw directory self --channel zalouser
```

## Peers (contacts/users)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Groups

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```\n