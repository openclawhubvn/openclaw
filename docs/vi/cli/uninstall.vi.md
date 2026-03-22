---
summary: "Tham khảo CLI cho `openclaw uninstall` (gỡ dịch vụ gateway + dữ liệu local)"
read_when:
  - Muốn gỡ dịch vụ gateway và/hoặc trạng thái local
  - Muốn chạy thử trước khi gỡ
title: "uninstall"
---

# `openclaw uninstall`

Gỡ dịch vụ gateway + dữ liệu local (CLI vẫn giữ lại).

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Chạy `openclaw backup create` trước nếu cần snapshot để khôi phục sau khi gỡ trạng thái hoặc workspace.\n