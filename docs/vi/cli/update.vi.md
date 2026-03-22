---
summary: "Tham khảo CLI cho `openclaw update` (cập nhật nguồn an toàn + tự động khởi động lại gateway)"
read_when:
  - Muốn cập nhật source checkout an toàn
  - Cần hiểu hành vi của `--update` shorthand
title: "update"
---

# `openclaw update`

Cập nhật OpenClaw an toàn và chuyển đổi giữa các kênh stable/beta/dev.

Nếu cài qua **npm/pnpm** (cài global, không có git metadata), cập nhật qua flow của package manager trong [Updating](/install/updating).

## Cách dùng

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --json
openclaw --update
```

## Tùy chọn

- `--no-restart`: bỏ qua việc khởi động lại dịch vụ Gateway sau khi cập nhật thành công.
- `--channel <stable|beta|dev>`: đặt kênh cập nhật (git + npm; lưu trong config).
- `--tag <dist-tag|version|spec>`: ghi đè mục tiêu package cho lần cập nhật này. Với cài đặt package, `main` ánh xạ tới `github:openclaw/openclaw#main`.
- `--dry-run`: xem trước các hành động cập nhật dự kiến (channel/tag/target/restart flow) mà không ghi config, cài đặt, đồng bộ plugin, hay khởi động lại.
- `--json`: in JSON `UpdateRunResult` có thể đọc bằng máy.
- `--timeout <seconds>`: timeout cho mỗi bước (mặc định là 1200s).

Lưu ý: hạ cấp yêu cầu xác nhận vì phiên bản cũ hơn có thể phá vỡ cấu hình.

## `update status`

Hiển thị kênh cập nhật đang hoạt động + git tag/branch/SHA (cho source checkouts), cùng với khả năng cập nhật.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Tùy chọn:

- `--json`: in JSON trạng thái có thể đọc bằng máy.
- `--timeout <seconds>`: timeout cho kiểm tra (mặc định là 3s).

## `update wizard`

Luồng tương tác để chọn kênh cập nhật và xác nhận có khởi động lại Gateway sau khi cập nhật hay không (mặc định là khởi động lại). Nếu chọn `dev` mà không có git checkout, sẽ đề nghị tạo một cái.

## Hoạt động

Khi chuyển kênh rõ ràng (`--channel ...`), OpenClaw cũng giữ phương pháp cài đặt đồng bộ:

- `dev` → đảm bảo có git checkout (mặc định: `~/openclaw`, ghi đè với `OPENCLAW_GIT_DIR`), cập nhật nó, và cài đặt CLI global từ checkout đó.
- `stable`/`beta` → cài đặt từ npm sử dụng dist-tag tương ứng.

Core auto-updater của Gateway (khi bật qua config) tái sử dụng cùng đường dẫn cập nhật này.

## Luồng git checkout

Kênh:

- `stable`: checkout tag không phải beta mới nhất, sau đó build + doctor.
- `beta`: checkout tag `-beta` mới nhất, sau đó build + doctor.
- `dev`: checkout `main`, sau đó fetch + rebase.

Tổng quan:

1. Yêu cầu worktree sạch (không có thay đổi chưa commit).
2. Chuyển sang kênh đã chọn (tag hoặc branch).
3. Fetch upstream (chỉ dev).
4. Chỉ dev: kiểm tra lint + build TypeScript trong worktree tạm; nếu tip fail, đi ngược lại tối đa 10 commit để tìm build sạch mới nhất.
5. Rebase lên commit đã chọn (chỉ dev).
6. Cài đặt deps (ưu tiên pnpm; npm fallback).
7. Build + build Control UI.
8. Chạy `openclaw doctor` như kiểm tra “cập nhật an toàn” cuối cùng.
9. Đồng bộ plugin với kênh hoạt động (dev dùng bundled extensions; stable/beta dùng npm) và cập nhật plugin cài đặt qua npm.

## `--update` shorthand

`openclaw --update` viết lại thành `openclaw update` (hữu ích cho shell và script launcher).

## Xem thêm

- `openclaw doctor` (đề nghị chạy cập nhật trước trên git checkouts)
- [Development channels](/install/development-channels)
- [Updating](/install/updating)
- [CLI reference](/cli)\n