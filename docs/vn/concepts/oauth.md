---
summary: "OAuth trong OpenClaw: trao đổi token, lưu trữ và mô hình đa tài khoản"
read_when:
  - Bạn muốn hiểu toàn diện về OAuth trong OpenClaw
  - Bạn gặp vấn đề về token bị vô hiệu hóa hoặc đăng xuất
  - Bạn muốn thiết lập token hoặc luồng xác thực OAuth
  - Bạn muốn sử dụng nhiều tài khoản hoặc định tuyến hồ sơ
title: "OAuth"
---

# OAuth

OpenClaw hỗ trợ "xác thực đăng ký" qua OAuth cho các nhà cung cấp có hỗ trợ (đặc biệt là **OpenAI Codex (ChatGPT OAuth)**). Đối với đăng ký Anthropic, sử dụng luồng **setup-token**. Việc sử dụng đăng ký Anthropic ngoài Claude Code đã bị hạn chế cho một số người dùng trước đây, vì vậy hãy coi đó là rủi ro do người dùng lựa chọn và tự xác minh chính sách hiện tại của Anthropic. OpenAI Codex OAuth được hỗ trợ rõ ràng để sử dụng trong các công cụ bên ngoài như OpenClaw. Trang này giải thích:

Đối với Anthropic trong môi trường sản xuất, xác thực bằng khóa API là con đường an toàn hơn được khuyến nghị so với xác thực bằng setup-token.

- cách thức hoạt động của **trao đổi token** OAuth (PKCE)
- nơi lưu trữ token **(và lý do)**
- cách xử lý **nhiều tài khoản** (hồ sơ + ghi đè theo phiên)

OpenClaw cũng hỗ trợ **plugin nhà cung cấp** có luồng OAuth hoặc API-key riêng. Chạy chúng qua:

```bash
openclaw models auth login --provider <id>
```

## Token sink (tại sao nó tồn tại)

Các nhà cung cấp OAuth thường tạo ra một **refresh token mới** trong quá trình đăng nhập/làm mới. Một số nhà cung cấp (hoặc client OAuth) có thể vô hiệu hóa các refresh token cũ hơn khi một token mới được phát hành cho cùng một người dùng/ứng dụng.

Triệu chứng thực tế:

- bạn đăng nhập qua OpenClaw _và_ qua Claude Code / Codex CLI → một trong số đó ngẫu nhiên bị "đăng xuất" sau đó

Để giảm thiểu điều đó, OpenClaw coi `auth-profiles.json` như một **token sink**:

- runtime đọc thông tin xác thực từ **một nơi**
- chúng ta có thể giữ nhiều hồ sơ và định tuyến chúng một cách xác định

## Lưu trữ (nơi token tồn tại)

Thông tin bí mật được lưu trữ **theo từng agent**:

- Hồ sơ xác thực (OAuth + API keys + tham chiếu cấp giá trị tùy chọn): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Tệp tương thích cũ: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (các mục `api_key` tĩnh sẽ bị xóa khi phát hiện)

Tệp chỉ nhập cũ (vẫn được hỗ trợ, nhưng không phải là nơi lưu trữ chính):

- `~/.openclaw/credentials/oauth.json` (được nhập vào `auth-profiles.json` khi sử dụng lần đầu)

Tất cả các tệp trên cũng tuân theo `$OPENCLAW_STATE_DIR` (ghi đè thư mục trạng thái). Tham khảo đầy đủ: [/gateway/configuration](/gateway/configuration-reference#auth-storage)

Đối với tham chiếu bí mật tĩnh và hành vi kích hoạt snapshot runtime, xem [Quản lý Bí mật](/gateway/secrets).

## Anthropic setup-token (xác thực đăng ký)

<Warning>
Hỗ trợ setup-token của Anthropic là khả năng tương thích kỹ thuật, không phải là đảm bảo chính sách.
Anthropic đã chặn một số việc sử dụng đăng ký ngoài Claude Code trong quá khứ.
Tự quyết định xem có nên sử dụng xác thực đăng ký hay không và xác minh các điều khoản hiện tại của Anthropic.
</Warning>

Chạy `claude setup-token` trên bất kỳ máy nào, sau đó dán vào OpenClaw:

```bash
openclaw models auth setup-token --provider anthropic
```

Nếu bạn đã tạo token ở nơi khác, dán thủ công:

```bash
openclaw models auth paste-token --provider anthropic
```

Xác minh:

```bash
openclaw models status
```

## Trao đổi OAuth (cách thức đăng nhập hoạt động)

Luồng đăng nhập tương tác của OpenClaw được triển khai trong `@mariozechner/pi-ai` và tích hợp vào các wizard/lệnh.

### Anthropic setup-token

Hình dạng luồng:

1. chạy `claude setup-token`
2. dán token vào OpenClaw
3. lưu dưới dạng hồ sơ xác thực token (không làm mới)

Đường dẫn wizard là `openclaw onboard` → lựa chọn xác thực `setup-token` (Anthropic).

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth được hỗ trợ rõ ràng để sử dụng ngoài Codex CLI, bao gồm các quy trình làm việc của OpenClaw.

Hình dạng luồng (PKCE):

1. tạo PKCE verifier/challenge + `state` ngẫu nhiên
2. mở `https://auth.openai.com/oauth/authorize?...`
3. cố gắng bắt callback trên `http://127.0.0.1:1455/auth/callback`
4. nếu callback không thể kết nối (hoặc bạn đang ở chế độ từ xa/không có giao diện), dán URL/chuyển hướng mã
5. trao đổi tại `https://auth.openai.com/oauth/token`
6. trích xuất `accountId` từ access token và lưu trữ `{ access, refresh, expires, accountId }`

Đường dẫn wizard là `openclaw onboard` → lựa chọn xác thực `openai-codex`.

## Làm mới + hết hạn

Hồ sơ lưu trữ một dấu thời gian `expires`.

Tại runtime:

- nếu `expires` trong tương lai → sử dụng access token đã lưu
- nếu hết hạn → làm mới (dưới khóa tệp) và ghi đè thông tin xác thực đã lưu

Luồng làm mới là tự động; bạn thường không cần quản lý token thủ công.

## Nhiều tài khoản (hồ sơ) + định tuyến

Hai mô hình:

### 1) Ưu tiên: tách biệt agent

Nếu bạn muốn "cá nhân" và "công việc" không bao giờ tương tác, sử dụng các agent riêng biệt (phiên + thông tin xác thực + workspace riêng):

```bash
openclaw agents add work
openclaw agents add personal
```

Sau đó cấu hình xác thực theo từng agent (wizard) và định tuyến các cuộc trò chuyện đến đúng agent.

### 2) Nâng cao: nhiều hồ sơ trong một agent

`auth-profiles.json` hỗ trợ nhiều ID hồ sơ cho cùng một nhà cung cấp.

Chọn hồ sơ nào được sử dụng:

- toàn cầu qua thứ tự cấu hình (`auth.order`)
- theo phiên qua `/model ...@<profileId>`

Ví dụ (ghi đè phiên):

- `/model Opus@anthropic:work`

Cách xem các ID hồ sơ hiện có:

- `openclaw channels list --json` (hiển thị `auth[]`)

Tài liệu liên quan:

- [/concepts/model-failover](/concepts/model-failover) (quy tắc xoay vòng + cooldown)
- [/tools/slash-commands](/tools/slash-commands) (bề mặt lệnh)
