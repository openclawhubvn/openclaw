---
title: "Hướng Dẫn Cấu Hình Bộ Nhớ Đệm Prompt"
summary: "Khám phá cách tùy chỉnh bộ nhớ đệm prompt, tối ưu hóa thứ tự gộp và điều chỉnh hành vi nhà cung cấp hiệu quả."
read_when:
  - Bạn muốn giảm chi phí token prompt bằng cách giữ lại bộ nhớ đệm
  - Bạn cần hành vi bộ nhớ đệm theo từng agent trong các thiết lập nhiều agent
  - Bạn đang điều chỉnh nhịp tim và cắt tỉa cache-ttl cùng nhau
---

# Bộ nhớ đệm Prompt

Bộ nhớ đệm prompt cho phép nhà cung cấp mô hình tái sử dụng các tiền tố prompt không thay đổi (thường là hướng dẫn hệ thống/nhà phát triển và các ngữ cảnh ổn định khác) qua các lượt thay vì xử lý lại chúng mỗi lần. Yêu cầu đầu tiên khớp sẽ ghi các token vào bộ nhớ đệm (`cacheWrite`), và các yêu cầu khớp sau đó có thể đọc lại chúng (`cacheRead`).

Tại sao điều này quan trọng: giảm chi phí token, phản hồi nhanh hơn và hiệu suất dự đoán tốt hơn cho các phiên làm việc dài. Nếu không có bộ nhớ đệm, các prompt lặp lại sẽ phải trả toàn bộ chi phí prompt mỗi lượt ngay cả khi hầu hết đầu vào không thay đổi.

Trang này bao gồm tất cả các tùy chỉnh liên quan đến bộ nhớ đệm ảnh hưởng đến việc tái sử dụng prompt và chi phí token.

Để biết chi tiết về giá của Anthropic, xem:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

## Các tùy chỉnh chính

### `cacheRetention` (mô hình và theo từng agent)

Thiết lập giữ lại bộ nhớ đệm trên tham số mô hình:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Ghi đè theo từng agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Thứ tự gộp cấu hình:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (khớp với id agent; ghi đè theo khóa)

### `cacheControlTtl` cũ

Các giá trị cũ vẫn được chấp nhận và ánh xạ:

- `5m` -> `short`
- `1h` -> `long`

Ưu tiên `cacheRetention` cho cấu hình mới.

### `contextPruning.mode: "cache-ttl"`

Cắt tỉa ngữ cảnh kết quả công cụ cũ sau khi cửa sổ TTL bộ nhớ đệm để các yêu cầu sau khi không hoạt động không tái bộ nhớ đệm lịch sử quá lớn.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Xem [Cắt tỉa phiên](/concepts/session-pruning) để biết hành vi đầy đủ.

### Giữ ấm nhịp tim

Nhịp tim có thể giữ cho cửa sổ bộ nhớ đệm ấm và giảm việc ghi bộ nhớ đệm lặp lại sau các khoảng trống không hoạt động.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Nhịp tim theo từng agent được hỗ trợ tại `agents.list[].heartbeat`.

## Hành vi của nhà cung cấp

### Anthropic (API trực tiếp)

- `cacheRetention` được hỗ trợ.
- Với các hồ sơ xác thực API-key của Anthropic, OpenClaw thiết lập `cacheRetention: "short"` cho các tham chiếu mô hình Anthropic khi không được thiết lập.

### Amazon Bedrock

- Các tham chiếu mô hình Claude của Anthropic (`amazon-bedrock/*anthropic.claude*`) hỗ trợ truyền qua `cacheRetention` rõ ràng.
- Các mô hình Bedrock không phải Anthropic bị buộc phải `cacheRetention: "none"` khi chạy.

### Mô hình Anthropic của OpenRouter

Đối với các tham chiếu mô hình `openrouter/anthropic/*`, OpenClaw chèn `cache_control` của Anthropic vào các khối prompt hệ thống/nhà phát triển để cải thiện việc tái sử dụng bộ nhớ đệm prompt.

### Các nhà cung cấp khác

Nếu nhà cung cấp không hỗ trợ chế độ bộ nhớ đệm này, `cacheRetention` sẽ không có hiệu lực.

## Mẫu điều chỉnh

### Lưu lượng hỗn hợp (mặc định được khuyến nghị)

Giữ một cơ sở lâu dài trên agent chính của bạn, vô hiệu hóa bộ nhớ đệm trên các agent thông báo đột biến:

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

### Cơ sở ưu tiên chi phí

- Thiết lập cơ sở `cacheRetention: "short"`.
- Kích hoạt `contextPruning.mode: "cache-ttl"`.
- Giữ nhịp tim dưới TTL của bạn chỉ cho các agent có lợi từ bộ nhớ đệm ấm.

## Chẩn đoán bộ nhớ đệm

OpenClaw cung cấp chẩn đoán dấu vết bộ nhớ đệm dành riêng cho các lần chạy agent nhúng.

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

### Chuyển đổi môi trường (gỡ lỗi một lần)

- `OPENCLAW_CACHE_TRACE=1` kích hoạt theo dõi bộ nhớ đệm.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` ghi đè đường dẫn đầu ra.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` chuyển đổi việc ghi lại toàn bộ tải trọng tin nhắn.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` chuyển đổi việc ghi lại văn bản prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` chuyển đổi việc ghi lại prompt hệ thống.

### Những gì cần kiểm tra

- Các sự kiện dấu vết bộ nhớ đệm là JSONL và bao gồm các ảnh chụp nhanh như `session:loaded`, `prompt:before`, `stream:context`, và `session:after`.
- Ảnh hưởng token bộ nhớ đệm theo lượt có thể thấy trong các bề mặt sử dụng thông thường qua `cacheRead` và `cacheWrite` (ví dụ `/usage full` và tóm tắt sử dụng phiên).

## Khắc phục sự cố nhanh

- `cacheWrite` cao trên hầu hết các lượt: kiểm tra đầu vào prompt hệ thống không ổn định và xác minh mô hình/nhà cung cấp hỗ trợ các thiết lập bộ nhớ đệm của bạn.
- Không có hiệu lực từ `cacheRetention`: xác nhận khóa mô hình khớp với `agents.defaults.models["provider/model"]`.
- Yêu cầu Bedrock Nova/Mistral với các thiết lập bộ nhớ đệm: dự kiến buộc chạy thời gian thành `none`.

Tài liệu liên quan:

- [Anthropic](/providers/anthropic)
- [Sử dụng và Chi phí Token](/reference/token-use)
- [Cắt tỉa Phiên](/concepts/session-pruning)
- [Tham khảo Cấu hình Gateway](/gateway/configuration-reference)
