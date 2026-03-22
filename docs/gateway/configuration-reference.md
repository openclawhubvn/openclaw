---
title: "Hướng Dẫn Cấu Hình OpenClaw Gateway"
summary: "Khám phá chi tiết các khóa cấu hình OpenClaw Gateway, giá trị mặc định và cách cài đặt hiệu quả."
read_when:
  - Cần chính xác ngữ nghĩa cấu hình cấp trường hoặc giá trị mặc định
  - Đang xác thực các khối cấu hình kênh, mô hình, gateway hoặc công cụ
---

# Tham Khảo Cấu Hình

Mọi trường có sẵn trong `~/.openclaw/openclaw.json`. Để có cái nhìn tổng quan theo nhiệm vụ, xem [Cấu Hình](/gateway/configuration).

Định dạng cấu hình là **JSON5** (cho phép chú thích và dấu phẩy cuối). Tất cả các trường đều không bắt buộc — OpenClaw sử dụng giá trị mặc định an toàn khi không có.

---

## Kênh

Mỗi kênh tự động khởi động khi phần cấu hình của nó tồn tại (trừ khi `enabled: false`).

### Truy cập DM và nhóm

Tất cả các kênh hỗ trợ chính sách DM và chính sách nhóm:

| Chính sách DM        | Hành vi                                                        |
| -------------------- | -------------------------------------------------------------- |
| `pairing` (mặc định) | Người gửi không xác định nhận mã ghép nối một lần; chủ sở hữu phải phê duyệt |
| `allowlist`          | Chỉ những người gửi trong `allowFrom` (hoặc cửa hàng ghép nối cho phép) |
| `open`               | Cho phép tất cả DM đến (yêu cầu `allowFrom: ["*"]`)            |
| `disabled`           | Bỏ qua tất cả DM đến                                           |

| Chính sách nhóm       | Hành vi                                               |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (mặc định)| Chỉ các nhóm khớp với danh sách cho phép đã cấu hình |
| `open`                | Bỏ qua danh sách cho phép nhóm (vẫn áp dụng việc kiểm soát nhắc đến) |
| `disabled`            | Chặn tất cả tin nhắn nhóm/phòng                       |

<Note>
`channels.defaults.groupPolicy` thiết lập mặc định khi `groupPolicy` của nhà cung cấp không được đặt.
Mã ghép nối hết hạn sau 1 giờ. Yêu cầu ghép nối DM đang chờ bị giới hạn ở **3 mỗi kênh**.
Nếu một khối nhà cung cấp hoàn toàn thiếu (`channels.<provider>` không có), chính sách nhóm khi chạy sẽ quay lại `allowlist` (thất bại-đóng) với cảnh báo khi khởi động.
</Note>

### Ghi đè mô hình kênh

Sử dụng `channels.modelByChannel` để gán ID kênh cụ thể vào một mô hình. Giá trị chấp nhận `provider/model` hoặc bí danh mô hình đã cấu hình. Ánh xạ kênh áp dụng khi một phiên chưa có ghi đè mô hình (ví dụ, được đặt qua `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Mặc định kênh và nhịp tim

Sử dụng `channels.defaults` cho chính sách nhóm chia sẻ và hành vi nhịp tim trên các nhà cung cấp:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: chính sách nhóm dự phòng khi `groupPolicy` cấp nhà cung cấp không được đặt.
- `channels.defaults.heartbeat.showOk`: bao gồm trạng thái kênh khỏe mạnh trong đầu ra nhịp tim.
- `channels.defaults.heartbeat.showAlerts`: bao gồm trạng thái suy giảm/lỗi trong đầu ra nhịp tim.
- `channels.defaults.heartbeat.useIndicator`: hiển thị đầu ra nhịp tim kiểu chỉ báo gọn.

### WhatsApp

WhatsApp chạy qua kênh web của gateway (Baileys Web). Nó tự động khởi động khi một phiên liên kết tồn tại.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // dấu tích xanh (false trong chế độ tự-chat)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp đa tài khoản">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Lệnh đi ra mặc định cho tài khoản `default` nếu có; nếu không thì tài khoản id đầu tiên được cấu hình (đã sắp xếp).
- `channels.whatsapp.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.
- Thư mục xác thực Baileys đơn tài khoản cũ được di chuyển bởi `openclaw doctor` vào `whatsapp/default`.
- Ghi đè theo tài khoản: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Giữ câu trả lời ngắn gọn.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Giữ đúng chủ đề.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Sao lưu Git" },
        { command: "generate", description: "Tạo một hình ảnh" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (mặc định: off)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token bot: `channels.telegram.botToken` hoặc `channels.telegram.tokenFile` (chỉ file thường; symlinks bị từ chối), với `TELEGRAM_BOT_TOKEN` là dự phòng cho tài khoản mặc định.
- `channels.telegram.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.
- Trong các thiết lập đa tài khoản (2+ id tài khoản), đặt một mặc định rõ ràng (`channels.telegram.defaultAccount` hoặc `channels.telegram.accounts.default`) để tránh định tuyến dự phòng; `openclaw doctor` cảnh báo khi điều này thiếu hoặc không hợp lệ.
- `configWrites: false` chặn các ghi cấu hình khởi tạo từ Telegram (di chuyển ID siêu nhóm, `/config set|unset`).
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` cấu hình các ràng buộc ACP liên tục cho các chủ đề diễn đàn (sử dụng `chatId:topic:topicId` chuẩn trong `match.peer.id`). Ngữ nghĩa trường được chia sẻ trong [ACP Agents](/tools/acp-agents#channel-specific-settings).
- Xem trước luồng Telegram sử dụng `sendMessage` + `editMessageText` (hoạt động trong các cuộc trò chuyện trực tiếp và nhóm).
- Chính sách thử lại: xem [Chính sách thử lại](/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Chỉ trả lời ngắn gọn.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token: `channels.discord.token`, với `DISCORD_BOT_TOKEN` là dự phòng cho tài khoản mặc định.
- Các cuộc gọi đi trực tiếp cung cấp một `token` Discord rõ ràng sử dụng token đó cho cuộc gọi; cài đặt chính sách/thử lại tài khoản vẫn đến từ tài khoản đã chọn trong ảnh chụp nhanh runtime đang hoạt động.
- `channels.discord.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.
- Sử dụng `user:<id>` (DM) hoặc `channel:<id>` (kênh guild) cho các mục tiêu giao hàng; các ID số không có sẽ bị từ chối.
- Các slug guild là chữ thường với khoảng trắng được thay thế bằng `-`; các khóa kênh sử dụng tên slug (không có `#`). Ưu tiên ID guild.
- Tin nhắn do bot tạo ra bị bỏ qua theo mặc định. `allowBots: true` cho phép chúng; sử dụng `allowBots: "mentions"` để chỉ chấp nhận tin nhắn bot nhắc đến bot (các tin nhắn của chính mình vẫn bị lọc).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (và ghi đè kênh) bỏ qua các tin nhắn nhắc đến người dùng hoặc vai trò khác nhưng không nhắc đến bot (trừ @everyone/@here).
- `maxLinesPerMessage` (mặc định 17) chia các tin nhắn cao ngay cả khi dưới 2000 ký tự.
- `channels.discord.threadBindings` kiểm soát định tuyến ràng buộc luồng Discord:
  - `enabled`: ghi đè Discord cho các tính năng phiên ràng buộc luồng (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, và giao hàng/routing ràng buộc)
  - `idleHours`: ghi đè Discord cho tự động không tập trung khi không hoạt động trong giờ (`0` vô hiệu hóa)
  - `maxAgeHours`: ghi đè Discord cho tuổi tối đa cứng trong giờ (`0` vô hiệu hóa)
  - `spawnSubagentSessions`: công tắc opt-in cho `sessions_spawn({ thread: true })` tạo/binding luồng tự động
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` cấu hình các ràng buộc ACP liên tục cho các kênh và luồng (sử dụng id kênh/luồng trong `match.peer.id`). Ngữ nghĩa trường được chia sẻ trong [ACP Agents](/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` đặt màu nhấn cho các container thành phần Discord v2.
- `channels.discord.voice` cho phép các cuộc trò chuyện kênh thoại Discord và tùy chọn tự động tham gia + ghi đè TTS.
- `channels.discord.voice.daveEncryption` và `channels.discord.voice.decryptionFailureTolerance` truyền qua các tùy chọn DAVE của `@discordjs/voice` (`true` và `24` theo mặc định).
- OpenClaw cũng cố gắng khôi phục nhận giọng nói bằng cách rời khỏi/tham gia lại một phiên giọng nói sau khi thất bại giải mã lặp lại.
- `channels.discord.streaming` là khóa chế độ luồng chuẩn. Các giá trị `streamMode` và `streaming` boolean cũ được tự động di chuyển.
- `channels.discord.autoPresence` ánh xạ khả năng runtime thành sự hiện diện của bot (khỏe mạnh => online, suy giảm => idle, kiệt sức => dnd) và cho phép ghi đè văn bản trạng thái tùy chọn.
- `channels.discord.dangerouslyAllowNameMatching` bật lại khớp tên/tag có thể thay đổi (chế độ tương thích phá vỡ kính).

**Chế độ thông báo phản ứng:** `off` (không có), `own` (tin nhắn của bot, mặc định), `all` (tất cả tin nhắn), `allowlist` (từ `guilds.<id>.users` trên tất cả tin nhắn).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- Tài khoản dịch vụ JSON: nội tuyến (`serviceAccount`) hoặc dựa trên file (`serviceAccountFile`).
- Tài khoản dịch vụ SecretRef cũng được hỗ trợ (`serviceAccountRef`).
- Dự phòng môi trường: `GOOGLE_CHAT_SERVICE_ACCOUNT` hoặc `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Sử dụng `spaces/<spaceId>` hoặc `users/<userId>` cho các mục tiêu giao hàng.
- `channels.googlechat.dangerouslyAllowNameMatching` bật lại khớp nguyên tắc email có thể thay đổi (chế độ tương thích phá vỡ kính).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Chỉ trả lời ngắn gọn.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (chế độ xem trước)
      nativeStreaming: true, // sử dụng API luồng gốc Slack khi streaming=partial
      mediaMaxMb: 20,
    },
  },
}
```

- **Chế độ Socket** yêu cầu cả `botToken` và `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` cho dự phòng môi trường tài khoản mặc định).
- **Chế độ HTTP** yêu cầu `botToken` cộng với `signingSecret` (ở gốc hoặc theo tài khoản).
- `configWrites: false` chặn các ghi cấu hình khởi tạo từ Slack.
- `channels.slack.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.
- `channels.slack.streaming` là khóa chế độ luồng chuẩn. Các giá trị `streamMode` và `streaming` boolean cũ được tự động di chuyển.
- Sử dụng `user:<id>` (DM) hoặc `channel:<id>` cho các mục tiêu giao hàng.

**Chế độ thông báo phản ứng:** `off`, `own` (mặc định), `all`, `allowlist` (từ `reactionAllowlist`).

**Cách ly phiên luồng:** `thread.historyScope` là theo luồng (mặc định) hoặc chia sẻ trên kênh. `thread.inheritParent` sao chép bản ghi kênh cha vào các luồng mới.

- `typingReaction` thêm một phản ứng tạm thời vào tin nhắn Slack đến trong khi một câu trả lời đang chạy, sau đó loại bỏ nó khi hoàn thành. Sử dụng mã ngắn emoji Slack như `"hourglass_flowing_sand"`.

| Nhóm hành động | Mặc định | Ghi chú                  |
| -------------- | ------- | ------------------------ |
| reactions      | enabled | Phản ứng + danh sách phản ứng |
| messages       | enabled | Đọc/gửi/chỉnh sửa/xóa    |
| pins           | enabled | Ghim/bỏ ghim/danh sách   |
| memberInfo     | enabled | Thông tin thành viên     |
| emojiList      | enabled | Danh sách emoji tùy chỉnh|

### Mattermost

Mattermost được cung cấp dưới dạng plugin: `openclaw plugins install @openclaw/mattermost`.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL rõ ràng tùy chọn cho các triển khai reverse-proxy/public
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Chế độ chat: `oncall` (phản hồi khi được @-mention, mặc định), `onmessage` (mỗi tin nhắn), `onchar` (tin nhắn bắt đầu với tiền tố kích hoạt).

Khi các lệnh gốc Mattermost được bật:

- `commands.callbackPath` phải là một đường dẫn (ví dụ `/api/channels/mattermost/command`), không phải là một URL đầy đủ.
- `commands.callbackUrl` phải giải quyết đến điểm cuối gateway OpenClaw và có thể truy cập từ máy chủ Mattermost.
- Đối với các máy chủ callback riêng/tailnet/nội bộ, Mattermost có thể yêu cầu
  `ServiceSettings.AllowedUntrustedInternalConnections` để bao gồm máy chủ/tên miền callback.
  Sử dụng giá trị máy chủ/tên miền, không phải URL đầy đủ.
- `channels.mattermost.configWrites`: cho phép hoặc từ chối các ghi cấu hình khởi tạo từ Mattermost.
- `channels.mattermost.requireMention`: yêu cầu `@mention` trước khi trả lời trong các kênh.
- `channels.mattermost.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // ràng buộc tài khoản tùy chọn
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Chế độ thông báo phản ứng:** `off`, `own` (mặc định), `all`, `allowlist` (từ `reactionAllowlist`).

- `channels.signal.account`: gán khởi động kênh vào một danh tính tài khoản Signal cụ thể.
- `channels.signal.configWrites`: cho phép hoặc từ chối các ghi cấu hình khởi tạo từ Signal.
- `channels.signal.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.

### BlueBubbles

BlueBubbles là đường dẫn iMessage được khuyến nghị (hỗ trợ plugin, cấu hình dưới `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, điều khiển nhóm và hành động nâng cao:
      // xem /channels/bluebubbles
    },
  },
}
```

- Các đường dẫn khóa cốt lõi được bao phủ ở đây: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.
- Cấu hình kênh BlueBubbles đầy đủ được tài liệu trong [BlueBubbles](/channels/bluebubbles).

### iMessage

OpenClaw khởi chạy `imsg rpc` (JSON-RPC qua stdio). Không cần daemon hoặc cổng.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- `channels.imessage.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.

