---
summary: "Trạng thái hỗ trợ bot Microsoft Teams, khả năng và cấu hình"
read_when:
  - Làm việc với các tính năng kênh Microsoft Teams
title: "Microsoft Teams"
---

# Microsoft Teams (plugin)

> "Hãy từ bỏ mọi hy vọng, những ai bước vào đây."

Cập nhật: 2026-01-21

Trạng thái: hỗ trợ văn bản + tệp đính kèm DM; gửi tệp trong kênh/nhóm yêu cầu `sharePointSiteId` + quyền Graph (xem [Gửi tệp trong trò chuyện nhóm](#sending-files-in-group-chats)). Khảo sát được gửi qua Adaptive Cards.

## Yêu cầu plugin

Microsoft Teams được phát hành dưới dạng plugin và không đi kèm với cài đặt lõi.

**Thay đổi lớn (2026.1.15):** Microsoft Teams đã tách khỏi lõi. Nếu sử dụng, cần cài đặt plugin.

Giải thích: giúp cài đặt lõi nhẹ hơn và cho phép cập nhật các phụ thuộc của Microsoft Teams độc lập.

Cài đặt qua CLI (npm registry):

```bash
openclaw plugins install @openclaw/msteams
```

Kiểm tra cục bộ (khi chạy từ repo git):

```bash
openclaw plugins install ./extensions/msteams
```

Nếu chọn Teams trong quá trình thiết lập và phát hiện git checkout, OpenClaw sẽ tự động đề xuất đường dẫn cài đặt cục bộ.

Chi tiết: [Plugins](/tools/plugin)

## Thiết lập nhanh (dành cho người mới bắt đầu)

1. Cài đặt plugin Microsoft Teams.
2. Tạo một **Azure Bot** (App ID + client secret + tenant ID).
3. Cấu hình OpenClaw với các thông tin xác thực đó.
4. Mở `/api/messages` (cổng 3978 mặc định) qua URL công khai hoặc tunnel.
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

Lưu ý: trò chuyện nhóm bị chặn theo mặc định (`channels.msteams.groupPolicy: "allowlist"`). Để cho phép trả lời nhóm, đặt `channels.msteams.groupAllowFrom` (hoặc sử dụng `groupPolicy: "open"` để cho phép bất kỳ thành viên nào, có nhắc tên).

## Mục tiêu

- Giao tiếp với OpenClaw qua Teams DMs, trò chuyện nhóm hoặc kênh.
- Giữ định tuyến xác định: trả lời luôn quay lại kênh mà chúng đến.
- Mặc định hành vi kênh an toàn (yêu cầu nhắc tên trừ khi được cấu hình khác).

## Ghi cấu hình

Theo mặc định, Microsoft Teams được phép ghi cập nhật cấu hình được kích hoạt bởi `/config set|unset` (yêu cầu `commands.config: true`).

Vô hiệu hóa với:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kiểm soát truy cập (DMs + nhóm)

**Truy cập DM**

- Mặc định: `channels.msteams.dmPolicy = "pairing"`. Người gửi không xác định bị bỏ qua cho đến khi được chấp thuận.
- `channels.msteams.allowFrom` nên sử dụng các ID đối tượng AAD ổn định.
- UPN/tên hiển thị có thể thay đổi; khớp trực tiếp bị vô hiệu hóa theo mặc định và chỉ được bật với `channels.msteams.dangerouslyAllowNameMatching: true`.
- Wizard có thể giải quyết tên thành ID qua Microsoft Graph khi thông tin xác thực cho phép.

**Truy cập nhóm**

- Mặc định: `channels.msteams.groupPolicy = "allowlist"` (bị chặn trừ khi bạn thêm `groupAllowFrom`). Sử dụng `channels.defaults.groupPolicy` để ghi đè mặc định khi không được đặt.
- `channels.msteams.groupAllowFrom` kiểm soát người gửi nào có thể kích hoạt trong trò chuyện nhóm/kênh (dựa vào `channels.msteams.allowFrom`).
- Đặt `groupPolicy: "open"` để cho phép bất kỳ thành viên nào (vẫn yêu cầu nhắc tên theo mặc định).
- Để không cho phép **kênh nào**, đặt `channels.msteams.groupPolicy: "disabled"`.

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

**Danh sách cho phép Teams + kênh**

- Phạm vi trả lời nhóm/kênh bằng cách liệt kê các đội và kênh dưới `channels.msteams.teams`.
- Các khóa nên sử dụng ID đội ổn định và ID cuộc trò chuyện kênh.
- Khi `groupPolicy="allowlist"` và có danh sách cho phép đội, chỉ các đội/kênh được liệt kê mới được chấp nhận (yêu cầu nhắc tên).
- Wizard cấu hình chấp nhận các mục `Team/Channel` và lưu trữ chúng cho bạn.
- Khi khởi động, OpenClaw giải quyết tên đội/kênh và danh sách cho phép người dùng thành ID (khi quyền Graph cho phép) và ghi lại ánh xạ; tên đội/kênh chưa được giải quyết được giữ nguyên như đã nhập nhưng bị bỏ qua để định tuyến theo mặc định trừ khi `channels.msteams.dangerouslyAllowNameMatching: true` được bật.

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

1. Cài đặt plugin Microsoft Teams.
2. Tạo một **Azure Bot** (App ID + secret + tenant ID).
3. Xây dựng một **gói ứng dụng Teams** tham chiếu bot và bao gồm các quyền RSC dưới đây.
4. Tải lên/cài đặt ứng dụng Teams vào một đội (hoặc phạm vi cá nhân cho DMs).
5. Cấu hình `msteams` trong `~/.openclaw/openclaw.json` (hoặc biến môi trường) và khởi động gateway.
6. Gateway lắng nghe lưu lượng webhook Bot Framework trên `/api/messages` theo mặc định.

## Thiết lập Azure Bot (Yêu cầu trước)

Trước khi cấu hình OpenClaw, bạn cần tạo một tài nguyên Azure Bot.

### Bước 1: Tạo Azure Bot

1. Truy cập [Tạo Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Điền vào tab **Basics**:

   | Trường               | Giá trị                                                   |
   | -------------------- | --------------------------------------------------------- |
   | **Bot handle**       | Tên bot của bạn, ví dụ: `openclaw-msteams` (phải là duy nhất) |
   | **Subscription**     | Chọn đăng ký Azure của bạn                                |
   | **Resource group**   | Tạo mới hoặc sử dụng nhóm hiện có                        |
   | **Pricing tier**     | **Free** cho phát triển/kiểm tra                          |
   | **Type of App**      | **Single Tenant** (khuyến nghị - xem ghi chú dưới đây)   |
   | **Creation type**    | **Create new Microsoft App ID**                           |

> **Thông báo ngừng hỗ trợ:** Việc tạo bot nhiều tenant mới đã bị ngừng sau ngày 31-07-2025. Sử dụng **Single Tenant** cho các bot mới.

3. Nhấp **Review + create** → **Create** (chờ ~1-2 phút)

### Bước 2: Lấy thông tin xác thực

1. Truy cập tài nguyên Azure Bot của bạn → **Configuration**
2. Sao chép **Microsoft App ID** → đây là `appId` của bạn
3. Nhấp **Manage Password** → đi đến App Registration
4. Dưới **Certificates & secrets** → **New client secret** → sao chép **Value** → đây là `appPassword` của bạn
5. Đi đến **Overview** → sao chép **Directory (tenant) ID** → đây là `tenantId` của bạn

### Bước 3: Cấu hình Endpoint nhắn tin

1. Trong Azure Bot → **Configuration**
2. Đặt **Messaging endpoint** thành URL webhook của bạn:
   - Sản xuất: `https://your-domain.com/api/messages`
   - Phát triển cục bộ: Sử dụng tunnel (xem [Phát triển cục bộ](#local-development-tunneling) dưới đây)

### Bước 4: Kích hoạt Kênh Teams

1. Trong Azure Bot → **Channels**
2. Nhấp **Microsoft Teams** → Configure → Save
3. Chấp nhận Điều khoản Dịch vụ

## Phát triển cục bộ (Tunneling)

Teams không thể truy cập `localhost`. Sử dụng tunnel cho phát triển cục bộ:

**Tùy chọn A: ngrok**

```bash
ngrok http 3978
# Sao chép URL https, ví dụ: https://abc123.ngrok.io
# Đặt endpoint nhắn tin thành: https://abc123.ngrok.io/api/messages
```

**Tùy chọn B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Sử dụng URL funnel Tailscale của bạn làm endpoint nhắn tin
```

## Cổng phát triển Teams (Thay thế)

Thay vì tạo thủ công một manifest ZIP, bạn có thể sử dụng [Cổng phát triển Teams](https://dev.teams.microsoft.com/apps):

1. Nhấp **+ New app**
2. Điền thông tin cơ bản (tên, mô tả, thông tin nhà phát triển)
3. Đi đến **App features** → **Bot**
4. Chọn **Enter a bot ID manually** và dán Azure Bot App ID của bạn
5. Kiểm tra phạm vi: **Personal**, **Team**, **Group Chat**
6. Nhấp **Distribute** → **Download app package**
7. Trong Teams: **Apps** → **Manage your apps** → **Upload a custom app** → chọn ZIP

Điều này thường dễ dàng hơn so với chỉnh sửa JSON manifest bằng tay.

## Kiểm tra Bot

**Tùy chọn A: Azure Web Chat (xác minh webhook trước)**

1. Trong Azure Portal → tài nguyên Azure Bot của bạn → **Test in Web Chat**
2. Gửi một tin nhắn - bạn sẽ thấy phản hồi
3. Điều này xác nhận endpoint webhook của bạn hoạt động trước khi thiết lập Teams

**Tùy chọn B: Teams (sau khi cài đặt ứng dụng)**

1. Cài đặt ứng dụng Teams (sideload hoặc org catalog)
2. Tìm bot trong Teams và gửi một DM
3. Kiểm tra nhật ký gateway để xem hoạt động đến

## Thiết lập (chỉ văn bản tối thiểu)

1. **Cài đặt plugin Microsoft Teams**
   - Từ npm: `openclaw plugins install @openclaw/msteams`
   - Từ kiểm tra cục bộ: `openclaw plugins install ./extensions/msteams`

2. **Đăng ký bot**
   - Tạo một Azure Bot (xem trên) và ghi chú:
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Manifest ứng dụng Teams**
   - Bao gồm một mục `bot` với `botId = <App ID>`.
   - Phạm vi: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (yêu cầu để xử lý tệp trong phạm vi cá nhân).
   - Thêm quyền RSC (dưới đây).
   - Tạo biểu tượng: `outline.png` (32x32) và `color.png` (192x192).
   - Nén tất cả ba tệp lại với nhau: `manifest.json`, `outline.png`, `color.png`.

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

   Bạn cũng có thể sử dụng biến môi trường thay vì khóa cấu hình:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Endpoint bot**
   - Đặt Endpoint Nhắn tin Azure Bot thành:
     - `https://<host>:3978/api/messages` (hoặc đường dẫn/cổng bạn chọn).

6. **Chạy gateway**
   - Kênh Teams tự động khởi động khi plugin được cài đặt và cấu hình `msteams` tồn tại với thông tin xác thực.

## Ngữ cảnh lịch sử

- `channels.msteams.historyLimit` kiểm soát số lượng tin nhắn kênh/nhóm gần đây được gói vào lời nhắc.
- Dựa vào `messages.groupChat.historyLimit`. Đặt `0` để vô hiệu hóa (mặc định 50).
- Lịch sử DM có thể bị giới hạn với `channels.msteams.dmHistoryLimit` (lượt người dùng). Ghi đè theo người dùng: `channels.msteams.dms["<user_id>"].historyLimit`.

## Quyền RSC Teams hiện tại (Manifest)

Đây là các **quyền resourceSpecific hiện có** trong manifest ứng dụng Teams của chúng tôi. Chúng chỉ áp dụng trong đội/trò chuyện nơi ứng dụng được cài đặt.

**Đối với kênh (phạm vi đội):**

- `ChannelMessage.Read.Group` (Application) - nhận tất cả tin nhắn kênh mà không cần @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Đối với trò chuyện nhóm:**

- `ChatMessage.Read.Chat` (Application) - nhận tất cả tin nhắn trò chuyện nhóm mà không cần @mention

## Ví dụ Manifest Teams (đã rút gọn)

Ví dụ tối thiểu, hợp lệ với các trường bắt buộc. Thay thế ID và URL.

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

### Lưu ý về manifest (các trường bắt buộc)

- `bots[].botId` **phải** khớp với Azure Bot App ID.
- `webApplicationInfo.id` **phải** khớp với Azure Bot App ID.
- `bots[].scopes` phải bao gồm các bề mặt bạn dự định sử dụng (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` là bắt buộc để xử lý tệp trong phạm vi cá nhân.
- `authorization.permissions.resourceSpecific` phải bao gồm quyền đọc/gửi kênh nếu bạn muốn lưu lượng kênh.

### Cập nhật ứng dụng hiện có

Để cập nhật ứng dụng Teams đã cài đặt (ví dụ: để thêm quyền RSC):

1. Cập nhật `manifest.json` của bạn với các cài đặt mới
2. **Tăng trường `version`** (ví dụ: `1.0.0` → `1.1.0`)
3. **Nén lại** manifest với các biểu tượng (`manifest.json`, `outline.png`, `color.png`)
4. Tải lên zip mới:
   - **Tùy chọn A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → tìm ứng dụng của bạn → Upload phiên bản mới
   - **Tùy chọn B (Sideload):** Trong Teams → Apps → Manage your apps → Upload a custom app
5. **Đối với kênh đội:** Cài đặt lại ứng dụng trong mỗi đội để các quyền mới có hiệu lực
6. **Thoát hoàn toàn và khởi động lại Teams** (không chỉ đóng cửa sổ) để xóa bộ nhớ đệm metadata ứng dụng

## Khả năng: Chỉ RSC vs Graph

### Với **Chỉ Teams RSC** (ứng dụng đã cài đặt, không có quyền API Graph)

Hoạt động:

- Đọc nội dung **văn bản** tin nhắn kênh.
- Gửi nội dung **văn bản** tin nhắn kênh.
- Nhận tệp đính kèm **cá nhân (DM)**.

Không hoạt động:

- Nội dung **hình ảnh hoặc tệp** kênh/nhóm (payload chỉ bao gồm HTML stub).
- Tải xuống tệp đính kèm được lưu trữ trong SharePoint/OneDrive.
- Đọc lịch sử tin nhắn (ngoài sự kiện webhook trực tiếp).

### Với **Teams RSC + quyền API Microsoft Graph**

Thêm:

- Tải xuống nội dung được lưu trữ (hình ảnh được dán vào tin nhắn).
- Tải xuống tệp đính kèm được lưu trữ trong SharePoint/OneDrive.
- Đọc lịch sử tin nhắn kênh/trò chuyện qua Graph.

### RSC vs API Graph

| Khả năng                  | Quyền RSC            | API Graph                           |
| ------------------------- | -------------------- | ----------------------------------- |
| **Tin nhắn thời gian thực** | Có (qua webhook)    | Không (chỉ polling)                 |
| **Tin nhắn lịch sử**      | Không                | Có (có thể truy vấn lịch sử)        |
| **Độ phức tạp thiết lập** | Chỉ manifest ứng dụng | Yêu cầu sự đồng ý của admin + luồng token |
| **Hoạt động ngoại tuyến** | Không (phải đang chạy) | Có (truy vấn bất kỳ lúc nào)       |

**Kết luận:** RSC dành cho lắng nghe thời gian thực; API Graph dành cho truy cập lịch sử. Để bắt kịp các tin nhắn đã bỏ lỡ khi ngoại tuyến, bạn cần API Graph với `ChannelMessage.Read.All` (yêu cầu sự đồng ý của admin).

## Phương tiện + lịch sử hỗ trợ Graph (yêu cầu cho kênh)

Nếu bạn cần hình ảnh/tệp trong **kênh** hoặc muốn truy xuất **lịch sử tin nhắn**, bạn phải bật quyền Microsoft Graph và cấp sự đồng ý của admin.

1. Trong Entra ID (Azure AD) **App Registration**, thêm quyền **Application** Microsoft Graph:
   - `ChannelMessage.Read.All` (tệp đính kèm kênh + lịch sử)
   - `Chat.Read.All` hoặc `ChatMessage.Read.All` (trò chuyện nhóm)
2. **Cấp sự đồng ý của admin** cho tenant.
3. Tăng **phiên bản manifest** ứng dụng Teams, tải lên lại và **cài đặt lại ứng dụng trong Teams**.
4. **Thoát hoàn toàn và khởi động lại Teams** để xóa bộ nhớ đệm metadata ứng dụng.

**Quyền bổ sung cho nhắc tên người dùng:** Nhắc tên người dùng hoạt động ngay lập tức cho người dùng trong cuộc trò chuyện. Tuy nhiên, nếu bạn muốn tìm kiếm và nhắc tên người dùng không có trong cuộc trò chuyện hiện tại, hãy thêm quyền `User.Read.All` (Application) và cấp sự đồng ý của admin.

## Giới hạn đã biết

### Thời gian chờ webhook

Teams gửi tin nhắn qua HTTP webhook. Nếu xử lý mất quá nhiều thời gian (ví dụ: phản hồi LLM chậm), bạn có thể thấy:

- Thời gian chờ gateway
- Teams thử lại tin nhắn (gây ra trùng lặp)
- Bỏ qua phản hồi

OpenClaw xử lý điều này bằng cách trả về nhanh chóng và gửi phản hồi chủ động, nhưng phản hồi rất chậm vẫn có thể gây ra vấn đề.

### Định dạng

Markdown của Teams hạn chế hơn so với Slack hoặc Discord:

- Định dạng cơ bản hoạt động: **đậm**, _nghiêng_, `code`, liên kết
- Markdown phức tạp (bảng, danh sách lồng nhau) có thể không hiển thị đúng
- Adaptive Cards được hỗ trợ cho khảo sát và gửi thẻ tùy ý (xem dưới đây)

## Cấu hình

Các cài đặt chính (xem `/gateway/configuration` cho các mẫu kênh chia sẻ):

- `channels.msteams.enabled`: bật/tắt kênh.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: thông tin xác thực bot.
- `channels.msteams.webhook.port` (mặc định `3978`)
- `channels.msteams.webhook.path` (mặc định `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing)
- `channels.msteams.allowFrom`: danh sách cho phép DM (khuyến nghị sử dụng ID đối tượng AAD). Wizard giải quyết tên thành ID trong quá trình thiết lập khi có quyền Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: công tắc phá vỡ để bật lại khớp UPN/tên hiển thị có thể thay đổi và định tuyến tên đội/kênh trực tiếp.
- `channels.msteams.textChunkLimit`: kích thước đoạn văn bản gửi đi.
- `channels.msteams.chunkMode`: `length` (mặc định) hoặc `newline` để chia theo dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài.
- `channels.msteams.mediaAllowHosts`: danh sách cho phép cho các máy chủ tệp đính kèm đến (mặc định là các tên miền Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: danh sách cho phép cho việc đính kèm tiêu đề Authorization trên các lần thử lại phương tiện (mặc định là các máy chủ Graph + Bot Framework). Giữ danh sách này nghiêm ngặt (tránh các hậu tố đa tenant).
- `channels.msteams.requireMention`: yêu cầu nhắc tên trong kênh/nhóm (mặc định là true).
- `channels.msteams.replyStyle`: `thread | top-level` (xem [Kiểu trả lời](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: ghi đè theo đội.
- `channels.msteams.teams.<teamId>.requireMention`: ghi đè theo đội.
- `channels.msteams.teams.<teamId>.tools`: ghi đè chính sách công cụ mặc định theo đội (`allow`/`deny`/`alsoAllow`) được sử dụng khi thiếu ghi đè kênh.
- `channels.msteams.teams.<teamId>.toolsBySender`: ghi đè chính sách công cụ theo đội theo người gửi (`"*"` hỗ trợ ký tự đại diện).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: ghi đè theo kênh.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: ghi đè theo kênh.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: ghi đè chính sách công cụ theo kênh (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: ghi đè chính sách công cụ theo kênh theo người gửi (`"*"` hỗ trợ ký tự đại diện).
- `toolsBySender` các khóa nên sử dụng các tiền tố rõ ràng: `id:`, `e164:`, `username:`, `name:` (các khóa không có tiền tố cũ vẫn chỉ ánh xạ đến `id:`).
- `channels.msteams.sharePointSiteId`: ID trang SharePoint để tải lên tệp trong trò chuyện nhóm/kênh (xem [Gửi tệp trong trò chuyện nhóm](#sending-files-in-group-chats)).

## Định tuyến & Phiên

- Khóa phiên tuân theo định dạng agent tiêu chuẩn (xem [/concepts/session](/concepts/session)):
  - Tin nhắn trực tiếp chia sẻ phiên chính (`agent:<agentId>:<mainKey>`).
  - Tin nhắn kênh/nhóm sử dụng ID cuộc trò chuyện:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Kiểu trả lời: Threads vs Posts

Teams gần đây đã giới thiệu hai kiểu giao diện người dùng kênh trên cùng một mô hình dữ liệu cơ bản:

| Kiểu                      | Mô tả                                                   | `replyStyle` khuyến nghị |
| ------------------------- | ------------------------------------------------------- | ------------------------ |
| **Posts** (cổ điển)       | Tin nhắn xuất hiện dưới dạng thẻ với các trả lời luồng bên dưới | `thread` (mặc định)      |
| **Threads** (giống Slack) | Tin nhắn chảy theo dòng, giống như Slack                | `top-level`              |

**Vấn đề:** API Teams không tiết lộ kiểu giao diện người dùng mà một kênh sử dụng. Nếu bạn sử dụng sai `replyStyle`:

- `thread` trong kênh kiểu Threads → trả lời xuất hiện lồng ghép không tự nhiên
- `top-level` trong kênh kiểu Posts → trả lời xuất hiện dưới dạng các bài đăng cấp cao riêng biệt thay vì trong luồng

**Giải pháp:** Cấu hình `replyStyle` theo kênh dựa trên cách kênh được thiết lập:

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

## Tệp đính kèm & Hình ảnh

**Giới hạn hiện tại:**

- **DMs:** Hình ảnh và tệp đính kèm hoạt động qua API tệp bot Teams.
- **Kênh/nhóm:** Tệp đính kèm sống trong lưu trữ M365 (SharePoint/OneDrive). Payload webhook chỉ bao gồm một HTML stub, không phải byte tệp thực tế. **Quyền API Graph là bắt buộc** để tải xuống tệp đính kèm kênh.

Không có quyền Graph, tin nhắn kênh có hình ảnh sẽ được nhận dưới dạng chỉ văn bản (nội dung hình ảnh không thể truy cập được đối với bot).
Theo mặc định, OpenClaw chỉ tải xuống phương tiện từ các tên miền Microsoft/Teams. Ghi đè với `channels.msteams.mediaAllowHosts` (sử dụng `["*"]` để cho phép bất kỳ máy chủ nào).
Các tiêu đề Authorization chỉ được đính kèm cho các máy chủ trong `channels.msteams.mediaAuthAllowHosts` (mặc định là các máy chủ Graph + Bot Framework). Giữ danh sách này nghiêm ngặt (tránh các hậu tố đa tenant).

## Gửi tệp trong trò chuyện nhóm

Bots có thể gửi tệp trong DMs bằng cách sử dụng luồng FileConsentCard (tích hợp sẵn). Tuy nhiên, **gửi tệp trong trò chuyện nhóm/kênh** yêu cầu thiết lập bổ sung:

| Ngữ cảnh                  | Cách tệp được gửi                             | Thiết lập cần thiết                                  |
| ------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| **DMs**                   | FileConsentCard → người dùng chấp nhận → bot tải lên | Hoạt động ngay lập tức                               |
| **Trò chuyện nhóm/kênh**  | Tải lên SharePoint → chia sẻ liên kết         | Yêu cầu `sharePointSiteId` + quyền Graph             |
| **Hình ảnh (bất kỳ ngữ cảnh nào)** | Mã hóa Base64 nội tuyến                  | Hoạt động ngay lập tức                               |

### Tại sao trò chuyện nhóm cần SharePoint

Bots không có ổ đĩa OneDrive cá nhân (điểm cuối API Graph `/me/drive` không hoạt động cho các danh tính ứng dụng). Để gửi tệp trong trò chuyện nhóm/kênh, bot tải lên một **trang SharePoint** và tạo một liên kết chia sẻ.

### Thiết lập

1. **Thêm quyền API Graph** trong Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - tải lên tệp vào SharePoint
   - `Chat.Read.All` (Application) - tùy chọn, cho phép liên kết chia sẻ theo người dùng

2. **Cấp sự đồng ý của admin** cho tenant.

3. **Lấy ID trang SharePoint của bạn:**

   ```bash
   # Qua Graph Explorer hoặc curl với token hợp lệ:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Ví dụ: cho một trang tại "contoso.sharepoint.com/sites/BotFiles"
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
| `Sites.ReadWrite.All` chỉ               | Liên kết chia sẻ toàn tổ chức (bất kỳ ai trong tổ chức có thể truy cập) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Liên kết chia sẻ theo người dùng (chỉ thành viên trò chuyện có thể truy cập) |

Chia sẻ theo người dùng an toàn hơn vì chỉ những người tham gia trò chuyện mới có thể truy cập tệp. Nếu thiếu quyền `Chat.Read.All`, bot sẽ quay lại chia sẻ toàn tổ chức.

### Hành vi dự phòng

| Kịch bản                                          | Kết quả                                             |
| ------------------------------------------------- | --------------------------------------------------- |
| Trò chuyện nhóm + tệp + `sharePointSiteId` được cấu hình | Tải lên SharePoint, gửi liên kết chia sẻ            |
| Trò chuyện nhóm + tệp + không có `sharePointSiteId` | Thử tải lên OneDrive (có thể thất bại), chỉ gửi văn bản |
| Trò chuyện cá nhân + tệp                          | Luồng FileConsentCard (hoạt động mà không cần SharePoint) |
| Bất kỳ ngữ cảnh nào + hình ảnh                    | Mã hóa Base64 nội tuyến (hoạt động mà không cần SharePoint) |

### Vị trí lưu trữ tệp

Các tệp tải lên được lưu trữ trong thư mục `/OpenClawShared/` trong thư viện tài liệu mặc định của trang SharePoint được cấu hình.

## Khảo sát (Adaptive Cards)

OpenClaw gửi khảo sát Teams dưới dạng Adaptive Cards (không có API khảo sát Teams gốc).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Phiếu bầu được ghi lại bởi gateway trong `~/.openclaw/msteams-polls.json`.
- Gateway phải luôn trực tuyến để ghi lại phiếu bầu.
- Khảo sát chưa tự động đăng tóm tắt kết quả (kiểm tra tệp lưu trữ nếu cần).

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

Xem [tài liệu Adaptive Cards](https://adaptivecards.io/) để biết schema và ví dụ về thẻ. Để biết chi tiết định dạng mục tiêu, xem [Định dạng mục tiêu](#target-formats) dưới đây.

## Định dạng mục tiêu

Các mục tiêu MSTeams sử dụng tiền tố để phân biệt giữa người dùng và cuộc trò chuyện:

| Loại mục tiêu           | Định dạng                         | Ví dụ                                               |
| ----------------------- | --------------------------------- | --------------------------------------------------- |
| Người dùng (theo ID)    | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Người dùng (theo tên)   | `user:<display-name>`            | `user:John Smith` (yêu cầu API Graph)               |
| Nhóm/kênh               | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Nhóm/kênh (thô)         | `<conversation-id>`              | `19:abc123...@thread.tacv2` (nếu chứa `@thread`)    |

**Ví dụ CLI:**

```bash
# Gửi đến một người dùng theo ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Gửi đến một người dùng theo tên hiển thị (kích hoạt tìm kiếm API Graph)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Gửi đến một trò chuyện nhóm hoặc kênh
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

Lưu ý: Không có tiền tố `user:`, tên mặc định sẽ được giải quyết theo nhóm/đội. Luôn sử dụng `user:` khi nhắm mục tiêu người theo tên hiển thị.

## Nhắn tin chủ động

- Tin nhắn chủ động chỉ có thể thực hiện **sau khi** người dùng đã tương tác, vì chúng tôi lưu trữ tham chiếu cuộc trò chuyện tại thời điểm đó.
- Xem `/gateway/configuration` cho `dmPolicy` và danh sách cho phép.

## ID Đội và Kênh (Lỗi phổ biến)

Tham số truy vấn `groupId` trong URL Teams **KHÔNG PHẢI** là ID đội được sử dụng cho cấu hình. Trích xuất ID từ đường dẫn URL thay thế:

**URL Đội:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID đội (giải mã URL phần này)
```

**URL Kênh:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID kênh (giải mã URL phần này)
```

**Đối với cấu hình:**

- ID đội = đoạn đường dẫn sau `/team/` (giải mã URL, ví dụ: `19:Bk4j...@thread.tacv2`)
- ID kênh = đoạn đường dẫn sau `/channel/` (giải mã URL)
- **Bỏ qua** tham số truy vấn `groupId`

## Kênh riêng tư

Bots có hỗ trợ hạn chế trong các kênh riêng tư:

| Tính năng                    | Kênh tiêu chuẩn | Kênh riêng tư           |
| ---------------------------- | --------------- | ----------------------- |
| Cài đặt bot                  | Có              | Hạn chế                 |
| Tin nhắn thời gian thực (webhook) | Có              | Có thể không hoạt động  |
| Quyền RSC                    | Có              | Có thể hoạt động khác   |
| @mentions                    | Có              | Nếu bot có thể truy cập |
| Lịch sử API Graph            | Có              | Có (với quyền)         |

**Giải pháp nếu kênh riêng tư không hoạt động:**

1. Sử dụng kênh tiêu chuẩn cho tương tác bot
2. Sử dụng DMs - người dùng luôn có thể nhắn tin trực tiếp cho bot
3. Sử dụng API Graph để truy cập lịch sử (yêu cầu `ChannelMessage.Read.All`)

## Khắc phục sự cố

### Vấn đề phổ biến

- **Hình ảnh không hiển thị trong kênh:** Quyền Graph hoặc sự đồng ý của admin bị thiếu. Cài đặt lại ứng dụng Teams và thoát hoàn toàn/mở lại Teams.
- **Không có phản hồi trong kênh:** Nhắc tên là bắt buộc theo mặc định; đặt `channels.msteams.requireMention=false` hoặc cấu hình theo đội/kênh.
- **Không khớp phiên bản (Teams vẫn hiển thị manifest cũ):** xóa + thêm lại ứng dụng và thoát hoàn toàn Teams để làm mới.
- **401 Unauthorized từ webhook:** Dự kiến khi thử nghiệm thủ công mà không có Azure JWT - nghĩa là endpoint có thể truy cập nhưng xác thực thất bại. Sử dụng Azure Web Chat để kiểm tra đúng cách.

### Lỗi tải lên manifest

- **"Icon file cannot be empty":** Manifest tham chiếu các tệp biểu tượng có kích thước 0 byte. Tạo các biểu tượng PNG hợp lệ (32x32 cho `outline.png`, 192x192 cho `color.png`).
- **"webApplicationInfo.Id already in use":** Ứng dụng vẫn được cài đặt trong một đội/trò chuyện khác. Tìm và gỡ cài đặt trước, hoặc chờ 5-10 phút để truyền tải.
- **"Something went wrong" khi tải lên:** Tải lên qua [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) thay thế, mở DevTools trình duyệt (F12) → tab Network, và kiểm tra nội dung phản hồi để biết lỗi thực tế.
- **Sideload thất bại:** Thử "Upload an app to your org's app catalog" thay vì "Upload a custom app" - điều này thường bỏ qua các hạn chế sideload.

### Quyền RSC không hoạt động

1. Xác minh `webApplicationInfo.id` khớp chính xác với App ID của bot của bạn
2. Tải lên lại ứng dụng và cài đặt lại trong đội/trò chuyện
3. Kiểm tra xem admin tổ chức của bạn có chặn quyền RSC không
4. Xác nhận bạn đang sử dụng phạm vi đúng: `ChannelMessage.Read.Group` cho đội, `ChatMessage.Read.Chat` cho trò chuyện nhóm

## Tham khảo

- [Tạo Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Hướng dẫn thiết lập Azure Bot
- [Cổng phát triển Teams](https://dev.teams.microsoft.com/apps) - tạo/quản lý ứng dụng Teams
- [Schema manifest ứng dụng Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Nhận tin nhắn kênh với RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Tham khảo quyền RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Xử lý tệp bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kênh/nhóm yêu cầu Graph)
- [Nhắn tin chủ động](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
