---
summary: "Tìm hiểu cách duy trì và cấu hình quyền truy cập trên macOS, bao gồm yêu cầu ký ứng dụng để đảm bảo an toàn và bảo mật."
read_when:
  - Khắc phục lỗi khi quyền truy cập trên macOS bị thiếu hoặc không hiển thị
  - Đóng gói hoặc ký ứng dụng macOS
  - Thay đổi bundle ID hoặc đường dẫn cài đặt ứng dụng
title: "Hướng Dẫn Cấu Hình Quyền Truy Cập macOS"
---

# Quyền truy cập trên macOS (TCC)

Quyền truy cập trên macOS khá nhạy cảm. TCC liên kết quyền truy cập với chữ ký mã của ứng dụng, định danh bundle và đường dẫn trên ổ đĩa. Nếu bất kỳ yếu tố nào thay đổi, macOS sẽ coi ứng dụng như mới và có thể bỏ qua hoặc ẩn các thông báo yêu cầu quyền.

## Yêu cầu để duy trì quyền truy cập ổn định

- Đường dẫn cố định: chạy ứng dụng từ một vị trí cố định (với OpenClaw, là `dist/OpenClaw.app`).
- Định danh bundle không đổi: thay đổi bundle ID sẽ tạo ra một định danh quyền truy cập mới.
- Ứng dụng đã ký: các bản build không ký hoặc ký tạm thời sẽ không duy trì quyền truy cập.
- Chữ ký nhất quán: sử dụng chứng chỉ Apple Development hoặc Developer ID thực để chữ ký ổn định qua các lần build lại.

Chữ ký tạm thời tạo ra một định danh mới mỗi lần build. macOS sẽ quên các quyền đã cấp trước đó và các thông báo yêu cầu có thể biến mất hoàn toàn cho đến khi các mục cũ được xóa.

## Danh sách kiểm tra khi thông báo yêu cầu biến mất

1. Thoát ứng dụng.
2. Xóa mục ứng dụng trong Cài đặt Hệ thống -> Quyền riêng tư & Bảo mật.
3. Khởi động lại ứng dụng từ cùng một đường dẫn và cấp lại quyền.
4. Nếu thông báo vẫn không xuất hiện, đặt lại các mục TCC bằng `tccutil` và thử lại.
5. Một số quyền chỉ xuất hiện lại sau khi khởi động lại macOS hoàn toàn.

Ví dụ đặt lại (thay thế bundle ID nếu cần):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Quyền truy cập tệp và thư mục (Desktop/Documents/Downloads)

macOS cũng có thể giới hạn quyền truy cập Desktop, Documents và Downloads cho các tiến trình nền hoặc terminal. Nếu việc đọc tệp hoặc liệt kê thư mục bị treo, hãy cấp quyền truy cập cho cùng ngữ cảnh tiến trình thực hiện thao tác tệp (ví dụ Terminal/iTerm, ứng dụng khởi chạy bởi LaunchAgent, hoặc tiến trình SSH).

Giải pháp: di chuyển tệp vào không gian làm việc của OpenClaw (`~/.openclaw/workspace`) nếu muốn tránh cấp quyền theo từng thư mục.

Nếu bạn đang kiểm tra quyền truy cập, luôn ký bằng chứng chỉ thực. Các bản build tạm thời chỉ chấp nhận cho các lần chạy nhanh tại chỗ mà không cần quan tâm đến quyền truy cập.
