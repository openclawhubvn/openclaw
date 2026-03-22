---
summary: "Hành vi chat nhóm trên các nền tảng (WhatsApp/Telegram/Discord/Slack/Signal/iMessage/Microsoft Teams/Zalo)"
read_when:
  - Thay đổi hành vi chat nhóm hoặc điều chỉnh nhắc đến
title: "Nhóm"
---

# Nhóm

OpenClaw xử lý các cuộc trò chuyện nhóm nhất quán trên các nền tảng: WhatsApp, Telegram, Discord, Slack, Signal, iMessage, Microsoft Teams, Zalo.

## Giới thiệu cho người mới (2 phút)

OpenClaw hoạt động trên tài khoản nhắn tin của bạn. Không có người dùng bot WhatsApp riêng biệt.
Nếu **bạn** có trong một nhóm, OpenClaw có thể thấy và phản hồi trong nhóm đó.

Hành vi mặc định:

- Nhóm bị giới hạn (`groupPolicy: "allowlist"`).
- Phản hồi yêu cầu nhắc đến trừ khi bạn tắt tính năng này.

Dịch: người gửi trong danh sách cho phép có thể kích hoạt OpenClaw bằng cách nhắc đến nó.

> Tóm tắt
>
> - **Truy cập DM** được kiểm soát bởi `*.allowFrom`.
> - **Truy cập nhóm** được kiểm soát bởi `*.groupPolicy` + danh sách cho phép (`*.groups`, `*.groupAllowFrom`).
> - **Kích hoạt phản hồi** được kiểm soát bởi nhắc đến (`requireMention`, `/activation`).

Luồng nhanh (điều gì xảy ra với tin nhắn nhóm):

```
groupPolicy? disabled -> bỏ qua
groupPolicy? allowlist -> nhóm được phép? không -> bỏ qua
requireMention? có -> được nhắc đến? không -> lưu cho ngữ cảnh
khác -> phản hồi
```

![Luồng tin nhắn nhóm](/images/groups-flow.svg)

Nếu bạn muốn...

| Mục tiêu                                      | Cài đặt gì                                                |
| --------------------------------------------- | --------------------------------------------------------- |
| Cho phép tất cả nhóm nhưng chỉ phản hồi khi được nhắc đến | `groups: { "*": { requireMention: true } }`                |
| Tắt tất cả phản hồi nhóm                       | `groupPolicy: "disabled"`                                  |
| Chỉ cho phép nhóm cụ thể                       | `groups: { "<group-id>": { ... } }` (không có khóa `"*"` ) |
| Chỉ bạn có thể kích hoạt trong nhóm            | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Khóa phiên

- Phiên nhóm sử dụng khóa phiên `agent:<agentId>:<channel>:group:<id>` (phòng/kênh sử dụng `agent:<agentId>:<channel>:channel:<id>`).
- Chủ đề diễn đàn Telegram thêm `:topic:<threadId>` vào id nhóm để mỗi chủ đề có phiên riêng.
- Trò chuyện trực tiếp sử dụng phiên chính (hoặc theo người gửi nếu được cấu hình).
- Bỏ qua nhịp tim cho phiên nhóm.

## Mẫu: DMs cá nhân + nhóm công khai (một agent)

Có — điều này hoạt động tốt nếu lưu lượng "cá nhân" của bạn là **DMs** và lưu lượng "công khai" là **nhóm**.

Lý do: trong chế độ một agent, DMs thường nằm trong khóa phiên **chính** (`agent:main:main`), trong khi nhóm luôn sử dụng khóa phiên **không chính** (`agent:main:<channel>:group:<id>`). Nếu bạn bật sandboxing với `mode: "non-main"`, các phiên nhóm đó chạy trong Docker trong khi phiên DM chính của bạn vẫn ở trên máy chủ.

Điều này mang lại cho bạn một "bộ não" agent (không gian làm việc + bộ nhớ chia sẻ), nhưng hai tư thế thực thi:

- **DMs**: công cụ đầy đủ (trên máy chủ)
- **Nhóm**: sandbox + công cụ hạn chế (Docker)

