---
title: "Tham khảo cấu hình"
summary: "Tham khảo đầy đủ cho mọi khóa cấu hình OpenClaw, giá trị mặc định và cài đặt kênh"
read_when:
  - Cần biết chính xác ngữ nghĩa cấu hình cấp trường hoặc giá trị mặc định
  - Đang xác thực các khối cấu hình kênh, mô hình, gateway hoặc công cụ
---

# Tham khảo cấu hình

Mọi trường có sẵn trong `~/.openclaw/openclaw.json`. Để có cái nhìn tổng quan theo nhiệm vụ, xem [Cấu hình](/gateway/configuration).

Định dạng cấu hình là **JSON5** (cho phép comment và dấu phẩy cuối). Tất cả các trường đều không bắt buộc — OpenClaw sử dụng giá trị mặc định an toàn khi bị bỏ qua.

---

## Kênh

Mỗi kênh tự động khởi động khi phần cấu hình của nó tồn tại (trừ khi `enabled: false`).

### Truy cập DM và nhóm

Tất cả các kênh hỗ trợ chính sách DM và chính sách nhóm:

| Chính sách DM       | Hành vi                                                         |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (mặc định) | Người gửi không xác định nhận mã ghép nối một lần; chủ sở hữu phải phê duyệt |
| `allowlist`         | Chỉ người gửi trong `allowFrom` (hoặc kho lưu trữ ghép nối cho phép) |
| `open`              | Cho phép tất cả DM đến (yêu cầu `allowFrom: ["*"]`)             |
| `disabled`          | Bỏ qua tất cả DM đến                                           |

| Chính sách nhóm       | Hành vi                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (mặc định) | Chỉ các nhóm khớp với danh sách cho phép đã cấu hình  |
| `open`                | Bỏ qua danh sách cho phép nhóm (vẫn áp dụng giới hạn nhắc đến) |
| `disabled`            | Chặn tất cả tin nhắn nhóm/phòng                        |

<Note>
`channels.defaults.groupPolicy` thiết lập mặc định khi `groupPolicy` của nhà cung cấp không được đặt.
Mã ghép nối hết hạn sau 1 giờ. Yêu cầu ghép nối DM đang chờ xử lý bị giới hạn ở **3 mỗi kênh**.
Nếu một khối nhà cung cấp hoàn toàn thiếu (`channels.<provider>` không có), chính sách nhóm thời gian chạy sẽ quay lại `allowlist` (fail-closed) với cảnh báo khởi động.
</Note>

### Ghi đè mô hình kênh

Sử dụng `channels.modelByChannel` để gán ID kênh cụ thể cho một mô hình. Giá trị chấp nhận `provider/model` hoặc bí danh mô hình đã cấu hình. Ánh xạ kênh áp dụng khi một phiên chưa có ghi đè mô hình (ví dụ, được đặt qua `/model`).

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

### Mặc định kênh và heartbeat

Sử dụng `channels.defaults` cho chính sách nhóm chia sẻ và hành vi heartbeat trên các nhà cung cấp:

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
- `channels.defaults.heartbeat.showOk`: bao gồm trạng thái kênh khỏe mạnh trong đầu ra heartbeat.
- `channels.defaults.heartbeat.showAlerts`: bao gồm trạng thái suy giảm/lỗi trong đầu ra heartbeat.
- `channels.defaults.heartbeat.useIndicator`: hiển thị đầu ra heartbeat kiểu chỉ báo gọn.

### WhatsApp

WhatsApp chạy qua kênh web của gateway (Baileys Web). Nó tự động khởi động khi có phiên đã liên kết.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // dấu tick xanh (false trong chế độ tự chat)
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

