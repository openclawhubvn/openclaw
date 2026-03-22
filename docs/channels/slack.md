---
summary: "Thiết lập Slack với OpenClaw, tối ưu hóa hành vi runtime qua Socket Mode và HTTP Events API. Tăng hiệu suất và kết nối dễ dàng."
read_when:
  - Thiết lập Slack hoặc gỡ lỗi chế độ socket/HTTP của Slack
title: "Hướng Dẫn Cấu Hình Slack Với OpenClaw"
---

# Slack

Trạng thái: sẵn sàng cho sản xuất với DMs + kênh thông qua tích hợp ứng dụng Slack. Chế độ mặc định là Socket Mode; cũng hỗ trợ chế độ HTTP Events API.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/channels/pairing">
    DMs của Slack mặc định ở chế độ ghép nối.
  </Card>
  <Card title="Lệnh gạch chéo" icon="terminal" href="/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/channels/troubleshooting">
    Chẩn đoán và sửa chữa đa kênh.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Tabs>
  <Tab title="Socket Mode (mặc định)">
    <Steps>
      <Step title="Tạo ứng dụng Slack và token">
        Trong cài đặt ứng dụng Slack:

        - bật **Socket Mode**
        - tạo **App Token** (`xapp-...`) với `connections:write`
        - cài đặt ứng dụng và sao chép **Bot Token** (`xoxb-...`)
      </Step>

      <Step title="Cấu hình OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Biến môi trường dự phòng (chỉ tài khoản mặc định):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Đăng ký sự kiện ứng dụng">
        Đăng ký sự kiện bot cho:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Cũng bật Tab **Messages** của App Home cho DMs.
      </Step>

      <Step title="Khởi động gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="Chế độ HTTP Events API">
    <Steps>
      <Step title="Cấu hình ứng dụng Slack cho HTTP">

        - đặt chế độ thành HTTP (`channels.slack.mode="http"`)
        - sao chép **Signing Secret** của Slack
        - đặt URL Yêu cầu Đăng ký Sự kiện + Tương tác + Lệnh gạch chéo thành cùng một đường dẫn webhook (mặc định `/slack/events`)

      </Step>

      <Step title="Cấu hình chế độ HTTP của OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

      </Step>

      <Step title="Sử dụng đường dẫn webhook riêng cho HTTP đa tài khoản">
        Chế độ HTTP theo tài khoản được hỗ trợ.

        Cung cấp cho mỗi tài khoản một `webhookPath` riêng biệt để tránh xung đột đăng ký.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Mô hình token

- `botToken` + `appToken` là bắt buộc cho Socket Mode.
- Chế độ HTTP yêu cầu `botToken` + `signingSecret`.
- Token cấu hình ghi đè biến môi trường dự phòng.
- Biến môi trường `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` chỉ áp dụng cho tài khoản mặc định.
- `userToken` (`xoxp-...`) chỉ có trong cấu hình (không có dự phòng môi trường) và mặc định là chỉ đọc (`userTokenReadOnly: true`).
- Tùy chọn: thêm `chat:write.customize` nếu muốn tin nhắn gửi đi sử dụng danh tính tác nhân hiện tại (tùy chỉnh `username` và icon). `icon_emoji` sử dụng cú pháp `:emoji_name:`.

