# `openclaw config`

Công cụ hỗ trợ chỉnh sửa `openclaw.json` không cần tương tác: get/set/unset/validate giá trị theo path và in file config đang dùng. Chạy không có subcommand sẽ mở wizard cấu hình (giống `openclaw configure`).

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

## Paths

Paths dùng dot hoặc bracket notation:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Dùng index của agent list để chỉ định agent cụ thể:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values được parse dưới dạng JSON5 nếu có thể; nếu không sẽ coi là string. Dùng `--strict-json` để bắt buộc parse JSON5. `--json` vẫn hỗ trợ như alias cũ.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

## Chế độ `config set`

`openclaw config set` hỗ trợ bốn kiểu gán giá trị:

1. Value mode: `openclaw config set <path> <value>`
2. SecretRef builder mode:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Provider builder mode (chỉ dành cho path `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Batch mode (`--batch-json` hoặc `--batch-file`):

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

Batch parsing luôn dùng batch payload (`--batch-json`/`--batch-file`) làm nguồn dữ liệu chính. `--strict-json` / `--json` không thay đổi cách parse batch.

JSON path/value mode vẫn hỗ trợ cho cả SecretRefs và providers:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider Builder Flags

Provider builder phải dùng `secrets.providers.<alias>` làm path.

Các flag thông dụng:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env provider (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (có thể lặp lại)

File provider (`--provider-source file`):

- `--provider-path <path>` (bắt buộc)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Exec provider (`--provider-source exec`):

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

Ví dụ hardened exec provider:

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

## Dry run

Dùng `--dry-run` để kiểm tra thay đổi mà không ghi vào `openclaw.json`.

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

Hành vi dry-run:

- Builder mode: chạy kiểm tra khả năng giải quyết SecretRef cho các ref/provider đã thay đổi.
- JSON mode (`--strict-json`, `--json`, hoặc batch mode): chạy kiểm tra schema và khả năng giải quyết SecretRef.
- Exec SecretRef checks mặc định bị bỏ qua trong dry-run để tránh tác động phụ từ command.
- Dùng `--allow-exec` với `--dry-run` để kiểm tra exec SecretRef (có thể thực thi command của provider).
- `--allow-exec` chỉ dùng trong dry-run và sẽ báo lỗi nếu không có `--dry-run`.

`--dry-run --json` in ra báo cáo có thể đọc bằng máy:

- `ok`: dry-run có thành công không
- `operations`: số lượng gán giá trị đã đánh giá
- `checks`: kiểm tra schema/khả năng giải quyết có chạy không
- `checks.resolvabilityComplete`: kiểm tra khả năng giải quyết có chạy hoàn tất không (false khi exec refs bị bỏ qua)
- `refsChecked`: số lượng refs thực sự được giải quyết trong dry-run
- `skippedExecRefs`: số lượng exec refs bị bỏ qua vì không có `--allow-exec`
- `errors`: lỗi schema/khả năng giải quyết có cấu trúc khi `ok=false`

### JSON Output Shape

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
      ref?: string, // có khi lỗi khả năng giải quyết
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

Nếu dry-run thất bại:

- `config schema validation failed`: cấu trúc config sau thay đổi không hợp lệ; sửa path/value hoặc cấu trúc provider/ref object.
- `SecretRef assignment(s) could not be resolved`: provider/ref được tham chiếu hiện không thể giải quyết (thiếu env var, file pointer không hợp lệ, exec provider lỗi, hoặc provider/source không khớp).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run bỏ qua exec refs; chạy lại với `--allow-exec` nếu cần kiểm tra khả năng giải quyết exec.
- Với batch mode, sửa các mục lỗi và chạy lại `--dry-run` trước khi ghi.

## Subcommands

- `config file`: In đường dẫn file config đang dùng (từ `OPENCLAW_CONFIG_PATH` hoặc vị trí mặc định).

Khởi động lại gateway sau khi chỉnh sửa.

## Validate

Kiểm tra config hiện tại với schema đang dùng mà không cần khởi động gateway.

```bash
openclaw config validate
openclaw config validate --json
```\n