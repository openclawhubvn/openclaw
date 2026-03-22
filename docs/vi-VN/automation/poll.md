---
summary: "Gửi khảo sát qua gateway + CLI"
read_when:
  - Thêm hoặc chỉnh sửa hỗ trợ khảo sát
  - Gỡ lỗi gửi khảo sát từ CLI hoặc gateway
title: "Khảo sát"
---

# Khảo sát

## Kênh hỗ trợ

- Telegram
- WhatsApp (kênh web)
- Discord
- Microsoft Teams (Adaptive Cards)

## CLI

```bash
# Telegram
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Chọn thời gian" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300

# WhatsApp
openclaw message poll --target +15555550123 \
  --poll-question "Trưa nay ăn gì?" --poll-option "Có" --poll-option "Không" --poll-option "Có thể"
openclaw message poll --target 123456789@g.us \
  --poll-question "Thời gian họp?" --poll-option "10am" --poll-option "2pm" --poll-option "4pm" --poll-multi

# Discord
openclaw message poll --channel discord --target channel:123456789 \
  --poll-question "Ăn nhẹ?" --poll-option "Pizza" --poll-option "Sushi"
openclaw message poll --channel discord --target channel:123456789 \
  --poll-question "Kế hoạch?" --poll-option "A" --poll-option "B" --poll-duration-hours 48

# Microsoft Teams
openclaw message poll --channel msteams --target conversation:19:abc@thread.tacv2 \
  --poll-question "Trưa nay ăn gì?" --poll-option "Pizza" --poll-option "Sushi"
```

Tùy chọn:

- `--channel`: `whatsapp` (mặc định), `telegram`, `discord`, hoặc `msteams`
- `--poll-multi`: cho phép chọn nhiều tùy chọn
- `--poll-duration-hours`: chỉ dành cho Discord (mặc định là 24 nếu không chỉ định)
- `--poll-duration-seconds`: chỉ dành cho Telegram (5-600 giây)
- `--poll-anonymous` / `--poll-public`: chỉ dành cho Telegram về độ hiển thị của khảo sát

## Gateway RPC

Phương thức: `poll`

Tham số:

- `to` (chuỗi, bắt buộc)
- `question` (chuỗi, bắt buộc)
- `options` (mảng chuỗi, bắt buộc)
- `maxSelections` (số, tùy chọn)
- `durationHours` (số, tùy chọn)
- `durationSeconds` (số, tùy chọn, chỉ dành cho Telegram)
- `isAnonymous` (boolean, tùy chọn, chỉ dành cho Telegram)
- `channel` (chuỗi, tùy chọn, mặc định: `whatsapp`)
- `idempotencyKey` (chuỗi, bắt buộc)

## Khác biệt giữa các kênh

- Telegram: 2-10 tùy chọn. Hỗ trợ chủ đề diễn đàn qua `threadId` hoặc mục tiêu `:topic:`. Sử dụng `durationSeconds` thay vì `durationHours`, giới hạn từ 5-600 giây. Hỗ trợ khảo sát ẩn danh và công khai.
- WhatsApp: 2-12 tùy chọn, `maxSelections` phải nằm trong số lượng tùy chọn, bỏ qua `durationHours`.
- Discord: 2-10 tùy chọn, `durationHours` giới hạn từ 1-768 giờ (mặc định 24). `maxSelections > 1` cho phép chọn nhiều; Discord không hỗ trợ số lượng chọn cố định.
- Microsoft Teams: Khảo sát dưới dạng Adaptive Card (do OpenClaw quản lý). Không có API khảo sát gốc; `durationHours` bị bỏ qua.

## Công cụ Agent (Message)

Sử dụng công cụ `message` với hành động `poll` (`to`, `pollQuestion`, `pollOption`, tùy chọn `pollMulti`, `pollDurationHours`, `channel`).

Đối với Telegram, công cụ cũng chấp nhận `pollDurationSeconds`, `pollAnonymous`, và `pollPublic`.

Sử dụng `action: "poll"` để tạo khảo sát. Các trường khảo sát được truyền với `action: "send"` sẽ bị từ chối.

Lưu ý: Discord không có chế độ “chọn đúng N”; `pollMulti` ánh xạ đến chọn nhiều. Khảo sát Teams được hiển thị dưới dạng Adaptive Cards và yêu cầu gateway phải trực tuyến để ghi lại phiếu bầu trong `~/.openclaw/msteams-polls.json`.