> Nếu bạn cần không gian làm việc/nhân vật hoàn toàn riêng biệt ("cá nhân" và "công khai" không bao giờ được trộn lẫn), hãy sử dụng agent thứ hai + ràng buộc. Xem [Định tuyến Multi-Agent](/concepts/multi-agent).

Ví dụ (DMs trên máy chủ, nhóm trong sandbox + chỉ công cụ nhắn tin):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // nhóm/kênh là không chính -> trong sandbox
        scope: "session", // cách ly mạnh nhất (một container cho mỗi nhóm/kênh)
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

Muốn "nhóm chỉ có thể thấy thư mục X" thay vì "không truy cập máy chủ"? Giữ `workspaceAccess: "none"` và chỉ gắn các đường dẫn trong danh sách cho phép vào sandbox:

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

- Khóa cấu hình và mặc định: [Cấu hình Gateway](/gateway/configuration-reference#agents-defaults-sandbox)
- Gỡ lỗi tại sao một công cụ bị chặn: [Sandbox vs Chính sách Công cụ vs Nâng cao](/gateway/sandbox-vs-tool-policy-vs-elevated)
- Chi tiết gắn kết: [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## Nhãn hiển thị

- Nhãn UI sử dụng `displayName` khi có, định dạng là `<channel>:<token>`.
- `#room` dành riêng cho phòng/kênh; trò chuyện nhóm sử dụng `g-<slug>` (chữ thường, khoảng trắng -> `-`, giữ `#@+._-`).

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
| ------------- | ------------------------------------------------------------- |
| `"open"`      | Nhóm bỏ qua danh sách cho phép; nhắc đến vẫn áp dụng.         |
| `"disabled"`  | Chặn hoàn toàn tất cả tin nhắn nhóm.                          |
| `"allowlist"` | Chỉ cho phép nhóm/phòng khớp với danh sách cho phép đã cấu hình. |

Lưu ý:

- `groupPolicy` tách biệt với nhắc đến (yêu cầu @mentions).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: sử dụng `groupAllowFrom` (dự phòng: `allowFrom` rõ ràng).
- Phê duyệt ghép đôi DM (`*-allowFrom` lưu trữ mục) chỉ áp dụng cho truy cập DM; ủy quyền người gửi nhóm vẫn rõ ràng cho danh sách cho phép nhóm.
- Discord: danh sách cho phép sử dụng `channels.discord.guilds.<id>.channels`.
- Slack: danh sách cho phép sử dụng `channels.slack.channels`.
- Matrix: danh sách cho phép sử dụng `channels.matrix.groups` (id phòng, bí danh hoặc tên). Sử dụng `channels.matrix.groupAllowFrom` để hạn chế người gửi; danh sách cho phép `users` theo phòng cũng được hỗ trợ.
- DM nhóm được kiểm soát riêng (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Danh sách cho phép Telegram có thể khớp với id người dùng (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) hoặc tên người dùng (`"@alice"` hoặc `"alice"`); tiền tố không phân biệt chữ hoa chữ thường.
- Mặc định là `groupPolicy: "allowlist"`; nếu danh sách cho phép nhóm của bạn trống, tin nhắn nhóm bị chặn.
- An toàn khi chạy: khi một khối nhà cung cấp hoàn toàn thiếu (`channels.<provider>` không có), chính sách nhóm sẽ quay lại chế độ đóng thất bại (thường là `allowlist`) thay vì kế thừa `channels.defaults.groupPolicy`.

Mô hình tinh thần nhanh (thứ tự đánh giá cho tin nhắn nhóm):

1. `groupPolicy` (open/disabled/allowlist)
2. danh sách cho phép nhóm (`*.groups`, `*.groupAllowFrom`, danh sách cho phép cụ thể theo kênh)
3. nhắc đến (`requireMention`, `/activation`)

## Nhắc đến (mặc định)

Tin nhắn nhóm yêu cầu nhắc đến trừ khi bị ghi đè theo nhóm. Mặc định sống theo từng hệ thống con dưới `*.groups."*"`.

Phản hồi tin nhắn bot được tính là nhắc đến ngầm (khi kênh hỗ trợ siêu dữ liệu phản hồi). Điều này áp dụng cho Telegram, WhatsApp, Slack, Discord và Microsoft Teams.

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

Lưu ý:

- `mentionPatterns` là các mẫu regex an toàn không phân biệt chữ hoa chữ thường; các mẫu không hợp lệ và các dạng lặp lồng không an toàn bị bỏ qua.
- Các bề mặt cung cấp nhắc đến rõ ràng vẫn được thông qua; các mẫu là dự phòng.
- Ghi đè theo agent: `agents.list[].groupChat.mentionPatterns` (hữu ích khi nhiều agent chia sẻ một nhóm).
- Nhắc đến chỉ được thực thi khi phát hiện nhắc đến có thể (nhắc đến gốc hoặc `mentionPatterns` được cấu hình).
- Mặc định Discord sống trong `channels.discord.guilds."*"` (có thể ghi đè theo guild/kênh).
- Ngữ cảnh lịch sử nhóm được bao bọc đồng nhất trên các kênh và chỉ **đang chờ** (tin nhắn bị bỏ qua do nhắc đến); sử dụng `messages.groupChat.historyLimit` cho mặc định toàn cầu và `channels.<channel>.historyLimit` (hoặc `channels.<channel>.accounts.*.historyLimit`) cho ghi đè. Đặt `0` để tắt.

## Hạn chế công cụ nhóm/kênh (tùy chọn)

Một số cấu hình kênh hỗ trợ hạn chế công cụ nào có sẵn **trong một nhóm/phòng/kênh cụ thể**.

- `tools`: cho phép/chặn công cụ cho toàn bộ nhóm.
- `toolsBySender`: ghi đè theo người gửi trong nhóm.
  Sử dụng tiền tố khóa rõ ràng:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, và ký tự đại diện `"*"`.
  Các khóa không có tiền tố cũ vẫn được chấp nhận và khớp như `id:` chỉ.

Thứ tự giải quyết (cái cụ thể nhất thắng):

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

Lưu ý:

- Hạn chế công cụ nhóm/kênh được áp dụng ngoài chính sách công cụ toàn cầu/agent (deny vẫn thắng).
- Một số kênh sử dụng cấu trúc lồng khác cho phòng/kênh (ví dụ: Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Danh sách cho phép nhóm

Khi `channels.whatsapp.groups`, `channels.telegram.groups`, hoặc `channels.imessage.groups` được cấu hình, các khóa hoạt động như danh sách cho phép nhóm. Sử dụng `"*"` để cho phép tất cả nhóm trong khi vẫn thiết lập hành vi nhắc đến mặc định.

Ý định phổ biến (sao chép/dán):

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

3. Cho phép tất cả nhóm nhưng yêu cầu nhắc đến (rõ ràng)

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

Chủ sở hữu được xác định bởi `channels.whatsapp.allowFrom` (hoặc E.164 của bot khi không được đặt). Gửi lệnh dưới dạng tin nhắn độc lập. Các bề mặt khác hiện không hỗ trợ `/activation`.

## Trường ngữ cảnh

Payload đầu vào nhóm thiết lập:

- `ChatType=group`
- `GroupSubject` (nếu biết)
- `GroupMembers` (nếu biết)
- `WasMentioned` (kết quả nhắc đến)
- Chủ đề diễn đàn Telegram cũng bao gồm `MessageThreadId` và `IsForum`.

Lời nhắc hệ thống agent bao gồm phần giới thiệu nhóm trong lượt đầu tiên của phiên nhóm mới. Nó nhắc mô hình phản hồi như con người, tránh bảng Markdown và tránh gõ chuỗi `\n` theo nghĩa đen.

## Cụ thể iMessage

- Ưu tiên `chat_id:<id>` khi định tuyến hoặc danh sách cho phép.
- Liệt kê trò chuyện: `imsg chats --limit 20`.
- Phản hồi nhóm luôn quay lại cùng `chat_id`.

## Cụ thể WhatsApp

Xem [Tin nhắn nhóm](/channels/group-messages) để biết hành vi chỉ dành cho WhatsApp (tiêm lịch sử, chi tiết xử lý nhắc đến).
