---
summary: "Các nhà cung cấp model (LLMs) được OpenClaw hỗ trợ"
read_when:
  - Cần chọn nhà cung cấp model
  - Muốn ví dụ setup nhanh cho LLM auth + chọn model
title: "Hướng dẫn nhanh về nhà cung cấp model"
---

# Nhà cung cấp model

OpenClaw hỗ trợ nhiều nhà cung cấp LLM. Chọn một, xác thực, rồi đặt model mặc định là `provider/model`.

## Hướng dẫn nhanh (hai bước)

1. Xác thực với nhà cung cấp (thường qua `openclaw onboard`).
2. Đặt model mặc định:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Nhà cung cấp hỗ trợ (bộ khởi đầu)

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
- [GLM models](/providers/glm)
- [MiniMax](/providers/minimax)
- [Venice (Venice AI)](/providers/venice)
- [Amazon Bedrock](/providers/bedrock)
- [Qianfan](/providers/qianfan)
- [xAI](/providers/xai)

Để xem danh mục nhà cung cấp đầy đủ (xAI, Groq, Mistral, v.v.) và cấu hình nâng cao, xem [Model providers](/concepts/model-providers).\n