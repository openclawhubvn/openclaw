---
summary: "Sử dụng API tương thích OpenAI của NVIDIA trong OpenClaw"
read_when:
  - Muốn dùng mô hình NVIDIA trong OpenClaw
  - Cần thiết lập NVIDIA_API_KEY
title: "NVIDIA"
---

# NVIDIA

NVIDIA cung cấp API tương thích OpenAI tại `https://integrate.api.nvidia.com/v1` cho mô hình Nemotron và NeMo. Xác thực bằng API key từ [NVIDIA NGC](https://catalog.ngc.nvidia.com/).

## Thiết lập CLI

Export key một lần, sau đó chạy onboarding và đặt mô hình NVIDIA:

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

Nếu vẫn dùng `--token`, nhớ rằng nó sẽ xuất hiện trong lịch sử shell và output `ps`; ưu tiên dùng biến môi trường khi có thể.

## Đoạn cấu hình

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/llama-3.1-nemotron-70b-instruct" },
    },
  },
}
```

## Model IDs

- `nvidia/llama-3.1-nemotron-70b-instruct` (mặc định)
- `meta/llama-3.3-70b-instruct`
- `nvidia/mistral-nemo-minitron-8b-8k-instruct`

## Ghi chú

- Endpoint `/v1` tương thích OpenAI; dùng API key từ NVIDIA NGC.
- Provider tự động kích hoạt khi `NVIDIA_API_KEY` được thiết lập; dùng mặc định tĩnh (cửa sổ ngữ cảnh 131,072 token, tối đa 4,096 token).\n