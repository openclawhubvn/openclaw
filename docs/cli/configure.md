---
summary: "Tìm hiểu cách sử dụng lệnh 'openclaw configure' để cấu hình hệ thống CLI hiệu quả và dễ dàng."
read_when:
  - Bạn muốn điều chỉnh thông tin đăng nhập, thiết bị hoặc mặc định của agent một cách tương tác
title: "Hướng Dẫn Cấu Hình OpenClaw CLI"
---

# `openclaw configure`

Lời nhắc tương tác để thiết lập thông tin đăng nhập, thiết bị và mặc định của agent.

Lưu ý: Phần **Model** hiện bao gồm lựa chọn nhiều mục cho danh sách cho phép `agents.defaults.models` (những gì hiển thị trong `/model` và trình chọn model).

Mẹo: `openclaw config` không có subcommand sẽ mở cùng một trình hướng dẫn. Sử dụng `openclaw config get|set|unset` để chỉnh sửa không tương tác.

Liên quan:

- Tham khảo cấu hình Gateway: [Configuration](/gateway/configuration)
- Config CLI: [Config](/cli/config)

Ghi chú:

- Việc chọn nơi Gateway chạy luôn cập nhật `gateway.mode`. Bạn có thể chọn "Tiếp tục" mà không cần các phần khác nếu chỉ cần điều đó.
- Các dịch vụ hướng kênh (Slack/Discord/Matrix/Microsoft Teams) yêu cầu danh sách cho phép kênh/phòng trong quá trình thiết lập. Bạn có thể nhập tên hoặc ID; trình hướng dẫn sẽ chuyển đổi tên thành ID khi có thể.
- Nếu bạn thực hiện bước cài đặt daemon, xác thực token yêu cầu một token, và `gateway.auth.token` được quản lý bởi SecretRef, cấu hình sẽ xác thực SecretRef nhưng không lưu trữ giá trị token văn bản rõ đã giải quyết vào metadata môi trường dịch vụ giám sát.
- Nếu xác thực token yêu cầu một token và SecretRef token được cấu hình chưa được giải quyết, cấu hình sẽ chặn cài đặt daemon với hướng dẫn khắc phục có thể thực hiện.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, cấu hình sẽ chặn cài đặt daemon cho đến khi chế độ được đặt rõ ràng.

## Ví dụ

```bash
openclaw configure
openclaw configure --section model --section channels
```
