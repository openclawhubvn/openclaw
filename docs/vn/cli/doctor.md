---
summary: "Tham khảo CLI cho `openclaw doctor` (kiểm tra sức khỏe + sửa chữa hướng dẫn)"
read_when:
  - Gặp vấn đề kết nối/xác thực và cần hướng dẫn sửa chữa
  - Đã cập nhật và muốn kiểm tra tính ổn định
title: "doctor"
---

# `openclaw doctor`

Kiểm tra sức khỏe + sửa chữa nhanh cho gateway và các kênh.

Liên quan:

- Khắc phục sự cố: [Troubleshooting](/gateway/troubleshooting)
- Kiểm tra bảo mật: [Security](/gateway/security)

## Ví dụ

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
```

Ghi chú:

- Các nhắc nhở tương tác (như sửa lỗi keychain/OAuth) chỉ chạy khi stdin là TTY và `--non-interactive` **không** được đặt. Các lần chạy không có giao diện (cron, Telegram, không có terminal) sẽ bỏ qua các nhắc nhở.
- `--fix` (tên khác của `--repair`) tạo một bản sao lưu tại `~/.openclaw/openclaw.json.bak` và loại bỏ các khóa cấu hình không xác định, liệt kê từng mục bị loại bỏ.
- Kiểm tra tính toàn vẹn trạng thái hiện tại phát hiện các tệp bản ghi mồ côi trong thư mục phiên và có thể lưu trữ chúng dưới dạng `.deleted.<timestamp>` để giải phóng không gian an toàn.
- Doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng công việc cron cũ và có thể viết lại chúng tại chỗ trước khi bộ lập lịch phải tự động chuẩn hóa chúng khi chạy.
- Doctor bao gồm kiểm tra sẵn sàng tìm kiếm bộ nhớ và có thể đề xuất `openclaw configure --section model` khi thiếu thông tin xác thực nhúng.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo cảnh báo quan trọng với cách khắc phục (`cài đặt Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu `gateway.auth.token`/`gateway.auth.password` được quản lý bởi SecretRef và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực dự phòng dưới dạng văn bản thuần.
- Nếu kiểm tra SecretRef của kênh thất bại trong đường sửa chữa, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Tự động giải quyết tên người dùng Telegram `allowFrom` (`doctor --fix`) yêu cầu một token Telegram có thể giải quyết trong đường dẫn lệnh hiện tại. Nếu kiểm tra token không khả dụng, doctor báo cáo cảnh báo và bỏ qua tự động giải quyết cho lần đó.

## macOS: ghi đè môi trường `launchctl`

Nếu trước đây đã chạy `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (hoặc `...PASSWORD`), giá trị đó sẽ ghi đè tệp cấu hình và có thể gây ra lỗi “không được ủy quyền” liên tục.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
