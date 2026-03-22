---
summary: "Khám phá cách sử dụng Mistral và chuyển đổi giọng nói Voxtral với OpenClaw, cải thiện trải nghiệm người dùng."
read_when:
  - Bạn muốn sử dụng mô hình Mistral trong OpenClaw
  - Bạn cần hướng dẫn API key Mistral và tham chiếu mô hình
title: "Hướng Dẫn Sử Dụng Mô Hình Mistral"
---

# Mistral

OpenClaw hỗ trợ Mistral cho cả định tuyến mô hình văn bản/hình ảnh (`mistral/...`) và chuyển đổi giọng nói qua Voxtral trong việc hiểu phương tiện. Mistral cũng có thể được sử dụng cho nhúng bộ nhớ (`memorySearch.provider = "mistral"`).

## Thiết lập CLI

```bash
openclaw onboard --auth-choice mistral-api-key
# hoặc không tương tác
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Đoạn cấu hình (nhà cung cấp LLM)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Đoạn cấu hình (chuyển đổi giọng nói với Voxtral)

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

- Xác thực Mistral sử dụng `MISTRAL_API_KEY`.
- URL cơ sở của nhà cung cấp mặc định là `https://api.mistral.ai/v1`.
- Mô hình mặc định khi onboard là `mistral/mistral-large-latest`.
- Mô hình âm thanh mặc định cho việc hiểu phương tiện của Mistral là `voxtral-mini-latest`.
- Đường dẫn chuyển đổi giọng nói sử dụng `/v1/audio/transcriptions`.
- Đường dẫn nhúng bộ nhớ sử dụng `/v1/embeddings` (mô hình mặc định: `mistral-embed`).