- Lệnh outbound mặc định cho tài khoản `default` nếu có; nếu không thì tài khoản id đầu tiên được cấu hình (sắp xếp).
- `channels.whatsapp.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định đó khi nó khớp với một id tài khoản đã cấu hình.
- Thư mục auth Baileys đơn tài khoản cũ được di chuyển bởi `openclaw doctor` vào `whatsapp/default`.
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
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off)
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
- `configWrites: false` chặn các ghi cấu hình do Telegram khởi tạo (di chuyển ID supergroup, `/config set|unset`).
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` cấu hình các ràng buộc ACP liên tục cho các chủ đề diễn đàn (sử dụng `chatId:topic:topicId` chuẩn trong `match.peer.id`). Ngữ nghĩa trường được chia sẻ trong [ACP Agents](/tools/acp-agents#channel-specific-settings).
- Các bản xem trước luồng Telegram sử dụng `sendMessage` + `editMessageText` (hoạt động trong các cuộc trò chuyện trực tiếp và nhóm).
- Chính sách retry: xem [Chính sách retry](/concepts/retry).

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
              systemPrompt: "Short answers only.",
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
- Các cuộc gọi outbound trực tiếp cung cấp một `token` Discord rõ ràng sử dụng token đó cho cuộc gọi; cài đặt retry/chính sách tài khoản vẫn đến từ tài khoản được chọn trong ảnh chụp nhanh runtime đang hoạt động.
- `channels.discord.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.
- Sử dụng `user:<id>` (DM) hoặc `channel:<id>` (kênh guild) cho các mục tiêu gửi; các ID số không có bị từ chối.
- Các slug guild là chữ thường với khoảng trắng được thay thế bằng `-`; các khóa kênh sử dụng tên slug (không có `#`). Ưu tiên ID guild.
- Các tin nhắn do bot tạo ra bị bỏ qua theo mặc định. `allowBots: true` kích hoạt chúng; sử dụng `allowBots: "mentions"` để chỉ chấp nhận tin nhắn bot nhắc đến bot (các tin nhắn của chính mình vẫn bị lọc).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (và ghi đè kênh) bỏ qua các tin nhắn nhắc đến người dùng hoặc vai trò khác nhưng không nhắc đến bot (trừ @everyone/@here).
- `maxLinesPerMessage` (mặc định 17) chia các tin nhắn cao ngay cả khi dưới 2000 ký tự.
- `channels.discord.threadBindings` kiểm soát định tuyến ràng buộc luồng Discord:
  - `enabled`: ghi đè Discord cho các tính năng phiên ràng buộc luồng (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, và giao hàng/routing ràng buộc)
  - `idleHours`: ghi đè Discord cho tự động unfocus không hoạt động trong giờ (`0` vô hiệu hóa)
  - `maxAgeHours`: ghi đè Discord cho tuổi tối đa cứng trong giờ (`0` vô hiệu hóa)
  - `spawnSubagentSessions`: công tắc opt-in cho `sessions_spawn({ thread: true })` tự động tạo/binding luồng
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` cấu hình các ràng buộc ACP liên tục cho các kênh và luồng (sử dụng id kênh/luồng trong `match.peer.id`). Ngữ nghĩa trường được chia sẻ trong [ACP Agents](/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` thiết lập màu nhấn cho các container v2 của Discord.
- `channels.discord.voice` kích hoạt các cuộc trò chuyện kênh giọng nói Discord và tự động tham gia + ghi đè TTS tùy chọn.
- `channels.discord.voice.daveEncryption` và `channels.discord.voice.decryptionFailureTolerance` truyền qua các tùy chọn DAVE của `@discordjs/voice` (`true` và `24` theo mặc định).
- OpenClaw cũng cố gắng khôi phục nhận giọng nói bằng cách rời khỏi/tham gia lại một phiên giọng nói sau khi gặp lỗi giải mã lặp lại.
- `channels.discord.streaming` là khóa chế độ luồng chuẩn. Các giá trị `streamMode` và `streaming` boolean cũ được tự động di chuyển.
- `channels.discord.autoPresence` ánh xạ khả dụng runtime thành sự hiện diện của bot (khỏe mạnh => online, suy giảm => idle, kiệt sức => dnd) và cho phép ghi đè văn bản trạng thái tùy chọn.
- `channels.discord.dangerouslyAllowNameMatching` kích hoạt lại khớp tên/tag có thể thay đổi (chế độ tương thích phá vỡ kính).

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

- JSON tài khoản dịch vụ: inline (`serviceAccount`) hoặc dựa trên file (`serviceAccountFile`).
- SecretRef tài khoản dịch vụ cũng được hỗ trợ (`serviceAccountRef`).
- Dự phòng env: `GOOGLE_CHAT_SERVICE_ACCOUNT` hoặc `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Sử dụng `spaces/<spaceId>` hoặc `users/<userId>` cho các mục tiêu gửi.
- `channels.googlechat.dangerouslyAllowNameMatching` kích hoạt lại khớp tên email có thể thay đổi (chế độ tương thích phá vỡ kính).

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
          systemPrompt: "Short answers only.",
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
      streaming: "partial", // off | partial | block | progress (preview mode)
      nativeStreaming: true, // use Slack native streaming API when streaming=partial
      mediaMaxMb: 20,
    },
  },
}
```

- **Chế độ Socket** yêu cầu cả `botToken` và `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` cho dự phòng tài khoản mặc định).
- **Chế độ HTTP** yêu cầu `botToken` cộng với `signingSecret` (ở root hoặc theo tài khoản).
- `configWrites: false` chặn các ghi cấu hình do Slack khởi tạo.
- `channels.slack.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.
- `channels.slack.streaming` là khóa chế độ luồng chuẩn. Các giá trị `streamMode` và `streaming` boolean cũ được tự động di chuyển.
- Sử dụng `user:<id>` (DM) hoặc `channel:<id>` cho các mục tiêu gửi.

**Chế độ thông báo phản ứng:** `off`, `own` (mặc định), `all`, `allowlist` (từ `reactionAllowlist`).

**Cách ly phiên luồng:** `thread.historyScope` là theo luồng (mặc định) hoặc chia sẻ trên kênh. `thread.inheritParent` sao chép bản ghi kênh cha vào các luồng mới.

- `typingReaction` thêm một phản ứng tạm thời vào tin nhắn Slack đến trong khi một phản hồi đang chạy, sau đó loại bỏ nó khi hoàn thành. Sử dụng một shortcode emoji Slack như `"hourglass_flowing_sand"`.

| Nhóm hành động | Mặc định | Ghi chú                  |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | React + list reactions |
| messages     | enabled | Read/send/edit/delete  |
| pins         | enabled | Pin/unpin/list         |
| memberInfo   | enabled | Member info            |
| emojiList    | enabled | Custom emoji list      |

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

Chế độ chat: `oncall` (phản hồi khi được @-mention, mặc định), `onmessage` (mỗi tin nhắn), `onchar` (tin nhắn bắt đầu bằng tiền tố kích hoạt).

Khi các lệnh gốc Mattermost được kích hoạt:

- `commands.callbackPath` phải là một đường dẫn (ví dụ `/api/channels/mattermost/command`), không phải là một URL đầy đủ.
- `commands.callbackUrl` phải giải quyết đến điểm cuối gateway OpenClaw và có thể truy cập từ máy chủ Mattermost.
- Đối với các máy chủ callback riêng/tailnet/nội bộ, Mattermost có thể yêu cầu
  `ServiceSettings.AllowedUntrustedInternalConnections` để bao gồm máy chủ/tên miền callback.
  Sử dụng các giá trị máy chủ/tên miền, không phải URL đầy đủ.
- `channels.mattermost.configWrites`: cho phép hoặc từ chối các ghi cấu hình do Mattermost khởi tạo.
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

- `channels.signal.account`: ghim khởi động kênh vào một danh tính tài khoản Signal cụ thể.
- `channels.signal.configWrites`: cho phép hoặc từ chối các ghi cấu hình do Signal khởi tạo.
- `channels.signal.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.

