# Models CLI

Xem thêm [/concepts/model-failover](/concepts/model-failover) để hiểu về luân phiên auth profile, cooldowns và cách hoạt động với fallbacks. Tổng quan về provider và ví dụ: [/concepts/model-providers](/concepts/model-providers).

## Cách chọn model

OpenClaw chọn model theo thứ tự:

1. **Primary** model (`agents.defaults.model.primary` hoặc `agents.defaults.model`).
2. **Fallbacks** trong `agents.defaults.model.fallbacks` (theo thứ tự).
3. **Provider auth failover** diễn ra trong một provider trước khi chuyển sang model tiếp theo.

Liên quan:

- `agents.defaults.models` là danh sách cho phép/catalog của các model OpenClaw có thể dùng (cộng với aliases).
- `agents.defaults.imageModel` chỉ dùng khi primary model không nhận ảnh.
- `agents.defaults.imageGenerationModel` dùng cho khả năng tạo ảnh chung. Nếu không có, `image_generate` vẫn có thể suy ra provider mặc định từ plugin tạo ảnh có hỗ trợ auth.
- Mặc định từng agent có thể ghi đè `agents.defaults.model` qua `agents.list[].model` và bindings (xem [/concepts/multi-agent](/concepts/multi-agent)).

## Chính sách model nhanh

- Đặt primary model là model mạnh nhất, thế hệ mới nhất có sẵn.
- Dùng fallbacks cho các tác vụ nhạy cảm về chi phí/độ trễ và chat ít quan trọng.
- Với agents có công cụ hoặc đầu vào không tin cậy, tránh các model cũ/yếu hơn.

## Onboarding (khuyến nghị)

Nếu không muốn chỉnh config thủ công, chạy onboarding:

```bash
openclaw onboard
```

Nó có thể thiết lập model + auth cho các provider phổ biến, bao gồm **OpenAI Code (Codex) subscription** (OAuth) và **Anthropic** (API key hoặc `claude setup-token`).

## Các khóa config (tổng quan)

- `agents.defaults.model.primary` và `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` và `agents.defaults.imageModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` và `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.models` (danh sách cho phép + aliases + tham số provider)
- `models.providers` (custom providers viết vào `models.json`)

Model refs được chuẩn hóa thành chữ thường. Aliases provider như `z.ai/*` chuẩn hóa thành `zai/*`.

Ví dụ cấu hình provider (bao gồm OpenCode) có tại [/providers/opencode](/providers/opencode).

## "Model không được phép" (và tại sao không có phản hồi)

Nếu `agents.defaults.models` được thiết lập, nó trở thành **danh sách cho phép** cho `/model` và cho các ghi đè session. Khi người dùng chọn model không có trong danh sách đó, OpenClaw trả về:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Điều này xảy ra **trước khi** tạo phản hồi bình thường, nên có thể cảm giác như "không phản hồi". Cách khắc phục:

- Thêm model vào `agents.defaults.models`, hoặc
- Xóa danh sách cho phép (gỡ `agents.defaults.models`), hoặc
- Chọn model từ `/model list`.

Ví dụ cấu hình danh sách cho phép:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Chuyển đổi model trong chat (`/model`)

Có thể chuyển đổi model cho session hiện tại mà không cần khởi động lại:

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model status
```

Ghi chú:

- `/model` (và `/model list`) là picker gọn, có đánh số (model family + providers có sẵn).
- Trên Discord, `/model` và `/models` mở picker tương tác với dropdown provider và model cùng bước Submit.
- `/model <#>` chọn từ picker đó.
- `/model status` là chế độ xem chi tiết (ứng viên auth và, khi cấu hình, endpoint provider `baseUrl` + chế độ `api`).
- Model refs được phân tích bằng cách tách trên **dấu** `/` đầu tiên. Dùng `provider/model` khi nhập `/model <ref>`.
- Nếu ID model chứa `/` (kiểu OpenRouter), phải bao gồm prefix provider (ví dụ: `/model openrouter/moonshotai/kimi-k2`).
- Nếu bỏ qua provider, OpenClaw coi đầu vào là alias hoặc model cho **provider mặc định** (chỉ hoạt động khi không có `/` trong ID model).

Hành vi/lệnh đầy đủ: [Slash commands](/tools/slash-commands).

## Lệnh CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (không có subcommand) là shortcut cho `models status`.

### `models list`

Hiển thị các model đã cấu hình mặc định. Các flag hữu ích:

