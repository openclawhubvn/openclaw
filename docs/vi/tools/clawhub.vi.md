---
summary: "Hướng dẫn ClawHub: registry kỹ năng công khai + quy trình CLI"
read_when:
  - Giới thiệu ClawHub cho người dùng mới
  - Cài đặt, tìm kiếm, hoặc xuất bản kỹ năng
  - Giải thích cờ CLI và hành vi đồng bộ của ClawHub
title: "ClawHub"
---

# ClawHub

ClawHub là **registry kỹ năng công khai cho OpenClaw**. Đây là dịch vụ miễn phí: tất cả kỹ năng đều công khai, mở và ai cũng có thể chia sẻ, tái sử dụng. Một kỹ năng chỉ là một thư mục với file `SKILL.md` (cùng các file hỗ trợ khác). Có thể duyệt kỹ năng qua web app hoặc dùng CLI để tìm kiếm, cài đặt, cập nhật và xuất bản kỹ năng.

Trang web: [clawhub.ai](https://clawhub.ai)

## ClawHub là gì

- Registry công khai cho kỹ năng OpenClaw.
- Kho lưu trữ phiên bản của gói kỹ năng và metadata.
- Nền tảng khám phá qua tìm kiếm, tag và tín hiệu sử dụng.

## Cách hoạt động

1. Người dùng xuất bản một gói kỹ năng (file + metadata).
2. ClawHub lưu trữ gói, phân tích metadata và gán phiên bản.
3. Registry lập chỉ mục kỹ năng để tìm kiếm và khám phá.
4. Người dùng duyệt, tải xuống và cài đặt kỹ năng trong OpenClaw.

## Bạn có thể làm gì

- Xuất bản kỹ năng mới và phiên bản mới của kỹ năng hiện có.
- Khám phá kỹ năng theo tên, tag hoặc tìm kiếm.
- Tải xuống gói kỹ năng và kiểm tra file của chúng.
- Báo cáo kỹ năng lạm dụng hoặc không an toàn.
- Nếu là moderator, có thể ẩn, hiện, xóa hoặc cấm.

## Dành cho ai (thân thiện với người mới)

Nếu muốn thêm khả năng mới cho agent OpenClaw, ClawHub là cách dễ nhất để tìm và cài đặt kỹ năng. Không cần biết cách backend hoạt động. Có thể:

- Tìm kiếm kỹ năng bằng ngôn ngữ tự nhiên.
- Cài đặt kỹ năng vào workspace.
- Cập nhật kỹ năng sau này chỉ với một lệnh.
- Sao lưu kỹ năng của mình bằng cách xuất bản chúng.

## Bắt đầu nhanh (không cần kỹ thuật)

1. Cài đặt CLI (xem phần tiếp theo).
2. Tìm kiếm thứ cần:
   - `clawhub search "calendar"`
3. Cài đặt kỹ năng:
   - `clawhub install <skill-slug>`
4. Bắt đầu phiên OpenClaw mới để nhận kỹ năng mới.

## Cài đặt CLI

Chọn một:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Cách tích hợp vào OpenClaw

Mặc định, CLI cài đặt kỹ năng vào `./skills` trong thư mục làm việc hiện tại. Nếu đã cấu hình workspace OpenClaw, `clawhub` sẽ dùng workspace đó trừ khi ghi đè `--workdir` (hoặc `CLAWHUB_WORKDIR`). OpenClaw tải kỹ năng từ `<workspace>/skills` và sẽ nhận chúng trong phiên **tiếp theo**. Nếu đã dùng `~/.openclaw/skills` hoặc kỹ năng gói, kỹ năng workspace sẽ ưu tiên.

Để biết thêm chi tiết về cách tải, chia sẻ và kiểm soát kỹ năng, xem [Skills](/tools/skills).

## Tổng quan hệ thống kỹ năng

Một kỹ năng là gói file có phiên bản giúp OpenClaw thực hiện một nhiệm vụ cụ thể. Mỗi lần xuất bản tạo phiên bản mới, registry giữ lịch sử phiên bản để người dùng kiểm tra thay đổi.

Một kỹ năng điển hình bao gồm:

- File `SKILL.md` với mô tả và cách sử dụng chính.
- Cấu hình, script hoặc file hỗ trợ tùy chọn dùng bởi kỹ năng.
- Metadata như tag, tóm tắt và yêu cầu cài đặt.

ClawHub dùng metadata để hỗ trợ khám phá và an toàn phơi bày khả năng kỹ năng. Registry cũng theo dõi tín hiệu sử dụng (như sao và lượt tải) để cải thiện xếp hạng và hiển thị.

## Dịch vụ cung cấp (tính năng)

- **Duyệt công khai** nội dung kỹ năng và `SKILL.md`.
- **Tìm kiếm** dựa trên embeddings (tìm kiếm vector), không chỉ từ khóa.
- **Phiên bản** với semver, changelog và tag (bao gồm `latest`).
- **Tải xuống** dưới dạng zip mỗi phiên bản.
- **Sao và bình luận** cho phản hồi cộng đồng.
- **Moderation** hooks cho phê duyệt và kiểm tra.
- **API thân thiện CLI** cho tự động hóa và scripting.

## Bảo mật và moderation

ClawHub mở mặc định. Ai cũng có thể tải lên kỹ năng, nhưng tài khoản GitHub phải ít nhất một tuần tuổi để xuất bản. Điều này giúp giảm lạm dụng mà không chặn đóng góp hợp pháp.

Báo cáo và moderation:

- Người dùng đã đăng nhập có thể báo cáo kỹ năng.
- Lý do báo cáo là bắt buộc và được ghi lại.
- Mỗi người dùng có thể có tối đa 20 báo cáo hoạt động cùng lúc.
- Kỹ năng có hơn 3 báo cáo duy nhất sẽ tự động bị ẩn.
- Moderator có thể xem kỹ năng ẩn, hiện lại, xóa hoặc cấm người dùng.
- Lạm dụng tính năng báo cáo có thể dẫn đến cấm tài khoản.

Quan tâm trở thành moderator? Hỏi trong Discord OpenClaw và liên hệ moderator hoặc maintainer.

## Lệnh và tham số CLI

Tùy chọn toàn cầu (áp dụng cho tất cả lệnh):

- `--workdir <dir>`: Thư mục làm việc (mặc định: thư mục hiện tại; dùng workspace OpenClaw nếu không có).
- `--dir <dir>`: Thư mục kỹ năng, tương đối với workdir (mặc định: `skills`).
- `--site <url>`: URL cơ sở trang web (đăng nhập trình duyệt).
- `--registry <url>`: URL cơ sở API registry.
- `--no-input`: Tắt nhắc nhở (không tương tác).
- `-V, --cli-version`: In phiên bản CLI.

Auth:

- `clawhub login` (luồng trình duyệt) hoặc `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Tùy chọn:

- `--token <token>`: Dán token API.
- `--label <label>`: Nhãn lưu cho token đăng nhập trình duyệt (mặc định: `CLI token`).
- `--no-browser`: Không mở trình duyệt (cần `--token`).

Tìm kiếm:

- `clawhub search "query"`
- `--limit <n>`: Kết quả tối đa.

Cài đặt:

- `clawhub install <slug>`
- `--version <version>`: Cài đặt phiên bản cụ thể.
- `--force`: Ghi đè nếu thư mục đã tồn tại.

Cập nhật:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Cập nhật lên phiên bản cụ thể (chỉ một slug).
- `--force`: Ghi đè khi file local không khớp với phiên bản đã xuất bản.

Liệt kê:

- `clawhub list` (đọc `.clawhub/lock.json`)

Xuất bản:

- `clawhub publish <path>`
- `--slug <slug>`: Slug kỹ năng.
- `--name <name>`: Tên hiển thị.
- `--version <version>`: Phiên bản semver.
- `--changelog <text>`: Văn bản changelog (có thể để trống).
- `--tags <tags>`: Tag phân tách bằng dấu phẩy (mặc định: `latest`).

Xóa/khôi phục (chỉ chủ sở hữu/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Đồng bộ (quét kỹ năng local + xuất bản mới/cập nhật):

- `clawhub sync`
- `--root <dir...>`: Gốc quét bổ sung.
- `--all`: Tải lên tất cả mà không cần nhắc nhở.
- `--dry-run`: Hiển thị những gì sẽ được tải lên.
- `--bump <type>`: `patch|minor|major` cho cập nhật (mặc định: `patch`).
- `--changelog <text>`: Changelog cho cập nhật không tương tác.
- `--tags <tags>`: Tag phân tách bằng dấu phẩy (mặc định: `latest`).
- `--concurrency <n>`: Kiểm tra registry (mặc định: 4).

## Quy trình thường gặp cho agent

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

Với một thư mục kỹ năng:

```bash
clawhub publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Để quét và sao lưu nhiều kỹ năng cùng lúc:

```bash
clawhub sync --all
```

## Chi tiết nâng cao (kỹ thuật)

### Phiên bản và tag

- Mỗi lần xuất bản tạo một `SkillVersion` **semver** mới.
- Tag (như `latest`) trỏ đến một phiên bản; di chuyển tag cho phép quay lại.
- Changelog được đính kèm mỗi phiên bản và có thể để trống khi đồng bộ hoặc xuất bản cập nhật.

### Thay đổi local vs phiên bản registry

Cập nhật so sánh nội dung kỹ năng local với phiên bản registry bằng hash nội dung. Nếu file local không khớp với bất kỳ phiên bản đã xuất bản nào, CLI sẽ hỏi trước khi ghi đè (hoặc yêu cầu `--force` trong các lần chạy không tương tác).

### Quét đồng bộ và gốc dự phòng

`clawhub sync` quét workdir hiện tại trước. Nếu không tìm thấy kỹ năng, nó sẽ quay lại các vị trí cũ đã biết (ví dụ `~/openclaw/skills` và `~/.openclaw/skills`). Điều này được thiết kế để tìm các cài đặt kỹ năng cũ mà không cần cờ bổ sung.

### Lưu trữ và lockfile

- Kỹ năng đã cài đặt được ghi lại trong `.clawhub/lock.json` dưới workdir.
- Token auth được lưu trong file cấu hình ClawHub CLI (ghi đè qua `CLAWHUB_CONFIG_PATH`).

### Telemetry (đếm lượt cài đặt)

Khi chạy `clawhub sync` trong khi đã đăng nhập, CLI gửi một snapshot tối thiểu để tính toán lượt cài đặt. Có thể tắt hoàn toàn:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Biến môi trường

- `CLAWHUB_SITE`: Ghi đè URL trang web.
- `CLAWHUB_REGISTRY`: Ghi đè URL API registry.
- `CLAWHUB_CONFIG_PATH`: Ghi đè nơi CLI lưu token/cấu hình.
- `CLAWHUB_WORKDIR`: Ghi đè workdir mặc định.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Tắt telemetry khi `sync`.\n