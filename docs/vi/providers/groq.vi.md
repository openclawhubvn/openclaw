---
title: "Groq"
summary: "Thiết lập Groq (xác thực + chọn model)"
read_when:
  - Muốn dùng Groq với OpenClaw
  - Cần biến môi trường API key hoặc chọn xác thực CLI
---

# Groq

[Groq](https://groq.com) cung cấp khả năng suy luận siêu nhanh trên các model mã nguồn mở (Llama, Gemma, Mistral, và nhiều hơn nữa) bằng phần cứng LPU tùy chỉnh. OpenClaw kết nối với Groq qua API tương thích OpenAI.

- Provider: `groq`
- Auth: `GROQ_API_KEY`
- API: Tương thích OpenAI

## Bắt đầu nhanh

1. Lấy API key từ [console.groq.com/keys](https://console.groq.com/keys).

2. Thiết lập API key:

```bash
export GROQ_API_KEY="gsk_..."
```

3. Thiết lập model mặc định:

```json5
{
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Ví dụ file cấu hình

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Chuyển âm thanh thành văn bản

Groq cũng cung cấp khả năng chuyển âm thanh thành văn bản nhanh chóng dựa trên Whisper. Khi được cấu hình làm media-understanding provider, OpenClaw sử dụng model `whisper-large-v3-turbo` của Groq để chuyển giọng nói thành văn bản.

```json5
{
  media: {
    understanding: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

## Lưu ý môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `GROQ_API_KEY` có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).

## Model khả dụng

Danh mục model của Groq thay đổi thường xuyên. Chạy `openclaw models list | grep groq` để xem các model hiện có, hoặc kiểm tra [console.groq.com/docs/models](https://console.groq.com/docs/models).

Các lựa chọn phổ biến:

- **Llama 3.3 70B Versatile** - đa dụng, ngữ cảnh lớn
- **Llama 3.1 8B Instant** - nhanh, nhẹ
- **Gemma 2 9B** - gọn, hiệu quả
- **Mixtral 8x7B** - kiến trúc MoE, lý luận mạnh

## Liên kết

- [Groq Console](https://console.groq.com)
- [Tài liệu API](https://console.groq.com/docs)
- [Danh sách Model](https://console.groq.com/docs/models)
- [Giá cả](https://groq.com/pricing)\n