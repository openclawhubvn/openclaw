---
summary: "Tìm hiểu cách sử dụng TypeBox để tạo schema duy nhất cho giao thức gateway, tối ưu hóa cấu hình hệ thống của bạn."
read_when:
  - Cập nhật schema giao thức hoặc codegen
title: "Hướng Dẫn Sử Dụng TypeBox Trong Gateway"
---

# TypeBox là nguồn duy nhất cho giao thức

Cập nhật lần cuối: 2026-01-10

TypeBox là thư viện schema ưu tiên TypeScript. Chúng tôi sử dụng nó để định nghĩa **giao thức Gateway WebSocket** (handshake, request/response, sự kiện server). Các schema này điều khiển **xác thực runtime**, **xuất JSON Schema**, và **Swift codegen** cho ứng dụng macOS. Một nguồn duy nhất; mọi thứ khác được tạo ra từ đây.

Nếu bạn muốn tìm hiểu thêm về giao thức ở mức cao hơn, hãy bắt đầu với [Kiến trúc Gateway](/concepts/architecture).

## Mô hình tư duy (30 giây)

Mỗi thông điệp Gateway WS là một trong ba khung:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

Khung đầu tiên **phải** là một yêu cầu `connect`. Sau đó, client có thể gọi các phương thức (ví dụ: `health`, `send`, `chat.send`) và đăng ký sự kiện (ví dụ: `presence`, `tick`, `agent`).

Luồng kết nối (tối thiểu):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Các phương thức + sự kiện phổ biến:

| Danh mục  | Ví dụ                                                      | Ghi chú                             |
| --------- | ---------------------------------------------------------- | ----------------------------------- |
| Core      | `connect`, `health`, `status`                              | `connect` phải là đầu tiên          |
| Messaging | `send`, `poll`, `agent`, `agent.wait`                      | tác động phụ cần `idempotencyKey`   |
| Chat      | `chat.history`, `chat.send`, `chat.abort`, `chat.inject`   | WebChat sử dụng các phương thức này |
| Sessions  | `sessions.list`, `sessions.patch`, `sessions.delete`       | quản lý phiên                       |
| Nodes     | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + hành động node         |
| Events    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | server push                         |

Danh sách chính thức nằm trong `src/gateway/server.ts` (`METHODS`, `EVENTS`).

## Nơi lưu trữ các schema

- Nguồn: `src/gateway/protocol/schema.ts`
- Trình xác thực runtime (AJV): `src/gateway/protocol/index.ts`
- Handshake server + phân phối phương thức: `src/gateway/server.ts`
- Client node: `src/gateway/client.ts`
- JSON Schema được tạo: `dist/protocol.schema.json`
- Mô hình Swift được tạo: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Quy trình hiện tại

- `pnpm protocol:gen`
  - ghi JSON Schema (draft‑07) vào `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - tạo mô hình Swift gateway
- `pnpm protocol:check`
  - chạy cả hai trình tạo và xác minh đầu ra đã được commit

## Cách sử dụng schema tại runtime

- **Phía server**: mỗi khung inbound được xác thực với AJV. Handshake chỉ chấp nhận yêu cầu `connect` có params khớp với `ConnectParams`.
- **Phía client**: client JS xác thực khung sự kiện và phản hồi trước khi sử dụng.
- **Bề mặt phương thức**: Gateway quảng cáo các `methods` và `events` được hỗ trợ trong `hello-ok`.

## Ví dụ về khung

Kết nối (thông điệp đầu tiên):

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

Phản hồi Hello-ok:

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

Yêu cầu + phản hồi:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Sự kiện:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Client tối thiểu (Node.js)

Luồng nhỏ nhất hữu ích: kết nối + health.

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

## Ví dụ thực tế: thêm một phương thức từ đầu đến cuối

Ví dụ: thêm yêu cầu `system.echo` mới trả về `{ ok: true, text }`.

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

Thêm cả hai vào `ProtocolSchemas` và xuất các kiểu:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Xác thực**

Trong `src/gateway/protocol/index.ts`, xuất một trình xác thực AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Hành vi server**

Thêm một handler trong `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Đăng ký nó trong `src/gateway/server-methods.ts` (đã gộp `systemHandlers`), sau đó thêm `"system.echo"` vào `METHODS` trong `src/gateway/server.ts`.

4. **Tái tạo**

```bash
pnpm protocol:check
```

5. **Kiểm tra + tài liệu**

Thêm một bài kiểm tra server trong `src/gateway/server.*.test.ts` và ghi chú phương thức trong tài liệu.

## Hành vi codegen Swift

Trình tạo Swift phát ra:

- Enum `GatewayFrame` với các trường hợp `req`, `res`, `event`, và `unknown`
- Các struct/enum payload kiểu mạnh
- Giá trị `ErrorCode` và `GATEWAY_PROTOCOL_VERSION`

Các loại khung không xác định được giữ nguyên dưới dạng payload thô để đảm bảo khả năng tương thích về sau.

## Phiên bản + khả năng tương thích

- `PROTOCOL_VERSION` nằm trong `src/gateway/protocol/schema.ts`.
- Client gửi `minProtocol` + `maxProtocol`; server từ chối nếu không khớp.
- Các mô hình Swift giữ lại các loại khung không xác định để tránh làm hỏng các client cũ hơn.

## Mẫu và quy ước schema

- Hầu hết các đối tượng sử dụng `additionalProperties: false` để đảm bảo payload chặt chẽ.
- `NonEmptyString` là mặc định cho ID và tên phương thức/sự kiện.
- `GatewayFrame` cấp cao nhất sử dụng **discriminator** trên `type`.
- Các phương thức có tác động phụ thường yêu cầu `idempotencyKey` trong params (ví dụ: `send`, `poll`, `agent`, `chat.send`).
- `agent` chấp nhận `internalEvents` tùy chọn cho ngữ cảnh điều phối được tạo runtime (ví dụ: hoàn thành nhiệm vụ subagent/cron); coi đây là bề mặt API nội bộ.

## JSON schema trực tiếp

JSON Schema được tạo nằm trong repo tại `dist/protocol.schema.json`. Tệp thô đã xuất bản thường có sẵn tại:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Khi bạn thay đổi schema

1. Cập nhật các schema TypeBox.
2. Chạy `pnpm protocol:check`.
3. Commit schema đã tái tạo + mô hình Swift.
