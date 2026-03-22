# Moonshot AI (Kimi)

Moonshot cung cấp API Kimi với các endpoint tương thích OpenAI. Cấu hình provider và đặt model mặc định là `moonshot/kimi-k2.5`, hoặc dùng Kimi Coding với `kimi-coding/k2p5`.

Các model ID hiện tại của Kimi K2:

- `kimi-k2.5`
- `kimi-k2-0905-preview`
- `kimi-k2-turbo-preview`
- `kimi-k2-thinking`
- `kimi-k2-thinking-turbo`

```bash
openclaw onboard --auth-choice moonshot-api-key
```

Kimi Coding:

```bash
openclaw onboard --auth-choice kimi-code-api-key
```

Lưu ý: Moonshot và Kimi Coding là hai provider riêng biệt. Key không thể thay thế, endpoint khác nhau, và model refs cũng khác (Moonshot dùng `moonshot/...`, Kimi Coding dùng `kimi-coding/...`).

## Cấu hình mẫu (Moonshot API)

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: {
        "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
        "moonshot/kimi-k2-0905-preview": { alias: "Kimi K2" },
        "moonshot/kimi-k2-turbo-preview": { alias: "Kimi K2 Turbo" },
        "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
        "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
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

- Model refs của Moonshot dùng `moonshot/<modelId>`. Model refs của Kimi Coding dùng `kimi-coding/<modelId>`.
- Có thể override giá và metadata context trong `models.providers` nếu cần.
- Nếu Moonshot công bố giới hạn context khác cho một model, điều chỉnh `contextWindow` tương ứng.
- Dùng `https://api.moonshot.ai/v1` cho endpoint quốc tế, và `https://api.moonshot.cn/v1` cho endpoint Trung Quốc.

## Chế độ thinking native (Moonshot)

Moonshot Kimi hỗ trợ chế độ thinking native nhị phân:

- `thinking: { type: "enabled" }`
- `thinking: { type: "disabled" }`

Cấu hình theo model qua `agents.defaults.models.<provider/model>.params`:

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

OpenClaw cũng map các mức `/think` runtime cho Moonshot:

- `/think off` -> `thinking.type=disabled`
- bất kỳ mức thinking nào không phải off -> `thinking.type=enabled`

Khi bật chế độ thinking của Moonshot, `tool_choice` phải là `auto` hoặc `none`. OpenClaw sẽ tự động chuyển các giá trị `tool_choice` không tương thích thành `auto` để đảm bảo tương thích.\n