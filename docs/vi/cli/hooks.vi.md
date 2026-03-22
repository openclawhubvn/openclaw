---
summary: "Tham khảo CLI cho `openclaw hooks` (agent hooks)"
read_when:
  - Muốn quản lý agent hooks
  - Muốn cài đặt hoặc cập nhật hooks
title: "hooks"
---

# `openclaw hooks`

Quản lý agent hooks (tự động hóa dựa trên sự kiện cho các lệnh như `/new`, `/reset`, và khởi động gateway).

Liên quan:

- Hooks: [Hooks](/automation/hooks)
- Plugin hooks: [Plugin hooks](/plugins/architecture#provider-runtime-hooks)

## Liệt kê Tất cả Hooks

```bash
openclaw hooks list
```

Liệt kê tất cả hooks được phát hiện từ workspace, managed, và bundled directories.

**Tùy chọn:**

- `--eligible`: Chỉ hiển thị hooks đủ điều kiện (đã đáp ứng yêu cầu)
- `--json`: Xuất dưới dạng JSON
- `-v, --verbose`: Hiển thị thông tin chi tiết bao gồm yêu cầu còn thiếu

**Ví dụ output:**

```
Hooks (4/4 sẵn sàng)

Sẵn sàng:
  🚀 boot-md ✓ - Chạy BOOT.md khi gateway khởi động
  📎 bootstrap-extra-files ✓ - Chèn thêm file bootstrap vào workspace trong quá trình agent bootstrap
  📝 command-logger ✓ - Ghi lại tất cả sự kiện lệnh vào file audit tập trung
  💾 session-memory ✓ - Lưu context session vào bộ nhớ khi lệnh /new được thực thi
```

**Ví dụ (verbose):**

```bash
openclaw hooks list --verbose
```

Hiển thị yêu cầu còn thiếu cho hooks không đủ điều kiện.

**Ví dụ (JSON):**

```bash
openclaw hooks list --json
```

Trả về JSON có cấu trúc để sử dụng lập trình.

## Lấy Thông tin Hook

```bash
openclaw hooks info <name>
```

Hiển thị thông tin chi tiết về một hook cụ thể.

**Tham số:**

- `<name>`: Tên hook (ví dụ: `session-memory`)

**Tùy chọn:**

- `--json`: Xuất dưới dạng JSON

**Ví dụ:**

```bash
openclaw hooks info session-memory
```

**Output:**

```
💾 session-memory ✓ Sẵn sàng

Lưu context session vào bộ nhớ khi lệnh /new được thực thi

Chi tiết:
  Nguồn: openclaw-bundled
  Đường dẫn: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Trang chủ: https://docs.openclaw.ai/automation/hooks#session-memory
  Sự kiện: command:new

Yêu cầu:
  Cấu hình: ✓ workspace.dir
```

## Kiểm tra Đủ điều kiện của Hooks

```bash
openclaw hooks check
```

Hiển thị tóm tắt trạng thái đủ điều kiện của hooks (bao nhiêu sẵn sàng vs. không sẵn sàng).

**Tùy chọn:**

- `--json`: Xuất dưới dạng JSON

**Ví dụ output:**

```
Trạng thái Hooks

Tổng số hooks: 4
Sẵn sàng: 4
Không sẵn sàng: 0
```

## Kích hoạt một Hook

```bash
openclaw hooks enable <name>
```

Kích hoạt một hook cụ thể bằng cách thêm vào cấu hình (`~/.openclaw/config.json`).

**Lưu ý:** Hooks được quản lý bởi plugins hiển thị `plugin:<id>` trong `openclaw hooks list` và không thể kích hoạt/vô hiệu hóa ở đây. Kích hoạt/vô hiệu hóa plugin thay thế.

**Tham số:**

- `<name>`: Tên hook (ví dụ: `session-memory`)

**Ví dụ:**

```bash
openclaw hooks enable session-memory
```

**Output:**

```
✓ Đã kích hoạt hook: 💾 session-memory
```

**Thực hiện:**

- Kiểm tra xem hook có tồn tại và đủ điều kiện không
- Cập nhật `hooks.internal.entries.<name>.enabled = true` trong cấu hình
- Lưu cấu hình vào đĩa

**Sau khi kích hoạt:**

- Khởi động lại gateway để hooks tải lại (khởi động lại app menu bar trên macOS, hoặc khởi động lại quá trình gateway trong dev).

## Vô hiệu hóa một Hook

```bash
openclaw hooks disable <name>
```

Vô hiệu hóa một hook cụ thể bằng cách cập nhật cấu hình.

**Tham số:**

- `<name>`: Tên hook (ví dụ: `command-logger`)

**Ví dụ:**

```bash
openclaw hooks disable command-logger
```

**Output:**

```
⏸ Đã vô hiệu hóa hook: 📝 command-logger
```

**Sau khi vô hiệu hóa:**

- Khởi động lại gateway để hooks tải lại

## Cài đặt Hooks

```bash
openclaw hooks install <path-or-spec>
openclaw hooks install <npm-spec> --pin
```

Cài đặt một hook pack từ thư mục/tệp lưu trữ local hoặc npm.

Npm specs chỉ **registry-only** (tên package + phiên bản chính xác tùy chọn hoặc **dist-tag**). Git/URL/file specs và semver ranges bị từ chối. Cài đặt phụ thuộc chạy với `--ignore-scripts` để an toàn.

Specs trần và `@latest` giữ trên track ổn định. Nếu npm giải quyết một trong hai thành prerelease, OpenClaw dừng và yêu cầu bạn chọn rõ ràng với tag prerelease như `@beta`/`@rc` hoặc phiên bản prerelease chính xác.

**Thực hiện:**

- Sao chép hook pack vào `~/.openclaw/hooks/<id>`
- Kích hoạt các hooks đã cài đặt trong `hooks.internal.entries.*`
- Ghi lại cài đặt dưới `hooks.internal.installs`

**Tùy chọn:**

- `-l, --link`: Liên kết một thư mục local thay vì sao chép (thêm vào `hooks.internal.load.extraDirs`)
- `--pin`: Ghi lại cài đặt npm dưới dạng `name@version` đã giải quyết chính xác trong `hooks.internal.installs`

**Lưu trữ hỗ trợ:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Ví dụ:**

```bash
# Thư mục local
openclaw hooks install ./my-hook-pack

# Tệp lưu trữ local
openclaw hooks install ./my-hook-pack.zip

# NPM package
openclaw hooks install @openclaw/my-hook-pack

# Liên kết một thư mục local mà không sao chép
openclaw hooks install -l ./my-hook-pack
```

## Cập nhật Hooks

```bash
openclaw hooks update <id>
openclaw hooks update --all
```

Cập nhật các hook pack đã cài đặt (chỉ cài đặt npm).

**Tùy chọn:**

- `--all`: Cập nhật tất cả hook pack được theo dõi
- `--dry-run`: Hiển thị những gì sẽ thay đổi mà không ghi

Khi có hash integrity lưu trữ và hash artifact được lấy về thay đổi, OpenClaw in cảnh báo và yêu cầu xác nhận trước khi tiếp tục. Sử dụng `--yes` toàn cầu để bỏ qua nhắc nhở trong CI/chạy không tương tác.

## Bundled Hooks

### session-memory

Lưu context session vào bộ nhớ khi bạn thực thi `/new`.

**Kích hoạt:**

```bash
openclaw hooks enable session-memory
```

**Output:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Xem:** [tài liệu session-memory](/automation/hooks#session-memory)

### bootstrap-extra-files

Chèn thêm file bootstrap (ví dụ `AGENTS.md` / `TOOLS.md` monorepo-local) trong quá trình `agent:bootstrap`.

**Kích hoạt:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Xem:** [tài liệu bootstrap-extra-files](/automation/hooks#bootstrap-extra-files)

### command-logger

Ghi lại tất cả sự kiện lệnh vào file audit tập trung.

**Kích hoạt:**

```bash
openclaw hooks enable command-logger
```

**Output:** `~/.openclaw/logs/commands.log`

**Xem logs:**

```bash
# Lệnh gần đây
tail -n 20 ~/.openclaw/logs/commands.log

# In đẹp
cat ~/.openclaw/logs/commands.log | jq .

# Lọc theo hành động
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Xem:** [tài liệu command-logger](/automation/hooks#command-logger)

### boot-md

Chạy `BOOT.md` khi gateway khởi động (sau khi channels khởi động).

**Sự kiện**: `gateway:startup`

**Kích hoạt**:

```bash
openclaw hooks enable boot-md
```

**Xem:** [tài liệu boot-md](/automation/hooks#boot-md)\n