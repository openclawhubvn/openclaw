---
summary: "Chạy OpenClaw trên các mô hình LLM cục bộ (LM Studio, vLLM, LiteLLM, endpoint OpenAI tùy chỉnh)"
read_when:
  - Bạn muốn phục vụ mô hình từ máy GPU của mình
  - Bạn đang kết nối LM Studio hoặc proxy tương thích OpenAI
  - Bạn cần hướng dẫn mô hình cục bộ an toàn nhất
title: "Mô hình cục bộ"
---

# Mô hình cục bộ

Chạy cục bộ là khả thi, nhưng OpenClaw yêu cầu ngữ cảnh lớn và bảo vệ mạnh mẽ chống lại việc tiêm lệnh. Các mô hình nhỏ có thể cắt ngắn ngữ cảnh và làm giảm độ an toàn. Hãy nhắm đến: **≥2 Mac Studios tối đa hoặc dàn máy GPU tương đương (~30.000 USD+).** Một GPU **24 GB** chỉ hoạt động tốt với các lệnh nhẹ hơn và độ trễ cao hơn. Sử dụng **biến thể mô hình lớn nhất mà bạn có thể chạy**; các checkpoint bị nén mạnh hoặc "nhỏ" làm tăng nguy cơ tiêm lệnh (xem [Bảo mật](/gateway/security)).

Nếu bạn muốn thiết lập cục bộ dễ dàng nhất, hãy bắt đầu với [Ollama](/providers/ollama) và `openclaw onboard`. Trang này là hướng dẫn cho các cấu hình cục bộ cao cấp và máy chủ cục bộ tương thích OpenAI tùy chỉnh.

## Khuyến nghị: LM Studio + MiniMax M2.5 (API Responses, kích thước đầy đủ)

Cấu hình cục bộ tốt nhất hiện tại. Tải MiniMax M2.5 trong LM Studio, bật máy chủ cục bộ (mặc định `http://127.0.0.1:1234`), và sử dụng API Responses để giữ lý luận tách biệt khỏi văn bản cuối cùng.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.5-gs32" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/minimax-m2.5-gs32": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Danh sách kiểm tra thiết lập**

- Cài đặt LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Trong LM Studio, tải bản dựng **MiniMax M2.5 lớn nhất có sẵn** (tránh các biến thể "nhỏ"/nén mạnh), khởi động máy chủ, xác nhận `http://127.0.0.1:1234/v1/models` liệt kê nó.
- Giữ mô hình được tải; tải lạnh làm tăng độ trễ khởi động.
- Điều chỉnh `contextWindow`/`maxTokens` nếu bản dựng LM Studio của bạn khác.
- Đối với WhatsApp, sử dụng API Responses để chỉ gửi văn bản cuối cùng.

Giữ các mô hình được lưu trữ cấu hình ngay cả khi chạy cục bộ; sử dụng `models.mode: "merge"` để các phương án dự phòng luôn sẵn sàng.

### Cấu hình lai: chính lưu trữ, dự phòng cục bộ

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/minimax-m2.5-gs32", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/minimax-m2.5-gs32": { alias: "MiniMax Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Ưu tiên cục bộ với dự phòng lưu trữ

Đổi thứ tự chính và dự phòng; giữ nguyên khối nhà cung cấp và `models.mode: "merge"` để có thể dự phòng sang Sonnet hoặc Opus khi máy cục bộ không hoạt động.

### Lưu trữ theo khu vực / định tuyến dữ liệu

- Các biến thể MiniMax/Kimi/GLM được lưu trữ cũng có trên OpenRouter với các endpoint cố định theo khu vực (ví dụ: lưu trữ tại Mỹ). Chọn biến thể khu vực ở đó để giữ lưu lượng trong khu vực bạn chọn trong khi vẫn sử dụng `models.mode: "merge"` cho các phương án dự phòng Anthropic/OpenAI.
- Chỉ cục bộ vẫn là con đường bảo mật mạnh nhất; định tuyến khu vực lưu trữ là giải pháp trung gian khi bạn cần tính năng của nhà cung cấp nhưng muốn kiểm soát luồng dữ liệu.

## Các proxy cục bộ tương thích OpenAI khác

vLLM, LiteLLM, OAI-proxy, hoặc các gateway tùy chỉnh hoạt động nếu chúng cung cấp một endpoint kiểu OpenAI `/v1`. Thay thế khối nhà cung cấp ở trên bằng endpoint và ID mô hình của bạn:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Giữ `models.mode: "merge"` để các mô hình lưu trữ vẫn có sẵn làm dự phòng.

## Khắc phục sự cố

- Gateway có thể kết nối với proxy không? `curl http://127.0.0.1:1234/v1/models`.
- Mô hình LM Studio bị dỡ tải? Tải lại; khởi động lạnh là nguyên nhân phổ biến gây "treo".
- Lỗi ngữ cảnh? Giảm `contextWindow` hoặc tăng giới hạn máy chủ của bạn.
- An toàn: mô hình cục bộ bỏ qua các bộ lọc phía nhà cung cấp; giữ cho các agent hẹp và bật nén để giới hạn phạm vi tiêm lệnh.
