---
summary: "Tìm hiểu cách theo dõi log Gateway qua RPC với hướng dẫn chi tiết sử dụng lệnh OpenClaw Logs CLI."
read_when:
  - Cần theo dõi log Gateway từ xa (không cần SSH)
  - Muốn dòng log dạng JSON cho công cụ
title: "Hướng Dẫn Sử Dụng OpenClaw Logs CLI"
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
