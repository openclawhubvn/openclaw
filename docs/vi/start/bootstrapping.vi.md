---
summary: "Quy trình bootstrapping cho agent, tạo workspace và file định danh"
read_when:
  - Hiểu quá trình diễn ra khi agent chạy lần đầu
  - Giải thích vị trí lưu file bootstrapping
  - Debug thiết lập định danh khi onboarding
title: "Agent Bootstrapping"
sidebarTitle: "Bootstrapping"
---

# Agent Bootstrapping

Bootstrapping là quy trình **chạy lần đầu** để chuẩn bị workspace cho agent và thu thập thông tin định danh. Diễn ra sau khi onboarding, khi agent khởi động lần đầu.

## Bootstrapping làm gì

Khi agent chạy lần đầu, OpenClaw bootstraps workspace (mặc định `~/.openclaw/workspace`):

- Tạo `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Thực hiện một chuỗi câu hỏi ngắn (từng câu một).
- Ghi thông tin định danh + tùy chọn vào `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Xóa `BOOTSTRAP.md` khi hoàn tất để chỉ chạy một lần.

## Chạy ở đâu

Bootstrapping luôn chạy trên **gateway host**. Nếu app macOS kết nối đến Gateway từ xa, workspace và file bootstrapping sẽ nằm trên máy đó.

<Note>
Khi Gateway chạy trên máy khác, chỉnh sửa file workspace trên gateway host (ví dụ, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Tài liệu liên quan

- Onboarding app macOS: [Onboarding](/start/onboarding)
- Cấu trúc workspace: [Agent workspace](/concepts/agent-workspace)\n