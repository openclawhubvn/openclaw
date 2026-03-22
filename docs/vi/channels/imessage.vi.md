---
summary: "Hỗ trợ iMessage cũ qua imsg (JSON-RPC qua stdio). Cài mới nên dùng BlueBubbles."
read_when:
  - Cài đặt hỗ trợ iMessage
  - Debug gửi/nhận iMessage
title: "iMessage"
---

# iMessage (cũ: imsg)

<Warning>
Với các triển khai iMessage mới, nên dùng <a href="/channels/bluebubbles">BlueBubbles</a>.

Tích hợp `imsg` là cũ và có thể bị loại bỏ trong bản phát hành tương lai.
</Warning>

Trạng thái: tích hợp CLI bên ngoài cũ. Gateway khởi chạy `imsg rpc` và giao tiếp qua JSON-RPC trên stdio (không có daemon/port riêng).

<CardGroup cols={3}>
  <Card title="BlueBubbles (khuyến nghị)" icon="message-circle" href="/channels/bluebubbles">
    Đường dẫn iMessage ưu tiên cho cài đặt mới.
  </Card>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    iMessage DMs mặc định ở chế độ pairing.
  </Card>
  <Card title="Tham khảo cấu hình" icon="settings" href="/gateway/configuration-reference#imessage">
    Tham khảo đầy đủ các trường iMessage.
  </Card>
</CardGroup>

## Cài đặt nhanh

<Tabs>
  <Tab title="Local Mac (đường nhanh)">
    <Steps>
      <Step title="Cài đặt và kiểm tra imsg">

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

      <Step title="Duyệt pairing DM đầu tiên (dmPolicy mặc định)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Yêu cầu pairing hết hạn sau 1 giờ.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac qua SSH">
    OpenClaw chỉ cần `cliPath` tương thích stdio, nên có thể trỏ `cliPath` vào script wrapper SSH tới Mac từ xa và chạy `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Cấu hình khuyến nghị khi bật đính kèm:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // dùng cho SCP lấy đính kèm
      includeAttachments: true,
      // Tùy chọn: ghi đè các gốc đính kèm cho phép.
      // Mặc định bao gồm /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Nếu không đặt `remoteHost`, OpenClaw cố gắng tự động phát hiện bằng cách phân tích script wrapper SSH.
    `remoteHost` phải là `host` hoặc `user@host` (không có khoảng trắng hoặc tùy chọn SSH).
    OpenClaw sử dụng kiểm tra khóa host nghiêm ngặt cho SCP, nên khóa host relay phải tồn tại trong `~/.ssh/known_hosts`.
    Đường dẫn đính kèm được xác thực so với các gốc cho phép (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Yêu cầu và quyền (macOS)

- Messages phải được đăng nhập trên Mac chạy `imsg`.
- Cần quyền Truy cập Đĩa Đầy đủ cho ngữ cảnh tiến trình chạy OpenClaw/`imsg` (truy cập DB Messages).
- Cần quyền Tự động hóa để gửi tin nhắn qua Messages.app.

<Tip>
Quyền được cấp theo ngữ cảnh tiến trình. Nếu gateway chạy không có giao diện (LaunchAgent/SSH), chạy một lệnh tương tác một lần trong cùng ngữ cảnh để kích hoạt nhắc nhở:

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

    Trường allowlist: `channels.imessage.allowFrom`.

    Mục allowlist có thể là handles hoặc mục tiêu chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Chính sách nhóm + mentions">
    `channels.imessage.groupPolicy` kiểm soát xử lý nhóm:

    - `allowlist` (mặc định khi được cấu hình)
    - `open`
    - `disabled`

    Allowlist người gửi nhóm: `channels.imessage.groupAllowFrom`.

    Dự phòng runtime: nếu `groupAllowFrom` không được đặt, kiểm tra người gửi nhóm iMessage dựa vào `allowFrom` khi có sẵn.
    Ghi chú runtime: nếu `channels.imessage` hoàn toàn thiếu, runtime dựa vào `groupPolicy="allowlist"` và ghi log cảnh báo (ngay cả khi `channels.defaults.groupPolicy` được đặt).

    Gating mention cho nhóm:

    - iMessage không có metadata mention gốc
    - phát hiện mention sử dụng mẫu regex (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - nếu không có mẫu cấu hình, không thể thực thi gating mention

    Lệnh điều khiển từ người gửi được ủy quyền có thể bỏ qua gating mention trong nhóm.

  </Tab>

  <Tab title="Sessions và phản hồi xác định">
    - DMs sử dụng định tuyến trực tiếp; nhóm sử dụng định tuyến nhóm.
    - Với `session.dmScope=main` mặc định, DMs iMessage gộp vào session chính của agent.
    - Sessions nhóm được cô lập (`agent:<agentId>:imessage:group:<chat_id>`).
    - Phản hồi định tuyến trở lại iMessage sử dụng metadata kênh/mục tiêu gốc.

    Hành vi luồng nhóm-ish:

    Một số luồng iMessage nhiều người tham gia có thể đến với `is_group=false`.
    Nếu `chat_id` đó được cấu hình rõ ràng dưới `channels.imessage.groups`, OpenClaw xử lý nó như lưu lượng nhóm (gating nhóm + cô lập session nhóm).

  </Tab>
</Tabs>

## Mô hình triển khai

<AccordionGroup>
  <Accordion title="Người dùng macOS bot riêng biệt (danh tính iMessage riêng)">
    Sử dụng Apple ID và người dùng macOS riêng biệt để lưu lượng bot được tách biệt khỏi hồ sơ Messages cá nhân.

    Luồng điển hình:

    1. Tạo/đăng nhập người dùng macOS riêng biệt.
    2. Đăng nhập vào Messages với Apple ID bot trong người dùng đó.
    3. Cài đặt `imsg` trong người dùng đó.
    4. Tạo SSH wrapper để OpenClaw có thể chạy `imsg` trong ngữ cảnh người dùng đó.
    5. Trỏ `channels.imessage.accounts.<id>.cliPath` và `.dbPath` vào hồ sơ người dùng đó.

    Lần chạy đầu tiên có thể yêu cầu phê duyệt GUI (Tự động hóa + Truy cập Đĩa Đầy đủ) trong session người dùng bot đó.

  </Accordion>

  <Accordion title="Remote Mac qua Tailscale (ví dụ)">
    Topology phổ biến:

    - gateway chạy trên Linux/VM
    - iMessage + `imsg` chạy trên Mac trong tailnet
    - wrapper `cliPath` sử dụng SSH để chạy `imsg`
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

    Sử dụng khóa SSH để cả SSH và SCP không tương tác.
    Đảm bảo khóa host được tin cậy trước (ví dụ `ssh bot@mac-mini.tailnet-1234.ts.net`) để `known_hosts` được điền.

  </Accordion>

  <Accordion title="Mô hình nhiều tài khoản">
    iMessage hỗ trợ cấu hình theo tài khoản dưới `channels.imessage.accounts`.

    Mỗi tài khoản có thể ghi đè các trường như `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, cài đặt lịch sử và danh sách gốc đính kèm cho phép.

  </Accordion>
