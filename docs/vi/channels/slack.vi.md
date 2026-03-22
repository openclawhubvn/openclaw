---
summary: "Cài đặt và hành vi runtime của Slack (Socket Mode + HTTP Events API)"
read_when:
  - Cài đặt Slack hoặc debug chế độ socket/HTTP của Slack
title: "Slack"
---

# Slack

Trạng thái: Sẵn sàng cho production với DMs + channels qua tích hợp Slack app. Chế độ mặc định là Socket Mode; cũng hỗ trợ HTTP Events API.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Slack DMs mặc định ở chế độ pairing.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    Chẩn đoán và sửa lỗi cross-channel.
  </Card>
</CardGroup>

## Cài đặt nhanh

<Tabs>
  <Tab title="Socket Mode (mặc định)">
    <Steps>
      <Step title="Tạo Slack app và tokens">
        Trong cài đặt Slack app:

        - bật **Socket Mode**
        - tạo **App Token** (`xapp-...`) với `connections:write`
        - cài đặt app và sao chép **Bot Token** (`xoxb-...`)
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

        Env fallback (chỉ tài khoản mặc định):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Đăng ký sự kiện app">
        Đăng ký sự kiện bot cho:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Cũng bật App Home **Messages Tab** cho DMs.
      </Step>

      <Step title="Khởi động gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Events API mode">
    <Steps>
      <Step title="Cấu hình Slack app cho HTTP">

        - đặt chế độ thành HTTP (`channels.slack.mode="http"`)
        - sao chép Slack **Signing Secret**
        - đặt Event Subscriptions + Interactivity + Slash command Request URL vào cùng một webhook path (mặc định `/slack/events`)

      </Step>

      <Step title="Cấu hình OpenClaw HTTP mode">

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

      <Step title="Dùng webhook path riêng cho multi-account HTTP">
        Hỗ trợ chế độ HTTP theo từng tài khoản.

        Đặt `webhookPath` riêng cho mỗi tài khoản để tránh xung đột đăng ký.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Mô hình Token

- `botToken` + `appToken` cần cho Socket Mode.
- HTTP mode cần `botToken` + `signingSecret`.
- Config tokens ghi đè env fallback.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env fallback chỉ áp dụng cho tài khoản mặc định.
- `userToken` (`xoxp-...`) chỉ có trong config (không có env fallback) và mặc định là chỉ đọc (`userTokenReadOnly: true`).
- Tuỳ chọn: thêm `chat:write.customize` nếu muốn tin nhắn gửi đi dùng danh tính agent hiện tại (tùy chỉnh `username` và icon). `icon_emoji` dùng cú pháp `:emoji_name:`.

<Tip>
Cho các hành động/đọc thư mục, user token có thể được ưu tiên khi cấu hình. Đối với ghi, bot token vẫn được ưu tiên; ghi bằng user-token chỉ được phép khi `userTokenReadOnly: false` và bot token không khả dụng.
</Tip>

## Kiểm soát truy cập và routing

<Tabs>
  <Tab title="Chính sách DM">
    `channels.slack.dmPolicy` kiểm soát truy cập DM (legacy: `channels.slack.dm.policy`):

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `channels.slack.allowFrom` bao gồm `"*"`; legacy: `channels.slack.dm.allowFrom`)
    - `disabled`

    Cờ DM:

    - `dm.enabled` (mặc định true)
    - `channels.slack.allowFrom` (ưu tiên)
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (group DMs mặc định false)
    - `dm.groupChannels` (tùy chọn MPIM allowlist)

    Độ ưu tiên multi-account:

    - `channels.slack.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Tài khoản có tên kế thừa `channels.slack.allowFrom` khi `allowFrom` của chúng không được đặt.
    - Tài khoản có tên không kế thừa `channels.slack.accounts.default.allowFrom`.

    Pairing trong DMs dùng `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Chính sách Channel">
    `channels.slack.groupPolicy` kiểm soát xử lý channel:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist channel nằm dưới `channels.slack.channels` và nên dùng ID channel ổn định.

    Lưu ý runtime: nếu `channels.slack` hoàn toàn thiếu (chỉ setup env), runtime sẽ fallback về `groupPolicy="allowlist"` và ghi log cảnh báo (ngay cả khi `channels.defaults.groupPolicy` đã được đặt).

    Giải quyết tên/ID:

    - các mục allowlist channel và allowlist DM được giải quyết khi khởi động khi token cho phép truy cập
    - các mục tên channel chưa được giải quyết được giữ nguyên như cấu hình nhưng mặc định bị bỏ qua khi routing
    - ủy quyền inbound và routing channel mặc định là ưu tiên ID; khớp trực tiếp username/slug yêu cầu `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Mentions và người dùng channel">
    Tin nhắn channel mặc định được kiểm soát bởi mention.

    Nguồn mention:

    - mention app rõ ràng (`<@botId>`)
    - mẫu regex mention (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - hành vi reply-to-bot thread ngầm định

    Kiểm soát theo channel (`channels.slack.channels.<id>`; chỉ tên qua giải quyết khi khởi động hoặc `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - định dạng key `toolsBySender`: `id:`, `e164:`, `username:`, `name:`, hoặc wildcard `"*"`
      (các key không có tiền tố legacy vẫn chỉ map tới `id:`)

  </Tab>
