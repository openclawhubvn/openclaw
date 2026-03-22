---
summary: "OpenClaw tải biến môi trường từ đâu và thứ tự ưu tiên"
read_when:
  - Cần biết biến môi trường nào được tải và thứ tự tải
  - Đang debug thiếu API keys trong Gateway
  - Đang viết tài liệu về provider auth hoặc môi trường triển khai
title: "Biến Môi Trường"
---

# Biến Môi Trường

OpenClaw lấy biến môi trường từ nhiều nguồn khác nhau. Nguyên tắc là **không ghi đè giá trị đã có**.

## Thứ tự ưu tiên (cao nhất → thấp nhất)

1. **Process environment** (những gì Gateway process đã có từ shell/daemon cha).
2. **`.env` trong thư mục làm việc hiện tại** (mặc định của dotenv; không ghi đè).
3. **Global `.env`** tại `~/.openclaw/.env` (còn gọi là `$OPENCLAW_STATE_DIR/.env`; không ghi đè).
4. **Config `env` block** trong `~/.openclaw/openclaw.json` (chỉ áp dụng nếu thiếu).
5. **Import từ login-shell tùy chọn** (`env.shellEnv.enabled` hoặc `OPENCLAW_LOAD_SHELL_ENV=1`), chỉ áp dụng cho các key dự kiến bị thiếu.

Nếu file config hoàn toàn thiếu, bỏ qua bước 4; import shell vẫn chạy nếu được bật.

## Config `env` block

Hai cách tương đương để thiết lập inline env vars (cả hai đều không ghi đè):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Import shell env

`env.shellEnv` chạy login shell và chỉ import các key dự kiến **bị thiếu**:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Tương đương với env var:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Biến môi trường được inject runtime

OpenClaw cũng inject các marker ngữ cảnh vào các process con được spawn:

- `OPENCLAW_SHELL=exec`: thiết lập cho các lệnh chạy qua công cụ `exec`.
- `OPENCLAW_SHELL=acp`: thiết lập cho các process backend runtime ACP spawn (ví dụ `acpx`).
- `OPENCLAW_SHELL=acp-client`: thiết lập cho `openclaw acp client` khi nó spawn process cầu nối ACP.
- `OPENCLAW_SHELL=tui-local`: thiết lập cho lệnh shell TUI `!` local.

Đây là các marker runtime (không yêu cầu cấu hình người dùng). Có thể dùng trong logic shell/profile để áp dụng quy tắc ngữ cảnh cụ thể.

## Biến môi trường UI

- `OPENCLAW_THEME=light`: ép buộc palette TUI sáng khi terminal có nền sáng.
- `OPENCLAW_THEME=dark`: ép buộc palette TUI tối.
- `COLORFGBG`: nếu terminal export, OpenClaw dùng gợi ý màu nền để tự động chọn palette TUI.

## Thay thế biến môi trường trong config

Có thể tham chiếu trực tiếp env vars trong giá trị chuỗi config bằng cú pháp `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Xem [Configuration: Env var substitution](/gateway/configuration-reference#env-var-substitution) để biết chi tiết.

## Secret refs vs `${ENV}` strings

OpenClaw hỗ trợ hai pattern dựa trên env:

- Thay thế chuỗi `${VAR}` trong giá trị config.
- Đối tượng SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) cho các trường hỗ trợ tham chiếu secrets.

Cả hai đều giải quyết từ process env khi kích hoạt. Chi tiết SecretRef được tài liệu trong [Secrets Management](/gateway/secrets).

## Biến môi trường liên quan đến đường dẫn

| Biến                  | Mục đích                                                                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`       | Ghi đè thư mục home dùng cho tất cả giải quyết đường dẫn nội bộ (`~/.openclaw/`, thư mục agent, sessions, credentials). Hữu ích khi chạy OpenClaw như một user dịch vụ chuyên dụng. |
| `OPENCLAW_STATE_DIR`  | Ghi đè thư mục state (mặc định `~/.openclaw`).                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`| Ghi đè đường dẫn file config (mặc định `~/.openclaw/openclaw.json`).                                                                                                             |

## Logging

| Biến                  | Mục đích                                                                                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`  | Ghi đè mức log cho cả file và console (ví dụ `debug`, `trace`). Ưu tiên hơn `logging.level` và `logging.consoleLevel` trong config. Giá trị không hợp lệ bị bỏ qua với cảnh báo. |

### `OPENCLAW_HOME`

Khi được thiết lập, `OPENCLAW_HOME` thay thế thư mục home hệ thống (`$HOME` / `os.homedir()`) cho tất cả giải quyết đường dẫn nội bộ. Điều này cho phép cô lập hoàn toàn filesystem cho tài khoản dịch vụ không đầu.

**Thứ tự ưu tiên:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Ví dụ** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/kira</string>
</dict>
```

`OPENCLAW_HOME` cũng có thể được thiết lập thành đường dẫn tilde (ví dụ `~/svc`), sẽ được mở rộng bằng `$HOME` trước khi sử dụng.

## Người dùng nvm: lỗi TLS khi web_fetch

Nếu Node.js được cài qua **nvm** (không phải trình quản lý gói hệ thống), `fetch()` tích hợp sử dụng CA store của nvm, có thể thiếu các root CA hiện đại (ISRG Root X1/X2 cho Let's Encrypt, DigiCert Global Root G2, v.v.). Điều này gây `web_fetch` thất bại với `"fetch failed"` trên hầu hết các trang HTTPS.

Trên Linux, OpenClaw tự động phát hiện nvm và áp dụng fix trong môi trường khởi động thực tế:

- `openclaw gateway install` ghi `NODE_EXTRA_CA_CERTS` vào môi trường dịch vụ systemd
- entrypoint `openclaw` CLI tự re-exec với `NODE_EXTRA_CA_CERTS` được thiết lập trước khi Node khởi động

**Fix thủ công (cho phiên bản cũ hoặc chạy trực tiếp `node ...`):**

Export biến trước khi khởi động OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Không nên chỉ dựa vào việc ghi vào `~/.openclaw/.env` cho biến này; Node đọc `NODE_EXTRA_CA_CERTS` khi process khởi động.

## Liên quan

- [Gateway configuration](/gateway/configuration)
- [FAQ: env vars và .env loading](/help/faq#env-vars-and-env-loading)
- [Models overview](/concepts/models)\n