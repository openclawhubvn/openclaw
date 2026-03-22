---
summary: "Giao thức Gateway WebSocket: bắt tay, khung dữ liệu, phiên bản"
read_when:
  - Triển khai hoặc cập nhật client WS cho gateway
  - Debug lỗi không khớp giao thức hoặc kết nối thất bại
  - Tái tạo schema/model giao thức
title: "Giao thức Gateway"
---

# Giao thức Gateway (WebSocket)

Giao thức Gateway WS là **mặt phẳng điều khiển duy nhất + vận chuyển node** cho OpenClaw. Tất cả client (CLI, web UI, app macOS, node iOS/Android, node không đầu) kết nối qua WebSocket và khai báo **vai trò** + **phạm vi** khi bắt tay.

## Vận chuyển

- WebSocket, khung dữ liệu dạng text với payload JSON.
- Khung đầu tiên **phải** là yêu cầu `connect`.

## Bắt tay (connect)

Gateway → Client (thử thách trước khi kết nối):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Client:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

Khi một device token được cấp, `hello-ok` cũng bao gồm:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

### Ví dụ Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Khung dữ liệu

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Các phương thức có tác dụng phụ yêu cầu **idempotency keys** (xem schema).

## Vai trò + phạm vi

### Vai trò

- `operator` = client mặt phẳng điều khiển (CLI/UI/tự động hóa).
- `node` = host khả năng (camera/screen/canvas/system.run).

### Phạm vi (operator)

Phạm vi phổ biến:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`

Phạm vi phương thức chỉ là cổng đầu tiên. Một số lệnh slash qua `chat.send` áp dụng kiểm tra cấp lệnh nghiêm ngặt hơn. Ví dụ, ghi `/config set` và `/config unset` yêu cầu `operator.admin`.

### Caps/commands/permissions (node)

Nodes khai báo khả năng khi kết nối:

- `caps`: danh mục khả năng cấp cao.
- `commands`: danh sách lệnh cho phép.
- `permissions`: bật/tắt chi tiết (ví dụ: `screen.record`, `camera.capture`).

Gateway coi đây là **claims** và thực thi danh sách cho phép phía server.

## Hiện diện

- `system-presence` trả về các mục được khóa bằng danh tính thiết bị.
- Các mục hiện diện bao gồm `deviceId`, `roles`, và `scopes` để UI có thể hiển thị một hàng duy nhất cho mỗi thiết bị ngay cả khi nó kết nối dưới dạng **operator** và **node**.

### Phương thức trợ giúp Node

- Nodes có thể gọi `skills.bins` để lấy danh sách hiện tại của các skill executables cho kiểm tra tự động cho phép.

### Phương thức trợ giúp Operator

- Operators có thể gọi `tools.catalog` (`operator.read`) để lấy catalog công cụ runtime cho một agent. Phản hồi bao gồm các công cụ được nhóm và metadata nguồn gốc:
  - `source`: `core` hoặc `plugin`
  - `pluginId`: chủ sở hữu plugin khi `source="plugin"`
  - `optional`: liệu công cụ plugin có tùy chọn không

## Phê duyệt thực thi

- Khi một yêu cầu thực thi cần phê duyệt, gateway phát `exec.approval.requested`.
- Client operator giải quyết bằng cách gọi `exec.approval.resolve` (yêu cầu phạm vi `operator.approvals`).
- Đối với `host=node`, `exec.approval.request` phải bao gồm `systemRunPlan` (canonical `argv`/`cwd`/`rawCommand`/metadata session). Các yêu cầu thiếu `systemRunPlan` sẽ bị từ chối.

## Phiên bản

- `PROTOCOL_VERSION` nằm trong `src/gateway/protocol/schema.ts`.
- Clients gửi `minProtocol` + `maxProtocol`; server từ chối nếu không khớp.
- Schemas + models được tạo từ định nghĩa TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Xác thực

- Nếu `OPENCLAW_GATEWAY_TOKEN` (hoặc `--token`) được thiết lập, `connect.params.auth.token` phải khớp nếu không socket sẽ bị đóng.
- Sau khi ghép đôi, Gateway cấp một **device token** được giới hạn theo vai trò + phạm vi kết nối. Nó được trả về trong `hello-ok.auth.deviceToken` và nên được lưu trữ bởi client cho các kết nối sau này.
- Device tokens có thể được xoay/vô hiệu hóa qua `device.token.rotate` và `device.token.revoke` (yêu cầu phạm vi `operator.pairing`).
- Lỗi xác thực bao gồm `error.details.code` cùng với gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Hành vi client cho `AUTH_TOKEN_MISMATCH`:
  - Client đáng tin cậy có thể thử một lần retry giới hạn với token per-device đã cache.
  - Nếu retry đó thất bại, client nên dừng vòng lặp tự động kết nối lại và hiển thị hướng dẫn hành động cho operator.

## Danh tính thiết bị + ghép đôi

- Nodes nên bao gồm một danh tính thiết bị ổn định (`device.id`) được tạo từ dấu vân tay keypair.
- Gateways cấp token cho mỗi thiết bị + vai trò.
- Phê duyệt ghép đôi là bắt buộc cho các ID thiết bị mới trừ khi tự động phê duyệt cục bộ được bật.
- Kết nối **cục bộ** bao gồm loopback và địa chỉ tailnet của host gateway (vì vậy các kết nối tailnet cùng host vẫn có thể tự động phê duyệt).
- Tất cả client WS phải bao gồm danh tính `device` trong `connect` (operator + node). UI điều khiển có thể bỏ qua chỉ trong các chế độ này:
  - `gateway.controlUi.allowInsecureAuth=true` cho khả năng tương thích HTTP không an toàn chỉ localhost.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (phá vỡ, hạ cấp bảo mật nghiêm trọng).
- Tất cả kết nối phải ký nonce `connect.challenge` do server cung cấp.

### Chẩn đoán di chuyển xác thực thiết bị

Đối với các client cũ vẫn sử dụng hành vi ký trước thử thách, `connect` hiện trả về mã chi tiết `DEVICE_AUTH_*` dưới `error.details.code` với lý do ổn định `error.details.reason`.

Các lỗi di chuyển phổ biến:

| Thông điệp                  | details.code                     | details.reason           | Ý nghĩa                                             |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client bỏ qua `device.nonce` (hoặc gửi trống).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ký với nonce cũ/sai.                        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload chữ ký không khớp với payload v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Dấu thời gian ký nằm ngoài độ lệch cho phép.       |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp với dấu vân tay public key. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/canonicalization public key thất bại.    |

Mục tiêu di chuyển:

- Luôn chờ `connect.challenge`.
- Ký payload v2 bao gồm nonce server.
- Gửi cùng nonce trong `connect.params.device.nonce`.
- Payload chữ ký ưu tiên là `v3`, liên kết `platform` và `deviceFamily` ngoài các trường device/client/role/scopes/token/nonce.
- Chữ ký `v2` cũ vẫn được chấp nhận để tương thích, nhưng metadata thiết bị đã ghép đôi vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS + pinning

- TLS được hỗ trợ cho kết nối WS.
- Client có thể tùy chọn pin dấu vân tay cert gateway (xem cấu hình `gateway.tls` cộng với `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`).

## Phạm vi

Giao thức này cung cấp **toàn bộ API gateway** (trạng thái, kênh, mô hình, chat, agent, session, node, phê duyệt, v.v.). Bề mặt chính xác được định nghĩa bởi các schema TypeBox trong `src/gateway/protocol/schema.ts`.\n