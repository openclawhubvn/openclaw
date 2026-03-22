---
summary: "Tổng quan, tính năng và cấu hình bot Feishu"
read_when:
  - Muốn kết nối bot Feishu/Lark
  - Đang cấu hình kênh Feishu
title: Feishu
---

# Bot Feishu

Feishu (Lark) là nền tảng chat nhóm dùng cho nhắn tin và cộng tác trong công ty. Plugin này kết nối OpenClaw với bot Feishu/Lark qua WebSocket event subscription để nhận tin nhắn mà không cần mở webhook URL công khai.

---

## Plugin đi kèm

Feishu đã có sẵn trong các bản phát hành OpenClaw hiện tại, không cần cài plugin riêng.

Nếu dùng bản cũ hoặc cài đặt tùy chỉnh không có Feishu, cài thủ công:

```bash
openclaw plugins install @openclaw/feishu
```

---

## Bắt đầu nhanh

Có hai cách thêm kênh Feishu:

### Cách 1: onboarding (khuyến nghị)

Nếu vừa cài OpenClaw, chạy onboarding:

```bash
openclaw onboard
```

Wizard sẽ hướng dẫn:

1. Tạo app Feishu và thu thập thông tin đăng nhập
2. Cấu hình thông tin đăng nhập trong OpenClaw
3. Khởi động gateway

✅ **Sau khi cấu hình**, kiểm tra trạng thái gateway:

- `openclaw gateway status`
- `openclaw logs --follow`

### Cách 2: CLI setup

Nếu đã cài đặt ban đầu, thêm kênh qua CLI:

```bash
openclaw channels add
```

Chọn **Feishu**, nhập App ID và App Secret.

✅ **Sau khi cấu hình**, quản lý gateway:

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## Bước 1: Tạo app Feishu

### 1. Mở Feishu Open Platform

