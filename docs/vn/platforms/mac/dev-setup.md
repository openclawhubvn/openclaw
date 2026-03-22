---
summary: "Hướng dẫn thiết lập cho các nhà phát triển làm việc trên ứng dụng OpenClaw macOS"
read_when:
  - Thiết lập môi trường phát triển macOS
title: "Thiết lập Dev trên macOS"
---

# Thiết lập Dev trên macOS

Hướng dẫn này bao gồm các bước cần thiết để xây dựng và chạy ứng dụng OpenClaw macOS từ mã nguồn.

## Yêu cầu trước

Trước khi xây dựng ứng dụng, hãy đảm bảo bạn đã cài đặt các phần mềm sau:

1. **Xcode 26.2+**: Cần thiết cho phát triển Swift.
2. **Node.js 24 & pnpm**: Được khuyến nghị cho gateway, CLI và các script đóng gói. Node 22 LTS, hiện tại là `22.16+`, vẫn được hỗ trợ để tương thích.

## 1. Cài đặt các phụ thuộc

Cài đặt các phụ thuộc cho toàn bộ dự án:

```bash
pnpm install
```

## 2. Xây dựng và Đóng gói Ứng dụng

Để xây dựng ứng dụng macOS và đóng gói nó vào `dist/OpenClaw.app`, chạy lệnh sau:

```bash
./scripts/package-mac-app.sh
```

Nếu bạn không có chứng chỉ Apple Developer ID, script sẽ tự động sử dụng **ký ad-hoc** (`-`).

Để biết thêm về chế độ chạy dev, cờ ký và xử lý sự cố Team ID, xem README của ứng dụng macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Lưu ý**: Các ứng dụng ký ad-hoc có thể kích hoạt các cảnh báo bảo mật. Nếu ứng dụng bị crash ngay lập tức với thông báo "Abort trap 6", xem phần [Xử lý sự cố](#troubleshooting).

## 3. Cài đặt CLI

Ứng dụng macOS yêu cầu cài đặt `openclaw` CLI toàn cầu để quản lý các tác vụ nền.

**Để cài đặt (khuyến nghị):**

1. Mở ứng dụng OpenClaw.
2. Đi tới tab cài đặt **General**.
3. Nhấp vào **"Install CLI"**.

Hoặc, cài đặt thủ công:

```bash
npm install -g openclaw@<version>
```

## Xử lý sự cố

### Xây dựng Thất bại: Không khớp Toolchain hoặc SDK

Xây dựng ứng dụng macOS yêu cầu SDK macOS mới nhất và toolchain Swift 6.2.

**Phụ thuộc hệ thống (bắt buộc):**

- **Phiên bản macOS mới nhất có sẵn trong Software Update** (yêu cầu bởi SDKs của Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Kiểm tra:**

```bash
xcodebuild -version
xcrun swift --version
```

Nếu phiên bản không khớp, cập nhật macOS/Xcode và chạy lại quá trình xây dựng.

### Ứng dụng Bị Crash khi Cấp Quyền

Nếu ứng dụng bị crash khi bạn cố gắng cho phép truy cập **Speech Recognition** hoặc **Microphone**, có thể do cache TCC bị hỏng hoặc không khớp chữ ký.

**Khắc phục:**

1. Đặt lại quyền TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Nếu không thành công, thay đổi tạm thời `BUNDLE_ID` trong [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) để buộc macOS tạo "trạng thái sạch".

### Gateway "Starting..." mãi mãi

Nếu trạng thái gateway vẫn ở "Starting...", kiểm tra xem có tiến trình zombie nào đang chiếm cổng không:

```bash
openclaw gateway status
openclaw gateway stop

# Nếu bạn không sử dụng LaunchAgent (chế độ dev / chạy thủ công), tìm listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Nếu một lần chạy thủ công đang chiếm cổng, dừng tiến trình đó (Ctrl+C). Như là phương án cuối cùng, hãy giết PID bạn đã tìm thấy ở trên.
