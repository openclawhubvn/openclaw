---
summary: "Công cụ quản lý session cho phép liệt kê, lấy lịch sử và gửi tin nhắn giữa các session"
read_when:
  - Thêm hoặc chỉnh sửa công cụ session
title: "Công Cụ Quản Lý Session"
---

# Công Cụ Quản Lý Session

Mục tiêu: Bộ công cụ nhỏ gọn, dễ dùng để agent có thể liệt kê session, lấy lịch sử và gửi tin nhắn giữa các session.

## Tên Công Cụ

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

## Mô Hình Chính

- Bucket chat trực tiếp chính luôn có key là `"main"` (liên kết với key chính của agent hiện tại).
- Chat nhóm dùng `agent:<agentId>:<channel>:group:<id>` hoặc `agent:<agentId>:<channel>:channel:<id>` (truyền full key).
- Cron job dùng `cron:<job.id>`.
- Hook dùng `hook:<uuid>` trừ khi được đặt rõ ràng.
- Session node dùng `node-<nodeId>` trừ khi được đặt rõ ràng.

`global` và `unknown` là giá trị dự trữ, không bao giờ được liệt kê. Nếu `session.scope = "global"`, alias thành `main` cho tất cả công cụ để không thấy `global`.

## sessions_list

Liệt kê session dưới dạng mảng các hàng.

Tham số:

- `kinds?: string[]` lọc: bất kỳ trong `"main" | "group" | "cron" | "hook" | "node" | "other"`
- `limit?: number` số hàng tối đa (mặc định: server default, giới hạn ví dụ 200)
- `activeMinutes?: number` chỉ session cập nhật trong N phút
- `messageLimit?: number` 0 = không có tin nhắn (mặc định 0); >0 = bao gồm N tin nhắn cuối

Hành vi:

- `messageLimit > 0` lấy `chat.history` mỗi session và bao gồm N tin nhắn cuối.
- Kết quả công cụ bị lọc ra khỏi danh sách; dùng `sessions_history` cho tin nhắn công cụ.
- Khi chạy trong session agent **sandboxed**, công cụ session mặc định chỉ thấy **spawned-only visibility** (xem dưới).

Dạng hàng (JSON):

- `key`: session key (string)
- `kind`: `main | group | cron | hook | node | other`
- `channel`: `whatsapp | telegram | discord | signal | imessage | webchat | internal | unknown`
- `displayName` (nhãn hiển thị nhóm nếu có)
- `updatedAt` (ms)
- `sessionId`
- `model`, `contextTokens`, `totalTokens`
- `thinkingLevel`, `verboseLevel`, `systemSent`, `abortedLastRun`
- `sendPolicy` (ghi đè session nếu có)
- `lastChannel`, `lastTo`
- `deliveryContext` (chuẩn hóa `{ channel, to, accountId }` khi có)
- `transcriptPath` (đường dẫn tốt nhất từ store dir + sessionId)
- `messages?` (chỉ khi `messageLimit > 0`)

## sessions_history

Lấy transcript cho một session.

Tham số:

- `sessionKey` (bắt buộc; chấp nhận session key hoặc `sessionId` từ `sessions_list`)
- `limit?: number` số tin nhắn tối đa (server giới hạn)
- `includeTools?: boolean` (mặc định false)

Hành vi:

- `includeTools=false` lọc tin nhắn `role: "toolResult"`.
- Trả về mảng tin nhắn dưới dạng transcript thô.
- Khi có `sessionId`, OpenClaw chuyển đổi thành session key tương ứng (lỗi nếu thiếu id).

## API lịch sử session Gateway và transcript trực tiếp

UI điều khiển và client gateway có thể dùng trực tiếp bề mặt lịch sử và transcript trực tiếp cấp thấp.

HTTP:

- `GET /sessions/{sessionKey}/history`
- Tham số query: `limit`, `cursor`, `includeTools=1`, `follow=1`
- Session không xác định trả về HTTP `404` với `error.type = "not_found"`
- `follow=1` nâng cấp phản hồi thành stream SSE của cập nhật transcript cho session đó

WebSocket:

