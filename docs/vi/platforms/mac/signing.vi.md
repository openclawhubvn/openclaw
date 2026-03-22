---
summary: "Hướng dẫn ký debug build macOS tạo từ script đóng gói"
read_when:
  - Xây dựng hoặc ký debug build macOS
title: "Ký macOS"
---

# Ký macOS (debug builds)

Ứng dụng này thường được build từ [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), script này:

- Đặt bundle identifier ổn định cho debug: `ai.openclaw.mac.debug`
- Ghi Info.plist với bundle id đó (có thể override qua `BUNDLE_ID=...`)
- Gọi [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) để ký binary chính và app bundle, giúp macOS nhận diện mỗi lần rebuild là cùng một bundle đã ký và giữ quyền TCC (thông báo, accessibility, ghi màn hình, mic, speech). Để quyền ổn định, dùng real signing identity; ad-hoc là tùy chọn và không ổn định (xem [macOS permissions](/platforms/mac/permissions)).
- Mặc định dùng `CODESIGN_TIMESTAMP=auto`; kích hoạt trusted timestamps cho Developer ID signatures. Đặt `CODESIGN_TIMESTAMP=off` để bỏ qua timestamping (offline debug builds).
- Chèn metadata build vào Info.plist: `OpenClawBuildTimestamp` (UTC) và `OpenClawGitCommit` (short hash) để About pane hiển thị build, git, và kênh debug/release.
- **Mặc định dùng Node 24**: script chạy TS builds và Control UI build. Node 22 LTS, hiện tại `22.16+`, vẫn được hỗ trợ để tương thích.
- Đọc `SIGN_IDENTITY` từ môi trường. Thêm `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (hoặc Developer ID Application cert của bạn) vào shell rc để luôn ký với cert của bạn. Ký ad-hoc yêu cầu opt-in rõ ràng qua `ALLOW_ADHOC_SIGNING=1` hoặc `SIGN_IDENTITY="-"` (không khuyến nghị cho kiểm tra quyền).
- Chạy kiểm tra Team ID sau khi ký và báo lỗi nếu bất kỳ Mach-O nào trong app bundle được ký bởi Team ID khác. Đặt `SKIP_TEAM_ID_CHECK=1` để bỏ qua.

## Sử dụng

```bash
# từ repo root
scripts/package-mac-app.sh               # tự động chọn identity; lỗi nếu không tìm thấy
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (quyền sẽ không giữ)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # ad-hoc rõ ràng (cùng lưu ý)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # workaround mismatch Team ID Sparkle chỉ dev
```

### Lưu ý Ký Ad-hoc

Khi ký với `SIGN_IDENTITY="-"` (ad-hoc), script tự động tắt **Hardened Runtime** (`--options runtime`). Điều này cần thiết để tránh crash khi app cố gắng load embedded frameworks (như Sparkle) không cùng Team ID. Chữ ký ad-hoc cũng làm mất quyền TCC; xem [macOS permissions](/platforms/mac/permissions) để biết cách khôi phục.

## Metadata Build cho About

`package-mac-app.sh` đóng dấu bundle với:

- `OpenClawBuildTimestamp`: ISO8601 UTC tại thời điểm đóng gói
- `OpenClawGitCommit`: short git hash (hoặc `unknown` nếu không có)

Tab About đọc các key này để hiển thị version, ngày build, git commit, và có phải debug build không (qua `#if DEBUG`). Chạy packager để làm mới các giá trị này sau khi thay đổi code.

## Tại sao

Quyền TCC gắn với bundle identifier _và_ code signature. Debug build không ký với UUID thay đổi khiến macOS quên quyền sau mỗi lần rebuild. Ký binary (mặc định ad-hoc) và giữ bundle id/path cố định (`dist/OpenClaw.app`) giúp giữ quyền giữa các lần build, giống cách tiếp cận của VibeTunnel.\n