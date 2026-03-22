---
summary: "Tham khảo CLI cho `openclaw health` (điểm cuối sức khỏe gateway qua RPC)"
read_when:
  - Bạn muốn nhanh chóng kiểm tra tình trạng hoạt động của Gateway
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

- `--verbose` thực hiện kiểm tra trực tiếp và hiển thị thời gian cho từng tài khoản khi có nhiều tài khoản được cấu hình.
- Kết quả bao gồm thông tin lưu trữ phiên cho từng agent khi có nhiều agent được cấu hình.
