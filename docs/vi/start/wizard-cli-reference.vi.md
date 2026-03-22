---
summary: "Tham khảo đầy đủ về luồng thiết lập CLI, cấu hình auth/model, outputs và nội bộ"
read_when:
  - Cần hành vi chi tiết cho openclaw onboard
  - Đang debug kết quả onboarding hoặc tích hợp client onboarding
title: "Tham khảo thiết lập CLI"
sidebarTitle: "Tham khảo CLI"
---

# Tham khảo thiết lập CLI

Trang này là tham khảo đầy đủ cho `openclaw onboard`.
Để xem hướng dẫn ngắn, xem [Onboarding (CLI)](/start/wizard).

## Wizard làm gì

Chế độ local (mặc định) hướng dẫn qua:

- Thiết lập model và auth (OpenAI Code subscription OAuth, Anthropic API key hoặc setup token, cùng các tùy chọn MiniMax, GLM, Ollama, Moonshot, và AI Gateway)
- Vị trí Workspace và các file bootstrap
- Cài đặt Gateway (port, bind, auth, tailscale)
- Channels và providers (Telegram, WhatsApp, Discord, Google Chat, Mattermost plugin, Signal)
- Cài đặt Daemon (LaunchAgent hoặc systemd user unit)
- Kiểm tra sức khỏe
- Thiết lập Skills

Chế độ remote cấu hình máy này để kết nối tới một gateway ở nơi khác.
Không cài đặt hoặc thay đổi gì trên host remote.

## Chi tiết luồng local

