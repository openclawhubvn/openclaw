---
summary: "Tham khảo CLI cho `openclaw dashboard` (mở Control UI)"
read_when:
  - Muốn mở Control UI với token hiện tại
  - Muốn in URL mà không cần mở trình duyệt
title: "dashboard"
---

# `openclaw dashboard`

Mở Control UI bằng auth hiện tại.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Ghi chú:

- `dashboard` sẽ giải quyết `gateway.auth.token` SecretRefs đã cấu hình nếu có thể.
- Với token được quản lý bởi SecretRef (đã giải quyết hoặc chưa), `dashboard` sẽ in/sao chép/mở URL không chứa token để tránh lộ bí mật ra terminal, clipboard, hoặc khi mở trình duyệt.
- Nếu `gateway.auth.token` được quản lý bởi SecretRef nhưng chưa giải quyết trong lệnh này, lệnh sẽ in URL không chứa token và hướng dẫn khắc phục rõ ràng thay vì nhúng placeholder token không hợp lệ.\n