# Kênh phát triển

OpenClaw có ba kênh cập nhật:

- **stable**: npm dist-tag `latest`. Khuyến nghị cho hầu hết người dùng.
- **beta**: npm dist-tag `beta` (bản build đang thử nghiệm).
- **dev**: đầu di chuyển của `main` (git). npm dist-tag: `dev` (khi được phát hành).
  Nhánh `main` dành cho thử nghiệm và phát triển tích cực. Có thể chứa tính năng chưa hoàn thiện hoặc thay đổi phá vỡ. Không dùng cho production gateways.

Chúng tôi phát hành bản build lên **beta**, kiểm tra, sau đó **đẩy bản build đã kiểm tra lên `latest`** mà không thay đổi số phiên bản -- dist-tags là nguồn chính xác cho cài đặt npm.

## Chuyển đổi kênh

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` lưu lựa chọn vào config (`update.channel`) và điều chỉnh phương pháp cài đặt:

- **`stable`/`beta`** (cài đặt package): cập nhật qua npm dist-tag tương ứng.
- **`stable`/`beta`** (cài đặt git): checkout git tag mới nhất tương ứng.
- **`dev`**: đảm bảo git checkout (mặc định `~/openclaw`, thay đổi với
  `OPENCLAW_GIT_DIR`), chuyển sang `main`, rebase từ upstream, build và cài đặt CLI toàn cục từ checkout đó.

Mẹo: nếu muốn chạy song song stable + dev, giữ hai bản clone và trỏ gateway vào bản stable.

## Nhắm mục tiêu phiên bản hoặc tag cụ thể

Dùng `--tag` để nhắm mục tiêu dist-tag, phiên bản, hoặc package spec cụ thể cho một lần cập nhật **mà không** thay đổi kênh đã lưu:

```bash
# Cài đặt phiên bản cụ thể
openclaw update --tag 2026.3.14

# Cài đặt từ beta dist-tag (một lần, không lưu)
openclaw update --tag beta

# Cài đặt từ nhánh chính GitHub (npm tarball)
openclaw update --tag main

# Cài đặt package spec npm cụ thể
openclaw update --tag openclaw@2026.3.12
```

Lưu ý:

- `--tag` chỉ áp dụng cho **cài đặt package (npm)**. Cài đặt git bỏ qua.
- Tag không được lưu. Lần `openclaw update` tiếp theo dùng kênh đã cấu hình.
- Bảo vệ hạ cấp: nếu phiên bản mục tiêu cũ hơn phiên bản hiện tại, OpenClaw yêu cầu xác nhận (bỏ qua với `--yes`).

## Chạy thử

Xem trước `openclaw update` sẽ làm gì mà không thay đổi:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.3.14 --dry-run
openclaw update --dry-run --json
```

Chạy thử hiển thị kênh hiệu lực, phiên bản mục tiêu, hành động dự kiến và có cần xác nhận hạ cấp không.

## Plugin và kênh

Khi chuyển kênh với `openclaw update`, OpenClaw cũng đồng bộ nguồn plugin:

- `dev` ưu tiên plugin đi kèm từ git checkout.
- `stable` và `beta` khôi phục package plugin cài đặt qua npm.
- Plugin cài đặt qua npm được cập nhật sau khi cập nhật core hoàn tất.

## Kiểm tra trạng thái hiện tại

```bash
openclaw update status
```

Hiển thị kênh đang hoạt động, kiểu cài đặt (git hoặc package), phiên bản hiện tại và nguồn (config, git tag, git branch, hoặc mặc định).

## Thực hành tốt nhất khi gắn tag

- Gắn tag các bản phát hành bạn muốn git checkouts hạ cánh (`vYYYY.M.D` cho stable, `vYYYY.M.D-beta.N` cho beta).
- `vYYYY.M.D.beta.N` cũng được công nhận để tương thích, nhưng ưu tiên `-beta.N`.
- Tag cũ `vYYYY.M.D-<patch>` vẫn được công nhận là stable (không phải beta).
- Giữ tag bất biến: không di chuyển hoặc tái sử dụng tag.
- npm dist-tags vẫn là nguồn chính xác cho cài đặt npm:
  - `latest` -> stable
  - `beta` -> bản build ứng viên
  - `dev` -> snapshot main (tùy chọn)

## Khả dụng ứng dụng macOS

Bản build beta và dev có thể **không** bao gồm phát hành ứng dụng macOS. Không sao:

- Git tag và npm dist-tag vẫn có thể được phát hành.
- Ghi chú "không có bản build macOS cho beta này" trong ghi chú phát hành hoặc changelog.\n