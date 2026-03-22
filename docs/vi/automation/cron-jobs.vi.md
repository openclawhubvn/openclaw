---
summary: "Cron jobs + wakeups cho Gateway scheduler"
read_when:
  - Lên lịch background jobs hoặc wakeups
  - Tích hợp automation chạy cùng hoặc bên cạnh heartbeats
  - Quyết định giữa heartbeat và cron cho các tác vụ định kỳ
title: "Cron Jobs"
---

# Cron jobs (Gateway scheduler)

> **Cron vs Heartbeat?** Xem [Cron vs Heartbeat](/automation/cron-vs-heartbeat) để biết khi nào nên dùng cái nào.

Cron là scheduler tích hợp sẵn của Gateway. Nó lưu trữ jobs, đánh thức agent đúng lúc và có thể gửi kết quả về chat.

Nếu cần _“chạy mỗi sáng”_ hoặc _“đánh thức agent sau 20 phút”_, dùng cron.

Troubleshooting: [/automation/troubleshooting](/automation/troubleshooting)

## TL;DR

- Cron chạy **trong Gateway** (không phải trong model).
- Jobs lưu dưới `~/.openclaw/cron/` nên restart không mất lịch.
- Hai kiểu thực thi:
  - **Main session**: enqueue một system event, rồi chạy ở heartbeat tiếp theo.
  - **Isolated**: chạy một agent turn riêng trong `cron:<jobId>` hoặc session tùy chỉnh, với delivery (announce mặc định hoặc không).
  - **Current session**: gắn vào session tạo cron (`sessionTarget: "current"`).
  - **Custom session**: chạy trong session có tên riêng (`sessionTarget: "session:custom-id"`).
- Wakeups là first-class: job có thể yêu cầu “wake now” hoặc “next heartbeat”.
- Webhook posting từng job qua `delivery.mode = "webhook"` + `delivery.to = "<url>"`.
- Legacy fallback cho jobs lưu với `notify: true` khi `cron.webhook` được set, chuyển những jobs đó sang webhook delivery mode.
- Để nâng cấp, `openclaw doctor --fix` có thể chuẩn hóa các trường cron store cũ trước khi scheduler xử lý.

## Quick start (actionable)

Tạo một reminder một lần, kiểm tra nó tồn tại, và chạy ngay:

```bash
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

openclaw cron list
openclaw cron run <job-id>
openclaw cron runs --id <job-id>
```

Lên lịch một job isolated định kỳ với delivery:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

## Tool-call equivalents (Gateway cron tool)

