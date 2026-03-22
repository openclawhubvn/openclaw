---
summary: "Khám phá cách sử dụng ACP runtime cho Pi, Claude Code, Codex và các tác nhân khác. Tối ưu hóa hiệu suất công việc của bạn."
read_when:
  - Chạy coding harnesses qua ACP
  - Thiết lập các phiên ACP gắn liền với thread trên các kênh hỗ trợ thread
  - Gắn các kênh Discord hoặc chủ đề diễn đàn Telegram vào các phiên ACP liên tục
  - Khắc phục sự cố backend ACP và kết nối plugin
  - Thực hiện lệnh /acp từ chat
title: "Hướng Dẫn Sử Dụng Tác Nhân ACP"
---

# Tác nhân ACP

Các phiên [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) cho phép OpenClaw chạy các coding harnesses bên ngoài (như Pi, Claude Code, Codex, OpenCode và Gemini CLI) thông qua một plugin backend ACP.

Nếu bạn yêu cầu OpenClaw bằng ngôn ngữ tự nhiên để "chạy cái này trong Codex" hoặc "bắt đầu Claude Code trong một thread", OpenClaw sẽ định tuyến yêu cầu đó đến runtime ACP (không phải runtime sub-agent gốc).

## Quy trình vận hành nhanh

Sử dụng khi bạn cần một runbook `/acp` thực tế:

1. Khởi tạo một phiên:
   - `/acp spawn codex --mode persistent --thread auto`
2. Làm việc trong thread đã gắn (hoặc nhắm mục tiêu vào khóa phiên đó một cách rõ ràng).
3. Kiểm tra trạng thái runtime:
   - `/acp status`
4. Điều chỉnh các tùy chọn runtime khi cần:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Điều chỉnh một phiên đang hoạt động mà không thay thế ngữ cảnh:
   - `/acp steer tighten logging and continue`
6. Dừng công việc:
   - `/acp cancel` (dừng lượt hiện tại), hoặc
   - `/acp close` (đóng phiên + xóa các liên kết)

## Bắt đầu nhanh cho người dùng

Ví dụ về các yêu cầu tự nhiên:

- "Bắt đầu một phiên Codex liên tục trong một thread ở đây và giữ nó tập trung."
- "Chạy cái này như một phiên Claude Code ACP một lần và tóm tắt kết quả."
- "Sử dụng Gemini CLI cho nhiệm vụ này trong một thread, sau đó giữ các theo dõi trong cùng thread đó."

Những gì OpenClaw nên làm:

1. Chọn `runtime: "acp"`.
2. Xác định mục tiêu harness được yêu cầu (`agentId`, ví dụ `codex`).
3. Nếu yêu cầu gắn thread và kênh hiện tại hỗ trợ, gắn phiên ACP vào thread.
4. Định tuyến các tin nhắn theo dõi thread đến cùng phiên ACP đó cho đến khi không còn tập trung/đóng/hết hạn.

## ACP so với sub-agents

Sử dụng ACP khi bạn muốn một runtime harness bên ngoài. Sử dụng sub-agents khi bạn muốn các lần chạy được ủy quyền gốc của OpenClaw.

| Khu vực        | Phiên ACP                              | Chạy sub-agent                       |
| -------------- | -------------------------------------- | ------------------------------------ |
| Runtime        | Plugin backend ACP (ví dụ acpx)        | Runtime sub-agent gốc của OpenClaw   |
| Khóa phiên     | `agent:<agentId>:acp:<uuid>`           | `agent:<agentId>:subagent:<uuid>`    |
| Lệnh chính     | `/acp ...`                             | `/subagents ...`                     |
| Công cụ spawn  | `sessions_spawn` với `runtime:"acp"`   | `sessions_spawn` (runtime mặc định)  |

Xem thêm [Sub-agents](/tools/subagents).

## Phiên gắn liền với thread (không phụ thuộc kênh)

Khi các liên kết thread được kích hoạt cho một adapter kênh, các phiên ACP có thể được gắn vào các thread:

- OpenClaw gắn một thread vào một phiên ACP mục tiêu.
- Các tin nhắn theo dõi trong thread đó được định tuyến đến phiên ACP đã gắn.
- Đầu ra ACP được gửi lại cho cùng thread đó.
- Không tập trung/đóng/lưu trữ/hết thời gian chờ hoặc hết tuổi tối đa sẽ xóa liên kết.

