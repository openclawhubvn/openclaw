---
summary: "Nơi OpenClaw tải các biến môi trường và thứ tự ưu tiên"
read_when:
  - Cần biết biến môi trường nào được tải và thứ tự tải
  - Đang gỡ lỗi thiếu khóa API trong Gateway
  - Đang viết tài liệu về xác thực nhà cung cấp hoặc môi trường triển khai
title: "Biến Môi Trường"
---

# Biến Môi Trường

OpenClaw lấy các biến môi trường từ nhiều nguồn khác nhau. Quy tắc là **không ghi đè giá trị hiện có**.

## Thứ tự ưu tiên (cao nhất → thấp nhất)

1. **Môi trường tiến trình** (những gì tiến trình Gateway đã có từ shell/daemon cha).
2. **`.env` trong thư mục làm việc hiện tại** (mặc định của dotenv; không ghi đè).
3. **`.env` toàn cục** tại `~/.openclaw/.env` (còn gọi là `$OPENCLAW_STATE_DIR/.env`; không ghi đè).
4. **Khối `env` trong cấu hình** tại `~/.openclaw/openclaw.json` (chỉ áp dụng nếu thiếu).
5. **Nhập từ shell đăng nhập tùy chọn** (`env.shellEnv.enabled` hoặc `OPENCLAW_LOAD_SHELL_ENV=1`), chỉ áp dụng cho các khóa dự kiến bị thiếu.

Nếu file cấu hình hoàn toàn thiếu, bước 4 sẽ bị bỏ qua; nhập từ shell vẫn chạy nếu được kích hoạt.

## Khối `env` trong cấu hình

Có hai cách tương đương để thiết lập biến môi trường nội tuyến (cả hai đều không ghi đè):

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

## Nhập môi trường shell

`env.shellEnv` chạy shell đăng nhập của bạn và chỉ nhập các khóa dự kiến **bị thiếu**:

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

Các biến môi trường tương đương:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Biến môi trường được tiêm vào lúc chạy

OpenClaw cũng tiêm các dấu hiệu ngữ cảnh vào các tiến trình con được tạo ra:

- `OPENCLAW_SHELL=exec`: thiết lập cho các lệnh chạy qua công cụ `exec`.
- `OPENCLAW_SHELL=acp`: thiết lập cho các tiến trình backend runtime ACP (ví dụ `acpx`).
- `OPENCLAW_SHELL=acp-client`: thiết lập cho `openclaw acp client` khi nó tạo ra tiến trình cầu nối ACP.
- `OPENCLAW_SHELL=tui-local`: thiết lập cho các lệnh shell TUI `!` cục bộ.

Đây là các dấu hiệu runtime (không yêu cầu cấu hình người dùng). Chúng có thể được sử dụng trong logic shell/profile để áp dụng các quy tắc cụ thể theo ngữ cảnh.

## Biến môi trường UI

- `OPENCLAW_THEME=light`: ép buộc bảng màu TUI sáng khi terminal của bạn có nền sáng.
- `OPENCLAW_THEME=dark`: ép buộc bảng màu TUI tối.
- `COLORFGBG`: nếu terminal của bạn xuất nó, OpenClaw sử dụng gợi ý màu nền để tự động chọn bảng màu TUI.

## Thay thế biến môi trường trong cấu hình

Bạn có thể tham chiếu trực tiếp các biến môi trường trong giá trị chuỗi cấu hình bằng cú pháp `${VAR_NAME}`:

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

Xem [Cấu hình: Thay thế biến môi trường](/gateway/configuration-reference#env-var-substitution) để biết chi tiết đầy đủ.

## Tham chiếu bí mật so với chuỗi `${ENV}`

OpenClaw hỗ trợ hai mẫu dựa trên biến môi trường:

- Thay thế chuỗi `${VAR}` trong các giá trị cấu hình.
- Đối tượng SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) cho các trường hỗ trợ tham chiếu bí mật.

Cả hai đều được giải quyết từ môi trường tiến trình tại thời điểm kích hoạt. Chi tiết SecretRef được ghi trong [Quản lý Bí mật](/gateway/secrets).

## Biến môi trường liên quan đến đường dẫn

| Biến                  | Mục đích                                                                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`       | Ghi đè thư mục home được sử dụng cho tất cả các giải quyết đường dẫn nội bộ (`~/.openclaw/`, thư mục agent, phiên, thông tin xác thực). Hữu ích khi chạy OpenClaw như một người dùng dịch vụ chuyên dụng. |
| `OPENCLAW_STATE_DIR`  | Ghi đè thư mục trạng thái (mặc định `~/.openclaw`).                                                                                                                             |
| `OPENCLAW_CONFIG_PATH`| Ghi đè đường dẫn file cấu hình (mặc định `~/.openclaw/openclaw.json`).                                                                                                          |

## Ghi nhật ký

| Biến                  | Mục đích                                                                                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`  | Ghi đè mức độ ghi nhật ký cho cả file và console (ví dụ: `debug`, `trace`). Ưu tiên hơn `logging.level` và `logging.consoleLevel` trong cấu hình. Các giá trị không hợp lệ sẽ bị bỏ qua với cảnh báo. |

### `OPENCLAW_HOME`

Khi được thiết lập, `OPENCLAW_HOME` thay thế thư mục home hệ thống (`$HOME` / `os.homedir()`) cho tất cả các giải quyết đường dẫn nội bộ. Điều này cho phép cách ly hoàn toàn hệ thống tập tin cho các tài khoản dịch vụ không có giao diện.

**Thứ tự ưu tiên:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Ví dụ** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/kira</string>
</dict>
```

`OPENCLAW_HOME` cũng có thể được thiết lập thành một đường dẫn tilde (ví dụ: `~/svc`), sẽ được mở rộng bằng `$HOME` trước khi sử dụng.

## Người dùng nvm: lỗi TLS khi web_fetch

Nếu Node.js được cài đặt qua **nvm** (không phải trình quản lý gói hệ thống), `fetch()` tích hợp sử dụng kho CA đi kèm của nvm, có thể thiếu các CA gốc hiện đại (ISRG Root X1/X2 cho Let's Encrypt, DigiCert Global Root G2, v.v.). Điều này gây ra lỗi `web_fetch` với `"fetch failed"` trên hầu hết các trang HTTPS.

Trên Linux, OpenClaw tự động phát hiện nvm và áp dụng sửa lỗi trong môi trường khởi động thực tế:

- `openclaw gateway install` ghi `NODE_EXTRA_CA_CERTS` vào môi trường dịch vụ systemd
- điểm vào CLI `openclaw` tự tái thực thi với `NODE_EXTRA_CA_CERTS` được thiết lập trước khi Node khởi động

**Sửa lỗi thủ công (cho các phiên bản cũ hơn hoặc khởi chạy trực tiếp `node ...`):**

Xuất biến trước khi khởi động OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Không dựa vào việc chỉ ghi vào `~/.openclaw/.env` cho biến này; Node đọc `NODE_EXTRA_CA_CERTS` khi tiến trình khởi động.

## Liên quan

- [Cấu hình Gateway](/gateway/configuration)
- [FAQ: biến môi trường và tải .env](/help/faq#env-vars-and-env-loading)
- [Tổng quan về mô hình](/concepts/models)
