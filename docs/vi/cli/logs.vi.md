---
summary: "Tham khảo CLI cho `openclaw logs` (tail logs Gateway qua RPC)"
read_when:
  - Cần tail logs Gateway từ xa (không dùng SSH)
  - Muốn dòng log dạng JSON để dùng với công cụ
title: "logs"
---

# `openclaw logs`

Tail logs file của Gateway qua RPC (chạy ở chế độ remote).

Liên quan:

- Tổng quan Logging: [Logging](/logging)

## Ví dụ

```bash
openclaw logs
openclaw logs --follow
openclaw logs --json
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
```

Dùng `--local-time` để hiển thị timestamp theo múi giờ local.\n