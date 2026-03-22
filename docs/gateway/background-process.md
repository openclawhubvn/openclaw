---
summary: "Khám phá cách thực thi nền và quản lý tiến trình hiệu quả, tối ưu hóa hiệu suất hệ thống với hướng dẫn chi tiết từng bước."
read_when:
  - Thêm hoặc chỉnh sửa hành vi thực thi nền
  - Gỡ lỗi các tác vụ thực thi dài
title: "Hướng Dẫn Thực Thi Nền và Quản Lý Tiến Trình"
---

# Công Cụ Thực Thi Nền + Quản Lý Tiến Trình

OpenClaw thực thi các lệnh shell thông qua công cụ `exec` và giữ các tác vụ dài trong bộ nhớ. Công cụ `process` quản lý các phiên nền đó.

## Công cụ exec

Các tham số chính:

- `command` (bắt buộc)
- `yieldMs` (mặc định 10000): tự động chuyển nền sau khoảng thời gian này
- `background` (bool): chuyển nền ngay lập tức
- `timeout` (giây, mặc định 1800): dừng tiến trình sau thời gian này
- `elevated` (bool): chạy trên host nếu chế độ nâng cao được bật/cho phép
- Cần TTY thực? Đặt `pty: true`.
- `workdir`, `env`

Hành vi:

- Chạy nền trước trả về kết quả trực tiếp.
- Khi chuyển nền (tự động hoặc do timeout), công cụ trả về `status: "running"` + `sessionId` và một đoạn ngắn.
- Kết quả được giữ trong bộ nhớ cho đến khi phiên được kiểm tra hoặc xóa.
- Nếu công cụ `process` không được phép, `exec` chạy đồng bộ và bỏ qua `yieldMs`/`background`.
- Các lệnh exec được khởi tạo nhận `OPENCLAW_SHELL=exec` để áp dụng các quy tắc shell/profile theo ngữ cảnh.

## Kết nối tiến trình con

Khi khởi tạo các tiến trình con dài bên ngoài công cụ exec/process (ví dụ: CLI respawns hoặc gateway helpers), gắn kết nối trợ giúp tiến trình con để tín hiệu kết thúc được chuyển tiếp và các listener được tách ra khi thoát/lỗi. Điều này tránh các tiến trình mồ côi trên systemd và giữ hành vi tắt máy nhất quán trên các nền tảng.

Ghi đè môi trường:

- `PI_BASH_YIELD_MS`: thời gian yield mặc định (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: giới hạn kết quả trong bộ nhớ (ký tự)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: giới hạn stdout/stderr đang chờ xử lý mỗi luồng (ký tự)
- `PI_BASH_JOB_TTL_MS`: TTL cho các phiên đã hoàn thành (ms, giới hạn từ 1m–3h)

Cấu hình (ưu tiên):

- `tools.exec.backgroundMs` (mặc định 10000)
- `tools.exec.timeoutSec` (mặc định 1800)
- `tools.exec.cleanupMs` (mặc định 1800000)
- `tools.exec.notifyOnExit` (mặc định true): xếp hàng một sự kiện hệ thống + yêu cầu heartbeat khi một exec nền kết thúc.
- `tools.exec.notifyOnExitEmptySuccess` (mặc định false): khi true, cũng xếp hàng các sự kiện hoàn thành cho các lần chạy nền thành công không tạo ra kết quả.

## Công cụ process

Các hành động:

- `list`: các phiên đang chạy + đã hoàn thành
- `poll`: lấy kết quả mới cho một phiên (cũng báo cáo trạng thái thoát)
- `log`: đọc kết quả tổng hợp (hỗ trợ `offset` + `limit`)
- `write`: gửi stdin (`data`, `eof` tùy chọn)
- `kill`: kết thúc một phiên nền
- `clear`: xóa một phiên đã hoàn thành khỏi bộ nhớ
- `remove`: kết thúc nếu đang chạy, nếu không thì xóa nếu đã hoàn thành

Lưu ý:

- Chỉ các phiên nền mới được liệt kê/lưu trữ trong bộ nhớ.
- Các phiên bị mất khi tiến trình khởi động lại (không lưu trữ trên đĩa).
- Nhật ký phiên chỉ được lưu vào lịch sử chat nếu bạn chạy `process poll/log` và kết quả công cụ được ghi lại.
- `process` được giới hạn theo agent; nó chỉ thấy các phiên được khởi tạo bởi agent đó.
- `process list` bao gồm một `name` được suy ra (động từ lệnh + mục tiêu) để quét nhanh.
- `process log` sử dụng `offset`/`limit` dựa trên dòng.
- Khi cả `offset` và `limit` đều bị bỏ qua, nó trả về 200 dòng cuối cùng và bao gồm gợi ý phân trang.
- Khi `offset` được cung cấp và `limit` bị bỏ qua, nó trả về từ `offset` đến cuối (không giới hạn 200).

## Ví dụ

Chạy một tác vụ dài và kiểm tra sau:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Bắt đầu ngay lập tức trong nền:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Gửi stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```
