---
summary: "Tìm hiểu cách sử dụng lệnh CLI để tạo bản sao lưu cục bộ với OpenClaw. Đảm bảo dữ liệu của bạn luôn an toàn."
read_when:
  - Bạn muốn tạo bản sao lưu chất lượng cao cho trạng thái OpenClaw cục bộ
  - Bạn muốn xem trước các đường dẫn sẽ được bao gồm trước khi reset hoặc gỡ cài đặt
title: "Hướng Dẫn Sử Dụng OpenClaw Backup CLI"
---

# `openclaw backup`

Tạo một bản sao lưu cục bộ cho trạng thái, cấu hình, thông tin xác thực, phiên làm việc của OpenClaw và tùy chọn cho các workspace.

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

- Bản sao lưu bao gồm một file `manifest.json` với các đường dẫn nguồn đã được giải quyết và cấu trúc của bản sao lưu.
- Mặc định, đầu ra là một file `.tar.gz` có dấu thời gian trong thư mục làm việc hiện tại.
- Nếu thư mục làm việc hiện tại nằm trong cây nguồn đã sao lưu, OpenClaw sẽ chuyển sang thư mục home của bạn làm vị trí lưu trữ mặc định.
- Các file sao lưu hiện có không bao giờ bị ghi đè.
- Các đường dẫn đầu ra bên trong cây trạng thái/ workspace nguồn bị từ chối để tránh tự bao gồm.
- `openclaw backup verify <archive>` xác thực rằng bản sao lưu chứa chính xác một manifest gốc, từ chối các đường dẫn kiểu traversal và kiểm tra rằng mọi payload được khai báo trong manifest đều tồn tại trong tarball.
- `openclaw backup create --verify` thực hiện xác thực ngay sau khi ghi bản sao lưu.
- `openclaw backup create --only-config` chỉ sao lưu file cấu hình JSON đang hoạt động.

## Những gì được sao lưu

`openclaw backup create` lập kế hoạch sao lưu từ cài đặt OpenClaw cục bộ của bạn:

- Thư mục trạng thái được trả về bởi trình giải quyết trạng thái cục bộ của OpenClaw, thường là `~/.openclaw`
- Đường dẫn file cấu hình đang hoạt động
- Thư mục OAuth / thông tin xác thực
- Các thư mục workspace được phát hiện từ cấu hình hiện tại, trừ khi bạn sử dụng `--no-include-workspace`

Nếu bạn sử dụng `--only-config`, OpenClaw sẽ bỏ qua trạng thái, thông tin xác thực và phát hiện workspace, chỉ lưu trữ đường dẫn file cấu hình đang hoạt động.

OpenClaw chuẩn hóa các đường dẫn trước khi tạo bản sao lưu. Nếu cấu hình, thông tin xác thực hoặc workspace đã nằm trong thư mục trạng thái, chúng sẽ không bị sao chép như các nguồn sao lưu cấp cao riêng biệt. Các đường dẫn thiếu sẽ bị bỏ qua.

Payload của bản sao lưu lưu trữ nội dung file từ các cây nguồn đó, và file `manifest.json` nhúng ghi lại các đường dẫn nguồn tuyệt đối đã được giải quyết cùng với cấu trúc bản sao lưu được sử dụng cho từng tài sản.

## Hành vi khi cấu hình không hợp lệ

`openclaw backup` cố ý bỏ qua kiểm tra cấu hình thông thường để vẫn có thể hỗ trợ trong quá trình khôi phục. Vì phát hiện workspace phụ thuộc vào cấu hình hợp lệ, `openclaw backup create` sẽ thất bại nhanh chóng khi file cấu hình tồn tại nhưng không hợp lệ và sao lưu workspace vẫn được bật.

Nếu bạn vẫn muốn sao lưu một phần trong tình huống đó, hãy chạy lại:

```bash
openclaw backup create --no-include-workspace
```

Điều này giữ trạng thái, cấu hình và thông tin xác thực trong phạm vi trong khi bỏ qua hoàn toàn việc phát hiện workspace.

Nếu bạn chỉ cần một bản sao của file cấu hình, `--only-config` cũng hoạt động khi cấu hình bị lỗi vì nó không phụ thuộc vào việc phân tích cấu hình để phát hiện workspace.

## Kích thước và hiệu suất

OpenClaw không áp đặt giới hạn kích thước sao lưu tối đa hoặc giới hạn kích thước file.

Giới hạn thực tế đến từ máy tính cục bộ và hệ thống file đích:

- Không gian có sẵn cho việc ghi tạm thời bản sao lưu và bản sao lưu cuối cùng
- Thời gian để duyệt qua các cây workspace lớn và nén chúng thành `.tar.gz`
- Thời gian để quét lại bản sao lưu nếu bạn sử dụng `openclaw backup create --verify` hoặc chạy `openclaw backup verify`
- Hành vi của hệ thống file tại đường dẫn đích. OpenClaw ưu tiên bước xuất bản hard-link không ghi đè và chuyển sang sao chép độc quyền khi hard link không được hỗ trợ

Các workspace lớn thường là nguyên nhân chính làm tăng kích thước bản sao lưu. Nếu bạn muốn sao lưu nhỏ hơn hoặc nhanh hơn, hãy sử dụng `--no-include-workspace`.

Để có bản sao lưu nhỏ nhất, hãy sử dụng `--only-config`.
