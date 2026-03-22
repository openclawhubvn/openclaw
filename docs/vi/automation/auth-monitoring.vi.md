---
summary: "Giám sát OAuth hết hạn cho model providers"
read_when:
  - Thiết lập giám sát hoặc cảnh báo hết hạn auth
  - Tự động kiểm tra làm mới OAuth cho Claude Code / Codex
title: "Giám sát Auth"
---

# Giám sát Auth

OpenClaw cung cấp thông tin sức khỏe OAuth qua `openclaw models status`. Dùng để tự động hóa và cảnh báo; script là tùy chọn thêm cho quy trình trên điện thoại.

## Ưu tiên: Kiểm tra bằng CLI (di động)

```bash
openclaw models status --check
```

Mã thoát:

- `0`: OK
- `1`: thông tin xác thực hết hạn hoặc thiếu
- `2`: sắp hết hạn (trong vòng 24h)

Hoạt động tốt với cron/systemd, không cần script bổ sung.

## Script tùy chọn (ops / quy trình điện thoại)

Các script này nằm trong `scripts/` và **tùy chọn**. Yêu cầu truy cập SSH vào gateway host và tối ưu cho systemd + Termux.

- `scripts/claude-auth-status.sh` hiện dùng `openclaw models status --json` làm nguồn chính (dự phòng đọc file trực tiếp nếu CLI không khả dụng), nên giữ `openclaw` trong `PATH` cho timer.
- `scripts/auth-monitor.sh`: mục tiêu timer cho cron/systemd; gửi cảnh báo (ntfy hoặc điện thoại).
- `scripts/systemd/openclaw-auth-monitor.{service,timer}`: timer user systemd.
- `scripts/claude-auth-status.sh`: kiểm tra auth cho Claude Code + OpenClaw (đầy đủ/json/đơn giản).
- `scripts/mobile-reauth.sh`: quy trình re-auth có hướng dẫn qua SSH.
- `scripts/termux-quick-auth.sh`: widget một chạm trạng thái + mở URL auth.
- `scripts/termux-auth-widget.sh`: quy trình widget có hướng dẫn đầy đủ.
- `scripts/termux-sync-widget.sh`: đồng bộ thông tin xác thực Claude Code → OpenClaw.

Nếu không cần tự động hóa trên điện thoại hoặc timer systemd, có thể bỏ qua các script này.\n