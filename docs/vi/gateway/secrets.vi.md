# Quản lý Secrets

OpenClaw hỗ trợ SecretRefs để không cần lưu credentials dưới dạng plaintext trong cấu hình.

Plaintext vẫn dùng được. SecretRefs là tùy chọn cho từng credential.

## Mục tiêu và mô hình runtime

Secrets được giải quyết thành một snapshot runtime trong bộ nhớ.

- Giải quyết eager khi kích hoạt, không lazy trên request paths.
- Startup fail nhanh khi SecretRef không thể giải quyết.
- Reload dùng atomic swap: thành công hoàn toàn, hoặc giữ snapshot tốt nhất trước đó.
- Runtime requests chỉ đọc từ snapshot trong bộ nhớ đang hoạt động.
- Đường dẫn gửi đi cũng đọc từ snapshot đó (ví dụ gửi Discord reply/thread và Telegram action); không giải quyết lại SecretRefs mỗi lần gửi.

Điều này giúp tránh outage của secret-provider trên hot request paths.

## Lọc bề mặt hoạt động

SecretRefs chỉ được xác thực trên bề mặt hoạt động thực tế.

- Bề mặt đã bật: refs chưa giải quyết chặn startup/reload.
- Bề mặt không hoạt động: refs chưa giải quyết không chặn startup/reload.
- Refs không hoạt động phát ra chẩn đoán không gây chết với mã `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Ví dụ về bề mặt không hoạt động:

- Channel/account bị vô hiệu hóa.
- Credentials channel cấp cao không được account nào kế thừa.
- Công cụ/tính năng bị vô hiệu hóa.
- Khóa provider tìm kiếm web không được chọn bởi `tools.web.search.provider`.
  Ở chế độ tự động (provider chưa đặt), khóa được tham khảo theo thứ tự ưu tiên để tự động phát hiện provider cho đến khi một khóa được giải quyết.
  Sau khi chọn, khóa provider không được chọn được coi là không hoạt động cho đến khi được chọn.
- Tài liệu xác thực SSH sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`, cộng với ghi đè từng agent) chỉ hoạt động khi backend sandbox hiệu quả là `ssh` cho agent mặc định hoặc agent đã bật.
- SecretRefs `gateway.remote.token` / `gateway.remote.password` hoạt động nếu một trong các điều kiện sau đúng:
  - `gateway.mode=remote`
  - `gateway.remote.url` được cấu hình
  - `gateway.tailscale.mode` là `serve` hoặc `funnel`
  - Ở chế độ local không có bề mặt remote:
    - `gateway.remote.token` hoạt động khi xác thực token có thể thắng và không có token env/auth nào được cấu hình.
    - `gateway.remote.password` chỉ hoạt động khi xác thực password có thể thắng và không có password env/auth nào được cấu hình.
- SecretRef `gateway.auth.token` không hoạt động cho giải quyết xác thực startup khi `OPENCLAW_GATEWAY_TOKEN` (hoặc `CLAWDBOT_GATEWAY_TOKEN`) được đặt, vì input token env thắng cho runtime đó.

## Chẩn đoán bề mặt xác thực Gateway

Khi một SecretRef được cấu hình trên `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token`, hoặc `gateway.remote.password`, gateway startup/reload ghi lại trạng thái bề mặt rõ ràng:

- `active`: SecretRef là một phần của bề mặt xác thực hiệu quả và phải được giải quyết.
- `inactive`: SecretRef bị bỏ qua cho runtime này vì một bề mặt xác thực khác thắng, hoặc vì xác thực remote bị vô hiệu hóa/không hoạt động.

Các mục này được ghi lại với `SECRETS_GATEWAY_AUTH_SURFACE` và bao gồm lý do được sử dụng bởi chính sách bề mặt hoạt động, để bạn có thể thấy tại sao một credential được coi là hoạt động hoặc không hoạt động.

## Kiểm tra trước tham chiếu onboarding

Khi onboarding chạy ở chế độ tương tác và bạn chọn lưu trữ SecretRef, OpenClaw chạy xác thực trước khi lưu:

- Env refs: xác thực tên biến môi trường và xác nhận giá trị không rỗng có thể nhìn thấy trong quá trình thiết lập.
- Provider refs (`file` hoặc `exec`): xác thực lựa chọn provider, giải quyết `id`, và kiểm tra loại giá trị đã giải quyết.
- Đường dẫn tái sử dụng Quickstart: khi `gateway.auth.token` đã là một SecretRef, onboarding giải quyết nó trước khi khởi động probe/dashboard (cho `env`, `file`, và `exec` refs) sử dụng cổng fail-fast tương tự.

Nếu xác thực thất bại, onboarding hiển thị lỗi và cho phép bạn thử lại.

## Hợp đồng SecretRef

Sử dụng một hình dạng đối tượng ở mọi nơi:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

Xác thực:

- `provider` phải khớp với `^[a-z][a-z0-9_-]{0,63}$`
- `id` phải khớp với `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

Xác thực:

- `provider` phải khớp với `^[a-z][a-z0-9_-]{0,63}$`
- `id` phải là một JSON pointer tuyệt đối (`/...`)
- RFC6901 escaping trong các đoạn: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Xác thực:

- `provider` phải khớp với `^[a-z][a-z0-9_-]{0,63}$`
- `id` phải khớp với `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` không được chứa `.` hoặc `..` như các đoạn đường dẫn phân cách bằng dấu gạch chéo (ví dụ `a/../b` bị từ chối)

## Cấu hình Provider

Định nghĩa providers dưới `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // hoặc "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Env provider

- Danh sách cho phép tùy chọn qua `allowlist`.
- Giá trị env thiếu/rỗng làm thất bại giải quyết.

### File provider

- Đọc file local từ `path`.
- `mode: "json"` mong đợi payload đối tượng JSON và giải quyết `id` như pointer.
- `mode: "singleValue"` mong đợi ref id `"value"` và trả về nội dung file.
- Đường dẫn phải vượt qua kiểm tra quyền sở hữu/quyền truy cập.
- Lưu ý fail-closed trên Windows: nếu xác minh ACL không khả dụng cho một đường dẫn, giải quyết thất bại. Đối với các đường dẫn tin cậy, đặt `allowInsecurePath: true` trên provider đó để bỏ qua kiểm tra bảo mật đường dẫn.

### Exec provider

- Chạy đường dẫn binary tuyệt đối đã cấu hình, không shell.
- Theo mặc định, `command` phải trỏ đến một file thông thường (không phải symlink).
- Đặt `allowSymlinkCommand: true` để cho phép đường dẫn lệnh symlink (ví dụ Homebrew shims). OpenClaw xác thực đường dẫn mục tiêu đã giải quyết.
- Ghép `allowSymlinkCommand` với `trustedDirs` cho các đường dẫn package-manager (ví dụ `["/opt/homebrew"]`).
- Hỗ trợ timeout, timeout không có output, giới hạn byte output, danh sách cho phép env, và thư mục tin cậy.
- Lưu ý fail-closed trên Windows: nếu xác minh ACL không khả dụng cho đường dẫn lệnh, giải quyết thất bại. Đối với các đường dẫn tin cậy, đặt `allowInsecurePath: true` trên provider đó để bỏ qua kiểm tra bảo mật đường dẫn.

