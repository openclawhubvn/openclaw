---
summary: "Giám sát thời hạn OAuth cho các nhà cung cấp mô hình"
read_when:
  - Thiết lập giám sát hoặc cảnh báo hết hạn xác thực
  - Tự động kiểm tra làm mới OAuth cho Claude Code / Codex
title: "Giám sát xác thực"
---

# Giám sát xác thực

OpenClaw cung cấp thông tin về thời hạn OAuth thông qua `openclaw models status`. Sử dụng lệnh này để tự động hóa và cảnh báo; các script là tùy chọn bổ sung cho quy trình làm việc trên điện thoại.

## Ưu tiên: Kiểm tra bằng CLI (di động)

```bash
openclaw models status --check
```

Mã thoát:

- `0`: OK
- `1`: thông tin xác thực đã hết hạn hoặc thiếu
- `2`: sắp hết hạn (trong vòng 24 giờ)

Lệnh này hoạt động trong cron/systemd và không cần thêm script nào khác.

## Script tùy chọn (vận hành / quy trình điện thoại)

Các script này nằm trong thư mục `scripts/` và là **tùy chọn**. Chúng giả định có quyền truy cập SSH vào máy chủ gateway và được điều chỉnh cho systemd + Termux.

- `scripts/claude-auth-status.sh` hiện sử dụng `openclaw models status --json` làm nguồn thông tin chính (sẽ đọc trực tiếp từ file nếu CLI không khả dụng), vì vậy hãy giữ `openclaw` trong `PATH` cho các bộ đếm thời gian.
- `scripts/auth-monitor.sh`: mục tiêu bộ đếm thời gian cron/systemd; gửi cảnh báo (ntfy hoặc điện thoại).
- `scripts/systemd/openclaw-auth-monitor.{service,timer}`: bộ đếm thời gian người dùng systemd.
- `scripts/claude-auth-status.sh`: kiểm tra xác thực Claude Code + OpenClaw (đầy đủ/json/đơn giản).
- `scripts/mobile-reauth.sh`: quy trình hướng dẫn xác thực lại qua SSH.
- `scripts/termux-quick-auth.sh`: widget trạng thái một chạm + mở URL xác thực.
- `scripts/termux-auth-widget.sh`: quy trình widget hướng dẫn đầy đủ.
- `scripts/termux-sync-widget.sh`: đồng bộ thông tin xác thực Claude Code → OpenClaw.

Nếu không cần tự động hóa trên điện thoại hoặc bộ đếm thời gian systemd, có thể bỏ qua các script này.