Truy cập [Feishu Open Platform](https://open.feishu.cn/app) và đăng nhập.

Tenant Lark (global) dùng [https://open.larksuite.com/app](https://open.larksuite.com/app) và đặt `domain: "lark"` trong cấu hình Feishu.

### 2. Tạo app

1. Nhấn **Create enterprise app**
2. Điền tên và mô tả app
3. Chọn icon cho app

![Create enterprise app](../images/feishu-step2-create-app.png)

### 3. Sao chép thông tin đăng nhập

Từ **Credentials & Basic Info**, sao chép:

- **App ID** (định dạng: `cli_xxx`)
- **App Secret**

❗ **Quan trọng:** giữ bí mật App Secret.

![Get credentials](../images/feishu-step3-credentials.png)

### 4. Cấu hình quyền

Trong **Permissions**, nhấn **Batch import** và dán:

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![Configure permissions](../images/feishu-step4-permissions.png)

### 5. Kích hoạt khả năng bot

Trong **App Capability** > **Bot**:

1. Kích hoạt khả năng bot
2. Đặt tên bot

![Enable bot capability](../images/feishu-step5-bot-capability.png)

### 6. Cấu hình event subscription

⚠️ **Quan trọng:** trước khi cấu hình event subscription, đảm bảo:

1. Đã chạy `openclaw channels add` cho Feishu
2. Gateway đang chạy (`openclaw gateway status`)

Trong **Event Subscription**:

1. Chọn **Use long connection to receive events** (WebSocket)
2. Thêm event: `im.message.receive_v1`

⚠️ Nếu gateway không chạy, thiết lập long-connection có thể không lưu được.

![Configure event subscription](../images/feishu-step6-event-subscription.png)

### 7. Phát hành app

1. Tạo phiên bản trong **Version Management & Release**
2. Gửi duyệt và phát hành
3. Chờ admin phê duyệt (app doanh nghiệp thường tự động phê duyệt)

---

## Bước 2: Cấu hình OpenClaw

### Cấu hình với wizard (khuyến nghị)

```bash
openclaw channels add
```

Chọn **Feishu** và dán App ID + App Secret.

### Cấu hình qua file config

Sửa `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "My AI assistant",
        },
      },
    },
  },
}
```

Nếu dùng `connectionMode: "webhook"`, đặt cả `verificationToken` và `encryptKey`. Server webhook Feishu mặc định bind `127.0.0.1`; chỉ đặt `webhookHost` nếu cần bind địa chỉ khác.

#### Verification Token và Encrypt Key (webhook mode)

Khi dùng webhook mode, đặt cả `channels.feishu.verificationToken` và `channels.feishu.encryptKey` trong config. Để lấy giá trị:

1. Trong Feishu Open Platform, mở app
2. Vào **Development** → **Events & Callbacks** (开发配置 → 事件与回调)
3. Mở tab **Encryption** (加密策略)
4. Sao chép **Verification Token** và **Encrypt Key**

Hình dưới chỉ vị trí **Verification Token**. **Encrypt Key** nằm cùng phần **Encryption**.

![Verification Token location](../images/feishu-verification-token.png)

### Cấu hình qua biến môi trường

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Domain Lark (global)

Nếu tenant trên Lark (quốc tế), đặt domain là `lark` (hoặc chuỗi domain đầy đủ). Có thể đặt tại `channels.feishu.domain` hoặc từng account (`channels.feishu.accounts.<id>.domain`).

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

### Cờ tối ưu hóa quota

Có thể giảm sử dụng API Feishu với hai cờ tùy chọn:

- `typingIndicator` (mặc định `true`): khi `false`, bỏ qua gọi typing reaction.
- `resolveSenderNames` (mặc định `true`): khi `false`, bỏ qua gọi lookup profile người gửi.

Đặt ở cấp cao nhất hoặc từng account:

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          typingIndicator: true,
          resolveSenderNames: false,
        },
      },
    },
  },
}
```

---

## Bước 3: Khởi động + kiểm tra

### 1. Khởi động gateway

```bash
openclaw gateway
```

### 2. Gửi tin nhắn thử

Trong Feishu, tìm bot và gửi tin nhắn.

### 3. Phê duyệt pairing

Mặc định, bot trả lời với mã pairing. Phê duyệt:

```bash
openclaw pairing approve feishu <CODE>
```

Sau khi phê duyệt, có thể chat bình thường.

---

## Tổng quan

- **Kênh bot Feishu**: bot Feishu được quản lý bởi gateway
- **Routing xác định**: trả lời luôn quay lại Feishu
- **Cách ly session**: DMs chia sẻ session chính; nhóm được cách ly
- **Kết nối WebSocket**: kết nối dài qua Feishu SDK, không cần URL công khai

---

## Kiểm soát truy cập

### Tin nhắn trực tiếp

- **Mặc định**: `dmPolicy: "pairing"` (người dùng không xác định nhận mã pairing)
- **Phê duyệt pairing**:

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **Chế độ allowlist**: đặt `channels.feishu.allowFrom` với danh sách Open ID được phép

### Chat nhóm

**1. Chính sách nhóm** (`channels.feishu.groupPolicy`):

- `"open"` = cho phép mọi người trong nhóm (mặc định)
- `"allowlist"` = chỉ cho phép `groupAllowFrom`
- `"disabled"` = vô hiệu hóa tin nhắn nhóm

**2. Yêu cầu mention** (`channels.feishu.groups.<chat_id>.requireMention`):

- `true` = yêu cầu @mention (mặc định)
- `false` = phản hồi không cần mention

---

## Ví dụ cấu hình nhóm

### Cho phép tất cả nhóm, yêu cầu @mention (mặc định)

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      // Mặc định requireMention: true
    },
  },
}
```

### Cho phép tất cả nhóm, không yêu cầu @mention

```json5
{
  channels: {
    feishu: {
      groups: {
        oc_xxx: { requireMention: false },
      },
    },
  },
}
```

### Chỉ cho phép nhóm cụ thể

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // ID nhóm Feishu (chat_id) dạng: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Hạn chế người gửi có thể nhắn trong nhóm (allowlist người gửi)

Ngoài việc cho phép nhóm, **tất cả tin nhắn** trong nhóm đó được kiểm soát bởi open_id người gửi: chỉ người dùng trong `groups.<chat_id>.allowFrom` mới được xử lý tin nhắn; tin nhắn từ thành viên khác bị bỏ qua (đây là kiểm soát cấp người gửi đầy đủ, không chỉ cho lệnh điều khiển như /reset hay /new).

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // ID người dùng Feishu (open_id) dạng: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

## Lấy ID nhóm/người dùng

### ID nhóm (chat_id)

ID nhóm dạng `oc_xxx`.

**Cách 1 (khuyến nghị)**

