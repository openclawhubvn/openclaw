---
summary: "Tìm hiểu cách định tuyến kênh WhatsApp, Telegram, Discord, Slack để tối ưu hóa giao tiếp và chia sẻ ngữ cảnh hiệu quả."
read_when:
  - Thay đổi định tuyến kênh hoặc hành vi hộp thư
title: "Hướng Dẫn Định Tuyến Kênh Trên OpenClaw"
---

# Kênh & định tuyến

OpenClaw định tuyến phản hồi **trở lại kênh nơi tin nhắn được gửi đến**. Mô hình không chọn kênh; định tuyến được xác định và kiểm soát bởi cấu hình của máy chủ.

## Thuật ngữ chính

- **Channel**: `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`, `webchat`.
- **AccountId**: phiên bản tài khoản theo từng kênh (khi được hỗ trợ).
- Tài khoản mặc định tùy chọn cho kênh: `channels.<channel>.defaultAccount` chọn tài khoản nào được sử dụng khi đường dẫn gửi đi không chỉ định `accountId`.
  - Trong cấu hình nhiều tài khoản, cần thiết lập mặc định rõ ràng (`defaultAccount` hoặc `accounts.default`) khi có hai hoặc nhiều tài khoản được cấu hình. Nếu không có, định tuyến dự phòng có thể chọn ID tài khoản đã chuẩn hóa đầu tiên.
- **AgentId**: một workspace + kho lưu trữ phiên độc lập (“bộ nhớ”).
- **SessionKey**: khóa dùng để lưu trữ ngữ cảnh và kiểm soát đồng thời.

## Hình dạng khóa phiên (ví dụ)

Tin nhắn trực tiếp gộp vào phiên **chính** của agent:

- `agent:<agentId>:<mainKey>` (mặc định: `agent:main:main`)

Nhóm và kênh vẫn được cách ly theo từng kênh:

- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Kênh/phòng: `agent:<agentId>:<channel>:channel:<id>`

Chuỗi:

- Chuỗi Slack/Discord thêm `:thread:<threadId>` vào khóa cơ bản.
- Chủ đề diễn đàn Telegram nhúng `:topic:<topicId>` vào khóa nhóm.

Ví dụ:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Ghim định tuyến DM chính

Khi `session.dmScope` là `main`, tin nhắn trực tiếp có thể chia sẻ một phiên chính. Để ngăn `lastRoute` của phiên bị ghi đè bởi DM không phải chủ sở hữu, OpenClaw suy ra một chủ sở hữu được ghim từ `allowFrom` khi tất cả các điều kiện sau đúng:

- `allowFrom` có chính xác một mục không phải ký tự đại diện.
- Mục có thể chuẩn hóa thành ID người gửi cụ thể cho kênh đó.
- Người gửi DM đến không khớp với chủ sở hữu được ghim đó.

Trong trường hợp không khớp, OpenClaw vẫn ghi lại metadata phiên đến, nhưng bỏ qua việc cập nhật `lastRoute` của phiên chính.

## Quy tắc định tuyến (cách chọn agent)

Định tuyến chọn **một agent** cho mỗi tin nhắn đến:

1. **Khớp đồng cấp chính xác** (`bindings` với `peer.kind` + `peer.id`).
2. **Khớp đồng cấp cha mẹ** (kế thừa chuỗi).
3. **Khớp guild + vai trò** (Discord) qua `guildId` + `roles`.
4. **Khớp guild** (Discord) qua `guildId`.
5. **Khớp team** (Slack) qua `teamId`.
6. **Khớp tài khoản** (`accountId` trên kênh).
7. **Khớp kênh** (bất kỳ tài khoản nào trên kênh đó, `accountId: "*"`).
8. **Agent mặc định** (`agents.list[].default`, nếu không có thì mục đầu tiên trong danh sách, dự phòng là `main`).

Khi một binding bao gồm nhiều trường khớp (`peer`, `guildId`, `teamId`, `roles`), **tất cả các trường được cung cấp phải khớp** để binding đó áp dụng.

Agent được chọn xác định workspace và kho lưu trữ phiên nào được sử dụng.

## Nhóm phát sóng (chạy nhiều agent)

Nhóm phát sóng cho phép bạn chạy **nhiều agent** cho cùng một đồng cấp **khi OpenClaw thường phản hồi** (ví dụ: trong các nhóm WhatsApp, sau khi kích hoạt/đề cập).

Cấu hình:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Xem: [Nhóm phát sóng](/channels/broadcast-groups).

## Tổng quan cấu hình

- `agents.list`: định nghĩa agent được đặt tên (workspace, model, v.v.).
- `bindings`: ánh xạ kênh/tài khoản/đồng cấp đến agent.

Ví dụ:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Lưu trữ phiên

Kho lưu trữ phiên nằm dưới thư mục trạng thái (mặc định `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Bản ghi JSONL nằm cùng với kho lưu trữ

Bạn có thể ghi đè đường dẫn kho lưu trữ qua `session.store` và `{agentId}`.

Khám phá phiên Gateway và ACP cũng quét các kho lưu trữ agent trên đĩa dưới thư mục gốc `agents/` mặc định và dưới các thư mục `session.store` đã được định dạng. Các kho lưu trữ được phát hiện phải nằm trong thư mục gốc agent đã được giải quyết và sử dụng tệp `sessions.json` thông thường. Symlink và các đường dẫn ngoài thư mục gốc sẽ bị bỏ qua.

## Hành vi WebChat

WebChat gắn vào **agent được chọn** và mặc định vào phiên chính của agent. Vì vậy, WebChat cho phép bạn xem ngữ cảnh chéo kênh cho agent đó tại một nơi.

## Ngữ cảnh phản hồi

Phản hồi đến bao gồm:

- `ReplyToId`, `ReplyToBody`, và `ReplyToSender` khi có sẵn.
- Ngữ cảnh được trích dẫn được thêm vào `Body` dưới dạng khối `[Replying to ...]`.

Điều này nhất quán trên các kênh.
