---
summary: "Khám phá cách cấu hình và sử dụng bot Feishu hiệu quả, tối ưu hóa tính năng để nâng cao trải nghiệm người dùng."
read_when:
  - Bạn muốn kết nối một bot Feishu/Lark
  - Bạn đang cấu hình kênh Feishu
title: "Hướng Dẫn Cấu Hình Bot Feishu Chi Tiết"
---

# Bot Feishu

Feishu (Lark) là một nền tảng chat nhóm được các công ty sử dụng để nhắn tin và cộng tác. Plugin này kết nối OpenClaw với một bot Feishu/Lark thông qua đăng ký sự kiện WebSocket của nền tảng, cho phép nhận tin nhắn mà không cần công khai URL webhook.

---

## Plugin đi kèm

Feishu được tích hợp sẵn trong các phiên bản OpenClaw hiện tại, vì vậy không cần cài đặt plugin riêng.

Nếu bạn đang sử dụng bản build cũ hoặc cài đặt tùy chỉnh không bao gồm Feishu, hãy cài đặt thủ công:

```bash
openclaw plugins install @openclaw/feishu
```

---

## Bắt đầu nhanh

Có hai cách để thêm kênh Feishu:

### Cách 1: onboarding (khuyến nghị)

Nếu bạn vừa cài đặt OpenClaw, chạy onboarding:

```bash
openclaw onboard
```

Trình hướng dẫn sẽ giúp bạn:

1. Tạo ứng dụng Feishu và thu thập thông tin xác thực
2. Cấu hình thông tin xác thực ứng dụng trong OpenClaw
3. Khởi động gateway

✅ **Sau khi cấu hình**, kiểm tra trạng thái gateway:

- `openclaw gateway status`
- `openclaw logs --follow`

### Cách 2: Thiết lập qua CLI

Nếu bạn đã hoàn tất cài đặt ban đầu, thêm kênh qua CLI:

```bash
openclaw channels add
```

Chọn **Feishu**, sau đó nhập App ID và App Secret.

✅ **Sau khi cấu hình**, quản lý gateway:

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## Bước 1: Tạo ứng dụng Feishu

### 1. Mở Feishu Open Platform

