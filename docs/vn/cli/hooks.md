---
summary: "Tham khảo CLI cho `openclaw hooks` (agent hooks)"
read_when:
  - Bạn muốn quản lý agent hooks
  - Bạn muốn cài đặt hoặc cập nhật hooks
title: "hooks"
---

# `openclaw hooks`

Quản lý agent hooks (tự động hóa dựa trên sự kiện cho các lệnh như `/new`, `/reset`, và khởi động gateway).

Liên quan:

- Hooks: [Hooks](/automation/hooks)
- Plugin hooks: [Plugin hooks](/plugins/architecture#provider-runtime-hooks)

## Liệt kê Tất Cả Hooks

```bash
openclaw hooks list
```

Liệt kê tất cả hooks được phát hiện từ workspace, thư mục quản lý và thư mục đi kèm.

**Tùy chọn:**

- `--eligible`: Chỉ hiển thị các hooks đủ điều kiện (đáp ứng yêu cầu)
- `--json`: Xuất dưới dạng JSON
- `-v, --verbose`: Hiển thị thông tin chi tiết bao gồm các yêu cầu còn thiếu

**Ví dụ đầu ra:**

```
Hooks (4/4 sẵn sàng)

Sẵn sàng:
  🚀 boot-md ✓ - Chạy BOOT.md khi gateway khởi động
  📎 bootstrap-extra-files ✓ - Chèn thêm các tệp bootstrap vào workspace trong quá trình khởi động agent
  📝 command-logger ✓ - Ghi lại tất cả sự kiện lệnh vào một tệp audit tập trung
  💾 session-memory ✓ - Lưu ngữ cảnh phiên vào bộ nhớ khi lệnh /new được thực hiện
```

**Ví dụ (chi tiết):**

```bash
openclaw hooks list --verbose
```

Hiển thị các yêu cầu còn thiếu cho các hooks không đủ điều kiện.

**Ví dụ (JSON):**

```bash
openclaw hooks list --json
```

Trả về JSON có cấu trúc để sử dụng trong lập trình.

## Lấy Thông Tin Hook

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

**Đầu ra:**

```
💾 session-memory ✓ Sẵn sàng

Lưu ngữ cảnh phiên vào bộ nhớ khi lệnh /new được thực hiện

Chi tiết:
  Nguồn: openclaw-bundled
  Đường dẫn: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Trình xử lý: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Trang chủ: https://docs.openclaw.ai/automation/hooks#session-memory
  Sự kiện: command:new

Yêu cầu:
  Cấu hình: ✓ workspace.dir
```

## Kiểm Tra Tính Đủ Điều Kiện Của Hooks

```bash
openclaw hooks check
```

Hiển thị tóm tắt trạng thái đủ điều kiện của hooks (bao nhiêu sẵn sàng và không sẵn sàng).

**Tùy chọn:**

- `--json`: Xuất dưới dạng JSON

**Ví dụ đầu ra:**

```
Trạng thái Hooks

Tổng số hooks: 4
Sẵn sàng: 4
Không sẵn sàng: 0
```

## Kích Hoạt Một Hook

```bash
openclaw hooks enable <name>
```

Kích hoạt một hook cụ thể bằng cách thêm nó vào cấu hình (`~/.openclaw/config.json`).

**Lưu ý:** Hooks được quản lý bởi plugins hiển thị `plugin:<id>` trong `openclaw hooks list` và không thể kích hoạt/tắt ở đây. Kích hoạt/tắt plugin thay thế.

**Tham số:**

- `<name>`: Tên hook (ví dụ: `session-memory`)

**Ví dụ:**

```bash
openclaw hooks enable session-memory
```

**Đầu ra:**

```
✓ Đã kích hoạt hook: 💾 session-memory
```

**Những gì nó làm:**

- Kiểm tra xem hook có tồn tại và đủ điều kiện không
- Cập nhật `hooks.internal.entries.<name>.enabled = true` trong cấu hình
- Lưu cấu hình vào đĩa

**Sau khi kích hoạt:**

- Khởi động lại gateway để hooks tải lại (khởi động lại ứng dụng menu bar trên macOS, hoặc khởi động lại quá trình gateway trong dev).

## Tắt Một Hook

```bash
openclaw hooks disable <name>
```

Tắt một hook cụ thể bằng cách cập nhật cấu hình.

**Tham số:**

- `<name>`: Tên hook (ví dụ: `command-logger`)

**Ví dụ:**

```bash
openclaw hooks disable command-logger
```

**Đầu ra:**

```
⏸ Đã tắt hook: 📝 command-logger
```

**Sau khi tắt:**

- Khởi động lại gateway để hooks tải lại

## Cài Đặt Hooks

```bash
openclaw hooks install <path-or-spec>
openclaw hooks install <npm-spec> --pin
```

Cài đặt một gói hook từ thư mục/tệp lưu trữ cục bộ hoặc npm.

Các thông số npm chỉ dành cho **registry** (tên gói + phiên bản chính xác tùy chọn hoặc **dist-tag**). Các thông số Git/URL/tệp và phạm vi semver bị từ chối. Cài đặt phụ thuộc chạy với `--ignore-scripts` để đảm bảo an toàn.

Các thông số trần và `@latest` giữ trên đường ổn định. Nếu npm giải quyết một trong hai thành một bản phát hành trước, OpenClaw dừng lại và yêu cầu bạn chọn rõ ràng với một thẻ phát hành trước như `@beta`/`@rc` hoặc một phiên bản phát hành trước chính xác.

**Những gì nó làm:**

- Sao chép gói hook vào `~/.openclaw/hooks/<id>`
- Kích hoạt các hooks đã cài đặt trong `hooks.internal.entries.*`
- Ghi lại cài đặt dưới `hooks.internal.installs`

**Tùy chọn:**

- `-l, --link`: Liên kết một thư mục cục bộ thay vì sao chép (thêm vào `hooks.internal.load.extraDirs`)
- `--pin`: Ghi lại cài đặt npm dưới dạng `name@version` đã giải quyết chính xác trong `hooks.internal.installs`

**Các tệp lưu trữ hỗ trợ:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Ví dụ:**

```bash
# Thư mục cục bộ
openclaw hooks install ./my-hook-pack

# Tệp lưu trữ cục bộ
openclaw hooks install ./my-hook-pack.zip

# Gói NPM
openclaw hooks install @openclaw/my-hook-pack

# Liên kết một thư mục cục bộ mà không sao chép
openclaw hooks install -l ./my-hook-pack
```

## Cập Nhật Hooks

```bash
openclaw hooks update <id>
openclaw hooks update --all
```

Cập nhật các gói hook đã cài đặt (chỉ cài đặt npm).

**Tùy chọn:**

- `--all`: Cập nhật tất cả các gói hook được theo dõi
- `--dry-run`: Hiển thị những gì sẽ thay đổi mà không ghi

Khi một hash toàn vẹn được lưu trữ tồn tại và hash của artifact được lấy về thay đổi, OpenClaw in ra cảnh báo và yêu cầu xác nhận trước khi tiếp tục. Sử dụng `--yes` toàn cầu để bỏ qua các nhắc nhở trong các lần chạy CI/không tương tác.

## Hooks Đi Kèm

### session-memory

Lưu ngữ cảnh phiên vào bộ nhớ khi bạn thực hiện `/new`.

**Kích hoạt:**

```bash
openclaw hooks enable session-memory
```

**Đầu ra:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Xem thêm:** [tài liệu session-memory](/automation/hooks#session-memory)

### bootstrap-extra-files

Chèn thêm các tệp bootstrap (ví dụ như `AGENTS.md` / `TOOLS.md` trong monorepo-local) trong quá trình `agent:bootstrap`.

**Kích hoạt:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Xem thêm:** [tài liệu bootstrap-extra-files](/automation/hooks#bootstrap-extra-files)

### command-logger

Ghi lại tất cả sự kiện lệnh vào một tệp audit tập trung.

**Kích hoạt:**

```bash
openclaw hooks enable command-logger
```

**Đầu ra:** `~/.openclaw/logs/commands.log`

**Xem nhật ký:**

```bash
# Các lệnh gần đây
tail -n 20 ~/.openclaw/logs/commands.log

# In đẹp
cat ~/.openclaw/logs/commands.log | jq .

# Lọc theo hành động
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Xem thêm:** [tài liệu command-logger](/automation/hooks#command-logger)

### boot-md

Chạy `BOOT.md` khi gateway khởi động (sau khi các kênh bắt đầu).

**Sự kiện**: `gateway:startup`

**Kích hoạt**:

```bash
openclaw hooks enable boot-md
```

**Xem thêm:** [tài liệu boot-md](/automation/hooks#boot-md)