1. Khởi động gateway và @mention bot trong nhóm
2. Chạy `openclaw logs --follow` và tìm `chat_id`

**Cách 2**

Dùng Feishu API debugger để liệt kê chat nhóm.

### ID người dùng (open_id)

ID người dùng dạng `ou_xxx`.

**Cách 1 (khuyến nghị)**

1. Khởi động gateway và DM bot
2. Chạy `openclaw logs --follow` và tìm `open_id`

**Cách 2**

Kiểm tra yêu cầu pairing để lấy Open ID người dùng:

```bash
openclaw pairing list feishu
```

---

## Lệnh thường dùng

| Lệnh      | Mô tả                  |
| --------- | ---------------------- |
| `/status` | Hiển thị trạng thái bot|
| `/reset`  | Reset session          |
| `/model`  | Hiển thị/chuyển model  |

> Lưu ý: Feishu chưa hỗ trợ menu lệnh gốc, nên lệnh phải gửi dưới dạng text.

## Lệnh quản lý gateway

| Lệnh                     | Mô tả                        |
| ------------------------ | ---------------------------- |
| `openclaw gateway status`| Hiển thị trạng thái gateway  |
| `openclaw gateway install`| Cài đặt/khởi động dịch vụ gateway |
| `openclaw gateway stop`  | Dừng dịch vụ gateway         |
| `openclaw gateway restart`| Khởi động lại dịch vụ gateway|
| `openclaw logs --follow` | Theo dõi log gateway         |

---

## Khắc phục sự cố

### Bot không phản hồi trong chat nhóm

1. Đảm bảo bot đã được thêm vào nhóm
2. Đảm bảo bạn @mention bot (hành vi mặc định)
3. Kiểm tra `groupPolicy` không đặt là `"disabled"`
4. Kiểm tra log: `openclaw logs --follow`

### Bot không nhận tin nhắn

1. Đảm bảo app đã được phát hành và phê duyệt
2. Đảm bảo event subscription bao gồm `im.message.receive_v1`
3. Đảm bảo **long connection** đã bật
4. Đảm bảo quyền app đầy đủ
5. Đảm bảo gateway đang chạy: `openclaw gateway status`
6. Kiểm tra log: `openclaw logs --follow`

### Rò rỉ App Secret

1. Reset App Secret trong Feishu Open Platform
2. Cập nhật App Secret trong config
3. Khởi động lại gateway

### Gửi tin nhắn thất bại

1. Đảm bảo app có quyền `im:message:send_as_bot`
2. Đảm bảo app đã được phát hành
3. Kiểm tra log để biết lỗi chi tiết

---

## Cấu hình nâng cao

### Nhiều tài khoản

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "Primary bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          botName: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` kiểm soát tài khoản Feishu nào được dùng khi API outbound không chỉ định `accountId` rõ ràng.

### Giới hạn tin nhắn

- `textChunkLimit`: kích thước đoạn text outbound (mặc định: 2000 ký tự)
- `mediaMaxMb`: giới hạn upload/download media (mặc định: 30MB)

### Streaming

Feishu hỗ trợ streaming trả lời qua interactive cards. Khi bật, bot cập nhật card khi tạo text.

```json5
{
  channels: {
    feishu: {
      streaming: true, // bật streaming card output (mặc định true)
      blockStreaming: true, // bật block-level streaming (mặc định true)
    },
  },
}
```

Đặt `streaming: false` để chờ phản hồi đầy đủ trước khi gửi.

### Phiên ACP

Feishu hỗ trợ ACP cho:

- DMs
- cuộc trò chuyện chủ đề nhóm

Feishu ACP điều khiển bằng lệnh text. Không có menu lệnh slash gốc, nên dùng tin nhắn `/acp ...` trực tiếp trong cuộc trò chuyện.

#### Ràng buộc ACP liên tục

Dùng ràng buộc ACP kiểu top-level để ghim DM hoặc cuộc trò chuyện chủ đề Feishu vào phiên ACP liên tục.

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Khởi tạo ACP từ chat

Trong DM hoặc cuộc trò chuyện chủ đề Feishu, có thể khởi tạo và ràng buộc phiên ACP tại chỗ:

```text
/acp spawn codex --thread here
```

Lưu ý:

