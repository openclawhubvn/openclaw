---
summary: "Tìm hiểu cách xử lý múi giờ cho agents, envelopes và prompts, đảm bảo hoạt động chính xác và hiệu quả."
read_when:
  - Cần hiểu cách chuẩn hóa dấu thời gian cho mô hình
  - Cấu hình múi giờ người dùng cho hệ thống prompts
title: "Hướng Dẫn Cấu Hình Múi Giờ Cho AI"
---

# Múi giờ

OpenClaw chuẩn hóa dấu thời gian để mô hình chỉ thấy **một thời gian tham chiếu duy nhất**.

## Phong bì tin nhắn (mặc định là theo địa phương)

Tin nhắn đến được bao bọc trong một phong bì như sau:

```
[Provider ... 2026-01-05 16:26 PST] nội dung tin nhắn
```

Dấu thời gian trong phong bì **mặc định là theo địa phương**, với độ chính xác đến phút.

Bạn có thể ghi đè điều này bằng:

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

- `envelopeTimezone: "utc"` sử dụng UTC.
- `envelopeTimezone: "user"` sử dụng `agents.defaults.userTimezone` (sẽ quay về múi giờ máy chủ nếu không có).
- Sử dụng múi giờ IANA cụ thể (ví dụ: `"Europe/Vienna"`) để có độ lệch cố định.
- `envelopeTimestamp: "off"` loại bỏ dấu thời gian tuyệt đối khỏi tiêu đề phong bì.
- `envelopeElapsed: "off"` loại bỏ hậu tố thời gian đã trôi qua (kiểu `+2m`).

### Ví dụ

**Theo địa phương (mặc định):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] xin chào
```

**Múi giờ cố định:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] xin chào
```

**Thời gian đã trôi qua:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] theo dõi
```

## Payload công cụ (dữ liệu nhà cung cấp thô + trường chuẩn hóa)

Các cuộc gọi công cụ (`channels.discord.readMessages`, `channels.slack.readMessages`, v.v.) trả về **dấu thời gian nhà cung cấp thô**.
Chúng tôi cũng đính kèm các trường chuẩn hóa để đảm bảo nhất quán:

- `timestampMs` (UTC epoch milliseconds)
- `timestampUtc` (chuỗi UTC ISO 8601)

Các trường nhà cung cấp thô được giữ nguyên.

## Múi giờ người dùng cho hệ thống prompt

Thiết lập `agents.defaults.userTimezone` để thông báo cho mô hình về múi giờ địa phương của người dùng. Nếu không thiết lập,
OpenClaw sẽ xác định **múi giờ máy chủ tại thời điểm chạy** (không ghi cấu hình).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

Hệ thống prompt bao gồm:

- Phần `Current Date & Time` với thời gian và múi giờ địa phương
- `Time format: 12-hour` hoặc `24-hour`

Bạn có thể kiểm soát định dạng prompt với `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Xem [Date & Time](/date-time) để biết đầy đủ hành vi và ví dụ.
