---
summary: "Hành vi chat nhóm trên các nền tảng (WhatsApp/Telegram/Discord/Slack/Signal/iMessage/Microsoft Teams/Zalo)"
read_when:
  - Thay đổi hành vi chat nhóm hoặc điều chỉnh mention
title: "Nhóm"
---

# Nhóm

OpenClaw xử lý chat nhóm nhất quán trên các nền tảng: WhatsApp, Telegram, Discord, Slack, Signal, iMessage, Microsoft Teams, Zalo.

## Giới thiệu cơ bản (2 phút)

OpenClaw hoạt động trên tài khoản nhắn tin của bạn. Không có bot WhatsApp riêng biệt. Nếu **bạn** trong nhóm, OpenClaw có thể thấy và phản hồi.

Hành vi mặc định:

- Nhóm bị giới hạn (`groupPolicy: "allowlist"`).
- Phản hồi yêu cầu mention trừ khi bạn tắt điều này.

Dịch: chỉ những người trong danh sách cho phép mới kích hoạt OpenClaw bằng cách mention.

> TL;DR
>
> - **Truy cập DM** được kiểm soát bởi `*.allowFrom`.
> - **Truy cập nhóm** được kiểm soát bởi `*.groupPolicy` + danh sách cho phép (`*.groups`, `*.groupAllowFrom`).
> - **Kích hoạt phản hồi** được kiểm soát bởi điều chỉnh mention (`requireMention`, `/activation`).

Luồng nhanh (xử lý tin nhắn nhóm):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

![Luồng tin nhắn nhóm](/images/groups-flow.svg)

Nếu bạn muốn...

| Mục tiêu                                      | Cài đặt gì                                                |
| --------------------------------------------- | --------------------------------------------------------- |
| Cho phép tất cả nhóm nhưng chỉ phản hồi khi @mention | `groups: { "*": { requireMention: true } }`               |
| Tắt tất cả phản hồi nhóm                       | `groupPolicy: "disabled"`                                 |
| Chỉ cho phép nhóm cụ thể                       | `groups: { "<group-id>": { ... } }` (không có khóa `"*"` )|
| Chỉ bạn có thể kích hoạt trong nhóm            | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`|

## Khóa phiên

- Phiên nhóm dùng khóa `agent:<agentId>:<channel>:group:<id>` (phòng/kênh dùng `agent:<agentId>:<channel>:channel:<id>`).
- Chủ đề diễn đàn Telegram thêm `:topic:<threadId>` vào id nhóm để mỗi chủ đề có phiên riêng.
- Chat trực tiếp dùng phiên chính (hoặc theo người gửi nếu cấu hình).
- Bỏ qua heartbeat cho phiên nhóm.

## Mẫu: DMs cá nhân + nhóm công khai (một agent)

Có — hoạt động tốt nếu lưu lượng "cá nhân" là **DMs** và lưu lượng "công khai" là **nhóm**.

Tại sao: trong chế độ một agent, DMs thường vào khóa phiên **chính** (`agent:main:main`), trong khi nhóm luôn dùng khóa phiên **không chính** (`agent:main:<channel>:group:<id>`). Nếu bật sandboxing với `mode: "non-main"`, các phiên nhóm chạy trong Docker trong khi phiên DM chính vẫn trên host.

Điều này cho phép một agent "não" (workspace + bộ nhớ chung), nhưng hai tư thế thực thi:

- **DMs**: đầy đủ công cụ (host)
- **Nhóm**: sandbox + công cụ hạn chế (Docker)

> Nếu cần workspace/persona hoàn toàn riêng biệt ("cá nhân" và "công khai" không bao giờ trộn lẫn), dùng agent thứ hai + bindings. Xem [Multi-Agent Routing](/concepts/multi-agent).

Ví dụ (DMs trên host, nhóm sandboxed + chỉ công cụ nhắn tin):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // nhóm/kênh là không chính -> sandboxed
        scope: "session", // cách ly mạnh nhất (một container mỗi nhóm/kênh)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // Nếu allow không rỗng, mọi thứ khác bị chặn (deny vẫn thắng).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Muốn "nhóm chỉ thấy thư mục X" thay vì "không truy cập host"? Giữ `workspaceAccess: "none"` và chỉ mount các đường dẫn cho phép vào sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

Liên quan:

- Khóa cấu hình và mặc định: [Gateway configuration](/gateway/configuration-reference#agents-defaults-sandbox)
- Debug tại sao công cụ bị chặn: [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- Chi tiết bind mounts: [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## Nhãn hiển thị

- Nhãn UI dùng `displayName` khi có, định dạng `<channel>:<token>`.
- `#room` dành cho phòng/kênh; chat nhóm dùng `g-<slug>` (chữ thường, khoảng trắng -> `-`, giữ `#@+._-`).

