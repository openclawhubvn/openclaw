---
summary: "Sử dụng API hợp nhất của OpenRouter để truy cập nhiều mô hình trong OpenClaw"
read_when:
  - Bạn muốn một API key duy nhất cho nhiều LLMs
  - Bạn muốn chạy mô hình qua OpenRouter trong OpenClaw
title: "OpenRouter"
---

# OpenRouter

OpenRouter cung cấp một **API hợp nhất** giúp định tuyến yêu cầu đến nhiều mô hình thông qua một endpoint và API key duy nhất. Nó tương thích với OpenAI, vì vậy hầu hết các SDK của OpenAI có thể hoạt động bằng cách thay đổi URL cơ bản.

## Thiết lập CLI

```bash
openclaw onboard --auth-choice apiKey --token-provider openrouter --token "$OPENROUTER_API_KEY"
```

## Đoạn cấu hình

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
    },
  },
}
```

## Ghi chú

- Tham chiếu mô hình là `openrouter/<provider>/<model>`.
- Để biết thêm các tùy chọn mô hình/nhà cung cấp, xem tại [/concepts/model-providers](/concepts/model-providers).
- OpenRouter sử dụng Bearer token với API key của bạn trong nền.
