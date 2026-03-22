---
summary: "Khám phá cách cấu hình và tối ưu hóa bot Discord để nâng cao trải nghiệm người dùng và quản lý server hiệu quả."
read_when:
  - Làm việc với các tính năng kênh Discord
title: "Hướng Dẫn Cấu Hình Bot Discord"
---

# Discord (Bot API)

Trạng thái: sẵn sàng cho tin nhắn trực tiếp (DM) và kênh guild thông qua gateway chính thức của Discord.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/channels/pairing">
    Tin nhắn trực tiếp Discord mặc định ở chế độ ghép nối.
  </Card>
  <Card title="Lệnh Slash" icon="terminal" href="/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/channels/troubleshooting">
    Chẩn đoán và quy trình sửa chữa đa kênh.
  </Card>
</CardGroup>

## Thiết lập nhanh

Cần tạo một ứng dụng mới với bot, thêm bot vào máy chủ của bạn và ghép nối với OpenClaw. Khuyến nghị thêm bot vào máy chủ riêng tư của bạn. Nếu chưa có, [tạo một cái trước](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (chọn **Create My Own > For me and my friends**).

<Steps>
  <Step title="Tạo ứng dụng và bot Discord">
    Truy cập [Discord Developer Portal](https://discord.com/developers/applications) và nhấp **New Application**. Đặt tên như "OpenClaw".

    Nhấp **Bot** ở thanh bên. Đặt **Username** theo tên bạn gọi agent OpenClaw của mình.

  </Step>

  <Step title="Kích hoạt các ý định đặc quyền">
    Vẫn ở trang **Bot**, cuộn xuống **Privileged Gateway Intents** và kích hoạt:

    - **Message Content Intent** (bắt buộc)
    - **Server Members Intent** (khuyến nghị; cần thiết cho danh sách cho phép vai trò và khớp tên với ID)
    - **Presence Intent** (tùy chọn; chỉ cần cho cập nhật trạng thái)

  </Step>

  <Step title="Sao chép token bot của bạn">
    Cuộn lên trên trang **Bot** và nhấp **Reset Token**.

    <Note>
    Mặc dù tên là "Reset", thao tác này tạo token đầu tiên của bạn — không có gì bị "reset".
    </Note>

    Sao chép token và lưu lại. Đây là **Bot Token** và bạn sẽ cần nó ngay sau đây.

  </Step>

  <Step title="Tạo URL mời và thêm bot vào máy chủ của bạn">
    Nhấp **OAuth2** ở thanh bên. Bạn sẽ tạo URL mời với quyền đúng để thêm bot vào máy chủ của mình.

    Cuộn xuống **OAuth2 URL Generator** và kích hoạt:

    - `bot`
    - `applications.commands`

    Một phần **Bot Permissions** sẽ xuất hiện bên dưới. Kích hoạt:

    - Xem Kênh
    - Gửi Tin nhắn
    - Đọc Lịch sử Tin nhắn
    - Nhúng Liên kết
    - Đính kèm Tệp
    - Thêm Phản ứng (tùy chọn)

    Sao chép URL được tạo ở dưới cùng, dán vào trình duyệt, chọn máy chủ của bạn và nhấp **Continue** để kết nối. Bạn sẽ thấy bot của mình trong máy chủ Discord.

  </Step>

  <Step title="Kích hoạt Chế độ Nhà phát triển và thu thập ID của bạn">
    Quay lại ứng dụng Discord, bạn cần kích hoạt Chế độ Nhà phát triển để có thể sao chép ID nội bộ.

    1. Nhấp **User Settings** (biểu tượng bánh răng bên cạnh avatar) → **Advanced** → bật **Developer Mode**
    2. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn trong thanh bên → **Copy Server ID**
    3. Nhấp chuột phải vào **avatar của bạn** → **Copy User ID**

    Lưu **Server ID** và **User ID** cùng với Bot Token — bạn sẽ gửi cả ba cho OpenClaw trong bước tiếp theo.

  </Step>

  <Step title="Cho phép DMs từ thành viên máy chủ">
    Để ghép nối hoạt động, Discord cần cho phép bot của bạn gửi DM cho bạn. Nhấp chuột phải vào **biểu tượng máy chủ** → **Privacy Settings** → bật **Direct Messages**.

    Điều này cho phép thành viên máy chủ (bao gồm cả bot) gửi DM cho bạn. Giữ chế độ này nếu bạn muốn sử dụng DMs Discord với OpenClaw. Nếu chỉ định sử dụng kênh guild, bạn có thể tắt DMs sau khi ghép nối.

  </Step>

  <Step title="Bước 0: Đặt token bot của bạn một cách an toàn (không gửi trong chat)">
    Token bot Discord của bạn là một bí mật (như mật khẩu). Đặt nó trên máy chạy OpenClaw trước khi nhắn tin cho agent của bạn.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Nếu OpenClaw đã chạy như một dịch vụ nền, sử dụng `openclaw gateway restart` thay thế.

  </Step>

  <Step title="Cấu hình OpenClaw và ghép nối">

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        Chat với agent OpenClaw của bạn trên bất kỳ kênh hiện có nào (ví dụ: Telegram) và nói với nó. Nếu Discord là kênh đầu tiên của bạn, sử dụng tab CLI / config thay thế.

        > "Tôi đã đặt token bot Discord trong config. Vui lòng hoàn tất thiết lập Discord với User ID `<user_id>` và Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Nếu bạn thích cấu hình dựa trên file, đặt:

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

        Giá trị `token` plaintext được hỗ trợ. Giá trị SecretRef cũng được hỗ trợ cho `channels.discord.token` trên các nhà cung cấp env/file/exec. Xem [Quản lý Bí mật](/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Phê duyệt ghép nối DM đầu tiên">
    Chờ đến khi gateway đang chạy, sau đó gửi DM cho bot của bạn trong Discord. Nó sẽ phản hồi với mã ghép nối.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        Gửi mã ghép nối cho agent của bạn trên kênh hiện có:

        > "Phê duyệt mã ghép nối Discord này: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Mã ghép nối hết hạn sau 1 giờ.

    Bạn nên có thể chat với agent của mình trong Discord qua DM.

  </Step>
</Steps>

<Note>
Giải quyết token có nhận thức về tài khoản. Giá trị token config thắng env fallback. `DISCORD_BOT_TOKEN` chỉ được sử dụng cho tài khoản mặc định.
Đối với các cuộc gọi outbound nâng cao (công cụ tin nhắn/hành động kênh), một `token` rõ ràng cho mỗi cuộc gọi được sử dụng cho cuộc gọi đó. Điều này áp dụng cho các hành động gửi và đọc/kiểm tra kiểu (ví dụ: đọc/tìm kiếm/lấy/chủ đề/ghim/quyền). Cài đặt chính sách tài khoản/lặp lại vẫn đến từ tài khoản đã chọn trong snapshot runtime hiện hoạt.
</Note>

## Khuyến nghị: Thiết lập workspace guild

Khi DMs hoạt động, bạn có thể thiết lập máy chủ Discord của mình như một workspace đầy đủ, nơi mỗi kênh có phiên agent riêng với ngữ cảnh riêng. Điều này được khuyến nghị cho các máy chủ riêng tư nơi chỉ có bạn và bot của bạn.

<Steps>
  <Step title="Thêm máy chủ của bạn vào danh sách cho phép guild">
    Điều này cho phép agent của bạn phản hồi trong bất kỳ kênh nào trên máy chủ của bạn, không chỉ DMs.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Thêm Server ID Discord của tôi `<server_id>` vào danh sách cho phép guild"
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

  <Step title="Cho phép phản hồi mà không cần @mention">
    Theo mặc định, agent của bạn chỉ phản hồi trong các kênh guild khi được @mention. Đối với một máy chủ riêng tư, bạn có thể muốn nó phản hồi mọi tin nhắn.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Cho phép agent của tôi phản hồi trên máy chủ này mà không cần phải được @mention"
      </Tab>
      <Tab title="Config">
        Đặt `requireMention: false` trong config guild của bạn:

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

  <Step title="Lên kế hoạch cho bộ nhớ trong các kênh guild">
    Theo mặc định, bộ nhớ dài hạn (MEMORY.md) chỉ tải trong các phiên DM. Các kênh guild không tự động tải MEMORY.md.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Khi tôi hỏi câu hỏi trong các kênh Discord, sử dụng memory_search hoặc memory_get nếu bạn cần ngữ cảnh dài hạn từ MEMORY.md."
      </Tab>
      <Tab title="Thủ công">
        Nếu bạn cần ngữ cảnh chia sẻ trong mọi kênh, đặt hướng dẫn ổn định trong `AGENTS.md` hoặc `USER.md` (chúng được tiêm cho mọi phiên). Giữ ghi chú dài hạn trong `MEMORY.md` và truy cập chúng khi cần với công cụ bộ nhớ.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Bây giờ hãy tạo một số kênh trên máy chủ Discord của bạn và bắt đầu trò chuyện. Agent của bạn có thể thấy tên kênh, và mỗi kênh có phiên riêng biệt — vì vậy bạn có thể thiết lập `#coding`, `#home`, `#research`, hoặc bất kỳ thứ gì phù hợp với quy trình làm việc của bạn.

## Mô hình runtime

- Gateway sở hữu kết nối Discord.
- Định tuyến phản hồi là xác định: Discord inbound phản hồi lại Discord.
- Theo mặc định (`session.dmScope=main`), các cuộc trò chuyện trực tiếp chia sẻ phiên chính của agent (`agent:main:main`).
- Các kênh guild là khóa phiên riêng biệt (`agent:<agentId>:discord:channel:<channelId>`).
- Group DMs bị bỏ qua theo mặc định (`channels.discord.dm.groupEnabled=false`).
- Lệnh slash gốc chạy trong các phiên lệnh riêng biệt (`agent:<agentId>:discord:slash:<userId>`), trong khi vẫn mang `CommandTargetSessionKey` đến phiên trò chuyện được định tuyến.

## Kênh diễn đàn

Kênh diễn đàn và phương tiện Discord chỉ chấp nhận bài đăng chủ đề. OpenClaw hỗ trợ hai cách để tạo chúng:

- Gửi tin nhắn đến cha diễn đàn (`channel:<forumId>`) để tự động tạo chủ đề. Tiêu đề chủ đề sử dụng dòng không rỗng đầu tiên của tin nhắn của bạn.
- Sử dụng `openclaw message thread create` để tạo chủ đề trực tiếp. Không truyền `--message-id` cho các kênh diễn đàn.

Ví dụ: gửi đến cha diễn đàn để tạo chủ đề

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Tiêu đề chủ đề\nNội dung bài đăng"
```

Ví dụ: tạo chủ đề diễn đàn rõ ràng

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Tiêu đề chủ đề" --message "Nội dung bài đăng"
```

Cha diễn đàn không chấp nhận các thành phần Discord. Nếu bạn cần các thành phần, gửi đến chủ đề chính nó (`channel:<threadId>`).

## Thành phần tương tác

OpenClaw hỗ trợ các container thành phần v2 của Discord cho các tin nhắn agent. Sử dụng công cụ tin nhắn với payload `components`. Kết quả tương tác được định tuyến lại cho agent như các tin nhắn inbound bình thường và tuân theo cài đặt `replyToMode` hiện có của Discord.

Các khối được hỗ trợ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Hàng hành động cho phép tối đa 5 nút hoặc một menu chọn đơn
- Các loại chọn: `string`, `user`, `role`, `mentionable`, `channel`

Theo mặc định, các thành phần chỉ sử dụng một lần. Đặt `components.reusable=true` để cho phép các nút, chọn và biểu mẫu được sử dụng nhiều lần cho đến khi hết hạn.

Để hạn chế ai có thể nhấp vào nút, đặt `allowedUsers` trên nút đó (ID người dùng Discord, thẻ hoặc `*`). Khi được cấu hình, người dùng không khớp sẽ nhận được từ chối tạm thời.

Lệnh slash `/model` và `/models` mở một bộ chọn mô hình tương tác với dropdown nhà cung cấp và mô hình cùng với bước Gửi. Phản hồi bộ chọn là tạm thời và chỉ người dùng gọi mới có thể sử dụng nó.

Đính kèm tệp:

- Các khối `file` phải trỏ đến tham chiếu đính kèm (`attachment://<filename>`)
- Cung cấp đính kèm qua `media`/`path`/`filePath` (tệp đơn); sử dụng `media-gallery` cho nhiều tệp
- Sử dụng `filename` để ghi đè tên tải lên khi nó nên khớp với tham chiếu đính kèm

Biểu mẫu modal:

- Thêm `components.modal` với tối đa 5 trường
- Các loại trường: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw tự động thêm nút kích hoạt

Ví dụ:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Văn bản dự phòng tùy chọn",
  components: {
    reusable: true,
    text: "Chọn một đường dẫn",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Phê duyệt",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Từ chối", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Chọn một tùy chọn",
          options: [
            { label: "Tùy chọn A", value: "a" },
            { label: "Tùy chọn B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Chi tiết",
      triggerLabel: "Mở biểu mẫu",
      fields: [
        { type: "text", label: "Người yêu cầu" },
        {
          type: "select",
          label: "Ưu tiên",
          options: [
            { label: "Thấp", value: "low" },
            { label: "Cao", value: "high" },
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
    `channels.discord.dmPolicy` kiểm soát truy cập DM (cũ: `channels.discord.dm.policy`):

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `channels.discord.allowFrom` bao gồm `"*"`; cũ: `channels.discord.dm.allowFrom`)
    - `disabled`

    Nếu chính sách DM không mở, người dùng không xác định bị chặn (hoặc được nhắc ghép nối trong chế độ `pairing`).

    Ưu tiên đa tài khoản:

    - `channels.discord.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Các tài khoản được đặt tên thừa hưởng `channels.discord.allowFrom` khi `allowFrom` của riêng chúng chưa được đặt.
    - Các tài khoản được đặt tên không thừa hưởng `channels.discord.accounts.default.allowFrom`.

    Định dạng mục tiêu DM để giao hàng:

    - `user:<id>`
    - `<@id>` mention

    ID số không có định dạng rõ ràng và bị từ chối trừ khi một loại mục tiêu người dùng/kênh rõ ràng được cung cấp.

  </Tab>

  <Tab title="Chính sách Guild">
    Xử lý guild được kiểm soát bởi `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Cơ sở an toàn khi `channels.discord` tồn tại là `allowlist`.

    Hành vi `allowlist`:

    - guild phải khớp với `channels.discord.guilds` (`id` được ưu tiên, slug được chấp nhận)
    - danh sách cho phép người gửi tùy chọn: `users` (khuyến nghị ID ổn định) và `roles` (chỉ ID vai trò); nếu một trong hai được cấu hình, người gửi được phép khi họ khớp với `users` HOẶC `roles`
    - khớp tên/thẻ trực tiếp bị vô hiệu hóa theo mặc định; bật `channels.discord.dangerouslyAllowNameMatching: true` chỉ như chế độ tương thích khẩn cấp
    - tên/thẻ được hỗ trợ cho `users`, nhưng ID an toàn hơn; `openclaw security audit` cảnh báo khi các mục tên/thẻ được sử dụng
    - nếu một guild có `channels` được cấu hình, các kênh không được liệt kê bị từ chối
    - nếu một guild không có khối `channels`, tất cả các kênh trong guild được cho phép đều được phép

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

    Nếu bạn chỉ đặt `DISCORD_BOT_TOKEN` và không tạo khối `channels.discord`, fallback runtime là `groupPolicy="allowlist"` (với cảnh báo trong nhật ký), ngay cả khi `channels.defaults.groupPolicy` là `open`.

  </Tab>

  <Tab title="Mentions và group DMs">
    Tin nhắn guild được kiểm soát bởi mention theo mặc định.

    Phát hiện mention bao gồm:

    - mention bot rõ ràng
    - mẫu mention được cấu hình (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - hành vi trả lời-bot ngầm trong các trường hợp được hỗ trợ

    `requireMention` được cấu hình cho mỗi guild/kênh (`channels.discord.guilds...`).
    `ignoreOtherMentions` tùy chọn bỏ qua các tin nhắn đề cập đến người dùng/role khác nhưng không phải bot (ngoại trừ @everyone/@here).

    Group DMs:

    - mặc định: bị bỏ qua (`dm.groupEnabled=false`)
    - danh sách cho phép tùy chọn qua `dm.groupChannels` (ID kênh hoặc slug)

  </Tab>
</Tabs>

### Định tuyến agent dựa trên vai trò

Sử dụng `bindings[].match.roles` để định tuyến thành viên guild Discord đến các agent khác nhau theo ID vai trò. Các ràng buộc dựa trên vai trò chỉ chấp nhận ID vai trò và được đánh giá sau các ràng buộc peer hoặc parent-peer và trước các ràng buộc chỉ guild. Nếu một ràng buộc cũng đặt các trường khớp khác (ví dụ: `peer` + `guildId` + `roles`), tất cả các trường được cấu hình phải khớp.

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
  <Accordion title="Tạo ứng dụng và bot">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Sao chép token bot

  </Accordion>

  <Accordion title="Ý định đặc quyền">
    Trong **Bot -> Privileged Gateway Intents**, kích hoạt:

    - Message Content Intent
    - Server Members Intent (khuyến nghị)

    Ý định hiện diện là tùy chọn và chỉ cần thiết nếu bạn muốn nhận cập nhật hiện diện. Đặt hiện diện bot (`setPresence`) không yêu cầu kích hoạt cập nhật hiện diện cho thành viên.

  </Accordion>

  <Accordion title="Phạm vi OAuth và quyền cơ bản">
    Trình tạo URL OAuth:

    - phạm vi: `bot`, `applications.commands`

    Quyền cơ bản điển hình:

    - Xem Kênh
    - Gửi Tin nhắn
    - Đọc Lịch sử Tin nhắn
    - Nhúng Liên kết
    - Đính kèm Tệp
    - Thêm Phản ứng (tùy chọn)

    Tránh `Administrator` trừ khi cần thiết rõ ràng.

  </Accordion>

  <Accordion title="Sao chép ID">
    Kích hoạt Chế độ Nhà phát triển Discord, sau đó sao chép:

    - ID máy chủ
    - ID kênh
    - ID người dùng

    Ưu tiên ID số trong config OpenClaw để kiểm toán và kiểm tra đáng tin cậy.

  </Accordion>
</AccordionGroup>

## Lệnh gốc và xác thực lệnh

- `commands.native` mặc định là `"auto"` và được kích hoạt cho Discord.
- Ghi đè theo kênh: `channels.discord.commands.native`.
- `commands.native=false` rõ ràng xóa các lệnh gốc Discord đã đăng ký trước đó.
- Xác thực lệnh gốc sử dụng cùng danh sách cho phép/chính sách Discord như xử lý tin nhắn bình thường.
- Lệnh có thể vẫn hiển thị trong giao diện Discord cho người dùng không được ủy quyền; thực thi vẫn thực thi xác thực OpenClaw và trả về "không được ủy quyền".

Xem [Lệnh Slash](/tools/slash-commands) để biết danh mục lệnh và hành vi.

Cài đặt lệnh slash mặc định:

- `ephemeral: true`

## Chi tiết tính năng

<AccordionGroup>
  <Accordion title="Thẻ trả lời và trả lời gốc">
    Discord hỗ trợ thẻ trả lời trong đầu ra agent:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Được kiểm soát bởi `channels.discord.replyToMode`:

    - `off` (mặc định)
    - `first`
    - `all`

    Lưu ý: `off` vô hiệu hóa luồng trả lời ngầm. Thẻ `[[reply_to_*]]` rõ ràng vẫn được tôn trọng.

    ID tin nhắn được hiển thị trong ngữ cảnh/lịch sử để các agent có thể nhắm mục tiêu các tin nhắn cụ thể.

  </Accordion>

  <Accordion title="Xem trước luồng trực tiếp">
    OpenClaw có thể phát trực tiếp các bản nháp trả lời bằng cách gửi một tin nhắn tạm thời và chỉnh sửa nó khi văn bản đến.

    - `channels.discord.streaming` kiểm soát phát trực tiếp xem trước (`off` | `partial` | `block` | `progress`, mặc định: `off`).
    - `progress` được chấp nhận để đảm bảo tính nhất quán giữa các kênh và ánh xạ tới `partial` trên Discord.
    - `channels.discord.streamMode` là một bí danh cũ và được tự động di chuyển.
    - `partial` chỉnh sửa một tin nhắn xem trước duy nhất khi các token đến.
    - `block` phát ra các khối kích thước bản nháp (sử dụng `draftChunk` để điều chỉnh kích thước và điểm ngắt).

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

    Mặc định phân khối chế độ `block` (bị giới hạn bởi `channels.discord.textChunkLimit`):

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

    Phát trực tiếp xem trước chỉ có văn bản; phản hồi phương tiện quay lại giao hàng bình thường.

    Lưu ý: phát trực tiếp xem trước tách biệt với phát trực tiếp khối. Khi phát trực tiếp khối được kích hoạt rõ ràng cho Discord, OpenClaw bỏ qua phát trực tiếp xem trước để tránh phát trực tiếp kép.

  </Accordion>

  <Accordion title="Lịch sử, ngữ cảnh và hành vi chủ đề">
    Ngữ cảnh lịch sử guild:

    - `channels.discord.historyLimit` mặc định `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` vô hiệu hóa

    Kiểm soát lịch sử DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Hành vi chủ đề:

    - Chủ đề Discord được định tuyến như các phiên kênh
    - metadata chủ đề cha có thể được sử dụng cho liên kết phiên cha
    - cấu hình chủ đề thừa hưởng cấu hình kênh cha trừ khi có một mục cụ thể cho chủ đề

    Chủ đề kênh được tiêm như ngữ cảnh **không đáng tin cậy** (không phải là nhắc nhở hệ thống).

  </Accordion>

  <Accordion title="Phiên ràng buộc chủ đề cho các subagent">
    Discord có thể ràng buộc một chủ đề với một mục tiêu phiên để các tin nhắn tiếp theo trong chủ đề đó tiếp tục định tuyến đến cùng một phiên (bao gồm các phiên subagent).

    Lệnh:

    - `/focus <target>` ràng buộc chủ đề hiện tại/mới với một mục tiêu subagent/phiên
    - `/unfocus` loại bỏ ràng buộc chủ đề hiện tại
    - `/agents` hiển thị các lần chạy hoạt động và trạng thái ràng buộc
    - `/session idle <duration|off>` kiểm tra/cập nhật tự động bỏ ràng buộc không hoạt động cho các ràng buộc tập trung
    - `/session max-age <duration|off>` kiểm tra/cập nhật tuổi tối đa cứng cho các ràng buộc tập trung

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
    - `spawnSubagentSessions` phải là true để tự động tạo/ràng buộc chủ đề cho `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` phải là true để tự động tạo/ràng buộc chủ đề cho ACP (`/acp spawn ... --thread ...` hoặc `sessions_spawn({ runtime: "acp", thread: true })`).
    - Nếu ràng buộc chủ đề bị vô hiệu hóa cho một tài khoản, `/focus` và các hoạt động ràng buộc chủ đề liên quan không khả dụng.

    Xem [Sub-agents](/tools/subagents), [ACP Agents](/tools/acp-agents), và [Configuration Reference](/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Ràng buộc kênh ACP liên tục">
    Để có workspace ACP "luôn bật" ổn định, cấu hình ràng buộc ACP kiểu cấp cao nhất nhắm mục tiêu các cuộc trò chuyện Discord.

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

    - Tin nhắn chủ đề có thể thừa hưởng ràng buộc kênh cha ACP.
    - Trong một kênh hoặc chủ đề được ràng buộc, `/new` và `/reset` đặt lại cùng một phiên ACP tại chỗ.
    - Ràng buộc chủ đề tạm thời vẫn hoạt động và có thể ghi đè độ phân giải mục tiêu khi hoạt động.

    Xem [ACP Agents](/tools/acp-agents) để biết chi tiết hành vi ràng buộc.

  </Accordion>

  <Accordion title="Thông báo phản ứng">
    Chế độ thông báo phản ứng theo guild:

    - `off`
    - `own` (mặc định)
    - `all`
    - `allowlist` (sử dụng `guilds.<id>.users`)

    Các sự kiện phản ứng được chuyển thành sự kiện hệ thống và đính kèm vào phiên Discord được định tuyến.

  </Accordion>

  <Accordion title="Phản ứng Ack">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý một tin nhắn inbound.

    Thứ tự giải quyết:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback emoji danh tính agent (`agents.list[].identity.emoji`, nếu không có thì "👀")

    Ghi chú:

    - Discord chấp nhận emoji unicode hoặc tên emoji tùy chỉnh.
    - Sử dụng `""` để vô hiệu hóa phản ứng cho một kênh hoặc tài khoản.

  </Accordion>

  <Accordion title="Ghi cấu hình">
    Ghi cấu hình khởi tạo từ kênh được bật theo mặc định.

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

  <Accordion title="Proxy gateway">
    Định tuyến lưu lượng WebSocket gateway Discord và tra cứu REST khởi động (ID ứng dụng + giải quyết danh sách cho phép) thông qua một proxy HTTP(S) với `channels.discord.proxy`.

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
    Kích hoạt giải quyết PluralKit để ánh xạ các tin nhắn proxy đến danh tính thành viên hệ thống:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // tùy chọn; cần thiết cho các hệ thống riêng tư
      },
    },
  },
}
```

    Ghi chú:

    - danh sách cho phép có thể sử dụng `pk:<memberId>`
    - tên hiển thị thành viên được khớp theo tên/slug chỉ khi `channels.discord.dangerouslyAllowNameMatching: true`
    - tra cứu sử dụng ID tin nhắn gốc và bị giới hạn thời gian
    - nếu tra cứu thất bại, các tin nhắn proxy được coi là tin nhắn bot và bị loại trừ trừ khi `allowBots=true`

  </Accordion>

  <Accordion title="Cấu hình hiện diện">
    Cập nhật hiện diện được áp dụng khi bạn đặt một trường trạng thái hoặc hoạt động, hoặc khi bạn kích hoạt hiện diện tự động.

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

    Ví dụ phát trực tiếp:

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

    - 0: Chơi
    - 1: Phát trực tiếp (yêu cầu `activityUrl`)
    - 2: Nghe
    - 3: Xem
    - 4: Tùy chỉnh (sử dụng văn bản hoạt động làm trạng thái; emoji là tùy chọn)
    - 5: Cạnh tranh

    Ví dụ hiện diện tự động (tín hiệu sức khỏe runtime):

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

    Hiện diện tự động ánh xạ khả dụng runtime đến trạng thái Discord: khỏe mạnh => online, suy giảm hoặc không xác định => idle, cạn kiệt hoặc không khả dụng => dnd. Ghi đè văn bản tùy chọn:

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

    Khi `target` là `channel` hoặc `both`, lời nhắc phê duyệt hiển thị trong kênh. Chỉ những người phê duyệt được cấu hình mới có thể sử dụng các nút; người dùng khác nhận được từ chối tạm thời. Lời nhắc phê duyệt bao gồm văn bản lệnh, vì vậy chỉ bật giao hàng kênh trong các kênh đáng tin cậy. Nếu ID kênh không thể được suy ra từ khóa phiên, OpenClaw quay lại giao hàng DM.

    Xác thực gateway cho trình xử lý này sử dụng cùng hợp đồng giải quyết thông tin xác thực chia sẻ như các khách hàng Gateway khác:

    - xác thực cục bộ ưu tiên env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` sau đó `gateway.auth.*`)
    - trong chế độ cục bộ, `gateway.remote.*` có thể được sử dụng như fallback chỉ khi `gateway.auth.*` chưa được đặt; SecretRefs cục bộ được cấu hình nhưng không được giải quyết thất bại đóng
    - hỗ trợ chế độ từ xa qua `gateway.remote.*` khi áp dụng
    - ghi đè URL là an toàn ghi đè: ghi đè CLI không tái sử dụng thông tin xác thực ngầm định, và ghi đè env chỉ sử dụng thông tin xác thực env

    Nếu phê duyệt thất bại với ID phê duyệt không xác định, hãy xác minh danh sách người phê duyệt và tính năng được bật.

    Tài liệu liên quan: [Phê duyệt exec](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Công cụ và cổng hành động

Hành động tin nhắn Discord bao gồm nhắn tin, quản trị kênh, kiểm duyệt, hiện diện và hành động metadata.

Ví dụ cốt lõi:

- nhắn tin: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- phản ứng: `react`, `reactions`, `emojiList`
- kiểm duyệt: `timeout`, `kick`, `ban`
- hiện diện: `setPresence`

Cổng hành động sống dưới `channels.discord.actions.*`.

Hành vi cổng mặc định:

| Nhóm hành động                                                                                                                                                             | Mặc định  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| phản ứng, tin nhắn, chủ đề, ghim, thăm dò ý kiến, tìm kiếm, thông tin thành viên, thông tin vai trò, thông tin kênh, kênh, trạng thái giọng nói, sự kiện, nhãn dán, tải lên emoji, tải lên nhãn dán, quyền | bật  |
| vai trò                                                                                                                                                                    | tắt |
| kiểm duyệt                                                                                                                                                               | tắt |
| hiện diện                                                                                                                                                                 | tắt |

## Giao diện Components v2

OpenClaw sử dụng các thành phần v2 của Discord cho phê duyệt exec và đánh dấu chéo ngữ cảnh. Hành động tin nhắn Discord cũng có thể chấp nhận `components` cho giao diện tùy chỉnh (nâng cao; yêu cầu các instance thành phần Carbon), trong khi `embeds` cũ vẫn có sẵn nhưng không được khuyến nghị.

- `channels.discord.ui.components.accentColor` đặt màu nhấn được sử dụng bởi các container thành phần Discord (hex).
- Đặt theo tài khoản với `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` bị bỏ qua khi các thành phần v2 có mặt.

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

## Kênh giọng nói

OpenClaw có thể tham gia các kênh giọng nói Discord để trò chuyện liên tục, thời gian thực. Điều này tách biệt với các tệp đính kèm tin nhắn giọng nói.

Yêu cầu:

- Kích hoạt lệnh gốc (`commands.native` hoặc `channels.discord.commands.native`).
- Cấu hình `channels.discord.voice`.
- Bot cần quyền Kết nối + Nói trong kênh giọng nói mục tiêu.

Sử dụng lệnh gốc chỉ dành cho Discord `/vc join|leave|status` để kiểm soát các phiên. Lệnh sử dụng agent mặc định của tài khoản và tuân theo cùng danh sách cho phép và quy tắc chính sách nhóm như các lệnh Discord khác.

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

- `voice.tts` ghi đè `messages.tts` chỉ cho phát lại giọng nói.
- Bản ghi giọng nói xác định trạng thái chủ sở hữu từ Discord `allowFrom` (hoặc `dm.allowFrom`); người nói không phải chủ sở hữu không thể truy cập các công cụ chỉ dành cho chủ sở hữu (ví dụ: `gateway` và `cron`).
- Giọng nói được bật theo mặc định; đặt `channels.discord.voice.enabled=false` để vô hiệu hóa nó.
- `voice.daveEncryption` và `voice.decryptionFailureTolerance` truyền qua các tùy chọn tham gia `@discordjs/voice`.
- Mặc định của `@discordjs/voice` là `daveEncryption=true` và `decryptionFailureTolerance=24` nếu không được đặt.
- OpenClaw cũng theo dõi các lỗi giải mã nhận và tự động khôi phục bằng cách rời khỏi/tham gia lại kênh giọng nói sau khi gặp lỗi lặp lại trong một khoảng thời gian ngắn.
- Nếu nhật ký nhận liên tục hiển thị `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, đây có thể là lỗi nhận `@discordjs/voice` upstream được theo dõi trong [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Tin nhắn giọng nói

Tin nhắn giọng nói Discord hiển thị xem trước dạng sóng và yêu cầu âm thanh OGG/Opus cùng với metadata. OpenClaw tự động tạo dạng sóng, nhưng cần `ffmpeg` và `ffprobe` có sẵn trên máy chủ gateway để kiểm tra và chuyển đổi tệp âm thanh.

Yêu cầu và hạn chế:

- Cung cấp **đường dẫn tệp cục bộ** (URL bị từ chối).
- Bỏ qua nội dung văn bản (Discord không cho phép văn bản + tin nhắn giọng nói trong cùng một payload).
- Bất kỳ định dạng âm thanh nào đều được chấp nhận; OpenClaw chuyển đổi sang OGG/Opus khi cần.

Ví dụ:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Sử dụng các ý định không được phép hoặc bot không thấy tin nhắn guild">

    - kích hoạt Message Content Intent
    - kích hoạt Server Members Intent khi bạn phụ thuộc vào giải quyết người dùng/thành viên
    - khởi động lại gateway sau khi thay đổi ý định

  </Accordion>

  <Accordion title="Tin nhắn guild bị chặn không mong muốn">

    - xác minh `groupPolicy`
    - xác minh danh sách cho phép guild dưới `channels.discord.guilds`
    - nếu bản đồ `channels` guild tồn tại, chỉ các kênh được liệt kê mới được phép
    - xác minh hành vi `requireMention` và mẫu mention

    Kiểm tra hữu ích:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Yêu cầu mention sai nhưng vẫn bị chặn">
    Nguyên nhân phổ biến:

    - `groupPolicy="allowlist"` mà không có danh sách cho phép guild/kênh khớp
    - `requireMention` được cấu hình sai vị trí (phải nằm dưới `channels.discord.guilds` hoặc mục kênh)
    - người gửi bị chặn bởi danh sách cho phép `users` guild/kênh

  </Accordion>

  <Accordion title="Trình xử lý chạy lâu bị hết thời gian hoặc trùng lặp phản hồi">

    Nhật ký điển hình:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Nút ngân sách listener:

    - tài khoản đơn: `channels.discord.eventQueue.listenerTimeout`
    - đa tài khoản: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Nút thời gian chạy worker:

    - tài khoản đơn: `channels.discord.inboundWorker.runTimeoutMs`
    - đa tài khoản: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
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

    Sử dụng `eventQueue.listenerTimeout` cho thiết lập listener chậm và `inboundWorker.runTimeoutMs`
    chỉ nếu bạn muốn một van an toàn riêng cho các lượt agent xếp hàng.

  </Accordion>

  <Accordion title="Kiểm toán quyền không khớp">
    Kiểm tra quyền `channels status --probe` chỉ hoạt động cho ID kênh số.

    Nếu bạn sử dụng khóa slug, khớp runtime vẫn có thể hoạt động, nhưng kiểm tra không thể xác minh đầy đủ quyền.

  </Accordion>

  <Accordion title="Vấn đề DM và ghép nối">

    - DM bị vô hiệu hóa: `channels.discord.dm.enabled=false`
    - Chính sách DM bị vô hiệu hóa: `channels.discord.dmPolicy="disabled"` (cũ: `channels.discord.dm.policy`)
    - đang chờ phê duyệt ghép nối trong chế độ `pairing`

  </Accordion>

  <Accordion title="Vòng lặp bot-to-bot">
    Theo mặc định, các tin nhắn do bot tạo ra bị bỏ qua.

    Nếu bạn đặt `channels.discord.allowBots=true`, sử dụng các quy tắc mention và danh sách cho phép nghiêm ngặt để tránh hành vi vòng lặp.
    Ưu tiên `channels.discord.allowBots="mentions"` để chỉ chấp nhận các tin nhắn bot đề cập đến bot.

  </Accordion>

  <Accordion title="Giảm STT giọng nói với DecryptionFailed(...)">

    - giữ OpenClaw hiện tại (`openclaw update`) để logic khôi phục nhận giọng nói Discord có mặt
    - xác nhận `channels.discord.voice.daveEncryption=true` (mặc định)
    - bắt đầu từ `channels.discord.voice.decryptionFailureTolerance=24` (mặc định upstream) và điều chỉnh chỉ khi cần
    - theo dõi nhật ký cho:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - nếu lỗi tiếp tục sau khi tự động tham gia lại, thu thập nhật ký và so sánh với [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Tham chiếu cấu hình

Tham chiếu chính:

- [Tham chiếu cấu hình - Discord](/gateway/configuration-reference#discord)

Các trường Discord có tín hiệu cao:

- khởi động/xác thực: `enabled`, `token`, `accounts.*`, `allowBots`
- chính sách: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- lệnh: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- hàng đợi sự kiện: `eventQueue.listenerTimeout` (ngân sách listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker inbound: `inboundWorker.runTimeoutMs`
- trả lời/lịch sử: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- giao hàng: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- phát trực tiếp: `streaming` (bí danh cũ: `streamMode`), `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- phương tiện/lặp lại: `mediaMaxMb`, `retry`
  - `mediaMaxMb` giới hạn tải lên Discord outbound (mặc định: `8MB`)
- hành động: `actions.*`
- hiện diện: `activity`, `status`, `activityType`, `activityUrl`
- giao diện người dùng: `ui.components.accentColor`
- tính năng: `threadBindings`, `bindings[]` cấp cao nhất (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## An toàn và hoạt động

- Xem token bot như bí mật (`DISCORD_BOT_TOKEN` được ưu tiên trong môi trường giám sát).
- Cấp quyền Discord ít nhất.
- Nếu triển khai/trạng thái lệnh bị lỗi thời, khởi động lại gateway và kiểm tra lại với `openclaw channels status --probe`.

## Liên quan

- [Ghép nối](/channels/pairing)
- [Định tuyến kênh](/channels/channel-routing)
- [Định tuyến đa agent](/concepts/multi-agent)
- [Khắc phục sự cố](/channels/troubleshooting)
- [Lệnh Slash](/tools/slash-commands)
