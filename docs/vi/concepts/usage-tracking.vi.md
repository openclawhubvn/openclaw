---
summary: "Theo dõi sử dụng và yêu cầu thông tin xác thực"
read_when:
  - Đang tích hợp bề mặt sử dụng/hạn mức của provider
  - Cần giải thích hành vi theo dõi sử dụng hoặc yêu cầu xác thực
title: "Theo dõi sử dụng"
---

# Theo dõi sử dụng

## Khái niệm

- Lấy thông tin sử dụng/hạn mức từ endpoint của provider.
- Không có chi phí ước tính; chỉ có cửa sổ báo cáo từ provider.

## Hiển thị ở đâu

- `/status` trong chat: thẻ trạng thái với emoji, session token + chi phí ước tính (chỉ API key). Hiển thị sử dụng của provider hiện tại nếu có.
- `/usage off|tokens|full` trong chat: footer sử dụng cho từng phản hồi (OAuth chỉ hiển thị token).
- `/usage cost` trong chat: tóm tắt chi phí local từ log session OpenClaw.
- CLI: `openclaw status --usage` in chi tiết sử dụng từng provider.
- CLI: `openclaw channels list` in snapshot sử dụng cùng cấu hình provider (dùng `--no-usage` để bỏ qua).
- Thanh menu macOS: mục “Usage” dưới Context (nếu có).

## Provider + thông tin xác thực

- **Anthropic (Claude)**: OAuth token trong hồ sơ xác thực.
- **GitHub Copilot**: OAuth token trong hồ sơ xác thực.
- **Gemini CLI**: OAuth token trong hồ sơ xác thực.
- **Antigravity**: OAuth token trong hồ sơ xác thực.
- **OpenAI Codex**: OAuth token trong hồ sơ xác thực (dùng accountId nếu có).
- **MiniMax**: API key (coding plan key; `MINIMAX_CODE_PLAN_KEY` hoặc `MINIMAX_API_KEY`); dùng cửa sổ 5 giờ của coding plan.
- **z.ai**: API key qua env/config/auth store.

Ẩn thông tin sử dụng nếu không có OAuth/API credentials phù hợp.\n