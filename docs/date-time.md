---
summary: "Khám phá cách xử lý ngày và giờ hiệu quả trong ứng dụng, từ phong bì đến lời nhắc và công cụ kết nối."
read_when:
  - Bạn đang thay đổi cách hiển thị dấu thời gian cho mô hình hoặc người dùng
  - Bạn đang gỡ lỗi định dạng thời gian trong tin nhắn hoặc đầu ra của hệ thống
title: "Hướng Dẫn Xử Lý Ngày Giờ Trong Ứng Dụng"
---

# Ngày & Giờ

OpenClaw mặc định sử dụng **thời gian cục bộ của máy chủ cho dấu thời gian vận chuyển** và **múi giờ người dùng chỉ trong lời nhắc hệ thống**. Dấu thời gian của nhà cung cấp được giữ nguyên để các công cụ duy trì ngữ nghĩa gốc của chúng (thời gian hiện tại có sẵn qua `session_status`).

## Phong bì tin nhắn (mặc định là cục bộ)

Tin nhắn đến được bao bọc với một dấu thời gian (độ chính xác đến phút):

```
[Provider ... 2026-01-05 16:26 PST] nội dung tin nhắn
```

Dấu thời gian phong bì này mặc định là **cục bộ của máy chủ**, bất kể múi giờ của nhà cung cấp.

Bạn có thể thay đổi hành vi này:

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
- `envelopeTimezone: "local"` sử dụng múi giờ của máy chủ.
- `envelopeTimezone: "user"` sử dụng `agents.defaults.userTimezone` (sẽ quay về múi giờ máy chủ nếu không có).
- Sử dụng múi giờ IANA cụ thể (ví dụ: `"America/Chicago"`) cho một múi giờ cố định.
- `envelopeTimestamp: "off"` loại bỏ dấu thời gian tuyệt đối khỏi tiêu đề phong bì.
- `envelopeElapsed: "off"` loại bỏ hậu tố thời gian đã trôi qua (kiểu `+2m`).

### Ví dụ

**Cục bộ (mặc định):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] xin chào
```

**Múi giờ người dùng:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] xin chào
```

**Thời gian đã trôi qua được bật:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] theo dõi
```

## Lời nhắc hệ thống: Ngày & Giờ hiện tại

Nếu biết múi giờ người dùng, lời nhắc hệ thống sẽ bao gồm một phần **Ngày & Giờ hiện tại** với **chỉ múi giờ** (không có định dạng đồng hồ/thời gian) để giữ cho bộ nhớ đệm lời nhắc ổn định:

```
Múi giờ: America/Chicago
```

Khi agent cần thời gian hiện tại, sử dụng công cụ `session_status`; thẻ trạng thái bao gồm một dòng dấu thời gian.

## Dòng sự kiện hệ thống (mặc định là cục bộ)

Các sự kiện hệ thống được xếp hàng chờ chèn vào ngữ cảnh agent được thêm tiền tố với dấu thời gian sử dụng cùng lựa chọn múi giờ như phong bì tin nhắn (mặc định: cục bộ của máy chủ).

```
Hệ thống: [2026-01-12 12:19:17 PST] Mô hình đã chuyển đổi.
```

### Cấu hình múi giờ + định dạng người dùng

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

- `userTimezone` thiết lập **múi giờ cục bộ của người dùng** cho ngữ cảnh lời nhắc.
- `timeFormat` điều khiển **hiển thị 12h/24h** trong lời nhắc. `auto` theo tùy chọn hệ điều hành.

## Phát hiện định dạng thời gian (tự động)

Khi `timeFormat: "auto"`, OpenClaw kiểm tra tùy chọn hệ điều hành (macOS/Windows) và quay về định dạng địa phương. Giá trị phát hiện được **bộ nhớ đệm theo quy trình** để tránh các cuộc gọi hệ thống lặp lại.

## Payload công cụ + kết nối (thời gian nhà cung cấp thô + trường chuẩn hóa)

Các công cụ kênh trả về **dấu thời gian gốc của nhà cung cấp** và thêm các trường chuẩn hóa để đảm bảo nhất quán:

- `timestampMs`: mili giây epoch (UTC)
- `timestampUtc`: chuỗi UTC ISO 8601

Các trường nhà cung cấp thô được giữ nguyên để không mất dữ liệu.

- Slack: chuỗi giống epoch từ API
- Discord: dấu thời gian UTC ISO
- Telegram/WhatsApp: dấu thời gian số/ISO cụ thể của nhà cung cấp

Nếu cần thời gian cục bộ, chuyển đổi nó xuống dòng sử dụng múi giờ đã biết.

## Tài liệu liên quan

- [Lời nhắc hệ thống](/concepts/system-prompt)
- [Múi giờ](/concepts/timezone)
- [Tin nhắn](/concepts/messages)
