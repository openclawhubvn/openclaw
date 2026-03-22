---
summary: "Chạy OpenClaw với SGLang (máy chủ tự lưu trữ tương thích OpenAI)"
read_when:
  - Bạn muốn chạy OpenClaw với máy chủ SGLang cục bộ
  - Bạn muốn sử dụng các endpoint /v1 tương thích OpenAI với mô hình của riêng mình
title: "SGLang"
---

# SGLang

SGLang có thể phục vụ các mô hình mã nguồn mở thông qua API HTTP **tương thích OpenAI**. OpenClaw có thể kết nối với SGLang bằng API `openai-completions`.

OpenClaw cũng có thể **tự động phát hiện** các mô hình có sẵn từ SGLang khi bạn sử dụng `SGLANG_API_KEY` (bất kỳ giá trị nào cũng được nếu máy chủ của bạn không yêu cầu xác thực) và bạn không định nghĩa một mục `models.providers.sglang` rõ ràng.

## Bắt đầu nhanh

1. Khởi động SGLang với máy chủ tương thích OpenAI.

URL cơ bản của bạn nên cung cấp các endpoint `/v1` (ví dụ `/v1/models`, `/v1/chat/completions`). SGLang thường chạy trên:

- `http://127.0.0.1:30000/v1`

2. Đăng ký (bất kỳ giá trị nào cũng được nếu không cấu hình xác thực):

```bash
export SGLANG_API_KEY="sglang-local"
```

3. Chạy onboarding và chọn `SGLang`, hoặc thiết lập mô hình trực tiếp:

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

## Phát hiện mô hình (nhà cung cấp ngầm định)

Khi `SGLANG_API_KEY` được thiết lập (hoặc có hồ sơ xác thực) và bạn **không** định nghĩa `models.providers.sglang`, OpenClaw sẽ truy vấn:

- `GET http://127.0.0.1:30000/v1/models`

và chuyển đổi các ID trả về thành các mục mô hình.

Nếu bạn thiết lập `models.providers.sglang` rõ ràng, tự động phát hiện sẽ bị bỏ qua và bạn phải định nghĩa mô hình thủ công.

## Cấu hình rõ ràng (mô hình thủ công)

Sử dụng cấu hình rõ ràng khi:

- SGLang chạy trên một host/port khác.
- Bạn muốn cố định các giá trị `contextWindow`/`maxTokens`.
- Máy chủ của bạn yêu cầu một API key thực sự (hoặc bạn muốn kiểm soát các header).

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

- Kiểm tra xem máy chủ có thể truy cập được không:

```bash
curl http://127.0.0.1:30000/v1/models
```

- Nếu yêu cầu thất bại với lỗi xác thực, hãy thiết lập một `SGLANG_API_KEY` thực sự phù hợp với cấu hình máy chủ của bạn, hoặc cấu hình nhà cung cấp rõ ràng dưới `models.providers.sglang`.
