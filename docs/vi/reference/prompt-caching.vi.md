---
title: "Prompt Caching"
summary: "Các tùy chỉnh cache prompt, thứ tự merge, hành vi của provider và cách tối ưu"
read_when:
  - Muốn giảm chi phí token prompt bằng cách giữ cache
  - Cần hành vi cache riêng cho từng agent trong môi trường multi-agent
  - Đang tối ưu heartbeat và cache-ttl pruning cùng nhau
---

# Prompt caching

Prompt caching cho phép model provider tái sử dụng các phần prompt không đổi (thường là hướng dẫn hệ thống/dev và các ngữ cảnh ổn định khác) giữa các lần gọi thay vì xử lý lại mỗi lần. Yêu cầu đầu tiên khớp sẽ ghi cache token (`cacheWrite`), các yêu cầu khớp sau đó có thể đọc lại (`cacheRead`).

Tại sao quan trọng: giảm chi phí token, phản hồi nhanh hơn, hiệu suất ổn định hơn cho các session dài. Không có caching, prompt lặp lại sẽ phải trả chi phí đầy đủ mỗi lần dù hầu hết input không đổi.

Trang này bao gồm tất cả các tùy chỉnh liên quan đến cache ảnh hưởng đến việc tái sử dụng prompt và chi phí token.

Chi tiết giá của Anthropic, xem tại:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

## Tùy chỉnh chính

### `cacheRetention` (model và per-agent)

Thiết lập cache retention trên model params:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Override cho từng agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Thứ tự merge config:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (khớp id agent; override theo key)

### Legacy `cacheControlTtl`

Các giá trị cũ vẫn được chấp nhận và ánh xạ:

- `5m` -> `short`
- `1h` -> `long`

Ưu tiên `cacheRetention` cho config mới.

### `contextPruning.mode: "cache-ttl"`

Xóa ngữ cảnh kết quả công cụ cũ sau khi hết thời gian cache TTL để các yêu cầu sau khi idle không cache lại lịch sử quá lớn.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Xem [Session Pruning](/concepts/session-pruning) để biết hành vi đầy đủ.

### Heartbeat giữ ấm

Heartbeat có thể giữ ấm cửa sổ cache và giảm ghi cache lặp lại sau các khoảng idle.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Hỗ trợ heartbeat cho từng agent tại `agents.list[].heartbeat`.

## Hành vi của provider

### Anthropic (API trực tiếp)

- Hỗ trợ `cacheRetention`.
- Với profile auth API-key Anthropic, OpenClaw mặc định `cacheRetention: "short"` cho các model Anthropic khi không được thiết lập.

### Amazon Bedrock

- Các model Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) hỗ trợ truyền qua `cacheRetention` rõ ràng.
- Các model Bedrock không phải Anthropic bị ép `cacheRetention: "none"` khi chạy.

### OpenRouter Anthropic models

Với các model `openrouter/anthropic/*`, OpenClaw chèn `cache_control` của Anthropic vào các block prompt hệ thống/dev để cải thiện tái sử dụng prompt-cache.

### Các provider khác

Nếu provider không hỗ trợ chế độ cache này, `cacheRetention` không có tác dụng.

## Cách tối ưu

### Mixed traffic (mặc định khuyến nghị)

Giữ một baseline lâu dài trên agent chính, tắt caching trên các agent thông báo đột biến:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Baseline ưu tiên chi phí

- Đặt baseline `cacheRetention: "short"`.
- Bật `contextPruning.mode: "cache-ttl"`.
- Giữ heartbeat dưới TTL chỉ cho các agent hưởng lợi từ cache ấm.

## Chẩn đoán cache

OpenClaw cung cấp chẩn đoán cache-trace chuyên dụng cho các lần chạy agent nhúng.

### Cấu hình `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # tùy chọn
    includeMessages: false # mặc định true
    includePrompt: false # mặc định true
    includeSystem: false # mặc định true
```

Mặc định:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Env toggles (debugging một lần)

- `OPENCLAW_CACHE_TRACE=1` bật trace cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` ghi đè đường dẫn output.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` bật/tắt ghi đầy đủ payload message.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` bật/tắt ghi text prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` bật/tắt ghi prompt hệ thống.

### Cần kiểm tra gì

- Sự kiện trace cache là JSONL và bao gồm các snapshot như `session:loaded`, `prompt:before`, `stream:context`, và `session:after`.
- Ảnh hưởng token cache từng lượt có thể thấy trong các bề mặt sử dụng bình thường qua `cacheRead` và `cacheWrite` (ví dụ `/usage full` và tóm tắt sử dụng session).

## Khắc phục nhanh

- `cacheWrite` cao trên hầu hết lượt: kiểm tra input prompt hệ thống biến động và xác minh model/provider hỗ trợ cài đặt cache.
- Không có hiệu lực từ `cacheRetention`: xác nhận key model khớp `agents.defaults.models["provider/model"]`.
- Yêu cầu Bedrock Nova/Mistral với cài đặt cache: dự kiến runtime ép về `none`.

Tài liệu liên quan:

- [Anthropic](/providers/anthropic)
- [Token Use and Costs](/reference/token-use)
- [Session Pruning](/concepts/session-pruning)
- [Gateway Configuration Reference](/gateway/configuration-reference)\n