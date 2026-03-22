---
title: "Vercel AI Gateway"
summary: "Cài đặt Vercel AI Gateway (xác thực + chọn model)"
read_when:
  - Muốn dùng Vercel AI Gateway với OpenClaw
  - Cần biến môi trường API key hoặc chọn xác thực qua CLI
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) cung cấp API thống nhất để truy cập hàng trăm model qua một endpoint duy nhất.

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- API: Tương thích với Anthropic Messages
- OpenClaw tự động phát hiện catalog Gateway `/v1/models`, nên `/models vercel-ai-gateway` bao gồm các model hiện tại như `vercel-ai-gateway/openai/gpt-5.4`.

## Bắt đầu nhanh

1. Thiết lập API key (khuyến nghị: lưu cho Gateway):

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. Thiết lập model mặc định:

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

## Ví dụ không tương tác

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Lưu ý môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `AI_GATEWAY_API_KEY` có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).

## Viết tắt Model ID

OpenClaw chấp nhận viết tắt model của Vercel Claude và chuẩn hóa khi chạy:

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`\n