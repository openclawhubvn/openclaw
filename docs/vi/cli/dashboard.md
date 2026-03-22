---
summary: "Tham khảo CLI cho `openclaw dashboard` (mở Giao diện Điều khiển)"
read_when:
  - Bạn muốn mở Giao diện Điều khiển với token hiện tại
  - Bạn muốn in URL mà không cần mở trình duyệt
title: "dashboard"
---

# `openclaw dashboard`

Mở Giao diện Điều khiển bằng cách sử dụng xác thực hiện tại.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Ghi chú:

- `dashboard` sẽ giải quyết các SecretRefs của `gateway.auth.token` đã được cấu hình khi có thể.
- Đối với các token được quản lý bởi SecretRef (đã giải quyết hoặc chưa), `dashboard` sẽ in/sao chép/mở một URL không chứa token để tránh lộ thông tin bí mật ra ngoài qua đầu ra terminal, lịch sử clipboard, hoặc các tham số mở trình duyệt.
- Nếu `gateway.auth.token` được quản lý bởi SecretRef nhưng chưa được giải quyết trong đường dẫn lệnh này, lệnh sẽ in một URL không chứa token và cung cấp hướng dẫn khắc phục rõ ràng thay vì nhúng một placeholder token không hợp lệ.
