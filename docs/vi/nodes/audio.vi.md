---
summary: "Cách tải xuống, chuyển đổi giọng nói thành văn bản và chèn vào phản hồi"
read_when:
  - Thay đổi xử lý âm thanh hoặc chuyển đổi giọng nói
title: "Audio và Voice Notes"
---

# Audio / Voice Notes (2026-01-17)

## Hoạt động

- **Hiểu âm thanh**: Nếu bật tính năng hiểu âm thanh (hoặc tự động phát hiện), OpenClaw sẽ:
  1. Tìm file âm thanh đầu tiên (đường dẫn local hoặc URL) và tải xuống nếu cần.
  2. Kiểm tra `maxBytes` trước khi gửi đến từng model.
  3. Chạy model đầu tiên đủ điều kiện (provider hoặc CLI).
  4. Nếu thất bại hoặc bỏ qua (do kích thước/thời gian chờ), thử model tiếp theo.
  5. Thành công thì thay `Body` bằng block `[Audio]` và đặt `{{Transcript}}`.
- **Phân tích lệnh**: Khi chuyển đổi thành công, `CommandBody`/`RawBody` được đặt thành transcript để lệnh slash vẫn hoạt động.
- **Ghi log chi tiết**: Với `--verbose`, ghi log khi chạy chuyển đổi và khi thay thế body.

## Tự động phát hiện (mặc định)

Nếu **không cấu hình model** và `tools.media.audio.enabled` **không** đặt là `false`, OpenClaw tự động phát hiện theo thứ tự sau và dừng ở lựa chọn đầu tiên hoạt động:

1. **Local CLIs** (nếu đã cài đặt)
   - `sherpa-onnx-offline` (cần `SHERPA_ONNX_MODEL_DIR` với encoder/decoder/joiner/tokens)
   - `whisper-cli` (từ `whisper-cpp`; dùng `WHISPER_CPP_MODEL` hoặc model tiny đi kèm)
   - `whisper` (Python CLI; tự động tải model)
2. **Gemini CLI** (`gemini`) dùng `read_many_files`
3. **Provider keys** (OpenAI → Groq → Deepgram → Google)

Để tắt tự động phát hiện, đặt `tools.media.audio.enabled: false`.
Để tùy chỉnh, đặt `tools.media.audio.models`.
Lưu ý: Phát hiện binary là best-effort trên macOS/Linux/Windows; đảm bảo CLI có trong `PATH` (mở rộng `~`), hoặc đặt model CLI cụ thể với đường dẫn đầy đủ.

## Ví dụ cấu hình

### Provider + CLI fallback (OpenAI + Whisper CLI)

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

### Chỉ Provider với scope gating

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

### Chỉ Provider (Deepgram)

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

### Chỉ Provider (Mistral Voxtral)

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

### Echo transcript vào chat (opt-in)

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

- Xác thực provider theo thứ tự chuẩn (auth profiles, env vars, `models.providers.*.apiKey`).
- Deepgram nhận `DEEPGRAM_API_KEY` khi dùng `provider: "deepgram"`.
- Chi tiết setup Deepgram: [Deepgram (audio transcription)](/providers/deepgram).
- Chi tiết setup Mistral: [Mistral](/providers/mistral).
- Audio providers có thể ghi đè `baseUrl`, `headers`, và `providerOptions` qua `tools.media.audio`.
- Giới hạn kích thước mặc định là 20MB (`tools.media.audio.maxBytes`). Audio quá lớn bị bỏ qua và thử model tiếp theo.
- File âm thanh nhỏ/trống dưới 1024 bytes bị bỏ qua trước khi chuyển đổi.
- `maxChars` mặc định cho audio là **không đặt** (full transcript). Đặt `tools.media.audio.maxChars` hoặc `maxChars` cho từng entry để cắt ngắn output.
- OpenAI auto mặc định là `gpt-4o-mini-transcribe`; đặt `model: "gpt-4o-transcribe"` để tăng độ chính xác.
- Dùng `tools.media.audio.attachments` để xử lý nhiều voice notes (`mode: "all"` + `maxAttachments`).
- Transcript có sẵn cho templates dưới dạng `{{Transcript}}`.
- `tools.media.audio.echoTranscript` mặc định tắt; bật để gửi xác nhận transcript về chat gốc trước khi xử lý agent.
- `tools.media.audio.echoFormat` tùy chỉnh văn bản echo (placeholder: `{transcript}`).
- CLI stdout bị giới hạn (5MB); giữ output CLI ngắn gọn.

### Hỗ trợ môi trường proxy

Chuyển đổi âm thanh dựa trên provider tuân theo các biến môi trường proxy outbound chuẩn:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Nếu không có biến môi trường proxy nào được đặt, sử dụng kết nối trực tiếp. Nếu cấu hình proxy sai, OpenClaw ghi log cảnh báo và chuyển sang fetch trực tiếp.

## Phát hiện Mention trong Groups

Khi `requireMention: true` được đặt cho chat nhóm, OpenClaw sẽ chuyển đổi âm thanh **trước** khi kiểm tra mention. Điều này cho phép xử lý voice notes ngay cả khi có chứa mention.

**Cách hoạt động:**

1. Nếu voice message không có text body và nhóm yêu cầu mention, OpenClaw thực hiện chuyển đổi "preflight".
2. Transcript được kiểm tra các mẫu mention (ví dụ: `@BotName`, emoji triggers).
3. Nếu tìm thấy mention, message tiếp tục qua pipeline phản hồi đầy đủ.
4. Transcript được dùng để phát hiện mention để voice notes có thể vượt qua cổng mention.

**Hành vi fallback:**

- Nếu chuyển đổi thất bại trong preflight (timeout, lỗi API, v.v.), message được xử lý dựa trên phát hiện mention chỉ từ text.
- Điều này đảm bảo rằng các message hỗn hợp (text + audio) không bị bỏ qua sai.

**Opt-out theo nhóm/topic Telegram:**

- Đặt `channels.telegram.groups.<chatId>.disableAudioPreflight: true` để bỏ qua kiểm tra mention preflight transcript cho nhóm đó.
- Đặt `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` để ghi đè theo topic (`true` để bỏ qua, `false` để bắt buộc bật).
- Mặc định là `false` (preflight bật khi điều kiện mention-gated khớp).

**Ví dụ:** Một người dùng gửi voice note nói "Hey @Claude, what's the weather?" trong nhóm Telegram với `requireMention: true`. Voice note được chuyển đổi, mention được phát hiện, và agent phản hồi.

## Lưu ý

- Quy tắc scope dùng first-match wins. `chatType` được chuẩn hóa thành `direct`, `group`, hoặc `room`.
- Đảm bảo CLI thoát 0 và in plain text; JSON cần được xử lý qua `jq -r .text`.
- Với `parakeet-mlx`, nếu bạn truyền `--output-dir`, OpenClaw đọc `<output-dir>/<media-basename>.txt` khi `--output-format` là `txt` (hoặc không đặt); các định dạng output không phải `txt` sẽ fallback sang parsing stdout.
- Giữ thời gian chờ hợp lý (`timeoutSeconds`, mặc định 60s) để tránh chặn hàng đợi phản hồi.
- Chuyển đổi preflight chỉ xử lý file âm thanh **đầu tiên** để phát hiện mention. Âm thanh bổ sung được xử lý trong giai đoạn hiểu media chính.\n