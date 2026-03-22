---
summary: "Tham khảo đầy đủ về quy trình thiết lập CLI, cấu hình xác thực/mô hình, đầu ra và nội bộ"
read_when:
  - Cần hành vi chi tiết cho onboard OpenClaw
  - Đang gỡ lỗi kết quả onboarding hoặc tích hợp khách hàng onboarding
title: "Tham khảo Thiết lập CLI"
sidebarTitle: "Tham khảo CLI"
---

# Tham khảo Thiết lập CLI

Trang này cung cấp tham khảo đầy đủ cho `openclaw onboard`.
Để xem hướng dẫn ngắn, hãy xem [Onboarding (CLI)](/start/wizard).

## Những gì wizard thực hiện

Chế độ cục bộ (mặc định) hướng dẫn bạn qua:

- Thiết lập mô hình và xác thực (OpenAI Code subscription OAuth, khóa API Anthropic hoặc token thiết lập, cùng với các tùy chọn MiniMax, GLM, Ollama, Moonshot và AI Gateway)
- Vị trí Workspace và các file khởi động
- Cài đặt Gateway (cổng, bind, xác thực, tailscale)
- Kênh và nhà cung cấp (Telegram, WhatsApp, Discord, Google Chat, plugin Mattermost, Signal)
- Cài đặt Daemon (LaunchAgent hoặc systemd user unit)
- Kiểm tra sức khỏe
- Thiết lập kỹ năng

Chế độ từ xa cấu hình máy này để kết nối với một gateway ở nơi khác.
Nó không cài đặt hoặc thay đổi bất kỳ thứ gì trên máy chủ từ xa.

## Chi tiết quy trình cục bộ

