# Nodes

**Node** là thiết bị phụ trợ (macOS/iOS/Android/headless) kết nối với Gateway qua **WebSocket** (cùng port với operators) với `role: "node"` và cung cấp bề mặt lệnh (ví dụ: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) qua `node.invoke`. Chi tiết giao thức: [Gateway protocol](/gateway/protocol).

Giao thức cũ: [Bridge protocol](/gateway/bridge-protocol) (TCP JSONL; đã bị loại bỏ cho các node hiện tại).

macOS cũng có thể chạy ở **node mode**: ứng dụng menubar kết nối với WS server của Gateway và cung cấp các lệnh canvas/camera local như một node (vì vậy `openclaw nodes …` hoạt động trên Mac này).

Lưu ý:

- Nodes là **peripherals**, không phải gateways. Chúng không chạy dịch vụ gateway.
- Tin nhắn Telegram/WhatsApp/etc. đến **gateway**, không phải nodes.
- Hướng dẫn khắc phục sự cố: [/nodes/troubleshooting](/nodes/troubleshooting)

## Pairing + trạng thái

**WS nodes sử dụng pairing thiết bị.** Nodes cung cấp danh tính thiết bị khi `connect`; Gateway tạo yêu cầu pairing thiết bị cho `role: node`. Phê duyệt qua CLI (hoặc UI) của thiết bị.

CLI nhanh:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Nếu một node thử lại với thông tin xác thực thay đổi (role/scopes/public key), yêu cầu đang chờ trước đó sẽ bị thay thế và tạo `requestId` mới. Chạy lại `openclaw devices list` trước khi phê duyệt.

Lưu ý:

- `nodes status` đánh dấu một node là **paired** khi role pairing thiết bị của nó bao gồm `node`.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject`) là một kho lưu trữ pairing node thuộc sở hữu của gateway; nó **không** chặn handshake `connect` WS.

## Remote node host (system.run)

Dùng **node host** khi Gateway chạy trên một máy và muốn thực thi lệnh trên máy khác. Mô hình vẫn nói chuyện với **gateway**; gateway chuyển tiếp các cuộc gọi `exec` đến **node host** khi `host=node` được chọn.

### Chạy cái gì ở đâu

- **Gateway host**: nhận tin nhắn, chạy mô hình, định tuyến các cuộc gọi công cụ.
- **Node host**: thực thi `system.run`/`system.which` trên máy node.
- **Phê duyệt**: thực thi trên node host qua `~/.openclaw/exec-approvals.json`.

Lưu ý phê duyệt:

- Chạy node có phê duyệt ràng buộc ngữ cảnh yêu cầu chính xác.
- Đối với các thực thi file shell/runtime trực tiếp, OpenClaw cũng cố gắng ràng buộc một file local cụ thể và từ chối chạy nếu file đó thay đổi trước khi thực thi.
- Nếu OpenClaw không thể xác định chính xác một file local cụ thể cho một lệnh interpreter/runtime, thực thi có phê duyệt bị từ chối thay vì giả vờ bao phủ toàn bộ runtime. Dùng sandboxing, hosts riêng biệt, hoặc một danh sách cho phép tin cậy rõ ràng/toàn bộ workflow cho các ngữ nghĩa interpreter rộng hơn.

### Khởi động một node host (foreground)

Trên máy node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Remote gateway qua SSH tunnel (loopback bind)

Nếu Gateway bind vào loopback (`gateway.bind=loopback`, mặc định ở chế độ local), các node host từ xa không thể kết nối trực tiếp. Tạo một SSH tunnel và trỏ node host vào đầu local của tunnel.

Ví dụ (node host -> gateway host):

```bash
# Terminal A (giữ chạy): chuyển tiếp local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: xuất token gateway và kết nối qua tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Lưu ý:

- `openclaw node run` hỗ trợ xác thực bằng token hoặc password.
- Biến môi trường được ưu tiên: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Cấu hình dự phòng là `gateway.auth.token` / `gateway.auth.password`.
- Ở chế độ local, node host cố ý bỏ qua `gateway.remote.token` / `gateway.remote.password`.
- Ở chế độ remote, `gateway.remote.token` / `gateway.remote.password` đủ điều kiện theo quy tắc ưu tiên từ xa.
- Nếu các SecretRefs `gateway.auth.*` local đang hoạt động được cấu hình nhưng không giải quyết được, xác thực node-host thất bại.

