---
summary: "Trạng thái hỗ trợ bot Telegram, khả năng và cấu hình"
read_when:
  - Làm việc với tính năng Telegram hoặc webhooks
title: "Telegram"
---

# Telegram (Bot API)

Trạng thái: sẵn sàng cho sản xuất với bot DMs + nhóm qua grammY. Long polling là chế độ mặc định; webhook là tùy chọn.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Chính sách DM mặc định cho Telegram là pairing.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    Chẩn đoán và sửa chữa đa kênh.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/gateway/configuration">
    Mẫu cấu hình kênh đầy đủ và ví dụ.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Steps>
  <Step title="Tạo bot token trong BotFather">
    Mở Telegram và chat với **@BotFather** (xác nhận handle chính xác là `@BotFather`).

    Chạy `/newbot`, làm theo hướng dẫn và lưu token.

  </Step>

  <Step title="Cấu hình token và chính sách DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Env fallback: `TELEGRAM_BOT_TOKEN=...` (chỉ tài khoản mặc định).
    Telegram không sử dụng `openclaw channels login telegram`; cấu hình token trong config/env, sau đó khởi động gateway.

  </Step>

  <Step title="Khởi động gateway và phê duyệt DM đầu tiên">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Mã pairing hết hạn sau 1 giờ.

  </Step>

  <Step title="Thêm bot vào nhóm">
    Thêm bot vào nhóm, sau đó thiết lập `channels.telegram.groups` và `groupPolicy` để phù hợp với mô hình truy cập.
  </Step>
</Steps>

<Note>
Thứ tự giải quyết token có nhận thức tài khoản. Trong thực tế, giá trị config thắng env fallback, và `TELEGRAM_BOT_TOKEN` chỉ áp dụng cho tài khoản mặc định.
</Note>

## Cài đặt phía Telegram

<AccordionGroup>
  <Accordion title="Chế độ riêng tư và khả năng hiển thị nhóm">
    Bot Telegram mặc định ở **Chế độ Riêng tư**, giới hạn các tin nhắn nhóm mà bot nhận được.

    Nếu bot cần thấy tất cả tin nhắn nhóm, có thể:

    - tắt chế độ riêng tư qua `/setprivacy`, hoặc
    - làm bot thành admin nhóm.

    Khi chuyển đổi chế độ riêng tư, hãy xóa + thêm lại bot vào từng nhóm để Telegram áp dụng thay đổi.

  </Accordion>

  <Accordion title="Quyền nhóm">
    Trạng thái admin được kiểm soát trong cài đặt nhóm Telegram.

    Bot admin nhận tất cả tin nhắn nhóm, hữu ích cho hành vi nhóm luôn bật.

  </Accordion>

  <Accordion title="Tùy chọn BotFather hữu ích">

    - `/setjoingroups` để cho phép/từ chối thêm nhóm
    - `/setprivacy` cho hành vi khả năng hiển thị nhóm

  </Accordion>
