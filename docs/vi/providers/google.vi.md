---
title: "Google (Gemini)"
summary: "Thiết lập Google Gemini (API key + OAuth, tạo ảnh, hiểu media, tìm kiếm web)"
read_when:
  - Muốn dùng mô hình Google Gemini với OpenClaw
  - Cần API key hoặc OAuth auth flow
---

# Google (Gemini)

Plugin Google cho phép truy cập mô hình Gemini qua Google AI Studio, cùng với
tạo ảnh, hiểu media (hình ảnh/âm thanh/video), và tìm kiếm web qua Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`
- API: Google Gemini API
- Provider thay thế: `google-gemini-cli` (OAuth)

## Bắt đầu nhanh

1. Thiết lập API key:

```bash
openclaw onboard --auth-choice google-api-key
```

2. Thiết lập model mặc định:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## Ví dụ không tương tác

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice google-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth (Gemini CLI)

Provider thay thế `google-gemini-cli` dùng PKCE OAuth thay vì API key. Đây là tích hợp không chính thức; một số người dùng báo cáo bị hạn chế tài khoản. Sử dụng tự chịu rủi ro.

Biến môi trường:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

(Hoặc các biến `GEMINI_CLI_*` tương tự.)

## Khả năng

| Khả năng               | Hỗ trợ            |
| ---------------------- | ----------------- |
| Chat completions       | Có                |
| Tạo ảnh                | Có                |
| Hiểu hình ảnh          | Có                |
| Chuyển âm thanh thành văn bản | Có         |
| Hiểu video             | Có                |
| Tìm kiếm web (Grounding) | Có              |
| Suy nghĩ/lý luận       | Có (Gemini 3.1+)  |

## Lưu ý môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `GEMINI_API_KEY`
có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc qua
`env.shellEnv`).\n