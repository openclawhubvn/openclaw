---
summary: "Xử lý ngày giờ trong envelopes, prompts, tools và connectors"
read_when:
  - Đang thay đổi cách hiển thị timestamps cho model hoặc người dùng
  - Đang debug định dạng thời gian trong messages hoặc output của system prompt
title: "Ngày & Giờ"
---

# Ngày & Giờ

OpenClaw mặc định dùng **thời gian host-local cho transport timestamps** và **múi giờ người dùng chỉ trong system prompt**. Timestamps từ Provider được giữ nguyên để tools duy trì ngữ nghĩa gốc (thời gian hiện tại có qua `session_status`).

## Message envelopes (mặc định local)

Messages inbound được bọc với timestamp (độ chính xác phút):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Timestamp này mặc định là **host-local**, không phụ thuộc vào múi giờ của provider.

Có thể override hành vi này:

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
- `envelopeTimezone: "local"` dùng múi giờ của host.
- `envelopeTimezone: "user"` dùng `agents.defaults.userTimezone` (fallback về host timezone).
- Dùng IANA timezone cụ thể (vd: `"America/Chicago"`) cho múi giờ cố định.
- `envelopeTimestamp: "off"` bỏ timestamps tuyệt đối khỏi envelope headers.
- `envelopeElapsed: "off"` bỏ hậu tố thời gian trôi qua (kiểu `+2m`).

### Ví dụ

**Local (mặc định):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Múi giờ người dùng:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Thời gian trôi qua bật:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## System prompt: Ngày & Giờ hiện tại

Nếu biết múi giờ người dùng, system prompt sẽ có phần **Ngày & Giờ hiện tại** với **chỉ múi giờ** (không định dạng giờ/phút) để giữ ổn định caching:

```
Time zone: America/Chicago
```

Khi agent cần thời gian hiện tại, dùng tool `session_status`; status card có dòng timestamp.

## System event lines (mặc định local)

System events xếp hàng chờ được chèn vào context của agent có tiền tố timestamp dùng cùng lựa chọn múi giờ như message envelopes (mặc định: host-local).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Cấu hình múi giờ người dùng + định dạng

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` đặt **múi giờ người dùng** cho prompt context.
- `timeFormat` điều khiển **hiển thị 12h/24h** trong prompt. `auto` theo prefs của OS.

## Phát hiện định dạng thời gian (auto)

Khi `timeFormat: "auto"`, OpenClaw kiểm tra prefs của OS (macOS/Windows) và fallback về định dạng locale. Giá trị phát hiện được **cache theo process** để tránh gọi hệ thống lặp lại.

## Tool payloads + connectors (thời gian provider gốc + trường chuẩn hóa)

Channel tools trả về **timestamps gốc của provider** và thêm trường chuẩn hóa để đồng nhất:

- `timestampMs`: epoch milliseconds (UTC)
- `timestampUtc`: chuỗi ISO 8601 UTC

Trường gốc của provider được giữ nguyên để không mất dữ liệu.

- Slack: chuỗi kiểu epoch từ API
- Discord: timestamps ISO UTC
- Telegram/WhatsApp: timestamps số/ISO đặc thù của provider

Nếu cần thời gian local, chuyển đổi downstream dùng múi giờ đã biết.

## Tài liệu liên quan

- [System Prompt](/concepts/system-prompt)
- [Timezones](/concepts/timezone)
- [Messages](/concepts/messages)\n