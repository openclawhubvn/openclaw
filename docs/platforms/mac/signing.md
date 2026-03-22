---
summary: "Tìm hiểu cách ký ứng dụng macOS cho bản debug với hướng dẫn chi tiết từng bước, đảm bảo an toàn và tuân thủ quy định của Apple."
read_when:
  - Xây dựng hoặc ký bản debug trên macOS
title: "Hướng Dẫn Ký Ứng Dụng macOS Chi Tiết"
---

# Ký macOS (bản debug)

Ứng dụng này thường được xây dựng từ [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), hiện tại:

- Thiết lập một định danh gói debug ổn định: `ai.openclaw.mac.debug`
- Ghi Info.plist với định danh gói đó (có thể ghi đè qua `BUNDLE_ID=...`)
- Gọi [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) để ký binary chính và gói ứng dụng, giúp macOS nhận diện mỗi lần xây dựng lại là cùng một gói đã ký và giữ quyền TCC (thông báo, truy cập, ghi màn hình, mic, giọng nói). Để quyền ổn định, sử dụng danh tính ký thực; ad-hoc là tùy chọn và không ổn định (xem [quyền macOS](/platforms/mac/permissions)).
- Mặc định sử dụng `CODESIGN_TIMESTAMP=auto`; nó kích hoạt dấu thời gian tin cậy cho chữ ký Developer ID. Đặt `CODESIGN_TIMESTAMP=off` để bỏ qua dấu thời gian (bản debug offline).
- Chèn thông tin xây dựng vào Info.plist: `OpenClawBuildTimestamp` (UTC) và `OpenClawGitCommit` (hash ngắn) để bảng About có thể hiển thị thông tin xây dựng, git, và kênh debug/phát hành.
- **Mặc định đóng gói với Node 24**: script chạy các bản xây dựng TS và Control UI. Node 22 LTS, hiện tại `22.16+`, vẫn được hỗ trợ để tương thích.
- Đọc `SIGN_IDENTITY` từ môi trường. Thêm `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (hoặc chứng chỉ Developer ID Application của bạn) vào shell rc để luôn ký với chứng chỉ của bạn. Ký ad-hoc yêu cầu tùy chọn rõ ràng qua `ALLOW_ADHOC_SIGNING=1` hoặc `SIGN_IDENTITY="-"` (không khuyến nghị để kiểm tra quyền).
- Chạy kiểm tra Team ID sau khi ký và thất bại nếu bất kỳ Mach-O nào trong gói ứng dụng được ký bởi Team ID khác. Đặt `SKIP_TEAM_ID_CHECK=1` để bỏ qua.

## Sử dụng

```bash
# từ thư mục gốc repo
scripts/package-mac-app.sh               # tự động chọn danh tính; lỗi nếu không tìm thấy
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # chứng chỉ thực
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (quyền sẽ không giữ)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # ad-hoc rõ ràng (cùng lưu ý)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # chỉ dành cho dev, khắc phục lỗi không khớp Team ID của Sparkle
```

### Lưu ý về ký ad-hoc

Khi ký với `SIGN_IDENTITY="-"` (ad-hoc), script tự động vô hiệu hóa **Hardened Runtime** (`--options runtime`). Điều này cần thiết để ngăn chặn sự cố khi ứng dụng cố gắng tải các framework nhúng (như Sparkle) không cùng Team ID. Chữ ký ad-hoc cũng làm mất quyền TCC; xem [quyền macOS](/platforms/mac/permissions) để biết cách khôi phục.

## Thông tin xây dựng cho About

`package-mac-app.sh` đóng dấu gói với:

- `OpenClawBuildTimestamp`: ISO8601 UTC tại thời điểm đóng gói
- `OpenClawGitCommit`: hash git ngắn (hoặc `unknown` nếu không có)

Tab About đọc các khóa này để hiển thị phiên bản, ngày xây dựng, commit git, và liệu đó có phải là bản debug (qua `#if DEBUG`). Chạy packager để làm mới các giá trị này sau khi thay đổi mã.

## Tại sao

Quyền TCC gắn liền với định danh gói _và_ chữ ký mã. Các bản debug không ký với UUID thay đổi khiến macOS quên quyền sau mỗi lần xây dựng lại. Ký các binary (mặc định là ad-hoc) và giữ cố định định danh gói/đường dẫn (`dist/OpenClaw.app`) giúp bảo toàn quyền giữa các lần xây dựng, giống như cách tiếp cận của VibeTunnel.
