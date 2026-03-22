---
summary: "Khám phá cách cấu hình iMessage qua BlueBubbles trên macOS, hỗ trợ gửi/nhận tin, trạng thái gõ và nhiều tính năng nâng cao."
read_when:
  - Thiết lập kênh BlueBubbles
  - Khắc phục sự cố ghép nối webhook
  - Cấu hình iMessage trên macOS
title: "Hướng Dẫn Cấu Hình iMessage Với BlueBubbles"
---

# BlueBubbles (macOS REST)

Trạng thái: plugin đi kèm giao tiếp với máy chủ BlueBubbles trên macOS qua HTTP. **Được khuyến nghị cho tích hợp iMessage** nhờ API phong phú hơn và dễ thiết lập hơn so với kênh imsg cũ.

## Tổng quan

- Chạy trên macOS qua ứng dụng hỗ trợ BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Khuyến nghị/đã thử nghiệm: macOS Sequoia (15). macOS Tahoe (26) hoạt động; chỉnh sửa hiện tại bị lỗi trên Tahoe, và cập nhật biểu tượng nhóm có thể báo thành công nhưng không đồng bộ.
- OpenClaw giao tiếp với nó qua REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Tin nhắn đến qua webhooks; trả lời đi, chỉ báo gõ, biên nhận đã đọc và tapbacks là các cuộc gọi REST.
- Tệp đính kèm và nhãn dán được xử lý như phương tiện đầu vào (và hiển thị cho agent khi có thể).
- Ghép nối/danh sách cho phép hoạt động giống như các kênh khác (`/channels/pairing` v.v.) với `channels.bluebubbles.allowFrom` + mã ghép nối.
- Phản ứng được hiển thị như sự kiện hệ thống giống như Slack/Telegram để agent có thể "đề cập" trước khi trả lời.
- Tính năng nâng cao: chỉnh sửa, hủy gửi, trả lời theo chuỗi, hiệu ứng tin nhắn, quản lý nhóm.

## Bắt đầu nhanh

