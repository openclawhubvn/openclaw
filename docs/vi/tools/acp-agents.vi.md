---
summary: "Sử dụng ACP runtime sessions cho Pi, Claude Code, Codex, OpenCode, Gemini CLI và các harness agents khác"
read_when:
  - Chạy coding harnesses qua ACP
  - Thiết lập ACP sessions gắn với thread trên các kênh hỗ trợ thread
  - Gắn kênh Discord hoặc chủ đề diễn đàn Telegram vào ACP sessions liên tục
  - Khắc phục sự cố backend ACP và plugin wiring
  - Thao tác lệnh /acp từ chat
title: "ACP Agents"
---

# ACP agents

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessions cho phép OpenClaw chạy các coding harnesses bên ngoài (như Pi, Claude Code, Codex, OpenCode, và Gemini CLI) qua một ACP backend plugin.

Khi yêu cầu OpenClaw "chạy cái này trong Codex" hoặc "bắt đầu Claude Code trong một thread", OpenClaw sẽ chuyển yêu cầu đó đến ACP runtime (không phải native sub-agent runtime).

## Luồng thao tác nhanh

Dùng khi cần một runbook `/acp` thực tế:

1. Tạo một session:
   - `/acp spawn codex --mode persistent --thread auto`
2. Làm việc trong thread đã gắn (hoặc nhắm đến session key đó).
3. Kiểm tra trạng thái runtime:
   - `/acp status`
4. Điều chỉnh tùy chọn runtime nếu cần:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Điều chỉnh session đang hoạt động mà không thay đổi ngữ cảnh:
   - `/acp steer tighten logging and continue`
6. Dừng công việc:
   - `/acp cancel` (dừng lượt hiện tại), hoặc
   - `/acp close` (đóng session + gỡ bỏ bindings)

## Bắt đầu nhanh cho người dùng

Ví dụ về các yêu cầu tự nhiên:

- "Bắt đầu một session Codex liên tục trong một thread ở đây và giữ tập trung."
- "Chạy cái này như một session Claude Code ACP một lần và tóm tắt kết quả."
- "Dùng Gemini CLI cho nhiệm vụ này trong một thread, sau đó giữ các follow-up trong cùng thread đó."

OpenClaw sẽ làm gì:

1. Chọn `runtime: "acp"`.
2. Xác định harness target được yêu cầu (`agentId`, ví dụ `codex`).
3. Nếu yêu cầu gắn thread và kênh hiện tại hỗ trợ, gắn ACP session vào thread.
4. Chuyển các tin nhắn follow-up trong thread đó đến cùng ACP session cho đến khi không còn tập trung/đóng/hết hạn.

## ACP so với sub-agents

Dùng ACP khi cần một harness runtime bên ngoài. Dùng sub-agents khi muốn chạy native OpenClaw.

| Khu vực       | ACP session                           | Sub-agent run                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP backend plugin (ví dụ acpx)       | OpenClaw native sub-agent runtime  |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Lệnh chính    | `/acp ...`                            | `/subagents ...`                   |
| Công cụ spawn | `sessions_spawn` với `runtime:"acp"`  | `sessions_spawn` (default runtime) |

Xem thêm [Sub-agents](/tools/subagents).

## Sessions gắn với thread (không phụ thuộc kênh)

Khi bindings thread được bật cho một channel adapter, ACP sessions có thể được gắn vào threads:

- OpenClaw gắn một thread vào một ACP session mục tiêu.
- Các tin nhắn follow-up trong thread đó được chuyển đến ACP session đã gắn.
- Kết quả từ ACP được gửi lại cùng thread.
- Unfocus/close/archive/idle-timeout hoặc max-age expiry sẽ gỡ bỏ binding.

Hỗ trợ binding thread là adapter-specific. Nếu adapter kênh hiện tại không hỗ trợ binding thread, OpenClaw sẽ trả về thông báo không hỗ trợ/không khả dụng rõ ràng.

