# `openclaw onboard`

Hướng dẫn cài đặt Gateway tương tác, có thể chạy local hoặc remote.

## Hướng dẫn liên quan

- Hub onboarding CLI: [Onboarding (CLI)](/start/wizard)
- Tổng quan onboarding: [Onboarding Overview](/start/onboarding-overview)
- Tham khảo cài đặt CLI: [CLI Setup Reference](/start/wizard-cli-reference)
- Tự động hóa CLI: [CLI Automation](/start/wizard-cli-automation)
- Onboarding trên macOS: [Onboarding (macOS App)](/start/onboarding)

## Ví dụ

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Với mục tiêu mạng riêng `ws://` (chỉ mạng tin cậy), đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trong môi trường onboarding.

Provider tùy chỉnh không tương tác:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` không bắt buộc trong chế độ không tương tác. Nếu không có, onboarding kiểm tra `CUSTOM_API_KEY`.

Ollama không tương tác:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` mặc định là `http://127.0.0.1:11434`. `--custom-model-id` không bắt buộc; nếu không có, onboarding dùng mặc định của Ollama. ID model cloud như `kimi-k2.5:cloud` cũng hoạt động.

Lưu khóa provider dưới dạng ref thay vì plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Với `--secret-input-mode ref`, onboarding ghi ref dựa trên env thay vì giá trị khóa plaintext. Với provider dựa trên auth-profile, ghi các mục `keyRef`; với provider tùy chỉnh, ghi `models.providers.<id>.apiKey` dưới dạng env ref (ví dụ `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Hợp đồng chế độ `ref` không tương tác:

- Đặt biến môi trường provider trong môi trường onboarding (ví dụ `OPENAI_API_KEY`).
- Không truyền cờ khóa inline (ví dụ `--openai-api-key`) trừ khi biến môi trường đó cũng được đặt.
- Nếu truyền cờ khóa inline mà không có biến môi trường cần thiết, onboarding sẽ thất bại nhanh với hướng dẫn.

Tùy chọn token Gateway trong chế độ không tương tác:

- `--gateway-auth token --gateway-token <token>` lưu token dưới dạng plaintext.
- `--gateway-auth token --gateway-token-ref-env <name>` lưu `gateway.auth.token` dưới dạng env SecretRef.
- `--gateway-token` và `--gateway-token-ref-env` không thể dùng cùng lúc.
- `--gateway-token-ref-env` yêu cầu biến môi trường không rỗng trong môi trường onboarding.
- Với `--install-daemon`, khi auth token yêu cầu token, token Gateway được quản lý bởi SecretRef được xác thực nhưng không được lưu dưới dạng plaintext đã giải quyết trong metadata môi trường dịch vụ supervisor.
- Với `--install-daemon`, nếu chế độ token yêu cầu token và SecretRef token được cấu hình không được giải quyết, onboarding sẽ thất bại với hướng dẫn khắc phục.
- Với `--install-daemon`, nếu cả `gateway.auth.token` và `gateway.auth.password` được cấu hình và `gateway.auth.mode` chưa được đặt, onboarding sẽ chặn cài đặt cho đến khi chế độ được đặt rõ ràng.

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

Sức khỏe gateway local không tương tác:

- Trừ khi bạn truyền `--skip-health`, onboarding sẽ đợi một gateway local có thể truy cập trước khi thoát thành công.
- `--install-daemon` bắt đầu đường dẫn cài đặt gateway được quản lý trước. Nếu không, bạn phải có một gateway local đang chạy, ví dụ `openclaw gateway run`.
- Nếu chỉ muốn ghi config/workspace/bootstrap trong tự động hóa, dùng `--skip-health`.
- Trên Windows gốc, `--install-daemon` thử Scheduled Tasks trước và quay lại mục đăng nhập Startup-folder cho từng người dùng nếu việc tạo task bị từ chối.

Hành vi onboarding tương tác với chế độ tham chiếu:

- Chọn **Use secret reference** khi được nhắc.
- Sau đó chọn một trong hai:
  - Biến môi trường
  - Provider secret đã cấu hình (`file` hoặc `exec`)
- Onboarding thực hiện xác thực nhanh trước khi lưu ref.
  - Nếu xác thực thất bại, onboarding hiển thị lỗi và cho phép thử lại.

Lựa chọn endpoint Z.AI không tương tác:

Lưu ý: `--auth-choice zai-api-key` hiện tự động phát hiện endpoint Z.AI tốt nhất cho khóa của bạn (ưu tiên API chung với `zai/glm-5`).
Nếu bạn muốn endpoint GLM Coding Plan cụ thể, chọn `zai-coding-global` hoặc `zai-coding-cn`.

```bash
# Lựa chọn endpoint không cần nhắc
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Các lựa chọn endpoint Z.AI khác:
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

Ghi chú luồng:

- `quickstart`: ít nhắc nhở, tự động tạo token gateway.
- `manual`: nhắc nhở đầy đủ cho port/bind/auth (tương đương `advanced`).
- Hành vi phạm vi DM onboarding local: [CLI Setup Reference](/start/wizard-cli-reference#outputs-and-internals).
- Chat nhanh nhất: `openclaw dashboard` (UI điều khiển, không cần thiết lập channel).
- Provider tùy chỉnh: kết nối bất kỳ endpoint tương thích OpenAI hoặc Anthropic nào, bao gồm cả provider được host không được liệt kê. Dùng Unknown để tự động phát hiện.

## Lệnh thường dùng sau khi onboard

```bash
openclaw configure
openclaw agents add <name>
```

<Note>

`--json` không có nghĩa là chế độ không tương tác. Dùng `--non-interactive` cho script.

</Note>\n