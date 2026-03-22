# `openclaw plugins`

Quản lý plugins/extensions và bundles tương thích cho Gateway.

Liên quan:

- Hệ thống Plugin: [Plugins](/tools/plugin)
- Tương thích Bundle: [Plugin bundles](/plugins/bundles)
- Manifest + schema Plugin: [Plugin manifest](/plugins/manifest)
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

Plugins đi kèm OpenClaw nhưng mặc định bị vô hiệu hóa. Dùng `plugins enable` để kích hoạt.

Plugins OpenClaw cần có `openclaw.plugin.json` với JSON Schema (`configSchema`, dù trống). Bundles tương thích dùng manifest riêng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Thông tin chi tiết còn cho biết subtype bundle (`codex`, `claude`, `cursor`) và khả năng bundle phát hiện được.

### Cài đặt

```bash
openclaw plugins install <path-or-spec>
openclaw plugins install <npm-spec> --pin
openclaw plugins install <plugin>@<marketplace>
openclaw plugins install <plugin> --marketplace <marketplace>
```

Lưu ý bảo mật: cài plugin như chạy code. Nên dùng phiên bản cố định.

Npm specs chỉ hỗ trợ **registry-only** (tên package + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Git/URL/file specs và semver ranges bị từ chối. Cài đặt dependency chạy với `--ignore-scripts` để an toàn.

Specs trống và `@latest` giữ ở nhánh ổn định. Nếu npm giải quyết thành prerelease, OpenClaw dừng và yêu cầu xác nhận với tag prerelease như `@beta`/`@rc` hoặc phiên bản prerelease cụ thể như `@1.2.3-beta.4`.

Nếu spec cài đặt trống trùng với id plugin đi kèm (ví dụ `diffs`), OpenClaw cài plugin đi kèm trực tiếp. Để cài package npm cùng tên, dùng spec có scope rõ ràng (ví dụ `@scope/diffs`).

Hỗ trợ các định dạng: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Cài đặt từ Claude marketplace cũng được hỗ trợ.

Dùng `plugin@marketplace` khi tên marketplace có trong cache registry local của Claude tại `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Dùng `--marketplace` khi cần chỉ định nguồn marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Nguồn Marketplace có thể là:

- tên marketplace Claude từ `~/.claude/plugins/known_marketplaces.json`
- đường dẫn root marketplace local hoặc `marketplace.json`
- GitHub repo shorthand như `owner/repo`
- URL git

Với đường dẫn local và archives, OpenClaw tự động phát hiện:

- Plugins OpenClaw native (`openclaw.plugin.json`)
- Bundles tương thích Codex (`.codex-plugin/plugin.json`)
- Bundles tương thích Claude (`.claude-plugin/plugin.json` hoặc layout component Claude mặc định)
- Bundles tương thích Cursor (`.cursor-plugin/plugin.json`)

Bundles tương thích cài vào root extensions bình thường và tham gia vào luồng list/info/enable/disable. Hiện tại, hỗ trợ kỹ năng bundle, kỹ năng lệnh Claude, mặc định `settings.json` Claude, kỹ năng lệnh Cursor, và thư mục hook Codex tương thích; các khả năng bundle khác được hiển thị trong diagnostics/info nhưng chưa tích hợp vào runtime.

Dùng `--link` để tránh sao chép thư mục local (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Dùng `--pin` khi cài npm để lưu spec chính xác đã giải quyết (`name@version`) trong `plugins.installs` trong khi giữ hành vi mặc định không cố định.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi plugin khỏi `plugins.entries`, `plugins.installs`, danh sách cho phép plugin, và các mục `plugins.load.paths` liên kết khi áp dụng. Với plugins bộ nhớ hoạt động, slot bộ nhớ đặt lại về `memory-core`.

Mặc định, gỡ cài đặt cũng xóa thư mục cài đặt plugin dưới root extensions trạng thái hoạt động (`$OPENCLAW_STATE_DIR/extensions/<id>`). Dùng `--keep-files` để giữ lại file trên đĩa.

`--keep-config` được hỗ trợ như alias đã lỗi thời cho `--keep-files`.

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
```

Cập nhật áp dụng cho các cài đặt được theo dõi trong `plugins.installs`, hiện tại là npm và cài đặt marketplace.

Khi truyền id plugin, OpenClaw tái sử dụng spec cài đặt đã ghi cho plugin đó. Nghĩa là các dist-tags đã lưu trước đó như `@beta` và phiên bản cố định tiếp tục được sử dụng trong các lần `update <id>` sau.

Với cài đặt npm, bạn cũng có thể truyền spec package npm rõ ràng với dist-tag hoặc phiên bản chính xác. OpenClaw giải quyết tên package đó về bản ghi plugin được theo dõi, cập nhật plugin đã cài đặt đó, và ghi lại spec npm mới cho các lần cập nhật dựa trên id trong tương lai.

Khi tồn tại hash integrity đã lưu và hash artifact tải về thay đổi, OpenClaw in cảnh báo và yêu cầu xác nhận trước khi tiếp tục. Dùng `--yes` toàn cục để bỏ qua nhắc nhở trong các lần chạy CI/không tương tác.

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Kiểm tra sâu cho một plugin. Hiển thị danh tính, trạng thái tải, nguồn, khả năng đã đăng ký, hooks, công cụ, lệnh, dịch vụ, phương thức gateway, routes HTTP, cờ chính sách, chẩn đoán, và metadata cài đặt.

Mỗi plugin được phân loại theo những gì thực sự đăng ký tại runtime:

- **plain-capability** — một loại khả năng (ví dụ plugin chỉ có provider)
- **hybrid-capability** — nhiều loại khả năng (ví dụ text + speech + images)
- **hook-only** — chỉ có hooks, không có khả năng hoặc bề mặt
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có khả năng

Xem [Plugin shapes](/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

Cờ `--json` xuất báo cáo có thể đọc bằng máy phù hợp cho scripting và auditing.

`info` là alias cho `inspect`.\n