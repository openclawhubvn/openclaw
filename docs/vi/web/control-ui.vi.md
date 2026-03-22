---
summary: "Giao diện điều khiển qua trình duyệt cho Gateway (chat, nodes, config)"
read_when:
  - Muốn điều khiển Gateway từ trình duyệt
  - Muốn truy cập Tailnet không cần SSH tunnels
title: "Control UI"
---

# Control UI (trình duyệt)

Control UI là một ứng dụng đơn trang nhỏ dùng **Vite + Lit** được Gateway phục vụ:

- mặc định: `http://<host>:18789/`
- prefix tùy chọn: cấu hình `gateway.controlUi.basePath` (ví dụ: `/openclaw`)

Nó kết nối **trực tiếp với Gateway WebSocket** trên cùng cổng.

## Mở nhanh (local)

Nếu Gateway chạy trên cùng máy, mở:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))

Nếu trang không tải được, chạy Gateway trước: `openclaw gateway`.

Xác thực được cung cấp trong quá trình bắt tay WebSocket qua:

- `connect.params.auth.token`
- `connect.params.auth.password`

Bảng cài đặt dashboard giữ token cho tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu lại. Onboarding tạo token gateway mặc định, dán vào đây khi kết nối lần đầu.

## Ghép nối thiết bị (kết nối lần đầu)

Khi kết nối Control UI từ trình duyệt hoặc thiết bị mới, Gateway yêu cầu **duyệt ghép nối một lần** — ngay cả khi đang trên cùng Tailnet với `gateway.auth.allowTailscale: true`. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

**Bạn sẽ thấy:** "disconnected (1008): pairing required"

**Để duyệt thiết bị:**

```bash
# Liệt kê yêu cầu chờ
openclaw devices list

# Duyệt theo request ID
openclaw devices approve <requestId>
```

Nếu trình duyệt thử ghép nối lại với thông tin xác thực thay đổi (role/scopes/public key), yêu cầu chờ trước đó bị thay thế và tạo `requestId` mới. Chạy lại `openclaw devices list` trước khi duyệt.

Khi đã duyệt, thiết bị được ghi nhớ và không cần duyệt lại trừ khi bạn thu hồi với `openclaw devices revoke --device <id> --role <role>`. Xem [Devices CLI](/cli/devices) để xoay vòng và thu hồi token.

**Lưu ý:**

- Kết nối local (`127.0.0.1`) được duyệt tự động.
- Kết nối từ xa (LAN, Tailnet, v.v.) cần duyệt rõ ràng.
- Mỗi profile trình duyệt tạo ID thiết bị riêng, nên đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ cần ghép nối lại.

## Hỗ trợ ngôn ngữ

Control UI có thể tự động chọn ngôn ngữ dựa trên locale trình duyệt khi tải lần đầu, và bạn có thể thay đổi sau từ trình chọn ngôn ngữ trong thẻ Access.

- Locale hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`
- Bản dịch không phải tiếng Anh được tải lười biếng trong trình duyệt.
- Locale đã chọn được lưu trong bộ nhớ trình duyệt và tái sử dụng khi truy cập lại.
- Khóa dịch thiếu sẽ mặc định về tiếng Anh.

## Chức năng hiện tại

- Chat với model qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Stream tool calls + live tool output cards trong Chat (sự kiện agent)
- Channels: trạng thái WhatsApp/Telegram/Discord/Slack + plugin channels (Mattermost, v.v.) + QR login + cấu hình từng channel (`channels.status`, `web.login.*`, `config.patch`)
- Instances: danh sách hiện diện + làm mới (`system-presence`)
- Sessions: danh sách + ghi đè thinking/fast/verbose/reasoning từng session (`sessions.list`, `sessions.patch`)
- Cron jobs: danh sách/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`)
- Skills: trạng thái, bật/tắt, cài đặt, cập nhật API key (`skills.*`)
- Nodes: danh sách + caps (`node.list`)
- Exec approvals: sửa allowlists gateway hoặc node + hỏi policy cho `exec host=gateway/node` (`exec.approvals.*`)
- Config: xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Config: áp dụng + khởi động lại với xác thực (`config.apply`) và đánh thức session hoạt động cuối cùng
- Ghi config bao gồm bảo vệ base-hash để ngăn ghi đè chỉnh sửa đồng thời
- Schema config + form rendering (`config.schema`, bao gồm plugin + channel schemas); Raw JSON editor vẫn có sẵn
- Debug: trạng thái/sức khỏe/models snapshots + nhật ký sự kiện + gọi RPC thủ công (`status`, `health`, `models.list`)
- Logs: tail trực tiếp file logs gateway với filter/export (`logs.tail`)
- Update: chạy cập nhật package/git + khởi động lại (`update.run`) với báo cáo khởi động lại

