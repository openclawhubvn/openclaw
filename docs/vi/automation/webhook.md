---
summary: "Webhook ingress cho việc đánh thức và chạy agent cô lập"
read_when:
  - Thêm hoặc thay đổi endpoint webhook
  - Kết nối hệ thống bên ngoài vào OpenClaw
title: "Webhooks"
---

# Webhooks

Gateway có thể mở một endpoint HTTP webhook nhỏ để kích hoạt từ bên ngoài.

## Kích hoạt

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    // Tùy chọn: giới hạn routing `agentId` rõ ràng vào danh sách cho phép này.
    // Bỏ qua hoặc bao gồm "*" để cho phép bất kỳ agent nào.
    // Đặt [] để từ chối tất cả routing `agentId` rõ ràng.
    allowedAgentIds: ["hooks", "main"],
  },
}
```

Ghi chú:

- `hooks.token` là bắt buộc khi `hooks.enabled=true`.
- `hooks.path` mặc định là `/hooks`.

## Xác thực

Mỗi yêu cầu phải bao gồm token hook. Nên dùng headers:

- `Authorization: Bearer <token>` (khuyến nghị)
- `x-openclaw-token: <token>`
- Token trong query-string sẽ bị từ chối (`?token=...` trả về `400`).
- Xem `hooks.token` như là người gọi có toàn quyền tin cậy cho bề mặt hook ingress trên gateway đó. Nội dung payload hook vẫn không được tin cậy, nhưng đây không phải là ranh giới xác thực riêng biệt cho người không sở hữu.

## Endpoints

### `POST /hooks/wake`

Payload:

```json
{ "text": "System line", "mode": "now" }
```

- `text` **bắt buộc** (chuỗi): Mô tả sự kiện (ví dụ: "Nhận được email mới").
- `mode` tùy chọn (`now` | `next-heartbeat`): Kích hoạt ngay lập tức (mặc định `now`) hoặc chờ lần kiểm tra định kỳ tiếp theo.

Hiệu ứng:

- Đưa sự kiện hệ thống vào hàng đợi cho phiên **main**
- Nếu `mode=now`, kích hoạt ngay lập tức

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

- `message` **bắt buộc** (chuỗi): Lời nhắc hoặc thông điệp để agent xử lý.
- `name` tùy chọn (chuỗi): Tên dễ đọc cho hook (ví dụ: "GitHub"), dùng làm tiền tố trong tóm tắt phiên.
- `agentId` tùy chọn (chuỗi): Định tuyến hook này đến một agent cụ thể. ID không xác định sẽ quay về agent mặc định. Khi được đặt, hook sẽ chạy sử dụng workspace và cấu hình của agent đã được giải quyết.
- `sessionKey` tùy chọn (chuỗi): Khóa dùng để xác định phiên của agent. Mặc định trường này bị từ chối trừ khi `hooks.allowRequestSessionKey=true`.
- `wakeMode` tùy chọn (`now` | `next-heartbeat`): Kích hoạt ngay lập tức (mặc định `now`) hoặc chờ lần kiểm tra định kỳ tiếp theo.
- `deliver` tùy chọn (boolean): Nếu `true`, phản hồi của agent sẽ được gửi đến kênh nhắn tin. Mặc định là `true`. Các phản hồi chỉ là xác nhận heartbeat sẽ tự động bị bỏ qua.
- `channel` tùy chọn (chuỗi): Kênh nhắn tin để gửi. Một trong các giá trị: `last`, `whatsapp`, `telegram`, `discord`, `slack`, `mattermost` (plugin), `signal`, `imessage`, `msteams`. Mặc định là `last`.
- `to` tùy chọn (chuỗi): Định danh người nhận cho kênh (ví dụ: số điện thoại cho WhatsApp/Signal, ID chat cho Telegram, ID kênh cho Discord/Slack/Mattermost (plugin), ID cuộc trò chuyện cho Microsoft Teams). Mặc định là người nhận cuối cùng trong phiên chính.
- `model` tùy chọn (chuỗi): Ghi đè mô hình (ví dụ: `anthropic/claude-3-5-sonnet` hoặc một bí danh). Phải nằm trong danh sách mô hình được phép nếu bị giới hạn.
- `thinking` tùy chọn (chuỗi): Ghi đè mức độ suy nghĩ (ví dụ: `low`, `medium`, `high`).
- `timeoutSeconds` tùy chọn (số): Thời gian tối đa cho lần chạy agent tính bằng giây.

Hiệu ứng:

- Chạy một lượt agent **cô lập** (khóa phiên riêng)
- Luôn đăng tóm tắt vào phiên **main**
- Nếu `wakeMode=now`, kích hoạt ngay lập tức

## Chính sách khóa phiên (thay đổi phá vỡ)

Ghi đè `sessionKey` trong payload `/hooks/agent` bị vô hiệu hóa theo mặc định.

- Khuyến nghị: đặt một `hooks.defaultSessionKey` cố định và giữ tắt ghi đè yêu cầu.
- Tùy chọn: cho phép ghi đè yêu cầu chỉ khi cần thiết, và giới hạn tiền tố.

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

Tên hook tùy chỉnh được giải quyết thông qua `hooks.mappings` (xem cấu hình). Một ánh xạ có thể biến đổi payload tùy ý thành hành động `wake` hoặc `agent`, với các mẫu hoặc chuyển đổi mã tùy chọn.

Tùy chọn ánh xạ (tóm tắt):

- `hooks.presets: ["gmail"]` kích hoạt ánh xạ Gmail tích hợp sẵn.
- `hooks.mappings` cho phép bạn định nghĩa `match`, `action`, và các mẫu trong cấu hình.
- `hooks.transformsDir` + `transform.module` tải một module JS/TS cho logic tùy chỉnh.
  - `hooks.transformsDir` (nếu được đặt) phải nằm trong thư mục gốc transforms dưới thư mục cấu hình OpenClaw của bạn (thường là `~/.openclaw/hooks/transforms`).
  - `transform.module` phải được giải quyết trong thư mục transforms hiệu quả (các đường dẫn traversal/escape bị từ chối).
- Sử dụng `match.source` để giữ một endpoint ingest chung (định tuyến dựa trên payload).
- Các chuyển đổi TS yêu cầu một loader TS (ví dụ `bun` hoặc `tsx`) hoặc `.js` đã biên dịch trước khi chạy.
- Đặt `deliver: true` + `channel`/`to` trên ánh xạ để định tuyến phản hồi đến bề mặt chat
  (`channel` mặc định là `last` và quay về WhatsApp).
- `agentId` định tuyến hook đến một agent cụ thể; ID không xác định sẽ quay về agent mặc định.
- `hooks.allowedAgentIds` giới hạn routing `agentId` rõ ràng. Bỏ qua nó (hoặc bao gồm `*`) để cho phép bất kỳ agent nào. Đặt `[]` để từ chối routing `agentId` rõ ràng.
- `hooks.defaultSessionKey` đặt phiên mặc định cho các lần chạy agent hook khi không có khóa rõ ràng nào được cung cấp.
- `hooks.allowRequestSessionKey` kiểm soát liệu payload `/hooks/agent` có thể đặt `sessionKey` hay không (mặc định: `false`).
- `hooks.allowedSessionKeyPrefixes` tùy chọn giới hạn các giá trị `sessionKey` rõ ràng từ payload yêu cầu và ánh xạ.
- `allowUnsafeExternalContent: true` vô hiệu hóa lớp bảo vệ nội dung bên ngoài cho hook đó
  (nguy hiểm; chỉ dành cho các nguồn nội bộ đáng tin cậy).
- `openclaw webhooks gmail setup` ghi cấu hình `hooks.gmail` cho `openclaw webhooks gmail run`.
  Xem [Gmail Pub/Sub](/automation/gmail-pubsub) để biết toàn bộ quy trình theo dõi Gmail.

## Phản hồi

- `200` cho `/hooks/wake`
- `200` cho `/hooks/agent` (chấp nhận chạy không đồng bộ)
- `401` khi xác thực thất bại
- `429` sau khi xác thực thất bại nhiều lần từ cùng một client (kiểm tra `Retry-After`)
- `400` khi payload không hợp lệ
- `413` khi payload quá lớn

## Ví dụ

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"Nhận được email mới","mode":"now"}'
```

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Tóm tắt hộp thư","name":"Email","wakeMode":"next-heartbeat"}'
```

### Sử dụng mô hình khác

Thêm `model` vào payload agent (hoặc ánh xạ) để ghi đè mô hình cho lần chạy đó:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Tóm tắt hộp thư","name":"Email","model":"openai/gpt-5.2-mini"}'
```

