---
summary: "Gọi trực tiếp một công cụ qua Gateway HTTP endpoint"
read_when:
  - Gọi công cụ mà không cần chạy toàn bộ agent
  - Xây dựng tự động hóa cần kiểm soát chính sách công cụ
title: "Tools Invoke API"
---

# Tools Invoke (HTTP)

Gateway của OpenClaw cung cấp một HTTP endpoint đơn giản để gọi trực tiếp một công cụ. Endpoint này luôn bật, nhưng được bảo vệ bởi auth của Gateway và chính sách công cụ.

- `POST /tools/invoke`
- Cùng port với Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/tools/invoke`

Payload tối đa mặc định là 2 MB.

## Authentication

Sử dụng cấu hình auth của Gateway. Gửi bearer token:

- `Authorization: Bearer <token>`

Lưu ý:

- Khi `gateway.auth.mode="token"`, dùng `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`).
- Khi `gateway.auth.mode="password"`, dùng `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
- Nếu `gateway.auth.rateLimit` được cấu hình và xảy ra quá nhiều lỗi auth, endpoint trả về `429` với `Retry-After`.

## Request body

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Các trường:

- `tool` (string, bắt buộc): tên công cụ cần gọi.
- `action` (string, tùy chọn): ánh xạ vào args nếu schema công cụ hỗ trợ `action` và payload args không có.
- `args` (object, tùy chọn): tham số cụ thể cho công cụ.
- `sessionKey` (string, tùy chọn): khóa session mục tiêu. Nếu bỏ qua hoặc `"main"`, Gateway dùng khóa session chính đã cấu hình (tuân theo `session.mainKey` và agent mặc định, hoặc `global` trong phạm vi toàn cầu).
- `dryRun` (boolean, tùy chọn): dành cho sử dụng trong tương lai; hiện tại bị bỏ qua.

## Policy + routing behavior

Khả dụng của công cụ được lọc qua chuỗi chính sách giống như các agent của Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- chính sách nhóm (nếu khóa session ánh xạ tới một nhóm hoặc channel)
- chính sách subagent (khi gọi với khóa session subagent)

Nếu công cụ không được phép bởi chính sách, endpoint trả về **404**.

Gateway HTTP cũng áp dụng danh sách từ chối mặc định (ngay cả khi chính sách session cho phép công cụ):

- `sessions_spawn`
- `sessions_send`
- `gateway`
- `whatsapp_login`

Có thể tùy chỉnh danh sách từ chối này qua `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Công cụ bổ sung để chặn qua HTTP /tools/invoke
      deny: ["browser"],
      // Loại bỏ công cụ khỏi danh sách từ chối mặc định
      allow: ["gateway"],
    },
  },
}
```

Để giúp chính sách nhóm giải quyết ngữ cảnh, có thể tùy chọn thiết lập:

- `x-openclaw-message-channel: <channel>` (ví dụ: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (khi có nhiều tài khoản)

## Responses

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (yêu cầu không hợp lệ hoặc lỗi đầu vào công cụ)
- `401` → không được phép
- `429` → giới hạn tốc độ auth (`Retry-After` được thiết lập)
- `404` → công cụ không khả dụng (không tìm thấy hoặc không trong danh sách cho phép)
- `405` → phương thức không được phép
- `500` → `{ ok: false, error: { type, message } }` (lỗi thực thi công cụ không mong đợi; thông báo đã được làm sạch)

## Ví dụ

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```\n