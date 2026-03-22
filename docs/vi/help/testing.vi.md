---
summary: "Bộ công cụ kiểm thử: unit/e2e/live suites, Docker runners, và phạm vi của từng loại test"
read_when:
  - Chạy test local hoặc trong CI
  - Thêm regressions cho lỗi model/provider
  - Debug hành vi gateway + agent
title: "Testing"
---

# Testing

OpenClaw có ba bộ Vitest (unit/integration, e2e, live) và một số Docker runners.

Tài liệu này hướng dẫn cách chúng tôi test:

- Phạm vi của từng bộ test (và những gì không bao gồm)
- Lệnh cần chạy cho các workflow phổ biến (local, pre-push, debugging)
- Cách live tests tìm credentials và chọn models/providers
- Cách thêm regressions cho các vấn đề thực tế của model/provider

## Bắt đầu nhanh

Hầu hết các ngày:

- Full gate (cần trước khi push): `pnpm build && pnpm check && pnpm test`

Khi chỉnh sửa test hoặc cần tự tin hơn:

- Coverage gate: `pnpm test:coverage`
- E2E suite: `pnpm test:e2e`

Khi debug providers/models thực (cần creds thực):

- Live suite (models + gateway tool/image probes): `pnpm test:live`

Mẹo: khi chỉ cần một case lỗi, nên thu hẹp live tests qua các biến môi trường allowlist được mô tả dưới đây.

## Test suites (chạy ở đâu)

Hãy nghĩ về các bộ test như “tăng độ thực tế” (và tăng độ không ổn định/chi phí):

### Unit / integration (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: `scripts/test-parallel.mjs` (chạy `vitest.unit.config.ts`, `vitest.extensions.config.ts`, `vitest.gateway.config.ts`)
- File: `src/**/*.test.ts`, `extensions/**/*.test.ts`
- Phạm vi:
  - Unit test thuần túy
  - Integration test trong quá trình (gateway auth, routing, tooling, parsing, config)
  - Deterministic regressions cho các lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không cần keys thực
  - Nên nhanh và ổn định
- Ghi chú Scheduler:
  - `pnpm test` hiện giữ một manifest hành vi nhỏ đã được kiểm tra cho các override pool/isolation thực và một snapshot thời gian riêng cho các file unit chậm nhất.
  - Coverage unit chia sẻ vẫn bật, nhưng wrapper tách các file đo nặng nhất vào các lane riêng thay vì dựa vào danh sách loại trừ được duy trì bằng tay ngày càng tăng.
  - Làm mới snapshot thời gian với `pnpm test:perf:update-timings` sau khi có thay đổi lớn về hình dạng suite.
- Ghi chú Embedded runner:
  - Khi thay đổi đầu vào discovery message-tool hoặc ngữ cảnh runtime compaction, giữ cả hai mức độ coverage.
  - Thêm các helper regressions tập trung cho các ranh giới routing/normalization thuần túy.
  - Cũng giữ các suite integration runner embedded khỏe mạnh:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, và
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Các suite này xác minh rằng các id scoped và hành vi compaction vẫn chảy qua các đường dẫn `run.ts` / `compact.ts` thực; các test chỉ helper không đủ thay thế cho các đường dẫn integration đó.
- Ghi chú Pool:
  - OpenClaw sử dụng Vitest `vmForks` trên Node 22, 23, và 24 cho các unit shard nhanh hơn.
  - Trên Node 25+, OpenClaw tự động quay lại `forks` thông thường cho đến khi repo được xác nhận lại ở đó.
  - Override thủ công với `OPENCLAW_TEST_VM_FORKS=0` (buộc `forks`) hoặc `OPENCLAW_TEST_VM_FORKS=1` (buộc `vmForks`).

### E2E (gateway smoke)

- Lệnh: `pnpm test:e2e`
- Cấu hình: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Mặc định runtime:
  - Sử dụng Vitest `vmForks` để khởi động file nhanh hơn.
  - Sử dụng adaptive workers (CI: 2-4, local: 4-8).
  - Chạy ở chế độ silent mặc định để giảm overhead I/O console.
