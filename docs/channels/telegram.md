---
summary: "Trạng thái hỗ trợ bot Telegram, khả năng và cấu hình"
read_when:
  - Làm việc với các tính năng hoặc webhook của Telegram
title: "Telegram"
---

# Telegram (Bot API)

Trạng thái: sẵn sàng cho sản xuất với tin nhắn trực tiếp (DM) và nhóm qua grammY. Chế độ long polling là mặc định; chế độ webhook là tùy chọn.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/channels/pairing">
    Chính sách DM mặc định cho Telegram là ghép nối.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/channels/troubleshooting">
    Chẩn đoán và hướng dẫn sửa chữa đa kênh.
  </Card>
  <Card title="Cấu hình Gateway" icon="settings" href="/gateway/configuration">
    Mẫu cấu hình kênh đầy đủ và ví dụ.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Steps>
  <Step title="Tạo token bot trong BotFather">
    Mở Telegram và trò chuyện với **@BotFather** (xác nhận tên chính xác là `@BotFather`).

    Chạy lệnh `/newbot`, làm theo hướng dẫn và lưu token.

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

    Dự phòng môi trường: `TELEGRAM_BOT_TOKEN=...` (chỉ tài khoản mặc định).
    Telegram **không** sử dụng `openclaw channels login telegram`; cấu hình token trong config/env, sau đó khởi động gateway.

  </Step>

  <Step title="Khởi động gateway và phê duyệt DM đầu tiên">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Mã ghép nối hết hạn sau 1 giờ.

  </Step>

  <Step title="Thêm bot vào nhóm">
    Thêm bot vào nhóm của bạn, sau đó thiết lập `channels.telegram.groups` và `groupPolicy` để phù hợp với mô hình truy cập của bạn.
  </Step>
</Steps>

<Note>
Thứ tự giải quyết token có nhận thức về tài khoản. Trong thực tế, giá trị cấu hình sẽ ưu tiên hơn dự phòng môi trường, và `TELEGRAM_BOT_TOKEN` chỉ áp dụng cho tài khoản mặc định.
</Note>

## Cài đặt phía Telegram

<AccordionGroup>
  <Accordion title="Chế độ riêng tư và khả năng hiển thị nhóm">
    Bot Telegram mặc định ở **Chế độ Riêng tư**, giới hạn các tin nhắn nhóm mà chúng nhận được.

    Nếu bot cần thấy tất cả tin nhắn nhóm, bạn có thể:

    - tắt chế độ riêng tư qua `/setprivacy`, hoặc
    - làm cho bot trở thành quản trị viên nhóm.

    Khi thay đổi chế độ riêng tư, hãy xóa và thêm lại bot vào từng nhóm để Telegram áp dụng thay đổi.

  </Accordion>

  <Accordion title="Quyền nhóm">
    Trạng thái quản trị viên được kiểm soát trong cài đặt nhóm Telegram.

    Bot quản trị viên nhận được tất cả tin nhắn nhóm, hữu ích cho hành vi nhóm luôn bật.

  </Accordion>

  <Accordion title="Các tùy chọn hữu ích của BotFather">

    - `/setjoingroups` để cho phép/từ chối thêm vào nhóm
    - `/setprivacy` cho hành vi hiển thị nhóm

  </Accordion>
