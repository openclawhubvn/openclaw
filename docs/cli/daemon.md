---
summary: "Khám phá cách sử dụng OpenClaw Daemon để quản lý dịch vụ gateway hiệu quả. Hướng dẫn chi tiết và dễ hiểu."
read_when:
  - Bạn vẫn sử dụng `openclaw daemon ...` trong các script
  - Bạn cần các lệnh quản lý vòng đời dịch vụ (cài đặt/bắt đầu/dừng/khởi động lại/trạng thái)
title: "Hướng Dẫn Cấu Hình OpenClaw Daemon"
---

# `openclaw daemon`

Bí danh cũ để quản lý các lệnh dịch vụ Gateway.

`openclaw daemon ...` tương ứng với cùng bề mặt điều khiển dịch vụ như các lệnh dịch vụ `openclaw gateway ...`.

## Cách sử dụng

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Các lệnh con

- `status`: hiển thị trạng thái cài đặt dịch vụ và kiểm tra sức khỏe Gateway
- `install`: cài đặt dịch vụ (`launchd`/`systemd`/`schtasks`)
- `uninstall`: gỡ bỏ dịch vụ
- `start`: bắt đầu dịch vụ
- `stop`: dừng dịch vụ
- `restart`: khởi động lại dịch vụ

## Tùy chọn chung

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- vòng đời (`uninstall|start|stop|restart`): `--json`

Lưu ý:

- `status` giải quyết các SecretRefs xác thực đã cấu hình để xác thực khi có thể.
- Nếu một SecretRef xác thực cần thiết không được giải quyết trong đường dẫn lệnh này, `daemon status --json` sẽ báo cáo `rpc.authWarning` khi kết nối/xác thực không thành công; hãy truyền `--token`/`--password` rõ ràng hoặc giải quyết nguồn bí mật trước.
- Nếu kiểm tra thành công, các cảnh báo auth-ref chưa giải quyết sẽ bị ẩn để tránh báo động sai.
- Trên các cài đặt Linux systemd, kiểm tra lệch token `status` bao gồm cả nguồn `Environment=` và `EnvironmentFile=` của đơn vị.
- Khi xác thực token yêu cầu một token và `gateway.auth.token` được quản lý bởi SecretRef, `install` xác nhận rằng SecretRef có thể được giải quyết nhưng không lưu trữ token đã giải quyết vào metadata môi trường dịch vụ.
- Nếu xác thực token yêu cầu một token và SecretRef token đã cấu hình không được giải quyết, cài đặt sẽ thất bại.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, cài đặt sẽ bị chặn cho đến khi chế độ được đặt rõ ràng.

## Khuyến nghị

Sử dụng [`openclaw gateway`](/cli/gateway) cho tài liệu và ví dụ hiện tại.