1. Cài đặt máy chủ BlueBubbles trên máy Mac (làm theo hướng dẫn tại [bluebubbles.app/install](https://bluebubbles.app/install)).
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

4. Chỉ định webhooks của BlueBubbles đến gateway của bạn (ví dụ: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Khởi động gateway; nó sẽ đăng ký trình xử lý webhook và bắt đầu ghép nối.

Lưu ý bảo mật:

- Luôn đặt mật khẩu webhook.
- Xác thực webhook luôn được yêu cầu. OpenClaw từ chối các yêu cầu webhook của BlueBubbles trừ khi chúng bao gồm mật khẩu/guid khớp với `channels.bluebubbles.password` (ví dụ `?password=<password>` hoặc `x-password`), bất kể cấu trúc loopback/proxy.
- Xác thực mật khẩu được kiểm tra trước khi đọc/parse toàn bộ nội dung webhook.

## Giữ Messages.app hoạt động (VM / thiết lập không có màn hình)

Một số thiết lập macOS VM / luôn bật có thể khiến Messages.app trở nên "nhàn rỗi" (sự kiện đến dừng lại cho đến khi ứng dụng được mở/đưa lên trước). Một cách khắc phục đơn giản là **chạm vào Messages mỗi 5 phút** bằng AppleScript + LaunchAgent.

### 1) Lưu AppleScript

Lưu như sau:

- `~/Scripts/poke-messages.scpt`

Ví dụ script (không tương tác; không chiếm tiêu điểm):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Chạm vào giao diện scripting để giữ cho quá trình phản hồi.
    set _chatCount to (count of chats)
  end tell
on error
  -- Bỏ qua các lỗi tạm thời (nhắc nhở lần đầu, phiên bị khóa, v.v.).
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
- Lần chạy đầu tiên có thể kích hoạt nhắc nhở **Tự động hóa** của macOS (`osascript` → Messages). Phê duyệt chúng trong cùng phiên người dùng chạy LaunchAgent.

Tải nó:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles có sẵn trong quá trình onboarding tương tác:

```
openclaw onboard
```

Trình hướng dẫn sẽ yêu cầu:

- **Server URL** (bắt buộc): Địa chỉ máy chủ BlueBubbles (ví dụ: `http://192.168.1.100:1234`)
- **Password** (bắt buộc): Mật khẩu API từ cài đặt máy chủ BlueBubbles
- **Webhook path** (tùy chọn): Mặc định là `/bluebubbles-webhook`
- **DM policy**: pairing, allowlist, open, hoặc disabled
- **Allow list**: Số điện thoại, email, hoặc mục tiêu chat

Bạn cũng có thể thêm BlueBubbles qua CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kiểm soát truy cập (DMs + nhóm)

DMs:

- Mặc định: `channels.bluebubbles.dmPolicy = "pairing"`.
- Người gửi không xác định nhận mã ghép nối; tin nhắn bị bỏ qua cho đến khi được phê duyệt (mã hết hạn sau 1 giờ).
- Phê duyệt qua:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Ghép nối là trao đổi token mặc định. Chi tiết: [Pairing](/channels/pairing)

Nhóm:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (mặc định: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` kiểm soát ai có thể kích hoạt trong nhóm khi `allowlist` được đặt.

### Kiểm soát đề cập (nhóm)

BlueBubbles hỗ trợ kiểm soát đề cập cho các cuộc trò chuyện nhóm, tương tự như hành vi của iMessage/WhatsApp:

- Sử dụng `agents.list[].groupChat.mentionPatterns` (hoặc `messages.groupChat.mentionPatterns`) để phát hiện đề cập.
- Khi `requireMention` được bật cho một nhóm, agent chỉ phản hồi khi được đề cập.
- Các lệnh điều khiển từ người gửi được ủy quyền bỏ qua kiểm soát đề cập.

Cấu hình theo nhóm:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // mặc định cho tất cả các nhóm
        "iMessage;-;chat123": { requireMention: false }, // ghi đè cho nhóm cụ thể
      },
    },
  },
}
```

### Kiểm soát lệnh

- Các lệnh điều khiển (ví dụ: `/config`, `/model`) yêu cầu ủy quyền.
- Sử dụng `allowFrom` và `groupAllowFrom` để xác định ủy quyền lệnh.
- Người gửi được ủy quyền có thể chạy các lệnh điều khiển ngay cả khi không được đề cập trong nhóm.

## Trạng thái gõ + biên nhận đã đọc

- **Chỉ báo gõ**: Gửi tự động trước và trong khi tạo phản hồi.
- **Biên nhận đã đọc**: Kiểm soát bởi `channels.bluebubbles.sendReadReceipts` (mặc định: `true`).
- **Chỉ báo gõ**: OpenClaw gửi sự kiện bắt đầu gõ; BlueBubbles tự động xóa trạng thái gõ khi gửi hoặc hết thời gian (dừng thủ công qua DELETE không đáng tin cậy).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // tắt biên nhận đã đọc
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
        edit: true, // chỉnh sửa tin nhắn đã gửi (macOS 13+, lỗi trên macOS 26 Tahoe)
        unsend: true, // hủy gửi tin nhắn (macOS 13+)
        reply: true, // trả lời theo chuỗi bằng GUID tin nhắn
        sendWithEffect: true, // hiệu ứng tin nhắn (slam, loud, v.v.)
        renameGroup: true, // đổi tên nhóm chat
        setGroupIcon: true, // đặt biểu tượng/ảnh nhóm chat (không ổn định trên macOS 26 Tahoe)
        addParticipant: true, // thêm thành viên vào nhóm
        removeParticipant: true, // xóa thành viên khỏi nhóm
        leaveGroup: true, // rời nhóm chat
        sendAttachment: true, // gửi tệp đính kèm/phương tiện
      },
    },
  },
}
```

Các hành động có sẵn:

- **react**: Thêm/xóa phản ứng tapback (`messageId`, `emoji`, `remove`)
- **edit**: Chỉnh sửa tin nhắn đã gửi (`messageId`, `text`)
- **unsend**: Hủy gửi tin nhắn (`messageId`)
- **reply**: Trả lời một tin nhắn cụ thể (`messageId`, `text`, `to`)
- **sendWithEffect**: Gửi với hiệu ứng iMessage (`text`, `to`, `effectId`)
- **renameGroup**: Đổi tên nhóm chat (`chatGuid`, `displayName`)
- **setGroupIcon**: Đặt biểu tượng/ảnh nhóm chat (`chatGuid`, `media`) — không ổn định trên macOS 26 Tahoe (API có thể trả về thành công nhưng biểu tượng không đồng bộ).
- **addParticipant**: Thêm ai đó vào nhóm (`chatGuid`, `address`)
- **removeParticipant**: Xóa ai đó khỏi nhóm (`chatGuid`, `address`)
- **leaveGroup**: Rời nhóm chat (`chatGuid`)
- **sendAttachment**: Gửi phương tiện/tệp (`to`, `buffer`, `filename`, `asVoice`)
  - Ghi âm: đặt `asVoice: true` với âm thanh **MP3** hoặc **CAF** để gửi dưới dạng tin nhắn thoại iMessage. BlueBubbles chuyển đổi MP3 → CAF khi gửi ghi âm.

### ID tin nhắn (ngắn vs đầy đủ)

OpenClaw có thể hiển thị ID tin nhắn _ngắn_ (ví dụ: `1`, `2`) để tiết kiệm token.

- `MessageSid` / `ReplyToId` có thể là ID ngắn.
- `MessageSidFull` / `ReplyToIdFull` chứa ID đầy đủ của nhà cung cấp.
- ID ngắn là trong bộ nhớ; chúng có thể hết hạn khi khởi động lại hoặc xóa bộ nhớ cache.
- Hành động chấp nhận ID ngắn hoặc đầy đủ `messageId`, nhưng ID ngắn sẽ báo lỗi nếu không còn khả dụng.

Sử dụng ID đầy đủ cho tự động hóa và lưu trữ bền vững:

- Mẫu: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Ngữ cảnh: `MessageSidFull` / `ReplyToIdFull` trong payload đầu vào

Xem [Cấu hình](/gateway/configuration) để biết biến mẫu.

## Phân phối theo khối

Kiểm soát xem phản hồi được gửi dưới dạng một tin nhắn duy nhất hay được phân phối theo khối:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // bật phân phối theo khối (tắt theo mặc định)
    },
  },
}
```

