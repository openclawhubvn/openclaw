---
summary: "Khám phá cách quản lý bí mật hiệu quả với SecretRef, snapshot runtime và xóa an toàn trong OpenClaw."
read_when:
  - Cấu hình SecretRefs cho thông tin đăng nhập của nhà cung cấp và tham chiếu `auth-profiles.json`
  - Vận hành tải lại bí mật, kiểm tra, cấu hình và áp dụng an toàn trong môi trường sản xuất
  - Hiểu về khởi động nhanh chóng, lọc bề mặt không hoạt động, và hành vi tốt nhất đã biết
title: "Hướng Dẫn Quản Lý Bí Mật Với OpenClaw"
---

# Quản lý Bí mật

OpenClaw hỗ trợ SecretRefs bổ sung để thông tin đăng nhập không cần lưu dưới dạng văn bản thuần trong cấu hình.

Văn bản thuần vẫn hoạt động. SecretRefs là tùy chọn cho từng thông tin đăng nhập.

## Mục tiêu và mô hình runtime

Bí mật được giải quyết thành một snapshot runtime trong bộ nhớ.

- Giải quyết diễn ra nhanh chóng trong quá trình kích hoạt, không trì hoãn khi có yêu cầu.
- Khởi động sẽ thất bại nhanh chóng nếu một SecretRef đang hoạt động không thể được giải quyết.
- Tải lại sử dụng hoán đổi nguyên tử: thành công hoàn toàn, hoặc giữ lại snapshot tốt nhất đã biết.
- Yêu cầu runtime chỉ đọc từ snapshot trong bộ nhớ đang hoạt động.
- Các đường dẫn gửi đi cũng đọc từ snapshot đang hoạt động đó (ví dụ như gửi trả lời/chủ đề Discord và gửi hành động Telegram); chúng không giải quyết lại SecretRefs mỗi lần gửi.

Điều này giúp tránh sự cố của nhà cung cấp bí mật trên các đường dẫn yêu cầu nóng.

## Lọc bề mặt hoạt động

SecretRefs chỉ được xác thực trên các bề mặt thực sự hoạt động.

- Bề mặt đã bật: các tham chiếu chưa giải quyết sẽ chặn khởi động/tải lại.
- Bề mặt không hoạt động: các tham chiếu chưa giải quyết không chặn khởi động/tải lại.
- Các tham chiếu không hoạt động phát ra chẩn đoán không gây tử vong với mã `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Ví dụ về bề mặt không hoạt động:

- Các mục kênh/tài khoản bị vô hiệu hóa.
- Thông tin đăng nhập kênh cấp cao nhất mà không có tài khoản nào được bật kế thừa.
- Bề mặt công cụ/tính năng bị vô hiệu hóa.
- Các khóa cụ thể của nhà cung cấp tìm kiếm web không được chọn bởi `tools.web.search.provider`.
  Ở chế độ tự động (nhà cung cấp chưa được đặt), các khóa được tham khảo theo thứ tự ưu tiên để tự động phát hiện nhà cung cấp cho đến khi một khóa được giải quyết.
  Sau khi chọn, các khóa nhà cung cấp không được chọn được coi là không hoạt động cho đến khi được chọn.
- Tài liệu xác thực SSH sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`, cùng với các ghi đè theo từng agent) chỉ hoạt động khi backend sandbox hiệu quả là `ssh` cho agent mặc định hoặc một agent đã bật.
- SecretRefs `gateway.remote.token` / `gateway.remote.password` hoạt động nếu một trong những điều này đúng:
  - `gateway.mode=remote`
  - `gateway.remote.url` được cấu hình
  - `gateway.tailscale.mode` là `serve` hoặc `funnel`
  - Ở chế độ cục bộ mà không có các bề mặt từ xa đó:
    - `gateway.remote.token` hoạt động khi xác thực token có thể thắng và không có token môi trường/xác thực nào được cấu hình.
    - `gateway.remote.password` chỉ hoạt động khi xác thực mật khẩu có thể thắng và không có mật khẩu môi trường/xác thực nào được cấu hình.
