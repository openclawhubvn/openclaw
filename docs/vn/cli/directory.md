---
summary: "Tham khảo CLI cho `openclaw directory` (self, peers, groups)"
read_when:
  - Bạn muốn tra cứu id của liên hệ/nhóm/bản thân cho một kênh
  - Bạn đang phát triển một adapter thư mục kênh
title: "directory"
---

# `openclaw directory`

Tra cứu thư mục cho các kênh hỗ trợ (liên hệ/người dùng, nhóm, và "bản thân").

## Các cờ thông dụng

- `--channel <name>`: id/alias của kênh (bắt buộc khi có nhiều kênh được cấu hình; tự động khi chỉ có một kênh)
- `--account <id>`: id tài khoản (mặc định: mặc định của kênh)
- `--json`: xuất ra JSON

## Ghi chú

- `directory` giúp tìm các ID để dán vào các lệnh khác (đặc biệt là `openclaw message send --target ...`).
- Với nhiều kênh, kết quả dựa trên cấu hình (danh sách cho phép/nhóm cấu hình) hơn là thư mục nhà cung cấp trực tiếp.
- Kết quả mặc định là `id` (và đôi khi `name`) được phân tách bằng tab; dùng `--json` cho scripting.

## Sử dụng kết quả với `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Định dạng ID (theo kênh)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (nhóm)
- Telegram: `@username` hoặc id chat số; nhóm là id số
- Slack: `user:U…` và `channel:C…`
- Discord: `user:<id>` và `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server`, hoặc `#alias:server`
- Microsoft Teams (plugin): `user:<id>` và `conversation:<id>`
- Zalo (plugin): id người dùng (Bot API)
- Zalo Personal / `zalouser` (plugin): id cuộc trò chuyện (DM/nhóm) từ `zca` (`me`, `friend list`, `group list`)

## Bản thân ("me")

```bash
openclaw directory self --channel zalouser
```

## Liên hệ (người dùng)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Nhóm

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```