</AccordionGroup>

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách DM">
    `channels.telegram.dmPolicy` kiểm soát truy cập tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist` (yêu cầu ít nhất một sender ID trong `allowFrom`)
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` chấp nhận ID người dùng Telegram dạng số. Tiền tố `telegram:` / `tg:` được chấp nhận và chuẩn hóa.
    `dmPolicy: "allowlist"` với `allowFrom` trống chặn tất cả DMs và bị từ chối bởi xác thực cấu hình.
    Onboarding chấp nhận đầu vào `@username` và chuyển đổi nó thành ID số.
    Nếu đã nâng cấp và cấu hình chứa các mục allowlist `@username`, chạy `openclaw doctor --fix` để chuyển đổi chúng (cố gắng tốt nhất; yêu cầu bot token Telegram).
    Nếu trước đây dựa vào các tệp allowlist pairing-store, `openclaw doctor --fix` có thể khôi phục các mục vào `channels.telegram.allowFrom` trong các luồng allowlist (ví dụ khi `dmPolicy: "allowlist"` chưa có ID rõ ràng).

    Đối với bot một chủ sở hữu, ưu tiên `dmPolicy: "allowlist"` với các ID `allowFrom` số rõ ràng để giữ chính sách truy cập bền vững trong cấu hình (thay vì phụ thuộc vào các phê duyệt pairing trước đó).

    ### Tìm ID người dùng Telegram của bạn

    An toàn hơn (không dùng bot bên thứ ba):

    1. DM bot của bạn.
    2. Chạy `openclaw logs --follow`.
    3. Đọc `from.id`.

    Phương pháp API Bot chính thức:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Phương pháp bên thứ ba (ít riêng tư hơn): `@userinfobot` hoặc `@getidsbot`.

  </Tab>

  <Tab title="Chính sách nhóm và danh sách cho phép">
    Hai điều khiển áp dụng cùng nhau:

    1. **Những nhóm nào được phép** (`channels.telegram.groups`)
       - không có cấu hình `groups`:
         - với `groupPolicy: "open"`: bất kỳ nhóm nào cũng có thể vượt qua kiểm tra ID nhóm
         - với `groupPolicy: "allowlist"` (mặc định): các nhóm bị chặn cho đến khi bạn thêm các mục `groups` (hoặc `"*"`)
       - `groups` được cấu hình: hoạt động như danh sách cho phép (ID rõ ràng hoặc `"*"`)

    2. **Những người gửi nào được phép trong nhóm** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (mặc định)
       - `disabled`

    `groupAllowFrom` được sử dụng để lọc người gửi nhóm. Nếu không được đặt, Telegram sẽ quay lại `allowFrom`.
    Các mục `groupAllowFrom` nên là ID người dùng Telegram dạng số (`telegram:` / `tg:` tiền tố được chuẩn hóa).
    Không đặt ID nhóm hoặc siêu nhóm Telegram trong `groupAllowFrom`. Các ID chat âm thuộc về `channels.telegram.groups`.
    Các mục không phải số bị bỏ qua khi ủy quyền người gửi.
    Ranh giới bảo mật (`2026.2.25+`): xác thực người gửi nhóm **không** thừa kế các phê duyệt pairing-store DM.
    Pairing chỉ dành cho DM. Đối với nhóm, đặt `groupAllowFrom` hoặc `allowFrom` theo nhóm/chủ đề.
    Ghi chú runtime: nếu `channels.telegram` hoàn toàn thiếu, runtime mặc định là `groupPolicy="allowlist"` trừ khi `channels.defaults.groupPolicy` được đặt rõ ràng.

    Ví dụ: cho phép bất kỳ thành viên nào trong một nhóm cụ thể:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Ví dụ: chỉ cho phép người dùng cụ thể trong một nhóm cụ thể:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Sai lầm phổ biến: `groupAllowFrom` không phải là danh sách cho phép nhóm Telegram.

      - Đặt ID chat nhóm hoặc siêu nhóm Telegram âm như `-1001234567890` dưới `channels.telegram.groups`.
      - Đặt ID người dùng Telegram như `8734062810` dưới `groupAllowFrom` khi muốn giới hạn những người trong nhóm được phép kích hoạt bot.
      - Sử dụng `groupAllowFrom: ["*"]` chỉ khi muốn bất kỳ thành viên nào của nhóm được phép có thể nói chuyện với bot.
    </Warning>

  </Tab>

  <Tab title="Hành vi nhắc đến">
    Trả lời nhóm yêu cầu nhắc đến theo mặc định.

    Nhắc đến có thể đến từ:

    - nhắc đến `@botusername` gốc, hoặc
    - mẫu nhắc đến trong:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Chuyển đổi lệnh cấp phiên:

    - `/activation always`
    - `/activation mention`

    Những điều này chỉ cập nhật trạng thái phiên. Sử dụng cấu hình để duy trì.

    Ví dụ cấu hình duy trì:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Lấy ID chat nhóm:

    - chuyển tiếp tin nhắn nhóm đến `@userinfobot` / `@getidsbot`
    - hoặc đọc `chat.id` từ `openclaw logs --follow`
    - hoặc kiểm tra Bot API `getUpdates`

  </Tab>
</Tabs>

## Hành vi runtime

- Telegram thuộc sở hữu của quá trình gateway.
- Routing là xác định: Telegram inbound trả lời lại Telegram (mô hình không chọn kênh).
- Tin nhắn inbound được chuẩn hóa thành phong bì kênh chia sẻ với metadata trả lời và placeholder media.
- Phiên nhóm được cô lập theo ID nhóm. Chủ đề diễn đàn thêm `:topic:<threadId>` để giữ chủ đề cô lập.
- Tin nhắn DM có thể mang `message_thread_id`; OpenClaw định tuyến chúng với khóa phiên nhận thức chủ đề và bảo toàn ID chủ đề cho trả lời.
- Long polling sử dụng grammY runner với sequencing per-chat/per-thread. Tổng thể runner sink concurrency sử dụng `agents.defaults.maxConcurrent`.
- Telegram Bot API không hỗ trợ read-receipt (`sendReadReceipts` không áp dụng).

## Tham khảo tính năng