Payload yêu cầu (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Payload phản hồi (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Lỗi tùy chọn cho từng id:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Ví dụ tích hợp Exec

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // cần thiết cho các binary symlinked của Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // cần thiết cho các binary symlinked của Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // cần thiết cho các binary symlinked của Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## Tài liệu xác thực SSH sandbox

Backend `ssh` sandbox cốt lõi cũng hỗ trợ SecretRefs cho tài liệu xác thực SSH:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Hành vi runtime:

- OpenClaw giải quyết các refs này trong quá trình kích hoạt sandbox, không lazy trong mỗi cuộc gọi SSH.
- Giá trị đã giải quyết được ghi vào các file tạm với quyền hạn chế và sử dụng trong cấu hình SSH được tạo.
- Nếu backend sandbox hiệu quả không phải là `ssh`, các refs này vẫn không hoạt động và không chặn startup.

## Bề mặt credential được hỗ trợ

Danh sách các credentials được hỗ trợ và không được hỗ trợ được liệt kê trong:

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

Các credentials được tạo runtime hoặc xoay vòng và tài liệu làm mới OAuth cố ý bị loại trừ khỏi giải quyết SecretRef chỉ đọc.

## Hành vi yêu cầu và thứ tự ưu tiên

- Trường không có ref: không thay đổi.
- Trường có ref: yêu cầu trên bề mặt hoạt động trong quá trình kích hoạt.
- Nếu có cả plaintext và ref, ref có ưu tiên trên các đường dẫn ưu tiên được hỗ trợ.

Cảnh báo và tín hiệu audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (cảnh báo runtime)
- `REF_SHADOWED` (phát hiện audit khi credentials `auth-profiles.json` có ưu tiên hơn refs `openclaw.json`)

Hành vi tương thích Google Chat:

- `serviceAccountRef` có ưu tiên hơn `serviceAccount` plaintext.
- Giá trị plaintext bị bỏ qua khi ref sibling được đặt.

## Kích hoạt triggers

Kích hoạt Secret chạy trên:

- Startup (kiểm tra trước và kích hoạt cuối cùng)
- Đường dẫn áp dụng nóng reload cấu hình
- Đường dẫn kiểm tra lại restart reload cấu hình
- Reload thủ công qua `secrets.reload`

Hợp đồng kích hoạt:

- Thành công hoán đổi snapshot một cách nguyên tử.
- Thất bại startup hủy bỏ startup gateway.
- Thất bại reload runtime giữ snapshot tốt nhất trước đó.
- Cung cấp một token channel cụ thể cho một cuộc gọi công cụ/hỗ trợ không kích hoạt SecretRef; điểm kích hoạt vẫn là startup, reload, và `secrets.reload` rõ ràng.

## Tín hiệu suy giảm và phục hồi

Khi kích hoạt reload-time thất bại sau một trạng thái khỏe mạnh, OpenClaw vào trạng thái secrets suy giảm.

Sự kiện hệ thống một lần và mã log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Hành vi:

- Suy giảm: runtime giữ snapshot tốt nhất trước đó.
- Phục hồi: phát ra một lần sau khi kích hoạt thành công tiếp theo.
- Thất bại lặp lại trong khi đã suy giảm ghi lại cảnh báo nhưng không spam sự kiện.
- Startup fail-fast không phát ra sự kiện suy giảm vì runtime chưa bao giờ hoạt động.

## Giải quyết đường dẫn lệnh

Đường dẫn lệnh có thể chọn tham gia giải quyết SecretRef được hỗ trợ qua gateway snapshot RPC.

Có hai hành vi chính:

- Đường dẫn lệnh nghiêm ngặt (ví dụ `openclaw memory` remote-memory paths và `openclaw qr --remote`) đọc từ snapshot hoạt động và fail nhanh khi một SecretRef cần thiết không có sẵn.
- Đường dẫn lệnh chỉ đọc (ví dụ `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, và các luồng sửa chữa doctor/config chỉ đọc) cũng ưu tiên snapshot hoạt động, nhưng suy giảm thay vì hủy bỏ khi một SecretRef được nhắm mục tiêu không có sẵn trong đường dẫn lệnh đó.

Hành vi chỉ đọc:

- Khi gateway đang chạy, các lệnh này đọc từ snapshot hoạt động trước.
- Nếu giải quyết gateway không hoàn chỉnh hoặc gateway không có sẵn, chúng cố gắng fallback local nhắm mục tiêu cho bề mặt lệnh cụ thể.
- Nếu một SecretRef được nhắm mục tiêu vẫn không có sẵn, lệnh tiếp tục với output chỉ đọc suy giảm và chẩn đoán rõ ràng như "được cấu hình nhưng không có sẵn trong đường dẫn lệnh này".
- Hành vi suy giảm này chỉ là cục bộ lệnh. Nó không làm yếu đi startup runtime, reload, hoặc đường dẫn send/auth.

Các ghi chú khác:

- Làm mới snapshot sau khi xoay vòng secret backend được xử lý bởi `openclaw secrets reload`.
- Phương thức RPC gateway được sử dụng bởi các đường dẫn lệnh này: `secrets.resolve`.

## Quy trình audit và cấu hình

Luồng operator mặc định:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Các phát hiện bao gồm:

- giá trị plaintext tại chỗ (`openclaw.json`, `auth-profiles.json`, `.env`, và các mục `models.json` được tạo)
- dư lượng header provider nhạy cảm plaintext trong các mục `models.json` được tạo
- refs chưa giải quyết
- shadowing ưu tiên (`auth-profiles.json` có ưu tiên hơn refs `openclaw.json`)
- dư lượng cũ (`auth.json`, nhắc nhở OAuth)

Ghi chú Exec:

- Theo mặc định, audit bỏ qua kiểm tra khả năng giải quyết SecretRef exec để tránh tác động phụ lệnh.
- Sử dụng `openclaw secrets audit --allow-exec` để thực thi các provider exec trong quá trình audit.

Ghi chú dư lượng header:

- Phát hiện header provider nhạy cảm dựa trên heuristic tên (các tên và đoạn header auth/credential phổ biến như `authorization`, `x-api-key`, `token`, `secret`, `password`, và `credential`).

### `secrets configure`

Trợ giúp tương tác mà:

- cấu hình `secrets.providers` trước (`env`/`file`/`exec`, thêm/sửa/xóa)
- cho phép bạn chọn các trường chứa secret được hỗ trợ trong `openclaw.json` cộng với `auth-profiles.json` cho một phạm vi agent
- có thể tạo một ánh xạ `auth-profiles.json` mới trực tiếp trong picker mục tiêu
- thu thập chi tiết SecretRef (`source`, `provider`, `id`)
- chạy giải quyết trước khi lưu
- có thể áp dụng ngay lập tức

Ghi chú Exec:

- Kiểm tra trước bỏ qua kiểm tra SecretRef exec trừ khi `--allow-exec` được đặt.
- Nếu bạn áp dụng trực tiếp từ `configure --apply` và kế hoạch bao gồm các refs/providers exec, giữ `--allow-exec` được đặt cho bước áp dụng cũng vậy.

Các chế độ hữu ích:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Mặc định áp dụng `configure`:

- xóa các credentials tĩnh khớp từ `auth-profiles.json` cho các provider được nhắm mục tiêu
- xóa các mục `api_key` tĩnh cũ từ `auth.json`
- xóa các dòng secret đã biết khớp từ `<config-dir>/.env`

### `secrets apply`

Áp dụng một kế hoạch đã lưu:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Ghi chú Exec:

- dry-run bỏ qua kiểm tra exec trừ khi `--allow-exec` được đặt.
- chế độ ghi từ chối các kế hoạch chứa SecretRefs/providers exec trừ khi `--allow-exec` được đặt.

Để biết chi tiết hợp đồng mục tiêu/đường dẫn nghiêm ngặt và các quy tắc từ chối chính xác, xem:

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

## Chính sách an toàn một chiều

OpenClaw cố ý không ghi các bản sao lưu rollback chứa các giá trị secret plaintext lịch sử.

Mô hình an toàn:

- kiểm tra trước phải thành công trước chế độ ghi
- kích hoạt runtime được xác thực trước khi commit
- áp dụng cập nhật file sử dụng thay thế file nguyên tử và khôi phục nỗ lực tốt nhất khi thất bại

## Ghi chú tương thích xác thực cũ

Đối với các credentials tĩnh, runtime không còn phụ thuộc vào lưu trữ xác thực cũ plaintext.

- Nguồn credential runtime là snapshot trong bộ nhớ đã giải quyết.
- Các mục `api_key` tĩnh cũ bị xóa khi được phát hiện.
- Hành vi tương thích liên quan đến OAuth vẫn tách biệt.

## Ghi chú Web UI

Một số SecretInput unions dễ cấu hình hơn ở chế độ editor raw hơn là ở chế độ form.

## Tài liệu liên quan

- Lệnh CLI: [secrets](/cli/secrets)
- Chi tiết hợp đồng kế hoạch: [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)
- Bề mặt credential: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- Thiết lập xác thực: [Authentication](/gateway/authentication)
- Tư thế bảo mật: [Security](/gateway/security)
- Thứ tự ưu tiên môi trường: [Environment Variables](/help/environment)\n