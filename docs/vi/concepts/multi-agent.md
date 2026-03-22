---
summary: "Định tuyến đa tác nhân: tác nhân cô lập, tài khoản kênh và liên kết"
title: Định tuyến Đa Tác Nhân
read_when: "Bạn muốn nhiều tác nhân cô lập (workspace + xác thực) trong một quá trình gateway."
status: active
---

# Định tuyến Đa Tác Nhân

Mục tiêu: nhiều tác nhân _cô lập_ (workspace riêng + `agentDir` + phiên), cùng với nhiều tài khoản kênh (ví dụ: hai WhatsApp) trong một Gateway đang chạy. Dữ liệu đầu vào được định tuyến đến một tác nhân thông qua liên kết.

## "Một tác nhân" là gì?

Một **tác nhân** là một bộ não hoàn chỉnh với:

- **Workspace** (tệp, AGENTS.md/SOUL.md/USER.md, ghi chú cục bộ, quy tắc persona).
- **Thư mục trạng thái** (`agentDir`) cho hồ sơ xác thực, đăng ký mô hình và cấu hình từng tác nhân.
- **Kho lưu trữ phiên** (lịch sử chat + trạng thái định tuyến) dưới `~/.openclaw/agents/<agentId>/sessions`.

Hồ sơ xác thực là **theo từng tác nhân**. Mỗi tác nhân đọc từ:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

Thông tin xác thực chính của tác nhân **không** được chia sẻ tự động. Không bao giờ tái sử dụng `agentDir` giữa các tác nhân (nó gây ra xung đột xác thực/phiên). Nếu muốn chia sẻ thông tin xác thực, sao chép `auth-profiles.json` vào `agentDir` của tác nhân khác.

