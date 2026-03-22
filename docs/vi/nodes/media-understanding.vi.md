---
summary: "Hiểu media inbound (tùy chọn) với provider + CLI fallback"
read_when:
  - Thiết kế hoặc refactor media understanding
  - Tuning inbound audio/video/image preprocessing
title: "Media Understanding"
---

# Media Understanding - Inbound (2026-01-17)

OpenClaw có thể **tóm tắt media inbound** (image/audio/video) trước khi chạy reply pipeline. Nó tự động phát hiện khi có sẵn công cụ local hoặc provider key, và có thể tắt hoặc tùy chỉnh. Nếu không bật understanding, model vẫn nhận file/URL gốc như thường.

Hành vi media theo vendor được đăng ký qua plugin vendor, trong khi OpenClaw core quản lý `tools.media` config, thứ tự fallback, và tích hợp reply-pipeline.

## Mục tiêu

- Tùy chọn: xử lý trước media inbound thành text ngắn để routing nhanh hơn + parsing command tốt hơn.
- Giữ nguyên media gốc gửi đến model (luôn luôn).
- Hỗ trợ **provider API** và **CLI fallback**.
- Cho phép nhiều model với fallback theo thứ tự (lỗi/kích thước/timeout).

## Hành vi tổng quan

1. Thu thập attachment inbound (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Với mỗi khả năng được bật (image/audio/video), chọn attachment theo policy (mặc định: **đầu tiên**).
3. Chọn entry model đầu tiên đủ điều kiện (kích thước + khả năng + auth).
4. Nếu model fail hoặc media quá lớn, **fallback sang entry tiếp theo**.
5. Khi thành công:
   - `Body` trở thành block `[Image]`, `[Audio]`, hoặc `[Video]`.
   - Audio đặt `{{Transcript}}`; parsing command dùng caption text khi có,
     nếu không thì dùng transcript.
   - Captions được giữ lại dưới dạng `User text:` trong block.

Nếu understanding fail hoặc bị tắt, **luồng reply tiếp tục** với body gốc + attachment.

## Tổng quan cấu hình

`tools.media` hỗ trợ **shared model** cùng với override theo khả năng:

- `tools.media.models`: danh sách shared model (dùng `capabilities` để giới hạn).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - mặc định (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - override provider (`baseUrl`, `headers`, `providerOptions`)
  - Deepgram audio options qua `tools.media.audio.providerOptions.deepgram`
  - điều khiển echo transcript audio (`echoTranscript`, mặc định `false`; `echoFormat`)
  - danh sách **model theo khả năng** tùy chọn (ưu tiên trước shared model)
  - policy `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (giới hạn tùy chọn theo channel/chatType/session key)
- `tools.media.concurrency`: số khả năng chạy đồng thời tối đa (mặc định **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Model entries

Mỗi entry `models[]` có thể là **provider** hoặc **CLI**:

```json5
{
  type: "provider", // mặc định nếu không có
  provider: "openai",
  model: "gpt-5.2",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // tùy chọn, dùng cho entry đa modal
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLI templates cũng có thể dùng:

- `{{MediaDir}}` (thư mục chứa file media)
- `{{OutputDir}}` (thư mục tạm tạo cho lần chạy này)
- `{{OutputBase}}` (đường dẫn file tạm, không có phần mở rộng)

## Mặc định và giới hạn

Mặc định khuyến nghị:

- `maxChars`: **500** cho image/video (ngắn, dễ dùng cho command)
- `maxChars`: **unset** cho audio (full transcript trừ khi bạn đặt giới hạn)
- `maxBytes`:
  - image: **10MB**
  - audio: **20MB**
  - video: **50MB**

Quy tắc:

- Nếu media vượt quá `maxBytes`, model đó bị bỏ qua và **thử model tiếp theo**.
- File audio nhỏ hơn **1024 bytes** được coi là rỗng/hỏng và bị bỏ qua trước khi transcription provider/CLI.
- Nếu model trả về nhiều hơn `maxChars`, output bị cắt ngắn.
- `prompt` mặc định là “Describe the {media}.” đơn giản cùng hướng dẫn `maxChars` (chỉ image/video).
- Nếu `<capability>.enabled: true` nhưng không có model nào được cấu hình, OpenClaw thử **active reply model** khi provider của nó hỗ trợ khả năng đó.

### Tự động phát hiện media understanding (mặc định)

Nếu `tools.media.<capability>.enabled` **không** được đặt thành `false` và bạn chưa cấu hình model, OpenClaw tự động phát hiện theo thứ tự này và **dừng ở tùy chọn đầu tiên hoạt động**:

1. **Local CLIs** (chỉ audio; nếu đã cài đặt)
   - `sherpa-onnx-offline` (yêu cầu `SHERPA_ONNX_MODEL_DIR` với encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; dùng `WHISPER_CPP_MODEL` hoặc model tiny đi kèm)
   - `whisper` (Python CLI; tự động tải model)
2. **Gemini CLI** (`gemini`) dùng `read_many_files`
3. **Provider keys**
   - Audio: OpenAI → Groq → Deepgram → Google
   - Image: OpenAI → Anthropic → Google → MiniMax
   - Video: Google

Để tắt tự động phát hiện, đặt:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Lưu ý: Phát hiện binary là best-effort trên macOS/Linux/Windows; đảm bảo CLI có trong `PATH` (chúng tôi mở rộng `~`), hoặc đặt model CLI rõ ràng với đường dẫn lệnh đầy đủ.

### Hỗ trợ môi trường proxy (provider models)

Khi media understanding dựa trên provider **audio** và **video** được bật, OpenClaw tuân theo các biến môi trường proxy outbound tiêu chuẩn cho các cuộc gọi HTTP của provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Nếu không có biến môi trường proxy nào được đặt, media understanding sử dụng egress trực tiếp.
Nếu giá trị proxy bị sai định dạng, OpenClaw ghi lại cảnh báo và quay lại fetch trực tiếp.

## Khả năng (tùy chọn)

Nếu bạn đặt `capabilities`, entry chỉ chạy cho các loại media đó. Với danh sách shared, OpenClaw có thể suy ra mặc định:

- `openai`, `anthropic`, `minimax`: **image**
- `moonshot`: **image + video**
- `google` (Gemini API): **image + audio + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `deepgram`: **audio**

Với các entry CLI, **đặt `capabilities` rõ ràng** để tránh khớp bất ngờ.
Nếu bạn bỏ qua `capabilities`, entry đủ điều kiện cho danh sách mà nó xuất hiện.

## Ma trận hỗ trợ provider (tích hợp OpenClaw)

| Khả năng | Tích hợp provider                                  | Ghi chú                                                                   |
| -------- | -------------------------------------------------- | ------------------------------------------------------------------------- |
| Image    | OpenAI, Anthropic, Google, MiniMax, Moonshot, Z.AI | Plugin vendor đăng ký hỗ trợ image với media understanding core.          |
| Audio    | OpenAI, Groq, Deepgram, Google, Mistral            | Transcription provider (Whisper/Deepgram/Gemini/Voxtral).                 |
| Video    | Google, Moonshot                                   | Hiểu video provider qua plugin vendor.                                    |

## Hướng dẫn chọn model

- Ưu tiên model thế hệ mới mạnh nhất có sẵn cho mỗi khả năng media khi chất lượng và an toàn quan trọng.
- Với agent có công cụ xử lý input không tin cậy, tránh model media cũ/yếu hơn.
- Giữ ít nhất một fallback cho mỗi khả năng để đảm bảo khả dụng (model chất lượng + model nhanh/rẻ hơn).
- CLI fallback (`whisper-cli`, `whisper`, `gemini`) hữu ích khi API provider không khả dụng.
- Lưu ý `parakeet-mlx`: với `--output-dir`, OpenClaw đọc `<output-dir>/<media-basename>.txt` khi định dạng output là `txt` (hoặc không xác định); định dạng không phải `txt` quay lại stdout.

## Chính sách attachment

`attachments` theo khả năng kiểm soát attachment nào được xử lý:

- `mode`: `first` (mặc định) hoặc `all`
- `maxAttachments`: giới hạn số lượng được xử lý (mặc định **1**)
- `prefer`: `first`, `last`, `path`, `url`

Khi `mode: "all"`, output được gắn nhãn `[Image 1/2]`, `[Audio 2/2]`, v.v.

## Ví dụ cấu hình

### 1) Danh sách shared model + override

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.2", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Chỉ Audio + Video (tắt image)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Hiểu image tùy chọn

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.2" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Multi-modal single entry (khả năng rõ ràng)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Output trạng thái

Khi media understanding chạy, `/status` bao gồm một dòng tóm tắt ngắn:

```
📎 Media: image ok (openai/gpt-5.2) · audio skipped (maxBytes)
```

Dòng này hiển thị kết quả theo khả năng và provider/model được chọn khi áp dụng.

## Ghi chú

- Understanding là **best-effort**. Lỗi không chặn reply.
- Attachment vẫn được gửi đến model ngay cả khi understanding bị tắt.
- Dùng `scope` để giới hạn nơi understanding chạy (ví dụ: chỉ DMs).

## Tài liệu liên quan

- [Configuration](/gateway/configuration)
- [Image & Media Support](/nodes/images)\n