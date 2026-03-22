---
summary: "Khám phá cách sử dụng CLI để duyệt và xem danh sách yêu cầu ghép đôi trong OpenClaw. Tối ưu hóa quy trình làm việc của bạn."
read_when:
  - Bạn đang sử dụng chế độ ghép đôi DMs và cần duyệt người gửi
title: "Hướng Dẫn Ghép Đôi CLI OpenClaw"
---

# `openclaw pairing`

Duyệt hoặc kiểm tra các yêu cầu ghép đôi DM (dành cho các kênh hỗ trợ ghép đôi).

Liên quan:

- Quy trình ghép đôi: [Pairing](/channels/pairing)

## Lệnh

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## Ghi chú

- Đầu vào kênh: có thể truyền theo vị trí (`pairing list telegram`) hoặc dùng `--channel <channel>`.
- `pairing list` hỗ trợ `--account <accountId>` cho các kênh đa tài khoản.
- `pairing approve` hỗ trợ `--account <accountId>` và `--notify`.
- Nếu chỉ có một kênh hỗ trợ ghép đôi được cấu hình, có thể dùng `pairing approve <code>`.
