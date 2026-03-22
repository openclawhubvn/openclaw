---
title: "LiteLLM"
summary: "Chạy OpenClaw qua LiteLLM Proxy để quản lý truy cập model và theo dõi chi phí"
read_when:
  - Muốn định tuyến OpenClaw qua LiteLLM proxy
  - Cần theo dõi chi phí, logging, hoặc định tuyến model qua LiteLLM
---

# LiteLLM

[LiteLLM](https://litellm.ai) là một LLM gateway mã nguồn mở, cung cấp API thống nhất cho hơn 100 nhà cung cấp model. Định tuyến OpenClaw qua LiteLLM để theo dõi chi phí tập trung, logging và linh hoạt chuyển đổi backend mà không cần thay đổi cấu hình OpenClaw.

## Tại sao dùng LiteLLM với OpenClaw?

- **Theo dõi chi phí** — Xem chi tiết chi phí OpenClaw trên tất cả các model
- **Định tuyến model** — Chuyển đổi giữa Claude, GPT-4, Gemini, Bedrock mà không cần thay đổi cấu hình
- **Khóa ảo** — Tạo khóa với giới hạn chi tiêu cho OpenClaw
- **Logging** — Ghi log đầy đủ request/response để debug
- **Fallbacks** — Tự động chuyển đổi nếu nhà cung cấp chính bị lỗi

## Bắt đầu nhanh

### Qua onboarding

```bash
openclaw onboard --auth-choice litellm-api-key
```

### Cài đặt thủ công

1. Khởi động LiteLLM Proxy:

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. Trỏ OpenClaw tới LiteLLM:

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

Xong. OpenClaw giờ định tuyến qua LiteLLM.

## Cấu hình

### Biến môi trường

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### File cấu hình

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Khóa ảo

Tạo khóa riêng cho OpenClaw với giới hạn chi tiêu:

```bash
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "openclaw",
    "max_budget": 50.00,
    "budget_duration": "monthly"
  }'
```

Dùng khóa tạo ra làm `LITELLM_API_KEY`.

## Định tuyến model

LiteLLM có thể định tuyến request model tới các backend khác nhau. Cấu hình trong `config.yaml` của LiteLLM:

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

OpenClaw vẫn yêu cầu `claude-opus-4-6` — LiteLLM xử lý định tuyến.

## Xem sử dụng

Kiểm tra dashboard hoặc API của LiteLLM:

```bash
# Thông tin khóa
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# Log chi tiêu
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## Ghi chú

- LiteLLM chạy mặc định trên `http://localhost:4000`
- OpenClaw kết nối qua endpoint `/v1/chat/completions` tương thích OpenAI
- Tất cả tính năng của OpenClaw hoạt động qua LiteLLM — không giới hạn

## Xem thêm

- [LiteLLM Docs](https://docs.litellm.ai)
- [Model Providers](/concepts/model-providers)\n