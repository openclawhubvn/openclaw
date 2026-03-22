---
summary: "Chạy OpenClaw trên các mô hình LLM local (LM Studio, vLLM, LiteLLM, endpoint OpenAI tùy chỉnh)"
read_when:
  - Muốn chạy mô hình từ máy GPU của mình
  - Đang tích hợp LM Studio hoặc proxy tương thích OpenAI
  - Cần hướng dẫn mô hình local an toàn nhất
title: "Mô hình Local"
---

# Mô hình Local

Chạy local được, nhưng OpenClaw cần context lớn + bảo vệ mạnh chống prompt injection. Card nhỏ dễ cắt context và rò rỉ an toàn. Nên dùng: **≥2 Mac Studios max cấu hình hoặc dàn GPU tương đương (~$30k+)**. Một GPU **24 GB** chỉ chạy được prompt nhẹ với độ trễ cao. Dùng **biến thể mô hình lớn nhất có thể chạy**; checkpoint quá nhỏ hoặc nén mạnh dễ bị prompt injection (xem [Security](/gateway/security)).

Muốn setup local nhanh nhất, bắt đầu với [Ollama](/providers/ollama) và `openclaw onboard`. Trang này hướng dẫn chi tiết cho stack local cao cấp và server local tương thích OpenAI tùy chỉnh.

## Khuyến nghị: LM Studio + MiniMax M2.5 (Responses API, full-size)

Stack local tốt nhất hiện tại. Load MiniMax M2.5 trong LM Studio, bật server local (mặc định `http://127.0.0.1:1234`), và dùng Responses API để tách biệt reasoning khỏi text cuối.

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

**Checklist cài đặt**

- Cài LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Trong LM Studio, tải bản **MiniMax M2.5 lớn nhất có thể** (tránh bản “small”/nén mạnh), khởi động server, xác nhận `http://127.0.0.1:1234/v1/models` liệt kê được.
- Giữ mô hình luôn tải; cold-load tăng độ trễ khởi động.
- Điều chỉnh `contextWindow`/`maxTokens` nếu bản LM Studio khác.
- Với WhatsApp, dùng Responses API để chỉ gửi text cuối.

Giữ cấu hình mô hình hosted ngay cả khi chạy local; dùng `models.mode: "merge"` để có fallback.

### Cấu hình hybrid: hosted chính, local fallback

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

### Local-first với hosted safety net

Đổi thứ tự primary và fallback; giữ nguyên providers block và `models.mode: "merge"` để fallback về Sonnet hoặc Opus khi local box down.

### Hosting theo khu vực / định tuyến dữ liệu

- Các biến thể MiniMax/Kimi/GLM hosted cũng có trên OpenRouter với endpoint cố định theo khu vực (ví dụ: US-hosted). Chọn biến thể khu vực để giữ traffic trong phạm vi mong muốn, vẫn dùng `models.mode: "merge"` cho fallback Anthropic/OpenAI.
- Chỉ local là bảo mật nhất; định tuyến khu vực hosted là giải pháp trung gian khi cần tính năng provider nhưng muốn kiểm soát luồng dữ liệu.

## Proxy local tương thích OpenAI khác

vLLM, LiteLLM, OAI-proxy, hoặc gateway tùy chỉnh hoạt động nếu có endpoint kiểu OpenAI `/v1`. Thay block provider trên bằng endpoint và model ID của bạn:

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

Giữ `models.mode: "merge"` để mô hình hosted luôn sẵn sàng fallback.

## Troubleshooting

- Gateway có thể kết nối proxy? `curl http://127.0.0.1:1234/v1/models`.
- Mô hình LM Studio bị unload? Tải lại; cold start thường gây treo.
- Lỗi context? Giảm `contextWindow` hoặc tăng giới hạn server.
- An toàn: mô hình local bỏ qua filter provider-side; giữ agents hẹp và bật compaction để hạn chế phạm vi prompt injection.\n