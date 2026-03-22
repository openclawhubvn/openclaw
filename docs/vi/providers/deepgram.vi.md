---
summary: "Deepgram chuyển giọng nói thành văn bản cho voice note"
read_when:
  - Cần Deepgram chuyển giọng nói thành văn bản cho file audio đính kèm
  - Cần ví dụ cấu hình Deepgram nhanh
title: "Deepgram"
---

# Deepgram (Chuyển giọng nói thành văn bản)

Deepgram là API chuyển giọng nói thành văn bản. Trong OpenClaw, dùng để **chuyển voice note/audio inbound thành văn bản** qua `tools.media.audio`.

Khi bật, OpenClaw upload file audio lên Deepgram và chèn transcript vào pipeline phản hồi (`{{Transcript}}` + block `[Audio]`). Đây **không phải streaming**; dùng endpoint transcription đã ghi trước.

Website: [https://deepgram.com](https://deepgram.com)  
Docs: [https://developers.deepgram.com](https://developers.deepgram.com)

## Bắt đầu nhanh

1. Đặt API key:

```
DEEPGRAM_API_KEY=dg_...
```

2. Bật provider:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Tùy chọn

- `model`: ID model của Deepgram (mặc định: `nova-3`)
- `language`: gợi ý ngôn ngữ (tùy chọn)
- `tools.media.audio.providerOptions.deepgram.detect_language`: bật nhận diện ngôn ngữ (tùy chọn)
- `tools.media.audio.providerOptions.deepgram.punctuate`: bật chấm câu (tùy chọn)
- `tools.media.audio.providerOptions.deepgram.smart_format`: bật định dạng thông minh (tùy chọn)

Ví dụ với ngôn ngữ:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
      },
    },
  },
}
```

Ví dụ với tùy chọn Deepgram:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        providerOptions: {
          deepgram: {
            detect_language: true,
            punctuate: true,
            smart_format: true,
          },
        },
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Ghi chú

- Xác thực theo thứ tự auth chuẩn của provider; `DEEPGRAM_API_KEY` là cách đơn giản nhất.
- Ghi đè endpoint hoặc header với `tools.media.audio.baseUrl` và `tools.media.audio.headers` khi dùng proxy.
- Output tuân theo quy tắc audio như các provider khác (giới hạn kích thước, timeout, chèn transcript).\n