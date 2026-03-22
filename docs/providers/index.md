---
summary: "Khám phá các nhà cung cấp mô hình LLMs được hỗ trợ, giúp bạn lựa chọn giải pháp AI phù hợp nhất."
read_when:
  - Bạn muốn chọn một nhà cung cấp mô hình
  - Bạn cần cái nhìn tổng quan nhanh về các backend LLM được hỗ trợ
title: "Danh Sách Nhà Cung Cấp Mô Hình LLMs"
---

# Nhà Cung Cấp Mô Hình

OpenClaw hỗ trợ nhiều nhà cung cấp LLM. Chọn một nhà cung cấp, xác thực, sau đó đặt mô hình mặc định dưới dạng `provider/model`.

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
- [Mô hình GLM](/providers/glm)
- [Google (Gemini)](/providers/google)
- [Groq (LPU inference)](/providers/groq)
- [Hugging Face (Inference)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM (cổng hợp nhất)](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Model Studio (Alibaba Cloud)](/providers/modelstudio)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama (mô hình đám mây + cục bộ)](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode (Zen + Go)](/providers/opencode)
- [OpenRouter](/providers/openrouter)
- [Perplexity (tìm kiếm web)](/providers/perplexity-provider)
- [Qianfan](/providers/qianfan)
- [Qwen (OAuth)](/providers/qwen)
- [SGLang (mô hình cục bộ)](/providers/sglang)
- [Together AI](/providers/together)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Venice (Venice AI, tập trung vào quyền riêng tư)](/providers/venice)
- [vLLM (mô hình cục bộ)](/providers/vllm)
- [Volcengine (Doubao)](/providers/volcengine)
- [xAI](/providers/xai)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## Nhà cung cấp dịch vụ chuyển đổi giọng nói

- [Deepgram (chuyển đổi âm thanh)](/providers/deepgram)

## Công cụ cộng đồng

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - Proxy cộng đồng cho thông tin đăng ký Claude (kiểm tra chính sách/điều khoản của Anthropic trước khi sử dụng)

Để xem toàn bộ danh mục nhà cung cấp (xAI, Groq, Mistral, v.v.) và cấu hình nâng cao, xem [Nhà cung cấp mô hình](/concepts/model-providers).
