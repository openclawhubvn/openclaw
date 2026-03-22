---
summary: "Tham khảo CLI cho `openclaw configure` (cấu hình tương tác)"
read_when:
  - Muốn chỉnh sửa credentials, devices, hoặc agent defaults một cách tương tác
title: "configure"
---

# `openclaw configure`

Prompt tương tác để thiết lập credentials, devices và agent defaults.

Lưu ý: Phần **Model** giờ có multi-select cho allowlist `agents.defaults.models` (hiển thị trong `/model` và model picker).

Mẹo: `openclaw config` không có subcommand sẽ mở cùng wizard. Dùng `openclaw config get|set|unset` để chỉnh sửa không tương tác.

Liên quan:

- Tham khảo cấu hình Gateway: [Configuration](/gateway/configuration)
- Config CLI: [Config](/cli/config)

Ghi chú:

- Chọn nơi Gateway chạy luôn cập nhật `gateway.mode`. Có thể chọn "Continue" mà không cần các phần khác nếu chỉ cần vậy.
- Dịch vụ theo kênh (Slack/Discord/Matrix/Microsoft Teams) yêu cầu allowlist kênh/phòng khi thiết lập. Có thể nhập tên hoặc ID; wizard sẽ chuyển tên thành ID nếu có thể.
- Nếu chạy bước cài daemon, xác thực token yêu cầu token, và `gateway.auth.token` được quản lý bởi SecretRef, configure sẽ xác thực SecretRef nhưng không lưu giá trị token plaintext đã giải mã vào metadata môi trường dịch vụ supervisor.
- Nếu xác thực token yêu cầu token và SecretRef token cấu hình chưa được giải mã, configure sẽ chặn cài daemon và cung cấp hướng dẫn khắc phục.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` được cấu hình và `gateway.auth.mode` chưa được đặt, configure sẽ chặn cài daemon cho đến khi mode được đặt rõ ràng.

## Ví dụ

```bash
openclaw configure
openclaw configure --section model --section channels
```\n