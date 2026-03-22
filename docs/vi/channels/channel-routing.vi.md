# Channel Routing

OpenClaw định tuyến phản hồi **trở lại kênh mà tin nhắn đến**. Mô hình không tự chọn kênh; định tuyến được kiểm soát bởi cấu hình host.

## Thuật ngữ chính

- **Channel**: `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`, `webchat`.
- **AccountId**: instance tài khoản theo kênh (khi được hỗ trợ).
- Tài khoản mặc định cho kênh (tùy chọn): `channels.<channel>.defaultAccount` chọn tài khoản dùng khi đường dẫn outbound không chỉ định `accountId`.
  - Trong cấu hình nhiều tài khoản, cần đặt mặc định rõ ràng (`defaultAccount` hoặc `accounts.default`) khi có từ hai tài khoản trở lên. Nếu không, định tuyến dự phòng có thể chọn ID tài khoản chuẩn hóa đầu tiên.
- **AgentId**: workspace + session store cách ly (“brain”).
- **SessionKey**: khóa bucket dùng để lưu trữ context và kiểm soát đồng thời.

## Hình dạng khóa session (ví dụ)

Tin nhắn trực tiếp gộp vào session **chính** của agent:

- `agent:<agentId>:<mainKey>` (mặc định: `agent:main:main`)

Nhóm và kênh vẫn cách ly theo kênh:

- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Kênh/phòng: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Threads Slack/Discord thêm `:thread:<threadId>` vào khóa gốc.
- Chủ đề diễn đàn Telegram nhúng `:topic:<topicId>` vào khóa nhóm.

Ví dụ:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Ghim route DM chính

Khi `session.dmScope` là `main`, tin nhắn trực tiếp có thể chia sẻ một session chính. Để tránh `lastRoute` của session bị ghi đè bởi DM không phải chủ sở hữu, OpenClaw suy ra chủ sở hữu ghim từ `allowFrom` khi tất cả điều kiện sau đúng:

- `allowFrom` có đúng một mục không phải wildcard.
- Mục có thể chuẩn hóa thành ID người gửi cụ thể cho kênh đó.
- Người gửi DM inbound không khớp với chủ sở hữu ghim.

Trong trường hợp không khớp, OpenClaw vẫn ghi lại metadata session inbound, nhưng bỏ qua việc cập nhật `lastRoute` của session chính.

## Quy tắc định tuyến (cách chọn agent)

Định tuyến chọn **một agent** cho mỗi tin nhắn inbound:

1. **Khớp peer chính xác** (`bindings` với `peer.kind` + `peer.id`).
2. **Khớp peer cha** (kế thừa thread).
3. **Khớp Guild + roles** (Discord) qua `guildId` + `roles`.
4. **Khớp Guild** (Discord) qua `guildId`.
5. **Khớp Team** (Slack) qua `teamId`.
6. **Khớp Account** (`accountId` trên kênh).
7. **Khớp Channel** (bất kỳ tài khoản nào trên kênh đó, `accountId: "*"`).
8. **Agent mặc định** (`agents.list[].default`, nếu không có thì mục đầu tiên trong danh sách, dự phòng là `main`).

Khi một binding bao gồm nhiều trường khớp (`peer`, `guildId`, `teamId`, `roles`), **tất cả các trường cung cấp phải khớp** để binding đó áp dụng.

Agent khớp quyết định workspace và session store nào được sử dụng.

## Nhóm phát sóng (chạy nhiều agent)

Nhóm phát sóng cho phép chạy **nhiều agent** cho cùng một peer **khi OpenClaw thường phản hồi** (ví dụ: trong nhóm WhatsApp, sau khi mention/activation gating).

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

Xem thêm: [Broadcast Groups](/channels/broadcast-groups).

## Tổng quan cấu hình

- `agents.list`: định nghĩa agent có tên (workspace, model, v.v.).
- `bindings`: ánh xạ kênh/tài khoản/peer inbound tới agents.

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

## Lưu trữ session

Session store nằm dưới thư mục state (mặc định `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL transcripts nằm cùng với store

Có thể ghi đè đường dẫn store qua `session.store` và `{agentId}` templating.

Gateway và ACP session discovery cũng quét các agent store lưu trên đĩa dưới root `agents/` mặc định và dưới các root `session.store` templated. Các store được phát hiện phải nằm trong root agent đã giải quyết và sử dụng file `sessions.json` thông thường. Symlinks và đường dẫn ngoài root bị bỏ qua.

## Hành vi WebChat

WebChat gắn với **agent đã chọn** và mặc định vào session chính của agent. Vì vậy, WebChat cho phép xem context cross-channel cho agent đó tại một nơi.

## Ngữ cảnh phản hồi

Phản hồi inbound bao gồm:

- `ReplyToId`, `ReplyToBody`, và `ReplyToSender` khi có sẵn.
- Ngữ cảnh trích dẫn được thêm vào `Body` dưới dạng block `[Replying to ...]`.

Điều này nhất quán trên các kênh.\n