---
summary: "Khám phá cách phân tích hình ảnh, âm thanh, video với công cụ CLI và provider, tối ưu hóa quy trình xử lý media."
read_when:
  - Thiết kế hoặc tái cấu trúc việc hiểu media
  - Tinh chỉnh xử lý trước âm thanh/video/hình ảnh đầu vào
title: "Hướng Dẫn Hiểu Nội Dung Media Tự Động"
---

# Hiểu Nội Dung Media - Đầu Vào (2026-01-17)

OpenClaw có thể **tóm tắt media đầu vào** (hình ảnh/âm thanh/video) trước khi chạy quy trình trả lời. Nó tự động phát hiện khi có sẵn công cụ cục bộ hoặc khóa provider, và có thể tắt hoặc tùy chỉnh. Nếu không bật tính năng hiểu, các mô hình vẫn nhận được file/URL gốc như thường lệ.

Hành vi media cụ thể của từng nhà cung cấp được đăng ký bởi plugin của nhà cung cấp, trong khi OpenClaw core quản lý cấu hình `tools.media` chung, thứ tự dự phòng và tích hợp quy trình trả lời.

## Mục tiêu

- Tùy chọn: xử lý trước media đầu vào thành văn bản ngắn để định tuyến nhanh hơn và phân tích lệnh tốt hơn.
- Bảo toàn việc chuyển giao media gốc cho mô hình (luôn luôn).
- Hỗ trợ **API của nhà cung cấp** và **CLI dự phòng**.
- Cho phép nhiều mô hình với thứ tự dự phòng (lỗi/kích thước/hết thời gian).

## Hành vi tổng quan

