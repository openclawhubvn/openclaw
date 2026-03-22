---
summary: "Tham khảo CLI cho `openclaw doctor` (kiểm tra sức khỏe + sửa lỗi hướng dẫn)"
read_when:
  - Gặp vấn đề kết nối/xác thực và cần hướng dẫn sửa lỗi
  - Vừa cập nhật và muốn kiểm tra nhanh
title: "doctor"
---

# `openclaw doctor`

Kiểm tra sức khỏe + sửa lỗi nhanh cho gateway và channels.

Liên quan:

- Khắc phục sự cố: [Troubleshooting](/gateway/troubleshooting)
- Kiểm tra bảo mật: [Security](/gateway/security)

## Ví dụ

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
```

Lưu ý:

- Các prompt tương tác (như sửa keychain/OAuth) chỉ chạy khi stdin là TTY và không có `--non-interactive`. Chạy không đầu (cron, Telegram, không terminal) sẽ bỏ qua prompt.
- `--fix` (alias của `--repair`) tạo backup tại `~/.openclaw/openclaw.json.bak` và loại bỏ các key cấu hình không xác định, liệt kê từng key bị loại.
- Kiểm tra tính toàn vẹn trạng thái giờ phát hiện file transcript mồ côi trong thư mục sessions và có thể lưu trữ chúng dưới dạng `.deleted.<timestamp>` để giải phóng dung lượng an toàn.
- Doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các cron job cũ và có thể viết lại chúng trước khi scheduler tự động chuẩn hóa khi chạy.
- Doctor bao gồm kiểm tra sẵn sàng tìm kiếm bộ nhớ và có thể đề xuất `openclaw configure --section model` khi thiếu thông tin nhúng.
- Nếu chế độ sandbox bật nhưng Docker không có sẵn, doctor báo cáo cảnh báo mạnh với cách khắc phục (`cài Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu `gateway.auth.token`/`gateway.auth.password` được SecretRef quản lý và không có sẵn trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực dự phòng dạng văn bản.
- Nếu kiểm tra SecretRef của channel thất bại trong đường sửa lỗi, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Tự động giải quyết username `allowFrom` của Telegram (`doctor --fix`) yêu cầu token Telegram có thể giải quyết trong đường dẫn lệnh hiện tại. Nếu không thể kiểm tra token, doctor báo cáo cảnh báo và bỏ qua tự động giải quyết cho lần đó.

## macOS: ghi đè env `launchctl`

Nếu đã chạy `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (hoặc `...PASSWORD`), giá trị đó ghi đè file cấu hình và có thể gây lỗi “unauthorized” liên tục.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```\n