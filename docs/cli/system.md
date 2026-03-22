---
summary: "Khám phá cách sử dụng CLI cho OpenClaw System, quản lý sự kiện hệ thống, heartbeat và presence hiệu quả."
read_when:
  - Bạn muốn xếp hàng một sự kiện hệ thống mà không cần tạo cron job
  - Bạn cần bật hoặc tắt heartbeat
  - Bạn muốn kiểm tra các mục presence của hệ thống
title: "Hướng Dẫn CLI OpenClaw System"
---

# `openclaw system`

Công cụ hỗ trợ cấp hệ thống cho Gateway: xếp hàng sự kiện hệ thống, kiểm soát heartbeat và xem presence.

## Lệnh thông dụng

```bash
openclaw system event --text "Kiểm tra các công việc cần theo dõi gấp" --mode now
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Xếp hàng một sự kiện hệ thống trên phiên **chính**. Heartbeat tiếp theo sẽ chèn nó như một dòng `System:` trong prompt. Sử dụng `--mode now` để kích hoạt heartbeat ngay lập tức; `next-heartbeat` sẽ chờ đến lần tick tiếp theo đã lên lịch.

Các tùy chọn:

- `--text <text>`: văn bản sự kiện hệ thống bắt buộc.
- `--mode <mode>`: `now` hoặc `next-heartbeat` (mặc định).
- `--json`: đầu ra có thể đọc được bằng máy.

## `system heartbeat last|enable|disable`

Kiểm soát heartbeat:

- `last`: hiển thị sự kiện heartbeat cuối cùng.
- `enable`: bật lại heartbeat (sử dụng nếu chúng đã bị tắt).
- `disable`: tạm dừng heartbeat.

Các tùy chọn:

- `--json`: đầu ra có thể đọc được bằng máy.

## `system presence`

Liệt kê các mục presence hiện tại mà Gateway biết đến (các node, instance và các dòng trạng thái tương tự).

Các tùy chọn:

- `--json`: đầu ra có thể đọc được bằng máy.

## Lưu ý

- Yêu cầu Gateway đang chạy và có thể truy cập từ cấu hình hiện tại của bạn (cục bộ hoặc từ xa).
- Các sự kiện hệ thống là tạm thời và không được lưu trữ qua các lần khởi động lại.