- `sessions.subscribe` đăng ký tất cả sự kiện vòng đời session và transcript thấy được cho client
- `sessions.messages.subscribe { key }` chỉ đăng ký sự kiện `session.message` cho một session
- `sessions.messages.unsubscribe { key }` gỡ đăng ký transcript nhắm mục tiêu đó
- `session.message` mang theo tin nhắn transcript được thêm vào cùng metadata sử dụng trực tiếp khi có
- `sessions.changed` phát `phase: "message"` cho các phần thêm transcript để danh sách session có thể làm mới bộ đếm và bản xem trước

## sessions_send

Gửi tin nhắn vào session khác.

Tham số:

- `sessionKey` (bắt buộc; chấp nhận session key hoặc `sessionId` từ `sessions_list`)
- `message` (bắt buộc)
- `timeoutSeconds?: number` (mặc định >0; 0 = fire-and-forget)

Hành vi:

- `timeoutSeconds = 0`: đưa vào hàng đợi và trả về `{ runId, status: "accepted" }`.
- `timeoutSeconds > 0`: chờ tối đa N giây để hoàn thành, sau đó trả về `{ runId, status: "ok", reply }`.
- Nếu chờ hết thời gian: `{ runId, status: "timeout", error }`. Chạy tiếp tục; gọi `sessions_history` sau.
- Nếu chạy thất bại: `{ runId, status: "error", error }`.
- Thông báo giao hàng chạy sau khi chạy chính hoàn tất và là nỗ lực tốt nhất; `status: "ok"` không đảm bảo thông báo đã được giao.
- Chờ qua gateway `agent.wait` (server-side) để reconnect không làm mất chờ.
- Ngữ cảnh tin nhắn agent-to-agent được chèn cho chạy chính.
- Tin nhắn giữa các session được lưu trữ với `message.provenance.kind = "inter_session"` để người đọc transcript có thể phân biệt hướng dẫn agent được định tuyến từ đầu vào người dùng bên ngoài.
- Sau khi chạy chính hoàn tất, OpenClaw chạy **vòng lặp phản hồi lại**:
  - Vòng 2+ luân phiên giữa agent yêu cầu và agent mục tiêu.
  - Phản hồi chính xác `REPLY_SKIP` để dừng ping-pong.
  - Số lượt tối đa là `session.agentToAgent.maxPingPongTurns` (0–5, mặc định 5).
- Khi vòng lặp kết thúc, OpenClaw chạy bước **thông báo agent-to-agent** (chỉ agent mục tiêu):
  - Phản hồi chính xác `ANNOUNCE_SKIP` để giữ im lặng.
  - Bất kỳ phản hồi nào khác được gửi đến kênh mục tiêu.
  - Bước thông báo bao gồm yêu cầu gốc + phản hồi vòng 1 + phản hồi ping-pong mới nhất.

## Trường Channel

- Với nhóm, `channel` là kênh được ghi trên mục nhập session.
- Với chat trực tiếp, `channel` ánh xạ từ `lastChannel`.
- Với cron/hook/node, `channel` là `internal`.
- Nếu thiếu, `channel` là `unknown`.

## Bảo Mật / Chính Sách Gửi

Chặn dựa trên chính sách theo loại kênh/chat (không theo session id).

```json
{
  "session": {
    "sendPolicy": {
      "rules": [
        {
          "match": { "channel": "discord", "chatType": "group" },
          "action": "deny"
        }
      ],
      "default": "allow"
    }
  }
}
```

Ghi đè runtime (theo mục nhập session):

- `sendPolicy: "allow" | "deny"` (không đặt = thừa kế config)
- Có thể đặt qua `sessions.patch` hoặc chỉ chủ sở hữu `/send on|off|inherit` (tin nhắn độc lập).

Điểm thực thi:

- `chat.send` / `agent` (gateway)
- logic giao hàng tự động trả lời

## sessions_spawn

Khởi tạo một sub-agent chạy trong session cách ly và thông báo kết quả lại cho kênh chat yêu cầu.

Tham số:

- `task` (bắt buộc)
- `label?` (tùy chọn; dùng cho logs/UI)
- `agentId?` (tùy chọn; khởi tạo dưới id agent khác nếu được phép)
- `model?` (tùy chọn; ghi đè model sub-agent; giá trị không hợp lệ lỗi)
- `thinking?` (tùy chọn; ghi đè mức độ suy nghĩ cho chạy sub-agent)
- `runTimeoutSeconds?` (mặc định là `agents.defaults.subagents.runTimeoutSeconds` khi đặt, nếu không `0`; khi đặt, hủy chạy sub-agent sau N giây)
- `thread?` (mặc định false; yêu cầu định tuyến ràng buộc theo luồng cho spawn này khi được kênh/plugin hỗ trợ)
- `mode?` (`run|session`; mặc định là `run`, nhưng mặc định là `session` khi `thread=true`; `mode="session"` yêu cầu `thread=true`)
- `cleanup?` (`delete|keep`, mặc định `keep`)
- `sandbox?` (`inherit|require`, mặc định `inherit`; `require` từ chối spawn trừ khi runtime con mục tiêu được sandboxed)
- `attachments?` (mảng tùy chọn của file inline; chỉ runtime subagent, ACP từ chối). Mỗi mục: `{ name, content, encoding?: "utf8" | "base64", mimeType? }`. File được hiện thực hóa vào workspace con tại `.openclaw/attachments/<uuid>/`. Trả về biên nhận với sha256 mỗi file.
- `attachAs?` (tùy chọn; `{ mountPath? }` gợi ý dành riêng cho triển khai mount trong tương lai)

Danh sách cho phép:

- `agents.list[].subagents.allowAgents`: danh sách id agent được phép qua `agentId` (`["*"]` để cho phép bất kỳ). Mặc định: chỉ agent yêu cầu.
- Bảo vệ thừa kế sandbox: nếu session yêu cầu được sandboxed, `sessions_spawn` từ chối mục tiêu sẽ chạy không sandboxed.

Khám phá:

- Dùng `agents_list` để khám phá id agent nào được phép cho `sessions_spawn`.

Hành vi:

- Bắt đầu một session mới `agent:<agentId>:subagent:<uuid>` với `deliver: false`.
- Sub-agent mặc định có bộ công cụ đầy đủ **trừ công cụ session** (có thể cấu hình qua `tools.subagents.tools`).
- Sub-agent không được phép gọi `sessions_spawn` (không có sub-agent → sub-agent spawning).
- Luôn không chặn: trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Với `thread=true`, plugin kênh có thể ràng buộc giao hàng/định tuyến đến mục tiêu luồng (hỗ trợ Discord được kiểm soát bởi `session.threadBindings.*` và `channels.discord.threadBindings.*`).
- Sau khi hoàn tất, OpenClaw chạy bước **thông báo sub-agent** và đăng kết quả lên kênh chat yêu cầu.
  - Nếu phản hồi cuối của trợ lý trống, `toolResult` mới nhất từ lịch sử sub-agent được bao gồm là `Result`.
- Phản hồi chính xác `ANNOUNCE_SKIP` trong bước thông báo để giữ im lặng.
- Phản hồi thông báo được chuẩn hóa thành `Status`/`Result`/`Notes`; `Status` đến từ kết quả runtime (không phải văn bản model).
- Session sub-agent tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định: 60).
- Phản hồi thông báo bao gồm một dòng thống kê (runtime, tokens, sessionKey/sessionId, transcript path, và chi phí tùy chọn).

## Khả Năng Nhìn Thấy Session Sandbox

Công cụ session có thể được giới hạn để giảm truy cập giữa các session.

Hành vi mặc định:

- `tools.sessions.visibility` mặc định là `tree` (session hiện tại + session subagent được spawn).
- Với session sandboxed, `agents.defaults.sandbox.sessionToolsVisibility` có thể giới hạn cứng khả năng nhìn thấy.

Cấu hình:

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      // mặc định: "tree"
      visibility: "tree",
    },
  },
  agents: {
    defaults: {
      sandbox: {
        // mặc định: "spawned"
        sessionToolsVisibility: "spawned", // hoặc "all"
      },
    },
  },
}
```

Ghi chú:

- `self`: chỉ key session hiện tại.
- `tree`: session hiện tại + session được spawn bởi session hiện tại.
- `agent`: bất kỳ session nào thuộc về id agent hiện tại.
- `all`: bất kỳ session nào (truy cập giữa các agent vẫn yêu cầu `tools.agentToAgent`).
- Khi một session được sandboxed và `sessionToolsVisibility="spawned"`, OpenClaw giới hạn khả năng nhìn thấy thành `tree` ngay cả khi bạn đặt `tools.sessions.visibility="all"`.\n