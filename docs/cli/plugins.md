---
summary: "Khám phá cách liệt kê, cài đặt, quản lý và kiểm tra plugins trên OpenClaw qua CLI. Tối ưu hóa trải nghiệm của bạn dễ dàng."
read_when:
  - Bạn muốn cài đặt hoặc quản lý các plugin Gateway hoặc các gói tương thích
  - Bạn muốn gỡ lỗi khi plugin không tải được
title: "Hướng Dẫn Sử Dụng OpenClaw Plugins CLI"
---

# `openclaw plugins`

Quản lý các plugin/extension Gateway và các gói tương thích.

Liên quan:

- Hệ thống Plugin: [Plugins](/tools/plugin)
- Tương thích gói: [Plugin bundles](/plugins/bundles)
- Manifest + schema của Plugin: [Plugin manifest](/plugins/manifest)
- Tăng cường bảo mật: [Security](/gateway/security)

## Lệnh

```bash
openclaw plugins list
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
```

Các plugin đi kèm với OpenClaw nhưng mặc định bị tắt. Sử dụng `plugins enable` để kích hoạt chúng.

Plugin gốc của OpenClaw phải có `openclaw.plugin.json` với một JSON Schema nội tuyến (`configSchema`, dù là rỗng). Các gói tương thích sử dụng manifest riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Danh sách chi tiết cũng hiển thị loại phụ của gói (`codex`, `claude`, hoặc `cursor`) cùng với các khả năng của gói được phát hiện.

### Cài đặt

```bash
openclaw plugins install <path-or-spec>
openclaw plugins install <npm-spec> --pin
openclaw plugins install <plugin>@<marketplace>
openclaw plugins install <plugin> --marketplace <marketplace>
```

Lưu ý bảo mật: xử lý việc cài đặt plugin như chạy mã. Ưu tiên các phiên bản đã được ghim.

Các thông số npm chỉ dành cho **registry** (tên gói + phiên bản **chính xác** tùy chọn hoặc **dist-tag**). Các thông số Git/URL/file và phạm vi semver bị từ chối. Việc cài đặt phụ thuộc chạy với `--ignore-scripts` để đảm bảo an toàn.

Các thông số trần và `@latest` giữ nguyên trên kênh ổn định. Nếu npm giải quyết một trong số đó thành một phiên bản thử nghiệm, OpenClaw sẽ dừng và yêu cầu bạn chọn tham gia rõ ràng với một thẻ thử nghiệm như `@beta`/`@rc` hoặc một phiên bản thử nghiệm chính xác như `@1.2.3-beta.4`.

Nếu một thông số cài đặt trần khớp với id plugin đi kèm (ví dụ `diffs`), OpenClaw sẽ cài đặt plugin đi kèm trực tiếp. Để cài đặt một gói npm có cùng tên, sử dụng thông số có phạm vi rõ ràng (ví dụ `@scope/diffs`).

Các định dạng lưu trữ được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Cài đặt từ marketplace Claude cũng được hỗ trợ.

Sử dụng cú pháp `plugin@marketplace` khi tên marketplace tồn tại trong bộ nhớ cache registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Sử dụng `--marketplace` khi bạn muốn chỉ định nguồn marketplace rõ ràng:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Các nguồn marketplace có thể là:

- tên marketplace đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`
- đường dẫn gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
- shorthand repo GitHub như `owner/repo`
- URL git

Đối với các đường dẫn và lưu trữ cục bộ, OpenClaw tự động phát hiện:

- plugin gốc của OpenClaw (`openclaw.plugin.json`)
- gói tương thích Codex (`.codex-plugin/plugin.json`)
- gói tương thích Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- gói tương thích Cursor (`.cursor-plugin/plugin.json`)

Các gói tương thích được cài đặt vào thư mục gốc extensions thông thường và tham gia vào cùng quy trình liệt kê/thông tin/bật/tắt. Hiện tại, các kỹ năng gói, kỹ năng lệnh Claude, mặc định `settings.json` của Claude, kỹ năng lệnh Cursor, và các thư mục hook Codex tương thích được hỗ trợ; các khả năng gói khác được phát hiện trong chẩn đoán/thông tin nhưng chưa được tích hợp vào thực thi runtime.

Sử dụng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Sử dụng `--pin` khi cài đặt npm để lưu thông số chính xác đã giải quyết (`name@version`) trong `plugins.installs` trong khi giữ hành vi mặc định không ghim.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa các bản ghi plugin khỏi `plugins.entries`, `plugins.installs`, danh sách cho phép plugin, và các mục `plugins.load.paths` được liên kết khi áp dụng. Đối với các plugin bộ nhớ đang hoạt động, khe bộ nhớ được đặt lại về `memory-core`.

Theo mặc định, gỡ cài đặt cũng xóa thư mục cài đặt plugin dưới thư mục trạng thái hoạt động của extensions (`$OPENCLAW_STATE_DIR/extensions/<id>`). Sử dụng `--keep-files` để giữ lại các tệp trên đĩa.

`--keep-config` được hỗ trợ như một alias đã lỗi thời cho `--keep-files`.

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
```

Cập nhật áp dụng cho các cài đặt được theo dõi trong `plugins.installs`, hiện tại là cài đặt npm và marketplace.

Khi bạn truyền một id plugin, OpenClaw sử dụng lại thông số cài đặt đã ghi cho plugin đó. Điều đó có nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản đã ghim chính xác tiếp tục được sử dụng trong các lần chạy `update <id>` sau này.

Đối với các cài đặt npm, bạn cũng có thể truyền một thông số gói npm rõ ràng với một dist-tag hoặc phiên bản chính xác. OpenClaw giải quyết tên gói đó trở lại bản ghi plugin được theo dõi, cập nhật plugin đã cài đặt đó, và ghi lại thông số npm mới cho các bản cập nhật dựa trên id trong tương lai.

Khi một hash toàn vẹn được lưu trữ tồn tại và hash của artifact được tải về thay đổi, OpenClaw in ra một cảnh báo và yêu cầu xác nhận trước khi tiếp tục. Sử dụng `--yes` toàn cục để bỏ qua các nhắc nhở trong các lần chạy CI/không tương tác.

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Kiểm tra sâu cho một plugin duy nhất. Hiển thị danh tính, trạng thái tải, nguồn, khả năng đã đăng ký, hooks, công cụ, lệnh, dịch vụ, phương thức gateway, tuyến HTTP, cờ chính sách, chẩn đoán, và metadata cài đặt.

Mỗi plugin được phân loại dựa trên những gì nó thực sự đăng ký tại runtime:

- **plain-capability** — một loại khả năng (ví dụ: plugin chỉ cung cấp)
- **hybrid-capability** — nhiều loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ có hooks, không có khả năng hoặc bề mặt
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có khả năng

Xem [Hình dạng Plugin](/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

Cờ `--json` xuất ra một báo cáo có thể đọc được bằng máy phù hợp cho việc scripting và kiểm toán.

`info` là một alias cho `inspect`.
