---
summary: "Multi-agent routing: isolated agents, channel accounts, and bindings"
title: Multi-Agent Routing
read_when: "Cần nhiều agent độc lập (workspace + auth) trong một gateway process."
status: active
---

# Multi-Agent Routing

Mục tiêu: nhiều agent _độc lập_ (workspace riêng + `agentDir` + sessions), cùng nhiều tài khoản channel (ví dụ: hai WhatsApp) trong một Gateway đang chạy. Inbound được định tuyến đến agent qua bindings.

## "Một agent" là gì?

Một **agent** là một "bộ não" đầy đủ với:

- **Workspace** (file, AGENTS.md/SOUL.md/USER.md, ghi chú local, quy tắc persona).
- **Thư mục trạng thái** (`agentDir`) cho hồ sơ auth, model registry, và config từng agent.
- **Session store** (lịch sử chat + trạng thái routing) dưới `~/.openclaw/agents/<agentId>/sessions`.

Hồ sơ auth là **từng agent**. Mỗi agent đọc từ:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

Thông tin đăng nhập chính của agent **không** được chia sẻ tự động. Không bao giờ tái sử dụng `agentDir` giữa các agent (gây xung đột auth/session). Nếu muốn chia sẻ creds, copy `auth-profiles.json` vào `agentDir` của agent khác.

