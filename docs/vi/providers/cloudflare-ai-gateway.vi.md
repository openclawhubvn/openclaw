---
title: "Cloudflare AI Gateway"
summary: "Thiết lập Cloudflare AI Gateway (xác thực + chọn model)"
read_when:
  - Muốn dùng Cloudflare AI Gateway với OpenClaw
  - Cần account ID, gateway ID, hoặc API key env var
---

# Cloudflare AI Gateway

Cloudflare AI Gateway đứng trước các provider API, cho phép thêm analytics, caching và kiểm soát. Với Anthropic, OpenClaw dùng Anthropic Messages API qua Gateway endpoint.

- Provider: `cloudflare-ai-gateway`
- Base URL: `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- Default model: `cloudflare-ai-gateway/claude-sonnet-4-6`
- API key: `CLOUDFLARE_AI_GATEWAY_API_KEY` (API key của provider cho các request qua Gateway)

Với các model Anthropic, dùng Anthropic API key.

## Bắt đầu nhanh

1. Thiết lập provider API key và thông tin Gateway:

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. Thiết lập model mặc định:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
    },
  },
}
```

## Ví dụ không tương tác

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Gateways có xác thực

Nếu đã bật xác thực Gateway trong Cloudflare, thêm header `cf-aig-authorization` (bên cạnh provider API key).

```json5
{
  models: {
    providers: {
      "cloudflare-ai-gateway": {
        headers: {
          "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
        },
      },
    },
  },
}
```

## Lưu ý môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `CLOUDFLARE_AI_GATEWAY_API_KEY` có sẵn cho process đó (ví dụ, trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).\n