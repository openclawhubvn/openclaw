---
summary: "Tìm hiểu cách cấu hình chính sách thử lại cho cuộc gọi outbound, đảm bảo kết nối hiệu quả và tối ưu hóa trải nghiệm khách hàng."
read_when:
  - Cập nhật hành vi hoặc mặc định thử lại của nhà cung cấp
  - Gỡ lỗi lỗi gửi hoặc giới hạn tốc độ của nhà cung cấp
title: "Hướng Dẫn Cấu Hình Chính Sách Thử Lại"
---

# Chính sách Thử Lại

## Mục tiêu

- Thử lại theo từng yêu cầu HTTP, không phải theo luồng nhiều bước.
- Giữ thứ tự bằng cách chỉ thử lại bước hiện tại.
- Tránh lặp lại các thao tác không idempotent.

## Mặc định

- Số lần thử: 3
- Giới hạn tối đa độ trễ: 30000 ms
- Jitter: 0.1 (10 phần trăm)
- Mặc định của nhà cung cấp:
  - Telegram độ trễ tối thiểu: 400 ms
  - Discord độ trễ tối thiểu: 500 ms

## Hành vi

### Discord

- Chỉ thử lại khi gặp lỗi giới hạn tốc độ (HTTP 429).
- Sử dụng `retry_after` của Discord khi có, nếu không thì dùng backoff theo cấp số nhân.

### Telegram

- Thử lại khi gặp lỗi tạm thời (429, timeout, connect/reset/closed, tạm thời không khả dụng).
- Sử dụng `retry_after` khi có, nếu không thì dùng backoff theo cấp số nhân.
- Lỗi phân tích Markdown không được thử lại; sẽ chuyển sang văn bản thuần túy.

## Cấu hình

Thiết lập chính sách thử lại cho từng nhà cung cấp trong `~/.openclaw/openclaw.json`:

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

- Thử lại áp dụng cho từng yêu cầu (gửi tin nhắn, tải lên media, phản ứng, thăm dò ý kiến, nhãn dán).
- Các luồng tổng hợp không thử lại các bước đã hoàn thành.