- `--thread here` hoạt động cho DMs và chủ đề Feishu.
- Tin nhắn tiếp theo trong DM/chủ đề ràng buộc sẽ chuyển trực tiếp đến phiên ACP đó.
- v1 không nhắm mục tiêu chat nhóm không chủ đề chung.

### Routing nhiều agent

Dùng `bindings` để route DMs hoặc nhóm Feishu đến các agent khác nhau.

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.openclaw/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.openclaw/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Các trường routing:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` hoặc `"group"`
- `match.peer.id`: Open ID người dùng (`ou_xxx`) hoặc ID nhóm (`oc_xxx`)

Xem [Lấy ID nhóm/người dùng](#get-groupuser-ids) để biết cách tra cứu.

---

## Tham khảo cấu hình

Cấu hình đầy đủ: [Gateway configuration](/gateway/configuration)

Các tùy chọn chính:

| Cài đặt                                           | Mô tả                                   | Mặc định         |
| ------------------------------------------------- | --------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Bật/tắt kênh                            | `true`           |
| `channels.feishu.domain`                          | API domain (`feishu` hoặc `lark`)       | `feishu`         |
| `channels.feishu.connectionMode`                  | Chế độ vận chuyển sự kiện               | `websocket`      |
| `channels.feishu.defaultAccount`                  | ID tài khoản mặc định cho routing outbound | `default`        |
| `channels.feishu.verificationToken`               | Yêu cầu cho chế độ webhook              | -                |
| `channels.feishu.encryptKey`                      | Yêu cầu cho chế độ webhook              | -                |
| `channels.feishu.webhookPath`                     | Đường dẫn route webhook                 | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host bind webhook                       | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Cổng bind webhook                       | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                  | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                              | -                |
| `channels.feishu.accounts.<id>.domain`            | Ghi đè domain API từng tài khoản        | `feishu`         |
| `channels.feishu.dmPolicy`                        | Chính sách DM                           | `pairing`        |
| `channels.feishu.allowFrom`                       | DM allowlist (danh sách open_id)        | -                |
| `channels.feishu.groupPolicy`                     | Chính sách nhóm                         | `open`           |
| `channels.feishu.groupAllowFrom`                  | Allowlist nhóm                          | -                |
| `channels.feishu.groups.<chat_id>.requireMention` | Yêu cầu @mention                        | `true`           |
| `channels.feishu.groups.<chat_id>.enabled`        | Bật nhóm                                | `true`           |
| `channels.feishu.textChunkLimit`                  | Kích thước đoạn tin nhắn                | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Giới hạn kích thước media               | `30`             |
| `channels.feishu.streaming`                       | Bật streaming card output               | `true`           |
| `channels.feishu.blockStreaming`                  | Bật block streaming                     | `true`           |

---

## Tham khảo dmPolicy

| Giá trị       | Hành vi                                                        |
| ------------- | -------------------------------------------------------------- |
| `"pairing"`   | **Mặc định.** Người dùng không xác định nhận mã pairing; cần phê duyệt |
| `"allowlist"` | Chỉ người dùng trong `allowFrom` có thể chat                   |
| `"open"`      | Cho phép tất cả người dùng (yêu cầu `"*"` trong allowFrom)     |
| `"disabled"`  | Vô hiệu hóa DMs                                                |

---

## Các loại tin nhắn hỗ trợ

### Nhận

- ✅ Text
- ✅ Rich text (post)
- ✅ Hình ảnh
- ✅ Tệp
- ✅ Âm thanh
- ✅ Video/media
- ✅ Sticker

### Gửi

- ✅ Text
- ✅ Hình ảnh
- ✅ Tệp
- ✅ Âm thanh
- ✅ Video/media
- ✅ Interactive cards
- ⚠️ Rich text (định dạng post-style và cards, không phải các tính năng authoring tùy ý của Feishu)

### Threads và trả lời

- ✅ Trả lời inline
- ✅ Trả lời thread-topic nơi Feishu cung cấp `reply_in_thread`
- ✅ Trả lời media giữ nguyên nhận thức thread khi trả lời tin nhắn thread/topic

## Bề mặt hành động runtime

Feishu hiện cung cấp các hành động runtime sau:

- `send`
- `read`
- `edit`
- `thread-reply`
- `pin`
- `list-pins`
- `unpin`
- `member-info`
- `channel-info`
- `channel-list`
- `react` và `reactions` khi reactions được bật trong config\n