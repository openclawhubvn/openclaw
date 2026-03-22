---
summary: "Gửi poll qua gateway + CLI"
read_when:
  - Thêm hoặc chỉnh sửa hỗ trợ poll
  - Debug gửi poll từ CLI hoặc gateway
title: "Polls"
---

# Polls

## Kênh hỗ trợ

- Telegram
- WhatsApp (web channel)
- Discord
- Microsoft Teams (Adaptive Cards)

## CLI

```bash
# Telegram
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300

# WhatsApp
openclaw message poll --target +15555550123 \
  --poll-question "Lunch today?" --poll-option "Yes" --poll-option "No" --poll-option "Maybe"
openclaw message poll --target 123456789@g.us \
  --poll-question "Meeting time?" --poll-option "10am" --poll-option "2pm" --poll-option "4pm" --poll-multi

# Discord
openclaw message poll --channel discord --target channel:123456789 \
  --poll-question "Snack?" --poll-option "Pizza" --poll-option "Sushi"
openclaw message poll --channel discord --target channel:123456789 \
  --poll-question "Plan?" --poll-option "A" --poll-option "B" --poll-duration-hours 48

# Microsoft Teams
openclaw message poll --channel msteams --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" --poll-option "Pizza" --poll-option "Sushi"
```

Tùy chọn:

- `--channel`: `whatsapp` (mặc định), `telegram`, `discord`, hoặc `msteams`
- `--poll-multi`: cho phép chọn nhiều tùy chọn
- `--poll-duration-hours`: chỉ Discord (mặc định 24 nếu không chỉ định)
- `--poll-duration-seconds`: chỉ Telegram (5-600 giây)
- `--poll-anonymous` / `--poll-public`: chỉ Telegram, hiển thị poll

## Gateway RPC

Method: `poll`

Tham số:

- `to` (string, bắt buộc)
- `question` (string, bắt buộc)
- `options` (string[], bắt buộc)
- `maxSelections` (number, tùy chọn)
- `durationHours` (number, tùy chọn)
- `durationSeconds` (number, tùy chọn, chỉ Telegram)
- `isAnonymous` (boolean, tùy chọn, chỉ Telegram)
- `channel` (string, tùy chọn, mặc định: `whatsapp`)
- `idempotencyKey` (string, bắt buộc)

## Khác biệt giữa các kênh

- Telegram: 2-10 tùy chọn. Hỗ trợ chủ đề diễn đàn qua `threadId` hoặc `:topic:`. Dùng `durationSeconds` thay vì `durationHours`, giới hạn 5-600 giây. Hỗ trợ poll ẩn danh và công khai.
- WhatsApp: 2-12 tùy chọn, `maxSelections` phải trong số lượng tùy chọn, bỏ qua `durationHours`.
- Discord: 2-10 tùy chọn, `durationHours` giới hạn 1-768 giờ (mặc định 24). `maxSelections > 1` cho phép chọn nhiều; Discord không hỗ trợ chọn số lượng cố định.
- Microsoft Teams: Polls dưới dạng Adaptive Card (quản lý bởi OpenClaw). Không có API poll gốc; bỏ qua `durationHours`.

## Công cụ Agent (Message)

Dùng công cụ `message` với hành động `poll` (`to`, `pollQuestion`, `pollOption`, tùy chọn `pollMulti`, `pollDurationHours`, `channel`).

Với Telegram, công cụ cũng chấp nhận `pollDurationSeconds`, `pollAnonymous`, và `pollPublic`.

Dùng `action: "poll"` để tạo poll. Các trường poll truyền với `action: "send"` sẽ bị từ chối.

Lưu ý: Discord không có chế độ “chọn đúng N”; `pollMulti` ánh xạ tới chọn nhiều.
Polls Teams được hiển thị dưới dạng Adaptive Cards và cần gateway online để ghi nhận phiếu bầu trong `~/.openclaw/msteams-polls.json`.\n