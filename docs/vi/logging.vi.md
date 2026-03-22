# Logging

OpenClaw ghi log ở hai nơi:

- **File logs** (dạng JSON lines) do Gateway ghi.
- **Console output** hiển thị trên terminal và Control UI.

Trang này hướng dẫn vị trí log, cách đọc và cấu hình mức độ, định dạng log.

## Vị trí log

Mặc định, Gateway ghi log dạng rolling file tại:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Ngày tháng theo timezone của máy chủ Gateway.

Có thể thay đổi trong `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cách đọc log

### CLI: live tail (khuyến nghị)

Dùng CLI để tail file log của gateway qua RPC:

```bash
openclaw logs --follow
```

Các chế độ output:

- **TTY sessions**: log có màu, cấu trúc rõ ràng.
- **Non-TTY sessions**: plain text.
- `--json`: JSON từng dòng (mỗi sự kiện log một dòng).
- `--plain`: ép plain text trong TTY sessions.
- `--no-color`: tắt màu ANSI.

Ở chế độ JSON, CLI xuất các object có tag `type`:

- `meta`: metadata stream (file, cursor, size)
- `log`: log entry đã parse
- `notice`: gợi ý cắt bớt/rotation
- `raw`: log line chưa parse

Nếu Gateway không truy cập được, CLI sẽ gợi ý chạy:

```bash
openclaw doctor
```

### Control UI (web)

Tab **Logs** trong Control UI tail cùng file bằng `logs.tail`.
Xem [/web/control-ui](/web/control-ui) để mở.

### Channel-only logs

Để lọc hoạt động channel (WhatsApp/Telegram/etc), dùng:

```bash
openclaw channels logs --channel whatsapp
```

## Định dạng log

### File logs (JSONL)

Mỗi dòng trong file log là một object JSON. CLI và Control UI parse các entry này để hiển thị cấu trúc (thời gian, mức độ, subsystem, message).

### Console output

Console logs nhận diện TTY và định dạng dễ đọc:

- Tiền tố subsystem (vd: `gateway/channels/whatsapp`)
- Màu mức độ (info/warn/error)
- Chế độ compact hoặc JSON tùy chọn

Định dạng console được điều khiển bởi `logging.consoleStyle`.

## Cấu hình logging

Tất cả cấu hình logging nằm dưới `logging` trong `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Mức độ log

- `logging.level`: mức độ **file logs** (JSONL).
- `logging.consoleLevel`: mức độ chi tiết **console**.

Có thể ghi đè cả hai qua biến môi trường **`OPENCLAW_LOG_LEVEL`** (vd: `OPENCLAW_LOG_LEVEL=debug`). Biến môi trường ưu tiên hơn file config, giúp tăng chi tiết cho một lần chạy mà không cần sửa `openclaw.json`. Cũng có thể dùng tùy chọn CLI toàn cục **`--log-level <level>`** (vd: `openclaw --log-level debug gateway run`), ghi đè biến môi trường cho lệnh đó.

`--verbose` chỉ ảnh hưởng output console; không thay đổi mức độ file log.

### Kiểu console

`logging.consoleStyle`:

- `pretty`: thân thiện, có màu, có timestamp.
- `compact`: output gọn (tốt cho session dài).
- `json`: JSON mỗi dòng (cho log processors).

### Redaction

Tóm tắt công cụ có thể che token nhạy cảm trước khi lên console:

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: danh sách regex để ghi đè bộ mặc định

Redaction chỉ ảnh hưởng **console output** và không thay đổi file logs.

## Diagnostics + OpenTelemetry

Diagnostics là các sự kiện có cấu trúc, máy đọc được cho các lần chạy model **và** telemetry luồng message (webhooks, queueing, session state). Chúng không thay thế logs; chúng tồn tại để cung cấp metrics, traces và các exporters khác.

Sự kiện diagnostics được phát ra trong quá trình, nhưng exporters chỉ gắn khi diagnostics + plugin exporter được bật.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: mô hình dữ liệu + SDKs cho traces, metrics và logs.
- **OTLP**: giao thức truyền dữ liệu để xuất dữ liệu OTel tới collector/backend.
- OpenClaw hiện xuất qua **OTLP/HTTP (protobuf)**.

