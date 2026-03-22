---
summary: "Hướng dẫn xử lý sự cố chuyên sâu cho gateway, channels, automation, nodes và browser"
read_when:
  - Trung tâm xử lý sự cố đã chỉ bạn đến đây để chẩn đoán sâu hơn
  - Cần các phần hướng dẫn dựa trên triệu chứng ổn định với lệnh chính xác
title: "Xử lý sự cố"
---

# Xử lý sự cố Gateway

Trang này là hướng dẫn chuyên sâu.
Bắt đầu từ [/help/troubleshooting](/help/troubleshooting) nếu muốn quy trình xử lý nhanh trước.

## Thứ tự lệnh cần chạy

Chạy các lệnh này theo thứ tự:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Dấu hiệu hoạt động tốt:

- `openclaw gateway status` hiển thị `Runtime: running` và `RPC probe: ok`.
- `openclaw doctor` không báo lỗi cấu hình/dịch vụ chặn.
- `openclaw channels status --probe` hiển thị các kênh đã kết nối/sẵn sàng.

## Anthropic 429 cần sử dụng thêm cho ngữ cảnh dài

Dùng khi log/lỗi bao gồm:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Kiểm tra:

- Model Anthropic Opus/Sonnet đã chọn có `params.context1m: true`.
- Credential Anthropic hiện tại không đủ điều kiện cho ngữ cảnh dài.
- Yêu cầu chỉ thất bại trên các phiên/model dài cần đường dẫn 1M beta.

Cách khắc phục:

1. Tắt `context1m` cho model đó để quay về cửa sổ ngữ cảnh bình thường.
2. Sử dụng API key Anthropic có billing, hoặc kích hoạt Anthropic Extra Usage trên tài khoản subscription.
3. Cấu hình model dự phòng để tiếp tục chạy khi yêu cầu ngữ cảnh dài của Anthropic bị từ chối.

Liên quan:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Không có phản hồi

Nếu channels hoạt động nhưng không có phản hồi, kiểm tra routing và policy trước khi kết nối lại.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Kiểm tra:

- Pairing đang chờ cho DM senders.
- Group mention gating (`requireMention`, `mentionPatterns`).
- Channel/group allowlist không khớp.

Dấu hiệu thường gặp:

- `drop guild message (mention required` → tin nhắn nhóm bị bỏ qua cho đến khi có mention.
- `pairing request` → sender cần phê duyệt.
- `blocked` / `allowlist` → sender/channel bị lọc bởi policy.

Liên quan:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

## Kết nối giao diện điều khiển Dashboard

Khi dashboard/control UI không kết nối được, kiểm tra URL, chế độ xác thực và giả định ngữ cảnh bảo mật.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Kiểm tra:

- URL probe và dashboard đúng.
- Chế độ xác thực/token không khớp giữa client và gateway.
- Sử dụng HTTP khi cần nhận diện thiết bị.

Dấu hiệu thường gặp:

- `device identity required` → ngữ cảnh không bảo mật hoặc thiếu xác thực thiết bị.
- `device nonce required` / `device nonce mismatch` → client không hoàn thành luồng xác thực thiết bị dựa trên thử thách (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → client ký payload sai (hoặc timestamp cũ) cho handshake hiện tại.
- `AUTH_TOKEN_MISMATCH` với `canRetryWithDeviceToken=true` → client có thể thử lại một lần với device token đã cache.
- `unauthorized` lặp lại sau khi thử lại → token chia sẻ/device token lệch; làm mới cấu hình token và phê duyệt/làm mới device token nếu cần.
- `gateway connect failed:` → host/port/url target sai.

### Bản đồ mã chi tiết xác thực nhanh

Sử dụng `error.details.code` từ phản hồi `connect` thất bại để chọn hành động tiếp theo:

| Mã chi tiết                  | Ý nghĩa                                                  | Hành động đề xuất                                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | Client không gửi token chia sẻ cần thiết.                 | Dán/đặt token trong client và thử lại. Đối với đường dẫn dashboard: `openclaw config get gateway.auth.token` sau đó dán vào cài đặt Control UI.                    |
| `AUTH_TOKEN_MISMATCH`        | Token chia sẻ không khớp với token xác thực gateway.     | Nếu `canRetryWithDeviceToken=true`, cho phép thử lại một lần. Nếu vẫn thất bại, chạy [token drift recovery checklist](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per-device đã cache bị lỗi thời hoặc bị thu hồi.  | Làm mới/phê duyệt lại device token bằng [devices CLI](/cli/devices), sau đó kết nối lại.                                                                           |
| `PAIRING_REQUIRED`           | Nhận diện thiết bị đã biết nhưng chưa được phê duyệt.    | Phê duyệt yêu cầu đang chờ: `openclaw devices list` sau đó `openclaw devices approve <requestId>`.                                                                 |

Kiểm tra di chuyển xác thực thiết bị v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Nếu log hiển thị lỗi nonce/ký, cập nhật client kết nối và xác minh:

1. chờ `connect.challenge`
2. ký payload ràng buộc thử thách
3. gửi `connect.params.device.nonce` với nonce thử thách tương tự

Liên quan:

- [/web/control-ui](/web/control-ui)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Dịch vụ Gateway không chạy

Dùng khi dịch vụ đã cài đặt nhưng tiến trình không duy trì.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep
```

Kiểm tra:

- `Runtime: stopped` với gợi ý thoát.
- Cấu hình dịch vụ không khớp (`Config (cli)` vs `Config (service)`).
- Xung đột cổng/người nghe.

Dấu hiệu thường gặp:

- `Gateway start blocked: set gateway.mode=local` → chế độ gateway local chưa bật. Khắc phục: đặt `gateway.mode="local"` trong cấu hình (hoặc chạy `openclaw configure`). Nếu chạy OpenClaw qua Podman bằng user `openclaw`, cấu hình nằm ở `~openclaw/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind không loopback mà không có token/mật khẩu.
- `another gateway instance is already listening` / `EADDRINUSE` → xung đột cổng.

Liên quan:

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## Tin nhắn không lưu thông khi channel đã kết nối

Nếu trạng thái channel đã kết nối nhưng tin nhắn không lưu thông, tập trung vào policy, quyền và quy tắc giao hàng cụ thể của channel.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Kiểm tra:

- Chính sách DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist nhóm và yêu cầu mention.
- Thiếu quyền/phạm vi API của channel.

Dấu hiệu thường gặp:

- `mention required` → tin nhắn bị bỏ qua bởi policy mention nhóm.
- `pairing` / dấu vết phê duyệt đang chờ → sender chưa được phê duyệt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → vấn đề xác thực/quyền của channel.

Liên quan:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

## Giao hàng cron và heartbeat

Nếu cron hoặc heartbeat không chạy hoặc không giao hàng, xác minh trạng thái scheduler trước, sau đó đến mục tiêu giao hàng.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Kiểm tra:

- Cron đã bật và có lần thức tiếp theo.
- Trạng thái lịch sử chạy job (`ok`, `skipped`, `error`).
- Lý do bỏ qua heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`).

Dấu hiệu thường gặp:

- `cron: scheduler disabled; jobs will not run automatically` → cron bị tắt.
- `cron: timer tick failed` → tick scheduler thất bại; kiểm tra lỗi file/log/runtime.
- `heartbeat skipped` với `reason=quiet-hours` → ngoài khung giờ hoạt động.
- `heartbeat: unknown accountId` → id tài khoản không hợp lệ cho mục tiêu giao hàng heartbeat.
- `heartbeat skipped` với `reason=dm-blocked` → mục tiêu heartbeat được giải quyết đến đích kiểu DM trong khi `agents.defaults.heartbeat.directPolicy` (hoặc ghi đè theo agent) được đặt là `block`.

Liên quan:

- [/automation/troubleshooting](/automation/troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## Công cụ node ghép đôi thất bại

Nếu node đã ghép đôi nhưng công cụ thất bại, cô lập trạng thái foreground, quyền và phê duyệt.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Kiểm tra:

- Node online với khả năng mong đợi.
- Quyền OS cho camera/mic/vị trí/màn hình.
- Trạng thái phê duyệt exec và allowlist.

Dấu hiệu thường gặp:

- `NODE_BACKGROUND_UNAVAILABLE` → ứng dụng node phải ở foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → thiếu quyền OS.
- `SYSTEM_RUN_DENIED: approval required` → phê duyệt exec đang chờ.
- `SYSTEM_RUN_DENIED: allowlist miss` → lệnh bị chặn bởi allowlist.

Liên quan:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## Công cụ trình duyệt thất bại

Dùng khi hành động công cụ trình duyệt thất bại dù gateway vẫn hoạt động tốt.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Kiểm tra:

- Đường dẫn thực thi trình duyệt hợp lệ.
- Khả năng tiếp cận profile CDP.
- Chrome local khả dụng cho `existing-session` / `user` profiles.

Dấu hiệu thường gặp:

- `Failed to start Chrome CDP on port` → tiến trình trình duyệt không khởi chạy được.
- `browser.executablePath not found` → đường dẫn cấu hình không hợp lệ.
- `No Chrome tabs found for profile="user"` → profile đính kèm Chrome MCP không có tab Chrome local mở.
- `Browser attachOnly is enabled ... not reachable` → profile chỉ đính kèm không có mục tiêu có thể tiếp cận.

Liên quan:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/browser](/tools/browser)

## Nếu bạn nâng cấp và có gì đó đột ngột hỏng

Hầu hết sự cố sau nâng cấp là do cấu hình lệch hoặc các mặc định nghiêm ngặt hơn được áp dụng.

### 1) Hành vi ghi đè Auth và URL thay đổi

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Cần kiểm tra:

- Nếu `gateway.mode=remote`, các lệnh CLI có thể đang nhắm đến remote trong khi dịch vụ local vẫn ổn.
- Các lệnh `--url` rõ ràng không dựa vào credential đã lưu.

Dấu hiệu thường gặp:

- `gateway connect failed:` → URL target sai.
- `unauthorized` → endpoint có thể tiếp cận nhưng xác thực sai.

### 2) Quy tắc bind và auth nghiêm ngặt hơn

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Cần kiểm tra:

- Bind không loopback (`lan`, `tailnet`, `custom`) cần cấu hình xác thực.
- Các khóa cũ như `gateway.token` không thay thế `gateway.auth.token`.

Dấu hiệu thường gặp:

- `refusing to bind gateway ... without auth` → bind+auth không khớp.
- `RPC probe: failed` trong khi runtime đang chạy → gateway sống nhưng không thể truy cập với auth/url hiện tại.

### 3) Trạng thái ghép đôi và nhận diện thiết bị thay đổi

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Cần kiểm tra:

- Phê duyệt thiết bị đang chờ cho dashboard/nodes.
- Phê duyệt pairing DM đang chờ sau khi policy hoặc nhận diện thay đổi.

Dấu hiệu thường gặp:

- `device identity required` → xác thực thiết bị chưa thỏa mãn.
- `pairing required` → sender/device cần được phê duyệt.

Nếu cấu hình dịch vụ và runtime vẫn không khớp sau khi kiểm tra, cài đặt lại metadata dịch vụ từ cùng thư mục profile/state:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Liên quan:

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)\n