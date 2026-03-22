---
summary: "Trạng thái hỗ trợ bot Discord, khả năng và cấu hình"
read_when:
  - Làm việc với tính năng kênh Discord
title: "Discord"
---

# Discord (Bot API)

Trạng thái: sẵn sàng cho DMs và guild channels qua gateway chính thức của Discord.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Discord DMs mặc định ở chế độ pairing.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    Chẩn đoán và sửa lỗi cross-channel.
  </Card>
</CardGroup>

## Thiết lập nhanh

Cần tạo một ứng dụng mới với bot, thêm bot vào server và kết nối với OpenClaw. Nên thêm bot vào server riêng tư của mình. Nếu chưa có, [tạo một server trước](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (chọn **Create My Own > For me and my friends**).

<Steps>
  <Step title="Tạo ứng dụng và bot Discord">
    Truy cập [Discord Developer Portal](https://discord.com/developers/applications) và nhấn **New Application**. Đặt tên như "OpenClaw".

    Nhấn **Bot** ở thanh bên. Đặt **Username** theo tên agent OpenClaw.

  </Step>

  <Step title="Bật quyền truy cập đặc quyền">
    Vẫn ở trang **Bot**, cuộn xuống **Privileged Gateway Intents** và bật:

    - **Message Content Intent** (bắt buộc)
    - **Server Members Intent** (khuyến nghị; cần cho role allowlists và khớp tên với ID)
    - **Presence Intent** (tùy chọn; chỉ cần cho cập nhật trạng thái)

  </Step>

  <Step title="Sao chép bot token">
    Cuộn lên trên trang **Bot** và nhấn **Reset Token**.

    <Note>
    Dù tên là "Reset", thao tác này tạo token đầu tiên — không có gì bị "reset".
    </Note>

    Sao chép token và lưu lại. Đây là **Bot Token** và sẽ cần dùng ngay sau đây.

  </Step>

  <Step title="Tạo URL mời và thêm bot vào server">
    Nhấn **OAuth2** ở thanh bên. Tạo URL mời với quyền đúng để thêm bot vào server.

    Cuộn xuống **OAuth2 URL Generator** và bật:

    - `bot`
    - `applications.commands`

    Phần **Bot Permissions** sẽ xuất hiện bên dưới. Bật:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (tùy chọn)

    Sao chép URL đã tạo ở dưới cùng, dán vào trình duyệt, chọn server và nhấn **Continue** để kết nối. Bot sẽ xuất hiện trong server Discord.

  </Step>

  <Step title="Bật Developer Mode và thu thập ID">
    Quay lại ứng dụng Discord, cần bật Developer Mode để sao chép ID nội bộ.

    1. Nhấn **User Settings** (biểu tượng bánh răng cạnh avatar) → **Advanced** → bật **Developer Mode**
    2. Nhấp chuột phải vào **server icon** trong thanh bên → **Copy Server ID**
    3. Nhấp chuột phải vào **avatar của mình** → **Copy User ID**

    Lưu **Server ID** và **User ID** cùng với Bot Token — sẽ gửi cả ba cho OpenClaw ở bước tiếp theo.

  </Step>

  <Step title="Cho phép DMs từ thành viên server">
    Để pairing hoạt động, Discord cần cho phép bot gửi DM. Nhấp chuột phải vào **server icon** → **Privacy Settings** → bật **Direct Messages**.

    Điều này cho phép thành viên server (bao gồm bot) gửi DMs. Giữ bật nếu muốn dùng Discord DMs với OpenClaw. Nếu chỉ dùng guild channels, có thể tắt DMs sau khi pairing.

  </Step>

  <Step title="Bước 0: Đặt bot token an toàn (không gửi trong chat)">
    Discord bot token là bí mật (như mật khẩu). Đặt trên máy chạy OpenClaw trước khi nhắn tin với agent.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Nếu OpenClaw đang chạy dưới dạng dịch vụ nền, dùng `openclaw gateway restart` thay thế.

  </Step>

  <Step title="Cấu hình OpenClaw và kết nối">

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        Chat với agent OpenClaw trên bất kỳ kênh hiện có nào (ví dụ: Telegram) và nói với nó. Nếu Discord là kênh đầu tiên, dùng tab CLI / config thay thế.

        > "Tôi đã đặt Discord bot token trong config. Vui lòng hoàn tất thiết lập Discord với User ID `<user_id>` và Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Nếu thích cấu hình dựa trên file, đặt:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Env fallback cho tài khoản mặc định:

```bash
DISCORD_BOT_TOKEN=...
```

        Giá trị `token` dạng plaintext được hỗ trợ. Giá trị SecretRef cũng được hỗ trợ cho `channels.discord.token` qua các provider env/file/exec. Xem [Secrets Management](/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Phê duyệt pairing DM đầu tiên">
    Đợi đến khi gateway chạy, sau đó DM bot trong Discord. Nó sẽ phản hồi với mã pairing.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        Gửi mã pairing cho agent trên kênh hiện có:

        > "Phê duyệt mã pairing Discord này: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Mã pairing hết hạn sau 1 giờ.

    Giờ có thể chat với agent trong Discord qua DM.

  </Step>
</Steps>

<Note>
Token resolution nhận biết tài khoản. Giá trị token trong config thắng env fallback. `DISCORD_BOT_TOKEN` chỉ dùng cho tài khoản mặc định.
Đối với các cuộc gọi outbound nâng cao (công cụ tin nhắn/hành động kênh), một `token` riêng cho mỗi cuộc gọi được sử dụng. Điều này áp dụng cho các hành động gửi và đọc/kiểm tra kiểu probe (ví dụ: đọc/tìm kiếm/lấy/chủ đề/ghim/quyền). Cài đặt chính sách tài khoản/lặp lại vẫn đến từ tài khoản đã chọn trong snapshot runtime hiện tại.
</Note>

## Khuyến nghị: Thiết lập guild workspace

Khi DMs hoạt động, có thể thiết lập server Discord như một workspace đầy đủ, nơi mỗi kênh có session agent riêng với ngữ cảnh riêng. Điều này được khuyến nghị cho server riêng tư chỉ có bạn và bot.

<Steps>
  <Step title="Thêm server vào guild allowlist">
    Điều này cho phép agent phản hồi trong bất kỳ kênh nào trên server, không chỉ DMs.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Thêm Discord Server ID `<server_id>` của tôi vào guild allowlist"
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Cho phép phản hồi không cần @mention">
    Mặc định, agent chỉ phản hồi trong guild channels khi được @mention. Đối với server riêng tư, có thể muốn nó phản hồi mọi tin nhắn.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Cho phép agent của tôi phản hồi trên server này mà không cần phải @mention"
      </Tab>
      <Tab title="Config">
        Đặt `requireMention: false` trong config guild:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Lên kế hoạch cho memory trong guild channels">
    Mặc định, memory dài hạn (MEMORY.md) chỉ tải trong DM sessions. Guild channels không tự động tải MEMORY.md.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Khi tôi hỏi trong kênh Discord, dùng memory_search hoặc memory_get nếu cần ngữ cảnh dài hạn từ MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Nếu cần ngữ cảnh chung trong mọi kênh, đặt hướng dẫn ổn định trong `AGENTS.md` hoặc `USER.md` (chúng được chèn cho mọi session). Giữ ghi chú dài hạn trong `MEMORY.md` và truy cập khi cần với công cụ memory.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Giờ tạo vài kênh trên server Discord và bắt đầu chat. Agent có thể thấy tên kênh, và mỗi kênh có session riêng biệt — có thể thiết lập `#coding`, `#home`, `#research`, hoặc bất kỳ thứ gì phù hợp với workflow.

## Mô hình runtime

- Gateway sở hữu kết nối Discord.
- Routing phản hồi là xác định: Discord inbound phản hồi lại Discord.
- Mặc định (`session.dmScope=main`), chat trực tiếp chia sẻ session chính của agent (`agent:main:main`).
- Guild channels là khóa session riêng biệt (`agent:<agentId>:discord:channel:<channelId>`).
- Group DMs bị bỏ qua mặc định (`channels.discord.dm.groupEnabled=false`).
- Slash commands gốc chạy trong session lệnh riêng biệt (`agent:<agentId>:discord:slash:<userId>`), trong khi vẫn mang `CommandTargetSessionKey` đến session hội thoại được định tuyến.

## Forum channels

Kênh forum và media của Discord chỉ chấp nhận bài đăng thread. OpenClaw hỗ trợ hai cách để tạo chúng:

- Gửi tin nhắn đến forum parent (`channel:<forumId>`) để tự động tạo thread. Tiêu đề thread dùng dòng không rỗng đầu tiên của tin nhắn.
- Dùng `openclaw message thread create` để tạo thread trực tiếp. Không truyền `--message-id` cho forum channels.

Ví dụ: gửi đến forum parent để tạo thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Tiêu đề chủ đề\nNội dung bài đăng"
```

Ví dụ: tạo thread forum rõ ràng

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Tiêu đề chủ đề" --message "Nội dung bài đăng"
```

Forum parents không chấp nhận components của Discord. Nếu cần components, gửi đến thread (`channel:<threadId>`).

## Interactive components

OpenClaw hỗ trợ Discord components v2 containers cho tin nhắn agent. Dùng công cụ tin nhắn với payload `components`. Kết quả tương tác được định tuyến lại cho agent như tin nhắn inbound bình thường và tuân theo cài đặt `replyToMode` của Discord hiện có.

Các block hỗ trợ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Action rows cho phép tối đa 5 nút hoặc một menu chọn
- Các loại chọn: `string`, `user`, `role`, `mentionable`, `channel`

Mặc định, components chỉ dùng một lần. Đặt `components.reusable=true` để cho phép nút, chọn và forms được dùng nhiều lần cho đến khi hết hạn.

Để giới hạn ai có thể nhấn nút, đặt `allowedUsers` trên nút đó (Discord user IDs, tags, hoặc `*`). Khi được cấu hình, người dùng không khớp nhận từ chối tạm thời.

Các lệnh `/model` và `/models` mở picker mô hình tương tác với dropdown provider và model cùng bước Submit. Phản hồi picker là tạm thời và chỉ người dùng gọi mới có thể sử dụng.

Đính kèm file:

- Các block `file` phải trỏ đến tham chiếu đính kèm (`attachment://<filename>`)
- Cung cấp đính kèm qua `media`/`path`/`filePath` (file đơn); dùng `media-gallery` cho nhiều file
- Dùng `filename` để ghi đè tên upload khi cần khớp với tham chiếu đính kèm

Forms modal:

- Thêm `components.modal` với tối đa 5 trường
- Các loại trường: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw tự động thêm nút kích hoạt

Ví dụ:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="Chính sách DM">
    `channels.discord.dmPolicy` kiểm soát truy cập DM (legacy: `channels.discord.dm.policy`):

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `channels.discord.allowFrom` bao gồm `"*"`; legacy: `channels.discord.dm.allowFrom`)
    - `disabled`

    Nếu chính sách DM không mở, người dùng không xác định bị chặn (hoặc được nhắc pairing trong chế độ `pairing`).

    Thứ tự ưu tiên nhiều tài khoản:

    - `channels.discord.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Tài khoản có tên kế thừa `channels.discord.allowFrom` khi `allowFrom` của chúng chưa được đặt.
    - Tài khoản có tên không kế thừa `channels.discord.accounts.default.allowFrom`.

    Định dạng mục tiêu DM để gửi:

    - `user:<id>`
    - `<@id>` mention

    ID số không có định dạng rõ ràng bị từ chối trừ khi có loại mục tiêu người dùng/kênh rõ ràng.

  </Tab>

  <Tab title="Chính sách Guild">
    Xử lý guild được kiểm soát bởi `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Cơ sở an toàn khi `channels.discord` tồn tại là `allowlist`.

    Hành vi `allowlist`:

    - guild phải khớp với `channels.discord.guilds` (`id` được ưu tiên, slug được chấp nhận)
    - allowlists người gửi tùy chọn: `users` (ID ổn định được khuyến nghị) và `roles` (chỉ ID role); nếu một trong hai được cấu hình, người gửi được phép khi họ khớp với `users` HOẶC `roles`
    - khớp tên/tag trực tiếp bị tắt mặc định; bật `channels.discord.dangerouslyAllowNameMatching: true` chỉ như chế độ tương thích khẩn cấp
    - tên/tag được hỗ trợ cho `users`, nhưng ID an toàn hơn; `openclaw security audit` cảnh báo khi các mục tên/tag được sử dụng
    - nếu một guild có `channels` được cấu hình, các kênh không được liệt kê bị từ chối
    - nếu một guild không có block `channels`, tất cả các kênh trong guild được allowlist đều được phép

    Ví dụ:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Nếu chỉ đặt `DISCORD_BOT_TOKEN` và không tạo block `channels.discord`, fallback runtime là `groupPolicy="allowlist"` (với cảnh báo trong logs), ngay cả khi `channels.defaults.groupPolicy` là `open`.

  </Tab>

  <Tab title="Mentions và group DMs">
    Tin nhắn guild được kiểm soát mention mặc định.

    Phát hiện mention bao gồm:

    - mention bot rõ ràng
    - mẫu mention được cấu hình (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - hành vi reply-to-bot ngầm trong các trường hợp được hỗ trợ

    `requireMention` được cấu hình theo guild/kênh (`channels.discord.guilds...`).
    `ignoreOtherMentions` tùy chọn bỏ qua tin nhắn đề cập đến người dùng/role khác nhưng không phải bot (trừ @everyone/@here).

    Group DMs:

    - mặc định: bị bỏ qua (`dm.groupEnabled=false`)
    - allowlist tùy chọn qua `dm.groupChannels` (ID kênh hoặc slug)

  </Tab>
</Tabs>

### Định tuyến agent dựa trên role

Dùng `bindings[].match.roles` để định tuyến thành viên guild Discord đến các agent khác nhau theo ID role. Các bindings dựa trên role chỉ chấp nhận ID role và được đánh giá sau bindings peer hoặc parent-peer và trước bindings chỉ guild. Nếu một binding cũng đặt các trường match khác (ví dụ `peer` + `guildId` + `roles`), tất cả các trường được cấu hình phải khớp.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Thiết lập Developer Portal

<AccordionGroup>
  <Accordion title="Tạo app và bot">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Sao chép bot token

  </Accordion>

  <Accordion title="Intents đặc quyền">
    Trong **Bot -> Privileged Gateway Intents**, bật:

    - Message Content Intent
    - Server Members Intent (khuyến nghị)

    Presence intent là tùy chọn và chỉ cần nếu muốn nhận cập nhật trạng thái. Đặt trạng thái bot (`setPresence`) không yêu cầu bật cập nhật trạng thái cho thành viên.

  </Accordion>

  <Accordion title="OAuth scopes và quyền cơ bản">
    Trình tạo URL OAuth:

    - scopes: `bot`, `applications.commands`

    Quyền cơ bản điển hình:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (tùy chọn)

    Tránh `Administrator` trừ khi thực sự cần.

  </Accordion>

  <Accordion title="Sao chép IDs">
    Bật Developer Mode của Discord, sau đó sao chép:

    - server ID
    - channel ID
    - user ID

    Ưu tiên ID số trong config OpenClaw để kiểm tra và kiểm tra đáng tin cậy.

  </Accordion>
</AccordionGroup>

## Lệnh gốc và xác thực lệnh

- `commands.native` mặc định là `"auto"` và được bật cho Discord.
- Ghi đè theo kênh: `channels.discord.commands.native`.
- `commands.native=false` xóa rõ ràng các lệnh gốc Discord đã đăng ký trước đó.
- Xác thực lệnh gốc sử dụng cùng allowlists/chính sách Discord như xử lý tin nhắn bình thường.
- Lệnh có thể vẫn hiển thị trong UI Discord cho người dùng không được ủy quyền; thực thi vẫn thực thi xác thực OpenClaw và trả về "không được ủy quyền".

Xem [Slash commands](/tools/slash-commands) để biết danh mục lệnh và hành vi.

Cài đặt lệnh slash mặc định:

- `ephemeral: true`

## Chi tiết tính năng

<AccordionGroup>
  <Accordion title="Reply tags và native replies">
    Discord hỗ trợ reply tags trong output agent:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Được kiểm soát bởi `channels.discord.replyToMode`:

    - `off` (mặc định)
    - `first`
    - `all`

    Lưu ý: `off` vô hiệu hóa threading reply ngầm. Các tag `[[reply_to_*]]` rõ ràng vẫn được tôn trọng.

    Message IDs được hiển thị trong context/history để agents có thể nhắm mục tiêu tin nhắn cụ thể.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw có thể stream các phản hồi nháp bằng cách gửi một tin nhắn tạm thời và chỉnh sửa nó khi văn bản đến.

    - `channels.discord.streaming` kiểm soát streaming preview (`off` | `partial` | `block` | `progress`, mặc định: `off`).
    - `progress` được chấp nhận để đảm bảo nhất quán cross-channel và ánh xạ đến `partial` trên Discord.
    - `channels.discord.streamMode` là alias cũ và được tự động di chuyển.
    - `partial` chỉnh sửa một tin nhắn preview duy nhất khi các token đến.
    - `block` phát ra các khối kích thước nháp (dùng `draftChunk` để điều chỉnh kích thước và điểm ngắt).

    Ví dụ:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    Mặc định chunking chế độ `block` (giới hạn bởi `channels.discord.textChunkLimit`):

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    Streaming preview chỉ có văn bản; phản hồi media quay lại phương thức gửi bình thường.

    Lưu ý: streaming preview tách biệt với streaming block. Khi streaming block được bật rõ ràng cho Discord, OpenClaw bỏ qua stream preview để tránh double streaming.

  </Accordion>

  <Accordion title="History, context, và hành vi thread">
    Ngữ cảnh lịch sử guild:

    - `channels.discord.historyLimit` mặc định `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` vô hiệu hóa

    Kiểm soát lịch sử DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Hành vi thread:

    - Các thread Discord được định tuyến như các session kênh
    - metadata thread parent có thể được sử dụng cho liên kết session parent
    - config thread kế thừa config kênh parent trừ khi có một entry cụ thể cho thread

    Chủ đề kênh được chèn như ngữ cảnh **không đáng tin cậy** (không phải là system prompt).

  </Accordion>

  <Accordion title="Thread-bound sessions cho subagents">
    Discord có thể gắn một thread vào một mục tiêu session để các tin nhắn tiếp theo trong thread đó tiếp tục định tuyến đến cùng một session (bao gồm các session subagent).

    Các lệnh:

    - `/focus <target>` gắn thread hiện tại/mới vào một mục tiêu subagent/session
    - `/unfocus` xóa gắn kết thread hiện tại
    - `/agents` hiển thị các lần chạy và trạng thái gắn kết hoạt động
    - `/session idle <duration|off>` kiểm tra/cập nhật tự động unfocus khi không hoạt động cho các gắn kết tập trung
    - `/session max-age <duration|off>` kiểm tra/cập nhật tuổi tối đa cứng cho các gắn kết tập trung

    Cấu hình:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Ghi chú:

    - `session.threadBindings.*` đặt mặc định toàn cầu.
    - `channels.discord.threadBindings.*` ghi đè hành vi Discord.
    - `spawnSubagentSessions` phải là true để tự động tạo/gắn kết threads cho `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` phải là true để tự động tạo/gắn kết threads cho ACP (`/acp spawn ... --thread ...` hoặc `sessions_spawn({ runtime: "acp", thread: true })`).
    - Nếu gắn kết thread bị vô hiệu hóa cho một tài khoản, `/focus` và các thao tác gắn kết thread liên quan không khả dụng.

    Xem [Sub-agents](/tools/subagents), [ACP Agents](/tools/acp-agents), và [Configuration Reference](/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Gắn kết kênh ACP ổn định">
    Đối với các workspace ACP "luôn bật" ổn định, cấu hình gắn kết ACP kiểu top-level nhắm mục tiêu các cuộc trò chuyện Discord.

    Đường dẫn cấu hình:

    - `bindings[]` với `type: "acp"` và `match.channel: "discord"`

    Ví dụ:

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
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Ghi chú:

    - Tin nhắn thread có thể kế thừa gắn kết kênh parent ACP.
    - Trong một kênh hoặc thread được gắn kết, `/new` và `/reset` đặt lại cùng một session ACP tại chỗ.
    - Gắn kết thread tạm thời vẫn hoạt động và có thể ghi đè resolution mục tiêu khi đang hoạt động.

    Xem [ACP Agents](/tools/acp-agents) để biết chi tiết hành vi gắn kết.

  </Accordion>

  <Accordion title="Thông báo phản ứng">
    Chế độ thông báo phản ứng theo guild:

    - `off`
    - `own` (mặc định)
    - `all`
    - `allowlist` (sử dụng `guilds.<id>.users`)

    Sự kiện phản ứng được chuyển thành sự kiện hệ thống và gắn vào session Discord được định tuyến.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý một tin nhắn inbound.

    Thứ tự resolution:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback emoji nhận dạng agent (`agents.list[].identity.emoji`, nếu không có thì "👀")

    Ghi chú:

    - Discord chấp nhận emoji unicode hoặc tên emoji tùy chỉnh.
    - Dùng `""` để vô hiệu hóa phản ứng cho một kênh hoặc tài khoản.

  </Accordion>

  <Accordion title="Ghi cấu hình">
    Ghi cấu hình khởi tạo từ kênh được bật mặc định.

    Điều này ảnh hưởng đến luồng `/config set|unset` (khi các tính năng lệnh được bật).

    Vô hiệu hóa:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway proxy">
    Định tuyến lưu lượng WebSocket gateway Discord và tra cứu REST khởi động (application ID + resolution allowlist) qua một proxy HTTP(S) với `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Ghi đè theo tài khoản:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Hỗ trợ PluralKit">
    Bật resolution PluralKit để ánh xạ các tin nhắn proxy đến danh tính thành viên hệ thống:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // tùy chọn; cần cho hệ thống riêng tư
      },
    },
  },
}
```

    Ghi chú:

    - allowlists có thể sử dụng `pk:<memberId>`
    - tên hiển thị thành viên được khớp theo tên/slug chỉ khi `channels.discord.dangerouslyAllowNameMatching: true`
    - tra cứu sử dụng ID tin nhắn gốc và bị giới hạn thời gian
    - nếu tra cứu thất bại, tin nhắn proxy được xử lý như tin nhắn bot và bị loại trừ trừ khi `allowBots=true`

  </Accordion>

  <Accordion title="Cấu hình trạng thái">
    Cập nhật trạng thái được áp dụng khi bạn đặt một trường trạng thái hoặc hoạt động, hoặc khi bạn bật trạng thái tự động.

    Ví dụ chỉ trạng thái:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Ví dụ hoạt động (trạng thái tùy chỉnh là loại hoạt động mặc định):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Ví dụ streaming:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Bản đồ loại hoạt động:

    - 0: Playing
    - 1: Streaming (yêu cầu `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (sử dụng văn bản hoạt động làm trạng thái; emoji là tùy chọn)
    - 5: Competing

    Ví dụ trạng thái tự động (tín hiệu sức khỏe runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    Trạng thái tự động ánh xạ khả dụng runtime đến trạng thái Discord: khỏe mạnh => online, suy giảm hoặc không xác định => idle, exhausted hoặc không khả dụng => dnd. Các văn bản ghi đè tùy chọn:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (hỗ trợ `{reason}` placeholder)

  </Accordion>

  <Accordion title="Phê duyệt exec trong Discord">
    Discord hỗ trợ phê duyệt exec dựa trên nút trong DMs và có thể tùy chọn đăng lời nhắc phê duyệt trong kênh gốc.

    Đường dẫn cấu hình:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Khi `target` là `channel` hoặc `both`, lời nhắc phê duyệt hiển thị trong kênh. Chỉ những người phê duyệt được cấu hình mới có thể sử dụng các nút; người dùng khác nhận từ chối tạm thời. Lời nhắc phê duyệt bao gồm văn bản lệnh, vì vậy chỉ bật gửi kênh trong các kênh đáng tin cậy. Nếu ID kênh không thể được suy ra từ khóa session, OpenClaw quay lại gửi DM.

    Xác thực Gateway cho handler này sử dụng cùng hợp đồng resolution credential chia sẻ như các khách hàng Gateway khác:

    - xác thực local env-first (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` sau đó `gateway.auth.*`)
    - trong chế độ local, `gateway.remote.*` có thể được sử dụng như fallback chỉ khi `gateway.auth.*` chưa được đặt; SecretRefs local được cấu hình nhưng không được giải quyết sẽ thất bại
    - hỗ trợ chế độ remote qua `gateway.remote.*` khi áp dụng
    - ghi đè URL là an toàn: ghi đè CLI không tái sử dụng credential ngầm định, và ghi đè env chỉ sử dụng credential env

    Nếu phê duyệt thất bại với ID phê duyệt không xác định, hãy xác minh danh sách người phê duyệt và tính năng được bật.

    Tài liệu liên quan: [Exec approvals](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Công cụ và cổng hành động

Hành động tin nhắn Discord bao gồm nhắn tin, quản trị kênh, điều hành, trạng thái, và hành động metadata.

Ví dụ cốt lõi:

- nhắn tin: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- phản ứng: `react`, `reactions`, `emojiList`
- điều hành: `timeout`, `kick`, `ban`
- trạng thái: `setPresence`

Cổng hành động nằm dưới `channels.discord.actions.*`.

Hành vi cổng mặc định:

| Nhóm hành động                                                                                                                                                             | Mặc định  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## Components v2 UI

OpenClaw sử dụng Discord components v2 cho phê duyệt exec và đánh dấu cross-context. Hành động tin nhắn Discord cũng có thể chấp nhận `components` cho UI tùy chỉnh (nâng cao; yêu cầu các instance component Carbon), trong khi `embeds` cũ vẫn có sẵn nhưng không được khuyến nghị.

- `channels.discord.ui.components.accentColor` đặt màu nhấn được sử dụng bởi các container component Discord (hex).
- Đặt theo tài khoản với `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` bị bỏ qua khi components v2 có mặt.

Ví dụ:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Voice channels

OpenClaw có thể tham gia các kênh voice Discord cho các cuộc trò chuyện liên tục, thời gian thực. Điều này tách biệt với các đính kèm tin nhắn voice.

Yêu cầu:

- Bật lệnh gốc (`commands.native` hoặc `channels.discord.commands.native`).
- Cấu hình `channels.discord.voice`.
- Bot cần quyền Connect + Speak trong kênh voice mục tiêu.

Dùng lệnh gốc chỉ dành cho Discord `/vc join|leave|status` để kiểm soát các session. Lệnh sử dụng agent mặc định của tài khoản và tuân theo cùng các quy tắc allowlist và group policy như các lệnh Discord khác.

Ví dụ tự động tham gia:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Ghi chú:

- `voice.tts` ghi đè `messages.tts` chỉ cho phát lại voice.
- Bản ghi voice chuyển đổi trạng thái chủ sở hữu từ Discord `allowFrom` (hoặc `dm.allowFrom`); người nói không phải chủ sở hữu không thể truy cập công cụ chỉ dành cho chủ sở hữu (ví dụ: `gateway` và `cron`).
- Voice được bật mặc định; đặt `channels.discord.voice.enabled=false` để vô hiệu hóa.
- `voice.daveEncryption` và `voice.decryptionFailureTolerance` truyền qua các tùy chọn join `@discordjs/voice`.
- Mặc định `@discordjs/voice` là `daveEncryption=true` và `decryptionFailureTolerance=24` nếu chưa được đặt.
- OpenClaw cũng theo dõi lỗi giải mã nhận và tự động khôi phục bằng cách rời khỏi/tham gia lại kênh voice sau khi gặp lỗi lặp lại trong một cửa sổ ngắn.
- Nếu logs nhận liên tục hiển thị `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, đây có thể là lỗi nhận `@discordjs/voice` upstream được theo dõi trong [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Voice messages

Tin nhắn voice Discord hiển thị preview waveform và yêu cầu âm thanh OGG/Opus cùng metadata. OpenClaw tự động tạo waveform, nhưng cần `ffmpeg` và `ffprobe` có sẵn trên host gateway để kiểm tra và chuyển đổi file âm thanh.

Yêu cầu và hạn chế:

- Cung cấp **đường dẫn file local** (URLs bị từ chối).
- Bỏ qua nội dung văn bản (Discord không cho phép văn bản + tin nhắn voice trong cùng payload).
- Bất kỳ định dạng âm thanh nào đều được chấp nhận; OpenClaw chuyển đổi sang OGG/Opus khi cần.

Ví dụ:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Dùng intents không được phép hoặc bot không thấy tin nhắn guild">

    - bật Message Content Intent
    - bật Server Members Intent khi phụ thuộc vào resolution user/member
    - khởi động lại gateway sau khi thay đổi intents

  </Accordion>

  <Accordion title="Tin nhắn guild bị chặn không mong muốn">

    - xác minh `groupPolicy`
    - xác minh allowlist guild dưới `channels.discord.guilds`
    - nếu bản đồ `channels` guild tồn tại, chỉ các kênh được liệt kê mới được phép
    - xác minh hành vi `requireMention` và mẫu mention

    Kiểm tra hữu ích:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false nhưng vẫn bị chặn">
    Nguyên nhân phổ biến:

    - `groupPolicy="allowlist"` mà không có allowlist guild/kênh khớp
    - `requireMention` được cấu hình sai chỗ (phải nằm dưới `channels.discord.guilds` hoặc entry kênh)
    - người gửi bị chặn bởi allowlist `users` guild/kênh

  </Accordion>

  <Accordion title="Handlers chạy lâu bị timeout hoặc phản hồi trùng lặp">

    Logs điển hình:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Nút ngân sách listener:

    - tài khoản đơn: `channels.discord.eventQueue.listenerTimeout`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Nút timeout chạy worker:

    - tài khoản đơn: `channels.discord.inboundWorker.runTimeoutMs`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - mặc định: `1800000` (30 phút); đặt `0` để vô hiệu hóa

    Cơ sở khuyến nghị:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Dùng `eventQueue.listenerTimeout` cho thiết lập listener chậm và `inboundWorker.runTimeoutMs`
    chỉ nếu muốn một van an toàn riêng cho các lượt agent xếp hàng.

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Kiểm tra quyền `channels status --probe` chỉ hoạt động cho ID kênh số.

    Nếu bạn sử dụng khóa slug, khớp runtime vẫn có thể hoạt động, nhưng probe không thể xác minh đầy đủ quyền.

  </Accordion>

  <Accordion title="Vấn đề DM và pairing">

    - DM bị vô hiệu hóa: `channels.discord.dm.enabled=false`
    - Chính sách DM bị vô hiệu hóa: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - đang chờ phê duyệt pairing trong chế độ `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    Mặc định tin nhắn do bot tạo bị bỏ qua.

    Nếu bạn đặt `channels.discord.allowBots=true`, sử dụng quy tắc mention và allowlist nghiêm ngặt để tránh hành vi loop.
    Ưu tiên `channels.discord.allowBots="mentions"` để chỉ chấp nhận tin nhắn bot đề cập đến bot.

  </Accordion>

  <Accordion title="Voice STT drops với DecryptionFailed(...)">

    - giữ OpenClaw cập nhật (`openclaw update`) để logic khôi phục nhận voice Discord có mặt
    - xác nhận `channels.discord.voice.daveEncryption=true` (mặc định)
    - bắt đầu từ `channels.discord.voice.decryptionFailureTolerance=24` (mặc định upstream) và điều chỉnh chỉ khi cần
    - theo dõi logs cho:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - nếu lỗi tiếp tục sau khi tự động tham gia lại, thu thập logs và so sánh với [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Pointers tham chiếu cấu hình

Tham chiếu chính:

- [Tham chiếu cấu hình - Discord](/gateway/configuration-reference#discord)

Các trường Discord có tín hiệu cao:

- khởi động/xác thực: `enabled`, `token`, `accounts.*`, `allowBots`
- chính sách: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- lệnh: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- hàng đợi sự kiện: `eventQueue.listenerTimeout` (ngân sách listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker inbound: `inboundWorker.runTimeoutMs`
- phản hồi/lịch sử: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- gửi: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias cũ: `streamMode`), `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/lặp lại: `mediaMaxMb`, `retry`
  - `mediaMaxMb` giới hạn tải lên Discord outbound (mặc định: `8MB`)
- hành động: `actions.*`
- trạng thái: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- tính năng: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## An toàn và vận hành

- Xem bot tokens như bí mật (`DISCORD_BOT_TOKEN` được ưu tiên trong môi trường giám sát).
- Cấp quyền Discord ít nhất có thể.
- Nếu trạng thái triển khai/lệnh bị lỗi thời, khởi động lại gateway và kiểm tra lại với `openclaw channels status --probe`.

## Liên quan

- [Pairing](/channels/pairing)
- [Channel routing](/channels/channel-routing)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)
- [Slash commands](/tools/slash-commands)\n