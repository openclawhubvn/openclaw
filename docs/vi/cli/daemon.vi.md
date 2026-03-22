---
summary: "Tham khảo CLI cho `openclaw daemon` (bí danh cũ để quản lý dịch vụ gateway)"
read_when:
  - Vẫn dùng `openclaw daemon ...` trong script
  - Cần lệnh quản lý vòng đời dịch vụ (install/start/stop/restart/status)
title: "daemon"
---

# `openclaw daemon`

Bí danh cũ cho các lệnh quản lý dịch vụ Gateway.

`openclaw daemon ...` tương đương với các lệnh dịch vụ `openclaw gateway ...`.

## Cách dùng

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
- `start`: khởi động dịch vụ
- `stop`: dừng dịch vụ
- `restart`: khởi động lại dịch vụ

## Tùy chọn phổ biến

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- vòng đời (`uninstall|start|stop|restart`): `--json`

Ghi chú:

- `status` giải quyết SecretRefs cấu hình cho xác thực khi có thể.
- Nếu SecretRef cần thiết không được giải quyết, `daemon status --json` báo `rpc.authWarning` khi kết nối/xác thực thất bại; cần truyền `--token`/`--password` hoặc giải quyết nguồn secret trước.
- Nếu kiểm tra thành công, cảnh báo auth-ref chưa giải quyết sẽ bị ẩn để tránh cảnh báo sai.
- Trên Linux với systemd, kiểm tra token-drift của `status` bao gồm cả nguồn `Environment=` và `EnvironmentFile=`.
- Khi xác thực token cần token và `gateway.auth.token` được quản lý bởi SecretRef, `install` kiểm tra SecretRef có thể giải quyết nhưng không lưu token đã giải quyết vào metadata môi trường dịch vụ.
- Nếu xác thực token cần token và SecretRef token cấu hình không được giải quyết, cài đặt sẽ thất bại.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` được cấu hình và `gateway.auth.mode` chưa được đặt, cài đặt sẽ bị chặn cho đến khi mode được đặt rõ ràng.

## Ưu tiên

Sử dụng [`openclaw gateway`](/cli/gateway) cho tài liệu và ví dụ hiện tại.\n