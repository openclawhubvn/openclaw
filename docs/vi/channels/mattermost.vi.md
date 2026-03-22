---
summary: "Cài đặt bot Mattermost và cấu hình OpenClaw"
read_when:
  - Cài đặt Mattermost
  - Debug routing Mattermost
title: "Mattermost"
---

# Mattermost (plugin)

Trạng thái: hỗ trợ qua plugin (bot token + WebSocket events). Hỗ trợ Channels, groups, và DMs. Mattermost là nền tảng nhắn tin nhóm có thể tự host; xem chi tiết sản phẩm và tải về tại [mattermost.com](https://mattermost.com).

## Cần plugin

Mattermost được cung cấp dưới dạng plugin và không đi kèm với cài đặt core.

Cài đặt qua CLI (npm registry):

```bash
openclaw plugins install @openclaw/mattermost
```

Checkout local (khi chạy từ git repo):

```bash
openclaw plugins install ./extensions/mattermost
```

Nếu chọn Mattermost trong quá trình setup và phát hiện git checkout, OpenClaw sẽ tự động đề xuất đường dẫn cài đặt local.

Chi tiết: [Plugins](/tools/plugin)

## Cài đặt nhanh

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

## Slash commands gốc

Slash commands gốc là tùy chọn. Khi bật, OpenClaw đăng ký các slash commands `oc_*` qua API của Mattermost và nhận callback POST trên server HTTP của gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Lưu ý:

- `native: "auto"` mặc định là tắt cho Mattermost. Đặt `native: true` để bật.
- Nếu bỏ qua `callbackUrl`, OpenClaw sẽ tự suy ra từ host/port của gateway + `callbackPath`.
- Với cấu hình nhiều tài khoản, `commands` có thể đặt ở cấp cao nhất hoặc dưới `channels.mattermost.accounts.<id>.commands` (giá trị tài khoản ghi đè các trường cấp cao nhất).
- Các callback của command được xác thực bằng token từng command và sẽ thất bại nếu kiểm tra token thất bại.
- Yêu cầu khả năng truy cập: endpoint callback phải có thể truy cập từ server Mattermost.
  - Không đặt `callbackUrl` là `localhost` trừ khi Mattermost chạy trên cùng host/network namespace với OpenClaw.
  - Không đặt `callbackUrl` là base URL của Mattermost trừ khi URL đó reverse-proxies `/api/channels/mattermost/command` tới OpenClaw.
  - Kiểm tra nhanh bằng `curl https://<gateway-host>/api/channels/mattermost/command`; một GET nên trả về `405 Method Not Allowed` từ OpenClaw, không phải `404`.
- Yêu cầu allowlist egress của Mattermost:
  - Nếu callback nhắm tới địa chỉ private/tailnet/internal, đặt Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` để bao gồm host/domain của callback.
  - Sử dụng host/domain entries, không phải full URLs.
    - Tốt: `gateway.tailnet-name.ts.net`
    - Xấu: `https://gateway.tailnet-name.ts.net`

## Biến môi trường (tài khoản mặc định)

Đặt các biến này trên host của gateway nếu muốn dùng env vars:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Env vars chỉ áp dụng cho tài khoản **mặc định** (`default`). Các tài khoản khác phải dùng giá trị cấu hình.

## Chế độ chat

Mattermost tự động phản hồi DMs. Hành vi của Channel được kiểm soát bởi `chatmode`:

- `oncall` (mặc định): chỉ phản hồi khi được @mention trong channels.
- `onmessage`: phản hồi mọi tin nhắn trong channel.
- `onchar`: phản hồi khi tin nhắn bắt đầu bằng prefix trigger.

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

- `onchar` vẫn phản hồi các @mention rõ ràng.
- `channels.mattermost.requireMention` được tôn trọng cho cấu hình cũ nhưng `chatmode` được ưu tiên.

## Threading và sessions

Dùng `channels.mattermost.replyToMode` để kiểm soát xem các reply trong channel và group có ở lại trong channel chính hay bắt đầu một thread dưới post kích hoạt.

- `off` (mặc định): chỉ reply trong thread khi post inbound đã ở trong một thread.
- `first`: với các post channel/group cấp cao nhất, bắt đầu một thread dưới post đó và chuyển cuộc trò chuyện vào một session theo thread.
- `all`: hành vi giống `first` cho Mattermost hiện tại.
- Direct messages bỏ qua cài đặt này và không có threading.

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

- Các session theo thread dùng id của post kích hoạt làm root của thread.
- `first` và `all` hiện tại tương đương nhau vì khi Mattermost có root thread, các chunk và media tiếp theo tiếp tục trong cùng thread đó.

## Kiểm soát truy cập (DMs)

- Mặc định: `channels.mattermost.dmPolicy = "pairing"` (người gửi không xác định nhận mã pairing).
- Phê duyệt qua:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Public DMs: `channels.mattermost.dmPolicy="open"` cộng với `channels.mattermost.allowFrom=["*"]`.

## Channels (groups)

- Mặc định: `channels.mattermost.groupPolicy = "allowlist"` (mention-gated).
- Allowlist người gửi với `channels.mattermost.groupAllowFrom` (khuyến nghị dùng user IDs).
- `@username` matching có thể thay đổi và chỉ bật khi `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Mở channels: `channels.mattermost.groupPolicy="open"` (mention-gated).
- Ghi chú runtime: nếu `channels.mattermost` hoàn toàn thiếu, runtime sẽ quay lại `groupPolicy="allowlist"` cho kiểm tra group (ngay cả khi `channels.defaults.groupPolicy` đã được đặt).

## Mục tiêu cho outbound delivery

Dùng các định dạng mục tiêu này với `openclaw message send` hoặc cron/webhooks:

- `channel:<id>` cho một channel
- `user:<id>` cho một DM
- `@username` cho một DM (được giải quyết qua API của Mattermost)

Các ID mờ (như `64ifufp...`) **mơ hồ** trong Mattermost (user ID vs channel ID).

OpenClaw giải quyết chúng **ưu tiên user**:

- Nếu ID tồn tại như một user (`GET /api/v4/users/<id>` thành công), OpenClaw gửi một **DM** bằng cách giải quyết channel trực tiếp qua `/api/v4/channels/direct`.
- Nếu không, ID được coi là một **channel ID**.

Nếu cần hành vi xác định, luôn dùng các prefix rõ ràng (`user:<id>` / `channel:<id>`).

## DM channel retry

Khi OpenClaw gửi tới một mục tiêu DM Mattermost và cần giải quyết channel trực tiếp trước, nó mặc định retry các lỗi tạo channel trực tiếp tạm thời.

Dùng `channels.mattermost.dmChannelRetry` để điều chỉnh hành vi đó toàn cầu cho plugin Mattermost, hoặc `channels.mattermost.accounts.<id>.dmChannelRetry` cho một tài khoản.

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

- Điều này chỉ áp dụng cho việc tạo channel DM (`/api/v4/channels/direct`), không phải mọi cuộc gọi API của Mattermost.
- Retry áp dụng cho các lỗi tạm thời như giới hạn tốc độ, phản hồi 5xx, và lỗi mạng hoặc timeout.
- Các lỗi client 4xx khác ngoài `429` được coi là vĩnh viễn và không được retry.

## Reactions (công cụ tin nhắn)

- Dùng `message action=react` với `channel=mattermost`.
- `messageId` là id post của Mattermost.
- `emoji` chấp nhận các tên như `thumbsup` hoặc `:+1:` (dấu hai chấm là tùy chọn).
- Đặt `remove=true` (boolean) để xóa một reaction.
- Các sự kiện thêm/xóa reaction được chuyển tiếp như các sự kiện hệ thống tới session agent được route.

Ví dụ:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Cấu hình:

- `channels.mattermost.actions.reactions`: bật/tắt hành động reaction (mặc định true).
- Ghi đè từng tài khoản: `channels.mattermost.accounts.<id>.actions.reactions`.

## Nút tương tác (công cụ tin nhắn)

Gửi tin nhắn với các nút có thể nhấp. Khi người dùng nhấp vào nút, agent nhận được lựa chọn và có thể phản hồi.

Bật nút bằng cách thêm `inlineButtons` vào khả năng của channel:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Dùng `message action=send` với tham số `buttons`. Nút là một mảng 2D (các hàng nút):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Các trường của nút:

- `text` (bắt buộc): nhãn hiển thị.
- `callback_data` (bắt buộc): giá trị gửi lại khi nhấp (dùng làm ID hành động).
- `style` (tùy chọn): `"default"`, `"primary"`, hoặc `"danger"`.

Khi người dùng nhấp vào nút:

1. Tất cả các nút được thay thế bằng một dòng xác nhận (ví dụ: "✓ **Yes** được chọn bởi @user").
2. Agent nhận được lựa chọn như một tin nhắn inbound và phản hồi.

Lưu ý:

- Các callback của nút sử dụng xác minh HMAC-SHA256 (tự động, không cần cấu hình).
- Mattermost loại bỏ dữ liệu callback khỏi các phản hồi API của nó (tính năng bảo mật), vì vậy tất cả các nút bị xóa khi nhấp — không thể xóa một phần.
- Các ID hành động chứa dấu gạch ngang hoặc gạch dưới được tự động làm sạch (giới hạn routing của Mattermost).

Cấu hình:

- `channels.mattermost.capabilities`: mảng các chuỗi khả năng. Thêm `"inlineButtons"` để bật mô tả công cụ nút trong prompt hệ thống của agent.
- `channels.mattermost.interactions.callbackBaseUrl`: URL cơ sở bên ngoài tùy chọn cho các callback của nút (ví dụ `https://gateway.example.com`). Dùng cái này khi Mattermost không thể truy cập gateway tại host bind của nó trực tiếp.
- Trong các cấu hình nhiều tài khoản, bạn cũng có thể đặt cùng trường dưới `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Nếu `interactions.callbackBaseUrl` bị bỏ qua, OpenClaw sẽ suy ra URL callback từ `gateway.customBindHost` + `gateway.port`, sau đó quay lại `http://localhost:<port>`.
- Quy tắc khả năng truy cập: URL callback của nút phải có thể truy cập từ server Mattermost. `localhost` chỉ hoạt động khi Mattermost và OpenClaw chạy trên cùng host/network namespace.
- Nếu mục tiêu callback của bạn là private/tailnet/internal, thêm host/domain của nó vào Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`.

### Tích hợp API trực tiếp (script bên ngoài)

Các script bên ngoài và webhooks có thể post nút trực tiếp qua API REST của Mattermost thay vì đi qua công cụ `message` của agent. Dùng `buildButtonAttachments()` từ extension khi có thể; nếu post JSON thô, tuân theo các quy tắc sau:

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
            type: "button", // bắt buộc, nếu không nhấp bị bỏ qua
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

1. Attachments nằm trong `props.attachments`, không phải `attachments` cấp cao nhất (bị bỏ qua).
2. Mỗi hành động cần `type: "button"` — nếu không, nhấp bị bỏ qua.
3. Mỗi hành động cần một trường `id` — Mattermost bỏ qua các hành động không có ID.
4. ID hành động phải **chỉ chữ và số** (`[a-zA-Z0-9]`). Dấu gạch ngang và gạch dưới làm hỏng routing hành động của Mattermost (trả về 404). Loại bỏ chúng trước khi sử dụng.
5. `context.action_id` phải khớp với `id` của nút để tin nhắn xác nhận hiển thị tên nút (ví dụ: "Approve") thay vì ID thô.
6. `context.action_id` là bắt buộc — handler tương tác trả về 400 nếu không có.

**Tạo token HMAC:**

Gateway xác minh các nhấp nút bằng HMAC-SHA256. Các script bên ngoài phải tạo token khớp với logic xác minh của gateway:

1. Lấy secret từ bot token: `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Xây dựng đối tượng context với tất cả các trường **trừ** `_token`.
3. Serialize với **các khóa đã sắp xếp** và **không có khoảng trắng** (gateway dùng `JSON.stringify` với các khóa đã sắp xếp, tạo ra output gọn).
4. Ký: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Thêm hex digest kết quả làm `_token` trong context.

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

- `json.dumps` của Python thêm khoảng trắng theo mặc định (`{"key": "val"}`). Dùng `separators=(",", ":")` để khớp với output gọn của JavaScript (`{"key":"val"}`).
- Luôn ký **tất cả** các trường context (trừ `_token`). Gateway loại bỏ `_token` rồi ký mọi thứ còn lại. Ký một phần gây ra lỗi xác minh im lặng.
- Dùng `sort_keys=True` — gateway sắp xếp các khóa trước khi ký, và Mattermost có thể sắp xếp lại các trường context khi lưu payload.
- Lấy secret từ bot token (xác định), không phải byte ngẫu nhiên. Secret phải giống nhau giữa quá trình tạo nút và gateway xác minh.

## Directory adapter

Plugin Mattermost bao gồm một directory adapter giải quyết tên channel và user qua API của Mattermost. Điều này cho phép các mục tiêu `#channel-name` và `@username` trong `openclaw message send` và các delivery cron/webhook.

Không cần cấu hình — adapter dùng bot token từ cấu hình tài khoản.

## Multi-account

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

## Troubleshooting

- Không có phản hồi trong channels: đảm bảo bot có trong channel và mention nó (oncall), dùng prefix trigger (onchar), hoặc đặt `chatmode: "onmessage"`.
- Lỗi xác thực: kiểm tra bot token, base URL, và xem tài khoản có được bật không.
- Vấn đề multi-account: env vars chỉ áp dụng cho tài khoản `default`.
- Nút xuất hiện dưới dạng hộp trắng: agent có thể đang gửi dữ liệu nút sai định dạng. Kiểm tra rằng mỗi nút có cả trường `text` và `callback_data`.
- Nút render nhưng nhấp không có tác dụng: xác minh `AllowedUntrustedInternalConnections` trong cấu hình server Mattermost bao gồm `127.0.0.1 localhost`, và `EnablePostActionIntegration` là `true` trong ServiceSettings.
- Nút trả về 404 khi nhấp: ID của nút có thể chứa dấu gạch ngang hoặc gạch dưới. Router hành động của Mattermost bị hỏng với các ID không phải chữ và số. Dùng `[a-zA-Z0-9]` thôi.
- Gateway log `invalid _token`: HMAC không khớp. Kiểm tra rằng bạn ký tất cả các trường context (không phải một phần), dùng các khóa đã sắp xếp, và dùng JSON gọn (không có khoảng trắng). Xem phần HMAC ở trên.
- Gateway log `missing _token in context`: trường `_token` không có trong context của nút. Đảm bảo nó được bao gồm khi xây dựng payload tích hợp.
- Xác nhận hiển thị ID thô thay vì tên nút: `context.action_id` không khớp với `id` của nút. Đặt cả hai thành cùng một giá trị đã được làm sạch.
- Agent không biết về nút: thêm `capabilities: ["inlineButtons"]` vào cấu hình channel Mattermost.\n