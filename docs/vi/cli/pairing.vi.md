---
summary: "Tham khảo CLI cho `openclaw pairing` (duyệt/xem yêu cầu pairing)"
read_when:
  - Sử dụng pairing-mode DMs và cần duyệt người gửi
title: "pairing"
---

# `openclaw pairing`

Duyệt hoặc kiểm tra yêu cầu pairing DM (cho các kênh hỗ trợ pairing).

Liên quan:

- Luồng Pairing: [Pairing](/channels/pairing)

## Lệnh

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## Ghi chú

- Đầu vào Channel: truyền vị trí (`pairing list telegram`) hoặc dùng `--channel <channel>`.
- `pairing list` hỗ trợ `--account <accountId>` cho kênh nhiều tài khoản.
- `pairing approve` hỗ trợ `--account <accountId>` và `--notify`.
- Nếu chỉ có một kênh hỗ trợ pairing được cấu hình, có thể dùng `pairing approve <code>`.\n