Các flag tính năng cần thiết cho ACP gắn với thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` mặc định bật (đặt `false` để tạm dừng ACP dispatch)
- Channel-adapter ACP thread-spawn flag bật (adapter-specific)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Các kênh hỗ trợ thread

- Bất kỳ channel adapter nào có khả năng binding session/thread.
- Hỗ trợ built-in hiện tại:
  - Discord threads/channels
  - Telegram topics (forum topics trong groups/supergroups và DM topics)
- Plugin channels có thể thêm hỗ trợ qua cùng giao diện binding.

## Cài đặt cụ thể cho kênh

Đối với các workflows không ephemeral, cấu hình persistent ACP bindings trong các mục `bindings[]` cấp cao nhất.

### Mô hình binding

- `bindings[].type="acp"` đánh dấu một binding cuộc trò chuyện ACP liên tục.
- `bindings[].match` xác định cuộc trò chuyện mục tiêu:
  - Kênh hoặc thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Chủ đề diễn đàn Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- `bindings[].agentId` là id agent OpenClaw sở hữu.
- Các overrides ACP tùy chọn nằm dưới `bindings[].acp`:
  - `mode` (`persistent` hoặc `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Mặc định runtime cho mỗi agent

Dùng `agents.list[].runtime` để định nghĩa mặc định ACP một lần cho mỗi agent:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness id, ví dụ `codex` hoặc `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Thứ tự ưu tiên override cho ACP bound sessions:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. global ACP defaults (ví dụ `acp.backend`)

Ví dụ:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Hành vi:

- OpenClaw đảm bảo ACP session được cấu hình tồn tại trước khi sử dụng.
- Tin nhắn trong kênh hoặc chủ đề đó được chuyển đến ACP session đã cấu hình.
- Trong các cuộc trò chuyện đã gắn, `/new` và `/reset` đặt lại cùng session key ACP tại chỗ.
- Các runtime bindings tạm thời (ví dụ được tạo bởi luồng tập trung thread) vẫn áp dụng khi có.

## Bắt đầu ACP sessions (interfaces)

### Từ `sessions_spawn`

Dùng `runtime: "acp"` để bắt đầu một ACP session từ một agent turn hoặc tool call.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Ghi chú:

- `runtime` mặc định là `subagent`, nên đặt `runtime: "acp"` rõ ràng cho ACP sessions.
- Nếu `agentId` bị bỏ qua, OpenClaw dùng `acp.defaultAgent` khi được cấu hình.
- `mode: "session"` yêu cầu `thread: true` để giữ một cuộc trò chuyện gắn kết liên tục.

Chi tiết giao diện:

- `task` (bắt buộc): prompt ban đầu gửi đến ACP session.
- `runtime` (bắt buộc cho ACP): phải là `"acp"`.
- `agentId` (tùy chọn): ACP target harness id. Sẽ dùng `acp.defaultAgent` nếu được đặt.
- `thread` (tùy chọn, mặc định `false`): yêu cầu luồng binding thread khi được hỗ trợ.
- `mode` (tùy chọn): `run` (một lần) hoặc `session` (liên tục).
  - mặc định là `run`
  - nếu `thread: true` và mode bị bỏ qua, OpenClaw có thể mặc định hành vi liên tục theo đường dẫn runtime
  - `mode: "session"` yêu cầu `thread: true`
- `cwd` (tùy chọn): thư mục làm việc runtime được yêu cầu (được xác thực bởi backend/runtime policy).
- `label` (tùy chọn): nhãn hướng người vận hành được sử dụng trong văn bản session/banner.
- `resumeSessionId` (tùy chọn): tiếp tục một ACP session hiện có thay vì tạo mới. Agent phát lại lịch sử cuộc trò chuyện của nó qua `session/load`. Yêu cầu `runtime: "acp"`.
- `streamTo` (tùy chọn): `"parent"` stream tóm tắt tiến trình chạy ACP ban đầu trở lại session yêu cầu như các sự kiện hệ thống.
  - Khi có sẵn, các phản hồi được chấp nhận bao gồm `streamLogPath` trỏ đến một log JSONL theo session (`<sessionId>.acp-stream.jsonl`) bạn có thể tail để có lịch sử relay đầy đủ.

### Tiếp tục một session hiện có

Dùng `resumeSessionId` để tiếp tục một ACP session trước đó thay vì bắt đầu mới. Agent phát lại lịch sử cuộc trò chuyện của nó qua `session/load`, nên nó tiếp tục với đầy đủ ngữ cảnh của những gì đã diễn ra trước đó.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Các trường hợp sử dụng phổ biến:

- Chuyển một Codex session từ laptop sang điện thoại — yêu cầu agent tiếp tục từ nơi đã dừng
- Tiếp tục một coding session bạn đã bắt đầu tương tác trong CLI, giờ đây headlessly qua agent
- Tiếp tục công việc bị gián đoạn bởi một gateway restart hoặc idle timeout

Ghi chú:

- `resumeSessionId` yêu cầu `runtime: "acp"` — trả về lỗi nếu dùng với sub-agent runtime.
- `resumeSessionId` khôi phục lịch sử cuộc trò chuyện ACP upstream; `thread` và `mode` vẫn áp dụng bình thường cho session OpenClaw mới bạn đang tạo, nên `mode: "session"` vẫn yêu cầu `thread: true`.
- Agent mục tiêu phải hỗ trợ `session/load` (Codex và Claude Code có).
- Nếu session ID không được tìm thấy, spawn sẽ thất bại với lỗi rõ ràng — không có fallback im lặng sang một session mới.

### Kiểm tra nhanh của operator

Dùng cái này sau khi deploy gateway khi bạn muốn kiểm tra nhanh rằng ACP spawn thực sự hoạt động từ đầu đến cuối, không chỉ vượt qua các bài test đơn vị.

Cổng khuyến nghị:

1. Xác minh phiên bản/commit gateway đã deploy trên host mục tiêu.
2. Xác nhận mã nguồn đã deploy bao gồm sự chấp nhận lineage ACP trong
   `src/gateway/sessions-patch.ts` (`subagent:* hoặc acp:* sessions`).
3. Mở một phiên ACPX bridge tạm thời đến một agent sống (ví dụ
   `razor(main)` trên `jpclawhq`).
4. Yêu cầu agent đó gọi `sessions_spawn` với:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Xác minh agent báo cáo:
   - `accepted=yes`
   - một `childSessionKey` thực
   - không có lỗi validator
6. Dọn dẹp phiên ACPX bridge tạm thời.

Ví dụ prompt cho agent sống:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Ghi chú:

- Giữ bài test nhanh này ở `mode: "run"` trừ khi bạn đang cố ý kiểm tra
  các ACP sessions liên tục gắn với thread.
- Không yêu cầu `streamTo: "parent"` cho cổng cơ bản. Đường dẫn đó phụ thuộc vào
  khả năng requester/session và là một kiểm tra tích hợp riêng biệt.
- Xem xét kiểm tra `mode: "session"` gắn với thread như một bước tích hợp phong phú thứ hai từ một thread Discord thực hoặc chủ đề Telegram.

## Tương thích Sandbox

ACP sessions hiện chạy trên host runtime, không phải trong OpenClaw sandbox.

Hạn chế hiện tại:

- Nếu requester session bị sandboxed, ACP spawns bị chặn cho cả `sessions_spawn({ runtime: "acp" })` và `/acp spawn`.
  - Lỗi: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` với `runtime: "acp"` không hỗ trợ `sandbox: "require"`.
  - Lỗi: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Dùng `runtime: "subagent"` khi cần thực thi enforced sandbox.

