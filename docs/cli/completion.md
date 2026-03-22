---
summary: "Khám phá cách tạo và cài đặt script hoàn thành shell cho OpenClaw CLI, tối ưu hóa trải nghiệm dòng lệnh của bạn."
read_when:
  - Bạn muốn có tính năng hoàn thành lệnh cho zsh/bash/fish/PowerShell
  - Bạn cần lưu trữ script hoàn thành dưới trạng thái OpenClaw
title: "Hướng Dẫn Cài Đặt Script Hoàn Thành Shell"
---

# `openclaw completion`

Tạo script hoàn thành lệnh cho shell và tùy chọn cài đặt chúng vào profile shell của bạn.

## Cách sử dụng

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
- `-i, --install`: cài đặt hoàn thành bằng cách thêm một dòng nguồn vào profile shell của bạn
- `--write-state`: ghi script hoàn thành vào `$OPENCLAW_STATE_DIR/completions` mà không in ra stdout
- `-y, --yes`: bỏ qua các thông báo xác nhận khi cài đặt

## Lưu ý

- `--install` ghi một khối "OpenClaw Completion" nhỏ vào profile shell của bạn và trỏ đến script đã lưu trữ.
- Nếu không có `--install` hoặc `--write-state`, lệnh sẽ in script ra stdout.
- Quá trình tạo hoàn thành sẽ tải trước cây lệnh để bao gồm các lệnh con lồng nhau.
