---
title: "Groq"
summary: "Thiết lập Groq (xác thực + chọn mô hình)"
read_when:
  - Bạn muốn sử dụng Groq với OpenClaw
  - Bạn cần biến môi trường API key hoặc lựa chọn xác thực CLI
---

# Groq

[Groq](https://groq.com) cung cấp khả năng suy luận siêu nhanh trên các mô hình mã nguồn mở (Llama, Gemma, Mistral và nhiều hơn nữa) bằng cách sử dụng phần cứng LPU tùy chỉnh. OpenClaw kết nối với Groq thông qua API tương thích với OpenAI.

- Nhà cung cấp: `groq`
- Xác thực: `GROQ_API_KEY`
- API: Tương thích OpenAI

## Bắt đầu nhanh

1. Lấy API key từ [console.groq.com/keys](https://console.groq.com/keys).

2. Thiết lập API key:

```bash
export GROQ_API_KEY="gsk_..."
```

3. Thiết lập mô hình mặc định:

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

## Chuyển đổi âm thanh

Groq cũng cung cấp khả năng chuyển đổi âm thanh nhanh chóng dựa trên Whisper. Khi được cấu hình như một nhà cung cấp hiểu biết về phương tiện, OpenClaw sử dụng mô hình `whisper-large-v3-turbo` của Groq để chuyển đổi tin nhắn thoại.

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

## Lưu ý về môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo rằng `GROQ_API_KEY` có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`).

## Các mô hình có sẵn

Danh mục mô hình của Groq thay đổi thường xuyên. Chạy `openclaw models list | grep groq` để xem các mô hình hiện có, hoặc kiểm tra tại [console.groq.com/docs/models](https://console.groq.com/docs/models).

Các lựa chọn phổ biến bao gồm:

- **Llama 3.3 70B Versatile** - đa dụng, ngữ cảnh lớn
- **Llama 3.1 8B Instant** - nhanh, nhẹ
- **Gemma 2 9B** - gọn nhẹ, hiệu quả
- **Mixtral 8x7B** - kiến trúc MoE, khả năng suy luận mạnh

## Liên kết

- [Groq Console](https://console.groq.com)
- [Tài liệu API](https://console.groq.com/docs)
- [Danh sách mô hình](https://console.groq.com/docs/models)
- [Giá cả](https://groq.com/pricing)
