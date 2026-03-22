---
summary: "Cách ứng dụng macOS báo cáo trạng thái sức khỏe của gateway/Baileys"
read_when:
  - Debug ứng dụng mac về chỉ số sức khỏe
title: "Kiểm tra sức khỏe (macOS)"
---

# Kiểm tra sức khỏe trên macOS

Cách kiểm tra kênh liên kết có ổn định từ ứng dụng trên thanh menu.

## Thanh menu

- Chấm trạng thái phản ánh sức khỏe của Baileys:
  - Xanh: đã liên kết + socket mở gần đây.
  - Cam: đang kết nối/thử lại.
  - Đỏ: đã đăng xuất hoặc kiểm tra thất bại.
- Dòng phụ hiển thị "linked · auth 12m" hoặc lý do thất bại.
- Mục "Run Health Check" trong menu kích hoạt kiểm tra theo yêu cầu.

## Cài đặt

- Tab General có thẻ Health hiển thị: tuổi xác thực liên kết, đường dẫn/số lượng session-store, thời gian kiểm tra cuối, mã lỗi/trạng thái cuối, và nút Run Health Check / Reveal Logs.
- Sử dụng snapshot cache để UI tải nhanh và hoạt động tốt khi offline.
- **Tab Channels** hiển thị trạng thái kênh + điều khiển cho WhatsApp/Telegram (QR đăng nhập, đăng xuất, kiểm tra, ngắt kết nối/lỗi cuối).

## Cách hoạt động của kiểm tra

- Ứng dụng chạy `openclaw health --json` qua `ShellExecutor` mỗi ~60 giây và theo yêu cầu. Kiểm tra tải thông tin xác thực và báo cáo trạng thái mà không gửi tin nhắn.
- Cache snapshot tốt cuối cùng và lỗi cuối riêng biệt để tránh nhấp nháy; hiển thị thời gian của từng cái.

## Khi không chắc chắn

- Vẫn có thể dùng CLI trong [Gateway health](/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) và theo dõi `/tmp/openclaw/openclaw-*.log` cho `web-heartbeat` / `web-reconnect`.\n