---
summary: "Khám phá cách chạy và truy vấn OpenClaw Gateway CLI hiệu quả. Tìm hiểu chi tiết để tối ưu hóa hệ thống của bạn."
read_when:
  - Chạy Gateway từ CLI (dev hoặc server)
  - Gỡ lỗi xác thực Gateway, chế độ bind và kết nối
  - Khám phá gateway qua Bonjour (LAN + tailnet)
title: "Hướng Dẫn Sử Dụng OpenClaw Gateway CLI"
---

# Gateway CLI

Gateway là máy chủ WebSocket của OpenClaw (channels, nodes, sessions, hooks).

Các lệnh con trong trang này nằm dưới `openclaw gateway …`.

Tài liệu liên quan:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## Chạy Gateway

Chạy một tiến trình Gateway cục bộ:

```bash
openclaw gateway
```

Alias chạy nền trước:

```bash
openclaw gateway run
```

Lưu ý:

- Mặc định, Gateway sẽ từ chối khởi động trừ khi `gateway.mode=local` được thiết lập trong `~/.openclaw/openclaw.json`. Sử dụng `--allow-unconfigured` cho các lần chạy ad-hoc/dev.
- Việc bind ngoài loopback mà không có xác thực sẽ bị chặn (để đảm bảo an toàn).
- `SIGUSR1` kích hoạt khởi động lại trong tiến trình khi được ủy quyền (`commands.restart` được bật mặc định; đặt `commands.restart: false` để chặn khởi động lại thủ công, trong khi công cụ/config gateway vẫn được phép áp dụng/cập nhật).
- Các handler `SIGINT`/`SIGTERM` dừng tiến trình gateway, nhưng không khôi phục bất kỳ trạng thái terminal tùy chỉnh nào. Nếu bạn bọc CLI với TUI hoặc đầu vào chế độ thô, hãy khôi phục terminal trước khi thoát.

### Tùy chọn