- SecretRef `gateway.auth.token` không hoạt động cho việc giải quyết xác thực khởi động khi `OPENCLAW_GATEWAY_TOKEN` (hoặc `CLAWDBOT_GATEWAY_TOKEN`) được đặt, vì đầu vào token môi trường thắng cho runtime đó.

## Chẩn đoán bề mặt xác thực Gateway

Khi một SecretRef được cấu hình trên `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token`, hoặc `gateway.remote.password`, nhật ký khởi động/tải lại gateway ghi rõ trạng thái bề mặt:

- `active`: SecretRef là một phần của bề mặt xác thực hiệu quả và phải được giải quyết.
- `inactive`: SecretRef bị bỏ qua cho runtime này vì một bề mặt xác thực khác thắng, hoặc vì xác thực từ xa bị vô hiệu hóa/không hoạt động.

Các mục này được ghi nhật ký với `SECRETS_GATEWAY_AUTH_SURFACE` và bao gồm lý do được sử dụng bởi chính sách bề mặt hoạt động, để bạn có thể thấy tại sao một thông tin đăng nhập được coi là hoạt động hoặc không hoạt động.

## Kiểm tra trước tham chiếu khi onboard

Khi onboard chạy ở chế độ tương tác và bạn chọn lưu trữ SecretRef, OpenClaw thực hiện xác thực trước khi lưu:

- Tham chiếu môi trường: xác thực tên biến môi trường và xác nhận giá trị không rỗng có thể nhìn thấy trong quá trình thiết lập.
- Tham chiếu nhà cung cấp (`file` hoặc `exec`): xác thực lựa chọn nhà cung cấp, giải quyết `id`, và kiểm tra loại giá trị đã giải quyết.
- Đường dẫn tái sử dụng Quickstart: khi `gateway.auth.token` đã là một SecretRef, onboarding giải quyết nó trước khi khởi động probe/dashboard (cho các tham chiếu `env`, `file`, và `exec`) sử dụng cổng nhanh chóng tương tự.

Nếu xác thực thất bại, onboarding sẽ hiển thị lỗi và cho phép bạn thử lại.

## Hợp đồng SecretRef

Sử dụng một định dạng đối tượng duy nhất ở mọi nơi:

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
- `id` phải là một con trỏ JSON tuyệt đối (`/...`)
- Escaping RFC6901 trong các đoạn: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Xác thực:

- `provider` phải khớp với `^[a-z][a-z0-9_-]{0,63}$`
- `id` phải khớp với `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` không được chứa `.` hoặc `..` như các đoạn đường dẫn phân tách bằng dấu gạch chéo (ví dụ `a/../b` bị từ chối)

## Cấu hình nhà cung cấp

Định nghĩa các nhà cung cấp dưới `secrets.providers`:

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

### Nhà cung cấp Env

- Danh sách cho phép tùy chọn qua `allowlist`.
- Giá trị môi trường thiếu/rỗng sẽ làm thất bại giải quyết.

### Nhà cung cấp File

- Đọc tệp cục bộ từ `path`.
- `mode: "json"` mong đợi payload đối tượng JSON và giải quyết `id` như một con trỏ.
- `mode: "singleValue"` mong đợi id tham chiếu `"value"` và trả về nội dung tệp.
- Đường dẫn phải vượt qua kiểm tra quyền sở hữu/quyền truy cập.
- Ghi chú thất bại trên Windows: nếu xác minh ACL không khả dụng cho một đường dẫn, giải quyết sẽ thất bại. Đối với các đường dẫn đáng tin cậy, đặt `allowInsecurePath: true` trên nhà cung cấp đó để bỏ qua kiểm tra bảo mật đường dẫn.

### Nhà cung cấp Exec

