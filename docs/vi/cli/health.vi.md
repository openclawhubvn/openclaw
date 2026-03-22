---
summary: "Tham khảo CLI cho `openclaw health` (kiểm tra sức khỏe Gateway qua RPC)"
read_when:
  - Cần kiểm tra nhanh tình trạng hoạt động của Gateway
title: "health"
---

# `openclaw health`

Lấy thông tin sức khỏe từ Gateway đang chạy.

```bash
openclaw health
openclaw health --json
openclaw health --verbose
```

Ghi chú:

- `--verbose` chạy các probe trực tiếp và in thời gian cho từng tài khoản khi có nhiều tài khoản được cấu hình.
- Kết quả bao gồm thông tin session của từng agent khi có nhiều agent được cấu hình.\n