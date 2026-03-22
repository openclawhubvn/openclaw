---
summary: "Khám phá cách thiết lập và sử dụng lệnh CLI 'openclaw onboard' để tối ưu hóa tương tác hệ thống."
read_when:
  - Bạn muốn thiết lập có hướng dẫn cho gateway, workspace, xác thực, kênh và kỹ năng
title: "Hướng Dẫn Cấu Hình OpenClaw Onboard"
---

# `openclaw onboard`

Hướng dẫn thiết lập tương tác cho Gateway cục bộ hoặc từ xa.

## Hướng dẫn liên quan

- Trung tâm hướng dẫn CLI: [Onboarding (CLI)](/start/wizard)
- Tổng quan về onboarding: [Tổng quan Onboarding](/start/onboarding-overview)
- Tham khảo thiết lập CLI: [Tham khảo Thiết lập CLI](/start/wizard-cli-reference)
- Tự động hóa CLI: [Tự động hóa CLI](/start/wizard-cli-automation)
- Onboarding trên macOS: [Onboarding (Ứng dụng macOS)](/start/onboarding)

## Ví dụ

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Đối với mục tiêu mạng riêng `ws://` dạng văn bản (chỉ mạng tin cậy), đặt
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trong môi trường quá trình onboarding.

Nhà cung cấp tùy chỉnh không tương tác:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` là tùy chọn trong chế độ không tương tác. Nếu bỏ qua, quá trình onboarding sẽ kiểm tra `CUSTOM_API_KEY`.

Ollama không tương tác:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` mặc định là `http://127.0.0.1:11434`. `--custom-model-id` là tùy chọn; nếu bỏ qua, quá trình onboarding sẽ sử dụng mặc định được đề xuất của Ollama. Các ID mô hình đám mây như `kimi-k2.5:cloud` cũng hoạt động ở đây.

Lưu khóa nhà cung cấp dưới dạng tham chiếu thay vì văn bản:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Với `--secret-input-mode ref`, quá trình onboarding ghi các tham chiếu dựa trên môi trường thay vì các giá trị khóa dạng văn bản.
Đối với các nhà cung cấp dựa trên hồ sơ xác thực, điều này ghi các mục `keyRef`; đối với các nhà cung cấp tùy chỉnh, điều này ghi `models.providers.<id>.apiKey` dưới dạng tham chiếu môi trường (ví dụ `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Hợp đồng chế độ `ref` không tương tác:

- Đặt biến môi trường nhà cung cấp trong môi trường quá trình onboarding (ví dụ `OPENAI_API_KEY`).
- Không truyền các cờ khóa nội tuyến (ví dụ `--openai-api-key`) trừ khi biến môi trường đó cũng được đặt.
- Nếu một cờ khóa nội tuyến được truyền mà không có biến môi trường cần thiết, quá trình onboarding sẽ thất bại nhanh chóng với hướng dẫn.

Tùy chọn token Gateway trong chế độ không tương tác:

- `--gateway-auth token --gateway-token <token>` lưu trữ một token dạng văn bản.
- `--gateway-auth token --gateway-token-ref-env <name>` lưu trữ `gateway.auth.token` dưới dạng SecretRef môi trường.
- `--gateway-token` và `--gateway-token-ref-env` loại trừ lẫn nhau.
- `--gateway-token-ref-env` yêu cầu một biến môi trường không rỗng trong môi trường quá trình onboarding.
- Với `--install-daemon`, khi xác thực token yêu cầu một token, các token Gateway được quản lý bởi SecretRef được xác thực nhưng không được lưu trữ dưới dạng văn bản đã giải quyết trong siêu dữ liệu môi trường dịch vụ giám sát.
- Với `--install-daemon`, nếu chế độ token yêu cầu một token và SecretRef token được cấu hình không được giải quyết, quá trình onboarding sẽ thất bại với hướng dẫn khắc phục.
- Với `--install-daemon`, nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, quá trình onboarding sẽ chặn cài đặt cho đến khi chế độ được đặt rõ ràng.

Ví dụ:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Sức khỏe gateway cục bộ không tương tác:

- Trừ khi bạn truyền `--skip-health`, quá trình onboarding sẽ chờ một gateway cục bộ có thể truy cập trước khi thoát thành công.
- `--install-daemon` bắt đầu đường dẫn cài đặt gateway được quản lý trước. Nếu không có nó, bạn phải có một gateway cục bộ đang chạy, ví dụ `openclaw gateway run`.
- Nếu bạn chỉ muốn ghi cấu hình/workspace/bootstrap trong tự động hóa, sử dụng `--skip-health`.
- Trên Windows gốc, `--install-daemon` thử Scheduled Tasks trước và quay lại một mục đăng nhập thư mục Startup cho từng người dùng nếu việc tạo tác vụ bị từ chối.

Hành vi onboarding tương tác với chế độ tham chiếu:

- Chọn **Sử dụng tham chiếu bí mật** khi được nhắc.
- Sau đó chọn một trong hai:
  - Biến môi trường
  - Nhà cung cấp bí mật đã cấu hình (`file` hoặc `exec`)
- Quá trình onboarding thực hiện xác thực nhanh trước khi lưu tham chiếu.
  - Nếu xác thực thất bại, quá trình onboarding sẽ hiển thị lỗi và cho phép bạn thử lại.

Lựa chọn điểm cuối Z.AI không tương tác:

Lưu ý: `--auth-choice zai-api-key` hiện tự động phát hiện điểm cuối Z.AI tốt nhất cho khóa của bạn (ưu tiên API chung với `zai/glm-5`).
Nếu bạn muốn cụ thể các điểm cuối GLM Coding Plan, chọn `zai-coding-global` hoặc `zai-coding-cn`.

```bash
# Lựa chọn điểm cuối không cần nhắc
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Các lựa chọn điểm cuối Z.AI khác:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Ví dụ Mistral không tương tác:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Ghi chú về luồng:

- `quickstart`: ít nhắc nhở, tự động tạo token gateway.
- `manual`: nhắc nhở đầy đủ cho port/bind/auth (tên khác của `advanced`).
- Hành vi phạm vi DM onboarding cục bộ: [Tham khảo Thiết lập CLI](/start/wizard-cli-reference#outputs-and-internals).
- Chat đầu tiên nhanh nhất: `openclaw dashboard` (Giao diện điều khiển, không cần thiết lập kênh).
- Nhà cung cấp tùy chỉnh: kết nối bất kỳ điểm cuối tương thích OpenAI hoặc Anthropic nào,
  bao gồm các nhà cung cấp được lưu trữ không được liệt kê. Sử dụng Unknown để tự động phát hiện.

## Các lệnh tiếp theo phổ biến

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` không ngụ ý chế độ không tương tác. Sử dụng `--non-interactive` cho các script.
</Note>
