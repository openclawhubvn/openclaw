---
summary: "TypeBox schemas là nguồn duy nhất cho giao thức gateway"
read_when:
  - Cập nhật schema giao thức hoặc codegen
title: "TypeBox"
---

# TypeBox là nguồn duy nhất cho giao thức

Cập nhật lần cuối: 2026-01-10

TypeBox là thư viện schema ưu tiên TypeScript. Dùng để định nghĩa giao thức **Gateway WebSocket** (handshake, request/response, server events). Các schema này hỗ trợ **kiểm tra runtime**, **xuất JSON Schema**, và **codegen Swift** cho app macOS. Một nguồn duy nhất; mọi thứ khác được sinh ra từ đây.

Nếu cần bối cảnh giao thức cấp cao hơn, bắt đầu với [Kiến trúc Gateway](/concepts/architecture).

## Mô hình tư duy (30 giây)

Mỗi message Gateway WS là một trong ba frame:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

Frame đầu tiên **phải** là request `connect`. Sau đó, client có thể gọi method (ví dụ: `health`, `send`, `chat.send`) và subscribe event (ví dụ: `presence`, `tick`, `agent`).

Luồng kết nối (tối thiểu):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Method + event phổ biến:

| Category  | Examples                                                  | Notes                              |
| --------- | --------------------------------------------------------- | ---------------------------------- |
| Core      | `connect`, `health`, `status`                             | `connect` phải là đầu tiên         |
| Messaging | `send`, `poll`, `agent`, `agent.wait`                     | cần `idempotencyKey` cho side-effects |
| Chat      | `chat.history`, `chat.send`, `chat.abort`, `chat.inject`  | WebChat dùng các method này        |
| Sessions  | `sessions.list`, `sessions.patch`, `sessions.delete`      | quản lý session                    |
| Nodes     | `node.list`, `node.invoke`, `node.pair.*`                 | Gateway WS + hành động node        |
| Events    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown` | server push                        |

Danh sách chính thức nằm trong `src/gateway/server.ts` (`METHODS`, `EVENTS`).

## Nơi lưu trữ schema

- Source: `src/gateway/protocol/schema.ts`
- Runtime validators (AJV): `src/gateway/protocol/index.ts`
- Server handshake + method dispatch: `src/gateway/server.ts`
- Node client: `src/gateway/client.ts`
- Generated JSON Schema: `dist/protocol.schema.json`
- Generated Swift models: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline hiện tại

- `pnpm protocol:gen`
  - ghi JSON Schema (draft‑07) vào `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - sinh ra Swift gateway models
- `pnpm protocol:check`
  - chạy cả hai generator và kiểm tra output đã được commit

## Cách sử dụng schema tại runtime

- **Server side**: mỗi frame inbound được kiểm tra với AJV. Handshake chỉ chấp nhận request `connect` có params khớp `ConnectParams`.
- **Client side**: JS client kiểm tra frame event và response trước khi sử dụng.
- **Method surface**: Gateway quảng cáo các `methods` và `events` hỗ trợ trong `hello-ok`.

## Ví dụ frame

Connect (message đầu tiên):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 2,
    "maxProtocol": 2,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Hello-ok response:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 2,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Request + response:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Event:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Minimal client (Node.js)

Luồng tối thiểu hữu ích: connect + health.

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## Ví dụ thực tế: thêm một method end-to-end

Ví dụ: thêm request `system.echo` mới trả về `{ ok: true, text }`.

1. **Schema (nguồn duy nhất)**

Thêm vào `src/gateway/protocol/schema.ts`:

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

Thêm cả hai vào `ProtocolSchemas` và export types:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validation**

Trong `src/gateway/protocol/index.ts`, export một AJV validator:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Server behavior**

Thêm handler trong `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Đăng ký nó trong `src/gateway/server-methods.ts` (đã merge `systemHandlers`), sau đó thêm `"system.echo"` vào `METHODS` trong `src/gateway/server.ts`.

4. **Regenerate**

```bash
pnpm protocol:check
```

5. **Tests + docs**

Thêm server test trong `src/gateway/server.*.test.ts` và ghi chú method trong docs.

## Swift codegen behavior

Swift generator sinh ra:

- Enum `GatewayFrame` với các case `req`, `res`, `event`, và `unknown`
- Payload struct/enum kiểu mạnh
- Giá trị `ErrorCode` và `GATEWAY_PROTOCOL_VERSION`

Frame loại không xác định được giữ nguyên dưới dạng payload thô để tương thích ngược.

## Versioning + compatibility

- `PROTOCOL_VERSION` nằm trong `src/gateway/protocol/schema.ts`.
- Client gửi `minProtocol` + `maxProtocol`; server từ chối nếu không khớp.
- Swift models giữ lại frame loại không xác định để tránh phá vỡ client cũ.

## Schema patterns và conventions

- Hầu hết các object dùng `additionalProperties: false` để payload chặt chẽ.
- `NonEmptyString` là mặc định cho ID và tên method/event.
- `GatewayFrame` cấp cao nhất dùng **discriminator** trên `type`.
- Method có side effects thường yêu cầu `idempotencyKey` trong params (ví dụ: `send`, `poll`, `agent`, `chat.send`).
- `agent` chấp nhận `internalEvents` tùy chọn cho ngữ cảnh điều phối sinh ra tại runtime (ví dụ: hoàn thành task subagent/cron); coi đây là bề mặt API nội bộ.

## Live schema JSON

JSON Schema sinh ra nằm trong repo tại `dist/protocol.schema.json`. File raw được publish thường có sẵn tại:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Khi thay đổi schema

1. Cập nhật TypeBox schemas.
2. Chạy `pnpm protocol:check`.
3. Commit schema + Swift models đã được sinh ra.\n