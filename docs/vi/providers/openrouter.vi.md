---
summary: "Sử dụng API thống nhất của OpenRouter để truy cập nhiều model trong OpenClaw"
read_when:
  - Cần một API key cho nhiều LLM
  - Muốn chạy model qua OpenRouter trong OpenClaw
title: "OpenRouter"
---

# OpenRouter

OpenRouter cung cấp **API thống nhất** để định tuyến request đến nhiều model qua một endpoint và API key duy nhất. Tương thích với OpenAI, nên hầu hết SDK của OpenAI hoạt động chỉ cần đổi base URL.

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

- Model refs có dạng `openrouter/<provider>/<model>`.
- Xem thêm tùy chọn model/provider tại [/concepts/model-providers](/concepts/model-providers).
- OpenRouter dùng Bearer token với API key.\n