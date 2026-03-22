# `openclaw models`

Khám phá, quét và cấu hình model (model mặc định, fallbacks, auth profiles).

Liên quan:

- Providers + models: [Models](/providers/models)
- Cài đặt auth provider: [Getting started](/start/getting-started)

## Lệnh thường dùng

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` hiển thị model mặc định/fallbacks đã được giải quyết và tổng quan auth.
Khi có snapshot sử dụng provider, phần trạng thái OAuth/token sẽ bao gồm header sử dụng provider.
Thêm `--probe` để chạy kiểm tra auth trực tiếp với từng profile provider đã cấu hình.
Kiểm tra này là request thực (có thể tiêu tốn token và kích hoạt giới hạn tốc độ).
Dùng `--agent <id>` để kiểm tra trạng thái model/auth của agent đã cấu hình. Nếu không chỉ định,
lệnh sẽ dùng `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` nếu có, nếu không sẽ dùng agent mặc định đã cấu hình.

Ghi chú:

- `models set <model-or-alias>` chấp nhận `provider/model` hoặc alias.
- Model refs được phân tích bằng cách tách tại **dấu `/` đầu tiên**. Nếu model ID có chứa `/` (kiểu OpenRouter), cần thêm tiền tố provider (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu không chỉ định provider, OpenClaw sẽ coi input là alias hoặc model cho **provider mặc định** (chỉ hoạt động khi không có `/` trong model ID).
- `models status` có thể hiển thị `marker(<value>)` trong output auth cho các placeholder không phải bí mật (ví dụ `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `qwen-oauth`, `ollama-local`) thay vì che giấu chúng như bí mật.

### `models status`

Tùy chọn:

- `--json`
- `--plain`
- `--check` (exit 1=hết hạn/thiếu, 2=sắp hết hạn)
- `--probe` (kiểm tra trực tiếp các profile auth đã cấu hình)
- `--probe-provider <name>` (kiểm tra một provider)
- `--probe-profile <id>` (lặp lại hoặc danh sách id profile cách nhau bằng dấu phẩy)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agent đã cấu hình; ghi đè `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

## Aliases + fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Auth profiles

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token
openclaw models auth paste-token
```

`models auth login` chạy luồng auth của plugin provider (OAuth/API key). Dùng
`openclaw plugins list` để xem các provider đã cài đặt.

Ghi chú:

- `setup-token` yêu cầu nhập giá trị setup-token (tạo bằng `claude setup-token` trên bất kỳ máy nào).
- `paste-token` chấp nhận chuỗi token được tạo ở nơi khác hoặc từ tự động hóa.
- Lưu ý chính sách Anthropic: hỗ trợ setup-token là tương thích kỹ thuật. Anthropic đã chặn một số sử dụng subscription ngoài Claude Code trước đây, nên kiểm tra điều khoản hiện tại trước khi sử dụng rộng rãi.\n