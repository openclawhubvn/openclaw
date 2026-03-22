---
summary: "Công cụ gỡ lỗi: chế độ theo dõi, luồng mô hình thô, và theo dõi rò rỉ lý luận"
read_when:
  - Cần kiểm tra đầu ra thô của mô hình để phát hiện rò rỉ lý luận
  - Muốn chạy Gateway ở chế độ theo dõi trong quá trình lặp
  - Cần quy trình gỡ lỗi có thể lặp lại
title: "Gỡ lỗi"
---

# Gỡ lỗi

Trang này hướng dẫn về các công cụ hỗ trợ gỡ lỗi cho luồng đầu ra, đặc biệt khi nhà cung cấp trộn lẫn lý luận vào văn bản thông thường.

## Ghi đè gỡ lỗi thời gian chạy

Sử dụng `/debug` trong chat để thiết lập ghi đè cấu hình **chỉ trong thời gian chạy** (trong bộ nhớ, không lưu đĩa). `/debug` bị vô hiệu hóa mặc định; kích hoạt bằng `commands.debug: true`. Điều này hữu ích khi cần chuyển đổi các cài đặt khó mà không cần chỉnh sửa `openclaw.json`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` xóa tất cả ghi đè và trở về cấu hình trên đĩa.

## Chế độ theo dõi Gateway

Để lặp nhanh, chạy gateway dưới chế độ theo dõi tệp:

```bash
pnpm gateway:watch
```

Điều này tương đương với:

```bash
node scripts/watch-node.mjs gateway --force
```

Trình theo dõi sẽ khởi động lại khi có thay đổi trong các tệp liên quan đến build dưới `src/`, tệp nguồn extension, tệp `package.json` và `openclaw.plugin.json` metadata của extension, `tsconfig.json`, `package.json`, và `tsdown.config.ts`. Thay đổi metadata của extension sẽ khởi động lại gateway mà không cần rebuild `tsdown`; thay đổi nguồn và cấu hình vẫn rebuild `dist` trước.

Thêm bất kỳ cờ CLI nào của gateway sau `gateway:watch` và chúng sẽ được truyền qua mỗi lần khởi động lại.

## Hồ sơ dev + gateway dev (--dev)

Sử dụng hồ sơ dev để cô lập trạng thái và thiết lập một môi trường an toàn, có thể loại bỏ cho việc gỡ lỗi. Có **hai** cờ `--dev`:

- **Global `--dev` (hồ sơ):** cô lập trạng thái dưới `~/.openclaw-dev` và mặc định cổng gateway là `19001` (các cổng dẫn xuất sẽ thay đổi theo).
- **`gateway --dev`: yêu cầu Gateway tự động tạo cấu hình mặc định + workspace** khi thiếu (và bỏ qua BOOTSTRAP.md).

Quy trình đề xuất (hồ sơ dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Nếu chưa cài đặt toàn cầu, chạy CLI qua `pnpm openclaw ...`.

Điều này thực hiện:

1. **Cô lập hồ sơ** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (trình duyệt/canvas thay đổi tương ứng)

2. **Bootstrap dev** (`gateway --dev`)
   - Ghi cấu hình tối thiểu nếu thiếu (`gateway.mode=local`, bind loopback).
   - Thiết lập `agent.workspace` thành workspace dev.
   - Thiết lập `agent.skipBootstrap=true` (không có BOOTSTRAP.md).
   - Khởi tạo các tệp workspace nếu thiếu:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Danh tính mặc định: **C3‑PO** (protocol droid).
   - Bỏ qua nhà cung cấp kênh trong chế độ dev (`OPENCLAW_SKIP_CHANNELS=1`).

Quy trình reset (khởi đầu mới):

```bash
pnpm gateway:dev:reset
```

Lưu ý: `--dev` là cờ hồ sơ **toàn cầu** và có thể bị một số trình chạy bỏ qua.
Nếu cần chỉ rõ, sử dụng dạng biến môi trường:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` xóa cấu hình, thông tin xác thực, phiên làm việc, và workspace dev (sử dụng `trash`, không phải `rm`), sau đó tái tạo thiết lập dev mặc định.

Mẹo: nếu một gateway không phải dev đang chạy (launchd/systemd), dừng nó trước:

```bash
openclaw gateway stop
```

## Ghi nhật ký luồng thô (OpenClaw)

OpenClaw có thể ghi lại **luồng trợ lý thô** trước khi lọc/định dạng. Đây là cách tốt nhất để xem liệu lý luận có đến dưới dạng các delta văn bản thông thường (hoặc dưới dạng các khối suy nghĩ riêng biệt).

Kích hoạt qua CLI:

```bash
pnpm gateway:watch --raw-stream
```

Ghi đè đường dẫn tùy chọn:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Các biến môi trường tương đương:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Tệp mặc định:

`~/.openclaw/logs/raw-stream.jsonl`

## Ghi nhật ký chunk thô (pi-mono)

Để ghi lại **chunk tương thích OpenAI thô** trước khi chúng được phân tích thành các khối, pi-mono cung cấp một logger riêng:

```bash
PI_RAW_STREAM=1
```

Đường dẫn tùy chọn:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Tệp mặc định:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Lưu ý: điều này chỉ được phát ra bởi các tiến trình sử dụng nhà cung cấp `openai-completions` của pi-mono.

## Lưu ý an toàn

- Nhật ký luồng thô có thể bao gồm đầy đủ các prompt, đầu ra công cụ, và dữ liệu người dùng.
- Giữ nhật ký cục bộ và xóa chúng sau khi gỡ lỗi.
- Nếu chia sẻ nhật ký, hãy xóa thông tin bí mật và PII trước.
