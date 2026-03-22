---
summary: "Tổng quan về các tùy chọn và luồng onboarding của OpenClaw"
read_when:
  - Chọn đường dẫn onboarding
  - Thiết lập môi trường mới
title: "Tổng quan Onboarding"
sidebarTitle: "Tổng quan Onboarding"
---

# Tổng quan Onboarding

OpenClaw có hai đường dẫn onboarding. Cả hai đều cấu hình auth, Gateway và các kênh tùy chọn — chỉ khác nhau ở cách tương tác với quá trình thiết lập.

## Nên chọn đường dẫn nào?

|                | Onboarding qua CLI                     | Onboarding qua app macOS  |
| -------------- | -------------------------------------- | ------------------------- |
| **Nền tảng**   | macOS, Linux, Windows (native hoặc WSL2) | Chỉ macOS                 |
| **Giao diện**  | Terminal wizard                        | Giao diện hướng dẫn trong app |
| **Phù hợp nhất** | Server, headless, toàn quyền kiểm soát | Desktop Mac, thiết lập trực quan |
| **Tự động hóa** | `--non-interactive` cho script        | Chỉ thủ công              |
| **Lệnh**       | `openclaw onboard`                     | Mở app                    |

Hầu hết người dùng nên bắt đầu với **onboarding qua CLI** — hoạt động mọi nơi và cho phép kiểm soát tối đa.

## Onboarding cấu hình những gì

Dù chọn đường dẫn nào, onboarding sẽ thiết lập:

1. **Model provider và auth** — API key, OAuth, hoặc setup token cho provider đã chọn
2. **Workspace** — thư mục cho file agent, bootstrap template và memory
3. **Gateway** — port, bind address, chế độ auth
4. **Channels** (tùy chọn) — WhatsApp, Telegram, Discord, và nhiều hơn
5. **Daemon** (tùy chọn) — dịch vụ chạy nền để Gateway tự động khởi động

## Onboarding qua CLI

Chạy trong bất kỳ terminal nào:

```bash
openclaw onboard
```

Thêm `--install-daemon` để cài đặt dịch vụ chạy nền trong một bước.

Tham khảo đầy đủ: [Onboarding (CLI)](/start/wizard)
Tài liệu lệnh CLI: [`openclaw onboard`](/cli/onboard)

## Onboarding qua app macOS

Mở app OpenClaw. Wizard lần đầu sẽ hướng dẫn qua các bước với giao diện trực quan.

Tham khảo đầy đủ: [Onboarding (macOS App)](/start/onboarding)

## Provider tùy chỉnh hoặc không có trong danh sách

Nếu provider không có trong onboarding, chọn **Custom Provider** và nhập:

- Chế độ tương thích API (OpenAI-compatible, Anthropic-compatible, hoặc tự động phát hiện)
- Base URL và API key
- Model ID và alias tùy chọn

Nhiều endpoint tùy chỉnh có thể cùng tồn tại — mỗi cái có endpoint ID riêng.\n