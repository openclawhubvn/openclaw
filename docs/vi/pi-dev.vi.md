---
title: "Quy trình phát triển Pi"
summary: "Quy trình phát triển cho tích hợp Pi: xây dựng, kiểm thử và xác thực trực tiếp"
read_when:
  - Làm việc với mã tích hợp Pi hoặc kiểm thử
  - Chạy lint, kiểm tra kiểu và kiểm thử trực tiếp cho Pi
---

# Quy trình phát triển Pi

Hướng dẫn này tóm tắt quy trình hợp lý khi làm việc với tích hợp Pi trong OpenClaw.

## Kiểm tra kiểu và Linting

- Kiểm tra kiểu và xây dựng: `pnpm build`
- Lint: `pnpm lint`
- Kiểm tra định dạng: `pnpm format`
- Kiểm tra đầy đủ trước khi đẩy: `pnpm lint && pnpm build && pnpm test`

## Chạy kiểm thử Pi

Chạy bộ kiểm thử tập trung vào Pi với Vitest:

```bash
pnpm test -- \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-extensions/**/*.test.ts"
```

Để bao gồm kiểm thử trực tiếp:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test -- src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Bao gồm các bộ kiểm thử chính của Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-extensions/*.test.ts`

## Kiểm thử thủ công

Quy trình khuyến nghị:

- Chạy gateway ở chế độ dev:
  - `pnpm gateway:dev`
- Kích hoạt agent trực tiếp:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Sử dụng TUI để debug tương tác:
  - `pnpm tui`

Đối với hành vi gọi tool, nhắc nhở cho hành động `read` hoặc `exec` để xem streaming và xử lý payload của tool.

## Đặt lại trạng thái

Trạng thái nằm trong thư mục trạng thái OpenClaw. Mặc định là `~/.openclaw`. Nếu `OPENCLAW_STATE_DIR` được thiết lập, sử dụng thư mục đó.

Để đặt lại tất cả:

- `openclaw.json` cho cấu hình
- `credentials/` cho hồ sơ xác thực và token
- `agents/<agentId>/sessions/` cho lịch sử phiên agent
- `agents/<agentId>/sessions.json` cho chỉ mục phiên
- `sessions/` nếu có đường dẫn cũ
- `workspace/` nếu muốn workspace trống

Nếu chỉ muốn đặt lại phiên, xóa `agents/<agentId>/sessions/` và `agents/<agentId>/sessions.json` cho agent đó. Giữ `credentials/` nếu không muốn xác thực lại.

## Tham khảo

- [Kiểm thử](/help/testing)
- [Bắt đầu](/start/getting-started)\n