Kỹ năng là theo từng tác nhân thông qua thư mục `skills/` của mỗi workspace, với các kỹ năng chia sẻ có sẵn từ `~/.openclaw/skills`. Xem [Kỹ năng: theo tác nhân vs chia sẻ](/tools/skills#per-agent-vs-shared-skills).

Gateway có thể lưu trữ **một tác nhân** (mặc định) hoặc **nhiều tác nhân** cùng lúc.

**Lưu ý về Workspace:** workspace của mỗi tác nhân là **thư mục làm việc mặc định**, không phải là một sandbox cứng. Đường dẫn tương đối được giải quyết bên trong workspace, nhưng đường dẫn tuyệt đối có thể truy cập các vị trí khác trên máy chủ trừ khi sandboxing được kích hoạt. Xem [Sandboxing](/gateway/sandboxing).

## Đường dẫn (bản đồ nhanh)

- Cấu hình: `~/.openclaw/openclaw.json` (hoặc `OPENCLAW_CONFIG_PATH`)
- Thư mục trạng thái: `~/.openclaw` (hoặc `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (hoặc `~/.openclaw/workspace-<agentId>`)
- Thư mục tác nhân: `~/.openclaw/agents/<agentId>/agent` (hoặc `agents.list[].agentDir`)
- Phiên: `~/.openclaw/agents/<agentId>/sessions`

### Chế độ một tác nhân (mặc định)

Nếu không làm gì, OpenClaw chạy một tác nhân duy nhất:

- `agentId` mặc định là **`main`**.
- Các phiên được khóa với `agent:main:<mainKey>`.
- Workspace mặc định là `~/.openclaw/workspace` (hoặc `~/.openclaw/workspace-<profile>` khi `OPENCLAW_PROFILE` được thiết lập).
- Trạng thái mặc định là `~/.openclaw/agents/main/agent`.

## Trợ giúp tác nhân

Sử dụng trình hướng dẫn tác nhân để thêm một tác nhân cô lập mới:

```bash
openclaw agents add work
```

Sau đó thêm `bindings` (hoặc để trình hướng dẫn làm điều đó) để định tuyến tin nhắn đầu vào.

Xác minh với:

```bash
openclaw agents list --bindings
```

## Bắt đầu nhanh

<Steps>
  <Step title="Tạo workspace cho mỗi tác nhân">

Sử dụng trình hướng dẫn hoặc tạo workspace thủ công:

```bash
openclaw agents add coding
openclaw agents add social
```

Mỗi tác nhân có workspace riêng với `SOUL.md`, `AGENTS.md`, và `USER.md` tùy chọn, cùng với `agentDir` và kho lưu trữ phiên riêng dưới `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Tạo tài khoản kênh">

Tạo một tài khoản cho mỗi tác nhân trên các kênh ưa thích:

- Discord: một bot cho mỗi tác nhân, bật Message Content Intent, sao chép mỗi token.
- Telegram: một bot cho mỗi tác nhân qua BotFather, sao chép mỗi token.
- WhatsApp: liên kết mỗi số điện thoại cho mỗi tài khoản.

```bash
openclaw channels login --channel whatsapp --account work
```

Xem hướng dẫn kênh: [Discord](/channels/discord), [Telegram](/channels/telegram), [WhatsApp](/channels/whatsapp).

  </Step>

  <Step title="Thêm tác nhân, tài khoản và liên kết">

Thêm tác nhân dưới `agents.list`, tài khoản kênh dưới `channels.<channel>.accounts`, và kết nối chúng với `bindings` (ví dụ dưới đây).

  </Step>

  <Step title="Khởi động lại và xác minh">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Nhiều tác nhân = nhiều người, nhiều tính cách

Với **nhiều tác nhân**, mỗi `agentId` trở thành một **persona cô lập hoàn toàn**:

- **Số điện thoại/tài khoản khác nhau** (theo `accountId` kênh).
- **Tính cách khác nhau** (tệp workspace theo tác nhân như `AGENTS.md` và `SOUL.md`).
- **Xác thực + phiên riêng biệt** (không có giao tiếp chéo trừ khi được bật rõ ràng).

Điều này cho phép **nhiều người** chia sẻ một máy chủ Gateway trong khi giữ cho "bộ não" AI và dữ liệu của họ được cô lập.

## Một số WhatsApp, nhiều người (chia DM)

Bạn có thể định tuyến **các DM WhatsApp khác nhau** đến các tác nhân khác nhau trong khi vẫn sử dụng **một tài khoản WhatsApp**. Khớp theo sender E.164 (như `+15551234567`) với `peer.kind: "direct"`. Phản hồi vẫn đến từ cùng một số WhatsApp (không có danh tính người gửi theo tác nhân).

Chi tiết quan trọng: các cuộc trò chuyện trực tiếp gộp lại thành khóa phiên **chính của tác nhân**, vì vậy sự cô lập thực sự yêu cầu **một tác nhân cho mỗi người**.

Ví dụ:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

Lưu ý:

- Kiểm soát truy cập DM là **toàn cầu cho mỗi tài khoản WhatsApp** (ghép đôi/danh sách cho phép), không phải theo tác nhân.
- Đối với các nhóm chia sẻ, liên kết nhóm với một tác nhân hoặc sử dụng [Nhóm phát sóng](/channels/broadcast-groups).

## Quy tắc định tuyến (cách tin nhắn chọn tác nhân)

Liên kết là **xác định** và **cụ thể nhất thắng**:

1. Khớp `peer` (id DM/nhóm/kênh chính xác)
2. Khớp `parentPeer` (kế thừa chuỗi)
3. `guildId + roles` (định tuyến vai trò Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. Khớp `accountId` cho một kênh
7. Khớp cấp kênh (`accountId: "*"`)
8. Dự phòng cho tác nhân mặc định (`agents.list[].default`, nếu không có thì mục đầu tiên trong danh sách, mặc định: `main`)

Nếu nhiều liên kết khớp trong cùng một cấp, liên kết đầu tiên theo thứ tự cấu hình sẽ thắng.
Nếu một liên kết thiết lập nhiều trường khớp (ví dụ `peer` + `guildId`), tất cả các trường được chỉ định đều cần thiết (ngữ nghĩa `AND`).

Chi tiết quan trọng về phạm vi tài khoản:

- Một liên kết bỏ qua `accountId` chỉ khớp với tài khoản mặc định.
- Sử dụng `accountId: "*"` cho một dự phòng toàn kênh trên tất cả các tài khoản.
- Nếu sau đó bạn thêm cùng một liên kết cho cùng một tác nhân với một id tài khoản rõ ràng, OpenClaw nâng cấp liên kết chỉ dành cho kênh hiện có thành phạm vi tài khoản thay vì nhân đôi nó.

## Nhiều tài khoản / số điện thoại

Các kênh hỗ trợ **nhiều tài khoản** (ví dụ: WhatsApp) sử dụng `accountId` để xác định
mỗi lần đăng nhập. Mỗi `accountId` có thể được định tuyến đến một tác nhân khác nhau, vì vậy một máy chủ có thể lưu trữ
nhiều số điện thoại mà không trộn lẫn các phiên.

Nếu bạn muốn một tài khoản mặc định toàn kênh khi `accountId` bị bỏ qua, thiết lập
`channels.<channel>.defaultAccount` (tùy chọn). Khi không được thiết lập, OpenClaw sẽ dự phòng
đến `default` nếu có, nếu không thì id tài khoản đầu tiên được cấu hình (đã sắp xếp).

Các kênh phổ biến hỗ trợ mô hình này bao gồm:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Khái niệm

- `agentId`: một “bộ não” (workspace, xác thực theo tác nhân, kho lưu trữ phiên theo tác nhân).
- `accountId`: một phiên bản tài khoản kênh (ví dụ: tài khoản WhatsApp `"personal"` vs `"biz"`).
- `binding`: định tuyến tin nhắn đầu vào đến một `agentId` theo `(channel, accountId, peer)` và tùy chọn id guild/team.
- Các cuộc trò chuyện trực tiếp gộp lại thành `agent:<agentId>:<mainKey>` (theo tác nhân “chính”; `session.mainKey`).

## Ví dụ nền tảng

### Bot Discord theo tác nhân

Mỗi tài khoản bot Discord ánh xạ đến một `accountId` duy nhất. Liên kết mỗi tài khoản với một tác nhân và giữ danh sách cho phép theo bot.

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

Lưu ý:

- Mời mỗi bot vào guild và bật Message Content Intent.
- Token nằm trong `channels.discord.accounts.<id>.token` (tài khoản mặc định có thể sử dụng `DISCORD_BOT_TOKEN`).

### Bot Telegram theo tác nhân

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

Lưu ý:

- Tạo một bot cho mỗi tác nhân với BotFather và sao chép mỗi token.
- Token nằm trong `channels.telegram.accounts.<id>.botToken` (tài khoản mặc định có thể sử dụng `TELEGRAM_BOT_TOKEN`).

### Số WhatsApp theo tác nhân

Liên kết mỗi tài khoản trước khi khởi động gateway:

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // Định tuyến xác định: khớp đầu tiên thắng (cụ thể nhất trước).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Ghi đè tùy chọn theo peer (ví dụ: gửi một nhóm cụ thể đến tác nhân công việc).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Tắt theo mặc định: nhắn tin giữa các tác nhân phải được bật rõ ràng + cho phép.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // Ghi đè tùy chọn. Mặc định: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // Ghi đè tùy chọn. Mặc định: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## Ví dụ: Chat WhatsApp hàng ngày + Công việc sâu trên Telegram

Chia theo kênh: định tuyến WhatsApp đến một tác nhân nhanh hàng ngày và Telegram đến một tác nhân Opus.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

Lưu ý:

- Nếu bạn có nhiều tài khoản cho một kênh, thêm `accountId` vào liên kết (ví dụ `{ channel: "whatsapp", accountId: "personal" }`).
- Để định tuyến một DM/nhóm duy nhất đến Opus trong khi giữ phần còn lại trên chat, thêm một liên kết `match.peer` cho peer đó; các khớp peer luôn thắng so với các quy tắc toàn kênh.

## Ví dụ: cùng kênh, một peer đến Opus

Giữ WhatsApp trên tác nhân nhanh, nhưng định tuyến một DM đến Opus:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

Các liên kết peer luôn thắng, vì vậy hãy giữ chúng trên quy tắc toàn kênh.

## Tác nhân gia đình liên kết với một nhóm WhatsApp

Liên kết một tác nhân gia đình chuyên dụng với một nhóm WhatsApp duy nhất, với việc kiểm soát nhắc nhở và chính sách công cụ chặt chẽ hơn:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

Lưu ý:

- Danh sách cho phép/cấm công cụ là **công cụ**, không phải kỹ năng. Nếu một kỹ năng cần chạy một
  nhị phân, đảm bảo `exec` được cho phép và nhị phân tồn tại trong sandbox.
- Để kiểm soát chặt chẽ hơn, thiết lập `agents.list[].groupChat.mentionPatterns` và giữ
  danh sách cho phép nhóm được bật cho kênh.

## Cấu hình Sandbox và Công cụ Theo Tác Nhân

Mỗi tác nhân có thể có sandbox và hạn chế công cụ riêng:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Không có sandbox cho tác nhân cá nhân
        },
        // Không có hạn chế công cụ - tất cả công cụ đều có sẵn
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Luôn được sandbox
          scope: "agent",  // Một container cho mỗi tác nhân
          docker: {
            // Thiết lập một lần tùy chọn sau khi tạo container
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Chỉ công cụ đọc
          deny: ["exec", "write", "edit", "apply_patch"],    // Cấm các công cụ khác
        },
      },
    ],
  },
}
```

Lưu ý: `setupCommand` nằm dưới `sandbox.docker` và chạy một lần khi tạo container.
Các ghi đè `sandbox.docker.*` theo tác nhân bị bỏ qua khi phạm vi được giải quyết là `"shared"`.

**Lợi ích:**

- **Cô lập bảo mật**: Hạn chế công cụ cho các tác nhân không đáng tin cậy
- **Kiểm soát tài nguyên**: Sandbox các tác nhân cụ thể trong khi giữ các tác nhân khác trên máy chủ
- **Chính sách linh hoạt**: Quyền khác nhau cho từng tác nhân

Lưu ý: `tools.elevated` là **toàn cầu** và dựa trên người gửi; nó không thể cấu hình theo tác nhân.
Nếu bạn cần ranh giới theo tác nhân, sử dụng `agents.list[].tools` để cấm `exec`.
Đối với mục tiêu nhóm, sử dụng `agents.list[].groupChat.mentionPatterns` để các @mentions ánh xạ rõ ràng đến tác nhân dự định.

Xem [Sandbox & Công cụ Đa Tác Nhân](/tools/multi-agent-sandbox-tools) để biết ví dụ chi tiết.
