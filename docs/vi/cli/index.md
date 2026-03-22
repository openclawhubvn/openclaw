---
summary: "Tham khảo CLI OpenClaw cho các lệnh, lệnh con và tùy chọn của `openclaw`"
read_when:
  - Thêm hoặc chỉnh sửa lệnh CLI hoặc tùy chọn
  - Tài liệu hóa bề mặt lệnh mới
title: "Tham khảo CLI"
---

# Tham khảo CLI

Trang này mô tả hành vi hiện tại của CLI. Nếu có thay đổi lệnh, hãy cập nhật tài liệu này.

## Trang lệnh

- [`setup`](/cli/setup)
- [`onboard`](/cli/onboard)
- [`configure`](/cli/configure)
- [`config`](/cli/config)
- [`completion`](/cli/completion)
- [`doctor`](/cli/doctor)
- [`dashboard`](/cli/dashboard)
- [`backup`](/cli/backup)
- [`reset`](/cli/reset)
- [`uninstall`](/cli/uninstall)
- [`update`](/cli/update)
- [`message`](/cli/message)
- [`agent`](/cli/agent)
- [`agents`](/cli/agents)
- [`acp`](/cli/acp)
- [`status`](/cli/status)
- [`health`](/cli/health)
- [`sessions`](/cli/sessions)
- [`gateway`](/cli/gateway)
- [`logs`](/cli/logs)
- [`system`](/cli/system)
- [`models`](/cli/models)
- [`memory`](/cli/memory)
- [`directory`](/cli/directory)
- [`nodes`](/cli/nodes)
- [`devices`](/cli/devices)
- [`node`](/cli/node)
- [`approvals`](/cli/approvals)
- [`sandbox`](/cli/sandbox)
- [`tui`](/cli/tui)
- [`browser`](/cli/browser)
- [`cron`](/cli/cron)
- [`dns`](/cli/dns)
- [`docs`](/cli/docs)
- [`hooks`](/cli/hooks)
- [`webhooks`](/cli/webhooks)
- [`pairing`](/cli/pairing)
- [`qr`](/cli/qr)
- [`plugins`](/cli/plugins) (lệnh plugin)
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon) (bí danh cũ cho lệnh dịch vụ gateway)
- [`clawbot`](/cli/clawbot) (namespace bí danh cũ)
- [`voicecall`](/cli/voicecall) (plugin; nếu đã cài đặt)

## Cờ toàn cục

- `--dev`: cô lập trạng thái dưới `~/.openclaw-dev` và thay đổi cổng mặc định.
- `--profile <name>`: cô lập trạng thái dưới `~/.openclaw-<name>`.
- `--no-color`: tắt màu ANSI.
- `--update`: viết tắt cho `openclaw update` (chỉ cài đặt từ nguồn).
- `-V`, `--version`, `-v`: in phiên bản và thoát.

## Định dạng đầu ra

- Màu ANSI và chỉ báo tiến trình chỉ hiển thị trong các phiên TTY.
- Liên kết OSC-8 hiển thị dưới dạng liên kết có thể nhấp trong các terminal hỗ trợ; nếu không, sẽ quay lại URL thông thường.
- `--json` (và `--plain` nếu được hỗ trợ) tắt định dạng để có đầu ra sạch.
- `--no-color` tắt định dạng ANSI; `NO_COLOR=1` cũng được tôn trọng.
- Các lệnh chạy lâu hiển thị chỉ báo tiến trình (OSC 9;4 khi được hỗ trợ).

## Bảng màu

OpenClaw sử dụng bảng màu lobster cho đầu ra CLI.

