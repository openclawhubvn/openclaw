---
summary: "Khám phá cách tải xuống và chuyển đổi giọng nói thành văn bản, tích hợp vào phản hồi dễ dàng và hiệu quả."
read_when:
  - Thay đổi chuyển đổi âm thanh hoặc xử lý media
title: "Hướng Dẫn Chuyển Đổi Âm Thanh Thành Văn Bản"
---

# Âm thanh / Ghi chú Giọng nói (2026-01-17)

## Hoạt động như thế nào

- **Hiểu media (âm thanh)**: Nếu tính năng hiểu âm thanh được bật (hoặc tự động phát hiện), OpenClaw sẽ:
  1. Xác định tệp âm thanh đính kèm đầu tiên (đường dẫn cục bộ hoặc URL) và tải xuống nếu cần.
  2. Kiểm tra `maxBytes` trước khi gửi đến mỗi mô hình.
  3. Chạy mô hình đầu tiên đủ điều kiện theo thứ tự (nhà cung cấp hoặc CLI).
  4. Nếu thất bại hoặc bỏ qua (do kích thước/thời gian chờ), thử mô hình tiếp theo.
  5. Khi thành công, thay thế `Body` bằng khối `[Audio]` và đặt `{{Transcript}}`.
- **Phân tích lệnh**: Khi chuyển đổi thành công, `CommandBody`/`RawBody` được đặt thành bản chuyển đổi để các lệnh slash vẫn hoạt động.
- **Ghi nhật ký chi tiết**: Trong chế độ `--verbose`, ghi lại khi chuyển đổi chạy và khi thay thế nội dung.

## Tự động phát hiện (mặc định)

Nếu **không cấu hình mô hình** và `tools.media.audio.enabled` **không** được đặt thành `false`, OpenClaw tự động phát hiện theo thứ tự sau và dừng lại ở tùy chọn đầu tiên hoạt động:

1. **CLI cục bộ** (nếu đã cài đặt)
   - `sherpa-onnx-offline` (yêu cầu `SHERPA_ONNX_MODEL_DIR` với encoder/decoder/joiner/tokens)
   - `whisper-cli` (từ `whisper-cpp`; sử dụng `WHISPER_CPP_MODEL` hoặc mô hình nhỏ đi kèm)
   - `whisper` (Python CLI; tự động tải xuống mô hình)
2. **Gemini CLI** (`gemini`) sử dụng `read_many_files`
3. **Khóa nhà cung cấp** (OpenAI → Groq → Deepgram → Google)

Để tắt tự động phát hiện, đặt `tools.media.audio.enabled: false`.
Để tùy chỉnh, đặt `tools.media.audio.models`.
Lưu ý: Phát hiện nhị phân là nỗ lực tốt nhất trên macOS/Linux/Windows; đảm bảo CLI có trong `PATH` (mở rộng `~`), hoặc đặt mô hình CLI rõ ràng với đường dẫn lệnh đầy đủ.

## Ví dụ cấu hình

### Nhà cung cấp + CLI dự phòng (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Chỉ nhà cung cấp với giới hạn phạm vi

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Chỉ nhà cung cấp (Deepgram)

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

### Chỉ nhà cung cấp (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Phản hồi bản chuyển đổi vào chat (tùy chọn)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // mặc định là false
        echoFormat: '📝 "{transcript}"', // tùy chọn, hỗ trợ {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Ghi chú & giới hạn

- Xác thực nhà cung cấp tuân theo thứ tự xác thực mô hình tiêu chuẩn (hồ sơ xác thực, biến môi trường, `models.providers.*.apiKey`).
- Deepgram sử dụng `DEEPGRAM_API_KEY` khi `provider: "deepgram"` được sử dụng.
- Chi tiết thiết lập Deepgram: [Deepgram (chuyển đổi âm thanh)](/providers/deepgram).
- Chi tiết thiết lập Mistral: [Mistral](/providers/mistral).
- Các nhà cung cấp âm thanh có thể ghi đè `baseUrl`, `headers`, và `providerOptions` thông qua `tools.media.audio`.
- Giới hạn kích thước mặc định là 20MB (`tools.media.audio.maxBytes`). Tệp âm thanh quá lớn sẽ bị bỏ qua cho mô hình đó và thử mục tiếp theo.
- Tệp âm thanh nhỏ/trống dưới 1024 byte sẽ bị bỏ qua trước khi chuyển đổi nhà cung cấp/CLI.
- `maxChars` mặc định cho âm thanh là **không đặt** (bản chuyển đổi đầy đủ). Đặt `tools.media.audio.maxChars` hoặc `maxChars` cho từng mục để cắt ngắn đầu ra.
- Mặc định tự động của OpenAI là `gpt-4o-mini-transcribe`; đặt `model: "gpt-4o-transcribe"` để có độ chính xác cao hơn.
- Sử dụng `tools.media.audio.attachments` để xử lý nhiều ghi chú giọng nói (`mode: "all"` + `maxAttachments`).
- Bản chuyển đổi có sẵn cho mẫu dưới dạng `{{Transcript}}`.
- `tools.media.audio.echoTranscript` mặc định là tắt; bật để gửi xác nhận bản chuyển đổi trở lại cuộc trò chuyện gốc trước khi xử lý tác nhân.
- `tools.media.audio.echoFormat` tùy chỉnh văn bản phản hồi (chỗ dành sẵn: `{transcript}`).
- Đầu ra CLI bị giới hạn (5MB); giữ đầu ra CLI ngắn gọn.

