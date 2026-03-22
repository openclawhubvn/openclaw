---
summary: "Tham khảo CLI cho `openclaw backup` (tạo bản sao lưu cục bộ)"
read_when:
  - Cần bản sao lưu chất lượng cho trạng thái OpenClaw cục bộ
  - Muốn xem trước các đường dẫn sẽ được sao lưu trước khi reset hoặc gỡ cài đặt
title: "backup"
---

# `openclaw backup`

Tạo bản sao lưu cục bộ cho trạng thái, cấu hình, thông tin xác thực, session của OpenClaw và tùy chọn cho workspace.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Ghi chú

- Bản sao lưu bao gồm file `manifest.json` với các đường dẫn nguồn đã được giải quyết và bố cục của archive.
- Mặc định, output là file `.tar.gz` có timestamp trong thư mục làm việc hiện tại.
- Nếu thư mục làm việc hiện tại nằm trong cây nguồn được sao lưu, OpenClaw sẽ chuyển sang thư mục home để lưu archive mặc định.
- Không bao giờ ghi đè file archive đã tồn tại.
- Các đường dẫn output bên trong cây trạng thái/workspace nguồn bị từ chối để tránh tự bao gồm.
- `openclaw backup verify <archive>` kiểm tra archive có đúng một manifest gốc, từ chối các đường dẫn archive kiểu traversal, và kiểm tra mọi payload được khai báo trong manifest có tồn tại trong tarball.
- `openclaw backup create --verify` chạy kiểm tra này ngay sau khi ghi archive.
- `openclaw backup create --only-config` chỉ sao lưu file cấu hình JSON đang hoạt động.

## Những gì được sao lưu

`openclaw backup create` lên kế hoạch sao lưu từ cài đặt OpenClaw cục bộ:

- Thư mục trạng thái trả về bởi trình giải quyết trạng thái cục bộ của OpenClaw, thường là `~/.openclaw`
- Đường dẫn file cấu hình đang hoạt động
- Thư mục OAuth/thông tin xác thực
- Các thư mục workspace được phát hiện từ cấu hình hiện tại, trừ khi dùng `--no-include-workspace`

Nếu dùng `--only-config`, OpenClaw bỏ qua trạng thái, thông tin xác thực và phát hiện workspace, chỉ lưu trữ đường dẫn file cấu hình đang hoạt động.

OpenClaw chuẩn hóa đường dẫn trước khi tạo archive. Nếu cấu hình, thông tin xác thực hoặc workspace đã nằm trong thư mục trạng thái, chúng không bị nhân đôi thành nguồn sao lưu cấp cao riêng biệt. Các đường dẫn thiếu sẽ bị bỏ qua.

Payload của archive lưu trữ nội dung file từ các cây nguồn đó, và `manifest.json` nhúng ghi lại các đường dẫn nguồn tuyệt đối đã được giải quyết cùng bố cục archive dùng cho từng tài sản.

## Hành vi khi cấu hình không hợp lệ

`openclaw backup` cố tình bỏ qua kiểm tra cấu hình thông thường để vẫn có thể hỗ trợ trong quá trình khôi phục. Vì phát hiện workspace phụ thuộc vào cấu hình hợp lệ, `openclaw backup create` sẽ thất bại nhanh khi file cấu hình tồn tại nhưng không hợp lệ và sao lưu workspace vẫn được bật.

Nếu vẫn muốn sao lưu một phần trong tình huống đó, chạy lại:

```bash
openclaw backup create --no-include-workspace
```

Cách này giữ trạng thái, cấu hình và thông tin xác thực trong phạm vi, bỏ qua hoàn toàn phát hiện workspace.

Nếu chỉ cần bản sao của file cấu hình, `--only-config` cũng hoạt động khi cấu hình bị lỗi vì không phụ thuộc vào việc phân tích cấu hình để phát hiện workspace.

## Kích thước và hiệu suất

OpenClaw không áp đặt giới hạn kích thước sao lưu tối đa hoặc giới hạn kích thước file.

Giới hạn thực tế đến từ máy cục bộ và hệ thống file đích:

- Dung lượng trống cho việc ghi tạm thời archive và archive cuối cùng
- Thời gian để duyệt cây workspace lớn và nén chúng thành `.tar.gz`
- Thời gian để quét lại archive nếu dùng `openclaw backup create --verify` hoặc chạy `openclaw backup verify`
- Hành vi hệ thống file tại đường dẫn đích. OpenClaw ưu tiên bước publish hard-link không ghi đè và chuyển sang copy độc quyền khi hard link không được hỗ trợ

Workspace lớn thường là nguyên nhân chính làm tăng kích thước archive. Nếu muốn sao lưu nhỏ hơn hoặc nhanh hơn, dùng `--no-include-workspace`.

Để có archive nhỏ nhất, dùng `--only-config`.\n