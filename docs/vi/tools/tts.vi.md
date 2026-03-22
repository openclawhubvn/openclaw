---
summary: "Text-to-speech (TTS) cho phản hồi gửi đi"
read_when:
  - Bật text-to-speech cho phản hồi
  - Cấu hình TTS providers hoặc giới hạn
  - Sử dụng lệnh /tts
title: "Text-to-Speech"
---

# Text-to-speech (TTS)

OpenClaw có thể chuyển đổi phản hồi gửi đi thành âm thanh qua ElevenLabs, Microsoft, hoặc OpenAI. Hoạt động ở bất kỳ đâu OpenClaw có thể gửi âm thanh; Telegram sẽ nhận được một voice-note hình tròn.

## Dịch vụ hỗ trợ

- **ElevenLabs** (provider chính hoặc dự phòng)
- **Microsoft** (provider chính hoặc dự phòng; hiện tại dùng `node-edge-tts`, mặc định khi không có API keys)
- **OpenAI** (provider chính hoặc dự phòng; cũng dùng cho tóm tắt)

### Ghi chú về Microsoft speech

Provider Microsoft speech hiện tại sử dụng dịch vụ TTS neural online của Microsoft Edge qua thư viện `node-edge-tts`. Đây là dịch vụ hosted (không chạy local), sử dụng endpoints của Microsoft và không cần API key. `node-edge-tts` cung cấp các tùy chọn cấu hình speech và định dạng output, nhưng không phải tất cả tùy chọn đều được dịch vụ hỗ trợ. Cấu hình cũ và input directive dùng `edge` vẫn hoạt động và được chuẩn hóa thành `microsoft`.

Vì đây là dịch vụ web công cộng không có SLA hoặc quota công bố, nên chỉ nên coi là best-effort. Nếu cần giới hạn và hỗ trợ đảm bảo, hãy dùng OpenAI hoặc ElevenLabs.

## API keys tùy chọn

Nếu muốn dùng OpenAI hoặc ElevenLabs:

- `ELEVENLABS_API_KEY` (hoặc `XI_API_KEY`)
- `OPENAI_API_KEY`

Microsoft speech **không** cần API key. Nếu không tìm thấy API keys, OpenClaw mặc định dùng Microsoft (trừ khi bị vô hiệu hóa qua `messages.tts.microsoft.enabled=false` hoặc `messages.tts.edge.enabled=false`).

Nếu cấu hình nhiều providers, provider được chọn sẽ dùng trước, các provider khác là dự phòng. Auto-summary dùng `summaryModel` đã cấu hình (hoặc `agents.defaults.model.primary`), nên provider đó cũng phải được xác thực nếu bật tóm tắt.

## Liên kết dịch vụ

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Có bật mặc định không?

Không. Auto‑TTS **tắt** mặc định. Bật trong config với `messages.tts.auto` hoặc theo session với `/tts always` (alias: `/tts on`).

Microsoft speech **được** bật mặc định khi TTS bật, và tự động dùng khi không có API keys của OpenAI hoặc ElevenLabs.

## Cấu hình

Cấu hình TTS nằm dưới `messages.tts` trong `openclaw.json`. Schema đầy đủ có trong [Gateway configuration](/gateway/configuration).

### Cấu hình tối thiểu (bật + provider)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI chính với ElevenLabs dự phòng

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
    },
  },
}
```

### Microsoft chính (không cần API key)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      microsoft: {
        enabled: true,
        voice: "en-US-MichelleNeural",
        lang: "en-US",
        outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        rate: "+10%",
        pitch: "-5%",
      },
    },
  },
}
```

### Vô hiệu hóa Microsoft speech

```json5
{
  messages: {
    tts: {
      microsoft: {
        enabled: false,
      },
    },
  },
}
```

### Giới hạn tùy chỉnh + đường dẫn prefs

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Chỉ phản hồi bằng âm thanh sau khi nhận voice note

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Vô hiệu hóa auto-summary cho phản hồi dài

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Sau đó chạy:

