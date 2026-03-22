---
summary: "Cấu hình Moonshot K2 và Kimi Coding (nhà cung cấp và khóa riêng biệt)"
read_when:
  - Bạn muốn thiết lập Moonshot K2 (Moonshot Open Platform) và Kimi Coding
  - Bạn cần hiểu về các endpoint, khóa và tham chiếu mô hình riêng biệt
  - Bạn muốn có cấu hình copy/paste cho từng nhà cung cấp
title: "Moonshot AI"
---

# Moonshot AI (Kimi)

Moonshot cung cấp API Kimi với các endpoint tương thích OpenAI. Cấu hình nhà cung cấp và đặt mô hình mặc định là `moonshot/kimi-k2.5`, hoặc sử dụng Kimi Coding với `kimi-coding/k2p5`.

Các ID mô hình Kimi K2 hiện tại:

[//]: # "moonshot-kimi-k2-ids:start"

- `kimi-k2.5`
- `kimi-k2-0905-preview`
- `kimi-k2-turbo-preview`
- `kimi-k2-thinking`
- `kimi-k2-thinking-turbo`

[//]: # "moonshot-kimi-k2-ids:end"

```bash
openclaw onboard --auth-choice moonshot-api-key
```

Kimi Coding:

```bash
openclaw onboard --auth-choice kimi-code-api-key
```

Lưu ý: Moonshot và Kimi Coding là các nhà cung cấp riêng biệt. Khóa không thể thay thế cho nhau, các endpoint khác nhau, và tham chiếu mô hình cũng khác nhau (Moonshot sử dụng `moonshot/...`, Kimi Coding sử dụng `kimi-coding/...`).

## Đoạn cấu hình (Moonshot API)

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: {
        // moonshot-kimi-k2-aliases:start
        "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
        "moonshot/kimi-k2-0905-preview": { alias: "Kimi K2" },
        "moonshot/kimi-k2-turbo-preview": { alias: "Kimi K2 Turbo" },
        "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
        "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
        // moonshot-kimi-k2-aliases:end
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          // moonshot-kimi-k2-models:start
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-0905-preview",
            name: "Kimi K2 0905 Preview",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-turbo-preview",
            name: "Kimi K2 Turbo",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-thinking",
            name: "Kimi K2 Thinking",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-thinking-turbo",
            name: "Kimi K2 Thinking Turbo",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          // moonshot-kimi-k2-models:end
        ],
      },
    },
  },
}
```

## Kimi Coding

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: {
        "kimi-coding/k2p5": { alias: "Kimi K2.5" },
      },
    },
  },
}
```

## Ghi chú

- Tham chiếu mô hình Moonshot sử dụng `moonshot/<modelId>`. Tham chiếu mô hình Kimi Coding sử dụng `kimi-coding/<modelId>`.
- Ghi đè giá cả và metadata ngữ cảnh trong `models.providers` nếu cần.
- Nếu Moonshot công bố giới hạn ngữ cảnh khác cho một mô hình, điều chỉnh `contextWindow` tương ứng.
- Sử dụng `https://api.moonshot.ai/v1` cho endpoint quốc tế, và `https://api.moonshot.cn/v1` cho endpoint Trung Quốc.

## Chế độ tư duy tự nhiên (Moonshot)

Moonshot Kimi hỗ trợ chế độ tư duy tự nhiên nhị phân:

- `thinking: { type: "enabled" }`
- `thinking: { type: "disabled" }`

Cấu hình theo mô hình qua `agents.defaults.models.<provider/model>.params`:

```json5
{
  agents: {
    defaults: {
      models: {
        "moonshot/kimi-k2.5": {
          params: {
            thinking: { type: "disabled" },
          },
        },
      },
    },
  },
}
```

OpenClaw cũng ánh xạ các mức `/think` runtime cho Moonshot:

- `/think off` -> `thinking.type=disabled`
- bất kỳ mức tư duy nào không phải off -> `thinking.type=enabled`

Khi chế độ tư duy của Moonshot được kích hoạt, `tool_choice` phải là `auto` hoặc `none`. OpenClaw sẽ chuẩn hóa các giá trị `tool_choice` không tương thích thành `auto` để đảm bảo tương thích.
