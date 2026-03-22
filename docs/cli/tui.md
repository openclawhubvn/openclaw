---
summary: "Khám phá cách sử dụng OpenClaw TUI để kết nối với Gateway qua giao diện dòng lệnh hiệu quả và dễ dàng."
read_when:
  - Bạn cần giao diện dòng lệnh cho Gateway (thân thiện với truy cập từ xa)
  - Bạn muốn truyền url/token/session từ các script
title: "Hướng Dẫn Sử Dụng OpenClaw TUI"
---

# `openclaw tui`

Mở giao diện dòng lệnh kết nối với Gateway.

Liên quan:

- Hướng dẫn TUI: [TUI](/web/tui)

Lưu ý:

- `tui` sẽ tự động giải quyết các SecretRefs cấu hình cho xác thực gateway bằng token/mật khẩu khi có thể (`env`/`file`/`exec` providers).
- Khi khởi chạy từ bên trong thư mục workspace của agent đã cấu hình, TUI sẽ tự động chọn agent đó làm mặc định cho khóa phiên (trừ khi `--session` được chỉ định rõ là `agent:<id>:...`).

## Ví dụ

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# khi chạy bên trong workspace của agent, tự động suy ra agent đó
openclaw tui --session bugfix
```