- `--port <port>`: cổng WebSocket (mặc định lấy từ config/env; thường là `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: chế độ bind listener.
- `--auth <token|password>`: ghi đè chế độ xác thực.
- `--token <token>`: ghi đè token (cũng thiết lập `OPENCLAW_GATEWAY_TOKEN` cho tiến trình).
- `--password <password>`: ghi đè mật khẩu. Cảnh báo: mật khẩu inline có thể bị lộ trong danh sách tiến trình cục bộ.
- `--password-file <path>`: đọc mật khẩu gateway từ một file.
- `--tailscale <off|serve|funnel>`: mở Gateway qua Tailscale.
- `--tailscale-reset-on-exit`: đặt lại cấu hình serve/funnel Tailscale khi tắt.
- `--allow-unconfigured`: cho phép khởi động gateway mà không cần `gateway.mode=local` trong config.
- `--dev`: tạo một config dev + workspace nếu thiếu (bỏ qua BOOTSTRAP.md).
- `--reset`: đặt lại config dev + thông tin xác thực + sessions + workspace (yêu cầu `--dev`).
- `--force`: giết bất kỳ listener nào đang tồn tại trên cổng đã chọn trước khi bắt đầu.
- `--verbose`: log chi tiết.
- `--claude-cli-logs`: chỉ hiển thị log claude-cli trong console (và bật stdout/stderr của nó).
- `--ws-log <auto|full|compact>`: kiểu log websocket (mặc định `auto`).
- `--compact`: alias cho `--ws-log compact`.
- `--raw-stream`: log sự kiện stream model thô vào jsonl.
- `--raw-stream-path <path>`: đường dẫn jsonl stream thô.

## Truy vấn Gateway đang chạy

Tất cả các lệnh truy vấn sử dụng WebSocket RPC.

Chế độ đầu ra:

- Mặc định: dễ đọc cho con người (có màu trong TTY).
- `--json`: JSON dễ đọc cho máy (không có kiểu dáng/spinner).
- `--no-color` (hoặc `NO_COLOR=1`): tắt ANSI nhưng vẫn giữ bố cục dễ đọc cho con người.

Tùy chọn chung (nếu được hỗ trợ):

- `--url <url>`: URL WebSocket của Gateway.
- `--token <token>`: token của Gateway.
- `--password <password>`: mật khẩu của Gateway.
- `--timeout <ms>`: thời gian chờ/ngân sách (thay đổi theo lệnh).
- `--expect-final`: chờ phản hồi “cuối cùng” (gọi agent).

Lưu ý: khi bạn thiết lập `--url`, CLI không sử dụng dự phòng từ config hoặc thông tin xác thực môi trường. Phải truyền `--token` hoặc `--password` rõ ràng. Thiếu thông tin xác thực rõ ràng là một lỗi.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway status`

`gateway status` hiển thị dịch vụ Gateway (launchd/systemd/schtasks) cùng với một tùy chọn kiểm tra RPC.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Tùy chọn:

- `--url <url>`: ghi đè URL kiểm tra.
- `--token <token>`: xác thực token cho kiểm tra.
- `--password <password>`: xác thực mật khẩu cho kiểm tra.
- `--timeout <ms>`: thời gian chờ kiểm tra (mặc định `10000`).
- `--no-probe`: bỏ qua kiểm tra RPC (chỉ xem dịch vụ).
- `--deep`: quét cả các dịch vụ cấp hệ thống.
- `--require-rpc`: thoát với mã khác không khi kiểm tra RPC thất bại. Không thể kết hợp với `--no-probe`.

Lưu ý:

- `gateway status` giải quyết các SecretRefs xác thực được cấu hình cho kiểm tra xác thực khi có thể.
- Nếu một SecretRef xác thực cần thiết không được giải quyết trong đường dẫn lệnh này, `gateway status --json` báo cáo `rpc.authWarning` khi kết nối/xác thực kiểm tra thất bại; truyền `--token`/`--password` rõ ràng hoặc giải quyết nguồn bí mật trước.
- Nếu kiểm tra thành công, cảnh báo auth-ref chưa giải quyết sẽ bị ẩn để tránh dương tính giả.
- Sử dụng `--require-rpc` trong các script và tự động hóa khi một dịch vụ đang lắng nghe là không đủ và bạn cần Gateway RPC tự nó phải khỏe mạnh.
- Trên các cài đặt Linux systemd, kiểm tra drift xác thực dịch vụ đọc cả giá trị `Environment=` và `EnvironmentFile=` từ đơn vị (bao gồm `%h`, đường dẫn được trích dẫn, nhiều file và các file `-` tùy chọn).

### `gateway probe`

`gateway probe` là lệnh “debug mọi thứ”. Nó luôn kiểm tra:

- gateway từ xa được cấu hình của bạn (nếu có), và
- localhost (loopback) **ngay cả khi từ xa đã được cấu hình**.

Nếu nhiều gateway có thể truy cập, nó sẽ in tất cả. Nhiều gateway được hỗ trợ khi bạn sử dụng các profile/cổng cách ly (ví dụ: một rescue bot), nhưng hầu hết các cài đặt vẫn chỉ chạy một gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Diễn giải:

- `Reachable: yes` nghĩa là ít nhất một mục tiêu đã chấp nhận kết nối WebSocket.
- `RPC: ok` nghĩa là các cuộc gọi RPC chi tiết (`health`/`status`/`system-presence`/`config.get`) cũng thành công.
- `RPC: limited - missing scope: operator.read` nghĩa là kết nối thành công nhưng RPC chi tiết bị giới hạn phạm vi. Điều này được báo cáo là khả năng truy cập **suy giảm**, không phải thất bại hoàn toàn.
- Mã thoát là khác không chỉ khi không có mục tiêu nào được kiểm tra có thể truy cập.

Ghi chú JSON (`--json`):

- Cấp cao nhất:
  - `ok`: ít nhất một mục tiêu có thể truy cập.
  - `degraded`: ít nhất một mục tiêu có RPC chi tiết bị giới hạn phạm vi.
- Mỗi mục tiêu (`targets[].connect`):
  - `ok`: khả năng truy cập sau khi kết nối + phân loại suy giảm.
  - `rpcOk`: thành công RPC chi tiết đầy đủ.
  - `scopeLimited`: RPC chi tiết thất bại do thiếu phạm vi operator.

#### Remote over SSH (tương đương ứng dụng Mac)

Chế độ “Remote over SSH” của ứng dụng macOS sử dụng một port-forward cục bộ để gateway từ xa (có thể chỉ được bind đến loopback) trở nên có thể truy cập tại `ws://127.0.0.1:<port>`.

Tương đương CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Tùy chọn:

- `--ssh <target>`: `user@host` hoặc `user@host:port` (cổng mặc định là `22`).
- `--ssh-identity <path>`: file danh tính.
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
- Khi xác thực token yêu cầu một token và `gateway.auth.token` được quản lý bởi SecretRef, `gateway install` xác nhận rằng SecretRef có thể giải quyết nhưng không lưu trữ token đã giải quyết vào metadata môi trường dịch vụ.
- Nếu xác thực token yêu cầu một token và SecretRef token được cấu hình không được giải quyết, cài đặt sẽ thất bại thay vì lưu trữ dự phòng plaintext.
- Đối với xác thực mật khẩu trên `gateway run`, ưu tiên `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, hoặc `gateway.auth.password` được hỗ trợ bởi SecretRef hơn là `--password` inline.
- Trong chế độ xác thực suy luận, chỉ shell `OPENCLAW_GATEWAY_PASSWORD`/`CLAWDBOT_GATEWAY_PASSWORD` không nới lỏng yêu cầu token cài đặt; sử dụng cấu hình bền vững (`gateway.auth.password` hoặc config `env`) khi cài đặt một dịch vụ được quản lý.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được thiết lập, cài đặt sẽ bị chặn cho đến khi chế độ được thiết lập rõ ràng.
- Các lệnh vòng đời chấp nhận `--json` cho scripting.

## Khám phá gateway (Bonjour)

`gateway discover` quét các beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): chọn một domain (ví dụ: `openclaw.internal.`) và thiết lập DNS phân chia + một máy chủ DNS; xem [/gateway/bonjour](/gateway/bonjour)

Chỉ các gateway có khám phá Bonjour được bật (mặc định) mới quảng bá beacon.

Các bản ghi khám phá Wide-Area bao gồm (TXT):

- `role` (gợi ý vai trò gateway)
- `transport` (gợi ý transport, ví dụ: `gateway`)
- `gatewayPort` (cổng WebSocket, thường là `18789`)
- `sshPort` (cổng SSH; mặc định là `22` nếu không có)
- `tailnetDns` (hostname MagicDNS, khi có)
- `gatewayTls` / `gatewayTlsSha256` (TLS được bật + dấu vân tay chứng chỉ)
- `cliPath` (gợi ý tùy chọn cho cài đặt từ xa)

### `gateway discover`

```bash
openclaw gateway discover
```

Tùy chọn:

- `--timeout <ms>`: thời gian chờ mỗi lệnh (duyệt/giải quyết); mặc định `2000`.
- `--json`: đầu ra dễ đọc cho máy (cũng tắt kiểu dáng/spinner).

Ví dụ:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```