<Steps>
  <Step title="Phát hiện cấu hình hiện có">
    - Nếu `~/.openclaw/openclaw.json` tồn tại, chọn Giữ, Sửa đổi, hoặc Đặt lại.
    - Chạy lại wizard không xóa gì trừ khi chọn Đặt lại (hoặc dùng `--reset`).
    - CLI `--reset` mặc định là `config+creds+sessions`; dùng `--reset-scope full` để xóa cả workspace.
    - Nếu config không hợp lệ hoặc chứa khóa cũ, wizard dừng và yêu cầu chạy `openclaw doctor` trước khi tiếp tục.
    - Đặt lại dùng `trash` và cung cấp các phạm vi:
      - Chỉ config
      - Config + credentials + sessions
      - Đặt lại hoàn toàn (xóa cả workspace)
  </Step>
  <Step title="Model và auth">
    - Ma trận tùy chọn đầy đủ trong [Auth và model options](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Mặc định `~/.openclaw/workspace` (có thể cấu hình).
    - Tạo các file workspace cần thiết cho lần chạy đầu tiên.
    - Bố cục Workspace: [Agent workspace](/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Nhắc nhập port, bind, chế độ auth, và phơi bày tailscale.
    - Khuyến nghị: giữ token auth bật ngay cả cho loopback để các client WS local phải xác thực.
    - Trong chế độ token, thiết lập tương tác cung cấp:
      - **Tạo/lưu token plaintext** (mặc định)
      - **Dùng SecretRef** (tùy chọn)
    - Trong chế độ password, thiết lập tương tác cũng hỗ trợ lưu trữ plaintext hoặc SecretRef.
    - Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
      - Yêu cầu biến môi trường không rỗng trong quá trình onboarding.
      - Không thể kết hợp với `--gateway-token`.
    - Tắt auth chỉ khi hoàn toàn tin tưởng mọi tiến trình local.
    - Bind không loopback vẫn yêu cầu auth.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/channels/whatsapp): đăng nhập QR tùy chọn
    - [Telegram](/channels/telegram): bot token
    - [Discord](/channels/discord): bot token
    - [Google Chat](/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/channels/mattermost) plugin: bot token + base URL
    - [Signal](/channels/signal): cài đặt `signal-cli` tùy chọn + cấu hình tài khoản
    - [BlueBubbles](/channels/bluebubbles): khuyến nghị cho iMessage; server URL + password + webhook
    - [iMessage](/channels/imessage): đường dẫn CLI `imsg` cũ + truy cập DB
    - Bảo mật DM: mặc định là pairing. DM đầu tiên gửi mã; phê duyệt qua
      `openclaw pairing approve <channel> <code>` hoặc dùng allowlists.
  </Step>
  <Step title="Cài đặt Daemon">
    - macOS: LaunchAgent
      - Yêu cầu phiên người dùng đã đăng nhập; cho headless, dùng LaunchDaemon tùy chỉnh (không đi kèm).
    - Linux và Windows qua WSL2: systemd user unit
      - Wizard thử `loginctl enable-linger <user>` để gateway vẫn hoạt động sau khi logout.
      - Có thể yêu cầu sudo (ghi `/var/lib/systemd/linger`); thử không sudo trước.
    - Lựa chọn runtime: Node (khuyến nghị; cần cho WhatsApp và Telegram). Bun không khuyến nghị.
  </Step>
  <Step title="Kiểm tra sức khỏe">
    - Khởi động gateway (nếu cần) và chạy `openclaw health`.
    - `openclaw status --deep` thêm các probe sức khỏe gateway vào output trạng thái.
  </Step>
  <Step title="Skills">
    - Đọc các skills có sẵn và kiểm tra yêu cầu.
    - Cho phép chọn node manager: npm hoặc pnpm (bun không khuyến nghị).
    - Cài đặt các phụ thuộc tùy chọn (một số dùng Homebrew trên macOS).
  </Step>
  <Step title="Hoàn tất">
    - Tóm tắt và các bước tiếp theo, bao gồm các tùy chọn app iOS, Android, và macOS.
  </Step>
</Steps>

<Note>
Nếu không phát hiện GUI, wizard in hướng dẫn SSH port-forward cho Control UI thay vì mở trình duyệt.
Nếu thiếu asset Control UI, wizard cố gắng build chúng; fallback là `pnpm ui:build` (tự động cài đặt deps UI).
</Note>

## Chi tiết chế độ remote

Chế độ remote cấu hình máy này để kết nối tới một gateway ở nơi khác.

<Info>
Chế độ remote không cài đặt hoặc thay đổi gì trên host remote.
</Info>

Cài đặt:

- URL gateway remote (`ws://...`)
- Token nếu gateway remote yêu cầu auth (khuyến nghị)

<Note>
- Nếu gateway chỉ loopback, dùng SSH tunneling hoặc tailnet.
- Gợi ý khám phá:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Tùy chọn auth và model

<AccordionGroup>
  <Accordion title="Anthropic API key">
    Dùng `ANTHROPIC_API_KEY` nếu có hoặc nhắc nhập key, sau đó lưu cho daemon sử dụng.
  </Accordion>
  <Accordion title="Anthropic OAuth (Claude Code CLI)">
    - macOS: kiểm tra mục Keychain "Claude Code-credentials"
    - Linux và Windows: tái sử dụng `~/.claude/.credentials.json` nếu có

    Trên macOS, chọn "Always Allow" để launchd không bị chặn.

  </Accordion>
  <Accordion title="Anthropic token (setup-token paste)">
    Chạy `claude setup-token` trên bất kỳ máy nào, sau đó dán token.
    Có thể đặt tên; để trống dùng mặc định.
  </Accordion>
  <Accordion title="OpenAI Code subscription (Codex CLI reuse)">
    Nếu `~/.codex/auth.json` tồn tại, wizard có thể tái sử dụng.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    Luồng trình duyệt; dán `code#state`.

    Đặt `agents.defaults.model` thành `openai-codex/gpt-5.4` khi model chưa được đặt hoặc `openai/*`.

  </Accordion>
  <Accordion title="OpenAI API key">
    Dùng `OPENAI_API_KEY` nếu có hoặc nhắc nhập key, sau đó lưu credential vào auth profiles.

    Đặt `agents.defaults.model` thành `openai/gpt-5.4` khi model chưa được đặt, `openai/*`, hoặc `openai-codex/*`.

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    Nhắc nhập `XAI_API_KEY` và cấu hình xAI làm model provider.
  </Accordion>
  <Accordion title="OpenCode">
    Nhắc nhập `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`) và cho phép chọn Zen hoặc Go catalog.
    URL thiết lập: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (generic)">
    Lưu key cho bạn.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Nhắc nhập `AI_GATEWAY_API_KEY`.
    Chi tiết thêm: [Vercel AI Gateway](/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Nhắc nhập account ID, gateway ID, và `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Chi tiết thêm: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Config được tự động ghi. Mặc định hosted là `MiniMax-M2.7`; `MiniMax-M2.5` vẫn có sẵn.
    Chi tiết thêm: [MiniMax](/providers/minimax).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    Nhắc nhập `SYNTHETIC_API_KEY`.
    Chi tiết thêm: [Synthetic](/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud và local open models)">
    Nhắc nhập base URL (mặc định `http://127.0.0.1:11434`), sau đó cung cấp chế độ Cloud + Local hoặc Local.
    Khám phá các model có sẵn và gợi ý mặc định.
    Chi tiết thêm: [Ollama](/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot và Kimi Coding">
    Cấu hình Moonshot (Kimi K2) và Kimi Coding được tự động ghi.
    Chi tiết thêm: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot).
  </Accordion>
  <Accordion title="Custom provider">
    Hoạt động với các endpoint tương thích OpenAI và Anthropic.

    Onboarding tương tác hỗ trợ các lựa chọn lưu trữ API key giống như các luồng API key provider khác:
    - **Dán API key ngay bây giờ** (plaintext)
    - **Dùng secret reference** (env ref hoặc provider ref đã cấu hình, với xác thực trước)

    Các flag không tương tác:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (tùy chọn; fallback về `CUSTOM_API_KEY`)
    - `--custom-provider-id` (tùy chọn)
    - `--custom-compatibility <openai|anthropic>` (tùy chọn; mặc định `openai`)

  </Accordion>
  <Accordion title="Bỏ qua">
    Để auth chưa cấu hình.
  </Accordion>
</AccordionGroup>

Hành vi model:

- Chọn model mặc định từ các tùy chọn phát hiện, hoặc nhập provider và model thủ công.
- Wizard chạy kiểm tra model và cảnh báo nếu model cấu hình không xác định hoặc thiếu auth.

Đường dẫn credential và profile:

- OAuth credentials: `~/.openclaw/credentials/oauth.json`
- Auth profiles (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

Chế độ lưu trữ credential:

- Hành vi onboarding mặc định lưu trữ API keys dưới dạng giá trị plaintext trong auth profiles.
- `--secret-input-mode ref` kích hoạt chế độ tham chiếu thay vì lưu trữ key plaintext.
  Trong thiết lập tương tác, có thể chọn:
  - tham chiếu biến môi trường (ví dụ `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - tham chiếu provider đã cấu hình (`file` hoặc `exec`) với alias provider + id
- Chế độ tham chiếu tương tác chạy xác thực trước nhanh trước khi lưu.
  - Env refs: xác thực tên biến + giá trị không rỗng trong môi trường onboarding hiện tại.
  - Provider refs: xác thực cấu hình provider và giải quyết id yêu cầu.
  - Nếu xác thực trước thất bại, onboarding hiển thị lỗi và cho phép thử lại.
- Trong chế độ không tương tác, `--secret-input-mode ref` chỉ hỗ trợ env.
  - Đặt biến môi trường provider trong môi trường quá trình onboarding.
  - Các flag key inline (ví dụ `--openai-api-key`) yêu cầu biến môi trường được đặt; nếu không onboarding thất bại nhanh.
  - Đối với custom providers, chế độ `ref` không tương tác lưu `models.providers.<id>.apiKey` dưới dạng `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Trong trường hợp custom-provider đó, `--custom-api-key` yêu cầu `CUSTOM_API_KEY` được đặt; nếu không onboarding thất bại nhanh.
- Credential auth gateway hỗ trợ các lựa chọn plaintext và SecretRef trong thiết lập tương tác:
  - Chế độ token: **Tạo/lưu token plaintext** (mặc định) hoặc **Dùng SecretRef**.
  - Chế độ password: plaintext hoặc SecretRef.
- Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
- Các thiết lập plaintext hiện có vẫn hoạt động không thay đổi.

<Note>
Mẹo cho headless và server: hoàn thành OAuth trên máy có trình duyệt, sau đó sao chép
`~/.openclaw/credentials/oauth.json` (hoặc `$OPENCLAW_STATE_DIR/credentials/oauth.json`)
tới host gateway.
</Note>

## Outputs và nội bộ

Các trường điển hình trong `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (nếu chọn Minimax)
- `tools.profile` (local onboarding mặc định là `"coding"` khi chưa đặt; giữ nguyên giá trị rõ ràng hiện có)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (local onboarding mặc định là `per-channel-peer` khi chưa đặt; giữ nguyên giá trị rõ ràng hiện có)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.signal.*`, `channels.imessage.*`
- Channel allowlists (Slack, Discord, Matrix, Microsoft Teams) khi chọn trong prompts (tên được giải quyết thành ID khi có thể)
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` ghi `agents.list[]` và `bindings` tùy chọn.

Credentials WhatsApp nằm dưới `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sessions được lưu dưới `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Một số channels được cung cấp dưới dạng plugins. Khi chọn trong quá trình thiết lập, wizard
nhắc cài đặt plugin (npm hoặc đường dẫn local) trước khi cấu hình channel.
</Note>

RPC wizard Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS app và Control UI) có thể render các bước mà không cần triển khai lại logic onboarding.

Hành vi thiết lập Signal:

- Tải xuống asset phát hành phù hợp
- Lưu trữ dưới `~/.openclaw/tools/signal-cli/<version>/`
- Ghi `channels.signal.cliPath` trong config
- Bản build JVM yêu cầu Java 21
- Bản build native được sử dụng khi có sẵn
- Windows dùng WSL2 và theo luồng signal-cli Linux bên trong WSL

## Tài liệu liên quan

- Trung tâm Onboarding: [Onboarding (CLI)](/start/wizard)
- Tự động hóa và scripts: [CLI Automation](/start/wizard-cli-automation)
- Tham khảo lệnh: [`openclaw onboard`](/cli/onboard)\n