# OpenClaw macOS Companion (menu bar + gateway broker)

Ứng dụng macOS là **menu-bar companion** cho OpenClaw. Nó quản lý quyền, kết nối Gateway local (launchd hoặc thủ công), và cung cấp khả năng macOS cho agent như một node.

## Chức năng

- Hiển thị thông báo và trạng thái trên menu bar.
- Quản lý TCC prompts (Thông báo, Accessibility, Ghi màn hình, Microphone, Nhận diện giọng nói, Automation/AppleScript).
- Chạy hoặc kết nối Gateway (local hoặc remote).
- Cung cấp công cụ chỉ có trên macOS (Canvas, Camera, Ghi màn hình, `system.run`).
- Khởi động dịch vụ node host local ở chế độ **remote** (launchd), và dừng ở chế độ **local**.
- Tùy chọn host **PeekabooBridge** cho UI automation.
- Cài đặt CLI toàn cầu (`openclaw`) qua npm/pnpm khi cần (không khuyến nghị dùng bun cho Gateway runtime).

## Chế độ Local vs Remote

- **Local** (mặc định): app kết nối Gateway local đang chạy nếu có; nếu không, kích hoạt dịch vụ launchd qua `openclaw gateway install`.
- **Remote**: app kết nối Gateway qua SSH/Tailscale và không khởi động tiến trình local.
  App khởi động dịch vụ **node host** local để Gateway remote có thể truy cập Mac này.
  App không tạo tiến trình con cho Gateway.

## Quản lý Launchd

App quản lý LaunchAgent theo người dùng với nhãn `ai.openclaw.gateway`
(hoặc `ai.openclaw.<profile>` khi dùng `--profile`/`OPENCLAW_PROFILE`; legacy `com.openclaw.*` vẫn unload).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Thay nhãn bằng `ai.openclaw.<profile>` khi chạy profile có tên.

Nếu LaunchAgent chưa cài, kích hoạt từ app hoặc chạy
`openclaw gateway install`.

## Khả năng Node (mac)

