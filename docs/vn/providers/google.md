---
title: "Google (Gemini)"
summary: "Thiết lập Google Gemini (API key + OAuth, tạo hình ảnh, hiểu phương tiện, tìm kiếm web)"
read_when:
  - Bạn muốn sử dụng mô hình Google Gemini với OpenClaw
  - Bạn cần API key hoặc quy trình xác thực OAuth
---

# Google (Gemini)

Plugin Google cung cấp quyền truy cập vào các mô hình Gemini thông qua Google AI Studio, cùng với khả năng tạo hình ảnh, hiểu phương tiện (hình ảnh/âm thanh/video) và tìm kiếm web qua Gemini Grounding.

- Nhà cung cấp: `google`
- Xác thực: `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`
- API: Google Gemini API
- Nhà cung cấp thay thế: `google-gemini-cli` (OAuth)

## Bắt đầu nhanh

1. Thiết lập API key:

```bash
openclaw onboard --auth-choice google-api-key
```

2. Thiết lập mô hình mặc định:

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

Nhà cung cấp thay thế `google-gemini-cli` sử dụng PKCE OAuth thay vì API key. Đây là tích hợp không chính thức; một số người dùng báo cáo có hạn chế tài khoản. Sử dụng theo rủi ro của bạn.

Biến môi trường:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

(Hoặc các biến thể `GEMINI_CLI_*`.)

## Khả năng

| Khả năng               | Hỗ trợ            |
| ---------------------- | ----------------- |
| Hoàn thành hội thoại   | Có                |
| Tạo hình ảnh           | Có                |
| Hiểu hình ảnh          | Có                |
| Chuyển âm thanh thành văn bản | Có         |
| Hiểu video             | Có                |
| Tìm kiếm web (Grounding) | Có              |
| Suy nghĩ/lý luận       | Có (Gemini 3.1+)  |

## Lưu ý về môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `GEMINI_API_KEY` có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`).