### Khởi động một node host (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Pair + đặt tên

Trên gateway host:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Nếu node thử lại với thông tin xác thực thay đổi, chạy lại `openclaw devices list` và phê duyệt `requestId` hiện tại.

Tùy chọn đặt tên:

- `--display-name` trên `openclaw node run` / `openclaw node install` (lưu trong `~/.openclaw/node.json` trên node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (ghi đè gateway).

### Allowlist các lệnh

Phê duyệt thực thi là **per node host**. Thêm các mục allowlist từ gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Phê duyệt sống trên node host tại `~/.openclaw/exec-approvals.json`.

### Trỏ exec vào node

Cấu hình mặc định (cấu hình gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Hoặc theo session:

```
/exec host=node security=allowlist node=<id-or-name>
```

Khi đã thiết lập, bất kỳ cuộc gọi `exec` nào với `host=node` sẽ chạy trên node host (tuân theo allowlist/phê duyệt của node).

Liên quan:

- [Node host CLI](/cli/node)
- [Exec tool](/tools/exec)
- [Exec approvals](/tools/exec-approvals)

## Thực thi lệnh

Cấp thấp (raw RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Có các trợ giúp cấp cao hơn cho các workflow “đưa agent một MEDIA attachment” phổ biến.

## Screenshots (canvas snapshots)

Nếu node đang hiển thị Canvas (WebView), `canvas.snapshot` trả về `{ format, base64 }`.

CLI helper (ghi vào file tạm và in `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Điều khiển Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Lưu ý:

- `canvas present` chấp nhận URL hoặc đường dẫn file local (`--target`), cùng với tùy chọn `--x/--y/--width/--height` để định vị.
- `canvas eval` chấp nhận JS inline (`--js`) hoặc một đối số vị trí.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Lưu ý:

- Chỉ hỗ trợ A2UI v0.8 JSONL (v0.9/createSurface bị từ chối).

## Photos + videos (node camera)

Photos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # mặc định: cả hai mặt (2 dòng MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Video clips (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Lưu ý:

- Node phải **foregrounded** cho `canvas.*` và `camera.*` (các cuộc gọi nền trả về `NODE_BACKGROUND_UNAVAILABLE`).
- Thời lượng clip bị giới hạn (hiện tại `<= 60s`) để tránh payload base64 quá lớn.
- Android sẽ yêu cầu quyền `CAMERA`/`RECORD_AUDIO` khi có thể; quyền bị từ chối sẽ thất bại với `*_PERMISSION_REQUIRED`.

## Screen recordings (nodes)

Các node hỗ trợ `screen.record` (mp4). Ví dụ:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Lưu ý:

- `screen.record` phụ thuộc vào nền tảng node.
- Ghi màn hình bị giới hạn `<= 60s`.
- `--no-audio` tắt ghi âm micro trên các nền tảng hỗ trợ.
- Dùng `--screen <index>` để chọn màn hình khi có nhiều màn hình.

## Location (nodes)

Nodes cung cấp `location.get` khi Location được bật trong cài đặt.

CLI helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Lưu ý:

- Location **tắt mặc định**.
- “Always” yêu cầu quyền hệ thống; lấy dữ liệu nền là nỗ lực tốt nhất.
- Phản hồi bao gồm lat/lon, độ chính xác (mét), và timestamp.

## SMS (Android nodes)

Android nodes có thể cung cấp `sms.send` khi người dùng cấp quyền **SMS** và thiết bị hỗ trợ telephony.

Thực thi cấp thấp:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Lưu ý:

- Phải chấp nhận yêu cầu quyền trên thiết bị Android trước khi khả năng này được quảng cáo.
- Thiết bị chỉ có Wi-Fi không có telephony sẽ không quảng cáo `sms.send`.

## Android device + personal data commands

Android nodes có thể quảng cáo các nhóm lệnh bổ sung khi các khả năng tương ứng được bật.

Các nhóm có sẵn:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Ví dụ thực thi:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Lưu ý:

- Các lệnh chuyển động bị giới hạn bởi các cảm biến có sẵn.

## System commands (node host / mac node)

Node macOS cung cấp `system.run`, `system.notify`, và `system.execApprovals.get/set`.
Node host headless cung cấp `system.run`, `system.which`, và `system.execApprovals.get/set`.

Ví dụ:

```bash
openclaw nodes run --node <idOrNameOrIp> -- echo "Hello from mac node"
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
```

Lưu ý:

- `system.run` trả về stdout/stderr/exit code trong payload.
- `system.notify` tôn trọng trạng thái quyền thông báo trên ứng dụng macOS.
- Metadata `platform` / `deviceFamily` không được nhận dạng của node sử dụng danh sách cho phép mặc định bảo thủ loại trừ `system.run` và `system.which`. Nếu cần các lệnh này cho một nền tảng không xác định, thêm chúng rõ ràng qua `gateway.nodes.allowCommands`.
- `system.run` hỗ trợ `--cwd`, `--env KEY=VAL`, `--command-timeout`, và `--needs-screen-recording`.
- Đối với shell wrappers (`bash|sh|zsh ... -c/-lc`), các giá trị `--env` theo yêu cầu được giảm xuống danh sách cho phép rõ ràng (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Đối với các quyết định cho phép luôn trong chế độ danh sách cho phép, các wrapper dispatch đã biết (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) lưu trữ các đường dẫn thực thi bên trong thay vì đường dẫn wrapper. Nếu không an toàn để gỡ bỏ, không có mục danh sách cho phép nào được lưu tự động.
- Trên Windows node hosts trong chế độ danh sách cho phép, các chạy shell-wrapper qua `cmd.exe /c` yêu cầu phê duyệt (mục danh sách cho phép không tự động cho phép dạng wrapper).
- `system.notify` hỗ trợ `--priority <passive|active|timeSensitive>` và `--delivery <system|overlay|auto>`.
- Node hosts bỏ qua các ghi đè `PATH` và loại bỏ các khóa startup/shell nguy hiểm (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Nếu cần thêm các mục PATH, cấu hình môi trường dịch vụ node host (hoặc cài đặt công cụ ở các vị trí tiêu chuẩn) thay vì truyền `PATH` qua `--env`.
- Trên macOS node mode, `system.run` bị giới hạn bởi phê duyệt thực thi trong ứng dụng macOS (Settings → Exec approvals). Hỏi/danh sách cho phép/toàn bộ hoạt động giống như node host headless; các yêu cầu bị từ chối trả về `SYSTEM_RUN_DENIED`.
- Trên headless node host, `system.run` bị giới hạn bởi phê duyệt thực thi (`~/.openclaw/exec-approvals.json`).

## Exec node binding

Khi có nhiều nodes, có thể ràng buộc exec vào một node cụ thể. Điều này thiết lập node mặc định cho `exec host=node` (và có thể bị ghi đè theo agent).

Mặc định toàn cục:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Ghi đè theo agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Bỏ thiết lập để cho phép bất kỳ node nào:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Permissions map

Nodes có thể bao gồm một `permissions` map trong `node.list` / `node.describe`, được khóa theo tên quyền (ví dụ: `screenRecording`, `accessibility`) với các giá trị boolean (`true` = được cấp).

## Headless node host (cross-platform)

OpenClaw có thể chạy một **headless node host** (không UI) kết nối với Gateway WebSocket và cung cấp `system.run` / `system.which`. Điều này hữu ích trên Linux/Windows hoặc để chạy một node tối giản cùng với server.

Khởi động nó:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Lưu ý:

- Pairing vẫn cần thiết (Gateway sẽ hiển thị một yêu cầu pairing thiết bị).
- Node host lưu trữ id node, token, tên hiển thị, và thông tin kết nối gateway trong `~/.openclaw/node.json`.
- Phê duyệt thực thi được thực thi cục bộ qua `~/.openclaw/exec-approvals.json` (xem [Exec approvals](/tools/exec-approvals)).
- Trên macOS, headless node host thực thi `system.run` cục bộ theo mặc định. Đặt `OPENCLAW_NODE_EXEC_HOST=app` để định tuyến `system.run` qua host exec ứng dụng đồng hành; thêm `OPENCLAW_NODE_EXEC_FALLBACK=0` để yêu cầu host ứng dụng và thất bại nếu nó không khả dụng.
- Thêm `--tls` / `--tls-fingerprint` khi Gateway WS sử dụng TLS.

## Mac node mode

- Ứng dụng menubar macOS kết nối với WS server của Gateway như một node (vì vậy `openclaw nodes …` hoạt động trên Mac này).
- Ở chế độ remote, ứng dụng mở một SSH tunnel cho cổng Gateway và kết nối với `localhost`.\n