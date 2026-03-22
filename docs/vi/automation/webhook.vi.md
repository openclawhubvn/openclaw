---
summary: "Webhook ingress cho wake và chạy agent cô lập"
read_when:
  - Thêm hoặc thay đổi webhook endpoints
  - Kết nối hệ thống bên ngoài vào OpenClaw
title: "Webhooks"
---

# Webhooks

Gateway có thể mở một endpoint HTTP webhook nhỏ để kích hoạt từ bên ngoài.

## Bật

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    // Tùy chọn: giới hạn routing `agentId` rõ ràng vào danh sách cho phép này.
    // Bỏ qua hoặc thêm "*" để cho phép bất kỳ agent nào.
    // Đặt [] để từ chối tất cả routing `agentId` rõ ràng.
    allowedAgentIds: ["hooks", "main"],
  },
}
```

Lưu ý:

- `hooks.token` bắt buộc khi `hooks.enabled=true`.
- `hooks.path` mặc định là `/hooks`.

## Xác thực

Mỗi request phải bao gồm hook token. Nên dùng headers:

- `Authorization: Bearer <token>` (khuyến nghị)
- `x-openclaw-token: <token>`
- Token trong query-string bị từ chối (`?token=...` trả về `400`).
- Xem `hooks.token` như caller tin cậy hoàn toàn cho hook ingress trên gateway đó. Nội dung payload hook vẫn không được tin cậy, nhưng đây không phải là ranh giới xác thực riêng biệt cho non-owner.

## Endpoints

### `POST /hooks/wake`

Payload:

```json
{ "text": "System line", "mode": "now" }
```

- `text` **bắt buộc** (string): Mô tả sự kiện (ví dụ: "Nhận email mới").
- `mode` tùy chọn (`now` | `next-heartbeat`): Kích hoạt heartbeat ngay lập tức (mặc định `now`) hoặc chờ lần kiểm tra định kỳ tiếp theo.

Hiệu ứng:

- Đưa sự kiện hệ thống vào hàng đợi cho session **main**
- Nếu `mode=now`, kích hoạt heartbeat ngay lập tức

### `POST /hooks/agent`

Payload:

```json
{
  "message": "Run this",
  "name": "Email",
  "agentId": "hooks",
  "sessionKey": "hook:email:msg-123",
  "wakeMode": "now",
  "deliver": true,
  "channel": "last",
  "to": "+15551234567",
  "model": "openai/gpt-5.2-mini",
  "thinking": "low",
  "timeoutSeconds": 120
}
```

- `message` **bắt buộc** (string): Prompt hoặc message cho agent xử lý.
- `name` tùy chọn (string): Tên dễ đọc cho hook (ví dụ: "GitHub"), dùng làm tiền tố trong tóm tắt session.
- `agentId` tùy chọn (string): Route hook này đến agent cụ thể. ID không xác định sẽ quay về agent mặc định. Khi đặt, hook chạy với workspace và cấu hình của agent đã được giải quyết.
- `sessionKey` tùy chọn (string): Khóa dùng để xác định session của agent. Mặc định trường này bị từ chối trừ khi `hooks.allowRequestSessionKey=true`.
- `wakeMode` tùy chọn (`now` | `next-heartbeat`): Kích hoạt heartbeat ngay lập tức (mặc định `now`) hoặc chờ lần kiểm tra định kỳ tiếp theo.
- `deliver` tùy chọn (boolean): Nếu `true`, phản hồi của agent sẽ được gửi đến kênh nhắn tin. Mặc định là `true`. Phản hồi chỉ là xác nhận heartbeat sẽ tự động bị bỏ qua.
- `channel` tùy chọn (string): Kênh nhắn tin để gửi. Một trong: `last`, `whatsapp`, `telegram`, `discord`, `slack`, `mattermost` (plugin), `signal`, `imessage`, `msteams`. Mặc định là `last`.
- `to` tùy chọn (string): Định danh người nhận cho kênh (ví dụ: số điện thoại cho WhatsApp/Signal, chat ID cho Telegram, channel ID cho Discord/Slack/Mattermost (plugin), conversation ID cho Microsoft Teams). Mặc định là người nhận cuối cùng trong session chính.
- `model` tùy chọn (string): Ghi đè model (ví dụ: `anthropic/claude-3-5-sonnet` hoặc alias). Phải nằm trong danh sách model cho phép nếu bị giới hạn.
- `thinking` tùy chọn (string): Ghi đè mức độ suy nghĩ (ví dụ: `low`, `medium`, `high`).
- `timeoutSeconds` tùy chọn (number): Thời gian tối đa cho chạy agent tính bằng giây.

Hiệu ứng:

- Chạy một lượt agent **cô lập** (khóa session riêng)
- Luôn đăng tóm tắt vào session **main**
- Nếu `wakeMode=now`, kích hoạt heartbeat ngay lập tức

## Chính sách khóa session (thay đổi phá vỡ)

Ghi đè `sessionKey` trong payload `/hooks/agent` bị vô hiệu hóa mặc định.

- Khuyến nghị: đặt `hooks.defaultSessionKey` cố định và giữ tắt ghi đè request.
- Tùy chọn: cho phép ghi đè request chỉ khi cần, và giới hạn tiền tố.

Cấu hình khuyến nghị:

```json5
{
  hooks: {
    enabled: true,
    token: "${OPENCLAW_HOOKS_TOKEN}",
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
  },
}
```

Cấu hình tương thích (hành vi cũ):

```json5
{
  hooks: {
    enabled: true,
    token: "${OPENCLAW_HOOKS_TOKEN}",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:"], // rất khuyến nghị
  },
}
```

### `POST /hooks/<name>` (được ánh xạ)

Tên hook tùy chỉnh được giải quyết qua `hooks.mappings` (xem cấu hình). Một ánh xạ có thể biến payload tùy ý thành hành động `wake` hoặc `agent`, với mẫu hoặc chuyển đổi mã tùy chọn.

Tùy chọn ánh xạ (tóm tắt):

- `hooks.presets: ["gmail"]` bật ánh xạ Gmail tích hợp sẵn.
- `hooks.mappings` cho phép định nghĩa `match`, `action`, và mẫu trong cấu hình.
- `hooks.transformsDir` + `transform.module` tải module JS/TS cho logic tùy chỉnh.
  - `hooks.transformsDir` (nếu đặt) phải nằm trong thư mục gốc transforms dưới thư mục cấu hình OpenClaw (thường là `~/.openclaw/hooks/transforms`).
  - `transform.module` phải được giải quyết trong thư mục transforms hiệu quả (đường dẫn traversal/escape bị từ chối).
- Dùng `match.source` để giữ endpoint ingest chung (routing dựa trên payload).
- Chuyển đổi TS yêu cầu loader TS (ví dụ `bun` hoặc `tsx`) hoặc `.js` đã biên dịch trước khi chạy.
- Đặt `deliver: true` + `channel`/`to` trên ánh xạ để route phản hồi đến bề mặt chat
  (`channel` mặc định là `last` và quay về WhatsApp).
- `agentId` route hook đến agent cụ thể; ID không xác định quay về agent mặc định.
- `hooks.allowedAgentIds` giới hạn routing `agentId` rõ ràng. Bỏ qua (hoặc bao gồm `*`) để cho phép bất kỳ agent nào. Đặt `[]` để từ chối routing `agentId` rõ ràng.
- `hooks.defaultSessionKey` đặt session mặc định cho chạy agent hook khi không có khóa rõ ràng.
- `hooks.allowRequestSessionKey` kiểm soát liệu payload `/hooks/agent` có thể đặt `sessionKey` (mặc định: `false`).
- `hooks.allowedSessionKeyPrefixes` tùy chọn giới hạn giá trị `sessionKey` rõ ràng từ payload request và ánh xạ.
- `allowUnsafeExternalContent: true` vô hiệu hóa lớp bảo vệ nội dung bên ngoài cho hook đó
  (nguy hiểm; chỉ dành cho nguồn nội bộ tin cậy).
- `openclaw webhooks gmail setup` ghi cấu hình `hooks.gmail` cho `openclaw webhooks gmail run`.
  Xem [Gmail Pub/Sub](/automation/gmail-pubsub) cho luồng watch Gmail đầy đủ.

## Phản hồi

- `200` cho `/hooks/wake`
- `200` cho `/hooks/agent` (chạy async được chấp nhận)
- `401` khi xác thực thất bại
- `429` sau khi xác thực thất bại nhiều lần từ cùng một client (kiểm tra `Retry-After`)
- `400` khi payload không hợp lệ
- `413` khi payload quá lớn

## Ví dụ

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"Nhận email mới","mode":"now"}'
```

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Tóm tắt hộp thư","name":"Email","wakeMode":"next-heartbeat"}'
```

### Dùng model khác

Thêm `model` vào payload agent (hoặc ánh xạ) để ghi đè model cho lần chạy đó:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Tóm tắt hộp thư","name":"Email","model":"openai/gpt-5.2-mini"}'
```

