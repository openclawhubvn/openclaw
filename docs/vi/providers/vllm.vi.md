---
summary: "Chạy OpenClaw với vLLM (server local tương thích OpenAI)"
read_when:
  - Muốn chạy OpenClaw với server vLLM local
  - Cần endpoint /v1 tương thích OpenAI với model tự chọn
title: "vLLM"
---

# vLLM

vLLM có thể phục vụ các model mã nguồn mở (và một số model tùy chỉnh) qua API HTTP tương thích OpenAI. OpenClaw kết nối với vLLM qua API `openai-completions`.

OpenClaw cũng có thể **tự động phát hiện** model từ vLLM khi bật `VLLM_API_KEY` (giá trị nào cũng được nếu server không yêu cầu auth) và không định nghĩa `models.providers.vllm`.

## Bắt đầu nhanh

1. Khởi động vLLM với server tương thích OpenAI.

Base URL cần expose endpoint `/v1` (ví dụ: `/v1/models`, `/v1/chat/completions`). vLLM thường chạy trên:

- `http://127.0.0.1:8000/v1`

2. Bật tùy chọn (giá trị nào cũng được nếu không cấu hình auth):

```bash
export VLLM_API_KEY="vllm-local"
```

3. Chọn model (thay bằng ID model vLLM của bạn):

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

## Phát hiện model (provider ngầm định)

Khi `VLLM_API_KEY` được thiết lập (hoặc có profile auth) và **không** định nghĩa `models.providers.vllm`, OpenClaw sẽ truy vấn:

- `GET http://127.0.0.1:8000/v1/models`

…và chuyển ID trả về thành entry model.

Nếu định nghĩa `models.providers.vllm` rõ ràng, tự động phát hiện bị bỏ qua và cần định nghĩa model thủ công.

## Cấu hình rõ ràng (model thủ công)

Dùng cấu hình rõ ràng khi:

- vLLM chạy trên host/port khác.
- Muốn cố định giá trị `contextWindow`/`maxTokens`.
- Server yêu cầu API key thực (hoặc muốn kiểm soát header).

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Khắc phục sự cố

- Kiểm tra server có thể truy cập:

```bash
curl http://127.0.0.1:8000/v1/models
```

- Nếu yêu cầu thất bại do lỗi auth, thiết lập `VLLM_API_KEY` thực khớp với cấu hình server, hoặc cấu hình provider rõ ràng dưới `models.providers.vllm`.\n