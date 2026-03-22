---
summary: "Hướng dẫn setup cho dev làm việc với app OpenClaw trên macOS"
read_when:
  - Cài đặt môi trường phát triển macOS
title: "Setup Dev macOS"
---

# Setup Dev macOS

Hướng dẫn này bao gồm các bước cần thiết để build và chạy ứng dụng OpenClaw trên macOS từ source.

## Yêu cầu

Trước khi build app, cần đảm bảo đã cài đặt:

1. **Xcode 26.2+**: Cần cho phát triển Swift.
2. **Node.js 24 & pnpm**: Khuyến nghị cho gateway, CLI, và script đóng gói. Node 22 LTS, hiện tại `22.16+`, vẫn được hỗ trợ để tương thích.

## 1. Cài đặt Dependencies

Cài đặt các dependencies cho toàn dự án:

```bash
pnpm install
```

## 2. Build và Đóng gói App

Để build app macOS và đóng gói vào `dist/OpenClaw.app`, chạy:

```bash
./scripts/package-mac-app.sh
```

Nếu không có chứng chỉ Apple Developer ID, script sẽ tự động dùng **ad-hoc signing** (`-`).

Để biết thêm về chế độ chạy dev, cờ ký, và xử lý lỗi Team ID, xem README của app macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Lưu ý**: App ký ad-hoc có thể kích hoạt cảnh báo bảo mật. Nếu app crash ngay với "Abort trap 6", xem phần [Xử lý sự cố](#troubleshooting).

## 3. Cài đặt CLI

App macOS yêu cầu cài đặt `openclaw` CLI toàn cục để quản lý các tác vụ nền.

**Để cài đặt (khuyến nghị):**

1. Mở app OpenClaw.
2. Vào tab cài đặt **General**.
3. Click **"Install CLI"**.

Hoặc, cài đặt thủ công:

```bash
npm install -g openclaw@<version>
```

## Xử lý sự cố

### Build Thất bại: Không khớp Toolchain hoặc SDK

Build app macOS yêu cầu SDK macOS mới nhất và toolchain Swift 6.2.

**Dependencies hệ thống (bắt buộc):**

- **Phiên bản macOS mới nhất có trong Software Update** (cần cho SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Kiểm tra:**

```bash
xcodebuild -version
xcrun swift --version
```

Nếu phiên bản không khớp, cập nhật macOS/Xcode và chạy lại build.

### App Crash khi Cấp Quyền

Nếu app crash khi cố cấp quyền **Speech Recognition** hoặc **Microphone**, có thể do cache TCC bị hỏng hoặc không khớp chữ ký.

**Khắc phục:**

1. Reset quyền TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Nếu không được, tạm thời đổi `BUNDLE_ID` trong [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) để macOS "làm mới".

### Gateway "Starting..." mãi

Nếu trạng thái gateway cứ "Starting...", kiểm tra xem có process zombie nào giữ cổng không:

```bash
openclaw gateway status
openclaw gateway stop

# Nếu không dùng LaunchAgent (chế độ dev / chạy thủ công), tìm listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Nếu chạy thủ công đang giữ cổng, dừng process đó (Ctrl+C). Cuối cùng, kill PID tìm thấy ở trên nếu cần.\n