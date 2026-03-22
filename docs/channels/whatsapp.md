---
summary: "Khám phá cách cấu hình và kiểm soát truy cập WhatsApp, tối ưu hóa gửi tin và vận hành hiệu quả."
read_when:
  - Làm việc với hành vi kênh WhatsApp/web hoặc định tuyến hộp thư đến
title: "Hướng Dẫn Cấu Hình Kênh WhatsApp"
---

# WhatsApp (Kênh Web)

Trạng thái: Sẵn sàng sản xuất qua WhatsApp Web (Baileys). Gateway sở hữu session đã liên kết.

## Cài đặt (khi cần)

- Quá trình onboarding (`openclaw onboard`) và `openclaw channels add --channel whatsapp` sẽ yêu cầu cài đặt plugin WhatsApp lần đầu tiên khi chọn.
- `openclaw channels login --channel whatsapp` cũng cung cấp quy trình cài đặt khi plugin chưa có.
- Kênh Dev + git checkout: mặc định là đường dẫn plugin cục bộ.
- Ổn định/Beta: mặc định là gói npm `@openclaw/whatsapp`.

Cài đặt thủ công vẫn có sẵn:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Ghép đôi" icon="link" href="/channels/pairing">
    Chính sách DM mặc định là ghép đôi cho người gửi không xác định.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/channels/troubleshooting">
    Chẩn đoán và sửa chữa đa kênh.
  </Card>
  <Card title="Cấu hình Gateway" icon="settings" href="/gateway/configuration">
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

    Đối với tài khoản cụ thể:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Khởi động gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Phê duyệt yêu cầu ghép đôi đầu tiên (nếu sử dụng chế độ ghép đôi)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Yêu cầu ghép đôi hết hạn sau 1 giờ. Yêu cầu đang chờ xử lý bị giới hạn ở 3 mỗi kênh.

  </Step>
</Steps>

<Note>
OpenClaw khuyến nghị chạy WhatsApp trên một số riêng biệt khi có thể. (Dữ liệu kênh và quy trình thiết lập được tối ưu hóa cho thiết lập đó, nhưng cũng hỗ trợ thiết lập số cá nhân.)
</Note>

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Số riêng biệt (khuyến nghị)">
    Đây là chế độ vận hành sạch nhất:

    - danh tính WhatsApp riêng cho OpenClaw
    - danh sách cho phép DM và ranh giới định tuyến rõ ràng hơn
    - giảm khả năng nhầm lẫn tự trò chuyện

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

  <Accordion title="Dự phòng số cá nhân">
    Onboarding hỗ trợ chế độ số cá nhân và ghi một cấu hình cơ bản thân thiện với tự trò chuyện:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bao gồm số cá nhân của bạn
    - `selfChatMode: true`

    Trong thời gian chạy, bảo vệ tự trò chuyện dựa trên số tự liên kết và `allowFrom`.

  </Accordion>

  <Accordion title="Phạm vi kênh chỉ WhatsApp Web">
    Kênh nền tảng nhắn tin là dựa trên WhatsApp Web (`Baileys`) trong kiến trúc kênh OpenClaw hiện tại.

    Không có kênh nhắn tin WhatsApp Twilio riêng biệt trong registry kênh chat tích hợp.

  </Accordion>
</AccordionGroup>

## Mô hình thời gian chạy

