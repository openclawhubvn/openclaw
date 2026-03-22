---
summary: "Plugin Voice Call: gọi đi + gọi đến qua Twilio/Telnyx/Plivo (cài đặt plugin + cấu hình + CLI)"
read_when:
  - Muốn thực hiện cuộc gọi đi từ OpenClaw
  - Đang cấu hình hoặc phát triển plugin voice-call
title: "Plugin Voice Call"
---

# Voice Call (plugin)

Plugin Voice Call cho OpenClaw. Hỗ trợ thông báo gọi đi và hội thoại nhiều lượt với chính sách gọi đến.

Các provider hiện tại:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (dev/no network)

Mô hình nhanh:

- Cài plugin
- Khởi động lại Gateway
- Cấu hình tại `plugins.entries.voice-call.config`
- Dùng `openclaw voicecall ...` hoặc công cụ `voice_call`

## Chạy ở đâu (local vs remote)

Plugin Voice Call chạy **bên trong process Gateway**.

Nếu dùng Gateway remote, cài đặt/cấu hình plugin trên **máy chạy Gateway**, sau đó khởi động lại Gateway để tải plugin.

## Cài đặt

### Cách A: cài từ npm (khuyến nghị)

```bash
openclaw plugins install @openclaw/voice-call
```

Khởi động lại Gateway sau đó.

### Cách B: cài từ thư mục local (dev, không copy)

```bash
openclaw plugins install ./extensions/voice-call
cd ./extensions/voice-call && pnpm install
```

Khởi động lại Gateway sau đó.

## Cấu hình

Đặt cấu hình tại `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // hoặc "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            streamPath: "/voice/stream",
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

Lưu ý:

- Twilio/Telnyx cần URL webhook **công khai**.
- Plivo cần URL webhook **công khai**.
- `mock` là provider dev local (không gọi mạng).
- Telnyx cần `telnyx.publicKey` (hoặc `TELNYX_PUBLIC_KEY`) trừ khi `skipSignatureVerification` là true.
- `skipSignatureVerification` chỉ dùng cho test local.
- Nếu dùng ngrok free tier, đặt `publicUrl` là URL ngrok chính xác; luôn kiểm tra chữ ký.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` cho phép webhook Twilio với chữ ký không hợp lệ **chỉ khi** `tunnel.provider="ngrok"` và `serve.bind` là loopback (ngrok local agent). Chỉ dùng cho dev local.
- URL ngrok free tier có thể thay đổi hoặc thêm hành vi interstitial; nếu `publicUrl` lệch, chữ ký Twilio sẽ thất bại. Cho production, ưu tiên domain ổn định hoặc Tailscale funnel.
- Mặc định bảo mật streaming:
  - `streaming.preStartTimeoutMs` đóng socket không gửi frame `start` hợp lệ.
  - `streaming.maxPendingConnections` giới hạn tổng socket pre-start chưa xác thực.
  - `streaming.maxPendingConnectionsPerIp` giới hạn socket pre-start chưa xác thực theo IP nguồn.
  - `streaming.maxConnections` giới hạn tổng socket stream media mở (pending + active).

## Stale call reaper

Dùng `staleCallReaperSeconds` để kết thúc cuộc gọi không nhận được webhook cuối (ví dụ, cuộc gọi chế độ notify không hoàn tất). Mặc định là `0` (tắt).

Khoảng khuyến nghị:

- **Production:** `120`–`300` giây cho luồng kiểu notify.
- Giữ giá trị này **cao hơn `maxDurationSeconds`** để cuộc gọi bình thường có thể kết thúc. Điểm bắt đầu tốt là `maxDurationSeconds + 30–60` giây.

Ví dụ:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Webhook Security

Khi có proxy hoặc tunnel đứng trước Gateway, plugin tái tạo URL công khai để kiểm tra chữ ký. Các tùy chọn này kiểm soát header chuyển tiếp nào được tin cậy.

`webhookSecurity.allowedHosts` cho phép host từ header chuyển tiếp.

`webhookSecurity.trustForwardingHeaders` tin cậy header chuyển tiếp mà không cần danh sách cho phép.

`webhookSecurity.trustedProxyIPs` chỉ tin cậy header chuyển tiếp khi IP remote của request khớp danh sách.

Bảo vệ replay webhook được bật cho Twilio và Plivo. Request webhook hợp lệ bị replay được xác nhận nhưng bỏ qua tác dụng phụ.

Twilio conversation turns bao gồm token mỗi lượt trong callback `<Gather>`, nên callback speech cũ/replay không thể thỏa mãn lượt transcript mới đang chờ.

Ví dụ với host công khai ổn định:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS cho cuộc gọi

