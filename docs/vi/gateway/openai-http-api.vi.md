# OpenAI Chat Completions (HTTP)

Gateway của OpenClaw có thể cung cấp một endpoint Chat Completions tương thích với OpenAI.

Endpoint này **mặc định bị tắt**. Cần bật trong cấu hình trước.

- `POST /v1/chat/completions`
- Cùng port với Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

Dưới hood, request được thực thi như một lần chạy agent của Gateway (cùng codepath với `openclaw agent`), nên routing/quyền/config sẽ khớp với Gateway.

## Xác thực

Sử dụng cấu hình auth của Gateway. Gửi bearer token:

- `Authorization: Bearer <token>`

Lưu ý:

- Khi `gateway.auth.mode="token"`, dùng `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`).
- Khi `gateway.auth.mode="password"`, dùng `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
- Nếu `gateway.auth.rateLimit` được cấu hình và có quá nhiều lần xác thực thất bại, endpoint sẽ trả về `429` với `Retry-After`.

## Ranh giới bảo mật (quan trọng)

Xem endpoint này như một bề mặt **truy cập toàn quyền** cho instance gateway.

- HTTP bearer auth ở đây không phải mô hình phạm vi hẹp cho từng user.
- Token/password hợp lệ của Gateway cho endpoint này nên được xem như thông tin xác thực của chủ sở hữu.
- Request chạy qua cùng đường dẫn agent control-plane như các hành động của operator tin cậy.
- Không có ranh giới công cụ không phải chủ sở hữu/từng user riêng biệt trên endpoint này; khi caller vượt qua auth của Gateway, OpenClaw coi caller đó là operator tin cậy cho gateway này.
- Nếu chính sách agent mục tiêu cho phép công cụ nhạy cảm, endpoint này có thể sử dụng chúng.
- Giữ endpoint này trên loopback/tailnet/private ingress; không phơi bày trực tiếp ra internet công cộng.

Xem thêm [Security](/gateway/security) và [Remote access](/gateway/remote).

## Chọn agent

Không cần header tùy chỉnh: mã hóa agent id trong trường `model` của OpenAI:

- `model: "openclaw:<agentId>"` (ví dụ: `"openclaw:main"`, `"openclaw:beta"`)
- `model: "agent:<agentId>"` (alias)

Hoặc nhắm đến một agent OpenClaw cụ thể bằng header:

- `x-openclaw-agent-id: <agentId>` (mặc định: `main`)

Nâng cao:

- `x-openclaw-session-key: <sessionKey>` để kiểm soát hoàn toàn routing session.

## Bật endpoint

Đặt `gateway.http.endpoints.chatCompletions.enabled` thành `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## Tắt endpoint

Đặt `gateway.http.endpoints.chatCompletions.enabled` thành `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Hành vi session

Mặc định, endpoint là **stateless per request** (mỗi lần gọi sẽ tạo một session key mới).

Nếu request bao gồm chuỗi `user` của OpenAI, Gateway sẽ tạo một session key ổn định từ đó, giúp các lần gọi lặp lại có thể chia sẻ session agent.

## Streaming (SSE)

Đặt `stream: true` để nhận Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Mỗi dòng sự kiện là `data: <json>`
- Stream kết thúc với `data: [DONE]`

## Ví dụ

Không streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```\n