---
summary: "Khám phá cách cấu hình Onboarding CLI với hướng dẫn từng bước, cờ và trường cấu hình chi tiết."
read_when:
  - Tìm kiếm một bước hoặc cờ onboarding cụ thể
  - Tự động hóa onboarding với chế độ không tương tác
  - Gỡ lỗi hành vi onboarding
title: "Hướng Dẫn Cấu Hình Onboarding CLI"
sidebarTitle: "Tham khảo Onboarding"
---

# Tham khảo Onboarding

Đây là tài liệu tham khảo đầy đủ cho `openclaw onboard`.
Để có cái nhìn tổng quan, xem [Onboarding (CLI)](/start/wizard).

## Chi tiết quy trình (chế độ local)

<Steps>
  <Step title="Phát hiện cấu hình hiện có">
    - Nếu `~/.openclaw/openclaw.json` tồn tại, chọn **Giữ / Sửa đổi / Đặt lại**.
    - Chạy lại onboarding sẽ **không** xóa bất kỳ thứ gì trừ khi bạn chọn **Đặt lại**
      (hoặc sử dụng `--reset`).
    - CLI `--reset` mặc định là `config+creds+sessions`; dùng `--reset-scope full`
      để xóa cả workspace.
    - Nếu cấu hình không hợp lệ hoặc chứa khóa cũ, wizard sẽ dừng và yêu cầu
      bạn chạy `openclaw doctor` trước khi tiếp tục.
    - Đặt lại sử dụng `trash` (không bao giờ `rm`) và cung cấp các phạm vi:
      - Chỉ cấu hình
      - Cấu hình + thông tin xác thực + phiên
      - Đặt lại hoàn toàn (cũng xóa workspace)
  </Step>
  <Step title="Mô hình/Xác thực">
    - **Anthropic API key**: sử dụng `ANTHROPIC_API_KEY` nếu có hoặc yêu cầu nhập khóa, sau đó lưu để daemon sử dụng.
    - **Anthropic OAuth (Claude Code CLI)**: trên macOS, onboarding kiểm tra mục Keychain "Claude Code-credentials" (chọn "Always Allow" để launchd không bị chặn); trên Linux/Windows, nó sử dụng lại `~/.claude/.credentials.json` nếu có.
    - **Anthropic token (dán setup-token)**: chạy `claude setup-token` trên bất kỳ máy nào, sau đó dán token (bạn có thể đặt tên; để trống = mặc định).
    - **OpenAI Code (Codex) subscription (Codex CLI)**: nếu `~/.codex/auth.json` tồn tại, onboarding có thể sử dụng lại.
    - **OpenAI Code (Codex) subscription (OAuth)**: luồng trình duyệt; dán `code#state`.
      - Đặt `agents.defaults.model` thành `openai-codex/gpt-5.2` khi mô hình chưa được đặt hoặc là `openai/*`.
    - **OpenAI API key**: sử dụng `OPENAI_API_KEY` nếu có hoặc yêu cầu nhập khóa, sau đó lưu vào hồ sơ xác thực.
    - **xAI (Grok) API key**: yêu cầu nhập `XAI_API_KEY` và cấu hình xAI làm nhà cung cấp mô hình.
    - **OpenCode**: yêu cầu nhập `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`, lấy tại https://opencode.ai/auth) và cho phép bạn chọn catalog Zen hoặc Go.
    - **Ollama**: yêu cầu nhập URL cơ sở của Ollama, cung cấp chế độ **Cloud + Local** hoặc **Local**, phát hiện các mô hình có sẵn, và tự động tải mô hình local đã chọn khi cần.
    - Chi tiết thêm: [Ollama](/providers/ollama)
    - **API key**: lưu khóa cho bạn.
    - **Vercel AI Gateway (multi-model proxy)**: yêu cầu nhập `AI_GATEWAY_API_KEY`.
    - Chi tiết thêm: [Vercel AI Gateway](/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: yêu cầu nhập Account ID, Gateway ID, và `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Chi tiết thêm: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
    - **MiniMax**: cấu hình được tự động viết; mặc định lưu trữ là `MiniMax-M2.7` và `MiniMax-M2.5` vẫn có sẵn.
    - Chi tiết thêm: [MiniMax](/providers/minimax)
    - **Synthetic (Anthropic-compatible)**: yêu cầu nhập `SYNTHETIC_API_KEY`.
    - Chi tiết thêm: [Synthetic](/providers/synthetic)
    - **Moonshot (Kimi K2)**: cấu hình được tự động viết.
    - **Kimi Coding**: cấu hình được tự động viết.
    - Chi tiết thêm: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
    - **Bỏ qua**: chưa cấu hình xác thực.
    - Chọn một mô hình mặc định từ các tùy chọn đã phát hiện (hoặc nhập nhà cung cấp/mô hình thủ công). Để có chất lượng tốt nhất và giảm rủi ro tiêm nhiễm prompt, hãy chọn mô hình thế hệ mới nhất mạnh nhất có sẵn trong stack nhà cung cấp của bạn.
    - Onboarding chạy kiểm tra mô hình và cảnh báo nếu mô hình được cấu hình không xác định hoặc thiếu xác thực.
    - Chế độ lưu trữ API key mặc định là các giá trị hồ sơ xác thực dạng văn bản. Sử dụng `--secret-input-mode ref` để lưu trữ các tham chiếu dựa trên môi trường thay thế (ví dụ `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Thông tin xác thực OAuth nằm trong `~/.openclaw/credentials/oauth.json`; hồ sơ xác thực nằm trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API keys + OAuth).
    - Chi tiết thêm: [/concepts/oauth](/concepts/oauth)
    <Note>
    Mẹo cho máy chủ không có giao diện: hoàn thành OAuth trên máy có trình duyệt, sau đó sao chép
    `~/.openclaw/credentials/oauth.json` (hoặc `$OPENCLAW_STATE_DIR/credentials/oauth.json`) đến máy chủ gateway.
    </Note>
  </Step>
  <Step title="Workspace">
    - Mặc định `~/.openclaw/workspace` (có thể cấu hình).
    - Khởi tạo các tệp workspace cần thiết cho nghi thức khởi động agent.
    - Bố cục workspace đầy đủ + hướng dẫn sao lưu: [Agent workspace](/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Cổng, bind, chế độ xác thực, phơi bày tailscale.
    - Khuyến nghị xác thực: giữ **Token** ngay cả cho loopback để các client WS local phải xác thực.
    - Trong chế độ token, thiết lập tương tác cung cấp:
      - **Tạo/lưu token dạng văn bản** (mặc định)
      - **Sử dụng SecretRef** (tùy chọn)
      - Quickstart sử dụng lại các SecretRefs `gateway.auth.token` hiện có qua các nhà cung cấp `env`, `file`, và `exec` cho onboarding probe/dashboard bootstrap.
      - Nếu SecretRef đó được cấu hình nhưng không thể giải quyết, onboarding sẽ thất bại sớm với thông báo sửa lỗi rõ ràng thay vì âm thầm làm suy giảm xác thực runtime.
    - Trong chế độ mật khẩu, thiết lập tương tác cũng hỗ trợ lưu trữ dạng văn bản hoặc SecretRef.
    - Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
      - Yêu cầu một biến môi trường không rỗng trong môi trường quy trình onboarding.
      - Không thể kết hợp với `--gateway-token`.
    - Vô hiệu hóa xác thực chỉ khi bạn hoàn toàn tin tưởng mọi quy trình local.
    - Các bind không phải loopback vẫn yêu cầu xác thực.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/channels/whatsapp): đăng nhập QR tùy chọn.
    - [Telegram](/channels/telegram): bot token.
    - [Discord](/channels/discord): bot token.
    - [Google Chat](/channels/googlechat): tài khoản dịch vụ JSON + webhook audience.
    - [Mattermost](/channels/mattermost) (plugin): bot token + URL cơ sở.
    - [Signal](/channels/signal): cài đặt `signal-cli` tùy chọn + cấu hình tài khoản.
    - [BlueBubbles](/channels/bluebubbles): **khuyến nghị cho iMessage**; URL máy chủ + mật khẩu + webhook.
    - [iMessage](/channels/imessage): đường dẫn CLI `imsg` cũ + truy cập DB.
    - Bảo mật DM: mặc định là ghép đôi. DM đầu tiên gửi mã; phê duyệt qua `openclaw pairing approve <channel> <code>` hoặc sử dụng danh sách cho phép.
  </Step>
  <Step title="Tìm kiếm web">
    - Chọn nhà cung cấp: Perplexity, Brave, Gemini, Grok, hoặc Kimi (hoặc bỏ qua).
    - Dán API key của bạn (QuickStart tự động phát hiện khóa từ biến môi trường hoặc cấu hình hiện có).
    - Bỏ qua với `--skip-search`.
    - Cấu hình sau: `openclaw configure --section web`.
  </Step>
  <Step title="Cài đặt Daemon">
    - macOS: LaunchAgent
      - Yêu cầu một phiên người dùng đã đăng nhập; cho máy không có giao diện, sử dụng LaunchDaemon tùy chỉnh (không đi kèm).
    - Linux (và Windows qua WSL2): đơn vị người dùng systemd
      - Onboarding cố gắng kích hoạt lingering qua `loginctl enable-linger <user>` để Gateway vẫn hoạt động sau khi đăng xuất.
      - Có thể yêu cầu sudo (ghi vào `/var/lib/systemd/linger`); nó thử không cần sudo trước.
    - **Lựa chọn runtime:** Node (khuyến nghị; yêu cầu cho WhatsApp/Telegram). Bun **không được khuyến nghị**.
    - Nếu xác thực token yêu cầu một token và `gateway.auth.token` được quản lý bởi SecretRef, cài đặt daemon xác thực nó nhưng không lưu trữ các giá trị token dạng văn bản đã giải quyết vào metadata môi trường dịch vụ supervisor.
    - Nếu xác thực token yêu cầu một token và SecretRef token được cấu hình không được giải quyết, cài đặt daemon bị chặn với hướng dẫn có thể thực hiện.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, cài đặt daemon bị chặn cho đến khi chế độ được đặt rõ ràng.
  </Step>
  <Step title="Kiểm tra sức khỏe">
    - Khởi động Gateway (nếu cần) và chạy `openclaw health`.
    - Mẹo: `openclaw status --deep` thêm các probe sức khỏe gateway vào đầu ra trạng thái (yêu cầu một gateway có thể truy cập).
  </Step>
  <Step title="Kỹ năng (khuyến nghị)">
    - Đọc các kỹ năng có sẵn và kiểm tra yêu cầu.
    - Cho phép bạn chọn một trình quản lý node: **npm / pnpm** (bun không được khuyến nghị).
    - Cài đặt các phụ thuộc tùy chọn (một số sử dụng Homebrew trên macOS).
  </Step>
  <Step title="Hoàn thành">
    - Tóm tắt + các bước tiếp theo, bao gồm các ứng dụng iOS/Android/macOS cho các tính năng bổ sung.
  </Step>
