---
summary: "Khám phá cách cài đặt và quản lý Skills trên macOS, tối ưu hóa trải nghiệm người dùng với hỗ trợ từ gateway."
read_when:
  - Cập nhật giao diện cài đặt Skills trên macOS
  - Thay đổi hành vi cài đặt hoặc điều kiện sử dụng skills
title: "Hướng Dẫn Cài Đặt Skills Trên macOS"
---

# Skills (macOS)

Ứng dụng macOS hiển thị các skills của OpenClaw thông qua gateway; không phân tích skills trực tiếp trên máy.

## Nguồn dữ liệu

- `skills.status` (gateway) trả về tất cả các skills cùng với điều kiện sử dụng và yêu cầu còn thiếu
  (bao gồm cả các chặn allowlist cho skills đi kèm).
- Yêu cầu được lấy từ `metadata.openclaw.requires` trong mỗi `SKILL.md`.

## Hành động cài đặt

- `metadata.openclaw.install` xác định các tùy chọn cài đặt (brew/node/go/uv).
- Ứng dụng gọi `skills.install` để chạy các trình cài đặt trên máy chủ gateway.
- Gateway chỉ hiển thị một trình cài đặt ưu tiên khi có nhiều lựa chọn
  (ưu tiên brew nếu có, nếu không thì dùng node manager từ `skills.install`, mặc định là npm).

## Khóa Env/API

- Ứng dụng lưu trữ khóa trong `~/.openclaw/openclaw.json` dưới `skills.entries.<skillKey>`.
- `skills.update` cập nhật `enabled`, `apiKey`, và `env`.

## Chế độ từ xa

- Việc cài đặt và cập nhật cấu hình diễn ra trên máy chủ gateway (không phải trên máy Mac cục bộ).
