---
summary: "Tìm hiểu cách sử dụng lệnh `openclaw health` để kiểm tra sức khỏe gateway qua RPC, đảm bảo hệ thống hoạt động ổn định."
read_when:
  - Bạn muốn nhanh chóng kiểm tra tình trạng hoạt động của Gateway
title: "Hướng Dẫn Sử Dụng OpenClaw Health CLI"
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