```
/tts summary off
```

### Ghi chú về các trường

- `auto`: chế độ auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` chỉ gửi âm thanh sau khi nhận voice note.
  - `tagged` chỉ gửi âm thanh khi phản hồi có tag `[[tts]]`.
- `enabled`: toggle cũ (doctor chuyển sang `auto`).
- `mode`: `"final"` (mặc định) hoặc `"all"` (bao gồm tool/block replies).
- `provider`: id provider speech như `"elevenlabs"`, `"microsoft"`, hoặc `"openai"` (fallback tự động).
- Nếu `provider` **không được đặt**, OpenClaw ưu tiên `openai` (nếu có key), sau đó `elevenlabs` (nếu có key), nếu không thì `microsoft`.
- `summaryModel`: model rẻ cho auto-summary; mặc định là `agents.defaults.model.primary`.
  - Chấp nhận `provider/model` hoặc alias model đã cấu hình.
- `modelOverrides`: cho phép model phát ra TTS directives (bật mặc định).
  - `allowProvider` mặc định là `false` (chuyển provider là opt-in).
- `maxTextLength`: giới hạn cứng cho input TTS (chars). `/tts audio` thất bại nếu vượt quá.
- `timeoutMs`: timeout request (ms).
- `prefsPath`: override đường dẫn JSON prefs local (provider/limit/summary).
- `apiKey` giá trị fallback vào env vars (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `OPENAI_API_KEY`).
- `elevenlabs.baseUrl`: override ElevenLabs API base URL.
- `openai.baseUrl`: override OpenAI TTS endpoint.
  - Thứ tự giải quyết: `messages.tts.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Giá trị không mặc định được coi là OpenAI-compatible TTS endpoints, nên tên model và voice tùy chỉnh được chấp nhận.
