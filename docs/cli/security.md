---
summary: "Khám phá cách kiểm tra và khắc phục các vấn đề bảo mật phổ biến với OpenClaw CLI. Tăng cường an ninh hệ thống dễ dàng."
read_when:
  - Bạn muốn thực hiện kiểm tra bảo mật nhanh trên cấu hình/trạng thái
  - Bạn muốn áp dụng các đề xuất "sửa chữa" an toàn (chmod, thắt chặt mặc định)
title: "Hướng Dẫn Cấu Hình Bảo Mật OpenClaw CLI"
---

# `openclaw security`

Công cụ bảo mật (kiểm tra + sửa chữa tùy chọn).

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

Kiểm tra sẽ cảnh báo khi nhiều người gửi DM chia sẻ phiên chính và đề xuất chế độ DM an toàn: `session.dmScope="per-channel-peer"` (hoặc `per-account-channel-peer` cho các kênh đa tài khoản) cho các hộp thư chung. Điều này nhằm tăng cường bảo mật cho hộp thư chung. Một Gateway duy nhất được chia sẻ bởi các nhà vận hành không tin tưởng lẫn nhau không phải là cấu hình được khuyến nghị; nên tách ranh giới tin cậy với các gateway riêng biệt (hoặc người dùng/hệ điều hành/host riêng biệt).
Nó cũng phát hiện `security.trust_model.multi_user_heuristic` khi cấu hình cho thấy khả năng có người dùng chung (ví dụ chính sách DM/nhóm mở, mục tiêu nhóm được cấu hình, hoặc quy tắc người gửi wildcard), và nhắc nhở rằng OpenClaw mặc định là mô hình tin cậy trợ lý cá nhân.
Đối với các cấu hình người dùng chung có chủ ý, hướng dẫn kiểm tra là sandbox tất cả các phiên, giữ quyền truy cập hệ thống tập tin trong phạm vi workspace, và giữ các danh tính hoặc thông tin đăng nhập cá nhân/riêng tư ngoài runtime đó.
Nó cũng cảnh báo khi các mô hình nhỏ (`<=300B`) được sử dụng mà không có sandbox và với các công cụ web/trình duyệt được kích hoạt.
Đối với webhook ingress, nó cảnh báo khi `hooks.token` tái sử dụng token Gateway, khi `hooks.defaultSessionKey` không được thiết lập, khi `hooks.allowedAgentIds` không bị giới hạn, khi các ghi đè `sessionKey` yêu cầu được kích hoạt, và khi các ghi đè được kích hoạt mà không có `hooks.allowedSessionKeyPrefixes`.
Nó cũng cảnh báo khi cài đặt Docker sandbox được cấu hình trong khi chế độ sandbox tắt, khi `gateway.nodes.denyCommands` sử dụng các mục không hiệu quả/không xác định (chỉ khớp tên lệnh node chính xác, không lọc văn bản shell), khi `gateway.nodes.allowCommands` cho phép rõ ràng các lệnh node nguy hiểm, khi `tools.profile="minimal"` toàn cầu bị ghi đè bởi các profile công cụ agent, khi các nhóm mở phơi bày công cụ runtime/hệ thống tập tin mà không có bảo vệ sandbox/workspace, và khi các công cụ plugin mở rộng đã cài đặt có thể được truy cập dưới chính sách công cụ dễ dãi.
Nó cũng đánh dấu `gateway.allowRealIpFallback=true` (nguy cơ giả mạo header nếu proxy bị cấu hình sai) và `discovery.mdns.mode="full"` (rò rỉ metadata qua mDNS TXT records).
Nó cũng cảnh báo khi trình duyệt sandbox sử dụng mạng Docker `bridge` mà không có `sandbox.browser.cdpSourceRange`.
Nó cũng đánh dấu các chế độ mạng Docker sandbox nguy hiểm (bao gồm `host` và `container:*` tham gia namespace).
Nó cũng cảnh báo khi các container Docker trình duyệt sandbox hiện có thiếu/nhãn hash cũ (ví dụ các container trước khi di chuyển thiếu `openclaw.browserConfigEpoch`) và khuyến nghị `openclaw sandbox recreate --browser --all`.
Nó cũng cảnh báo khi các bản ghi cài đặt plugin/hook dựa trên npm không được ghim, thiếu metadata toàn vẹn, hoặc lệch khỏi các phiên bản gói hiện tại.
Nó cảnh báo khi danh sách cho phép kênh dựa vào tên/email/tag có thể thay đổi thay vì ID ổn định (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC nơi áp dụng).
Nó cảnh báo khi `gateway.auth.mode="none"` để các API HTTP Gateway có thể truy cập mà không có bí mật chia sẻ (`/tools/invoke` cùng với bất kỳ endpoint `/v1/*` nào được kích hoạt).
Các cài đặt có tiền tố `dangerous`/`dangerously` là các ghi đè operator phá vỡ kính rõ ràng; kích hoạt một không phải là báo cáo lỗ hổng bảo mật.
Để xem toàn bộ danh sách tham số nguy hiểm, xem phần "Tóm tắt cờ không an toàn hoặc nguy hiểm" trong [Security](/gateway/security).

Hành vi SecretRef:

- `security audit` giải quyết các SecretRef được hỗ trợ ở chế độ chỉ đọc cho các đường dẫn mục tiêu của nó.
- Nếu một SecretRef không có sẵn trong đường dẫn lệnh hiện tại, kiểm tra tiếp tục và báo cáo `secretDiagnostics` (thay vì bị lỗi).
- `--token` và `--password` chỉ ghi đè xác thực kiểm tra sâu cho lần gọi lệnh đó; chúng không ghi đè cấu hình hoặc ánh xạ SecretRef.

## Đầu ra JSON

Sử dụng `--json` cho kiểm tra CI/chính sách:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Nếu kết hợp `--fix` và `--json`, đầu ra bao gồm cả hành động sửa chữa và báo cáo cuối cùng:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Những gì `--fix` thay đổi

`--fix` áp dụng các biện pháp khắc phục an toàn, xác định:

- chuyển đổi `groupPolicy="open"` phổ biến thành `groupPolicy="allowlist"` (bao gồm các biến thể tài khoản trong các kênh được hỗ trợ)
- đặt `logging.redactSensitive` từ `"off"` thành `"tools"`
- thắt chặt quyền cho trạng thái/cấu hình và các tệp nhạy cảm phổ biến (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, phiên `*.jsonl`)

`--fix` không:

- xoay vòng token/mật khẩu/API key
- vô hiệu hóa công cụ (`gateway`, `cron`, `exec`, v.v.)
- thay đổi lựa chọn phơi bày mạng/xác thực/gateway
- xóa hoặc ghi đè plugin/kỹ năng
