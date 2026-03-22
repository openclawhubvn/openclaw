---
summary: "OpenClaw Gateway CLI (`openclaw gateway`) — chạy, truy vấn và khám phá gateways"
read_when:
  - Chạy Gateway từ CLI (dev hoặc server)
  - Debug Gateway auth, bind modes và kết nối
  - Khám phá gateways qua Bonjour (LAN + tailnet)
title: "gateway"
---

# Gateway CLI

Gateway là WebSocket server của OpenClaw (channels, nodes, sessions, hooks).

Các subcommand trong trang này nằm dưới `openclaw gateway …`.

Tài liệu liên quan:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## Chạy Gateway

Chạy một tiến trình Gateway local:

```bash
openclaw gateway
```

Alias chạy foreground:

```bash
openclaw gateway run
```

Lưu ý:

- Mặc định, Gateway từ chối khởi động trừ khi `gateway.mode=local` được thiết lập trong `~/.openclaw/openclaw.json`. Dùng `--allow-unconfigured` cho các lần chạy ad-hoc/dev.
- Bind ngoài loopback mà không có auth bị chặn (an toàn).
- `SIGUSR1` kích hoạt restart trong tiến trình khi được phép (`commands.restart` bật mặc định; đặt `commands.restart: false` để chặn restart thủ công, trong khi tool/config gateway vẫn được phép áp dụng/cập nhật).
- Handlers `SIGINT`/`SIGTERM` dừng tiến trình gateway, nhưng không khôi phục trạng thái terminal tùy chỉnh. Nếu bọc CLI với TUI hoặc input raw-mode, khôi phục terminal trước khi thoát.

### Tùy chọn

