---
summary: "Hướng dẫn ClawHub: đăng ký kỹ năng công khai + quy trình CLI"
read_when:
  - Giới thiệu ClawHub cho người dùng mới
  - Cài đặt, tìm kiếm hoặc xuất bản kỹ năng
  - Giải thích các cờ CLI và hành vi đồng bộ của ClawHub
title: "ClawHub"
---

# ClawHub

ClawHub là **đăng ký kỹ năng công khai cho OpenClaw**. Đây là dịch vụ miễn phí: tất cả các kỹ năng đều công khai, mở và có thể chia sẻ, tái sử dụng. Một kỹ năng chỉ là một thư mục với file `SKILL.md` (cùng các file văn bản hỗ trợ). Bạn có thể duyệt kỹ năng trên ứng dụng web hoặc sử dụng CLI để tìm kiếm, cài đặt, cập nhật và xuất bản kỹ năng.

Trang web: [clawhub.ai](https://clawhub.ai)

## ClawHub là gì

- Đăng ký công khai cho các kỹ năng của OpenClaw.
- Kho lưu trữ phiên bản của các gói kỹ năng và metadata.
- Nền tảng khám phá cho tìm kiếm, thẻ và tín hiệu sử dụng.

## Cách hoạt động

1. Người dùng xuất bản một gói kỹ năng (file + metadata).
2. ClawHub lưu trữ gói, phân tích metadata và gán phiên bản.
3. Đăng ký lập chỉ mục kỹ năng để tìm kiếm và khám phá.
4. Người dùng duyệt, tải xuống và cài đặt kỹ năng trong OpenClaw.

## Bạn có thể làm gì

- Xuất bản kỹ năng mới và phiên bản mới của kỹ năng hiện có.
- Khám phá kỹ năng theo tên, thẻ hoặc tìm kiếm.
- Tải xuống gói kỹ năng và kiểm tra các file của chúng.
- Báo cáo kỹ năng có nội dung lạm dụng hoặc không an toàn.
- Nếu bạn là người điều hành, có thể ẩn, hiện, xóa hoặc cấm.

## Dành cho ai (thân thiện với người mới bắt đầu)

Nếu muốn thêm khả năng mới cho agent OpenClaw, ClawHub là cách dễ nhất để tìm và cài đặt kỹ năng. Không cần biết cách hoạt động của backend. Bạn có thể:

- Tìm kiếm kỹ năng bằng ngôn ngữ đơn giản.
- Cài đặt kỹ năng vào workspace.
- Cập nhật kỹ năng sau này chỉ với một lệnh.
- Sao lưu kỹ năng của mình bằng cách xuất bản chúng.

## Bắt đầu nhanh (không cần kỹ thuật)

1. Cài đặt CLI (xem phần tiếp theo).
2. Tìm kiếm thứ bạn cần:
   - `clawhub search "calendar"`
3. Cài đặt một kỹ năng:
   - `clawhub install <skill-slug>`
4. Bắt đầu một phiên OpenClaw mới để nhận kỹ năng mới.

## Cài đặt CLI

Chọn một trong các cách sau:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Cách tích hợp vào OpenClaw

Theo mặc định, CLI cài đặt kỹ năng vào `./skills` trong thư mục làm việc hiện tại. Nếu một workspace OpenClaw được cấu hình, `clawhub` sẽ sử dụng workspace đó trừ khi bạn ghi đè bằng `--workdir` (hoặc `CLAWHUB_WORKDIR`). OpenClaw tải kỹ năng từ `<workspace>/skills` và sẽ nhận chúng trong phiên **tiếp theo**. Nếu bạn đã sử dụng `~/.openclaw/skills` hoặc kỹ năng gói, kỹ năng workspace sẽ được ưu tiên.

Để biết thêm chi tiết về cách kỹ năng được tải, chia sẻ và kiểm soát, xem [Skills](/tools/skills).

## Tổng quan về hệ thống kỹ năng

Một kỹ năng là một gói file có phiên bản giúp OpenClaw thực hiện một nhiệm vụ cụ thể. Mỗi lần xuất bản tạo ra một phiên bản mới, và đăng ký giữ lịch sử các phiên bản để người dùng có thể kiểm tra thay đổi.

Một kỹ năng điển hình bao gồm:

- File `SKILL.md` với mô tả chính và cách sử dụng.
- Các cấu hình, script hoặc file hỗ trợ tùy chọn được sử dụng bởi kỹ năng.
- Metadata như thẻ, tóm tắt và yêu cầu cài đặt.

ClawHub sử dụng metadata để hỗ trợ khám phá và an toàn khi hiển thị khả năng của kỹ năng. Đăng ký cũng theo dõi tín hiệu sử dụng (như sao và lượt tải xuống) để cải thiện xếp hạng và khả năng hiển thị.

## Dịch vụ cung cấp (tính năng)

- **Duyệt công khai** các kỹ năng và nội dung `SKILL.md`.
- **Tìm kiếm** được hỗ trợ bởi embeddings (tìm kiếm vector), không chỉ từ khóa.
- **Phiên bản** với semver, changelogs và thẻ (bao gồm `latest`).
- **Tải xuống** dưới dạng zip cho mỗi phiên bản.
- **Sao và bình luận** để phản hồi từ cộng đồng.
- **Công cụ điều hành** cho phê duyệt và kiểm tra.
- **API thân thiện với CLI** cho tự động hóa và scripting.

## Bảo mật và điều hành

ClawHub mở mặc định. Bất kỳ ai cũng có thể tải lên kỹ năng, nhưng tài khoản GitHub phải ít nhất một tuần tuổi để xuất bản. Điều này giúp giảm thiểu lạm dụng mà không chặn những người đóng góp hợp pháp.

Báo cáo và điều hành:

- Bất kỳ người dùng đã đăng nhập nào cũng có thể báo cáo một kỹ năng.
- Lý do báo cáo là bắt buộc và được ghi lại.
- Mỗi người dùng có thể có tối đa 20 báo cáo hoạt động cùng lúc.
- Kỹ năng có hơn 3 báo cáo duy nhất sẽ tự động bị ẩn theo mặc định.
- Người điều hành có thể xem kỹ năng bị ẩn, hiện chúng, xóa hoặc cấm người dùng.
- Lạm dụng tính năng báo cáo có thể dẫn đến cấm tài khoản.

Quan tâm đến việc trở thành người điều hành? Hãy hỏi trong Discord của OpenClaw và liên hệ với người điều hành hoặc người bảo trì.

## Lệnh và tham số CLI

Tùy chọn toàn cầu (áp dụng cho tất cả các lệnh):

- `--workdir <dir>`: Thư mục làm việc (mặc định: thư mục hiện tại; sử dụng workspace OpenClaw nếu có).
- `--dir <dir>`: Thư mục kỹ năng, tương đối với workdir (mặc định: `skills`).
- `--site <url>`: URL cơ sở của trang web (đăng nhập trình duyệt).
- `--registry <url>`: URL cơ sở của API đăng ký.
- `--no-input`: Tắt nhắc nhở (không tương tác).
- `-V, --cli-version`: In phiên bản CLI.

Xác thực:

- `clawhub login` (dòng trình duyệt) hoặc `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Tùy chọn:

- `--token <token>`: Dán một token API.
- `--label <label>`: Nhãn lưu trữ cho token đăng nhập trình duyệt (mặc định: `CLI token`).
- `--no-browser`: Không mở trình duyệt (yêu cầu `--token`).

Tìm kiếm:

- `clawhub search "query"`
- `--limit <n>`: Kết quả tối đa.

Cài đặt:

- `clawhub install <slug>`
- `--version <version>`: Cài đặt một phiên bản cụ thể.
- `--force`: Ghi đè nếu thư mục đã tồn tại.

Cập nhật:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Cập nhật lên một phiên bản cụ thể (chỉ một slug).
- `--force`: Ghi đè khi file cục bộ không khớp với bất kỳ phiên bản nào đã xuất bản.

Danh sách:

- `clawhub list` (đọc `.clawhub/lock.json`)

Xuất bản:

- `clawhub publish <path>`
- `--slug <slug>`: Slug kỹ năng.
- `--name <name>`: Tên hiển thị.
- `--version <version>`: Phiên bản semver.
- `--changelog <text>`: Văn bản changelog (có thể để trống).
- `--tags <tags>`: Thẻ phân tách bằng dấu phẩy (mặc định: `latest`).

Xóa/khôi phục (chỉ chủ sở hữu/quản trị viên):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Đồng bộ (quét kỹ năng cục bộ + xuất bản mới/cập nhật):

- `clawhub sync`
- `--root <dir...>`: Gốc quét bổ sung.
- `--all`: Tải lên tất cả mà không cần nhắc nhở.
- `--dry-run`: Hiển thị những gì sẽ được tải lên.
- `--bump <type>`: `patch|minor|major` cho cập nhật (mặc định: `patch`).
- `--changelog <text>`: Changelog cho cập nhật không tương tác.
- `--tags <tags>`: Thẻ phân tách bằng dấu phẩy (mặc định: `latest`).
- `--concurrency <n>`: Kiểm tra đăng ký (mặc định: 4).

## Quy trình làm việc phổ biến cho agent

### Tìm kiếm kỹ năng

```bash
clawhub search "postgres backups"
```

### Tải xuống kỹ năng mới

```bash
clawhub install my-skill-pack
```

### Cập nhật kỹ năng đã cài đặt

```bash
clawhub update --all
```

### Sao lưu kỹ năng của bạn (xuất bản hoặc đồng bộ)

Đối với một thư mục kỹ năng đơn lẻ:

```bash
clawhub publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Để quét và sao lưu nhiều kỹ năng cùng lúc:

```bash
clawhub sync --all
```

## Chi tiết nâng cao (kỹ thuật)

### Phiên bản và thẻ

- Mỗi lần xuất bản tạo ra một **semver** `SkillVersion`.
- Thẻ (như `latest`) trỏ đến một phiên bản; di chuyển thẻ cho phép bạn quay lại.
- Changelogs được đính kèm cho mỗi phiên bản và có thể để trống khi đồng bộ hoặc xuất bản cập nhật.

### Thay đổi cục bộ so với phiên bản đăng ký

Cập nhật so sánh nội dung kỹ năng cục bộ với phiên bản đăng ký bằng cách sử dụng hash nội dung. Nếu file cục bộ không khớp với bất kỳ phiên bản nào đã xuất bản, CLI sẽ hỏi trước khi ghi đè (hoặc yêu cầu `--force` trong các lần chạy không tương tác).

### Quét đồng bộ và gốc dự phòng

`clawhub sync` quét thư mục làm việc hiện tại của bạn trước. Nếu không tìm thấy kỹ năng nào, nó sẽ quay lại các vị trí cũ đã biết (ví dụ `~/openclaw/skills` và `~/.openclaw/skills`). Điều này được thiết kế để tìm các cài đặt kỹ năng cũ mà không cần cờ bổ sung.

### Lưu trữ và file khóa

- Kỹ năng đã cài đặt được ghi lại trong `.clawhub/lock.json` dưới thư mục làm việc của bạn.
- Token xác thực được lưu trữ trong file cấu hình ClawHub CLI (ghi đè qua `CLAWHUB_CONFIG_PATH`).

### Telemetry (đếm lượt cài đặt)

Khi bạn chạy `clawhub sync` trong khi đã đăng nhập, CLI gửi một snapshot tối thiểu để tính toán lượt cài đặt. Bạn có thể tắt hoàn toàn tính năng này:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Biến môi trường

- `CLAWHUB_SITE`: Ghi đè URL trang web.
- `CLAWHUB_REGISTRY`: Ghi đè URL API đăng ký.
- `CLAWHUB_CONFIG_PATH`: Ghi đè nơi CLI lưu trữ token/cấu hình.
- `CLAWHUB_WORKDIR`: Ghi đè thư mục làm việc mặc định.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Tắt telemetry khi `sync`.
