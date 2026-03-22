# CLI Models

Xem thêm tại [/concepts/model-failover](/concepts/model-failover) để biết về việc xoay vòng hồ sơ xác thực, thời gian chờ và cách chúng tương tác với các phương án dự phòng. Tổng quan nhanh về nhà cung cấp và ví dụ: [/concepts/model-providers](/concepts/model-providers).

## Cách chọn mô hình

OpenClaw chọn mô hình theo thứ tự sau:

1. Mô hình **Chính** (`agents.defaults.model.primary` hoặc `agents.defaults.model`).
2. Các mô hình **Dự phòng** trong `agents.defaults.model.fallbacks` (theo thứ tự).
3. **Chuyển đổi xác thực nhà cung cấp** xảy ra trong một nhà cung cấp trước khi chuyển sang mô hình tiếp theo.

Liên quan:

- `agents.defaults.models` là danh sách cho phép/danh mục các mô hình mà OpenClaw có thể sử dụng (cộng với các bí danh).
- `agents.defaults.imageModel` chỉ được sử dụng **khi** mô hình chính không thể chấp nhận hình ảnh.
- `agents.defaults.imageGenerationModel` được sử dụng bởi khả năng tạo hình ảnh chia sẻ. Nếu không có, `image_generate` vẫn có thể suy ra mặc định nhà cung cấp từ các plugin tạo hình ảnh có xác thực tương thích.
- Mặc định theo từng agent có thể ghi đè `agents.defaults.model` thông qua `agents.list[].model` cộng với ràng buộc (xem [/concepts/multi-agent](/concepts/multi-agent)).

## Chính sách mô hình nhanh

- Đặt mô hình chính của bạn là mô hình thế hệ mới mạnh nhất có sẵn.
- Sử dụng dự phòng cho các tác vụ nhạy cảm về chi phí/độ trễ và trò chuyện ít quan trọng hơn.
- Đối với các agent có công cụ hoặc đầu vào không đáng tin cậy, tránh các mô hình cũ/yếu hơn.

## Hướng dẫn khởi động (khuyến nghị)

Nếu không muốn chỉnh sửa cấu hình bằng tay, hãy chạy hướng dẫn khởi động:

```bash
openclaw onboard
```

Nó có thể thiết lập mô hình + xác thực cho các nhà cung cấp phổ biến, bao gồm **OpenAI Code (Codex) subscription** (OAuth) và **Anthropic** (API key hoặc `claude setup-token`).

## Các khóa cấu hình (tổng quan)

- `agents.defaults.model.primary` và `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` và `agents.defaults.imageModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` và `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.models` (danh sách cho phép + bí danh + tham số nhà cung cấp)
- `models.providers` (nhà cung cấp tùy chỉnh được ghi vào `models.json`)

Tham chiếu mô hình được chuẩn hóa thành chữ thường. Bí danh nhà cung cấp như `z.ai/*` chuẩn hóa thành `zai/*`.

Ví dụ cấu hình nhà cung cấp (bao gồm OpenCode) có tại [/providers/opencode](/providers/opencode).

## "Mô hình không được phép" (và lý do phản hồi dừng)

Nếu `agents.defaults.models` được thiết lập, nó trở thành **danh sách cho phép** cho `/model` và cho các ghi đè phiên. Khi người dùng chọn một mô hình không có trong danh sách cho phép đó, OpenClaw trả về:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Điều này xảy ra **trước khi** một phản hồi bình thường được tạo ra, vì vậy thông điệp có thể cảm thấy như nó "không phản hồi." Cách khắc phục là:

- Thêm mô hình vào `agents.defaults.models`, hoặc
- Xóa danh sách cho phép (loại bỏ `agents.defaults.models`), hoặc
- Chọn một mô hình từ `/model list`.

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

## Chuyển đổi mô hình trong chat (`/model`)

