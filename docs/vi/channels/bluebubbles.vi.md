# BlueBubbles (macOS REST)

Trạng thái: Plugin tích hợp với server BlueBubbles trên macOS qua HTTP. **Khuyến nghị dùng cho iMessage** nhờ API phong phú và dễ cài đặt hơn kênh imsg cũ.

## Tổng quan

- Chạy trên macOS qua ứng dụng BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Khuyến nghị/đã test: macOS Sequoia (15). macOS Tahoe (26) hoạt động; nhưng edit hiện không hoạt động trên Tahoe, và cập nhật icon nhóm có thể báo thành công nhưng không đồng bộ.
- OpenClaw giao tiếp qua REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Tin nhắn đến qua webhooks; tin nhắn đi, chỉ báo đang gõ, thông báo đã đọc, và tapbacks qua REST.
- Đính kèm và sticker được xử lý như media inbound (và hiển thị cho agent khi có thể).
- Pairing/allowlist hoạt động như các kênh khác (`/channels/pairing`...) với `channels.bluebubbles.allowFrom` + mã pairing.
- Reactions được hiển thị như sự kiện hệ thống giống Slack/Telegram để agent có thể "mention" trước khi trả lời.
- Tính năng nâng cao: chỉnh sửa, unsend, reply threading, hiệu ứng tin nhắn, quản lý nhóm.

## Bắt đầu nhanh