1. Thu thập tệp đính kèm đầu vào (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Với mỗi khả năng được bật (hình ảnh/âm thanh/video), chọn tệp đính kèm theo chính sách (mặc định: **đầu tiên**).
3. Chọn mục nhập mô hình đủ điều kiện đầu tiên (kích thước + khả năng + xác thực).
4. Nếu một mô hình thất bại hoặc media quá lớn, **chuyển sang mục nhập tiếp theo**.
5. Khi thành công:
   - `Body` trở thành khối `[Image]`, `[Audio]`, hoặc `[Video]`.
   - Âm thanh thiết lập `{{Transcript}}`; phân tích lệnh sử dụng văn bản chú thích khi có, nếu không thì dùng bản ghi.
   - Chú thích được giữ lại dưới dạng `User text:` bên trong khối.

Nếu việc hiểu thất bại hoặc bị tắt, **quy trình trả lời tiếp tục** với nội dung gốc + tệp đính kèm.

## Tổng quan cấu hình

`tools.media` hỗ trợ **mô hình chia sẻ** cùng với ghi đè theo khả năng:

- `tools.media.models`: danh sách mô hình chia sẻ (sử dụng `capabilities` để giới hạn).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - mặc định (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - ghi đè của nhà cung cấp (`baseUrl`, `headers`, `providerOptions`)
  - tùy chọn âm thanh Deepgram qua `tools.media.audio.providerOptions.deepgram`
  - kiểm soát echo bản ghi âm thanh (`echoTranscript`, mặc định `false`; `echoFormat`)
  - danh sách **mô hình theo khả năng** tùy chọn (ưu tiên trước mô hình chia sẻ)
  - chính sách `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (giới hạn tùy chọn theo kênh/loại chat/khóa phiên)
- `tools.media.concurrency`: số lượng khả năng chạy đồng thời tối đa (mặc định **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* danh sách chia sẻ */
      ],
      image: {
        /* ghi đè tùy chọn */
      },
      audio: {
        /* ghi đè tùy chọn */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* ghi đè tùy chọn */
      },
    },
  },
}
```

### Mục nhập mô hình

Mỗi mục nhập `models[]` có thể là **provider** hoặc **CLI**:

```json5
{
  type: "provider", // mặc định nếu không có
  provider: "openai",
  model: "gpt-5.2",
  prompt: "Mô tả hình ảnh trong <= 500 ký tự.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // tùy chọn, dùng cho mục nhập đa phương thức
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
    "Đọc media tại {{MediaPath}} và mô tả nó trong <= {{MaxChars}} ký tự.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

Các mẫu CLI cũng có thể sử dụng:

- `{{MediaDir}}` (thư mục chứa file media)
- `{{OutputDir}}` (thư mục tạm tạo cho lần chạy này)
- `{{OutputBase}}` (đường dẫn cơ sở file tạm, không có phần mở rộng)

## Mặc định và giới hạn

Mặc định được khuyến nghị:

- `maxChars`: **500** cho hình ảnh/video (ngắn, thân thiện với lệnh)
- `maxChars`: **không đặt** cho âm thanh (bản ghi đầy đủ trừ khi bạn đặt giới hạn)
- `maxBytes`:
  - hình ảnh: **10MB**
  - âm thanh: **20MB**
  - video: **50MB**

Quy tắc:

- Nếu media vượt quá `maxBytes`, mô hình đó bị bỏ qua và **mô hình tiếp theo được thử**.
- File âm thanh nhỏ hơn **1024 byte** được coi là trống/hỏng và bị bỏ qua trước khi chuyển đổi của provider/CLI.
- Nếu mô hình trả về nhiều hơn `maxChars`, đầu ra sẽ bị cắt ngắn.
- `prompt` mặc định là “Mô tả {media}.” đơn giản cùng với hướng dẫn `maxChars` (chỉ hình ảnh/video).
- Nếu `<capability>.enabled: true` nhưng không có mô hình nào được cấu hình, OpenClaw thử **mô hình trả lời đang hoạt động** khi nhà cung cấp của nó hỗ trợ khả năng đó.

### Tự động phát hiện hiểu media (mặc định)

Nếu `tools.media.<capability>.enabled` **không** được đặt thành `false` và bạn chưa cấu hình mô hình, OpenClaw tự động phát hiện theo thứ tự này và **dừng lại ở tùy chọn hoạt động đầu tiên**:

1. **CLI cục bộ** (chỉ âm thanh; nếu đã cài đặt)
   - `sherpa-onnx-offline` (yêu cầu `SHERPA_ONNX_MODEL_DIR` với encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; sử dụng `WHISPER_CPP_MODEL` hoặc mô hình nhỏ đi kèm)
   - `whisper` (Python CLI; tự động tải xuống mô hình)
2. **Gemini CLI** (`gemini`) sử dụng `read_many_files`
3. **Khóa provider**
   - Âm thanh: OpenAI → Groq → Deepgram → Google
   - Hình ảnh: OpenAI → Anthropic → Google → MiniMax
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

Lưu ý: Phát hiện nhị phân là nỗ lực tốt nhất trên macOS/Linux/Windows; đảm bảo CLI có trong `PATH` (chúng tôi mở rộng `~`), hoặc đặt mô hình CLI rõ ràng với đường dẫn lệnh đầy đủ.

### Hỗ trợ môi trường proxy (mô hình provider)

Khi hiểu media **âm thanh** và **video** dựa trên provider được bật, OpenClaw tuân thủ các biến môi trường proxy outbound tiêu chuẩn cho các cuộc gọi HTTP của provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Nếu không có biến môi trường proxy nào được đặt, việc hiểu media sử dụng egress trực tiếp. Nếu giá trị proxy bị sai định dạng, OpenClaw ghi lại cảnh báo và quay lại fetch trực tiếp.

## Khả năng (tùy chọn)

Nếu bạn đặt `capabilities`, mục nhập chỉ chạy cho các loại media đó. Đối với danh sách chia sẻ, OpenClaw có thể suy ra mặc định:

- `openai`, `anthropic`, `minimax`: **hình ảnh**
- `moonshot`: **hình ảnh + video**
- `google` (Gemini API): **hình ảnh + âm thanh + video**
- `mistral`: **âm thanh**
- `zai`: **hình ảnh**
- `groq`: **âm thanh**
- `deepgram`: **âm thanh**

Đối với các mục nhập CLI, **đặt `capabilities` rõ ràng** để tránh các kết hợp bất ngờ. Nếu bạn bỏ qua `capabilities`, mục nhập đủ điều kiện cho danh sách mà nó xuất hiện.

## Ma trận hỗ trợ provider (tích hợp OpenClaw)

| Khả năng | Tích hợp provider                                  | Ghi chú                                                                   |
| -------- | -------------------------------------------------- | ------------------------------------------------------------------------- |
| Hình ảnh | OpenAI, Anthropic, Google, MiniMax, Moonshot, Z.AI | Plugin của nhà cung cấp đăng ký hỗ trợ hình ảnh với hiểu media cốt lõi.   |
| Âm thanh | OpenAI, Groq, Deepgram, Google, Mistral            | Chuyển đổi của provider (Whisper/Deepgram/Gemini/Voxtral).                |
| Video    | Google, Moonshot                                   | Hiểu video của provider qua plugin của nhà cung cấp.                      |

## Hướng dẫn chọn mô hình

- Ưu tiên mô hình thế hệ mới mạnh nhất có sẵn cho mỗi khả năng media khi chất lượng và an toàn quan trọng.
- Đối với các agent có công cụ xử lý đầu vào không đáng tin cậy, tránh các mô hình media cũ/yếu hơn.
- Giữ ít nhất một dự phòng cho mỗi khả năng để đảm bảo khả dụng (mô hình chất lượng + mô hình nhanh hơn/rẻ hơn).
- CLI dự phòng (`whisper-cli`, `whisper`, `gemini`) hữu ích khi API của provider không khả dụng.
- Lưu ý `parakeet-mlx`: với `--output-dir`, OpenClaw đọc `<output-dir>/<media-basename>.txt` khi định dạng đầu ra là `txt` (hoặc không xác định); các định dạng không phải `txt` quay lại stdout.

## Chính sách tệp đính kèm

`attachments` theo khả năng kiểm soát tệp đính kèm nào được xử lý:

- `mode`: `first` (mặc định) hoặc `all`
- `maxAttachments`: giới hạn số lượng được xử lý (mặc định **1**)
- `prefer`: `first`, `last`, `path`, `url`

Khi `mode: "all"`, đầu ra được gắn nhãn `[Image 1/2]`, `[Audio 2/2]`, v.v.

## Ví dụ cấu hình

### 1) Danh sách mô hình chia sẻ + ghi đè

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
            "Đọc media tại {{MediaPath}} và mô tả nó trong <= {{MaxChars}} ký tự.",
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

### 2) Chỉ Âm thanh + Video (tắt hình ảnh)

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
              "Đọc media tại {{MediaPath}} và mô tả nó trong <= {{MaxChars}} ký tự.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Hiểu hình ảnh tùy chọn

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
              "Đọc media tại {{MediaPath}} và mô tả nó trong <= {{MaxChars}} ký tự.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Mục nhập đơn đa phương thức (khả năng rõ ràng)

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

## Kết quả trạng thái

Khi hiểu media chạy, `/status` bao gồm một dòng tóm tắt ngắn:

```
📎 Media: hình ảnh ok (openai/gpt-5.2) · âm thanh bị bỏ qua (maxBytes)
```

Điều này hiển thị kết quả theo khả năng và nhà cung cấp/mô hình được chọn khi áp dụng.

## Ghi chú

- Hiểu là **nỗ lực tốt nhất**. Lỗi không chặn trả lời.
- Tệp đính kèm vẫn được chuyển đến mô hình ngay cả khi hiểu bị tắt.
- Sử dụng `scope` để giới hạn nơi hiểu chạy (ví dụ: chỉ DMs).

## Tài liệu liên quan

- [Cấu hình](/gateway/configuration)
- [Hỗ trợ Hình ảnh & Media](/nodes/images)
