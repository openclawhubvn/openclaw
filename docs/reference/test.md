---
summary: "Hướng dẫn chạy kiểm thử cục bộ (vitest) và khi nào sử dụng chế độ force/coverage"
read_when:
  - Chạy hoặc sửa lỗi kiểm thử
title: "Kiểm thử"
---

# Kiểm thử

- Bộ công cụ kiểm thử đầy đủ (suites, live, Docker): [Kiểm thử](/help/testing)

- `pnpm test:force`: Dừng mọi tiến trình gateway còn sót lại chiếm cổng điều khiển mặc định, sau đó chạy toàn bộ bộ kiểm thử Vitest với cổng gateway riêng biệt để tránh xung đột với phiên bản đang chạy. Sử dụng khi cổng 18789 bị chiếm sau lần chạy gateway trước đó.
- `pnpm test:coverage`: Chạy bộ kiểm thử đơn vị với V8 coverage (qua `vitest.unit.config.ts`). Ngưỡng toàn cầu là 70% cho các dòng/nhánh/hàm/câu lệnh. Coverage không bao gồm các điểm đầu vào nặng về tích hợp (CLI wiring, gateway/telegram bridges, webchat static server) để tập trung vào logic có thể kiểm thử đơn vị.
- `pnpm test` trên Node 22, 23 và 24 sử dụng Vitest `vmForks` mặc định cho các lần chạy cục bộ với đủ bộ nhớ. CI vẫn giữ `forks` trừ khi được ghi đè rõ ràng. Node 25+ sẽ quay lại `forks` cho đến khi được xác nhận lại. Có thể ép buộc hành vi với `OPENCLAW_TEST_VM_FORKS=0|1`.
- `pnpm test`: chạy toàn bộ wrapper. Chỉ giữ một manifest ghi đè hành vi nhỏ trong git, sau đó sử dụng snapshot thời gian đã kiểm tra để tách các file đơn vị nặng nhất vào các lane riêng biệt.
- Các file được đánh dấu `singletonIsolated` không còn tạo một tiến trình Vitest mới cho mỗi file theo mặc định. Wrapper gom chúng vào các lane `forks` riêng với `maxWorkers=1`, giữ nguyên sự cô lập từ `unit-fast` trong khi giảm chi phí khởi động tiến trình. Điều chỉnh số lượng lane với `OPENCLAW_TEST_SINGLETON_ISOLATED_LANES=<n>`.
- `pnpm test:channels`: chạy các bộ kiểm thử nặng về channel.
- `pnpm test:extensions`: chạy các bộ kiểm thử extension/plugin.
- `pnpm test:perf:update-timings`: làm mới snapshot thời gian file chậm đã kiểm tra được sử dụng bởi `scripts/test-parallel.mjs`.
- Tích hợp Gateway: chọn tham gia qua `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` hoặc `pnpm test:gateway`.
- `pnpm test:e2e`: Chạy các kiểm thử smoke end-to-end của gateway (ghép đôi nhiều instance WS/HTTP/node). Mặc định sử dụng `vmForks` + adaptive workers trong `vitest.e2e.config.ts`; điều chỉnh với `OPENCLAW_E2E_WORKERS=<n>` và đặt `OPENCLAW_E2E_VERBOSE=1` để có log chi tiết.
- `pnpm test:live`: Chạy các kiểm thử live của provider (minimax/zai). Yêu cầu API keys và `LIVE=1` (hoặc `*_LIVE_TEST=1` cụ thể cho provider) để không bỏ qua.

## Cổng PR cục bộ

Để kiểm tra cổng/land PR cục bộ, chạy:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Nếu `pnpm test` không ổn định trên host tải nặng, chạy lại một lần trước khi coi đó là lỗi hồi quy, sau đó cô lập với `pnpm vitest run <path/to/test>`. Đối với host bị hạn chế bộ nhớ, sử dụng:

- `OPENCLAW_TEST_PROFILE=low OPENCLAW_TEST_SERIAL_GATEWAY=1 pnpm test`

## Đo độ trễ mô hình (khóa cục bộ)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Cách sử dụng:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Biến môi trường tùy chọn: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt mặc định: “Reply with a single word: ok. No punctuation or extra text.”

Lần chạy cuối (2025-12-31, 20 lần chạy):

- minimax trung bình 1279ms (min 1114, max 2431)
- opus trung bình 2454ms (min 1224, max 3170)

## Đo thời gian khởi động CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Cách sử dụng:

- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --entry dist/entry.js --timeout-ms 45000`

Script này đo lường các lệnh sau:

- `--version`
- `--help`
- `health --json`
- `status --json`
- `status`

Kết quả bao gồm trung bình, p50, p95, min/max, và phân phối mã thoát/tín hiệu cho mỗi lệnh.

## Onboarding E2E (Docker)

Docker là tùy chọn; chỉ cần thiết cho các kiểm thử smoke onboarding container hóa.

Quy trình khởi động lạnh đầy đủ trong một container Linux sạch:

```bash
scripts/e2e/onboard-docker.sh
```

Script này điều khiển wizard tương tác qua một pseudo-tty, xác minh các file config/workspace/session, sau đó khởi động gateway và chạy `openclaw health`.

## Kiểm thử QR import smoke (Docker)

Đảm bảo `qrcode-terminal` tải dưới các runtime Docker Node được hỗ trợ (Node 24 mặc định, Node 22 tương thích):

```bash
pnpm test:docker:qr
```
