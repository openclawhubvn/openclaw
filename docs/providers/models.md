---
summary: "Khám phá cách cấu hình và sử dụng các nhà cung cấp mô hình LLMs được hỗ trợ, tối ưu hóa hiệu suất AI của bạn."
read_when:
  - Bạn muốn chọn một nhà cung cấp mô hình
  - Bạn cần ví dụ thiết lập nhanh cho xác thực LLM + chọn mô hình
title: "Hướng Dẫn Cấu Hình Nhà Cung Cấp Mô Hình"
---

# Nhà cung cấp Mô hình

OpenClaw hỗ trợ nhiều nhà cung cấp LLM. Chọn một nhà cung cấp, xác thực, sau đó đặt mô hình mặc định dưới dạng `provider/model`.

## Hướng dẫn nhanh (hai bước)

1. Xác thực với nhà cung cấp (thường qua `openclaw onboard`).
2. Đặt mô hình mặc định:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Các nhà cung cấp được hỗ trợ (bộ khởi đầu)

- [OpenAI (API + Codex)](/providers/openai)
- [Anthropic (API + Claude Code CLI)](/providers/anthropic)
- [OpenRouter](/providers/openrouter)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [Mistral](/providers/mistral)
- [Synthetic](/providers/synthetic)
- [OpenCode (Zen + Go)](/providers/opencode)
- [Z.AI](/providers/zai)
- [Mô hình GLM](/providers/glm)
- [MiniMax](/providers/minimax)
- [Venice (Venice AI)](/providers/venice)
- [Amazon Bedrock](/providers/bedrock)
- [Qianfan](/providers/qianfan)
- [xAI](/providers/xai)

Để xem danh mục đầy đủ các nhà cung cấp (xAI, Groq, Mistral, v.v.) và cấu hình nâng cao, hãy xem [Nhà cung cấp mô hình](/concepts/model-providers).
