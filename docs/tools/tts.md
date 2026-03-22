# Chuyển văn bản thành giọng nói (TTS)

OpenClaw có thể chuyển đổi các phản hồi gửi đi thành âm thanh bằng cách sử dụng ElevenLabs, Microsoft hoặc OpenAI. Tính năng này hoạt động ở bất kỳ nơi nào OpenClaw có thể gửi âm thanh; trên Telegram, nó sẽ xuất hiện dưới dạng một bong bóng ghi chú giọng nói.

## Dịch vụ hỗ trợ

- **ElevenLabs** (nhà cung cấp chính hoặc dự phòng)
- **Microsoft** (nhà cung cấp chính hoặc dự phòng; hiện tại sử dụng `node-edge-tts`, mặc định khi không có khóa API)
- **OpenAI** (nhà cung cấp chính hoặc dự phòng; cũng được sử dụng cho tóm tắt)

### Ghi chú về giọng nói của Microsoft

Nhà cung cấp giọng nói Microsoft hiện tại sử dụng dịch vụ TTS thần kinh trực tuyến của Microsoft Edge thông qua thư viện `node-edge-tts`. Đây là dịch vụ được lưu trữ (không phải cục bộ), sử dụng các điểm cuối của Microsoft và không yêu cầu khóa API. `node-edge-tts` cung cấp các tùy chọn cấu hình giọng nói và định dạng đầu ra, nhưng không phải tất cả các tùy chọn đều được dịch vụ hỗ trợ. Cấu hình cũ và đầu vào chỉ thị sử dụng `edge` vẫn hoạt động và được chuẩn hóa thành `microsoft`.

Vì đây là dịch vụ web công cộng không có SLA hoặc hạn mức công bố, hãy coi nó như một nỗ lực tốt nhất. Nếu cần hạn mức và hỗ trợ đảm bảo, hãy sử dụng OpenAI hoặc ElevenLabs.

## Khóa tùy chọn

Nếu muốn sử dụng OpenAI hoặc ElevenLabs:

- `ELEVENLABS_API_KEY` (hoặc `XI_API_KEY`)
- `OPENAI_API_KEY`

Giọng nói của Microsoft **không** yêu cầu khóa API. Nếu không tìm thấy khóa API, OpenClaw mặc định sử dụng Microsoft (trừ khi bị vô hiệu hóa qua `messages.tts.microsoft.enabled=false` hoặc `messages.tts.edge.enabled=false`).

Nếu cấu hình nhiều nhà cung cấp, nhà cung cấp được chọn sẽ được sử dụng trước và các nhà cung cấp khác là tùy chọn dự phòng. Tóm tắt tự động sử dụng `summaryModel` đã cấu hình (hoặc `agents.defaults.model.primary`), vì vậy nhà cung cấp đó cũng phải được xác thực nếu bạn bật tóm tắt.

## Liên kết dịch vụ