Hỗ trợ gắn thread là đặc thù của adapter. Nếu adapter kênh hiện tại không hỗ trợ gắn thread, OpenClaw sẽ trả về một thông báo không hỗ trợ/không khả dụng rõ ràng.

Các cờ tính năng cần thiết cho ACP gắn liền với thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` được bật theo mặc định (đặt `false` để tạm dừng dispatch ACP)
- Cờ spawn thread-adapter ACP được bật (đặc thù của adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Các kênh hỗ trợ thread

- Bất kỳ adapter kênh nào cung cấp khả năng gắn kết phiên/thread.
- Hỗ trợ tích hợp sẵn hiện tại:
  - Các thread/kênh Discord
  - Các chủ đề Telegram (chủ đề diễn đàn trong nhóm/siêu nhóm và chủ đề DM)
- Các kênh plugin có thể thêm hỗ trợ thông qua cùng giao diện gắn kết.

## Cài đặt cụ thể cho kênh

Đối với các quy trình không tạm thời, cấu hình các liên kết ACP liên tục trong các mục `bindings[]` cấp cao nhất.

### Mô hình liên kết

- `bindings[].type="acp"` đánh dấu một liên kết cuộc trò chuyện ACP liên tục.
- `bindings[].match` xác định cuộc trò chuyện mục tiêu:
  - Kênh hoặc thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Chủ đề diễn đàn Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- `bindings[].agentId` là id tác nhân OpenClaw sở hữu.
- Các ghi đè ACP tùy chọn nằm dưới `bindings[].acp`:
  - `mode` (`persistent` hoặc `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Mặc định runtime cho mỗi tác nhân