<Steps>
  <Step title="Phát hiện cấu hình hiện có">
    - Nếu `~/.openclaw/openclaw.json` tồn tại, chọn Giữ, Sửa đổi hoặc Đặt lại.
    - Chạy lại wizard không xóa bất kỳ thứ gì trừ khi bạn chọn Đặt lại (hoặc sử dụng `--reset`).
    - CLI `--reset` mặc định là `config+creds+sessions`; sử dụng `--reset-scope full` để xóa cả workspace.
    - Nếu cấu hình không hợp lệ hoặc chứa khóa cũ, wizard dừng lại và yêu cầu bạn chạy `openclaw doctor` trước khi tiếp tục.
    - Đặt lại sử dụng `trash` và cung cấp các phạm vi:
      - Chỉ cấu hình
      - Cấu hình + thông tin xác thực + phiên
      - Đặt lại hoàn toàn (cũng xóa workspace)
  </Step>
  <Step title="Mô hình và xác thực">
    - Ma trận tùy chọn đầy đủ có trong [Tùy chọn xác thực và mô hình](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Mặc định `~/.openclaw/workspace` (có thể cấu hình).
    - Khởi tạo các file workspace cần thiết cho lần chạy đầu tiên.
    - Bố cục Workspace: [Agent workspace](/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Nhắc nhở về cổng, bind, chế độ xác thực và phơi bày tailscale.
    - Khuyến nghị: giữ xác thực token được bật ngay cả cho loopback để các client WS cục bộ phải xác thực.
    - Trong chế độ token, thiết lập tương tác cung cấp:
      - **Tạo/lưu trữ token dạng văn bản** (mặc định)
      - **Sử dụng SecretRef** (tùy chọn)
    - Trong chế độ mật khẩu, thiết lập tương tác cũng hỗ trợ lưu trữ dạng văn bản hoặc SecretRef.
    - Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
      - Yêu cầu một biến môi trường không rỗng trong môi trường quy trình onboarding.
      - Không thể kết hợp với `--gateway-token`.
    - Chỉ vô hiệu hóa xác thực nếu bạn hoàn toàn tin tưởng mọi quy trình cục bộ.
    - Các bind không phải loopback vẫn yêu cầu xác thực.
  </Step>
  <Step title="Kênh">
    - [WhatsApp](/channels/whatsapp): đăng nhập QR tùy chọn
    - [Telegram](/channels/telegram): token bot
    - [Discord](/channels/discord): token bot
    - [Google Chat](/channels/googlechat): tài khoản dịch vụ JSON + đối tượng webhook
    - [Plugin Mattermost](/channels/mattermost): token bot + URL cơ sở
    - [Signal](/channels/signal): cài đặt `signal-cli` tùy chọn + cấu hình tài khoản
    - [BlueBubbles](/channels/bluebubbles): khuyến nghị cho iMessage; URL máy chủ + mật khẩu + webhook
    - [iMessage](/channels/imessage): đường dẫn CLI `imsg` cũ + truy cập DB
    - Bảo mật DM: mặc định là ghép đôi. DM đầu tiên gửi mã; phê duyệt qua
      `openclaw pairing approve <channel> <code>` hoặc sử dụng danh sách cho phép.
  </Step>
  <Step title="Cài đặt Daemon">
    - macOS: LaunchAgent
      - Yêu cầu phiên người dùng đã đăng nhập; cho headless, sử dụng LaunchDaemon tùy chỉnh (không được cung cấp).
    - Linux và Windows qua WSL2: systemd user unit
      - Wizard cố gắng `loginctl enable-linger <user>` để gateway duy trì sau khi đăng xuất.
      - Có thể yêu cầu sudo (ghi vào `/var/lib/systemd/linger`); nó thử mà không cần sudo trước.
    - Lựa chọn runtime: Node (khuyến nghị; yêu cầu cho WhatsApp và Telegram). Bun không được khuyến nghị.
  </Step>
  <Step title="Kiểm tra sức khỏe">
    - Khởi động gateway (nếu cần) và chạy `openclaw health`.
    - `openclaw status --deep` thêm các kiểm tra sức khỏe gateway vào đầu ra trạng thái.
  </Step>
  <Step title="Kỹ năng">
    - Đọc các kỹ năng có sẵn và kiểm tra yêu cầu.
    - Cho phép bạn chọn trình quản lý node: npm hoặc pnpm (không khuyến nghị bun).
    - Cài đặt các phụ thuộc tùy chọn (một số sử dụng Homebrew trên macOS).
  </Step>
  <Step title="Hoàn tất">
    - Tóm tắt và các bước tiếp theo, bao gồm các tùy chọn ứng dụng iOS, Android và macOS.
  </Step>
</Steps>

<Note>
Nếu không phát hiện GUI, wizard sẽ in hướng dẫn chuyển tiếp cổng SSH cho Control UI thay vì mở trình duyệt.
Nếu thiếu tài sản Control UI, wizard sẽ cố gắng xây dựng chúng; phương án dự phòng là `pnpm ui:build` (tự động cài đặt các phụ thuộc UI).
</Note>

## Chi tiết chế độ từ xa

Chế độ từ xa cấu hình máy này để kết nối với một gateway ở nơi khác.

<Info>
Chế độ từ xa không cài đặt hoặc thay đổi bất kỳ thứ gì trên máy chủ từ xa.
</Info>

Những gì bạn thiết lập:

- URL gateway từ xa (`ws://...`)
- Token nếu yêu cầu xác thực gateway từ xa (khuyến nghị)

<Note>
- Nếu gateway chỉ dành cho loopback, sử dụng SSH tunneling hoặc một tailnet.
- Gợi ý khám phá:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Tùy chọn xác thực và mô hình

<AccordionGroup>
  <Accordion title="Khóa API Anthropic">
    Sử dụng `ANTHROPIC_API_KEY` nếu có hoặc yêu cầu nhập khóa, sau đó lưu để daemon sử dụng.
  </Accordion>
  <Accordion title="Anthropic OAuth (Claude Code CLI)">
    - macOS: kiểm tra mục Keychain "Claude Code-credentials"
    - Linux và Windows: tái sử dụng `~/.claude/.credentials.json` nếu có

    Trên macOS, chọn "Always Allow" để các lần khởi động launchd không bị chặn.

  </Accordion>
  <Accordion title="Token Anthropic (dán token thiết lập)">
    Chạy `claude setup-token` trên bất kỳ máy nào, sau đó dán token.
    Bạn có thể đặt tên cho nó; để trống sẽ sử dụng mặc định.
  </Accordion>
  <Accordion title="OpenAI Code subscription (tái sử dụng Codex CLI)">
    Nếu `~/.codex/auth.json` tồn tại, wizard có thể tái sử dụng nó.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    Quy trình trình duyệt; dán `code#state`.

    Đặt `agents.defaults.model` thành `openai-codex/gpt-5.4` khi mô hình chưa được đặt hoặc `openai/*`.

  </Accordion>
  <Accordion title="Khóa API OpenAI">
    Sử dụng `OPENAI_API_KEY` nếu có hoặc yêu cầu nhập khóa, sau đó lưu thông tin xác thực vào hồ sơ xác thực.

    Đặt `agents.defaults.model` thành `openai/gpt-5.4` khi mô hình chưa được đặt, `openai/*`, hoặc `openai-codex/*`.

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    Yêu cầu nhập `XAI_API_KEY` và cấu hình xAI làm nhà cung cấp mô hình.
  </Accordion>
  <Accordion title="OpenCode">
    Yêu cầu nhập `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`) và cho phép bạn chọn catalog Zen hoặc Go.
    URL thiết lập: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Khóa API (chung)">
    Lưu trữ khóa cho bạn.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Yêu cầu nhập `AI_GATEWAY_API_KEY`.
    Chi tiết thêm: [Vercel AI Gateway](/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Yêu cầu nhập ID tài khoản, ID gateway, và `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Chi tiết thêm: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Cấu hình được tự động ghi. Mặc định được lưu trữ là `MiniMax-M2.7`; `MiniMax-M2.5` vẫn có sẵn.
    Chi tiết thêm: [MiniMax](/providers/minimax).
  </Accordion>
  <Accordion title="Synthetic (tương thích Anthropic)">
    Yêu cầu nhập `SYNTHETIC_API_KEY`.
    Chi tiết thêm: [Synthetic](/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud và mô hình mở cục bộ)">
    Yêu cầu nhập URL cơ sở (mặc định `http://127.0.0.1:11434`), sau đó cung cấp chế độ Cloud + Local hoặc Local.
    Phát hiện các mô hình có sẵn và đề xuất mặc định.
    Chi tiết thêm: [Ollama](/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot và Kimi Coding">
    Cấu hình Moonshot (Kimi K2) và Kimi Coding được tự động ghi.
    Chi tiết thêm: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot).
  </Accordion>
  <Accordion title="Nhà cung cấp tùy chỉnh">
    Hoạt động với các điểm cuối tương thích OpenAI và Anthropic.

    Onboarding tương tác hỗ trợ các lựa chọn lưu trữ khóa API giống như các luồng khóa API nhà cung cấp khác:
    - **Dán khóa API ngay bây giờ** (dạng văn bản)
    - **Sử dụng tham chiếu bí mật** (tham chiếu biến môi trường hoặc tham chiếu nhà cung cấp đã cấu hình, với xác thực trước chuyến bay)

    Cờ không tương tác:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (tùy chọn; dự phòng cho `CUSTOM_API_KEY`)
    - `--custom-provider-id` (tùy chọn)
    - `--custom-compatibility <openai|anthropic>` (tùy chọn; mặc định `openai`)

  </Accordion>
  <Accordion title="Bỏ qua">
    Để xác thực chưa được cấu hình.
  </Accordion>
</AccordionGroup>

Hành vi mô hình:

- Chọn mô hình mặc định từ các tùy chọn được phát hiện, hoặc nhập nhà cung cấp và mô hình thủ công.
- Wizard chạy kiểm tra mô hình và cảnh báo nếu mô hình được cấu hình không xác định hoặc thiếu xác thực.

Đường dẫn thông tin xác thực và hồ sơ:

- Thông tin xác thực OAuth: `~/.openclaw/credentials/oauth.json`
- Hồ sơ xác thực (khóa API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

Chế độ lưu trữ thông tin xác thực:

- Hành vi onboarding mặc định lưu trữ khóa API dưới dạng giá trị văn bản trong hồ sơ xác thực.
- `--secret-input-mode ref` kích hoạt chế độ tham chiếu thay vì lưu trữ khóa dạng văn bản.
  Trong thiết lập tương tác, bạn có thể chọn:
  - tham chiếu biến môi trường (ví dụ `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - tham chiếu nhà cung cấp đã cấu hình (`file` hoặc `exec`) với bí danh nhà cung cấp + id
- Chế độ tham chiếu tương tác chạy xác thực trước chuyến bay nhanh trước khi lưu.
  - Tham chiếu biến môi trường: xác thực tên biến + giá trị không rỗng trong môi trường onboarding hiện tại.
  - Tham chiếu nhà cung cấp: xác thực cấu hình nhà cung cấp và giải quyết id yêu cầu.
  - Nếu xác thực trước chuyến bay thất bại, onboarding hiển thị lỗi và cho phép bạn thử lại.
- Trong chế độ không tương tác, `--secret-input-mode ref` chỉ hỗ trợ biến môi trường.
  - Đặt biến môi trường nhà cung cấp trong môi trường quy trình onboarding.
  - Cờ khóa nội tuyến (ví dụ `--openai-api-key`) yêu cầu biến môi trường đó được đặt; nếu không onboarding sẽ thất bại nhanh chóng.
  - Đối với nhà cung cấp tùy chỉnh, chế độ `ref` không tương tác lưu trữ `models.providers.<id>.apiKey` dưới dạng `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Trong trường hợp nhà cung cấp tùy chỉnh đó, `--custom-api-key` yêu cầu `CUSTOM_API_KEY` được đặt; nếu không onboarding sẽ thất bại nhanh chóng.
- Thông tin xác thực xác thực Gateway hỗ trợ các lựa chọn văn bản và SecretRef trong thiết lập tương tác:
  - Chế độ token: **Tạo/lưu trữ token dạng văn bản** (mặc định) hoặc **Sử dụng SecretRef**.
  - Chế độ mật khẩu: văn bản hoặc SecretRef.
- Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
- Các thiết lập văn bản hiện có vẫn hoạt động không thay đổi.

<Note>
Mẹo cho headless và server: hoàn thành OAuth trên máy có trình duyệt, sau đó sao chép
`~/.openclaw/credentials/oauth.json` (hoặc `$OPENCLAW_STATE_DIR/credentials/oauth.json`)
đến máy chủ gateway.
</Note>

## Đầu ra và nội bộ

Các trường điển hình trong `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (nếu chọn Minimax)
- `tools.profile` (onboarding cục bộ mặc định là `"coding"` khi chưa được đặt; các giá trị rõ ràng hiện có được giữ nguyên)
- `gateway.*` (chế độ, bind, xác thực, tailscale)
- `session.dmScope` (onboarding cục bộ mặc định là `per-channel-peer` khi chưa được đặt; các giá trị rõ ràng hiện có được giữ nguyên)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.signal.*`, `channels.imessage.*`
- Danh sách cho phép kênh (Slack, Discord, Matrix, Microsoft Teams) khi bạn chọn tham gia trong các lời nhắc (tên được giải quyết thành ID khi có thể)
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` ghi `agents.list[]` và các `bindings` tùy chọn.

Thông tin xác thực WhatsApp được lưu dưới `~/.openclaw/credentials/whatsapp/<accountId>/`.
Các phiên được lưu dưới `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Một số kênh được cung cấp dưới dạng plugin. Khi được chọn trong quá trình thiết lập, wizard
sẽ nhắc nhở cài đặt plugin (npm hoặc đường dẫn cục bộ) trước khi cấu hình kênh.
</Note>

RPC wizard Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Các client (ứng dụng macOS và Control UI) có thể hiển thị các bước mà không cần triển khai lại logic onboarding.

Hành vi thiết lập Signal:

- Tải xuống tài sản phát hành phù hợp
- Lưu trữ dưới `~/.openclaw/tools/signal-cli/<version>/`
- Ghi `channels.signal.cliPath` trong cấu hình
- Các bản dựng JVM yêu cầu Java 21
- Các bản dựng gốc được sử dụng khi có sẵn
- Windows sử dụng WSL2 và theo luồng signal-cli Linux bên trong WSL

## Tài liệu liên quan

- Trung tâm Onboarding: [Onboarding (CLI)](/start/wizard)
- Tự động hóa và script: [Tự động hóa CLI](/start/wizard-cli-automation)
- Tham khảo lệnh: [`openclaw onboard`](/cli/onboard)
