---
summary: "Cách dùng công cụ Reaction trên các kênh hỗ trợ"
read_when:
  - Làm việc với reactions trên bất kỳ kênh nào
  - Hiểu sự khác biệt của emoji reactions trên các nền tảng
title: "Reactions"
---

# Reactions

Agent có thể thêm và xóa emoji reactions trên tin nhắn bằng công cụ `message` với action `react`. Hành vi của reaction thay đổi tùy theo kênh.

## Cách hoạt động

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` là bắt buộc khi thêm reaction.
- Đặt `emoji` là chuỗi rỗng (`""`) để xóa reaction của bot.
- Đặt `remove: true` để xóa một emoji cụ thể (cần `emoji` không rỗng).

## Hành vi theo kênh

<AccordionGroup>
  <Accordion title="Discord và Slack">
    - `emoji` rỗng xóa tất cả reactions của bot trên tin nhắn.
    - `remove: true` chỉ xóa emoji được chỉ định.
  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` rỗng xóa reactions của app trên tin nhắn.
    - `remove: true` chỉ xóa emoji được chỉ định.
  </Accordion>

  <Accordion title="Telegram">
    - `emoji` rỗng xóa reactions của bot.
    - `remove: true` cũng xóa reactions nhưng vẫn cần `emoji` không rỗng để tool xác thực.
  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` rỗng xóa reaction của bot.
    - `remove: true` ánh xạ thành emoji rỗng nội bộ (vẫn cần `emoji` trong lệnh gọi tool).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Cần `emoji` không rỗng.
    - `remove: true` xóa emoji reaction cụ thể đó.
  </Accordion>

  <Accordion title="Signal">
    - Thông báo reaction inbound phát ra sự kiện hệ thống khi `channels.signal.reactionNotifications` được bật.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Agent Send](/tools/agent-send) — công cụ `message` bao gồm `react`
- [Channels](/channels) — cấu hình theo kênh cụ thể\n