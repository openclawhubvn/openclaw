---
summary: "Tìm hiểu cách kiểm tra và báo cáo trạng thái sức khỏe của hệ thống trên macOS, đảm bảo hiệu suất tối ưu cho thiết bị của bạn."
read_when:
  - Gỡ lỗi chỉ số sức khỏe của ứng dụng macOS
title: "Hướng Dẫn Kiểm Tra Sức Khỏe Trên macOS"
---

# Kiểm tra sức khỏe trên macOS

Cách kiểm tra xem kênh liên kết có hoạt động tốt từ ứng dụng trên thanh menu hay không.

## Thanh menu

- Chấm trạng thái hiện nay phản ánh sức khỏe của Baileys:
  - Màu xanh lá: đã liên kết + socket mở gần đây.
  - Màu cam: đang kết nối/lặp lại.
  - Màu đỏ: đã đăng xuất hoặc kiểm tra thất bại.
- Dòng phụ hiển thị "đã liên kết · xác thực 12m" hoặc lý do thất bại.
- Mục menu "Chạy kiểm tra sức khỏe" kích hoạt kiểm tra theo yêu cầu.

## Cài đặt

- Tab Chung có thêm thẻ Sức khỏe hiển thị: tuổi xác thực liên kết, đường dẫn/số lượng lưu trữ phiên, thời gian kiểm tra cuối, mã lỗi/trạng thái cuối, và nút Chạy kiểm tra sức khỏe / Hiển thị nhật ký.
- Sử dụng ảnh chụp nhanh được lưu trữ để giao diện tải ngay lập tức và hoạt động tốt khi offline.
- **Tab Kênh** hiển thị trạng thái kênh + điều khiển cho WhatsApp/Telegram (mã QR đăng nhập, đăng xuất, kiểm tra, ngắt kết nối/lỗi cuối).

## Cách hoạt động của kiểm tra

- Ứng dụng chạy `openclaw health --json` qua `ShellExecutor` mỗi ~60 giây và theo yêu cầu. Kiểm tra tải thông tin xác thực và báo cáo trạng thái mà không gửi tin nhắn.
- Lưu trữ riêng ảnh chụp nhanh tốt nhất và lỗi cuối để tránh nhấp nháy; hiển thị dấu thời gian của từng cái.

## Khi không chắc chắn

- Bạn vẫn có thể sử dụng luồng CLI trong [Sức khỏe Gateway](/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) và theo dõi `/tmp/openclaw/openclaw-*.log` cho `web-heartbeat` / `web-reconnect`.
