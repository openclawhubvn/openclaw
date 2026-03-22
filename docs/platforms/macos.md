---
summary: "Ứng dụng đồng hành OpenClaw trên macOS (thanh menu + gateway broker)"
read_when:
  - Triển khai tính năng ứng dụng macOS
  - Thay đổi vòng đời gateway hoặc cầu nối node trên macOS
title: "Ứng dụng macOS"
---

# Ứng dụng đồng hành OpenClaw trên macOS (thanh menu + gateway broker)

Ứng dụng macOS là **ứng dụng đồng hành trên thanh menu** cho OpenClaw. Nó quản lý quyền, kết nối với Gateway cục bộ (bằng launchd hoặc thủ công), và cung cấp các khả năng của macOS cho agent như một node.

## Chức năng

- Hiển thị thông báo gốc và trạng thái trên thanh menu.
- Quản lý các yêu cầu TCC (Thông báo, Trợ năng, Ghi màn hình, Microphone, Nhận diện giọng nói, Tự động hóa/AppleScript).
- Chạy hoặc kết nối với Gateway (cục bộ hoặc từ xa).
- Cung cấp các công cụ chỉ có trên macOS (Canvas, Camera, Ghi màn hình, `system.run`).
- Khởi động dịch vụ host node cục bộ ở chế độ **remote** (launchd), và dừng nó ở chế độ **local**.
- Tùy chọn host **PeekabooBridge** cho tự động hóa giao diện người dùng.
- Cài đặt CLI toàn cầu (`openclaw`) qua npm/pnpm theo yêu cầu (không khuyến nghị dùng bun cho runtime Gateway).

## Chế độ cục bộ và từ xa

- **Cục bộ** (mặc định): ứng dụng kết nối với Gateway cục bộ đang chạy nếu có; nếu không, nó kích hoạt dịch vụ launchd qua `openclaw gateway install`.
- **Từ xa**: ứng dụng kết nối với Gateway qua SSH/Tailscale và không bao giờ khởi động một tiến trình cục bộ.
  Ứng dụng khởi động dịch vụ **node host** cục bộ để Gateway từ xa có thể truy cập vào máy Mac này.
  Ứng dụng không tạo Gateway như một tiến trình con.

## Quản lý launchd

Ứng dụng quản lý một LaunchAgent cho mỗi người dùng có nhãn `ai.openclaw.gateway`
(hoặc `ai.openclaw.<profile>` khi sử dụng `--profile`/`OPENCLAW_PROFILE`; các nhãn cũ `com.openclaw.*` vẫn được gỡ bỏ).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Thay thế nhãn bằng `ai.openclaw.<profile>` khi chạy một profile có tên.

Nếu LaunchAgent chưa được cài đặt, kích hoạt nó từ ứng dụng hoặc chạy
`openclaw gateway install`.

## Khả năng của node (mac)

Ứng dụng macOS tự nhận là một node. Các lệnh thông dụng:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Màn hình: `screen.record`
- Hệ thống: `system.run`, `system.notify`

Node báo cáo một bản đồ `permissions` để các agent quyết định những gì được phép.

Dịch vụ node + IPC ứng dụng:

- Khi dịch vụ host node không giao diện đang chạy (chế độ từ xa), nó kết nối với Gateway WS như một node.
- `system.run` thực thi trong ứng dụng macOS (ngữ cảnh UI/TCC) qua một socket Unix cục bộ; các yêu cầu và kết quả được giữ trong ứng dụng.

