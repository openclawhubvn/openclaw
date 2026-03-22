---
summary: "Tham khảo CLI cho `openclaw secrets` (reload, audit, configure, apply)"
read_when:
  - Tái giải quyết tham chiếu bí mật khi chạy
  - Kiểm tra dư lượng văn bản rõ và tham chiếu chưa giải quyết
  - Cấu hình SecretRefs và áp dụng thay đổi xóa một chiều
title: "secrets"
---

# `openclaw secrets`

Sử dụng `openclaw secrets` để quản lý SecretRefs và duy trì trạng thái runtime hiện tại.

Các vai trò lệnh:

- `reload`: gateway RPC (`secrets.reload`) tái giải quyết tham chiếu và thay thế trạng thái runtime chỉ khi thành công hoàn toàn (không ghi cấu hình).
- `audit`: quét chỉ đọc các kho cấu hình/xác thực/mô hình tạo ra và dư lượng cũ cho văn bản rõ, tham chiếu chưa giải quyết, và sự trôi dạt ưu tiên (tham chiếu thực thi bị bỏ qua trừ khi `--allow-exec` được đặt).
- `configure`: lập kế hoạch tương tác cho thiết lập nhà cung cấp, ánh xạ mục tiêu, và kiểm tra trước (yêu cầu TTY).
- `apply`: thực thi một kế hoạch đã lưu (`--dry-run` chỉ để xác thực; dry-run bỏ qua kiểm tra thực thi theo mặc định, và chế độ ghi từ chối các kế hoạch chứa thực thi trừ khi `--allow-exec` được đặt), sau đó xóa dư lượng văn bản rõ mục tiêu.

Vòng lặp vận hành được khuyến nghị:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Nếu kế hoạch của bạn bao gồm SecretRefs/nhà cung cấp `exec`, hãy thêm `--allow-exec` vào cả lệnh dry-run và apply.

Ghi chú mã thoát cho CI/gates:

- `audit --check` trả về `1` khi có phát hiện.
- tham chiếu chưa giải quyết trả về `2`.

Liên quan:

- Hướng dẫn quản lý bí mật: [Secrets Management](/gateway/secrets)
- Bề mặt thông tin xác thực: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- Hướng dẫn bảo mật: [Security](/gateway/security)

## Tải lại trạng thái runtime

Tái giải quyết tham chiếu bí mật và thay thế trạng thái runtime một cách nguyên tử.

```bash
openclaw secrets reload
openclaw secrets reload --json
```

Ghi chú:

- Sử dụng phương thức gateway RPC `secrets.reload`.
- Nếu giải quyết thất bại, gateway giữ lại trạng thái tốt nhất đã biết và trả về lỗi (không kích hoạt một phần).
- Phản hồi JSON bao gồm `warningCount`.

## Kiểm tra

Quét trạng thái OpenClaw để tìm:

- lưu trữ bí mật văn bản rõ
- tham chiếu chưa giải quyết
- sự trôi dạt ưu tiên (thông tin xác thực `auth-profiles.json` che khuất tham chiếu `openclaw.json`)
- dư lượng tạo ra `agents/*/agent/models.json` (giá trị `apiKey` của nhà cung cấp và tiêu đề nhạy cảm của nhà cung cấp)
- dư lượng cũ (mục lưu trữ xác thực cũ, nhắc nhở OAuth)

Ghi chú dư lượng tiêu đề:

- Phát hiện tiêu đề nhạy cảm của nhà cung cấp dựa trên tên-heuristic (tên và đoạn mã tiêu đề xác thực/thông tin xác thực phổ biến như `authorization`, `x-api-key`, `token`, `secret`, `password`, và `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Hành vi thoát:

- `--check` thoát với mã khác không khi có phát hiện.
- tham chiếu chưa giải quyết thoát với mã khác không ưu tiên cao hơn.

Điểm nổi bật của báo cáo:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- mã phát hiện:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Cấu hình (trợ giúp tương tác)

Xây dựng thay đổi nhà cung cấp và SecretRef một cách tương tác, chạy kiểm tra trước, và áp dụng tùy chọn:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Quy trình:

- Thiết lập nhà cung cấp trước (`thêm/sửa/xóa` cho bí danh `secrets.providers`).
- Ánh xạ thông tin xác thực thứ hai (chọn trường và gán tham chiếu `{source, provider, id}`).
- Kiểm tra trước và áp dụng tùy chọn cuối cùng.

Cờ:

- `--providers-only`: chỉ cấu hình `secrets.providers`, bỏ qua ánh xạ thông tin xác thực.
- `--skip-provider-setup`: bỏ qua thiết lập nhà cung cấp và ánh xạ thông tin xác thực tới các nhà cung cấp hiện có.
- `--agent <id>`: giới hạn khám phá mục tiêu `auth-profiles.json` và ghi vào một kho đại lý.
- `--allow-exec`: cho phép kiểm tra SecretRef thực thi trong quá trình kiểm tra trước/áp dụng (có thể thực thi lệnh nhà cung cấp).

Ghi chú:

- Yêu cầu một TTY tương tác.
- Không thể kết hợp `--providers-only` với `--skip-provider-setup`.
- `configure` nhắm mục tiêu các trường mang bí mật trong `openclaw.json` cộng với `auth-profiles.json` cho phạm vi đại lý đã chọn.
- `configure` hỗ trợ tạo ánh xạ `auth-profiles.json` mới trực tiếp trong quy trình chọn.
- Bề mặt hỗ trợ chuẩn: [SecretRef Credential Surface](/reference/secretref-credential-surface).
- Nó thực hiện giải quyết trước khi áp dụng.
- Nếu kiểm tra trước/áp dụng bao gồm tham chiếu thực thi, giữ `--allow-exec` được đặt cho cả hai bước.
- Các kế hoạch tạo ra mặc định có các tùy chọn xóa (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` đều được bật).
- Đường dẫn áp dụng là một chiều cho các giá trị văn bản rõ đã bị xóa.
- Không có `--apply`, CLI vẫn nhắc `Áp dụng kế hoạch này ngay bây giờ?` sau khi kiểm tra trước.
- Với `--apply` (và không có `--yes`), CLI nhắc thêm một xác nhận không thể đảo ngược.

Ghi chú an toàn nhà cung cấp thực thi:

- Cài đặt Homebrew thường phơi bày các tệp nhị phân liên kết tượng trưng dưới `/opt/homebrew/bin/*`.
- Đặt `allowSymlinkCommand: true` chỉ khi cần thiết cho các đường dẫn trình quản lý gói đáng tin cậy, và kết hợp với `trustedDirs` (ví dụ `["/opt/homebrew"]`).
- Trên Windows, nếu xác minh ACL không khả dụng cho một đường dẫn nhà cung cấp, OpenClaw sẽ thất bại. Đối với các đường dẫn đáng tin cậy, chỉ cần đặt `allowInsecurePath: true` trên nhà cung cấp đó để bỏ qua kiểm tra bảo mật đường dẫn.

## Áp dụng một kế hoạch đã lưu

Áp dụng hoặc kiểm tra trước một kế hoạch đã tạo trước đó:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Hành vi thực thi:

- `--dry-run` xác thực kiểm tra trước mà không ghi tệp.
- kiểm tra SecretRef thực thi bị bỏ qua theo mặc định trong dry-run.
- chế độ ghi từ chối các kế hoạch chứa SecretRefs/nhà cung cấp thực thi trừ khi `--allow-exec` được đặt.
- Sử dụng `--allow-exec` để chọn tham gia kiểm tra/thực thi nhà cung cấp thực thi trong cả hai chế độ.

Chi tiết hợp đồng kế hoạch (đường dẫn mục tiêu được phép, quy tắc xác thực, và ngữ nghĩa thất bại):

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

Những gì `apply` có thể cập nhật:

- `openclaw.json` (mục tiêu SecretRef + thêm/xóa nhà cung cấp)
- `auth-profiles.json` (xóa mục tiêu nhà cung cấp)
- dư lượng `auth.json` cũ
- `~/.openclaw/.env` các khóa bí mật đã biết có giá trị đã được di chuyển

## Tại sao không có sao lưu rollback

`secrets apply` cố ý không ghi sao lưu rollback chứa các giá trị văn bản rõ cũ.

An toàn đến từ kiểm tra trước nghiêm ngặt + áp dụng gần như nguyên tử với nỗ lực tốt nhất khôi phục trong bộ nhớ khi thất bại.

## Ví dụ

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Nếu `audit --check` vẫn báo cáo phát hiện văn bản rõ, cập nhật các đường dẫn mục tiêu còn lại được báo cáo và chạy lại kiểm tra.
