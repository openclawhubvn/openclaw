# `openclaw secrets`

Dùng `openclaw secrets` để quản lý SecretRefs và duy trì snapshot runtime hoạt động ổn định.

Các lệnh chính:

- `reload`: RPC gateway (`secrets.reload`) để tái giải quyết refs và thay thế snapshot runtime chỉ khi thành công hoàn toàn (không ghi cấu hình).
- `audit`: quét chỉ đọc các cấu hình/auth/generated-model để tìm plaintext, refs chưa giải quyết, và lệch ưu tiên (bỏ qua exec refs trừ khi có `--allow-exec`).
- `configure`: công cụ lập kế hoạch tương tác cho thiết lập provider, ánh xạ mục tiêu, và kiểm tra trước (yêu cầu TTY).
- `apply`: thực thi kế hoạch đã lưu (`--dry-run` chỉ để kiểm tra; dry-run bỏ qua kiểm tra exec mặc định, và chế độ ghi từ chối kế hoạch chứa exec trừ khi có `--allow-exec`), sau đó xóa sạch các plaintext residues mục tiêu.

Vòng lặp vận hành khuyến nghị:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Nếu kế hoạch có `exec` SecretRefs/providers, thêm `--allow-exec` vào cả lệnh dry-run và apply.

Mã thoát cho CI/gates:

- `audit --check` trả về `1` khi có findings.
- refs chưa giải quyết trả về `2`.

Liên quan:

- Hướng dẫn Secrets: [Secrets Management](/gateway/secrets)
- Bề mặt Credential: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- Hướng dẫn bảo mật: [Security](/gateway/security)

## Tải lại snapshot runtime

Tái giải quyết secret refs và thay thế snapshot runtime một cách nguyên tử.

```bash
openclaw secrets reload
openclaw secrets reload --json
```

Ghi chú:

- Sử dụng phương thức RPC gateway `secrets.reload`.
- Nếu giải quyết thất bại, gateway giữ lại snapshot tốt nhất đã biết và trả về lỗi (không kích hoạt một phần).
- Phản hồi JSON bao gồm `warningCount`.

## Audit

Quét trạng thái OpenClaw để tìm:

- lưu trữ secret dạng plaintext
- refs chưa giải quyết
- lệch ưu tiên (credentials trong `auth-profiles.json` che khuất refs trong `openclaw.json`)
- residues trong `agents/*/agent/models.json` (giá trị `apiKey` của provider và header nhạy cảm của provider)
- residues cũ (mục lưu trữ auth cũ, nhắc nhở OAuth)

Ghi chú residue header:

- Phát hiện header nhạy cảm của provider dựa trên tên-heuristic (tên và đoạn phổ biến của header auth/credential như `authorization`, `x-api-key`, `token`, `secret`, `password`, và `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Hành vi thoát:

- `--check` thoát với mã khác không khi có findings.
- refs chưa giải quyết thoát với mã khác không ưu tiên cao hơn.

Điểm nổi bật của báo cáo:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- mã findings:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (trợ lý tương tác)

Xây dựng thay đổi provider và SecretRef tương tác, chạy kiểm tra trước, và tùy chọn áp dụng:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Luồng:

- Thiết lập provider trước (`add/edit/remove` cho alias `secrets.providers`).
- Ánh xạ credential thứ hai (chọn trường và gán refs `{source, provider, id}`).
- Kiểm tra trước và tùy chọn áp dụng cuối cùng.

Flags:

- `--providers-only`: chỉ cấu hình `secrets.providers`, bỏ qua ánh xạ credential.
- `--skip-provider-setup`: bỏ qua thiết lập provider và ánh xạ credentials tới các provider hiện có.
- `--agent <id>`: giới hạn khám phá mục tiêu `auth-profiles.json` và ghi vào một kho agent.
- `--allow-exec`: cho phép kiểm tra exec SecretRef trong kiểm tra trước/áp dụng (có thể thực thi lệnh provider).

Ghi chú:

- Yêu cầu TTY tương tác.
- Không thể kết hợp `--providers-only` với `--skip-provider-setup`.
- `configure` nhắm mục tiêu các trường chứa secret trong `openclaw.json` và `auth-profiles.json` cho phạm vi agent đã chọn.
- `configure` hỗ trợ tạo ánh xạ mới `auth-profiles.json` trực tiếp trong luồng chọn.
- Bề mặt hỗ trợ chuẩn: [SecretRef Credential Surface](/reference/secretref-credential-surface).
- Thực hiện giải quyết trước khi áp dụng.
- Nếu kiểm tra trước/áp dụng bao gồm exec refs, giữ `--allow-exec` cho cả hai bước.
- Kế hoạch tạo ra mặc định có tùy chọn xóa (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` đều được bật).
- Đường dẫn áp dụng là một chiều cho các giá trị plaintext đã xóa.
- Không có `--apply`, CLI vẫn hỏi `Apply this plan now?` sau kiểm tra trước.
- Với `--apply` (và không có `--yes`), CLI hỏi thêm xác nhận không thể đảo ngược.

Ghi chú an toàn provider exec:

- Cài đặt Homebrew thường lộ ra các binary symlinked dưới `/opt/homebrew/bin/*`.
- Đặt `allowSymlinkCommand: true` chỉ khi cần cho các đường dẫn package-manager đáng tin cậy, và kết hợp với `trustedDirs` (ví dụ `["/opt/homebrew"]`).
- Trên Windows, nếu không thể xác minh ACL cho đường dẫn provider, OpenClaw sẽ thất bại. Chỉ cho các đường dẫn đáng tin cậy, đặt `allowInsecurePath: true` trên provider đó để bỏ qua kiểm tra bảo mật đường dẫn.

## Áp dụng kế hoạch đã lưu

Áp dụng hoặc kiểm tra trước một kế hoạch đã tạo trước đó:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Hành vi exec:

- `--dry-run` kiểm tra trước mà không ghi file.
- kiểm tra exec SecretRef bị bỏ qua mặc định trong dry-run.
- chế độ ghi từ chối kế hoạch chứa exec SecretRefs/providers trừ khi có `--allow-exec`.
- Dùng `--allow-exec` để chọn kiểm tra/thực thi provider exec trong cả hai chế độ.

Chi tiết hợp đồng kế hoạch (đường dẫn mục tiêu cho phép, quy tắc xác thực, và ngữ nghĩa thất bại):

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

Những gì `apply` có thể cập nhật:

- `openclaw.json` (mục tiêu SecretRef + cập nhật/xóa provider)
- `auth-profiles.json` (xóa mục tiêu provider)
- residues `auth.json` cũ
- `~/.openclaw/.env` các khóa secret đã biết có giá trị đã di chuyển

## Tại sao không có backup rollback

`secrets apply` không ghi backup rollback chứa các giá trị plaintext cũ.

An toàn đến từ kiểm tra trước nghiêm ngặt + áp dụng gần như nguyên tử với nỗ lực tốt nhất khôi phục trong bộ nhớ khi thất bại.

## Ví dụ

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Nếu `audit --check` vẫn báo cáo findings plaintext, cập nhật các đường dẫn mục tiêu còn lại được báo cáo và chạy lại audit.\n