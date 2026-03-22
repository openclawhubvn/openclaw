---
summary: "Hợp đồng cho kế hoạch `secrets apply`: xác thực mục tiêu, khớp đường dẫn, và phạm vi mục tiêu `auth-profiles.json`"
read_when:
  - Tạo hoặc xem xét kế hoạch `openclaw secrets apply`
  - Gỡ lỗi lỗi `Invalid plan target path`
  - Hiểu hành vi xác thực loại và đường dẫn mục tiêu
title: "Hợp đồng Kế hoạch Secrets Apply"
---

# Hợp đồng kế hoạch secrets apply

Trang này định nghĩa hợp đồng nghiêm ngặt được thực thi bởi `openclaw secrets apply`.

Nếu một mục tiêu không tuân thủ các quy tắc này, việc áp dụng sẽ thất bại trước khi thay đổi cấu hình.

## Cấu trúc file kế hoạch

`openclaw secrets apply --from <plan.json>` yêu cầu một mảng `targets` chứa các mục tiêu kế hoạch:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## Phạm vi mục tiêu được hỗ trợ

Các mục tiêu kế hoạch được chấp nhận cho các đường dẫn thông tin xác thực được hỗ trợ trong:

- [Bề mặt Thông tin Xác thực SecretRef](/reference/secretref-credential-surface)

## Hành vi loại mục tiêu

Quy tắc chung:

- `target.type` phải được nhận diện và phải khớp với cấu trúc `target.path` đã chuẩn hóa.

Các bí danh tương thích vẫn được chấp nhận cho các kế hoạch hiện có:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Quy tắc xác thực đường dẫn

Mỗi mục tiêu được xác thực với tất cả các điều sau:

- `type` phải là một loại mục tiêu được nhận diện.
- `path` phải là một đường dẫn không rỗng dạng dấu chấm.
- `pathSegments` có thể được bỏ qua. Nếu có, nó phải chuẩn hóa chính xác giống như `path`.
- Các đoạn bị cấm sẽ bị từ chối: `__proto__`, `prototype`, `constructor`.
- Đường dẫn đã chuẩn hóa phải khớp với cấu trúc đường dẫn đã đăng ký cho loại mục tiêu.
- Nếu `providerId` hoặc `accountId` được đặt, nó phải khớp với id được mã hóa trong đường dẫn.
- Các mục tiêu `auth-profiles.json` yêu cầu `agentId`.
- Khi tạo một ánh xạ mới trong `auth-profiles.json`, bao gồm `authProfileProvider`.

## Hành vi khi thất bại

Nếu một mục tiêu không vượt qua xác thực, việc áp dụng sẽ thoát với lỗi như:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Không có thay đổi nào được ghi lại cho một kế hoạch không hợp lệ.

## Hành vi đồng ý của nhà cung cấp exec

- `--dry-run` bỏ qua kiểm tra SecretRef exec theo mặc định.
- Các kế hoạch chứa SecretRefs/nhà cung cấp exec bị từ chối ở chế độ ghi trừ khi `--allow-exec` được đặt.
- Khi xác thực/áp dụng các kế hoạch chứa exec, hãy truyền `--allow-exec` trong cả lệnh dry-run và ghi.

## Ghi chú về phạm vi thời gian chạy và kiểm toán

- Các mục nhập chỉ có ref trong `auth-profiles.json` (`keyRef`/`tokenRef`) được bao gồm trong giải quyết thời gian chạy và phạm vi kiểm toán.
- `secrets apply` ghi các mục tiêu `openclaw.json` được hỗ trợ, các mục tiêu `auth-profiles.json` được hỗ trợ, và các mục tiêu xóa tùy chọn.

## Kiểm tra của người vận hành

```bash
# Xác thực kế hoạch mà không ghi
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Sau đó áp dụng thực sự
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Đối với các kế hoạch chứa exec, chọn tham gia rõ ràng ở cả hai chế độ
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Nếu việc áp dụng thất bại với thông báo đường dẫn mục tiêu không hợp lệ, hãy tạo lại kế hoạch với `openclaw secrets configure` hoặc sửa đường dẫn mục tiêu thành cấu trúc được hỗ trợ ở trên.

## Tài liệu liên quan

- [Quản lý Secrets](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [Bề mặt Thông tin Xác thực SecretRef](/reference/secretref-credential-surface)
- [Tham khảo Cấu hình](/gateway/configuration-reference)
