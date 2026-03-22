---
summary: "OAuth trong OpenClaw: trao đổi token, lưu trữ và mô hình đa tài khoản"
read_when:
  - Muốn hiểu OAuth trong OpenClaw từ đầu đến cuối
  - Gặp vấn đề token bị vô hiệu hóa / logout
  - Cần thiết lập token hoặc luồng OAuth
  - Muốn dùng nhiều tài khoản hoặc định tuyến profile
title: "OAuth"
---

# OAuth

OpenClaw hỗ trợ "subscription auth" qua OAuth cho các provider có cung cấp (đặc biệt là **OpenAI Codex (ChatGPT OAuth)**). Với Anthropic, dùng luồng **setup-token**. Trước đây, một số người dùng bị hạn chế khi dùng Anthropic ngoài Claude Code, nên hãy tự kiểm tra chính sách hiện tại của Anthropic. OpenAI Codex OAuth được hỗ trợ rõ ràng cho các công cụ ngoài như OpenClaw. Trang này giải thích:

Với Anthropic trong production, khuyến nghị dùng API key auth thay vì setup-token auth.

- cách hoạt động của **token exchange** (PKCE)
- nơi lưu trữ **tokens** (và lý do)
- cách xử lý **nhiều tài khoản** (profiles + ghi đè theo session)

OpenClaw cũng hỗ trợ **provider plugins** với luồng OAuth hoặc API-key riêng. Chạy qua:

```bash
openclaw models auth login --provider <id>
```

## Token sink (tại sao cần)

OAuth providers thường tạo **refresh token mới** trong các luồng login/refresh. Một số providers (hoặc OAuth clients) có thể vô hiệu hóa refresh token cũ khi cấp mới cho cùng user/app.

Triệu chứng thực tế:

- đăng nhập qua OpenClaw _và_ Claude Code / Codex CLI → một trong hai bị "logged out" ngẫu nhiên

Để giảm điều đó, OpenClaw dùng `auth-profiles.json` như **token sink**:

- runtime đọc credentials từ **một nơi**
- có thể giữ nhiều profiles và định tuyến chúng một cách xác định

## Lưu trữ (nơi tokens sống)

Secrets lưu trữ **theo agent**:

- Auth profiles (OAuth + API keys + refs tùy chọn): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File tương thích cũ: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (các mục `api_key` tĩnh bị xóa khi phát hiện)

File chỉ nhập cũ (vẫn hỗ trợ, nhưng không phải nơi lưu chính):

- `~/.openclaw/credentials/oauth.json` (nhập vào `auth-profiles.json` khi dùng lần đầu)

Tất cả trên cũng tuân theo `$OPENCLAW_STATE_DIR` (ghi đè state dir). Tham khảo đầy đủ: [/gateway/configuration](/gateway/configuration-reference#auth-storage)

Với refs secret tĩnh và hành vi kích hoạt snapshot runtime, xem [Secrets Management](/gateway/secrets).

## Anthropic setup-token (subscription auth)

<Warning>
Hỗ trợ setup-token của Anthropic là tương thích kỹ thuật, không phải đảm bảo chính sách.
Anthropic đã chặn một số sử dụng subscription ngoài Claude Code trước đây.
Tự quyết định có dùng subscription auth không, và kiểm tra điều khoản hiện tại của Anthropic.
</Warning>

Chạy `claude setup-token` trên bất kỳ máy nào, rồi dán vào OpenClaw:

```bash
openclaw models auth setup-token --provider anthropic
```

Nếu tạo token ở nơi khác, dán thủ công:

```bash
openclaw models auth paste-token --provider anthropic
```

Xác minh:

```bash
openclaw models status
```

## OAuth exchange (cách login hoạt động)

Luồng login tương tác của OpenClaw được triển khai trong `@mariozechner/pi-ai` và kết nối vào wizards/commands.

### Anthropic setup-token

Dạng luồng:

1. chạy `claude setup-token`
2. dán token vào OpenClaw
3. lưu dưới dạng token auth profile (không refresh)

Đường dẫn wizard là `openclaw onboard` → chọn auth `setup-token` (Anthropic).

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth được hỗ trợ rõ ràng cho việc sử dụng ngoài Codex CLI, bao gồm các luồng OpenClaw.

Dạng luồng (PKCE):

1. tạo PKCE verifier/challenge + `state` ngẫu nhiên
2. mở `https://auth.openai.com/oauth/authorize?...`
3. cố gắng bắt callback tại `http://127.0.0.1:1455/auth/callback`
4. nếu callback không bind được (hoặc remote/headless), dán URL/code redirect
5. trao đổi tại `https://auth.openai.com/oauth/token`
6. trích xuất `accountId` từ access token và lưu `{ access, refresh, expires, accountId }`

Đường dẫn wizard là `openclaw onboard` → chọn auth `openai-codex`.

## Refresh + expiry

Profiles lưu timestamp `expires`.

Tại runtime:

- nếu `expires` trong tương lai → dùng access token đã lưu
- nếu hết hạn → refresh (dưới file lock) và ghi đè credentials đã lưu

Luồng refresh tự động; thường không cần quản lý tokens thủ công.

## Nhiều tài khoản (profiles) + định tuyến

Hai mô hình:

### 1) Ưu tiên: tách biệt agents

Nếu muốn "cá nhân" và "công việc" không giao nhau, dùng agents tách biệt (sessions + credentials + workspace riêng):

```bash
openclaw agents add work
openclaw agents add personal
```

Sau đó cấu hình auth theo agent (wizard) và định tuyến chats đến đúng agent.

### 2) Nâng cao: nhiều profiles trong một agent

`auth-profiles.json` hỗ trợ nhiều profile ID cho cùng provider.

Chọn profile nào dùng:

- toàn cục qua config ordering (`auth.order`)
- theo session qua `/model ...@<profileId>`

Ví dụ (ghi đè session):

- `/model Opus@anthropic:work`

Cách xem các profile ID hiện có:

- `openclaw channels list --json` (hiển thị `auth[]`)

Tài liệu liên quan:

- [/concepts/model-failover](/concepts/model-failover) (quy tắc rotation + cooldown)
- [/tools/slash-commands](/tools/slash-commands) (bề mặt command)\n