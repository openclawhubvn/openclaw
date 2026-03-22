---
summary: "Tham khảo CLI cho `openclaw nodes` (danh sách/trạng thái/phê duyệt/kích hoạt, camera/canvas/màn hình)"
read_when:
  - Bạn đang quản lý các node đã ghép đôi (camera, màn hình, canvas)
  - Bạn cần phê duyệt yêu cầu hoặc kích hoạt lệnh node
title: "nodes"
---

# `openclaw nodes`

Quản lý các node đã ghép đôi (thiết bị) và kích hoạt các khả năng của node.

Liên quan:

- Tổng quan về Nodes: [Nodes](/nodes)
- Camera: [Camera nodes](/nodes/camera)
- Hình ảnh: [Image nodes](/nodes/images)

Tùy chọn chung:

- `--url`, `--token`, `--timeout`, `--json`

## Lệnh thông dụng

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` hiển thị bảng các node đang chờ/phối hợp. Các dòng đã phối hợp bao gồm thời gian kết nối gần nhất (Last Connect).
Sử dụng `--connected` để chỉ hiển thị các node đang kết nối. Sử dụng `--last-connected <duration>` để
lọc các node đã kết nối trong khoảng thời gian nhất định (ví dụ: `24h`, `7d`).

## Kích hoạt / chạy

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
openclaw nodes run --node <id|name|ip> <command...>
openclaw nodes run --raw "git status"
openclaw nodes run --agent main --node <id|name|ip> --raw "git status"
```

Các tùy chọn kích hoạt:

- `--params <json>`: Chuỗi đối tượng JSON (mặc định `{}`).
- `--invoke-timeout <ms>`: Thời gian chờ kích hoạt node (mặc định `15000`).
- `--idempotency-key <key>`: Khóa idempotency tùy chọn.

### Mặc định kiểu Exec

`nodes run` phản ánh hành vi exec của mô hình (mặc định + phê duyệt):

- Đọc `tools.exec.*` (cộng với ghi đè `agents.list[].tools.exec.*`).
- Sử dụng phê duyệt exec (`exec.approval.request`) trước khi kích hoạt `system.run`.
- `--node` có thể bỏ qua khi `tools.exec.node` được thiết lập.
- Yêu cầu một node quảng cáo `system.run` (ứng dụng đồng hành macOS hoặc máy chủ node không màn hình).

Các tùy chọn:

- `--cwd <path>`: Thư mục làm việc.
- `--env <key=val>`: Ghi đè môi trường (có thể lặp lại). Lưu ý: máy chủ node bỏ qua ghi đè `PATH` (và `tools.exec.pathPrepend` không được áp dụng cho máy chủ node).
- `--command-timeout <ms>`: Thời gian chờ lệnh.
- `--invoke-timeout <ms>`: Thời gian chờ kích hoạt node (mặc định `30000`).
- `--needs-screen-recording`: Yêu cầu quyền ghi màn hình.
- `--raw <command>`: Chạy một chuỗi shell (`/bin/sh -lc` hoặc `cmd.exe /c`).
  Trong chế độ danh sách cho phép trên máy chủ node Windows, việc chạy shell-wrapper `cmd.exe /c` yêu cầu phê duyệt
  (mục danh sách cho phép không tự động cho phép dạng wrapper).
- `--agent <id>`: Phê duyệt/danh sách cho phép theo phạm vi agent (mặc định là agent đã cấu hình).
- `--ask <off|on-miss|always>`, `--security <deny|allowlist|full>`: ghi đè.
