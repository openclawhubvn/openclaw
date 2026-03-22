---
summary: "Tìm hiểu cách sử dụng API Synthetic tương thích Anthropic trong OpenClaw để tối ưu hóa ứng dụng của bạn."
read_when:
  - Bạn muốn sử dụng Synthetic làm nhà cung cấp mô hình
  - Bạn cần thiết lập khóa API hoặc URL cơ sở của Synthetic
title: "Hướng Dẫn Sử Dụng API Synthetic Anthropic"
---

# Synthetic

Synthetic cung cấp các endpoint tương thích với Anthropic. OpenClaw đăng ký nó dưới dạng nhà cung cấp `synthetic` và sử dụng Anthropic Messages API.

## Thiết lập nhanh

1. Đặt `SYNTHETIC_API_KEY` (hoặc chạy trình hướng dẫn bên dưới).
2. Chạy quy trình onboarding:

```bash
openclaw onboard --auth-choice synthetic-api-key
```

Mô hình mặc định được đặt là:

```
synthetic/hf:MiniMaxAI/MiniMax-M2.5
```

## Ví dụ cấu hình

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Lưu ý: Ứng dụng khách Anthropic của OpenClaw thêm `/v1` vào URL cơ sở, vì vậy hãy sử dụng `https://api.synthetic.new/anthropic` (không phải `/anthropic/v1`). Nếu Synthetic thay đổi URL cơ sở, hãy ghi đè `models.providers.synthetic.baseUrl`.

## Danh mục mô hình

Tất cả các mô hình dưới đây đều có chi phí `0` (đầu vào/đầu ra/cache).

| Model ID                                               | Context window | Max tokens | Reasoning | Input        |
| ------------------------------------------------------ | -------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192000         | 65536      | false     | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256000         | 8192       | true      | text         |
| `hf:zai-org/GLM-4.7`                                   | 198000         | 128000     | false     | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128000         | 8192       | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128000         | 8192       | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128000         | 8192       | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128000         | 8192       | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159000         | 8192       | false     | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128000         | 8192       | false     | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524000         | 8192       | false     | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256000         | 8192       | false     | text         |
| `hf:openai/gpt-oss-120b`                               | 128000         | 8192       | false     | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256000         | 8192       | false     | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256000         | 8192       | false     | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250000         | 8192       | false     | text + image |
| `hf:zai-org/GLM-4.5`                                   | 128000         | 128000     | false     | text         |
| `hf:zai-org/GLM-4.6`                                   | 198000         | 128000     | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128000         | 8192       | false     | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256000         | 8192       | true      | text         |

## Ghi chú

- Tham chiếu mô hình sử dụng `synthetic/<modelId>`.
- Nếu bật danh sách cho phép mô hình (`agents.defaults.models`), hãy thêm mọi mô hình dự định sử dụng.
- Xem [Nhà cung cấp mô hình](/concepts/model-providers) để biết quy tắc nhà cung cấp.