- Chạy đường dẫn nhị phân tuyệt đối đã cấu hình, không có shell.
- Theo mặc định, `command` phải trỏ đến một tệp thông thường (không phải một liên kết tượng trưng).
- Đặt `allowSymlinkCommand: true` để cho phép các đường dẫn lệnh liên kết tượng trưng (ví dụ như các shims của Homebrew). OpenClaw xác thực đường dẫn mục tiêu đã giải quyết.
- Ghép `allowSymlinkCommand` với `trustedDirs` cho các đường dẫn của trình quản lý gói (ví dụ `["/opt/homebrew"]`).
- Hỗ trợ timeout, timeout không có đầu ra, giới hạn byte đầu ra, danh sách cho phép môi trường, và các thư mục đáng tin cậy.
- Ghi chú thất bại trên Windows: nếu xác minh ACL không khả dụng cho đường dẫn lệnh, giải quyết sẽ thất bại. Đối với các đường dẫn đáng tin cậy, đặt `allowInsecurePath: true` trên nhà cung cấp đó để bỏ qua kiểm tra bảo mật đường dẫn.

Payload yêu cầu (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Payload phản hồi (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Lỗi tùy chọn theo id:

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
        allowSymlinkCommand: true, // cần thiết cho các nhị phân liên kết tượng trưng của Homebrew
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
        allowSymlinkCommand: true, // cần thiết cho các nhị phân liên kết tượng trưng của Homebrew
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
        allowSymlinkCommand: true, // cần thiết cho các nhị phân liên kết tượng trưng của Homebrew
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

Backend sandbox `ssh` cốt lõi cũng hỗ trợ SecretRefs cho tài liệu xác thực SSH:

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

- OpenClaw giải quyết các tham chiếu này trong quá trình kích hoạt sandbox, không trì hoãn trong mỗi cuộc gọi SSH.
- Các giá trị đã giải quyết được ghi vào các tệp tạm thời với quyền hạn chế và được sử dụng trong cấu hình SSH được tạo.
- Nếu backend sandbox hiệu quả không phải là `ssh`, các tham chiếu này vẫn không hoạt động và không chặn khởi động.

## Bề mặt thông tin đăng nhập được hỗ trợ

Các thông tin đăng nhập được hỗ trợ và không được hỗ trợ chính thức được liệt kê trong:

- [Bề mặt Thông tin Đăng nhập SecretRef](/reference/secretref-credential-surface)

Các thông tin đăng nhập được tạo ra hoặc xoay vòng runtime và tài liệu làm mới OAuth được loại trừ có chủ ý khỏi giải quyết SecretRef chỉ đọc.

## Hành vi và thứ tự ưu tiên yêu cầu

- Trường không có tham chiếu: không thay đổi.
- Trường có tham chiếu: yêu cầu trên các bề mặt hoạt động trong quá trình kích hoạt.
- Nếu cả văn bản thuần và tham chiếu đều có, tham chiếu sẽ được ưu tiên trên các đường dẫn ưu tiên được hỗ trợ.

Cảnh báo và tín hiệu kiểm tra:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (cảnh báo runtime)
- `REF_SHADOWED` (phát hiện kiểm tra khi thông tin đăng nhập `auth-profiles.json` được ưu tiên hơn các tham chiếu `openclaw.json`)

Hành vi tương thích Google Chat:

- `serviceAccountRef` được ưu tiên hơn `serviceAccount` văn bản thuần.
- Giá trị văn bản thuần bị bỏ qua khi tham chiếu anh em được đặt.

## Kích hoạt kích hoạt

Kích hoạt bí mật chạy trên:

- Khởi động (kiểm tra trước và kích hoạt cuối cùng)
- Đường dẫn áp dụng tải lại cấu hình nóng
- Đường dẫn kiểm tra khởi động lại tải lại cấu hình
- Tải lại thủ công qua `secrets.reload`

Hợp đồng kích hoạt:

- Thành công hoán đổi snapshot một cách nguyên tử.
- Thất bại khởi động sẽ hủy bỏ khởi động gateway.
- Thất bại tải lại runtime giữ lại snapshot tốt nhất đã biết.
- Cung cấp một token kênh cụ thể cho mỗi cuộc gọi công cụ/hỗ trợ gửi đi không kích hoạt SecretRef; các điểm kích hoạt vẫn là khởi động, tải lại, và `secrets.reload` rõ ràng.

## Tín hiệu suy giảm và phục hồi

Khi kích hoạt thời gian tải lại thất bại sau một trạng thái khỏe mạnh, OpenClaw sẽ vào trạng thái bí mật suy giảm.

Sự kiện hệ thống một lần và mã nhật ký:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Hành vi:

- Suy giảm: runtime giữ lại snapshot tốt nhất đã biết.
- Phục hồi: phát ra một lần sau khi kích hoạt thành công tiếp theo.
- Các thất bại lặp lại trong khi đã suy giảm ghi nhật ký cảnh báo nhưng không spam sự kiện.
- Khởi động nhanh chóng không phát ra sự kiện suy giảm vì runtime chưa bao giờ hoạt động.

## Giải quyết đường dẫn lệnh

Các đường dẫn lệnh có thể chọn tham gia giải quyết SecretRef được hỗ trợ qua RPC snapshot gateway.

Có hai hành vi rộng:

- Các đường dẫn lệnh nghiêm ngặt (ví dụ như các đường dẫn bộ nhớ từ xa `openclaw memory` và `openclaw qr --remote`) đọc từ snapshot đang hoạt động và thất bại nhanh chóng khi một SecretRef cần thiết không có sẵn.
- Các đường dẫn lệnh chỉ đọc (ví dụ như `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, và các luồng sửa chữa bác sĩ/cấu hình chỉ đọc) cũng ưu tiên snapshot đang hoạt động, nhưng suy giảm thay vì hủy bỏ khi một SecretRef được nhắm mục tiêu không có sẵn trong đường dẫn lệnh đó.

Hành vi chỉ đọc:

- Khi gateway đang chạy, các lệnh này đọc từ snapshot đang hoạt động trước.
- Nếu giải quyết gateway không hoàn chỉnh hoặc gateway không có sẵn, chúng cố gắng dự phòng cục bộ nhắm mục tiêu cho bề mặt lệnh cụ thể.
- Nếu một SecretRef được nhắm mục tiêu vẫn không có sẵn, lệnh tiếp tục với đầu ra chỉ đọc suy giảm và chẩn đoán rõ ràng như "được cấu hình nhưng không có sẵn trong đường dẫn lệnh này".
- Hành vi suy giảm này chỉ là cục bộ lệnh. Nó không làm suy yếu khởi động runtime, tải lại, hoặc các đường dẫn gửi/xác thực.

Các ghi chú khác:

- Làm mới snapshot sau khi xoay vòng bí mật backend được xử lý bởi `openclaw secrets reload`.
- Phương thức RPC gateway được sử dụng bởi các đường dẫn lệnh này: `secrets.resolve`.

## Quy trình kiểm tra và cấu hình

Luồng nhà điều hành mặc định:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Các phát hiện bao gồm:

- các giá trị văn bản thuần tại chỗ (`openclaw.json`, `auth-profiles.json`, `.env`, và các mục `agents/*/agent/models.json` được tạo)
- dư lượng tiêu đề nhà cung cấp nhạy cảm văn bản thuần trong các mục `models.json` được tạo
- các tham chiếu chưa giải quyết
- ưu tiên che khuất (thông tin đăng nhập `auth-profiles.json` được ưu tiên hơn các tham chiếu `openclaw.json`)
- dư lượng cũ (`auth.json`, nhắc nhở OAuth)

Ghi chú Exec:

- Theo mặc định, kiểm tra bỏ qua các kiểm tra khả năng giải quyết SecretRef exec để tránh các tác dụng phụ của lệnh.
- Sử dụng `openclaw secrets audit --allow-exec` để thực thi các nhà cung cấp exec trong quá trình kiểm tra.

Ghi chú dư lượng tiêu đề:

- Phát hiện tiêu đề nhà cung cấp nhạy cảm dựa trên tên-heuristic (các tên và đoạn tiêu đề xác thực/thông tin đăng nhập phổ biến như `authorization`, `x-api-key`, `token`, `secret`, `password`, và `credential`).

### `secrets configure`

Trợ giúp tương tác mà:

- cấu hình `secrets.providers` trước (`env`/`file`/`exec`, thêm/sửa/xóa)
- cho phép bạn chọn các trường mang bí mật được hỗ trợ trong `openclaw.json` cộng với `auth-profiles.json` cho một phạm vi agent
- có thể tạo một ánh xạ `auth-profiles.json` mới trực tiếp trong bộ chọn mục tiêu
- nắm bắt chi tiết SecretRef (`source`, `provider`, `id`)
- chạy giải quyết trước
- có thể áp dụng ngay lập tức

Ghi chú Exec:

- Kiểm tra trước bỏ qua các kiểm tra SecretRef exec trừ khi `--allow-exec` được đặt.
- Nếu bạn áp dụng trực tiếp từ `configure --apply` và kế hoạch bao gồm các tham chiếu/nhà cung cấp exec, hãy giữ `--allow-exec` được đặt cho bước áp dụng cũng vậy.

Các chế độ hữu ích:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Mặc định áp dụng `configure`:

- xóa các thông tin đăng nhập tĩnh khớp từ `auth-profiles.json` cho các nhà cung cấp được nhắm mục tiêu
- xóa các mục `api_key` tĩnh cũ từ `auth.json`
- xóa các dòng bí mật đã biết khớp từ `<config-dir>/.env`

### `secrets apply`

Áp dụng một kế hoạch đã lưu:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Ghi chú Exec:

- chạy thử bỏ qua các kiểm tra exec trừ khi `--allow-exec` được đặt.
- chế độ ghi từ chối các kế hoạch chứa SecretRefs/nhà cung cấp exec trừ khi `--allow-exec` được đặt.

Để biết chi tiết hợp đồng mục tiêu/đường dẫn nghiêm ngặt và các quy tắc từ chối chính xác, xem:

- [Hợp đồng Kế hoạch Áp dụng Bí mật](/gateway/secrets-plan-contract)

## Chính sách an toàn một chiều

OpenClaw cố ý không ghi các bản sao lưu rollback chứa các giá trị bí mật văn bản thuần lịch sử.

Mô hình an toàn:

- kiểm tra trước phải thành công trước chế độ ghi
- kích hoạt runtime được xác thực trước khi cam kết
- áp dụng cập nhật tệp bằng cách thay thế tệp nguyên tử và khôi phục nỗ lực tốt nhất khi thất bại

## Ghi chú tương thích xác thực cũ

Đối với các thông tin đăng nhập tĩnh, runtime không còn phụ thuộc vào lưu trữ xác thực cũ văn bản thuần.

- Nguồn thông tin đăng nhập runtime là snapshot trong bộ nhớ đã giải quyết.
- Các mục `api_key` tĩnh cũ được xóa khi được phát hiện.
- Hành vi tương thích liên quan đến OAuth vẫn tách biệt.

## Ghi chú Web UI

Một số liên kết SecretInput dễ cấu hình hơn ở chế độ chỉnh sửa thô hơn là ở chế độ biểu mẫu.

## Tài liệu liên quan

- Lệnh CLI: [secrets](/cli/secrets)
- Chi tiết hợp đồng kế hoạch: [Hợp đồng Kế hoạch Áp dụng Bí mật](/gateway/secrets-plan-contract)
- Bề mặt thông tin đăng nhập: [Bề mặt Thông tin Đăng nhập SecretRef](/reference/secretref-credential-surface)
- Thiết lập xác thực: [Xác thực](/gateway/authentication)
- Tư thế bảo mật: [Bảo mật](/gateway/security)
- Thứ tự ưu tiên môi trường: [Biến Môi trường](/help/environment)
