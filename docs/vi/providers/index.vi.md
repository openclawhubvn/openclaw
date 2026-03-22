---
summary: "Các nhà cung cấp mô hình (LLM) được OpenClaw hỗ trợ"
read_when:
  - Cần chọn nhà cung cấp mô hình
  - Cần cái nhìn tổng quan nhanh về các backend LLM hỗ trợ
title: "Danh mục Nhà cung cấp"
---

# Nhà cung cấp mô hình

OpenClaw hỗ trợ nhiều nhà cung cấp LLM. Chọn nhà cung cấp, xác thực, rồi đặt mô hình mặc định dưới dạng `provider/model`.

Tìm tài liệu về kênh chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/v.v.)? Xem [Channels](/channels).

## Bắt đầu nhanh

1. Xác thực với nhà cung cấp (thường qua `openclaw onboard`).
2. Đặt mô hình mặc định:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Tài liệu nhà cung cấp

- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude Code CLI)](/providers/anthropic)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [GLM models](/providers/glm)
- [Google (Gemini)](/providers/google)
- [Groq (LPU inference)](/providers/groq)
- [Hugging Face (Inference)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM (unified gateway)](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Model Studio (Alibaba Cloud)](/providers/modelstudio)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama (cloud + local models)](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode (Zen + Go)](/providers/opencode)
- [OpenRouter](/providers/openrouter)
- [Perplexity (web search)](/providers/perplexity-provider)
- [Qianfan](/providers/qianfan)
- [Qwen (OAuth)](/providers/qwen)
- [SGLang (local models)](/providers/sglang)
- [Together AI](/providers/together)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Venice (Venice AI, privacy-focused)](/providers/venice)
- [vLLM (local models)](/providers/vllm)
- [Volcengine (Doubao)](/providers/volcengine)
- [xAI](/providers/xai)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## Nhà cung cấp dịch vụ chuyển đổi giọng nói

- [Deepgram (audio transcription)](/providers/deepgram)

## Công cụ cộng đồng

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - Proxy cộng đồng cho thông tin đăng ký Claude (kiểm tra chính sách/điều khoản Anthropic trước khi sử dụng)

Để xem đầy đủ danh mục nhà cung cấp (xAI, Groq, Mistral, v.v.) và cấu hình nâng cao, xem [Model providers](/concepts/model-providers).\n