Voice Call dùng cấu hình `messages.tts` cốt lõi cho phát âm thanh streaming trong cuộc gọi. Có thể ghi đè trong cấu hình plugin với **cùng cấu trúc** — nó sẽ merge sâu với `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    elevenlabs: {
      voiceId: "pMsXgVXv3BLzUgSXRplE",
      modelId: "eleven_multilingual_v2",
    },
  },
}
```

Lưu ý:

- **Microsoft speech bị bỏ qua cho cuộc gọi voice** (âm thanh telephony cần PCM; transport Microsoft hiện tại không cung cấp output PCM telephony).
- TTS cốt lõi được dùng khi streaming media Twilio được bật; nếu không, cuộc gọi sẽ dùng giọng native của provider.
- Nếu stream media Twilio đã hoạt động, Voice Call không fallback về TwiML `<Say>`. Nếu TTS telephony không khả dụng trong trạng thái đó, yêu cầu phát lại sẽ thất bại thay vì trộn hai đường phát lại.

### Thêm ví dụ

Chỉ dùng TTS cốt lõi (không ghi đè):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      openai: { voice: "alloy" },
    },
  },
}
```

Ghi đè sang ElevenLabs chỉ cho cuộc gọi (giữ mặc định cốt lõi ở nơi khác):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            elevenlabs: {
              apiKey: "elevenlabs_key",
              voiceId: "pMsXgVXv3BLzUgSXRplE",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

Chỉ ghi đè model OpenAI cho cuộc gọi (ví dụ merge sâu):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            openai: {
            model: "gpt-4o-mini-tts",
            voice: "marin",
            },
          },
        },
      },
    },
  },
}
```

## Gọi đến

Chính sách gọi đến mặc định là `disabled`. Để bật gọi đến, đặt:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` là màn hình caller-ID đảm bảo thấp. Plugin chuẩn hóa giá trị `From` do provider cung cấp và so sánh với `allowFrom`. Xác minh webhook xác thực việc chuyển giao của provider và tính toàn vẹn của payload, nhưng không chứng minh quyền sở hữu số gọi PSTN/VoIP. Xem `allowFrom` như lọc caller-ID, không phải nhận dạng caller mạnh.

Phản hồi tự động dùng hệ thống agent. Tinh chỉnh với:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Hợp đồng đầu ra nói

Đối với phản hồi tự động, Voice Call thêm hợp đồng đầu ra nói nghiêm ngặt vào prompt hệ thống:

- `{"spoken":"..."}`

Voice Call sau đó trích xuất văn bản nói một cách phòng thủ:

- Bỏ qua payload được đánh dấu là nội dung lý luận/lỗi.
- Phân tích JSON trực tiếp, JSON fenced, hoặc key `"spoken"` inline.
- Quay lại văn bản thuần và loại bỏ đoạn văn dẫn đầu có khả năng là lập kế hoạch/meta.

Điều này giữ cho phát lại âm thanh tập trung vào văn bản hướng tới người gọi và tránh rò rỉ văn bản lập kế hoạch vào âm thanh.

### Hành vi khởi động hội thoại

Đối với cuộc gọi `conversation` đi, xử lý tin nhắn đầu tiên gắn liền với trạng thái phát lại trực tiếp:

- Hàng đợi barge-in và phản hồi tự động chỉ bị ngăn khi lời chào ban đầu đang phát.
- Nếu phát lại ban đầu thất bại, cuộc gọi trở lại `listening` và tin nhắn đầu tiên vẫn còn trong hàng đợi để thử lại.
- Phát lại ban đầu cho streaming Twilio bắt đầu khi kết nối stream mà không có độ trễ thêm.

### Thời gian chờ ngắt kết nối stream Twilio

Khi stream media Twilio ngắt kết nối, Voice Call chờ `2000ms` trước khi tự động kết thúc cuộc gọi:

- Nếu stream kết nối lại trong khoảng thời gian đó, tự động kết thúc bị hủy.
- Nếu không có stream nào được đăng ký lại sau thời gian chờ, cuộc gọi kết thúc để tránh cuộc gọi hoạt động bị kẹt.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias cho call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # tóm tắt độ trễ lượt từ logs
openclaw voicecall expose --mode funnel
```

`latency` đọc `calls.jsonl` từ đường dẫn lưu trữ voice-call mặc định. Dùng `--file <path>` để chỉ định log khác và `--last <n>` để giới hạn phân tích vào N bản ghi cuối (mặc định 200). Output bao gồm p50/p90/p99 cho độ trễ lượt và thời gian chờ nghe.

## Công cụ Agent

Tên công cụ: `voice_call`

Hành động:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Repo này có tài liệu skill tương ứng tại `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)\n