</AccordionGroup>

## Media, chunking, và mục tiêu gửi

<AccordionGroup>
  <Accordion title="Đính kèm và media">
    - nhập đính kèm inbound là tùy chọn: `channels.imessage.includeAttachments`
    - đường dẫn đính kèm từ xa có thể được lấy qua SCP khi `remoteHost` được đặt
    - đường dẫn đính kèm phải khớp với các gốc cho phép:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (chế độ SCP từ xa)
      - mẫu gốc mặc định: `/Users/*/Library/Messages/Attachments`
    - SCP sử dụng kiểm tra khóa host nghiêm ngặt (`StrictHostKeyChecking=yes`)
    - kích thước media outbound sử dụng `channels.imessage.mediaMaxMb` (mặc định 16 MB)
  </Accordion>

  <Accordion title="Chunking outbound">
    - giới hạn chunk văn bản: `channels.imessage.textChunkLimit` (mặc định 4000)
    - chế độ chunk: `channels.imessage.chunkMode`
      - `length` (mặc định)
      - `newline` (tách đoạn đầu tiên)
  </Accordion>

  <Accordion title="Định dạng địa chỉ">
    Mục tiêu rõ ràng ưu tiên:

    - `chat_id:123` (khuyến nghị cho định tuyến ổn định)
    - `chat_guid:...`
    - `chat_identifier:...`

    Mục tiêu handle cũng được hỗ trợ:

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

Tắt:

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
    Kiểm tra binary và hỗ trợ RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Nếu probe báo cáo RPC không được hỗ trợ, cập nhật `imsg`.

  </Accordion>

  <Accordion title="DMs bị bỏ qua">
    Kiểm tra:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - phê duyệt pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua">
    Kiểm tra:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - hành vi allowlist `channels.imessage.groups`
    - cấu hình mẫu mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Đính kèm từ xa thất bại">
    Kiểm tra:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - xác thực khóa SSH/SCP từ máy chủ gateway
    - khóa host tồn tại trong `~/.ssh/known_hosts` trên máy chủ gateway
    - khả năng đọc đường dẫn từ xa trên Mac chạy Messages

  </Accordion>

  <Accordion title="Bỏ lỡ nhắc nhở quyền macOS">
    Chạy lại trong terminal GUI tương tác trong cùng ngữ cảnh người dùng/session và phê duyệt nhắc nhở:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Xác nhận Truy cập Đĩa Đầy đủ + Tự động hóa được cấp cho ngữ cảnh tiến trình chạy OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Tham khảo cấu hình

- [Tham khảo cấu hình - iMessage](/gateway/configuration-reference#imessage)
- [Cấu hình Gateway](/gateway/configuration)
- [Pairing](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)\n