</Steps>

<Note>
Nếu không phát hiện GUI, onboarding sẽ in hướng dẫn chuyển tiếp cổng SSH cho Control UI thay vì mở trình duyệt.
Nếu các tài sản Control UI bị thiếu, onboarding sẽ cố gắng xây dựng chúng; phương án dự phòng là `pnpm ui:build` (tự động cài đặt các phụ thuộc UI).
</Note>

## Chế độ không tương tác

Sử dụng `--non-interactive` để tự động hóa hoặc viết kịch bản onboarding:

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

Thêm `--json` để có bản tóm tắt có thể đọc được bằng máy.

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
`--json` **không** ngụ ý chế độ không tương tác. Sử dụng `--non-interactive` (và `--workspace`) cho các kịch bản.
</Note>

Các ví dụ lệnh cụ thể cho nhà cung cấp có trong [CLI Automation](/start/wizard-cli-automation#provider-specific-examples).
Sử dụng trang tham khảo này để hiểu ý nghĩa của các cờ và thứ tự các bước.

### Thêm agent (không tương tác)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Wizard RPC của Gateway

Gateway cung cấp quy trình onboarding qua RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Các client (ứng dụng macOS, Control UI) có thể hiển thị các bước mà không cần triển khai lại logic onboarding.

## Cài đặt Signal (signal-cli)

Onboarding có thể cài đặt `signal-cli` từ các bản phát hành GitHub:

- Tải xuống tài sản phát hành phù hợp.
- Lưu trữ dưới `~/.openclaw/tools/signal-cli/<version>/`.
- Ghi `channels.signal.cliPath` vào cấu hình của bạn.

Lưu ý:

- Các bản dựng JVM yêu cầu **Java 21**.
- Các bản dựng native được sử dụng khi có sẵn.
- Windows sử dụng WSL2; cài đặt signal-cli theo luồng Linux bên trong WSL.

## Những gì wizard ghi

Các trường điển hình trong `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (nếu chọn Minimax)
- `tools.profile` (onboarding local mặc định là `"coding"` khi chưa được đặt; các giá trị rõ ràng hiện có được giữ nguyên)
- `gateway.*` (chế độ, bind, xác thực, tailscale)
- `session.dmScope` (chi tiết hành vi: [CLI Setup Reference](/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.signal.*`, `channels.imessage.*`
- Danh sách cho phép kênh (Slack/Discord/Matrix/Microsoft Teams) khi bạn chọn tham gia trong các lời nhắc (tên được giải quyết thành ID khi có thể).
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` ghi `agents.list[]` và các `bindings` tùy chọn.

Thông tin xác thực WhatsApp được lưu dưới `~/.openclaw/credentials/whatsapp/<accountId>/`.
Các phiên được lưu trữ dưới `~/.openclaw/agents/<agentId>/sessions/`.

Một số kênh được cung cấp dưới dạng plugin. Khi bạn chọn một trong quá trình cài đặt, onboarding
sẽ yêu cầu cài đặt nó (npm hoặc một đường dẫn local) trước khi có thể cấu hình.

## Tài liệu liên quan

- Tổng quan về onboarding: [Onboarding (CLI)](/start/wizard)
- Onboarding ứng dụng macOS: [Onboarding](/start/onboarding)
- Tham khảo cấu hình: [Cấu hình Gateway](/gateway/configuration)
- Nhà cung cấp: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord), [Google Chat](/channels/googlechat), [Signal](/channels/signal), [BlueBubbles](/channels/bluebubbles) (iMessage), [iMessage](/channels/imessage) (cũ)
- Kỹ năng: [Kỹ năng](/tools/skills), [Cấu hình kỹ năng](/tools/skills-config)