Sử dụng `agents.list[].runtime` để định nghĩa mặc định ACP một lần cho mỗi tác nhân:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, ví dụ `codex` hoặc `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Thứ tự ưu tiên ghi đè cho các phiên ACP gắn liền:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Mặc định ACP toàn cầu (ví dụ `acp.backend`)

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

- OpenClaw đảm bảo phiên ACP được cấu hình tồn tại trước khi sử dụng.
- Các tin nhắn trong kênh hoặc chủ đề đó được định tuyến đến phiên ACP đã cấu hình.
- Trong các cuộc trò chuyện đã gắn, `/new` và `/reset` đặt lại cùng khóa phiên ACP tại chỗ.
- Các liên kết runtime tạm thời (ví dụ được tạo bởi các luồng tập trung thread) vẫn áp dụng khi có.

## Bắt đầu các phiên ACP (giao diện)

### Từ `sessions_spawn`

Sử dụng `runtime: "acp"` để bắt đầu một phiên ACP từ một lượt tác nhân hoặc cuộc gọi công cụ.

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

- `runtime` mặc định là `subagent`, vì vậy hãy đặt `runtime: "acp"` rõ ràng cho các phiên ACP.
- Nếu `agentId` bị bỏ qua, OpenClaw sử dụng `acp.defaultAgent` khi được cấu hình.
- `mode: "session"` yêu cầu `thread: true` để giữ một cuộc trò chuyện gắn liền liên tục.

Chi tiết giao diện:

- `task` (bắt buộc): lời nhắc ban đầu được gửi đến phiên ACP.
- `runtime` (bắt buộc cho ACP): phải là `"acp"`.
- `agentId` (tùy chọn): id harness mục tiêu ACP. Sẽ sử dụng `acp.defaultAgent` nếu được đặt.
- `thread` (tùy chọn, mặc định `false`): yêu cầu luồng gắn kết thread khi được hỗ trợ.
- `mode` (tùy chọn): `run` (một lần) hoặc `session` (liên tục).
  - mặc định là `run`
  - nếu `thread: true` và chế độ bị bỏ qua, OpenClaw có thể mặc định hành vi liên tục theo đường dẫn runtime
  - `mode: "session"` yêu cầu `thread: true`
- `cwd` (tùy chọn): thư mục làm việc runtime được yêu cầu (được xác thực bởi chính sách backend/runtime).
- `label` (tùy chọn): nhãn hướng đến người vận hành được sử dụng trong văn bản phiên/banner.
- `resumeSessionId` (tùy chọn): tiếp tục một phiên ACP hiện có thay vì tạo một phiên mới. Tác nhân phát lại lịch sử cuộc trò chuyện của nó qua `session/load`. Yêu cầu `runtime: "acp"`.
- `streamTo` (tùy chọn): `"parent"` truyền các tóm tắt tiến trình chạy ACP ban đầu trở lại phiên yêu cầu dưới dạng sự kiện hệ thống.
  - Khi có sẵn, các phản hồi được chấp nhận bao gồm `streamLogPath` trỏ đến một log JSONL theo phạm vi phiên (`<sessionId>.acp-stream.jsonl`) bạn có thể theo dõi để có lịch sử chuyển tiếp đầy đủ.

### Tiếp tục một phiên hiện có

Sử dụng `resumeSessionId` để tiếp tục một phiên ACP trước đó thay vì bắt đầu mới. Tác nhân phát lại lịch sử cuộc trò chuyện của nó qua `session/load`, vì vậy nó tiếp tục với đầy đủ ngữ cảnh của những gì đã xảy ra trước đó.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Các trường hợp sử dụng phổ biến:

- Chuyển một phiên Codex từ laptop của bạn sang điện thoại — yêu cầu tác nhân của bạn tiếp tục từ nơi bạn đã dừng lại
- Tiếp tục một phiên mã hóa bạn đã bắt đầu tương tác trong CLI, bây giờ không có đầu qua tác nhân của bạn
- Tiếp tục công việc bị gián đoạn bởi khởi động lại gateway hoặc hết thời gian chờ

Ghi chú:

- `resumeSessionId` yêu cầu `runtime: "acp"` — trả về lỗi nếu được sử dụng với runtime sub-agent.
- `resumeSessionId` khôi phục lịch sử cuộc trò chuyện ACP thượng nguồn; `thread` và `mode` vẫn áp dụng bình thường cho phiên OpenClaw mới bạn đang tạo, vì vậy `mode: "session"` vẫn yêu cầu `thread: true`.
- Tác nhân mục tiêu phải hỗ trợ `session/load` (Codex và Claude Code có).
- Nếu không tìm thấy ID phiên, spawn sẽ thất bại với một lỗi rõ ràng — không có fallback im lặng sang một phiên mới.

### Kiểm tra nhanh của người vận hành

Sử dụng điều này sau khi triển khai gateway khi bạn muốn kiểm tra nhanh xem spawn ACP có thực sự hoạt động từ đầu đến cuối hay không, không chỉ vượt qua các bài kiểm tra đơn vị.

Cổng được đề xuất:

1. Xác minh phiên bản/commit gateway đã triển khai trên máy chủ mục tiêu.
2. Xác nhận mã nguồn đã triển khai bao gồm chấp nhận dòng dõi ACP trong
   `src/gateway/sessions-patch.ts` (`subagent:* hoặc acp:* sessions`).
3. Mở một phiên cầu nối ACPX tạm thời đến một tác nhân trực tiếp (ví dụ
   `razor(main)` trên `jpclawhq`).
4. Yêu cầu tác nhân đó gọi `sessions_spawn` với:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Xác minh tác nhân báo cáo:
   - `accepted=yes`
   - một `childSessionKey` thực
   - không có lỗi validator
6. Dọn dẹp phiên cầu nối ACPX tạm thời.

Ví dụ lời nhắc cho tác nhân trực tiếp:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Ghi chú:

- Giữ bài kiểm tra nhanh này trên `mode: "run"` trừ khi bạn đang cố ý kiểm tra
  các phiên ACP liên tục gắn liền với thread.
- Không yêu cầu `streamTo: "parent"` cho cổng cơ bản. Đường dẫn đó phụ thuộc vào
  khả năng của người yêu cầu/phiên và là một kiểm tra tích hợp riêng biệt.
- Xem xét thử nghiệm `mode: "session"` gắn liền với thread như một lần vượt qua tích hợp phong phú thứ hai từ một thread Discord thực hoặc chủ đề Telegram.

## Tương thích với Sandbox

Các phiên ACP hiện chạy trên runtime host, không phải bên trong sandbox OpenClaw.

Hạn chế hiện tại:

- Nếu phiên yêu cầu được sandbox, spawn ACP bị chặn cho cả `sessions_spawn({ runtime: "acp" })` và `/acp spawn`.
  - Lỗi: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` với `runtime: "acp"` không hỗ trợ `sandbox: "require"`.
  - Lỗi: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Sử dụng `runtime: "subagent"` khi bạn cần thực thi được bảo vệ bởi sandbox.

