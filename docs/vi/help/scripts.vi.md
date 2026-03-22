---
summary: "Scripts trong repo: mục đích, phạm vi và lưu ý an toàn"
read_when:
  - Chạy scripts từ repo
  - Thêm hoặc thay đổi scripts trong ./scripts
title: "Scripts"
---

# Scripts

Thư mục `scripts/` chứa các script hỗ trợ cho workflow local và các tác vụ ops. Dùng khi task gắn rõ ràng với script; nếu không, ưu tiên dùng CLI.

## Quy ước

- Scripts là **tùy chọn** trừ khi được nhắc đến trong tài liệu hoặc checklist phát hành.
- Ưu tiên dùng CLI khi có sẵn (ví dụ: auth monitoring dùng `openclaw models status --check`).
- Giả định scripts là host‑specific; đọc kỹ trước khi chạy trên máy mới.

## Scripts giám sát Auth

Scripts giám sát Auth được tài liệu hóa tại:
[/automation/auth-monitoring](/automation/auth-monitoring)

## Khi thêm scripts

- Giữ script tập trung và có tài liệu.
- Thêm một mục ngắn trong tài liệu liên quan (hoặc tạo mới nếu chưa có).\n