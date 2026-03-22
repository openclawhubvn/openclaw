# `openclaw security`

Công cụ bảo mật (kiểm tra + sửa lỗi tùy chọn).

Liên quan:

- Hướng dẫn bảo mật: [Security](/gateway/security)

## Kiểm tra

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Kiểm tra sẽ cảnh báo khi nhiều người gửi DM dùng chung session chính và khuyến nghị chế độ DM an toàn: `session.dmScope="per-channel-peer"` (hoặc `per-account-channel-peer` cho kênh nhiều tài khoản) để bảo vệ hộp thư chung. Không khuyến khích dùng chung Gateway cho các operator không tin tưởng nhau; nên tách biệt bằng các gateway riêng (hoặc người dùng/host OS riêng).

Công cụ cũng phát hiện `security.trust_model.multi_user_heuristic` khi cấu hình cho thấy khả năng có người dùng chung (như chính sách DM/mở nhóm, cấu hình mục tiêu nhóm, hoặc quy tắc người gửi wildcard) và nhắc nhở rằng OpenClaw mặc định là mô hình tin cậy cá nhân. Với thiết lập người dùng chung, nên sandbox tất cả session, giới hạn truy cập filesystem theo workspace, và không để thông tin cá nhân/nhạy cảm trong runtime đó.

Cảnh báo khi dùng mô hình nhỏ (`<=300B`) mà không sandbox và có công cụ web/browser bật. Với webhook ingress, cảnh báo khi `hooks.token` dùng lại token Gateway, khi `hooks.defaultSessionKey` không được đặt, khi `hooks.allowedAgentIds` không giới hạn, khi cho phép ghi đè `sessionKey` mà không có `hooks.allowedSessionKeyPrefixes`.

Cảnh báo khi cấu hình Docker sandbox mà chế độ sandbox tắt, khi `gateway.nodes.denyCommands` dùng mẫu không hiệu quả/không rõ (chỉ khớp tên lệnh node chính xác, không lọc shell-text), khi `gateway.nodes.allowCommands` bật lệnh node nguy hiểm, khi `tools.profile="minimal"` bị ghi đè bởi profile công cụ agent, khi nhóm mở phơi bày công cụ runtime/filesystem mà không có sandbox/workspace bảo vệ, và khi công cụ plugin mở rộng có thể truy cập dưới chính sách công cụ dễ dãi.

Cảnh báo `gateway.allowRealIpFallback=true` (nguy cơ giả mạo header nếu proxy cấu hình sai) và `discovery.mdns.mode="full"` (rò rỉ metadata qua mDNS TXT records). Cảnh báo khi sandbox browser dùng mạng Docker `bridge` mà không có `sandbox.browser.cdpSourceRange`. Cảnh báo chế độ mạng Docker sandbox nguy hiểm (bao gồm `host` và `container:*` namespace joins).

Cảnh báo khi container Docker sandbox browser hiện tại thiếu/nhãn hash cũ (ví dụ container trước khi di chuyển thiếu `openclaw.browserConfigEpoch`) và khuyến nghị `openclaw sandbox recreate --browser --all`. Cảnh báo khi ghi chép cài đặt plugin/hook dựa trên npm không được ghim, thiếu metadata toàn vẹn, hoặc lệch so với phiên bản package hiện tại.

Cảnh báo khi allowlist kênh dựa vào tên/email/tag có thể thay đổi thay vì ID ổn định (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC scopes nếu có). Cảnh báo khi `gateway.auth.mode="none"` làm Gateway HTTP APIs có thể truy cập mà không cần shared secret (`/tools/invoke` và bất kỳ endpoint `/v1/*` nào được bật).

Các cài đặt có tiền tố `dangerous`/`dangerously` là các ghi đè operator khẩn cấp; bật một cái không phải là báo cáo lỗ hổng bảo mật. Để xem danh sách đầy đủ các tham số nguy hiểm, xem phần "Insecure or dangerous flags summary" trong [Security](/gateway/security).

Hành vi SecretRef:

- `security audit` giải quyết SecretRefs hỗ trợ ở chế độ chỉ đọc cho các đường dẫn mục tiêu.
- Nếu SecretRef không có sẵn trong đường dẫn lệnh hiện tại, kiểm tra tiếp tục và báo cáo `secretDiagnostics` (thay vì crash).
- `--token` và `--password` chỉ ghi đè xác thực deep-probe cho lần gọi lệnh đó; không ghi đè cấu hình hoặc ánh xạ SecretRef.

## JSON output

Dùng `--json` cho kiểm tra CI/chính sách:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Nếu kết hợp `--fix` và `--json`, output bao gồm cả hành động sửa lỗi và báo cáo cuối cùng:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` thay đổi gì

`--fix` áp dụng các sửa lỗi an toàn, xác định:

- chuyển `groupPolicy="open"` thành `groupPolicy="allowlist"` (bao gồm các biến thể tài khoản trong các kênh được hỗ trợ)
- đặt `logging.redactSensitive` từ `"off"` thành `"tools"`
- siết chặt quyền cho state/config và các file nhạy cảm thông thường (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session `*.jsonl`)

`--fix` không:

- xoay vòng token/mật khẩu/API keys
- vô hiệu hóa công cụ (`gateway`, `cron`, `exec`, v.v.)
- thay đổi lựa chọn bind/auth/network của gateway
- xóa hoặc ghi đè plugin/kỹ năng\n