<Tip>
Đối với các hành động/đọc thư mục, token người dùng có thể được ưu tiên khi được cấu hình. Đối với ghi, token bot vẫn được ưu tiên; ghi token người dùng chỉ được phép khi `userTokenReadOnly: false` và token bot không khả dụng.
</Tip>

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="Chính sách DM">
    `channels.slack.dmPolicy` kiểm soát truy cập DM (cũ: `channels.slack.dm.policy`):

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `channels.slack.allowFrom` bao gồm `"*"`; cũ: `channels.slack.dm.allowFrom`)
    - `disabled`

    Cờ DM:

    - `dm.enabled` (mặc định true)
    - `channels.slack.allowFrom` (ưu tiên)
    - `dm.allowFrom` (cũ)
    - `dm.groupEnabled` (DM nhóm mặc định false)
    - `dm.groupChannels` (danh sách cho phép MPIM tùy chọn)

    Ưu tiên đa tài khoản:

    - `channels.slack.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Các tài khoản được đặt tên kế thừa `channels.slack.allowFrom` khi `allowFrom` của riêng chúng chưa được đặt.
    - Các tài khoản được đặt tên không kế thừa `channels.slack.accounts.default.allowFrom`.

    Ghép nối trong DMs sử dụng `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Chính sách kênh">
    `channels.slack.groupPolicy` kiểm soát xử lý kênh:

    - `open`
    - `allowlist`
    - `disabled`

    Danh sách cho phép kênh nằm dưới `channels.slack.channels` và nên sử dụng ID kênh ổn định.

    Lưu ý runtime: nếu `channels.slack` hoàn toàn thiếu (cài đặt chỉ môi trường), runtime sẽ quay lại `groupPolicy="allowlist"` và ghi nhật ký cảnh báo (ngay cả khi `channels.defaults.groupPolicy` đã được đặt).

    Giải quyết tên/ID:

    - các mục danh sách cho phép kênh và danh sách cho phép DM được giải quyết khi khởi động khi quyền truy cập token cho phép
    - các mục tên kênh chưa được giải quyết được giữ nguyên như đã cấu hình nhưng bị bỏ qua cho định tuyến theo mặc định
    - ủy quyền đầu vào và định tuyến kênh theo ID trước theo mặc định; khớp tên người dùng/trực tiếp yêu cầu `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Đề cập và người dùng kênh">
    Tin nhắn kênh được kiểm soát bởi đề cập theo mặc định.

    Nguồn đề cập:

    - đề cập ứng dụng rõ ràng (`<@botId>`)
    - mẫu regex đề cập (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - hành vi trả lời ngầm định cho bot trong luồng

    Kiểm soát theo kênh (`channels.slack.channels.<id>`; chỉ tên thông qua giải quyết khởi động hoặc `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (danh sách cho phép)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - định dạng khóa `toolsBySender`: `id:`, `e164:`, `username:`, `name:`, hoặc ký tự đại diện `"*"`
      (các khóa không có tiền tố cũ vẫn chỉ ánh xạ đến `id:`)

  </Tab>
</Tabs>

## Lệnh và hành vi gạch chéo

- Chế độ tự động lệnh gốc là **tắt** cho Slack (`commands.native: "auto"` không kích hoạt lệnh gốc của Slack).
- Kích hoạt trình xử lý lệnh gốc của Slack với `channels.slack.commands.native: true` (hoặc toàn cầu `commands.native: true`).
- Khi lệnh gốc được kích hoạt, đăng ký các lệnh gạch chéo tương ứng trong Slack (`/<command>` tên), với một ngoại lệ:
  - đăng ký `/agentstatus` cho lệnh trạng thái (Slack dành riêng `/status`)
- Nếu lệnh gốc không được kích hoạt, bạn có thể chạy một lệnh gạch chéo được cấu hình duy nhất thông qua `channels.slack.slashCommand`.
- Menu đối số gốc hiện thích ứng với chiến lược hiển thị của chúng:
  - tối đa 5 tùy chọn: khối nút
  - 6-100 tùy chọn: menu chọn tĩnh
  - hơn 100 tùy chọn: chọn bên ngoài với lọc tùy chọn không đồng bộ khi các trình xử lý tùy chọn tương tác có sẵn
  - nếu các giá trị tùy chọn được mã hóa vượt quá giới hạn của Slack, luồng sẽ quay lại nút
- Đối với tải trọng tùy chọn dài, menu đối số lệnh gạch chéo sử dụng hộp thoại xác nhận trước khi gửi giá trị đã chọn.

## Phản hồi tương tác

Slack có thể hiển thị các điều khiển phản hồi tương tác do tác nhân tạo ra, nhưng tính năng này bị tắt theo mặc định.

Kích hoạt toàn cầu:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Hoặc kích hoạt cho một tài khoản Slack duy nhất:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Khi được kích hoạt, các tác nhân có thể phát ra các chỉ thị phản hồi chỉ dành cho Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Các chỉ thị này được biên dịch thành Slack Block Kit và định tuyến các lần nhấp hoặc lựa chọn quay lại thông qua đường dẫn sự kiện tương tác Slack hiện có.

