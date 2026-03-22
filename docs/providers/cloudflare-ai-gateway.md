---
title: "Hướng Dẫn Cấu Hình Cloudflare AI Gateway"
summary: "Thiết lập và cấu hình Cloudflare AI Gateway với hướng dẫn chi tiết về xác thực và lựa chọn mô hình AI tối ưu."
read_when:
  - Bạn muốn sử dụng Cloudflare AI Gateway với OpenClaw
  - Bạn cần ID tài khoản, ID gateway, hoặc biến môi trường API key
---

# Cloudflare AI Gateway

Cloudflare AI Gateway hoạt động như một lớp trung gian trước các API của nhà cung cấp, cho phép bạn thêm phân tích, bộ nhớ đệm và kiểm soát. Đối với Anthropic, OpenClaw sử dụng Anthropic Messages API thông qua endpoint Gateway của bạn.

- Nhà cung cấp: `cloudflare-ai-gateway`
- URL cơ bản: `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- Mô hình mặc định: `cloudflare-ai-gateway/claude-sonnet-4-6`
- API key: `CLOUDFLARE_AI_GATEWAY_API_KEY` (API key của nhà cung cấp cho các yêu cầu qua Gateway)

Đối với các mô hình Anthropic, sử dụng API key của Anthropic.

## Bắt đầu nhanh

1. Thiết lập API key của nhà cung cấp và chi tiết Gateway:

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. Thiết lập mô hình mặc định:

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

Nếu bạn đã bật xác thực Gateway trong Cloudflare, thêm header `cf-aig-authorization` (điều này bổ sung cho API key của nhà cung cấp).

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

## Lưu ý về môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `CLOUDFLARE_AI_GATEWAY_API_KEY` có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`).
