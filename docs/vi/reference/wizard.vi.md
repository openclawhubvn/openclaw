# Tài liệu Onboarding

Đây là tài liệu đầy đủ cho `openclaw onboard`. Để có cái nhìn tổng quan, xem [Onboarding (CLI)](/start/wizard).

## Chi tiết luồng (chế độ local)

<Steps>
  <Step title="Phát hiện cấu hình hiện có">
    - Nếu `~/.openclaw/openclaw.json` tồn tại, chọn **Giữ / Sửa / Reset**.
    - Chạy lại onboarding **không** xóa gì trừ khi chọn **Reset** (hoặc dùng `--reset`).
    - CLI `--reset` mặc định là `config+creds+sessions`; dùng `--reset-scope full` để xóa cả workspace.
    - Nếu config không hợp lệ hoặc chứa khóa cũ, wizard dừng và yêu cầu chạy `openclaw doctor` trước khi tiếp tục.
    - Reset dùng `trash` (không bao giờ `rm`) và cung cấp các phạm vi:
      - Chỉ config
      - Config + credentials + sessions
      - Reset toàn bộ (xóa cả workspace)
  </Step>
  <Step title="Model/Auth">
    - **Anthropic API key**: dùng `ANTHROPIC_API_KEY` nếu có hoặc yêu cầu nhập, sau đó lưu cho daemon.
    - **Anthropic OAuth (Claude Code CLI)**: trên macOS, onboarding kiểm tra Keychain item "Claude Code-credentials" (chọn "Always Allow" để launchd không bị chặn); trên Linux/Windows, dùng lại `~/.claude/.credentials.json` nếu có.
    - **Anthropic token (paste setup-token)**: chạy `claude setup-token` trên bất kỳ máy nào, sau đó dán token (có thể đặt tên; để trống = mặc định).
    - **OpenAI Code (Codex) subscription (Codex CLI)**: nếu `~/.codex/auth.json` tồn tại, onboarding có thể dùng lại.
    - **OpenAI Code (Codex) subscription (OAuth)**: luồng trình duyệt; dán `code#state`.
      - Đặt `agents.defaults.model` thành `openai-codex/gpt-5.2` khi model chưa được đặt hoặc `openai/*`.
    - **OpenAI API key**: dùng `OPENAI_API_KEY` nếu có hoặc yêu cầu nhập, sau đó lưu vào auth profiles.
    - **xAI (Grok) API key**: yêu cầu nhập `XAI_API_KEY` và cấu hình xAI làm nhà cung cấp model.
    - **OpenCode**: yêu cầu nhập `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`, lấy tại https://opencode.ai/auth) và cho phép chọn catalog Zen hoặc Go.
    - **Ollama**: yêu cầu nhập URL cơ sở của Ollama, cung cấp chế độ **Cloud + Local** hoặc **Local**, phát hiện các model có sẵn và tự động tải model local đã chọn khi cần.
    - Chi tiết thêm: [Ollama](/providers/ollama)
    - **API key**: lưu key cho bạn.
    - **Vercel AI Gateway (multi-model proxy)**: yêu cầu nhập `AI_GATEWAY_API_KEY`.
    - Chi tiết thêm: [Vercel AI Gateway](/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: yêu cầu nhập Account ID, Gateway ID và `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Chi tiết thêm: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
    - **MiniMax**: config được tự động ghi; mặc định là `MiniMax-M2.7` và `MiniMax-M2.5` vẫn có sẵn.
    - Chi tiết thêm: [MiniMax](/providers/minimax)
    - **Synthetic (Anthropic-compatible)**: yêu cầu nhập `SYNTHETIC_API_KEY`.
    - Chi tiết thêm: [Synthetic](/providers/synthetic)
    - **Moonshot (Kimi K2)**: config được tự động ghi.
    - **Kimi Coding**: config được tự động ghi.
    - Chi tiết thêm: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
    - **Bỏ qua**: chưa cấu hình auth.
    - Chọn model mặc định từ các tùy chọn đã phát hiện (hoặc nhập nhà cung cấp/model thủ công). Để có chất lượng tốt nhất và giảm rủi ro prompt-injection, chọn model thế hệ mới nhất mạnh nhất có sẵn trong stack nhà cung cấp.
    - Onboarding chạy kiểm tra model và cảnh báo nếu model cấu hình không xác định hoặc thiếu auth.
    - Chế độ lưu trữ API key mặc định là giá trị auth-profile plaintext. Dùng `--secret-input-mode ref` để lưu trữ refs dựa trên env thay thế (ví dụ `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - OAuth credentials nằm trong `~/.openclaw/credentials/oauth.json`; auth profiles nằm trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API keys + OAuth).
    - Chi tiết thêm: [/concepts/oauth](/concepts/oauth)
    <Note>
    Mẹo cho server/headless: hoàn thành OAuth trên máy có trình duyệt, sau đó sao chép
    `~/.openclaw/credentials/oauth.json` (hoặc `$OPENCLAW_STATE_DIR/credentials/oauth.json`) đến
    máy chủ gateway.
    </Note>
  </Step>
  <Step title="Workspace">
    - Mặc định `~/.openclaw/workspace` (có thể cấu hình).
    - Khởi tạo các file workspace cần thiết cho nghi thức bootstrap agent.
    - Hướng dẫn bố trí workspace đầy đủ + backup: [Agent workspace](/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, chế độ auth, phơi bày tailscale.
    - Khuyến nghị auth: giữ **Token** ngay cả cho loopback để các client WS local phải xác thực.
    - Trong chế độ token, thiết lập tương tác cung cấp:
      - **Tạo/lưu token plaintext** (mặc định)
      - **Dùng SecretRef** (tùy chọn)
      - Quickstart dùng lại các SecretRefs `gateway.auth.token` hiện có qua các nhà cung cấp `env`, `file`, và `exec` cho probe/dashboard bootstrap onboarding.
      - Nếu SecretRef đó được cấu hình nhưng không thể giải quyết, onboarding thất bại sớm với thông báo sửa lỗi rõ ràng thay vì âm thầm làm giảm chất lượng auth runtime.
    - Trong chế độ password, thiết lập tương tác cũng hỗ trợ lưu trữ plaintext hoặc SecretRef.
    - Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
      - Yêu cầu một biến môi trường không rỗng trong môi trường quá trình onboarding.
      - Không thể kết hợp với `--gateway-token`.
    - Vô hiệu hóa auth chỉ khi hoàn toàn tin tưởng mọi quá trình local.
    - Bind không-loopback vẫn yêu cầu auth.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/channels/whatsapp): đăng nhập QR tùy chọn.
    - [Telegram](/channels/telegram): bot token.
    - [Discord](/channels/discord): bot token.
    - [Google Chat](/channels/googlechat): service account JSON + webhook audience.
    - [Mattermost](/channels/mattermost) (plugin): bot token + base URL.
    - [Signal](/channels/signal): cài đặt `signal-cli` tùy chọn + cấu hình tài khoản.
    - [BlueBubbles](/channels/bluebubbles): **khuyến nghị cho iMessage**; server URL + password + webhook.
    - [iMessage](/channels/imessage): đường dẫn CLI `imsg` cũ + truy cập DB.
    - Bảo mật DM: mặc định là pairing. DM đầu tiên gửi mã; phê duyệt qua `openclaw pairing approve <channel> <code>` hoặc dùng allowlists.
  </Step>
  <Step title="Web search">
    - Chọn nhà cung cấp: Perplexity, Brave, Gemini, Grok, hoặc Kimi (hoặc bỏ qua).
    - Dán API key (QuickStart tự động phát hiện keys từ biến môi trường hoặc cấu hình hiện có).
    - Bỏ qua với `--skip-search`.
    - Cấu hình sau: `openclaw configure --section web`.
  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - Yêu cầu phiên người dùng đã đăng nhập; cho headless, dùng LaunchDaemon tùy chỉnh (không đi kèm).
    - Linux (và Windows qua WSL2): systemd user unit
      - Onboarding cố gắng kích hoạt lingering qua `loginctl enable-linger <user>` để Gateway duy trì sau khi logout.
      - Có thể yêu cầu sudo (ghi `/var/lib/systemd/linger`); thử không cần sudo trước.
    - **Lựa chọn runtime:** Node (khuyến nghị; yêu cầu cho WhatsApp/Telegram). Bun **không khuyến nghị**.
    - Nếu auth token yêu cầu token và `gateway.auth.token` được quản lý bởi SecretRef, cài đặt daemon xác thực nó nhưng không lưu trữ giá trị token plaintext đã giải quyết vào metadata môi trường dịch vụ supervisor.
    - Nếu auth token yêu cầu token và SecretRef token cấu hình không được giải quyết, cài đặt daemon bị chặn với hướng dẫn có thể thực hiện.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` được cấu hình và `gateway.auth.mode` chưa được đặt, cài đặt daemon bị chặn cho đến khi chế độ được đặt rõ ràng.
  </Step>
  <Step title="Health check">
    - Khởi động Gateway (nếu cần) và chạy `openclaw health`.
    - Mẹo: `openclaw status --deep` thêm các probe sức khỏe gateway vào output trạng thái (yêu cầu gateway có thể truy cập).
  </Step>
  <Step title="Skills (khuyến nghị)">
    - Đọc các kỹ năng có sẵn và kiểm tra yêu cầu.
    - Cho phép chọn node manager: **npm / pnpm** (bun không khuyến nghị).
    - Cài đặt các phụ thuộc tùy chọn (một số dùng Homebrew trên macOS).
  </Step>
  <Step title="Hoàn tất">
    - Tóm tắt + bước tiếp theo, bao gồm các ứng dụng iOS/Android/macOS cho các tính năng bổ sung.
  </Step>
</Steps>

<Note>
Nếu không phát hiện GUI, onboarding in hướng dẫn SSH port-forward cho Control UI thay vì mở trình duyệt.
Nếu thiếu các tài sản Control UI, onboarding cố gắng xây dựng chúng; fallback là `pnpm ui:build` (tự động cài đặt các phụ thuộc UI).
</Note>

## Chế độ không tương tác

Dùng `--non-interactive` để tự động hóa hoặc script onboarding:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Thêm `--json` để có tóm tắt dạng máy đọc được.

SecretRef token Gateway trong chế độ không tương tác:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` và `--gateway-token-ref-env` không thể kết hợp.

