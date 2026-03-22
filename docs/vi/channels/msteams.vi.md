# Microsoft Teams (plugin)

> "Abandon all hope, ye who enter here."

Cập nhật: 2026-01-21

Trạng thái: Hỗ trợ text + DM attachments; gửi file trong channel/group cần `sharePointSiteId` + quyền Graph (xem [Gửi file trong group chats](#sending-files-in-group-chats)). Polls gửi qua Adaptive Cards.

## Plugin cần thiết

Microsoft Teams là plugin, không đi kèm cài đặt core.

**Thay đổi lớn (2026.1.15):** Microsoft Teams tách khỏi core. Nếu dùng, cần cài plugin.

Giải thích: Giữ core nhẹ và cho phép cập nhật dependencies của Microsoft Teams độc lập.

Cài qua CLI (npm registry):

```bash
openclaw plugins install @openclaw/msteams
```

Local checkout (khi chạy từ git repo):

```bash
openclaw plugins install ./extensions/msteams
```

Nếu chọn Teams khi setup và phát hiện git checkout, OpenClaw sẽ tự động đề xuất đường dẫn cài đặt local.

Chi tiết: [Plugins](/tools/plugin)

## Cài đặt nhanh (cho người mới)

1. Cài plugin Microsoft Teams.
2. Tạo **Azure Bot** (App ID + client secret + tenant ID).
3. Cấu hình OpenClaw với các thông tin đó.
4. Expose `/api/messages` (mặc định port 3978) qua URL công khai hoặc tunnel.
5. Cài đặt gói ứng dụng Teams và khởi động gateway.

Cấu hình tối thiểu:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Lưu ý: group chats bị chặn mặc định (`channels.msteams.groupPolicy: "allowlist"`). Để cho phép group replies, đặt `channels.msteams.groupAllowFrom` (hoặc dùng `groupPolicy: "open"` để cho phép bất kỳ thành viên nào, có điều kiện mention).

## Mục tiêu

- Giao tiếp với OpenClaw qua Teams DMs, group chats, hoặc channels.
- Giữ routing nhất quán: trả lời luôn quay lại channel nhận được.
- Mặc định hành vi an toàn cho channel (yêu cầu mentions trừ khi cấu hình khác).

## Ghi cấu hình

Mặc định, Microsoft Teams được phép ghi cập nhật cấu hình kích hoạt bởi `/config set|unset` (yêu cầu `commands.config: true`).

Tắt với:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kiểm soát truy cập (DMs + groups)

**Truy cập DM**

- Mặc định: `channels.msteams.dmPolicy = "pairing"`. Người gửi không xác định bị bỏ qua cho đến khi được chấp thuận.
- `channels.msteams.allowFrom` nên dùng stable AAD object IDs.
- UPNs/display names có thể thay đổi; matching trực tiếp bị tắt mặc định và chỉ bật với `channels.msteams.dangerouslyAllowNameMatching: true`.
- Wizard có thể resolve tên thành IDs qua Microsoft Graph khi có quyền.

**Truy cập Group**

- Mặc định: `channels.msteams.groupPolicy = "allowlist"` (bị chặn trừ khi thêm `groupAllowFrom`). Dùng `channels.defaults.groupPolicy` để ghi đè mặc định khi không đặt.
- `channels.msteams.groupAllowFrom` kiểm soát người gửi nào có thể kích hoạt trong group chats/channels (fallback về `channels.msteams.allowFrom`).
- Đặt `groupPolicy: "open"` để cho phép bất kỳ thành viên nào (vẫn có điều kiện mention mặc định).
- Để không cho phép **bất kỳ channel nào**, đặt `channels.msteams.groupPolicy: "disabled"`.

Ví dụ:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + channel allowlist**

- Giới hạn trả lời group/channel bằng cách liệt kê teams và channels dưới `channels.msteams.teams`.
- Keys nên dùng stable team IDs và channel conversation IDs.
- Khi `groupPolicy="allowlist"` và có teams allowlist, chỉ các teams/channels được liệt kê mới được chấp nhận (có điều kiện mention).
- Wizard cấu hình chấp nhận các mục `Team/Channel` và lưu trữ cho bạn.
- Khi khởi động, OpenClaw resolve tên team/channel và user allowlist thành IDs (khi có quyền Graph) và ghi log mapping; tên team/channel không resolve được giữ nguyên như đã nhập nhưng bị bỏ qua cho routing mặc định trừ khi `channels.msteams.dangerouslyAllowNameMatching: true` được bật.

Ví dụ:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Cách hoạt động

1. Cài plugin Microsoft Teams.
2. Tạo **Azure Bot** (App ID + secret + tenant ID).
3. Xây dựng gói ứng dụng **Teams** tham chiếu bot và bao gồm quyền RSC dưới đây.
4. Tải lên/cài đặt ứng dụng Teams vào một team (hoặc phạm vi cá nhân cho DMs).
5. Cấu hình `msteams` trong `~/.openclaw/openclaw.json` (hoặc env vars) và khởi động gateway.
6. Gateway lắng nghe traffic webhook Bot Framework trên `/api/messages` mặc định.

## Thiết lập Azure Bot (Yêu cầu trước)

Trước khi cấu hình OpenClaw, cần tạo một tài nguyên Azure Bot.

### Bước 1: Tạo Azure Bot

1. Truy cập [Tạo Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Điền tab **Basics**:

   | Trường              | Giá trị                                                   |
   | ------------------- | --------------------------------------------------------- |
   | **Bot handle**      | Tên bot, ví dụ: `openclaw-msteams` (phải duy nhất)        |
   | **Subscription**    | Chọn subscription Azure của bạn                           |
   | **Resource group**  | Tạo mới hoặc dùng cái có sẵn                              |
   | **Pricing tier**    | **Free** cho dev/testing                                  |
   | **Type of App**     | **Single Tenant** (khuyến nghị - xem ghi chú dưới)        |
   | **Creation type**   | **Create new Microsoft App ID**                           |

> **Thông báo ngừng hỗ trợ:** Tạo bot multi-tenant mới đã bị ngừng sau 2025-07-31. Dùng **Single Tenant** cho bot mới.

3. Nhấn **Review + create** → **Create** (chờ ~1-2 phút)

### Bước 2: Lấy thông tin đăng nhập

1. Truy cập tài nguyên Azure Bot → **Configuration**
2. Sao chép **Microsoft App ID** → đây là `appId`
3. Nhấn **Manage Password** → đi đến App Registration
4. Dưới **Certificates & secrets** → **New client secret** → sao chép **Value** → đây là `appPassword`
5. Đi đến **Overview** → sao chép **Directory (tenant) ID** → đây là `tenantId`

### Bước 3: Cấu hình Messaging Endpoint

1. Trong Azure Bot → **Configuration**
2. Đặt **Messaging endpoint** thành URL webhook của bạn:
   - Production: `https://your-domain.com/api/messages`
   - Local dev: Dùng tunnel (xem [Local Development](#local-development-tunneling) dưới)

### Bước 4: Bật Teams Channel

1. Trong Azure Bot → **Channels**
2. Nhấn **Microsoft Teams** → Configure → Save
3. Chấp nhận Điều khoản Dịch vụ

## Phát triển Local (Tunneling)

Teams không thể truy cập `localhost`. Dùng tunnel cho phát triển local:

**Option A: ngrok**

```bash
ngrok http 3978
# Sao chép URL https, ví dụ: https://abc123.ngrok.io
# Đặt messaging endpoint thành: https://abc123.ngrok.io/api/messages
```

**Option B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Dùng URL Tailscale funnel làm messaging endpoint
```

## Teams Developer Portal (Lựa chọn thay thế)

Thay vì tạo manifest ZIP thủ công, bạn có thể dùng [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Nhấn **+ New app**
2. Điền thông tin cơ bản (tên, mô tả, thông tin nhà phát triển)
3. Đi đến **App features** → **Bot**
4. Chọn **Enter a bot ID manually** và dán Azure Bot App ID của bạn
5. Kiểm tra scopes: **Personal**, **Team**, **Group Chat**
6. Nhấn **Distribute** → **Download app package**
7. Trong Teams: **Apps** → **Manage your apps** → **Upload a custom app** → chọn ZIP

Cách này thường dễ hơn so với chỉnh sửa JSON manifests bằng tay.

## Kiểm tra Bot

**Option A: Azure Web Chat (xác minh webhook trước)**

1. Trong Azure Portal → tài nguyên Azure Bot của bạn → **Test in Web Chat**
2. Gửi một tin nhắn - bạn sẽ thấy phản hồi
3. Điều này xác nhận endpoint webhook của bạn hoạt động trước khi thiết lập Teams

**Option B: Teams (sau khi cài đặt ứng dụng)**

1. Cài đặt ứng dụng Teams (sideload hoặc org catalog)
2. Tìm bot trong Teams và gửi một DM
3. Kiểm tra log gateway cho hoạt động đến

## Cài đặt (chỉ văn bản tối thiểu)

1. **Cài plugin Microsoft Teams**
   - Từ npm: `openclaw plugins install @openclaw/msteams`
   - Từ local checkout: `openclaw plugins install ./extensions/msteams`

2. **Đăng ký Bot**
   - Tạo một Azure Bot (xem trên) và ghi chú:
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Teams app manifest**
   - Bao gồm một mục `bot` với `botId = <App ID>`.
   - Scopes: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (cần thiết cho xử lý file phạm vi cá nhân).
   - Thêm quyền RSC (dưới).
   - Tạo icons: `outline.png` (32x32) và `color.png` (192x192).
   - Zip ba file lại: `manifest.json`, `outline.png`, `color.png`.

4. **Cấu hình OpenClaw**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   Bạn cũng có thể dùng biến môi trường thay vì config keys:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Bot endpoint**
   - Đặt Azure Bot Messaging Endpoint thành:
     - `https://<host>:3978/api/messages` (hoặc đường dẫn/port bạn chọn).

6. **Chạy gateway**
   - Kênh Teams tự động khởi động khi plugin được cài và cấu hình `msteams` tồn tại với thông tin đăng nhập.

## Lịch sử context

- `channels.msteams.historyLimit` kiểm soát số lượng tin nhắn channel/group gần đây được gói vào prompt.
- Fallback về `messages.groupChat.historyLimit`. Đặt `0` để tắt (mặc định 50).
- Lịch sử DM có thể bị giới hạn với `channels.msteams.dmHistoryLimit` (user turns). Ghi đè từng user: `channels.msteams.dms["<user_id>"].historyLimit`.

## Quyền Teams RSC hiện tại (Manifest)

Đây là **quyền resourceSpecific hiện có** trong manifest ứng dụng Teams của chúng tôi. Chúng chỉ áp dụng trong team/chat nơi ứng dụng được cài đặt.

**Cho channels (phạm vi team):**

- `ChannelMessage.Read.Group` (Application) - nhận tất cả tin nhắn channel mà không cần @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Cho group chats:**

- `ChatMessage.Read.Chat` (Application) - nhận tất cả tin nhắn group chat mà không cần @mention

## Ví dụ Teams Manifest (đã rút gọn)

Ví dụ tối thiểu, hợp lệ với các trường cần thiết. Thay thế IDs và URLs.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Lưu ý manifest (các trường bắt buộc)

- `bots[].botId` **phải** khớp với Azure Bot App ID.
- `webApplicationInfo.id` **phải** khớp với Azure Bot App ID.
- `bots[].scopes` phải bao gồm các bề mặt bạn dự định sử dụng (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` cần thiết cho xử lý file trong phạm vi cá nhân.
- `authorization.permissions.resourceSpecific` phải bao gồm quyền đọc/gửi channel nếu bạn muốn traffic channel.

### Cập nhật ứng dụng hiện có

Để cập nhật ứng dụng Teams đã cài đặt (ví dụ, để thêm quyền RSC):

1. Cập nhật `manifest.json` của bạn với các cài đặt mới
2. **Tăng trường `version`** (ví dụ, `1.0.0` → `1.1.0`)
3. **Re-zip** manifest với icons (`manifest.json`, `outline.png`, `color.png`)
4. Tải lên zip mới:
   - **Option A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → tìm ứng dụng của bạn → Upload phiên bản mới
   - **Option B (Sideload):** Trong Teams → Apps → Manage your apps → Upload một ứng dụng tùy chỉnh
5. **Cho team channels:** Cài đặt lại ứng dụng trong mỗi team để quyền mới có hiệu lực
6. **Thoát hoàn toàn và khởi động lại Teams** (không chỉ đóng cửa sổ) để xóa metadata ứng dụng đã cache

## Khả năng: Chỉ RSC vs Graph

### Với **Chỉ Teams RSC** (ứng dụng cài đặt, không có quyền Graph API)

Hoạt động:

- Đọc nội dung **text** tin nhắn channel.
- Gửi nội dung **text** tin nhắn channel.
- Nhận **file attachments cá nhân (DM)**.

Không hoạt động:

- Nội dung **hình ảnh hoặc file** channel/group (payload chỉ bao gồm HTML stub).
- Tải xuống attachments lưu trữ trong SharePoint/OneDrive.
- Đọc lịch sử tin nhắn (ngoài sự kiện webhook trực tiếp).

### Với **Teams RSC + Microsoft Graph Application permissions**

Thêm:

- Tải xuống nội dung hosted (hình ảnh dán vào tin nhắn).
- Tải xuống file attachments lưu trữ trong SharePoint/OneDrive.
- Đọc lịch sử tin nhắn channel/chat qua Graph.

### RSC vs Graph API

| Khả năng                  | Quyền RSC           | Graph API                           |
| ------------------------- | ------------------- | ----------------------------------- |
| **Tin nhắn thời gian thực** | Có (qua webhook)   | Không (chỉ polling)                 |
| **Tin nhắn lịch sử**      | Không               | Có (có thể truy vấn lịch sử)        |
| **Độ phức tạp cài đặt**   | Chỉ manifest ứng dụng | Yêu cầu admin consent + token flow |
| **Hoạt động offline**     | Không (phải đang chạy) | Có (truy vấn bất kỳ lúc nào)       |

**Kết luận:** RSC dành cho lắng nghe thời gian thực; Graph API dành cho truy cập lịch sử. Để bắt kịp tin nhắn đã bỏ lỡ khi offline, bạn cần Graph API với `ChannelMessage.Read.All` (yêu cầu admin consent).

## Media + lịch sử kích hoạt Graph (cần cho channels)

Nếu cần hình ảnh/files trong **channels** hoặc muốn fetch **lịch sử tin nhắn**, bạn phải kích hoạt quyền Microsoft Graph và cấp admin consent.

1. Trong Entra ID (Azure AD) **App Registration**, thêm Microsoft Graph **Application permissions**:
   - `ChannelMessage.Read.All` (channel attachments + lịch sử)
   - `Chat.Read.All` hoặc `ChatMessage.Read.All` (group chats)
2. **Cấp admin consent** cho tenant.
3. Tăng **phiên bản manifest** ứng dụng Teams, tải lên lại, và **cài đặt lại ứng dụng trong Teams**.
4. **Thoát hoàn toàn và khởi động lại Teams** để xóa metadata ứng dụng đã cache.

**Quyền bổ sung cho user mentions:** User @mentions hoạt động mặc định cho người dùng trong cuộc trò chuyện. Tuy nhiên, nếu muốn tìm kiếm và mention người dùng không có trong cuộc trò chuyện hiện tại, thêm quyền `User.Read.All` (Application) và cấp admin consent.

## Giới hạn đã biết

### Webhook timeouts

Teams gửi tin nhắn qua HTTP webhook. Nếu xử lý mất quá nhiều thời gian (ví dụ, phản hồi LLM chậm), bạn có thể thấy:

- Gateway timeouts
- Teams thử lại tin nhắn (gây trùng lặp)
- Bỏ qua trả lời

OpenClaw xử lý bằng cách trả về nhanh chóng và gửi trả lời chủ động, nhưng phản hồi rất chậm vẫn có thể gây ra vấn đề.

### Định dạng

Markdown của Teams hạn chế hơn Slack hoặc Discord:

- Định dạng cơ bản hoạt động: **bold**, _italic_, `code`, links
- Markdown phức tạp (bảng, danh sách lồng nhau) có thể không render đúng
- Adaptive Cards được hỗ trợ cho polls và gửi card tùy ý (xem dưới)

## Cấu hình

Các cài đặt chính (xem `/gateway/configuration` cho shared channel patterns):

- `channels.msteams.enabled`: bật/tắt kênh.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: thông tin đăng nhập bot.
- `channels.msteams.webhook.port` (mặc định `3978`)
- `channels.msteams.webhook.path` (mặc định `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing)
- `channels.msteams.allowFrom`: DM allowlist (AAD object IDs khuyến nghị). Wizard resolve tên thành IDs trong quá trình setup khi có quyền Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: toggle break-glass để bật lại matching UPN/display-name có thể thay đổi và routing tên team/channel trực tiếp.
- `channels.msteams.textChunkLimit`: kích thước chunk text outbound.
- `channels.msteams.chunkMode`: `length` (mặc định) hoặc `newline` để chia trên dòng trống (ranh giới đoạn văn) trước khi chunk theo độ dài.
- `channels.msteams.mediaAllowHosts`: allowlist cho hosts đính kèm inbound (mặc định là Microsoft/Teams domains).
- `channels.msteams.mediaAuthAllowHosts`: allowlist cho đính kèm Authorization headers trên media retries (mặc định là Graph + Bot Framework hosts).
- `channels.msteams.requireMention`: yêu cầu @mention trong channels/groups (mặc định true).
- `channels.msteams.replyStyle`: `thread | top-level` (xem [Reply Style](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: ghi đè từng team.
- `channels.msteams.teams.<teamId>.requireMention`: ghi đè từng team.
- `channels.msteams.teams.<teamId>.tools`: ghi đè chính sách công cụ mặc định từng team (`allow`/`deny`/`alsoAllow`) dùng khi thiếu ghi đè channel.
- `channels.msteams.teams.<teamId>.toolsBySender`: ghi đè chính sách công cụ từng sender từng team (`"*"` wildcard được hỗ trợ).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: ghi đè từng channel.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: ghi đè từng channel.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: ghi đè chính sách công cụ từng channel (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: ghi đè chính sách công cụ từng sender từng channel (`"*"` wildcard được hỗ trợ).
- `toolsBySender` keys nên dùng prefix rõ ràng:
  `id:`, `e164:`, `username:`, `name:` (các keys không có prefix cũ vẫn map tới `id:` chỉ).
- `channels.msteams.sharePointSiteId`: SharePoint site ID cho tải lên file trong group chats/channels (xem [Gửi file trong group chats](#sending-files-in-group-chats)).

## Routing & Sessions

- Session keys theo định dạng agent chuẩn (xem [/concepts/session](/concepts/session)):
  - Tin nhắn trực tiếp chia sẻ session chính (`agent:<agentId>:<mainKey>`).
  - Tin nhắn channel/group dùng conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Reply Style: Threads vs Posts

Teams gần đây giới thiệu hai kiểu UI channel trên cùng mô hình dữ liệu:

| Kiểu                     | Mô tả                                                   | `replyStyle` khuyến nghị |
| ------------------------ | ------------------------------------------------------- | ------------------------ |
| **Posts** (cổ điển)      | Tin nhắn xuất hiện dưới dạng cards với trả lời thread bên dưới | `thread` (mặc định)      |
| **Threads** (giống Slack) | Tin nhắn chảy tuyến tính, giống Slack hơn              | `top-level`              |

**Vấn đề:** API Teams không tiết lộ kiểu UI mà channel sử dụng. Nếu dùng sai `replyStyle`:

- `thread` trong channel kiểu Threads → trả lời xuất hiện lồng ghép không tự nhiên
- `top-level` trong channel kiểu Posts → trả lời xuất hiện như các bài đăng cấp cao riêng biệt thay vì trong thread

**Giải pháp:** Cấu hình `replyStyle` từng channel dựa trên cách channel được thiết lập:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Attachments & Images

**Giới hạn hiện tại:**

- **DMs:** Hình ảnh và file attachments hoạt động qua Teams bot file APIs.
- **Channels/groups:** Attachments sống trong M365 storage (SharePoint/OneDrive). Payload webhook chỉ bao gồm HTML stub, không phải file bytes thực tế. **Quyền Graph API cần thiết** để tải xuống attachments channel.

Không có quyền Graph, tin nhắn channel với hình ảnh sẽ được nhận dưới dạng chỉ văn bản (nội dung hình ảnh không thể truy cập bởi bot).
Mặc định, OpenClaw chỉ tải xuống media từ hostnames Microsoft/Teams. Ghi đè với `channels.msteams.mediaAllowHosts` (dùng `["*"]` để cho phép bất kỳ host nào).
Authorization headers chỉ được đính kèm cho hosts trong `channels.msteams.mediaAuthAllowHosts` (mặc định là Graph + Bot Framework hosts). Giữ danh sách này nghiêm ngặt (tránh các hậu tố multi-tenant).

## Gửi file trong group chats

Bots có thể gửi file trong DMs bằng FileConsentCard flow (tích hợp sẵn). Tuy nhiên, **gửi file trong group chats/channels** cần thiết lập bổ sung:

| Ngữ cảnh                  | Cách gửi file                              | Cần thiết lập                                    |
| ------------------------- | ------------------------------------------ | ------------------------------------------------ |
| **DMs**                   | FileConsentCard → người dùng chấp nhận → bot tải lên | Hoạt động ngay lập tức                           |
| **Group chats/channels**  | Tải lên SharePoint → chia sẻ link          | Cần `sharePointSiteId` + quyền Graph             |
| **Hình ảnh (bất kỳ ngữ cảnh nào)** | Base64-encoded inline                        | Hoạt động ngay lập tức                           |

### Tại sao group chats cần SharePoint

Bots không có personal OneDrive drive (endpoint `/me/drive` Graph API không hoạt động cho application identities). Để gửi file trong group chats/channels, bot tải lên một **SharePoint site** và tạo một sharing link.

### Thiết lập

1. **Thêm quyền Graph API** trong Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - tải lên file vào SharePoint
   - `Chat.Read.All` (Application) - tùy chọn, cho phép sharing links từng user

2. **Cấp admin consent** cho tenant.

3. **Lấy SharePoint site ID của bạn:**

   ```bash
   # Qua Graph Explorer hoặc curl với token hợp lệ:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Ví dụ: cho một site tại "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Phản hồi bao gồm: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Cấu hình OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... cấu hình khác ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Hành vi chia sẻ

| Quyền                                   | Hành vi chia sẻ                                          |
| --------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` chỉ               | Link chia sẻ toàn tổ chức (bất kỳ ai trong tổ chức có thể truy cập) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link chia sẻ từng user (chỉ thành viên chat có thể truy cập) |

Chia sẻ từng user an toàn hơn vì chỉ có các thành viên chat mới có thể truy cập file. Nếu thiếu quyền `Chat.Read.All`, bot fallback về chia sẻ toàn tổ chức.

### Hành vi fallback

| Kịch bản                                          | Kết quả                                             |
| ------------------------------------------------- | --------------------------------------------------- |
| Group chat + file + `sharePointSiteId` cấu hình   | Tải lên SharePoint, gửi link chia sẻ                |
| Group chat + file + không có `sharePointSiteId`   | Thử tải lên OneDrive (có thể thất bại), chỉ gửi văn bản |
| Personal chat + file                              | FileConsentCard flow (hoạt động không cần SharePoint) |
| Bất kỳ ngữ cảnh nào + hình ảnh                    | Base64-encoded inline (hoạt động không cần SharePoint) |

### Vị trí lưu trữ file

File tải lên được lưu trong thư mục `/OpenClawShared/` trong thư viện tài liệu mặc định của SharePoint site đã cấu hình.

## Polls (Adaptive Cards)

OpenClaw gửi polls Teams dưới dạng Adaptive Cards (không có API poll Teams gốc).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Votes được ghi lại bởi gateway trong `~/.openclaw/msteams-polls.json`.
- Gateway phải online để ghi lại votes.
- Polls chưa tự động đăng kết quả tóm tắt (kiểm tra file lưu trữ nếu cần).

## Adaptive Cards (tùy ý)

Gửi bất kỳ JSON Adaptive Card nào đến người dùng hoặc cuộc trò chuyện Teams bằng công cụ `message` hoặc CLI.

Tham số `card` chấp nhận một đối tượng JSON Adaptive Card. Khi `card` được cung cấp, văn bản tin nhắn là tùy chọn.

**Công cụ agent:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

Xem [tài liệu Adaptive Cards](https://adaptivecards.io/) cho schema và ví dụ card. Để biết chi tiết định dạng target, xem [Target formats](#target-formats) dưới.

## Định dạng target

MSTeams targets dùng prefix để phân biệt giữa người dùng và cuộc trò chuyện:

| Loại target           | Định dạng                         | Ví dụ                                               |
| --------------------- | --------------------------------- | --------------------------------------------------- |
| User (bằng ID)        | `user:<aad-object-id>`            | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| User (bằng tên)       | `user:<display-name>`             | `user:John Smith` (yêu cầu Graph API)               |
| Group/channel         | `conversation:<conversation-id>`  | `conversation:19:abc123...@thread.tacv2`            |
| Group/channel (raw)   | `<conversation-id>`               | `19:abc123...@thread.tacv2` (nếu chứa `@thread`)    |

**Ví dụ CLI:**

```bash
# Gửi đến một user bằng ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Gửi đến một user bằng display name (kích hoạt Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Gửi đến một group chat hoặc channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Gửi một Adaptive Card đến một cuộc trò chuyện
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**Ví dụ công cụ agent:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello" }],
  },
}
```

Lưu ý: Không có prefix `user:`, tên mặc định sẽ được giải quyết theo group/team. Luôn dùng `user:` khi target người bằng display name.

## Tin nhắn chủ động

- Tin nhắn chủ động chỉ có thể thực hiện **sau khi** người dùng đã tương tác, vì chúng tôi lưu trữ tham chiếu cuộc trò chuyện tại thời điểm đó.
- Xem `/gateway/configuration` cho `dmPolicy` và allowlist gating.

## Team và Channel IDs (Lỗi thường gặp)

Tham số truy vấn `groupId` trong URLs Teams **KHÔNG PHẢI** là team ID dùng cho cấu hình. Trích xuất IDs từ đường dẫn URL thay thế:

**Team URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (giải mã URL phần này)
```

**Channel URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (giải mã URL phần này)
```

**Cho cấu hình:**

- Team ID = đoạn sau `/team/` (giải mã URL, ví dụ, `19:Bk4j...@thread.tacv2`)
- Channel ID = đoạn sau `/channel/` (giải mã URL)
- **Bỏ qua** tham số truy vấn `groupId`

## Private Channels

Bots có hỗ trợ hạn chế trong private channels:

| Tính năng                     | Standard Channels | Private Channels       |
| ----------------------------- | ----------------- | ---------------------- |
| Cài đặt bot                   | Có                | Hạn chế                |
| Tin nhắn thời gian thực (webhook) | Có                | Có thể không hoạt động |
| Quyền RSC                     | Có                | Có thể hoạt động khác  |
| @mentions                     | Có                | Nếu bot có thể truy cập |
| Lịch sử Graph API             | Có                | Có (với quyền)         |

**Giải pháp nếu private channels không hoạt động:**

1. Dùng standard channels cho tương tác bot
2. Dùng DMs - người dùng luôn có thể nhắn tin trực tiếp cho bot
3. Dùng Graph API cho truy cập lịch sử (yêu cầu `ChannelMessage.Read.All`)

## Khắc phục sự cố

### Vấn đề thường gặp

- **Hình ảnh không hiển thị trong channels:** Quyền Graph hoặc admin consent thiếu. Cài đặt lại ứng dụng Teams và thoát hoàn toàn/mở lại Teams.
- **Không có phản hồi trong channel:** mentions được yêu cầu mặc định; đặt `channels.msteams.requireMention=false` hoặc cấu hình từng team/channel.
- **Phiên bản không khớp (Teams vẫn hiển thị manifest cũ):** xóa + thêm lại ứng dụng và thoát hoàn toàn Teams để làm mới.
- **401 Unauthorized từ webhook:** Dự kiến khi thử nghiệm thủ công mà không có Azure JWT - nghĩa là endpoint có thể truy cập nhưng auth thất bại. Dùng Azure Web Chat để thử nghiệm đúng cách.

### Lỗi tải lên manifest

- **"Icon file cannot be empty":** Manifest tham chiếu các file icon có kích thước 0 bytes. Tạo các icon PNG hợp lệ (32x32 cho `outline.png`, 192x192 cho `color.png`).
- **"webApplicationInfo.Id already in use":** Ứng dụng vẫn được cài đặt trong team/chat khác. Tìm và gỡ cài đặt trước, hoặc chờ 5-10 phút để propagation.
- **"Something went wrong" khi tải lên:** Tải lên qua [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) thay thế, mở DevTools trình duyệt (F12) → tab Network, và kiểm tra response body cho lỗi thực tế.
- **Sideload thất bại:** Thử "Upload an app to your org's app catalog" thay vì "Upload a custom app" - cách này thường bỏ qua hạn chế sideload.

### Quyền RSC không hoạt động

1. Xác minh `webApplicationInfo.id` khớp chính xác với App ID của bot
2. Tải lên lại ứng dụng và cài đặt lại trong team/chat
3. Kiểm tra xem admin tổ chức của bạn có chặn quyền RSC không
4. Xác nhận bạn đang dùng đúng scope: `ChannelMessage.Read.Group` cho teams, `ChatMessage.Read.Chat` cho group chats

## Tham khảo

- [Tạo Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Hướng dẫn thiết lập Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - tạo/quản lý ứng dụng Teams
- [Schema manifest ứng dụng Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Nhận tin nhắn channel với RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Tham khảo quyền RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Xử lý file bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (channel/group yêu cầu Graph)
- [Tin nhắn chủ động](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)\n