Lưu ý:

- Đây là giao diện người dùng cụ thể của Slack. Các kênh khác không dịch các chỉ thị Slack Block Kit thành hệ thống nút của riêng họ.
- Các giá trị phản hồi tương tác là các token mờ do OpenClaw tạo ra, không phải là các giá trị do tác nhân tạo ra.
- Nếu các khối tương tác được tạo ra vượt quá giới hạn của Slack Block Kit, OpenClaw sẽ quay lại phản hồi văn bản gốc thay vì gửi tải trọng khối không hợp lệ.

Cài đặt lệnh gạch chéo mặc định:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Các phiên gạch chéo sử dụng khóa cách ly:

- `agent:<agentId>:slack:slash:<userId>`

và vẫn định tuyến thực thi lệnh chống lại phiên hội thoại mục tiêu (`CommandTargetSessionKey`).

## Luồng, phiên và thẻ phản hồi

- DMs định tuyến là `direct`; kênh là `channel`; MPIMs là `group`.
- Với `session.dmScope=main` mặc định, DMs của Slack sụp đổ thành phiên chính của tác nhân.
- Phiên kênh: `agent:<agentId>:slack:channel:<channelId>`.
- Phản hồi luồng có thể tạo hậu tố phiên luồng (`:thread:<threadTs>`) khi áp dụng.
- `channels.slack.thread.historyScope` mặc định là `thread`; `thread.inheritParent` mặc định là `false`.
- `channels.slack.thread.initialHistoryLimit` kiểm soát số lượng tin nhắn luồng hiện có được lấy khi một phiên luồng mới bắt đầu (mặc định `20`; đặt `0` để tắt).

Kiểm soát phản hồi luồng:

- `channels.slack.replyToMode`: `off|first|all` (mặc định `off`)
- `channels.slack.replyToModeByChatType`: theo `direct|group|channel`
- dự phòng cũ cho các cuộc trò chuyện trực tiếp: `channels.slack.dm.replyToMode`

Thẻ phản hồi thủ công được hỗ trợ:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Lưu ý: `replyToMode="off"` vô hiệu hóa **tất cả** luồng phản hồi trong Slack, bao gồm cả thẻ `[[reply_to_*]]` rõ ràng. Điều này khác với Telegram, nơi các thẻ rõ ràng vẫn được tôn trọng trong chế độ `"off"`. Sự khác biệt này phản ánh các mô hình luồng của nền tảng: các luồng của Slack ẩn tin nhắn khỏi kênh, trong khi các phản hồi của Telegram vẫn hiển thị trong luồng trò chuyện chính.

## Phương tiện, phân đoạn và phân phối