</Tabs>

## Hành vi lệnh và slash

- Chế độ lệnh gốc tự động **tắt** cho Slack (`commands.native: "auto"` không bật lệnh gốc Slack).
- Bật handler lệnh gốc Slack với `channels.slack.commands.native: true` (hoặc global `commands.native: true`).
- Khi lệnh gốc được bật, đăng ký các lệnh slash tương ứng trong Slack (`/<command>` names), ngoại trừ:
  - đăng ký `/agentstatus` cho lệnh trạng thái (Slack dành riêng `/status`)
- Nếu lệnh gốc không được bật, có thể chạy một lệnh slash cấu hình duy nhất qua `channels.slack.slashCommand`.
- Menu arg gốc hiện thích ứng chiến lược render:
  - tối đa 5 tùy chọn: button blocks
  - 6-100 tùy chọn: static select menu
  - hơn 100 tùy chọn: external select với lọc tùy chọn async khi có sẵn handler tùy chọn interactivity
  - nếu giá trị tùy chọn mã hóa vượt quá giới hạn Slack, flow sẽ fallback về buttons
- Đối với payload tùy chọn dài, menu arg Slash command sử dụng hộp thoại xác nhận trước khi gửi giá trị đã chọn.

## Phản hồi tương tác

Slack có thể render các điều khiển phản hồi tương tác do agent tạo, nhưng tính năng này mặc định bị tắt.

Bật toàn cầu:

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

Hoặc bật cho một tài khoản Slack duy nhất:

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

Khi bật, agents có thể phát ra các chỉ thị phản hồi chỉ dành cho Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Các chỉ thị này biên dịch thành Slack Block Kit và route các click hoặc lựa chọn quay lại qua đường sự kiện tương tác Slack hiện có.

Lưu ý:

- Đây là UI đặc thù của Slack. Các kênh khác không dịch các chỉ thị Slack Block Kit thành hệ thống button của riêng họ.
- Các giá trị callback tương tác là các token mờ do OpenClaw tạo ra, không phải là các giá trị do agent tạo ra.
- Nếu các block tương tác được tạo ra vượt quá giới hạn Slack Block Kit, OpenClaw sẽ fallback về phản hồi văn bản gốc thay vì gửi payload blocks không hợp lệ.

Cài đặt lệnh slash mặc định:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Các phiên Slash sử dụng các khóa cô lập:

- `agent:<agentId>:slack:slash:<userId>`

và vẫn route thực thi lệnh chống lại phiên hội thoại mục tiêu (`CommandTargetSessionKey`).

## Threading, sessions, và reply tags

- DMs route là `direct`; channels là `channel`; MPIMs là `group`.
- Với `session.dmScope=main` mặc định, Slack DMs gộp vào phiên chính của agent.
- Phiên channel: `agent:<agentId>:slack:channel:<channelId>`.
- Trả lời thread có thể tạo hậu tố phiên thread (`:thread:<threadTs>`) khi áp dụng.
- `channels.slack.thread.historyScope` mặc định là `thread`; `thread.inheritParent` mặc định là `false`.
- `channels.slack.thread.initialHistoryLimit` kiểm soát số lượng tin nhắn thread hiện có được lấy khi một phiên thread mới bắt đầu (mặc định `20`; đặt `0` để tắt).