</AccordionGroup>

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách DM">
    `channels.telegram.dmPolicy` kiểm soát truy cập tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist` (yêu cầu ít nhất một ID người gửi trong `allowFrom`)
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` chấp nhận ID người dùng Telegram dạng số. Tiền tố `telegram:` / `tg:` được chấp nhận và chuẩn hóa.
    `dmPolicy: "allowlist"` với `allowFrom` trống sẽ chặn tất cả DM và bị từ chối bởi xác thực cấu hình.
    Quá trình onboarding chấp nhận đầu vào `@username` và chuyển đổi nó thành ID số.
    Nếu bạn đã nâng cấp và cấu hình của bạn chứa các mục allowlist `@username`, hãy chạy `openclaw doctor --fix` để chuyển đổi chúng (nỗ lực tốt nhất; yêu cầu token bot Telegram).
    Nếu trước đây bạn dựa vào các tệp allowlist trong pairing-store, `openclaw doctor --fix` có thể khôi phục các mục vào `channels.telegram.allowFrom` trong các luồng allowlist (ví dụ khi `dmPolicy: "allowlist"` chưa có ID rõ ràng).

    Đối với bot chỉ có một chủ sở hữu, nên sử dụng `dmPolicy: "allowlist"` với các ID `allowFrom` dạng số rõ ràng để giữ chính sách truy cập bền vững trong cấu hình (thay vì phụ thuộc vào các phê duyệt ghép nối trước đó).

    ### Tìm ID người dùng Telegram của bạn

    An toàn hơn (không cần bot bên thứ ba):

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

    `groupAllowFrom` được sử dụng để lọc người gửi trong nhóm. Nếu không được thiết lập, Telegram sẽ quay lại `allowFrom`.
    Các mục `groupAllowFrom` nên là ID người dùng Telegram dạng số (tiền tố `telegram:` / `tg:` được chuẩn hóa).
    Không đặt ID chat nhóm hoặc siêu nhóm Telegram trong `groupAllowFrom`. Các ID chat âm thuộc về `channels.telegram.groups`.
    Các mục không phải số bị bỏ qua khi xác thực người gửi.
    Ranh giới bảo mật (`2026.2.25+`): xác thực người gửi nhóm **không** thừa kế các phê duyệt trong pairing-store DM.
    Ghép nối chỉ áp dụng cho DM. Đối với nhóm, thiết lập `groupAllowFrom` hoặc `allowFrom` cho từng nhóm/chủ đề.
    Lưu ý khi chạy: nếu `channels.telegram` hoàn toàn thiếu, mặc định khi chạy sẽ là `groupPolicy="allowlist"` trừ khi `channels.defaults.groupPolicy` được thiết lập rõ ràng.

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
      Lỗi phổ biến: `groupAllowFrom` không phải là danh sách cho phép nhóm Telegram.

      - Đặt ID chat nhóm hoặc siêu nhóm Telegram âm như `-1001234567890` dưới `channels.telegram.groups`.
      - Đặt ID người dùng Telegram như `8734062810` dưới `groupAllowFrom` khi bạn muốn giới hạn những người trong nhóm được phép kích hoạt bot.
      - Sử dụng `groupAllowFrom: ["*"]` chỉ khi bạn muốn bất kỳ thành viên nào của nhóm được phép có thể nói chuyện với bot.
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

    Những lệnh này chỉ cập nhật trạng thái phiên. Sử dụng cấu hình để duy trì.

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

    - chuyển tiếp một tin nhắn nhóm đến `@userinfobot` / `@getidsbot`
    - hoặc đọc `chat.id` từ `openclaw logs --follow`
    - hoặc kiểm tra Bot API `getUpdates`

  </Tab>
</Tabs>

## Hành vi khi chạy

- Telegram được sở hữu bởi quá trình gateway.
- Định tuyến là xác định: Telegram nhận tin nhắn trả lời lại Telegram (mô hình không chọn kênh).
- Tin nhắn đến được chuẩn hóa thành phong bì kênh chia sẻ với siêu dữ liệu trả lời và chỗ giữ chỗ phương tiện.
- Phiên nhóm được cách ly theo ID nhóm. Các chủ đề diễn đàn thêm `:topic:<threadId>` để giữ các chủ đề cách ly.
- Tin nhắn DM có thể mang `message_thread_id`; OpenClaw định tuyến chúng với khóa phiên nhận thức chủ đề và bảo toàn ID chủ đề cho các câu trả lời.
- Long polling sử dụng grammY runner với trình tự theo chat/chủ đề. Tổng thể runner sink concurrency sử dụng `agents.defaults.maxConcurrent`.
- Telegram Bot API không hỗ trợ xác nhận đã đọc (`sendReadReceipts` không áp dụng).

## Tham khảo tính năng

