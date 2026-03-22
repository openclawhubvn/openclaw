# Gmail Pub/Sub -> OpenClaw

Mục tiêu: Gmail watch -> Pub/Sub push -> `gog gmail watch serve` -> OpenClaw webhook.

## Yêu cầu

- Cài và đăng nhập `gcloud` ([hướng dẫn cài đặt](https://docs.cloud.google.com/sdk/docs/install-sdk)).
- Cài và ủy quyền `gog` (gogcli) cho tài khoản Gmail ([gogcli.sh](https://gogcli.sh/)).
- Kích hoạt OpenClaw hooks (xem [Webhooks](/automation/webhook)).
- Đăng nhập `tailscale` ([tailscale.com](https://tailscale.com/)). Sử dụng Tailscale Funnel cho endpoint HTTPS công khai. Các dịch vụ tunnel khác có thể dùng nhưng cần tự cấu hình.

Cấu hình hook mẫu (kích hoạt mapping Gmail preset):

```json5
{
  hooks: {
    enabled: true,
    token: "OPENCLAW_HOOK_TOKEN",
    path: "/hooks",
    presets: ["gmail"],
  },
}
```

Để gửi tóm tắt Gmail đến chat, ghi đè preset với mapping thiết lập `deliver` + `channel`/`to` tùy chọn:

```json5
{
  hooks: {
    enabled: true,
    token: "OPENCLAW_HOOK_TOKEN",
    presets: ["gmail"],
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "New email from {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}\n{{messages[0].body}}",
        model: "openai/gpt-5.2-mini",
        deliver: true,
        channel: "last",
        // to: "+15551234567"
      },
    ],
  },
}
```

Muốn dùng channel cố định, thiết lập `channel` + `to`. Nếu không, `channel: "last"` dùng route gửi cuối (mặc định WhatsApp).

Để dùng model rẻ hơn cho Gmail, thiết lập `model` trong mapping (`provider/model` hoặc alias). Nếu dùng `agents.defaults.models`, thêm vào đó.

Để thiết lập model và mức độ suy nghĩ mặc định cho Gmail hooks, thêm `hooks.gmail.model` / `hooks.gmail.thinking` vào config:

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

Ghi chú:

- `model`/`thinking` trong mapping vẫn ghi đè mặc định này.
- Thứ tự fallback: `hooks.gmail.model` → `agents.defaults.model.fallbacks` → primary (auth/rate-limit/timeouts).
- Nếu `agents.defaults.models` được thiết lập, model Gmail phải nằm trong danh sách cho phép.
- Nội dung hook Gmail được bao bọc với ranh giới an toàn mặc định. Để tắt (nguy hiểm), thiết lập `hooks.gmail.allowUnsafeExternalContent: true`.

Để tùy chỉnh xử lý payload thêm, thêm `hooks.mappings` hoặc module transform JS/TS dưới `~/.openclaw/hooks/transforms` (xem [Webhooks](/automation/webhook)).

## Wizard (khuyến nghị)

Dùng OpenClaw helper để kết nối mọi thứ (cài deps trên macOS qua brew):

```bash
openclaw webhooks gmail setup \
  --account openclaw@gmail.com
```

Mặc định:

- Dùng Tailscale Funnel cho endpoint push công khai.
- Ghi `hooks.gmail` config cho `openclaw webhooks gmail run`.
- Kích hoạt Gmail hook preset (`hooks.presets: ["gmail"]`).

Lưu ý đường dẫn: khi `tailscale.mode` bật, OpenClaw tự động thiết lập `hooks.gmail.serve.path` thành `/` và giữ đường dẫn công khai tại `hooks.gmail.tailscale.path` (mặc định `/gmail-pubsub`) vì Tailscale loại bỏ prefix trước khi proxy.
Nếu cần backend nhận đường dẫn có prefix, thiết lập `hooks.gmail.tailscale.target` (hoặc `--tailscale-target`) thành URL đầy đủ như `http://127.0.0.1:8788/gmail-pubsub` và khớp `hooks.gmail.serve.path`.

Muốn endpoint tùy chỉnh? Dùng `--push-endpoint <url>` hoặc `--tailscale off`.

Lưu ý nền tảng: trên macOS wizard cài `gcloud`, `gogcli`, và `tailscale` qua Homebrew; trên Linux cài thủ công trước.

Tự động khởi động Gateway (khuyến nghị):

- Khi `hooks.enabled=true` và `hooks.gmail.account` được thiết lập, Gateway khởi động `gog gmail watch serve` khi boot và tự động gia hạn watch.
- Thiết lập `OPENCLAW_SKIP_GMAIL_WATCHER=1` để không tham gia (hữu ích nếu tự chạy daemon).
- Không chạy daemon thủ công cùng lúc, sẽ gặp lỗi `listen tcp 127.0.0.1:8788: bind: address already in use`.

Daemon thủ công (khởi động `gog gmail watch serve` + tự động gia hạn):

```bash
openclaw webhooks gmail run
```

## Thiết lập một lần

1. Chọn dự án GCP **sở hữu OAuth client** dùng bởi `gog`.

```bash
gcloud auth login
gcloud config set project <project-id>
```

Lưu ý: Gmail watch yêu cầu Pub/Sub topic nằm trong cùng dự án với OAuth client.

2. Kích hoạt APIs:

```bash
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

3. Tạo topic:

```bash
gcloud pubsub topics create gog-gmail-watch
```

4. Cho phép Gmail push publish:

```bash
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

## Bắt đầu watch

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

Lưu `history_id` từ output (để debug).

## Chạy push handler

Ví dụ local (xác thực token chia sẻ):

```bash
gog gmail watch serve \
  --account openclaw@gmail.com \
  --bind 127.0.0.1 \
  --port 8788 \
  --path /gmail-pubsub \
  --token <shared> \
  --hook-url http://127.0.0.1:18789/hooks/gmail \
  --hook-token OPENCLAW_HOOK_TOKEN \
  --include-body \
  --max-bytes 20000
```

Ghi chú:

- `--token` bảo vệ endpoint push (`x-gog-token` hoặc `?token=`).
- `--hook-url` trỏ đến OpenClaw `/hooks/gmail` (mapped; isolated run + summary to main).
- `--include-body` và `--max-bytes` điều khiển snippet body gửi đến OpenClaw.

Khuyến nghị: `openclaw webhooks gmail run` bao bọc cùng flow và tự động gia hạn watch.

## Expose handler (nâng cao, không hỗ trợ)

Nếu cần tunnel không dùng Tailscale, tự cấu hình và dùng URL công khai trong push subscription (không hỗ trợ, không có guardrails):

```bash
cloudflared tunnel --url http://127.0.0.1:8788 --no-autoupdate
```

Dùng URL tạo ra làm endpoint push:

```bash
gcloud pubsub subscriptions create gog-gmail-watch-push \
  --topic gog-gmail-watch \
  --push-endpoint "https://<public-url>/gmail-pubsub?token=<shared>"
```

Production: dùng endpoint HTTPS ổn định và cấu hình Pub/Sub OIDC JWT, sau đó chạy:

```bash
gog gmail watch serve --verify-oidc --oidc-email <svc@...>
```

## Test

Gửi tin nhắn đến inbox đang watch:

```bash
gog gmail send \
  --account openclaw@gmail.com \
  --to openclaw@gmail.com \
  --subject "watch test" \
  --body "ping"
```

Kiểm tra trạng thái watch và lịch sử:

```bash
gog gmail watch status --account openclaw@gmail.com
gog gmail history --account openclaw@gmail.com --since <historyId>
```

## Khắc phục sự cố

- `Invalid topicName`: không khớp dự án (topic không nằm trong dự án OAuth client).
- `User not authorized`: thiếu `roles/pubsub.publisher` trên topic.
- Tin nhắn trống: Gmail push chỉ cung cấp `historyId`; lấy qua `gog gmail history`.

## Dọn dẹp

```bash
gog gmail watch stop --account openclaw@gmail.com
gcloud pubsub subscriptions delete gog-gmail-watch-push
gcloud pubsub topics delete gog-gmail-watch
```\n