- Override hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để buộc số lượng worker (giới hạn ở 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại output console chi tiết.
- Phạm vi:
  - Hành vi end-to-end gateway multi-instance
  - WebSocket/HTTP surfaces, node pairing, và networking nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không cần keys thực
  - Nhiều phần chuyển động hơn unit tests (có thể chậm hơn)

### E2E: OpenShell backend smoke

- Lệnh: `pnpm test:e2e:openshell`
- File: `test/openshell-sandbox.e2e.test.ts`
- Phạm vi:
  - Khởi động một gateway OpenShell cô lập trên host qua Docker
  - Tạo một sandbox từ một Dockerfile local tạm thời
  - Thực hiện backend OpenShell của OpenClaw qua `sandbox ssh-config` thực + SSH exec
  - Xác minh hành vi filesystem canonical từ xa qua cầu nối fs sandbox
- Kỳ vọng:
  - Chỉ opt-in; không phải là một phần của chạy mặc định `pnpm test:e2e`
  - Yêu cầu một CLI `openshell` local cộng với một Docker daemon hoạt động
  - Sử dụng `HOME` / `XDG_CONFIG_HOME` cô lập, sau đó phá hủy gateway và sandbox test
- Override hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật test khi chạy suite e2e rộng hơn thủ công
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để chỉ định một binary CLI không mặc định hoặc script wrapper

### Live (real providers + real models)

- Lệnh: `pnpm test:live`
- Cấu hình: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`
- Mặc định: **bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - “Provider/model này thực sự hoạt động _hôm nay_ với creds thực không?”
  - Bắt các thay đổi định dạng provider, quirks gọi tool, vấn đề auth, và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Không ổn định CI theo thiết kế (mạng thực, chính sách provider thực, quotas, outages)
  - Tốn tiền / sử dụng giới hạn tốc độ
  - Nên chạy các tập con thu hẹp thay vì “mọi thứ”
  - Chạy live sẽ lấy `~/.profile` để lấy các API keys còn thiếu
- Xoay vòng API key (provider-specific): đặt `*_API_KEYS` với định dạng comma/semicolon hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc override per-live qua `OPENCLAW_LIVE_*_KEY`; tests retry khi nhận phản hồi giới hạn tốc độ.

## Nên chạy suite nào?

Sử dụng bảng quyết định này:

- Chỉnh sửa logic/tests: chạy `pnpm test` (và `pnpm test:coverage` nếu thay đổi nhiều)
- Chạm vào networking gateway / WS protocol / pairing: thêm `pnpm test:e2e`
- Debug “bot của tôi bị down” / lỗi cụ thể provider / gọi tool: chạy một `pnpm test:live` thu hẹp

## Live: Android node capability sweep

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Mục tiêu: gọi **mọi lệnh hiện được quảng cáo** bởi một Android node đã kết nối và xác nhận hành vi hợp đồng lệnh.
- Phạm vi:
  - Thiết lập điều kiện trước/thủ công (suite không cài đặt/chạy/pair app).
  - Xác nhận `node.invoke` gateway command-by-command cho Android node đã chọn.
- Yêu cầu thiết lập trước:
  - App Android đã kết nối + paired với gateway.
  - App giữ ở foreground.
  - Quyền/đồng ý capture được cấp cho các khả năng bạn mong đợi vượt qua.
- Override mục tiêu tùy chọn:
  - `OPENCLAW_ANDROID_NODE_ID` hoặc `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Chi tiết thiết lập Android đầy đủ: [Android App](/platforms/android)

## Live: model smoke (profile keys)

Live tests được chia thành hai lớp để cô lập lỗi:

- “Direct model” cho biết provider/model có thể trả lời với key đã cho.
- “Gateway smoke” cho biết toàn bộ pipeline gateway+agent hoạt động cho model đó (sessions, history, tools, sandbox policy, v.v.).

### Layer 1: Direct model completion (không gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Mục tiêu:
  - Liệt kê các models đã phát hiện
  - Sử dụng `getApiKeyForModel` để chọn models bạn có creds
  - Chạy một completion nhỏ cho mỗi model (và các regressions mục tiêu khi cần)
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Đặt `OPENCLAW_LIVE_MODELS=modern` (hoặc `all`, alias cho modern) để thực sự chạy suite này; nếu không nó sẽ bỏ qua để giữ `pnpm test:live` tập trung vào gateway smoke
- Cách chọn models:
  - `OPENCLAW_LIVE_MODELS=modern` để chạy danh sách cho phép hiện đại (Opus/Sonnet/Haiku 4.5, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.5, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` là alias cho danh sách cho phép hiện đại
  - hoặc `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,..."` (danh sách cho phép comma)
- Cách chọn providers:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (danh sách cho phép comma)
- Nơi keys đến từ:
  - Mặc định: profile store và env fallbacks
  - Đặt `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để chỉ sử dụng **profile store**
- Tại sao điều này tồn tại:
  - Tách biệt “API provider bị hỏng / key không hợp lệ” khỏi “pipeline agent gateway bị hỏng”
  - Chứa các regressions nhỏ, cô lập (ví dụ: OpenAI Responses/Codex Responses reasoning replay + tool-call flows)

### Layer 2: Gateway + dev agent smoke (những gì "@openclaw" thực sự làm)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Mục tiêu:
  - Khởi động một gateway trong quá trình
  - Tạo/sửa một session `agent:dev:*` (override model mỗi lần chạy)
  - Lặp lại models-with-keys và xác nhận:
    - Phản hồi “có ý nghĩa” (không có tools)
    - Một tool invocation thực sự hoạt động (read probe)
    - Các tool probes bổ sung tùy chọn (exec+read probe)
    - Các đường dẫn regression OpenAI (tool-call-only → follow-up) vẫn hoạt động
- Chi tiết probe (để bạn có thể giải thích lỗi nhanh chóng):
  - `read` probe: test ghi một file nonce trong workspace và yêu cầu agent `read` nó và echo nonce lại.
  - `exec+read` probe: test yêu cầu agent `exec`-write một nonce vào một file tạm, sau đó `read` lại.
  - image probe: test đính kèm một PNG được tạo (cat + mã hóa ngẫu nhiên) và mong đợi model trả về `cat <CODE>`.
  - Tham khảo triển khai: `src/gateway/gateway-models.profiles.live.test.ts` và `src/gateway/live-image-probe.ts`.
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Cách chọn models:
  - Mặc định: danh sách cho phép hiện đại (Opus/Sonnet/Haiku 4.5, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.5, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` là alias cho danh sách cho phép hiện đại
  - Hoặc đặt `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (hoặc danh sách comma) để thu hẹp
- Cách chọn providers (tránh “OpenRouter everything”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (danh sách cho phép comma)
- Tool + image probes luôn bật trong live test này:
  - `read` probe + `exec+read` probe (tool stress)
  - image probe chạy khi model quảng cáo hỗ trợ input hình ảnh
  - Flow (cấp cao):
    - Test tạo một PNG nhỏ với “CAT” + mã ngẫu nhiên (`src/gateway/live-image-probe.ts`)
    - Gửi nó qua `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway phân tích các attachments thành `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agent embedded chuyển tiếp một user message đa phương tiện đến model
    - Assertion: phản hồi chứa `cat` + mã (OCR tolerance: cho phép lỗi nhỏ)

Mẹo: để xem những gì bạn có thể test trên máy của mình (và các id `provider/model` chính xác), chạy:

```bash
openclaw models list
openclaw models list --json
```

## Live: Anthropic setup-token smoke

- Test: `src/agents/anthropic.setup-token.live.test.ts`
- Mục tiêu: xác minh Claude Code CLI setup-token (hoặc một profile setup-token đã dán) có thể hoàn thành một Anthropic prompt.
- Bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
  - `OPENCLAW_LIVE_SETUP_TOKEN=1`
- Nguồn token (chọn một):
  - Profile: `OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test`
  - Token thô: `OPENCLAW_LIVE_SETUP_TOKEN_VALUE=sk-ant-oat01-...`
- Override model (tùy chọn):
  - `OPENCLAW_LIVE_SETUP_TOKEN_MODEL=anthropic/claude-opus-4-6`

Ví dụ thiết lập:

```bash
openclaw models auth paste-token --provider anthropic --profile-id anthropic:setup-token-test
OPENCLAW_LIVE_SETUP_TOKEN=1 OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test pnpm test:live src/agents/anthropic.setup-token.live.test.ts
```

## Live: CLI backend smoke (Claude Code CLI hoặc các CLI local khác)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Mục tiêu: xác thực pipeline Gateway + agent sử dụng một CLI backend local, mà không chạm vào config mặc định của bạn.
- Bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Mặc định:
  - Model: `claude-cli/claude-sonnet-4-6`
  - Lệnh: `claude`
  - Args: `["-p","--output-format","json","--permission-mode","bypassPermissions"]`
- Override (tùy chọn):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` để gửi một attachment hình ảnh thực (các đường dẫn được chèn vào prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` để truyền các đường dẫn file hình ảnh dưới dạng args CLI thay vì chèn prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (hoặc `"list"`) để kiểm soát cách các args hình ảnh được truyền khi `IMAGE_ARG` được đặt.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` để gửi một lượt thứ hai và xác thực flow resume.
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` để giữ cấu hình MCP Claude Code CLI được bật (mặc định vô hiệu hóa cấu hình MCP với một file trống tạm thời).

Ví dụ:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

### Công thức live được khuyến nghị

Danh sách cho phép hẹp, rõ ràng là nhanh nhất và ít không ổn định nhất:

- Model đơn, trực tiếp (không gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Model đơn, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Gọi tool qua nhiều providers:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tập trung vào Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Ghi chú:

- `google/...` sử dụng Gemini API (API key).
- `google-antigravity/...` sử dụng cầu nối Antigravity OAuth (điểm cuối agent kiểu Cloud Code Assist).
- `google-gemini-cli/...` sử dụng Gemini CLI local trên máy của bạn (auth + quirks tooling riêng biệt).
- Gemini API vs Gemini CLI:
  - API: OpenClaw gọi Gemini API được host của Google qua HTTP (API key / profile auth); đây là những gì hầu hết người dùng nghĩ đến khi nói “Gemini”.
  - CLI: OpenClaw shell out đến một binary `gemini` local; nó có auth riêng và có thể hoạt động khác (streaming/hỗ trợ tool/phiên bản lệch).

## Live: model matrix (những gì chúng tôi bao phủ)

Không có danh sách “CI model” cố định (live là opt-in), nhưng đây là các models **được khuyến nghị** để bao phủ thường xuyên trên máy dev với keys.

### Bộ smoke hiện đại (gọi tool + hình ảnh)

Đây là “các models phổ biến” mà chúng tôi mong đợi sẽ tiếp tục hoạt động:

- OpenAI (không Codex): `openai/gpt-5.2` (tùy chọn: `openai/gpt-5.1`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (hoặc `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` và `google/gemini-3-flash-preview` (tránh các models Gemini 2.x cũ hơn)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` và `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/minimax-m2.5`

Chạy gateway smoke với tools + hình ảnh:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: gọi tool (Read + Exec tùy chọn)

Chọn ít nhất một model cho mỗi nhóm provider:

- OpenAI: `openai/gpt-5.2` (hoặc `openai/gpt-5-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (hoặc `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (hoặc `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/minimax-m2.5`

Phủ sóng bổ sung tùy chọn (nên có):

- xAI: `xai/grok-4` (hoặc phiên bản mới nhất có sẵn)
- Mistral: `mistral/`… (chọn một model có khả năng “tools” mà bạn đã bật)
- Cerebras: `cerebras/`… (nếu bạn có quyền truy cập)
- LM Studio: `lmstudio/`… (local; gọi tool phụ thuộc vào chế độ API)

### Vision: gửi hình ảnh (attachment → message đa phương tiện)

Bao gồm ít nhất một model có khả năng hình ảnh trong `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI các biến thể có khả năng vision, v.v.) để thực hiện image probe.

### Aggregators / alternate gateways

Nếu bạn có keys đã bật, chúng tôi cũng hỗ trợ test qua:

- OpenRouter: `openrouter/...` (hàng trăm models; sử dụng `openclaw models scan` để tìm các ứng viên có khả năng tool+image)
- OpenCode: `opencode/...` cho Zen và `opencode-go/...` cho Go (auth qua `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Nhiều providers bạn có thể bao gồm trong live matrix (nếu bạn có creds/config):

- Built-in: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Qua `models.providers` (endpoints tùy chỉnh): `minimax` (cloud/API), cộng với bất kỳ proxy tương thích OpenAI/Anthropic nào (LM Studio, vLLM, LiteLLM, v.v.)

Mẹo: đừng cố gắng hardcode “tất cả models” trong docs. Danh sách chính thức là bất cứ gì `discoverModels(...)` trả về trên máy của bạn + bất cứ keys nào có sẵn.

## Credentials (không bao giờ commit)

Live tests tìm credentials giống như cách CLI làm. Ý nghĩa thực tế:

- Nếu CLI hoạt động, live tests nên tìm thấy các keys tương tự.
- Nếu một live test nói “không có creds”, debug giống như bạn sẽ debug `openclaw models list` / model selection.

- Profile store: `~/.openclaw/credentials/` (ưu tiên; ý nghĩa của “profile keys” trong tests)
- Config: `~/.openclaw/openclaw.json` (hoặc `OPENCLAW_CONFIG_PATH`)

Nếu bạn muốn dựa vào env keys (ví dụ: được export trong `~/.profile`), chạy local tests sau `source ~/.profile`, hoặc sử dụng Docker runners dưới đây (chúng có thể mount `~/.profile` vào container).

## Deepgram live (audio transcription)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Bật: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `src/agents/byteplus.live.test.ts`
- Bật: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Override model tùy chọn: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Image generation live

- Test: `src/image-generation/runtime.live.test.ts`
- Lệnh: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Phạm vi:
  - Liệt kê mọi plugin provider image-generation đã đăng ký
  - Tải các biến môi trường provider còn thiếu từ shell đăng nhập của bạn (`~/.profile`) trước khi probing
  - Sử dụng live/env API keys trước các profile auth đã lưu theo mặc định, vì vậy các keys test cũ trong `auth-profiles.json` không che giấu các credentials shell thực
  - Bỏ qua các providers không có auth/profile/model có thể sử dụng
  - Chạy các biến thể image-generation stock qua khả năng runtime chia sẻ:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Các providers được bao phủ hiện tại:
  - `openai`
  - `google`
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Hành vi auth tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc auth profile-store và bỏ qua các override chỉ env

## Docker runners (kiểm tra tùy chọn "hoạt động trong Linux")

Những cái này chạy `pnpm test:live` bên trong image Docker repo, mount thư mục config local và workspace của bạn (và sourcing `~/.profile` nếu được mount). Chúng cũng bind-mount các homes auth CLI như `~/.codex`, `~/.claude`, `~/.qwen`, và `~/.minimax` khi có, sau đó sao chép chúng vào container home trước khi chạy để OAuth CLI bên ngoài có thể làm mới tokens mà không làm thay đổi store auth host:

- Direct models: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Onboarding wizard (TTY, full scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Gateway networking (hai containers, WS auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Plugins (custom extension load + registry smoke): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Docker runners live-model cũng bind-mount checkout hiện tại chỉ đọc và
stage nó vào một workdir tạm thời bên trong container. Điều này giữ cho image runtime gọn nhẹ trong khi vẫn chạy Vitest với source/config local chính xác của bạn.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy truyền qua
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ coverage live gateway từ lane Docker đó.

Smoke thread ngôn ngữ tự nhiên ACP thủ công (không CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các workflow regression/debug. Nó có thể cần thiết lại cho xác thực routing thread ACP, vì vậy đừng xóa nó.

Các biến môi trường hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được mount vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được mount vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (mặc định: `~/.profile`) được mount vào `/home/node/.profile` và được source trước khi chạy tests
- Các thư mục auth CLI bên ngoài dưới `$HOME` (`.codex`, `.claude`, `.qwen`, `.minimax`) được mount chỉ đọc dưới `/host-auth/...`, sau đó sao chép vào `/home/node/...` trước khi tests bắt đầu
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc providers trong container
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để đảm bảo creds đến từ profile store (không phải env)

## Docs sanity

Chạy kiểm tra docs sau khi chỉnh sửa tài liệu: `pnpm docs:list`.

## Offline regression (CI-safe)

Đây là các regressions “real pipeline” không cần providers thực:

- Gọi tool gateway (mock OpenAI, real gateway + agent loop): `src/gateway/gateway.test.ts` (case: "chạy một mock OpenAI tool call end-to-end qua gateway agent loop")
- Wizard gateway (WS `wizard.start`/`wizard.next`, ghi config + auth enforced): `src/gateway/gateway.test.ts` (case: "chạy wizard qua ws và ghi config token auth")

## Đánh giá độ tin cậy của agent (skills)

Chúng tôi đã có một vài tests CI-safe hoạt động như “đánh giá độ tin cậy của agent”:

- Mock tool-calling qua real gateway + agent loop (`src/gateway/gateway.test.ts`).
- Các flow wizard end-to-end xác thực wiring session và hiệu ứng config (`src/gateway/gateway.test.ts`).

Những gì vẫn thiếu cho skills (xem [Skills](/tools/skills)):

- **Decisioning:** khi skills được liệt kê trong prompt, agent có chọn đúng skill (hoặc tránh những cái không liên quan)?
- **Compliance:** agent có đọc `SKILL.md` trước khi sử dụng và tuân theo các bước/args yêu cầu không?
- **Workflow contracts:** các kịch bản multi-turn xác nhận thứ tự tool, carryover lịch sử session, và ranh giới sandbox.

Các đánh giá trong tương lai nên giữ tính quyết định trước:

- Một scenario runner sử dụng mock providers để xác nhận các tool calls + order, skill file reads, và wiring session.
- Một suite nhỏ các kịch bản tập trung vào skill (sử dụng vs tránh, gating, prompt injection).
- Các đánh giá live tùy chọn (opt-in, env-gated) chỉ sau khi suite CI-safe đã có.

## Contract tests (plugin và channel shape)

Contract tests xác minh rằng mọi plugin và channel đã đăng ký đều tuân thủ hợp đồng interface của nó. Chúng lặp qua tất cả các plugins đã phát hiện và chạy một suite các assertions về shape và behavior.

### Lệnh

- Tất cả contracts: `pnpm test:contracts`
- Chỉ contracts channel: `pnpm test:contracts:channels`
- Chỉ contracts provider: `pnpm test:contracts:plugins`

### Contracts channel

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Shape plugin cơ bản (id, name, capabilities)
- **setup** - Hợp đồng setup wizard
- **session-binding** - Hành vi binding session
- **outbound-payload** - Cấu trúc payload message
- **inbound** - Xử lý message inbound
- **actions** - Handlers hành động channel
- **threading** - Xử lý ID thread
- **directory** - API directory/roster
- **group-policy** - Thực thi chính sách nhóm
- **status** - Probes trạng thái channel
- **registry** - Shape registry plugin

### Contracts provider

Nằm trong `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Hợp đồng flow auth
- **auth-choice** - Lựa chọn auth
- **catalog** - API catalog model
- **discovery** - Discovery plugin
- **loader** - Loading plugin
- **runtime** - Runtime provider
- **shape** - Shape/interface plugin
- **wizard** - Setup wizard

### Khi nào chạy

- Sau khi thay đổi exports hoặc subpaths plugin-sdk
- Sau khi thêm hoặc sửa đổi một channel hoặc plugin provider
- Sau khi refactoring đăng ký hoặc discovery plugin

Contract tests chạy trong CI và không yêu cầu real API keys.

## Thêm regressions (hướng dẫn)

Khi bạn sửa một vấn đề provider/model được phát hiện trong live:

- Thêm một regression CI-safe nếu có thể (mock/stub provider, hoặc capture chuyển đổi request-shape chính xác)
- Nếu nó vốn dĩ chỉ live-only (giới hạn tốc độ, chính sách auth), giữ live test hẹp và opt-in qua env vars
- Nên nhắm mục tiêu lớp nhỏ nhất bắt lỗi:
  - lỗi chuyển đổi/replay request provider → test models trực tiếp
  - lỗi pipeline session/history/tool gateway → smoke live gateway hoặc test mock gateway CI-safe
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dẫn xuất một mục tiêu mẫu cho mỗi lớp SecretRef từ metadata registry (`listSecretTargetRegistryEntries()`), sau đó xác nhận các ids exec traversal-segment bị từ chối.
  - Nếu bạn thêm một gia đình mục tiêu SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, cập nhật `classifyTargetClass` trong test đó. Test cố ý thất bại trên các ids mục tiêu chưa phân loại để các lớp mới không thể bị bỏ qua một cách âm thầm.\n