# Token sử dụng & chi phí

OpenClaw theo dõi **tokens**, không phải ký tự. Tokens phụ thuộc vào model, nhưng hầu hết các model kiểu OpenAI trung bình ~4 ký tự mỗi token cho văn bản tiếng Anh.

## Cách hệ thống tạo prompt

OpenClaw tự tạo prompt hệ thống mỗi lần chạy, bao gồm:

- Danh sách công cụ + mô tả ngắn
- Danh sách kỹ năng (chỉ metadata; hướng dẫn tải khi cần với `read`)
- Hướng dẫn tự cập nhật
- Workspace + file bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` khi mới, thêm `MEMORY.md` khi có hoặc `memory.md` nếu không có). File lớn bị cắt bởi `agents.defaults.bootstrapMaxChars` (mặc định: 20000), và tổng lượng bootstrap bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars` (mặc định: 150000). File `memory/*.md` tải theo yêu cầu qua công cụ memory, không tự động chèn.
- Thời gian (UTC + múi giờ người dùng)
- Thẻ trả lời + hành vi heartbeat
- Metadata runtime (host/OS/model/thinking)

Xem chi tiết tại [System Prompt](/concepts/system-prompt).

## Những gì tính vào context window

Mọi thứ model nhận đều tính vào giới hạn context:

- Prompt hệ thống (tất cả phần trên)
- Lịch sử hội thoại (tin nhắn người dùng + trợ lý)
- Gọi công cụ và kết quả công cụ
- Đính kèm/bản ghi (hình ảnh, âm thanh, file)
- Tóm tắt nén và các artifact cắt tỉa
- Wrapper của provider hoặc header an toàn (không thấy nhưng vẫn tính)

Với hình ảnh, OpenClaw giảm kích thước payload hình ảnh transcript/tool trước khi gọi provider. Dùng `agents.defaults.imageMaxDimensionPx` (mặc định: `1200`) để điều chỉnh:

- Giá trị thấp thường giảm sử dụng vision-token và kích thước payload.
- Giá trị cao giữ chi tiết hình ảnh cho OCR/UI.

Để xem chi tiết thực tế (mỗi file chèn, công cụ, kỹ năng, kích thước prompt hệ thống), dùng `/context list` hoặc `/context detail`. Xem [Context](/concepts/context).

## Cách xem sử dụng token hiện tại

Dùng trong chat:

- `/status` → **thẻ trạng thái emoji‑rich** với model session, sử dụng context, token input/output phản hồi cuối, và **ước tính chi phí** (chỉ với API key).
- `/usage off|tokens|full` → thêm **footer sử dụng mỗi phản hồi** vào mọi trả lời.
  - Lưu trữ mỗi session (lưu dưới dạng `responseUsage`).
  - OAuth auth **ẩn chi phí** (chỉ token).
- `/usage cost` → hiển thị tóm tắt chi phí local từ log session OpenClaw.

Các bề mặt khác:

- **TUI/Web TUI:** Hỗ trợ `/status` + `/usage`.
- **CLI:** `openclaw status --usage` và `openclaw channels list` hiển thị cửa sổ quota provider (không phải chi phí mỗi phản hồi).

## Ước tính chi phí (khi hiển thị)

Chi phí ước tính từ cấu hình giá model:

```
models.providers.<provider>.models[].cost
```

Đây là **USD mỗi 1M tokens** cho `input`, `output`, `cacheRead`, và `cacheWrite`. Nếu thiếu giá, OpenClaw chỉ hiển thị token. OAuth tokens không bao giờ hiển thị chi phí đô la.

## Cache TTL và ảnh hưởng cắt tỉa

Cache prompt của provider chỉ áp dụng trong cửa sổ TTL cache. OpenClaw có thể chạy **cache-ttl pruning**: cắt tỉa session khi TTL cache hết hạn, sau đó đặt lại cửa sổ cache để các yêu cầu tiếp theo có thể sử dụng context cache mới thay vì cache lại toàn bộ lịch sử. Điều này giữ chi phí ghi cache thấp hơn khi session không hoạt động quá TTL.

Cấu hình trong [Gateway configuration](/gateway/configuration) và xem chi tiết hành vi trong [Session pruning](/concepts/session-pruning).

Heartbeat có thể giữ cache **ấm** qua các khoảng trống không hoạt động. Nếu TTL cache model là `1h`, đặt khoảng heartbeat dưới mức đó (ví dụ: `55m`) có thể tránh cache lại toàn bộ prompt, giảm chi phí ghi cache.

Trong các thiết lập multi-agent, có thể giữ một cấu hình model chung và điều chỉnh hành vi cache cho từng agent với `agents.list[].params.cacheRetention`.

Để có hướng dẫn chi tiết, xem [Prompt Caching](/reference/prompt-caching).

Với giá Anthropic API, đọc cache rẻ hơn đáng kể so với token input, trong khi ghi cache tính phí cao hơn. Xem giá prompt caching của Anthropic để biết tỷ lệ và hệ số TTL mới nhất: [https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Ví dụ: giữ cache 1h ấm với heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Ví dụ: lưu lượng hỗn hợp với chiến lược cache từng agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # mặc định cho hầu hết các agent
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # giữ cache dài ấm cho các session sâu
    - id: "alerts"
      params:
        cacheRetention: "none" # tránh ghi cache cho thông báo đột biến
```

`agents.list[].params` gộp trên `params` của model đã chọn, nên có thể chỉ ghi đè `cacheRetention` và giữ nguyên các mặc định model khác.

### Ví dụ: bật header beta Anthropic 1M context

Cửa sổ context 1M của Anthropic hiện đang beta-gated. OpenClaw có thể chèn giá trị `anthropic-beta` cần thiết khi bật `context1m` trên các model Opus hoặc Sonnet hỗ trợ.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Điều này ánh xạ tới header beta `context-1m-2025-08-07` của Anthropic.

Chỉ áp dụng khi `context1m: true` được đặt trên mục model đó.

Yêu cầu: credential phải đủ điều kiện sử dụng long-context (API key billing, hoặc subscription với Extra Usage bật). Nếu không, Anthropic phản hồi `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Nếu xác thực Anthropic với OAuth/subscription tokens (`sk-ant-oat-*`), OpenClaw bỏ qua header beta `context-1m-*` vì Anthropic hiện từ chối kết hợp đó với HTTP 401.

## Mẹo giảm áp lực token

- Dùng `/compact` để tóm tắt các session dài.
- Cắt bớt output công cụ lớn trong workflow.
- Giảm `agents.defaults.imageMaxDimensionPx` cho session nhiều ảnh chụp màn hình.
- Giữ mô tả kỹ năng ngắn (danh sách kỹ năng được chèn vào prompt).
- Ưu tiên model nhỏ hơn cho công việc dài dòng, khám phá.

Xem [Skills](/tools/skills) để biết công thức overhead danh sách kỹ năng chính xác.\n