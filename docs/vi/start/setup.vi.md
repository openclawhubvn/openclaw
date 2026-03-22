---
summary: "Thiết lập và quy trình phát triển nâng cao cho OpenClaw"
read_when:
  - Thiết lập máy mới
  - Muốn "mới nhất + tốt nhất" mà không phá vỡ cấu hình cá nhân
title: "Thiết lập"
---

# Thiết lập

<Note>
Nếu lần đầu thiết lập, bắt đầu với [Bắt đầu](/start/getting-started).
Chi tiết onboarding, xem [Onboarding (CLI)](/start/wizard).
</Note>

## Tóm tắt nhanh

- **Tùy chỉnh nằm ngoài repo:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (config).
- **Workflow ổn định:** cài app macOS; để nó chạy Gateway đi kèm.
- **Workflow mới nhất:** tự chạy Gateway qua `pnpm gateway:watch`, sau đó để app macOS kết nối ở chế độ Local.

## Yêu cầu (từ source)

- Node 24 khuyến nghị (Node 22 LTS, hiện tại `22.16+`, vẫn hỗ trợ)
- `pnpm`
- Docker (tùy chọn; chỉ cho setup container/e2e — xem [Docker](/install/docker))

## Chiến lược tùy chỉnh (để cập nhật không gây rắc rối)

Muốn "100% tùy chỉnh cho mình" _và_ cập nhật dễ dàng, giữ tùy chỉnh trong:

- **Config:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Workspace:** `~/.openclaw/workspace` (skills, prompts, memories; tạo thành repo git riêng tư)

Khởi tạo một lần:

```bash
openclaw setup
```

Từ trong repo này, dùng CLI local:

```bash
openclaw setup
```

Nếu chưa cài đặt global, chạy qua `pnpm openclaw setup`.

## Chạy Gateway từ repo này

Sau `pnpm build`, có thể chạy CLI đã đóng gói trực tiếp:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Workflow ổn định (app macOS trước)

1. Cài đặt + khởi chạy **OpenClaw.app** (menu bar).
2. Hoàn thành checklist onboarding/permissions (TCC prompts).
3. Đảm bảo Gateway là **Local** và đang chạy (app quản lý nó).
4. Liên kết surfaces (ví dụ: WhatsApp):

```bash
openclaw channels login
```

5. Kiểm tra sanity:

```bash
openclaw health
```

Nếu onboarding không có trong bản build:

- Chạy `openclaw setup`, sau đó `openclaw channels login`, rồi khởi động Gateway thủ công (`openclaw gateway`).

## Workflow mới nhất (Gateway trong terminal)

Mục tiêu: làm việc trên TypeScript Gateway, có hot reload, giữ UI app macOS kết nối.

### 0) (Tùy chọn) Chạy app macOS từ source

Nếu muốn app macOS cũng mới nhất:

```bash
./scripts/restart-mac.sh
```

### 1) Khởi động dev Gateway

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` chạy gateway ở chế độ watch và reload khi có thay đổi source,
config, và metadata plugin đi kèm.

### 2) Chỉ định app macOS tới Gateway đang chạy

Trong **OpenClaw.app**:

- Connection Mode: **Local**
  App sẽ kết nối tới gateway đang chạy trên cổng đã cấu hình.

### 3) Xác minh

- Trạng thái Gateway trong app nên đọc là **“Using existing gateway …”**
- Hoặc qua CLI:

```bash
openclaw health
```

### Lỗi thường gặp

- **Sai cổng:** Gateway WS mặc định `ws://127.0.0.1:18789`; giữ app + CLI trên cùng cổng.
- **Nơi lưu trữ trạng thái:**
  - Credentials: `~/.openclaw/credentials/`
  - Sessions: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Bản đồ lưu trữ Credential

Dùng khi debug auth hoặc quyết định backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env hoặc `channels.telegram.tokenFile` (chỉ file thường; symlinks bị từ chối)
- **Discord bot token**: config/env hoặc SecretRef (env/file/exec providers)
- **Slack tokens**: config/env (`channels.slack.*`)
- **Danh sách cho phép ghép đôi**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (tài khoản mặc định)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (tài khoản không mặc định)
- **Hồ sơ xác thực mô hình**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload bí mật dựa trên file (tùy chọn)**: `~/.openclaw/secrets.json`
- **Nhập OAuth cũ**: `~/.openclaw/credentials/oauth.json`
  Chi tiết thêm: [Bảo mật](/gateway/security#credential-storage-map).

## Cập nhật (không phá vỡ cấu hình)

- Giữ `~/.openclaw/workspace` và `~/.openclaw/` là "đồ của mình"; đừng đưa prompts/config cá nhân vào repo `openclaw`.
- Cập nhật source: `git pull` + `pnpm install` (khi lockfile thay đổi) + tiếp tục dùng `pnpm gateway:watch`.

## Linux (dịch vụ user systemd)

Cài đặt Linux dùng dịch vụ **user** systemd. Mặc định, systemd dừng dịch vụ user khi logout/idle, làm Gateway ngừng. Onboarding cố gắng bật lingering cho bạn (có thể yêu cầu sudo). Nếu vẫn tắt, chạy:

```bash
sudo loginctl enable-linger $USER
```

Với server luôn bật hoặc nhiều user, cân nhắc dịch vụ **system** thay vì user (không cần lingering). Xem [Gateway runbook](/gateway) cho ghi chú systemd.

## Tài liệu liên quan

- [Gateway runbook](/gateway) (cờ, giám sát, cổng)
- [Cấu hình Gateway](/gateway/configuration) (schema config + ví dụ)
- [Discord](/channels/discord) và [Telegram](/channels/telegram) (thẻ trả lời + cài đặt replyToMode)
- [Thiết lập trợ lý OpenClaw](/start/openclaw)
- [App macOS](/platforms/macos) (vòng đời gateway)\n