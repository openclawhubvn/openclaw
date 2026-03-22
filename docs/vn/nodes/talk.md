---
summary: "Chế độ Talk: hội thoại liên tục với ElevenLabs TTS"
read_when:
  - Triển khai chế độ Talk trên macOS/iOS/Android
  - Thay đổi giọng nói/TTS/hành vi ngắt quãng
title: "Chế độ Talk"
---

# Chế độ Talk

Chế độ Talk là một vòng lặp hội thoại giọng nói liên tục:

1. Nghe giọng nói
2. Gửi bản ghi âm đến mô hình (phiên chính, chat.send)
3. Chờ phản hồi
4. Phát lại qua ElevenLabs (phát trực tuyến)

## Hành vi (macOS)

- **Luôn hiển thị** khi chế độ Talk được bật.
- Chuyển pha **Nghe → Suy nghĩ → Nói**.
- Khi có **khoảng dừng ngắn** (cửa sổ im lặng), bản ghi hiện tại sẽ được gửi đi.
- Phản hồi được **viết vào WebChat** (giống như khi gõ).
- **Ngắt quãng khi có giọng nói** (mặc định bật): nếu người dùng bắt đầu nói khi trợ lý đang nói, chúng tôi sẽ dừng phát và ghi lại thời điểm ngắt quãng cho lần nhắc tiếp theo.

## Chỉ thị giọng nói trong phản hồi

Trợ lý có thể thêm một dòng JSON để điều khiển giọng nói:

```json
{ "voice": "<voice-id>", "once": true }
```

Quy tắc:

- Chỉ dòng không rỗng đầu tiên.
- Bỏ qua các khóa không xác định.
- `once: true` chỉ áp dụng cho phản hồi hiện tại.
- Nếu không có `once`, giọng nói sẽ trở thành mặc định mới cho chế độ Talk.
- Dòng JSON sẽ bị loại bỏ trước khi phát TTS.

Các khóa hỗ trợ:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Cấu hình (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Mặc định:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: nếu không đặt, Talk giữ cửa sổ dừng mặc định của nền tảng trước khi gửi bản ghi (`700 ms trên macOS và Android, 900 ms trên iOS`)
- `voiceId`: mặc định là `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (hoặc giọng ElevenLabs đầu tiên khi có khóa API)
- `modelId`: mặc định là `eleven_v3` nếu không đặt
- `apiKey`: mặc định là `ELEVENLABS_API_KEY` (hoặc hồ sơ shell gateway nếu có)
- `outputFormat`: mặc định là `pcm_44100` trên macOS/iOS và `pcm_24000` trên Android (đặt `mp3_*` để buộc phát trực tuyến MP3)

## Giao diện macOS

- Chuyển đổi trên thanh menu: **Talk**
- Tab cấu hình: nhóm **Chế độ Talk** (id giọng nói + chuyển đổi ngắt quãng)
- Overlay:
  - **Nghe**: đám mây nhấp nháy với mức mic
  - **Suy nghĩ**: hoạt ảnh chìm
  - **Nói**: vòng tròn phát ra
  - Nhấp vào đám mây: dừng nói
  - Nhấp vào X: thoát chế độ Talk

## Lưu ý

- Yêu cầu quyền Trợ lý giọng nói + Microphone.
- Sử dụng `chat.send` với khóa phiên `main`.
- TTS sử dụng API phát trực tuyến của ElevenLabs với `ELEVENLABS_API_KEY` và phát lại từng phần trên macOS/iOS/Android để giảm độ trễ.
- `stability` cho `eleven_v3` được xác thực là `0.0`, `0.5`, hoặc `1.0`; các mô hình khác chấp nhận `0..1`.
- `latency_tier` được xác thực là `0..4` khi được đặt.
- Android hỗ trợ các định dạng đầu ra `pcm_16000`, `pcm_22050`, `pcm_24000`, và `pcm_44100` cho phát trực tuyến AudioTrack độ trễ thấp.