### Tín hiệu xuất

- **Metrics**: counters + histograms (token usage, message flow, queueing).
- **Traces**: spans cho model usage + xử lý webhook/message.
- **Logs**: xuất qua OTLP khi `diagnostics.otel.logs` được bật. Log volume có thể cao; chú ý `logging.level` và bộ lọc exporter.

### Danh mục sự kiện diagnostics

Model usage:

- `model.usage`: tokens, cost, duration, context, provider/model/channel, session ids.

Message flow:

- `webhook.received`: webhook ingress per channel.
- `webhook.processed`: webhook handled + duration.
- `webhook.error`: webhook handler errors.
- `message.queued`: message enqueued for processing.
- `message.processed`: outcome + duration + optional error.

Queue + session:

- `queue.lane.enqueue`: command queue lane enqueue + depth.
- `queue.lane.dequeue`: command queue lane dequeue + wait time.
- `session.state`: session state transition + reason.
- `session.stuck`: session stuck warning + age.
- `run.attempt`: run retry/attempt metadata.
- `diagnostic.heartbeat`: aggregate counters (webhooks/queue/session).

### Bật diagnostics (không exporter)

Dùng khi cần sự kiện diagnostics cho plugins hoặc custom sinks:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Cờ diagnostics (log mục tiêu)

Dùng cờ để bật log debug mục tiêu mà không cần tăng `logging.level`.
Cờ không phân biệt hoa thường và hỗ trợ wildcard (vd: `telegram.*` hoặc `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Ghi đè môi trường (một lần):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Lưu ý:

- Log cờ vào file log chuẩn (giống `logging.file`).
- Output vẫn bị che theo `logging.redactSensitive`.
- Hướng dẫn đầy đủ: [/diagnostics/flags](/diagnostics/flags).

### Xuất sang OpenTelemetry

Diagnostics có thể xuất qua plugin `diagnostics-otel` (OTLP/HTTP). Hoạt động với bất kỳ collector/backend OpenTelemetry nào chấp nhận OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

Lưu ý:

- Có thể bật plugin với `openclaw plugins enable diagnostics-otel`.
- `protocol` hiện chỉ hỗ trợ `http/protobuf`. `grpc` bị bỏ qua.
- Metrics bao gồm token usage, cost, context size, run duration, và message-flow counters/histograms (webhooks, queueing, session state, queue depth/wait).
- Traces/metrics có thể bật/tắt với `traces` / `metrics` (mặc định: bật). Traces bao gồm model usage spans và webhook/message processing spans khi bật.
- Đặt `headers` khi collector yêu cầu auth.
- Hỗ trợ biến môi trường: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Metrics xuất (tên + loại)

Model usage:

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Message flow:

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.outcome`)

Queues + sessions:

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` hoặc
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Spans xuất (tên + thuộc tính chính)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### Sampling + flushing

- Sampling trace: `diagnostics.otel.sampleRate` (0.0–1.0, chỉ root spans).
- Khoảng xuất metric: `diagnostics.otel.flushIntervalMs` (tối thiểu 1000ms).

### Ghi chú giao thức

- Endpoint OTLP/HTTP có thể đặt qua `diagnostics.otel.endpoint` hoặc
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Nếu endpoint đã chứa `/v1/traces` hoặc `/v1/metrics`, nó được dùng nguyên.
- Nếu endpoint đã chứa `/v1/logs`, nó được dùng nguyên cho logs.
- `diagnostics.otel.logs` bật xuất log OTLP cho output logger chính.

### Hành vi xuất log

- Log OTLP dùng cùng bản ghi cấu trúc ghi vào `logging.file`.
- Tôn trọng `logging.level` (mức độ file log). Redaction console không áp dụng
  cho log OTLP.
- Cài đặt có volume cao nên ưu tiên sampling/filtering collector OTLP.

## Mẹo khắc phục sự cố

- **Gateway không truy cập được?** Chạy `openclaw doctor` trước.
- **Log trống?** Kiểm tra Gateway có chạy và ghi vào đường dẫn file trong `logging.file`.
- **Cần chi tiết hơn?** Đặt `logging.level` thành `debug` hoặc `trace` và thử lại.\n