- `elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = bình thường)
- `elevenlabs.applyTextNormalization`: `auto|on|off`
- `elevenlabs.languageCode`: 2 chữ cái ISO 639-1 (ví dụ `en`, `de`)
- `elevenlabs.seed`: số nguyên `0..4294967295` (determinism best-effort)
- `microsoft.enabled`: cho phép sử dụng Microsoft speech (mặc định `true`; không cần API key).
- `microsoft.voice`: tên voice neural của Microsoft (ví dụ `en-US-MichelleNeural`).
- `microsoft.lang`: mã ngôn ngữ (ví dụ `en-US`).
- `microsoft.outputFormat`: định dạng output của Microsoft (ví dụ `audio-24khz-48kbitrate-mono-mp3`).
  - Xem Microsoft Speech output formats cho các giá trị hợp lệ; không phải tất cả định dạng đều được hỗ trợ bởi transport dựa trên Edge.
- `microsoft.rate` / `microsoft.pitch` / `microsoft.volume`: chuỗi phần trăm (ví dụ `+10%`, `-5%`).
- `microsoft.saveSubtitles`: ghi JSON subtitles cùng với file âm thanh.
- `microsoft.proxy`: URL proxy cho yêu cầu Microsoft speech.
- `microsoft.timeoutMs`: override timeout request (ms).
- `edge.*`: alias cũ cho cùng các thiết lập Microsoft.

## Overrides dựa trên model (mặc định bật)

Mặc định, model **có thể** phát ra TTS directives cho một phản hồi duy nhất. Khi `messages.tts.auto` là `tagged`, các directives này cần thiết để kích hoạt âm thanh.

Khi bật, model có thể phát ra directives `[[tts:...]]` để override voice cho một phản hồi duy nhất, cùng với block `[[tts:text]]...[[/tts:text]]` tùy chọn để cung cấp các tag biểu cảm (cười, hát, v.v.) chỉ xuất hiện trong âm thanh.

Directives `provider=...` bị bỏ qua trừ khi `modelOverrides.allowProvider: true`.

Ví dụ payload phản hồi:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Các key directive có sẵn (khi bật):

- `provider` (id provider speech đã đăng ký, ví dụ `openai`, `elevenlabs`, hoặc `microsoft`; yêu cầu `allowProvider: true`)
- `voice` (voice OpenAI) hoặc `voiceId` (ElevenLabs)
- `model` (model TTS OpenAI hoặc id model ElevenLabs)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Vô hiệu hóa tất cả model overrides:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Allowlist tùy chọn (bật chuyển provider trong khi giữ các nút khác có thể cấu hình):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Tùy chọn theo người dùng

Lệnh slash ghi đè local vào `prefsPath` (mặc định: `~/.openclaw/settings/tts.json`, override với `OPENCLAW_TTS_PREFS` hoặc `messages.tts.prefsPath`).

Các trường được lưu:

- `enabled`
- `provider`
- `maxLength` (ngưỡng tóm tắt; mặc định 1500 chars)
- `summarize` (mặc định `true`)

Những cái này ghi đè `messages.tts.*` cho host đó.

## Định dạng output (cố định)

- **Telegram**: Opus voice note (`opus_48000_64` từ ElevenLabs, `opus` từ OpenAI).
  - 48kHz / 64kbps là tradeoff tốt cho voice-note và cần thiết cho bubble tròn.
- **Các kênh khác**: MP3 (`mp3_44100_128` từ ElevenLabs, `mp3` từ OpenAI).
  - 44.1kHz / 128kbps là cân bằng mặc định cho độ rõ của speech.
- **Microsoft**: sử dụng `microsoft.outputFormat` (mặc định `audio-24khz-48kbitrate-mono-mp3`).
  - Transport đi kèm chấp nhận `outputFormat`, nhưng không phải tất cả định dạng đều có sẵn từ dịch vụ.
  - Giá trị định dạng output theo Microsoft Speech output formats (bao gồm Ogg/WebM Opus).
  - Telegram `sendVoice` chấp nhận OGG/MP3/M4A; dùng OpenAI/ElevenLabs nếu cần đảm bảo Opus voice notes.
  - Nếu định dạng output Microsoft cấu hình thất bại, OpenClaw thử lại với MP3.

Định dạng OpenAI/ElevenLabs là cố định; Telegram yêu cầu Opus cho UX voice-note.

## Hành vi Auto-TTS

Khi bật, OpenClaw:

- bỏ qua TTS nếu phản hồi đã có media hoặc directive `MEDIA:`.
- bỏ qua phản hồi rất ngắn (< 10 chars).
- tóm tắt phản hồi dài khi bật dùng `agents.defaults.model.primary` (hoặc `summaryModel`).
- đính kèm âm thanh tạo ra vào phản hồi.

Nếu phản hồi vượt quá `maxLength` và tóm tắt tắt (hoặc không có API key cho model tóm tắt), âm thanh bị bỏ qua và gửi phản hồi text bình thường.

## Sơ đồ luồng

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## Sử dụng lệnh Slash

Có một lệnh duy nhất: `/tts`. Xem [Slash commands](/tools/slash-commands) để biết chi tiết bật.

Ghi chú Discord: `/tts` là lệnh tích hợp sẵn của Discord, nên OpenClaw đăng ký `/voice` làm lệnh native ở đó. Text `/tts ...` vẫn hoạt động.

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Ghi chú:

- Lệnh yêu cầu sender được ủy quyền (quy tắc allowlist/owner vẫn áp dụng).
- `commands.text` hoặc đăng ký lệnh native phải được bật.
- `off|always|inbound|tagged` là các toggle theo session (`/tts on` là alias cho `/tts always`).
- `limit` và `summary` được lưu trong prefs local, không phải config chính.
- `/tts audio` tạo một phản hồi âm thanh một lần (không bật TTS).

## Công cụ Agent

Công cụ `tts` chuyển đổi text thành speech và trả về một file đính kèm âm thanh để gửi phản hồi. Khi kết quả tương thích với Telegram, OpenClaw đánh dấu để gửi dưới dạng voice-bubble.

## Gateway RPC

Phương thức Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`\n