Sơ đồ (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Phê duyệt thực thi (system.run)

`system.run` được kiểm soát bởi **Phê duyệt thực thi** trong ứng dụng macOS (Cài đặt → Phê duyệt thực thi).
Bảo mật + hỏi + danh sách cho phép được lưu trữ cục bộ trên máy Mac trong:

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

- Các mục `allowlist` là các mẫu glob cho đường dẫn nhị phân đã được giải quyết.
- Văn bản lệnh shell thô chứa cú pháp điều khiển hoặc mở rộng shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) được coi là không có trong danh sách cho phép và yêu cầu phê duyệt rõ ràng (hoặc cho phép shell nhị phân).
- Chọn “Luôn cho phép” trong yêu cầu sẽ thêm lệnh đó vào danh sách cho phép.
- Các ghi đè môi trường `system.run` bị lọc (bỏ `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) và sau đó được hợp nhất với môi trường của ứng dụng.
- Đối với các shell wrapper (`bash|sh|zsh ... -c/-lc`), các ghi đè môi trường theo yêu cầu được giảm xuống một danh sách cho phép rõ ràng nhỏ (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Đối với các quyết định cho phép luôn trong chế độ danh sách cho phép, các wrapper phân phối đã biết (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) lưu giữ đường dẫn thực thi bên trong thay vì đường dẫn wrapper. Nếu không thể mở gói an toàn, không có mục danh sách cho phép nào được lưu tự động.

## Liên kết sâu

Ứng dụng đăng ký URL scheme `openclaw://` cho các hành động cục bộ.

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
- `key` (khóa chế độ không giám sát tùy chọn)

An toàn:

- Không có `key`, ứng dụng sẽ yêu cầu xác nhận.
- Không có `key`, ứng dụng giới hạn độ dài thông điệp ngắn cho yêu cầu xác nhận và bỏ qua `deliver` / `to` / `channel`.
- Với `key` hợp lệ, việc chạy không cần giám sát (dành cho tự động hóa cá nhân).

## Quy trình giới thiệu (thông thường)

1. Cài đặt và khởi chạy **OpenClaw.app**.
2. Hoàn thành danh sách kiểm tra quyền (yêu cầu TCC).
3. Đảm bảo chế độ **Cục bộ** đang hoạt động và Gateway đang chạy.
4. Cài đặt CLI nếu muốn truy cập từ terminal.

## Vị trí thư mục trạng thái (macOS)

Tránh đặt thư mục trạng thái OpenClaw trong iCloud hoặc các thư mục đồng bộ đám mây khác.
Các đường dẫn được đồng bộ có thể gây ra độ trễ và đôi khi gây ra các cuộc đua khóa/tệp đồng bộ cho các phiên và thông tin đăng nhập.

Ưu tiên một đường dẫn trạng thái cục bộ không đồng bộ như:

```bash
OPENCLAW_STATE_DIR=~/.openclaw
```

Nếu `openclaw doctor` phát hiện trạng thái dưới:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

nó sẽ cảnh báo và khuyến nghị di chuyển về một đường dẫn cục bộ.

## Quy trình xây dựng & phát triển (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (hoặc Xcode)
- Đóng gói ứng dụng: `scripts/package-mac-app.sh`

## Gỡ lỗi kết nối gateway (macOS CLI)

Sử dụng CLI gỡ lỗi để thực hiện cùng một quy trình bắt tay và khám phá WebSocket Gateway mà ứng dụng macOS sử dụng, mà không cần khởi chạy ứng dụng.

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

Tùy chọn kết nối:

- `--url <ws://host:port>`: ghi đè cấu hình
- `--mode <local|remote>`: giải quyết từ cấu hình (mặc định: cấu hình hoặc cục bộ)
- `--probe`: buộc kiểm tra sức khỏe mới
- `--timeout <ms>`: thời gian chờ yêu cầu (mặc định: `15000`)
- `--json`: đầu ra có cấu trúc để so sánh

Tùy chọn khám phá:

- `--include-local`: bao gồm các gateway sẽ bị lọc là “cục bộ”
- `--timeout <ms>`: cửa sổ khám phá tổng thể (mặc định: `2000`)
- `--json`: đầu ra có cấu trúc để so sánh

Mẹo: so sánh với `openclaw gateway discover --json` để xem liệu quy trình khám phá của ứng dụng macOS (NWBrowser + tailnet DNS‑SD fallback) có khác với khám phá dựa trên `dns-sd` của Node CLI hay không.

## Kết nối từ xa (SSH tunnels)

Khi ứng dụng macOS chạy ở chế độ **Từ xa**, nó mở một đường hầm SSH để các thành phần giao diện người dùng cục bộ có thể nói chuyện với Gateway từ xa như thể nó đang ở trên localhost.

### Đường hầm điều khiển (cổng WebSocket Gateway)

- **Mục đích:** kiểm tra sức khỏe, trạng thái, Web Chat, cấu hình và các cuộc gọi mặt phẳng điều khiển khác.
- **Cổng cục bộ:** cổng Gateway (mặc định `18789`), luôn ổn định.
- **Cổng từ xa:** cùng cổng Gateway trên máy chủ từ xa.
- **Hành vi:** không có cổng cục bộ ngẫu nhiên; ứng dụng tái sử dụng một đường hầm khỏe mạnh hiện có hoặc khởi động lại nếu cần.
- **Hình dạng SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` với các tùy chọn BatchMode + ExitOnForwardFailure + keepalive.
- **Báo cáo IP:** đường hầm SSH sử dụng loopback, vì vậy gateway sẽ thấy IP node là `127.0.0.1`. Sử dụng **Direct (ws/wss)** transport nếu muốn IP client thực xuất hiện (xem [truy cập từ xa macOS](/platforms/mac/remote)).

Để biết các bước thiết lập, xem [truy cập từ xa macOS](/platforms/mac/remote). Để biết chi tiết về giao thức, xem [Giao thức Gateway](/gateway/protocol).

## Tài liệu liên quan

- [Sổ tay Gateway](/gateway)
- [Gateway (macOS)](/platforms/mac/bundled-gateway)
- [Quyền macOS](/platforms/mac/permissions)
- [Canvas](/platforms/mac/canvas)
