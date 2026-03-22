---
summary: "Khám phá cách xử lý sự cố gateway, kênh, tự động hóa và node hiệu quả. Tối ưu hóa hệ thống của bạn ngay hôm nay."
read_when:
  - Trung tâm xử lý sự cố đã chỉ bạn đến đây để chẩn đoán sâu hơn
  - Bạn cần các phần hướng dẫn dựa trên triệu chứng ổn định với các lệnh chính xác
title: "Hướng Dẫn Xử Lý Sự Cố Gateway"
---

# Xử lý sự cố Gateway

Đây là hướng dẫn chuyên sâu. Nếu bạn muốn quy trình phân loại nhanh, hãy bắt đầu tại [/help/troubleshooting](/help/troubleshooting).

## Thứ tự lệnh

Chạy các lệnh này trước, theo thứ tự sau:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Dấu hiệu hoạt động bình thường:

- `openclaw gateway status` hiển thị `Runtime: running` và `RPC probe: ok`.
- `openclaw doctor` không báo cáo vấn đề cấu hình/dịch vụ nào gây cản trở.
- `openclaw channels status --probe` hiển thị các kênh đã kết nối/sẵn sàng.

## Anthropic 429 cần sử dụng thêm cho ngữ cảnh dài

Sử dụng khi nhật ký/lỗi bao gồm:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Tìm kiếm:

- Mô hình Anthropic Opus/Sonnet được chọn có `params.context1m: true`.
- Thông tin xác thực Anthropic hiện tại không đủ điều kiện cho việc sử dụng ngữ cảnh dài.
- Yêu cầu chỉ thất bại trong các phiên dài/chạy mô hình cần đường dẫn 1M beta.

Các tùy chọn khắc phục:

1. Vô hiệu hóa `context1m` cho mô hình đó để quay lại cửa sổ ngữ cảnh bình thường.
2. Sử dụng khóa API Anthropic có thanh toán, hoặc kích hoạt Anthropic Extra Usage trên tài khoản đăng ký.
3. Cấu hình các mô hình dự phòng để tiếp tục chạy khi yêu cầu ngữ cảnh dài của Anthropic bị từ chối.

Liên quan:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Không có phản hồi

Nếu các kênh đang hoạt động nhưng không có phản hồi, kiểm tra định tuyến và chính sách trước khi kết nối lại.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Tìm kiếm:

- Ghép đôi đang chờ xử lý cho người gửi DM.
- Chính sách nhắc nhóm (`requireMention`, `mentionPatterns`).
- Không khớp danh sách cho phép kênh/nhóm.

Dấu hiệu phổ biến:

- `drop guild message (mention required` → tin nhắn nhóm bị bỏ qua cho đến khi được nhắc.
- `pairing request` → người gửi cần được phê duyệt.
- `blocked` / `allowlist` → người gửi/kênh bị lọc bởi chính sách.

Liên quan:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

## Kết nối giao diện điều khiển Dashboard

Khi giao diện điều khiển/dashboard không kết nối được, hãy xác thực URL, chế độ xác thực và giả định ngữ cảnh bảo mật.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Tìm kiếm:

- URL kiểm tra và URL dashboard chính xác.
- Không khớp chế độ xác thực/token giữa client và gateway.
- Sử dụng HTTP khi cần nhận diện thiết bị.

Dấu hiệu phổ biến:

- `device identity required` → ngữ cảnh không bảo mật hoặc thiếu xác thực thiết bị.
- `device nonce required` / `device nonce mismatch` → client không hoàn thành luồng xác thực thiết bị dựa trên thử thách (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → client ký payload sai (hoặc dấu thời gian cũ) cho quá trình bắt tay hiện tại.
- `AUTH_TOKEN_MISMATCH` với `canRetryWithDeviceToken=true` → client có thể thử lại một lần với token thiết bị đã lưu trong bộ nhớ cache.
- lặp lại `unauthorized` sau lần thử lại đó → token chia sẻ/token thiết bị bị lệch; làm mới cấu hình token và phê duyệt/làm mới token thiết bị nếu cần.
- `gateway connect failed:` → sai host/port/url mục tiêu.

### Bản đồ nhanh mã chi tiết xác thực

Sử dụng `error.details.code` từ phản hồi `connect` thất bại để chọn hành động tiếp theo:

| Mã chi tiết                  | Ý nghĩa                                                  | Hành động đề xuất                                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Client không gửi token chia sẻ cần thiết.                 | Dán/đặt token trong client và thử lại. Đối với đường dẫn dashboard: `openclaw config get gateway.auth.token` sau đó dán vào cài đặt Control UI.                          |
| `AUTH_TOKEN_MISMATCH`        | Token chia sẻ không khớp với token xác thực gateway.     | Nếu `canRetryWithDeviceToken=true`, cho phép thử lại một lần. Nếu vẫn thất bại, chạy [danh sách kiểm tra khôi phục lệch token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token thiết bị lưu trong bộ nhớ cache đã cũ hoặc bị thu hồi. | Làm mới/phê duyệt lại token thiết bị bằng [CLI thiết bị](/cli/devices), sau đó kết nối lại.                                                                                    |
| `PAIRING_REQUIRED`           | Nhận diện thiết bị đã biết nhưng chưa được phê duyệt cho vai trò này. | Phê duyệt yêu cầu đang chờ: `openclaw devices list` sau đó `openclaw devices approve <requestId>`.                                                                        |

Kiểm tra di chuyển xác thực thiết bị v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Nếu nhật ký hiển thị lỗi nonce/chữ ký, cập nhật client kết nối và xác minh:

1. chờ `connect.challenge`
2. ký payload ràng buộc thử thách
3. gửi `connect.params.device.nonce` với nonce thử thách tương tự

Liên quan:

- [/web/control-ui](/web/control-ui)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Dịch vụ Gateway không chạy

Sử dụng khi dịch vụ đã được cài đặt nhưng quá trình không duy trì hoạt động.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep
```

Tìm kiếm:

- `Runtime: stopped` với gợi ý thoát.
- Không khớp cấu hình dịch vụ (`Config (cli)` so với `Config (service)`).
- Xung đột cổng/người nghe.

Dấu hiệu phổ biến:

- `Gateway start blocked: set gateway.mode=local` → chế độ gateway cục bộ chưa được kích hoạt. Khắc phục: đặt `gateway.mode="local"` trong cấu hình của bạn (hoặc chạy `openclaw configure`). Nếu bạn đang chạy OpenClaw qua Podman bằng người dùng `openclaw` chuyên dụng, cấu hình nằm tại `~openclaw/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → không ràng buộc loopback mà không có token/mật khẩu.
- `another gateway instance is already listening` / `EADDRINUSE` → xung đột cổng.

Liên quan:

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## Tin nhắn kênh đã kết nối không lưu thông

Nếu trạng thái kênh đã kết nối nhưng luồng tin nhắn bị ngừng, tập trung vào chính sách, quyền và quy tắc phân phối cụ thể của kênh.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Tìm kiếm:

- Chính sách DM (`pairing`, `allowlist`, `open`, `disabled`).
- Danh sách cho phép nhóm và yêu cầu nhắc.
- Thiếu quyền/phạm vi API kênh.

Dấu hiệu phổ biến:

- `mention required` → tin nhắn bị bỏ qua bởi chính sách nhắc nhóm.
- `pairing` / dấu vết phê duyệt đang chờ xử lý → người gửi chưa được phê duyệt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → vấn đề xác thực/quyền kênh.

Liên quan:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

## Giao hàng cron và nhịp tim

Nếu cron hoặc nhịp tim không chạy hoặc không giao hàng, hãy xác minh trạng thái bộ lập lịch trước, sau đó là mục tiêu giao hàng.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Tìm kiếm:

- Cron được kích hoạt và lần thức tiếp theo có mặt.
- Trạng thái lịch sử chạy công việc (`ok`, `skipped`, `error`).
- Lý do bỏ qua nhịp tim (`quiet-hours`, `requests-in-flight`, `alerts-disabled`).

Dấu hiệu phổ biến:

- `cron: scheduler disabled; jobs will not run automatically` → cron bị vô hiệu hóa.
- `cron: timer tick failed` → tick bộ lập lịch thất bại; kiểm tra lỗi file/nhật ký/thời gian chạy.
- `heartbeat skipped` với `reason=quiet-hours` → ngoài cửa sổ giờ hoạt động.
- `heartbeat: unknown accountId` → id tài khoản không hợp lệ cho mục tiêu giao hàng nhịp tim.
- `heartbeat skipped` với `reason=dm-blocked` → mục tiêu nhịp tim được giải quyết thành đích kiểu DM trong khi `agents.defaults.heartbeat.directPolicy` (hoặc ghi đè theo agent) được đặt thành `block`.

Liên quan:

- [/automation/troubleshooting](/automation/troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## Công cụ node ghép đôi thất bại

Nếu một node đã được ghép đôi nhưng công cụ thất bại, hãy cô lập trạng thái nền trước, quyền và phê duyệt.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Tìm kiếm:

- Node trực tuyến với các khả năng mong đợi.
- Cấp quyền hệ điều hành cho camera/mic/vị trí/màn hình.
- Trạng thái phê duyệt thực thi và danh sách cho phép.

Dấu hiệu phổ biến:

- `NODE_BACKGROUND_UNAVAILABLE` → ứng dụng node phải ở nền trước.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → thiếu quyền hệ điều hành.
- `SYSTEM_RUN_DENIED: approval required` → phê duyệt thực thi đang chờ xử lý.
- `SYSTEM_RUN_DENIED: allowlist miss` → lệnh bị chặn bởi danh sách cho phép.

Liên quan:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## Công cụ trình duyệt thất bại

Sử dụng khi các hành động công cụ trình duyệt thất bại mặc dù gateway tự nó vẫn hoạt động tốt.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Tìm kiếm:

- Đường dẫn thực thi trình duyệt hợp lệ.
- Khả năng truy cập hồ sơ CDP.
- Khả dụng Chrome cục bộ cho các hồ sơ `existing-session` / `user`.

Dấu hiệu phổ biến:

- `Failed to start Chrome CDP on port` → quá trình trình duyệt không khởi động được.
- `browser.executablePath not found` → đường dẫn cấu hình không hợp lệ.
- `No Chrome tabs found for profile="user"` → hồ sơ đính kèm Chrome MCP không có tab Chrome cục bộ mở.
- `Browser attachOnly is enabled ... not reachable` → hồ sơ chỉ đính kèm không có mục tiêu có thể truy cập.

Liên quan:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/browser](/tools/browser)

## Nếu bạn đã nâng cấp và có gì đó đột ngột bị hỏng

Hầu hết các sự cố sau nâng cấp là do lệch cấu hình hoặc các mặc định nghiêm ngặt hơn hiện đang được thực thi.

### 1) Hành vi ghi đè xác thực và URL đã thay đổi

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Những gì cần kiểm tra:

- Nếu `gateway.mode=remote`, các cuộc gọi CLI có thể đang nhắm mục tiêu từ xa trong khi dịch vụ cục bộ của bạn vẫn ổn.
- Các cuộc gọi `--url` rõ ràng không quay lại thông tin xác thực đã lưu.

Dấu hiệu phổ biến:

- `gateway connect failed:` → sai mục tiêu URL.
- `unauthorized` → điểm cuối có thể truy cập nhưng xác thực sai.

### 2) Các rào cản ràng buộc và xác thực nghiêm ngặt hơn

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Những gì cần kiểm tra:

- Các ràng buộc không loopback (`lan`, `tailnet`, `custom`) cần cấu hình xác thực.
- Các khóa cũ như `gateway.token` không thay thế `gateway.auth.token`.

Dấu hiệu phổ biến:

- `refusing to bind gateway ... without auth` → không khớp ràng buộc+xác thực.
- `RPC probe: failed` trong khi thời gian chạy đang hoạt động → gateway sống nhưng không thể truy cập với xác thực/url hiện tại.

### 3) Trạng thái ghép đôi và nhận diện thiết bị đã thay đổi

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Những gì cần kiểm tra:

- Phê duyệt thiết bị đang chờ xử lý cho dashboard/nodes.
- Phê duyệt ghép đôi DM đang chờ xử lý sau khi thay đổi chính sách hoặc nhận diện.

Dấu hiệu phổ biến:

- `device identity required` → xác thực thiết bị không được thỏa mãn.
- `pairing required` → người gửi/thiết bị phải được phê duyệt.

Nếu cấu hình dịch vụ và thời gian chạy vẫn không đồng ý sau khi kiểm tra, cài đặt lại siêu dữ liệu dịch vụ từ cùng một thư mục hồ sơ/trạng thái:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Liên quan:

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