### Từ lệnh `/acp`

Sử dụng `/acp spawn` để kiểm soát rõ ràng từ chat khi cần.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --thread here
```

Các cờ chính:

- `--mode persistent|oneshot`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Xem [Slash Commands](/tools/slash-commands).

## Giải quyết mục tiêu phiên

Hầu hết các hành động `/acp` chấp nhận một mục tiêu phiên tùy chọn (`session-key`, `session-id`, hoặc `session-label`).

Thứ tự giải quyết:

1. Đối số mục tiêu rõ ràng (hoặc `--session` cho `/acp steer`)
   - thử khóa
   - sau đó ID phiên có dạng UUID
   - sau đó nhãn
2. Liên kết thread hiện tại (nếu cuộc trò chuyện/thread này được gắn vào một phiên ACP)
3. Fallback phiên yêu cầu hiện tại

Nếu không có mục tiêu nào được giải quyết, OpenClaw trả về một lỗi rõ ràng (`Unable to resolve session target: ...`).

## Chế độ spawn thread

`/acp spawn` hỗ trợ `--thread auto|here|off`.

| Chế độ | Hành vi                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------- |
| `auto` | Trong một thread đang hoạt động: gắn thread đó. Ngoài một thread: tạo/gắn một thread con khi được hỗ trợ. |
| `here` | Yêu cầu thread đang hoạt động hiện tại; thất bại nếu không có.                                        |
| `off`  | Không gắn kết. Phiên bắt đầu không gắn kết.                                                           |

Ghi chú:

- Trên các bề mặt không gắn kết thread, hành vi mặc định là `off`.
- Spawn gắn kết thread yêu cầu hỗ trợ chính sách kênh:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

## Điều khiển ACP

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

`/acp status` hiển thị các tùy chọn runtime hiệu quả và, khi có, cả các định danh phiên cấp runtime và cấp backend.

Một số điều khiển phụ thuộc vào khả năng backend. Nếu một backend không hỗ trợ một điều khiển, OpenClaw trả về một lỗi không hỗ trợ rõ ràng.

## Sổ tay lệnh ACP

| Lệnh                | Chức năng                                                | Ví dụ                                                         |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`        | Tạo phiên ACP; tùy chọn gắn kết thread.                  | `/acp spawn codex --mode persistent --thread auto --cwd /repo`|
| `/acp cancel`       | Hủy lượt đang thực hiện cho phiên mục tiêu.              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`        | Gửi hướng dẫn điều chỉnh đến phiên đang chạy.            | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`        | Đóng phiên và hủy gắn kết mục tiêu thread.              | `/acp close`                                                  |
| `/acp status`       | Hiển thị backend, chế độ, trạng thái, tùy chọn runtime, khả năng. | `/acp status`                                                 |
| `/acp set-mode`     | Đặt chế độ runtime cho phiên mục tiêu.                   | `/acp set-mode plan`                                          |
| `/acp set`          | Ghi tùy chọn cấu hình runtime chung.                     | `/acp set model openai/gpt-5.2`                               |
| `/acp cwd`          | Đặt ghi đè thư mục làm việc runtime.                     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`  | Đặt hồ sơ chính sách phê duyệt.                          | `/acp permissions strict`                                     |
| `/acp timeout`      | Đặt thời gian chờ runtime (giây).                        | `/acp timeout 120`                                            |
| `/acp model`        | Đặt ghi đè mô hình runtime.                              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options`| Xóa các ghi đè tùy chọn runtime cho phiên mục tiêu.      | `/acp reset-options`                                          |
| `/acp sessions`     | Liệt kê các phiên ACP gần đây từ kho lưu trữ.            | `/acp sessions`                                               |
| `/acp doctor`       | Kiểm tra sức khỏe backend, khả năng, sửa chữa có thể thực hiện. | `/acp doctor`                                                 |
| `/acp install`      | In các bước cài đặt và kích hoạt xác định.               | `/acp install`                                                |