<AccordionGroup>
  <Accordion title="Xem trước luồng trực tiếp (chỉnh sửa tin nhắn)">
    OpenClaw có thể stream các trả lời một phần trong thời gian thực:

    - chat trực tiếp: xem trước tin nhắn + `editMessageText`
    - nhóm/chủ đề: xem trước tin nhắn + `editMessageText`

    Yêu cầu:

    - `channels.telegram.streaming` là `off | partial | block | progress` (mặc định: `partial`)
    - `progress` ánh xạ tới `partial` trên Telegram (tương thích với tên gọi đa kênh)
    - `channels.telegram.streamMode` kế thừa và các giá trị boolean `streaming` được tự động ánh xạ

    Đối với trả lời chỉ có văn bản:

    - DM: OpenClaw giữ cùng một tin nhắn xem trước và thực hiện chỉnh sửa cuối cùng tại chỗ (không có tin nhắn thứ hai)
    - nhóm/chủ đề: OpenClaw giữ cùng một tin nhắn xem trước và thực hiện chỉnh sửa cuối cùng tại chỗ (không có tin nhắn thứ hai)

    Đối với trả lời phức tạp (ví dụ payload media), OpenClaw quay lại việc giao hàng cuối cùng bình thường và sau đó dọn dẹp tin nhắn xem trước.

    Streaming xem trước tách biệt với streaming block. Khi streaming block được bật rõ ràng cho Telegram, OpenClaw bỏ qua stream xem trước để tránh double-streaming.

    Nếu transport draft gốc không khả dụng/bị từ chối, OpenClaw tự động quay lại `sendMessage` + `editMessageText`.

    Luồng lý luận chỉ dành cho Telegram:

    - `/reasoning stream` gửi lý luận đến xem trước trực tiếp trong khi tạo
    - câu trả lời cuối cùng được gửi mà không có văn bản lý luận

  </Accordion>

  <Accordion title="Định dạng và fallback HTML">
    Văn bản outbound sử dụng Telegram `parse_mode: "HTML"`.

    - Văn bản kiểu Markdown được render thành HTML an toàn cho Telegram.
    - HTML thô của mô hình được escape để giảm lỗi parse của Telegram.
    - Nếu Telegram từ chối HTML đã parse, OpenClaw thử lại dưới dạng văn bản thuần túy.

    Xem trước liên kết được bật theo mặc định và có thể tắt với `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Lệnh gốc và lệnh tùy chỉnh">
    Đăng ký menu lệnh Telegram được xử lý khi khởi động với `setMyCommands`.

    Mặc định lệnh gốc:

    - `commands.native: "auto"` bật lệnh gốc cho Telegram

    Thêm mục menu lệnh tùy chỉnh:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Quy tắc:

    - tên được chuẩn hóa (loại bỏ `/` đầu, chữ thường)
    - mẫu hợp lệ: `a-z`, `0-9`, `_`, độ dài `1..32`
    - lệnh tùy chỉnh không thể ghi đè lệnh gốc
    - xung đột/trùng lặp bị bỏ qua và ghi log

    Ghi chú:

    - lệnh tùy chỉnh chỉ là mục menu; chúng không tự động triển khai hành vi
    - lệnh plugin/skill vẫn có thể hoạt động khi gõ ngay cả khi không hiển thị trong menu Telegram

    Nếu lệnh gốc bị tắt, các lệnh tích hợp bị xóa. Lệnh tùy chỉnh/plugin vẫn có thể đăng ký nếu được cấu hình.

    Các lỗi thiết lập phổ biến:

    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` nghĩa là menu Telegram vẫn tràn sau khi cắt giảm; giảm lệnh plugin/skill/tùy chỉnh hoặc tắt `channels.telegram.commands.native`.
    - `setMyCommands failed` với lỗi mạng/fetch thường chỉ ra vấn đề DNS/HTTPS đến `api.telegram.org`.

    ### Lệnh ghép nối thiết bị (plugin `device-pair`)

    Khi plugin `device-pair` được cài đặt:

    1. `/pair` tạo mã thiết lập
    2. dán mã vào ứng dụng iOS
    3. `/pair pending` liệt kê các yêu cầu đang chờ xử lý (bao gồm vai trò/phạm vi)
    4. phê duyệt yêu cầu:
       - `/pair approve <requestId>` để phê duyệt rõ ràng
       - `/pair approve` khi chỉ có một yêu cầu đang chờ xử lý
       - `/pair approve latest` cho yêu cầu gần nhất

    Nếu một thiết bị thử lại với chi tiết xác thực đã thay đổi (ví dụ vai trò/phạm vi/khóa công khai), yêu cầu đang chờ xử lý trước đó bị thay thế và yêu cầu mới sử dụng `requestId` khác. Chạy lại `/pair pending` trước khi phê duyệt.

    Chi tiết thêm: [Pairing](/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Nút inline">
    Cấu hình phạm vi bàn phím inline:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Ghi đè theo tài khoản:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Phạm vi:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (mặc định)

    `capabilities: ["inlineButtons"]` kế thừa ánh xạ tới `inlineButtons: "all"`.

    Ví dụ hành động tin nhắn:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Nhấp callback được chuyển đến agent dưới dạng văn bản:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Hành động tin nhắn Telegram cho agent và tự động hóa">
    Hành động công cụ Telegram bao gồm:

    - `sendMessage` (`to`, `content`, tùy chọn `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, tùy chọn `iconColor`, `iconCustomEmojiId`)

    Hành động tin nhắn kênh cung cấp alias tiện dụng (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kiểm soát gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (mặc định: tắt)

    Ghi chú: `edit` và `topic-create` hiện được bật theo mặc định và không có các chuyển đổi `channels.telegram.actions.*` riêng.
    Gửi runtime sử dụng snapshot config/secret hiện tại (khởi động/tải lại), vì vậy các đường dẫn hành động không thực hiện giải quyết lại SecretRef ad-hoc cho mỗi lần gửi.

    Ngữ nghĩa loại bỏ phản ứng: [/tools/reactions](/tools/reactions)

  </Accordion>

  <Accordion title="Thẻ threading trả lời">
    Telegram hỗ trợ thẻ threading trả lời rõ ràng trong đầu ra được tạo:

    - `[[reply_to_current]]` trả lời tin nhắn kích hoạt
    - `[[reply_to:<id>]]` trả lời một ID tin nhắn Telegram cụ thể

    `channels.telegram.replyToMode` kiểm soát xử lý:

    - `off` (mặc định)
    - `first`
    - `all`

    Ghi chú: `off` vô hiệu hóa threading trả lời ngầm định. Thẻ `[[reply_to_*]]` rõ ràng vẫn được tôn trọng.

  </Accordion>

  <Accordion title="Chủ đề diễn đàn và hành vi thread">
    Siêu nhóm diễn đàn:

    - khóa phiên chủ đề thêm `:topic:<threadId>`
    - trả lời và gõ nhắm mục tiêu thread chủ đề
    - đường dẫn cấu hình chủ đề:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Trường hợp đặc biệt chủ đề chung (`threadId=1`):

    - gửi tin nhắn bỏ qua `message_thread_id` (Telegram từ chối `sendMessage(...thread_id=1)`)
    - hành động gõ vẫn bao gồm `message_thread_id`

    Thừa kế chủ đề: các mục chủ đề thừa kế cài đặt nhóm trừ khi bị ghi đè (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` chỉ dành cho chủ đề và không thừa kế từ mặc định nhóm.

    **Định tuyến agent theo chủ đề**: Mỗi chủ đề có thể định tuyến đến một agent khác nhau bằng cách đặt `agentId` trong cấu hình chủ đề. Điều này cho phép mỗi chủ đề có workspace, bộ nhớ và phiên riêng biệt. Ví dụ:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Chủ đề chung → agent chính
                "3": { agentId: "zu" },        // Chủ đề Dev → agent zu
                "5": { agentId: "coder" }      // Đánh giá mã → agent coder
              }
            }
          }
        }
      }
    }
    ```

    Mỗi chủ đề sau đó có khóa phiên riêng: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Ràng buộc ACP chủ đề bền vững**: Các chủ đề diễn đàn có thể ghim các phiên harness ACP thông qua các ràng buộc ACP kiểu top-level:

    - `bindings[]` với `type: "acp"` và `match.channel: "telegram"`

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
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Điều này hiện được giới hạn cho các chủ đề diễn đàn trong nhóm và siêu nhóm.

    **Khởi tạo ACP theo thread từ chat**:

    - `/acp spawn <agent> --thread here|auto` có thể ràng buộc chủ đề Telegram hiện tại vào một phiên ACP mới.
    - Các tin nhắn chủ đề tiếp theo định tuyến trực tiếp đến phiên ACP đã ràng buộc (không cần `/acp steer`).
    - OpenClaw ghim tin nhắn xác nhận spawn trong chủ đề sau khi ràng buộc thành công.
    - Yêu cầu `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Ngữ cảnh template bao gồm:

    - `MessageThreadId`
    - `IsForum`

    Hành vi thread DM:

    - chat riêng với `message_thread_id` giữ định tuyến DM nhưng sử dụng khóa phiên nhận thức thread/mục tiêu trả lời.

  </Accordion>

  <Accordion title="Âm thanh, video và sticker">
    ### Tin nhắn âm thanh

    Telegram phân biệt giữa ghi chú giọng nói và tệp âm thanh.

    - mặc định: hành vi tệp âm thanh
    - thẻ `[[audio_as_voice]]` trong trả lời agent để gửi ghi chú giọng nói

    Ví dụ hành động tin nhắn:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Tin nhắn video

    Telegram phân biệt giữa tệp video và ghi chú video.

    Ví dụ hành động tin nhắn:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Ghi chú video không hỗ trợ chú thích; văn bản tin nhắn được gửi riêng.

    ### Sticker

    Xử lý sticker inbound:

    - WEBP tĩnh: tải xuống và xử lý (placeholder `<media:sticker>`)
    - TGS động: bỏ qua
    - WEBM video: bỏ qua

    Trường ngữ cảnh sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Tệp cache sticker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Sticker được mô tả một lần (khi có thể) và được cache để giảm các cuộc gọi vision lặp lại.

    Bật hành động sticker:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Hành động gửi sticker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Tìm kiếm sticker đã cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Thông báo phản ứng">
    Phản ứng Telegram đến dưới dạng cập nhật `message_reaction` (tách biệt với payload tin nhắn).

    Khi được bật, OpenClaw xếp hàng các sự kiện hệ thống như:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Cấu hình:

    - `channels.telegram.reactionNotifications`: `off | own | all` (mặc định: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (mặc định: `minimal`)

    Ghi chú:

    - `own` nghĩa là phản ứng của người dùng đối với tin nhắn do bot gửi chỉ (cố gắng tốt nhất qua cache tin nhắn đã gửi).
    - Các sự kiện phản ứng vẫn tôn trọng kiểm soát truy cập Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); người gửi không được ủy quyền bị loại bỏ.
    - Telegram không cung cấp ID thread trong cập nhật phản ứng.
      - nhóm không phải diễn đàn định tuyến đến phiên chat nhóm
      - nhóm diễn đàn định tuyến đến phiên chủ đề chung của nhóm (`:topic:1`), không phải chủ đề gốc chính xác

    `allowed_updates` cho polling/webhook bao gồm `message_reaction` tự động.

  </Accordion>

  <Accordion title="Phản ứng Ack">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý một tin nhắn inbound.

    Thứ tự giải quyết:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback emoji nhận dạng agent (`agents.list[].identity.emoji`, nếu không có thì "👀")

    Ghi chú:

    - Telegram mong đợi emoji unicode (ví dụ "👀").
    - Sử dụng `""` để tắt phản ứng cho một kênh hoặc tài khoản.

  </Accordion>

  <Accordion title="Ghi cấu hình từ sự kiện và lệnh Telegram">
    Ghi cấu hình kênh được bật theo mặc định (`configWrites !== false`).

    Các ghi từ Telegram bao gồm:

    - sự kiện di chuyển nhóm (`migrate_to_chat_id`) để cập nhật `channels.telegram.groups`
    - `/config set` và `/config unset` (yêu cầu bật lệnh)

    Tắt:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling vs webhook">
    Mặc định: long polling.

    Chế độ webhook:

    - đặt `channels.telegram.webhookUrl`
    - đặt `channels.telegram.webhookSecret` (bắt buộc khi URL webhook được đặt)
    - tùy chọn `channels.telegram.webhookPath` (mặc định `/telegram-webhook`)
    - tùy chọn `channels.telegram.webhookHost` (mặc định `127.0.0.1`)
    - tùy chọn `channels.telegram.webhookPort` (mặc định `8787`)

    Listener local mặc định cho chế độ webhook gắn vào `127.0.0.1:8787`.

    Nếu endpoint công khai của bạn khác, đặt một reverse proxy phía trước và trỏ `webhookUrl` vào URL công khai.
    Đặt `webhookHost` (ví dụ `0.0.0.0`) khi bạn cố ý cần ingress bên ngoài.

  </Accordion>

  <Accordion title="Giới hạn, retry và mục tiêu CLI">
    - `channels.telegram.textChunkLimit` mặc định là 4000.
    - `channels.telegram.chunkMode="newline"` ưu tiên ranh giới đoạn văn (dòng trống) trước khi chia độ dài.
    - `channels.telegram.mediaMaxMb` (mặc định 100) giới hạn kích thước media Telegram inbound và outbound.
    - `channels.telegram.timeoutSeconds` ghi đè timeout client API Telegram (nếu không đặt, mặc định grammY áp dụng).
    - lịch sử ngữ cảnh nhóm sử dụng `channels.telegram.historyLimit` hoặc `messages.groupChat.historyLimit` (mặc định 50); `0` vô hiệu hóa.
    - kiểm soát lịch sử DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - cấu hình `channels.telegram.retry` áp dụng cho các trợ giúp gửi Telegram (CLI/tools/actions) cho các lỗi API outbound có thể khôi phục.

    Mục tiêu gửi CLI có thể là ID chat số hoặc username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Polls Telegram sử dụng `openclaw message poll` và hỗ trợ chủ đề diễn đàn:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Cờ poll chỉ dành cho Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` cho chủ đề diễn đàn (hoặc sử dụng mục tiêu `:topic:`)

    Gửi Telegram cũng hỗ trợ:

    - `--buttons` cho bàn phím inline khi `channels.telegram.capabilities.inlineButtons` cho phép
    - `--force-document` để gửi hình ảnh và GIF outbound dưới dạng tài liệu thay vì tải lên ảnh nén hoặc media động

    Kiểm soát hành động:

    - `channels.telegram.actions.sendMessage=false` vô hiệu hóa tin nhắn Telegram outbound, bao gồm polls
    - `channels.telegram.actions.poll=false` vô hiệu hóa tạo poll Telegram trong khi vẫn để gửi thông thường

  </Accordion>

  <Accordion title="Phê duyệt exec trong Telegram">
    Telegram hỗ trợ phê duyệt exec trong DMs của người phê duyệt và có thể tùy chọn đăng lời nhắc phê duyệt trong chat hoặc chủ đề gốc.

    Đường dẫn cấu hình:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers`
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
    - `agentFilter`, `sessionFilter`

    Người phê duyệt phải là ID người dùng Telegram dạng số. Khi `enabled` là false hoặc `approvers` trống, Telegram không hoạt động như một client phê duyệt exec. Yêu cầu phê duyệt quay lại các tuyến phê duyệt khác được cấu hình hoặc chính sách fallback phê duyệt exec.

    Quy tắc giao hàng:

    - `target: "dm"` chỉ gửi lời nhắc phê duyệt đến DMs của người phê duyệt được cấu hình
    - `target: "channel"` gửi lời nhắc trở lại chat/chủ đề Telegram gốc
    - `target: "both"` gửi đến DMs của người phê duyệt và chat/chủ đề gốc

    Chỉ người phê duyệt được cấu hình mới có thể phê duyệt hoặc từ chối. Người không phải người phê duyệt không thể sử dụng `/approve` và không thể sử dụng nút phê duyệt Telegram.

    Giao hàng kênh hiển thị văn bản lệnh trong chat, vì vậy chỉ bật `channel` hoặc `both` trong các nhóm/chủ đề đáng tin cậy. Khi lời nhắc hạ cánh trong một chủ đề diễn đàn, OpenClaw bảo toàn chủ đề cho cả lời nhắc phê duyệt và theo dõi sau phê duyệt.

    Các nút phê duyệt inline cũng phụ thuộc vào `channels.telegram.capabilities.inlineButtons` cho phép bề mặt mục tiêu (`dm`, `group`, hoặc `all`).

    Tài liệu liên quan: [Phê duyệt exec](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Bot không phản hồi tin nhắn nhóm không nhắc đến">

    - Nếu `requireMention=false`, chế độ riêng tư Telegram phải cho phép khả năng hiển thị đầy đủ.
      - BotFather: `/setprivacy` -> Disable
      - sau đó xóa + thêm lại bot vào nhóm
    - `openclaw channels status` cảnh báo khi cấu hình mong đợi tin nhắn nhóm không nhắc đến.
    - `openclaw channels status --probe` có thể kiểm tra ID nhóm số rõ ràng; wildcard `"*"` không thể được kiểm tra thành viên.
    - kiểm tra phiên nhanh: `/activation always`.

  </Accordion>

  <Accordion title="Bot không thấy tin nhắn nhóm nào cả">

    - khi `channels.telegram.groups` tồn tại, nhóm phải được liệt kê (hoặc bao gồm `"*"`)
    - xác minh thành viên bot trong nhóm
    - xem lại log: `openclaw logs --follow` để biết lý do bỏ qua

  </Accordion>

  <Accordion title="Lệnh hoạt động một phần hoặc không hoạt động">

    - ủy quyền danh tính người gửi của bạn (pairing và/hoặc `allowFrom` số)
    - ủy quyền lệnh vẫn áp dụng ngay cả khi chính sách nhóm là `open`
    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` nghĩa là menu gốc có quá nhiều mục; giảm lệnh plugin/skill/tùy chỉnh hoặc tắt menu gốc
    - `setMyCommands failed` với lỗi mạng/fetch thường chỉ ra vấn đề DNS/HTTPS đến `api.telegram.org`

  </Accordion>

  <Accordion title="Polling hoặc không ổn định mạng">

    - Node 22+ + fetch/proxy tùy chỉnh có thể kích hoạt hành vi hủy bỏ ngay lập tức nếu các loại AbortSignal không khớp.
    - Một số host giải quyết `api.telegram.org` thành IPv6 trước; egress IPv6 bị hỏng có thể gây ra lỗi API Telegram không liên tục.
    - Nếu log bao gồm `TypeError: fetch failed` hoặc `Network request for 'getUpdates' failed!`, OpenClaw hiện thử lại những lỗi này như lỗi mạng có thể khôi phục.
    - Trên các host VPS với egress/TLS trực tiếp không ổn định, định tuyến các cuộc gọi API Telegram qua `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ mặc định `autoSelectFamily=true` (trừ WSL2) và `dnsResultOrder=ipv4first`.
    - Nếu host của bạn là WSL2 hoặc hoạt động tốt hơn với hành vi chỉ IPv4, buộc chọn family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Ghi đè môi trường (tạm thời):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Xác thực câu trả lời DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Thêm trợ giúp: [Channel troubleshooting](/channels/troubleshooting).

## Tham khảo cấu hình Telegram

Tham khảo chính:

- `channels.telegram.enabled`: bật/tắt khởi động kênh.
- `channels.telegram.botToken`: bot token (BotFather).
- `channels.telegram.tokenFile`: đọc token từ đường dẫn tệp thông thường. Symlinks bị từ chối.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing).
- `channels.telegram.allowFrom`: danh sách cho phép DM (ID người dùng Telegram dạng số). `allowlist` yêu cầu ít nhất một sender ID. `open` yêu cầu `"*"`. `openclaw doctor --fix` có thể chuyển đổi các mục `@username` kế thừa thành ID và có thể khôi phục các mục allowlist từ các tệp pairing-store trong các luồng di chuyển allowlist.
- `channels.telegram.actions.poll`: bật hoặc tắt tạo poll Telegram (mặc định: bật; vẫn yêu cầu `sendMessage`).
- `channels.telegram.defaultTo`: mục tiêu Telegram mặc định được sử dụng bởi CLI `--deliver` khi không có `--reply-to` rõ ràng.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (mặc định: allowlist).
- `channels.telegram.groupAllowFrom`: danh sách cho phép người gửi nhóm (ID người dùng Telegram dạng số). `openclaw doctor --fix` có thể chuyển đổi các mục `@username` kế thừa thành ID. Các mục không phải số bị bỏ qua khi ủy quyền. Xác thực nhóm không sử dụng fallback pairing-store DM (`2026.2.25+`).
- Tiền lệ nhiều tài khoản:
  - Khi hai hoặc nhiều ID tài khoản được cấu hình, đặt `channels.telegram.defaultAccount` (hoặc bao gồm `channels.telegram.accounts.default`) để làm rõ định tuyến mặc định.
  - Nếu không có cái nào được đặt, OpenClaw quay lại ID tài khoản đầu tiên đã chuẩn hóa và `openclaw doctor` cảnh báo.
  - `channels.telegram.accounts.default.allowFrom` và `channels.telegram.accounts.default.groupAllowFrom` chỉ áp dụng cho tài khoản `default`.
  - Các tài khoản được đặt tên thừa kế `channels.telegram.allowFrom` và `channels.telegram.groupAllowFrom` khi các giá trị cấp tài khoản không được đặt.
  - Các tài khoản được đặt tên không thừa kế `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: mặc định theo nhóm + danh sách cho phép (sử dụng `"*"` cho mặc định toàn cầu).
  - `channels.telegram.groups.<id>.groupPolicy`: ghi đè theo nhóm cho groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: mặc định gating nhắc đến.
  - `channels.telegram.groups.<id>.skills`: bộ lọc kỹ năng (bỏ qua = tất cả kỹ năng, trống = không có).
  - `channels.telegram.groups.<id>.allowFrom`: ghi đè danh sách cho phép người gửi theo nhóm.
  - `channels.telegram.groups.<id>.systemPrompt`: nhắc hệ thống bổ sung cho nhóm.
  - `channels.telegram.groups.<id>.enabled`: vô hiệu hóa nhóm khi `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: ghi đè theo chủ đề (trường nhóm + chỉ chủ đề `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: định tuyến chủ đề này đến một agent cụ thể (ghi đè định tuyến cấp nhóm và ràng buộc).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: ghi đè theo chủ đề cho groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: ghi đè gating nhắc đến theo chủ đề.
- `bindings[]` cấp cao nhất với `type: "acp"` và id chủ đề chuẩn `chatId:topic:topicId` trong `match.peer.id`: trường ràng buộc ACP chủ đề bền vững (xem [ACP Agents](/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: định tuyến chủ đề DM đến một agent cụ thể (hành vi tương tự như chủ đề diễn đàn).
- `channels.telegram.execApprovals.enabled`: bật Telegram làm client phê duyệt exec dựa trên chat cho tài khoản này.
- `channels.telegram.execApprovals.approvers`: ID người dùng Telegram được phép phê duyệt hoặc từ chối yêu cầu exec. Bắt buộc khi phê duyệt exec được bật.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (mặc định: `dm`). `channel` và `both` bảo toàn chủ đề Telegram gốc khi có.
- `channels.telegram.execApprovals.agentFilter`: bộ lọc ID agent tùy chọn cho các lời nhắc phê duyệt được chuyển tiếp.
- `channels.telegram.execApprovals.sessionFilter`: bộ lọc khóa phiên tùy chọn (chuỗi con hoặc regex) cho các lời nhắc phê duyệt được chuyển tiếp.
- `channels.telegram.accounts.<account>.execApprovals`: ghi đè theo tài khoản cho định tuyến phê duyệt exec Telegram và ủy quyền người phê duyệt.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (mặc định: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: ghi đè theo tài khoản.
- `channels.telegram.commands.nativeSkills`: bật/tắt lệnh kỹ năng gốc Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (mặc định: `off`).
- `channels.telegram.textChunkLimit`: kích thước chunk outbound (ký tự).
- `channels.telegram.chunkMode`: `length` (mặc định) hoặc `newline` để chia trên dòng trống (ranh giới đoạn văn) trước khi chunk độ dài.
- `channels.telegram.linkPreview`: bật/tắt xem trước liên kết cho tin nhắn outbound (mặc định: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (xem trước luồng trực tiếp; mặc định: `partial`; `progress` ánh xạ tới `partial`; `block` là chế độ tương thích xem trước kế thừa). Streaming xem trước Telegram sử dụng một tin nhắn xem trước duy nhất được chỉnh sửa tại chỗ.
- `channels.telegram.mediaMaxMb`: giới hạn media Telegram inbound/outbound (MB, mặc định: 100).
- `channels.telegram.retry`: chính sách retry cho các trợ giúp gửi Telegram (CLI/tools/actions) trên các lỗi API outbound có thể khôi phục (attempts, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: ghi đè Node autoSelectFamily (true=bật, false=tắt). Mặc định là bật trên Node 22+, với WSL2 mặc định là tắt.
- `channels.telegram.network.dnsResultOrder`: ghi đè thứ tự kết quả DNS (`ipv4first` hoặc `verbatim`). Mặc định là `ipv4first` trên Node 22+.
- `channels.telegram.proxy`: URL proxy cho các cuộc gọi Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: bật chế độ webhook (yêu cầu `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: secret webhook (bắt buộc khi webhookUrl được đặt).
- `channels.telegram.webhookPath`: đường dẫn webhook local (mặc định `/telegram-webhook`).
- `channels.telegram.webhookHost`: host bind webhook local (mặc định `127.0.0.1`).
- `channels.telegram.webhookPort`: cổng bind webhook local (mặc định `8787`).
- `channels.telegram.actions.reactions`: kiểm soát phản ứng công cụ Telegram.
- `channels.telegram.actions.sendMessage`: kiểm soát gửi tin nhắn công cụ Telegram.
- `channels.telegram.actions.deleteMessage`: kiểm soát xóa tin nhắn công cụ Telegram.
- `channels.telegram.actions.sticker`: kiểm soát hành động sticker Telegram — gửi và tìm kiếm (mặc định: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — kiểm soát phản ứng nào kích hoạt sự kiện hệ thống (mặc định: `own` khi không được đặt).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — kiểm soát khả năng phản ứng của agent (mặc định: `minimal` khi không được đặt).

- [Tham khảo cấu hình - Telegram](/gateway/configuration-reference#telegram)

Các trường tín hiệu cao cụ thể cho Telegram:

- khởi động/xác thực: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` phải trỏ đến một tệp thông thường; symlinks bị từ chối)
- kiểm soát truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` cấp cao nhất (`type: "acp"`)
- phê duyệt exec: `execApprovals`, `accounts.*.execApprovals`
- lệnh/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/trả lời: `replyToMode`
- streaming: `streaming` (xem trước), `blockStreaming`
- định dạng/giao hàng: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/mạng: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- hành động/khả năng: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- phản ứng: `reactionNotifications`, `reactionLevel`
- ghi/lịch sử: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Liên quan

- [Pairing](/channels/pairing)
- [Channel routing](/channels/channel-routing)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)\n