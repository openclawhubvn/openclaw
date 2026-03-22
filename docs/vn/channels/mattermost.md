---
summary: "Thiết lập bot Mattermost và cấu hình OpenClaw"
read_when:
  - Thiết lập Mattermost
  - Gỡ lỗi định tuyến Mattermost
title: "Mattermost"
---

# Mattermost (plugin)

Trạng thái: hỗ trợ qua plugin (bot token + sự kiện WebSocket). Hỗ trợ kênh, nhóm và tin nhắn trực tiếp (DM).
Mattermost là nền tảng nhắn tin nhóm có thể tự host; xem chi tiết sản phẩm và tải xuống tại
[trang chính thức của Mattermost](https://mattermost.com).

## Yêu cầu plugin

Mattermost được cung cấp dưới dạng plugin và không đi kèm với cài đặt gốc.

Cài đặt qua CLI (npm registry):

```bash
openclaw plugins install @openclaw/mattermost
```

Kiểm tra cục bộ (khi chạy từ repo git):

```bash
openclaw plugins install ./extensions/mattermost
```

Nếu chọn Mattermost trong quá trình thiết lập và phát hiện có git checkout,
OpenClaw sẽ tự động cung cấp đường dẫn cài đặt cục bộ.

Chi tiết: [Plugins](/tools/plugin)

## Thiết lập nhanh

1. Cài đặt plugin Mattermost.
2. Tạo tài khoản bot Mattermost và sao chép **bot token**.
3. Sao chép **base URL** của Mattermost (ví dụ: `https://chat.example.com`).
4. Cấu hình OpenClaw và khởi động gateway.

Cấu hình tối thiểu:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Lệnh gạch chéo gốc

Lệnh gạch chéo gốc là tùy chọn. Khi bật, OpenClaw đăng ký các lệnh gạch chéo `oc_*` qua
API của Mattermost và nhận các callback POST trên máy chủ HTTP của gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Sử dụng khi Mattermost không thể truy cập trực tiếp vào gateway (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Lưu ý:

- `native: "auto"` mặc định là tắt cho Mattermost. Đặt `native: true` để bật.
- Nếu bỏ qua `callbackUrl`, OpenClaw sẽ tự động tạo từ host/port của gateway + `callbackPath`.
- Đối với thiết lập nhiều tài khoản, `commands` có thể được đặt ở cấp cao nhất hoặc dưới
  `channels.mattermost.accounts.<id>.commands` (giá trị tài khoản ghi đè các trường cấp cao nhất).
- Các callback lệnh được xác thực bằng token cho từng lệnh và sẽ thất bại nếu kiểm tra token thất bại.
- Yêu cầu khả năng truy cập: endpoint callback phải có thể truy cập từ máy chủ Mattermost.
  - Không đặt `callbackUrl` là `localhost` trừ khi Mattermost chạy trên cùng một host/network namespace với OpenClaw.
  - Không đặt `callbackUrl` là URL cơ sở của Mattermost trừ khi URL đó reverse-proxies `/api/channels/mattermost/command` đến OpenClaw.
  - Kiểm tra nhanh là `curl https://<gateway-host>/api/channels/mattermost/command`; một GET nên trả về `405 Method Not Allowed` từ OpenClaw, không phải `404`.
- Yêu cầu danh sách cho phép egress của Mattermost:
  - Nếu mục tiêu callback của bạn là địa chỉ private/tailnet/internal, đặt Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` để bao gồm host/domain của callback.
  - Sử dụng các mục host/domain, không phải URL đầy đủ.
    - Tốt: `gateway.tailnet-name.ts.net`
    - Xấu: `https://gateway.tailnet-name.ts.net`

## Biến môi trường (tài khoản mặc định)

Đặt các biến này trên host của gateway nếu bạn thích sử dụng biến môi trường:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Biến môi trường chỉ áp dụng cho tài khoản **mặc định** (`default`). Các tài khoản khác phải sử dụng giá trị cấu hình.

## Chế độ chat

Mattermost tự động phản hồi các tin nhắn trực tiếp (DM). Hành vi trong kênh được kiểm soát bởi `chatmode`:

- `oncall` (mặc định): chỉ phản hồi khi được @mention trong kênh.
- `onmessage`: phản hồi mọi tin nhắn trong kênh.
- `onchar`: phản hồi khi tin nhắn bắt đầu bằng một tiền tố kích hoạt.

Ví dụ cấu hình:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Lưu ý:

- `onchar` vẫn phản hồi khi được @mention rõ ràng.
- `channels.mattermost.requireMention` được tôn trọng cho cấu hình cũ nhưng `chatmode` được ưu tiên.

## Luồng và phiên

Sử dụng `channels.mattermost.replyToMode` để kiểm soát xem các phản hồi trong kênh và nhóm có ở lại trong
kênh chính hay bắt đầu một luồng dưới bài đăng kích hoạt.

- `off` (mặc định): chỉ trả lời trong một luồng khi bài đăng đầu vào đã ở trong một luồng.
- `first`: đối với các bài đăng cấp cao nhất trong kênh/nhóm, bắt đầu một luồng dưới bài đăng đó và định tuyến
  cuộc trò chuyện đến một phiên có phạm vi luồng.
- `all`: hành vi tương tự như `first` cho Mattermost hiện nay.
- Tin nhắn trực tiếp bỏ qua cài đặt này và không có luồng.

Ví dụ cấu hình:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Lưu ý:

- Các phiên có phạm vi luồng sử dụng id bài đăng kích hoạt làm gốc luồng.
- `first` và `all` hiện tại tương đương nhau vì một khi Mattermost có gốc luồng,
  các phần tiếp theo và phương tiện tiếp tục trong cùng một luồng.

## Kiểm soát truy cập (DMs)

- Mặc định: `channels.mattermost.dmPolicy = "pairing"` (người gửi không xác định nhận mã ghép đôi).
- Phê duyệt qua:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Tin nhắn trực tiếp công khai: `channels.mattermost.dmPolicy="open"` cộng với `channels.mattermost.allowFrom=["*"]`.

## Kênh (nhóm)

- Mặc định: `channels.mattermost.groupPolicy = "allowlist"` (được kiểm soát bởi mention).
- Danh sách cho phép người gửi với `channels.mattermost.groupAllowFrom` (khuyến nghị sử dụng ID người dùng).
- Khớp `@username` có thể thay đổi và chỉ được bật khi `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Kênh mở: `channels.mattermost.groupPolicy="open"` (được kiểm soát bởi mention).
- Ghi chú runtime: nếu `channels.mattermost` hoàn toàn thiếu, runtime sẽ quay lại `groupPolicy="allowlist"` cho kiểm tra nhóm (ngay cả khi `channels.defaults.groupPolicy` được đặt).

## Mục tiêu cho việc gửi đi

Sử dụng các định dạng mục tiêu này với `openclaw message send` hoặc cron/webhooks:

- `channel:<id>` cho một kênh
- `user:<id>` cho một DM
- `@username` cho một DM (được giải quyết qua API của Mattermost)

ID không rõ ràng (như `64ifufp...`) là **không rõ ràng** trong Mattermost (ID người dùng so với ID kênh).

OpenClaw giải quyết chúng **ưu tiên người dùng**:

- Nếu ID tồn tại dưới dạng người dùng (`GET /api/v4/users/<id>` thành công), OpenClaw gửi một **DM** bằng cách giải quyết kênh trực tiếp qua `/api/v4/channels/direct`.
- Nếu không, ID được coi là **ID kênh**.

Nếu cần hành vi xác định, luôn sử dụng các tiền tố rõ ràng (`user:<id>` / `channel:<id>`).

## Thử lại kênh DM

Khi OpenClaw gửi đến mục tiêu DM của Mattermost và cần giải quyết kênh trực tiếp trước, nó
thử lại các lỗi tạo kênh trực tiếp tạm thời theo mặc định.

Sử dụng `channels.mattermost.dmChannelRetry` để điều chỉnh hành vi đó toàn cầu cho plugin Mattermost,
hoặc `channels.mattermost.accounts.<id>.dmChannelRetry` cho một tài khoản.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Lưu ý:

- Điều này chỉ áp dụng cho việc tạo kênh DM (`/api/v4/channels/direct`), không phải mọi cuộc gọi API của Mattermost.
- Thử lại áp dụng cho các lỗi tạm thời như giới hạn tốc độ, phản hồi 5xx và lỗi mạng hoặc timeout.
- Các lỗi client 4xx khác ngoài `429` được coi là vĩnh viễn và không được thử lại.

## Phản ứng (công cụ tin nhắn)

- Sử dụng `message action=react` với `channel=mattermost`.
- `messageId` là id bài đăng của Mattermost.
- `emoji` chấp nhận các tên như `thumbsup` hoặc `:+1:` (dấu hai chấm là tùy chọn).
- Đặt `remove=true` (boolean) để xóa một phản ứng.
- Các sự kiện thêm/xóa phản ứng được chuyển tiếp dưới dạng sự kiện hệ thống đến phiên agent được định tuyến.

Ví dụ:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Cấu hình:

- `channels.mattermost.actions.reactions`: bật/tắt hành động phản ứng (mặc định là true).
- Ghi đè theo tài khoản: `channels.mattermost.accounts.<id>.actions.reactions`.

## Nút tương tác (công cụ tin nhắn)

Gửi tin nhắn với các nút có thể nhấp. Khi người dùng nhấp vào nút, agent nhận được
lựa chọn và có thể phản hồi.

Bật nút bằng cách thêm `inlineButtons` vào khả năng của kênh:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Sử dụng `message action=send` với tham số `buttons`. Nút là một mảng 2D (các hàng của nút):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Các trường của nút:

- `text` (bắt buộc): nhãn hiển thị.
- `callback_data` (bắt buộc): giá trị gửi lại khi nhấp (được sử dụng làm ID hành động).
- `style` (tùy chọn): `"default"`, `"primary"`, hoặc `"danger"`.

Khi người dùng nhấp vào nút:

1. Tất cả các nút được thay thế bằng một dòng xác nhận (ví dụ: "✓ **Yes** được chọn bởi @user").
2. Agent nhận được lựa chọn dưới dạng tin nhắn đầu vào và phản hồi.

Lưu ý:

- Các callback của nút sử dụng xác minh HMAC-SHA256 (tự động, không cần cấu hình).
- Mattermost loại bỏ dữ liệu callback khỏi các phản hồi API của nó (tính năng bảo mật), vì vậy tất cả các nút
  bị xóa khi nhấp — không thể xóa một phần.
- Các ID hành động chứa dấu gạch ngang hoặc gạch dưới được tự động làm sạch
  (giới hạn định tuyến của Mattermost).

Cấu hình:

- `channels.mattermost.capabilities`: mảng các chuỗi khả năng. Thêm `"inlineButtons"` để
  bật mô tả công cụ nút trong lời nhắc hệ thống của agent.
- `channels.mattermost.interactions.callbackBaseUrl`: URL cơ sở bên ngoài tùy chọn cho các callback của nút
  (ví dụ `https://gateway.example.com`). Sử dụng điều này khi Mattermost không thể
  truy cập vào gateway tại host bind của nó trực tiếp.
- Trong các thiết lập nhiều tài khoản, bạn cũng có thể đặt cùng một trường dưới
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Nếu `interactions.callbackBaseUrl` bị bỏ qua, OpenClaw sẽ tự động tạo URL callback từ
  `gateway.customBindHost` + `gateway.port`, sau đó quay lại `http://localhost:<port>`.
- Quy tắc khả năng truy cập: URL callback của nút phải có thể truy cập từ máy chủ Mattermost.
  `localhost` chỉ hoạt động khi Mattermost và OpenClaw chạy trên cùng một host/network namespace.
- Nếu mục tiêu callback của bạn là private/tailnet/internal, thêm host/domain của nó vào Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`.

### Tích hợp API trực tiếp (script bên ngoài)

Các script bên ngoài và webhooks có thể đăng nút trực tiếp qua API REST của Mattermost
thay vì thông qua công cụ `message` của agent. Sử dụng `buildButtonAttachments()` từ
extension khi có thể; nếu đăng JSON thô, tuân theo các quy tắc sau:

**Cấu trúc payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Chọn một tùy chọn:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // chỉ chữ và số — xem bên dưới
            type: "button", // bắt buộc, nếu không nhấp sẽ bị bỏ qua
            name: "Approve", // nhãn hiển thị
            style: "primary", // tùy chọn: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // phải khớp với id của nút (để tra cứu tên)
                action: "approve",
                // ... bất kỳ trường tùy chỉnh nào ...
                _token: "<hmac>", // xem phần HMAC bên dưới
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Quy tắc quan trọng:**

1. Attachments đi vào `props.attachments`, không phải `attachments` cấp cao nhất (bị bỏ qua).
2. Mỗi hành động cần `type: "button"` — nếu không có, nhấp sẽ bị bỏ qua.
3. Mỗi hành động cần một trường `id` — Mattermost bỏ qua các hành động không có ID.
4. ID hành động phải **chỉ chữ và số** (`[a-zA-Z0-9]`). Dấu gạch ngang và gạch dưới làm hỏng
   định tuyến hành động của Mattermost (trả về 404). Loại bỏ chúng trước khi sử dụng.
5. `context.action_id` phải khớp với `id` của nút để thông báo xác nhận hiển thị tên
   nút (ví dụ: "Approve") thay vì ID thô.
6. `context.action_id` là bắt buộc — trình xử lý tương tác trả về 400 nếu không có.

**Tạo token HMAC:**

Gateway xác minh các lần nhấp nút bằng HMAC-SHA256. Các script bên ngoài phải tạo token
khớp với logic xác minh của gateway:

1. Tạo secret từ bot token:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Xây dựng đối tượng context với tất cả các trường **trừ** `_token`.
3. Tuần tự hóa với **các khóa được sắp xếp** và **không có khoảng trắng** (gateway sử dụng `JSON.stringify`
   với các khóa được sắp xếp, tạo ra đầu ra gọn gàng).
4. Ký: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Thêm mã băm hex kết quả làm `_token` trong context.

Ví dụ Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Các lỗi phổ biến của HMAC:

- `json.dumps` của Python thêm khoảng trắng theo mặc định (`{"key": "val"}`). Sử dụng
  `separators=(",", ":")` để khớp với đầu ra gọn gàng của JavaScript (`{"key":"val"}`).
- Luôn ký **tất cả** các trường context (trừ `_token`). Gateway loại bỏ `_token` rồi
  ký tất cả những gì còn lại. Ký một phần gây ra lỗi xác minh im lặng.
- Sử dụng `sort_keys=True` — gateway sắp xếp các khóa trước khi ký, và Mattermost có thể
  sắp xếp lại các trường context khi lưu trữ payload.
- Tạo secret từ bot token (xác định), không phải byte ngẫu nhiên. Secret
  phải giống nhau trên quá trình tạo nút và gateway xác minh.

## Bộ điều hợp thư mục

Plugin Mattermost bao gồm một bộ điều hợp thư mục giải quyết tên kênh và người dùng
qua API của Mattermost. Điều này cho phép `#channel-name` và `@username` làm mục tiêu trong
`openclaw message send` và các giao hàng cron/webhook.

Không cần cấu hình — bộ điều hợp sử dụng bot token từ cấu hình tài khoản.

## Nhiều tài khoản

Mattermost hỗ trợ nhiều tài khoản dưới `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Gỡ lỗi

- Không có phản hồi trong kênh: đảm bảo bot có trong kênh và mention nó (oncall), sử dụng tiền tố kích hoạt (onchar), hoặc đặt `chatmode: "onmessage"`.
- Lỗi xác thực: kiểm tra bot token, base URL và xem tài khoản có được bật không.
- Vấn đề nhiều tài khoản: biến môi trường chỉ áp dụng cho tài khoản `default`.
- Nút xuất hiện dưới dạng hộp trắng: agent có thể đang gửi dữ liệu nút không hợp lệ. Kiểm tra rằng mỗi nút có cả trường `text` và `callback_data`.
- Nút hiển thị nhưng nhấp không có tác dụng: xác minh `AllowedUntrustedInternalConnections` trong cấu hình máy chủ Mattermost bao gồm `127.0.0.1 localhost`, và rằng `EnablePostActionIntegration` là `true` trong ServiceSettings.
- Nút trả về 404 khi nhấp: ID của nút có thể chứa dấu gạch ngang hoặc gạch dưới. Bộ định tuyến hành động của Mattermost bị lỗi với các ID không phải chữ và số. Sử dụng `[a-zA-Z0-9]` chỉ.
- Gateway ghi `invalid _token`: không khớp HMAC. Kiểm tra rằng bạn ký tất cả các trường context (không phải một phần), sử dụng các khóa được sắp xếp, và sử dụng JSON gọn gàng (không có khoảng trắng). Xem phần HMAC ở trên.
- Gateway ghi `missing _token in context`: trường `_token` không có trong context của nút. Đảm bảo nó được bao gồm khi xây dựng payload tích hợp.
- Xác nhận hiển thị ID thô thay vì tên nút: `context.action_id` không khớp với `id` của nút. Đặt cả hai thành cùng một giá trị đã được làm sạch.
- Agent không biết về nút: thêm `capabilities: ["inlineButtons"]` vào cấu hình kênh Mattermost.