`/acp sessions` đọc kho lưu trữ cho phiên hiện tại đã gắn hoặc phiên yêu cầu. Các lệnh chấp nhận token `session-key`, `session-id`, hoặc `session-label` giải quyết mục tiêu thông qua khám phá phiên gateway, bao gồm các `session.store` tùy chỉnh cho mỗi tác nhân.

## Ánh xạ tùy chọn runtime

`/acp` có các lệnh tiện lợi và một bộ thiết lập chung.

Các hoạt động tương đương:

- `/acp model <id>` ánh xạ đến khóa cấu hình runtime `model`.
- `/acp permissions <profile>` ánh xạ đến khóa cấu hình runtime `approval_policy`.
- `/acp timeout <seconds>` ánh xạ đến khóa cấu hình runtime `timeout`.
- `/acp cwd <path>` cập nhật ghi đè cwd runtime trực tiếp.
- `/acp set <key> <value>` là đường dẫn chung.
  - Trường hợp đặc biệt: `key=cwd` sử dụng đường dẫn ghi đè cwd.
- `/acp reset-options` xóa tất cả các ghi đè runtime cho phiên mục tiêu.

## Hỗ trợ harness acpx (hiện tại)

Các alias harness tích hợp sẵn hiện tại của acpx:

- `pi`
- `claude`
- `codex`
- `opencode`
- `gemini`
- `kimi`

Khi OpenClaw sử dụng backend acpx, ưu tiên các giá trị này cho `agentId` trừ khi cấu hình acpx của bạn định nghĩa các alias tác nhân tùy chỉnh.

Sử dụng CLI acpx trực tiếp cũng có thể nhắm mục tiêu các adapter tùy ý qua `--agent <command>`, nhưng lối thoát thô đó là một tính năng CLI acpx (không phải đường dẫn `agentId` thông thường của OpenClaw).

## Cấu hình cần thiết

Cơ sở ACP cốt lõi:

```json5
{
  acp: {
    enabled: true,
    // Tùy chọn. Mặc định là true; đặt false để tạm dừng dispatch ACP trong khi giữ các điều khiển /acp.
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

Cấu hình gắn kết thread là đặc thù của adapter kênh. Ví dụ cho Discord:

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

Nếu spawn ACP gắn liền với thread không hoạt động, hãy xác minh cờ tính năng adapter trước:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Xem [Configuration Reference](/gateway/configuration-reference).

## Thiết lập plugin cho backend acpx

Cài đặt và kích hoạt plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Cài đặt workspace cục bộ trong quá trình phát triển:

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
3. Khởi động đăng ký backend ACP ngay lập tức là không sẵn sàng.
4. Một công việc đảm bảo nền xác minh `acpx --version`.
5. Nếu binary cục bộ plugin bị thiếu hoặc không khớp, nó chạy:
   `npm install --omit=dev --no-save acpx@<pinned>` và xác minh lại.

Bạn có thể ghi đè lệnh/phiên bản trong cấu hình plugin:

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
- Khi `command` trỏ đến một binary/đường dẫn tùy chỉnh, cài đặt tự động cục bộ plugin bị vô hiệu hóa.
- Khởi động OpenClaw vẫn không bị chặn trong khi kiểm tra sức khỏe backend chạy.

Xem [Plugins](/tools/plugin).

## Cấu hình quyền

Các phiên ACP chạy không tương tác — không có TTY để phê duyệt hoặc từ chối các lời nhắc quyền ghi tệp và thực thi shell. Plugin acpx cung cấp hai khóa cấu hình kiểm soát cách xử lý quyền:

### `permissionMode`

Kiểm soát các hoạt động mà tác nhân harness có thể thực hiện mà không cần nhắc nhở.

| Giá trị         | Hành vi                                                   |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Tự động phê duyệt tất cả các ghi tệp và lệnh shell.       |
| `approve-reads` | Tự động phê duyệt chỉ đọc; ghi và thực thi yêu cầu nhắc nhở. |
| `deny-all`      | Từ chối tất cả các lời nhắc quyền.                        |

### `nonInteractivePermissions`

Kiểm soát điều gì xảy ra khi một lời nhắc quyền sẽ được hiển thị nhưng không có TTY tương tác nào có sẵn (điều này luôn xảy ra đối với các phiên ACP).

| Giá trị | Hành vi                                                           |
| ------- | ----------------------------------------------------------------- |
| `fail`  | Hủy phiên với `AcpRuntimeError`. **(mặc định)**                   |
| `deny`  | Từ chối quyền một cách im lặng và tiếp tục (suy giảm nhẹ nhàng).  |

### Cấu hình

Đặt qua cấu hình plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Khởi động lại gateway sau khi thay đổi các giá trị này.

> **Quan trọng:** OpenClaw hiện mặc định `permissionMode=approve-reads` và `nonInteractivePermissions=fail`. Trong các phiên ACP không tương tác, bất kỳ ghi hoặc thực thi nào kích hoạt một lời nhắc quyền có thể thất bại với `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Nếu bạn cần hạn chế quyền, đặt `nonInteractivePermissions` thành `deny` để các phiên suy giảm nhẹ nhàng thay vì bị lỗi.

