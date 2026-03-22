---
title: "Kilo Gateway"
summary: "Sử dụng API hợp nhất của Kilo Gateway để truy cập nhiều mô hình trong OpenClaw"
read_when:
  - Bạn muốn một API key duy nhất cho nhiều LLMs
  - Bạn muốn chạy mô hình qua Kilo Gateway trong OpenClaw
---

# Kilo Gateway

Kilo Gateway cung cấp một **API hợp nhất** để định tuyến yêu cầu đến nhiều mô hình thông qua một endpoint và API key duy nhất. Nó tương thích với OpenAI, vì vậy hầu hết các SDK của OpenAI có thể hoạt động bằng cách thay đổi URL cơ bản.

## Lấy API key

1. Truy cập [app.kilo.ai](https://app.kilo.ai)
2. Đăng nhập hoặc tạo tài khoản
3. Điều hướng đến API Keys và tạo một key mới

## Thiết lập CLI

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

Mô hình mặc định là `kilocode/kilo/auto`, một mô hình định tuyến thông minh tự động chọn mô hình phù hợp nhất dựa trên nhiệm vụ:

- Nhiệm vụ lập kế hoạch, gỡ lỗi và điều phối sẽ được định tuyến đến Claude Opus
- Nhiệm vụ viết mã và khám phá sẽ được định tuyến đến Claude Sonnet

## Các mô hình có sẵn

OpenClaw tự động phát hiện các mô hình có sẵn từ Kilo Gateway khi khởi động. Sử dụng `/models kilocode` để xem danh sách đầy đủ các mô hình có sẵn với tài khoản của bạn.

Bất kỳ mô hình nào có sẵn trên gateway đều có thể được sử dụng với tiền tố `kilocode/`:

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
- URL cơ bản: `https://api.kilo.ai/api/gateway/`
- Để biết thêm các tùy chọn mô hình/nhà cung cấp, xem [/concepts/model-providers](/concepts/model-providers).
- Kilo Gateway sử dụng Bearer token với API key của bạn.
