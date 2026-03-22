# Debugging

Trang này hướng dẫn các công cụ debug cho streaming output, đặc biệt khi provider trộn reasoning vào text thường.

## Runtime debug overrides

Dùng `/debug` trong chat để set config override **chỉ runtime** (trong memory, không ghi đĩa). `/debug` mặc định bị tắt; bật bằng `commands.debug: true`. Tiện khi cần bật/tắt nhanh các setting mà không phải sửa `openclaw.json`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` xóa hết override và quay về config trên đĩa.

## Gateway watch mode

Để iterate nhanh, chạy gateway với file watcher:

```bash
pnpm gateway:watch
```

Tương đương với:

```bash
node scripts/watch-node.mjs gateway --force
```

Watcher sẽ restart khi có thay đổi ở các file build-relevant trong `src/`, file source extension, metadata trong `package.json` và `openclaw.plugin.json`, `tsconfig.json`, `package.json`, và `tsdown.config.ts`. Thay đổi metadata extension sẽ restart gateway mà không cần rebuild `tsdown`; thay đổi source và config vẫn rebuild `dist` trước.

Thêm bất kỳ flag CLI nào sau `gateway:watch` và chúng sẽ được truyền qua mỗi lần restart.

## Dev profile + dev gateway (--dev)

Dùng dev profile để cô lập state và dựng nhanh môi trường an toàn, có thể xóa sau khi debug. Có **hai** flag `--dev`:

- **Global `--dev` (profile):** cô lập state dưới `~/.openclaw-dev` và mặc định cổng gateway là `19001` (các cổng liên quan sẽ thay đổi theo).
- **`gateway --dev`: yêu cầu Gateway tự tạo config + workspace mặc định** khi thiếu (và bỏ qua BOOTSTRAP.md).

Flow khuyến nghị (dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Nếu chưa cài global, chạy CLI qua `pnpm openclaw ...`.

Cách hoạt động:

1. **Profile isolation** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas thay đổi theo)

2. **Dev bootstrap** (`gateway --dev`)
   - Ghi config tối thiểu nếu thiếu (`gateway.mode=local`, bind loopback).
   - Set `agent.workspace` thành dev workspace.
   - Set `agent.skipBootstrap=true` (không có BOOTSTRAP.md).
   - Seed workspace file nếu thiếu:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identity mặc định: **C3‑PO** (protocol droid).
   - Bỏ qua channel providers trong dev mode (`OPENCLAW_SKIP_CHANNELS=1`).

Flow reset (bắt đầu lại):

```bash
pnpm gateway:dev:reset
```

Lưu ý: `--dev` là flag profile **global** và có thể bị một số runner bỏ qua.
Nếu cần, dùng dạng env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` xóa config, credentials, sessions, và dev workspace (dùng `trash`, không `rm`), rồi tạo lại setup dev mặc định.

Mẹo: nếu gateway không phải dev đang chạy (launchd/systemd), dừng nó trước:

```bash
openclaw gateway stop
```

## Raw stream logging (OpenClaw)

OpenClaw có thể log **raw assistant stream** trước khi filter/format. Đây là cách tốt nhất để xem reasoning có đến dưới dạng plain text deltas hay không (hoặc dưới dạng thinking blocks riêng biệt).

Bật qua CLI:

```bash
pnpm gateway:watch --raw-stream
```

Override path tùy chọn:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Env vars tương đương:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

File mặc định:

`~/.openclaw/logs/raw-stream.jsonl`

## Raw chunk logging (pi-mono)

Để capture **raw OpenAI-compat chunks** trước khi parse thành blocks, pi-mono cung cấp logger riêng:

```bash
PI_RAW_STREAM=1
```

Path tùy chọn:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

File mặc định:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Lưu ý: chỉ được emit bởi các process dùng provider `openai-completions` của pi-mono.

## Safety notes

- Raw stream logs có thể chứa đầy đủ prompts, tool output, và user data.
- Giữ logs local và xóa sau khi debug.
- Nếu chia sẻ logs, nhớ xóa secrets và PII trước.\n