### Hỗ trợ môi trường proxy

Chuyển đổi âm thanh dựa trên nhà cung cấp tuân theo các biến môi trường proxy outbound tiêu chuẩn:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Nếu không có biến môi trường proxy nào được đặt, sử dụng kết nối trực tiếp. Nếu cấu hình proxy bị lỗi, OpenClaw ghi lại cảnh báo và quay lại lấy trực tiếp.

## Phát hiện Đề cập trong Nhóm

Khi `requireMention: true` được đặt cho cuộc trò chuyện nhóm, OpenClaw hiện chuyển đổi âm thanh **trước** khi kiểm tra đề cập. Điều này cho phép xử lý ghi chú giọng nói ngay cả khi chúng chứa đề cập.

**Cách hoạt động:**

1. Nếu một tin nhắn giọng nói không có nội dung văn bản và nhóm yêu cầu đề cập, OpenClaw thực hiện chuyển đổi "kiểm tra trước".
2. Bản chuyển đổi được kiểm tra các mẫu đề cập (ví dụ: `@BotName`, biểu tượng cảm xúc kích hoạt).
3. Nếu tìm thấy đề cập, tin nhắn sẽ tiếp tục qua toàn bộ quy trình phản hồi.
4. Bản chuyển đổi được sử dụng để phát hiện đề cập để ghi chú giọng nói có thể vượt qua cổng đề cập.

**Hành vi dự phòng:**

- Nếu chuyển đổi thất bại trong quá trình kiểm tra trước (thời gian chờ, lỗi API, v.v.), tin nhắn được xử lý dựa trên phát hiện đề cập chỉ có văn bản.
- Điều này đảm bảo rằng các tin nhắn hỗn hợp (văn bản + âm thanh) không bao giờ bị bỏ qua sai.

**Tùy chọn không tham gia cho từng nhóm/chủ đề Telegram:**

- Đặt `channels.telegram.groups.<chatId>.disableAudioPreflight: true` để bỏ qua kiểm tra trước bản chuyển đổi đề cập cho nhóm đó.
- Đặt `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` để ghi đè theo chủ đề (`true` để bỏ qua, `false` để buộc bật).
- Mặc định là `false` (kiểm tra trước được bật khi điều kiện yêu cầu đề cập khớp).

**Ví dụ:** Một người dùng gửi ghi chú giọng nói nói "Hey @Claude, what's the weather?" trong một nhóm Telegram với `requireMention: true`. Ghi chú giọng nói được chuyển đổi, đề cập được phát hiện và tác nhân phản hồi.

## Lưu ý

- Quy tắc phạm vi sử dụng nguyên tắc "khớp đầu tiên thắng". `chatType` được chuẩn hóa thành `direct`, `group`, hoặc `room`.
- Đảm bảo CLI của bạn thoát 0 và in văn bản thuần túy; JSON cần được xử lý qua `jq -r .text`.
- Đối với `parakeet-mlx`, nếu bạn truyền `--output-dir`, OpenClaw đọc `<output-dir>/<media-basename>.txt` khi `--output-format` là `txt` (hoặc bị bỏ qua); các định dạng đầu ra không phải `txt` quay lại phân tích cú pháp stdout.
- Giữ thời gian chờ hợp lý (`timeoutSeconds`, mặc định 60s) để tránh chặn hàng đợi phản hồi.
- Chuyển đổi kiểm tra trước chỉ xử lý tệp âm thanh đính kèm **đầu tiên** để phát hiện đề cập. Âm thanh bổ sung được xử lý trong giai đoạn hiểu media chính.
