---
summary: "Chính sách retry cho các cuộc gọi outbound provider"
read_when:
  - Cập nhật hành vi hoặc mặc định retry của provider
  - Debug lỗi gửi hoặc giới hạn tốc độ của provider
title: "Chính sách Retry"
---

# Chính sách Retry

## Mục tiêu

- Retry theo từng request HTTP, không phải theo luồng nhiều bước.
- Giữ thứ tự bằng cách chỉ retry bước hiện tại.
- Tránh lặp lại các thao tác không idempotent.

## Mặc định

- Số lần thử: 3
- Giới hạn delay tối đa: 30000 ms
- Jitter: 0.1 (10 phần trăm)
- Mặc định của provider:
  - Telegram delay tối thiểu: 400 ms
  - Discord delay tối thiểu: 500 ms

## Hành vi

### Discord

- Chỉ retry khi gặp lỗi giới hạn tốc độ (HTTP 429).
- Sử dụng `retry_after` của Discord khi có, nếu không thì dùng exponential backoff.

### Telegram

- Retry khi gặp lỗi tạm thời (429, timeout, connect/reset/closed, tạm thời không khả dụng).
- Sử dụng `retry_after` khi có, nếu không thì dùng exponential backoff.
- Lỗi parse Markdown không retry; fallback về plain text.

## Cấu hình

Thiết lập chính sách retry cho từng provider trong `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Ghi chú

- Retry áp dụng cho từng request (gửi tin nhắn, upload media, reaction, poll, sticker).
- Luồng composite không retry các bước đã hoàn thành.\n