<AccordionGroup>
  <Accordion title="Tệp đính kèm đầu vào">
    Các tệp đính kèm của Slack được tải xuống từ các URL riêng tư được lưu trữ trên Slack (luồng yêu cầu xác thực token) và được ghi vào kho phương tiện khi tải thành công và giới hạn kích thước cho phép.

    Giới hạn kích thước đầu vào runtime mặc định là `20MB` trừ khi được ghi đè bởi `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Văn bản và tệp gửi đi">
    - các đoạn văn bản sử dụng `channels.slack.textChunkLimit` (mặc định 4000)
    - `channels.slack.chunkMode="newline"` kích hoạt chia đoạn theo đoạn văn trước
    - gửi tệp sử dụng API tải lên của Slack và có thể bao gồm phản hồi luồng (`thread_ts`)
    - giới hạn phương tiện gửi đi tuân theo `channels.slack.mediaMaxMb` khi được cấu hình; nếu không, gửi kênh sử dụng mặc định loại MIME từ đường dẫn phương tiện
  </Accordion>

  <Accordion title="Mục tiêu phân phối">
    Mục tiêu rõ ràng ưu tiên:

    - `user:<id>` cho DMs
    - `channel:<id>` cho kênh

    DMs của Slack được mở thông qua API hội thoại của Slack khi gửi đến các mục tiêu người dùng.

  </Accordion>
</AccordionGroup>

## Hành động và cổng

Hành động của Slack được kiểm soát bởi `channels.slack.actions.*`.

Các nhóm hành động có sẵn trong công cụ Slack hiện tại:

| Nhóm       | Mặc định |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

## Sự kiện và hành vi hoạt động

- Chỉnh sửa/xóa tin nhắn/phát sóng luồng được ánh xạ thành sự kiện hệ thống.
- Sự kiện thêm/xóa phản ứng được ánh xạ thành sự kiện hệ thống.
- Thành viên tham gia/rời đi, kênh được tạo/đổi tên, và sự kiện thêm/xóa ghim được ánh xạ thành sự kiện hệ thống.
- Cập nhật trạng thái luồng trợ lý (cho các chỉ báo "đang gõ..." trong luồng) sử dụng `assistant.threads.setStatus` và yêu cầu phạm vi bot `assistant:write`.
- `channel_id_changed` có thể di chuyển các khóa cấu hình kênh khi `configWrites` được bật.
- Siêu dữ liệu chủ đề/mục đích của kênh được coi là ngữ cảnh không đáng tin cậy và có thể được tiêm vào ngữ cảnh định tuyến.
- Hành động khối và tương tác modal phát ra sự kiện hệ thống có cấu trúc `Slack interaction: ...` với các trường tải trọng phong phú:
  - hành động khối: các giá trị đã chọn, nhãn, giá trị chọn, và siêu dữ liệu `workflow_*`
  - sự kiện `view_submission` và `view_closed` của modal với siêu dữ liệu kênh được định tuyến và đầu vào biểu mẫu

## Phản ứng xác nhận

`ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý một tin nhắn đầu vào.

Thứ tự giải quyết:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- dự phòng emoji danh tính tác nhân (`agents.list[].identity.emoji`, nếu không "👀")

Lưu ý:

- Slack mong đợi mã ngắn (ví dụ `"eyes"`).
- Sử dụng `""` để vô hiệu hóa phản ứng cho tài khoản Slack hoặc toàn cầu.

## Phản ứng gõ dự phòng

`typingReaction` thêm một phản ứng tạm thời vào tin nhắn Slack đầu vào trong khi OpenClaw đang xử lý một phản hồi, sau đó xóa nó khi quá trình chạy kết thúc. Đây là một dự phòng hữu ích khi gõ trợ lý gốc của Slack không khả dụng, đặc biệt trong DMs.

Thứ tự giải quyết:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Lưu ý:

- Slack mong đợi mã ngắn (ví dụ `"hourglass_flowing_sand"`).
- Phản ứng là nỗ lực tốt nhất và việc dọn dẹp được thực hiện tự động sau khi phản hồi hoặc đường dẫn thất bại hoàn tất.

## Danh sách kiểm tra manifest và phạm vi

<AccordionGroup>
  <Accordion title="Ví dụ manifest ứng dụng Slack">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Kết nối Slack cho OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": false
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Gửi tin nhắn đến OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write",
        "channels:history",
        "channels:read",
        "groups:history",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "users:read",
        "app_mentions:read",
        "assistant:write",
        "reactions:read",
        "reactions:write",
        "pins:read",
        "pins:write",
        "emoji:read",
        "commands",
        "files:read",
        "files:write"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "reaction_added",
        "reaction_removed",
        "member_joined_channel",
        "member_left_channel",
        "channel_rename",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

  </Accordion>

  <Accordion title="Phạm vi token người dùng tùy chọn (hoạt động đọc)">
    Nếu bạn cấu hình `channels.slack.userToken`, các phạm vi đọc điển hình là:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (nếu bạn phụ thuộc vào đọc tìm kiếm của Slack)

  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không có phản hồi trong kênh">
    Kiểm tra, theo thứ tự:

    - `groupPolicy`
    - danh sách cho phép kênh (`channels.slack.channels`)
    - `requireMention`
    - danh sách cho phép `users` theo kênh

    Các lệnh hữu ích:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Tin nhắn DM bị bỏ qua">
    Kiểm tra:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (hoặc cũ `channels.slack.dm.policy`)
    - phê duyệt ghép nối / mục danh sách cho phép

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Chế độ socket không kết nối">
    Xác thực bot + token ứng dụng và bật Socket Mode trong cài đặt ứng dụng Slack.
  </Accordion>

  <Accordion title="Chế độ HTTP không nhận sự kiện">
    Xác thực:

    - ký bí mật
    - đường dẫn webhook
    - URL Yêu cầu của Slack (Sự kiện + Tương tác + Lệnh gạch chéo)
    - `webhookPath` duy nhất cho mỗi tài khoản HTTP

  </Accordion>

  <Accordion title="Lệnh gốc/gạch chéo không hoạt động">
    Xác minh xem bạn có ý định:

    - chế độ lệnh gốc (`channels.slack.commands.native: true`) với các lệnh gạch chéo tương ứng đã đăng ký trong Slack
    - hoặc chế độ lệnh gạch chéo đơn (`channels.slack.slashCommand.enabled: true`)

    Cũng kiểm tra `commands.useAccessGroups` và danh sách cho phép kênh/người dùng.

  </Accordion>
