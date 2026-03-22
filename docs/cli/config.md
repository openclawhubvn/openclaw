---
summary: "Tìm hiểu cách sử dụng lệnh 'openclaw config' để thiết lập, kiểm tra và quản lý cấu hình hệ thống hiệu quả."
read_when:
  - Bạn muốn đọc hoặc chỉnh sửa cấu hình không tương tác
title: "Hướng Dẫn Cấu Hình CLI OpenClaw"
---

# `openclaw config`

Công cụ hỗ trợ cấu hình cho các chỉnh sửa không tương tác trong `openclaw.json`: lấy/đặt/xóa/kiểm tra giá trị theo đường dẫn và in ra file cấu hình đang hoạt động. Chạy mà không có lệnh con để mở trình hướng dẫn cấu hình (giống như `openclaw configure`).

## Ví dụ

```bash
openclaw config file
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

## Đường dẫn

Đường dẫn sử dụng ký hiệu dấu chấm hoặc dấu ngoặc:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Sử dụng chỉ số danh sách agent để nhắm đến một agent cụ thể:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Giá trị

Giá trị được phân tích dưới dạng JSON5 khi có thể; nếu không, chúng được coi là chuỗi. Sử dụng `--strict-json` để yêu cầu phân tích JSON5. `--json` vẫn được hỗ trợ như một alias cũ.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

## Các chế độ `config set`

`openclaw config set` hỗ trợ bốn kiểu gán:

1. Chế độ giá trị: `openclaw config set <path> <value>`
2. Chế độ xây dựng SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Chế độ xây dựng Provider (chỉ đường dẫn `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Chế độ hàng loạt (`--batch-json` hoặc `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

Phân tích hàng loạt luôn sử dụng payload hàng loạt (`--batch-json`/`--batch-file`) làm nguồn gốc. `--strict-json` / `--json` không thay đổi hành vi phân tích hàng loạt.

Chế độ đường dẫn/giá trị JSON vẫn được hỗ trợ cho cả SecretRefs và providers:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Cờ xây dựng Provider

Các mục tiêu xây dựng Provider phải sử dụng `secrets.providers.<alias>` làm đường dẫn.

Các cờ thông dụng:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Provider môi trường (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (có thể lặp lại)

Provider file (`--provider-source file`):

- `--provider-path <path>` (bắt buộc)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Provider exec (`--provider-source exec`):

- `--provider-command <path>` (bắt buộc)
- `--provider-arg <arg>` (có thể lặp lại)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (có thể lặp lại)
- `--provider-pass-env <ENV_VAR>` (có thể lặp lại)
- `--provider-trusted-dir <path>` (có thể lặp lại)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Ví dụ về provider exec được bảo vệ:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Chạy thử

Sử dụng `--dry-run` để kiểm tra thay đổi mà không ghi vào `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

Hành vi chạy thử:

- Chế độ xây dựng: chạy kiểm tra khả năng giải quyết SecretRef cho các ref/provider đã thay đổi.
- Chế độ JSON (`--strict-json`, `--json`, hoặc chế độ hàng loạt): chạy kiểm tra schema và khả năng giải quyết SecretRef.
- Kiểm tra SecretRef exec bị bỏ qua mặc định trong chạy thử để tránh tác động phụ từ lệnh.
- Sử dụng `--allow-exec` với `--dry-run` để cho phép kiểm tra SecretRef exec (có thể thực thi lệnh provider).
- `--allow-exec` chỉ dành cho chạy thử và sẽ báo lỗi nếu dùng mà không có `--dry-run`.

`--dry-run --json` in ra báo cáo có thể đọc bằng máy:

- `ok`: liệu chạy thử có thành công
- `operations`: số lượng gán được đánh giá
- `checks`: liệu kiểm tra schema/khả năng giải quyết có chạy
- `checks.resolvabilityComplete`: liệu kiểm tra khả năng giải quyết có hoàn thành (false khi các ref exec bị bỏ qua)
- `refsChecked`: số lượng ref thực sự được giải quyết trong chạy thử
- `skippedExecRefs`: số lượng ref exec bị bỏ qua vì `--allow-exec` không được đặt
- `errors`: lỗi cấu trúc schema/khả năng giải quyết khi `ok=false`

### Định dạng đầu ra JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // có mặt cho lỗi khả năng giải quyết
    },
  ],
}
```

Ví dụ thành công:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

Ví dụ thất bại:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

Nếu chạy thử thất bại:

- `config schema validation failed`: cấu trúc config sau thay đổi không hợp lệ; sửa đường dẫn/giá trị hoặc cấu trúc đối tượng provider/ref.
- `SecretRef assignment(s) could not be resolved`: provider/ref được tham chiếu hiện không thể giải quyết (biến môi trường thiếu, con trỏ file không hợp lệ, lỗi provider exec, hoặc không khớp provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: chạy thử đã bỏ qua các ref exec; chạy lại với `--allow-exec` nếu cần kiểm tra khả năng giải quyết exec.
- Đối với chế độ hàng loạt, sửa các mục bị lỗi và chạy lại `--dry-run` trước khi ghi.

## Lệnh con

- `config file`: In ra đường dẫn file cấu hình đang hoạt động (được giải quyết từ `OPENCLAW_CONFIG_PATH` hoặc vị trí mặc định).

Khởi động lại gateway sau khi chỉnh sửa.

## Kiểm tra

Kiểm tra cấu hình hiện tại so với schema đang hoạt động mà không cần khởi động gateway.

```bash
openclaw config validate
openclaw config validate --json
```
