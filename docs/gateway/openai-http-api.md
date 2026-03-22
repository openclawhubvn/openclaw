---
summary: "Khám phá cách cấu hình endpoint HTTP /v1/chat/completions tương thích OpenAI, giúp tích hợp AI vào ứng dụng của bạn dễ dàng."
read_when:
  - Tích hợp các công cụ yêu cầu OpenAI Chat Completions
title: "Hướng Dẫn Cấu Hình OpenAI Chat API"
---

# OpenAI Chat Completions (HTTP)

Gateway của OpenClaw có thể cung cấp một endpoint Chat Completions tương thích với OpenAI.

Endpoint này **mặc định bị vô hiệu hóa**. Cần kích hoạt trong cấu hình trước.

- `POST /v1/chat/completions`
- Cùng cổng với Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

Bên trong, các yêu cầu được thực thi như một lần chạy agent thông thường của Gateway (cùng đường dẫn mã với `openclaw agent`), do đó việc định tuyến/quyền hạn/cấu hình sẽ khớp với Gateway của bạn.

## Xác thực

Sử dụng cấu hình xác thực của Gateway. Gửi một bearer token:

- `Authorization: Bearer <token>`

Lưu ý:

- Khi `gateway.auth.mode="token"`, sử dụng `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`).
- Khi `gateway.auth.mode="password"`, sử dụng `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
- Nếu `gateway.auth.rateLimit` được cấu hình và xảy ra quá nhiều lỗi xác thực, endpoint sẽ trả về `429` với `Retry-After`.

## Ranh giới bảo mật (quan trọng)

Xem endpoint này như một bề mặt **truy cập toàn quyền** cho instance gateway.

- Xác thực HTTP bearer ở đây không phải là mô hình phạm vi hẹp cho từng người dùng.
- Một token/password hợp lệ của Gateway cho endpoint này nên được xem như một thông tin đăng nhập của chủ sở hữu/người vận hành.
- Các yêu cầu chạy qua cùng đường dẫn agent control-plane như các hành động của người vận hành đáng tin cậy.
- Không có ranh giới công cụ riêng biệt cho người không phải chủ sở hữu/người dùng trên endpoint này; khi một người gọi vượt qua xác thực Gateway ở đây, OpenClaw coi người gọi đó là một người vận hành đáng tin cậy cho gateway này.
- Nếu chính sách agent mục tiêu cho phép các công cụ nhạy cảm, endpoint này có thể sử dụng chúng.
- Giữ endpoint này trên loopback/tailnet/private ingress; không để lộ trực tiếp ra internet công cộng.

Xem thêm [Security](/gateway/security) và [Remote access](/gateway/remote).

## Chọn agent

Không cần header tùy chỉnh: mã hóa id agent trong trường `model` của OpenAI:

- `model: "openclaw:<agentId>"` (ví dụ: `"openclaw:main"`, `"openclaw:beta"`)
- `model: "agent:<agentId>"` (bí danh)

Hoặc nhắm đến một agent OpenClaw cụ thể bằng header:

- `x-openclaw-agent-id: <agentId>` (mặc định: `main`)

Nâng cao:

- `x-openclaw-session-key: <sessionKey>` để kiểm soát hoàn toàn định tuyến phiên.

## Kích hoạt endpoint

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

## Vô hiệu hóa endpoint

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

## Hành vi phiên

Mặc định, endpoint là **không trạng thái cho mỗi yêu cầu** (một khóa phiên mới được tạo cho mỗi lần gọi).

Nếu yêu cầu bao gồm một chuỗi `user` của OpenAI, Gateway sẽ tạo ra một khóa phiên ổn định từ đó, để các lần gọi lặp lại có thể chia sẻ một phiên agent.

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
```