Nếu bạn áp dụng `agents.defaults.models`, đảm bảo model ghi đè được bao gồm ở đó.

```bash
curl -X POST http://127.0.0.1:18789/hooks/gmail \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"source":"gmail","messages":[{"from":"Ada","subject":"Hello","snippet":"Hi"}]}'
```

## Bảo mật

- Giữ hook endpoints sau loopback, tailnet, hoặc proxy ngược tin cậy.
- Dùng token hook riêng; không tái sử dụng token xác thực gateway.
- Nên dùng agent hook riêng với `tools.profile` nghiêm ngặt và sandboxing để hook ingress có phạm vi ảnh hưởng hẹp hơn.
- Xác thực thất bại nhiều lần bị giới hạn tốc độ theo địa chỉ client để làm chậm các cuộc tấn công brute-force.
- Nếu dùng routing multi-agent, đặt `hooks.allowedAgentIds` để giới hạn lựa chọn `agentId` rõ ràng.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi cần session do caller chọn.
- Nếu bật request `sessionKey`, giới hạn `hooks.allowedSessionKeyPrefixes` (ví dụ, `["hook:"]`).
- Tránh bao gồm payload thô nhạy cảm trong log webhook.
- Payload hook được xem như không tin cậy và được bao bọc với lớp bảo vệ mặc định.
  Nếu cần vô hiệu hóa điều này cho hook cụ thể, đặt `allowUnsafeExternalContent: true`
  trong ánh xạ của hook đó (nguy hiểm).\n