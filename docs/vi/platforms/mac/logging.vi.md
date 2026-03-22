# Logging (macOS)

## Rolling diagnostics file log (Debug pane)

OpenClaw chuyển log của app macOS qua swift-log (unified logging mặc định) và có thể ghi log file xoay vòng local khi cần lưu trữ lâu dài.

- Verbosity: **Debug pane → Logs → App logging → Verbosity**
- Bật: **Debug pane → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- Vị trí: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (tự động xoay vòng; file cũ có hậu tố `.1`, `.2`, …)
- Xóa: **Debug pane → Logs → App logging → “Clear”**

Lưu ý:

- Mặc định **tắt**. Chỉ bật khi cần debug.
- Xem file này là nhạy cảm; không chia sẻ nếu chưa kiểm tra.

## Unified logging private data trên macOS

Unified logging che giấu hầu hết payload trừ khi subsystem chọn `privacy -off`. Theo bài viết của Peter về [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025), điều này được kiểm soát bởi plist trong `/Library/Preferences/Logging/Subsystems/` với khóa là tên subsystem. Chỉ log mới nhận flag này, nên bật trước khi tái hiện vấn đề.

## Bật cho OpenClaw (`ai.openclaw`)

- Tạo plist tạm, rồi cài đặt như root:

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

- Không cần reboot; logd nhận diện file nhanh chóng, nhưng chỉ log mới có payload riêng tư.
- Xem output chi tiết hơn với helper có sẵn, ví dụ: `./scripts/clawlog.sh --category WebChat --last 5m`.

## Tắt sau khi debug

- Xóa override: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Có thể chạy `sudo log config --reload` để logd bỏ override ngay lập tức.
- Nhớ rằng bề mặt này có thể chứa số điện thoại và nội dung tin nhắn; chỉ giữ plist khi cần chi tiết thêm.\n