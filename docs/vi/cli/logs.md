---
summary: "Tham khảo CLI cho `openclaw logs` (theo dõi log Gateway qua RPC)"
read_when:
  - Cần theo dõi log Gateway từ xa (không cần SSH)
  - Muốn dòng log dạng JSON cho công cụ
title: "logs"
---

# `openclaw logs`

Theo dõi log file của Gateway qua RPC (hoạt động ở chế độ từ xa).

Liên quan:

- Tổng quan về Logging: [Logging](/logging)

## Ví dụ

```bash
openclaw logs
openclaw logs --follow
openclaw logs --json
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
```

Sử dụng `--local-time` để hiển thị dấu thời gian theo múi giờ địa phương.