- `accent` (#FF5A2D): tiêu đề, nhãn, điểm nhấn chính.
- `accentBright` (#FF7A3D): tên lệnh, nhấn mạnh.
- `accentDim` (#D14A22): văn bản nổi bật thứ cấp.
- `info` (#FF8A5B): giá trị thông tin.
- `success` (#2FBF71): trạng thái thành công.
- `warn` (#FFB020): cảnh báo, dự phòng, chú ý.
- `error` (#E23D2D): lỗi, thất bại.
- `muted` (#8B7F77): giảm nhấn mạnh, siêu dữ liệu.

Nguồn bảng màu: `src/terminal/palette.ts` (bảng màu “lobster”).

## Cây lệnh

```
openclaw [--dev] [--profile <name>] <command>
  setup
  onboard
  configure
  config
    get
    set
    unset
    file
    validate
  completion
  doctor
  dashboard
  backup
    create
    verify
  security
    audit
  secrets
    reload
    migrate
  reset
  uninstall
  update
  channels
    list
    status
    logs
    add
    remove
    login
    logout
  directory
  skills
    list
    info
    check
  plugins
    list
    info
    install
    enable
    disable
    doctor
  memory
    status
    index
    search
  message
  agent
  agents
    list
    add
    delete
  acp
  status
  health
  sessions
  gateway
    call
    health
    status
    probe
    discover
    install
    uninstall
    start
    stop
    restart
    run
  daemon
    status
    install
    uninstall
    start
    stop
    restart
  logs
  system
    event
    heartbeat last|enable|disable
    presence
  models
    list
    status
    set
    set-image
    aliases list|add|remove
    fallbacks list|add|remove|clear
    image-fallbacks list|add|remove|clear
    scan
    auth add|setup-token|paste-token
    auth order get|set|clear
  sandbox
    list
    recreate
    explain
  cron
    status
    list
    add
    edit
    rm
    enable
    disable
    runs
    run
  nodes
  devices
  node
    run
    status
    install
    uninstall
    start
    stop
    restart
  approvals
    get
    set
    allowlist add|remove
  browser
    status
    start
    stop
    reset-profile
    tabs
    open
    focus
    close
    profiles
    create-profile
    delete-profile
    screenshot
    snapshot
    navigate
    resize
    click
    type
    press
    hover
    drag
    select
    upload
    fill
    dialog
    wait
    evaluate
    console
    pdf
  hooks
    list
    info
    check
    enable
    disable
    install
    update
  webhooks
    gmail setup|run
  pairing
    list
    approve
  qr
  clawbot
    qr
  docs
  dns
    setup
  tui
```

Lưu ý: các plugin có thể thêm lệnh cấp cao nhất (ví dụ `openclaw voicecall`).

## Bảo mật

- `openclaw security audit` — kiểm tra cấu hình + trạng thái cục bộ để phát hiện các lỗi bảo mật phổ biến.
- `openclaw security audit --deep` — nỗ lực tốt nhất để thăm dò Gateway trực tiếp.
- `openclaw security audit --fix` — thắt chặt các mặc định an toàn và chmod trạng thái/cấu hình.

## Secrets

- `openclaw secrets reload` — giải quyết lại các tham chiếu và hoán đổi ảnh chụp nhanh runtime một cách nguyên tử.
- `openclaw secrets audit` — quét các dư lượng văn bản thuần túy, tham chiếu chưa được giải quyết và sự trôi dạt ưu tiên (`--allow-exec` để thực thi các nhà cung cấp exec trong quá trình kiểm tra).
- `openclaw secrets configure` — trợ giúp tương tác cho thiết lập nhà cung cấp + ánh xạ SecretRef + kiểm tra trước/áp dụng (`--allow-exec` để thực thi các nhà cung cấp exec trong các luồng kiểm tra trước và áp dụng có chứa exec).
- `openclaw secrets apply --from <plan.json>` — áp dụng một kế hoạch đã được tạo trước đó (`--dry-run` được hỗ trợ; sử dụng `--allow-exec` để cho phép các nhà cung cấp exec trong các kế hoạch ghi chạy thử và có chứa exec).

## Plugins

Quản lý các tiện ích mở rộng và cấu hình của chúng:

- `openclaw plugins list` — khám phá các plugin (sử dụng `--json` để có đầu ra máy).
- `openclaw plugins inspect <id>` — hiển thị chi tiết cho một plugin (`info` là một bí danh).
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — cài đặt một plugin (hoặc thêm đường dẫn plugin vào `plugins.load.paths`).
- `openclaw plugins marketplace list <marketplace>` — liệt kê các mục trong marketplace trước khi cài đặt.
- `openclaw plugins enable <id>` / `disable <id>` — chuyển đổi `plugins.entries.<id>.enabled`.
- `openclaw plugins doctor` — báo cáo lỗi tải plugin.

Hầu hết các thay đổi plugin yêu cầu khởi động lại gateway. Xem [/plugin](/tools/plugin).

## Memory

Tìm kiếm vector qua `MEMORY.md` + `memory/*.md`:

- `openclaw memory status` — hiển thị thống kê chỉ mục.
- `openclaw memory index` — lập chỉ mục lại các tệp nhớ.
- `openclaw memory search "<query>"` (hoặc `--query "<query>"`) — tìm kiếm ngữ nghĩa qua bộ nhớ.

## Lệnh gạch chéo trong chat

Tin nhắn chat hỗ trợ các lệnh `/...` (văn bản và gốc). Xem [/tools/slash-commands](/tools/slash-commands).

Điểm nổi bật:

- `/status` để chẩn đoán nhanh.
- `/config` để thay đổi cấu hình được lưu trữ.
- `/debug` để ghi đè cấu hình chỉ trong runtime (bộ nhớ, không phải đĩa; yêu cầu `commands.debug: true`).

## Thiết lập + onboarding

### `setup`

Khởi tạo cấu hình + workspace.

Tùy chọn:

- `--workspace <dir>`: đường dẫn workspace của agent (mặc định `~/.openclaw/workspace`).
- `--wizard`: chạy onboarding.
- `--non-interactive`: chạy onboarding không có nhắc nhở.
- `--mode <local|remote>`: chế độ onboard.
- `--remote-url <url>`: URL Gateway từ xa.
- `--remote-token <token>`: token Gateway từ xa.

Onboarding tự động chạy khi có bất kỳ cờ onboarding nào (`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

### `onboard`

Onboarding tương tác cho gateway, workspace và kỹ năng.

Tùy chọn:

- `--workspace <dir>`
- `--reset` (đặt lại cấu hình + thông tin xác thực + phiên trước khi onboarding)
- `--reset-scope <config|config+creds+sessions|full>` (mặc định `config+creds+sessions`; sử dụng `full` để cũng xóa workspace)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (manual là bí danh cho advanced)
- `--auth-choice <setup-token|token|chutes|openai-codex|openai-api-key|openrouter-api-key|ollama|ai-gateway-api-key|moonshot-api-key|moonshot-api-key-cn|kimi-code-api-key|synthetic-api-key|venice-api-key|gemini-api-key|zai-api-key|mistral-api-key|apiKey|minimax-api|minimax-api-lightning|opencode-zen|opencode-go|custom-api-key|skip>`
- `--token-provider <id>` (không tương tác; sử dụng với `--auth-choice token`)
- `--token <token>` (không tương tác; sử dụng với `--auth-choice token`)
- `--token-profile-id <id>` (không tương tác; mặc định: `<provider>:manual`)
- `--token-expires-in <duration>` (không tương tác; ví dụ: `365d`, `12h`)
- `--secret-input-mode <plaintext|ref>` (mặc định `plaintext`; sử dụng `ref` để lưu trữ các tham chiếu môi trường mặc định của nhà cung cấp thay vì các khóa văn bản thuần túy)
- `--anthropic-api-key <key>`
- `--openai-api-key <key>`
- `--mistral-api-key <key>`
- `--openrouter-api-key <key>`
- `--ai-gateway-api-key <key>`
- `--moonshot-api-key <key>`
- `--kimi-code-api-key <key>`
- `--gemini-api-key <key>`
- `--zai-api-key <key>`
- `--minimax-api-key <key>`
- `--opencode-zen-api-key <key>`
- `--opencode-go-api-key <key>`
- `--custom-base-url <url>` (không tương tác; sử dụng với `--auth-choice custom-api-key` hoặc `--auth-choice ollama`)
- `--custom-model-id <id>` (không tương tác; sử dụng với `--auth-choice custom-api-key` hoặc `--auth-choice ollama`)
- `--custom-api-key <key>` (không tương tác; tùy chọn; sử dụng với `--auth-choice custom-api-key`; quay lại `CUSTOM_API_KEY` khi bị bỏ qua)
- `--custom-provider-id <id>` (không tương tác; id nhà cung cấp tùy chỉnh tùy chọn)
- `--custom-compatibility <openai|anthropic>` (không tương tác; tùy chọn; mặc định `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (không tương tác; lưu `gateway.auth.token` dưới dạng một env SecretRef; yêu cầu biến môi trường đó được đặt; không thể kết hợp với `--gateway-token`)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (bí danh: `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-health`
- `--skip-ui`
- `--node-manager <npm|pnpm|bun>` (pnpm được khuyến nghị; bun không được khuyến nghị cho runtime Gateway)
- `--json`

### `configure`

Trình hướng dẫn cấu hình tương tác (mô hình, kênh, kỹ năng, gateway).

### `config`

Trình trợ giúp cấu hình không tương tác (get/set/unset/file/validate). Chạy `openclaw config` mà không có
lệnh con sẽ khởi chạy trình hướng dẫn.

Lệnh con:

- `config get <path>`: in một giá trị cấu hình (đường dẫn dot/bracket).
- `config set`: hỗ trợ bốn chế độ gán:
  - chế độ giá trị: `config set <path> <value>` (phân tích cú pháp JSON5-hoặc-chuỗi)
  - chế độ xây dựng SecretRef: `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - chế độ xây dựng nhà cung cấp: `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - chế độ hàng loạt: `config set --batch-json '<json>'` hoặc `config set --batch-file <path>`
- `config set --dry-run`: xác thực các gán mà không ghi `openclaw.json` (kiểm tra SecretRef exec bị bỏ qua theo mặc định).
- `config set --allow-exec --dry-run`: chọn tham gia kiểm tra SecretRef exec dry-run (có thể thực thi các lệnh của nhà cung cấp).
- `config set --dry-run --json`: phát ra đầu ra dry-run có thể đọc được bằng máy (kiểm tra + tín hiệu hoàn chỉnh, hoạt động, tham chiếu đã kiểm tra/bỏ qua, lỗi).
- `config set --strict-json`: yêu cầu phân tích cú pháp JSON5 cho đầu vào đường dẫn/giá trị. `--json` vẫn là một bí danh cũ cho phân tích cú pháp nghiêm ngặt ngoài chế độ đầu ra dry-run.
- `config unset <path>`: xóa một giá trị.
- `config file`: in đường dẫn tệp cấu hình đang hoạt động.
- `config validate`: xác thực cấu hình hiện tại so với lược đồ mà không khởi động gateway.
- `config validate --json`: phát ra đầu ra JSON có thể đọc được bằng máy.

### `doctor`

Kiểm tra sức khỏe + sửa chữa nhanh (cấu hình + gateway + dịch vụ cũ).

Tùy chọn:

- `--no-workspace-suggestions`: tắt gợi ý bộ nhớ workspace.
- `--yes`: chấp nhận mặc định mà không nhắc nhở (không đầu).
- `--non-interactive`: bỏ qua nhắc nhở; chỉ áp dụng các di chuyển an toàn.
- `--deep`: quét các dịch vụ hệ thống để tìm các cài đặt gateway bổ sung.

## Trợ giúp kênh

### `channels`

Quản lý tài khoản kênh chat (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Microsoft Teams).

Lệnh con:

- `channels list`: hiển thị các kênh đã cấu hình và hồ sơ xác thực.
- `channels status`: kiểm tra khả năng truy cập gateway và sức khỏe kênh (`--probe` chạy các kiểm tra bổ sung; sử dụng `openclaw health` hoặc `openclaw status --deep` để thăm dò sức khỏe gateway).
- Mẹo: `channels status` in cảnh báo với các đề xuất sửa chữa khi nó có thể phát hiện các cấu hình sai phổ biến (sau đó chỉ bạn đến `openclaw doctor`).
- `channels logs`: hiển thị nhật ký kênh gần đây từ tệp nhật ký gateway.
- `channels add`: thiết lập kiểu wizard khi không có cờ nào được truyền; cờ chuyển sang chế độ không tương tác.
  - Khi thêm một tài khoản không mặc định vào một kênh vẫn sử dụng cấu hình cấp cao nhất cho một tài khoản, OpenClaw di chuyển các giá trị phạm vi tài khoản vào `channels.<channel>.accounts.default` trước khi ghi tài khoản mới.
  - `channels add` không tương tác không tự động tạo/nâng cấp các ràng buộc; các ràng buộc chỉ kênh tiếp tục khớp với tài khoản mặc định.
- `channels remove`: tắt theo mặc định; truyền `--delete` để xóa các mục cấu hình mà không cần nhắc nhở.
- `channels login`: đăng nhập kênh tương tác (chỉ WhatsApp Web).
- `channels logout`: đăng xuất khỏi phiên kênh (nếu được hỗ trợ).

Tùy chọn phổ biến:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: id tài khoản kênh (mặc định `default`)
- `--name <label>`: tên hiển thị cho tài khoản

Tùy chọn `channels login`:

- `--channel <channel>` (mặc định `whatsapp`; hỗ trợ `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

Tùy chọn `channels logout`:

- `--channel <channel>` (mặc định `whatsapp`)
- `--account <id>`

Tùy chọn `channels list`:

- `--no-usage`: bỏ qua ảnh chụp nhanh sử dụng/định mức của nhà cung cấp mô hình (chỉ hỗ trợ OAuth/API).
- `--json`: đầu ra JSON (bao gồm sử dụng trừ khi `--no-usage` được đặt).

Tùy chọn `channels logs`:

- `--channel <name|all>` (mặc định `all`)
- `--lines <n>` (mặc định `200`)
- `--json`

Chi tiết thêm: [/concepts/oauth](/concepts/oauth)

Ví dụ:

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `skills`

Liệt kê và kiểm tra các kỹ năng có sẵn cùng thông tin sẵn sàng.

Lệnh con:

- `skills list`: liệt kê các kỹ năng (mặc định khi không có lệnh con).
- `skills info <name>`: hiển thị chi tiết cho một kỹ năng.
- `skills check`: tóm tắt các yêu cầu sẵn sàng so với thiếu.

Tùy chọn:

- `--eligible`: chỉ hiển thị các kỹ năng sẵn sàng.
- `--json`: đầu ra JSON (không có định dạng).
- `-v`, `--verbose`: bao gồm chi tiết yêu cầu thiếu.

Mẹo: sử dụng `npx clawhub` để tìm kiếm, cài đặt và đồng bộ hóa kỹ năng.

### `pairing`

Phê duyệt yêu cầu ghép đôi DM trên các kênh.

Lệnh con:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

### `devices`

Quản lý các mục ghép đôi thiết bị gateway và token thiết bị theo vai trò.

Lệnh con:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

### `webhooks gmail`

Thiết lập hook Pub/Sub Gmail + runner. Xem [/automation/gmail-pubsub](/automation/gmail-pubsub).

Lệnh con:

- `webhooks gmail setup` (yêu cầu `--account <email>`; hỗ trợ `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`)
- `webhooks gmail run` (ghi đè runtime cho cùng các cờ)

### `dns setup`

Trợ giúp DNS khám phá diện rộng (CoreDNS + Tailscale). Xem [/gateway/discovery](/gateway/discovery).

Tùy chọn:

- `--apply`: cài đặt/cập nhật cấu hình CoreDNS (yêu cầu sudo; chỉ macOS).

## Nhắn tin + agent

### `message`

Nhắn tin ra ngoài hợp nhất + hành động kênh.

Xem: [/cli/message](/cli/message)

Lệnh con:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

Ví dụ:

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

Chạy một lượt agent thông qua Gateway (hoặc `--local` nhúng).

Yêu cầu:

- `--message <text>`

Tùy chọn:

- `--to <dest>` (cho khóa phiên và tùy chọn giao hàng)
- `--session-id <id>`
- `--thinking <off|minimal|low|medium|high|xhigh>` (chỉ mô hình GPT-5.2 + Codex)
- `--verbose <on|full|off>`
- `--channel <whatsapp|telegram|discord|slack|mattermost|signal|imessage|msteams>`
- `--local`
- `--deliver`
- `--json`
- `--timeout <seconds>`

### `agents`

Quản lý các agent cô lập (workspaces + xác thực + định tuyến).

#### `agents list`

Liệt kê các agent đã cấu hình.

Tùy chọn:

- `--json`
- `--bindings`

#### `agents add [name]`

Thêm một agent cô lập mới. Chạy trình hướng dẫn có hướng dẫn trừ khi có cờ (hoặc `--non-interactive`) được truyền; `--workspace` là bắt buộc trong chế độ không tương tác.

Tùy chọn:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (lặp lại)
- `--non-interactive`
- `--json`

Thông số ràng buộc sử dụng `channel[:accountId]`. Khi `accountId` bị bỏ qua, OpenClaw có thể giải quyết phạm vi tài khoản thông qua các mặc định kênh/plugin hooks; nếu không, đó là một ràng buộc kênh mà không có phạm vi tài khoản rõ ràng.

#### `agents bindings`

Liệt kê các ràng buộc định tuyến.

Tùy chọn:

- `--agent <id>`
- `--json`

#### `agents bind`

Thêm các ràng buộc định tuyến cho một agent.

Tùy chọn:

- `--agent <id>`
- `--bind <channel[:accountId]>` (lặp lại)
- `--json`

#### `agents unbind`

Xóa các ràng buộc định tuyến cho một agent.

Tùy chọn:

- `--agent <id>`
- `--bind <channel[:accountId]>` (lặp lại)
- `--all`
- `--json`

#### `agents delete <id>`

Xóa một agent và cắt tỉa workspace + trạng thái của nó.

Tùy chọn:

- `--force`
- `--json`

### `acp`

Chạy cầu nối ACP kết nối IDE với Gateway.

Xem [`acp`](/cli/acp) để biết đầy đủ tùy chọn và ví dụ.

### `status`

Hiển thị sức khỏe phiên được liên kết và người nhận gần đây.

Tùy chọn:

- `--json`
- `--all` (chẩn đoán đầy đủ; chỉ đọc, có thể dán)
- `--deep` (thăm dò các kênh)
- `--usage` (hiển thị sử dụng/định mức của nhà cung cấp mô hình)
- `--timeout <ms>`
- `--verbose`
- `--debug` (bí danh cho `--verbose`)

Ghi chú:

- Tổng quan bao gồm trạng thái dịch vụ máy chủ Gateway + node khi có sẵn.

### Theo dõi sử dụng

OpenClaw có thể hiển thị sử dụng/định mức của nhà cung cấp khi có thông tin xác thực OAuth/API.

Bề mặt:

- `/status` (thêm một dòng sử dụng nhà cung cấp ngắn khi có sẵn)
- `openclaw status --usage` (in đầy đủ phân tích nhà cung cấp)
- thanh menu macOS (phần Sử dụng dưới Context)

Ghi chú:

- Dữ liệu đến trực tiếp từ các điểm cuối sử dụng của nhà cung cấp (không có ước tính).
- Nhà cung cấp: Anthropic, GitHub Copilot, OpenAI Codex OAuth, cộng với Gemini CLI thông qua plugin `google` đi kèm và Antigravity khi được cấu hình.
- Nếu không có thông tin xác thực phù hợp, việc sử dụng sẽ bị ẩn.
- Chi tiết: xem [Theo dõi sử dụng](/concepts/usage-tracking).

### `health`

Lấy sức khỏe từ Gateway đang chạy.

Tùy chọn:

- `--json`
- `--timeout <ms>`
- `--verbose`

### `sessions`

Liệt kê các phiên hội thoại đã lưu trữ.

Tùy chọn:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`

## Đặt lại / Gỡ cài đặt

### `reset`

Đặt lại cấu hình/trạng thái cục bộ (giữ CLI được cài đặt).

Tùy chọn:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Ghi chú:

- `--non-interactive` yêu cầu `--scope` và `--yes`.

### `uninstall`

Gỡ cài đặt dịch vụ gateway + dữ liệu cục bộ (CLI vẫn còn).

Tùy chọn:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

Ghi chú:

- `--non-interactive` yêu cầu `--yes` và các phạm vi rõ ràng (hoặc `--all`).

## Gateway

### `gateway`

Chạy Gateway WebSocket.

Tùy chọn:

- `--port <port>`
- `--bind <loopback|tailnet|lan|auto|custom>`
- `--token <token>`
- `--auth <token|password>`
- `--password <password>`
- `--password-file <path>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--allow-unconfigured`
- `--dev`
- `--reset` (đặt lại cấu hình dev + thông tin xác thực + phiên + workspace)
- `--force` (giết listener hiện có trên cổng)
- `--verbose`
- `--claude-cli-logs`
- `--ws-log <auto|full|compact>`
- `--compact` (bí danh cho `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Quản lý dịch vụ Gateway (launchd/systemd/schtasks).

Lệnh con:

- `gateway status` (thăm dò RPC Gateway theo mặc định)
- `gateway install` (cài đặt dịch vụ)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Ghi chú:

- `gateway status` thăm dò RPC Gateway theo mặc định sử dụng cổng/cấu hình đã giải quyết của dịch vụ (ghi đè bằng `--url/--token/--password`).
- `gateway status` hỗ trợ `--no-probe`, `--deep`, `--require-rpc`, và `--json` cho scripting.
- `gateway status` cũng hiển thị các dịch vụ gateway cũ hoặc bổ sung khi nó có thể phát hiện chúng (`--deep` thêm các quét cấp hệ thống). Các dịch vụ OpenClaw được đặt tên theo hồ sơ được coi là hạng nhất và không bị gắn cờ là "bổ sung".
- `gateway status` in đường dẫn cấu hình mà CLI sử dụng so với cấu hình mà dịch vụ có thể sử dụng (môi trường dịch vụ), cộng với URL mục tiêu thăm dò đã giải quyết.
- Nếu các SecretRefs xác thực gateway chưa được giải quyết trong đường dẫn lệnh hiện tại, `gateway status --json` báo cáo `rpc.authWarning` chỉ khi kết nối thăm dò/xác thực thất bại (cảnh báo bị ẩn khi thăm dò thành công).
- Trên các cài đặt Linux systemd, kiểm tra trôi dạt token trạng thái bao gồm cả nguồn `Environment=` và `EnvironmentFile=` của đơn vị.
- `gateway install|uninstall|start|stop|restart` hỗ trợ `--json` cho scripting (đầu ra mặc định vẫn thân thiện với con người).
- `gateway install` mặc định sử dụng runtime Node; bun **không được khuyến nghị** (lỗi WhatsApp/Telegram).
- Tùy chọn `gateway install`: `--port`, `--runtime`, `--token`, `--force`, `--json`.

### `logs`

Theo dõi nhật ký tệp Gateway qua RPC.

Ghi chú:

- Các phiên TTY hiển thị chế độ xem có cấu trúc, có màu sắc; không TTY quay lại văn bản thuần túy.
- `--json` phát ra JSON phân dòng (một sự kiện nhật ký mỗi dòng).

Ví dụ:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

### `gateway <subcommand>`

Trình trợ giúp CLI Gateway (sử dụng `--url`, `--token`, `--password`, `--timeout`, `--expect-final` cho các lệnh con RPC).
Khi bạn truyền `--url`, CLI không tự động áp dụng cấu hình hoặc thông tin xác thực môi trường.
Bao gồm `--token` hoặc `--password` một cách rõ ràng. Thiếu thông tin xác thực rõ ràng là một lỗi.

Lệnh con:

- `gateway call <method> [--params <json>]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

RPC phổ biến:

- `config.apply` (xác thực + ghi cấu hình + khởi động lại + đánh thức)
- `config.patch` (hợp nhất một bản cập nhật một phần + khởi động lại + đánh thức)
- `update.run` (chạy cập nhật + khởi động lại + đánh thức)

Mẹo: khi gọi `config.set`/`config.apply`/`config.patch` trực tiếp, truyền `baseHash` từ
`config.get` nếu một cấu hình đã tồn tại.

## Models

Xem [/concepts/models](/concepts/models) để biết hành vi dự phòng và chiến lược quét.

Thiết lập token Anthropic (được hỗ trợ):

```bash
claude setup-token
openclaw models auth setup-token --provider anthropic
openclaw models status
```

Ghi chú chính sách: đây là khả năng tương thích kỹ thuật. Anthropic đã chặn một số
sử dụng đăng ký ngoài Claude Code trong quá khứ; xác minh các điều khoản hiện tại của Anthropic trước khi dựa vào setup-token trong sản xuất.

### `models` (gốc)

`openclaw models` là một bí danh cho `models status`.

Tùy chọn gốc:

- `--status-json` (bí danh cho `models status --json`)
- `--status-plain` (bí danh cho `models status --plain`)

### `models list`

Tùy chọn:

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`

Tùy chọn:

- `--json`
- `--plain`
- `--check` (thoát 1=hết hạn/thiếu, 2=sắp hết hạn)
- `--probe` (thăm dò trực tiếp các hồ sơ xác thực đã cấu hình)
- `--probe-provider <name>`
- `--probe-profile <id>` (lặp lại hoặc phân tách bằng dấu phẩy)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`

Luôn bao gồm tổng quan xác thực và trạng thái hết hạn OAuth cho các hồ sơ trong kho lưu trữ xác thực.
`--probe` chạy các yêu cầu trực tiếp (có thể tiêu thụ token và kích hoạt giới hạn tốc độ).

### `models set <model>`

Đặt `agents.defaults.model.primary`.

### `models set-image <model>`

Đặt `agents.defaults.imageModel.primary`.

### `models aliases list|add|remove`

Tùy chọn:

- `list`: `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

Tùy chọn:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

Tùy chọn:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

Tùy chọn:

- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`
- `--concurrency <n>`
- `--no-probe`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

### `models auth add|setup-token|paste-token`

Tùy chọn:

- `add`: trợ giúp xác thực tương tác
- `setup-token`: `--provider <name>` (mặc định `anthropic`), `--yes`
- `paste-token`: `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

### `models auth order get|set|clear`

Tùy chọn:

- `get`: `--provider <name>`, `--agent <id>`, `--json`
- `set`: `--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear`: `--provider <name>`, `--agent <id>`

## Hệ thống

### `system event`

Xếp hàng một sự kiện hệ thống và tùy chọn kích hoạt một nhịp tim (RPC Gateway).

Yêu cầu:

- `--text <text>`

Tùy chọn:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

Điều khiển nhịp tim (RPC Gateway).

Tùy chọn:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

Liệt kê các mục hiện diện hệ thống (RPC Gateway).

Tùy chọn:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

Quản lý các công việc đã lên lịch (RPC Gateway). Xem [/automation/cron-jobs](/automation/cron-jobs).

Lệnh con:

- `cron status [--json]`
- `cron list [--all] [--json]` (đầu ra bảng theo mặc định; sử dụng `--json` để có thô)
- `cron add` (bí danh: `create`; yêu cầu `--name` và chính xác một trong `--at` | `--every` | `--cron`, và chính xác một payload của `--system-event` | `--message`)
- `cron edit <id>` (sửa các trường)
- `cron rm <id>` (bí danh: `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--force]`

Tất cả các lệnh `cron` chấp nhận `--url`, `--token`, `--timeout`, `--expect-final`.

## Máy chủ node

`node` chạy một **máy chủ node không đầu** hoặc quản lý nó như một dịch vụ nền. Xem
[`openclaw node`](/cli/node).

Lệnh con:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Ghi chú xác thực:

- `node` giải quyết xác thực gateway từ env/config (không có cờ `--token`/`--password`): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, sau đó `gateway.auth.*`. Trong chế độ cục bộ, máy chủ node cố ý bỏ qua `gateway.remote.*`; trong `gateway.mode=remote`, `gateway.remote.*` tham gia theo các quy tắc ưu tiên từ xa.
- Các biến môi trường `CLAWDBOT_GATEWAY_*` cũ cố ý bị bỏ qua để giải quyết xác thực máy chủ node.

## Nodes

`nodes` nói chuyện với Gateway và nhắm mục tiêu các node đã ghép đôi. Xem [/nodes](/nodes).

Tùy chọn phổ biến:

- `--url`, `--token`, `--timeout`, `--json`

Lệnh con:

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes run --node <id|name|ip> [--cwd <path>] [--env KEY=VAL] [--command-timeout <ms>] [--needs-screen-recording] [--invoke-timeout <ms>] <command...>` (node mac hoặc máy chủ node không đầu)
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (chỉ mac)

Camera:

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + màn hình:

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

Vị trí:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Trình duyệt

CLI điều khiển trình duyệt (Chrome/Brave/Edge/Chromium chuyên dụng). Xem [`openclaw browser`](/cli/browser) và [Công cụ trình duyệt](/tools/browser).

Tùy chọn phổ biến:

- `--url`, `--token`, `--timeout`, `--json`
- `--browser-profile <name>`

Quản lý:

- `browser status`
- `browser start`
- `browser stop`
- `browser reset-profile`
- `browser tabs`
- `browser open <url>`
- `browser focus <targetId>`
- `browser close [targetId]`
- `browser profiles`
- `browser create-profile --name <name> [--color <hex>] [--cdp-url <url>]`
- `browser delete-profile --name <name>`

Kiểm tra:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

Hành động:

- `browser navigate <url> [--target-id <id>]`
- `browser resize <width> <height> [--target-id <id>]`
- `browser click <ref> [--double] [--button <left|right|middle>] [--modifiers <csv>] [--target-id <id>]`
- `browser type <ref> <text> [--submit] [--slowly] [--target-id <id>]`
- `browser press <key> [--target-id <id>]`
- `browser hover <ref> [--target-id <id>]`
- `browser drag <startRef> <endRef> [--target-id <id>]`
- `browser select <ref> <values...> [--target-id <id>]`
- `browser upload <paths...> [--ref <ref>] [--input-ref <ref>] [--element <selector>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser fill [--fields <json>] [--fields-file <path>] [--target-id <id>]`
- `browser dialog --accept|--dismiss [--prompt <text>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser wait [--time <ms>] [--text <value>] [--text-gone <value>] [--target-id <id>]`
- `browser evaluate --fn <code> [--ref <ref>] [--target-id <id>]`
- `browser console [--level <error|warn|info>] [--target-id <id>]`
- `browser pdf [--target-id <id>]`

## Tìm kiếm tài liệu

### `docs [query...]`

Tìm kiếm chỉ mục tài liệu trực tiếp.

## TUI

### `tui`

Mở giao diện người dùng terminal kết nối với Gateway.

Tùy chọn:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (mặc định là `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
