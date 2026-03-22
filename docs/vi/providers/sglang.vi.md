---
summary: "Chạy OpenClaw với SGLang (server tự host tương thích OpenAI)"
read_when:
  - Muốn chạy OpenClaw với server SGLang local
  - Cần endpoint /v1 tương thích OpenAI với model riêng
title: "SGLang"
---

# SGLang

SGLang có thể phục vụ các model mã nguồn mở qua API HTTP **tương thích OpenAI**. OpenClaw kết nối với SGLang qua API `openai-completions`.

OpenClaw cũng có thể **tự động phát hiện** model từ SGLang khi dùng `SGLANG_API_KEY` (bất kỳ giá trị nào nếu server không yêu cầu auth) và không định nghĩa `models.providers.sglang` rõ ràng.

## Bắt đầu nhanh

1. Khởi động SGLang với server tương thích OpenAI.

Base URL cần expose endpoint `/v1` (ví dụ `/v1/models`, `/v1/chat/completions`). SGLang thường chạy trên:

- `http://127.0.0.1:30000/v1`

2. Kích hoạt (bất kỳ giá trị nào nếu không cấu hình auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

3. Chạy onboarding và chọn `SGLang`, hoặc đặt model trực tiếp:

```bash
openclaw onboard
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "sglang/your-model-id" },
    },
  },
}
```

## Phát hiện model (provider ngầm định)

Khi `SGLANG_API_KEY` được đặt (hoặc có profile auth) và **không** định nghĩa `models.providers.sglang`, OpenClaw sẽ query:

- `GET http://127.0.0.1:30000/v1/models`

và chuyển ID trả về thành entry model.

Nếu định nghĩa `models.providers.sglang` rõ ràng, tự động phát hiện bị bỏ qua và cần định nghĩa model thủ công.

## Cấu hình rõ ràng (model thủ công)

Dùng cấu hình rõ ràng khi:

- SGLang chạy trên host/port khác.
- Muốn cố định giá trị `contextWindow`/`maxTokens`.
- Server yêu cầu API key thực (hoặc muốn kiểm soát header).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
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
curl http://127.0.0.1:30000/v1/models
```

- Nếu request lỗi do auth, đặt `SGLANG_API_KEY` thực khớp với cấu hình server, hoặc cấu hình provider rõ ràng dưới `models.providers.sglang`.\n