---
summary: "Tham khảo CLI cho `openclaw reset` (reset trạng thái/cấu hình local)"
read_when:
  - Muốn xóa trạng thái local nhưng giữ lại CLI
  - Muốn chạy thử xem những gì sẽ bị xóa
title: "reset"
---

# `openclaw reset`

Reset cấu hình/trạng thái local (giữ lại CLI).

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config+creds+sessions --yes --non-interactive
```

Chạy `openclaw backup create` trước nếu cần snapshot có thể khôi phục trước khi xóa trạng thái local.\n