Ghi chú panel Cron jobs:

- Với jobs cô lập, mặc định gửi thông báo tóm tắt. Có thể chuyển sang không nếu chỉ muốn chạy nội bộ.
- Trường Channel/target xuất hiện khi chọn thông báo.
- Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` là URL webhook HTTP(S) hợp lệ.
- Với jobs main-session, có sẵn chế độ gửi webhook và không.
- Điều khiển chỉnh sửa nâng cao bao gồm xóa sau khi chạy, xóa ghi đè agent, tùy chọn cron exact/stagger,
  ghi đè agent model/thinking, và bật tắt gửi nỗ lực tốt nhất.
- Xác thực form là inline với lỗi cấp trường; giá trị không hợp lệ sẽ vô hiệu hóa nút lưu cho đến khi sửa.
- Đặt `cron.webhookToken` để gửi token bearer riêng, nếu không webhook sẽ gửi không có header xác thực.
- Fallback cũ: jobs legacy lưu với `notify: true` vẫn có thể dùng `cron.webhook` cho đến khi di chuyển.

## Hành vi Chat

- `chat.send` là **không chặn**: nó xác nhận ngay với `{ runId, status: "started" }` và phản hồi stream qua sự kiện `chat`.
- Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
- Phản hồi `chat.history` bị giới hạn kích thước để an toàn UI. Khi các mục transcript quá lớn, Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua các khối metadata nặng, và thay thế các tin nhắn quá lớn bằng placeholder (`[chat.history omitted: message too large]`).
- `chat.inject` thêm ghi chú trợ lý vào transcript session và phát sự kiện `chat` cho cập nhật chỉ UI (không chạy agent, không gửi channel).
- Dừng:
  - Nhấn **Stop** (gọi `chat.abort`)
  - Gõ `/stop` (hoặc các cụm từ dừng độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để dừng ngoài băng tần
  - `chat.abort` hỗ trợ `{ sessionKey }` (không `runId`) để dừng tất cả các lần chạy hoạt động cho session đó
- Giữ lại một phần khi hủy:
  - Khi một lần chạy bị hủy, văn bản trợ lý một phần vẫn có thể hiển thị trong UI
  - Gateway lưu trữ văn bản trợ lý một phần bị hủy vào lịch sử transcript khi có đầu ra đệm
  - Các mục lưu trữ bao gồm metadata hủy để người tiêu dùng transcript có thể phân biệt giữa các phần hủy và đầu ra hoàn thành bình thường

## Truy cập Tailnet (khuyến nghị)

### Tích hợp Tailscale Serve (ưu tiên)

Giữ Gateway trên loopback và để Tailscale Serve proxy nó với HTTPS:

```bash
openclaw gateway --tailscale serve
```

Mở:

- `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình)

