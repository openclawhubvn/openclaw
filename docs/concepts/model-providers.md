---
summary: "Khám phá cách cấu hình và sử dụng nhà cung cấp mô hình với ví dụ chi tiết và luồng CLI, giúp tối ưu hóa hiệu suất hệ thống."
read_when:
  - Cần tham khảo thiết lập mô hình theo từng nhà cung cấp
  - Muốn có ví dụ cấu hình hoặc lệnh CLI để bắt đầu với các nhà cung cấp mô hình
title: "Hướng Dẫn Cấu Hình Nhà Cung Cấp Mô Hình"
---

# Nhà cung cấp mô hình

Trang này đề cập đến **nhà cung cấp mô hình/LLM** (không phải các kênh chat như WhatsApp/Telegram).
Để biết quy tắc chọn mô hình, xem tại [/concepts/models](/concepts/models).

## Quy tắc nhanh

- Tham chiếu mô hình sử dụng `provider/model` (ví dụ: `opencode/claude-opus-4-6`).
- Nếu thiết lập `agents.defaults.models`, nó sẽ trở thành danh sách cho phép.
- Trợ giúp CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Plugin nhà cung cấp có thể chèn danh mục mô hình qua `registerProvider({ catalog })`;
  OpenClaw sẽ hợp nhất đầu ra đó vào `models.providers` trước khi ghi
  `models.json`.
