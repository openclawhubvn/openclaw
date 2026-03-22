---
summary: "Tham khảo CLI cho `openclaw models` (trạng thái/danh sách/thiết lập/quét, bí danh, dự phòng, xác thực)"
read_when:
  - Bạn muốn thay đổi mô hình mặc định hoặc xem trạng thái xác thực của nhà cung cấp
  - Bạn muốn quét các mô hình/nhà cung cấp có sẵn và gỡ lỗi hồ sơ xác thực
title: "models"
---

# `openclaw models`

Khám phá, quét và cấu hình mô hình (mô hình mặc định, dự phòng, hồ sơ xác thực).

Liên quan:

- Nhà cung cấp + mô hình: [Models](/providers/models)
- Thiết lập xác thực nhà cung cấp: [Bắt đầu](/start/getting-started)

## Lệnh thông dụng

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` hiển thị mô hình mặc định/dự phòng đã được giải quyết cùng với tổng quan về xác thực.
Khi có sẵn ảnh chụp nhanh sử dụng của nhà cung cấp, phần trạng thái OAuth/token sẽ bao gồm tiêu đề sử dụng của nhà cung cấp.
Thêm `--probe` để chạy kiểm tra xác thực trực tiếp với từng hồ sơ nhà cung cấp đã cấu hình.
Kiểm tra là các yêu cầu thực tế (có thể tiêu thụ token và kích hoạt giới hạn tốc độ).
Sử dụng `--agent <id>` để kiểm tra trạng thái mô hình/xác thực của một agent đã cấu hình. Nếu không chỉ định, lệnh sẽ sử dụng `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` nếu có, nếu không sẽ dùng agent mặc định đã cấu hình.

Lưu ý:

- `models set <model-or-alias>` chấp nhận `provider/model` hoặc một bí danh.
- Tham chiếu mô hình được phân tích bằng cách tách tại dấu `/` **đầu tiên**. Nếu ID mô hình bao gồm `/` (kiểu OpenRouter), hãy bao gồm tiền tố nhà cung cấp (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua nhà cung cấp, OpenClaw sẽ coi đầu vào là một bí danh hoặc một mô hình cho **nhà cung cấp mặc định** (chỉ hoạt động khi không có `/` trong ID mô hình).
- `models status` có thể hiển thị `marker(<value>)` trong đầu ra xác thực cho các giá trị giữ chỗ không bí mật (ví dụ `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `qwen-oauth`, `ollama-local`) thay vì che giấu chúng như bí mật.

### `models status`

Tùy chọn:

- `--json`
- `--plain`
- `--check` (thoát 1=hết hạn/thiếu, 2=sắp hết hạn)
- `--probe` (kiểm tra trực tiếp hồ sơ xác thực đã cấu hình)
- `--probe-provider <name>` (kiểm tra một nhà cung cấp)
- `--probe-profile <id>` (lặp lại hoặc danh sách id hồ sơ cách nhau bằng dấu phẩy)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agent đã cấu hình; ghi đè `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

## Bí danh + dự phòng

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Hồ sơ xác thực

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token
openclaw models auth paste-token
```

`models auth login` chạy luồng xác thực của plugin nhà cung cấp (OAuth/API key). Sử dụng
`openclaw plugins list` để xem nhà cung cấp nào đã được cài đặt.

Lưu ý:

- `setup-token` yêu cầu nhập giá trị setup-token (tạo nó bằng `claude setup-token` trên bất kỳ máy nào).
- `paste-token` chấp nhận một chuỗi token được tạo ở nơi khác hoặc từ tự động hóa.
- Lưu ý chính sách của Anthropic: hỗ trợ setup-token là tương thích kỹ thuật. Anthropic đã chặn một số sử dụng đăng ký ngoài Claude Code trong quá khứ, vì vậy hãy xác minh điều khoản hiện tại trước khi sử dụng rộng rãi.
