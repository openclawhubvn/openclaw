---
summary: "Tham khảo CLI cho `openclaw uninstall` (gỡ bỏ dịch vụ gateway + dữ liệu cục bộ)"
read_when:
  - Bạn muốn gỡ bỏ dịch vụ gateway và/hoặc trạng thái cục bộ
  - Bạn muốn chạy thử trước khi thực hiện
title: "uninstall"
---

# `openclaw uninstall`

Gỡ bỏ dịch vụ gateway và dữ liệu cục bộ (CLI vẫn giữ lại).

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Chạy `openclaw backup create` trước nếu muốn tạo bản snapshot có thể khôi phục trước khi xóa trạng thái hoặc workspace.