1. Cài đặt server BlueBubbles trên Mac (theo hướng dẫn tại [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Trong cấu hình BlueBubbles, bật web API và đặt mật khẩu.
3. Chạy `openclaw onboard` và chọn BlueBubbles, hoặc cấu hình thủ công:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. Trỏ webhooks của BlueBubbles đến gateway (ví dụ: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Khởi động gateway; nó sẽ đăng ký handler webhook và bắt đầu pairing.

Lưu ý bảo mật:

- Luôn đặt mật khẩu cho webhook.
- Yêu cầu xác thực webhook. OpenClaw từ chối yêu cầu webhook BlueBubbles nếu không có mật khẩu/guid khớp với `channels.bluebubbles.password` (ví dụ `?password=<password>` hoặc `x-password`), bất kể topology loopback/proxy.
- Kiểm tra xác thực mật khẩu trước khi đọc/parse toàn bộ webhook bodies.

## Giữ Messages.app hoạt động (VM / headless setups)

Một số setup macOS VM / luôn bật có thể khiến Messages.app "idle" (sự kiện đến dừng cho đến khi app được mở/foregrounded). Cách đơn giản là **poke Messages mỗi 5 phút** bằng AppleScript + LaunchAgent.

### 1) Lưu AppleScript

Lưu như sau:

- `~/Scripts/poke-messages.scpt`

Ví dụ script (không tương tác; không chiếm focus):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Cài đặt LaunchAgent

Lưu như sau:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Ghi chú:

- Chạy **mỗi 300 giây** và **khi đăng nhập**.
- Lần chạy đầu có thể kích hoạt prompt **Automation** của macOS (`osascript` → Messages). Chấp nhận trong cùng session người dùng chạy LaunchAgent.

Tải nó:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles có sẵn trong onboarding tương tác:

```
openclaw onboard
```

Wizard sẽ hỏi:

- **Server URL** (bắt buộc): Địa chỉ server BlueBubbles (ví dụ: `http://192.168.1.100:1234`)
- **Password** (bắt buộc): Mật khẩu API từ cài đặt BlueBubbles Server
- **Webhook path** (tùy chọn): Mặc định là `/bluebubbles-webhook`
- **DM policy**: pairing, allowlist, open, hoặc disabled
- **Allow list**: Số điện thoại, email, hoặc mục tiêu chat

Cũng có thể thêm BlueBubbles qua CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kiểm soát truy cập (DMs + groups)

DMs:

- Mặc định: `channels.bluebubbles.dmPolicy = "pairing"`.
- Người gửi không xác định nhận mã pairing; tin nhắn bị bỏ qua cho đến khi được chấp nhận (mã hết hạn sau 1 giờ).
- Chấp nhận qua:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Pairing là trao đổi token mặc định. Chi tiết: [Pairing](/channels/pairing)

Groups:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (mặc định: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` kiểm soát ai có thể kích hoạt trong nhóm khi `allowlist` được đặt.

### Mention gating (groups)

BlueBubbles hỗ trợ mention gating cho chat nhóm, giống iMessage/WhatsApp:

- Sử dụng `agents.list[].groupChat.mentionPatterns` (hoặc `messages.groupChat.mentionPatterns`) để phát hiện mentions.
- Khi `requireMention` được bật cho nhóm, agent chỉ phản hồi khi được mention.
- Lệnh điều khiển từ người gửi được ủy quyền bỏ qua mention gating.

Cấu hình từng nhóm:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // mặc định cho tất cả nhóm
        "iMessage;-;chat123": { requireMention: false }, // ghi đè cho nhóm cụ thể
      },
    },
  },
}
```

### Command gating

- Lệnh điều khiển (ví dụ: `/config`, `/model`) yêu cầu ủy quyền.
- Sử dụng `allowFrom` và `groupAllowFrom` để xác định ủy quyền lệnh.
- Người gửi được ủy quyền có thể chạy lệnh điều khiển ngay cả khi không được mention trong nhóm.

## Typing + read receipts

- **Chỉ báo đang gõ**: Gửi tự động trước và trong khi tạo phản hồi.
- **Thông báo đã đọc**: Kiểm soát bởi `channels.bluebubbles.sendReadReceipts` (mặc định: `true`).
- **Chỉ báo đang gõ**: OpenClaw gửi sự kiện bắt đầu gõ; BlueBubbles tự động xóa chỉ báo gõ khi gửi hoặc hết thời gian (dừng thủ công qua DELETE không đáng tin cậy).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // tắt thông báo đã đọc
    },
  },
}
```

## Hành động nâng cao

BlueBubbles hỗ trợ các hành động tin nhắn nâng cao khi được bật trong cấu hình:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (mặc định: true)
        edit: true, // chỉnh sửa tin nhắn đã gửi (macOS 13+, không hoạt động trên macOS 26 Tahoe)
        unsend: true, // unsend tin nhắn (macOS 13+)
        reply: true, // reply threading theo GUID tin nhắn
        sendWithEffect: true, // hiệu ứng tin nhắn (slam, loud, v.v.)
        renameGroup: true, // đổi tên nhóm chat
        setGroupIcon: true, // đặt icon/photo nhóm chat (không ổn định trên macOS 26 Tahoe)
        addParticipant: true, // thêm thành viên vào nhóm
        removeParticipant: true, // xóa thành viên khỏi nhóm
        leaveGroup: true, // rời nhóm chat
        sendAttachment: true, // gửi đính kèm/media
      },
    },
  },
}
```

Các hành động có sẵn:

- **react**: Thêm/xóa tapback reactions (`messageId`, `emoji`, `remove`)
- **edit**: Chỉnh sửa tin nhắn đã gửi (`messageId`, `text`)
- **unsend**: Unsend tin nhắn (`messageId`)
- **reply**: Trả lời tin nhắn cụ thể (`messageId`, `text`, `to`)
- **sendWithEffect**: Gửi với hiệu ứng iMessage (`text`, `to`, `effectId`)
- **renameGroup**: Đổi tên nhóm chat (`chatGuid`, `displayName`)
- **setGroupIcon**: Đặt icon/photo nhóm chat (`chatGuid`, `media`) — không ổn định trên macOS 26 Tahoe (API có thể trả về thành công nhưng icon không đồng bộ).
- **addParticipant**: Thêm người vào nhóm (`chatGuid`, `address`)
- **removeParticipant**: Xóa người khỏi nhóm (`chatGuid`, `address`)
- **leaveGroup**: Rời nhóm chat (`chatGuid`)
- **sendAttachment**: Gửi media/file (`to`, `buffer`, `filename`, `asVoice`)
  - Ghi âm: đặt `asVoice: true` với audio **MP3** hoặc **CAF** để gửi như tin nhắn giọng nói iMessage. BlueBubbles chuyển đổi MP3 → CAF khi gửi ghi âm.

### Message IDs (ngắn vs đầy đủ)

OpenClaw có thể hiển thị _ID tin nhắn ngắn_ (ví dụ: `1`, `2`) để tiết kiệm tokens.

- `MessageSid` / `ReplyToId` có thể là ID ngắn.
- `MessageSidFull` / `ReplyToIdFull` chứa ID đầy đủ của provider.
- ID ngắn là trong bộ nhớ; có thể hết hạn khi khởi động lại hoặc xóa cache.
- Hành động chấp nhận `messageId` ngắn hoặc đầy đủ, nhưng ID ngắn sẽ lỗi nếu không còn khả dụng.

Sử dụng ID đầy đủ cho tự động hóa và lưu trữ bền vững:

- Templates: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Context: `MessageSidFull` / `ReplyToIdFull` trong payload inbound

Xem [Configuration](/gateway/configuration) cho biến template.

## Block streaming

Kiểm soát việc gửi phản hồi dưới dạng một tin nhắn đơn hay stream theo block:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // bật block streaming (tắt mặc định)
    },
  },
}
```

## Media + giới hạn

- Đính kèm inbound được tải xuống và lưu trữ trong media cache.
- Giới hạn media qua `channels.bluebubbles.mediaMaxMb` cho media inbound và outbound (mặc định: 8 MB).
- Văn bản outbound được chia nhỏ theo `channels.bluebubbles.textChunkLimit` (mặc định: 4000 ký tự).

## Tham chiếu cấu hình

Cấu hình đầy đủ: [Configuration](/gateway/configuration)

Tùy chọn provider:

- `channels.bluebubbles.enabled`: Bật/tắt kênh.
- `channels.bluebubbles.serverUrl`: URL cơ sở REST API của BlueBubbles.
- `channels.bluebubbles.password`: Mật khẩu API.
- `channels.bluebubbles.webhookPath`: Đường dẫn endpoint webhook (mặc định: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: `pairing`).
- `channels.bluebubbles.allowFrom`: DM allowlist (handles, emails, số E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (mặc định: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Allowlist người gửi nhóm.
- `channels.bluebubbles.groups`: Cấu hình từng nhóm (`requireMention`, v.v.).
- `channels.bluebubbles.sendReadReceipts`: Gửi thông báo đã đọc (mặc định: `true`).
- `channels.bluebubbles.blockStreaming`: Bật block streaming (mặc định: `false`; cần cho streaming replies).
- `channels.bluebubbles.textChunkLimit`: Kích thước chunk outbound tính bằng ký tự (mặc định: 4000).
- `channels.bluebubbles.chunkMode`: `length` (mặc định) chỉ chia khi vượt quá `textChunkLimit`; `newline` chia trên dòng trống (ranh giới đoạn) trước khi chia theo độ dài.
- `channels.bluebubbles.mediaMaxMb`: Giới hạn media inbound/outbound tính bằng MB (mặc định: 8).
- `channels.bluebubbles.mediaLocalRoots`: Allowlist rõ ràng của các thư mục local tuyệt đối được phép cho đường dẫn media local outbound. Gửi đường dẫn local bị từ chối theo mặc định trừ khi cấu hình. Ghi đè từng tài khoản: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: Giới hạn tin nhắn nhóm cho context (0 tắt).
- `channels.bluebubbles.dmHistoryLimit`: Giới hạn lịch sử DM.
- `channels.bluebubbles.actions`: Bật/tắt các hành động cụ thể.
- `channels.bluebubbles.accounts`: Cấu hình nhiều tài khoản.

Tùy chọn toàn cầu liên quan:

- `agents.list[].groupChat.mentionPatterns` (hoặc `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Địa chỉ / mục tiêu gửi

