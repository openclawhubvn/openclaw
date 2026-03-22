---
title: "LiteLLM"
summary: "Chạy OpenClaw qua LiteLLM Proxy để truy cập mô hình thống nhất và theo dõi chi phí"
read_when:
  - Bạn muốn định tuyến OpenClaw qua proxy LiteLLM
  - Bạn cần theo dõi chi phí, ghi log, hoặc định tuyến mô hình qua LiteLLM
---

# LiteLLM

[LiteLLM](https://litellm.ai) là một gateway mã nguồn mở cho LLM, cung cấp API thống nhất cho hơn 100 nhà cung cấp mô hình. Định tuyến OpenClaw qua LiteLLM để có thể theo dõi chi phí tập trung, ghi log và linh hoạt chuyển đổi backend mà không cần thay đổi cấu hình OpenClaw.

## Tại sao nên dùng LiteLLM với OpenClaw?

- **Theo dõi chi phí** — Xem chính xác chi phí OpenClaw sử dụng trên tất cả các mô hình
- **Định tuyến mô hình** — Chuyển đổi giữa Claude, GPT-4, Gemini, Bedrock mà không cần thay đổi cấu hình
- **Khóa ảo** — Tạo khóa với giới hạn chi tiêu cho OpenClaw
- **Ghi log** — Ghi lại đầy đủ yêu cầu/phản hồi để debug
- **Dự phòng** — Tự động chuyển đổi nếu nhà cung cấp chính bị gián đoạn

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

2. Trỏ OpenClaw đến LiteLLM:

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

Vậy là xong. OpenClaw giờ đã định tuyến qua LiteLLM.

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

Sử dụng khóa được tạo làm `LITELLM_API_KEY`.

## Định tuyến mô hình

LiteLLM có thể định tuyến yêu cầu mô hình đến các backend khác nhau. Cấu hình trong `config.yaml` của LiteLLM:

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

OpenClaw tiếp tục yêu cầu `claude-opus-4-6` — LiteLLM xử lý định tuyến.

## Xem sử dụng

Kiểm tra dashboard hoặc API của LiteLLM:

```bash
# Thông tin khóa
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# Nhật ký chi tiêu
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## Lưu ý

- LiteLLM chạy mặc định tại `http://localhost:4000`
- OpenClaw kết nối qua endpoint tương thích OpenAI `/v1/chat/completions`
- Tất cả tính năng của OpenClaw hoạt động qua LiteLLM — không có giới hạn

## Xem thêm

- [Tài liệu LiteLLM](https://docs.litellm.ai)
- [Nhà cung cấp mô hình](/concepts/model-providers)
