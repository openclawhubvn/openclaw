---
summary: "Tìm hiểu cách cấu hình Deepgram để chuyển giọng nói thành văn bản, tối ưu ghi chú thoại nhanh chóng và chính xác."
read_when:
  - Bạn muốn sử dụng Deepgram để chuyển giọng nói thành văn bản cho tệp âm thanh đính kèm
  - Bạn cần ví dụ cấu hình nhanh cho Deepgram
title: "Hướng Dẫn Cấu Hình Deepgram Chuyển Giọng Nói"
---

# Deepgram (Chuyển giọng nói thành văn bản)

Deepgram là một API chuyển giọng nói thành văn bản. Trong OpenClaw, nó được sử dụng để **chuyển đổi ghi chú thoại/âm thanh đến** thông qua `tools.media.audio`.

Khi được kích hoạt, OpenClaw tải tệp âm thanh lên Deepgram và chèn bản chuyển đổi vào quy trình phản hồi (`{{Transcript}}` + khối `[Audio]`). Đây **không phải là streaming**; nó sử dụng endpoint chuyển đổi đã ghi âm trước.

Website: [https://deepgram.com](https://deepgram.com)  
Tài liệu: [https://developers.deepgram.com](https://developers.deepgram.com)

## Bắt đầu nhanh

1. Thiết lập API key của bạn:

```
DEEPGRAM_API_KEY=dg_...
```

2. Kích hoạt nhà cung cấp:

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

- `model`: ID mô hình của Deepgram (mặc định: `nova-3`)
- `language`: gợi ý ngôn ngữ (tùy chọn)
- `tools.media.audio.providerOptions.deepgram.detect_language`: bật phát hiện ngôn ngữ (tùy chọn)
- `tools.media.audio.providerOptions.deepgram.punctuate`: bật dấu câu (tùy chọn)
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

Ví dụ với các tùy chọn của Deepgram:

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

- Xác thực tuân theo thứ tự xác thực nhà cung cấp tiêu chuẩn; `DEEPGRAM_API_KEY` là cách đơn giản nhất.
- Ghi đè endpoints hoặc headers với `tools.media.audio.baseUrl` và `tools.media.audio.headers` khi sử dụng proxy.
- Đầu ra tuân theo các quy tắc âm thanh giống như các nhà cung cấp khác (giới hạn kích thước, thời gian chờ, chèn bản chuyển đổi).
