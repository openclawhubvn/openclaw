---
summary: "Tìm hiểu cách cài đặt và cấu hình plugin cuộc gọi thoại qua Twilio, Telnyx, Plivo. Hỗ trợ gọi đi và gọi đến dễ dàng."
read_when:
  - Bạn muốn thực hiện cuộc gọi thoại đi từ OpenClaw
  - Bạn đang cấu hình hoặc phát triển plugin cuộc gọi thoại
title: "Hướng Dẫn Cấu Hình Plugin Cuộc Gọi Thoại"
---

# Cuộc Gọi Thoại (plugin)

Cuộc gọi thoại cho OpenClaw thông qua plugin. Hỗ trợ thông báo đi và hội thoại nhiều lượt với chính sách gọi đến.

Các nhà cung cấp hiện tại:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (dev/không mạng)

Mô hình tư duy nhanh:

- Cài đặt plugin
- Khởi động lại Gateway
- Cấu hình dưới `plugins.entries.voice-call.config`
- Sử dụng `openclaw voicecall ...` hoặc công cụ `voice_call`

## Nơi chạy (local vs remote)

Plugin Cuộc Gọi Thoại chạy **bên trong quá trình Gateway**.

Nếu sử dụng Gateway từ xa, cài đặt/cấu hình plugin trên **máy chạy Gateway**, sau đó khởi động lại Gateway để tải plugin.

## Cài đặt

### Lựa chọn A: cài đặt từ npm (khuyến nghị)

```bash
openclaw plugins install @openclaw/voice-call
```

Khởi động lại Gateway sau đó.

### Lựa chọn B: cài đặt từ thư mục local (dev, không sao chép)

```bash
openclaw plugins install ./extensions/voice-call
cd ./extensions/voice-call && pnpm install
```

Khởi động lại Gateway sau đó.

## Cấu hình

Đặt cấu hình dưới `plugins.entries.voice-call.config`:

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
            // Khóa công khai webhook Telnyx từ Telnyx Mission Control Portal
            // (Chuỗi Base64; cũng có thể được đặt qua TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Máy chủ Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Bảo mật Webhook (khuyến nghị cho tunnel/proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Công khai (chọn một)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

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

- Twilio/Telnyx yêu cầu URL webhook **có thể truy cập công khai**.
- Plivo yêu cầu URL webhook **có thể truy cập công khai**.
- `mock` là nhà cung cấp dev local (không có cuộc gọi mạng).
- Telnyx yêu cầu `telnyx.publicKey` (hoặc `TELNYX_PUBLIC_KEY`) trừ khi `skipSignatureVerification` là true.
- `skipSignatureVerification` chỉ dành cho thử nghiệm local.
- Nếu sử dụng ngrok miễn phí, đặt `publicUrl` thành URL ngrok chính xác; xác minh chữ ký luôn được thực thi.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` cho phép webhook Twilio với chữ ký không hợp lệ **chỉ khi** `tunnel.provider="ngrok"` và `serve.bind` là loopback (ngrok local agent). Chỉ sử dụng cho dev local.
- URL ngrok miễn phí có thể thay đổi hoặc thêm hành vi xen kẽ; nếu `publicUrl` thay đổi, chữ ký Twilio sẽ thất bại. Đối với sản xuất, ưu tiên một tên miền ổn định hoặc Tailscale funnel.
- Mặc định bảo mật streaming:
  - `streaming.preStartTimeoutMs` đóng các socket không bao giờ gửi một khung `start` hợp lệ.
  - `streaming.maxPendingConnections` giới hạn tổng số socket chưa xác thực trước khi bắt đầu.
  - `streaming.maxPendingConnectionsPerIp` giới hạn socket chưa xác thực trước khi bắt đầu theo IP nguồn.
  - `streaming.maxConnections` giới hạn tổng số socket stream media mở (đang chờ + hoạt động).

## Quản lý cuộc gọi cũ

Sử dụng `staleCallReaperSeconds` để kết thúc các cuộc gọi không bao giờ nhận được webhook cuối cùng (ví dụ, các cuộc gọi chế độ thông báo không bao giờ hoàn thành). Mặc định là `0` (vô hiệu hóa).

Phạm vi khuyến nghị:

- **Sản xuất:** `120`–`300` giây cho các luồng kiểu thông báo.
- Giữ giá trị này **cao hơn `maxDurationSeconds`** để các cuộc gọi bình thường có thể hoàn thành. Một điểm khởi đầu tốt là `maxDurationSeconds + 30–60` giây.

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

## Bảo mật Webhook

Khi một proxy hoặc tunnel nằm trước Gateway, plugin sẽ tái tạo URL công khai để xác minh chữ ký. Các tùy chọn này kiểm soát các tiêu đề chuyển tiếp nào được tin cậy.

`webhookSecurity.allowedHosts` cho phép danh sách các host từ tiêu đề chuyển tiếp.

`webhookSecurity.trustForwardingHeaders` tin tưởng các tiêu đề chuyển tiếp mà không cần danh sách cho phép.

`webhookSecurity.trustedProxyIPs` chỉ tin tưởng các tiêu đề chuyển tiếp khi IP từ xa của yêu cầu khớp với danh sách.

Bảo vệ phát lại webhook được kích hoạt cho Twilio và Plivo. Các yêu cầu webhook hợp lệ được phát lại sẽ được công nhận nhưng bỏ qua các tác động phụ.

Các lượt hội thoại Twilio bao gồm một token cho mỗi lượt trong các callback `<Gather>`, do đó các callback lời nói cũ/phát lại không thể thỏa mãn một lượt bản ghi chờ mới hơn.

Ví dụ với một host công khai ổn định:

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

Cuộc Gọi Thoại sử dụng cấu hình `messages.tts` cốt lõi để phát âm thanh trên các cuộc gọi. Bạn có thể ghi đè nó dưới cấu hình plugin với **cùng hình dạng** — nó sẽ hợp nhất sâu với `messages.tts`.

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

- **Microsoft speech bị bỏ qua cho các cuộc gọi thoại** (âm thanh điện thoại cần PCM; hiện tại Microsoft không cung cấp đầu ra PCM cho điện thoại).
- TTS cốt lõi được sử dụng khi streaming media Twilio được kích hoạt; nếu không, các cuộc gọi sẽ sử dụng giọng nói gốc của nhà cung cấp.
- Nếu một stream media Twilio đã hoạt động, Cuộc Gọi Thoại không quay lại TwiML `<Say>`. Nếu TTS điện thoại không khả dụng trong trạng thái đó, yêu cầu phát lại sẽ thất bại thay vì trộn hai đường phát lại.

### Nhiều ví dụ hơn

Chỉ sử dụng TTS cốt lõi (không ghi đè):

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

Ghi đè sang ElevenLabs chỉ cho các cuộc gọi (giữ mặc định cốt lõi ở nơi khác):

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

Chỉ ghi đè mô hình OpenAI cho các cuộc gọi (ví dụ hợp nhất sâu):

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

## Cuộc gọi đến

Chính sách gọi đến mặc định là `disabled`. Để kích hoạt cuộc gọi đến, đặt:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Xin chào! Tôi có thể giúp gì?",
}
```

