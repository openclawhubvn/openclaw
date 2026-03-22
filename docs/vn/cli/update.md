---
summary: "Tham khảo CLI cho `openclaw update` (cập nhật nguồn an toàn + tự động khởi động lại gateway)"
read_when:
  - Bạn muốn cập nhật một nguồn checkout một cách an toàn
  - Bạn cần hiểu hành vi viết tắt của `--update`
title: "update"
---

# `openclaw update`

Cập nhật OpenClaw một cách an toàn và chuyển đổi giữa các kênh stable/beta/dev.

Nếu bạn cài đặt qua **npm/pnpm** (cài đặt toàn cầu, không có metadata git), cập nhật sẽ diễn ra qua quy trình của trình quản lý gói trong [Cập nhật](/install/updating).

## Cách sử dụng

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
- `--channel <stable|beta|dev>`: đặt kênh cập nhật (git + npm; lưu trong cấu hình).
- `--tag <dist-tag|version|spec>`: ghi đè mục tiêu gói cho lần cập nhật này. Đối với cài đặt gói, `main` ánh xạ tới `github:openclaw/openclaw#main`.
- `--dry-run`: xem trước các hành động cập nhật dự kiến (kênh/tag/mục tiêu/quy trình khởi động lại) mà không ghi cấu hình, cài đặt, đồng bộ plugin, hoặc khởi động lại.
- `--json`: in JSON `UpdateRunResult` có thể đọc bằng máy.
- `--timeout <seconds>`: thời gian chờ cho mỗi bước (mặc định là 1200 giây).

Lưu ý: việc hạ cấp yêu cầu xác nhận vì các phiên bản cũ hơn có thể phá vỡ cấu hình.

## `update status`

Hiển thị kênh cập nhật đang hoạt động + git tag/branch/SHA (cho các nguồn checkout), cùng với khả năng cập nhật.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Tùy chọn:

- `--json`: in JSON trạng thái có thể đọc bằng máy.
- `--timeout <seconds>`: thời gian chờ cho kiểm tra (mặc định là 3 giây).

## `update wizard`

Quy trình tương tác để chọn kênh cập nhật và xác nhận có khởi động lại Gateway sau khi cập nhật hay không (mặc định là khởi động lại). Nếu bạn chọn `dev` mà không có git checkout, nó sẽ đề nghị tạo một cái.

## Những gì nó làm

Khi bạn chuyển kênh rõ ràng (`--channel ...`), OpenClaw cũng giữ phương thức cài đặt phù hợp:

- `dev` → đảm bảo có một git checkout (mặc định: `~/openclaw`, ghi đè với `OPENCLAW_GIT_DIR`), cập nhật nó và cài đặt CLI toàn cầu từ checkout đó.
- `stable`/`beta` → cài đặt từ npm sử dụng dist-tag tương ứng.

Trình tự động cập nhật lõi Gateway (khi được kích hoạt qua cấu hình) tái sử dụng cùng đường dẫn cập nhật này.

## Quy trình git checkout

Các kênh:

- `stable`: checkout tag không phải beta mới nhất, sau đó build + kiểm tra.
- `beta`: checkout tag `-beta` mới nhất, sau đó build + kiểm tra.
- `dev`: checkout `main`, sau đó fetch + rebase.

Tổng quan:

1. Yêu cầu một worktree sạch (không có thay đổi chưa commit).
2. Chuyển sang kênh đã chọn (tag hoặc branch).
3. Fetch upstream (chỉ dev).
4. Chỉ dev: kiểm tra lint + build TypeScript trong worktree tạm; nếu tip thất bại, quay lại tối đa 10 commit để tìm build sạch mới nhất.
5. Rebase lên commit đã chọn (chỉ dev).
6. Cài đặt phụ thuộc (ưu tiên pnpm; npm là phương án dự phòng).
7. Build + build Control UI.
8. Chạy `openclaw doctor` như kiểm tra “cập nhật an toàn” cuối cùng.
9. Đồng bộ plugin với kênh hoạt động (dev sử dụng extension đi kèm; stable/beta sử dụng npm) và cập nhật plugin đã cài đặt qua npm.

## Viết tắt `--update`

`openclaw --update` được viết lại thành `openclaw update` (hữu ích cho shell và script khởi chạy).

## Xem thêm

- `openclaw doctor` (đề nghị chạy cập nhật trước trên git checkouts)
- [Kênh phát triển](/install/development-channels)
- [Cập nhật](/install/updating)
- [Tham khảo CLI](/cli)