Mặc định, yêu cầu Control UI/WebSocket Serve có thể xác thực qua headers định danh Tailscale
(`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw
xác minh định danh bằng cách giải quyết địa chỉ `x-forwarded-for` với
`tailscale whois` và khớp nó với header, và chỉ chấp nhận khi
yêu cầu đánh vào loopback với headers `x-forwarded-*` của Tailscale. Đặt
`gateway.auth.allowTailscale: false` (hoặc buộc `gateway.auth.mode: "password"`)
nếu muốn yêu cầu token/mật khẩu ngay cả với lưu lượng Serve.
Xác thực Serve không cần token giả định host gateway là đáng tin cậy. Nếu mã local không tin cậy có thể chạy trên host đó, yêu cầu xác thực token/mật khẩu.

### Bind to tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Sau đó mở:

- `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` đã cấu hình)

Dán token vào cài đặt UI (gửi dưới dạng `connect.params.auth.token`).

## HTTP không bảo mật

Nếu mở dashboard qua HTTP thường (`http://<lan-ip>` hoặc `http://<tailscale-ip>`),
trình duyệt chạy trong **ngữ cảnh không bảo mật** và chặn WebCrypto. Mặc định,
OpenClaw **chặn** kết nối Control UI không có định danh thiết bị.

**Khuyến nghị sửa:** dùng HTTPS (Tailscale Serve) hoặc mở UI local:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (trên host gateway)

**Hành vi bật tắt xác thực không bảo mật:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` chỉ là bật tắt tương thích local:

- Nó cho phép các phiên Control UI localhost tiếp tục mà không cần định danh thiết bị trong
  ngữ cảnh HTTP không bảo mật.
- Nó không bỏ qua kiểm tra ghép nối.
- Nó không nới lỏng yêu cầu định danh thiết bị từ xa (không phải localhost).

**Chỉ dùng khi khẩn cấp:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` vô hiệu hóa kiểm tra định danh thiết bị Control UI và là
một hạ cấp bảo mật nghiêm trọng. Khôi phục nhanh chóng sau khi sử dụng khẩn cấp.

Xem [Tailscale](/gateway/tailscale) để được hướng dẫn thiết lập HTTPS.

## Xây dựng UI

Gateway phục vụ các file tĩnh từ `dist/control-ui`. Xây dựng chúng với:

```bash
pnpm ui:build # tự động cài đặt phụ thuộc UI lần đầu chạy
```

Base tuyệt đối tùy chọn (khi muốn URL tài sản cố định):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Để phát triển local (server dev riêng):

```bash
pnpm ui:dev # tự động cài đặt phụ thuộc UI lần đầu chạy
```

Sau đó trỏ UI vào URL Gateway WS của bạn (ví dụ: `ws://127.0.0.1:18789`).

## Debug/testing: dev server + remote Gateway

Control UI là các file tĩnh; mục tiêu WebSocket có thể cấu hình và có thể
khác với nguồn gốc HTTP. Điều này hữu ích khi muốn server dev Vite
local nhưng Gateway chạy ở nơi khác.

1. Khởi động server dev UI: `pnpm ui:dev`
2. Mở URL như:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Xác thực một lần tùy chọn (nếu cần):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Lưu ý:

- `gatewayUrl` được lưu trong localStorage sau khi tải và bị xóa khỏi URL.
- `token` nên được truyền qua fragment URL (`#token=...`) bất cứ khi nào có thể. Fragments không được gửi đến server, tránh rò rỉ nhật ký yêu cầu và Referer. Tham số query `?token=` cũ vẫn được nhập một lần để tương thích, nhưng chỉ là fallback, và bị xóa ngay sau bootstrap.
- `password` chỉ được giữ trong bộ nhớ.
- Khi `gatewayUrl` được đặt, UI không quay lại config hoặc thông tin môi trường.
  Cung cấp `token` (hoặc `password`) rõ ràng. Thiếu thông tin xác thực rõ ràng là lỗi.
- Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
- `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn clickjacking.
- Các triển khai Control UI không phải loopback phải đặt `gateway.controlUi.allowedOrigins`
  rõ ràng (nguồn đầy đủ). Điều này bao gồm các thiết lập dev từ xa.
- Không dùng `gateway.controlUi.allowedOrigins: ["*"]` trừ khi kiểm soát chặt chẽ
  thử nghiệm local. Nó có nghĩa là cho phép bất kỳ nguồn gốc trình duyệt nào, không phải “khớp với host tôi đang dùng.”
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` kích hoạt
  chế độ fallback nguồn gốc Host-header, nhưng đây là chế độ bảo mật nguy hiểm.

Ví dụ:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Chi tiết thiết lập truy cập từ xa: [Remote access](/gateway/remote).\n