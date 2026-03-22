---
summary: "Xử lý múi giờ cho agents, envelopes và prompts"
read_when:
  - Cần hiểu cách chuẩn hóa timestamps cho model
  - Cấu hình múi giờ người dùng cho system prompts
title: "Múi giờ"
---

# Múi giờ

OpenClaw chuẩn hóa timestamps để model chỉ thấy **một thời gian tham chiếu duy nhất**.

## Message envelopes (mặc định là local)

Tin nhắn inbound được bọc trong một envelope như sau:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Timestamp trong envelope mặc định là **host-local**, với độ chính xác đến phút.

Có thể override bằng:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` dùng UTC.
- `envelopeTimezone: "user"` dùng `agents.defaults.userTimezone` (fallback về host timezone).
- Dùng IANA timezone cụ thể (ví dụ: `"Europe/Vienna"`) để có offset cố định.
- `envelopeTimestamp: "off"` bỏ timestamps tuyệt đối khỏi envelope headers.
- `envelopeElapsed: "off"` bỏ hậu tố thời gian trôi qua (kiểu `+2m`).

### Ví dụ

**Local (mặc định):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**Múi giờ cố định:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**Thời gian trôi qua:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Tool payloads (dữ liệu provider thô + trường chuẩn hóa)

Các lệnh gọi tool (`channels.discord.readMessages`, `channels.slack.readMessages`, v.v.) trả về **timestamps thô từ provider**.
Chúng tôi cũng đính kèm các trường chuẩn hóa để đồng nhất:

- `timestampMs` (UTC epoch milliseconds)
- `timestampUtc` (chuỗi ISO 8601 UTC)

Các trường thô từ provider được giữ nguyên.

## Múi giờ người dùng cho system prompt

Đặt `agents.defaults.userTimezone` để báo cho model biết múi giờ địa phương của người dùng. Nếu không đặt,
OpenClaw sẽ tự động xác định **host timezone tại runtime** (không cần ghi config).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

System prompt bao gồm:

- Phần `Current Date & Time` với thời gian và múi giờ địa phương
- `Time format: 12-hour` hoặc `24-hour`

Có thể điều chỉnh định dạng prompt với `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Xem [Date & Time](/date-time) để biết đầy đủ hành vi và ví dụ.\n