<AccordionGroup>
  <Accordion title="Xem trước luồng trực tiếp (chỉnh sửa tin nhắn)">
    OpenClaw có thể phát trực tiếp các câu trả lời một phần theo thời gian thực:

    - trò chuyện trực tiếp: xem trước tin nhắn + `editMessageText`
    - nhóm/chủ đề: xem trước tin nhắn + `editMessageText`

    Yêu cầu:

    - `channels.telegram.streaming` là `off | partial | block | progress` (mặc định: `partial`)
    - `progress` ánh xạ tới `partial` trên Telegram (tương thích với tên gọi đa kênh)
    - `channels.telegram.streamMode` cũ và các giá trị boolean `streaming` được ánh xạ tự động

    Đối với các câu trả lời chỉ có văn bản:

    - DM: OpenClaw giữ cùng một tin nhắn xem trước và thực hiện chỉnh sửa cuối cùng tại chỗ (không có tin nhắn thứ hai)
    - nhóm/chủ đề: OpenClaw giữ cùng một tin nhắn xem trước và thực hiện chỉnh sửa cuối cùng tại chỗ (không có tin nhắn thứ hai)

    Đối với các câu trả lời phức tạp (ví dụ như tải trọng phương tiện), OpenClaw quay lại việc giao hàng cuối cùng bình thường và sau đó dọn dẹp tin nhắn xem trước.

    Phát trực tiếp xem trước tách biệt với phát trực tiếp khối. Khi phát trực tiếp khối được bật rõ ràng cho Telegram, OpenClaw bỏ qua phát trực tiếp xem trước để tránh phát trực tiếp kép.

    Nếu vận chuyển bản nháp gốc không khả dụng/bị từ chối, OpenClaw tự động quay lại `sendMessage` + `editMessageText`.

    Luồng lý luận chỉ dành cho Telegram:

    - `/reasoning stream` gửi lý luận đến bản xem trước trực tiếp trong khi tạo
    - câu trả lời cuối cùng được gửi mà không có văn bản lý luận

  </Accordion>

  <Accordion title="Định dạng và dự phòng HTML">
    Văn bản gửi đi sử dụng `parse_mode: "HTML"` của Telegram.

    - Văn bản giống Markdown được hiển thị thành HTML an toàn với Telegram.
    - HTML thô của mô hình được thoát để giảm lỗi phân tích cú pháp của Telegram.
    - Nếu Telegram từ chối HTML đã phân tích, OpenClaw thử lại dưới dạng văn bản thuần túy.

    Xem trước liên kết được bật theo mặc định và có thể bị tắt với `channels.telegram.linkPreview: false`.

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
        { command: "generate", description: "Tạo một hình ảnh" },
      ],
    },
  },
}
```

    Quy tắc:

    - tên được chuẩn hóa (bỏ dấu `/` đầu, viết thường)
    - mẫu hợp lệ: `a-z`, `0-9`, `_`, độ dài `1..32`
    - lệnh tùy chỉnh không thể ghi đè lệnh gốc
    - xung đột/trùng lặp bị bỏ qua và ghi lại

    Ghi chú:

    - lệnh tùy chỉnh chỉ là mục menu; chúng không tự động thực hiện hành vi
    - lệnh plugin/kỹ năng vẫn có thể hoạt động khi được nhập ngay cả khi không hiển thị trong menu Telegram

    Nếu lệnh gốc bị tắt, các lệnh tích hợp sẵn sẽ bị xóa. Lệnh tùy chỉnh/plugin vẫn có thể đăng ký nếu được cấu hình.

    Các lỗi thiết lập phổ biến:

    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` có nghĩa là menu Telegram vẫn tràn sau khi cắt bớt; giảm lệnh plugin/kỹ năng/tùy chỉnh hoặc tắt menu gốc
    - `setMyCommands failed` với lỗi mạng/lấy thường có nghĩa là DNS/HTTPS ra ngoài tới `api.telegram.org` bị chặn.

    ### Lệnh ghép nối thiết bị (plugin `device-pair`)

    Khi plugin `device-pair` được cài đặt:

    1. `/pair` tạo mã thiết lập
    2. dán mã vào ứng dụng iOS
    3. `/pair pending` liệt kê các yêu cầu đang chờ xử lý (bao gồm vai trò/phạm vi)
    4. phê duyệt yêu cầu:
       - `/pair approve <requestId>` để phê duyệt rõ ràng
       - `/pair approve` khi chỉ có một yêu cầu đang chờ xử lý
       - `/pair approve latest` cho yêu cầu gần nhất

    Nếu một thiết bị thử lại với chi tiết xác thực đã thay đổi (ví dụ vai trò/phạm vi/khóa công khai), yêu cầu đang chờ xử lý trước đó sẽ bị thay thế và yêu cầu mới sử dụng một `requestId` khác. Chạy lại `/pair pending` trước khi phê duyệt.

    Thêm chi tiết: [Ghép nối](/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Nút nội tuyến">
    Cấu hình phạm vi bàn phím nội tuyến:

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

    `capabilities: ["inlineButtons"]` cũ ánh xạ tới `inlineButtons: "all"`.

    Ví dụ hành động tin nhắn:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Chọn một tùy chọn:",
  buttons: [
    [
      { text: "Có", callback_data: "yes" },
      { text: "Không", callback_data: "no" },
    ],
    [{ text: "Hủy", callback_data: "cancel" }],
  ],
}
```

    Các lần nhấp callback được chuyển đến agent dưới dạng văn bản:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Hành động tin nhắn Telegram cho agent và tự động hóa">
    Các hành động công cụ Telegram bao gồm:

    - `sendMessage` (`to`, `content`, tùy chọn `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, tùy chọn `iconColor`, `iconCustomEmojiId`)

    Các hành động tin nhắn kênh cung cấp các bí danh tiện dụng (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kiểm soát cổng:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (mặc định: tắt)

    Lưu ý: `edit` và `topic-create` hiện được bật theo mặc định và không có các chuyển đổi `channels.telegram.actions.*` riêng biệt.
    Các lần gửi khi chạy sử dụng ảnh chụp nhanh cấu hình/bí mật đang hoạt động (khởi động/tải lại), vì vậy các đường dẫn hành động không thực hiện giải quyết lại SecretRef theo từng lần gửi.

    Ngữ nghĩa loại bỏ phản ứng: [/tools/reactions](/tools/reactions)

  </Accordion>

  <Accordion title="Thẻ luồng trả lời">
    Telegram hỗ trợ các thẻ luồng trả lời rõ ràng trong đầu ra được tạo:

    - `[[reply_to_current]]` trả lời tin nhắn kích hoạt
    - `[[reply_to:<id>]]` trả lời một ID tin nhắn Telegram cụ thể

    `channels.telegram.replyToMode` kiểm soát xử lý:

    - `off` (mặc định)
    - `first`
    - `all`

    Lưu ý: `off` vô hiệu hóa luồng trả lời ngầm định. Các thẻ `[[reply_to_*]]` rõ ràng vẫn được tôn trọng.

  </Accordion>

  <Accordion title="Chủ đề diễn đàn và hành vi chủ đề">
    Siêu nhóm diễn đàn:

    - khóa phiên chủ đề thêm `:topic:<threadId>`
    - trả lời và gõ nhắm vào chủ đề
    - đường dẫn cấu hình chủ đề:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Trường hợp đặc biệt chủ đề chung (`threadId=1`):

    - gửi tin nhắn bỏ qua `message_thread_id` (Telegram từ chối `sendMessage(...thread_id=1)`)
    - hành động gõ vẫn bao gồm `message_thread_id`

    Thừa kế chủ đề: các mục chủ đề thừa kế cài đặt nhóm trừ khi bị ghi đè (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` chỉ dành cho chủ đề và không thừa kế từ mặc định nhóm.

    **Định tuyến agent theo chủ đề**: Mỗi chủ đề có thể định tuyến đến một agent khác nhau bằng cách thiết lập `agentId` trong cấu hình chủ đề. Điều này cho phép mỗi chủ đề có không gian làm việc, bộ nhớ và phiên riêng biệt. Ví dụ:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Chủ đề chung → agent chính
                "3": { agentId: "zu" },        // Chủ đề phát triển → agent zu
                "5": { agentId: "coder" }      // Đánh giá mã → agent coder
              }
            }
          }
        }
      }
    }
    ```

    Mỗi chủ đề sau đó có khóa phiên riêng: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Liên kết chủ đề ACP bền vững**: Các chủ đề diễn đàn có thể ghim các phiên harness ACP thông qua các liên kết ACP kiểu cấp cao nhất:

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

    Điều này hiện được giới hạn cho các chủ đề diễn đàn trong các nhóm và siêu nhóm.

    **Khởi tạo ACP theo chủ đề từ chat**:

    - `/acp spawn <agent> --thread here|auto` có thể liên kết chủ đề Telegram hiện tại với một phiên ACP mới.
    - Các tin nhắn chủ đề tiếp theo định tuyến trực tiếp đến phiên ACP đã liên kết (không cần `/acp steer`).
    - OpenClaw ghim tin nhắn xác nhận khởi tạo trong chủ đề sau khi liên kết thành công.
    - Yêu cầu `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Ngữ cảnh mẫu bao gồm:

    - `MessageThreadId`
    - `IsForum`

    Hành vi luồng DM:

    - các cuộc trò chuyện riêng với `message_thread_id` giữ định tuyến DM nhưng sử dụng khóa phiên nhận thức chủ đề/mục tiêu trả lời.

  </Accordion>

  <Accordion title="Âm thanh, video và nhãn dán">
    ### Tin nhắn âm thanh

    Telegram phân biệt giữa ghi chú giọng nói và tệp âm thanh.

    - mặc định: hành vi tệp âm thanh
    - thẻ `[[audio_as_voice]]` trong câu trả lời agent để buộc gửi ghi chú giọng nói

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

    Ghi chú video không hỗ trợ chú thích; văn bản tin nhắn được cung cấp được gửi riêng.

    ### Nhãn dán

    Xử lý nhãn dán đến:

    - WEBP tĩnh: tải xuống và xử lý (chỗ giữ chỗ `<media:sticker>`)
    - TGS động: bỏ qua
    - WEBM video: bỏ qua

    Trường ngữ cảnh nhãn dán:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Tệp bộ nhớ cache nhãn dán:

    - `~/.openclaw/telegram/sticker-cache.json`

    Nhãn dán được mô tả một lần (khi có thể) và được lưu vào bộ nhớ cache để giảm các cuộc gọi tầm nhìn lặp lại.

    Bật hành động nhãn dán:

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

    Hành động gửi nhãn dán:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Tìm kiếm nhãn dán đã lưu vào bộ nhớ cache:

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
    Phản ứng Telegram đến dưới dạng cập nhật `message_reaction` (tách biệt với tải trọng tin nhắn).

    Khi được bật, OpenClaw xếp hàng các sự kiện hệ thống như:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Cấu hình:

    - `channels.telegram.reactionNotifications`: `off | own | all` (mặc định: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (mặc định: `minimal`)

    Ghi chú:

    - `own` có nghĩa là phản ứng của người dùng đối với các tin nhắn do bot gửi chỉ (nỗ lực tốt nhất qua bộ nhớ cache tin nhắn đã gửi).
    - Các sự kiện phản ứng vẫn tôn trọng các kiểm soát truy cập Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); người gửi không được phép bị loại bỏ.
    - Telegram không cung cấp ID chủ đề trong các cập nhật phản ứng.
      - các nhóm không phải diễn đàn định tuyến đến phiên trò chuyện nhóm
      - các nhóm diễn đàn định tuyến đến phiên chủ đề chung của nhóm (`:topic:1`), không phải chủ đề gốc chính xác

    `allowed_updates` cho polling/webhook tự động bao gồm `message_reaction`.

  </Accordion>

  <Accordion title="Phản ứng xác nhận">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý một tin nhắn đến.

    Thứ tự giải quyết:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - emoji nhận dạng agent dự phòng (`agents.list[].identity.emoji`, nếu không có thì "👀")

    Ghi chú:

    - Telegram mong đợi emoji unicode (ví dụ "👀").
    - Sử dụng `""` để tắt phản ứng cho một kênh hoặc tài khoản.

  </Accordion>

  <Accordion title="Ghi cấu hình từ sự kiện và lệnh Telegram">
    Ghi cấu hình kênh được bật theo mặc định (`configWrites !== false`).

    Các ghi được kích hoạt bởi Telegram bao gồm:

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

    - thiết lập `channels.telegram.webhookUrl`
    - thiết lập `channels.telegram.webhookSecret` (bắt buộc khi URL webhook được thiết lập)
    - tùy chọn `channels.telegram.webhookPath` (mặc định `/telegram-webhook`)
    - tùy chọn `channels.telegram.webhookHost` (mặc định `127.0.0.1`)
    - tùy chọn `channels.telegram.webhookPort` (mặc định `8787`)

    Trình nghe cục bộ mặc định cho chế độ webhook liên kết với `127.0.0.1:8787`.

    Nếu điểm cuối công khai của bạn khác, hãy đặt một proxy ngược phía trước và trỏ `webhookUrl` đến URL công khai.
    Thiết lập `webhookHost` (ví dụ `0.0.0.0`) khi bạn cố ý cần ingress bên ngoài.

  </Accordion>

  <Accordion title="Giới hạn, thử lại và mục tiêu CLI">
    - `channels.telegram.textChunkLimit` mặc định là 4000.
    - `channels.telegram.chunkMode="newline"` ưu tiên ranh giới đoạn văn (dòng trống) trước khi chia độ dài.
    - `channels.telegram.mediaMaxMb` (mặc định 100) giới hạn kích thước phương tiện Telegram đến và đi.
    - `channels.telegram.timeoutSeconds` ghi đè thời gian chờ của khách hàng API Telegram (nếu không được đặt, áp dụng mặc định của grammY).
    - lịch sử ngữ cảnh nhóm sử dụng `channels.telegram.historyLimit` hoặc `messages.groupChat.historyLimit` (mặc định 50); `0` vô hiệu hóa.
    - Kiểm soát lịch sử DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - cấu hình `channels.telegram.retry` áp dụng cho các trợ giúp gửi Telegram (CLI/công cụ/hành động) cho các lỗi API gửi đi có thể khôi phục.

    Mục tiêu gửi CLI có thể là ID chat dạng số hoặc tên người dùng:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Các cuộc thăm dò Telegram sử dụng `openclaw message poll` và hỗ trợ các chủ đề diễn đàn:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Các cờ thăm dò chỉ dành cho Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` cho các chủ đề diễn đàn (hoặc sử dụng mục tiêu `:topic:`)

    Gửi Telegram cũng hỗ trợ:

    - `--buttons` cho bàn phím nội tuyến khi `channels.telegram.capabilities.inlineButtons` cho phép
    - `--force-document` để gửi hình ảnh và GIF gửi đi dưới dạng tài liệu thay vì tải lên ảnh hoặc phương tiện động nén

    Kiểm soát hành động:

    - `channels.telegram.actions.sendMessage=false` vô hiệu hóa các tin nhắn Telegram gửi đi, bao gồm cả các cuộc thăm dò
    - `channels.telegram.actions.poll=false` vô hiệu hóa việc tạo cuộc thăm dò Telegram trong khi vẫn để lại các lần gửi thông thường được bật

  </Accordion>

  <Accordion title="Phê duyệt thực thi trong Telegram">
    Telegram hỗ trợ phê duyệt thực thi trong DM của người phê duyệt và có thể tùy chọn đăng lời nhắc phê duyệt trong chat hoặc chủ đề gốc.

    Đường dẫn cấu hình:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers`
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
    - `agentFilter`, `sessionFilter`

    Người phê duyệt phải là ID người dùng Telegram dạng số. Khi `enabled` là false hoặc `approvers` trống, Telegram không hoạt động như một khách hàng phê duyệt thực thi. Các yêu cầu phê duyệt quay lại các tuyến phê duyệt cấu hình khác hoặc chính sách dự phòng phê duyệt thực thi.

    Quy tắc giao hàng:

    - `target: "dm"` chỉ gửi lời nhắc phê duyệt đến DM của người phê duyệt được cấu hình
    - `target: "channel"` gửi lời nhắc trở lại chat/chủ đề Telegram gốc
    - `target: "both"` gửi đến DM của người phê duyệt và chat/chủ đề gốc

    Chỉ những người phê duyệt được cấu hình mới có thể phê duyệt hoặc từ chối. Những người không phải người phê duyệt không thể sử dụng `/approve` và không thể sử dụng các nút phê duyệt Telegram.

    Giao hàng kênh hiển thị văn bản lệnh trong chat, vì vậy chỉ bật `channel` hoặc `both` trong các nhóm/chủ đề đáng tin cậy. Khi lời nhắc hạ cánh trong một chủ đề diễn đàn, OpenClaw bảo toàn chủ đề cho cả lời nhắc phê duyệt và theo dõi sau phê duyệt.

    Các nút phê duyệt nội tuyến cũng phụ thuộc vào `channels.telegram.capabilities.inlineButtons` cho phép bề mặt mục tiêu (`dm`, `group`, hoặc `all`).

    Tài liệu liên quan: [Phê duyệt thực thi](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Bot không phản hồi tin nhắn nhóm không nhắc đến">

    - Nếu `requireMention=false`, chế độ riêng tư của Telegram phải cho phép khả năng hiển thị đầy đủ.
      - BotFather: `/setprivacy` -> Tắt
      - sau đó xóa và thêm lại bot vào nhóm
    - `openclaw channels status` cảnh báo khi cấu hình mong đợi tin nhắn nhóm không nhắc đến.
    - `openclaw channels status --probe` có thể kiểm tra ID nhóm dạng số rõ ràng; ký tự đại diện `"*"` không thể được kiểm tra thành viên.
    - kiểm tra phiên nhanh: `/activation always`.

  </Accordion>

  <Accordion title="Bot không thấy tin nhắn nhóm nào cả">

    - khi `channels.telegram.groups` tồn tại, nhóm phải được liệt kê (hoặc bao gồm `"*"`)
    - xác minh thành viên bot trong nhóm
    - xem lại nhật ký: `openclaw logs --follow` để biết lý do bỏ qua

  </Accordion>

  <Accordion title="Lệnh hoạt động một phần hoặc không hoạt động">

    - ủy quyền danh tính người gửi của bạn (ghép nối và/hoặc `allowFrom` dạng số)
    - ủy quyền lệnh vẫn áp dụng ngay cả khi chính sách nhóm là `open`
    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` có nghĩa là menu gốc có quá nhiều mục; giảm lệnh plugin/kỹ năng/tùy chỉnh hoặc tắt menu gốc
    - `setMyCommands failed` với lỗi mạng/lấy thường chỉ ra các vấn đề về khả năng truy cập DNS/HTTPS tới `api.telegram.org`

  </Accordion>

  <Accordion title="Sự không ổn định của polling hoặc mạng">

    - Node 22+ + fetch/proxy tùy chỉnh có thể kích hoạt hành vi hủy bỏ ngay lập tức nếu các loại AbortSignal không khớp.
    - Một số máy chủ giải quyết `api.telegram.org` thành IPv6 trước; egress IPv6 bị hỏng có thể gây ra lỗi API Telegram không liên tục.
    - Nếu nhật ký bao gồm `TypeError: fetch failed` hoặc `Network request for 'getUpdates' failed!`, OpenClaw hiện thử lại những lỗi này như các lỗi mạng có thể khôi phục.
    - Trên các máy chủ VPS với egress/TLS trực tiếp không ổn định, định tuyến các cuộc gọi API Telegram qua `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ mặc định là `autoSelectFamily=true` (trừ WSL2) và `dnsResultOrder=ipv4first`.
    - Nếu máy chủ của bạn là WSL2 hoặc hoạt động tốt hơn rõ ràng với hành vi chỉ IPv4, buộc chọn họ:

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

Thêm trợ giúp: [Khắc phục sự cố kênh](/channels/troubleshooting).

## Tham khảo cấu hình Telegram

Tham khảo chính:

- `channels.telegram.enabled`: bật/tắt khởi động kênh.
- `channels.telegram.botToken`: token bot (BotFather).
- `channels.telegram.tokenFile`: đọc token từ đường dẫn tệp thông thường. Symlink bị từ chối.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing).
- `channels.telegram.allowFrom`: danh sách cho phép DM (ID người dùng Telegram dạng số). `allowlist` yêu cầu ít nhất một ID người gửi. `open` yêu cầu `"*"`. `openclaw doctor --fix` có thể chuyển đổi các mục `@username` cũ thành ID và có thể khôi phục các mục danh sách cho phép từ các tệp pairing-store trong các luồng di chuyển danh sách cho phép.
- `channels.telegram.actions.poll`: bật hoặc tắt việc tạo cuộc thăm dò Telegram (mặc định: bật; vẫn yêu cầu `sendMessage`).
- `channels.telegram.defaultTo`: mục tiêu Telegram mặc định được sử dụng bởi CLI `--deliver` khi không có `--reply-to` rõ ràng được cung cấp.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (mặc định: allowlist).
- `channels.telegram.groupAllowFrom`: danh sách cho phép người gửi nhóm (ID người dùng Telegram dạng số). `openclaw doctor --fix` có thể chuyển đổi các mục `@username` cũ thành ID. Các mục không phải số bị bỏ qua khi xác thực. Xác thực nhóm không sử dụng dự phòng pairing-store DM (`2026.2.25+`).
- Ưu tiên đa tài khoản:
  - Khi hai hoặc nhiều ID tài khoản được cấu hình, thiết lập `channels.telegram.defaultAccount` (hoặc bao gồm `channels.telegram.accounts.default`) để làm cho định tuyến mặc định rõ ràng.
  - Nếu không có cái nào được thiết lập, OpenClaw quay lại ID tài khoản đầu tiên đã chuẩn hóa và `openclaw doctor` cảnh báo.
  - `channels.telegram.accounts.default.allowFrom` và `channels.telegram.accounts.default.groupAllowFrom` chỉ áp dụng cho tài khoản `default`.
  - Các tài khoản được đặt tên thừa kế `channels.telegram.allowFrom` và `channels.telegram.groupAllowFrom` khi các giá trị cấp tài khoản không được thiết lập.
  - Các tài khoản được đặt tên không thừa kế `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: mặc định theo nhóm + danh sách cho phép (sử dụng `"*"` cho mặc định toàn cầu).
  - `channels.telegram.groups.<id>.groupPolicy`: ghi đè theo nhóm cho groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: mặc định kiểm soát nhắc đến.
  - `channels.telegram.groups.<id>.skills`: bộ lọc kỹ năng (bỏ qua = tất cả kỹ năng, trống = không có).
  - `channels.telegram.groups.<id>.allowFrom`: ghi đè danh sách cho phép người gửi theo nhóm.
  - `channels.telegram.groups.<id>.systemPrompt`: lời nhắc hệ thống bổ sung cho nhóm.
  - `channels.telegram.groups.<id>.enabled`: vô hiệu hóa nhóm khi `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: ghi đè theo chủ đề (trường nhóm + chỉ chủ đề `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: định tuyến chủ đề này đến một agent cụ thể (ghi đè định tuyến cấp nhóm và liên kết).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: ghi đè theo chủ đề cho groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: ghi đè kiểm soát nhắc đến theo chủ đề.
- `bindings[]` cấp cao nhất với `type: "acp"` và ID chủ đề chuẩn `chatId:topic:topicId` trong `match.peer.id`: trường liên kết chủ đề ACP bền vững (xem [Agent ACP](/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: định tuyến các chủ đề DM đến một agent cụ thể (cùng hành vi như các chủ đề diễn đàn).
- `channels.telegram.execApprovals.enabled`: bật Telegram làm khách hàng phê duyệt thực thi dựa trên chat cho tài khoản này.
- `channels.telegram.execApprovals.approvers`: ID người dùng Telegram được phép phê duyệt hoặc từ chối yêu cầu thực thi. Bắt buộc khi phê duyệt thực thi được bật.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (mặc định: `dm`). `channel` và `both` bảo toàn chủ đề Telegram gốc khi có.
- `channels.telegram.execApprovals.agentFilter`: bộ lọc ID agent tùy chọn cho các lời nhắc phê duyệt được chuyển tiếp.
- `channels.telegram.execApprovals.sessionFilter`: bộ lọc khóa phiên tùy chọn (chuỗi con hoặc regex) cho các lời nhắc phê duyệt được chuyển tiếp.
- `channels.telegram.accounts.<account>.execApprovals`: ghi đè theo tài khoản cho định tuyến phê duyệt thực thi Telegram và ủy quyền người phê duyệt.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (mặc định: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: ghi đè theo tài khoản.
- `channels.telegram.commands.nativeSkills`: bật/tắt lệnh kỹ năng gốc Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (mặc định: `off`).
- `channels.telegram.textChunkLimit`: kích thước khối gửi đi (ký tự).
- `channels.telegram.chunkMode`: `length` (mặc định) hoặc `newline` để chia trên các dòng trống (ranh giới đoạn văn) trước khi chia độ dài.
- `channels.telegram.linkPreview`: bật/tắt xem trước liên kết cho các tin nhắn gửi đi (mặc định: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (xem trước luồng trực tiếp; mặc định: `partial`; `progress` ánh xạ tới `partial`; `block` là chế độ tương thích xem trước cũ). Phát trực tiếp xem trước Telegram sử dụng một tin nhắn xem trước duy nhất được chỉnh sửa tại chỗ.
- `channels.telegram.mediaMaxMb`: giới hạn phương tiện Telegram đến/đi (MB, mặc định: 100).
- `channels.telegram.retry`: chính sách thử lại cho các trợ giúp gửi Telegram (CLI/công cụ/hành động) trên các lỗi API gửi đi có thể khôi phục (lần thử, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: ghi đè Node autoSelectFamily (true=bật, false=tắt). Mặc định là bật trên Node 22+, với WSL2 mặc định là tắt.
- `channels.telegram.network.dnsResultOrder`: ghi đè thứ tự kết quả DNS (`ipv4first` hoặc `verbatim`). Mặc định là `ipv4first` trên Node 22+.
- `channels.telegram.proxy`: URL proxy cho các cuộc gọi Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: bật chế độ webhook (yêu cầu `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: bí mật webhook (bắt buộc khi webhookUrl được thiết lập).
- `channels.telegram.webhookPath`: đường dẫn webhook cục bộ (mặc định `/telegram-webhook`).
- `channels.telegram.webhookHost`: máy chủ liên kết webhook cục bộ (mặc định `127.0.0.1`).
- `channels.telegram.webhookPort`: cổng liên kết webhook cục bộ (mặc định `8787`).
- `channels.telegram.actions.reactions`: cổng phản ứng công cụ Telegram.
- `channels.telegram.actions.sendMessage`: cổng gửi tin nhắn công cụ Telegram.
- `channels.telegram.actions.deleteMessage`: cổng xóa tin nhắn công cụ Telegram.
- `channels.telegram.actions.sticker`: cổng hành động nhãn dán Telegram — gửi và tìm kiếm (mặc định: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — kiểm soát phản ứng nào kích hoạt sự kiện hệ thống (mặc định: `own` khi không được thiết lập).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — kiểm soát khả năng phản ứng của agent (mặc định: `minimal` khi không được thiết lập).

- [Tham khảo cấu hình - Telegram](/gateway/configuration-reference#telegram)

Các trường tín hiệu cao cụ thể của Telegram:

- khởi động/xác thực: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` phải trỏ đến một tệp thông thường; symlink bị từ chối)
- kiểm soát truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` cấp cao nhất (`type: "acp"`)
- phê duyệt thực thi: `execApprovals`, `accounts.*.execApprovals`
- lệnh/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- luồng/trả lời: `replyToMode`
- phát trực tiếp: `streaming` (xem trước), `blockStreaming`
- định dạng/gửi: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- phương tiện/mạng: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- hành động/khả năng: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- phản ứng: `reactionNotifications`, `reactionLevel`
- ghi/lịch sử: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Liên quan

- [Ghép nối](/channels/pairing)
- [Định tuyến kênh](/channels/channel-routing)
- [Định tuyến đa agent](/concepts/multi-agent)
- [Khắc phục sự cố](/channels/troubleshooting)
