---
summary: "Bộ công cụ kiểm thử: bộ unit/e2e/live, Docker runners và phạm vi của từng loại kiểm thử"
read_when:
  - Chạy kiểm thử cục bộ hoặc trong CI
  - Thêm các hồi quy cho lỗi mô hình/nhà cung cấp
  - Gỡ lỗi hành vi gateway + agent
title: "Kiểm thử"
---

# Kiểm thử

OpenClaw có ba bộ Vitest (unit/integration, e2e, live) và một số Docker runners nhỏ.

Tài liệu này là hướng dẫn "cách chúng tôi kiểm thử":

- Phạm vi của từng bộ kiểm thử (và những gì nó cố ý không bao gồm)
- Các lệnh cần chạy cho các quy trình làm việc phổ biến (cục bộ, trước khi đẩy, gỡ lỗi)
- Cách các kiểm thử live phát hiện thông tin xác thực và chọn mô hình/nhà cung cấp
- Cách thêm các hồi quy cho các vấn đề thực tế của mô hình/nhà cung cấp

## Bắt đầu nhanh

Hầu hết các ngày:

- Kiểm tra đầy đủ (dự kiến trước khi đẩy): `pnpm build && pnpm check && pnpm test`

Khi bạn chỉnh sửa kiểm thử hoặc muốn tự tin hơn:

- Kiểm tra độ bao phủ: `pnpm test:coverage`
- Bộ E2E: `pnpm test:e2e`

Khi gỡ lỗi các nhà cung cấp/mô hình thực (yêu cầu thông tin xác thực thực):

- Bộ live (mô hình + công cụ/hình ảnh gateway): `pnpm test:live`

Mẹo: khi chỉ cần một trường hợp thất bại, hãy thu hẹp kiểm thử live thông qua các biến môi trường allowlist được mô tả dưới đây.

## Bộ kiểm thử (chạy ở đâu)

Hãy nghĩ về các bộ kiểm thử như "tăng tính thực tế" (và tăng độ không ổn định/chi phí):

### Unit / integration (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: `scripts/test-parallel.mjs` (chạy `vitest.unit.config.ts`, `vitest.extensions.config.ts`, `vitest.gateway.config.ts`)
- Tệp: `src/**/*.test.ts`, `extensions/**/*.test.ts`
- Phạm vi:
  - Kiểm thử đơn vị thuần túy
  - Kiểm thử tích hợp trong quá trình (xác thực gateway, định tuyến, công cụ, phân tích cú pháp, cấu hình)
  - Hồi quy xác định cho các lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không yêu cầu khóa thực
  - Nên nhanh và ổn định
- Ghi chú về bộ lập lịch:
  - `pnpm test` hiện giữ một manifest hành vi nhỏ đã được kiểm tra để ghi đè pool/isolations thực sự và một snapshot thời gian riêng cho các tệp đơn vị chậm nhất.
  - Độ bao phủ đơn vị chia sẻ vẫn được bật, nhưng wrapper tách các tệp đo nặng nhất vào các làn riêng biệt thay vì dựa vào danh sách loại trừ được duy trì bằng tay ngày càng tăng.
  - Làm mới snapshot thời gian với `pnpm test:perf:update-timings` sau khi thay đổi hình dạng bộ chính.
- Ghi chú về runner nhúng:
  - Khi bạn thay đổi đầu vào phát hiện công cụ tin nhắn hoặc ngữ cảnh runtime nén,
    hãy giữ cả hai mức độ bao phủ.
  - Thêm các hồi quy trợ giúp tập trung cho các ranh giới định tuyến/chuẩn hóa thuần túy.
  - Cũng giữ cho các bộ tích hợp runner nhúng khỏe mạnh:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, và
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Các bộ này xác minh rằng các id được giới hạn và hành vi nén vẫn chảy
    qua các đường dẫn `run.ts` / `compact.ts` thực; các kiểm thử chỉ có trợ giúp không phải là
    một sự thay thế đủ cho các đường dẫn tích hợp đó.
- Ghi chú về pool:
  - OpenClaw sử dụng Vitest `vmForks` trên Node 22, 23 và 24 cho các mảnh đơn vị nhanh hơn.
  - Trên Node 25+, OpenClaw tự động quay lại `forks` thông thường cho đến khi repo được xác thực lại ở đó.
  - Ghi đè thủ công với `OPENCLAW_TEST_VM_FORKS=0` (buộc `forks`) hoặc `OPENCLAW_TEST_VM_FORKS=1` (buộc `vmForks`).

