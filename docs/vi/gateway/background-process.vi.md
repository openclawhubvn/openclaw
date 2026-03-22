---
summary: "Chạy nền và quản lý tiến trình"
read_when:
  - Thêm hoặc chỉnh sửa hành vi chạy nền
  - Debug tác vụ chạy lâu
title: "Công cụ Chạy nền và Quản lý Tiến trình"
---

# Công cụ Chạy nền + Quản lý Tiến trình

OpenClaw chạy lệnh shell qua công cụ `exec` và giữ các tác vụ chạy lâu trong bộ nhớ. Công cụ `process` quản lý các phiên chạy nền này.

## Công cụ exec

Các tham số chính:

- `command` (bắt buộc)
- `yieldMs` (mặc định 10000): tự động chạy nền sau thời gian này
- `background` (bool): chạy nền ngay lập tức
- `timeout` (giây, mặc định 1800): dừng tiến trình sau thời gian này
- `elevated` (bool): chạy trên host nếu chế độ nâng cao được bật/cho phép
- Cần TTY thật? Đặt `pty: true`.
- `workdir`, `env`

Hành vi:

- Chạy foreground trả về output trực tiếp.
- Khi chạy nền (tự động hoặc timeout), công cụ trả về `status: "running"` + `sessionId` và một đoạn tail ngắn.
- Output giữ trong bộ nhớ cho đến khi phiên được poll hoặc xóa.
- Nếu công cụ `process` bị cấm, `exec` chạy đồng bộ và bỏ qua `yieldMs`/`background`.
- Lệnh exec sinh ra nhận `OPENCLAW_SHELL=exec` để áp dụng quy tắc shell/profile theo ngữ cảnh.

## Kết nối tiến trình con

Khi sinh ra tiến trình con chạy lâu ngoài công cụ exec/process (ví dụ: CLI respawns hoặc gateway helpers), gắn helper kết nối tiến trình con để chuyển tiếp tín hiệu dừng và tách listener khi thoát/lỗi. Tránh tiến trình mồ côi trên systemd và giữ hành vi shutdown nhất quán trên các nền tảng.

Override môi trường:

- `PI_BASH_YIELD_MS`: yield mặc định (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: giới hạn output trong bộ nhớ (chars)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: giới hạn stdout/stderr chờ xử lý mỗi stream (chars)
- `PI_BASH_JOB_TTL_MS`: TTL cho phiên đã hoàn thành (ms, giới hạn từ 1m–3h)

Cấu hình (ưu tiên):

- `tools.exec.backgroundMs` (mặc định 10000)
- `tools.exec.timeoutSec` (mặc định 1800)
- `tools.exec.cleanupMs` (mặc định 1800000)
- `tools.exec.notifyOnExit` (mặc định true): enqueue sự kiện hệ thống + yêu cầu heartbeat khi exec nền thoát.
- `tools.exec.notifyOnExitEmptySuccess` (mặc định false): khi true, cũng enqueue sự kiện hoàn thành cho các chạy nền thành công không có output.

## Công cụ process

Các hành động:

- `list`: liệt kê phiên đang chạy + đã hoàn thành
- `poll`: lấy output mới cho một phiên (cũng báo trạng thái thoát)
- `log`: đọc output tổng hợp (hỗ trợ `offset` + `limit`)
- `write`: gửi stdin (`data`, `eof` tùy chọn)
- `kill`: dừng một phiên chạy nền
- `clear`: xóa một phiên đã hoàn thành khỏi bộ nhớ
- `remove`: dừng nếu đang chạy, nếu không thì xóa nếu đã hoàn thành

Lưu ý:

- Chỉ các phiên chạy nền mới được liệt kê/lưu trong bộ nhớ.
- Phiên bị mất khi khởi động lại tiến trình (không lưu đĩa).
- Log phiên chỉ lưu vào lịch sử chat nếu chạy `process poll/log` và kết quả công cụ được ghi lại.
- `process` giới hạn theo agent; chỉ thấy các phiên do agent đó khởi tạo.
- `process list` bao gồm `name` (động từ lệnh + mục tiêu) để quét nhanh.
- `process log` dùng `offset`/`limit` theo dòng.
- Khi bỏ qua cả `offset` và `limit`, trả về 200 dòng cuối và gợi ý phân trang.
- Khi có `offset` và bỏ qua `limit`, trả về từ `offset` đến cuối (không giới hạn 200).

## Ví dụ

Chạy tác vụ lâu và poll sau:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Chạy nền ngay lập tức:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Gửi stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```\n