Truy cập [Feishu Open Platform](https://open.feishu.cn/app) và đăng nhập.

Người dùng Lark (toàn cầu) nên sử dụng [https://open.larksuite.com/app](https://open.larksuite.com/app) và đặt `domain: "lark"` trong cấu hình Feishu.

### 2. Tạo ứng dụng

1. Nhấn **Create enterprise app**
2. Điền tên và mô tả ứng dụng
3. Chọn biểu tượng ứng dụng

![Tạo ứng dụng doanh nghiệp](../images/feishu-step2-create-app.png)

### 3. Sao chép thông tin xác thực

Từ **Credentials & Basic Info**, sao chép:

- **App ID** (định dạng: `cli_xxx`)
- **App Secret**

❗ **Quan trọng:** giữ bí mật App Secret.

![Lấy thông tin xác thực](../images/feishu-step3-credentials.png)

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

![Cấu hình quyền](../images/feishu-step4-permissions.png)

### 5. Kích hoạt khả năng bot

Trong **App Capability** > **Bot**:

1. Kích hoạt khả năng bot
2. Đặt tên cho bot

![Kích hoạt khả năng bot](../images/feishu-step5-bot-capability.png)

### 6. Cấu hình đăng ký sự kiện

⚠️ **Quan trọng:** trước khi thiết lập đăng ký sự kiện, đảm bảo rằng:

1. Bạn đã chạy `openclaw channels add` cho Feishu
2. Gateway đang chạy (`openclaw gateway status`)

Trong **Event Subscription**:

1. Chọn **Use long connection to receive events** (WebSocket)
2. Thêm sự kiện: `im.message.receive_v1`

⚠️ Nếu gateway không chạy, thiết lập kết nối dài có thể không lưu được.

![Cấu hình đăng ký sự kiện](../images/feishu-step6-event-subscription.png)

### 7. Phát hành ứng dụng

1. Tạo phiên bản trong **Version Management & Release**
2. Gửi để xem xét và phát hành
3. Chờ phê duyệt từ quản trị viên (ứng dụng doanh nghiệp thường tự động phê duyệt)

---

## Bước 2: Cấu hình OpenClaw

### Cấu hình với trình hướng dẫn (khuyến nghị)

```bash
openclaw channels add
```

Chọn **Feishu** và dán App ID + App Secret của bạn.

### Cấu hình qua file cấu hình

Chỉnh sửa `~/.openclaw/openclaw.json`:

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
          botName: "Trợ lý AI của tôi",
        },
      },
    },
  },
}
```

Nếu bạn sử dụng `connectionMode: "webhook"`, đặt cả `verificationToken` và `encryptKey`. Máy chủ webhook Feishu mặc định gắn với `127.0.0.1`; chỉ đặt `webhookHost` nếu bạn cần địa chỉ gắn khác.

#### Verification Token và Encrypt Key (chế độ webhook)

Khi sử dụng chế độ webhook, đặt cả `channels.feishu.verificationToken` và `channels.feishu.encryptKey` trong cấu hình của bạn. Để lấy giá trị:

1. Trong Feishu Open Platform, mở ứng dụng của bạn
2. Đi tới **Development** → **Events & Callbacks** (开发配置 → 事件与回调)
3. Mở tab **Encryption** (加密策略)
4. Sao chép **Verification Token** và **Encrypt Key**

Hình ảnh dưới đây cho thấy vị trí của **Verification Token**. **Encrypt Key** được liệt kê trong cùng phần **Encryption**.

![Vị trí Verification Token](../images/feishu-verification-token.png)

### Cấu hình qua biến môi trường

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Miền Lark (toàn cầu)

Nếu tenant của bạn trên Lark (quốc tế), đặt miền thành `lark` (hoặc chuỗi miền đầy đủ). Bạn có thể đặt tại `channels.feishu.domain` hoặc theo tài khoản (`channels.feishu.accounts.<id>.domain`).

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

### Cờ tối ưu hóa hạn ngạch

Bạn có thể giảm sử dụng API Feishu với hai cờ tùy chọn:

- `typingIndicator` (mặc định `true`): khi `false`, bỏ qua các cuộc gọi phản ứng gõ.
- `resolveSenderNames` (mặc định `true`): khi `false`, bỏ qua các cuộc gọi tra cứu hồ sơ người gửi.

Đặt chúng ở cấp cao nhất hoặc theo tài khoản:

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

### 2. Gửi tin nhắn thử nghiệm

Trong Feishu, tìm bot của bạn và gửi một tin nhắn.

### 3. Phê duyệt ghép đôi

Mặc định, bot sẽ trả lời với mã ghép đôi. Phê duyệt nó:

```bash
openclaw pairing approve feishu <CODE>
```

Sau khi phê duyệt, bạn có thể chat bình thường.

---

## Tổng quan

- **Kênh bot Feishu**: Bot Feishu được quản lý bởi gateway
- **Định tuyến quyết định**: trả lời luôn quay lại Feishu
- **Cách ly phiên**: DMs chia sẻ một phiên chính; nhóm được cách ly
- **Kết nối WebSocket**: kết nối dài qua SDK Feishu, không cần URL công khai

---

## Kiểm soát truy cập

### Tin nhắn trực tiếp

- **Mặc định**: `dmPolicy: "pairing"` (người dùng không xác định nhận mã ghép đôi)
- **Phê duyệt ghép đôi**:

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **Chế độ danh sách cho phép**: đặt `channels.feishu.allowFrom` với các Open ID được phép

### Chat nhóm

**1. Chính sách nhóm** (`channels.feishu.groupPolicy`):

- `"open"` = cho phép mọi người trong nhóm (mặc định)
- `"allowlist"` = chỉ cho phép `groupAllowFrom`
- `"disabled"` = vô hiệu hóa tin nhắn nhóm

**2. Yêu cầu đề cập** (`channels.feishu.groups.<chat_id>.requireMention`):

- `true` = yêu cầu @mention (mặc định)
- `false` = phản hồi mà không cần đề cập

---

## Ví dụ cấu hình nhóm

### Cho phép tất cả các nhóm, yêu cầu @mention (mặc định)

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

### Cho phép tất cả các nhóm, không yêu cầu @mention

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

### Chỉ cho phép các nhóm cụ thể

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // ID nhóm Feishu (chat_id) trông như: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Hạn chế người gửi có thể nhắn tin trong nhóm (danh sách cho phép người gửi)

Ngoài việc cho phép nhóm, **tất cả tin nhắn** trong nhóm đó đều bị kiểm soát bởi open_id của người gửi: chỉ những người dùng được liệt kê trong `groups.<chat_id>.allowFrom` mới có tin nhắn được xử lý; tin nhắn từ các thành viên khác bị bỏ qua (đây là kiểm soát cấp độ người gửi đầy đủ, không chỉ cho các lệnh điều khiển như /reset hoặc /new).

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // ID người dùng Feishu (open_id) trông như: ou_xxx
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

ID nhóm trông như `oc_xxx`.

**Phương pháp 1 (khuyến nghị)**

1. Khởi động gateway và @mention bot trong nhóm
2. Chạy `openclaw logs --follow` và tìm `chat_id`

**Phương pháp 2**

Sử dụng trình gỡ lỗi API Feishu để liệt kê các nhóm chat.

### ID người dùng (open_id)

ID người dùng trông như `ou_xxx`.

**Phương pháp 1 (khuyến nghị)**

1. Khởi động gateway và nhắn tin trực tiếp cho bot
2. Chạy `openclaw logs --follow` và tìm `open_id`

**Phương pháp 2**

Kiểm tra yêu cầu ghép đôi để lấy Open ID người dùng:

```bash
openclaw pairing list feishu
```

---

## Các lệnh thông dụng

| Lệnh      | Mô tả                  |
| --------- | ---------------------- |
| `/status` | Hiển thị trạng thái bot|
| `/reset`  | Đặt lại phiên          |
| `/model`  | Hiển thị/chuyển đổi mô hình |

> Lưu ý: Feishu chưa hỗ trợ menu lệnh gốc, vì vậy các lệnh phải được gửi dưới dạng văn bản.

## Lệnh quản lý gateway

| Lệnh                       | Mô tả                           |
| -------------------------- | ------------------------------- |
| `openclaw gateway status`  | Hiển thị trạng thái gateway     |
| `openclaw gateway install` | Cài đặt/khởi động dịch vụ gateway|
| `openclaw gateway stop`    | Dừng dịch vụ gateway            |
| `openclaw gateway restart` | Khởi động lại dịch vụ gateway   |
| `openclaw logs --follow`   | Theo dõi log gateway            |

---

## Khắc phục sự cố

### Bot không phản hồi trong chat nhóm

1. Đảm bảo bot đã được thêm vào nhóm
2. Đảm bảo bạn @mention bot (hành vi mặc định)
3. Kiểm tra `groupPolicy` không được đặt thành `"disabled"`
4. Kiểm tra log: `openclaw logs --follow`

### Bot không nhận tin nhắn

1. Đảm bảo ứng dụng đã được phát hành và phê duyệt
2. Đảm bảo đăng ký sự kiện bao gồm `im.message.receive_v1`
3. Đảm bảo **kết nối dài** đã được kích hoạt
4. Đảm bảo quyền ứng dụng đầy đủ
5. Đảm bảo gateway đang chạy: `openclaw gateway status`
6. Kiểm tra log: `openclaw logs --follow`

### Rò rỉ App Secret

1. Đặt lại App Secret trong Feishu Open Platform
2. Cập nhật App Secret trong cấu hình của bạn
3. Khởi động lại gateway

### Gửi tin nhắn thất bại

1. Đảm bảo ứng dụng có quyền `im:message:send_as_bot`
2. Đảm bảo ứng dụng đã được phát hành
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
          botName: "Bot chính",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          botName: "Bot dự phòng",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` kiểm soát tài khoản Feishu nào được sử dụng khi API outbound không chỉ định `accountId` rõ ràng.

