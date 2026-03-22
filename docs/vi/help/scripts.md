---
summary: "Các script trong repository: mục đích, phạm vi và lưu ý an toàn"
read_when:
  - Chạy script từ repo
  - Thêm hoặc thay đổi script trong ./scripts
title: "Scripts"
---

# Scripts

Thư mục `scripts/` chứa các script hỗ trợ cho quy trình làm việc cục bộ và các tác vụ vận hành. Sử dụng các script này khi một tác vụ rõ ràng gắn liền với một script; nếu không, hãy ưu tiên sử dụng CLI.

## Quy ước

- Các script là **tùy chọn** trừ khi được tham chiếu trong tài liệu hoặc danh sách kiểm tra phát hành.
- Ưu tiên sử dụng CLI khi có sẵn (ví dụ: giám sát xác thực sử dụng `openclaw models status --check`).
- Giả định rằng các script là đặc thù cho từng máy; hãy đọc chúng trước khi chạy trên máy mới.

## Script giám sát xác thực

Script giám sát xác thực được tài liệu hóa tại đây:
[/automation/auth-monitoring](/automation/auth-monitoring)

## Khi thêm script

- Giữ cho script tập trung và có tài liệu hướng dẫn.
- Thêm một mục ngắn trong tài liệu liên quan (hoặc tạo mới nếu chưa có).