- Yêu cầu Quyền Truy cập Đĩa Đầy đủ vào DB Tin nhắn.
- Ưu tiên các mục tiêu `chat_id:<id>`. Sử dụng `imsg chats --limit 20` để liệt kê các cuộc trò chuyện.
- `cliPath` có thể trỏ đến một trình bao SSH; đặt `remoteHost` (`host` hoặc `user@host`) để lấy tệp đính kèm SCP.
- `attachmentRoots` và `remoteAttachmentRoots` hạn chế các đường dẫn tệp đính kèm đến (mặc định: `/Users/*/Library/Messages/Attachments`).
- SCP sử dụng kiểm tra khóa máy chủ nghiêm ngặt, vì vậy hãy đảm bảo khóa máy chủ chuyển tiếp đã tồn tại trong `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: cho phép hoặc từ chối các ghi cấu hình khởi tạo từ iMessage.

<Accordion title="Ví dụ trình bao SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Microsoft Teams

Microsoft Teams được hỗ trợ mở rộng và cấu hình dưới `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, chính sách nhóm/kênh:
      // xem /channels/msteams
    },
  },
}
```

- Các đường dẫn khóa cốt lõi được bao phủ ở đây: `channels.msteams`, `channels.msteams.configWrites`.
- Cấu hình Teams đầy đủ (thông tin xác thực, webhook, chính sách DM/nhóm, ghi đè theo nhóm/kênh) được tài liệu trong [Microsoft Teams](/channels/msteams).

### IRC

IRC được hỗ trợ mở rộng và cấu hình dưới `channels.irc`.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Các đường dẫn khóa cốt lõi được bao phủ ở đây: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.
- Cấu hình kênh IRC đầy đủ (host/port/TLS/channels/allowlists/mention gating) được tài liệu trong [IRC](/channels/irc).

### Đa tài khoản (tất cả các kênh)

Chạy nhiều tài khoản cho mỗi kênh (mỗi tài khoản có `accountId` riêng):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` được sử dụng khi `accountId` bị bỏ qua (CLI + định tuyến).
- Các token môi trường chỉ áp dụng cho tài khoản **mặc định**.
- Cài đặt kênh cơ bản áp dụng cho tất cả các tài khoản trừ khi bị ghi đè theo tài khoản.
- Sử dụng `bindings[].match.accountId` để định tuyến mỗi tài khoản đến một agent khác nhau.
- Nếu bạn thêm một tài khoản không mặc định qua `openclaw channels add` (hoặc onboarding kênh) trong khi vẫn ở cấu hình kênh cấp cao nhất đơn tài khoản, OpenClaw di chuyển các giá trị đơn tài khoản cấp cao nhất theo phạm vi tài khoản vào `channels.<channel>.accounts.default` trước để tài khoản gốc tiếp tục hoạt động.
- Các ràng buộc chỉ có kênh hiện có (không có `accountId`) vẫn khớp với tài khoản mặc định; các ràng buộc theo phạm vi tài khoản vẫn là tùy chọn.
- `openclaw doctor --fix` cũng sửa chữa các hình dạng hỗn hợp bằng cách di chuyển các giá trị đơn tài khoản cấp cao nhất theo phạm vi tài khoản vào `accounts.default` khi các tài khoản được đặt tên tồn tại nhưng `default` bị thiếu.

### Các kênh mở rộng khác

Nhiều kênh mở rộng được cấu hình dưới dạng `channels.<id>` và được tài liệu trong các trang kênh chuyên dụng của chúng (ví dụ Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, và Twitch).
Xem chỉ mục kênh đầy đủ: [Channels](/channels).

### Kiểm soát nhắc đến trong chat nhóm

Tin nhắn nhóm mặc định là **yêu cầu nhắc đến** (nhắc đến metadata hoặc mẫu regex an toàn). Áp dụng cho các cuộc trò chuyện nhóm WhatsApp, Telegram, Discord, Google Chat, và iMessage.

**Loại nhắc đến:**