## Phương tiện + giới hạn

- Tệp đính kèm đầu vào được tải xuống và lưu trữ trong bộ nhớ cache phương tiện.
- Giới hạn phương tiện qua `channels.bluebubbles.mediaMaxMb` cho phương tiện đầu vào và đầu ra (mặc định: 8 MB).
- Văn bản đầu ra được chia nhỏ thành `channels.bluebubbles.textChunkLimit` (mặc định: 4000 ký tự).

## Tham khảo cấu hình

Cấu hình đầy đủ: [Cấu hình](/gateway/configuration)

Tùy chọn nhà cung cấp:

- `channels.bluebubbles.enabled`: Bật/tắt kênh.
- `channels.bluebubbles.serverUrl`: URL cơ sở REST API của BlueBubbles.
- `channels.bluebubbles.password`: Mật khẩu API.
- `channels.bluebubbles.webhookPath`: Đường dẫn endpoint webhook (mặc định: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: `pairing`).
- `channels.bluebubbles.allowFrom`: Danh sách cho phép DM (handles, emails, số E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (mặc định: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Danh sách cho phép người gửi nhóm.
- `channels.bluebubbles.groups`: Cấu hình theo nhóm (`requireMention`, v.v.).
- `channels.bluebubbles.sendReadReceipts`: Gửi biên nhận đã đọc (mặc định: `true`).
- `channels.bluebubbles.blockStreaming`: Bật phân phối theo khối (mặc định: `false`; cần thiết cho phản hồi phân phối).
- `channels.bluebubbles.textChunkLimit`: Kích thước khối văn bản đầu ra tính bằng ký tự (mặc định: 4000).
- `channels.bluebubbles.chunkMode`: `length` (mặc định) chỉ chia khi vượt quá `textChunkLimit`; `newline` chia theo dòng trống (ranh giới đoạn) trước khi chia theo độ dài.
- `channels.bluebubbles.mediaMaxMb`: Giới hạn phương tiện đầu vào/đầu ra tính bằng MB (mặc định: 8).
- `channels.bluebubbles.mediaLocalRoots`: Danh sách cho phép rõ ràng các thư mục cục bộ tuyệt đối được phép cho các đường dẫn phương tiện cục bộ đầu ra. Gửi đường dẫn cục bộ bị từ chối theo mặc định trừ khi được cấu hình. Ghi đè theo tài khoản: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: Giới hạn tin nhắn nhóm tối đa cho ngữ cảnh (0 vô hiệu hóa).
- `channels.bluebubbles.dmHistoryLimit`: Giới hạn lịch sử DM.
- `channels.bluebubbles.actions`: Bật/tắt các hành động cụ thể.
- `channels.bluebubbles.accounts`: Cấu hình đa tài khoản.

Tùy chọn toàn cầu liên quan:

- `agents.list[].groupChat.mentionPatterns` (hoặc `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Địa chỉ / mục tiêu phân phối

Ưu tiên `chat_guid` để định tuyến ổn định:

- `chat_guid:iMessage;-;+15555550123` (ưu tiên cho nhóm)
- `chat_id:123`
- `chat_identifier:...`
- Handles trực tiếp: `+15555550123`, `user@example.com`
  - Nếu một handle trực tiếp không có cuộc trò chuyện DM hiện có, OpenClaw sẽ tạo một cuộc trò chuyện qua `POST /api/v1/chat/new`. Điều này yêu cầu API riêng của BlueBubbles được bật.

## Bảo mật

- Các yêu cầu webhook được xác thực bằng cách so sánh các tham số truy vấn hoặc tiêu đề `guid`/`password` với `channels.bluebubbles.password`. Các yêu cầu từ `localhost` cũng được chấp nhận.
- Giữ bí mật mật khẩu API và endpoint webhook (xem chúng như thông tin đăng nhập).
- Tin tưởng localhost có nghĩa là một proxy ngược cùng máy chủ có thể vô tình bỏ qua mật khẩu. Nếu bạn proxy gateway, yêu cầu xác thực tại proxy và cấu hình `gateway.trustedProxies`. Xem [Bảo mật Gateway](/gateway/security#reverse-proxy-configuration).
- Bật HTTPS + quy tắc tường lửa trên máy chủ BlueBubbles nếu bạn mở nó ra ngoài mạng LAN của mình.

## Khắc phục sự cố

- Nếu sự kiện gõ/đọc ngừng hoạt động, kiểm tra nhật ký webhook của BlueBubbles và xác minh đường dẫn gateway khớp với `channels.bluebubbles.webhookPath`.
- Mã ghép nối hết hạn sau một giờ; sử dụng `openclaw pairing list bluebubbles` và `openclaw pairing approve bluebubbles <code>`.
- Phản ứng yêu cầu API riêng của BlueBubbles (`POST /api/v1/message/react`); đảm bảo phiên bản máy chủ cung cấp nó.
- Chỉnh sửa/hủy gửi yêu cầu macOS 13+ và phiên bản máy chủ BlueBubbles tương thích. Trên macOS 26 (Tahoe), chỉnh sửa hiện tại bị lỗi do thay đổi API riêng.
- Cập nhật biểu tượng nhóm có thể không ổn định trên macOS 26 (Tahoe): API có thể trả về thành công nhưng biểu tượng mới không đồng bộ.
- OpenClaw tự động ẩn các hành động đã biết bị lỗi dựa trên phiên bản macOS của máy chủ BlueBubbles. Nếu chỉnh sửa vẫn xuất hiện trên macOS 26 (Tahoe), tắt nó thủ công với `channels.bluebubbles.actions.edit=false`.
- Để biết thông tin trạng thái/sức khỏe: `openclaw status --all` hoặc `openclaw status --deep`.

Để tham khảo quy trình làm việc của kênh chung, xem [Channels](/channels) và hướng dẫn [Plugins](/tools/plugin).
