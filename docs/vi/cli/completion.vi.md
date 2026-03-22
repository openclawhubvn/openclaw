---
summary: "Tham khảo CLI cho `openclaw completion` (tạo/cài đặt script hoàn thành shell)"
read_when:
  - Cần hoàn thành shell cho zsh/bash/fish/PowerShell
  - Muốn lưu cache script hoàn thành dưới OpenClaw state
title: "completion"
---

# `openclaw completion`

Tạo script hoàn thành shell và tùy chọn cài đặt vào profile shell.

## Cách dùng

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Tùy chọn

- `-s, --shell <shell>`: shell mục tiêu (`zsh`, `bash`, `powershell`, `fish`; mặc định: `zsh`)
- `-i, --install`: cài đặt hoàn thành bằng cách thêm dòng source vào profile shell
- `--write-state`: ghi script hoàn thành vào `$OPENCLAW_STATE_DIR/completions` mà không in ra stdout
- `-y, --yes`: bỏ qua xác nhận khi cài đặt

## Lưu ý

- `--install` ghi một block "OpenClaw Completion" nhỏ vào profile shell và trỏ đến script đã cache.
- Không có `--install` hoặc `--write-state`, lệnh sẽ in script ra stdout.
- Quá trình tạo hoàn thành sẽ tải trước cây lệnh để bao gồm các subcommand lồng nhau.\n