## Khắc phục sự cố

| Triệu chứng                                                               | Nguyên nhân có thể xảy ra                                                      | Cách khắc phục                                                                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                  | Plugin backend bị thiếu hoặc bị vô hiệu hóa.                                   | Cài đặt và kích hoạt plugin backend, sau đó chạy `/acp doctor`.                                                                                                    |
| `ACP is disabled by policy (acp.enabled=false)`                          | ACP bị vô hiệu hóa toàn cầu.                                                   | Đặt `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`        | Dispatch từ các tin nhắn thread thông thường bị vô hiệu hóa.                   | Đặt `acp.dispatch.enabled=true`.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                              | Tác nhân không có trong danh sách cho phép.                                    | Sử dụng `agentId` được phép hoặc cập nhật `acp.allowedAgents`.                                                                                                     |
| `Unable to resolve session target: ...`                                  | Token khóa/id/nhãn không hợp lệ.                                               | Chạy `/acp sessions`, sao chép khóa/nhãn chính xác, thử lại.                                                                                                       |
| `--thread here requires running /acp spawn inside an active ... thread`  | `--thread here` được sử dụng ngoài ngữ cảnh thread.                            | Di chuyển đến thread mục tiêu hoặc sử dụng `--thread auto`/`off`.                                                                                                  |
| `Only <user-id> can rebind this thread.`                                 | Người dùng khác sở hữu liên kết thread.                                        | Gắn lại như chủ sở hữu hoặc sử dụng một thread khác.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                         | Adapter không có khả năng gắn kết thread.                                      | Sử dụng `--thread off` hoặc di chuyển đến adapter/kênh được hỗ trợ.                                                                                               |
| `Sandboxed sessions cannot spawn ACP sessions ...`                       | Runtime ACP là phía host; phiên yêu cầu được sandbox.                          | Sử dụng `runtime="subagent"` từ các phiên sandbox, hoặc chạy spawn ACP từ một phiên không được sandbox.                                                            |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`  | `sandbox="require"` được yêu cầu cho runtime ACP.                              | Sử dụng `runtime="subagent"` cho yêu cầu sandboxing, hoặc sử dụng ACP với `sandbox="inherit"` từ một phiên không được sandbox.                                     |
| Thiếu metadata ACP cho phiên đã gắn                                      | Metadata phiên ACP cũ/bị xóa.                                                  | Tạo lại với `/acp spawn`, sau đó gắn lại/tập trung thread.                                                                                                        |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` chặn ghi/thực thi trong phiên ACP không tương tác.            | Đặt `plugins.entries.acpx.config.permissionMode` thành `approve-all` và khởi động lại gateway. Xem [Cấu hình quyền](#permission-configuration).                   |
| Phiên ACP thất bại sớm với ít đầu ra                                      | Các lời nhắc quyền bị chặn bởi `permissionMode`/`nonInteractivePermissions`.   | Kiểm tra log gateway cho `AcpRuntimeError`. Để có đầy đủ quyền, đặt `permissionMode=approve-all`; để suy giảm nhẹ nhàng, đặt `nonInteractivePermissions=deny`.    |
| Phiên ACP bị treo vô thời hạn sau khi hoàn thành công việc                | Quá trình harness đã hoàn thành nhưng phiên ACP không báo cáo hoàn thành.      | Giám sát với `ps aux \| grep acpx`; giết các quá trình bị treo thủ công.                                                                                          |
