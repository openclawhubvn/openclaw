---
title: "Quy trình phát triển Pi"
summary: "Quy trình làm việc cho tích hợp Pi: xây dựng, kiểm thử và xác thực trực tiếp"
read_when:
  - Đang làm việc với mã tích hợp Pi hoặc kiểm thử
  - Chạy các quy trình lint, kiểm tra kiểu và kiểm thử trực tiếp dành riêng cho Pi
---

# Quy trình phát triển Pi

Hướng dẫn này tóm tắt quy trình làm việc hợp lý khi phát triển tích hợp Pi trong OpenClaw.

## Kiểm tra kiểu và Linting

- Kiểm tra kiểu và xây dựng: `pnpm build`
- Lint: `pnpm lint`
- Kiểm tra định dạng: `pnpm format`
- Kiểm tra toàn bộ trước khi đẩy mã: `pnpm lint && pnpm build && pnpm test`

## Chạy kiểm thử Pi

Chạy bộ kiểm thử tập trung vào Pi trực tiếp với Vitest:

```bash
pnpm test -- \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-extensions/**/*.test.ts"
```

Để bao gồm kiểm thử nhà cung cấp trực tiếp:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test -- src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Điều này bao gồm các bộ kiểm thử chính của Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-extensions/*.test.ts`

## Kiểm thử thủ công

Quy trình đề xuất:

- Chạy gateway ở chế độ phát triển:
  - `pnpm gateway:dev`
- Kích hoạt agent trực tiếp:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Sử dụng TUI để gỡ lỗi tương tác:
  - `pnpm tui`

Đối với hành vi gọi công cụ, hãy yêu cầu hành động `read` hoặc `exec` để có thể thấy luồng công cụ và xử lý payload.

## Đặt lại trạng thái

Trạng thái được lưu trong thư mục trạng thái OpenClaw. Mặc định là `~/.openclaw`. Nếu `OPENCLAW_STATE_DIR` được thiết lập, sử dụng thư mục đó.

Để đặt lại mọi thứ:

- `openclaw.json` cho cấu hình
- `credentials/` cho hồ sơ xác thực và token
- `agents/<agentId>/sessions/` cho lịch sử phiên của agent
- `agents/<agentId>/sessions.json` cho chỉ mục phiên
- `sessions/` nếu có đường dẫn cũ
- `workspace/` nếu muốn workspace trống

Nếu chỉ muốn đặt lại các phiên, xóa `agents/<agentId>/sessions/` và `agents/<agentId>/sessions.json` cho agent đó. Giữ `credentials/` nếu không muốn xác thực lại.

## Tham khảo

- [Kiểm thử](/help/testing)
- [Bắt đầu](/start/getting-started)
