---
title: "Kilo Gateway"
summary: "Sử dụng API thống nhất của Kilo Gateway để truy cập nhiều mô hình trong OpenClaw"
read_when:
  - Cần một API key duy nhất cho nhiều LLMs
  - Muốn chạy mô hình qua Kilo Gateway trong OpenClaw
---

# Kilo Gateway

Kilo Gateway cung cấp **API thống nhất** để định tuyến yêu cầu đến nhiều mô hình qua một endpoint và API key duy nhất. Tương thích với OpenAI, nên hầu hết SDK của OpenAI hoạt động chỉ cần đổi base URL.

## Lấy API key

1. Truy cập [app.kilo.ai](https://app.kilo.ai)
2. Đăng nhập hoặc tạo tài khoản
3. Vào API Keys và tạo key mới

## Cài đặt CLI

```bash
openclaw onboard --kilocode-api-key <key>
```

Hoặc thiết lập biến môi trường:

```bash
export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
```

## Đoạn cấu hình

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## Mô hình mặc định

Mô hình mặc định là `kilocode/kilo/auto`, một mô hình định tuyến thông minh tự động chọn mô hình tốt nhất dựa trên nhiệm vụ:

- Nhiệm vụ lập kế hoạch, debug, và điều phối định tuyến đến Claude Opus
- Nhiệm vụ viết code và khám phá định tuyến đến Claude Sonnet

## Mô hình khả dụng

OpenClaw tự động phát hiện mô hình khả dụng từ Kilo Gateway khi khởi động. Dùng `/models kilocode` để xem danh sách đầy đủ mô hình khả dụng với tài khoản.

Bất kỳ mô hình nào trên gateway có thể dùng với tiền tố `kilocode/`:

```
kilocode/kilo/auto              (mặc định - định tuyến thông minh)
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.2
kilocode/google/gemini-3-pro-preview
...và nhiều hơn nữa
```

## Ghi chú

- Tham chiếu mô hình là `kilocode/<model-id>` (ví dụ: `kilocode/anthropic/claude-sonnet-4`).
- Mô hình mặc định: `kilocode/kilo/auto`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Để biết thêm tùy chọn mô hình/nhà cung cấp, xem [/concepts/model-providers](/concepts/model-providers).
- Kilo Gateway sử dụng Bearer token với API key.\n