### Giới hạn tin nhắn

- `textChunkLimit`: kích thước đoạn văn bản outbound (mặc định: 2000 ký tự)
- `mediaMaxMb`: giới hạn tải lên/tải xuống phương tiện (mặc định: 30MB)

### Streaming

Feishu hỗ trợ streaming phản hồi qua thẻ tương tác. Khi được kích hoạt, bot cập nhật thẻ khi tạo văn bản.

```json5
{
  channels: {
    feishu: {
      streaming: true, // kích hoạt đầu ra thẻ streaming (mặc định true)
      blockStreaming: true, // kích hoạt streaming cấp khối (mặc định true)
    },
  },
}
```

Đặt `streaming: false` để chờ phản hồi đầy đủ trước khi gửi.

### Phiên ACP

Feishu hỗ trợ ACP cho:

- DMs
- cuộc trò chuyện chủ đề nhóm

Feishu ACP được điều khiển bằng lệnh văn bản. Không có menu lệnh gạch chéo gốc, vì vậy sử dụng tin nhắn `/acp ...` trực tiếp trong cuộc trò chuyện.

#### Ràng buộc ACP liên tục

Sử dụng ràng buộc ACP kiểu cấp cao nhất để ghim một cuộc trò chuyện DM hoặc chủ đề Feishu vào một phiên ACP liên tục.

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

Trong một cuộc trò chuyện DM hoặc chủ đề Feishu, bạn có thể khởi tạo và ràng buộc một phiên ACP tại chỗ:

```text
/acp spawn codex --thread here
```

Lưu ý:

- `--thread here` hoạt động cho DMs và chủ đề Feishu.
- Tin nhắn tiếp theo trong DM/chủ đề được ràng buộc sẽ chuyển trực tiếp đến phiên ACP đó.
- v1 không nhắm mục tiêu các nhóm không phải chủ đề chung.

### Định tuyến nhiều tác nhân

Sử dụng `bindings` để định tuyến DMs hoặc nhóm Feishu đến các tác nhân khác nhau.

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

Các trường định tuyến:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` hoặc `"group"`
- `match.peer.id`: Open ID người dùng (`ou_xxx`) hoặc ID nhóm (`oc_xxx`)

Xem [Lấy ID nhóm/người dùng](#get-groupuser-ids) để biết mẹo tra cứu.

---

## Tham khảo cấu hình

Cấu hình đầy đủ: [Cấu hình Gateway](/gateway/configuration)

Các tùy chọn chính:

| Cài đặt                                           | Mô tả                                   | Mặc định         |
| ------------------------------------------------- | --------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Bật/tắt kênh                            | `true`           |
| `channels.feishu.domain`                          | Miền API (`feishu` hoặc `lark`)         | `feishu`         |
| `channels.feishu.connectionMode`                  | Chế độ truyền sự kiện                   | `websocket`      |
| `channels.feishu.defaultAccount`                  | ID tài khoản mặc định cho định tuyến outbound | `default`        |
| `channels.feishu.verificationToken`               | Yêu cầu cho chế độ webhook              | -                |
| `channels.feishu.encryptKey`                      | Yêu cầu cho chế độ webhook              | -                |
| `channels.feishu.webhookPath`                     | Đường dẫn route webhook                 | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host gắn webhook                        | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Cổng gắn webhook                        | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                  | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                              | -                |
| `channels.feishu.accounts.<id>.domain`            | Ghi đè miền API theo tài khoản          | `feishu`         |
| `channels.feishu.dmPolicy`                        | Chính sách DM                           | `pairing`        |
| `channels.feishu.allowFrom`                       | Danh sách cho phép DM (danh sách open_id) | -                |
| `channels.feishu.groupPolicy`                     | Chính sách nhóm                         | `open`           |
| `channels.feishu.groupAllowFrom`                  | Danh sách cho phép nhóm                 | -                |
| `channels.feishu.groups.<chat_id>.requireMention` | Yêu cầu @mention                        | `true`           |
| `channels.feishu.groups.<chat_id>.enabled`        | Bật nhóm                                | `true`           |
| `channels.feishu.textChunkLimit`                  | Kích thước đoạn tin nhắn                | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Giới hạn kích thước phương tiện         | `30`             |
| `channels.feishu.streaming`                       | Bật đầu ra thẻ streaming                | `true`           |
| `channels.feishu.blockStreaming`                  | Bật streaming cấp khối                  | `true`           |

---

## Tham khảo dmPolicy

| Giá trị       | Hành vi                                                        |
| ------------- | -------------------------------------------------------------- |
| `"pairing"`   | **Mặc định.** Người dùng không xác định nhận mã ghép đôi; cần phê duyệt |
| `"allowlist"` | Chỉ người dùng trong `allowFrom` có thể chat                  |
| `"open"`      | Cho phép tất cả người dùng (yêu cầu `"*"` trong allowFrom)    |
| `"disabled"`  | Vô hiệu hóa DMs                                               |

---

## Các loại tin nhắn được hỗ trợ

### Nhận

- ✅ Văn bản
- ✅ Văn bản phong phú (post)
- ✅ Hình ảnh
- ✅ Tệp
- ✅ Âm thanh
- ✅ Video/phương tiện
- ✅ Nhãn dán

### Gửi

- ✅ Văn bản
- ✅ Hình ảnh
- ✅ Tệp
- ✅ Âm thanh
- ✅ Video/phương tiện
- ✅ Thẻ tương tác
- ⚠️ Văn bản phong phú (định dạng kiểu post và thẻ, không phải các tính năng tạo nội dung Feishu tùy ý)

### Chủ đề và trả lời

- ✅ Trả lời nội tuyến
- ✅ Trả lời theo chủ đề nơi Feishu cung cấp `reply_in_thread`
- ✅ Trả lời phương tiện giữ nguyên nhận thức chủ đề khi trả lời tin nhắn trong chủ đề

## Bề mặt hành động runtime

Hiện tại Feishu cung cấp các hành động runtime sau:

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
- `react` và `reactions` khi các phản ứng được bật trong cấu hình