`inboundPolicy: "allowlist"` là một màn hình ID người gọi có độ tin cậy thấp. Plugin chuẩn hóa giá trị `From` do nhà cung cấp cung cấp và so sánh nó với `allowFrom`. Xác minh webhook xác thực việc giao hàng của nhà cung cấp và tính toàn vẹn của tải trọng, nhưng không chứng minh quyền sở hữu số người gọi PSTN/VoIP. Xem `allowFrom` như là lọc ID người gọi, không phải là nhận dạng người gọi mạnh.

Phản hồi tự động sử dụng hệ thống agent. Điều chỉnh với:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Hợp đồng đầu ra nói

Đối với phản hồi tự động, Cuộc Gọi Thoại thêm một hợp đồng đầu ra nói nghiêm ngặt vào lời nhắc hệ thống:

- `{"spoken":"..."}`

Cuộc Gọi Thoại sau đó trích xuất văn bản lời nói một cách phòng thủ:

- Bỏ qua các tải trọng được đánh dấu là nội dung lý luận/lỗi.
- Phân tích cú pháp JSON trực tiếp, JSON có khung, hoặc các khóa `"spoken"` nội tuyến.
- Quay lại văn bản thuần túy và loại bỏ các đoạn văn dẫn đầu có khả năng lập kế hoạch/meta.

Điều này giữ cho phát lại âm thanh tập trung vào văn bản hướng đến người gọi và tránh rò rỉ văn bản lập kế hoạch vào âm thanh.

### Hành vi khởi động hội thoại

Đối với các cuộc gọi `conversation` đi, xử lý tin nhắn đầu tiên được liên kết với trạng thái phát lại trực tiếp:

- Hàng đợi ngắt lời và phản hồi tự động chỉ bị ngăn chặn trong khi lời chào ban đầu đang phát.
- Nếu phát lại ban đầu thất bại, cuộc gọi sẽ trở lại trạng thái `listening` và tin nhắn ban đầu vẫn được xếp hàng để thử lại.
- Phát lại ban đầu cho streaming Twilio bắt đầu khi kết nối stream mà không có độ trễ thêm.

### Thời gian chờ ngắt kết nối stream Twilio

Khi một stream media Twilio ngắt kết nối, Cuộc Gọi Thoại chờ `2000ms` trước khi tự động kết thúc cuộc gọi:

- Nếu stream kết nối lại trong khoảng thời gian đó, tự động kết thúc sẽ bị hủy.
- Nếu không có stream nào được đăng ký lại sau thời gian chờ, cuộc gọi sẽ kết thúc để ngăn chặn các cuộc gọi hoạt động bị kẹt.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Xin chào từ OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias cho call
openclaw voicecall continue --call-id <id> --message "Có câu hỏi nào không?"
openclaw voicecall speak --call-id <id> --message "Một chút nhé"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # tóm tắt độ trễ lượt từ nhật ký
openclaw voicecall expose --mode funnel
```

`latency` đọc `calls.jsonl` từ đường dẫn lưu trữ cuộc gọi thoại mặc định. Sử dụng `--file <path>` để chỉ định một nhật ký khác và `--last <n>` để giới hạn phân tích vào N bản ghi cuối cùng (mặc định 200). Đầu ra bao gồm p50/p90/p99 cho độ trễ lượt và thời gian chờ nghe.

## Công cụ Agent

Tên công cụ: `voice_call`

Hành động:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Repo này cung cấp một tài liệu kỹ năng tương ứng tại `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
