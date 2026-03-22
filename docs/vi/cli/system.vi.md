# `openclaw system`

Công cụ hỗ trợ cấp hệ thống cho Gateway: enqueue sự kiện hệ thống, điều khiển heartbeat, và xem presence.

## Lệnh thường dùng

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Enqueue sự kiện hệ thống trên session **chính**. Heartbeat tiếp theo sẽ chèn nó vào prompt dưới dạng dòng `System:`. Dùng `--mode now` để kích hoạt heartbeat ngay lập tức; `next-heartbeat` chờ tick tiếp theo theo lịch.

Flags:

- `--text <text>`: nội dung sự kiện hệ thống (bắt buộc).
- `--mode <mode>`: `now` hoặc `next-heartbeat` (mặc định).
- `--json`: xuất ra định dạng máy đọc được.

## `system heartbeat last|enable|disable`

Điều khiển heartbeat:

- `last`: hiển thị sự kiện heartbeat cuối cùng.
- `enable`: bật lại heartbeat (dùng khi đã tắt).
- `disable`: tạm dừng heartbeat.

Flags:

- `--json`: xuất ra định dạng máy đọc được.

## `system presence`

Liệt kê các entry presence hệ thống hiện tại mà Gateway biết (nodes, instances, và các dòng trạng thái tương tự).

Flags:

- `--json`: xuất ra định dạng máy đọc được.

## Lưu ý

- Yêu cầu Gateway đang chạy và có thể truy cập theo cấu hình hiện tại (local hoặc remote).
- Sự kiện hệ thống là tạm thời và không được lưu trữ qua các lần khởi động lại.\n