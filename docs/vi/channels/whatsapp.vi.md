---
summary: "Hỗ trợ kênh WhatsApp, kiểm soát truy cập, hành vi gửi tin và vận hành"
read_when:
  - Làm việc với hành vi kênh WhatsApp/web hoặc định tuyến hộp thư
title: "WhatsApp"
---

# WhatsApp (Kênh Web)

Trạng thái: Sẵn sàng sản xuất qua WhatsApp Web (Baileys). Gateway sở hữu session đã liên kết.

## Cài đặt (khi cần)

- Onboarding (`openclaw onboard`) và `openclaw channels add --channel whatsapp` sẽ nhắc cài plugin WhatsApp lần đầu chọn.
- `openclaw channels login --channel whatsapp` cũng cung cấp luồng cài đặt khi plugin chưa có.
- Kênh dev + git checkout: mặc định đường dẫn plugin local.
- Stable/Beta: mặc định package npm `@openclaw/whatsapp`.

Cài đặt thủ công vẫn có sẵn:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Chính sách DM mặc định là pairing cho người gửi không xác định.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    Chẩn đoán và sửa lỗi kênh chéo.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/gateway/configuration">
    Mẫu cấu hình kênh đầy đủ và ví dụ.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Steps>
  <Step title="Cấu hình chính sách truy cập WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Liên kết WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Cho tài khoản cụ thể:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Khởi động gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Duyệt yêu cầu pairing đầu tiên (nếu dùng chế độ pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Yêu cầu pairing hết hạn sau 1 giờ. Giới hạn 3 yêu cầu chờ mỗi kênh.

  </Step>
</Steps>

<Note>
OpenClaw khuyến nghị chạy WhatsApp trên số riêng khi có thể. (Metadata kênh và luồng thiết lập tối ưu cho cấu hình này, nhưng cũng hỗ trợ cấu hình số cá nhân.)
</Note>

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Số riêng (khuyến nghị)">
    Đây là chế độ vận hành sạch nhất:

    - danh tính WhatsApp riêng cho OpenClaw
    - danh sách cho phép DM và ranh giới định tuyến rõ ràng hơn
    - giảm khả năng nhầm lẫn tự chat

    Mẫu chính sách tối thiểu:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fallback số cá nhân">
    Onboarding hỗ trợ chế độ số cá nhân và ghi một cấu hình cơ bản thân thiện với tự chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bao gồm số cá nhân
    - `selfChatMode: true`

    Trong runtime, bảo vệ tự chat dựa vào số tự liên kết và `allowFrom`.

  </Accordion>

  <Accordion title="Phạm vi kênh chỉ WhatsApp Web">
    Kênh nền tảng nhắn tin là dựa trên WhatsApp Web (`Baileys`) trong kiến trúc kênh OpenClaw hiện tại.

    Không có kênh nhắn tin WhatsApp Twilio riêng trong registry kênh chat tích hợp.

  </Accordion>
</AccordionGroup>

## Mô hình runtime

