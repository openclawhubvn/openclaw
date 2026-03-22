---
summary: "Hợp đồng cho `secrets apply` plans: xác thực target, khớp path, và phạm vi target `auth-profiles.json`"
read_when:
  - Tạo hoặc review `openclaw secrets apply` plans
  - Debug lỗi `Invalid plan target path`
  - Hiểu hành vi xác thực loại và path của target
title: "Hợp đồng Secrets Apply Plan"
---

# Hợp đồng secrets apply plan

Trang này định nghĩa hợp đồng nghiêm ngặt mà `openclaw secrets apply` áp dụng.

Nếu target không khớp với các quy tắc này, apply sẽ thất bại trước khi thay đổi cấu hình.

## Cấu trúc file plan

`openclaw secrets apply --from <plan.json>` yêu cầu một mảng `targets` chứa các plan targets:

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

## Phạm vi target được hỗ trợ

Plan targets được chấp nhận cho các đường dẫn credential được hỗ trợ trong:

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

## Hành vi loại target

Quy tắc chung:

- `target.type` phải được nhận diện và phải khớp với cấu trúc `target.path` đã chuẩn hóa.

Các alias tương thích vẫn được chấp nhận cho các plan hiện có:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Quy tắc xác thực path

Mỗi target được xác thực với tất cả các điều sau:

- `type` phải là loại target được nhận diện.
- `path` phải là một dot path không rỗng.
- `pathSegments` có thể bỏ qua. Nếu có, phải chuẩn hóa giống hệt `path`.
- Các segment bị cấm sẽ bị từ chối: `__proto__`, `prototype`, `constructor`.
- Path đã chuẩn hóa phải khớp với cấu trúc path đã đăng ký cho loại target.
- Nếu `providerId` hoặc `accountId` được đặt, phải khớp với id được mã hóa trong path.
- Targets `auth-profiles.json` yêu cầu `agentId`.
- Khi tạo mapping mới cho `auth-profiles.json`, bao gồm `authProfileProvider`.

## Hành vi khi thất bại

Nếu target không qua xác thực, apply sẽ thoát với lỗi như:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Không có ghi chép nào được thực hiện cho một plan không hợp lệ.

## Hành vi đồng ý của exec provider

- `--dry-run` mặc định bỏ qua kiểm tra exec SecretRef.
- Plans chứa exec SecretRefs/providers bị từ chối ở chế độ ghi trừ khi `--allow-exec` được đặt.
- Khi xác thực/apply plans chứa exec, truyền `--allow-exec` trong cả lệnh dry-run và ghi.

## Ghi chú phạm vi runtime và audit

- Các mục chỉ có ref trong `auth-profiles.json` (`keyRef`/`tokenRef`) được bao gồm trong giải quyết runtime và phạm vi audit.
- `secrets apply` ghi các targets `openclaw.json` được hỗ trợ, targets `auth-profiles.json` được hỗ trợ, và các targets scrub tùy chọn.

## Kiểm tra của operator

```bash
# Xác thực plan mà không ghi
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Sau đó apply thực sự
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Với plans chứa exec, cần opt in rõ ràng ở cả hai chế độ
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Nếu apply thất bại với thông báo đường dẫn target không hợp lệ, tạo lại plan với `openclaw secrets configure` hoặc sửa đường dẫn target theo cấu trúc được hỗ trợ ở trên.

## Tài liệu liên quan

- [Quản lý Secrets](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [SecretRef Credential Surface](/reference/secretref-credential-surface)
- [Tham khảo Cấu hình](/gateway/configuration-reference)\n