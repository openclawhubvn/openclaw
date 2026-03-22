---
summary: "Giao diện cài đặt Skills trên macOS và trạng thái từ gateway"
read_when:
  - Cập nhật giao diện cài đặt Skills trên macOS
  - Thay đổi hành vi cài đặt hoặc kiểm soát skills
title: "Skills (macOS)"
---

# Skills (macOS)

Ứng dụng macOS hiển thị skills của OpenClaw thông qua gateway; không phân tích skills trực tiếp trên máy.

## Nguồn dữ liệu

- `skills.status` (gateway) trả về tất cả skills kèm điều kiện và yêu cầu còn thiếu (bao gồm cả chặn allowlist cho skills đi kèm).
- Yêu cầu được lấy từ `metadata.openclaw.requires` trong mỗi `SKILL.md`.

## Hành động cài đặt

- `metadata.openclaw.install` định nghĩa các tùy chọn cài đặt (brew/node/go/uv).
- Ứng dụng gọi `skills.install` để chạy trình cài đặt trên máy chủ gateway.
- Gateway chỉ hiển thị một trình cài đặt ưu tiên khi có nhiều lựa chọn (ưu tiên brew nếu có, nếu không thì node manager từ `skills.install`, mặc định npm).

## Env/API keys

- Ứng dụng lưu trữ keys trong `~/.openclaw/openclaw.json` dưới `skills.entries.<skillKey>`.
- `skills.update` cập nhật `enabled`, `apiKey`, và `env`.

## Chế độ Remote

- Cài đặt + cập nhật cấu hình diễn ra trên máy chủ gateway (không phải trên Mac local).\n