<Note>
`--json` **không** ngụ ý chế độ không tương tác. Dùng `--non-interactive` (và `--workspace`) cho scripts.
</Note>

Ví dụ lệnh cụ thể cho từng nhà cung cấp có tại [CLI Automation](/start/wizard-cli-automation#provider-specific-examples).
Dùng trang tham khảo này để hiểu ý nghĩa các flag và thứ tự các bước.

### Thêm agent (không tương tác)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway wizard RPC

Gateway cung cấp luồng onboarding qua RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Các client (ứng dụng macOS, Control UI) có thể render các bước mà không cần triển khai lại logic onboarding.

## Cài đặt Signal (signal-cli)

Onboarding có thể cài đặt `signal-cli` từ GitHub releases:

- Tải về asset release phù hợp.
- Lưu trữ dưới `~/.openclaw/tools/signal-cli/<version>/`.
- Ghi `channels.signal.cliPath` vào config.

Ghi chú:

- Bản build JVM yêu cầu **Java 21**.
- Bản build native được dùng khi có sẵn.
- Windows dùng WSL2; cài đặt signal-cli theo luồng Linux bên trong WSL.

## Wizard ghi gì

Các trường điển hình trong `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (nếu chọn Minimax)
- `tools.profile` (onboarding local mặc định là `"coding"` khi chưa đặt; giữ nguyên các giá trị rõ ràng hiện có)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (chi tiết hành vi: [CLI Setup Reference](/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.signal.*`, `channels.imessage.*`
- Channel allowlists (Slack/Discord/Matrix/Microsoft Teams) khi bạn chọn trong các prompt (tên được giải quyết thành ID khi có thể).
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` ghi `agents.list[]` và các `bindings` tùy chọn.

Thông tin đăng nhập WhatsApp nằm dưới `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sessions được lưu trữ dưới `~/.openclaw/agents/<agentId>/sessions/`.

Một số channels được cung cấp dưới dạng plugins. Khi chọn một trong quá trình setup, onboarding sẽ yêu cầu cài đặt nó (npm hoặc đường dẫn local) trước khi có thể cấu hình.

## Tài liệu liên quan

- Tổng quan Onboarding: [Onboarding (CLI)](/start/wizard)
- Onboarding ứng dụng macOS: [Onboarding](/start/onboarding)
- Tham khảo cấu hình: [Gateway configuration](/gateway/configuration)
- Nhà cung cấp: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord), [Google Chat](/channels/googlechat), [Signal](/channels/signal), [BlueBubbles](/channels/bluebubbles) (iMessage), [iMessage](/channels/imessage) (legacy)
- Kỹ năng: [Skills](/tools/skills), [Skills config](/tools/skills-config)\n