Skills là từng agent qua thư mục `skills/` của mỗi workspace, với skills chia sẻ từ `~/.openclaw/skills`. Xem [Skills: per-agent vs shared](/tools/skills#per-agent-vs-shared-skills).

Gateway có thể host **một agent** (mặc định) hoặc **nhiều agent** cùng lúc.

**Lưu ý Workspace:** workspace của mỗi agent là **cwd mặc định**, không phải sandbox cứng. Đường dẫn tương đối giải quyết trong workspace, nhưng đường dẫn tuyệt đối có thể đến vị trí khác trên host trừ khi bật sandboxing. Xem [Sandboxing](/gateway/sandboxing).

## Đường dẫn (bản đồ nhanh)

- Config: `~/.openclaw/openclaw.json` (hoặc `OPENCLAW_CONFIG_PATH`)
- Thư mục trạng thái: `~/.openclaw` (hoặc `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (hoặc `~/.openclaw/workspace-<agentId>`)
- Thư mục agent: `~/.openclaw/agents/<agentId>/agent` (hoặc `agents.list[].agentDir`)
- Sessions: `~/.openclaw/agents/<agentId>/sessions`

### Chế độ single-agent (mặc định)

Nếu không làm gì, OpenClaw chạy một agent:

- `agentId` mặc định là **`main`**.
- Sessions được khóa là `agent:main:<mainKey>`.
- Workspace mặc định là `~/.openclaw/workspace` (hoặc `~/.openclaw/workspace-<profile>` khi `OPENCLAW_PROFILE` được thiết lập).
- Trạng thái mặc định là `~/.openclaw/agents/main/agent`.

## Agent helper

Dùng wizard để thêm agent độc lập mới:

```bash
openclaw agents add work
```

Sau đó thêm `bindings` (hoặc để wizard làm) để định tuyến tin nhắn inbound.

Xác minh với:

```bash
openclaw agents list --bindings
```

## Quick start

<Steps>
  <Step title="Tạo workspace cho mỗi agent">

Dùng wizard hoặc tạo workspace thủ công:

```bash
openclaw agents add coding
openclaw agents add social
```

Mỗi agent có workspace riêng với `SOUL.md`, `AGENTS.md`, và `USER.md` tùy chọn, cùng `agentDir` và session store dưới `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Tạo tài khoản channel">

Tạo một tài khoản cho mỗi agent trên các channel ưa thích:

- Discord: một bot mỗi agent, bật Message Content Intent, copy mỗi token.
- Telegram: một bot mỗi agent qua BotFather, copy mỗi token.
- WhatsApp: liên kết mỗi số điện thoại mỗi tài khoản.

```bash
openclaw channels login --channel whatsapp --account work
```

Xem hướng dẫn channel: [Discord](/channels/discord), [Telegram](/channels/telegram), [WhatsApp](/channels/whatsapp).

  </Step>

  <Step title="Thêm agents, tài khoản, và bindings">

Thêm agents dưới `agents.list`, tài khoản channel dưới `channels.<channel>.accounts`, và kết nối chúng với `bindings` (ví dụ dưới).

  </Step>

  <Step title="Khởi động lại và xác minh">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Nhiều agents = nhiều người, nhiều persona

Với **nhiều agents**, mỗi `agentId` trở thành một **persona hoàn toàn độc lập**:

- **Số điện thoại/tài khoản khác nhau** (mỗi channel `accountId`).
- **Persona khác nhau** (file workspace từng agent như `AGENTS.md` và `SOUL.md`).
- **Auth + sessions riêng biệt** (không giao tiếp trừ khi bật rõ ràng).

Điều này cho phép **nhiều người** chia sẻ một Gateway server trong khi giữ "bộ não" AI và dữ liệu của họ tách biệt.

## Một số WhatsApp, nhiều người (DM split)

Có thể định tuyến **các WhatsApp DM khác nhau** đến các agent khác nhau trong khi vẫn giữ **một tài khoản WhatsApp**. Khớp với sender E.164 (như `+15551234567`) với `peer.kind: "direct"`. Trả lời vẫn từ cùng số WhatsApp (không có danh tính sender từng agent).

Chi tiết quan trọng: chat trực tiếp sụp đổ thành khóa session chính của agent, nên cách ly thực sự yêu cầu **một agent mỗi người**.

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

- Kiểm soát truy cập DM là **toàn cầu mỗi tài khoản WhatsApp** (pairing/allowlist), không phải mỗi agent.
- Với nhóm chia sẻ, bind nhóm vào một agent hoặc dùng [Broadcast groups](/channels/broadcast-groups).

## Quy tắc routing (cách tin nhắn chọn agent)

Bindings là **deterministic** và **cụ thể nhất thắng**:

1. Khớp `peer` (id DM/nhóm/channel chính xác)
2. Khớp `parentPeer` (kế thừa thread)
3. `guildId + roles` (routing role Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. Khớp `accountId` cho một channel
7. Khớp cấp channel (`accountId: "*"`)
8. fallback về agent mặc định (`agents.list[].default`, nếu không có thì entry đầu tiên trong danh sách, mặc định: `main`)

Nếu nhiều bindings khớp trong cùng một cấp, cái đầu tiên trong thứ tự config thắng. Nếu một binding thiết lập nhiều trường khớp (ví dụ `peer` + `guildId`), tất cả các trường được chỉ định là bắt buộc (`AND` semantics).

Chi tiết quan trọng về phạm vi tài khoản:

- Một binding bỏ qua `accountId` chỉ khớp với tài khoản mặc định.
- Dùng `accountId: "*"` cho fallback toàn channel trên tất cả tài khoản.
- Nếu sau đó thêm cùng binding cho cùng agent với id tài khoản rõ ràng, OpenClaw nâng cấp binding chỉ channel hiện có thành phạm vi tài khoản thay vì nhân đôi nó.

## Nhiều tài khoản / số điện thoại

Các channel hỗ trợ **nhiều tài khoản** (ví dụ: WhatsApp) dùng `accountId` để xác định
mỗi lần đăng nhập. Mỗi `accountId` có thể được định tuyến đến một agent khác, nên một server có thể host
nhiều số điện thoại mà không trộn lẫn sessions.

Nếu muốn tài khoản mặc định toàn channel khi `accountId` bị bỏ qua, thiết lập
`channels.<channel>.defaultAccount` (tùy chọn). Khi không thiết lập, OpenClaw fallback
về `default` nếu có, nếu không thì id tài khoản đầu tiên được cấu hình (sắp xếp).

Các channel phổ biến hỗ trợ mẫu này bao gồm:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Khái niệm

- `agentId`: một “bộ não” (workspace, auth từng agent, session store từng agent).
- `accountId`: một instance tài khoản channel (ví dụ: tài khoản WhatsApp `"personal"` vs `"biz"`).
- `binding`: định tuyến tin nhắn inbound đến một `agentId` bằng `(channel, accountId, peer)` và tùy chọn guild/team ids.
- Chat trực tiếp sụp đổ thành `agent:<agentId>:<mainKey>` (mỗi agent “main”; `session.mainKey`).

## Ví dụ nền tảng

### Discord bots mỗi agent

Mỗi tài khoản bot Discord ánh xạ đến một `accountId` duy nhất. Bind mỗi tài khoản vào một agent và giữ allowlists mỗi bot.

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
- Tokens nằm trong `channels.discord.accounts.<id>.token` (tài khoản mặc định có thể dùng `DISCORD_BOT_TOKEN`).

### Telegram bots mỗi agent

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

- Tạo một bot mỗi agent với BotFather và copy mỗi token.
- Tokens nằm trong `channels.telegram.accounts.<id>.botToken` (tài khoản mặc định có thể dùng `TELEGRAM_BOT_TOKEN`).

### Số WhatsApp mỗi agent

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

  // Định tuyến deterministic: khớp đầu tiên thắng (cụ thể nhất trước).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Ghi đè từng peer tùy chọn (ví dụ: gửi một nhóm cụ thể đến agent work).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Tắt mặc định: nhắn tin agent-to-agent phải được bật rõ ràng + allowlisted.
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

## Ví dụ: WhatsApp chat hàng ngày + Telegram deep work

Chia theo channel: định tuyến WhatsApp đến agent nhanh hàng ngày và Telegram đến agent Opus.

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

- Nếu có nhiều tài khoản cho một channel, thêm `accountId` vào binding (ví dụ `{ channel: "whatsapp", accountId: "personal" }`).
- Để định tuyến một DM/nhóm duy nhất đến Opus trong khi giữ phần còn lại trên chat, thêm một binding `match.peer` cho peer đó; peer matches luôn thắng các quy tắc toàn channel.

## Ví dụ: cùng channel, một peer đến Opus

Giữ WhatsApp trên agent nhanh, nhưng định tuyến một DM đến Opus:

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

Peer bindings luôn thắng, nên giữ chúng trên quy tắc toàn channel.

## Agent gia đình bind vào nhóm WhatsApp

Bind một agent gia đình chuyên dụng vào một nhóm WhatsApp duy nhất, với kiểm soát mention và chính sách công cụ chặt chẽ hơn:

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

- Danh sách cho phép/cấm công cụ là **tools**, không phải skills. Nếu một skill cần chạy một binary, đảm bảo `exec` được cho phép và binary tồn tại trong sandbox.
- Để kiểm soát chặt chẽ hơn, thiết lập `agents.list[].groupChat.mentionPatterns` và giữ allowlists nhóm bật cho channel.

## Cấu hình Sandbox và Công cụ từng Agent

Mỗi agent có thể có sandbox và hạn chế công cụ riêng:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Không sandbox cho agent cá nhân
        },
        // Không hạn chế công cụ - tất cả công cụ có sẵn
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Luôn sandbox
          scope: "agent",  // Một container mỗi agent
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
Ghi đè `sandbox.docker.*` từng agent bị bỏ qua khi phạm vi giải quyết là `"shared"`.

**Lợi ích:**

- **Cách ly bảo mật**: Hạn chế công cụ cho các agent không tin cậy
- **Kiểm soát tài nguyên**: Sandbox các agent cụ thể trong khi giữ các agent khác trên host
- **Chính sách linh hoạt**: Quyền khác nhau từng agent

Lưu ý: `tools.elevated` là **toàn cầu** và dựa trên sender; không cấu hình được từng agent.
Nếu cần ranh giới từng agent, dùng `agents.list[].tools` để cấm `exec`.
Để nhắm mục tiêu nhóm, dùng `agents.list[].groupChat.mentionPatterns` để @mentions map rõ ràng đến agent dự định.

Xem [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) để biết ví dụ chi tiết.\n