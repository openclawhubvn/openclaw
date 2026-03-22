---
summary: "Tham khảo CLI cho `openclaw tui` (giao diện terminal kết nối Gateway)"
read_when:
  - Cần giao diện terminal cho Gateway (hỗ trợ remote)
  - Muốn truyền url/token/session từ script
title: "tui"
---

# `openclaw tui`

Mở giao diện terminal kết nối Gateway.

Liên quan:

- Hướng dẫn TUI: [TUI](/web/tui)

Lưu ý:

- `tui` tự động giải quyết SecretRefs cấu hình cho xác thực token/password khi có thể (`env`/`file`/`exec` providers).
- Khi chạy từ thư mục workspace của agent đã cấu hình, TUI tự động chọn agent đó làm session key mặc định (trừ khi `--session` được chỉ định rõ `agent:<id>:...`).

## Ví dụ

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# khi chạy trong workspace của agent, tự động suy ra agent đó
openclaw tui --session bugfix
```\n