- Manifest nhà cung cấp có thể khai báo `providerAuthEnvVars` để các kiểm tra xác thực dựa trên môi trường không cần tải runtime plugin. Bản đồ env-var cốt lõi còn lại chỉ dành cho các nhà cung cấp không phải plugin/cốt lõi và một số trường hợp ưu tiên chung như onboarding API-key-first của Anthropic.
- Plugin nhà cung cấp cũng có thể sở hữu hành vi runtime của nhà cung cấp qua
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `capabilities`, `prepareExtraParams`, `wrapStreamFn`, `formatApiKey`,
  `refreshOAuth`, `buildAuthDoctorHint`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`,
  `suppressBuiltInModel`, `augmentModelCatalog`, `isBinaryThinking`,
  `supportsXHighThinking`, `resolveDefaultThinkingLevel`,
  `isModernModelRef`, `prepareRuntimeAuth`, `resolveUsageAuth`, và
  `fetchUsageSnapshot`.
- Lưu ý: `capabilities` runtime của nhà cung cấp là metadata runner chia sẻ (gia đình nhà cung cấp, quirks transcript/tooling, gợi ý transport/cache). Nó không giống với [mô hình khả năng công khai](/plugins/architecture#public-capability-model) mô tả những gì một plugin đăng ký (suy luận văn bản, giọng nói, v.v.).

## Hành vi nhà cung cấp do plugin sở hữu

Plugin nhà cung cấp hiện có thể sở hữu hầu hết logic cụ thể của nhà cung cấp trong khi OpenClaw giữ vòng lặp suy luận chung.

Phân chia điển hình:

- `auth[].run` / `auth[].runNonInteractive`: nhà cung cấp sở hữu luồng onboarding/đăng nhập cho `openclaw onboard`, `openclaw models auth`, và thiết lập không tương tác
- `wizard.setup` / `wizard.modelPicker`: nhà cung cấp sở hữu nhãn lựa chọn xác thực, bí danh cũ, gợi ý danh sách cho phép onboarding, và các mục thiết lập trong onboarding/model pickers
- `catalog`: nhà cung cấp xuất hiện trong `models.providers`
- `resolveDynamicModel`: nhà cung cấp chấp nhận id mô hình chưa có trong danh mục tĩnh cục bộ
- `prepareDynamicModel`: nhà cung cấp cần làm mới metadata trước khi thử lại giải quyết động
- `normalizeResolvedModel`: nhà cung cấp cần viết lại transport hoặc URL cơ sở
- `capabilities`: nhà cung cấp công bố quirks transcript/tooling/gia đình nhà cung cấp
- `prepareExtraParams`: nhà cung cấp mặc định hoặc chuẩn hóa các tham số yêu cầu theo mô hình
- `wrapStreamFn`: nhà cung cấp áp dụng các gói tương thích headers/body/model yêu cầu
- `formatApiKey`: nhà cung cấp định dạng hồ sơ xác thực lưu trữ thành chuỗi `apiKey` runtime mà transport mong đợi
- `refreshOAuth`: nhà cung cấp sở hữu làm mới OAuth khi các bộ làm mới `pi-ai` chia sẻ không đủ
- `buildAuthDoctorHint`: nhà cung cấp thêm hướng dẫn sửa chữa khi làm mới OAuth thất bại
- `isCacheTtlEligible`: nhà cung cấp quyết định id mô hình upstream nào hỗ trợ TTL cache prompt
- `buildMissingAuthMessage`: nhà cung cấp thay thế lỗi lưu trữ xác thực chung bằng gợi ý khôi phục cụ thể của nhà cung cấp
- `suppressBuiltInModel`: nhà cung cấp ẩn các hàng upstream cũ và có thể trả về lỗi do nhà cung cấp sở hữu cho các lỗi giải quyết trực tiếp
- `augmentModelCatalog`: nhà cung cấp thêm các hàng danh mục tổng hợp/cuối cùng sau khi khám phá và hợp nhất cấu hình
- `isBinaryThinking`: nhà cung cấp sở hữu UX suy nghĩ nhị phân bật/tắt
- `supportsXHighThinking`: nhà cung cấp chọn các mô hình đã chọn vào `xhigh`
- `resolveDefaultThinkingLevel`: nhà cung cấp sở hữu chính sách `/think` mặc định cho một gia đình mô hình
- `isModernModelRef`: nhà cung cấp sở hữu khớp mô hình ưa thích live/smoke
- `prepareRuntimeAuth`: nhà cung cấp biến thông tin xác thực đã cấu hình thành token runtime ngắn hạn
- `resolveUsageAuth`: nhà cung cấp giải quyết thông tin xác thực sử dụng/hạn ngạch cho `/usage` và các bề mặt trạng thái/báo cáo liên quan
- `fetchUsageSnapshot`: nhà cung cấp sở hữu việc lấy/phân tích cú pháp điểm cuối sử dụng trong khi cốt lõi vẫn sở hữu shell tóm tắt và định dạng

Các ví dụ đi kèm hiện tại:

- `anthropic`: Claude 4.6 forward-compat fallback, gợi ý sửa chữa xác thực, lấy điểm cuối sử dụng, và metadata cache-TTL/gia đình nhà cung cấp
- `openrouter`: id mô hình pass-through, gói yêu cầu, gợi ý khả năng nhà cung cấp, và chính sách cache-TTL
- `github-copilot`: onboarding/đăng nhập thiết bị, fallback mô hình forward-compat, gợi ý transcript Claude-thinking, trao đổi token runtime, và lấy điểm cuối sử dụng
- `openai`: GPT-5.4 forward-compat fallback, chuẩn hóa transport OpenAI trực tiếp, gợi ý thiếu xác thực Codex-aware, ức chế Spark, hàng danh mục tổng hợp OpenAI/Codex, chính sách mô hình suy nghĩ/live, và metadata gia đình nhà cung cấp
- `google` và `google-gemini-cli`: Gemini 3.1 forward-compat fallback và khớp mô hình hiện đại; OAuth Gemini CLI cũng sở hữu định dạng token hồ sơ xác thực, phân tích cú pháp token sử dụng, và lấy điểm cuối hạn ngạch cho các bề mặt sử dụng
- `moonshot`: transport chia sẻ, chuẩn hóa payload suy nghĩ do plugin sở hữu
- `kilocode`: transport chia sẻ, headers yêu cầu do plugin sở hữu, chuẩn hóa payload lý luận, gợi ý transcript Gemini, và chính sách cache-TTL
- `zai`: GLM-5 forward-compat fallback, mặc định `tool_stream`, chính sách cache-TTL, chính sách mô hình suy nghĩ nhị phân/live, và xác thực sử dụng + lấy hạn ngạch
- `mistral`, `opencode`, và `opencode-go`: metadata khả năng do plugin sở hữu
- `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`,
  `modelstudio`, `nvidia`, `qianfan`, `synthetic`, `together`, `venice`,
  `vercel-ai-gateway`, và `volcengine`: chỉ có danh mục do plugin sở hữu
- `qwen-portal`: danh mục do plugin sở hữu, đăng nhập OAuth, và làm mới OAuth
- `minimax` và `xiaomi`: danh mục do plugin sở hữu cộng với logic xác thực/snapshot sử dụng

Plugin `openai` đi kèm hiện sở hữu cả hai id nhà cung cấp: `openai` và
`openai-codex`.

Điều đó bao gồm các nhà cung cấp vẫn phù hợp với các transport thông thường của OpenClaw. Một nhà cung cấp cần một executor yêu cầu hoàn toàn tùy chỉnh là một bề mặt mở rộng sâu hơn.

## Xoay vòng API key

- Hỗ trợ xoay vòng nhà cung cấp chung cho các nhà cung cấp đã chọn.
- Cấu hình nhiều key qua:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (ghi đè trực tiếp, ưu tiên cao nhất)
  - `<PROVIDER>_API_KEYS` (danh sách phân tách bằng dấu phẩy hoặc chấm phẩy)
  - `<PROVIDER>_API_KEY` (key chính)
  - `<PROVIDER>_API_KEY_*` (danh sách đánh số, ví dụ: `<PROVIDER>_API_KEY_1`)
- Đối với các nhà cung cấp Google, `GOOGLE_API_KEY` cũng được bao gồm như một phương án dự phòng.
- Thứ tự chọn key bảo toàn ưu tiên và loại bỏ các giá trị trùng lặp.
- Các yêu cầu được thử lại với key tiếp theo chỉ khi gặp phản hồi giới hạn tốc độ (ví dụ: `429`, `rate_limit`, `quota`, `resource exhausted`).
- Các lỗi không phải giới hạn tốc độ sẽ thất bại ngay lập tức; không có xoay vòng key nào được thực hiện.
- Khi tất cả các key ứng viên thất bại, lỗi cuối cùng sẽ được trả về từ lần thử cuối cùng.

## Nhà cung cấp tích hợp sẵn (danh mục pi-ai)

OpenClaw đi kèm với danh mục pi‑ai. Các nhà cung cấp này không yêu cầu cấu hình `models.providers`; chỉ cần thiết lập xác thực + chọn một mô hình.

### OpenAI

- Nhà cung cấp: `openai`
- Xác thực: `OPENAI_API_KEY`
- Xoay vòng tùy chọn: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, cộng với `OPENCLAW_LIVE_OPENAI_KEY` (ghi đè trực tiếp)
- Mô hình ví dụ: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transport mặc định là `auto` (ưu tiên WebSocket, dự phòng SSE)
- Ghi đè theo mô hình qua `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, hoặc `"auto"`)
- OpenAI Responses WebSocket warm-up mặc định được bật qua `params.openaiWsWarmup` (`true`/`false`)
- Xử lý ưu tiên OpenAI có thể được bật qua `agents.defaults.models["openai/<model>"].params.serviceTier`
- Chế độ nhanh OpenAI có thể được bật theo mô hình qua `agents.defaults.models["<provider>/<model>"].params.fastMode`
- `openai/gpt-5.3-codex-spark` bị ức chế trong OpenClaw vì API OpenAI trực tiếp từ chối nó; Spark được coi là chỉ dành cho Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Nhà cung cấp: `anthropic`
- Xác thực: `ANTHROPIC_API_KEY` hoặc `claude setup-token`
- Xoay vòng tùy chọn: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, cộng với `OPENCLAW_LIVE_ANTHROPIC_KEY` (ghi đè trực tiếp)
- Mô hình ví dụ: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice token` (dán setup-token) hoặc `openclaw models auth paste-token --provider anthropic`
- Các mô hình API-key trực tiếp hỗ trợ chuyển đổi `/fast` chia sẻ và `params.fastMode`; OpenClaw ánh xạ điều đó tới Anthropic `service_tier` (`auto` so với `standard_only`)
- Lưu ý chính sách: hỗ trợ setup-token là khả năng kỹ thuật; Anthropic đã chặn một số sử dụng đăng ký ngoài Claude Code trong quá khứ. Xác minh các điều khoản hiện tại của Anthropic và quyết định dựa trên mức độ chấp nhận rủi ro của bạn.
- Khuyến nghị: xác thực API key Anthropic là con đường an toàn hơn, được khuyến nghị hơn so với xác thực setup-token đăng ký.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Nhà cung cấp: `openai-codex`
- Xác thực: OAuth (ChatGPT)
- Mô hình ví dụ: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` hoặc `openclaw models auth login --provider openai-codex`
- Transport mặc định là `auto` (ưu tiên WebSocket, dự phòng SSE)
- Ghi đè theo mô hình qua `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, hoặc `"auto"`)
- Chia sẻ cùng chuyển đổi `/fast` và cấu hình `params.fastMode` như `openai/*` trực tiếp
- `openai-codex/gpt-5.3-codex-spark` vẫn có sẵn khi danh mục OAuth Codex tiết lộ nó; phụ thuộc vào quyền lợi
- Lưu ý chính sách: OAuth OpenAI Codex được hỗ trợ rõ ràng cho các công cụ/quy trình làm việc bên ngoài như OpenClaw.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

### OpenCode

- Xác thực: `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`)
- Nhà cung cấp runtime Zen: `opencode`
- Nhà cung cấp runtime Go: `opencode-go`
- Mô hình ví dụ: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` hoặc `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Nhà cung cấp: `google`
- Xác thực: `GEMINI_API_KEY`
- Xoay vòng tùy chọn: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` dự phòng, và `OPENCLAW_LIVE_GEMINI_KEY` (ghi đè trực tiếp)
- Mô hình ví dụ: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Tương thích: cấu hình OpenClaw cũ sử dụng `google/gemini-3.1-flash-preview` được chuẩn hóa thành `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`

### Google Vertex và Gemini CLI

- Nhà cung cấp: `google-vertex`, `google-gemini-cli`
- Xác thực: Vertex sử dụng gcloud ADC; Gemini CLI sử dụng luồng OAuth của nó
- Cẩn trọng: OAuth Gemini CLI trong OpenClaw là một tích hợp không chính thức. Một số người dùng đã báo cáo hạn chế tài khoản Google sau khi sử dụng các khách hàng bên thứ ba. Xem xét các điều khoản của Google và sử dụng tài khoản không quan trọng nếu bạn chọn tiếp tục.
- OAuth Gemini CLI được cung cấp như một phần của plugin `google` đi kèm.
  - Bật: `openclaw plugins enable google`
  - Đăng nhập: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Lưu ý: bạn **không** dán một id khách hàng hoặc bí mật vào `openclaw.json`. Luồng đăng nhập CLI lưu trữ
    token trong hồ sơ xác thực trên máy chủ gateway.

### Z.AI (GLM)

- Nhà cung cấp: `zai`
- Xác thực: `ZAI_API_KEY`
- Mô hình ví dụ: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Bí danh: `z.ai/*` và `z-ai/*` chuẩn hóa thành `zai/*`

### Vercel AI Gateway

- Nhà cung cấp: `vercel-ai-gateway`
- Xác thực: `AI_GATEWAY_API_KEY`
- Mô hình ví dụ: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Nhà cung cấp: `kilocode`
- Xác thực: `KILOCODE_API_KEY`
- Mô hình ví dụ: `kilocode/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --kilocode-api-key <key>`
- URL cơ sở: `https://api.kilo.ai/api/gateway/`
- Danh mục tích hợp mở rộng bao gồm GLM-5 Free, MiniMax M2.5 Free, GPT-5.2, Gemini 3 Pro Preview, Gemini 3 Flash Preview, Grok Code Fast 1, và Kimi K2.5.

Xem [/providers/kilocode](/providers/kilocode) để biết chi tiết thiết lập.

### Các plugin nhà cung cấp đi kèm khác

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Mô hình ví dụ: `openrouter/anthropic/claude-sonnet-4-6`
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Mô hình ví dụ: `kilocode/anthropic/claude-opus-4.6`
- MiniMax: `minimax` (`MINIMAX_API_KEY`)
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Kimi Coding: `kimi-coding` (`KIMI_API_KEY` hoặc `KIMICODE_API_KEY`)
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Model Studio: `modelstudio` (`MODELSTUDIO_API_KEY`)
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Together: `together` (`TOGETHER_API_KEY`)
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` hoặc `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- xAI: `xai` (`XAI_API_KEY`)
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Mô hình ví dụ: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Các mô hình GLM trên Cerebras sử dụng id `zai-glm-4.7` và `zai-glm-4.6`.
  - URL cơ sở tương thích với OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Mô hình ví dụ Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Xem [Hugging Face (Inference)](/providers/huggingface).

## Nhà cung cấp qua `models.providers` (URL tùy chỉnh/cơ sở)

Sử dụng `models.providers` (hoặc `models.json`) để thêm các nhà cung cấp **tùy chỉnh** hoặc
proxy tương thích với OpenAI/Anthropic.

Nhiều plugin nhà cung cấp đi kèm dưới đây đã xuất bản một danh mục mặc định.
Chỉ sử dụng các mục `models.providers.<id>` rõ ràng khi bạn muốn ghi đè
URL cơ sở, headers, hoặc danh sách mô hình mặc định.

### Moonshot AI (Kimi)

Moonshot sử dụng các điểm cuối tương thích với OpenAI, vì vậy hãy cấu hình nó như một nhà cung cấp tùy chỉnh:

- Nhà cung cấp: `moonshot`
- Xác thực: `MOONSHOT_API_KEY`
- Mô hình ví dụ: `moonshot/kimi-k2.5`

ID mô hình Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-0905-preview`
- `moonshot/kimi-k2-turbo-preview`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding sử dụng điểm cuối tương thích với Anthropic của Moonshot AI:

- Nhà cung cấp: `kimi-coding`
- Xác thực: `KIMI_API_KEY`
- Mô hình ví dụ: `kimi-coding/k2p5`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi-coding/k2p5" } },
  },
}
```

### Qwen OAuth (miễn phí)

Qwen cung cấp quyền truy cập OAuth vào Qwen Coder + Vision qua luồng mã thiết bị.
Plugin nhà cung cấp đi kèm được bật theo mặc định, vì vậy chỉ cần đăng nhập:

```bash
openclaw models auth login --provider qwen-portal --set-default
```

Tham chiếu mô hình:

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

Xem [/providers/qwen](/providers/qwen) để biết chi tiết thiết lập và ghi chú.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) cung cấp quyền truy cập vào Doubao và các mô hình khác ở Trung Quốc.

- Nhà cung cấp: `volcengine` (coding: `volcengine-plan`)
- Xác thực: `VOLCANO_ENGINE_API_KEY`
- Mô hình ví dụ: `volcengine/doubao-seed-1-8-251228`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine/doubao-seed-1-8-251228" } },
  },
}
```

Các mô hình có sẵn:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Mô hình coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (Quốc tế)

BytePlus ARK cung cấp quyền truy cập vào các mô hình tương tự như Volcano Engine cho người dùng quốc tế.

- Nhà cung cấp: `byteplus` (coding: `byteplus-plan`)
- Xác thực: `BYTEPLUS_API_KEY`
- Mô hình ví dụ: `byteplus/seed-1-8-251228`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus/seed-1-8-251228" } },
  },
}
```

Các mô hình có sẵn:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Mô hình coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic cung cấp các mô hình tương thích với Anthropic thông qua nhà cung cấp `synthetic`:

- Nhà cung cấp: `synthetic`
- Xác thực: `SYNTHETIC_API_KEY`
- Mô hình ví dụ: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax được cấu hình qua `models.providers` vì nó sử dụng các điểm cuối tùy chỉnh:

- MiniMax (tương thích với Anthropic): `--auth-choice minimax-api`
- Xác thực: `MINIMAX_API_KEY`

Xem [/providers/minimax](/providers/minimax) để biết chi tiết thiết lập, tùy chọn mô hình, và đoạn mã cấu hình.

### Ollama

Ollama được cung cấp dưới dạng plugin nhà cung cấp đi kèm và sử dụng API gốc của Ollama:

- Nhà cung cấp: `ollama`
- Xác thực: Không yêu cầu (máy chủ cục bộ)
- Mô hình ví dụ: `ollama/llama3.3`
- Cài đặt: [https://ollama.com/download](https://ollama.com/download)

```bash
# Cài đặt Ollama, sau đó kéo một mô hình:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama được phát hiện cục bộ tại `http://127.0.0.1:11434` khi bạn chọn tham gia với
`OLLAMA_API_KEY`, và plugin nhà cung cấp đi kèm thêm Ollama trực tiếp vào
`openclaw onboard` và bộ chọn mô hình. Xem [/providers/ollama](/providers/ollama)
để biết thông tin về onboarding, chế độ đám mây/cục bộ, và cấu hình tùy chỉnh.

### vLLM

vLLM được cung cấp dưới dạng plugin nhà cung cấp đi kèm cho các máy chủ tương thích với OpenAI cục bộ/tự lưu trữ:

- Nhà cung cấp: `vllm`
- Xác thực: Tùy chọn (phụ thuộc vào máy chủ của bạn)
- URL cơ sở mặc định: `http://127.0.0.1:8000/v1`

Để chọn tham gia tự động phát hiện cục bộ (bất kỳ giá trị nào cũng hoạt động nếu máy chủ của bạn không thực thi xác thực):

```bash
export VLLM_API_KEY="vllm-local"
```

Sau đó thiết lập một mô hình (thay thế bằng một trong các ID được trả về bởi `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Xem [/providers/vllm](/providers/vllm) để biết chi tiết.

### SGLang

SGLang được cung cấp dưới dạng plugin nhà cung cấp đi kèm cho các máy chủ tương thích với OpenAI tự lưu trữ nhanh:

- Nhà cung cấp: `sglang`
- Xác thực: Tùy chọn (phụ thuộc vào máy chủ của bạn)
- URL cơ sở mặc định: `http://127.0.0.1:30000/v1`

Để chọn tham gia tự động phát hiện cục bộ (bất kỳ giá trị nào cũng hoạt động nếu máy chủ của bạn không
thực thi xác thực):

```bash
export SGLANG_API_KEY="sglang-local"
```

Sau đó thiết lập một mô hình (thay thế bằng một trong các ID được trả về bởi `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Xem [/providers/sglang](/providers/sglang) để biết chi tiết.

### Proxy cục bộ (LM Studio, vLLM, LiteLLM, v.v.)

Ví dụ (tương thích với OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.5-gs32" },
      models: { "lmstudio/minimax-m2.5-gs32": { alias: "Minimax" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "LMSTUDIO_KEY",
        api: "openai-completions",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Ghi chú:

- Đối với các nhà cung cấp tùy chỉnh, `reasoning`, `input`, `cost`, `contextWindow`, và `maxTokens` là tùy chọn.
  Khi bỏ qua, OpenClaw mặc định:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Khuyến nghị: đặt các giá trị rõ ràng phù hợp với giới hạn proxy/mô hình của bạn.
- Đối với `api: "openai-completions"` trên các điểm cuối không gốc (bất kỳ `baseUrl` không trống nào mà máy chủ không phải là `api.openai.com`), OpenClaw buộc `compat.supportsDeveloperRole: false` để tránh lỗi 400 của nhà cung cấp cho các vai trò `developer` không được hỗ trợ.
- Nếu `baseUrl` trống/bỏ qua, OpenClaw giữ hành vi OpenAI mặc định (giải quyết thành `api.openai.com`).
- Để an toàn, một `compat.supportsDeveloperRole: true` rõ ràng vẫn bị ghi đè trên các điểm cuối `openai-completions` không gốc.

## Ví dụ CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Xem thêm: [/gateway/configuration](/gateway/configuration) để biết các ví dụ cấu hình đầy đủ.
