---
title: CI Pipeline
summary: "Biểu đồ job CI, scope gates, và lệnh tương đương chạy local"
read_when:
  - Cần hiểu tại sao một job CI chạy hoặc không chạy
  - Đang debug lỗi GitHub Actions

---

# CI Pipeline

CI chạy trên mọi lần push lên `main` và mọi pull request. Sử dụng smart scoping để bỏ qua các job tốn kém khi chỉ có thay đổi không liên quan.

## Tổng quan Job

| Job               | Mục đích                                                | Khi nào chạy                        |
| ----------------- | ------------------------------------------------------- | ----------------------------------- |
| `docs-scope`      | Phát hiện thay đổi chỉ liên quan đến docs               | Luôn chạy                           |
| `changed-scope`   | Phát hiện khu vực thay đổi (node/macos/android/windows) | Thay đổi không phải docs            |
| `check`           | Kiểm tra TypeScript types, lint, format                 | Thay đổi không phải docs, node      |
| `check-docs`      | Lint Markdown + kiểm tra link hỏng                      | Thay đổi docs                       |
| `secrets`         | Phát hiện secrets bị lộ                                 | Luôn chạy                           |
| `build-artifacts` | Build dist một lần, chia sẻ với `release-check`         | Push lên `main`, thay đổi node      |
| `release-check`   | Xác thực nội dung npm pack                              | Push lên `main` sau build           |
| `checks`          | Node tests + kiểm tra protocol trên PRs; Bun compat khi push | Thay đổi không phải docs, node  |
| `compat-node22`   | Tương thích runtime Node tối thiểu                      | Push lên `main`, thay đổi node      |
| `checks-windows`  | Test đặc thù cho Windows                                | Thay đổi không phải docs, liên quan windows |
| `macos`           | Swift lint/build/test + TS tests                        | PRs có thay đổi macos               |
| `android`         | Gradle build + tests                                    | Thay đổi không phải docs, android   |

## Thứ tự Fail-Fast

Jobs được sắp xếp để các kiểm tra rẻ tiền fail trước khi các job tốn kém chạy:

1. `docs-scope` + `changed-scope` + `check` + `secrets` (chạy song song, gates rẻ tiền trước)
2. PRs: `checks` (Linux Node test chia thành 2 phần), `checks-windows`, `macos`, `android`
3. Push lên `main`: `build-artifacts` + `release-check` + Bun compat + `compat-node22`

Logic scope nằm trong `scripts/ci-changed-scope.mjs` và được kiểm tra bằng unit test trong `src/scripts/ci-changed-scope.test.ts`.

## Runners

| Runner                           | Jobs                                       |
| -------------------------------- | ------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | Hầu hết các job Linux, bao gồm phát hiện scope |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                           |
| `macos-latest`                   | `macos`, `ios`                             |

## Lệnh Tương Đương Chạy Local

```bash
pnpm check          # types + lint + format
pnpm test           # vitest tests
pnpm check:docs     # định dạng docs + lint + link hỏng
pnpm release:check  # xác thực npm pack
```\n