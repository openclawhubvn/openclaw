---
summary: "Hỗ trợ iMessage cũ qua imsg (JSON-RPC qua stdio). Các thiết lập mới nên dùng BlueBubbles."
read_when:
  - Thiết lập hỗ trợ iMessage
  - Gỡ lỗi gửi/nhận iMessage
title: "iMessage"
---

# iMessage (cũ: imsg)

<Warning>
Đối với các triển khai iMessage mới, hãy sử dụng <a href="/channels/bluebubbles">BlueBubbles</a>.

Tích hợp `imsg` là cũ và có thể bị loại bỏ trong các phiên bản tương lai.
</Warning>

Trạng thái: tích hợp CLI bên ngoài cũ. Gateway khởi chạy `imsg rpc` và giao tiếp qua JSON-RPC trên stdio (không có daemon/port riêng).

<CardGroup cols={3}>
  <Card title="BlueBubbles (khuyến nghị)" icon="message-circle" href="/channels/bluebubbles">
    Đường dẫn iMessage ưu tiên cho các thiết lập mới.
  </Card>
  <Card title="Ghép nối" icon="link" href="/channels/pairing">
    iMessage DMs mặc định ở chế độ ghép nối.
  </Card>
  <Card title="Tham khảo cấu hình" icon="settings" href="/gateway/configuration-reference#imessage">
    Tham khảo đầy đủ các trường iMessage.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Tabs>
  <Tab title="Mac cục bộ (đường nhanh)">
    <Steps>
      <Step title="Cài đặt và xác minh imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Cấu hình OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/<you>/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Khởi động gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Phê duyệt ghép nối DM đầu tiên (dmPolicy mặc định)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Yêu cầu ghép nối hết hạn sau 1 giờ.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac từ xa qua SSH">
    OpenClaw chỉ yêu cầu một `cliPath` tương thích stdio, vì vậy bạn có thể chỉ định `cliPath` vào một script wrapper SSH tới một Mac từ xa và chạy `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Cấu hình khuyến nghị khi đính kèm được bật:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // dùng để lấy đính kèm qua SCP
      includeAttachments: true,
      // Tùy chọn: ghi đè các gốc đính kèm được phép.
      // Mặc định bao gồm /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Nếu `remoteHost` không được thiết lập, OpenClaw sẽ cố gắng tự động phát hiện bằng cách phân tích script wrapper SSH.
    `remoteHost` phải là `host` hoặc `user@host` (không có khoảng trắng hoặc tùy chọn SSH).
    OpenClaw sử dụng kiểm tra khóa host nghiêm ngặt cho SCP, vì vậy khóa host relay phải tồn tại trong `~/.ssh/known_hosts`.
    Đường dẫn đính kèm được xác thực so với các gốc được phép (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Yêu cầu và quyền (macOS)

- Messages phải được đăng nhập trên Mac chạy `imsg`.
- Quyền truy cập toàn bộ ổ đĩa là cần thiết cho ngữ cảnh tiến trình chạy OpenClaw/`imsg` (truy cập DB Messages).
- Quyền tự động hóa là cần thiết để gửi tin nhắn qua Messages.app.

<Tip>
Quyền được cấp theo ngữ cảnh tiến trình. Nếu gateway chạy không có giao diện (LaunchAgent/SSH), hãy chạy một lệnh tương tác một lần trong cùng ngữ cảnh để kích hoạt các thông báo:

```bash
imsg chats --limit 1
# hoặc
imsg send <handle> "test"
```

</Tip>

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="Chính sách DM">
    `channels.imessage.dmPolicy` kiểm soát tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    Trường danh sách cho phép: `channels.imessage.allowFrom`.

    Các mục trong danh sách cho phép có thể là handles hoặc mục tiêu chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Chính sách nhóm + đề cập">
    `channels.imessage.groupPolicy` kiểm soát xử lý nhóm:

    - `allowlist` (mặc định khi được cấu hình)
    - `open`
    - `disabled`

    Danh sách cho phép người gửi nhóm: `channels.imessage.groupAllowFrom`.

    Dự phòng thời gian chạy: nếu `groupAllowFrom` không được thiết lập, kiểm tra người gửi nhóm iMessage sẽ dựa vào `allowFrom` khi có sẵn.
    Ghi chú thời gian chạy: nếu `channels.imessage` hoàn toàn thiếu, thời gian chạy sẽ dựa vào `groupPolicy="allowlist"` và ghi lại cảnh báo (ngay cả khi `channels.defaults.groupPolicy` được thiết lập).

    Kiểm soát đề cập cho nhóm:

    - iMessage không có metadata đề cập gốc
    - phát hiện đề cập sử dụng mẫu regex (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - nếu không có mẫu được cấu hình, kiểm soát đề cập không thể được thực thi

    Các lệnh điều khiển từ người gửi được ủy quyền có thể bỏ qua kiểm soát đề cập trong nhóm.

  </Tab>

  <Tab title="Phiên và trả lời xác định">
    - DMs sử dụng định tuyến trực tiếp; nhóm sử dụng định tuyến nhóm.
    - Với `session.dmScope=main` mặc định, DMs iMessage gộp vào phiên chính của agent.
    - Phiên nhóm được cô lập (`agent:<agentId>:imessage:group:<chat_id>`).
    - Trả lời được định tuyến lại iMessage sử dụng metadata kênh/mục tiêu gốc.

    Hành vi luồng giống nhóm:

    Một số luồng iMessage nhiều người tham gia có thể đến với `is_group=false`.
    Nếu `chat_id` đó được cấu hình rõ ràng dưới `channels.imessage.groups`, OpenClaw xử lý nó như lưu lượng nhóm (kiểm soát nhóm + cô lập phiên nhóm).

  </Tab>
</Tabs>

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Người dùng macOS bot chuyên dụng (danh tính iMessage riêng biệt)">
    Sử dụng một Apple ID và người dùng macOS chuyên dụng để lưu lượng bot được tách biệt khỏi hồ sơ Messages cá nhân của bạn.

    Quy trình điển hình:

    1. Tạo/đăng nhập một người dùng macOS chuyên dụng.
    2. Đăng nhập vào Messages với Apple ID bot trong người dùng đó.
    3. Cài đặt `imsg` trong người dùng đó.
    4. Tạo SSH wrapper để OpenClaw có thể chạy `imsg` trong ngữ cảnh người dùng đó.
    5. Chỉ định `channels.imessage.accounts.<id>.cliPath` và `.dbPath` vào hồ sơ người dùng đó.

    Lần chạy đầu tiên có thể yêu cầu phê duyệt GUI (Tự động hóa + Truy cập toàn bộ ổ đĩa) trong phiên người dùng bot đó.

  </Accordion>

  <Accordion title="Mac từ xa qua Tailscale (ví dụ)">
    Cấu trúc phổ biến:

    - gateway chạy trên Linux/VM
    - iMessage + `imsg` chạy trên một Mac trong mạng tailnet của bạn
    - `cliPath` wrapper sử dụng SSH để chạy `imsg`
    - `remoteHost` cho phép lấy đính kèm qua SCP

    Ví dụ:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    Sử dụng khóa SSH để cả SSH và SCP không cần tương tác.
    Đảm bảo khóa host được tin cậy trước (ví dụ `ssh bot@mac-mini.tailnet-1234.ts.net`) để `known_hosts` được điền.

  </Accordion>

  <Accordion title="Mẫu nhiều tài khoản">
    iMessage hỗ trợ cấu hình theo từng tài khoản dưới `channels.imessage.accounts`.

    Mỗi tài khoản có thể ghi đè các trường như `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, cài đặt lịch sử và danh sách cho phép gốc đính kèm.

  </Accordion>