- [Hướng dẫn Text-to-Speech của OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Tham khảo API âm thanh của OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Text to Speech của ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Xác thực ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Định dạng đầu ra giọng nói của Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Có được bật mặc định không?

Không. Tính năng Auto-TTS **tắt** theo mặc định. Bật nó trong cấu hình với `messages.tts.auto` hoặc theo phiên với `/tts always` (bí danh: `/tts on`).

Giọng nói của Microsoft **được** bật mặc định khi TTS được bật và được sử dụng tự động khi không có khóa API của OpenAI hoặc ElevenLabs.

## Cấu hình

Cấu hình TTS nằm dưới `messages.tts` trong `openclaw.json`. Toàn bộ schema có trong [Cấu hình Gateway](/gateway/configuration).

### Cấu hình tối thiểu (bật + nhà cung cấp)

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

### Microsoft chính (không cần khóa API)

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

### Vô hiệu hóa giọng nói của Microsoft

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

### Giới hạn tùy chỉnh + đường dẫn ưu tiên

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

### Chỉ trả lời bằng âm thanh sau khi nhận ghi chú giọng nói

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Vô hiệu hóa tóm tắt tự động cho các phản hồi dài

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

- `auto`: chế độ auto-TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` chỉ gửi âm thanh sau khi nhận ghi chú giọng nói.
  - `tagged` chỉ gửi âm thanh khi phản hồi có thẻ `[[tts]]`.
- `enabled`: chuyển đổi cũ (bác sĩ di chuyển điều này sang `auto`).
- `mode`: `"final"` (mặc định) hoặc `"all"` (bao gồm công cụ/phản hồi khối).
- `provider`: id nhà cung cấp giọng nói như `"elevenlabs"`, `"microsoft"`, hoặc `"openai"` (dự phòng tự động).
- Nếu `provider` **không được đặt**, OpenClaw ưu tiên `openai` (nếu có khóa), sau đó `elevenlabs` (nếu có khóa), nếu không thì `microsoft`.
- `summaryModel`: mô hình rẻ tiền tùy chọn cho tóm tắt tự động; mặc định là `agents.defaults.model.primary`.
  - Chấp nhận `provider/model` hoặc bí danh mô hình đã cấu hình.
- `modelOverrides`: cho phép mô hình phát ra chỉ thị TTS (bật theo mặc định).
  - `allowProvider` mặc định là `false` (chuyển đổi nhà cung cấp là tùy chọn).
- `maxTextLength`: giới hạn cứng cho đầu vào TTS (ký tự). `/tts audio` thất bại nếu vượt quá.
- `timeoutMs`: thời gian chờ yêu cầu (ms).
- `prefsPath`: ghi đè đường dẫn JSON ưu tiên cục bộ (nhà cung cấp/giới hạn/tóm tắt).
- Giá trị `apiKey` dự phòng cho biến môi trường (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `OPENAI_API_KEY`).
- `elevenlabs.baseUrl`: ghi đè URL cơ sở API của ElevenLabs.
- `openai.baseUrl`: ghi đè điểm cuối TTS của OpenAI.
  - Thứ tự giải quyết: `messages.tts.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Các giá trị không mặc định được coi là điểm cuối TTS tương thích với OpenAI, vì vậy tên mô hình và giọng nói tùy chỉnh được chấp nhận.
- `elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = bình thường)
- `elevenlabs.applyTextNormalization`: `auto|on|off`
- `elevenlabs.languageCode`: mã ISO 639-1 gồm 2 chữ cái (ví dụ: `en`, `de`)
- `elevenlabs.seed`: số nguyên `0..4294967295` (xác định tốt nhất có thể)
- `microsoft.enabled`: cho phép sử dụng giọng nói của Microsoft (mặc định `true`; không cần khóa API).
- `microsoft.voice`: tên giọng nói thần kinh của Microsoft (ví dụ: `en-US-MichelleNeural`).
- `microsoft.lang`: mã ngôn ngữ (ví dụ: `en-US`).
- `microsoft.outputFormat`: định dạng đầu ra của Microsoft (ví dụ: `audio-24khz-48kbitrate-mono-mp3`).
  - Xem Định dạng đầu ra giọng nói của Microsoft để biết các giá trị hợp lệ; không phải tất cả các định dạng đều được hỗ trợ bởi phương tiện truyền tải dựa trên Edge.
- `microsoft.rate` / `microsoft.pitch` / `microsoft.volume`: chuỗi phần trăm (ví dụ: `+10%`, `-5%`).
- `microsoft.saveSubtitles`: ghi phụ đề JSON cùng với tệp âm thanh.
- `microsoft.proxy`: URL proxy cho các yêu cầu giọng nói của Microsoft.
- `microsoft.timeoutMs`: ghi đè thời gian chờ yêu cầu (ms).
- `edge.*`: bí danh cũ cho các cài đặt Microsoft tương tự.

## Ghi đè theo mô hình (mặc định bật)

Theo mặc định, mô hình **có thể** phát ra chỉ thị TTS cho một phản hồi duy nhất. Khi `messages.tts.auto` là `tagged`, các chỉ thị này là bắt buộc để kích hoạt âm thanh.

Khi được bật, mô hình có thể phát ra chỉ thị `[[tts:...]]` để ghi đè giọng nói cho một phản hồi duy nhất, cùng với một khối `[[tts:text]]...[[/tts:text]]` tùy chọn để cung cấp các thẻ biểu cảm (cười, hát, v.v.) chỉ xuất hiện trong âm thanh.

Chỉ thị `provider=...` bị bỏ qua trừ khi `modelOverrides.allowProvider: true`.

Ví dụ về payload phản hồi:

```
Đây là của bạn.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](cười) Đọc bài hát một lần nữa.[[/tts:text]]
```

Các khóa chỉ thị có sẵn (khi được bật):

- `provider` (id nhà cung cấp giọng nói đã đăng ký, ví dụ `openai`, `elevenlabs`, hoặc `microsoft`; yêu cầu `allowProvider: true`)
- `voice` (giọng nói OpenAI) hoặc `voiceId` (ElevenLabs)
- `model` (mô hình TTS của OpenAI hoặc id mô hình ElevenLabs)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Vô hiệu hóa tất cả ghi đè mô hình:

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

Danh sách cho phép tùy chọn (bật chuyển đổi nhà cung cấp trong khi giữ các nút khác có thể cấu hình):

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

Các lệnh gạch chéo ghi đè cục bộ vào `prefsPath` (mặc định: `~/.openclaw/settings/tts.json`, ghi đè với `OPENCLAW_TTS_PREFS` hoặc `messages.tts.prefsPath`).

Các trường được lưu trữ:

- `enabled`
- `provider`
- `maxLength` (ngưỡng tóm tắt; mặc định 1500 ký tự)
- `summarize` (mặc định `true`)

Những điều này ghi đè `messages.tts.*` cho máy chủ đó.

## Định dạng đầu ra (cố định)

- **Telegram**: Ghi chú giọng nói Opus (`opus_48000_64` từ ElevenLabs, `opus` từ OpenAI).
  - 48kHz / 64kbps là sự cân bằng tốt cho ghi chú giọng nói và cần thiết cho bong bóng tròn.
- **Các kênh khác**: MP3 (`mp3_44100_128` từ ElevenLabs, `mp3` từ OpenAI).
  - 44.1kHz / 128kbps là sự cân bằng mặc định cho độ rõ của giọng nói.
- **Microsoft**: sử dụng `microsoft.outputFormat` (mặc định `audio-24khz-48kbitrate-mono-mp3`).
  - Phương tiện truyền tải đi kèm chấp nhận một `outputFormat`, nhưng không phải tất cả các định dạng đều có sẵn từ dịch vụ.
  - Các giá trị định dạng đầu ra tuân theo Định dạng đầu ra giọng nói của Microsoft (bao gồm Ogg/WebM Opus).
  - Telegram `sendVoice` chấp nhận OGG/MP3/M4A; sử dụng OpenAI/ElevenLabs nếu bạn cần ghi chú giọng nói Opus đảm bảo.
  - Nếu định dạng đầu ra Microsoft được cấu hình thất bại, OpenClaw sẽ thử lại với MP3.

Các định dạng OpenAI/ElevenLabs là cố định; Telegram yêu cầu Opus cho trải nghiệm ghi chú giọng nói.

## Hành vi Auto-TTS

Khi được bật, OpenClaw:

- bỏ qua TTS nếu phản hồi đã chứa phương tiện hoặc chỉ thị `MEDIA:`.
- bỏ qua các phản hồi rất ngắn (< 10 ký tự).
- tóm tắt các phản hồi dài khi được bật bằng cách sử dụng `agents.defaults.model.primary` (hoặc `summaryModel`).
- đính kèm âm thanh đã tạo vào phản hồi.

Nếu phản hồi vượt quá `maxLength` và tóm tắt bị tắt (hoặc không có khóa API cho mô hình tóm tắt), âm thanh sẽ bị bỏ qua và phản hồi văn bản thông thường sẽ được gửi.

## Sơ đồ luồng

```
Phản hồi -> TTS được bật?
  không  -> gửi văn bản
  có -> có phương tiện / MEDIA: / ngắn?
          có -> gửi văn bản
          không  -> độ dài > giới hạn?
                   không  -> TTS -> đính kèm âm thanh
                   có -> tóm tắt được bật?
                            không  -> gửi văn bản
                            có -> tóm tắt (summaryModel hoặc agents.defaults.model.primary)
                                      -> TTS -> đính kèm âm thanh
