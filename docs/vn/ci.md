---
title: CI Pipeline
summary: "Biểu đồ công việc CI, cổng phạm vi, và các lệnh tương đương cục bộ"
read_when:
  - Cần hiểu tại sao một công việc CI đã hoặc không được chạy
  - Đang gỡ lỗi các kiểm tra GitHub Actions thất bại
---

# CI Pipeline

CI chạy trên mọi lần đẩy (push) vào `main` và mọi yêu cầu kéo (pull request). Nó sử dụng phạm vi thông minh để bỏ qua các công việc tốn kém khi chỉ có những khu vực không liên quan bị thay đổi.

## Tổng quan công việc

| Công việc         | Mục đích                                                | Khi nào chạy                        |
| ----------------- | ------------------------------------------------------- | ---------------------------------- |
| `docs-scope`      | Phát hiện thay đổi chỉ trong tài liệu                   | Luôn luôn                           |
| `changed-scope`   | Phát hiện khu vực nào đã thay đổi (node/macos/android/windows) | Thay đổi không liên quan đến tài liệu |
| `check`           | Kiểm tra kiểu TypeScript, lint, định dạng               | Thay đổi không liên quan đến tài liệu, node |
| `check-docs`      | Kiểm tra lint Markdown + liên kết hỏng                  | Thay đổi tài liệu                   |
| `secrets`         | Phát hiện rò rỉ bí mật                                  | Luôn luôn                           |
| `build-artifacts` | Xây dựng dist một lần, chia sẻ với `release-check`      | Đẩy vào `main`, thay đổi node       |
| `release-check`   | Xác thực nội dung npm pack                              | Đẩy vào `main` sau khi xây dựng     |
| `checks`          | Kiểm tra Node + kiểm tra giao thức trên PRs; Bun tương thích khi đẩy | Thay đổi không liên quan đến tài liệu, node |
| `compat-node22`   | Tương thích với runtime Node tối thiểu được hỗ trợ      | Đẩy vào `main`, thay đổi node       |
| `checks-windows`  | Kiểm tra đặc thù cho Windows                            | Thay đổi không liên quan đến tài liệu, liên quan đến Windows |
| `macos`           | Lint/Xây dựng/kiểm tra Swift + kiểm tra TS              | PRs với thay đổi macos              |
| `android`         | Xây dựng Gradle + kiểm tra                              | Thay đổi không liên quan đến tài liệu, android |

## Thứ tự thất bại nhanh

Các công việc được sắp xếp để các kiểm tra rẻ tiền thất bại trước khi các công việc đắt tiền chạy:

1. `docs-scope` + `changed-scope` + `check` + `secrets` (chạy song song, cổng rẻ tiền trước)
2. PRs: `checks` (Kiểm tra Node trên Linux chia thành 2 phần), `checks-windows`, `macos`, `android`
3. Đẩy vào `main`: `build-artifacts` + `release-check` + Bun tương thích + `compat-node22`

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được kiểm tra bằng unit test trong `src/scripts/ci-changed-scope.test.ts`.

## Runners

| Runner                           | Công việc                                  |
| -------------------------------- | ------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | Hầu hết các công việc trên Linux, bao gồm phát hiện phạm vi |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                           |
| `macos-latest`                   | `macos`, `ios`                             |

## Lệnh tương đương cục bộ

```bash
pnpm check          # kiểm tra kiểu + lint + định dạng
pnpm test           # kiểm tra bằng vitest
pnpm check:docs     # định dạng tài liệu + lint + liên kết hỏng
pnpm release:check  # xác thực npm pack
```
