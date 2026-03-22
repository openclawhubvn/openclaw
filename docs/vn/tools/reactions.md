---
summary: "Ngữ nghĩa công cụ phản hồi trên tất cả các kênh hỗ trợ"
read_when:
  - Làm việc với phản hồi trong bất kỳ kênh nào
  - Hiểu cách phản hồi bằng emoji khác nhau trên các nền tảng
title: "Phản hồi"
---

# Phản hồi

Agent có thể thêm và xóa phản hồi bằng emoji trên tin nhắn bằng công cụ `message` với hành động `react`. Hành vi của phản hồi thay đổi tùy theo kênh.

## Cách hoạt động

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` là bắt buộc khi thêm phản hồi.
- Đặt `emoji` là chuỗi rỗng (`""`) để xóa phản hồi của bot.
- Đặt `remove: true` để xóa một emoji cụ thể (yêu cầu `emoji` không rỗng).

## Hành vi theo kênh

<AccordionGroup>
  <Accordion title="Discord và Slack">
    - `emoji` rỗng sẽ xóa tất cả phản hồi của bot trên tin nhắn.
    - `remove: true` chỉ xóa emoji được chỉ định.
  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` rỗng sẽ xóa phản hồi của ứng dụng trên tin nhắn.
    - `remove: true` chỉ xóa emoji được chỉ định.
  </Accordion>

  <Accordion title="Telegram">
    - `emoji` rỗng sẽ xóa phản hồi của bot.
    - `remove: true` cũng xóa phản hồi nhưng vẫn yêu cầu `emoji` không rỗng để xác thực công cụ.
  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` rỗng sẽ xóa phản hồi của bot.
    - `remove: true` được ánh xạ thành emoji rỗng nội bộ (vẫn yêu cầu `emoji` trong cuộc gọi công cụ).
  </Accordion>

  <Accordion title="Zalo Cá nhân (zalouser)">
    - Yêu cầu `emoji` không rỗng.
    - `remove: true` xóa phản hồi emoji cụ thể đó.
  </Accordion>

  <Accordion title="Signal">
    - Thông báo phản hồi đến phát ra sự kiện hệ thống khi `channels.signal.reactionNotifications` được bật.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Agent Send](/tools/agent-send) — công cụ `message` bao gồm `react`
- [Channels](/channels) — cấu hình cụ thể cho từng kênh
