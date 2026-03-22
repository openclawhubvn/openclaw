# `openclaw nodes`

Quản lý các node (thiết bị) đã pair và thực thi các khả năng của node.

Liên quan:

- Tổng quan Nodes: [Nodes](/nodes)
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

`nodes list` in ra bảng pending/paired. Dòng paired bao gồm thời gian kết nối gần nhất (Last Connect).
Dùng `--connected` để chỉ hiển thị các node đang kết nối. Dùng `--last-connected <duration>` để lọc các node đã kết nối trong khoảng thời gian (ví dụ: `24h`, `7d`).

## Thực thi / chạy

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
openclaw nodes run --node <id|name|ip> <command...>
openclaw nodes run --raw "git status"
openclaw nodes run --agent main --node <id|name|ip> --raw "git status"
```

Các flag cho invoke:

- `--params <json>`: Chuỗi JSON object (mặc định `{}`).
- `--invoke-timeout <ms>`: Thời gian chờ invoke node (mặc định `15000`).
- `--idempotency-key <key>`: Khóa idempotency tùy chọn.

### Mặc định kiểu Exec

`nodes run` mô phỏng hành vi exec của model (mặc định + phê duyệt):

- Đọc `tools.exec.*` (cộng với các override `agents.list[].tools.exec.*`).
- Sử dụng phê duyệt exec (`exec.approval.request`) trước khi gọi `system.run`.
- Có thể bỏ qua `--node` khi `tools.exec.node` đã được thiết lập.
- Yêu cầu một node quảng cáo `system.run` (ứng dụng companion macOS hoặc node host headless).

Các flag:

- `--cwd <path>`: Thư mục làm việc.
- `--env <key=val>`: Ghi đè biến môi trường (có thể lặp lại). Lưu ý: node hosts bỏ qua ghi đè `PATH` (và `tools.exec.pathPrepend` không áp dụng cho node hosts).
- `--command-timeout <ms>`: Thời gian chờ lệnh.
- `--invoke-timeout <ms>`: Thời gian chờ invoke node (mặc định `30000`).
- `--needs-screen-recording`: Yêu cầu quyền ghi màn hình.
- `--raw <command>`: Chạy chuỗi shell (`/bin/sh -lc` hoặc `cmd.exe /c`).
  Trong chế độ allowlist trên Windows node hosts, chạy shell-wrapper `cmd.exe /c` yêu cầu phê duyệt
  (mục allowlist không tự động cho phép dạng wrapper).
- `--agent <id>`: Phê duyệt/allowlist theo agent (mặc định là agent đã cấu hình).
- `--ask <off|on-miss|always>`, `--security <deny|allowlist|full>`: Ghi đè.\n