App macOS hoạt động như một node. Các lệnh thường dùng:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.record`
- System: `system.run`, `system.notify`

Node báo cáo `permissions` map để agents quyết định quyền truy cập.

Dịch vụ node + app IPC:

- Khi dịch vụ node host headless chạy (chế độ remote), nó kết nối Gateway WS như một node.
- `system.run` thực thi trong app macOS (UI/TCC context) qua Unix socket local; prompts + output giữ trong app.

Sơ đồ (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Phê duyệt Exec (system.run)

`system.run` được kiểm soát bởi **Exec approvals** trong app macOS (Settings → Exec approvals).
Security + ask + allowlist lưu trữ local trên Mac trong:

```
~/.openclaw/exec-approvals.json
```

Ví dụ:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Ghi chú:

- `allowlist` là glob patterns cho đường dẫn binary đã giải quyết.
- Lệnh shell chứa shell control hoặc expansion syntax (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) được coi là allowlist miss và cần phê duyệt rõ ràng (hoặc allowlist shell binary).
- Chọn “Always Allow” trong prompt thêm lệnh đó vào allowlist.
- `system.run` environment overrides bị lọc (bỏ `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) và sau đó hợp nhất với môi trường app.
- Với shell wrappers (`bash|sh|zsh ... -c/-lc`), environment overrides theo yêu cầu giảm xuống một allowlist rõ ràng nhỏ (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Với quyết định allow-always trong chế độ allowlist, dispatch wrappers đã biết (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) lưu trữ đường dẫn executable bên trong thay vì đường dẫn wrapper. Nếu unwrapping không an toàn, không có mục allowlist nào được lưu tự động.

## Deep links

App đăng ký URL scheme `openclaw://` cho các hành động local.

### `openclaw://agent`

Kích hoạt yêu cầu `agent` của Gateway.

```bash
open 'openclaw://agent?message=Hello%20from%20deep%20link'
```

Tham số truy vấn:

- `message` (bắt buộc)
- `sessionKey` (tùy chọn)
- `thinking` (tùy chọn)
- `deliver` / `to` / `channel` (tùy chọn)
- `timeoutSeconds` (tùy chọn)
- `key` (tùy chọn cho chế độ không giám sát)

An toàn:

- Không có `key`, app yêu cầu xác nhận.
- Không có `key`, app giới hạn độ dài tin nhắn cho prompt xác nhận và bỏ qua `deliver` / `to` / `channel`.
- Với `key` hợp lệ, chạy không giám sát (dành cho tự động hóa cá nhân).

## Quy trình Onboarding (thông thường)

1. Cài đặt và khởi chạy **OpenClaw.app**.
2. Hoàn thành checklist quyền (TCC prompts).
3. Đảm bảo chế độ **Local** đang hoạt động và Gateway đang chạy.
4. Cài đặt CLI nếu muốn truy cập terminal.

## Vị trí thư mục trạng thái (macOS)

Tránh đặt thư mục trạng thái OpenClaw trong iCloud hoặc thư mục đồng bộ đám mây khác.
Đường dẫn đồng bộ có thể gây độ trễ và đôi khi gây ra file-lock/sync races cho
sessions và credentials.

Ưu tiên đường dẫn trạng thái local không đồng bộ như:

```bash
OPENCLAW_STATE_DIR=~/.openclaw
```

Nếu `openclaw doctor` phát hiện trạng thái dưới:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

nó sẽ cảnh báo và khuyến nghị chuyển về đường dẫn local.

## Quy trình Build & Dev (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (hoặc Xcode)
- Đóng gói app: `scripts/package-mac-app.sh`

## Debug kết nối gateway (macOS CLI)

Dùng CLI debug để thực hiện handshake và logic khám phá Gateway WebSocket giống như app macOS, mà không cần khởi chạy app.

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

Tùy chọn kết nối:

- `--url <ws://host:port>`: ghi đè config
- `--mode <local|remote>`: giải quyết từ config (mặc định: config hoặc local)
- `--probe`: buộc kiểm tra sức khỏe mới
- `--timeout <ms>`: thời gian chờ yêu cầu (mặc định: `15000`)
- `--json`: output có cấu trúc để so sánh

Tùy chọn khám phá:

- `--include-local`: bao gồm gateways bị lọc là “local”
- `--timeout <ms>`: cửa sổ khám phá tổng thể (mặc định: `2000`)
- `--json`: output có cấu trúc để so sánh

Mẹo: so sánh với `openclaw gateway discover --json` để xem liệu
pipeline khám phá của app macOS (NWBrowser + tailnet DNS‑SD fallback) có khác với
Node CLI’s `dns-sd` based discovery.

## Kết nối remote (SSH tunnels)

Khi app macOS chạy ở chế độ **Remote**, nó mở một SSH tunnel để các thành phần UI local có thể nói chuyện với Gateway remote như thể nó đang ở localhost.

### Control tunnel (Gateway WebSocket port)

- **Mục đích:** kiểm tra sức khỏe, trạng thái, Web Chat, config, và các cuộc gọi control-plane khác.
- **Cổng local:** cổng Gateway (mặc định `18789`), luôn ổn định.
- **Cổng remote:** cùng cổng Gateway trên host remote.
- **Hành vi:** không có cổng local ngẫu nhiên; app tái sử dụng tunnel khỏe mạnh hiện có
  hoặc khởi động lại nếu cần.
- **Hình dạng SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` với BatchMode +
  ExitOnForwardFailure + keepalive options.
- **Báo cáo IP:** SSH tunnel dùng loopback, nên gateway sẽ thấy node
  IP là `127.0.0.1`. Dùng **Direct (ws/wss)** transport nếu muốn IP client thực xuất hiện (xem [macOS remote access](/platforms/mac/remote)).

Để biết các bước thiết lập, xem [macOS remote access](/platforms/mac/remote). Để biết chi tiết giao thức, xem [Gateway protocol](/gateway/protocol).

## Tài liệu liên quan

- [Gateway runbook](/gateway)
- [Gateway (macOS)](/platforms/mac/bundled-gateway)
- [macOS permissions](/platforms/mac/permissions)
- [Canvas](/platforms/mac/canvas)\n