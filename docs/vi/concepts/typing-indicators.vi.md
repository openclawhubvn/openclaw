---
summary: "Khi nào OpenClaw hiển thị typing indicators và cách điều chỉnh"
read_when:
  - Thay đổi hành vi hoặc mặc định của typing indicator
title: "Typing Indicators"
---

# Typing indicators

Typing indicators được gửi đến chat channel khi một run đang hoạt động. Dùng `agents.defaults.typingMode` để điều khiển **khi nào** bắt đầu typing và `typingIntervalSeconds` để điều khiển **tần suất** làm mới.

## Mặc định

Khi `agents.defaults.typingMode` **không được đặt**, OpenClaw giữ hành vi cũ:

- **Chat trực tiếp**: bắt đầu typing ngay khi vòng lặp model bắt đầu.
- **Chat nhóm có mention**: bắt đầu typing ngay lập tức.
- **Chat nhóm không có mention**: chỉ bắt đầu typing khi bắt đầu stream nội dung tin nhắn.
- **Heartbeat runs**: typing bị vô hiệu hóa.

## Các chế độ

Đặt `agents.defaults.typingMode` thành một trong các giá trị sau:

- `never` — không bao giờ có typing indicator.
- `instant` — bắt đầu typing **ngay khi vòng lặp model bắt đầu**, ngay cả khi run sau đó chỉ trả về silent reply token.
- `thinking` — bắt đầu typing khi có **delta reasoning đầu tiên** (yêu cầu `reasoningLevel: "stream"` cho run).
- `message` — bắt đầu typing khi có **delta text không silent đầu tiên** (bỏ qua token `NO_REPLY` silent).

Thứ tự “bắt đầu sớm nhất”:
`never` → `message` → `thinking` → `instant`

## Cấu hình

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Có thể ghi đè mode hoặc cadence cho từng session:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Lưu ý

- Chế độ `message` sẽ không hiển thị typing cho các phản hồi chỉ silent (ví dụ: token `NO_REPLY` dùng để ngăn xuất output).
- `thinking` chỉ kích hoạt nếu run stream reasoning (`reasoningLevel: "stream"`). Nếu model không phát ra reasoning deltas, typing sẽ không bắt đầu.
- Heartbeats không bao giờ hiển thị typing, bất kể chế độ nào.
- `typingIntervalSeconds` điều khiển **tần suất làm mới**, không phải thời gian bắt đầu. Mặc định là 6 giây.\n