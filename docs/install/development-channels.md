---
summary: "Khám phá cách chuyển đổi giữa các kênh ổn định, beta và dev. Tìm hiểu ý nghĩa, cách ghim và gắn thẻ hiệu quả."
read_when:
  - Bạn muốn chuyển đổi giữa ổn định/beta/dev
  - Bạn muốn ghim một phiên bản, thẻ hoặc SHA cụ thể
  - Bạn đang gắn thẻ hoặc phát hành bản thử nghiệm
title: "Hướng Dẫn Cấu Hình Kênh Phát Hành OpenClaw"
sidebarTitle: "Kênh Phát Hành"
---

# Kênh Phát Triển

OpenClaw cung cấp ba kênh cập nhật:

- **stable**: npm dist-tag `latest`. Khuyến nghị cho hầu hết người dùng.
- **beta**: npm dist-tag `beta` (các bản dựng đang thử nghiệm).
- **dev**: đầu di chuyển của `main` (git). npm dist-tag: `dev` (khi được phát hành).
  Nhánh `main` dành cho thử nghiệm và phát triển tích cực. Có thể chứa các tính năng chưa hoàn thiện hoặc thay đổi lớn. Không sử dụng cho các gateway sản xuất.

Chúng tôi phát hành các bản dựng tới **beta**, kiểm tra chúng, sau đó **thăng cấp một bản dựng đã được kiểm duyệt lên `latest`** mà không thay đổi số phiên bản — dist-tags là nguồn thông tin chính xác cho các cài đặt npm.

## Chuyển đổi kênh

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` lưu lại lựa chọn trong cấu hình (`update.channel`) và điều chỉnh phương thức cài đặt:

- **`stable`/`beta`** (cài đặt gói): cập nhật qua dist-tag npm tương ứng.
- **`stable`/`beta`** (cài đặt git): kiểm tra thẻ git mới nhất tương ứng.
- **`dev`**: đảm bảo kiểm tra git (mặc định `~/openclaw`, có thể thay đổi với `OPENCLAW_GIT_DIR`), chuyển sang `main`, cập nhật từ upstream, xây dựng và cài đặt CLI toàn cầu từ bản kiểm tra đó.

Mẹo: nếu muốn sử dụng song song stable + dev, hãy giữ hai bản sao và trỏ gateway của bạn vào bản stable.

## Nhắm mục tiêu phiên bản hoặc thẻ một lần

Sử dụng `--tag` để nhắm mục tiêu một dist-tag, phiên bản hoặc gói cụ thể cho một lần cập nhật **mà không** thay đổi kênh đã lưu:

```bash
# Cài đặt một phiên bản cụ thể
openclaw update --tag 2026.3.14

# Cài đặt từ dist-tag beta (một lần, không lưu lại)
openclaw update --tag beta

# Cài đặt từ nhánh chính GitHub (npm tarball)
openclaw update --tag main

# Cài đặt một gói npm cụ thể
openclaw update --tag openclaw@2026.3.12
```

Lưu ý:

- `--tag` chỉ áp dụng cho **cài đặt gói (npm)**. Cài đặt git bỏ qua nó.
- Thẻ không được lưu lại. Lần `openclaw update` tiếp theo sẽ sử dụng kênh đã cấu hình như thường lệ.
- Bảo vệ hạ cấp: nếu phiên bản mục tiêu cũ hơn phiên bản hiện tại, OpenClaw sẽ yêu cầu xác nhận (bỏ qua với `--yes`).

## Chạy thử

Xem trước những gì `openclaw update` sẽ làm mà không thực hiện thay đổi:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.3.14 --dry-run
openclaw update --dry-run --json
```

Chạy thử hiển thị kênh hiệu quả, phiên bản mục tiêu, hành động dự kiến và liệu có cần xác nhận hạ cấp hay không.

## Plugin và kênh

Khi chuyển đổi kênh với `openclaw update`, OpenClaw cũng đồng bộ nguồn plugin:

- `dev` ưu tiên các plugin đi kèm từ bản kiểm tra git.
- `stable` và `beta` khôi phục các gói plugin đã cài đặt qua npm.
- Các plugin cài đặt qua npm được cập nhật sau khi cập nhật lõi hoàn tất.

## Kiểm tra trạng thái hiện tại

```bash
openclaw update status
```

Hiển thị kênh đang hoạt động, loại cài đặt (git hoặc gói), phiên bản hiện tại và nguồn (cấu hình, thẻ git, nhánh git hoặc mặc định).

## Thực hành tốt nhất khi gắn thẻ

- Gắn thẻ các bản phát hành mà bạn muốn các bản kiểm tra git hạ cánh (`vYYYY.M.D` cho ổn định, `vYYYY.M.D-beta.N` cho beta).
- `vYYYY.M.D.beta.N` cũng được công nhận để tương thích, nhưng nên dùng `-beta.N`.
- Các thẻ `vYYYY.M.D-<patch>` cũ vẫn được công nhận là ổn định (không phải beta).
- Giữ thẻ không thay đổi: không di chuyển hoặc tái sử dụng thẻ.
- npm dist-tags vẫn là nguồn thông tin chính xác cho các cài đặt npm:
  - `latest` -> ổn định
  - `beta` -> bản dựng ứng viên
  - `dev` -> ảnh chụp nhanh chính (tùy chọn)

## Khả dụng của ứng dụng macOS

Các bản dựng beta và dev có thể **không** bao gồm phát hành ứng dụng macOS. Điều này là bình thường:

- Thẻ git và npm dist-tag vẫn có thể được phát hành.
- Ghi chú "không có bản dựng macOS cho beta này" trong ghi chú phát hành hoặc changelog.