### E2E (gateway smoke)

- Lệnh: `pnpm test:e2e`
- Cấu hình: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Mặc định runtime:
  - Sử dụng Vitest `vmForks` để khởi động tệp nhanh hơn.
  - Sử dụng các worker thích ứng (CI: 2-4, cục bộ: 4-8).
  - Chạy ở chế độ im lặng theo mặc định để giảm chi phí I/O console.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để buộc số lượng worker (giới hạn ở 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại đầu ra console chi tiết.
- Phạm vi:
  - Hành vi end-to-end của gateway đa phiên bản
  - Bề mặt WebSocket/HTTP, ghép nối node và mạng nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không yêu cầu khóa thực
  - Nhiều phần chuyển động hơn so với kiểm thử đơn vị (có thể chậm hơn)

### E2E: OpenShell backend smoke

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `test/openshell-sandbox.e2e.test.ts`
- Phạm vi:
  - Khởi động một gateway OpenShell cô lập trên máy chủ thông qua Docker
  - Tạo một sandbox từ một Dockerfile cục bộ tạm thời
  - Thực hiện backend OpenShell của OpenClaw qua `sandbox ssh-config` thực + SSH exec
  - Xác minh hành vi hệ thống tệp từ xa-canonical thông qua cầu nối fs sandbox
- Kỳ vọng:
  - Chỉ có thể chọn tham gia; không phải là một phần của chạy mặc định `pnpm test:e2e`
  - Yêu cầu một CLI `openshell` cục bộ cộng với một daemon Docker hoạt động
  - Sử dụng `HOME` / `XDG_CONFIG_HOME` cô lập, sau đó phá hủy gateway và sandbox kiểm thử
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy bộ e2e rộng hơn thủ công
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để chỉ đến một nhị phân CLI không mặc định hoặc script wrapper

### Live (nhà cung cấp thực + mô hình thực)

- Lệnh: `pnpm test:live`
- Cấu hình: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`
- Mặc định: **đã bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - "Nhà cung cấp/mô hình này thực sự hoạt động _hôm nay_ với thông tin xác thực thực không?"
  - Bắt các thay đổi định dạng nhà cung cấp, các quirks gọi công cụ, vấn đề xác thực và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Không ổn định trong CI theo thiết kế (mạng thực, chính sách nhà cung cấp thực, hạn ngạch, sự cố)
  - Tốn tiền / sử dụng giới hạn tốc độ
  - Ưu tiên chạy các tập hợp thu hẹp thay vì "mọi thứ"
  - Các lần chạy live sẽ lấy `~/.profile` để chọn các khóa API bị thiếu
- Xoay vòng khóa API (cụ thể cho nhà cung cấp): đặt `*_API_KEYS` với định dạng dấu phẩy/dấu chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè từng live qua `OPENCLAW_LIVE_*_KEY`; các kiểm thử thử lại khi nhận được phản hồi giới hạn tốc độ.

## Nên chạy bộ kiểm thử nào?

Sử dụng bảng quyết định này:

- Chỉnh sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn thay đổi nhiều)
- Chạm vào mạng gateway / giao thức WS / ghép nối: thêm `pnpm test:e2e`
- Gỡ lỗi "bot của tôi bị hỏng" / lỗi cụ thể của nhà cung cấp / gọi công cụ: chạy một `pnpm test:live` thu hẹp

## Live: Quét khả năng node Android

- Kiểm thử: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Mục tiêu: gọi **mọi lệnh hiện đang được quảng cáo** bởi một node Android đã kết nối và xác nhận hành vi hợp đồng lệnh.
- Phạm vi:
  - Thiết lập điều kiện trước/thủ công (bộ không cài đặt/chạy/ghép nối ứng dụng).
  - Xác nhận `node.invoke` gateway lệnh theo lệnh cho node Android đã chọn.
- Thiết lập trước cần thiết:
  - Ứng dụng Android đã được kết nối + ghép nối với gateway.
  - Ứng dụng được giữ ở nền trước.
  - Quyền/đồng ý chụp được cấp cho các khả năng bạn mong đợi vượt qua.
- Ghi đè mục tiêu tùy chọn:
  - `OPENCLAW_ANDROID_NODE_ID` hoặc `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Chi tiết thiết lập Android đầy đủ: [Ứng dụng Android](/platforms/android)

## Live: Kiểm thử mô hình (khóa hồ sơ)

Các kiểm thử live được chia thành hai lớp để chúng tôi có thể cô lập các lỗi:

- "Mô hình trực tiếp" cho chúng tôi biết nhà cung cấp/mô hình có thể trả lời với khóa đã cho.
- "Gateway smoke" cho chúng tôi biết toàn bộ pipeline gateway+agent hoạt động cho mô hình đó (phiên, lịch sử, công cụ, chính sách sandbox, v.v.).

### Lớp 1: Hoàn thành mô hình trực tiếp (không có gateway)

- Kiểm thử: `src/agents/models.profiles.live.test.ts`
- Mục tiêu:
  - Liệt kê các mô hình đã phát hiện
  - Sử dụng `getApiKeyForModel` để chọn các mô hình bạn có thông tin xác thực
  - Chạy một hoàn thành nhỏ cho mỗi mô hình (và các hồi quy mục tiêu khi cần)
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Đặt `OPENCLAW_LIVE_MODELS=modern` (hoặc `all`, bí danh cho modern) để thực sự chạy bộ này; nếu không, nó sẽ bỏ qua để giữ `pnpm test:live` tập trung vào gateway smoke
- Cách chọn mô hình:
  - `OPENCLAW_LIVE_MODELS=modern` để chạy danh sách cho phép hiện đại (Opus/Sonnet/Haiku 4.5, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.5, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` là bí danh cho danh sách cho phép hiện đại
  - hoặc `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,..."` (danh sách cho phép dấu phẩy)
- Cách chọn nhà cung cấp:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (danh sách cho phép dấu phẩy)
- Nguồn gốc khóa:
  - Theo mặc định: cửa hàng hồ sơ và các biến môi trường dự phòng
  - Đặt `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để chỉ thực thi **cửa hàng hồ sơ**
- Tại sao điều này tồn tại:
  - Tách biệt "API nhà cung cấp bị hỏng / khóa không hợp lệ" khỏi "pipeline agent gateway bị hỏng"
  - Chứa các hồi quy nhỏ, cô lập (ví dụ: OpenAI Responses/Codex Responses lý luận phát lại + luồng gọi công cụ)

### Lớp 2: Gateway + dev agent smoke (những gì "@openclaw" thực sự làm)

- Kiểm thử: `src/gateway/gateway-models.profiles.live.test.ts`
- Mục tiêu:
  - Khởi động một gateway trong quá trình
  - Tạo/sửa một phiên `agent:dev:*` (ghi đè mô hình cho mỗi lần chạy)
  - Lặp lại các mô hình có khóa và xác nhận:
    - Phản hồi "có ý nghĩa" (không có công cụ)
    - Một cuộc gọi công cụ thực sự hoạt động (đọc probe)
    - Các probe công cụ bổ sung tùy chọn (exec+read probe)
    - Các đường dẫn hồi quy OpenAI (chỉ gọi công cụ → theo dõi) tiếp tục hoạt động
- Chi tiết probe (để bạn có thể giải thích các lỗi nhanh chóng):
  - `read` probe: kiểm thử ghi một tệp nonce trong workspace và yêu cầu agent `read` nó và echo lại nonce.
  - `exec+read` probe: kiểm thử yêu cầu agent `exec`-ghi một nonce vào một tệp tạm thời, sau đó `read` lại.
  - probe hình ảnh: kiểm thử đính kèm một PNG được tạo (mèo + mã ngẫu nhiên) và mong đợi mô hình trả về `cat <CODE>`.
  - Tham khảo triển khai: `src/gateway/gateway-models.profiles.live.test.ts` và `src/gateway/live-image-probe.ts`.
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Cách chọn mô hình:
  - Mặc định: danh sách cho phép hiện đại (Opus/Sonnet/Haiku 4.5, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.5, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` là bí danh cho danh sách cho phép hiện đại
  - Hoặc đặt `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (hoặc danh sách dấu phẩy) để thu hẹp
- Cách chọn nhà cung cấp (tránh "OpenRouter everything"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (danh sách cho phép dấu phẩy)
- Các probe công cụ + hình ảnh luôn bật trong kiểm thử live này:
  - `read` probe + `exec+read` probe (căng thẳng công cụ)
  - probe hình ảnh chạy khi mô hình quảng cáo hỗ trợ đầu vào hình ảnh
  - Luồng (cấp cao):
    - Kiểm thử tạo một PNG nhỏ với "CAT" + mã ngẫu nhiên (`src/gateway/live-image-probe.ts`)
    - Gửi nó qua `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway phân tích các tệp đính kèm thành `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agent nhúng chuyển tiếp một thông điệp người dùng đa phương tiện đến mô hình
    - Xác nhận: phản hồi chứa `cat` + mã (dung sai OCR: cho phép sai sót nhỏ)

Mẹo: để xem những gì bạn có thể kiểm thử trên máy của mình (và các id `provider/model` chính xác), chạy:

```bash
openclaw models list
openclaw models list --json
```

## Live: Thiết lập token Anthropic smoke

- Kiểm thử: `src/agents/anthropic.setup-token.live.test.ts`
- Mục tiêu: xác minh Claude Code CLI thiết lập token (hoặc một hồ sơ thiết lập token đã dán) có thể hoàn thành một prompt Anthropic.
- Bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
  - `OPENCLAW_LIVE_SETUP_TOKEN=1`
- Nguồn token (chọn một):
  - Hồ sơ: `OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test`
  - Token thô: `OPENCLAW_LIVE_SETUP_TOKEN_VALUE=sk-ant-oat01-...`
- Ghi đè mô hình (tùy chọn):
  - `OPENCLAW_LIVE_SETUP_TOKEN_MODEL=anthropic/claude-opus-4-6`

Ví dụ thiết lập:

```bash
openclaw models auth paste-token --provider anthropic --profile-id anthropic:setup-token-test
OPENCLAW_LIVE_SETUP_TOKEN=1 OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test pnpm test:live src/agents/anthropic.setup-token.live.test.ts
```

## Live: CLI backend smoke (Claude Code CLI hoặc các CLI cục bộ khác)

- Kiểm thử: `src/gateway/gateway-cli-backend.live.test.ts`
- Mục tiêu: xác nhận pipeline Gateway + agent sử dụng một backend CLI cục bộ, mà không chạm vào cấu hình mặc định của bạn.
- Bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Mặc định:
  - Mô hình: `claude-cli/claude-sonnet-4-6`
  - Lệnh: `claude`
  - Tham số: `["-p","--output-format","json","--permission-mode","bypassPermissions"]`
- Ghi đè (tùy chọn):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` để gửi một tệp đính kèm hình ảnh thực (các đường dẫn được chèn vào prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` để truyền các đường dẫn tệp hình ảnh dưới dạng tham số CLI thay vì chèn prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (hoặc `"list"`) để kiểm soát cách các tham số hình ảnh được truyền khi `IMAGE_ARG` được đặt.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` để gửi một lượt thứ hai và xác nhận luồng tiếp tục.
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` để giữ cấu hình MCP Claude Code CLI được bật (mặc định vô hiệu hóa cấu hình MCP với một tệp trống tạm thời).

Ví dụ:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

### Công thức live được khuyến nghị

Danh sách cho phép hẹp, rõ ràng là nhanh nhất và ít không ổn định nhất:

- Mô hình đơn, trực tiếp (không có gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Mô hình đơn, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Gọi công cụ trên nhiều nhà cung cấp:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tập trung vào Google (khóa API Gemini + Antigravity):
  - Gemini (khóa API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Ghi chú:

- `google/...` sử dụng API Gemini (khóa API).
- `google-antigravity/...` sử dụng cầu nối OAuth Antigravity (điểm cuối agent kiểu Cloud Code Assist).
- `google-gemini-cli/...` sử dụng CLI Gemini cục bộ trên máy của bạn (xác thực + quirks công cụ riêng biệt).
- API Gemini vs CLI Gemini:
  - API: OpenClaw gọi API Gemini được lưu trữ của Google qua HTTP (khóa API / xác thực hồ sơ); đây là những gì hầu hết người dùng nghĩ đến khi nói "Gemini".
  - CLI: OpenClaw gọi một nhị phân `gemini` cục bộ; nó có xác thực riêng và có thể hoạt động khác (hỗ trợ streaming/công cụ/phiên bản lệch).

## Live: ma trận mô hình (những gì chúng tôi bao phủ)

Không có "danh sách mô hình CI" cố định (live là tùy chọn), nhưng đây là các mô hình **được khuyến nghị** để bao phủ thường xuyên trên máy phát triển với các khóa.

### Bộ smoke hiện đại (gọi công cụ + hình ảnh)

Đây là "các mô hình phổ biến" mà chúng tôi mong đợi sẽ tiếp tục hoạt động:

- OpenAI (không phải Codex): `openai/gpt-5.2` (tùy chọn: `openai/gpt-5.1`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (hoặc `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` và `google/gemini-3-flash-preview` (tránh các mô hình Gemini 2.x cũ hơn)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` và `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/minimax-m2.5`

Chạy gateway smoke với công cụ + hình ảnh:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Cơ bản: gọi công cụ (Đọc + Exec tùy chọn)

Chọn ít nhất một mô hình cho mỗi gia đình nhà cung cấp:

- OpenAI: `openai/gpt-5.2` (hoặc `openai/gpt-5-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (hoặc `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (hoặc `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/minimax-m2.5`

Phạm vi bổ sung tùy chọn (nên có):

- xAI: `xai/grok-4` (hoặc phiên bản mới nhất có sẵn)
- Mistral: `mistral/`… (chọn một mô hình có khả năng "công cụ" mà bạn đã bật)
- Cerebras: `cerebras/`… (nếu bạn có quyền truy cập)
- LM Studio: `lmstudio/`… (cục bộ; gọi công cụ phụ thuộc vào chế độ API)

### Tầm nhìn: gửi hình ảnh (tệp đính kèm → thông điệp đa phương tiện)

Bao gồm ít nhất một mô hình có khả năng hình ảnh trong `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI các biến thể có khả năng nhìn, v.v.) để thực hiện probe hình ảnh.

### Bộ tổng hợp / gateway thay thế

Nếu bạn có các khóa đã bật, chúng tôi cũng hỗ trợ kiểm thử qua:

- OpenRouter: `openrouter/...` (hàng trăm mô hình; sử dụng `openclaw models scan` để tìm các ứng viên có khả năng công cụ + hình ảnh)
- OpenCode: `opencode/...` cho Zen và `opencode-go/...` cho Go (xác thực qua `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Nhiều nhà cung cấp hơn bạn có thể bao gồm trong ma trận live (nếu bạn có thông tin xác thực/cấu hình):

- Tích hợp sẵn: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Qua `models.providers` (điểm cuối tùy chỉnh): `minimax` (cloud/API), cộng với bất kỳ proxy tương thích OpenAI/Anthropic nào (LM Studio, vLLM, LiteLLM, v.v.)

Mẹo: đừng cố gắng mã hóa cứng "tất cả các mô hình" trong tài liệu. Danh sách chính thức là bất kỳ thứ gì `discoverModels(...)` trả về trên máy của bạn + bất kỳ khóa nào có sẵn.

## Thông tin xác thực (không bao giờ commit)

Các kiểm thử live phát hiện thông tin xác thực theo cách mà CLI thực hiện. Ý nghĩa thực tế:

- Nếu CLI hoạt động, các kiểm thử live sẽ tìm thấy cùng các khóa.
- Nếu một kiểm thử live nói "không có thông tin xác thực", hãy gỡ lỗi theo cách bạn sẽ gỡ lỗi `openclaw models list` / lựa chọn mô hình.

- Cửa hàng hồ sơ: `~/.openclaw/credentials/` (ưu tiên; ý nghĩa của "khóa hồ sơ" trong các kiểm thử)
- Cấu hình: `~/.openclaw/openclaw.json` (hoặc `OPENCLAW_CONFIG_PATH`)

Nếu bạn muốn dựa vào các khóa môi trường (ví dụ: được xuất trong `~/.profile` của bạn), hãy chạy các kiểm thử cục bộ sau `source ~/.profile`, hoặc sử dụng các Docker runners dưới đây (chúng có thể gắn kết `~/.profile` vào container).

## Deepgram live (chuyển đổi âm thanh)

- Kiểm thử: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Bật: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Kiểm thử: `src/agents/byteplus.live.test.ts`
- Bật: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Ghi đè mô hình tùy chọn: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Tạo hình ảnh live

- Kiểm thử: `src/image-generation/runtime.live.test.ts`
- Lệnh: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Phạm vi:
  - Liệt kê mọi plugin nhà cung cấp tạo hình ảnh đã đăng ký
  - Tải các biến môi trường nhà cung cấp bị thiếu từ shell đăng nhập của bạn (`~/.profile`) trước khi thăm dò
  - Sử dụng các khóa API live/env trước các hồ sơ xác thực đã lưu theo mặc định, vì vậy các khóa kiểm thử cũ trong `auth-profiles.json` không che giấu thông tin xác thực shell thực
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình có thể sử dụng
  - Chạy các biến thể tạo hình ảnh gốc thông qua khả năng runtime chia sẻ:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Các nhà cung cấp hiện tại được bao phủ:
  - `openai`
  - `google`
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực cửa hàng hồ sơ và bỏ qua các ghi đè chỉ môi trường

## Docker runners (kiểm tra tùy chọn "hoạt động trong Linux")

Những cái này chạy `pnpm test:live` bên trong hình ảnh Docker repo, gắn kết thư mục cấu hình cục bộ và workspace của bạn (và lấy `~/.profile` nếu được gắn kết). Chúng cũng gắn kết các thư mục xác thực CLI như `~/.codex`, `~/.claude`, `~/.qwen`, và `~/.minimax` khi có, sau đó sao chép chúng vào thư mục home container trước khi chạy để OAuth CLI bên ngoài có thể làm mới token mà không làm thay đổi cửa hàng xác thực host:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Wizard onboarding (TTY, scaffolding đầy đủ): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Mạng gateway (hai container, xác thực WS + sức khỏe): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Plugins (tải mở rộng tùy chỉnh + kiểm tra registry): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Các Docker runners live-model cũng gắn kết bản checkout hiện tại chỉ đọc và
dàn dựng nó vào một thư mục làm việc tạm thời bên trong container. Điều này giữ cho hình ảnh runtime
mỏng trong khi vẫn chạy Vitest chống lại nguồn/cấu hình cục bộ chính xác của bạn.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền qua
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ phạm vi live gateway
từ làn Docker đó.

Kiểm thử smoke ngôn ngữ tự nhiên ACP thủ công (không phải CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các quy trình hồi quy/gỡ lỗi. Nó có thể cần thiết lại cho xác nhận định tuyến luồng ACP, vì vậy đừng xóa nó.

Các biến môi trường hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được gắn kết vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được gắn kết vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (mặc định: `~/.profile`) được gắn kết vào `/home/node/.profile` và được lấy trước khi chạy kiểm thử
- Các thư mục xác thực CLI bên ngoài dưới `$HOME` (`.codex`, `.claude`, `.qwen`, `.minimax`) được gắn kết chỉ đọc dưới `/host-auth/...`, sau đó sao chép vào `/home/node/...` trước khi kiểm thử bắt đầu
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc các nhà cung cấp trong container
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để đảm bảo thông tin xác thực đến từ cửa hàng hồ sơ (không phải môi trường)

## Kiểm tra tài liệu

Chạy kiểm tra tài liệu sau khi chỉnh sửa tài liệu: `pnpm docs:list`.

## Hồi quy ngoại tuyến (an toàn CI)

Đây là các hồi quy "pipeline thực" mà không có nhà cung cấp thực:

- Gọi công cụ gateway (mock OpenAI, vòng lặp gateway + agent thực): `src/gateway/gateway.test.ts` (trường hợp: "chạy một cuộc gọi công cụ mock OpenAI end-to-end qua vòng lặp agent gateway")
- Wizard gateway (WS `wizard.start`/`wizard.next`, ghi cấu hình + xác thực được thực thi): `src/gateway/gateway.test.ts` (trường hợp: "chạy wizard qua ws và ghi cấu hình token xác thực")

## Đánh giá độ tin cậy của agent (kỹ năng)

Chúng tôi đã có một số kiểm thử an toàn CI hoạt động như "đánh giá độ tin cậy của agent":

- Gọi công cụ mock qua vòng lặp gateway + agent thực (`src/gateway/gateway.test.ts`).
- Các luồng wizard end-to-end xác nhận dây phiên và hiệu ứng cấu hình (`src/gateway/gateway.test.ts`).

Những gì vẫn còn thiếu cho kỹ năng (xem [Kỹ năng](/tools/skills)):

- **Quyết định:** khi các kỹ năng được liệt kê trong prompt, agent có chọn đúng kỹ năng (hoặc tránh những kỹ năng không liên quan)?
- **Tuân thủ:** agent có đọc `SKILL.md` trước khi sử dụng và tuân theo các bước/tham số yêu cầu không?
- **Hợp đồng quy trình làm việc:** các kịch bản nhiều lượt xác nhận thứ tự công cụ, mang theo lịch sử phiên và ranh giới sandbox.

Các đánh giá trong tương lai nên giữ tính xác định trước:

- Một runner kịch bản sử dụng các nhà cung cấp mock để xác nhận các cuộc gọi công cụ + thứ tự, đọc tệp kỹ năng và dây phiên.
- Một bộ nhỏ các kịch bản tập trung vào kỹ năng (sử dụng so với tránh, cổng, chèn prompt).
- Các đánh giá live tùy chọn (tùy chọn, được bảo vệ bằng môi trường) chỉ sau khi bộ an toàn CI đã được thiết lập.

## Kiểm thử hợp đồng (hình dạng plugin và kênh)

Kiểm thử hợp đồng xác minh rằng mọi plugin và kênh đã đăng ký đều tuân thủ hợp đồng giao diện của nó. Chúng lặp lại tất cả các plugin đã phát hiện và chạy một bộ các xác nhận hình dạng và hành vi.

### Lệnh

- Tất cả các hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng nhà cung cấp: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Hình dạng plugin cơ bản (id, tên, khả năng)
- **setup** - Hợp đồng wizard thiết lập
- **session-binding** - Hành vi ràng buộc phiên
- **outbound-payload** - Cấu trúc tải trọng tin nhắn
- **inbound** - Xử lý tin nhắn đến
- **actions** - Trình xử lý hành động kênh
- **threading** - Xử lý ID luồng
- **directory** - API thư mục/danh sách
- **group-policy** - Thực thi chính sách nhóm
- **status** - Kiểm tra trạng thái kênh
- **registry** - Hình dạng registry plugin

### Hợp đồng nhà cung cấp

Nằm trong `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Hợp đồng luồng xác thực
- **auth-choice** - Lựa chọn/xác thực xác thực
- **catalog** - API danh mục mô hình
- **discovery** - Phát hiện plugin
- **loader** - Tải plugin
- **runtime** - Runtime nhà cung cấp
- **shape** - Hình dạng/giao diện plugin
- **wizard** - Wizard thiết lập

### Khi nào nên chạy

- Sau khi thay đổi xuất khẩu plugin-sdk hoặc các đường dẫn phụ
- Sau khi thêm hoặc sửa đổi một plugin kênh hoặc nhà cung cấp
- Sau khi tái cấu trúc đăng ký hoặc phát hiện plugin

Kiểm thử hợp đồng chạy trong CI và không yêu cầu khóa API thực.

## Thêm hồi quy (hướng dẫn)

Khi bạn sửa một vấn đề nhà cung cấp/mô hình được phát hiện trong live:

- Thêm một hồi quy an toàn CI nếu có thể (nhà cung cấp mock/stub, hoặc ghi lại sự biến đổi hình dạng yêu cầu chính xác)
- Nếu nó vốn dĩ chỉ có live (giới hạn tốc độ, chính sách xác thực), giữ kiểm thử live hẹp và tùy chọn qua các biến môi trường
- Ưu tiên nhắm mục tiêu lớp nhỏ nhất bắt lỗi:
  - lỗi chuyển đổi/phát lại yêu cầu nhà cung cấp → kiểm thử mô hình trực tiếp
  - lỗi pipeline phiên/lịch sử/công cụ gateway → gateway live smoke hoặc kiểm thử mock gateway an toàn CI
- Guardrail duyệt SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dẫn xuất một mục tiêu mẫu cho mỗi lớp SecretRef từ siêu dữ liệu registry (`listSecretTargetRegistryEntries()`), sau đó xác nhận các id thực thi đoạn duyệt bị từ chối.
  - Nếu bạn thêm một gia đình mục tiêu SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, cập nhật `classifyTargetClass` trong kiểm thử đó. Kiểm thử cố ý thất bại trên các id mục tiêu chưa được phân loại để các lớp mới không thể bị bỏ qua một cách âm thầm.