```

## Sử dụng lệnh gạch chéo

Có một lệnh duy nhất: `/tts`. Xem [Lệnh gạch chéo](/tools/slash-commands) để biết chi tiết về việc bật.

Ghi chú Discord: `/tts` là lệnh tích hợp sẵn của Discord, vì vậy OpenClaw đăng ký `/voice` làm lệnh gốc ở đó. Văn bản `/tts ...` vẫn hoạt động.

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

- Các lệnh yêu cầu người gửi được ủy quyền (quy tắc danh sách cho phép/chủ sở hữu vẫn áp dụng).
- `commands.text` hoặc đăng ký lệnh gốc phải được bật.
- `off|always|inbound|tagged` là các chuyển đổi theo phiên (`/tts on` là bí danh cho `/tts always`).
- `limit` và `summary` được lưu trữ trong ưu tiên cục bộ, không phải cấu hình chính.
- `/tts audio` tạo một phản hồi âm thanh một lần (không bật TTS).

## Công cụ Agent

Công cụ `tts` chuyển đổi văn bản thành giọng nói và trả về một tệp đính kèm âm thanh để gửi phản hồi. Khi kết quả tương thích với Telegram, OpenClaw đánh dấu nó để gửi dưới dạng bong bóng giọng nói.

## Gateway RPC

Các phương thức Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
