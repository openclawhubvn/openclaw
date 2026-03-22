---
summary: "Tìm hiểu cách sử dụng API NVIDIA tương thích OpenAI trong OpenClaw để tối ưu hóa hiệu suất và tích hợp dễ dàng."
read_when:
  - Bạn muốn sử dụng các mô hình của NVIDIA trong OpenClaw
  - Bạn cần thiết lập NVIDIA_API_KEY
title: "Hướng Dẫn Cấu Hình NVIDIA API OpenAI"
---

# NVIDIA

NVIDIA cung cấp một API tương thích với OpenAI tại `https://integrate.api.nvidia.com/v1` cho các mô hình Nemotron và NeMo. Xác thực bằng API key từ [NVIDIA NGC](https://catalog.ngc.nvidia.com/).

## Thiết lập CLI

Xuất API key một lần, sau đó chạy onboarding và thiết lập mô hình NVIDIA:

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

Nếu vẫn sử dụng `--token`, hãy nhớ rằng nó sẽ xuất hiện trong lịch sử shell và đầu ra `ps`; nên ưu tiên sử dụng biến môi trường khi có thể.

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

## ID Mô hình

- `nvidia/llama-3.1-nemotron-70b-instruct` (mặc định)
- `meta/llama-3.3-70b-instruct`
- `nvidia/mistral-nemo-minitron-8b-8k-instruct`

## Ghi chú

- Endpoint `/v1` tương thích với OpenAI; sử dụng API key từ NVIDIA NGC.
- Nhà cung cấp tự động kích hoạt khi `NVIDIA_API_KEY` được thiết lập; sử dụng các giá trị mặc định tĩnh (cửa sổ ngữ cảnh 131,072 token, tối đa 4,096 token).