- **Nhắc đến metadata**: Nhắc đến @-native của nền tảng. Bị bỏ qua trong chế độ tự-chat WhatsApp.
- **Mẫu văn bản**: Mẫu regex an toàn trong `agents.list[].groupChat.mentionPatterns`. Các mẫu không hợp lệ và lặp lại lồng ghép không an toàn bị bỏ qua.
- Kiểm soát nhắc đến chỉ được thực thi khi phát hiện là có thể (nhắc đến native hoặc ít nhất một mẫu).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` đặt mặc định toàn cầu. Các kênh có thể ghi đè với `channels.<channel>.historyLimit` (hoặc theo tài khoản). Đặt `0` để vô hiệu hóa.

#### Giới hạn lịch sử DM

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Giải pháp: ghi đè theo DM → mặc định nhà cung cấp → không giới hạn (tất cả được giữ lại).

Hỗ trợ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Chế độ tự-chat

Bao gồm số của bạn trong `allowFrom` để bật chế độ tự-chat (bỏ qua nhắc đến @-native, chỉ phản hồi các mẫu văn bản):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Lệnh (xử lý lệnh chat)

```json5
{
  commands: {
    native: "auto", // đăng ký lệnh gốc khi được hỗ trợ
    text: true, // phân tích /commands trong tin nhắn chat
    bash: false, // cho phép ! (bí danh: /bash)
    bashForegroundMs: 2000,
    config: false, // cho phép /config
    debug: false, // cho phép /debug
    restart: false, // cho phép /restart + công cụ khởi động lại gateway
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Chi tiết lệnh">

- Lệnh văn bản phải là **tin nhắn độc lập** với dấu `/` đầu tiên.
- `native: "auto"` bật lệnh gốc cho Discord/Telegram, để Slack tắt.
- Ghi đè theo kênh: `channels.discord.commands.native` (bool hoặc `"auto"`). `false` xóa các lệnh đã đăng ký trước đó.
- `channels.telegram.customCommands` thêm các mục menu bot Telegram bổ sung.
- `bash: true` bật `! <cmd>` cho shell máy chủ. Yêu cầu `tools.elevated.enabled` và người gửi trong `tools.elevated.allowFrom.<channel>`.
- `config: true` bật `/config` (đọc/ghi `openclaw.json`). Đối với các khách hàng `chat.send` của gateway, các ghi `/config set|unset` bền vững cũng yêu cầu `operator.admin`; `/config show` chỉ đọc vẫn có sẵn cho các khách hàng operator có quyền ghi bình thường.
- `channels.<provider>.configWrites` cổng các biến đổi cấu hình theo kênh (mặc định: true).
- Đối với các kênh đa tài khoản, `channels.<provider>.accounts.<id>.configWrites` cũng cổng các ghi nhắm mục tiêu tài khoản đó (ví dụ `/allowlist --config --account <id>` hoặc `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` là theo nhà cung cấp. Khi được đặt, nó là nguồn ủy quyền **duy nhất** (danh sách cho phép/ghép nối kênh và `useAccessGroups` bị bỏ qua).
- `useAccessGroups: false` cho phép các lệnh bỏ qua các chính sách nhóm truy cập khi `allowFrom` không được đặt.

</Accordion>

---

## Mặc định của Agent

### `agents.defaults.workspace`

Mặc định: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Gốc kho lưu trữ tùy chọn hiển thị trong dòng Runtime của lời nhắc hệ thống. Nếu không được đặt, OpenClaw tự động phát hiện bằng cách đi lên từ workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skipBootstrap`

Vô hiệu hóa việc tạo tự động các file bootstrap workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

Số ký tự tối đa cho mỗi file bootstrap workspace trước khi cắt ngắn. Mặc định: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Tổng số ký tự tối đa được chèn vào tất cả các file bootstrap workspace. Mặc định: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kiểm soát văn bản cảnh báo có thể nhìn thấy của agent khi ngữ cảnh bootstrap bị cắt ngắn.
Mặc định: `"once"`.

- `"off"`: không bao giờ chèn văn bản cảnh báo vào lời nhắc hệ thống.
- `"once"`: chèn cảnh báo một lần cho mỗi chữ ký cắt ngắn duy nhất (khuyến nghị).
- `"always"`: chèn cảnh báo mỗi lần chạy khi có cắt ngắn.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Kích thước pixel tối đa cho cạnh dài nhất của hình ảnh trong các khối hình ảnh transcript/tool trước khi gọi nhà cung cấp.
Mặc định: `1200`.

Giá trị thấp hơn thường giảm sử dụng vision-token và kích thước payload yêu cầu cho các lần chạy nặng về ảnh chụp màn hình.
Giá trị cao hơn giữ lại nhiều chi tiết hình ảnh hơn.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Múi giờ cho ngữ cảnh lời nhắc hệ thống (không phải dấu thời gian tin nhắn). Dự phòng cho múi giờ máy chủ.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Định dạng thời gian trong lời nhắc hệ thống. Mặc định: `auto` (ưu tiên hệ điều hành).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Dạng chuỗi chỉ đặt mô hình chính.
  - Dạng đối tượng đặt mô hình chính cộng với các mô hình dự phòng theo thứ tự.
- `imageModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được sử dụng bởi đường dẫn công cụ `image` như cấu hình mô hình tầm nhìn của nó.
  - Cũng được sử dụng như định tuyến dự phòng khi mô hình đã chọn/mặc định không thể chấp nhận đầu vào hình ảnh.
- `imageGenerationModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được sử dụng bởi khả năng tạo hình ảnh chia sẻ và bất kỳ bề mặt công cụ/plugin tương lai nào tạo ra hình ảnh.
  - Các giá trị điển hình: `google/gemini-3-pro-image-preview` cho luồng kiểu Nano Banana gốc, `fal/fal-ai/flux/dev` cho fal, hoặc `openai/gpt-image-1` cho OpenAI Images.
  - Nếu bị bỏ qua, `image_generate` vẫn có thể suy ra một nhà cung cấp mặc định nỗ lực tốt nhất từ các nhà cung cấp tạo hình ảnh có xác thực tương thích.
  - Các giá trị điển hình: `google/gemini-3-pro-image-preview`, `fal/fal-ai/flux/dev`, `openai/gpt-image-1`.
- `pdfModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được sử dụng bởi công cụ `pdf` cho định tuyến mô hình.
  - Nếu bị bỏ qua, công cụ PDF sẽ quay lại `imageModel`, sau đó là các nhà cung cấp mặc định nỗ lực tốt nhất.
- `pdfMaxBytesMb`: giới hạn kích thước PDF mặc định cho công cụ `pdf` khi `maxBytesMb` không được truyền tại thời điểm gọi.
- `pdfMaxPages`: số trang tối đa mặc định được xem xét bởi chế độ dự phòng trích xuất trong công cụ `pdf`.
- `model.primary`: định dạng `provider/model` (ví dụ `anthropic/claude-opus-4-6`). Nếu bạn bỏ qua nhà cung cấp, OpenClaw giả định `anthropic` (không khuyến nghị).
- `models`: danh mục mô hình đã cấu hình và danh sách cho phép cho `/model`. Mỗi mục có thể bao gồm `alias` (lối tắt) và `params` (cụ thể cho nhà cung cấp, ví dụ `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params` ưu tiên hợp nhất (cấu hình): `agents.defaults.models["provider/model"].params` là cơ sở, sau đó `agents.list[].params` (khớp với id agent) ghi đè theo khóa.
- Các trình ghi cấu hình thay đổi các trường này (ví dụ `/models set`, `/models set-image`, và các lệnh thêm/xóa dự phòng) lưu dạng đối tượng chuẩn và bảo tồn danh sách dự phòng hiện có khi có thể.
- `maxConcurrent`: số lần chạy agent song song tối đa trên các phiên (mỗi phiên vẫn được tuần tự hóa). Mặc định: 1.

**Các lối tắt bí danh tích hợp sẵn** (chỉ áp dụng khi mô hình có trong `agents.defaults.models`):

| Bí danh             | Mô hình                                |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5-mini`                    |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Các bí danh được cấu hình của bạn luôn thắng so với mặc định.

Các mô hình Z.AI GLM-4.x tự động bật chế độ suy nghĩ trừ khi bạn đặt `--thinking off` hoặc tự định nghĩa `agents.defaults.models["zai/<model>"].params.thinking`.
Các mô hình Z.AI bật `tool_stream` theo mặc định cho luồng gọi công cụ. Đặt `agents.defaults.models["zai/<model>"].params.tool_stream` thành `false` để vô hiệu hóa nó.
Các mô hình Anthropic Claude 4.6 mặc định là `adaptive` suy nghĩ khi không có mức suy nghĩ rõ ràng nào được đặt.

### `agents.defaults.cliBackends`

Các backend CLI tùy chọn cho các lần chạy dự phòng chỉ văn bản (không có cuộc gọi công cụ). Hữu ích như một bản sao lưu khi các nhà cung cấp API thất bại.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Các backend CLI là ưu tiên văn bản; các công cụ luôn bị vô hiệu hóa.
- Các phiên được hỗ trợ khi `sessionArg` được đặt.
- Hỗ trợ truyền qua hình ảnh khi `imageArg` chấp nhận các đường dẫn file.

### `agents.defaults.heartbeat`

Các lần chạy nhịp tim định kỳ.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m vô hiệu hóa
        model: "openai/gpt-5.2-mini",
        includeReasoning: false,
        lightContext: false, // mặc định: false; true chỉ giữ lại HEARTBEAT.md từ các file bootstrap workspace
        isolatedSession: false, // mặc định: false; true chạy mỗi nhịp tim trong một phiên mới (không có lịch sử hội thoại)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (mặc định) | block
        target: "none", // mặc định: none | tùy chọn: last | whatsapp | telegram | discord | ...
        prompt: "Đọc HEARTBEAT.md nếu có...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: chuỗi thời lượng (ms/s/m/h). Mặc định: `30m`.
- `suppressToolErrorWarnings`: khi đúng, ngăn chặn các payload cảnh báo lỗi công cụ trong các lần chạy nhịp tim.
- `directPolicy`: chính sách giao hàng trực tiếp/DM. `allow` (mặc định) cho phép giao hàng mục tiêu trực tiếp. `block` ngăn chặn giao hàng mục tiêu trực tiếp và phát ra `reason=dm-blocked`.
- `lightContext`: khi đúng, các lần chạy nhịp tim sử dụng ngữ cảnh bootstrap nhẹ và chỉ giữ lại `HEARTBEAT.md` từ các file bootstrap workspace.
- `isolatedSession`: khi đúng, mỗi nhịp tim chạy trong một phiên mới không có lịch sử hội thoại trước đó. Cùng mẫu cách ly như cron `sessionTarget: "isolated"`. Giảm chi phí token mỗi nhịp tim từ ~100K xuống ~2-5K token.
- Theo agent: đặt `agents.list[].heartbeat`. Khi bất kỳ agent nào định nghĩa `heartbeat`, **chỉ những agent đó** chạy nhịp tim.
- Nhịp tim chạy các lượt agent đầy đủ — các khoảng thời gian ngắn hơn tiêu tốn nhiều token hơn.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Bảo toàn chính xác các ID triển khai, ID vé, và cặp host:port.", // được sử dụng khi identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] vô hiệu hóa tái chèn
        model: "openrouter/anthropic/claude-sonnet-4-6", // ghi đè mô hình chỉ nén tùy chọn
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Phiên sắp nén. Lưu trữ các ký ức bền vững ngay bây giờ.",
          prompt: "Viết bất kỳ ghi chú lâu dài nào vào memory/YYYY-MM-DD.md; trả lời với NO_REPLY nếu không có gì để lưu trữ.",
        },
      },
    },
  },
}
```

- `mode`: `default` hoặc `safeguard` (tóm tắt theo khối cho các lịch sử dài). Xem [Nén](/concepts/compaction).
- `timeoutSeconds`: số giây tối đa cho phép cho một hoạt động nén đơn trước khi OpenClaw hủy bỏ nó. Mặc định: `900`.
- `identifierPolicy`: `strict` (mặc định), `off`, hoặc `custom`. `strict` thêm hướng dẫn bảo toàn định danh mờ tích hợp trong quá trình tóm tắt nén.
- `identifierInstructions`: văn bản bảo toàn định danh tùy chỉnh tùy chọn được sử dụng khi `identifierPolicy=custom`.
- `postCompactionSections`: tên phần H2/H3 AGENTS.md tùy chọn để tái chèn sau khi nén. Mặc định là `["Session Startup", "Red Lines"]`; đặt `[]` để vô hiệu hóa tái chèn. Khi không được đặt hoặc được đặt rõ ràng thành cặp mặc định đó, các tiêu đề `Every Session`/`Safety` cũ hơn cũng được chấp nhận như một dự phòng cũ.
- `model`: ghi đè `provider/model-id` tùy chọn cho chỉ tóm tắt nén. Sử dụng điều này khi phiên chính nên giữ một mô hình nhưng các tóm tắt nén nên chạy trên một mô hình khác; khi không được đặt, nén sử dụng mô hình chính của phiên.
- `memoryFlush`: lượt agentic im lặng trước khi tự động nén để lưu trữ các ký ức bền vững. Bỏ qua khi workspace chỉ đọc.

### `agents.defaults.contextPruning`

Loại bỏ **kết quả công cụ cũ** khỏi bộ nhớ trước khi gửi đến LLM. Không thay đổi lịch sử phiên trên ổ đĩa.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // thời gian (ms/s/m/h), đơn vị mặc định: phút
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Nội dung kết quả công cụ cũ đã bị xóa]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Hành vi chế độ cache-ttl">

- `mode: "cache-ttl"` kích hoạt quá trình loại bỏ.
- `ttl` kiểm soát tần suất loại bỏ có thể chạy lại (sau lần cuối cùng bộ nhớ cache được chạm tới).
- Loại bỏ mềm cắt ngắn kết quả công cụ quá lớn trước, sau đó xóa cứng kết quả công cụ cũ hơn nếu cần.

**Loại bỏ mềm** giữ lại phần đầu + cuối và chèn `...` vào giữa.

**Xóa cứng** thay thế toàn bộ kết quả công cụ bằng một placeholder.

Ghi chú:

- Các khối hình ảnh không bao giờ bị cắt/xóa.
- Tỷ lệ dựa trên ký tự (xấp xỉ), không phải số lượng token chính xác.
- Nếu có ít hơn `keepLastAssistants` tin nhắn trợ lý, quá trình loại bỏ sẽ bị bỏ qua.

</Accordion>

Xem [Session Pruning](/concepts/session-pruning) để biết chi tiết về hành vi.

### Truyền tải khối

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (sử dụng minMs/maxMs)
    },
  },
}
```

- Các kênh không phải Telegram yêu cầu `*.blockStreaming: true` để kích hoạt trả lời khối.
- Ghi đè kênh: `channels.<channel>.blockStreamingCoalesce` (và các biến thể theo tài khoản). Signal/Slack/Discord/Google Chat mặc định `minChars: 1500`.
- `humanDelay`: tạm dừng ngẫu nhiên giữa các trả lời khối. `natural` = 800–2500ms. Ghi đè theo agent: `agents.list[].humanDelay`.

Xem [Streaming](/concepts/streaming) để biết chi tiết về hành vi + phân đoạn.

### Chỉ báo gõ

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Mặc định: `instant` cho các cuộc trò chuyện trực tiếp/đề cập, `message` cho các cuộc trò chuyện nhóm không được đề cập.
- Ghi đè theo phiên: `session.typingMode`, `session.typingIntervalSeconds`.

Xem [Typing Indicators](/concepts/typing-indicators).

### `agents.defaults.sandbox`

Tùy chọn sandboxing cho agent nhúng. Xem [Sandboxing](/gateway/sandboxing) để biết hướng dẫn đầy đủ.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / nội dung inline cũng được hỗ trợ:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Chi tiết Sandbox">

**Backend:**

- `docker`: runtime Docker cục bộ (mặc định)
- `ssh`: runtime từ xa hỗ trợ SSH
- `openshell`: runtime OpenShell

Khi `backend: "openshell"` được chọn, cài đặt cụ thể cho runtime chuyển sang
`plugins.entries.openshell.config`.

**Cấu hình backend SSH:**

- `target`: mục tiêu SSH dưới dạng `user@host[:port]`
- `command`: lệnh client SSH (mặc định: `ssh`)
- `workspaceRoot`: thư mục gốc từ xa tuyệt đối được sử dụng cho các workspace theo phạm vi
- `identityFile` / `certificateFile` / `knownHostsFile`: các tệp cục bộ hiện có được chuyển đến OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: nội dung inline hoặc SecretRefs mà OpenClaw chuyển thành các tệp tạm thời tại runtime
- `strictHostKeyChecking` / `updateHostKeys`: các nút điều chỉnh chính sách host-key của OpenSSH

**Thứ tự ưu tiên xác thực SSH:**

- `identityData` được ưu tiên hơn `identityFile`
- `certificateData` được ưu tiên hơn `certificateFile`
- `knownHostsData` được ưu tiên hơn `knownHostsFile`
- Các giá trị `*Data` được hỗ trợ bởi SecretRef được giải quyết từ snapshot runtime bí mật hiện tại trước khi phiên sandbox bắt đầu

**Hành vi backend SSH:**

- khởi tạo workspace từ xa một lần sau khi tạo hoặc tạo lại
- sau đó giữ workspace SSH từ xa là chuẩn
- định tuyến `exec`, công cụ tệp và đường dẫn media qua SSH
- không đồng bộ hóa các thay đổi từ xa trở lại host tự động
- không hỗ trợ các container trình duyệt sandbox

**Truy cập Workspace:**

- `none`: workspace sandbox theo phạm vi dưới `~/.openclaw/sandboxes`
- `ro`: workspace sandbox tại `/workspace`, workspace agent được gắn kết chỉ đọc tại `/agent`
- `rw`: workspace agent được gắn kết đọc/ghi tại `/workspace`

**Phạm vi:**

- `session`: container + workspace theo phiên
- `agent`: một container + workspace cho mỗi agent (mặc định)
- `shared`: container và workspace chia sẻ (không có cách ly giữa các phiên)

**Cấu hình plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // tùy chọn
          gatewayEndpoint: "https://lab.example", // tùy chọn
          policy: "strict", // tùy chọn id chính sách OpenShell
          providers: ["openai"], // tùy chọn
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Chế độ OpenShell:**

- `mirror`: khởi tạo từ xa từ cục bộ trước khi thực thi, đồng bộ hóa lại sau khi thực thi; workspace cục bộ vẫn là chuẩn
- `remote`: khởi tạo từ xa một lần khi sandbox được tạo, sau đó giữ workspace từ xa là chuẩn

Trong chế độ `remote`, các chỉnh sửa cục bộ trên host được thực hiện ngoài OpenClaw không được đồng bộ hóa vào sandbox tự động sau bước khởi tạo.
Truyền tải là SSH vào sandbox OpenShell, nhưng plugin sở hữu vòng đời sandbox và đồng bộ hóa gương tùy chọn.

**`setupCommand`** chạy một lần sau khi tạo container (thông qua `sh -lc`). Cần có mạng egress, thư mục gốc có thể ghi, người dùng root.

**Các container mặc định là `network: "none"`** — đặt thành `"bridge"` (hoặc mạng cầu tùy chỉnh) nếu agent cần truy cập ra ngoài.
`"host"` bị chặn. `"container:<id>"` bị chặn theo mặc định trừ khi bạn đặt rõ ràng
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (phá vỡ kính).

**Các tệp đính kèm đầu vào** được lưu trữ vào `media/inbound/*` trong workspace đang hoạt động.

**`docker.binds`** gắn kết các thư mục host bổ sung; các gắn kết toàn cầu và theo agent được hợp nhất.

**Trình duyệt sandbox** (`sandbox.browser.enabled`): Chromium + CDP trong một container. URL noVNC được chèn vào lời nhắc hệ thống. Không yêu cầu `browser.enabled` trong `openclaw.json`.
Truy cập quan sát noVNC sử dụng xác thực VNC theo mặc định và OpenClaw phát ra một URL token ngắn hạn (thay vì tiết lộ mật khẩu trong URL chia sẻ).

- `allowHostControl: false` (mặc định) chặn các phiên sandbox nhắm mục tiêu vào trình duyệt host.
- `network` mặc định là `openclaw-sandbox-browser` (mạng cầu chuyên dụng). Đặt thành `bridge` chỉ khi bạn muốn kết nối cầu toàn cầu.
- `cdpSourceRange` tùy chọn hạn chế ingress CDP tại cạnh container đến một phạm vi CIDR (ví dụ `172.21.0.1/32`).
- `sandbox.browser.binds` gắn kết các thư mục host bổ sung vào container trình duyệt sandbox chỉ. Khi được đặt (bao gồm `[]`), nó thay thế `docker.binds` cho container trình duyệt.
- Các mặc định khởi chạy được định nghĩa trong `scripts/sandbox-browser-entrypoint.sh` và được điều chỉnh cho các host container:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (mặc định được bật)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, và `--disable-gpu` được
    bật theo mặc định và có thể bị tắt với
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` nếu cần sử dụng WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` bật lại các tiện ích mở rộng nếu quy trình làm việc của bạn
    phụ thuộc vào chúng.
  - `--renderer-process-limit=2` có thể được thay đổi với
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; đặt `0` để sử dụng giới hạn quy trình mặc định của Chromium.
  - cộng với `--no-sandbox` và `--disable-setuid-sandbox` khi `noSandbox` được bật.
  - Các mặc định là cơ sở hình ảnh container; sử dụng hình ảnh trình duyệt tùy chỉnh với một điểm vào tùy chỉnh để thay đổi các mặc định container.

</Accordion>

Trình duyệt sandbox và `sandbox.docker.binds` hiện chỉ hỗ trợ Docker.

Xây dựng hình ảnh:

```bash
scripts/sandbox-setup.sh           # hình ảnh sandbox chính
scripts/sandbox-browser-setup.sh   # hình ảnh trình duyệt tùy chọn
```

### `agents.list` (ghi đè theo agent)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // hoặc { primary, fallbacks }
        thinkingDefault: "high", // ghi đè mức độ suy nghĩ theo agent
        reasoningDefault: "on", // ghi đè khả năng hiển thị lý luận theo agent
        fastModeDefault: false, // ghi đè chế độ nhanh theo agent
        params: { cacheRetention: "none" }, // ghi đè các tham số models mặc định theo khóa
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: id agent ổn định (bắt buộc).
- `default`: khi nhiều cái được đặt, cái đầu tiên thắng (cảnh báo được ghi lại). Nếu không có cái nào được đặt, mục đầu tiên trong danh sách là mặc định.
- `model`: dạng chuỗi ghi đè chỉ `primary`; dạng đối tượng `{ primary, fallbacks }` ghi đè cả hai (`[]` vô hiệu hóa các fallbacks toàn cầu). Các công việc cron chỉ ghi đè `primary` vẫn kế thừa các fallbacks mặc định trừ khi bạn đặt `fallbacks: []`.
- `params`: các tham số luồng theo agent được hợp nhất trên mục nhập model đã chọn trong `agents.defaults.models`. Sử dụng điều này cho các ghi đè cụ thể theo agent như `cacheRetention`, `temperature`, hoặc `maxTokens` mà không cần sao chép toàn bộ danh mục model.
- `thinkingDefault`: mức độ suy nghĩ mặc định tùy chọn theo agent (`off | minimal | low | medium | high | xhigh | adaptive`). Ghi đè `agents.defaults.thinkingDefault` cho agent này khi không có ghi đè theo tin nhắn hoặc phiên nào được đặt.
- `reasoningDefault`: khả năng hiển thị lý luận mặc định tùy chọn theo agent (`on | off | stream`). Áp dụng khi không có ghi đè lý luận theo tin nhắn hoặc phiên nào được đặt.
- `fastModeDefault`: mặc định tùy chọn theo agent cho chế độ nhanh (`true | false`). Áp dụng khi không có ghi đè chế độ nhanh theo tin nhắn hoặc phiên nào được đặt.
- `runtime`: mô tả runtime tùy chọn theo agent. Sử dụng `type: "acp"` với các mặc định `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) khi agent nên mặc định cho các phiên harness ACP.
- `identity.avatar`: đường dẫn tương đối workspace, URL `http(s)`, hoặc URI `data:`.
- `identity` dẫn xuất các mặc định: `ackReaction` từ `emoji`, `mentionPatterns` từ `name`/`emoji`.
- `subagents.allowAgents`: danh sách cho phép các id agent cho `sessions_spawn` (`["*"]` = bất kỳ; mặc định: chỉ cùng agent).
- Bảo vệ thừa kế Sandbox: nếu phiên yêu cầu được sandbox, `sessions_spawn` từ chối các mục tiêu sẽ chạy không được sandbox.

---

## Định tuyến đa agent

Chạy nhiều agent cách ly bên trong một Gateway. Xem [Multi-Agent](/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Trường khớp ràng buộc

- `type` (tùy chọn): `route` cho định tuyến thông thường (loại thiếu mặc định là route), `acp` cho các ràng buộc cuộc trò chuyện ACP liên tục.
- `match.channel` (bắt buộc)
- `match.accountId` (tùy chọn; `*` = bất kỳ tài khoản nào; bỏ qua = tài khoản mặc định)
- `match.peer` (tùy chọn; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (tùy chọn; cụ thể cho kênh)
- `acp` (tùy chọn; chỉ dành cho `type: "acp"`): `{ mode, label, cwd, backend }`

**Thứ tự khớp xác định:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (chính xác, không có peer/guild/team)
5. `match.accountId: "*"` (toàn kênh)
6. Agent mặc định

Trong mỗi cấp, mục nhập `bindings` khớp đầu tiên sẽ thắng.

Đối với các mục `type: "acp"`, OpenClaw giải quyết bằng danh tính cuộc trò chuyện chính xác (`match.channel` + tài khoản + `match.peer.id`) và không sử dụng thứ tự cấp ràng buộc route ở trên.

### Hồ sơ truy cập theo agent

<Accordion title="Truy cập đầy đủ (không sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Công cụ chỉ đọc + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Không truy cập hệ thống tệp (chỉ nhắn tin)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Xem [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) để biết chi tiết về thứ tự ưu tiên.

---

## Phiên

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // bỏ qua fork của luồng cha trên số lượng token này (0 vô hiệu hóa)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // thời gian hoặc false
      maxDiskBytes: "500mb", // ngân sách cứng tùy chọn
      highWaterBytes: "400mb", // mục tiêu dọn dẹp tùy chọn
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // không hoạt động tự động không tập trung mặc định trong giờ (`0` vô hiệu hóa)
      maxAgeHours: 0, // tuổi tối đa cứng mặc định trong giờ (`0` vô hiệu hóa)
    },
    mainKey: "main", // kế thừa (runtime luôn sử dụng "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Chi tiết trường phiên">

- **`dmScope`**: cách nhóm các DM.
  - `main`: tất cả các DM chia sẻ phiên chính.
  - `per-peer`: cách ly theo id người gửi trên các kênh.
  - `per-channel-peer`: cách ly theo kênh + người gửi (được khuyến nghị cho các hộp thư đến nhiều người dùng).
  - `per-account-channel-peer`: cách ly theo tài khoản + kênh + người gửi (được khuyến nghị cho nhiều tài khoản).
- **`identityLinks`**: ánh xạ các id chuẩn đến các peer có tiền tố nhà cung cấp để chia sẻ phiên giữa các kênh.
- **`reset`**: chính sách đặt lại chính. `daily` đặt lại vào `atHour` giờ địa phương; `idle` đặt lại sau `idleMinutes`. Khi cả hai được cấu hình, cái nào hết hạn trước sẽ thắng.
- **`resetByType`**: ghi đè theo loại (`direct`, `group`, `thread`). `dm` kế thừa được chấp nhận làm bí danh cho `direct`.
- **`parentForkMaxTokens`**: số lượng token `totalTokens` tối đa của phiên cha được phép khi tạo phiên luồng forked (mặc định `100000`).
  - Nếu `totalTokens` của phiên cha vượt quá giá trị này, OpenClaw bắt đầu một phiên luồng mới thay vì kế thừa lịch sử bản ghi của phiên cha.
  - Đặt `0` để vô hiệu hóa bảo vệ này và luôn cho phép fork của phiên cha.
- **`mainKey`**: trường kế thừa. Runtime hiện luôn sử dụng `"main"` cho bucket trò chuyện trực tiếp chính.
- **`sendPolicy`**: khớp theo `channel`, `chatType` (`direct|group|channel`, với bí danh `dm` kế thừa), `keyPrefix`, hoặc `rawKeyPrefix`. Từ chối đầu tiên thắng.
- **`maintenance`**: dọn dẹp + kiểm soát lưu giữ phiên.
  - `mode`: `warn` chỉ phát ra cảnh báo; `enforce` áp dụng dọn dẹp.
  - `pruneAfter`: ngưỡng tuổi cho các mục không hoạt động (mặc định `30d`).
  - `maxEntries`: số lượng mục tối đa trong `sessions.json` (mặc định `500`).
  - `rotateBytes`: xoay `sessions.json` khi nó vượt quá kích thước này (mặc định `10mb`).
  - `resetArchiveRetention`: thời gian lưu giữ cho các bản ghi `*.reset.<timestamp>`. Mặc định là `pruneAfter`; đặt `false` để vô hiệu hóa.
  - `maxDiskBytes`: ngân sách đĩa thư mục phiên tùy chọn. Trong chế độ `warn`, nó ghi lại cảnh báo; trong chế độ `enforce`, nó xóa các phiên/mục cũ nhất trước.
  - `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp ngân sách. Mặc định là `80%` của `maxDiskBytes`.
- **`threadBindings`**: mặc định toàn cầu cho các tính năng phiên ràng buộc luồng.
  - `enabled`: công tắc mặc định chính (các nhà cung cấp có thể ghi đè; Discord sử dụng `channels.discord.threadBindings.enabled`)
  - `idleHours`: không hoạt động tự động không tập trung mặc định trong giờ (`0` vô hiệu hóa; các nhà cung cấp có thể ghi đè)
  - `maxAgeHours`: tuổi tối đa cứng mặc định trong giờ (`0` vô hiệu hóa; các nhà cung cấp có thể ghi đè)

</Accordion>

---

## Tin nhắn

```json5
{
  messages: {
    responsePrefix: "🦞", // hoặc "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 vô hiệu hóa
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Tiền tố phản hồi

Ghi đè theo kênh/tài khoản: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Giải quyết (cái cụ thể nhất thắng): tài khoản → kênh → toàn cầu. `""` vô hiệu hóa và dừng cascade. `"auto"` dẫn xuất `[{identity.name}]`.

**Biến mẫu:**

| Biến              | Mô tả                   | Ví dụ                       |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | Tên model ngắn          | `claude-opus-4-6`           |
| `{modelFull}`     | Định danh model đầy đủ  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Tên nhà cung cấp        | `anthropic`                 |
| `{thinkingLevel}` | Mức độ suy nghĩ hiện tại| `high`, `low`, `off`        |
| `{identity.name}` | Tên danh tính agent     | (giống như `"auto"`)        |

Các biến không phân biệt chữ hoa chữ thường. `{think}` là bí danh cho `{thinkingLevel}`.

### Phản ứng xác nhận

- Mặc định là `identity.emoji` của agent đang hoạt động, nếu không là `"👀"`. Đặt `""` để vô hiệu hóa.
- Ghi đè theo kênh: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Thứ tự giải quyết: tài khoản → kênh → `messages.ackReaction` → dự phòng danh tính.
- Phạm vi: `group-mentions` (mặc định), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: xóa xác nhận sau khi trả lời (chỉ Slack/Discord/Telegram/Google Chat).

### Giảm chấn đầu vào

Gộp các tin nhắn văn bản nhanh từ cùng một người gửi thành một lượt agent duy nhất. Media/tệp đính kèm xả ngay lập tức. Các lệnh điều khiển bỏ qua giảm chấn.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
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
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` kiểm soát tự động TTS. `/tts off|always|inbound|tagged` ghi đè theo phiên.
- `summaryModel` ghi đè `agents.defaults.model.primary` cho tóm tắt tự động.
- `modelOverrides` được bật theo mặc định; `modelOverrides.allowProvider` mặc định là `false` (opt-in).
- Các khóa API dự phòng cho `ELEVENLABS_API_KEY`/`XI_API_KEY` và `OPENAI_API_KEY`.
- `openai.baseUrl` ghi đè điểm cuối TTS của OpenAI. Thứ tự giải quyết là cấu hình, sau đó `OPENAI_TTS_BASE_URL`, sau đó `https://api.openai.com/v1`.
- Khi `openai.baseUrl` trỏ đến một điểm cuối không phải của OpenAI, OpenClaw coi đó là máy chủ TTS tương thích với OpenAI và nới lỏng xác thực model/giọng nói.

---

## Talk

Mặc định cho chế độ Talk (macOS/iOS/Android).

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17",
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- Các ID giọng nói dự phòng cho `ELEVENLABS_VOICE_ID` hoặc `SAG_VOICE_ID`.
- `apiKey` và `providers.*.apiKey` chấp nhận chuỗi văn bản thuần hoặc đối tượng SecretRef.
- Dự phòng `ELEVENLABS_API_KEY` chỉ áp dụng khi không có khóa API Talk nào được cấu hình.
- `voiceAliases` cho phép các chỉ thị Talk sử dụng tên thân thiện.
- `silenceTimeoutMs` kiểm soát thời gian chế độ Talk chờ sau khi người dùng im lặng trước khi gửi bản ghi. Không đặt giữ cửa sổ tạm dừng mặc định của nền tảng (`700 ms trên macOS và Android, 900 ms trên iOS`).

---

## Công cụ

### Hồ sơ công cụ

`tools.profile` đặt danh sách cho phép cơ bản trước `tools.allow`/`tools.deny`:

Các cấu hình cục bộ mới mặc định cho `tools.profile: "coding"` khi không được đặt (các hồ sơ rõ ràng hiện có được giữ nguyên).

| Hồ sơ       | Bao gồm                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------- |
| `minimal`   | Chỉ `session_status`                                                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:sessions`, `group:memory`, `image`                       |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`    |
| `full`      | Không có hạn chế (giống như không đặt)                                                       |

### Nhóm công cụ

| Nhóm                | Công cụ                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process` (`bash` được chấp nhận làm bí danh cho `exec`)                             |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                       |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`     |
| `group:memory`     | `memory_search`, `memory_get`                                                                |
| `group:web`        | `web_search`, `web_fetch`                                                                    |
| `group:ui`         | `browser`, `canvas`                                                                          |
| `group:automation` | `cron`, `gateway`                                                                            |
| `group:messaging`  | `message`                                                                                    |
| `group:nodes`      | `nodes`                                                                                      |
| `group:openclaw`   | Tất cả các công cụ tích hợp (không bao gồm các plugin nhà cung cấp)                          |

### `tools.allow` / `tools.deny`

Chính sách cho phép/từ chối công cụ toàn cầu (từ chối thắng). Không phân biệt chữ hoa chữ thường, hỗ trợ ký tự đại diện `*`. Áp dụng ngay cả khi sandbox Docker tắt.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Hạn chế thêm công cụ cho các nhà cung cấp hoặc model cụ thể. Thứ tự: hồ sơ cơ bản → hồ sơ nhà cung cấp → cho phép/từ chối.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Kiểm soát quyền truy cập thực thi nâng cao (host):

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Ghi đè theo agent (`agents.list[].tools.elevated`) chỉ có thể hạn chế thêm.
- `/elevated on|off|ask|full` lưu trữ trạng thái theo phiên; các chỉ thị inline áp dụng cho một tin nhắn duy nhất.
- Thực thi `exec` nâng cao chạy trên host, bỏ qua sandboxing.

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.2"],
      },
    },
  },
}
```

### `tools.loopDetection`

Kiểm tra an toàn vòng lặp công cụ **bị vô hiệu hóa theo mặc định**. Đặt `enabled: true` để kích hoạt phát hiện.
Các cài đặt có thể được định nghĩa toàn cầu trong `tools.loopDetection` và ghi đè theo agent tại `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: kích thước lịch sử gọi công cụ tối đa được giữ lại để phân tích vòng lặp.
- `warningThreshold`: ngưỡng mẫu không tiến triển lặp lại cho cảnh báo.
- `criticalThreshold`: ngưỡng lặp lại cao hơn cho việc chặn các vòng lặp quan trọng.
- `globalCircuitBreakerThreshold`: ngưỡng dừng cứng cho bất kỳ lần chạy không tiến triển nào.
- `detectors.genericRepeat`: cảnh báo về các cuộc gọi cùng công cụ/cùng tham số lặp lại.
- `detectors.knownPollNoProgress`: cảnh báo/chặn trên các công cụ thăm dò đã biết (`process.poll`, `command_status`, v.v.).
- `detectors.pingPong`: cảnh báo/chặn trên các mẫu cặp không tiến triển xen kẽ.
- Nếu `warningThreshold >= criticalThreshold` hoặc `criticalThreshold >= globalCircuitBreakerThreshold`, xác thực sẽ thất bại.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // hoặc biến môi trường BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Cấu hình hiểu biết media đầu vào (hình ảnh/âm thanh/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Trường mục nhập model media">

**Mục nhập nhà cung cấp** (`type: "provider"` hoặc bỏ qua):

- `provider`: id nhà cung cấp API (`openai`, `anthropic`, `google`/`gemini`, `groq`, v.v.)
- `model`: ghi đè id model
- `profile` / `preferredProfile`: lựa chọn hồ sơ `auth-profiles.json`

**Mục nhập CLI** (`type: "cli"`):

- `command`: lệnh thực thi
- `args`: tham số có thể thay thế (hỗ trợ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, v.v.)

**Trường chung:**

- `capabilities`: danh sách tùy chọn (`image`, `audio`, `video`). Mặc định: `openai`/`anthropic`/`minimax` → hình ảnh, `google` → hình ảnh+âm thanh+video, `groq` → âm thanh.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: ghi đè theo mục nhập.
- Thất bại sẽ chuyển sang mục nhập tiếp theo.

Xác thực nhà cung cấp theo thứ tự tiêu chuẩn: `auth-profiles.json` → biến môi trường → `models.providers.*.apiKey`.

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Kiểm soát phiên nào có thể được nhắm mục tiêu bởi các công cụ phiên (`sessions_list`, `sessions_history`, `sessions_send`).

Mặc định: `tree` (phiên hiện tại + các phiên được tạo bởi nó, chẳng hạn như subagents).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Ghi chú:

- `self`: chỉ khóa phiên hiện tại.
- `tree`: phiên hiện tại + các phiên được tạo bởi phiên hiện tại (subagents).
- `agent`: bất kỳ phiên nào thuộc về id agent hiện tại (có thể bao gồm người dùng khác nếu bạn chạy các phiên theo người gửi dưới cùng một id agent).
- `all`: bất kỳ phiên nào. Nhắm mục tiêu chéo agent vẫn yêu cầu `tools.agentToAgent`.
- Kẹp Sandbox: khi phiên hiện tại được sandbox và `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, khả năng hiển thị bị ép buộc thành `tree` ngay cả khi `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Kiểm soát hỗ trợ tệp đính kèm inline cho `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: đặt true để cho phép tệp đính kèm inline
        maxTotalBytes: 5242880, // 5 MB tổng cộng trên tất cả các tệp
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB mỗi tệp
        retainOnSessionKeep: false, // giữ tệp đính kèm khi cleanup="keep"
      },
    },
  },
}
```

Ghi chú:

- Tệp đính kèm chỉ được hỗ trợ cho `runtime: "subagent"`. Runtime ACP từ chối chúng.
- Các tệp được chuyển thành workspace con tại `.openclaw/attachments/<uuid>/` với một `.manifest.json`.
- Nội dung tệp đính kèm tự động được xóa khỏi lưu trữ bản ghi.
- Đầu vào Base64 được xác thực với kiểm tra bảng chữ cái/đệm nghiêm ngặt và bảo vệ kích thước trước khi giải mã.
- Quyền tệp là `0700` cho thư mục và `0600` cho tệp.
- Dọn dẹp theo chính sách `cleanup`: `delete` luôn xóa tệp đính kèm; `keep` giữ chúng chỉ khi `retainOnSessionKeep: true`.

### `tools.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 1,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: model mặc định cho các sub-agent được tạo. Nếu bỏ qua, sub-agent kế thừa model của người gọi.
- `runTimeoutSeconds`: thời gian chờ mặc định (giây) cho `sessions_spawn` khi cuộc gọi công cụ bỏ qua `runTimeoutSeconds`. `0` có nghĩa là không có thời gian chờ.
- Chính sách công cụ theo subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Nhà cung cấp tùy chỉnh và URL cơ sở

OpenClaw sử dụng danh mục model pi-coding-agent. Thêm nhà cung cấp tùy chỉnh thông qua `models.providers` trong cấu hình hoặc `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (mặc định) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Sử dụng `authHeader: true` + `headers` cho các nhu cầu xác thực tùy chỉnh.
- Ghi đè thư mục cấu hình agent với `OPENCLAW_AGENT_DIR` (hoặc `PI_CODING_AGENT_DIR`).
- Thứ tự ưu tiên hợp nhất cho các ID nhà cung cấp khớp:
  - Các giá trị `baseUrl` không rỗng của `models.json` agent thắng.
  - Các giá trị `apiKey` không rỗng của agent thắng chỉ khi nhà cung cấp đó không được quản lý bởi SecretRef trong cấu hình/hồ sơ xác thực hiện tại.
  - Các giá trị `apiKey` của nhà cung cấp được quản lý bởi SecretRef được làm mới từ các dấu nguồn (`ENV_VAR_NAME` cho các tham chiếu môi trường, `secretref-managed` cho các tham chiếu tệp/thực thi) thay vì duy trì các bí mật đã giải quyết.
  - Các giá trị tiêu đề của nhà cung cấp được quản lý bởi SecretRef được làm mới từ các dấu nguồn (`secretref-env:ENV_VAR_NAME` cho các tham chiếu môi trường, `secretref-managed` cho các tham chiếu tệp/thực thi).
  - `apiKey`/`baseUrl` trống hoặc thiếu của agent dự phòng cho `models.providers` trong cấu hình.
  - Các giá trị `contextWindow`/`maxTokens` của model khớp sử dụng giá trị cao hơn giữa cấu hình rõ ràng và các giá trị danh mục ngầm định.
  - Sử dụng `models.mode: "replace"` khi bạn muốn cấu hình ghi đè hoàn toàn `models.json`.
  - Dấu hiệu lưu trữ là nguồn chính thức: các dấu hiệu được ghi từ snapshot cấu hình nguồn hoạt động (trước khi giải quyết), không phải từ các giá trị bí mật runtime đã giải quyết.

### Chi tiết trường nhà cung cấp

- `models.mode`: hành vi danh mục nhà cung cấp (`merge` hoặc `replace`).
- `models.providers`: bản đồ nhà cung cấp tùy chỉnh được khóa bởi id nhà cung cấp.
- `models.providers.*.api`: bộ điều hợp yêu cầu (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, v.v.).
- `models.providers.*.apiKey`: thông tin xác thực nhà cung cấp (ưu tiên thay thế SecretRef/môi trường).
- `models.providers.*.auth`: chiến lược xác thực (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: cho Ollama + `openai-completions`, chèn `options.num_ctx` vào các yêu cầu (mặc định: `true`).
- `models.providers.*.authHeader`: buộc vận chuyển thông tin xác thực trong tiêu đề `Authorization` khi cần.
- `models.providers.*.baseUrl`: URL cơ sở API thượng nguồn.
- `models.providers.*.headers`: tiêu đề tĩnh bổ sung cho định tuyến proxy/tenant.
- `models.providers.*.models`: các mục nhập danh mục model nhà cung cấp rõ ràng.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: gợi ý tương thích tùy chọn. Đối với `api: "openai-completions"` với `baseUrl` không rỗng không phải gốc (host không phải `api.openai.com`), OpenClaw buộc điều này thành `false` tại runtime. `baseUrl` trống/bỏ qua giữ hành vi mặc định của OpenAI.
- `models.bedrockDiscovery`: gốc cài đặt tự động phát hiện Bedrock.
- `models.bedrockDiscovery.enabled`: bật/tắt phát hiện polling.
- `models.bedrockDiscovery.region`: vùng AWS cho phát hiện.
- `models.bedrockDiscovery.providerFilter`: bộ lọc id nhà cung cấp tùy chọn cho phát hiện mục tiêu.
- `models.bedrockDiscovery.refreshInterval`: khoảng thời gian polling cho làm mới phát hiện.
- `models.bedrockDiscovery.defaultContextWindow`: cửa sổ ngữ cảnh dự phòng cho các model được phát hiện.
- `models.bedrockDiscovery.defaultMaxTokens`: số lượng token đầu ra tối đa dự phòng cho các model được phát hiện.

### Ví dụ về Provider

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Sử dụng `cerebras/zai-glm-4.7` cho Cerebras; `zai/glm-4.7` cho Z.AI trực tiếp.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Thiết lập `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`). Sử dụng tham chiếu `opencode/...` cho danh mục Zen hoặc `opencode-go/...` cho danh mục Go. Lối tắt: `openclaw onboard --auth-choice opencode-zen` hoặc `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Thiết lập `ZAI_API_KEY`. `z.ai/*` và `z-ai/*` là các bí danh được chấp nhận. Lối tắt: `openclaw onboard --auth-choice zai-api-key`.

- Endpoint chung: `https://api.z.ai/api/paas/v4`
- Endpoint mã hóa (mặc định): `https://api.z.ai/api/coding/paas/v4`
- Đối với endpoint chung, định nghĩa một provider tùy chỉnh với URL cơ sở ghi đè.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Đối với endpoint Trung Quốc: `baseUrl: "https://api.moonshot.cn/v1"` hoặc `openclaw onboard --auth-choice moonshot-api-key-cn`.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: { "kimi-coding/k2p5": { alias: "Kimi K2.5" } },
    },
  },
}
```

Tương thích với Anthropic, provider tích hợp sẵn. Lối tắt: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (Anthropic-compatible)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

URL cơ sở nên bỏ qua `/v1` (ứng dụng khách Anthropic sẽ tự động thêm vào). Lối tắt: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (trực tiếp)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Thiết lập `MINIMAX_API_KEY`. Lối tắt: `openclaw onboard --auth-choice minimax-api`.
`MiniMax-M2.5` và `MiniMax-M2.5-highspeed` vẫn có sẵn nếu bạn thích các mô hình văn bản cũ hơn.

</Accordion>

<Accordion title="Mô hình cục bộ (LM Studio)">

Xem [Mô hình cục bộ](/gateway/local-models). Tóm tắt: chạy MiniMax M2.5 qua API Phản hồi LM Studio trên phần cứng mạnh; giữ các mô hình được lưu trữ để dự phòng.

</Accordion>

---

## Kỹ năng

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // hoặc chuỗi văn bản thuần
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: danh sách cho phép tùy chọn chỉ cho các kỹ năng được đóng gói (các kỹ năng quản lý/workspace không bị ảnh hưởng).
- `entries.<skillKey>.enabled: false` vô hiệu hóa một kỹ năng ngay cả khi đã được đóng gói/cài đặt.
- `entries.<skillKey>.apiKey`: tiện lợi cho các kỹ năng khai báo một biến môi trường chính (chuỗi văn bản thuần hoặc đối tượng SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Được tải từ `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, cộng với `plugins.load.paths`.
- Khám phá chấp nhận các plugin OpenClaw gốc cộng với các gói Codex tương thích và các gói Claude, bao gồm cả các gói Claude không có manifest.
- **Thay đổi cấu hình yêu cầu khởi động lại gateway.**
- `allow`: danh sách cho phép tùy chọn (chỉ các plugin được liệt kê mới được tải). `deny` sẽ thắng.
- `plugins.entries.<id>.apiKey`: trường tiện lợi cho khóa API cấp plugin (khi được plugin hỗ trợ).
- `plugins.entries.<id>.env`: bản đồ biến môi trường phạm vi plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: khi `false`, lõi sẽ chặn `before_prompt_build` và bỏ qua các trường thay đổi prompt từ `before_agent_start` cũ, trong khi vẫn giữ `modelOverride` và `providerOverride` cũ. Áp dụng cho các hook plugin gốc và các thư mục hook do gói cung cấp hỗ trợ.
- `plugins.entries.<id>.subagent.allowModelOverride`: tin tưởng rõ ràng plugin này để yêu cầu ghi đè `provider` và `model` cho mỗi lần chạy subagent nền.
- `plugins.entries.<id>.subagent.allowedModels`: danh sách cho phép tùy chọn của các mục tiêu `provider/model` chính tắc cho các ghi đè subagent đáng tin cậy. Sử dụng `"*"` chỉ khi bạn cố ý muốn cho phép bất kỳ mô hình nào.
- `plugins.entries.<id>.config`: đối tượng cấu hình do plugin định nghĩa (được xác thực bởi schema plugin OpenClaw gốc khi có sẵn).
- Các plugin gói Claude được bật cũng có thể đóng góp các mặc định Pi nhúng từ `settings.json`; OpenClaw áp dụng những điều đó như các cài đặt agent đã được làm sạch, không phải là các bản vá cấu hình OpenClaw thô.
- `plugins.slots.memory`: chọn id plugin bộ nhớ đang hoạt động, hoặc `"none"` để vô hiệu hóa các plugin bộ nhớ.
- `plugins.slots.contextEngine`: chọn id plugin động cơ ngữ cảnh đang hoạt động; mặc định là `"legacy"` trừ khi bạn cài đặt và chọn một động cơ khác.
- `plugins.installs`: metadata cài đặt được quản lý bởi CLI được sử dụng bởi `openclaw plugins update`.
  - Bao gồm `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Xem `plugins.installs.*` như trạng thái được quản lý; ưu tiên các lệnh CLI hơn là chỉnh sửa thủ công.

Xem [Plugins](/tools/plugin).

---

## Trình duyệt

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // chế độ mạng tin cậy mặc định
      // allowPrivateNetwork: true, // bí danh cũ
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` vô hiệu hóa `act:evaluate` và `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` mặc định là `true` khi không được thiết lập (mô hình mạng tin cậy).
- Đặt `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` để duyệt trình duyệt chỉ công khai nghiêm ngặt.
- Trong chế độ nghiêm ngặt, các endpoint hồ sơ CDP từ xa (`profiles.*.cdpUrl`) phải tuân theo cùng một chặn mạng riêng trong quá trình kiểm tra khả năng truy cập/khám phá.
- `ssrfPolicy.allowPrivateNetwork` vẫn được hỗ trợ như một bí danh cũ.
- Trong chế độ nghiêm ngặt, sử dụng `ssrfPolicy.hostnameAllowlist` và `ssrfPolicy.allowedHostnames` cho các ngoại lệ rõ ràng.
- Hồ sơ từ xa chỉ có thể đính kèm (bắt đầu/dừng/đặt lại bị vô hiệu hóa).
- Hồ sơ `existing-session` chỉ dành cho máy chủ và sử dụng Chrome MCP thay vì CDP.
- Hồ sơ `existing-session` có thể đặt `userDataDir` để nhắm mục tiêu một hồ sơ trình duyệt dựa trên Chromium cụ thể như Brave hoặc Edge.
- Thứ tự tự động phát hiện: trình duyệt mặc định nếu dựa trên Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Dịch vụ điều khiển: chỉ vòng lặp (cổng được lấy từ `gateway.port`, mặc định `18791`).
- `extraArgs` thêm các cờ khởi động bổ sung vào khởi động Chromium cục bộ (ví dụ như `--disable-gpu`, kích thước cửa sổ hoặc cờ gỡ lỗi).

---

## Giao diện người dùng

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, văn bản ngắn, URL hình ảnh, hoặc URI dữ liệu
    },
  },
}
```

- `seamColor`: màu nhấn cho giao diện ứng dụng gốc (bong bóng chế độ Talk, v.v.).
- `assistant`: Kiểm soát ghi đè danh tính giao diện người dùng. Trở lại danh tính agent đang hoạt động.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // hoặc OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // cho mode=trusted-proxy; xem /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // yêu cầu cho Control UI không phải loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // chế độ dự phòng nguồn tiêu đề Host nguy hiểm
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Tùy chọn. Mặc định là false.
    allowRealIpFallback: false,
    tools: {
      // Các từ chối HTTP bổ sung /tools/invoke
      deny: ["browser"],
      // Xóa các công cụ khỏi danh sách từ chối HTTP mặc định
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Chi tiết trường Gateway">

- `mode`: `local` (chạy gateway) hoặc `remote` (kết nối đến gateway từ xa). Gateway từ chối khởi động trừ khi là `local`.
- `port`: cổng đơn cho WS + HTTP. Ưu tiên: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (mặc định), `lan` (`0.0.0.0`), `tailnet` (chỉ IP Tailscale), hoặc `custom`.
- **Bí danh bind cũ**: sử dụng các giá trị chế độ bind trong `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), không phải các bí danh host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Lưu ý Docker**: bind `loopback` mặc định lắng nghe trên `127.0.0.1` bên trong container. Với mạng cầu Docker (`-p 18789:18789`), lưu lượng đến trên `eth0`, do đó gateway không thể truy cập. Sử dụng `--network host`, hoặc đặt `bind: "lan"` (hoặc `bind: "custom"` với `customBindHost: "0.0.0.0"`) để lắng nghe trên tất cả các giao diện.
- **Auth**: yêu cầu theo mặc định. Các bind không phải loopback yêu cầu một token/mật khẩu chia sẻ. Trình hướng dẫn onboarding tạo một token theo mặc định.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình (bao gồm cả SecretRefs), đặt `gateway.auth.mode` rõ ràng thành `token` hoặc `password`. Các luồng khởi động và cài đặt/dịch vụ sửa chữa sẽ thất bại khi cả hai đều được cấu hình và chế độ không được thiết lập.
- `gateway.auth.mode: "none"`: chế độ không xác thực rõ ràng. Chỉ sử dụng cho các thiết lập loopback cục bộ đáng tin cậy; điều này không được cung cấp bởi các lời nhắc onboarding.
- `gateway.auth.mode: "trusted-proxy"`: ủy quyền xác thực cho một proxy ngược nhận thức danh tính và tin tưởng các tiêu đề danh tính từ `gateway.trustedProxies` (xem [Trusted Proxy Auth](/gateway/trusted-proxy-auth)).
- `gateway.auth.allowTailscale`: khi `true`, các tiêu đề danh tính Tailscale Serve có thể thỏa mãn xác thực Control UI/WebSocket (được xác minh qua `tailscale whois`); các endpoint API HTTP vẫn yêu cầu xác thực token/mật khẩu. Luồng không có token này giả định rằng máy chủ gateway là đáng tin cậy. Mặc định là `true` khi `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: bộ giới hạn xác thực thất bại tùy chọn. Áp dụng cho mỗi IP khách hàng và mỗi phạm vi xác thực (bí mật chia sẻ và token thiết bị được theo dõi độc lập). Các nỗ lực bị chặn trả về `429` + `Retry-After`.
  - `gateway.auth.rateLimit.exemptLoopback` mặc định là `true`; đặt `false` khi bạn cố ý muốn lưu lượng localhost cũng bị giới hạn tốc độ (cho các thiết lập thử nghiệm hoặc triển khai proxy nghiêm ngặt).
- Các nỗ lực xác thực WS nguồn trình duyệt luôn bị giới hạn với miễn trừ loopback bị vô hiệu hóa (phòng thủ sâu chống lại tấn công brute force localhost dựa trên trình duyệt).
- `tailscale.mode`: `serve` (chỉ tailnet, bind loopback) hoặc `funnel` (công khai, yêu cầu xác thực).
- `controlUi.allowedOrigins`: danh sách cho phép nguồn trình duyệt rõ ràng cho kết nối WebSocket Gateway. Yêu cầu khi các khách hàng trình duyệt được mong đợi từ các nguồn không phải loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: chế độ nguy hiểm cho phép dự phòng nguồn tiêu đề Host cho các triển khai cố ý dựa vào chính sách nguồn tiêu đề Host.
- `remote.transport`: `ssh` (mặc định) hoặc `direct` (ws/wss). Đối với `direct`, `remote.url` phải là `ws://` hoặc `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: ghi đè phá vỡ phía khách hàng cho phép `ws://` văn bản rõ ràng đến các IP mạng riêng đáng tin cậy; mặc định vẫn là chỉ loopback cho văn bản rõ ràng.
- `gateway.remote.token` / `.password` là các trường thông tin xác thực khách hàng từ xa. Chúng không cấu hình xác thực gateway tự chúng.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS cơ sở cho relay APNs bên ngoài được sử dụng bởi các bản dựng iOS chính thức/TestFlight sau khi chúng xuất bản các đăng ký dựa trên relay đến gateway. URL này phải khớp với URL relay được biên dịch vào bản dựng iOS.
- `gateway.push.apns.relay.timeoutMs`: thời gian chờ gửi từ gateway đến relay tính bằng mili giây. Mặc định là `10000`.
- Các đăng ký dựa trên relay được ủy quyền cho một danh tính gateway cụ thể. Ứng dụng iOS được ghép đôi sẽ lấy `gateway.identity.get`, bao gồm danh tính đó trong đăng ký relay và chuyển tiếp một quyền gửi phạm vi đăng ký đến gateway. Một gateway khác không thể tái sử dụng đăng ký đã lưu trữ đó.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: ghi đè môi trường tạm thời cho cấu hình relay ở trên.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: lối thoát chỉ phát triển cho các URL relay HTTP loopback. Các URL relay sản xuất nên giữ trên HTTPS.
- `gateway.channelHealthCheckMinutes`: khoảng thời gian kiểm tra sức khỏe kênh tính bằng phút. Đặt `0` để vô hiệu hóa khởi động lại kiểm tra sức khỏe toàn cầu. Mặc định: `5`.
- `gateway.channelStaleEventThresholdMinutes`: ngưỡng sự kiện cũ tính bằng phút. Giữ điều này lớn hơn hoặc bằng `gateway.channelHealthCheckMinutes`. Mặc định: `30`.
- `gateway.channelMaxRestartsPerHour`: số lần khởi động lại kiểm tra sức khỏe tối đa mỗi kênh/tài khoản trong một giờ cuộn. Mặc định: `10`.
- `channels.<provider>.healthMonitor.enabled`: từ chối tùy chọn cho mỗi kênh đối với khởi động lại kiểm tra sức khỏe trong khi giữ cho giám sát toàn cầu được bật.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: ghi đè cho mỗi tài khoản cho các kênh đa tài khoản. Khi được đặt, nó sẽ ưu tiên hơn ghi đè cấp kênh.
- Các đường dẫn cuộc gọi gateway cục bộ có thể sử dụng `gateway.remote.*` làm dự phòng chỉ khi `gateway.auth.*` không được thiết lập.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef và không được giải quyết, giải quyết sẽ thất bại (không có che giấu dự phòng từ xa).
- `trustedProxies`: các IP proxy ngược kết thúc TLS. Chỉ liệt kê các proxy bạn kiểm soát.
- `allowRealIpFallback`: khi `true`, gateway chấp nhận `X-Real-IP` nếu `X-Forwarded-For` bị thiếu. Mặc định `false` cho hành vi đóng thất bại.
- `gateway.tools.deny`: tên công cụ bổ sung bị chặn cho HTTP `POST /tools/invoke` (mở rộng danh sách từ chối mặc định).
- `gateway.tools.allow`: xóa tên công cụ khỏi danh sách từ chối HTTP mặc định.

</Accordion>

### Các endpoint tương thích OpenAI

- Chat Completions: bị vô hiệu hóa theo mặc định. Bật với `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Phản hồi: `gateway.http.endpoints.responses.enabled`.
- Cứng hóa đầu vào URL Phản hồi:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Danh sách cho phép trống được coi là chưa thiết lập; sử dụng `gateway.http.endpoints.responses.files.allowUrl=false`
    và/hoặc `gateway.http.endpoints.responses.images.allowUrl=false` để vô hiệu hóa việc lấy URL.
- Tiêu đề cứng hóa phản hồi tùy chọn:
  - `gateway.http.securityHeaders.strictTransportSecurity` (chỉ đặt cho các nguồn HTTPS bạn kiểm soát; xem [Trusted Proxy Auth](/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Cách ly đa phiên bản

Chạy nhiều gateway trên một máy chủ với các cổng và thư mục trạng thái duy nhất:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Cờ tiện lợi: `--dev` (sử dụng `~/.openclaw-dev` + cổng `19001`), `--profile <name>` (sử dụng `~/.openclaw-<name>`).

Xem [Nhiều Gateway](/gateway/multiple-gateways).

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  },
}
```

Xác thực: `Authorization: Bearer <token>` hoặc `x-openclaw-token: <token>`.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` từ payload yêu cầu chỉ được chấp nhận khi `hooks.allowRequestSessionKey=true` (mặc định: `false`).
- `POST /hooks/<name>` → được giải quyết qua `hooks.mappings`

<Accordion title="Chi tiết Mapping">

- `match.path` khớp với đường dẫn con sau `/hooks` (ví dụ: `/hooks/gmail` → `gmail`).
- `match.source` khớp với một trường payload cho các đường dẫn chung.
- Các mẫu như `{{messages[0].subject}}` đọc từ payload.
- `transform` có thể trỏ đến một module JS/TS trả về một hành động hook.
  - `transform.module` phải là một đường dẫn tương đối và nằm trong `hooks.transformsDir` (các đường dẫn tuyệt đối và di chuyển bị từ chối).
- `agentId` định tuyến đến một agent cụ thể; các ID không xác định sẽ trở lại mặc định.
- `allowedAgentIds`: hạn chế định tuyến rõ ràng (`*` hoặc bỏ qua = cho phép tất cả, `[]` = từ chối tất cả).
- `defaultSessionKey`: khóa phiên cố định tùy chọn cho các lần chạy agent hook mà không có `sessionKey` rõ ràng.
- `allowRequestSessionKey`: cho phép người gọi `/hooks/agent` đặt `sessionKey` (mặc định: `false`).
- `allowedSessionKeyPrefixes`: danh sách cho phép tiền tố tùy chọn cho các giá trị `sessionKey` rõ ràng (yêu cầu + mapping), ví dụ: `["hook:"]`.
- `deliver: true` gửi phản hồi cuối cùng đến một kênh; `channel` mặc định là `last`.
- `model` ghi đè LLM cho lần chạy hook này (phải được cho phép nếu danh mục mô hình được thiết lập).

</Accordion>

### Tích hợp Gmail

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway tự động khởi động `gog gmail watch serve` khi khởi động khi được cấu hình. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để vô hiệu hóa.
- Không chạy một `gog gmail watch serve` riêng biệt cùng với Gateway.

---

## Máy chủ Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // hoặc OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Phục vụ HTML/CSS/JS và A2UI có thể chỉnh sửa bởi agent qua HTTP dưới cổng Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Chỉ cục bộ: giữ `gateway.bind: "loopback"` (mặc định).
- Các bind không phải loopback: các tuyến canvas yêu cầu xác thực Gateway (token/mật khẩu/proxy đáng tin cậy), giống như các bề mặt HTTP Gateway khác.
- Các WebView Node thường không gửi tiêu đề xác thực; sau khi một node được ghép đôi và kết nối, Gateway quảng cáo các URL khả năng phạm vi node cho truy cập canvas/A2UI.
- Các URL khả năng được ràng buộc với phiên WS node đang hoạt động và hết hạn nhanh chóng. Không sử dụng dự phòng dựa trên IP.
- Tiêm khách hàng tải lại trực tiếp vào HTML được phục vụ.
- Tự động tạo `index.html` khởi đầu khi trống.
- Cũng phục vụ A2UI tại `/__openclaw__/a2ui/`.
- Thay đổi yêu cầu khởi động lại gateway.
- Vô hiệu hóa tải lại trực tiếp cho các thư mục lớn hoặc lỗi `EMFILE`.

---

## Khám phá

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (mặc định): bỏ qua `cliPath` + `sshPort` khỏi các bản ghi TXT.
- `full`: bao gồm `cliPath` + `sshPort`.
- Tên máy chủ mặc định là `openclaw`. Ghi đè với `OPENCLAW_MDNS_HOSTNAME`.

### Khu vực rộng (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Ghi một vùng DNS-SD unicast dưới `~/.openclaw/dns/`. Để khám phá mạng chéo, ghép đôi với một máy chủ DNS (CoreDNS được khuyến nghị) + Tailscale DNS phân tách.

Thiết lập: `openclaw dns setup --apply`.

---

## Môi trường

### `env` (biến môi trường nội tuyến)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Các biến môi trường nội tuyến chỉ được áp dụng nếu môi trường quy trình thiếu khóa.
- Các tệp `.env`: CWD `.env` + `~/.openclaw/.env` (không cái nào ghi đè các biến hiện có).
- `shellEnv`: nhập các khóa mong đợi bị thiếu từ hồ sơ shell đăng nhập của bạn.
- Xem [Môi trường](/help/environment) để biết đầy đủ thứ tự ưu tiên.

### Thay thế biến môi trường

Tham chiếu các biến môi trường trong bất kỳ chuỗi cấu hình nào với `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Chỉ các tên viết hoa được khớp: `[A-Z_][A-Z0-9_]*`.
- Các biến bị thiếu/trống sẽ gây ra lỗi khi tải cấu hình.
- Thoát với `$${VAR}` cho một `${VAR}` nguyên văn.
- Hoạt động với `$include`.

---

## Secrets

Tham chiếu bí mật là bổ sung: các giá trị văn bản thuần vẫn hoạt động.

### `SecretRef`

Sử dụng một hình dạng đối tượng:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Xác thực:

- Mẫu `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Mẫu id `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id `source: "file"`: con trỏ JSON tuyệt đối (ví dụ `"/providers/openai/apiKey"`)
- Mẫu id `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id `source: "exec"` không được chứa các đoạn đường dẫn phân tách dấu gạch chéo `.` hoặc `..` (ví dụ `a/../b` bị từ chối)

### Bề mặt thông tin xác thực được hỗ trợ

- Ma trận chính tắc: [Bề mặt thông tin xác thực SecretRef](/reference/secretref-credential-surface)
- `secrets apply` nhắm mục tiêu các đường dẫn thông tin xác thực `openclaw.json` được hỗ trợ.
- Các tham chiếu `auth-profiles.json` được bao gồm trong độ phân giải thời gian chạy và phạm vi kiểm toán.

### Cấu hình nhà cung cấp bí mật

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // nhà cung cấp env rõ ràng tùy chọn
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Ghi chú:

- Nhà cung cấp `file` hỗ trợ `mode: "json"` và `mode: "singleValue"` (`id` phải là `"value"` trong chế độ singleValue).
- Nhà cung cấp `exec` yêu cầu một đường dẫn `command` tuyệt đối và sử dụng các payload giao thức trên stdin/stdout.
- Theo mặc định, các đường dẫn lệnh symlink bị từ chối. Đặt `allowSymlinkCommand: true` để cho phép các đường dẫn symlink trong khi xác thực đường dẫn mục tiêu đã giải quyết.
- Nếu `trustedDirs` được cấu hình, kiểm tra thư mục tin cậy áp dụng cho đường dẫn mục tiêu đã giải quyết.
- Môi trường con `exec` là tối thiểu theo mặc định; truyền các biến cần thiết rõ ràng với `passEnv`.
- Các tham chiếu bí mật được giải quyết tại thời điểm kích hoạt thành một ảnh chụp nhanh trong bộ nhớ, sau đó các đường dẫn yêu cầu chỉ đọc ảnh chụp nhanh.
- Lọc bề mặt hoạt động áp dụng trong quá trình kích hoạt: các tham chiếu không được giải quyết trên các bề mặt được bật sẽ gây ra lỗi khởi động/tải lại, trong khi các bề mặt không hoạt động bị bỏ qua với chẩn đoán.

---

## Lưu trữ xác thực

```json5
{
  auth: {
    profiles: {
      "anthropic:me@example.com": { provider: "anthropic", mode: "oauth", email: "me@example.com" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
    },
    order: {
      anthropic: ["anthropic:me@example.com", "anthropic:work"],
    },
  },
}
```

- Hồ sơ mỗi agent được lưu trữ tại `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` hỗ trợ các tham chiếu cấp giá trị (`keyRef` cho `api_key`, `tokenRef` cho `token`).
- Các thông tin xác thực thời gian chạy tĩnh đến từ các ảnh chụp nhanh đã giải quyết trong bộ nhớ; các mục `auth.json` tĩnh cũ bị xóa khi được phát hiện.
- Nhập OAuth cũ từ `~/.openclaw/credentials/oauth.json`.
- Xem [OAuth](/concepts/oauth).
- Hành vi thời gian chạy của Secrets và công cụ `audit/configure/apply`: [Quản lý Secrets](/gateway/secrets).

---

## Ghi nhật ký

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Tệp nhật ký mặc định: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Đặt `logging.file` cho một đường dẫn ổn định.
- `consoleLevel` tăng lên `debug` khi `--verbose`.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` kiểm soát kiểu tagline banner:
  - `"random"` (mặc định): tagline hài hước/mùa vụ xoay vòng.
  - `"default"`: tagline trung lập cố định (`All your chats, one OpenClaw.`).
  - `"off"`: không có văn bản tagline (tiêu đề/banner vẫn được hiển thị).
- Để ẩn toàn bộ banner (không chỉ tagline), đặt môi trường `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadata được ghi bởi các luồng thiết lập hướng dẫn CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Danh tính

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
      },
    ],
  },
}
```

Được ghi bởi trợ lý onboarding macOS. Lấy mặc định:

- `messages.ackReaction` từ `identity.emoji` (trở lại 👀)
- `mentionPatterns` từ `identity.name`/`identity.emoji`
- `avatar` chấp nhận: đường dẫn tương đối workspace, URL `http(s)`, hoặc URI `data:`

---

## Bridge (cũ, đã bị loại bỏ)

Các bản dựng hiện tại không còn bao gồm cầu TCP. Các node kết nối qua WebSocket Gateway. Các khóa `bridge.*` không còn là một phần của schema cấu hình (xác thực thất bại cho đến khi bị loại bỏ; `openclaw doctor --fix` có thể loại bỏ các khóa không xác định).

<Accordion title="Cấu hình cầu cũ (tham khảo lịch sử)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // dự phòng lỗi thời cho các công việc lưu trữ notify:true
    webhookToken: "replace-with-dedicated-token", // token bearer tùy chọn cho xác thực webhook gửi đi
    sessionRetention: "24h", // chuỗi thời lượng hoặc false
    runLog: {
      maxBytes: "2mb", // mặc định 2_000_000 bytes
      keepLines: 2000, // mặc định 2000
    },
  },
}
```

- `sessionRetention`: thời gian giữ các phiên chạy cron cô lập đã hoàn thành trước khi cắt tỉa khỏi `sessions.json`. Cũng kiểm soát việc dọn dẹp các bản ghi đã xóa đã lưu trữ. Mặc định: `24h`; đặt `false` để vô hiệu hóa.
- `runLog.maxBytes`: kích thước tối đa cho mỗi tệp nhật ký chạy (`cron/runs/<jobId>.jsonl`) trước khi cắt tỉa. Mặc định: `2_000_000` bytes.
- `runLog.keepLines`: các dòng mới nhất được giữ lại khi cắt tỉa nhật ký chạy được kích hoạt. Mặc định: `2000`.
- `webhookToken`: token bearer được sử dụng cho việc gửi POST webhook cron (`delivery.mode = "webhook"`), nếu bị bỏ qua không có tiêu đề xác thực nào được gửi.
- `webhook`: URL webhook dự phòng lỗi thời (http/https) chỉ được sử dụng cho các công việc lưu trữ vẫn có `notify: true`.

Xem [Công việc Cron](/automation/cron-jobs).

---

## Biến mẫu mô hình Media

Các chỗ giữ mẫu được mở rộng trong `tools.media.models[].args`:

| Biến               | Mô tả                                               |
| ------------------ | --------------------------------------------------- |
| `{{Body}}`         | Nội dung tin nhắn đến đầy đủ                        |
| `{{RawBody}}`      | Nội dung thô (không có lịch sử/gói người gửi)       |
| `{{BodyStripped}}` | Nội dung với các đề cập nhóm bị loại bỏ             |
| `{{From}}`         | Định danh người gửi                                 |
| `{{To}}`           | Định danh đích                                      |
| `{{MessageSid}}`   | ID tin nhắn kênh                                    |
| `{{SessionId}}`    | UUID phiên hiện tại                                 |
| `{{IsNewSession}}` | `"true"` khi phiên mới được tạo                     |
| `{{MediaUrl}}`     | Pseudo-URL media đến                               |
| `{{MediaPath}}`    | Đường dẫn media cục bộ                              |
| `{{MediaType}}`    | Loại media (hình ảnh/âm thanh/tài liệu/…)          |
| `{{Transcript}}`   | Bản ghi âm thanh                                    |
| `{{Prompt}}`       | Lời nhắc media đã giải quyết cho các mục CLI       |
| `{{MaxChars}}`     | Số ký tự đầu ra tối đa đã giải quyết cho các mục CLI|
| `{{ChatType}}`     | `"direct"` hoặc `"group"`                           |
| `{{GroupSubject}}` | Chủ đề nhóm (nỗ lực tốt nhất)                       |
| `{{GroupMembers}}` | Xem trước thành viên nhóm (nỗ lực tốt nhất)         |
| `{{SenderName}}`   | Tên hiển thị người gửi (nỗ lực tốt nhất)            |
| `{{SenderE164}}`   | Số điện thoại người gửi (nỗ lực tốt nhất)           |
| `{{Provider}}`     | Gợi ý nhà cung cấp (whatsapp, telegram, discord, v.v.) |

---

## Bao gồm cấu hình (`$include`)

Chia cấu hình thành nhiều tệp:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Hành vi hợp nhất:**

- Tệp đơn: thay thế đối tượng chứa.
- Mảng tệp: hợp nhất sâu theo thứ tự (sau ghi đè trước).
- Các khóa cùng cấp: hợp nhất sau khi bao gồm (ghi đè các giá trị đã bao gồm).
- Bao gồm lồng nhau: tối đa 10 cấp độ sâu.
- Đường dẫn: được giải quyết tương đối với tệp bao gồm, nhưng phải nằm trong thư mục cấu hình cấp cao nhất (`dirname` của `openclaw.json`). Các dạng tuyệt đối/`../` chỉ được phép khi chúng vẫn giải quyết bên trong ranh giới đó.
- Lỗi: thông báo rõ ràng cho các tệp bị thiếu, lỗi phân tích cú pháp và bao gồm vòng tròn.

---

_Liên quan: [Cấu hình](/gateway/configuration) · [Ví dụ cấu hình](/gateway/configuration-examples) · [Doctor](/gateway/doctor)_
