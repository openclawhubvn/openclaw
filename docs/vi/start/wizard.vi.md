---
summary: "CLI onboarding: thiết lập hướng dẫn cho gateway, workspace, channels và skills"
read_when:
  - Chạy hoặc cấu hình CLI onboarding
  - Thiết lập máy mới
title: "Onboarding (CLI)"
sidebarTitle: "Onboarding: CLI"
---

# Onboarding (CLI)

CLI onboarding là cách **khuyến nghị** để thiết lập OpenClaw trên macOS, Linux, hoặc Windows (qua WSL2; rất khuyến nghị). Nó cấu hình Gateway local hoặc kết nối Gateway từ xa, cùng với channels, skills và workspace mặc định trong một luồng hướng dẫn.

```bash
openclaw onboard
```

<Info>
Chat nhanh nhất: mở Control UI (không cần setup channel). Chạy `openclaw dashboard` và chat trong trình duyệt. Tài liệu: [Dashboard](/web/dashboard).
</Info>

Để cấu hình lại sau:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` không có nghĩa là chế độ không tương tác. Để chạy script, dùng `--non-interactive`.
</Note>

<Tip>
CLI onboarding có bước tìm kiếm web, bạn có thể chọn provider (Perplexity, Brave, Gemini, Grok, hoặc Kimi) và dán API key để agent dùng `web_search`. Cũng có thể cấu hình sau với `openclaw configure --section web`. Tài liệu: [Web tools](/tools/web).
</Tip>

## QuickStart vs Advanced

Onboarding bắt đầu với **QuickStart** (mặc định) hoặc **Advanced** (toàn quyền kiểm soát).

<Tabs>
  <Tab title="QuickStart (mặc định)">
    - Gateway local (loopback)
    - Workspace mặc định (hoặc workspace hiện có)
    - Cổng Gateway **18789**
    - Gateway auth **Token** (tự động tạo, ngay cả trên loopback)
    - Chính sách công cụ mặc định cho thiết lập local mới: `tools.profile: "coding"` (giữ nguyên profile hiện có)
    - DM isolation mặc định: onboarding local ghi `session.dmScope: "per-channel-peer"` khi chưa đặt. Chi tiết: [CLI Setup Reference](/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale exposure **Tắt**
    - Telegram + WhatsApp DMs mặc định **allowlist** (sẽ yêu cầu số điện thoại)
  </Tab>
  <Tab title="Advanced (toàn quyền kiểm soát)">
    - Hiển thị từng bước (mode, workspace, gateway, channels, daemon, skills).
  </Tab>
</Tabs>

## Onboarding cấu hình gì

**Local mode (mặc định)** hướng dẫn qua các bước:

1. **Model/Auth** — chọn provider/auth flow hỗ trợ (API key, OAuth, hoặc setup-token), bao gồm Custom Provider (tương thích OpenAI, Anthropic, hoặc tự động phát hiện Unknown). Chọn model mặc định. Lưu ý bảo mật: nếu agent chạy công cụ hoặc xử lý nội dung webhook/hooks, nên chọn model mạnh nhất thế hệ mới và giữ chính sách công cụ nghiêm ngặt. Các tier yếu/cũ dễ bị prompt-inject hơn. Với chạy không tương tác, `--secret-input-mode ref` lưu refs dựa trên env trong auth profiles thay vì giá trị API key plaintext. Trong chế độ `ref` không tương tác, biến môi trường provider phải được đặt; truyền inline key flags mà không có env var đó sẽ thất bại nhanh chóng. Trong chạy tương tác, chọn chế độ tham chiếu bí mật cho phép chỉ định biến môi trường hoặc ref provider đã cấu hình (`file` hoặc `exec`), với kiểm tra nhanh trước khi lưu.
2. **Workspace** — Vị trí cho file agent (mặc định `~/.openclaw/workspace`). Khởi tạo file bootstrap.
3. **Gateway** — Cổng, địa chỉ bind, chế độ auth, Tailscale exposure. Trong chế độ token tương tác, chọn lưu token plaintext mặc định hoặc chọn SecretRef. Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
4. **Channels** — WhatsApp, Telegram, Discord, Google Chat, Mattermost, Signal, BlueBubbles, hoặc iMessage.
5. **Daemon** — Cài đặt LaunchAgent (macOS) hoặc systemd user unit (Linux/WSL2). Nếu token auth yêu cầu token và `gateway.auth.token` được quản lý bởi SecretRef, cài đặt daemon xác thực nhưng không lưu token đã giải quyết vào metadata môi trường dịch vụ supervisor. Nếu token auth yêu cầu token và SecretRef token cấu hình chưa được giải quyết, cài đặt daemon bị chặn với hướng dẫn cụ thể. Nếu cả `gateway.auth.token` và `gateway.auth.password` được cấu hình và `gateway.auth.mode` chưa được đặt, cài đặt daemon bị chặn cho đến khi mode được đặt rõ ràng.
6. **Health check** — Khởi động Gateway và xác minh nó đang chạy.
7. **Skills** — Cài đặt skills khuyến nghị và các phụ thuộc tùy chọn.

<Note>
Chạy lại onboarding **không** xóa gì trừ khi chọn **Reset** (hoặc truyền `--reset`). CLI `--reset` mặc định cho config, credentials, và sessions; dùng `--reset-scope full` để bao gồm workspace. Nếu config không hợp lệ hoặc chứa khóa cũ, onboarding yêu cầu chạy `openclaw doctor` trước.
</Note>

**Remote mode** chỉ cấu hình client local để kết nối với Gateway ở nơi khác. Nó **không** cài đặt hoặc thay đổi gì trên host từ xa.

## Thêm agent khác

Dùng `openclaw agents add <name>` để tạo agent riêng với workspace, sessions, và auth profiles riêng. Chạy không có `--workspace` sẽ khởi động onboarding.

Thiết lập:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Ghi chú:

- Workspace mặc định theo `~/.openclaw/workspace-<agentId>`.
- Thêm `bindings` để định tuyến tin nhắn đến (onboarding có thể làm điều này).
- Flags không tương tác: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tham khảo đầy đủ

Để xem chi tiết từng bước và kết quả cấu hình, xem [CLI Setup Reference](/start/wizard-cli-reference). Để xem ví dụ không tương tác, xem [CLI Automation](/start/wizard-cli-automation). Để tham khảo kỹ thuật sâu hơn, bao gồm chi tiết RPC, xem [Onboarding Reference](/reference/wizard).

## Tài liệu liên quan

- Tham khảo lệnh CLI: [`openclaw onboard`](/cli/onboard)
- Tổng quan onboarding: [Onboarding Overview](/start/onboarding-overview)
- Onboarding ứng dụng macOS: [Onboarding](/start/onboarding)
- Nghi thức chạy đầu tiên của Agent: [Agent Bootstrapping](/start/bootstrapping)\n