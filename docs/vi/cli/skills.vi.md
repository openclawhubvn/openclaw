---
summary: "Tham khảo CLI cho `openclaw skills` (list/info/check) và điều kiện sử dụng skill"
read_when:
  - Muốn xem skill nào có sẵn và sẵn sàng chạy
  - Muốn debug thiếu binary/env/config cho skill
title: "skills"
---

# `openclaw skills`

Kiểm tra skill (đi kèm + workspace + managed overrides) và xem skill nào đủ điều kiện chạy, skill nào thiếu yêu cầu.

Liên quan:

- Hệ thống Skills: [Skills](/tools/skills)
- Cấu hình Skills: [Skills config](/tools/skills-config)
- Cài đặt ClawHub: [ClawHub](/tools/clawhub)

## Lệnh

```bash
openclaw skills list
openclaw skills list --eligible
openclaw skills info <name>
openclaw skills check
```\n