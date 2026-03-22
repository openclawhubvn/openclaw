# Authentication

OpenClaw hỗ trợ OAuth và API keys cho model providers. Với các gateway host luôn bật, API keys thường là lựa chọn ổn định nhất. Cũng hỗ trợ Subscription/OAuth khi phù hợp với tài khoản provider.

Xem chi tiết luồng OAuth và cách lưu trữ tại [/concepts/oauth](/concepts/oauth).
Với auth dựa trên SecretRef (`env`/`file`/`exec` providers), xem [Secrets Management](/gateway/secrets).
Quy tắc eligibility/reason-code cho `models status --probe`, xem [Auth Credential Semantics](/auth-credential-semantics).

## Cài đặt khuyến nghị (API key, mọi provider)

Nếu chạy gateway lâu dài, bắt đầu với API key cho provider đã chọn.
Đặc biệt với Anthropic, API key là lựa chọn an toàn hơn setup-token.

1. Tạo API key trong console của provider.
2. Đặt API key trên **gateway host** (máy chạy `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Nếu Gateway chạy dưới systemd/launchd, nên đặt key trong `~/.openclaw/.env` để daemon đọc được:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Sau đó khởi động lại daemon (hoặc quá trình Gateway) và kiểm tra lại:

```bash
openclaw models status
openclaw doctor
```

Nếu không muốn tự quản lý env vars, onboarding có thể lưu API keys cho daemon: `openclaw onboard`.

Xem [Help](/help) để biết chi tiết về env inheritance (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd).

## Anthropic: setup-token (subscription auth)

Nếu dùng Claude subscription, hỗ trợ setup-token flow. Chạy trên **gateway host**:

```bash
claude setup-token
```

Sau đó dán vào OpenClaw:

```bash
openclaw models auth setup-token --provider anthropic
```

Nếu token tạo trên máy khác, dán thủ công:

```bash
openclaw models auth paste-token --provider anthropic
```

Nếu gặp lỗi Anthropic như:

```
This credential is only authorized for use with Claude Code and cannot be used for other API requests.
```

…dùng Anthropic API key thay thế.

<Warning>
Hỗ trợ setup-token của Anthropic chỉ là tương thích kỹ thuật. Anthropic đã chặn một số sử dụng subscription ngoài Claude Code trước đây. Chỉ dùng nếu chấp nhận rủi ro chính sách và tự kiểm tra điều khoản hiện tại của Anthropic.
</Warning>

Nhập token thủ công (mọi provider; ghi `auth-profiles.json` + cập nhật config):

```bash
openclaw models auth paste-token --provider anthropic
openclaw models auth paste-token --provider openrouter
```

Hỗ trợ auth profile refs cho static credentials:

- `api_key` credentials có thể dùng `keyRef: { source, provider, id }`
- `token` credentials có thể dùng `tokenRef: { source, provider, id }`

Kiểm tra tự động (thoát `1` khi hết hạn/thiếu, `2` khi sắp hết hạn):

```bash
openclaw models status --check
```

Tài liệu scripts ops tùy chọn (systemd/Termux) tại:
[/automation/auth-monitoring](/automation/auth-monitoring)

> `claude setup-token` yêu cầu TTY tương tác.

## Kiểm tra trạng thái model auth

```bash
openclaw models status
openclaw doctor
```

## Hành vi xoay vòng API key (gateway)

Một số providers hỗ trợ thử lại request với key khác khi API call bị giới hạn.

- Thứ tự ưu tiên:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override đơn)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google providers cũng bao gồm `GOOGLE_API_KEY` như fallback thêm.
- Danh sách key được loại bỏ trùng lặp trước khi dùng.
- OpenClaw chỉ thử lại với key khác cho lỗi giới hạn (ví dụ `429`, `rate_limit`, `quota`, `resource exhausted`).
- Lỗi không phải giới hạn không thử lại với key khác.
- Nếu tất cả keys thất bại, trả về lỗi cuối từ lần thử cuối.

## Kiểm soát credential sử dụng

### Per-session (chat command)

Dùng `/model <alias-or-id>@<profileId>` để cố định credential provider cho session hiện tại (ví dụ profile ids: `anthropic:default`, `anthropic:work`).

Dùng `/model` (hoặc `/model list`) để chọn nhanh; dùng `/model status` để xem đầy đủ (candidates + next auth profile, chi tiết endpoint provider khi cấu hình).

### Per-agent (CLI override)

Đặt thứ tự auth profile override cho agent (lưu trong `auth-profiles.json` của agent đó):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Dùng `--agent <id>` để nhắm đến agent cụ thể; bỏ qua để dùng agent mặc định đã cấu hình.

## Troubleshooting

### "No credentials found"

Nếu thiếu Anthropic token profile, chạy `claude setup-token` trên **gateway host**, sau đó kiểm tra lại:

```bash
openclaw models status
```

### Token sắp hết hạn/đã hết hạn

Chạy `openclaw models status` để xác nhận profile nào sắp hết hạn. Nếu thiếu profile, chạy lại `claude setup-token` và dán token lại.

## Yêu cầu

- Tài khoản subscription Anthropic (cho `claude setup-token`)
- Cài đặt Claude Code CLI (`claude` command khả dụng)\n