### BlueBubbles

BlueBubbles là đường dẫn iMessage được khuyến nghị (hỗ trợ plugin, cấu hình dưới `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // xem /channels/bluebubbles
    },
  },
}
```

- Các đường dẫn khóa cốt lõi được đề cập ở đây: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
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
- `attachmentRoots` và `remoteAttachmentRoots` giới hạn các đường dẫn tệp đính kèm đến (mặc định: `/Users/*/Library/Messages/Attachments`).
- SCP sử dụng kiểm tra khóa máy chủ nghiêm ngặt, vì vậy hãy đảm bảo khóa máy chủ relay đã tồn tại trong `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: cho phép hoặc từ chối các ghi cấu hình do iMessage khởi tạo.

<Accordion title="Ví dụ về trình bao SSH iMessage">

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
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // xem /channels/msteams
    },
  },
}
```

- Các đường dẫn khóa cốt lõi được đề cập ở đây: `channels.msteams`, `channels.msteams.configWrites`.
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

- Các đường dẫn khóa cốt lõi được đề cập ở đây: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
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
- Các token env chỉ áp dụng cho tài khoản **mặc định**.
- Cài đặt kênh cơ bản áp dụng cho tất cả các tài khoản trừ khi bị ghi đè theo tài khoản.
- Sử dụng `bindings[].match.accountId` để định tuyến mỗi tài khoản đến một agent khác nhau.
- Nếu bạn thêm một tài khoản không mặc định qua `openclaw channels add` (hoặc onboarding kênh) trong khi vẫn đang ở cấu hình kênh cấp cao nhất đơn tài khoản, OpenClaw di chuyển các giá trị đơn tài khoản cấp cao nhất vào `channels.<channel>.accounts.default` trước để tài khoản gốc tiếp tục hoạt động.
- Các ràng buộc chỉ có kênh hiện có (không có `accountId`) vẫn khớp với tài khoản mặc định; các ràng buộc theo tài khoản vẫn là tùy chọn.
- `openclaw doctor --fix` cũng sửa chữa các hình dạng hỗn hợp bằng cách di chuyển các giá trị đơn tài khoản cấp cao nhất vào `accounts.default` khi các tài khoản được đặt tên tồn tại nhưng `default` bị thiếu.

### Các kênh mở rộng khác

Nhiều kênh mở rộng được cấu hình dưới dạng `channels.<id>` và được tài liệu trong các trang kênh riêng của chúng (ví dụ Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, và Synology Chat, Twitch).
Xem chỉ mục kênh đầy đủ: [Channels](/channels).

### Giới hạn nhắc đến trong chat nhóm

Các tin nhắn nhóm mặc định yêu cầu **nhắc đến** (nhắc đến metadata hoặc các mẫu regex an toàn). Áp dụng cho các cuộc trò chuyện nhóm WhatsApp, Telegram, Discord, Google Chat, và iMessage.

**Các loại nhắc đến:**

- **Nhắc đến metadata**: Nhắc đến @-native trên nền tảng. Bị bỏ qua trong chế độ tự chat WhatsApp.
- **Mẫu văn bản**: Các mẫu regex an toàn trong `agents.list[].groupChat.mentionPatterns`. Các mẫu không hợp lệ và lặp lại lồng nhau không an toàn bị bỏ qua.
- Giới hạn nhắc đến chỉ được thực thi khi có thể phát hiện (nhắc đến native hoặc ít nhất một mẫu).

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

`messages.groupChat.historyLimit` thiết lập mặc định toàn cầu. Các kênh có thể ghi đè với `channels.<channel>.historyLimit` (hoặc theo tài khoản). Đặt `0` để vô hiệu hóa.

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

Giải quyết: ghi đè theo DM → mặc định nhà cung cấp → không giới hạn (tất cả được giữ lại).

Hỗ trợ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Chế độ tự chat

Bao gồm số của chính bạn trong `allowFrom` để kích hoạt chế độ tự chat (bỏ qua nhắc đến @-native, chỉ phản hồi các mẫu văn bản):

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
    native: "auto", // đăng ký lệnh native khi được hỗ trợ
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

- Các lệnh văn bản phải là **tin nhắn độc lập** với dấu `/` đầu tiên.
- `native: "auto"` bật lệnh native cho Discord/Telegram, để Slack tắt.
- Ghi đè theo kênh: `channels.discord.commands.native` (bool hoặc `"auto"`). `false` xóa các lệnh đã đăng ký trước đó.
- `channels.telegram.customCommands` thêm các mục menu bot Telegram tùy chỉnh.
- `bash: true` kích hoạt `! <cmd>` cho shell host. Yêu cầu `tools.elevated.enabled` và người gửi trong `tools.elevated.allowFrom.<channel>`.
- `config: true` kích hoạt `/config` (đọc/ghi `openclaw.json`). Đối với các khách hàng `chat.send` gateway, các ghi `/config set|unset` bền vững cũng yêu cầu `operator.admin`; `/config show` chỉ đọc vẫn có sẵn cho các khách hàng operator có phạm vi ghi thông thường.
- `channels.<provider>.configWrites` chặn các thay đổi cấu hình theo kênh (mặc định: true).
- Đối với các kênh đa tài khoản, `channels.<provider>.accounts.<id>.configWrites` cũng chặn các ghi nhắm mục tiêu tài khoản đó (ví dụ `/allowlist --config --account <id>` hoặc `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` là theo nhà cung cấp. Khi được đặt, nó là nguồn ủy quyền **duy nhất** (danh sách cho phép kênh/ghép nối và `useAccessGroups` bị bỏ qua).
- `useAccessGroups: false` cho phép các lệnh bỏ qua các chính sách nhóm truy cập khi `allowFrom` không được đặt.

</Accordion>

---

## Mặc định agent

### `agents.defaults.workspace`

Mặc định: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Gốc repository tùy chọn được hiển thị trong dòng Runtime của system prompt. Nếu không được đặt, OpenClaw tự động phát hiện bằng cách đi lên từ workspace.

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

Tổng số ký tự tối đa được tiêm vào tất cả các file bootstrap workspace. Mặc định: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kiểm soát văn bản cảnh báo có thể nhìn thấy của agent khi ngữ cảnh bootstrap bị cắt ngắn.
Mặc định: `"once"`.

- `"off"`: không bao giờ tiêm văn bản cảnh báo vào system prompt.
- `"once"`: tiêm cảnh báo một lần cho mỗi chữ ký cắt ngắn duy nhất (khuyến nghị).
- `"always"`: tiêm cảnh báo mỗi lần chạy khi có cắt ngắn.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Kích thước pixel tối đa cho cạnh dài nhất của khối hình ảnh transcript/tool trước khi gọi nhà cung cấp.
Mặc định: `1200`.

Giá trị thấp hơn thường giảm sử dụng vision-token và kích thước payload yêu cầu cho các lần chạy nặng ảnh chụp màn hình.
Giá trị cao hơn giữ lại nhiều chi tiết hình ảnh hơn.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Múi giờ cho ngữ cảnh system prompt (không phải dấu thời gian tin nhắn). Dự phòng cho múi giờ host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Định dạng thời gian trong system prompt. Mặc định: `auto` (ưu tiên OS).

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
  - Dạng đối tượng đặt mô hình chính cộng với các mô hình failover theo thứ tự.
- `imageModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được sử dụng bởi đường dẫn công cụ `image` làm cấu hình mô hình vision của nó.
  - Cũng được sử dụng làm định tuyến dự phòng khi mô hình được chọn/mặc định không thể chấp nhận đầu vào hình ảnh.
- `imageGenerationModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được sử dụng bởi khả năng tạo hình ảnh chia sẻ và bất kỳ bề mặt công cụ/plugin tương lai nào tạo ra hình ảnh.
  - Các giá trị điển hình: `google/gemini-3-pro-image-preview` cho luồng kiểu Nano Banana native, `fal/fal-ai/flux/dev` cho fal, hoặc `openai/gpt-image-1` cho OpenAI Images.
  - Nếu bị bỏ qua, `image_generate` vẫn có thể suy ra một nhà cung cấp mặc định nỗ lực tốt nhất từ các nhà cung cấp tạo hình ảnh có hỗ trợ xác thực.
  - Các giá trị điển hình: `google/gemini-3-pro-image-preview`, `fal/fal-ai/flux/dev`, `openai/gpt-image-1`.
- `pdfModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được sử dụng bởi công cụ `pdf` để định tuyến mô hình.
  - Nếu bị bỏ qua, công cụ PDF quay lại `imageModel`, sau đó là các nhà cung cấp mặc định nỗ lực tốt nhất.
- `pdfMaxBytesMb`: giới hạn kích thước PDF mặc định cho công cụ `pdf` khi `maxBytesMb` không được truyền tại thời gian gọi.
- `pdfMaxPages`: số trang tối đa mặc định được xem xét bởi chế độ dự phòng trích xuất trong công cụ `pdf`.
- `model.primary`: định dạng `provider/model` (ví dụ `anthropic/claude-opus-4-6`). Nếu bạn bỏ qua nhà cung cấp, OpenClaw giả định `anthropic` (không khuyến nghị).
- `models`: danh mục mô hình đã cấu hình và danh sách cho phép cho `/model`. Mỗi mục có thể bao gồm `alias` (lối tắt) và `params` (cụ thể cho nhà cung cấp, ví dụ `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- Tiền lệ hợp nhất `params` (cấu hình): `agents.defaults.models["provider/model"].params` là cơ sở, sau đó `agents.list[].params` (khớp với id agent) ghi đè theo khóa.
- Các trình ghi cấu hình thay đổi các trường này (ví dụ `/models set`, `/models set-image`, và các lệnh thêm/xóa dự phòng) lưu dạng đối tượng chuẩn và bảo tồn danh sách dự phòng hiện có khi có thể.
- `maxConcurrent`: số lần chạy agent song song tối đa trên các phiên (mỗi phiên vẫn được tuần tự hóa). Mặc định: 1.

**Các lối tắt bí danh tích hợp sẵn** (chỉ áp dụng khi mô hình nằm trong `agents.defaults.models`):

| Bí danh               | Mô hình                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5-mini`                    |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Các bí danh được cấu hình của bạn luôn thắng so với mặc định.

Các mô hình Z.AI GLM-4.x tự động kích hoạt chế độ suy nghĩ trừ khi bạn đặt `--thinking off` hoặc tự định nghĩa `agents.defaults.models["zai/<model>"].params.thinking`.
Các mô hình Z.AI kích hoạt `tool_stream` theo mặc định cho luồng gọi công cụ. Đặt `agents.defaults.models["zai/<model>"].params.tool_stream` thành `false` để vô hiệu hóa nó.
Các mô hình Anthropic Claude 4.6 mặc định là `adaptive` thinking khi không có mức thinking rõ ràng nào được đặt.

### `agents.defaults.cliBackends`

Các backend CLI tùy chọn cho các lần chạy dự phòng chỉ có văn bản (không có cuộc gọi công cụ). Hữu ích như một bản sao lưu khi các nhà cung cấp API thất bại.

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

- Các backend CLI là văn bản trước tiên; các công cụ luôn bị vô hiệu hóa.
- Các phiên được hỗ trợ khi `sessionArg` được đặt.
- Hỗ trợ truyền hình ảnh khi `imageArg` chấp nhận đường dẫn tệp.

### `agents.defaults.heartbeat`

Các lần chạy heartbeat định kỳ.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m vô hiệu hóa
        model: "openai/gpt-5.2-mini",
        includeReasoning: false,
        lightContext: false, // mặc định: false; true chỉ giữ lại HEARTBEAT.md từ các file bootstrap workspace
        isolatedSession: false, // mặc định: false; true chạy mỗi heartbeat trong một phiên mới (không có lịch sử hội thoại)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (mặc định) | block
        target: "none", // mặc định: none | tùy chọn: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: chuỗi thời lượng (ms/s/m/h). Mặc định: `30m`.
- `suppressToolErrorWarnings`: khi true, ngăn chặn các payload cảnh báo lỗi công cụ trong các lần chạy heartbeat.
- `directPolicy`: chính sách giao hàng trực tiếp/DM. `allow` (mặc định) cho phép giao hàng mục tiêu trực tiếp. `block` ngăn chặn giao hàng mục tiêu trực tiếp và phát ra `reason=dm-blocked`.
- `lightContext`: khi true, các lần chạy heartbeat sử dụng ngữ cảnh bootstrap nhẹ và chỉ giữ lại `HEARTBEAT.md` từ các file bootstrap workspace.
- `isolatedSession`: khi true, mỗi heartbeat chạy trong một phiên mới không có lịch sử hội thoại trước đó. Cùng mẫu cách ly như cron `sessionTarget: "isolated"`. Giảm chi phí token mỗi heartbeat từ ~100K xuống ~2-5K token.
- Theo agent: đặt `agents.list[].heartbeat`. Khi bất kỳ agent nào định nghĩa `heartbeat`, **chỉ những agent đó** chạy heartbeat.
- Heartbeat chạy các lượt agent đầy đủ — các khoảng thời gian ngắn hơn tiêu tốn nhiều token hơn.

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
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` hoặc `safeguard` (tóm tắt chia nhỏ cho các lịch sử dài). Xem [Compaction](/concepts/compaction).
- `timeoutSeconds`: số giây tối đa cho phép cho một thao tác compaction trước khi OpenClaw hủy bỏ nó. Mặc định: `900`.
- `identifierPolicy`: `strict` (mặc định), `off`, hoặc `custom`. `strict` thêm hướng dẫn giữ lại định danh mờ đục tích hợp trong quá trình tóm tắt compaction.
- `identifierInstructions`: văn bản bảo quản định danh tùy chỉnh tùy chọn được sử dụng khi `identifierPolicy=custom`.
- `postCompactionSections`: các tên phần AGENTS.md H2/H3 tùy chọn để tiêm lại sau compaction. Mặc định là `["Session Startup", "Red Lines"]`; đặt `[]` để vô hiệu hóa tiêm lại. Khi không được đặt hoặc được đặt rõ ràng thành cặp mặc định đó, các tiêu đề `Every Session`/`Safety` cũ hơn cũng được chấp nhận như một dự phòng cũ.
- `model`: ghi đè `provider/model-id` tùy chọn cho chỉ tóm tắt compaction. Sử dụng điều này khi phiên chính nên giữ một mô hình nhưng các tóm tắt compaction nên chạy trên một mô hình khác; khi không được đặt, compaction sử dụng mô hình chính của phiên.
- `memoryFlush`: lượt agent im lặng trước khi tự động compaction để lưu trữ các ký ức bền vững. Bỏ qua khi workspace chỉ đọc.

### `agents.defaults.contextPruning`

Cắt tỉa **kết quả công cụ cũ** khỏi ngữ cảnh trong bộ nhớ trước khi gửi đến LLM. Không **sửa đổi** lịch sử phiên trên đĩa.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` kích hoạt các lượt cắt tỉa.
- `ttl` kiểm soát tần suất cắt tỉa có thể chạy lại (sau lần chạm cache cuối cùng).
- Cắt tỉa mềm cắt tỉa các kết quả công cụ quá khổ trước, sau đó xóa cứng các kết quả công cụ cũ hơn nếu cần.

**Cắt tỉa mềm** giữ lại phần đầu + cuối và chèn `...` ở giữa.

**Xóa cứng** thay thế toàn bộ kết quả công cụ bằng placeholder.

Ghi chú:

- Các khối hình ảnh không bao giờ bị cắt tỉa/xóa.
- Các tỷ lệ là dựa trên ký tự (xấp xỉ), không phải số lượng token chính xác.
- Nếu ít hơn `keepLastAssistants` tin nhắn trợ lý tồn tại, cắt tỉa bị bỏ qua.

</Accordion>

Xem [Session Pruning](/concepts/session-pruning) để biết chi tiết hành vi.

### Luồng khối

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Các kênh không phải Telegram yêu cầu `*.blockStreaming: true` rõ ràng để kích hoạt phản hồi khối.
- Ghi đè kênh: `channels.<channel>.blockStreamingCoalesce` (và các biến thể theo tài khoản). Signal/Slack/Discord/Google Chat mặc định `minChars: 1500`.
- `humanDelay`: tạm dừng ngẫu nhiên giữa các phản hồi khối. `natural` = 800–2500ms. Ghi đè theo agent: `agents.list[].humanDelay`.

Xem [Streaming](/concepts/streaming) để biết chi tiết hành vi + chunking.

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

- Mặc định: `instant` cho các cuộc trò chuyện/nhắc đến trực tiếp, `message` cho các cuộc trò chuyện nhóm không được nhắc đến.
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
          // SecretRefs / inline contents also supported:
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

<Accordion title="Chi tiết sandbox">

**Backend:**

- `docker`: runtime Docker cục bộ (mặc định)
- `ssh`: runtime từ xa hỗ trợ SSH chung
- `openshell`: runtime OpenShell

Khi `backend: "openshell"` được chọn, các cài đặt cụ thể cho runtime di chuyển đến
`plugins.entries.openshell.config`.

**Cấu hình backend SSH:**

- `target`: mục tiêu SSH dưới dạng `user@host[:port]`
- `command`: lệnh client SSH (mặc định: `ssh`)
- `workspaceRoot`: gốc từ xa tuyệt đối được sử dụng cho các workspace theo phạm vi
- `identityFile` / `certificateFile` / `knownHostsFile`: các tệp cục bộ hiện có được truyền cho OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: nội dung inline hoặc SecretRefs mà OpenClaw hiện thực hóa thành các tệp tạm thời tại runtime
- `strictHostKeyChecking` / `updateHostKeys`: các nút chính sách khóa máy chủ OpenSSH

**Tiền lệ xác thực SSH:**

- `identityData` thắng `identityFile`
- `certificateData` thắng `certificateFile`
- `knownHostsData` thắng `knownHostsFile`
- Các giá trị `*Data` dựa trên SecretRef được giải quyết từ ảnh chụp nhanh runtime bí mật đang hoạt động trước khi phiên sandbox bắt đầu

**Hành vi backend SSH:**

- gieo workspace từ xa một lần sau khi tạo hoặc tạo lại
- sau đó giữ workspace SSH từ xa là chuẩn
- định tuyến `exec`, các công cụ tệp, và các đường dẫn media qua SSH
- không tự động đồng bộ hóa các thay đổi từ xa trở lại host
- không hỗ trợ các container trình duyệt sandbox

**Truy cập workspace:**

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
          policy: "strict", // id chính sách OpenShell tùy chọn
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

- `mirror`: gieo từ xa từ cục bộ trước khi thực thi, đồng bộ hóa lại sau khi thực thi; workspace cục bộ vẫn là chuẩn
- `remote`: gieo từ xa một lần khi sandbox được tạo, sau đó giữ workspace từ xa là chuẩn

Trong chế độ `remote`, các chỉnh sửa cục bộ trên host được thực hiện ngoài OpenClaw không được đồng bộ hóa vào sandbox tự động sau bước gieo.
Vận chuyển là SSH vào sandbox OpenShell, nhưng plugin sở hữu vòng đời sandbox và đồng bộ hóa gương tùy chọn.

**`setupCommand`** chạy một lần sau khi tạo container (qua `sh -lc`). Cần egress mạng, root có thể ghi, người dùng root.

**Các container mặc định là `network: "none"`** — đặt thành `"bridge"` (hoặc một mạng cầu tùy chỉnh) nếu agent cần truy cập outbound.
`"host"` bị chặn. `"container:<id>"` bị chặn theo mặc định trừ khi bạn đặt rõ ràng
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (phá vỡ kính).

**Các tệp đính kèm đến** được dàn dựng vào `media/inbound/*` trong workspace đang hoạt động.

**`docker.binds`** gắn kết các thư mục host bổ sung; các gắn kết toàn cầu và theo agent được hợp nhất.

**Trình duyệt sandboxed** (`sandbox.browser.enabled`): Chromium + CDP trong một container. URL noVNC được tiêm vào system prompt. Không yêu cầu `browser.enabled` trong `openclaw.json`.
Truy cập quan sát noVNC sử dụng xác thực VNC theo mặc định và OpenClaw phát ra một URL token ngắn hạn (thay vì tiết lộ mật khẩu trong URL chia sẻ).

- `allowHostControl: false` (mặc định) chặn các phiên sandboxed nhắm mục tiêu trình duyệt host.
- `network` mặc định là `openclaw-sandbox-browser` (mạng cầu chuyên dụng). Đặt thành `bridge` chỉ khi bạn muốn kết nối cầu toàn cầu rõ ràng.
- `cdpSourceRange` tùy chọn hạn chế ingress CDP tại cạnh container đến một phạm vi CIDR (ví dụ `172.21.0.1/32`).
- `sandbox.browser.binds` gắn kết các thư mục host bổ sung vào chỉ container trình duyệt sandbox. Khi được đặt (bao gồm `[]`), nó thay thế `docker.binds` cho container trình duyệt.
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
  - `--disable-extensions` (mặc định bật)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, và `--disable-gpu` được
    bật theo mặc định và có thể bị vô hiệu hóa với
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` nếu việc sử dụng WebGL/3D yêu cầu điều đó.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` kích hoạt lại các tiện ích mở rộng nếu quy trình làm việc của bạn
    phụ thuộc vào chúng.
  - `--renderer-process-limit=2` có thể được thay đổi với
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; đặt `0` để sử dụng giới hạn quy trình mặc định của Chromium.
  - cộng với `--no-sandbox` và `--disable-setuid-sandbox` khi `noSandbox` được bật.
  - Các mặc định là cơ sở hình ảnh container; sử dụng một hình ảnh trình duyệt tùy chỉnh với một
    entrypoint tùy chỉnh để thay đổi các mặc định container.

</Accordion>

Trình duyệt sandboxing và `sandbox.docker.binds` hiện chỉ dành cho Docker.

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
        thinkingDefault: "high", // ghi đè mức thinking theo agent
        reasoningDefault: "on", // ghi đè khả năng hiển thị reasoning theo agent
        fastModeDefault: false, // ghi đè chế độ nhanh theo agent
        params: { cacheRetention: "none" }, // ghi đè các params models mặc định theo khóa
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
- `model`: dạng chuỗi chỉ ghi đè `primary`; dạng đối tượng `{ primary, fallbacks }` ghi đè cả hai (`[]` vô hiệu hóa các dự phòng toàn cầu). Các công việc cron chỉ ghi đè `primary` vẫn kế thừa các dự phòng mặc định trừ khi bạn đặt `fallbacks: []`.
- `params`: các params luồng theo agent được hợp nhất trên mục mô hình đã chọn trong `agents.defaults.models`. Sử dụng điều này cho các ghi đè cụ thể theo agent như `cacheRetention`, `temperature`, hoặc `maxTokens` mà không cần sao chép toàn bộ danh mục mô hình.
- `thinkingDefault`: mức thinking mặc định tùy chọn theo agent (`off | minimal | low | medium | high | xhigh | adaptive`). Ghi đè `agents.defaults.thinkingDefault` cho agent này khi không có ghi đè theo tin nhắn hoặc phiên nào được đặt.
- `reasoningDefault`: khả năng hiển thị reasoning mặc định tùy chọn theo agent (`on | off | stream`). Áp dụng khi không có ghi đè reasoning theo tin nhắn hoặc phiên nào được đặt.
- `fastModeDefault`: chế độ nhanh mặc định tùy chọn theo agent (`true | false`). Áp dụng khi không có ghi đè chế độ nhanh theo tin nhắn hoặc phiên nào được đặt.
- `runtime`: mô tả runtime tùy chọn theo agent. Sử dụng `type: "acp"` với các mặc định `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) khi agent nên mặc định cho các phiên harness ACP.
- `identity.avatar`: đường dẫn tương đối workspace, URL `http(s)`, hoặc URI `data:`.
- `identity` suy ra các mặc định: `ackReaction` từ `emoji`, `mentionPatterns` từ `name`/`emoji`.
- `subagents.allowAgents`: danh sách cho phép các id agent cho `sessions_spawn` (`["*"]` = bất kỳ; mặc định: chỉ cùng agent).
- Bảo vệ kế thừa sandbox: nếu phiên yêu cầu được sandboxed, `sessions_spawn` từ chối các mục tiêu sẽ chạy không sandboxed.

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

- `type` (tùy chọn): `route` cho định tuyến thông thường (loại thiếu mặc định là route), `acp` cho các ràng buộc hội thoại ACP liên tục.
- `match.channel` (bắt buộc)
- `match.accountId` (tùy chọn; `*` = bất kỳ tài khoản nào; bỏ qua = tài khoản mặc định)
- `match.peer` (tùy chọn; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (tùy chọn; cụ thể cho kênh)
- `acp` (tùy chọn; chỉ cho `type: "acp"`): `{ mode, label, cwd, backend }`

**Thứ tự khớp xác định:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (chính xác, không có peer/guild/team)
5. `match.accountId: "*"` (toàn kênh)
6. Agent mặc định

Trong mỗi cấp, mục `bindings` khớp đầu tiên thắng.

Đối với các mục `type: "acp"`, OpenClaw giải quyết bằng danh tính hội thoại chính xác (`match.channel` + tài khoản + `match.peer.id`) và không sử dụng thứ tự cấp ràng buộc route ở trên.

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
      direct\n