### Từ lệnh `/acp`

Dùng `/acp spawn` để kiểm soát operator rõ ràng từ chat khi cần.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --thread here
```

Các flag chính:

- `--mode persistent|oneshot`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Xem [Slash Commands](/tools/slash-commands).

## Giải quyết mục tiêu session

Hầu hết các hành động `/acp` chấp nhận một mục tiêu session tùy chọn (`session-key`, `session-id`, hoặc `session-label`).

Thứ tự giải quyết:

1. Đối số mục tiêu rõ ràng (hoặc `--session` cho `/acp steer`)
   - thử key
   - sau đó session id dạng UUID
   - sau đó label
2. Binding thread hiện tại (nếu cuộc trò chuyện/thread này được gắn vào một ACP session)
3. Fallback session requester hiện tại

Nếu không có mục tiêu nào được giải quyết, OpenClaw trả về lỗi rõ ràng (`Unable to resolve session target: ...`).

## Chế độ spawn thread

`/acp spawn` hỗ trợ `--thread auto|here|off`.

| Chế độ | Hành vi                                                                                             |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | Trong một thread hoạt động: gắn thread đó. Ngoài một thread: tạo/gắn một thread con khi được hỗ trợ. |
| `here` | Yêu cầu thread hoạt động hiện tại; thất bại nếu không có.                                            |
| `off`  | Không binding. Session bắt đầu không gắn.                                                            |

Ghi chú:

- Trên các bề mặt không hỗ trợ binding thread, hành vi mặc định là `off`.
- Spawn gắn với thread yêu cầu hỗ trợ chính sách kênh:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

## Kiểm soát ACP

Các lệnh có sẵn:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` hiển thị các tùy chọn runtime hiệu quả và, khi có sẵn, cả các session identifiers cấp runtime và backend.