- `--port <port>`: Cổng WebSocket (mặc định từ config/env; thường là `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: chế độ bind listener.
- `--auth <token|password>`: ghi đè chế độ auth.
- `--token <token>`: ghi đè token (cũng thiết lập `OPENCLAW_GATEWAY_TOKEN` cho tiến trình).
- `--password <password>`: ghi đè password. Cảnh báo: password inline có thể bị lộ trong danh sách tiến trình local.
- `--password-file <path>`: đọc password gateway từ file.
- `--tailscale <off|serve|funnel>`: expose Gateway qua Tailscale.
- `--tailscale-reset-on-exit`: reset cấu hình serve/funnel Tailscale khi tắt.
- `--allow-unconfigured`: cho phép khởi động gateway mà không có `gateway.mode=local` trong config.
- `--dev`: tạo config dev + workspace nếu thiếu (bỏ qua BOOTSTRAP.md).
- `--reset`: reset config dev + credentials + sessions + workspace (yêu cầu `--dev`).
- `--force`: kill bất kỳ listener nào đang tồn tại trên cổng đã chọn trước khi khởi động.
- `--verbose`: log chi tiết.
- `--claude-cli-logs`: chỉ hiển thị log claude-cli trong console (và bật stdout/stderr của nó).
- `--ws-log <auto|full|compact>`: kiểu log websocket (mặc định `auto`).
- `--compact`: alias cho `--ws-log compact`.
- `--raw-stream`: log sự kiện stream model raw vào jsonl.
- `--raw-stream-path <path>`: đường dẫn jsonl stream raw.

## Truy vấn Gateway đang chạy

Tất cả lệnh truy vấn dùng WebSocket RPC.

Chế độ output:

- Mặc định: dễ đọc cho con người (có màu trong TTY).
- `--json`: JSON dễ đọc cho máy (không có styling/spinner).
- `--no-color` (hoặc `NO_COLOR=1`): tắt ANSI nhưng giữ layout cho con người.

Tùy chọn chung (nếu hỗ trợ):

- `--url <url>`: URL WebSocket Gateway.
- `--token <token>`: Token Gateway.
- `--password <password>`: Password Gateway.
- `--timeout <ms>`: timeout/budget (thay đổi theo lệnh).
- `--expect-final`: chờ phản hồi “final” (agent calls).

Lưu ý: khi thiết lập `--url`, CLI không fallback vào config hoặc environment credentials. Phải truyền `--token` hoặc `--password` rõ ràng. Thiếu credentials rõ ràng là lỗi.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway status`

`gateway status` hiển thị dịch vụ Gateway (launchd/systemd/schtasks) cùng với một probe RPC tùy chọn.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Tùy chọn:

- `--url <url>`: ghi đè URL probe.
- `--token <token>`: auth token cho probe.
- `--password <password>`: auth password cho probe.
- `--timeout <ms>`: timeout probe (mặc định `10000`).
- `--no-probe`: bỏ qua probe RPC (chỉ xem dịch vụ).
- `--deep`: quét cả các dịch vụ cấp hệ thống.
- `--require-rpc`: thoát non-zero khi probe RPC thất bại. Không thể kết hợp với `--no-probe`.

Lưu ý:

- `gateway status` giải quyết SecretRefs auth đã cấu hình cho probe auth khi có thể.
- Nếu một SecretRef auth cần thiết không được giải quyết trong đường dẫn lệnh này, `gateway status --json` báo cáo `rpc.authWarning` khi kết nối/auth probe thất bại; truyền `--token`/`--password` rõ ràng hoặc giải quyết nguồn secret trước.
- Nếu probe thành công, cảnh báo auth-ref chưa giải quyết bị ẩn để tránh false positives.
- Dùng `--require-rpc` trong script và tự động hóa khi một dịch vụ lắng nghe là chưa đủ và cần Gateway RPC hoạt động tốt.
- Trên các cài đặt Linux systemd, kiểm tra drift auth dịch vụ đọc cả giá trị `Environment=` và `EnvironmentFile=` từ unit (bao gồm `%h`, đường dẫn có dấu ngoặc kép, nhiều file, và file `-` tùy chọn).

### `gateway probe`

`gateway probe` là lệnh “debug mọi thứ”. Nó luôn probe:

- gateway remote đã cấu hình (nếu có), và
- localhost (loopback) **ngay cả khi remote đã được cấu hình**.

Nếu nhiều gateway có thể truy cập, nó in tất cả. Hỗ trợ nhiều gateway khi dùng các profile/port cách ly (ví dụ, rescue bot), nhưng hầu hết cài đặt vẫn chạy một gateway duy nhất.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Diễn giải:

- `Reachable: yes` nghĩa là ít nhất một mục tiêu chấp nhận kết nối WebSocket.
- `RPC: ok` nghĩa là các cuộc gọi RPC chi tiết (`health`/`status`/`system-presence`/`config.get`) cũng thành công.
- `RPC: limited - missing scope: operator.read` nghĩa là kết nối thành công nhưng RPC chi tiết bị giới hạn scope. Điều này được báo cáo là khả năng truy cập **giảm sút**, không phải thất bại hoàn toàn.
- Mã thoát là non-zero chỉ khi không có mục tiêu nào được probe có thể truy cập.

Ghi chú JSON (`--json`):

- Cấp cao nhất:
  - `ok`: ít nhất một mục tiêu có thể truy cập.
  - `degraded`: ít nhất một mục tiêu có RPC chi tiết bị giới hạn scope.
- Mỗi mục tiêu (`targets[].connect`):
  - `ok`: khả năng truy cập sau khi kết nối + phân loại giảm sút.
  - `rpcOk`: thành công RPC chi tiết đầy đủ.
  - `scopeLimited`: RPC chi tiết thất bại do thiếu scope operator.

#### Remote qua SSH (tương đương app Mac)

Chế độ “Remote qua SSH” của app macOS dùng port-forward local để gateway remote (có thể chỉ bind loopback) trở nên có thể truy cập tại `ws://127.0.0.1:<port>`.

Tương đương CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Tùy chọn:

- `--ssh <target>`: `user@host` hoặc `user@host:port` (port mặc định là `22`).
- `--ssh-identity <path>`: file identity.
- `--ssh-auto`: chọn host gateway đầu tiên được phát hiện làm mục tiêu SSH (chỉ LAN/WAB).

Cấu hình (tùy chọn, dùng làm mặc định):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Trợ giúp RPC cấp thấp.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

## Quản lý dịch vụ Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Lưu ý:

- `gateway install` hỗ trợ `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Khi auth token yêu cầu token và `gateway.auth.token` được quản lý bởi SecretRef, `gateway install` xác thực rằng SecretRef có thể giải quyết nhưng không lưu trữ token đã giải quyết vào metadata môi trường dịch vụ.
- Nếu auth token yêu cầu token và SecretRef token đã cấu hình không được giải quyết, cài đặt thất bại thay vì lưu trữ plaintext fallback.
- Đối với auth password trên `gateway run`, ưu tiên `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, hoặc `gateway.auth.password` được hỗ trợ bởi SecretRef hơn là `--password` inline.
- Trong chế độ auth suy luận, chỉ `OPENCLAW_GATEWAY_PASSWORD`/`CLAWDBOT_GATEWAY_PASSWORD` shell không nới lỏng yêu cầu token cài đặt; dùng config bền vững (`gateway.auth.password` hoặc config `env`) khi cài đặt dịch vụ được quản lý.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` được cấu hình và `gateway.auth.mode` chưa được thiết lập, cài đặt bị chặn cho đến khi chế độ được thiết lập rõ ràng.
- Các lệnh vòng đời chấp nhận `--json` cho scripting.

## Khám phá gateways (Bonjour)

`gateway discover` quét các beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): chọn một domain (ví dụ: `openclaw.internal.`) và thiết lập split DNS + một DNS server; xem [/gateway/bonjour](/gateway/bonjour)

Chỉ các gateway có khám phá Bonjour bật (mặc định) mới quảng cáo beacon.

Các bản ghi khám phá Wide-Area bao gồm (TXT):

- `role` (gợi ý vai trò gateway)
- `transport` (gợi ý transport, ví dụ `gateway`)
- `gatewayPort` (cổng WebSocket, thường là `18789`)
- `sshPort` (cổng SSH; mặc định là `22` nếu không có)
- `tailnetDns` (hostname MagicDNS, khi có)
- `gatewayTls` / `gatewayTlsSha256` (TLS bật + fingerprint cert)
- `cliPath` (gợi ý tùy chọn cho cài đặt remote)

### `gateway discover`

```bash
openclaw gateway discover
```

Tùy chọn:

- `--timeout <ms>`: timeout mỗi lệnh (browse/resolve); mặc định `2000`.
- `--json`: output dễ đọc cho máy (cũng tắt styling/spinner).

Ví dụ:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```\n