Ưu tiên `chat_guid` cho routing ổn định:

- `chat_guid:iMessage;-;+15555550123` (ưu tiên cho nhóm)
- `chat_id:123`
- `chat_identifier:...`
- Handles trực tiếp: `+15555550123`, `user@example.com`
  - Nếu handle trực tiếp không có chat DM hiện có, OpenClaw sẽ tạo một cái qua `POST /api/v1/chat/new`. Điều này yêu cầu bật BlueBubbles Private API.

## Bảo mật

- Yêu cầu webhook được xác thực bằng cách so sánh tham số query `guid`/`password` hoặc headers với `channels.bluebubbles.password`. Yêu cầu từ `localhost` cũng được chấp nhận.
- Giữ bí mật mật khẩu API và endpoint webhook (xem như thông tin đăng nhập).
- Tin tưởng localhost có nghĩa là proxy ngược cùng host có thể vô tình bỏ qua mật khẩu. Nếu proxy gateway, yêu cầu xác thực tại proxy và cấu hình `gateway.trustedProxies`. Xem [Gateway security](/gateway/security#reverse-proxy-configuration).
- Bật HTTPS + quy tắc firewall trên server BlueBubbles nếu expose ra ngoài LAN.

## Khắc phục sự cố

- Nếu sự kiện typing/read ngừng hoạt động, kiểm tra log webhook BlueBubbles và xác minh đường dẫn gateway khớp với `channels.bluebubbles.webhookPath`.
- Mã pairing hết hạn sau một giờ; sử dụng `openclaw pairing list bluebubbles` và `openclaw pairing approve bluebubbles <code>`.
- Reactions yêu cầu BlueBubbles private API (`POST /api/v1/message/react`); đảm bảo phiên bản server expose nó.
- Edit/unsend yêu cầu macOS 13+ và phiên bản server BlueBubbles tương thích. Trên macOS 26 (Tahoe), edit hiện không hoạt động do thay đổi private API.
- Cập nhật icon nhóm có thể không ổn định trên macOS 26 (Tahoe): API có thể trả về thành công nhưng icon mới không đồng bộ.
- OpenClaw tự động ẩn các hành động đã biết là không hoạt động dựa trên phiên bản macOS của server BlueBubbles. Nếu edit vẫn xuất hiện trên macOS 26 (Tahoe), tắt thủ công với `channels.bluebubbles.actions.edit=false`.
- Để biết thông tin trạng thái/sức khỏe: `openclaw status --all` hoặc `openclaw status --deep`.

Để tham khảo quy trình làm việc kênh chung, xem [Channels](/channels) và hướng dẫn [Plugins](/tools/plugin).\n