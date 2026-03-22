---
summary: "Tìm hiểu cách cấu hình logging trên hệ điều hành Mac để theo dõi và phân tích hoạt động hệ thống hiệu quả."
read_when:
  - Khi thu thập log trên macOS hoặc kiểm tra việc ghi log có chứa dữ liệu riêng tư
  - Khi debug các vấn đề liên quan đến voice wake hoặc vòng đời session
title: "Hướng Dẫn Cấu Hình Logging Trên Mac"
---

# Ghi nhật ký (macOS)

## Ghi nhật ký tệp chẩn đoán xoay vòng (Debug pane)

OpenClaw chuyển hướng nhật ký ứng dụng macOS qua swift-log (mặc định là unified logging) và có thể ghi một tệp nhật ký xoay vòng cục bộ vào ổ đĩa khi cần lưu trữ lâu dài.

- Mức độ chi tiết: **Debug pane → Logs → App logging → Verbosity**
- Kích hoạt: **Debug pane → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- Vị trí: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (tự động xoay vòng; các tệp cũ có hậu tố `.1`, `.2`, …)
- Xóa: **Debug pane → Logs → App logging → “Clear”**

Lưu ý:

- Tính năng này **tắt theo mặc định**. Chỉ kích hoạt khi đang gỡ lỗi.
- Xem tệp này là nhạy cảm; không chia sẻ mà không kiểm tra trước.

## Ghi nhật ký dữ liệu riêng tư trên macOS

Ghi nhật ký hợp nhất sẽ ẩn hầu hết các payload trừ khi một subsystem chọn `privacy -off`. Theo bài viết của Peter về [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025), điều này được kiểm soát bởi một plist trong `/Library/Preferences/Logging/Subsystems/` với khóa là tên subsystem. Chỉ các mục nhật ký mới sẽ nhận cờ này, vì vậy hãy kích hoạt trước khi tái hiện vấn đề.

## Kích hoạt cho OpenClaw (`ai.openclaw`)

- Viết plist vào một tệp tạm thời trước, sau đó cài đặt nó một cách nguyên tử với quyền root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- Không cần khởi động lại; logd sẽ nhận diện tệp nhanh chóng, nhưng chỉ các dòng nhật ký mới sẽ bao gồm payload riêng tư.
- Xem đầu ra chi tiết hơn với công cụ hỗ trợ hiện có, ví dụ: `./scripts/clawlog.sh --category WebChat --last 5m`.

## Tắt sau khi gỡ lỗi

- Xóa ghi đè: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Tùy chọn chạy `sudo log config --reload` để buộc logd bỏ ghi đè ngay lập tức.
- Nhớ rằng bề mặt này có thể bao gồm số điện thoại và nội dung tin nhắn; chỉ giữ plist khi thực sự cần chi tiết bổ sung.
