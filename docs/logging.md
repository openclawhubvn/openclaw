---
summary: "Tổng quan về logging: file logs, console output, CLI tailing và Control UI"
read_when:
  - Bạn cần một cái nhìn tổng quan về logging
  - Bạn muốn cấu hình mức độ hoặc định dạng log
  - Bạn đang khắc phục sự cố và cần tìm log một cách nhanh chóng
title: "Hướng Dẫn Cấu Hình Logging Trong OpenClaw"
---

# Logging

OpenClaw ghi log ở hai nơi:

- **File logs** (dạng JSON lines) được ghi bởi Gateway.
- **Console output** hiển thị trong terminal và Control UI.

Trang này giải thích vị trí lưu trữ log, cách đọc log, và cách cấu hình mức độ và định dạng log.

## Vị trí lưu trữ log

Mặc định, Gateway ghi log vào một file cuộn tại:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Ngày tháng sử dụng múi giờ địa phương của máy chủ Gateway.

Bạn có thể thay đổi vị trí này trong `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cách đọc log

### CLI: theo dõi trực tiếp (khuyến nghị)

Sử dụng CLI để theo dõi file log của Gateway qua RPC:

```bash
openclaw logs --follow
```

Các chế độ hiển thị:

- **TTY sessions**: log được định dạng đẹp, có màu sắc.
- **Non-TTY sessions**: văn bản đơn giản.
- `--json`: JSON phân cách theo dòng (mỗi sự kiện log một dòng).
- `--plain`: buộc hiển thị văn bản đơn giản trong TTY sessions.
- `--no-color`: tắt màu ANSI.

Ở chế độ JSON, CLI xuất ra các đối tượng có thẻ `type`:

- `meta`: thông tin metadata của luồng (file, con trỏ, kích thước)
- `log`: mục log đã được phân tích
- `notice`: gợi ý về cắt ngắn/luân chuyển
- `raw`: dòng log chưa phân tích

Nếu Gateway không thể truy cập, CLI sẽ hiển thị gợi ý ngắn để chạy:

```bash
openclaw doctor
```

### Control UI (web)

Tab **Logs** trong Control UI theo dõi cùng file bằng `logs.tail`.
Xem [/web/control-ui](/web/control-ui) để biết cách mở.

### Log chỉ dành cho kênh

Để lọc hoạt động của kênh (WhatsApp/Telegram/v.v.), sử dụng:

```bash
openclaw channels logs --channel whatsapp
```

## Định dạng log

### File logs (JSONL)

Mỗi dòng trong file log là một đối tượng JSON. CLI và Control UI phân tích các mục này để hiển thị thông tin có cấu trúc (thời gian, mức độ, hệ thống con, thông điệp).

### Console output

Console logs nhận biết TTY và được định dạng để dễ đọc:

- Tiền tố hệ thống con (ví dụ: `gateway/channels/whatsapp`)
- Màu sắc theo mức độ (info/warn/error)
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

- `logging.level`: mức độ cho **file logs** (JSONL).
- `logging.consoleLevel`: mức độ chi tiết cho **console**.

Bạn có thể ghi đè cả hai thông qua biến môi trường **`OPENCLAW_LOG_LEVEL`** (ví dụ: `OPENCLAW_LOG_LEVEL=debug`). Biến môi trường này có ưu tiên cao hơn file cấu hình, cho phép tăng mức độ chi tiết cho một lần chạy mà không cần chỉnh sửa `openclaw.json`. Bạn cũng có thể sử dụng tùy chọn CLI toàn cục **`--log-level <level>`** (ví dụ: `openclaw --log-level debug gateway run`), ghi đè biến môi trường cho lệnh đó.

`--verbose` chỉ ảnh hưởng đến output console; không thay đổi mức độ log file.

### Kiểu console

`logging.consoleStyle`:

- `pretty`: thân thiện với người dùng, có màu, kèm thời gian.
- `compact`: gọn gàng hơn (tốt cho các phiên dài).
- `json`: JSON mỗi dòng (dành cho bộ xử lý log).

### Che giấu thông tin nhạy cảm

Các công cụ có thể che giấu token nhạy cảm trước khi chúng xuất hiện trên console:

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: danh sách các chuỗi regex để ghi đè bộ mặc định

Che giấu chỉ ảnh hưởng đến **console output** và không thay đổi file logs.

## Chẩn đoán + OpenTelemetry

Chẩn đoán là các sự kiện có cấu trúc, có thể đọc được bằng máy cho các lần chạy mô hình **và** telemetry luồng thông điệp (webhooks, hàng đợi, trạng thái phiên). Chúng không thay thế log; chúng tồn tại để cung cấp dữ liệu cho các chỉ số, dấu vết và các bộ xuất khác.

Các sự kiện chẩn đoán được phát ra trong quá trình, nhưng các bộ xuất chỉ đính kèm khi chẩn đoán + plugin bộ xuất được bật.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: mô hình dữ liệu + SDK cho dấu vết, chỉ số và log.
- **OTLP**: giao thức truyền tải dữ liệu OTel đến collector/backend.
- OpenClaw hiện xuất qua **OTLP/HTTP (protobuf)**.

### Tín hiệu được xuất

- **Metrics**: bộ đếm + biểu đồ (sử dụng token, luồng thông điệp, hàng đợi).
- **Traces**: spans cho việc sử dụng mô hình + xử lý webhook/thông điệp.
- **Logs**: xuất qua OTLP khi `diagnostics.otel.logs` được bật. Khối lượng log có thể cao; hãy chú ý đến `logging.level` và bộ lọc bộ xuất.

### Danh mục sự kiện chẩn đoán

Sử dụng mô hình:

- `model.usage`: tokens, chi phí, thời gian, ngữ cảnh, nhà cung cấp/mô hình/kênh, ids phiên.

Luồng thông điệp:

- `webhook.received`: webhook nhận vào mỗi kênh.
- `webhook.processed`: webhook đã xử lý + thời gian.
- `webhook.error`: lỗi xử lý webhook.
- `message.queued`: thông điệp được đưa vào hàng đợi để xử lý.
- `message.processed`: kết quả + thời gian + lỗi tùy chọn.

Hàng đợi + phiên:

- `queue.lane.enqueue`: đưa vào hàng đợi lệnh + độ sâu.
- `queue.lane.dequeue`: lấy ra khỏi hàng đợi lệnh + thời gian chờ.
- `session.state`: chuyển đổi trạng thái phiên + lý do.
- `session.stuck`: cảnh báo phiên bị kẹt + tuổi.
- `run.attempt`: metadata thử lại/chạy.
- `diagnostic.heartbeat`: bộ đếm tổng hợp (webhooks/hàng đợi/phiên).

### Bật chẩn đoán (không có bộ xuất)

Sử dụng điều này nếu bạn muốn các sự kiện chẩn đoán có sẵn cho plugin hoặc nguồn tùy chỉnh:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Cờ chẩn đoán (log mục tiêu)

Sử dụng cờ để bật thêm log debug mục tiêu mà không cần tăng `logging.level`.
Cờ không phân biệt chữ hoa chữ thường và hỗ trợ ký tự đại diện (ví dụ: `telegram.*` hoặc `*`).

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

- Log cờ được ghi vào file log chuẩn (giống như `logging.file`).
- Output vẫn bị che giấu theo `logging.redactSensitive`.
- Hướng dẫn đầy đủ: [/diagnostics/flags](/diagnostics/flags).

### Xuất sang OpenTelemetry

Chẩn đoán có thể được xuất qua plugin `diagnostics-otel` (OTLP/HTTP). Điều này hoạt động với bất kỳ collector/backend OpenTelemetry nào chấp nhận OTLP/HTTP.

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

- Bạn cũng có thể bật plugin với `openclaw plugins enable diagnostics-otel`.
- `protocol` hiện chỉ hỗ trợ `http/protobuf`. `grpc` bị bỏ qua.
- Metrics bao gồm sử dụng token, chi phí, kích thước ngữ cảnh, thời gian chạy, và các bộ đếm/biểu đồ luồng thông điệp (webhooks, hàng đợi, trạng thái phiên, độ sâu hàng đợi/thời gian chờ).
- Traces/metrics có thể được bật/tắt với `traces` / `metrics` (mặc định: bật). Traces bao gồm các spans sử dụng mô hình cộng với các spans xử lý webhook/thông điệp khi được bật.
- Đặt `headers` khi collector của bạn yêu cầu xác thực.
- Các biến môi trường được hỗ trợ: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Metrics được xuất (tên + loại)

Sử dụng mô hình:

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Luồng thông điệp:

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

Hàng đợi + phiên:

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` hoặc
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Spans được xuất (tên + thuộc tính chính)

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

