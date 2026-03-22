---
summary: "Theo dõi sử dụng và yêu cầu thông tin xác thực"
read_when:
  - Bạn đang kết nối các bề mặt sử dụng/hạn mức của nhà cung cấp
  - Bạn cần giải thích hành vi theo dõi sử dụng hoặc yêu cầu xác thực
title: "Theo dõi sử dụng"
---

# Theo dõi sử dụng

## Định nghĩa

- Lấy thông tin sử dụng/hạn mức từ các điểm cuối sử dụng của nhà cung cấp.
- Không có chi phí ước tính; chỉ có các khoảng thời gian do nhà cung cấp báo cáo.

## Hiển thị ở đâu

- `/status` trong các cuộc trò chuyện: thẻ trạng thái phong phú với emoji, bao gồm token phiên và chi phí ước tính (chỉ với API key). Hiển thị sử dụng của nhà cung cấp **hiện tại** khi có sẵn.
- `/usage off|tokens|full` trong các cuộc trò chuyện: chân trang sử dụng cho từng phản hồi (OAuth chỉ hiển thị token).
- `/usage cost` trong các cuộc trò chuyện: tóm tắt chi phí cục bộ được tổng hợp từ nhật ký phiên OpenClaw.
- CLI: `openclaw status --usage` in ra phân tích chi tiết theo từng nhà cung cấp.
- CLI: `openclaw channels list` in ra cùng một ảnh chụp sử dụng kèm theo cấu hình nhà cung cấp (sử dụng `--no-usage` để bỏ qua).
- Thanh menu macOS: phần “Usage” dưới Context (chỉ khi có sẵn).

## Nhà cung cấp + thông tin xác thực

- **Anthropic (Claude)**: Token OAuth trong hồ sơ xác thực.
- **GitHub Copilot**: Token OAuth trong hồ sơ xác thực.
- **Gemini CLI**: Token OAuth trong hồ sơ xác thực.
- **Antigravity**: Token OAuth trong hồ sơ xác thực.
- **OpenAI Codex**: Token OAuth trong hồ sơ xác thực (sử dụng accountId khi có).
- **MiniMax**: API key (khóa kế hoạch mã hóa; `MINIMAX_CODE_PLAN_KEY` hoặc `MINIMAX_API_KEY`); sử dụng khoảng thời gian kế hoạch mã hóa 5 giờ.
- **z.ai**: API key thông qua môi trường/cấu hình/kho lưu trữ xác thực.

Thông tin sử dụng sẽ bị ẩn nếu không có thông tin xác thực OAuth/API phù hợp.
