---
summary: "Cron jobs và wakeups cho bộ lập lịch Gateway"
read_when:
  - Lập lịch công việc nền hoặc wakeups
  - Tích hợp tự động hóa chạy cùng hoặc bên cạnh heartbeats
  - Quyết định giữa heartbeat và cron cho các tác vụ theo lịch trình
title: "Cron Jobs"
---

# Cron jobs (Bộ lập lịch Gateway)

> **Cron vs Heartbeat?** Xem [Cron vs Heartbeat](/automation/cron-vs-heartbeat) để biết khi nào nên sử dụng từng cái.

Cron là bộ lập lịch tích hợp sẵn của Gateway. Nó lưu trữ công việc, đánh thức agent vào thời điểm thích hợp và có thể gửi kết quả về một cuộc trò chuyện.

Nếu bạn muốn _“chạy cái này mỗi sáng”_ hoặc _“đánh thức agent sau 20 phút”_, cron là cơ chế phù hợp.

Khắc phục sự cố: [/automation/troubleshooting](/automation/troubleshooting)

## Tóm tắt nhanh

- Cron chạy **bên trong Gateway** (không phải bên trong mô hình).
- Công việc được lưu trữ dưới `~/.openclaw/cron/` nên khi khởi động lại sẽ không mất lịch trình.
- Hai kiểu thực thi:
  - **Phiên chính**: xếp hàng một sự kiện hệ thống, sau đó chạy trong lần heartbeat tiếp theo.
  - **Cô lập**: chạy một lượt agent chuyên dụng trong `cron:<jobId>` hoặc một phiên tùy chỉnh, với việc gửi thông báo (mặc định là thông báo hoặc không có).
  - **Phiên hiện tại**: gắn với phiên nơi cron được tạo (`sessionTarget: "current"`).
  - **Phiên tùy chỉnh**: chạy trong một phiên được đặt tên cố định (`sessionTarget: "session:custom-id"`).
- Wakeups là hạng nhất: một công việc có thể yêu cầu “đánh thức ngay bây giờ” so với “heartbeat tiếp theo”.
- Đăng webhook là theo từng công việc qua `delivery.mode = "webhook"` + `delivery.to = "<url>"`.
- Vẫn có thể sử dụng cách cũ cho các công việc đã lưu với `notify: true` khi `cron.webhook` được thiết lập, di chuyển các công việc đó sang chế độ gửi webhook.
- Để nâng cấp, `openclaw doctor --fix` có thể chuẩn hóa các trường lưu trữ cron cũ trước khi bộ lập lịch chạm vào chúng.

## Bắt đầu nhanh (có thể thực hiện)

Tạo một lời nhắc một lần, xác minh nó tồn tại và chạy ngay lập tức:

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

Lên lịch một công việc cô lập định kỳ với việc gửi thông báo:

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

## Tương đương với lệnh công cụ (Công cụ cron Gateway)