Kiểm soát threading trả lời:

- `channels.slack.replyToMode`: `off|first|all` (mặc định `off`)
- `channels.slack.replyToModeByChatType`: theo `direct|group|channel`
- fallback legacy cho direct chats: `channels.slack.dm.replyToMode`

Hỗ trợ reply tags thủ công:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Lưu ý: `replyToMode="off"` tắt **tất cả** threading trả lời trong Slack, bao gồm cả các tag `[[reply_to_*]]` rõ ràng. Điều này khác với Telegram, nơi các tag rõ ràng vẫn được tôn trọng trong chế độ `"off"`. Sự khác biệt này phản ánh các mô hình threading của nền tảng: Slack threads ẩn tin nhắn khỏi channel, trong khi Telegram replies vẫn hiển thị trong luồng chat chính.

## Media, chunking, và delivery

<AccordionGroup>
  <Accordion title="Inbound attachments">
    File đính kèm Slack được tải xuống từ các URL riêng tư do Slack lưu trữ (luồng yêu cầu xác thực token) và được ghi vào media store khi fetch thành công và giới hạn kích thước cho phép.

    Giới hạn kích thước inbound runtime mặc định là `20MB` trừ khi bị ghi đè bởi `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text và files">
    - text chunks sử dụng `channels.slack.textChunkLimit` (mặc định 4000)
    - `channels.slack.chunkMode="newline"` bật chia đoạn theo đoạn văn trước
    - gửi file sử dụng Slack upload APIs và có thể bao gồm trả lời thread (`thread_ts`)
    - giới hạn media outbound tuân theo `channels.slack.mediaMaxMb` khi được cấu hình; nếu không, gửi channel sử dụng mặc định MIME-kind từ media pipeline
  </Accordion>

  <Accordion title="Delivery targets">
    Mục tiêu rõ ràng ưu tiên:

    - `user:<id>` cho DMs
    - `channel:<id>` cho channels

    Slack DMs được mở qua Slack conversation APIs khi gửi đến mục tiêu người dùng.

  </Accordion>
</AccordionGroup>

## Actions và gates

Slack actions được kiểm soát bởi `channels.slack.actions.*`.

Các nhóm hành động có sẵn trong công cụ Slack hiện tại:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

## Events và hành vi vận hành

- Chỉnh sửa/xóa tin nhắn/phát sóng thread được map thành sự kiện hệ thống.
- Sự kiện thêm/xóa reaction được map thành sự kiện hệ thống.
- Thành viên tham gia/rời, channel được tạo/đổi tên, và sự kiện thêm/xóa pin được map thành sự kiện hệ thống.
- Cập nhật trạng thái thread của assistant (cho các chỉ báo "is typing..." trong threads) sử dụng `assistant.threads.setStatus` và yêu cầu bot scope `assistant:write`.
- `channel_id_changed` có thể di chuyển các khóa cấu hình channel khi `configWrites` được bật.
- Metadata chủ đề/mục đích channel được coi là ngữ cảnh không đáng tin cậy và có thể được tiêm vào ngữ cảnh routing.
- Block actions và modal interactions phát ra các sự kiện hệ thống có cấu trúc `Slack interaction: ...` với các trường payload phong phú:
  - block actions: các giá trị đã chọn, nhãn, giá trị picker, và metadata `workflow_*`
  - sự kiện `view_submission` và `view_closed` của modal với metadata channel được route và đầu vào form

## Ack reactions

`ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý một tin nhắn inbound.

Thứ tự giải quyết:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji danh tính agent (`agents.list[].identity.emoji`, nếu không "👀")

Lưu ý:

- Slack mong đợi shortcodes (ví dụ `"eyes"`).
- Dùng `""` để tắt reaction cho tài khoản Slack hoặc toàn cầu.

## Typing reaction fallback

`typingReaction` thêm một reaction tạm thời vào tin nhắn Slack inbound trong khi OpenClaw đang xử lý một phản hồi, sau đó xóa nó khi chạy xong. Đây là một fallback hữu ích khi typing assistant gốc của Slack không khả dụng, đặc biệt trong DMs.

Thứ tự giải quyết:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Lưu ý:

- Slack mong đợi shortcodes (ví dụ `"hourglass_flowing_sand"`).
- Reaction là nỗ lực tốt nhất và cleanup được thực hiện tự động sau khi phản hồi hoặc đường dẫn thất bại hoàn tất.

