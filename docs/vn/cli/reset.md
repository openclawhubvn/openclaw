---
summary: "Tham khảo CLI cho `openclaw reset` (đặt lại trạng thái/cấu hình cục bộ)"
read_when:
  - Bạn muốn xóa trạng thái cục bộ nhưng giữ lại CLI đã cài đặt
  - Bạn muốn chạy thử để xem những gì sẽ bị xóa
title: "reset"
---

# `openclaw reset`

Đặt lại cấu hình/trạng thái cục bộ (giữ nguyên CLI đã cài đặt).

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config+creds+sessions --yes --non-interactive
```

Chạy `openclaw backup create` trước nếu muốn tạo bản sao lưu có thể khôi phục trước khi xóa trạng thái cục bộ.