Một số kiểm soát phụ thuộc vào khả năng backend. Nếu một backend không hỗ trợ một kiểm soát, OpenClaw trả về lỗi không hỗ trợ rõ ràng.

## Cookbook lệnh ACP

| Lệnh                | Chức năng                                                   | Ví dụ                                                         |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`        | Tạo ACP session; tùy chọn gắn thread.                       | `/acp spawn codex --mode persistent --thread auto --cwd /repo`|
| `/acp cancel`       | Hủy lượt đang chạy cho session mục tiêu.                    | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`        | Gửi hướng dẫn steer đến session đang chạy.                  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`        | Đóng session và gỡ bỏ các mục tiêu thread.                  | `/acp close`                                                  |
| `/acp status`       | Hiển thị backend, mode, state, runtime options, capabilities.| `/acp status`                                                 |
| `/acp set-mode`     | Đặt mode runtime cho session mục tiêu.                      | `/acp set-mode plan`                                          |
| `/acp set`          | Ghi tùy chọn cấu hình runtime chung.                        | `/acp set model openai/gpt-5.2`                               |
| `/acp cwd`          | Đặt override thư mục làm việc runtime.                      | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`  | Đặt profile chính sách phê duyệt.                           | `/acp permissions strict`                                     |
| `/acp timeout`      | Đặt timeout runtime (giây).                                 | `/acp timeout 120`                                            |
| `/acp model`        | Đặt override model runtime.                                 | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options`| Xóa tất cả các override tùy chọn runtime cho session mục tiêu.| `/acp reset-options`                                          |
| `/acp sessions`     | Liệt kê các ACP sessions gần đây từ store.                  | `/acp sessions`                                               |
| `/acp doctor`       | Sức khỏe backend, khả năng, các sửa chữa có thể thực hiện.  | `/acp doctor`                                                 |
| `/acp install`      | In các bước cài đặt và kích hoạt xác định.                  | `/acp install`                                                |

`/acp sessions` đọc store cho session hiện tại đã gắn hoặc requester. Các lệnh chấp nhận tokens `session-key`, `session-id`, hoặc `session-label` giải quyết mục tiêu thông qua gateway session discovery, bao gồm các `session.store` roots tùy chỉnh cho mỗi agent.

## Mapping tùy chọn runtime

`/acp` có các lệnh tiện lợi và một setter chung.

Các thao tác tương đương:

- `/acp model <id>` ánh xạ đến key cấu hình runtime `model`.
- `/acp permissions <profile>` ánh xạ đến key cấu hình runtime `approval_policy`.
- `/acp timeout <seconds>` ánh xạ đến key cấu hình runtime `timeout`.
- `/acp cwd <path>` cập nhật override cwd runtime trực tiếp.
- `/acp set <key> <value>` là đường dẫn chung.
  - Trường hợp đặc biệt: `key=cwd` sử dụng đường dẫn override cwd.
- `/acp reset-options` xóa tất cả các override runtime cho session mục tiêu.

## Hỗ trợ harness acpx (hiện tại)

Các alias harness built-in acpx hiện tại:

- `pi`
- `claude`
- `codex`
- `opencode`
- `gemini`
- `kimi`

Khi OpenClaw sử dụng backend acpx, ưu tiên các giá trị này cho `agentId` trừ khi cấu hình acpx của bạn định nghĩa các alias agent tùy chỉnh.

Sử dụng CLI acpx trực tiếp cũng có thể nhắm đến các adapters tùy ý qua `--agent <command>`, nhưng đường thoát thô đó là một tính năng CLI acpx (không phải đường dẫn `agentId` thông thường của OpenClaw).

## Cấu hình cần thiết

Cơ sở ACP cốt lõi:

```json5
{
  acp: {
    enabled: true,
    // Tùy chọn. Mặc định là true; đặt false để tạm dừng ACP dispatch trong khi giữ các kiểm soát /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: ["pi", "claude", "codex", "opencode", "gemini", "kimi"],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Cấu hình binding thread là channel-adapter specific. Ví dụ cho Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Nếu spawn ACP gắn với thread không hoạt động, hãy xác minh flag tính năng adapter trước:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Xem [Configuration Reference](/gateway/configuration-reference).

## Thiết lập plugin cho backend acpx

Cài đặt và kích hoạt plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Cài đặt workspace local trong quá trình phát triển:

```bash
openclaw plugins install ./extensions/acpx
```

Sau đó xác minh sức khỏe backend:

```text
/acp doctor
```

### Cấu hình lệnh và phiên bản acpx

Theo mặc định, plugin acpx (được phát hành dưới dạng `@openclaw/acpx`) sử dụng binary được ghim cục bộ plugin:

1. Lệnh mặc định là `extensions/acpx/node_modules/.bin/acpx`.
2. Phiên bản dự kiến mặc định là ghim của extension.
3. Khởi động đăng ký ACP backend ngay lập tức là chưa sẵn sàng.
4. Một công việc đảm bảo nền xác minh `acpx --version`.
5. Nếu binary cục bộ plugin bị thiếu hoặc không khớp, nó chạy:
   `npm install --omit=dev --no-save acpx@<pinned>` và xác minh lại.

Bạn có thể override lệnh/phiên bản trong cấu hình plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Ghi chú:

- `command` chấp nhận một đường dẫn tuyệt đối, đường dẫn tương đối, hoặc tên lệnh (`acpx`).
- Đường dẫn tương đối được giải quyết từ thư mục workspace OpenClaw.
- `expectedVersion: "any"` vô hiệu hóa khớp phiên bản nghiêm ngặt.
- Khi `command` trỏ đến một binary/đường dẫn tùy chỉnh, auto-install cục bộ plugin bị vô hiệu hóa.
- Khởi động OpenClaw vẫn không bị chặn trong khi kiểm tra sức khỏe backend chạy.

Xem [Plugins](/tools/plugin).

## Cấu hình quyền

ACP sessions chạy không tương tác — không có TTY để phê duyệt hoặc từ chối các prompt quyền ghi file và thực thi shell. Plugin acpx cung cấp hai key cấu hình kiểm soát cách xử lý quyền:

### `permissionMode`

Kiểm soát các thao tác mà harness agent có thể thực hiện mà không cần prompt.

| Giá trị         | Hành vi                                                   |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Tự động phê duyệt tất cả các ghi file và lệnh shell.      |
| `approve-reads` | Tự động phê duyệt chỉ đọc; ghi và thực thi yêu cầu prompt.|
| `deny-all`      | Từ chối tất cả các prompt quyền.                          |

### `nonInteractivePermissions`

Kiểm soát điều gì xảy ra khi một prompt quyền sẽ được hiển thị nhưng không có TTY tương tác nào có sẵn (luôn là trường hợp cho ACP sessions).

| Giá trị | Hành vi                                                           |
| ------- | ----------------------------------------------------------------- |
| `fail`  | Hủy session với `AcpRuntimeError`. **(mặc định)**                 |
| `deny`  | Từ chối quyền một cách im lặng và tiếp tục (giảm thiểu graceful). |

### Cấu hình

Đặt qua cấu hình plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Khởi động lại gateway sau khi thay đổi các giá trị này.

> **Quan trọng:** OpenClaw hiện mặc định `permissionMode=approve-reads` và `nonInteractivePermissions=fail`. Trong các ACP sessions không tương tác, bất kỳ ghi hoặc thực thi nào kích hoạt một prompt quyền có thể thất bại với `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Nếu cần hạn chế quyền, đặt `nonInteractivePermissions` thành `deny` để các sessions giảm thiểu graceful thay vì bị crash.

## Khắc phục sự cố

| Triệu chứng                                                               | Nguyên nhân có thể xảy ra                                                      | Cách khắc phục                                                                                                                                                     |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                  | Backend plugin bị thiếu hoặc bị vô hiệu hóa.                                  | Cài đặt và kích hoạt backend plugin, sau đó chạy `/acp doctor`.                                                                                                    |
| `ACP is disabled by policy (acp.enabled=false)`                          | ACP bị vô hiệu hóa toàn cầu.                                                  | Đặt `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`        | Dispatch từ các tin nhắn thread thông thường bị vô hiệu hóa.                  | Đặt `acp.dispatch.enabled=true`.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                              | Agent không có trong danh sách cho phép.                                      | Sử dụng `agentId` được phép hoặc cập nhật `acp.allowedAgents`.                                                                                                     |
| `Unable to resolve session target: ...`                                  | Token key/id/label không hợp lệ.                                              | Chạy `/acp sessions`, sao chép key/label chính xác, thử lại.                                                                                                       |
| `--thread here requires running /acp spawn inside an active ... thread`  | `--thread here` được sử dụng ngoài ngữ cảnh thread.                           | Chuyển đến thread mục tiêu hoặc sử dụng `--thread auto`/`off`.                                                                                                     |
| `Only <user-id> can rebind this thread.`                                 | Người dùng khác sở hữu binding thread.                                        | Gắn lại như chủ sở hữu hoặc sử dụng một thread khác.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                         | Adapter thiếu khả năng binding thread.                                        | Sử dụng `--thread off` hoặc chuyển đến adapter/kênh được hỗ trợ.                                                                                                   |
| `Sandboxed sessions cannot spawn ACP sessions ...`                       | ACP runtime là host-side; requester session bị sandboxed.                     | Sử dụng `runtime="subagent"` từ các sessions sandboxed, hoặc chạy ACP spawn từ một session không bị sandboxed.                                                     |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`  | `sandbox="require"` được yêu cầu cho ACP runtime.                             | Sử dụng `runtime="subagent"` cho yêu cầu sandboxing, hoặc sử dụng ACP với `sandbox="inherit"` từ một session không bị sandboxed.                                   |
| Missing ACP metadata for bound session                                   | Metadata ACP session cũ/bị xóa.                                               | Tạo lại với `/acp spawn`, sau đó gắn lại/tập trung thread.                                                                                                         |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` chặn ghi/thực thi trong ACP session không tương tác.         | Đặt `plugins.entries.acpx.config.permissionMode` thành `approve-all` và khởi động lại gateway. Xem [Cấu hình quyền](#permission-configuration).                   |
| ACP session fails early with little output                               | Các prompt quyền bị chặn bởi `permissionMode`/`nonInteractivePermissions`.    | Kiểm tra log gateway cho `AcpRuntimeError`. Để có quyền đầy đủ, đặt `permissionMode=approve-all`; để giảm thiểu graceful, đặt `nonInteractivePermissions=deny`.   |
| ACP session stalls indefinitely after completing work                    | Quá trình harness đã hoàn thành nhưng ACP session không báo cáo hoàn thành.   | Giám sát với `ps aux \| grep acpx`; giết các quá trình bị treo thủ công.                                                                                           |\n