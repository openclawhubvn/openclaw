---
summary: "Gọi trực tiếp một công cụ qua endpoint HTTP của Gateway"
read_when:
  - Gọi công cụ mà không cần chạy toàn bộ agent
  - Xây dựng tự động hóa cần thực thi chính sách công cụ
title: "API Gọi Công Cụ"
---

# Gọi Công Cụ (HTTP)

Gateway của OpenClaw cung cấp một endpoint HTTP đơn giản để gọi trực tiếp một công cụ. Endpoint này luôn được kích hoạt, nhưng được bảo vệ bởi xác thực Gateway và chính sách công cụ.

- `POST /tools/invoke`
- Cùng cổng với Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/tools/invoke`

Kích thước payload tối đa mặc định là 2 MB.

## Xác thực

Sử dụng cấu hình xác thực của Gateway. Gửi một bearer token:

- `Authorization: Bearer <token>`

Lưu ý:

- Khi `gateway.auth.mode="token"`, sử dụng `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`).
- Khi `gateway.auth.mode="password"`, sử dụng `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
- Nếu `gateway.auth.rateLimit` được cấu hình và xảy ra quá nhiều lỗi xác thực, endpoint sẽ trả về `429` với `Retry-After`.

## Nội dung yêu cầu

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

- `tool` (chuỗi, bắt buộc): tên công cụ cần gọi.
- `action` (chuỗi, tùy chọn): được ánh xạ vào args nếu schema công cụ hỗ trợ `action` và payload args không có.
- `args` (đối tượng, tùy chọn): các tham số cụ thể cho công cụ.
- `sessionKey` (chuỗi, tùy chọn): khóa phiên mục tiêu. Nếu bỏ qua hoặc `"main"`, Gateway sử dụng khóa phiên chính đã cấu hình (tuân theo `session.mainKey` và agent mặc định, hoặc `global` trong phạm vi toàn cầu).
- `dryRun` (boolean, tùy chọn): dành cho sử dụng trong tương lai; hiện tại bị bỏ qua.

## Hành vi chính sách + định tuyến

Khả dụng của công cụ được lọc qua chuỗi chính sách tương tự được sử dụng bởi các agent của Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- chính sách nhóm (nếu khóa phiên ánh xạ tới một nhóm hoặc kênh)
- chính sách subagent (khi gọi với khóa phiên subagent)

Nếu một công cụ không được phép bởi chính sách, endpoint sẽ trả về **404**.

Gateway HTTP cũng áp dụng danh sách từ chối mặc định (ngay cả khi chính sách phiên cho phép công cụ):

- `sessions_spawn`
- `sessions_send`
- `gateway`
- `whatsapp_login`

Bạn có thể tùy chỉnh danh sách từ chối này qua `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Các công cụ bổ sung để chặn qua HTTP /tools/invoke
      deny: ["browser"],
      // Loại bỏ công cụ khỏi danh sách từ chối mặc định
      allow: ["gateway"],
    },
  },
}
```

Để hỗ trợ chính sách nhóm giải quyết ngữ cảnh, bạn có thể tùy chọn thiết lập:

- `x-openclaw-message-channel: <channel>` (ví dụ: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (khi có nhiều tài khoản)

## Phản hồi

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (yêu cầu không hợp lệ hoặc lỗi đầu vào công cụ)
- `401` → không được phép
- `429` → giới hạn tốc độ xác thực (`Retry-After` được thiết lập)
- `404` → công cụ không khả dụng (không tìm thấy hoặc không có trong danh sách cho phép)
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
```