Nếu bạn thực thi `agents.defaults.models`, hãy đảm bảo mô hình ghi đè được bao gồm ở đó.

```bash
curl -X POST http://127.0.0.1:18789/hooks/gmail \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"source":"gmail","messages":[{"from":"Ada","subject":"Hello","snippet":"Hi"}]}'
```

## Bảo mật

- Giữ các endpoint hook phía sau loopback, tailnet, hoặc proxy ngược đáng tin cậy.
- Sử dụng token hook riêng biệt; không tái sử dụng token xác thực gateway.
- Ưu tiên một agent hook riêng biệt với `tools.profile` nghiêm ngặt và sandboxing để hook ingress có phạm vi ảnh hưởng hẹp hơn.
- Các lần xác thực thất bại lặp lại bị giới hạn tốc độ theo địa chỉ client để làm chậm các nỗ lực brute-force.
- Nếu bạn sử dụng định tuyến multi-agent, đặt `hooks.allowedAgentIds` để giới hạn lựa chọn `agentId` rõ ràng.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi bạn yêu cầu các phiên do người gọi chọn.
- Nếu bạn kích hoạt yêu cầu `sessionKey`, giới hạn `hooks.allowedSessionKeyPrefixes` (ví dụ: `["hook:"]`).
- Tránh bao gồm các payload thô nhạy cảm trong nhật ký webhook.
- Payload hook được xem như không đáng tin cậy và được bao bọc với các ranh giới an toàn theo mặc định.
  Nếu bạn phải vô hiệu hóa điều này cho một hook cụ thể, đặt `allowUnsafeExternalContent: true`
  trong ánh xạ của hook đó (nguy hiểm).