</AccordionGroup>

## Media, chia nhỏ, và mục tiêu gửi

<AccordionGroup>
  <Accordion title="Đính kèm và media">
    - việc tiếp nhận đính kèm đầu vào là tùy chọn: `channels.imessage.includeAttachments`
    - đường dẫn đính kèm từ xa có thể được lấy qua SCP khi `remoteHost` được thiết lập
    - đường dẫn đính kèm phải khớp với các gốc được phép:
      - `channels.imessage.attachmentRoots` (cục bộ)
      - `channels.imessage.remoteAttachmentRoots` (chế độ SCP từ xa)
      - mẫu gốc mặc định: `/Users/*/Library/Messages/Attachments`
    - SCP sử dụng kiểm tra khóa host nghiêm ngặt (`StrictHostKeyChecking=yes`)
    - kích thước media gửi đi sử dụng `channels.imessage.mediaMaxMb` (mặc định 16 MB)
  </Accordion>

  <Accordion title="Chia nhỏ gửi đi">
    - giới hạn chia nhỏ văn bản: `channels.imessage.textChunkLimit` (mặc định 4000)
    - chế độ chia nhỏ: `channels.imessage.chunkMode`
      - `length` (mặc định)
      - `newline` (chia theo đoạn đầu tiên)
  </Accordion>

  <Accordion title="Định dạng địa chỉ">
    Mục tiêu rõ ràng được ưu tiên:

    - `chat_id:123` (khuyến nghị cho định tuyến ổn định)
    - `chat_guid:...`
    - `chat_identifier:...`

    Các mục tiêu handle cũng được hỗ trợ:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Ghi cấu hình

iMessage cho phép ghi cấu hình khởi tạo từ kênh theo mặc định (cho `/config set|unset` khi `commands.config: true`).

Vô hiệu hóa:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="imsg không tìm thấy hoặc RPC không được hỗ trợ">
    Xác minh binary và hỗ trợ RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Nếu probe báo cáo RPC không được hỗ trợ, hãy cập nhật `imsg`.

  </Accordion>

  <Accordion title="DMs bị bỏ qua">
    Kiểm tra:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - phê duyệt ghép nối (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua">
    Kiểm tra:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - hành vi danh sách cho phép `channels.imessage.groups`
    - cấu hình mẫu đề cập (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Đính kèm từ xa thất bại">
    Kiểm tra:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - xác thực khóa SSH/SCP từ máy chủ gateway
    - khóa host tồn tại trong `~/.ssh/known_hosts` trên máy chủ gateway
    - khả năng đọc đường dẫn từ xa trên Mac chạy Messages

  </Accordion>

  <Accordion title="Các thông báo quyền macOS bị bỏ lỡ">
    Chạy lại trong một terminal GUI tương tác trong cùng ngữ cảnh người dùng/phiên và phê duyệt các thông báo:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Xác nhận Truy cập toàn bộ ổ đĩa + Tự động hóa được cấp cho ngữ cảnh tiến trình chạy OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Tham khảo cấu hình

- [Tham khảo cấu hình - iMessage](/gateway/configuration-reference#imessage)
- [Cấu hình Gateway](/gateway/configuration)
- [Ghép nối](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)