Bạn có thể chuyển đổi mô hình cho phiên hiện tại mà không cần khởi động lại:

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model status
```

Ghi chú:

- `/model` (và `/model list`) là một bộ chọn nhỏ gọn, có đánh số (gia đình mô hình + nhà cung cấp có sẵn).
- Trên Discord, `/model` và `/models` mở một bộ chọn tương tác với các danh sách thả xuống nhà cung cấp và mô hình cùng với bước Gửi.
- `/model <#>` chọn từ bộ chọn đó.
- `/model status` là chế độ xem chi tiết (ứng viên xác thực và, khi được cấu hình, điểm cuối nhà cung cấp `baseUrl` + chế độ `api`).
- Tham chiếu mô hình được phân tích bằng cách tách trên `/` **đầu tiên**. Sử dụng `provider/model` khi nhập `/model <ref>`.
- Nếu ID mô hình tự nó chứa `/` (kiểu OpenRouter), bạn phải bao gồm tiền tố nhà cung cấp (ví dụ: `/model openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua nhà cung cấp, OpenClaw coi đầu vào là một bí danh hoặc một mô hình cho **nhà cung cấp mặc định** (chỉ hoạt động khi không có `/` trong ID mô hình).

Hành vi/lệnh cấu hình đầy đủ: [Slash commands](/tools/slash-commands).

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

`openclaw models` (không có lệnh con) là một phím tắt cho `models status`.

### `models list`

Hiển thị các mô hình đã cấu hình theo mặc định. Các cờ hữu ích:

- `--all`: danh mục đầy đủ
- `--local`: chỉ các nhà cung cấp địa phương
- `--provider <name>`: lọc theo nhà cung cấp
- `--plain`: một mô hình mỗi dòng
- `--json`: đầu ra có thể đọc được bằng máy

### `models status`

Hiển thị mô hình chính đã được giải quyết, các mô hình dự phòng, mô hình hình ảnh và tổng quan xác thực của các nhà cung cấp đã cấu hình. Nó cũng hiển thị trạng thái hết hạn OAuth cho các hồ sơ tìm thấy trong kho lưu trữ xác thực (cảnh báo trong vòng 24 giờ theo mặc định). `--plain` chỉ in mô hình chính đã được giải quyết.
Trạng thái OAuth luôn được hiển thị (và bao gồm trong đầu ra `--json`). Nếu một nhà cung cấp đã cấu hình không có thông tin xác thực, `models status` sẽ in một phần **Thiếu xác thực**.
JSON bao gồm `auth.oauth` (cửa sổ cảnh báo + hồ sơ) và `auth.providers` (xác thực hiệu quả cho mỗi nhà cung cấp).
Sử dụng `--check` cho tự động hóa (thoát `1` khi thiếu/hết hạn, `2` khi sắp hết hạn).

Lựa chọn xác thực phụ thuộc vào nhà cung cấp/tài khoản. Đối với các máy chủ cổng luôn bật, khóa API thường là lựa chọn dự đoán nhất; các luồng token đăng ký cũng được hỗ trợ.

Ví dụ (Anthropic setup-token):

```bash
claude setup-token
openclaw models status
```

## Quét (mô hình miễn phí OpenRouter)

`openclaw models scan` kiểm tra **danh mục mô hình miễn phí** của OpenRouter và có thể tùy chọn thăm dò các mô hình để hỗ trợ công cụ và hình ảnh.

Các cờ chính:

- `--no-probe`: bỏ qua thăm dò trực tiếp (chỉ metadata)
- `--min-params <b>`: kích thước tham số tối thiểu (tỷ)
- `--max-age-days <days>`: bỏ qua các mô hình cũ hơn
- `--provider <name>`: lọc tiền tố nhà cung cấp
- `--max-candidates <n>`: kích thước danh sách dự phòng
- `--set-default`: đặt `agents.defaults.model.primary` thành lựa chọn đầu tiên
- `--set-image`: đặt `agents.defaults.imageModel.primary` thành lựa chọn hình ảnh đầu tiên

Thăm dò yêu cầu khóa API OpenRouter (từ hồ sơ xác thực hoặc `OPENROUTER_API_KEY`). Không có khóa, sử dụng `--no-probe` để chỉ liệt kê các ứng viên.

Kết quả quét được xếp hạng theo:

1. Hỗ trợ hình ảnh
2. Độ trễ công cụ
3. Kích thước ngữ cảnh
4. Số lượng tham số

Đầu vào

- Danh sách OpenRouter `/models` (lọc `:free`)
- Yêu cầu khóa API OpenRouter từ hồ sơ xác thực hoặc `OPENROUTER_API_KEY` (xem [/environment](/help/environment))
- Bộ lọc tùy chọn: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kiểm soát thăm dò: `--timeout`, `--concurrency`

Khi chạy trong TTY, bạn có thể chọn dự phòng một cách tương tác. Trong chế độ không tương tác, truyền `--yes` để chấp nhận mặc định.

## Đăng ký mô hình (`models.json`)

Các nhà cung cấp tùy chỉnh trong `models.providers` được ghi vào `models.json` dưới thư mục agent (mặc định `~/.openclaw/agents/<agentId>/agent/models.json`). Tệp này được hợp nhất theo mặc định trừ khi `models.mode` được đặt thành `replace`.

Thứ tự ưu tiên chế độ hợp nhất cho các ID nhà cung cấp khớp:

- `baseUrl` không rỗng đã có trong `models.json` của agent sẽ thắng.
- `apiKey` không rỗng trong `models.json` của agent chỉ thắng khi nhà cung cấp đó không được quản lý bởi SecretRef trong ngữ cảnh cấu hình/hồ sơ xác thực hiện tại.
- Giá trị `apiKey` của nhà cung cấp được quản lý bởi SecretRef được làm mới từ các dấu nguồn (`ENV_VAR_NAME` cho tham chiếu môi trường, `secretref-managed` cho tham chiếu tệp/thực thi) thay vì duy trì các bí mật đã giải quyết.
- Giá trị tiêu đề của nhà cung cấp được quản lý bởi SecretRef được làm mới từ các dấu nguồn (`secretref-env:ENV_VAR_NAME` cho tham chiếu môi trường, `secretref-managed` cho tham chiếu tệp/thực thi).
- `apiKey`/`baseUrl` trống hoặc thiếu của agent sẽ quay lại cấu hình `models.providers`.
- Các trường nhà cung cấp khác được làm mới từ cấu hình và dữ liệu danh mục đã chuẩn hóa.

Dấu hiệu lưu trữ là nguồn gốc: OpenClaw ghi dấu từ ảnh chụp cấu hình nguồn hoạt động (trước khi giải quyết), không phải từ các giá trị bí mật đã giải quyết trong thời gian chạy.
Điều này áp dụng bất cứ khi nào OpenClaw tái tạo `models.json`, bao gồm các đường dẫn điều khiển bằng lệnh như `openclaw agent`.
