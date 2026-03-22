---
summary: "Quản lý quyền trên macOS (TCC) và yêu cầu ký ứng dụng"
read_when:
  - Debug lỗi quyền trên macOS bị thiếu hoặc không hiện
  - Đóng gói hoặc ký ứng dụng macOS
  - Thay đổi bundle ID hoặc đường dẫn cài đặt ứng dụng
title: "Quyền trên macOS"
---

# Quyền trên macOS (TCC)

Quyền trên macOS khá nhạy cảm. TCC liên kết quyền với chữ ký mã, bundle ID và đường dẫn trên đĩa của ứng dụng. Nếu có thay đổi, macOS coi ứng dụng như mới và có thể bỏ hoặc ẩn thông báo quyền.

## Yêu cầu để quyền ổn định

- Đường dẫn cố định: chạy ứng dụng từ một vị trí cố định (với OpenClaw, `dist/OpenClaw.app`).
- Bundle ID không đổi: thay đổi bundle ID tạo ra một danh tính quyền mới.
- Ứng dụng đã ký: bản build không ký hoặc ký ad-hoc không giữ được quyền.
- Chữ ký nhất quán: dùng chứng chỉ Apple Development hoặc Developer ID thật để chữ ký ổn định qua các lần build lại.

Chữ ký ad-hoc tạo danh tính mới mỗi lần build. macOS sẽ quên quyền trước đó và thông báo có thể biến mất hoàn toàn cho đến khi xóa các mục cũ.

## Checklist khôi phục khi thông báo biến mất

1. Thoát ứng dụng.
2. Xóa mục ứng dụng trong Cài đặt Hệ thống -> Quyền riêng tư & Bảo mật.
3. Chạy lại ứng dụng từ cùng đường dẫn và cấp lại quyền.
4. Nếu thông báo vẫn không xuất hiện, reset mục TCC với `tccutil` và thử lại.
5. Một số quyền chỉ xuất hiện lại sau khi khởi động lại macOS.

Ví dụ reset (thay bundle ID nếu cần):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Quyền truy cập tệp và thư mục (Desktop/Documents/Downloads)

macOS có thể chặn Desktop, Documents và Downloads cho các tiến trình terminal/nền. Nếu đọc tệp hoặc liệt kê thư mục bị treo, cấp quyền cho cùng ngữ cảnh tiến trình thực hiện thao tác tệp (ví dụ Terminal/iTerm, ứng dụng khởi chạy bởi LaunchAgent, hoặc tiến trình SSH).

Cách giải quyết: di chuyển tệp vào workspace của OpenClaw (`~/.openclaw/workspace`) nếu muốn tránh cấp quyền từng thư mục.

Khi test quyền, luôn ký bằng chứng chỉ thật. Bản build ad-hoc chỉ chấp nhận cho chạy local nhanh khi quyền không quan trọng.\n