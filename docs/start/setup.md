---
summary: "Khám phá cách thiết lập nâng cao và quy trình phát triển hiệu quả cho OpenClaw, tối ưu hóa hệ thống của bạn dễ dàng."
read_when:
  - Thiết lập máy mới
  - Muốn có phiên bản mới nhất mà không ảnh hưởng đến cấu hình cá nhân
title: "Hướng Dẫn Cấu Hình OpenClaw Nâng Cao"
---

# Thiết lập

<Note>
Nếu đây là lần đầu thiết lập, hãy bắt đầu với [Bắt đầu](/start/getting-started).
Để biết chi tiết về onboarding, xem [Onboarding (CLI)](/start/wizard).
</Note>

## Tóm tắt

- **Tùy chỉnh nằm ngoài repo:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (cấu hình).
- **Quy trình ổn định:** cài đặt ứng dụng macOS; để nó chạy Gateway đi kèm.
- **Quy trình tiên tiến:** tự chạy Gateway qua `pnpm gateway:watch`, sau đó để ứng dụng macOS kết nối ở chế độ Local.

## Yêu cầu trước (từ source)

- Khuyến nghị dùng Node 24 (Node 22 LTS, hiện tại `22.16+`, vẫn được hỗ trợ)
- `pnpm`
- Docker (tùy chọn; chỉ cho thiết lập container/e2e — xem [Docker](/install/docker))

## Chiến lược tùy chỉnh (để cập nhật không gây ảnh hưởng)

Nếu muốn "tùy chỉnh 100% theo ý mình" _và_ dễ dàng cập nhật, hãy giữ tùy chỉnh trong:

- **Cấu hình:** `~/.openclaw/openclaw.json` (dạng JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (kỹ năng, gợi ý, ký ức; biến nó thành repo git riêng tư)

Khởi tạo một lần:

```bash
openclaw setup
```

Từ trong repo này, sử dụng CLI cục bộ:

```bash
openclaw setup
```

Nếu chưa cài đặt toàn cầu, chạy qua `pnpm openclaw setup`.

## Chạy Gateway từ repo này

Sau `pnpm build`, bạn có thể chạy CLI đã đóng gói trực tiếp:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Quy trình ổn định (ứng dụng macOS trước)

1. Cài đặt + khởi chạy **OpenClaw.app** (thanh menu).
2. Hoàn thành danh sách kiểm tra onboarding/permissions (TCC prompts).
3. Đảm bảo Gateway là **Local** và đang chạy (ứng dụng quản lý nó).
4. Liên kết các bề mặt (ví dụ: WhatsApp):

```bash
openclaw channels login
```

5. Kiểm tra nhanh:

```bash
openclaw health
```

Nếu onboarding không có sẵn trong bản build của bạn:

- Chạy `openclaw setup`, sau đó `openclaw channels login`, rồi khởi động Gateway thủ công (`openclaw gateway`).

## Quy trình tiên tiến (Gateway trong terminal)

Mục tiêu: làm việc trên TypeScript Gateway, nhận hot reload, giữ giao diện ứng dụng macOS kết nối.

### 0) (Tùy chọn) Chạy ứng dụng macOS từ source

Nếu cũng muốn ứng dụng macOS ở phiên bản tiên tiến:

```bash
./scripts/restart-mac.sh
```

### 1) Khởi động Gateway dev

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` chạy gateway ở chế độ watch và tải lại khi có thay đổi trong source,
cấu hình, và metadata plugin đi kèm.

### 2) Chỉ định ứng dụng macOS kết nối với Gateway đang chạy

Trong **OpenClaw.app**:

- Chế độ kết nối: **Local**
  Ứng dụng sẽ kết nối với gateway đang chạy trên cổng đã cấu hình.

### 3) Xác minh

- Trạng thái Gateway trong ứng dụng nên hiển thị **“Using existing gateway …”**
- Hoặc qua CLI:

```bash
openclaw health
```

### Lưu ý thường gặp

- **Sai cổng:** Gateway WS mặc định là `ws://127.0.0.1:18789`; giữ ứng dụng + CLI trên cùng một cổng.
- **Nơi lưu trữ trạng thái:**
  - Thông tin đăng nhập: `~/.openclaw/credentials/`
  - Phiên làm việc: `~/.openclaw/agents/<agentId>/sessions/`
  - Nhật ký: `/tmp/openclaw/`

## Bản đồ lưu trữ thông tin đăng nhập

Sử dụng khi gỡ lỗi xác thực hoặc quyết định sao lưu:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: cấu hình/môi trường hoặc `channels.telegram.tokenFile` (chỉ file thường; từ chối symlinks)
- **Discord bot token**: cấu hình/môi trường hoặc SecretRef (nhà cung cấp env/file/exec)
- **Slack tokens**: cấu hình/môi trường (`channels.slack.*`)
- **Danh sách cho phép ghép đôi**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (tài khoản mặc định)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (tài khoản không mặc định)
- **Hồ sơ xác thực mô hình**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload bí mật dựa trên file (tùy chọn)**: `~/.openclaw/secrets.json`
- **Nhập OAuth cũ**: `~/.openclaw/credentials/oauth.json`
  Chi tiết thêm: [Bảo mật](/gateway/security#credential-storage-map).

## Cập nhật (không làm hỏng cấu hình của bạn)

- Giữ `~/.openclaw/workspace` và `~/.openclaw/` là "đồ của bạn"; không đặt gợi ý/cấu hình cá nhân vào repo `openclaw`.
- Cập nhật source: `git pull` + `pnpm install` (khi lockfile thay đổi) + tiếp tục sử dụng `pnpm gateway:watch`.

## Linux (dịch vụ người dùng systemd)

Cài đặt Linux sử dụng dịch vụ **người dùng** systemd. Mặc định, systemd dừng dịch vụ người dùng khi logout/idle, điều này làm tắt Gateway. Onboarding cố gắng kích hoạt lingering cho bạn (có thể yêu cầu sudo). Nếu vẫn tắt, chạy:

```bash
sudo loginctl enable-linger $USER
```

Đối với máy chủ luôn bật hoặc nhiều người dùng, hãy xem xét dịch vụ **hệ thống** thay vì dịch vụ người dùng (không cần lingering). Xem [Gateway runbook](/gateway) để biết ghi chú về systemd.

## Tài liệu liên quan

- [Gateway runbook](/gateway) (cờ, giám sát, cổng)
- [Cấu hình Gateway](/gateway/configuration) (schema cấu hình + ví dụ)
- [Discord](/channels/discord) và [Telegram](/channels/telegram) (thẻ trả lời + cài đặt replyToMode)
- [Thiết lập trợ lý OpenClaw](/start/openclaw)
- [Ứng dụng macOS](/platforms/macos) (vòng đời gateway)