Để biết các dạng JSON chuẩn và ví dụ, xem [JSON schema for tool calls](/automation/cron-jobs#json-schema-for-tool-calls).

## Nơi lưu trữ cron jobs

Cron jobs được lưu trữ trên máy chủ Gateway tại `~/.openclaw/cron/jobs.json` theo mặc định. Gateway tải file vào bộ nhớ và ghi lại khi có thay đổi, vì vậy chỉ nên chỉnh sửa thủ công khi Gateway đã dừng. Ưu tiên sử dụng `openclaw cron add/edit` hoặc API gọi công cụ cron để thay đổi.

## Tổng quan thân thiện với người mới bắt đầu

Hãy nghĩ về một cron job như: **khi nào** chạy + **làm gì**.

1. **Chọn lịch trình**
   - Lời nhắc một lần → `schedule.kind = "at"` (CLI: `--at`)
   - Công việc lặp lại → `schedule.kind = "every"` hoặc `schedule.kind = "cron"`
   - Nếu dấu thời gian ISO của bạn không có múi giờ, nó sẽ được coi là **UTC**.

2. **Chọn nơi nó chạy**
   - `sessionTarget: "main"` → chạy trong lần heartbeat tiếp theo với ngữ cảnh chính.
   - `sessionTarget: "isolated"` → chạy một lượt agent chuyên dụng trong `cron:<jobId>`.
   - `sessionTarget: "current"` → gắn với phiên hiện tại (được giải quyết tại thời điểm tạo thành `session:<sessionKey>`).
   - `sessionTarget: "session:custom-id"` → chạy trong một phiên được đặt tên cố định duy trì ngữ cảnh qua các lần chạy.

   Hành vi mặc định (không thay đổi):
   - Payload `systemEvent` mặc định là `main`
   - Payload `agentTurn` mặc định là `isolated`

   Để sử dụng gắn kết phiên hiện tại, hãy đặt rõ `sessionTarget: "current"`.

3. **Chọn payload**
   - Phiên chính → `payload.kind = "systemEvent"`
   - Phiên cô lập → `payload.kind = "agentTurn"`

Tùy chọn: công việc một lần (`schedule.kind = "at"`) sẽ tự động xóa sau khi thành công. Đặt `deleteAfterRun: false` để giữ chúng (chúng sẽ bị vô hiệu hóa sau khi thành công).

## Khái niệm

### Jobs

Một cron job là một bản ghi lưu trữ với:

- một **lịch trình** (khi nào nó nên chạy),
- một **payload** (nó nên làm gì),
- chế độ **giao hàng** tùy chọn (`announce`, `webhook`, hoặc `none`).
- ràng buộc **agent** tùy chọn (`agentId`): chạy công việc dưới một agent cụ thể; nếu thiếu hoặc không xác định, gateway sẽ quay lại agent mặc định.

Jobs được xác định bởi một `jobId` ổn định (được sử dụng bởi CLI/Gateway APIs). Trong các cuộc gọi công cụ agent, `jobId` là chuẩn; `id` cũ được chấp nhận để tương thích. Công việc một lần tự động xóa sau khi thành công theo mặc định; đặt `deleteAfterRun: false` để giữ chúng.

### Lịch trình

Cron hỗ trợ ba loại lịch trình:

- `at`: dấu thời gian một lần qua `schedule.at` (ISO 8601).
- `every`: khoảng thời gian cố định (ms).
- `cron`: biểu thức cron 5 trường (hoặc 6 trường với giây) với múi giờ IANA tùy chọn.

Biểu thức cron sử dụng `croner`. Nếu một múi giờ bị bỏ qua, múi giờ địa phương của máy chủ Gateway sẽ được sử dụng.

Để giảm tải đỉnh giờ trên nhiều gateways, OpenClaw áp dụng một cửa sổ giật lùi xác định theo từng công việc lên đến 5 phút cho các biểu thức đỉnh giờ lặp lại (ví dụ `0 * * * *`, `0 */2 * * *`). Các biểu thức giờ cố định như `0 7 * * *` vẫn giữ nguyên chính xác.

Đối với bất kỳ lịch trình cron nào, bạn có thể đặt một cửa sổ giật lùi rõ ràng với `schedule.staggerMs` (`0` giữ thời gian chính xác). Các phím tắt CLI:

- `--stagger 30s` (hoặc `1m`, `5m`) để đặt một cửa sổ giật lùi rõ ràng.
- `--exact` để buộc `staggerMs = 0`.

### Thực thi chính vs cô lập

#### Công việc phiên chính (sự kiện hệ thống)

Công việc chính xếp hàng một sự kiện hệ thống và tùy chọn đánh thức trình chạy heartbeat. Chúng phải sử dụng `payload.kind = "systemEvent"`.

- `wakeMode: "now"` (mặc định): sự kiện kích hoạt một lần chạy heartbeat ngay lập tức.
- `wakeMode: "next-heartbeat"`: sự kiện chờ lần heartbeat tiếp theo được lên lịch.

Đây là lựa chọn tốt nhất khi bạn muốn lời nhắc heartbeat bình thường + ngữ cảnh phiên chính. Xem [Heartbeat](/gateway/heartbeat).

#### Công việc cô lập (phiên cron chuyên dụng)

Công việc cô lập chạy một lượt agent chuyên dụng trong phiên `cron:<jobId>` hoặc một phiên tùy chỉnh.

Các hành vi chính:

- Lời nhắc được tiền tố với `[cron:<jobId> <job name>]` để dễ dàng theo dõi.
- Mỗi lần chạy bắt đầu một **id phiên mới** (không có cuộc trò chuyện trước đó), trừ khi sử dụng một phiên tùy chỉnh.
- Các phiên tùy chỉnh (`session:xxx`) duy trì ngữ cảnh qua các lần chạy, cho phép các quy trình làm việc như các cuộc họp hàng ngày xây dựng trên các bản tóm tắt trước đó.
- Hành vi mặc định: nếu `delivery` bị bỏ qua, công việc cô lập thông báo một bản tóm tắt (`delivery.mode = "announce"`).
- `delivery.mode` chọn điều gì xảy ra:
  - `announce`: gửi một bản tóm tắt đến kênh mục tiêu và đăng một bản tóm tắt ngắn gọn lên phiên chính.
  - `webhook`: POST payload sự kiện đã hoàn thành đến `delivery.to` khi sự kiện đã hoàn thành bao gồm một bản tóm tắt.
  - `none`: chỉ nội bộ (không có giao hàng, không có bản tóm tắt phiên chính).
- `wakeMode` kiểm soát khi nào bản tóm tắt phiên chính được đăng:
  - `now`: heartbeat ngay lập tức.
  - `next-heartbeat`: chờ lần heartbeat tiếp theo được lên lịch.

Sử dụng công việc cô lập cho các công việc ồn ào, thường xuyên hoặc "công việc nền" không nên làm phiền lịch sử trò chuyện chính của bạn.

### Hình dạng payload (chạy cái gì)

Hai loại payload được hỗ trợ:

- `systemEvent`: chỉ phiên chính, được định tuyến qua lời nhắc heartbeat.
- `agentTurn`: chỉ phiên cô lập, chạy một lượt agent chuyên dụng.

Các trường `agentTurn` phổ biến:

- `message`: lời nhắc văn bản bắt buộc.
- `model` / `thinking`: ghi đè tùy chọn (xem bên dưới).
- `timeoutSeconds`: ghi đè thời gian chờ tùy chọn.
- `lightContext`: chế độ khởi động nhẹ tùy chọn cho các công việc không cần tiêm tệp khởi động workspace.

Cấu hình giao hàng:

- `delivery.mode`: `none` | `announce` | `webhook`.
- `delivery.channel`: `last` hoặc một kênh cụ thể.
- `delivery.to`: mục tiêu cụ thể của kênh (announce) hoặc URL webhook (chế độ webhook).
- `delivery.bestEffort`: tránh thất bại công việc nếu giao hàng thông báo thất bại.

Giao hàng thông báo ngăn chặn gửi công cụ nhắn tin cho lần chạy; sử dụng `delivery.channel`/`delivery.to` để nhắm mục tiêu cuộc trò chuyện thay thế. Khi `delivery.mode = "none"`, không có bản tóm tắt nào được đăng lên phiên chính.

Nếu `delivery` bị bỏ qua cho các công việc cô lập, OpenClaw mặc định là `announce`.

#### Luồng giao hàng thông báo

Khi `delivery.mode = "announce"`, cron giao hàng trực tiếp qua các bộ điều hợp kênh đầu ra. Agent chính không được khởi động để tạo hoặc chuyển tiếp tin nhắn.

Chi tiết hành vi:

- Nội dung: giao hàng sử dụng payload đầu ra của lần chạy cô lập (văn bản/phương tiện) với phân đoạn và định dạng kênh bình thường.
- Phản hồi chỉ có heartbeat (`HEARTBEAT_OK` không có nội dung thực) không được giao.
- Nếu lần chạy cô lập đã gửi một tin nhắn đến cùng mục tiêu qua công cụ nhắn tin, giao hàng bị bỏ qua để tránh trùng lặp.
- Mục tiêu giao hàng thiếu hoặc không hợp lệ làm công việc thất bại trừ khi `delivery.bestEffort = true`.
- Một bản tóm tắt ngắn được đăng lên phiên chính chỉ khi `delivery.mode = "announce"`.
- Bản tóm tắt phiên chính tôn trọng `wakeMode`: `now` kích hoạt một heartbeat ngay lập tức và `next-heartbeat` chờ lần heartbeat tiếp theo được lên lịch.

#### Luồng giao hàng webhook

Khi `delivery.mode = "webhook"`, cron đăng payload sự kiện đã hoàn thành đến `delivery.to` khi sự kiện đã hoàn thành bao gồm một bản tóm tắt.

Chi tiết hành vi:

- Endpoint phải là một URL HTTP(S) hợp lệ.
- Không có giao hàng kênh nào được thực hiện trong chế độ webhook.
- Không có bản tóm tắt phiên chính nào được đăng trong chế độ webhook.
- Nếu `cron.webhookToken` được thiết lập, tiêu đề xác thực là `Authorization: Bearer <cron.webhookToken>`.
- Cách cũ bị loại bỏ: các công việc cũ được lưu trữ với `notify: true` vẫn đăng lên `cron.webhook` (nếu được cấu hình), với một cảnh báo để bạn có thể di chuyển sang `delivery.mode = "webhook"`.

### Ghi đè mô hình và suy nghĩ

Công việc cô lập (`agentTurn`) có thể ghi đè mô hình và mức độ suy nghĩ:

- `model`: Chuỗi nhà cung cấp/mô hình (ví dụ: `anthropic/claude-sonnet-4-20250514`) hoặc bí danh (ví dụ: `opus`)
- `thinking`: Mức độ suy nghĩ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`; chỉ các mô hình GPT-5.2 + Codex)

Lưu ý: Bạn có thể đặt `model` trên các công việc phiên chính, nhưng nó thay đổi mô hình phiên chính được chia sẻ. Chúng tôi khuyến nghị ghi đè mô hình chỉ cho các công việc cô lập để tránh các thay đổi ngữ cảnh không mong muốn.

Ưu tiên giải quyết:

1. Ghi đè payload công việc (cao nhất)
2. Mặc định cụ thể của hook (ví dụ: `hooks.gmail.model`)
3. Mặc định cấu hình agent

### Ngữ cảnh khởi động nhẹ

Công việc cô lập (`agentTurn`) có thể đặt `lightContext: true` để chạy với ngữ cảnh khởi động nhẹ.

- Sử dụng điều này cho các công việc đã lên lịch không cần tiêm tệp khởi động workspace.
- Trong thực tế, runtime nhúng chạy với `bootstrapContextMode: "lightweight"`, giữ ngữ cảnh khởi động cron trống rỗng có chủ ý.
- Tương đương CLI: `openclaw cron add --light-context ...` và `openclaw cron edit --light-context`.

### Giao hàng (kênh + mục tiêu)

Công việc cô lập có thể giao hàng đầu ra đến một kênh qua cấu hình `delivery` cấp cao nhất:

- `delivery.mode`: `announce` (giao hàng kênh), `webhook` (HTTP POST), hoặc `none`.
- `delivery.channel`: `whatsapp` / `telegram` / `discord` / `slack` / `mattermost` (plugin) / `signal` / `imessage` / `last`.
- `delivery.to`: mục tiêu người nhận cụ thể của kênh.

Giao hàng `announce` chỉ hợp lệ cho các công việc cô lập (`sessionTarget: "isolated"`). Giao hàng `webhook` hợp lệ cho cả công việc chính và cô lập.

Nếu `delivery.channel` hoặc `delivery.to` bị bỏ qua, cron có thể quay lại "last route" của phiên chính (nơi cuối cùng agent đã trả lời).

Nhắc nhở định dạng mục tiêu:

- Mục tiêu Slack/Discord/Mattermost (plugin) nên sử dụng tiền tố rõ ràng (ví dụ: `channel:<id>`, `user:<id>`) để tránh mơ hồ. Mattermost ID 26 ký tự không có tiền tố được giải quyết **ưu tiên người dùng** (DM nếu người dùng tồn tại, kênh nếu không) — sử dụng `user:<id>` hoặc `channel:<id>` để định tuyến rõ ràng.
- Chủ đề Telegram nên sử dụng dạng `:topic:` (xem bên dưới).

#### Mục tiêu giao hàng Telegram (chủ đề / luồng diễn đàn)

Telegram hỗ trợ chủ đề diễn đàn qua `message_thread_id`. Đối với giao hàng cron, bạn có thể mã hóa chủ đề/luồng vào trường `to`:

- `-1001234567890` (chỉ id chat)
- `-1001234567890:topic:123` (ưu tiên: đánh dấu chủ đề rõ ràng)
- `-1001234567890:123` (viết tắt: hậu tố số)

Các mục tiêu có tiền tố như `telegram:...` / `telegram:group:...` cũng được chấp nhận:

- `telegram:group:-1001234567890:topic:123`

## JSON schema cho các cuộc gọi công cụ

Sử dụng các dạng này khi gọi trực tiếp các công cụ `cron.*` của Gateway (các cuộc gọi công cụ agent hoặc RPC). Các cờ CLI chấp nhận thời lượng con người như `20m`, nhưng các cuộc gọi công cụ nên sử dụng chuỗi ISO 8601 cho `schedule.at` và mili giây cho `schedule.everyMs`.

### Tham số cron.add

Công việc một lần, phiên chính (sự kiện hệ thống):

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

Công việc cô lập định kỳ với giao hàng:

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

Công việc định kỳ gắn với phiên hiện tại (tự động giải quyết khi tạo):

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

Công việc định kỳ trong một phiên cố định tùy chỉnh:

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

- `schedule.kind`: `at` (`at`), `every` (`everyMs`), hoặc `cron` (`expr`, `tz` tùy chọn).
- `schedule.at` chấp nhận ISO 8601 (múi giờ tùy chọn; được coi là UTC khi bị bỏ qua).
- `everyMs` là mili giây.
- `sessionTarget`: `"main"`, `"isolated"`, `"current"`, hoặc `"session:<custom-id>"`.
- `"current"` được giải quyết thành `"session:<sessionKey>"` khi tạo.
- Các phiên tùy chỉnh (`session:xxx`) duy trì ngữ cảnh cố định qua các lần chạy.
- Các trường tùy chọn: `agentId`, `description`, `enabled`, `deleteAfterRun` (mặc định là true cho `at`), `delivery`.
- `wakeMode` mặc định là `"now"` khi bị bỏ qua.

### Tham số cron.update

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
- Sử dụng `agentId: null` trong bản vá để xóa một ràng buộc agent.

### Tham số cron.run và cron.remove

```json
{ "jobId": "job-123", "mode": "force" }
```

```json
{ "jobId": "job-123" }
```

## Lưu trữ & lịch sử

- Lưu trữ công việc: `~/.openclaw/cron/jobs.json` (JSON do Gateway quản lý).
- Lịch sử chạy: `~/.openclaw/cron/runs/<jobId>.jsonl` (JSONL, tự động cắt bớt theo kích thước và số dòng).
- Các phiên chạy cron cô lập trong `sessions.json` được cắt bớt bởi `cron.sessionRetention` (mặc định `24h`; đặt `false` để vô hiệu hóa).
- Ghi đè đường dẫn lưu trữ: `cron.store` trong cấu hình.

## Chính sách thử lại

Khi một công việc thất bại, OpenClaw phân loại lỗi là **tạm thời** (có thể thử lại) hoặc **vĩnh viễn** (vô hiệu hóa ngay lập tức).

### Lỗi tạm thời (được thử lại)

- Giới hạn tốc độ (429, quá nhiều yêu cầu, tài nguyên cạn kiệt)
- Quá tải nhà cung cấp (ví dụ: Anthropic `529 overloaded_error`, tóm tắt quá tải)
- Lỗi mạng (hết thời gian chờ, ECONNRESET, fetch thất bại, socket)
- Lỗi máy chủ (5xx)
- Lỗi liên quan đến Cloudflare

### Lỗi vĩnh viễn (không thử lại)

- Lỗi xác thực (khóa API không hợp lệ, không được phép)
- Lỗi cấu hình hoặc xác thực
- Các lỗi không tạm thời khác

### Hành vi mặc định (không cấu hình)

**Công việc một lần (`schedule.kind: "at"`):**

- Khi gặp lỗi tạm thời: thử lại tối đa 3 lần với backoff theo cấp số nhân (30s → 1m → 5m).
- Khi gặp lỗi vĩnh viễn: vô hiệu hóa ngay lập tức.
- Khi thành công hoặc bỏ qua: vô hiệu hóa (hoặc xóa nếu `deleteAfterRun: true`).

**Công việc định kỳ (`cron` / `every`):**

- Khi gặp bất kỳ lỗi nào: áp dụng backoff theo cấp số nhân (30s → 1m → 5m → 15m → 60m) trước lần chạy tiếp theo được lên lịch.
- Công việc vẫn được kích hoạt; backoff được đặt lại sau lần chạy thành công tiếp theo.

Cấu hình `cron.retry` để ghi đè các mặc định này (xem [Configuration](/automation/cron-jobs#configuration)).

## Cấu hình

```json5
{
  cron: {
    enabled: true, // mặc định true
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1, // mặc định 1
    // Tùy chọn: ghi đè chính sách thử lại cho công việc một lần
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhook: "https://example.invalid/legacy", // cách cũ bị loại bỏ cho các công việc lưu trữ notify:true
    webhookToken: "replace-with-dedicated-webhook-token", // mã thông báo bearer tùy chọn cho chế độ webhook
    sessionRetention: "24h", // chuỗi thời lượng hoặc false
    runLog: {
      maxBytes: "2mb", // mặc định 2_000_000 bytes
      keepLines: 2000, // mặc định 2000
    },
  },
}
```

Hành vi cắt bớt nhật ký chạy:

- `cron.runLog.maxBytes`: kích thước tệp nhật ký chạy tối đa trước khi cắt bớt.
- `cron.runLog.keepLines`: khi cắt bớt, chỉ giữ lại N dòng mới nhất.
- Cả hai áp dụng cho các tệp `cron/runs/<jobId>.jsonl`.

Hành vi webhook:

- Ưu tiên: đặt `delivery.mode: "webhook"` với `delivery.to: "https://..."` cho từng công việc.
- URL webhook phải là URL `http://` hoặc `https://` hợp lệ.
- Khi được đăng, payload là JSON sự kiện đã hoàn thành cron.
- Nếu `cron.webhookToken` được thiết lập, tiêu đề xác thực là `Authorization: Bearer <cron.webhookToken>`.
- Nếu `cron.webhookToken` không được thiết lập, không có tiêu đề `Authorization` nào được gửi.
- Cách cũ bị loại bỏ: các công việc cũ được lưu trữ với `notify: true` vẫn sử dụng `cron.webhook` khi có.

Vô hiệu hóa cron hoàn toàn:

- `cron.enabled: false` (cấu hình)
- `OPENCLAW_SKIP_CRON=1` (môi trường)

## Bảo trì

Cron có hai đường dẫn bảo trì tích hợp: giữ lại phiên chạy cô lập và cắt bớt nhật ký chạy.

### Mặc định

- `cron.sessionRetention`: `24h` (đặt `false` để vô hiệu hóa cắt bớt phiên chạy)
- `cron.runLog.maxBytes`: `2_000_000` bytes
- `cron.runLog.keepLines`: `2000`

### Cách hoạt động

- Các lần chạy cô lập tạo các mục phiên (`...:cron:<jobId>:run:<uuid>`) và các tệp bản ghi.
- Bộ dọn dẹp loại bỏ các mục phiên chạy đã hết hạn cũ hơn `cron.sessionRetention`.
- Đối với các phiên chạy đã bị loại bỏ không còn được tham chiếu bởi lưu trữ phiên, OpenClaw lưu trữ các tệp bản ghi và xóa các bản lưu trữ đã xóa cũ trên cùng cửa sổ giữ lại.
- Sau mỗi lần chạy thêm, `cron/runs/<jobId>.jsonl` được kiểm tra kích thước:
  - nếu kích thước tệp vượt quá `runLog.maxBytes`, nó được cắt bớt đến các dòng mới nhất `runLog.keepLines`.

### Lưu ý về hiệu suất cho các bộ lập lịch có tần suất cao

Các thiết lập cron có tần suất cao có thể tạo ra các dấu chân phiên chạy và nhật ký chạy lớn. Bảo trì được tích hợp, nhưng các giới hạn lỏng lẻo vẫn có thể tạo ra công việc IO và dọn dẹp không cần thiết.

Những gì cần chú ý:

- cửa sổ `cron.sessionRetention` dài với nhiều lần chạy cô lập
- `cron.runLog.keepLines` cao kết hợp với `runLog.maxBytes` lớn
- nhiều công việc định kỳ ồn ào ghi vào cùng một `cron/runs/<jobId>.jsonl`

Những gì cần làm:

- giữ `cron.sessionRetention` ngắn nhất có thể theo nhu cầu gỡ lỗi/kiểm toán của bạn
- giữ nhật ký chạy trong giới hạn với `runLog.maxBytes` và `runLog.keepLines` vừa phải
- di chuyển các công việc nền ồn ào sang chế độ cô lập với các quy tắc giao hàng tránh tiếng ồn không cần thiết
- xem xét tăng trưởng định kỳ với `openclaw cron runs` và điều chỉnh giữ lại trước khi nhật ký trở nên lớn

### Ví dụ tùy chỉnh

Giữ các phiên chạy trong một tuần và cho phép nhật ký chạy lớn hơn:

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

Vô hiệu hóa cắt bớt phiên chạy cô lập nhưng giữ cắt bớt nhật ký chạy:

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

Điều chỉnh cho sử dụng cron có tần suất cao (ví dụ):

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

## CLI bắt đầu nhanh

Lời nhắc một lần (UTC ISO, tự động xóa sau khi thành công):

```bash
openclaw cron add \
  --name "Send reminder" \
  --at "2026-01-12T18:00:00Z" \
  --session main \
  --system-event "Reminder: submit expense report." \
  --wake now \
  --delete-after-run
```

Lời nhắc một lần (phiên chính, đánh thức ngay lập tức):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Công việc cô lập định kỳ (thông báo đến WhatsApp):

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

Công việc cron định kỳ với giật lùi 30 giây rõ ràng:

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

Công việc cô lập định kỳ (giao hàng đến một chủ đề Telegram):

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

Công việc cô lập với ghi đè mô hình và suy nghĩ:

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

Lựa chọn agent (thiết lập nhiều agent):

```bash
# Gắn một công việc vào agent "ops" (quay lại mặc định nếu agent đó bị thiếu)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops

# Chuyển đổi hoặc xóa agent trên một công việc hiện có
openclaw cron edit <jobId> --agent ops
openclaw cron edit <jobId> --clear-agent
```

Chạy thủ công (force là mặc định, sử dụng `--due` để chỉ chạy khi đến hạn):

```bash
openclaw cron run <jobId>
openclaw cron run <jobId> --due
```

`cron.run` hiện xác nhận khi lần chạy thủ công được xếp hàng, không phải sau khi công việc hoàn thành. Phản hồi xếp hàng thành công trông như `{ ok: true, enqueued: true, runId }`. Nếu công việc đã đang chạy hoặc `--due` không tìm thấy gì đến hạn, phản hồi vẫn là `{ ok: true, ran: false, reason }`. Sử dụng `openclaw cron runs --id <jobId>` hoặc phương thức `cron.runs` của gateway để kiểm tra mục đã hoàn thành cuối cùng.

Chỉnh sửa một công việc hiện có (các trường vá):

```bash
openclaw cron edit <jobId> \
  --message "Updated prompt" \
  --model "opus" \
  --thinking low
```

Buộc một công việc cron hiện có chạy chính xác theo lịch trình (không giật lùi):

```bash
openclaw cron edit <jobId> --exact
```

Lịch sử chạy:

```bash
openclaw cron runs --id <jobId> --limit 50
```

Sự kiện hệ thống ngay lập tức mà không tạo công việc:

```bash
openclaw system event --mode now --text "Next heartbeat: check battery."
```

## Bề mặt API Gateway

- `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`
- `cron.run` (force hoặc due), `cron.runs`
  Đối với các sự kiện hệ thống ngay lập tức mà không có công việc, sử dụng [`openclaw system event`](/cli/system).

## Khắc phục sự cố

### "Không có gì chạy"

- Kiểm tra cron đã được kích hoạt: `cron.enabled` và `OPENCLAW_SKIP_CRON`.
- Kiểm tra Gateway đang chạy liên tục (cron chạy bên trong quá trình Gateway).
- Đối với lịch trình `cron`: xác nhận múi giờ (`--tz`) so với múi giờ máy chủ.

### Một công việc định kỳ liên tục trì hoãn sau khi thất bại

- OpenClaw áp dụng backoff thử lại theo cấp số nhân cho các công việc định kỳ sau các lỗi liên tiếp: 30s, 1m, 5m, 15m, sau đó 60m giữa các lần thử lại.
- Backoff tự động đặt lại sau lần chạy thành công tiếp theo.
- Các công việc một lần (`at`) thử lại các lỗi tạm thời (giới hạn tốc độ, quá tải, mạng, lỗi máy chủ) tối đa 3 lần với backoff; các lỗi vĩnh viễn vô hiệu hóa ngay lập tức. Xem [Chính sách thử lại](/automation/cron-jobs#retry-policy).

### Telegram giao hàng đến sai nơi

- Đối với các chủ đề diễn đàn, sử dụng `-100…:topic:<id>` để nó rõ ràng và không mơ hồ.
- Nếu bạn thấy các tiền tố `telegram:...` trong nhật ký hoặc các mục tiêu "last route" được lưu trữ, điều đó là bình thường; giao hàng cron chấp nhận chúng và vẫn phân tích cú pháp ID chủ đề chính xác.

### Thông báo giao hàng subagent thử lại

- Khi một lượt chạy subagent hoàn thành, gateway thông báo kết quả cho phiên yêu cầu.
- Nếu luồng thông báo trả về `false` (ví dụ: phiên yêu cầu đang bận), gateway thử lại tối đa 3 lần với theo dõi qua `announceRetryCount`.
- Các thông báo cũ hơn 5 phút sau `endedAt` bị hết hạn bắt buộc để ngăn các mục cũ lặp lại vô thời hạn.
- Nếu bạn thấy các thông báo giao hàng lặp lại trong nhật ký, kiểm tra sổ đăng ký subagent để tìm các mục có giá trị `announceRetryCount` cao.