Xem [JSON schema for tool calls](/automation/cron-jobs#json-schema-for-tool-calls) để biết các JSON shapes và ví dụ chuẩn.

## Nơi lưu trữ cron jobs

Cron jobs được lưu trên host Gateway tại `~/.openclaw/cron/jobs.json` theo mặc định. Gateway tải file vào bộ nhớ và ghi lại khi có thay đổi, nên chỉ chỉnh sửa thủ công khi Gateway dừng. Ưu tiên dùng `openclaw cron add/edit` hoặc cron tool call API để thay đổi.

## Beginner-friendly overview

Hãy nghĩ về một cron job như: **khi nào** chạy + **làm gì**.

1. **Chọn lịch trình**
   - Reminder một lần → `schedule.kind = "at"` (CLI: `--at`)
   - Job lặp lại → `schedule.kind = "every"` hoặc `schedule.kind = "cron"`
   - Nếu timestamp ISO không có timezone, nó được coi là **UTC**.

2. **Chọn nơi chạy**
   - `sessionTarget: "main"` → chạy trong heartbeat tiếp theo với main context.
   - `sessionTarget: "isolated"` → chạy một agent turn riêng trong `cron:<jobId>`.
   - `sessionTarget: "current"` → gắn vào session hiện tại (được xác định tại thời điểm tạo thành `session:<sessionKey>`).
   - `sessionTarget: "session:custom-id"` → chạy trong session có tên riêng duy trì context qua các lần chạy.

   Hành vi mặc định (không thay đổi):
   - `systemEvent` payloads mặc định là `main`
   - `agentTurn` payloads mặc định là `isolated`

   Để dùng current session binding, cần set `sessionTarget: "current"`.

3. **Chọn payload**
   - Main session → `payload.kind = "systemEvent"`
   - Isolated session → `payload.kind = "agentTurn"`

Tùy chọn: jobs một lần (`schedule.kind = "at"`) xóa sau khi thành công theo mặc định. Set `deleteAfterRun: false` để giữ lại (chúng sẽ vô hiệu hóa sau khi thành công).

## Concepts

### Jobs

Một cron job là một bản ghi lưu trữ với:

- một **schedule** (khi nào chạy),
- một **payload** (làm gì),
- tùy chọn **delivery mode** (`announce`, `webhook`, hoặc `none`).
- tùy chọn **agent binding** (`agentId`): chạy job dưới một agent cụ thể; nếu thiếu hoặc không xác định, gateway sẽ dùng agent mặc định.

Jobs được xác định bởi một `jobId` ổn định (dùng bởi CLI/Gateway APIs). Trong agent tool calls, `jobId` là chuẩn; `id` cũ được chấp nhận để tương thích. Jobs một lần tự động xóa sau khi thành công theo mặc định; set `deleteAfterRun: false` để giữ lại.

### Schedules

Cron hỗ trợ ba loại schedule:

- `at`: timestamp một lần qua `schedule.at` (ISO 8601).
- `every`: khoảng thời gian cố định (ms).
- `cron`: biểu thức cron 5 trường (hoặc 6 trường với giây) với timezone IANA tùy chọn.

Biểu thức cron dùng `croner`. Nếu không có timezone, timezone của host Gateway được dùng.

Để giảm tải đỉnh giờ trên nhiều gateways, OpenClaw áp dụng một cửa sổ stagger xác định theo job lên đến 5 phút cho các biểu thức đỉnh giờ định kỳ (ví dụ `0 * * * *`, `0 */2 * * *`). Các biểu thức giờ cố định như `0 7 * * *` vẫn chính xác.

Với bất kỳ cron schedule nào, có thể set một cửa sổ stagger rõ ràng với `schedule.staggerMs` (`0` giữ thời gian chính xác). CLI shortcuts:

- `--stagger 30s` (hoặc `1m`, `5m`) để set một cửa sổ stagger rõ ràng.
- `--exact` để buộc `staggerMs = 0`.

### Main vs isolated execution

#### Main session jobs (system events)

Main jobs enqueue một system event và tùy chọn đánh thức heartbeat runner. Chúng phải dùng `payload.kind = "systemEvent"`.

- `wakeMode: "now"` (mặc định): event kích hoạt một heartbeat run ngay lập tức.
- `wakeMode: "next-heartbeat"`: event chờ heartbeat tiếp theo.

Đây là lựa chọn tốt nhất khi muốn prompt heartbeat bình thường + main-session context. Xem [Heartbeat](/gateway/heartbeat).

#### Isolated jobs (dedicated cron sessions)

Isolated jobs chạy một agent turn riêng trong session `cron:<jobId>` hoặc session tùy chỉnh.

Các hành vi chính:

- Prompt được tiền tố với `[cron:<jobId> <job name>]` để dễ truy vết.
- Mỗi lần chạy bắt đầu một **session id mới** (không có carry-over cuộc trò chuyện trước), trừ khi dùng session tùy chỉnh.
- Custom sessions (`session:xxx`) duy trì context qua các lần chạy, cho phép workflows như daily standups xây dựng trên các tóm tắt trước đó.
- Hành vi mặc định: nếu `delivery` bị bỏ qua, isolated jobs thông báo một tóm tắt (`delivery.mode = "announce"`).
- `delivery.mode` chọn điều gì xảy ra:
  - `announce`: gửi một tóm tắt đến kênh mục tiêu và đăng một tóm tắt ngắn gọn lên main session.
  - `webhook`: POST payload sự kiện hoàn thành đến `delivery.to` khi sự kiện hoàn thành bao gồm một tóm tắt.
  - `none`: chỉ nội bộ (không delivery, không tóm tắt main-session).
- `wakeMode` điều khiển khi nào tóm tắt main-session được đăng:
  - `now`: heartbeat ngay lập tức.
  - `next-heartbeat`: chờ heartbeat tiếp theo.

Dùng isolated jobs cho các công việc ồn ào, thường xuyên, hoặc "background chores" không nên spam lịch sử chat chính.

### Payload shapes (what runs)

Hai loại payload được hỗ trợ:

- `systemEvent`: chỉ main-session, định tuyến qua heartbeat prompt.
- `agentTurn`: chỉ isolated-session, chạy một agent turn riêng.

Các trường `agentTurn` phổ biến:

- `message`: text prompt bắt buộc.
- `model` / `thinking`: overrides tùy chọn (xem bên dưới).
- `timeoutSeconds`: override timeout tùy chọn.
- `lightContext`: chế độ bootstrap nhẹ tùy chọn cho các jobs không cần workspace bootstrap file injection.

Cấu hình delivery:

- `delivery.mode`: `none` | `announce` | `webhook`.
- `delivery.channel`: `last` hoặc một kênh cụ thể.
- `delivery.to`: mục tiêu cụ thể của kênh (announce) hoặc URL webhook (webhook mode).
- `delivery.bestEffort`: tránh thất bại job nếu announce delivery thất bại.

Announce delivery ngăn chặn gửi tin nhắn công cụ cho lần chạy; dùng `delivery.channel`/`delivery.to` để nhắm mục tiêu chat thay thế. Khi `delivery.mode = "none"`, không có tóm tắt nào được đăng lên main session.

Nếu `delivery` bị bỏ qua cho isolated jobs, OpenClaw mặc định là `announce`.

#### Announce delivery flow

Khi `delivery.mode = "announce"`, cron gửi trực tiếp qua các outbound channel adapters. Main agent không được khởi động để tạo hoặc chuyển tiếp tin nhắn.

Chi tiết hành vi:

- Nội dung: delivery dùng các payloads outbound của lần chạy isolated (text/media) với chunking và định dạng kênh bình thường.
- Phản hồi chỉ có heartbeat (`HEARTBEAT_OK` không có nội dung thực) không được gửi.
- Nếu lần chạy isolated đã gửi một tin nhắn đến cùng mục tiêu qua công cụ tin nhắn, delivery bị bỏ qua để tránh trùng lặp.
- Mục tiêu delivery thiếu hoặc không hợp lệ làm job thất bại trừ khi `delivery.bestEffort = true`.
- Một tóm tắt ngắn được đăng lên main session chỉ khi `delivery.mode = "announce"`.
- Tóm tắt main-session tuân theo `wakeMode`: `now` kích hoạt một heartbeat ngay lập tức và `next-heartbeat` chờ heartbeat tiếp theo.

#### Webhook delivery flow

Khi `delivery.mode = "webhook"`, cron gửi payload sự kiện hoàn thành đến `delivery.to` khi sự kiện hoàn thành bao gồm một tóm tắt.

Chi tiết hành vi:

- Endpoint phải là một URL HTTP(S) hợp lệ.
- Không có delivery kênh nào được thực hiện trong webhook mode.
- Không có tóm tắt main-session nào được đăng trong webhook mode.
- Nếu `cron.webhookToken` được set, header auth là `Authorization: Bearer <cron.webhookToken>`.
- Fallback cũ: jobs legacy lưu với `notify: true` vẫn gửi đến `cron.webhook` (nếu được cấu hình), với cảnh báo để bạn có thể chuyển sang `delivery.mode = "webhook"`.

### Model và thinking overrides

Isolated jobs (`agentTurn`) có thể override model và thinking level:

- `model`: Chuỗi Provider/model (ví dụ, `anthropic/claude-sonnet-4-20250514`) hoặc alias (ví dụ, `opus`)
- `thinking`: Thinking level (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`; chỉ GPT-5.2 + Codex models)

Lưu ý: Có thể set `model` trên main-session jobs, nhưng nó thay đổi model session chính. Khuyến nghị chỉ override model cho isolated jobs để tránh thay đổi context không mong muốn.

Ưu tiên giải quyết:

1. Override payload job (cao nhất)
2. Mặc định hook-specific (ví dụ, `hooks.gmail.model`)
3. Mặc định cấu hình agent

### Lightweight bootstrap context

Isolated jobs (`agentTurn`) có thể set `lightContext: true` để chạy với lightweight bootstrap context.

- Dùng cho các công việc định kỳ không cần workspace bootstrap file injection.
- Trong thực tế, runtime nhúng chạy với `bootstrapContextMode: "lightweight"`, giữ cron bootstrap context trống có chủ đích.
- CLI equivalents: `openclaw cron add --light-context ...` và `openclaw cron edit --light-context`.

### Delivery (channel + target)

Isolated jobs có thể gửi output đến một kênh qua cấu hình `delivery` cấp cao nhất:

- `delivery.mode`: `announce` (channel delivery), `webhook` (HTTP POST), hoặc `none`.
- `delivery.channel`: `whatsapp` / `telegram` / `discord` / `slack` / `mattermost` (plugin) / `signal` / `imessage` / `last`.
- `delivery.to`: mục tiêu người nhận cụ thể của kênh.

`announce` delivery chỉ hợp lệ cho isolated jobs (`sessionTarget: "isolated"`). `webhook` delivery hợp lệ cho cả main và isolated jobs.

Nếu `delivery.channel` hoặc `delivery.to` bị bỏ qua, cron có thể fallback vào “last route” của main session (nơi agent trả lời lần cuối).

Nhắc nhở định dạng mục tiêu:

- Slack/Discord/Mattermost (plugin) targets nên dùng tiền tố rõ ràng (ví dụ `channel:<id>`, `user:<id>`) để tránh mơ hồ. Mattermost bare 26-char IDs được giải quyết **user-first** (DM nếu user tồn tại, channel nếu không) — dùng `user:<id>` hoặc `channel:<id>` để định tuyến rõ ràng.
- Telegram topics nên dùng dạng `:topic:` (xem bên dưới).

#### Telegram delivery targets (topics / forum threads)

Telegram hỗ trợ forum topics qua `message_thread_id`. Để cron delivery, có thể mã hóa topic/thread vào trường `to`:

- `-1001234567890` (chỉ chat id)
- `-1001234567890:topic:123` (ưu tiên: đánh dấu topic rõ ràng)
- `-1001234567890:123` (viết tắt: hậu tố số)

Các mục tiêu có tiền tố như `telegram:...` / `telegram:group:...` cũng được chấp nhận:

- `telegram:group:-1001234567890:topic:123`

## JSON schema for tool calls

Dùng các shapes này khi gọi trực tiếp các công cụ Gateway `cron.*` (agent tool calls hoặc RPC). CLI flags chấp nhận thời lượng con người như `20m`, nhưng tool calls nên dùng chuỗi ISO 8601 cho `schedule.at` và milliseconds cho `schedule.everyMs`.

### cron.add params

Job một lần, main session (system event):

```json
{
  "name": "Reminder",
  "schedule": { "kind": "at", "at": "2026-02-01T16:00:00Z" },
  "sessionTarget": "main",
  "wakeMode": "now",
  "payload": { "kind": "systemEvent", "text": "Reminder text" },
  "deleteAfterRun": true
}
```

Job isolated định kỳ với delivery:

```json
{
  "name": "Morning brief",
  "schedule": { "kind": "cron", "expr": "0 7 * * *", "tz": "America/Los_Angeles" },
  "sessionTarget": "isolated",
  "wakeMode": "next-heartbeat",
  "payload": {
    "kind": "agentTurn",
    "message": "Summarize overnight updates.",
    "lightContext": true
  },
  "delivery": {
    "mode": "announce",
    "channel": "slack",
    "to": "channel:C1234567890",
    "bestEffort": true
  }
}
```

Job định kỳ gắn vào session hiện tại (tự động xác định khi tạo):

```json
{
  "name": "Daily standup",
  "schedule": { "kind": "cron", "expr": "0 9 * * *" },
  "sessionTarget": "current",
  "payload": {
    "kind": "agentTurn",
    "message": "Summarize yesterday's progress."
  }
}
```

Job định kỳ trong một session tùy chỉnh:

```json
{
  "name": "Project monitor",
  "schedule": { "kind": "every", "everyMs": 300000 },
  "sessionTarget": "session:project-alpha-monitor",
  "payload": {
    "kind": "agentTurn",
    "message": "Check project status and update the running log."
  }
}
```

Ghi chú:

- `schedule.kind`: `at` (`at`), `every` (`everyMs`), hoặc `cron` (`expr`, tùy chọn `tz`).
- `schedule.at` chấp nhận ISO 8601 (timezone tùy chọn; coi là UTC khi bị bỏ qua).
- `everyMs` là milliseconds.
- `sessionTarget`: `"main"`, `"isolated"`, `"current"`, hoặc `"session:<custom-id>"`.
- `"current"` được xác định thành `"session:<sessionKey>"` khi tạo.
- Custom sessions (`session:xxx`) duy trì context qua các lần chạy.
- Các trường tùy chọn: `agentId`, `description`, `enabled`, `deleteAfterRun` (mặc định là true cho `at`), `delivery`.
- `wakeMode` mặc định là `"now"` khi bị bỏ qua.

### cron.update params

```json
{
  "jobId": "job-123",
  "patch": {
    "enabled": false,
    "schedule": { "kind": "every", "everyMs": 3600000 }
  }
}
```

Ghi chú:

- `jobId` là chuẩn; `id` được chấp nhận để tương thích.
- Dùng `agentId: null` trong patch để xóa một agent binding.

### cron.run và cron.remove params

```json
{ "jobId": "job-123", "mode": "force" }
```

```json
{ "jobId": "job-123" }
```

## Storage & history

- Job store: `~/.openclaw/cron/jobs.json` (JSON do Gateway quản lý).
- Run history: `~/.openclaw/cron/runs/<jobId>.jsonl` (JSONL, tự động cắt giảm theo kích thước và số dòng).
- Isolated cron run sessions trong `sessions.json` được cắt giảm bởi `cron.sessionRetention` (mặc định `24h`; set `false` để vô hiệu hóa).
- Override store path: `cron.store` trong config.

## Retry policy

Khi một job thất bại, OpenClaw phân loại lỗi là **transient** (có thể retry) hoặc **permanent** (vô hiệu hóa ngay lập tức).

### Transient errors (retried)

- Rate limit (429, quá nhiều yêu cầu, tài nguyên cạn kiệt)
- Provider overload (ví dụ Anthropic `529 overloaded_error`, overload fallback summaries)
- Network errors (timeout, ECONNRESET, fetch failed, socket)
- Server errors (5xx)
- Cloudflare-related errors

### Permanent errors (no retry)

- Auth failures (invalid API key, unauthorized)
- Config hoặc validation errors
- Các lỗi không phải transient khác

### Default behavior (no config)

**Jobs một lần (`schedule.kind: "at"`):**

- Khi lỗi transient: retry tối đa 3 lần với exponential backoff (30s → 1m → 5m).
- Khi lỗi permanent: vô hiệu hóa ngay lập tức.
- Khi thành công hoặc bỏ qua: vô hiệu hóa (hoặc xóa nếu `deleteAfterRun: true`).

**Jobs định kỳ (`cron` / `every`):**

- Khi bất kỳ lỗi nào: áp dụng exponential backoff (30s → 1m → 5m → 15m → 60m) trước lần chạy tiếp theo.
- Job vẫn được bật; backoff reset sau lần chạy thành công tiếp theo.

Cấu hình `cron.retry` để override các mặc định này (xem [Configuration](/automation/cron-jobs#configuration)).

## Configuration

```json5
{
  cron: {
    enabled: true, // mặc định true
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1, // mặc định 1
    // Tùy chọn: override retry policy cho jobs một lần
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhook: "https://example.invalid/legacy", // fallback cũ cho jobs lưu notify:true
    webhookToken: "replace-with-dedicated-webhook-token", // bearer token tùy chọn cho webhook mode
    sessionRetention: "24h", // chuỗi thời lượng hoặc false
    runLog: {
      maxBytes: "2mb", // mặc định 2_000_000 bytes
      keepLines: 2000, // mặc định 2000
    },
  },
}
```

Hành vi cắt giảm run-log:

- `cron.runLog.maxBytes`: kích thước file run-log tối đa trước khi cắt giảm.
- `cron.runLog.keepLines`: khi cắt giảm, chỉ giữ lại N dòng mới nhất.
- Cả hai áp dụng cho files `cron/runs/<jobId>.jsonl`.

Hành vi Webhook:

- Ưu tiên: set `delivery.mode: "webhook"` với `delivery.to: "https://..."` từng job.
- Webhook URLs phải là URLs `http://` hoặc `https://` hợp lệ.
- Khi được gửi, payload là JSON sự kiện hoàn thành cron.
- Nếu `cron.webhookToken` được set, header auth là `Authorization: Bearer <cron.webhookToken>`.
- Nếu `cron.webhookToken` không được set, không có header `Authorization` nào được gửi.
- Fallback cũ: jobs legacy lưu với `notify: true` vẫn dùng `cron.webhook` khi có.

Vô hiệu hóa cron hoàn toàn:

- `cron.enabled: false` (config)
- `OPENCLAW_SKIP_CRON=1` (env)

## Maintenance

Cron có hai đường dẫn bảo trì tích hợp: retention run-session isolated và cắt giảm run-log.

### Defaults

- `cron.sessionRetention`: `24h` (set `false` để vô hiệu hóa cắt giảm run-session)
- `cron.runLog.maxBytes`: `2_000_000` bytes
- `cron.runLog.keepLines`: `2000`

### Cách hoạt động

- Isolated runs tạo các mục session (`...:cron:<jobId>:run:<uuid>`) và các files transcript.
- Reaper xóa các mục run-session hết hạn cũ hơn `cron.sessionRetention`.
- Đối với các run sessions đã bị xóa không còn được tham chiếu bởi session store, OpenClaw lưu trữ các files transcript và xóa các lưu trữ đã xóa cũ trên cùng cửa sổ retention.
- Sau mỗi lần chạy append, `cron/runs/<jobId>.jsonl` được kiểm tra kích thước:
  - nếu kích thước file vượt quá `runLog.maxBytes`, nó được cắt giảm xuống các dòng `runLog.keepLines` mới nhất.

### Lưu ý hiệu suất cho schedulers tần suất cao

Thiết lập cron tần suất cao có thể tạo ra footprint run-session và run-log lớn. Bảo trì được tích hợp, nhưng giới hạn lỏng lẻo vẫn có thể tạo ra công việc IO và cleanup không cần thiết.

Cần chú ý:

- cửa sổ `cron.sessionRetention` dài với nhiều isolated runs
- `cron.runLog.keepLines` cao kết hợp với `runLog.maxBytes` lớn
- nhiều jobs định kỳ ồn ào ghi vào cùng `cron/runs/<jobId>.jsonl`

Cần làm:

- giữ `cron.sessionRetention` ngắn nhất có thể theo nhu cầu debugging/audit
- giữ run logs trong giới hạn với `runLog.maxBytes` và `runLog.keepLines` vừa phải
- chuyển các công việc background ồn ào sang chế độ isolated với các quy tắc delivery tránh chatter không cần thiết
- xem xét tăng trưởng định kỳ với `openclaw cron runs` và điều chỉnh retention trước khi logs trở nên lớn

### Ví dụ tùy chỉnh

Giữ run sessions trong một tuần và cho phép run logs lớn hơn:

```json5
{
  cron: {
    sessionRetention: "7d",
    runLog: {
      maxBytes: "10mb",
      keepLines: 5000,
    },
  },
}
```

Vô hiệu hóa cắt giảm run-session isolated nhưng giữ cắt giảm run-log:

```json5
{
  cron: {
    sessionRetention: false,
    runLog: {
      maxBytes: "5mb",
      keepLines: 3000,
    },
  },
}
```

Điều chỉnh cho sử dụng cron tần suất cao (ví dụ):

```json5
{
  cron: {
    sessionRetention: "12h",
    runLog: {
      maxBytes: "3mb",
      keepLines: 1500,
    },
  },
}
```

## CLI quickstart

Reminder một lần (UTC ISO, tự động xóa sau khi thành công):

```bash
openclaw cron add \
  --name "Send reminder" \
  --at "2026-01-12T18:00:00Z" \
  --session main \
  --system-event "Reminder: submit expense report." \
  --wake now \
  --delete-after-run
```

Reminder một lần (main session, wake ngay lập tức):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Job isolated định kỳ (announce đến WhatsApp):

```bash
openclaw cron add \
  --name "Morning status" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize inbox + calendar for today." \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

Job cron định kỳ với stagger 30 giây rõ ràng:

```bash
openclaw cron add \
  --name "Minute watcher" \
  --cron "0 * * * * *" \
  --tz "UTC" \
  --stagger 30s \
  --session isolated \
  --message "Run minute watcher checks." \
  --announce
```

Job isolated định kỳ (gửi đến một Telegram topic):

```bash
openclaw cron add \
  --name "Nightly summary (topic)" \
  --cron "0 22 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize today; send to the nightly topic." \
  --announce \
  --channel telegram \
  --to "-1001234567890:topic:123"
```

Job isolated với model và thinking override:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

Chọn agent (multi-agent setups):

```bash
# Gắn một job vào agent "ops" (fallback về mặc định nếu agent đó thiếu)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops

# Chuyển hoặc xóa agent trên một job hiện có
openclaw cron edit <jobId> --agent ops
openclaw cron edit <jobId> --clear-agent
```

Chạy thủ công (force là mặc định, dùng `--due` để chỉ chạy khi đến hạn):

```bash
openclaw cron run <jobId>
openclaw cron run <jobId> --due
```

`cron.run` giờ xác nhận khi chạy thủ công được xếp hàng, không phải sau khi job hoàn thành. Phản hồi xếp hàng thành công trông như `{ ok: true, enqueued: true, runId }`. Nếu job đang chạy hoặc `--due` không tìm thấy gì đến hạn, phản hồi vẫn là `{ ok: true, ran: false, reason }`. Dùng `openclaw cron runs --id <jobId>` hoặc phương thức `cron.runs` gateway để kiểm tra mục hoàn thành cuối cùng.

Chỉnh sửa một job hiện có (patch fields):

```bash
openclaw cron edit <jobId> \
  --message "Updated prompt" \
  --model "opus" \
  --thinking low
```

Buộc một job cron hiện có chạy đúng lịch (không stagger):

```bash
openclaw cron edit <jobId> --exact
```

Lịch sử chạy:

```bash
openclaw cron runs --id <jobId> --limit 50
```

System event ngay lập tức mà không tạo job:

```bash
openclaw system event --mode now --text "Next heartbeat: check battery."
```

## Gateway API surface

- `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`
- `cron.run` (force hoặc due), `cron.runs`
  Để có system events ngay lập tức mà không cần job, dùng [`openclaw system event`](/cli/system).

## Troubleshooting

### "Không có gì chạy"

- Kiểm tra cron đã bật: `cron.enabled` và `OPENCLAW_SKIP_CRON`.
- Kiểm tra Gateway đang chạy liên tục (cron chạy trong process Gateway).
- Với `cron` schedules: xác nhận timezone (`--tz`) so với timezone của host.

### Một job định kỳ liên tục trì hoãn sau khi thất bại

- OpenClaw áp dụng exponential retry backoff cho jobs định kỳ sau các lỗi liên tiếp: 30s, 1m, 5m, 15m, sau đó 60m giữa các lần retry.
- Backoff tự động reset sau lần chạy thành công tiếp theo.
- Jobs một lần (`at`) retry lỗi transient (rate limit, overloaded, network, server_error) tối đa 3 lần với backoff; lỗi permanent vô hiệu hóa ngay lập tức. Xem [Retry policy](/automation/cron-jobs#retry-policy).

### Telegram gửi đến sai nơi

- Với forum topics, dùng `-100…:topic:<id>` để rõ ràng và không mơ hồ.
- Nếu thấy tiền tố `telegram:...` trong logs hoặc các mục tiêu “last route” lưu trữ, điều đó là bình thường; cron delivery chấp nhận chúng và vẫn phân tích cú pháp topic IDs chính xác.

### Subagent announce delivery retries

- Khi một subagent run hoàn thành, gateway thông báo kết quả đến requester session.
- Nếu announce flow trả về `false` (ví dụ requester session đang bận), gateway retry tối đa 3 lần với tracking qua `announceRetryCount`.
- Announces cũ hơn 5 phút sau `endedAt` bị hết hạn cưỡng bức để ngăn các mục cũ lặp lại vô thời hạn.
- Nếu thấy các announce deliveries lặp lại trong logs, kiểm tra subagent registry cho các mục với giá trị `announceRetryCount` cao.\n