---
summary: "Tìm hiểu cách cấu hình và sử dụng mô hình Xiaomi MiMo với OpenClaw để tối ưu hóa hiệu suất và trải nghiệm người dùng."
read_when:
  - Bạn muốn sử dụng mô hình Xiaomi MiMo trong OpenClaw
  - Bạn cần thiết lập XIAOMI_API_KEY
title: "Hướng Dẫn Cấu Hình Xiaomi MiMo Với OpenClaw"
---

# Xiaomi MiMo

Xiaomi MiMo là nền tảng API cho các mô hình **MiMo**. OpenClaw sử dụng endpoint tương thích với OpenAI của Xiaomi với xác thực bằng API-key. Tạo API key của bạn trong [Xiaomi MiMo console](https://platform.xiaomimimo.com/#/console/api-keys), sau đó cấu hình provider `xiaomi` đi kèm với key đó.

## Tổng quan về mô hình

- **mimo-v2-flash**: mô hình văn bản mặc định, cửa sổ ngữ cảnh 262144 token
- **mimo-v2-pro**: mô hình văn bản suy luận, cửa sổ ngữ cảnh 1048576 token
- **mimo-v2-omni**: mô hình đa phương tiện suy luận với đầu vào văn bản và hình ảnh, cửa sổ ngữ cảnh 262144 token
- URL cơ bản: `https://api.xiaomimimo.com/v1`
- API: `openai-completions`
- Xác thực: `Bearer $XIAOMI_API_KEY`

## Thiết lập CLI

```bash
openclaw onboard --auth-choice xiaomi-api-key
# hoặc không tương tác
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## Đoạn cấu hình

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

## Ghi chú

- Mô hình mặc định: `xiaomi/mimo-v2-flash`.
- Các mô hình tích hợp khác: `xiaomi/mimo-v2-pro`, `xiaomi/mimo-v2-omni`.
- Provider được tự động thêm vào khi `XIAOMI_API_KEY` được thiết lập (hoặc có hồ sơ xác thực).
- Xem [/concepts/model-providers](/concepts/model-providers) để biết quy tắc của provider.