## Chính sách nhóm

Kiểm soát cách xử lý tin nhắn nhóm/phòng theo kênh:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // id người dùng Telegram (wizard có thể giải quyết @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| Chính sách    | Hành vi                                                        |
| ------------- | -------------------------------------------------------------- |
| `"open"`      | Nhóm bỏ qua danh sách cho phép; vẫn áp dụng điều chỉnh mention.|
| `"disabled"`  | Chặn hoàn toàn tin nhắn nhóm.                                 |
| `"allowlist"` | Chỉ cho phép nhóm/phòng khớp với danh sách cho phép cấu hình. |

Ghi chú:

- `groupPolicy` tách biệt với điều chỉnh mention (yêu cầu @mentions).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: dùng `groupAllowFrom` (dự phòng: `allowFrom` rõ ràng).
- Phê duyệt ghép đôi DM (`*-allowFrom` lưu trữ mục) chỉ áp dụng cho truy cập DM; ủy quyền người gửi nhóm vẫn rõ ràng cho danh sách cho phép nhóm.
- Discord: danh sách cho phép dùng `channels.discord.guilds.<id>.channels`.
- Slack: danh sách cho phép dùng `channels.slack.channels`.
- Matrix: danh sách cho phép dùng `channels.matrix.groups` (id phòng, bí danh, hoặc tên). Dùng `channels.matrix.groupAllowFrom` để hạn chế người gửi; danh sách cho phép người dùng theo phòng cũng được hỗ trợ.
- Group DMs được kiểm soát riêng (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Danh sách cho phép Telegram có thể khớp với id người dùng (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) hoặc tên người dùng (`"@alice"` hoặc `"alice"`); tiền tố không phân biệt chữ hoa chữ thường.
- Mặc định là `groupPolicy: "allowlist"`; nếu danh sách cho phép nhóm trống, tin nhắn nhóm bị chặn.
- An toàn runtime: khi một khối provider hoàn toàn thiếu (`channels.<provider>` không có), chính sách nhóm quay về chế độ đóng an toàn (thường là `allowlist`) thay vì thừa kế `channels.defaults.groupPolicy`.

Mô hình tư duy nhanh (thứ tự đánh giá cho tin nhắn nhóm):

1. `groupPolicy` (open/disabled/allowlist)
2. danh sách cho phép nhóm (`*.groups`, `*.groupAllowFrom`, danh sách cho phép kênh cụ thể)
3. điều chỉnh mention (`requireMention`, `/activation`)

## Điều chỉnh mention (mặc định)

Tin nhắn nhóm yêu cầu mention trừ khi bị ghi đè theo nhóm. Mặc định sống theo hệ thống con dưới `*.groups."*"`.

Phản hồi tin nhắn bot được tính là mention ngầm (khi kênh hỗ trợ metadata phản hồi). Áp dụng cho Telegram, WhatsApp, Slack, Discord, và Microsoft Teams.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

Ghi chú:

- `mentionPatterns` là các mẫu regex an toàn không phân biệt chữ hoa chữ thường; các mẫu không hợp lệ và các dạng lặp lồng không an toàn bị bỏ qua.
- Các bề mặt cung cấp mention rõ ràng vẫn được thông qua; các mẫu là dự phòng.
- Ghi đè theo agent: `agents.list[].groupChat.mentionPatterns` (hữu ích khi nhiều agent chia sẻ một nhóm).
- Điều chỉnh mention chỉ được thực thi khi phát hiện mention có thể (mention gốc hoặc `mentionPatterns` được cấu hình).
- Mặc định Discord sống trong `channels.discord.guilds."*"` (có thể ghi đè theo guild/kênh).
- Ngữ cảnh lịch sử nhóm được bao bọc đồng nhất trên các kênh và chỉ **đang chờ** (tin nhắn bị bỏ qua do điều chỉnh mention); dùng `messages.groupChat.historyLimit` cho mặc định toàn cầu và `channels.<channel>.historyLimit` (hoặc `channels.<channel>.accounts.*.historyLimit`) cho ghi đè. Đặt `0` để tắt.

## Hạn chế công cụ nhóm/kênh (tùy chọn)

Một số cấu hình kênh hỗ trợ hạn chế công cụ nào có sẵn **trong một nhóm/phòng/kênh cụ thể**.

- `tools`: cho phép/chặn công cụ cho toàn bộ nhóm.
- `toolsBySender`: ghi đè theo người gửi trong nhóm.
  Dùng tiền tố khóa rõ ràng:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, và ký tự đại diện `"*"`.
  Các khóa không có tiền tố cũ vẫn được chấp nhận và khớp chỉ là `id:`.

Thứ tự giải quyết (cụ thể nhất thắng):

1. khớp `toolsBySender` nhóm/kênh
2. `tools` nhóm/kênh
3. khớp `toolsBySender` mặc định (`"*"`)
4. `tools` mặc định (`"*"`) 

Ví dụ (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

Ghi chú:

- Hạn chế công cụ nhóm/kênh được áp dụng cùng với chính sách công cụ toàn cầu/agent (deny vẫn thắng).
- Một số kênh dùng cách lồng khác cho phòng/kênh (ví dụ, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Danh sách cho phép nhóm

Khi `channels.whatsapp.groups`, `channels.telegram.groups`, hoặc `channels.imessage.groups` được cấu hình, các khóa hoạt động như danh sách cho phép nhóm. Dùng `"*"` để cho phép tất cả nhóm trong khi vẫn thiết lập hành vi mention mặc định.

Ý định phổ biến (copy/paste):

1. Tắt tất cả phản hồi nhóm

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Chỉ cho phép nhóm cụ thể (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. Cho phép tất cả nhóm nhưng yêu cầu mention (rõ ràng)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Chỉ chủ sở hữu có thể kích hoạt trong nhóm (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Kích hoạt (chỉ chủ sở hữu)

Chủ sở hữu nhóm có thể bật/tắt kích hoạt theo nhóm:

- `/activation mention`
- `/activation always`

Chủ sở hữu được xác định bởi `channels.whatsapp.allowFrom` (hoặc E.164 của bot khi không được đặt). Gửi lệnh dưới dạng tin nhắn độc lập. Các bề mặt khác hiện bỏ qua `/activation`.

## Trường ngữ cảnh

Payload đầu vào nhóm thiết lập:

- `ChatType=group`
- `GroupSubject` (nếu biết)
- `GroupMembers` (nếu biết)
- `WasMentioned` (kết quả điều chỉnh mention)
- Chủ đề diễn đàn Telegram cũng bao gồm `MessageThreadId` và `IsForum`.

Lời nhắc hệ thống agent bao gồm giới thiệu nhóm trong lượt đầu tiên của phiên nhóm mới. Nhắc mô hình phản hồi như con người, tránh bảng Markdown, và tránh gõ chuỗi `\n` literal.

## Cụ thể iMessage

- Ưu tiên `chat_id:<id>` khi định tuyến hoặc danh sách cho phép.
- Liệt kê chat: `imsg chats --limit 20`.
- Phản hồi nhóm luôn quay lại cùng `chat_id`.

## Cụ thể WhatsApp

Xem [Tin nhắn nhóm](/channels/group-messages) cho hành vi chỉ WhatsApp (tiêm lịch sử, chi tiết xử lý mention).\n