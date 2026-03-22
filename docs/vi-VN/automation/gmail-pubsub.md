---
summary: "Kết nối Gmail Pub/Sub push với webhook của OpenClaw qua gogcli"
read_when:
  - Kết nối kích hoạt hộp thư Gmail với OpenClaw
  - Thiết lập Pub/Sub push để đánh thức agent
title: "Gmail PubSub"
---

# Gmail Pub/Sub -> OpenClaw

Mục tiêu: Theo dõi Gmail -> Pub/Sub push -> `gog gmail watch serve` -> webhook của OpenClaw.

## Yêu cầu trước

- Đã cài đặt và đăng nhập `gcloud` ([hướng dẫn cài đặt](https://docs.cloud.google.com/sdk/docs/install-sdk)).
- Đã cài đặt và ủy quyền `gog` (gogcli) cho tài khoản Gmail ([gogcli.sh](https://gogcli.sh/)).
- Đã bật webhook của OpenClaw (xem [Webhooks](/automation/webhook)).
- Đã đăng nhập `tailscale` ([tailscale.com](https://tailscale.com/)). Thiết lập hỗ trợ sử dụng Tailscale Funnel cho endpoint HTTPS công khai.
  Các dịch vụ tunnel khác có thể hoạt động nhưng cần tự thiết lập và không được hỗ trợ.
  Hiện tại, Tailscale là dịch vụ được hỗ trợ.

Cấu hình hook ví dụ (bật ánh xạ preset Gmail):

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

Để gửi tóm tắt Gmail đến một nền tảng chat, ghi đè preset với ánh xạ
đặt `deliver` + tùy chọn `channel`/`to`:

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
        messageTemplate: "Email mới từ {{messages[0].from}}\nChủ đề: {{messages[0].subject}}\n{{messages[0].snippet}}\n{{messages[0].body}}",
        model: "openai/gpt-5.2-mini",
        deliver: true,
        channel: "last",
        // to: "+15551234567"
      },
    ],
  },
}
```

Nếu muốn sử dụng một kênh cố định, đặt `channel` + `to`. Nếu không, `channel: "last"`
sử dụng tuyến đường gửi cuối cùng (dự phòng cho WhatsApp).

Để sử dụng mô hình rẻ hơn cho các lần chạy Gmail, đặt `model` trong ánh xạ
(`provider/model` hoặc alias). Nếu bạn áp dụng `agents.defaults.models`, hãy bao gồm nó ở đó.

Để đặt mô hình mặc định và mức độ suy nghĩ cụ thể cho các hook Gmail, thêm
`hooks.gmail.model` / `hooks.gmail.thinking` trong cấu hình của bạn:

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

Lưu ý:

- `model`/`thinking` theo từng hook trong ánh xạ vẫn ghi đè các mặc định này.
- Thứ tự dự phòng: `hooks.gmail.model` → `agents.defaults.model.fallbacks` → chính (xác thực/giới hạn tốc độ/thời gian chờ).
- Nếu `agents.defaults.models` được đặt, mô hình Gmail phải nằm trong danh sách cho phép.
- Nội dung hook Gmail được bao bọc với ranh giới an toàn nội dung bên ngoài theo mặc định.
  Để tắt (nguy hiểm), đặt `hooks.gmail.allowUnsafeExternalContent: true`.

Để tùy chỉnh xử lý payload thêm, thêm `hooks.mappings` hoặc một module chuyển đổi JS/TS
dưới `~/.openclaw/hooks/transforms` (xem [Webhooks](/automation/webhook)).

## Trình hướng dẫn (khuyến nghị)

Sử dụng công cụ hỗ trợ của OpenClaw để kết nối mọi thứ (cài đặt các phụ thuộc trên macOS qua brew):

```bash
openclaw webhooks gmail setup \
  --account openclaw@gmail.com
```

Mặc định:

- Sử dụng Tailscale Funnel cho endpoint push công khai.
- Ghi cấu hình `hooks.gmail` cho `openclaw webhooks gmail run`.
- Bật preset hook Gmail (`hooks.presets: ["gmail"]`).

Lưu ý về đường dẫn: khi `tailscale.mode` được bật, OpenClaw tự động đặt
`hooks.gmail.serve.path` thành `/` và giữ đường dẫn công khai tại
`hooks.gmail.tailscale.path` (mặc định `/gmail-pubsub`) vì Tailscale
loại bỏ tiền tố đường dẫn đã đặt trước khi proxy.
Nếu bạn cần backend nhận đường dẫn có tiền tố, đặt
`hooks.gmail.tailscale.target` (hoặc `--tailscale-target`) thành một URL đầy đủ như
`http://127.0.0.1:8788/gmail-pubsub` và khớp với `hooks.gmail.serve.path`.

Muốn endpoint tùy chỉnh? Sử dụng `--push-endpoint <url>` hoặc `--tailscale off`.

Lưu ý về nền tảng: trên macOS, trình hướng dẫn cài đặt `gcloud`, `gogcli`, và `tailscale`
qua Homebrew; trên Linux, cài đặt chúng thủ công trước.

Tự động khởi động Gateway (khuyến nghị):

- Khi `hooks.enabled=true` và `hooks.gmail.account` được đặt, Gateway khởi động
  `gog gmail watch serve` khi khởi động và tự động gia hạn theo dõi.
- Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để không tham gia (hữu ích nếu bạn tự chạy daemon).
- Không chạy daemon thủ công cùng lúc, nếu không bạn sẽ gặp lỗi
  `listen tcp 127.0.0.1:8788: bind: address already in use`.

Daemon thủ công (khởi động `gog gmail watch serve` + tự động gia hạn):

```bash
openclaw webhooks gmail run
```

## Thiết lập một lần

1. Chọn dự án GCP **sở hữu client OAuth** được sử dụng bởi `gog`.

```bash
gcloud auth login
gcloud config set project <project-id>
```

Lưu ý: Theo dõi Gmail yêu cầu chủ đề Pub/Sub phải nằm trong cùng dự án với client OAuth.

2. Bật API:

```bash
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

3. Tạo một chủ đề:

```bash
gcloud pubsub topics create gog-gmail-watch
```

4. Cho phép Gmail push để xuất bản:

```bash
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

## Bắt đầu theo dõi

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

Lưu `history_id` từ đầu ra (để gỡ lỗi).

## Chạy trình xử lý push

Ví dụ cục bộ (xác thực token chia sẻ):

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

Lưu ý:

- `--token` bảo vệ endpoint push (`x-gog-token` hoặc `?token=`).
- `--hook-url` trỏ đến OpenClaw `/hooks/gmail` (được ánh xạ; chạy cô lập + tóm tắt đến chính).
- `--include-body` và `--max-bytes` kiểm soát đoạn nội dung gửi đến OpenClaw.

Khuyến nghị: `openclaw webhooks gmail run` bao bọc cùng luồng và tự động gia hạn theo dõi.

## Mở rộng trình xử lý (nâng cao, không được hỗ trợ)

Nếu bạn cần một tunnel không phải Tailscale, tự kết nối và sử dụng URL công khai trong đăng ký push
(không được hỗ trợ, không có bảo vệ):

```bash
cloudflared tunnel --url http://127.0.0.1:8788 --no-autoupdate
```

Sử dụng URL được tạo làm endpoint push:

```bash
gcloud pubsub subscriptions create gog-gmail-watch-push \
  --topic gog-gmail-watch \
  --push-endpoint "https://<public-url>/gmail-pubsub?token=<shared>"
```

Sản xuất: sử dụng một endpoint HTTPS ổn định và cấu hình Pub/Sub OIDC JWT, sau đó chạy:

```bash
gog gmail watch serve --verify-oidc --oidc-email <svc@...>
```

## Kiểm tra

Gửi một tin nhắn đến hộp thư được theo dõi:

```bash
gog gmail send \
  --account openclaw@gmail.com \
  --to openclaw@gmail.com \
  --subject "watch test" \
  --body "ping"
```

Kiểm tra trạng thái theo dõi và lịch sử:

```bash
gog gmail watch status --account openclaw@gmail.com
gog gmail history --account openclaw@gmail.com --since <historyId>
```

## Khắc phục sự cố

- `Invalid topicName`: không khớp dự án (chủ đề không nằm trong dự án client OAuth).
- `User not authorized`: thiếu `roles/pubsub.publisher` trên chủ đề.
- Tin nhắn trống: Gmail push chỉ cung cấp `historyId`; lấy qua `gog gmail history`.

## Dọn dẹp

```bash
gog gmail watch stop --account openclaw@gmail.com
gcloud pubsub subscriptions delete gog-gmail-watch-push
gcloud pubsub topics delete gog-gmail-watch
```