- Gateway sở hữu socket WhatsApp và vòng lặp kết nối lại.
- Gửi đi yêu cầu một listener WhatsApp hoạt động cho tài khoản mục tiêu.
- Trạng thái và chat phát sóng bị bỏ qua (`@status`, `@broadcast`).
- Chat trực tiếp sử dụng quy tắc phiên DM (`session.dmScope`; mặc định `main` gộp DMs vào phiên chính của agent).
- Phiên nhóm được cô lập (`agent:<agentId>:whatsapp:group:<jid>`).

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách DM">
    `channels.whatsapp.dmPolicy` kiểm soát truy cập chat trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `allowFrom` chấp nhận số theo kiểu E.164 (được chuẩn hóa nội bộ).

    Ghi đè nhiều tài khoản: `channels.whatsapp.accounts.<id>.dmPolicy` (và `allowFrom`) được ưu tiên hơn mặc định cấp kênh cho tài khoản đó.

    Chi tiết hành vi thời gian chạy:

    - ghép đôi được lưu trữ trong kho cho phép kênh và hợp nhất với `allowFrom` đã cấu hình
    - nếu không có danh sách cho phép nào được cấu hình, số tự liên kết được cho phép mặc định
    - DMs gửi đi `fromMe` không bao giờ tự động ghép đôi

  </Tab>

  <Tab title="Chính sách nhóm + danh sách cho phép">
    Truy cập nhóm có hai lớp:

    1. **Danh sách cho phép thành viên nhóm** (`channels.whatsapp.groups`)
       - nếu `groups` bị bỏ qua, tất cả các nhóm đều đủ điều kiện
       - nếu `groups` có mặt, nó hoạt động như một danh sách cho phép nhóm (`"*"` được phép)

    2. **Chính sách người gửi nhóm** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: bỏ qua danh sách cho phép người gửi
       - `allowlist`: người gửi phải khớp với `groupAllowFrom` (hoặc `*`)
       - `disabled`: chặn tất cả nhóm inbound

    Dự phòng danh sách cho phép người gửi:

    - nếu `groupAllowFrom` không được đặt, thời gian chạy sẽ dựa vào `allowFrom` khi có sẵn
    - danh sách cho phép người gửi được đánh giá trước khi kích hoạt nhắc/đáp

    Lưu ý: nếu không có khối `channels.whatsapp` nào tồn tại, dự phòng chính sách nhóm thời gian chạy là `allowlist` (với nhật ký cảnh báo), ngay cả khi `channels.defaults.groupPolicy` đã được đặt.

  </Tab>

  <Tab title="Nhắc + /kích hoạt">
    Trả lời nhóm yêu cầu nhắc theo mặc định.

    Phát hiện nhắc bao gồm:

    - nhắc WhatsApp rõ ràng về danh tính bot
    - mẫu regex nhắc được cấu hình (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - phát hiện trả lời ngầm định (người gửi trả lời khớp với danh tính bot)

    Lưu ý bảo mật:

    - chỉ trích dẫn/trả lời thỏa mãn điều kiện nhắc; nó không cấp quyền cho người gửi
    - với `groupPolicy: "allowlist"`, người gửi không có trong danh sách cho phép vẫn bị chặn ngay cả khi họ trả lời tin nhắn của người dùng trong danh sách cho phép

    Lệnh kích hoạt cấp phiên:

    - `/activation mention`
    - `/activation always`

    `activation` cập nhật trạng thái phiên (không phải cấu hình toàn cầu). Nó được bảo vệ bởi chủ sở hữu.

  </Tab>
</Tabs>

## Hành vi số cá nhân và tự trò chuyện

Khi số tự liên kết cũng có trong `allowFrom`, các biện pháp bảo vệ tự trò chuyện WhatsApp được kích hoạt:

- bỏ qua biên nhận đã đọc cho lượt tự trò chuyện
- bỏ qua hành vi tự động kích hoạt nhắc-JID mà nếu không sẽ tự ping
- nếu `messages.responsePrefix` không được đặt, trả lời tự trò chuyện mặc định là `[{identity.name}]` hoặc `[openclaw]`

## Chuẩn hóa tin nhắn và ngữ cảnh

<AccordionGroup>
  <Accordion title="Phong bì inbound + ngữ cảnh trả lời">
    Tin nhắn WhatsApp đến được bao bọc trong phong bì inbound chung.

    Nếu có trả lời trích dẫn, ngữ cảnh được thêm vào dưới dạng:

    ```text
    [Trả lời <người gửi> id:<stanzaId>]
    <nội dung trích dẫn hoặc chỗ giữ chỗ phương tiện>
    [/Trả lời]
    ```

    Các trường siêu dữ liệu trả lời cũng được điền khi có sẵn (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 của người gửi).

  </Accordion>

  <Accordion title="Chỗ giữ chỗ phương tiện và trích xuất vị trí/liên hệ">
    Tin nhắn inbound chỉ có phương tiện được chuẩn hóa với các chỗ giữ chỗ như:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Tải trọng vị trí và liên hệ được chuẩn hóa thành ngữ cảnh văn bản trước khi định tuyến.

  </Accordion>

  <Accordion title="Tiêm lịch sử nhóm đang chờ xử lý">
    Đối với các nhóm, các tin nhắn chưa được xử lý có thể được đệm và tiêm làm ngữ cảnh khi bot cuối cùng được kích hoạt.

    - giới hạn mặc định: `50`
    - cấu hình: `channels.whatsapp.historyLimit`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` vô hiệu hóa

    Các dấu hiệu tiêm:

    - `[Tin nhắn trò chuyện kể từ lần trả lời cuối cùng của bạn - để làm ngữ cảnh]`
    - `[Tin nhắn hiện tại - trả lời tin nhắn này]`

  </Accordion>

  <Accordion title="Biên nhận đã đọc">
    Biên nhận đã đọc được bật theo mặc định cho các tin nhắn WhatsApp inbound đã được chấp nhận.

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

    Ghi đè theo tài khoản:

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

    Lượt tự trò chuyện bỏ qua biên nhận đã đọc ngay cả khi đã bật toàn cầu.

  </Accordion>
</AccordionGroup>

## Giao hàng, chia nhỏ và phương tiện

<AccordionGroup>
  <Accordion title="Chia nhỏ văn bản">
    - giới hạn chia nhỏ mặc định: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - chế độ `newline` ưu tiên ranh giới đoạn văn (dòng trống), sau đó dự phòng chia nhỏ an toàn theo độ dài
  </Accordion>

  <Accordion title="Hành vi phương tiện gửi đi">
    - hỗ trợ hình ảnh, video, âm thanh (ghi chú giọng nói PTT) và tải trọng tài liệu
    - `audio/ogg` được viết lại thành `audio/ogg; codecs=opus` để tương thích với ghi chú giọng nói
    - phát lại GIF động được hỗ trợ qua `gifPlayback: true` khi gửi video
    - chú thích được áp dụng cho mục phương tiện đầu tiên khi gửi tải trọng trả lời đa phương tiện
    - nguồn phương tiện có thể là HTTP(S), `file://`, hoặc đường dẫn cục bộ
  </Accordion>

  <Accordion title="Giới hạn kích thước phương tiện và hành vi dự phòng">
    - giới hạn lưu phương tiện inbound: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - giới hạn gửi phương tiện outbound: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - ghi đè theo tài khoản sử dụng `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - hình ảnh được tối ưu hóa tự động (thay đổi kích thước/chất lượng) để phù hợp với giới hạn
    - khi gửi phương tiện thất bại, mục đầu tiên dự phòng gửi cảnh báo văn bản thay vì bỏ qua phản hồi một cách im lặng
  </Accordion>
</AccordionGroup>

## Phản ứng xác nhận

WhatsApp hỗ trợ phản ứng xác nhận ngay lập tức khi nhận inbound qua `channels.whatsapp.ackReaction`.

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
- chế độ nhóm `mentions` phản ứng khi lượt được kích hoạt bởi nhắc; kích hoạt nhóm `always` hoạt động như bỏ qua cho kiểm tra này
- WhatsApp sử dụng `channels.whatsapp.ackReaction` (không sử dụng `messages.ackReaction` cũ ở đây)

## Nhiều tài khoản và thông tin xác thực

<AccordionGroup>
  <Accordion title="Lựa chọn tài khoản và mặc định">
    - id tài khoản đến từ `channels.whatsapp.accounts`
    - lựa chọn tài khoản mặc định: `default` nếu có, nếu không thì id tài khoản đầu tiên được cấu hình (sắp xếp)
    - id tài khoản được chuẩn hóa nội bộ để tra cứu
  </Accordion>

  <Accordion title="Đường dẫn thông tin xác thực và khả năng tương thích cũ">
    - đường dẫn xác thực hiện tại: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - tệp sao lưu: `creds.json.bak`
    - xác thực mặc định cũ trong `~/.openclaw/credentials/` vẫn được nhận diện/chuyển đổi cho các luồng tài khoản mặc định
  </Accordion>

  <Accordion title="Hành vi đăng xuất">
    `openclaw channels logout --channel whatsapp [--account <id>]` xóa trạng thái xác thực WhatsApp cho tài khoản đó.

    Trong các thư mục xác thực cũ, `oauth.json` được giữ lại trong khi các tệp xác thực Baileys bị xóa.

  </Accordion>
</AccordionGroup>

## Công cụ, hành động và ghi cấu hình

- Hỗ trợ công cụ Agent bao gồm hành động phản ứng WhatsApp (`react`).
- Cổng hành động:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Ghi cấu hình do kênh khởi tạo được bật theo mặc định (vô hiệu hóa qua `channels.whatsapp.configWrites=false`).

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
    Gửi đi thất bại nhanh chóng khi không có listener gateway hoạt động cho tài khoản mục tiêu.

    Đảm bảo gateway đang chạy và tài khoản đã được liên kết.

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua không mong muốn">
    Kiểm tra theo thứ tự này:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - mục danh sách cho phép `groups`
    - điều kiện nhắc (`requireMention` + mẫu nhắc)
    - khóa trùng lặp trong `openclaw.json` (JSON5): các mục nhập sau ghi đè các mục nhập trước đó, vì vậy hãy giữ một `groupPolicy` duy nhất cho mỗi phạm vi

  </Accordion>

  <Accordion title="Cảnh báo runtime Bun">
    Runtime gateway WhatsApp nên sử dụng Node. Bun được đánh dấu là không tương thích cho hoạt động gateway WhatsApp/Telegram ổn định.
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
- hành vi phiên: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## Liên quan

- [Ghép đôi](/channels/pairing)
- [Định tuyến kênh](/channels/channel-routing)
- [Định tuyến nhiều agent](/concepts/multi-agent)
- [Khắc phục sự cố](/channels/troubleshooting)
