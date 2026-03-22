---
summary: "Tổng quan về các tùy chọn và quy trình onboarding của OpenClaw"
read_when:
  - Lựa chọn con đường onboarding
  - Thiết lập môi trường mới
title: "Tổng quan Onboarding"
sidebarTitle: "Tổng quan Onboarding"
---

# Tổng quan Onboarding

OpenClaw có hai con đường onboarding. Cả hai đều cấu hình xác thực, Gateway và các kênh tùy chọn — chỉ khác nhau ở cách bạn tương tác với quá trình thiết lập.

## Nên chọn con đường nào?

|                | Onboarding qua CLI                     | Onboarding qua ứng dụng macOS |
| -------------- | -------------------------------------- | ----------------------------- |
| **Nền tảng**   | macOS, Linux, Windows (native hoặc WSL2) | Chỉ macOS                     |
| **Giao diện**  | Trình hướng dẫn trên Terminal          | Giao diện trực quan trong ứng dụng |
| **Phù hợp nhất cho** | Máy chủ, không màn hình, kiểm soát hoàn toàn | Máy tính để bàn Mac, thiết lập trực quan |
| **Tự động hóa** | `--non-interactive` cho script        | Chỉ thủ công                  |
| **Lệnh**       | `openclaw onboard`                     | Khởi chạy ứng dụng            |

Hầu hết người dùng nên bắt đầu với **onboarding qua CLI** — hoạt động trên mọi nền tảng và cho phép kiểm soát tối đa.

## Onboarding cấu hình những gì

Bất kể bạn chọn con đường nào, onboarding sẽ thiết lập:

1. **Nhà cung cấp mô hình và xác thực** — API key, OAuth, hoặc token thiết lập cho nhà cung cấp bạn chọn
2. **Workspace** — thư mục cho các tệp agent, mẫu bootstrap và bộ nhớ
3. **Gateway** — cổng, địa chỉ bind, chế độ xác thực
4. **Kênh** (tùy chọn) — WhatsApp, Telegram, Discord và nhiều hơn nữa
5. **Daemon** (tùy chọn) — dịch vụ nền để Gateway tự động khởi động

## Onboarding qua CLI

Chạy trong bất kỳ terminal nào:

```bash
openclaw onboard
```

Thêm `--install-daemon` để cài đặt dịch vụ nền trong một bước.

Tham khảo đầy đủ: [Onboarding (CLI)](/start/wizard)
Tài liệu lệnh CLI: [`openclaw onboard`](/cli/onboard)

## Onboarding qua ứng dụng macOS

Mở ứng dụng OpenClaw. Trình hướng dẫn lần đầu sẽ dẫn bạn qua các bước tương tự với giao diện trực quan.

Tham khảo đầy đủ: [Onboarding (macOS App)](/start/onboarding)

## Nhà cung cấp tùy chỉnh hoặc không có trong danh sách

Nếu nhà cung cấp của bạn không có trong danh sách onboarding, chọn **Custom Provider** và nhập:

- Chế độ tương thích API (tương thích OpenAI, tương thích Anthropic, hoặc tự động phát hiện)
- URL cơ bản và API key
- Model ID và alias tùy chọn

Nhiều endpoint tùy chỉnh có thể cùng tồn tại — mỗi cái sẽ có ID endpoint riêng.