## Manifest và danh sách kiểm tra scope

<AccordionGroup>
  <Accordion title="Ví dụ manifest Slack app">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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
        "description": "Send a message to OpenClaw",
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

  <Accordion title="Optional user-token scopes (read operations)">
    Nếu cấu hình `channels.slack.userToken`, các scope đọc điển hình là:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (nếu phụ thuộc vào đọc tìm kiếm Slack)

  </Accordion>
</AccordionGroup>

## Troubleshooting

<AccordionGroup>
  <Accordion title="Không có phản hồi trong channels">
    Kiểm tra, theo thứ tự:

    - `groupPolicy`
    - channel allowlist (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` theo channel

    Lệnh hữu ích:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Tin nhắn DM bị bỏ qua">
    Kiểm tra:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (hoặc legacy `channels.slack.dm.policy`)
    - phê duyệt pairing / mục allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode không kết nối">
    Xác thực bot + app tokens và bật Socket Mode trong cài đặt Slack app.
  </Accordion>

  <Accordion title="HTTP mode không nhận sự kiện">
    Xác thực:

    - signing secret
    - webhook path
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` riêng cho mỗi tài khoản HTTP

  </Accordion>

  <Accordion title="Native/slash commands không hoạt động">
    Xác minh xem bạn có ý định:

    - chế độ lệnh gốc (`channels.slack.commands.native: true`) với các lệnh slash tương ứng đã đăng ký trong Slack
    - hoặc chế độ lệnh slash đơn (`channels.slack.slashCommand.enabled: true`)

    Cũng kiểm tra `commands.useAccessGroups` và allowlist channel/người dùng.

  </Accordion>
</AccordionGroup>

## Text streaming

OpenClaw hỗ trợ Slack native text streaming qua Agents và AI Apps API.

`channels.slack.streaming` kiểm soát hành vi live preview:

- `off`: tắt live preview streaming.
- `partial` (mặc định): thay thế văn bản preview bằng output partial mới nhất.
- `block`: thêm các cập nhật preview chia đoạn.
- `progress`: hiển thị văn bản trạng thái tiến trình trong khi tạo, sau đó gửi văn bản cuối cùng.

`channels.slack.nativeStreaming` kiểm soát Slack's native streaming API (`chat.startStream` / `chat.appendStream` / `chat.stopStream`) khi `streaming` là `partial` (mặc định: `true`).

Tắt native Slack streaming (giữ hành vi draft preview):

```yaml
channels:
  slack:
    streaming: partial
    nativeStreaming: false
```

Các khóa legacy:

- `channels.slack.streamMode` (`replace | status_final | append`) tự động chuyển đổi sang `channels.slack.streaming`.
- boolean `channels.slack.streaming` tự động chuyển đổi sang `channels.slack.nativeStreaming`.

### Yêu cầu

1. Bật **Agents và AI Apps** trong cài đặt Slack app.
2. Đảm bảo app có scope `assistant:write`.
3. Một thread trả lời phải có sẵn cho tin nhắn đó. Lựa chọn thread vẫn tuân theo `replyToMode`.

### Hành vi

- Đoạn văn bản đầu tiên bắt đầu một stream (`chat.startStream`).
- Các đoạn văn bản sau đó thêm vào cùng một stream (`chat.appendStream`).
- Kết thúc phản hồi hoàn tất stream (`chat.stopStream`).
- Media và payload không phải văn bản fallback về delivery bình thường.
- Nếu streaming thất bại giữa phản hồi, OpenClaw fallback về delivery bình thường cho các payload còn lại.

## Configuration reference pointers

Tham khảo chính:

- [Configuration reference - Slack](/gateway/configuration-reference#slack)

  Các trường Slack quan trọng:
  - mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM access: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - compatibility toggle: `dangerouslyAllowNameMatching` (break-glass; giữ tắt trừ khi cần)
  - channel access: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - threading/history: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - delivery: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - ops/features: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Liên quan

- [Pairing](/channels/pairing)
- [Channel routing](/channels/channel-routing)
- [Troubleshooting](/channels/troubleshooting)
- [Configuration](/gateway/configuration)
- [Slash commands](/tools/slash-commands)\n