# Tests

- Bộ công cụ test đầy đủ (suites, live, Docker): [Testing](/help/testing)

- `pnpm test:force`: Diệt mọi tiến trình gateway còn sót lại chiếm cổng điều khiển mặc định, sau đó chạy toàn bộ Vitest suite với cổng gateway riêng biệt để tránh xung đột với instance đang chạy. Dùng khi cổng 18789 bị chiếm sau lần chạy gateway trước.
- `pnpm test:coverage`: Chạy unit suite với V8 coverage (qua `vitest.unit.config.ts`). Ngưỡng toàn cục là 70% cho lines/branches/functions/statements. Loại trừ các entrypoint nặng về integration (CLI wiring, gateway/telegram bridges, webchat static server) để tập trung vào logic có thể unit-test.
- `pnpm test` trên Node 22, 23, và 24 mặc định dùng Vitest `vmForks` cho local run với đủ bộ nhớ. CI giữ `forks` trừ khi ghi đè. Node 25+ quay lại `forks` cho đến khi được xác nhận lại. Có thể ép hành vi với `OPENCLAW_TEST_VM_FORKS=0|1`.
- `pnpm test`: chạy toàn bộ wrapper. Chỉ giữ một manifest override hành vi nhỏ trong git, sau đó dùng snapshot thời gian đã kiểm tra để tách các file unit nặng nhất vào lane riêng.
- File đánh dấu `singletonIsolated` không còn spawn một tiến trình Vitest mới cho mỗi file mặc định. Wrapper gom chúng vào lane `forks` riêng với `maxWorkers=1`, giữ cách ly khỏi `unit-fast` trong khi giảm overhead khởi động tiến trình. Điều chỉnh số lane với `OPENCLAW_TEST_SINGLETON_ISOLATED_LANES=<n>`.
- `pnpm test:channels`: chạy các suite nặng về channel.
- `pnpm test:extensions`: chạy các suite extension/plugin.
- `pnpm test:perf:update-timings`: làm mới snapshot thời gian file chậm đã kiểm tra dùng bởi `scripts/test-parallel.mjs`.
- Gateway integration: chọn tham gia qua `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` hoặc `pnpm test:gateway`.
- `pnpm test:e2e`: Chạy smoke test end-to-end cho gateway (multi-instance WS/HTTP/node pairing). Mặc định dùng `vmForks` + adaptive workers trong `vitest.e2e.config.ts`; điều chỉnh với `OPENCLAW_E2E_WORKERS=<n>` và bật log chi tiết với `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: Chạy test live cho provider (minimax/zai). Yêu cầu API keys và `LIVE=1` (hoặc `*_LIVE_TEST=1` cho provider cụ thể) để không bỏ qua.

## Local PR gate

Để kiểm tra PR local, chạy:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Nếu `pnpm test` không ổn định trên host tải nặng, chạy lại một lần trước khi coi là lỗi hồi quy, sau đó cô lập với `pnpm vitest run <path/to/test>`. Với host hạn chế bộ nhớ, dùng:

- `OPENCLAW_TEST_PROFILE=low OPENCLAW_TEST_SERIAL_GATEWAY=1 pnpm test`

## Model latency bench (local keys)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Cách dùng:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env tùy chọn: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt mặc định: “Reply with a single word: ok. No punctuation or extra text.”

Lần chạy gần nhất (2025-12-31, 20 lần):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## CLI startup bench

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Cách dùng:

- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --entry dist/entry.js --timeout-ms 45000`

Benchmark các lệnh:

- `--version`
- `--help`
- `health --json`
- `status --json`
- `status`

Output bao gồm avg, p50, p95, min/max, và phân phối exit-code/signal cho mỗi lệnh.

## Onboarding E2E (Docker)

Docker là tùy chọn; chỉ cần cho smoke test onboarding containerized.

Flow khởi động lạnh đầy đủ trong container Linux sạch:

```bash
scripts/e2e/onboard-docker.sh
```

Script này điều khiển wizard tương tác qua pseudo-tty, xác minh file config/workspace/session, sau đó khởi động gateway và chạy `openclaw health`.

## QR import smoke (Docker)

Đảm bảo `qrcode-terminal` load dưới runtime Docker Node hỗ trợ (Node 24 mặc định, Node 22 tương thích):

```bash
pnpm test:docker:qr
```\n