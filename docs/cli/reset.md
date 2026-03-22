---
summary: "Khám phá cách sử dụng lệnh 'openclaw reset' để đặt lại cấu hình và trạng thái cục bộ nhanh chóng, hiệu quả."
read_when:
  - Bạn muốn xóa trạng thái cục bộ nhưng giữ lại CLI đã cài đặt
  - Bạn muốn chạy thử để xem những gì sẽ bị xóa
title: "Hướng Dẫn Reset Cấu Hình OpenClaw CLI"
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