- `--all`: catalog đầy đủ
- `--local`: chỉ providers local
- `--provider <name>`: lọc theo provider
- `--plain`: mỗi model một dòng
- `--json`: output dạng máy đọc được

### `models status`

Hiển thị model primary đã giải quyết, fallbacks, image model và tổng quan auth của các provider đã cấu hình. Cũng hiển thị trạng thái hết hạn OAuth cho các profile tìm thấy trong auth store (cảnh báo trong vòng 24h mặc định). `--plain` chỉ in model primary đã giải quyết.
Trạng thái OAuth luôn được hiển thị (và bao gồm trong output `--json`). Nếu một provider đã cấu hình không có credentials, `models status` in phần **Missing auth**.
JSON bao gồm `auth.oauth` (cửa sổ cảnh báo + profiles) và `auth.providers` (auth hiệu quả theo provider).
Dùng `--check` cho tự động hóa (exit `1` khi thiếu/hết hạn, `2` khi sắp hết hạn).

Lựa chọn auth phụ thuộc vào provider/account. Với các host gateway luôn bật, API keys thường là dự đoán nhất; luồng token subscription cũng được hỗ trợ.

Ví dụ (Anthropic setup-token):

```bash
claude setup-token
openclaw models status
```

## Quét (OpenRouter free models)

`openclaw models scan` kiểm tra **catalog model miễn phí** của OpenRouter và có thể tùy chọn kiểm tra model hỗ trợ công cụ và ảnh.

Các flag chính:

- `--no-probe`: bỏ qua kiểm tra trực tiếp (chỉ metadata)
- `--min-params <b>`: kích thước tham số tối thiểu (tỷ)
- `--max-age-days <days>`: bỏ qua các model cũ hơn
- `--provider <name>`: lọc prefix provider
- `--max-candidates <n>`: kích thước danh sách fallback
- `--set-default`: đặt `agents.defaults.model.primary` thành lựa chọn đầu tiên
- `--set-image`: đặt `agents.defaults.imageModel.primary` thành lựa chọn ảnh đầu tiên

Kiểm tra yêu cầu OpenRouter API key (từ auth profiles hoặc `OPENROUTER_API_KEY`). Không có key, dùng `--no-probe` để chỉ liệt kê ứng viên.

Kết quả quét được xếp hạng theo:

1. Hỗ trợ ảnh
2. Độ trễ công cụ
3. Kích thước ngữ cảnh
4. Số lượng tham số

Đầu vào

- Danh sách OpenRouter `/models` (lọc `:free`)
- Yêu cầu OpenRouter API key từ auth profiles hoặc `OPENROUTER_API_KEY` (xem [/environment](/help/environment))
- Bộ lọc tùy chọn: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kiểm soát kiểm tra: `--timeout`, `--concurrency`

Khi chạy trong TTY, có thể chọn fallbacks tương tác. Trong chế độ không tương tác, truyền `--yes` để chấp nhận mặc định.

## Models registry (`models.json`)

Custom providers trong `models.providers` được viết vào `models.json` dưới thư mục agent (mặc định `~/.openclaw/agents/<agentId>/agent/models.json`). File này được merge mặc định trừ khi `models.mode` được đặt thành `replace`.

Thứ tự ưu tiên merge cho các ID provider khớp:

- `baseUrl` không rỗng đã có trong `models.json` của agent thắng.
- `apiKey` không rỗng trong `models.json` của agent thắng chỉ khi provider đó không được quản lý SecretRef trong ngữ cảnh config/auth-profile hiện tại.
- Giá trị `apiKey` của provider được quản lý SecretRef được làm mới từ các marker nguồn (`ENV_VAR_NAME` cho env refs, `secretref-managed` cho file/exec refs) thay vì lưu trữ các secrets đã giải quyết.
- Giá trị header của provider được quản lý SecretRef được làm mới từ các marker nguồn (`secretref-env:ENV_VAR_NAME` cho env refs, `secretref-managed` cho file/exec refs).
- `apiKey`/`baseUrl` rỗng hoặc thiếu của agent sẽ quay về config `models.providers`.
- Các trường provider khác được làm mới từ config và dữ liệu catalog chuẩn hóa.

Sự tồn tại của marker là nguồn gốc: OpenClaw ghi các marker từ snapshot config nguồn hoạt động (trước khi giải quyết), không phải từ các giá trị secret runtime đã giải quyết.
Điều này áp dụng bất cứ khi nào OpenClaw tái tạo `models.json`, bao gồm các đường dẫn điều khiển bằng lệnh như `openclaw agent`.\n