</AccordionGroup>

## Truyền văn bản

OpenClaw hỗ trợ truyền văn bản gốc của Slack thông qua API Agents và AI Apps.

`channels.slack.streaming` kiểm soát hành vi xem trước trực tiếp:

- `off`: tắt truyền xem trước trực tiếp.
- `partial` (mặc định): thay thế văn bản xem trước bằng đầu ra từng phần mới nhất.
- `block`: thêm các cập nhật xem trước phân đoạn.
- `progress`: hiển thị văn bản trạng thái tiến độ trong khi tạo, sau đó gửi văn bản cuối cùng.

`channels.slack.nativeStreaming` kiểm soát API truyền gốc của Slack (`chat.startStream` / `chat.appendStream` / `chat.stopStream`) khi `streaming` là `partial` (mặc định: `true`).

Tắt truyền gốc của Slack (giữ hành vi xem trước bản nháp):

```yaml
channels:
  slack:
    streaming: partial
    nativeStreaming: false
```

Các khóa cũ:

- `channels.slack.streamMode` (`replace | status_final | append`) được tự động chuyển đổi thành `channels.slack.streaming`.
- boolean `channels.slack.streaming` được tự động chuyển đổi thành `channels.slack.nativeStreaming`.

### Yêu cầu

1. Bật **Agents và AI Apps** trong cài đặt ứng dụng Slack của bạn.
2. Đảm bảo ứng dụng có phạm vi `assistant:write`.
3. Một luồng phản hồi phải có sẵn cho tin nhắn đó. Lựa chọn luồng vẫn tuân theo `replyToMode`.

### Hành vi

- Khối văn bản đầu tiên bắt đầu một luồng (`chat.startStream`).
- Các khối văn bản sau đó được thêm vào cùng một luồng (`chat.appendStream`).
- Kết thúc phản hồi hoàn tất luồng (`chat.stopStream`).
- Phương tiện và tải trọng không phải văn bản quay lại phân phối bình thường.
- Nếu truyền thất bại giữa phản hồi, OpenClaw quay lại phân phối bình thường cho các tải trọng còn lại.

## Tham chiếu cấu hình

Tham chiếu chính:

- [Tham chiếu cấu hình - Slack](/gateway/configuration-reference#slack)

  Các trường Slack quan trọng:
  - chế độ/xác thực: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - truy cập DM: `dm.enabled`, `dmPolicy`, `allowFrom` (cũ: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - chuyển đổi tương thích: `dangerouslyAllowNameMatching` (phá vỡ kính; giữ tắt trừ khi cần thiết)
  - truy cập kênh: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - luồng/lịch sử: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - phân phối: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - hoạt động/tính năng: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Liên quan

- [Ghép nối](/channels/pairing)
- [Định tuyến kênh](/channels/channel-routing)
- [Khắc phục sự cố](/channels/troubleshooting)
- [Cấu hình](/gateway/configuration)
- [Lệnh gạch chéo](/tools/slash-commands)
