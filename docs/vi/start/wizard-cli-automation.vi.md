---
summary: "Tự động hóa onboarding và cài đặt agent cho OpenClaw CLI"
read_when:
  - Đang tự động hóa onboarding trong script hoặc CI
  - Cần ví dụ không tương tác cho các provider cụ thể
title: "Tự động hóa CLI"
sidebarTitle: "Tự động hóa CLI"
---

# Tự động hóa CLI

Dùng `--non-interactive` để tự động hóa `openclaw onboard`.

<Note>
`--json` không có nghĩa là chế độ không tương tác. Dùng `--non-interactive` (và `--workspace`) cho script.
</Note>

## Ví dụ không tương tác cơ bản

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Thêm `--json` để có summary dạng machine-readable.

Dùng `--secret-input-mode ref` để lưu refs dựa trên env trong auth profiles thay vì giá trị plaintext.
Có thể chọn tương tác giữa env refs và provider refs đã cấu hình (`file` hoặc `exec`) trong luồng onboarding.

Trong chế độ không tương tác `ref`, biến môi trường provider phải được thiết lập trong môi trường process.
Truyền inline key flags mà không có biến môi trường tương ứng sẽ báo lỗi ngay.

Ví dụ:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Ví dụ cho từng provider

<AccordionGroup>
  <Accordion title="Ví dụ Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Chuyển sang `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` cho catalog Go.
  </Accordion>
  <Accordion title="Ví dụ Ollama">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ Custom provider">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` là tùy chọn. Nếu bỏ qua, onboarding sẽ kiểm tra `CUSTOM_API_KEY`.

    Biến thể chế độ ref:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    Trong chế độ này, onboarding lưu `apiKey` dưới dạng `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

## Thêm agent khác

Dùng `openclaw agents add <name>` để tạo agent riêng với workspace, sessions và auth profiles riêng. Chạy không có `--workspace` sẽ mở wizard.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Thiết lập:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Lưu ý:

- Workspace mặc định theo `~/.openclaw/workspace-<agentId>`.
- Thêm `bindings` để định tuyến tin nhắn inbound (wizard có thể làm điều này).
- Các flag không tương tác: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tài liệu liên quan

- Onboarding hub: [Onboarding (CLI)](/start/wizard)
- Tham khảo đầy đủ: [CLI Setup Reference](/start/wizard-cli-reference)
- Tham khảo lệnh: [`openclaw onboard`](/cli/onboard)\n