- Sampling dấu vết: `diagnostics.otel.sampleRate` (0.0–1.0, chỉ root spans).
- Khoảng thời gian xuất metrics: `diagnostics.otel.flushIntervalMs` (tối thiểu 1000ms).

### Ghi chú về giao thức

- Các endpoint OTLP/HTTP có thể được đặt qua `diagnostics.otel.endpoint` hoặc
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Nếu endpoint đã chứa `/v1/traces` hoặc `/v1/metrics`, nó sẽ được sử dụng như hiện tại.
- Nếu endpoint đã chứa `/v1/logs`, nó sẽ được sử dụng như hiện tại cho logs.
- `diagnostics.otel.logs` bật xuất log OTLP cho output logger chính.

### Hành vi xuất log

- Log OTLP sử dụng cùng các bản ghi có cấu trúc được ghi vào `logging.file`.
- Tôn trọng `logging.level` (mức độ log file). Che giấu console không áp dụng
  cho log OTLP.
- Các cài đặt có khối lượng lớn nên ưu tiên sampling/bộ lọc collector OTLP.

## Mẹo khắc phục sự cố

- **Gateway không thể truy cập?** Chạy `openclaw doctor` trước.
- **Log trống?** Kiểm tra xem Gateway có đang chạy và ghi vào đường dẫn file
  trong `logging.file`.
- **Cần thêm chi tiết?** Đặt `logging.level` thành `debug` hoặc `trace` và thử lại.
