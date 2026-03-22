---
summary: "Nghi thức khởi tạo agent để thiết lập workspace và các file định danh"
read_when:
  - Hiểu những gì xảy ra khi agent chạy lần đầu
  - Giải thích vị trí lưu trữ các file khởi tạo
  - Gỡ lỗi thiết lập định danh khi bắt đầu
title: "Khởi tạo Agent"
sidebarTitle: "Khởi tạo"
---

# Khởi tạo Agent

Khởi tạo là nghi thức **chạy lần đầu** để chuẩn bị workspace cho agent và thu thập thông tin định danh. Quá trình này diễn ra sau khi hoàn tất onboarding, khi agent khởi động lần đầu tiên.

## Khởi tạo làm gì

Khi agent chạy lần đầu, OpenClaw sẽ khởi tạo workspace (mặc định là `~/.openclaw/workspace`):

- Tạo các file `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Thực hiện một nghi thức hỏi đáp ngắn (từng câu hỏi một).
- Ghi thông tin định danh và tùy chọn vào `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Xóa `BOOTSTRAP.md` sau khi hoàn tất để chỉ chạy một lần duy nhất.

## Nơi khởi tạo diễn ra

Khởi tạo luôn diễn ra trên **gateway host**. Nếu ứng dụng macOS kết nối với một Gateway từ xa, workspace và các file khởi tạo sẽ nằm trên máy từ xa đó.

<Note>
Khi Gateway chạy trên một máy khác, hãy chỉnh sửa các file workspace trên gateway host (ví dụ: `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Tài liệu liên quan

- Onboarding ứng dụng macOS: [Onboarding](/start/onboarding)
- Bố cục workspace: [Agent workspace](/concepts/agent-workspace)
