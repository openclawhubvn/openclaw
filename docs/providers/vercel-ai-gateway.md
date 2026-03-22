---
title: "Hướng Dẫn Cấu Hình Vercel AI Gateway"
summary: "Khám phá cách thiết lập Vercel AI Gateway với hướng dẫn chi tiết về xác thực và lựa chọn mô hình AI hiệu quả."
read_when:
  - Bạn muốn sử dụng Vercel AI Gateway với OpenClaw
  - Bạn cần biến môi trường API key hoặc lựa chọn xác thực CLI
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) cung cấp một API thống nhất để truy cập hàng trăm mô hình thông qua một endpoint duy nhất.

- Nhà cung cấp: `vercel-ai-gateway`
- Xác thực: `AI_GATEWAY_API_KEY`
- API: Tương thích với Anthropic Messages
- OpenClaw tự động phát hiện danh mục Gateway `/v1/models`, vì vậy `/models vercel-ai-gateway`
  bao gồm các tham chiếu mô hình hiện tại như `vercel-ai-gateway/openai/gpt-5.4`.

## Bắt đầu nhanh

1. Thiết lập API key (khuyến nghị: lưu trữ cho Gateway):

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. Thiết lập mô hình mặc định:

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

## Lưu ý về môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `AI_GATEWAY_API_KEY`
có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc thông qua
`env.shellEnv`).

## Viết tắt ID mô hình

OpenClaw chấp nhận các tham chiếu mô hình viết tắt của Vercel Claude và chuẩn hóa chúng khi chạy:

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`