- Gateway sở hữu socket WhatsApp và vòng lặp kết nối lại.
- Gửi đi yêu cầu listener WhatsApp hoạt động cho tài khoản mục tiêu.
- Chat trạng thái và broadcast bị bỏ qua (`@status`, `@broadcast`).
- Chat trực tiếp sử dụng quy tắc session DM (`session.dmScope`; mặc định `main` gom DM vào session chính của agent).
- Session nhóm được cô lập (`agent:<agentId>:whatsapp:group:<jid>`).

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách DM">
    `channels.whatsapp.dmPolicy` kiểm soát truy cập chat trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `allowFrom` chấp nhận số kiểu E.164 (chuẩn hóa nội bộ).

    Ghi đè nhiều tài khoản: `channels.whatsapp.accounts.<id>.dmPolicy` (và `allowFrom`) ưu tiên hơn mặc định cấp kênh cho tài khoản đó.

    Chi tiết hành vi runtime:

    - pairings được lưu trữ trong allow-store kênh và hợp nhất với `allowFrom` đã cấu hình
    - nếu không có danh sách cho phép, số tự liên kết được cho phép mặc định
    - DM `fromMe` gửi đi không bao giờ tự động pairing

  </Tab>

  <Tab title="Chính sách nhóm + danh sách cho phép">
    Truy cập nhóm có hai lớp:

    1. **Danh sách cho phép thành viên nhóm** (`channels.whatsapp.groups`)
       - nếu `groups` bị bỏ qua, tất cả nhóm đều đủ điều kiện
       - nếu `groups` có mặt, nó hoạt động như danh sách cho phép nhóm (`"*"` được phép)

    2. **Chính sách người gửi nhóm** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: bỏ qua danh sách cho phép người gửi
       - `allowlist`: người gửi phải khớp `groupAllowFrom` (hoặc `*`)
       - `disabled`: chặn tất cả inbound nhóm

    Fallback danh sách cho phép người gửi:

    - nếu `groupAllowFrom` không được đặt, runtime sẽ fallback về `allowFrom` khi có sẵn
    - danh sách cho phép người gửi được đánh giá trước khi kích hoạt mention/reply

    Lưu ý: nếu không có block `channels.whatsapp` nào tồn tại, fallback chính sách nhóm runtime là `allowlist` (với log cảnh báo), ngay cả khi `channels.defaults.groupPolicy` được đặt.

  </Tab>

  <Tab title="Mentions + /activation">
    Trả lời nhóm yêu cầu mention theo mặc định.

    Phát hiện mention bao gồm:

    - mention WhatsApp rõ ràng của danh tính bot
    - mẫu regex mention đã cấu hình (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - phát hiện reply-to-bot ngầm (người gửi reply khớp danh tính bot)

    Lưu ý bảo mật:

    - quote/reply chỉ thỏa mãn điều kiện mention; nó **không** cấp quyền cho người gửi
    - với `groupPolicy: "allowlist"`, người gửi không có trong danh sách cho phép vẫn bị chặn ngay cả khi họ trả lời tin nhắn của người dùng trong danh sách cho phép

    Lệnh kích hoạt cấp session:

    - `/activation mention`
    - `/activation always`

    `activation` cập nhật trạng thái session (không phải cấu hình toàn cầu). Nó bị giới hạn bởi chủ sở hữu.

  </Tab>
</Tabs>

## Hành vi tự chat và số cá nhân

Khi số tự liên kết cũng có trong `allowFrom`, bảo vệ tự chat WhatsApp sẽ kích hoạt:

- bỏ qua biên nhận đã đọc cho lượt tự chat
- bỏ qua hành vi tự động kích hoạt mention-JID mà nếu không sẽ ping chính mình
- nếu `messages.responsePrefix` không được đặt, trả lời tự chat mặc định là `[{identity.name}]` hoặc `[openclaw]`

## Chuẩn hóa tin nhắn và ngữ cảnh

<AccordionGroup>
  <Accordion title="Phong bì inbound + ngữ cảnh trả lời">
    Tin nhắn WhatsApp đến được bọc trong phong bì inbound chia sẻ.

    Nếu có trả lời được quote, ngữ cảnh được thêm vào dưới dạng:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Các trường metadata trả lời cũng được điền khi có sẵn (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Placeholder media và trích xuất vị trí/liên hệ">
    Tin nhắn chỉ có media inbound được chuẩn hóa với các placeholder như:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Payload vị trí và liên hệ được chuẩn hóa thành ngữ cảnh văn bản trước khi định tuyến.

  </Accordion>

  <Accordion title="Tiêm lịch sử nhóm chờ xử lý">
    Đối với nhóm, tin nhắn chưa xử lý có thể được đệm và tiêm làm ngữ cảnh khi bot cuối cùng được kích hoạt.

    - giới hạn mặc định: `50`
    - cấu hình: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` vô hiệu hóa

    Dấu hiệu tiêm:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Biên nhận đã đọc">
    Biên nhận đã đọc được bật mặc định cho tin nhắn WhatsApp inbound đã chấp nhận.

    Vô hiệu hóa toàn cầu:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Ghi đè từng tài khoản:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Lượt tự chat bỏ qua biên nhận đã đọc ngay cả khi được bật toàn cầu.

  </Accordion>
</AccordionGroup>

## Giao hàng, chia nhỏ và media

<AccordionGroup>
  <Accordion title="Chia nhỏ văn bản">
    - giới hạn chia nhỏ mặc định: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - chế độ `newline` ưu tiên ranh giới đoạn văn (dòng trống), sau đó fallback về chia nhỏ an toàn theo độ dài
  </Accordion>

  <Accordion title="Hành vi media outbound">
    - hỗ trợ payload hình ảnh, video, âm thanh (PTT voice-note) và tài liệu
    - `audio/ogg` được viết lại thành `audio/ogg; codecs=opus` để tương thích voice-note
    - phát lại GIF động được hỗ trợ qua `gifPlayback: true` khi gửi video
    - chú thích được áp dụng cho mục media đầu tiên khi gửi payload trả lời đa phương tiện
    - nguồn media có thể là HTTP(S), `file://`, hoặc đường dẫn local
  </Accordion>

  <Accordion title="Giới hạn kích thước media và hành vi fallback">
    - giới hạn lưu media inbound: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - giới hạn gửi media outbound: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - ghi đè từng tài khoản sử dụng `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - hình ảnh được tối ưu hóa tự động (thay đổi kích thước/chất lượng) để phù hợp giới hạn
    - khi gửi media thất bại, fallback mục đầu tiên gửi cảnh báo văn bản thay vì bỏ qua phản hồi một cách im lặng
  </Accordion>
</AccordionGroup>

## Phản ứng xác nhận

WhatsApp hỗ trợ phản ứng ack ngay lập tức khi nhận inbound qua `channels.whatsapp.ackReaction`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Ghi chú hành vi:

- gửi ngay sau khi inbound được chấp nhận (trước khi trả lời)
- lỗi được ghi lại nhưng không chặn việc gửi trả lời bình thường
- chế độ nhóm `mentions` phản ứng trên lượt kích hoạt mention; kích hoạt nhóm `always` hoạt động như bỏ qua kiểm tra này
- WhatsApp sử dụng `channels.whatsapp.ackReaction` (không sử dụng `messages.ackReaction` cũ)

## Nhiều tài khoản và thông tin xác thực

<AccordionGroup>
  <Accordion title="Lựa chọn tài khoản và mặc định">
    - id tài khoản đến từ `channels.whatsapp.accounts`
    - lựa chọn tài khoản mặc định: `default` nếu có, nếu không id tài khoản đầu tiên được cấu hình (sắp xếp)
    - id tài khoản được chuẩn hóa nội bộ để tra cứu
  </Accordion>

  <Accordion title="Đường dẫn thông tin xác thực và tương thích cũ">
    - đường dẫn auth hiện tại: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file backup: `creds.json.bak`
    - auth mặc định cũ trong `~/.openclaw/credentials/` vẫn được nhận diện/chuyển đổi cho luồng tài khoản mặc định
  </Accordion>

  <Accordion title="Hành vi đăng xuất">
    `openclaw channels logout --channel whatsapp [--account <id>]` xóa trạng thái auth WhatsApp cho tài khoản đó.

    Trong thư mục auth cũ, `oauth.json` được giữ lại trong khi file auth Baileys bị xóa.

  </Accordion>
</AccordionGroup>

## Công cụ, hành động và ghi cấu hình

- Hỗ trợ công cụ agent bao gồm hành động phản ứng WhatsApp (`react`).
- Cổng hành động:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Ghi cấu hình khởi tạo từ kênh được bật mặc định (vô hiệu hóa qua `channels.whatsapp.configWrites=false`).

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Chưa liên kết (cần QR)">
    Triệu chứng: trạng thái kênh báo chưa liên kết.

    Khắc phục:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Đã liên kết nhưng bị ngắt kết nối / vòng lặp kết nối lại">
    Triệu chứng: tài khoản đã liên kết với các lần ngắt kết nối hoặc thử kết nối lại lặp lại.

    Khắc phục:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Nếu cần, liên kết lại với `channels login`.

  </Accordion>

  <Accordion title="Không có listener hoạt động khi gửi">
    Gửi đi thất bại nhanh khi không có listener gateway hoạt động cho tài khoản mục tiêu.

    Đảm bảo gateway đang chạy và tài khoản đã liên kết.

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua bất ngờ">
    Kiểm tra theo thứ tự này:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - mục danh sách cho phép `groups`
    - điều kiện mention (`requireMention` + mẫu mention)
    - khóa trùng lặp trong `openclaw.json` (JSON5): mục sau ghi đè mục trước, vì vậy giữ một `groupPolicy` duy nhất cho mỗi phạm vi

  </Accordion>

  <Accordion title="Cảnh báo runtime Bun">
    Runtime gateway WhatsApp nên sử dụng Node. Bun bị gắn cờ là không tương thích cho hoạt động gateway WhatsApp/Telegram ổn định.
  </Accordion>
</AccordionGroup>

## Tham chiếu cấu hình

Tham chiếu chính:

- [Tham chiếu cấu hình - WhatsApp](/gateway/configuration-reference#whatsapp)

Các trường WhatsApp quan trọng:

- truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- giao hàng: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`
- nhiều tài khoản: `accounts.<id>.enabled`, `accounts.<id>.authDir`, ghi đè cấp tài khoản
- vận hành: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- hành vi session: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## Liên quan

- [Pairing](/channels/pairing)
- [Định tuyến kênh](/channels/channel-routing)
- [Định tuyến nhiều agent](/concepts/multi-agent)
- [Khắc phục sự cố](/channels/troubleshooting)\n