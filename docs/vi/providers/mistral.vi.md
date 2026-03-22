---
summary: "Sử dụng mô hình Mistral và chuyển âm Voxtral với OpenClaw"
read_when:
  - Muốn dùng mô hình Mistral trong OpenClaw
  - Cần onboarding API key Mistral và tham chiếu mô hình
title: "Mistral"
---

# Mistral

OpenClaw hỗ trợ Mistral cho cả routing mô hình text/image (`mistral/...`) và chuyển âm thanh qua Voxtral trong media understanding. Mistral cũng dùng cho memory embeddings (`memorySearch.provider = "mistral"`).

## Thiết lập CLI

```bash
openclaw onboard --auth-choice mistral-api-key
# hoặc không tương tác
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Đoạn cấu hình (LLM provider)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Đoạn cấu hình (chuyển âm thanh với Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## Ghi chú

- Xác thực Mistral dùng `MISTRAL_API_KEY`.
- URL gốc của Provider mặc định là `https://api.mistral.ai/v1`.
- Mô hình mặc định khi onboarding là `mistral/mistral-large-latest`.
- Mô hình âm thanh mặc định cho Mistral là `voxtral-mini-latest`.
- Đường dẫn chuyển âm thanh dùng `/v1/audio/transcriptions`.
- Đường dẫn memory embeddings dùng `/v1/embeddings` (mô hình mặc định: `mistral-embed`).\n