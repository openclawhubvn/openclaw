---
summary: "Tìm hiểu cách liệt kê, truy xuất lịch sử và gửi tin nhắn giữa các phiên với công cụ phiên OpenClaw."
read_when:
  - Thêm hoặc chỉnh sửa công cụ phiên làm việc
title: "Hướng Dẫn Sử Dụng Công Cụ Phiên OpenClaw"
---

# Công Cụ Phiên Làm Việc

Mục tiêu: Bộ công cụ nhỏ gọn, dễ sử dụng để các agent có thể liệt kê phiên, lấy lịch sử và gửi tin nhắn đến phiên khác.

## Tên Công Cụ

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

## Mô Hình Khóa Chính

- Khóa chính cho chat trực tiếp luôn là khóa `"main"` (được giải quyết thành khóa chính của agent hiện tại).
- Chat nhóm sử dụng `agent:<agentId>:<channel>:group:<id>` hoặc `agent:<agentId>:<channel>:channel:<id>` (truyền khóa đầy đủ).
- Công việc định kỳ sử dụng `cron:<job.id>`.
- Hooks sử dụng `hook:<uuid>` trừ khi được thiết lập rõ ràng.
- Phiên node sử dụng `node-<nodeId>` trừ khi được thiết lập rõ ràng.

`global` và `unknown` là các giá trị dự trữ và không bao giờ được liệt kê. Nếu `session.scope = "global"`, chúng tôi sẽ thay thế nó bằng `main` cho tất cả các công cụ để người gọi không thấy `global`.

## sessions_list

Liệt kê các phiên dưới dạng một mảng các hàng.

Tham số:

- `kinds?: string[]` lọc: bất kỳ trong số `"main" | "group" | "cron" | "hook" | "node" | "other"`
- `limit?: number` số hàng tối đa (mặc định: giới hạn máy chủ, ví dụ 200)
- `activeMinutes?: number` chỉ các phiên được cập nhật trong vòng N phút
- `messageLimit?: number` 0 = không có tin nhắn (mặc định 0); >0 = bao gồm N tin nhắn cuối

Hành vi:

- `messageLimit > 0` lấy `chat.history` cho mỗi phiên và bao gồm N tin nhắn cuối.
- Kết quả công cụ bị lọc ra trong danh sách; sử dụng `sessions_history` cho tin nhắn công cụ.
- Khi chạy trong phiên agent **sandboxed**, công cụ phiên mặc định chỉ hiển thị **phiên được tạo ra** (xem bên dưới).

Cấu trúc hàng (JSON):

- `key`: khóa phiên (chuỗi)
- `kind`: `main | group | cron | hook | node | other`
- `channel`: `whatsapp | telegram | discord | signal | imessage | webchat | internal | unknown`
- `displayName` (nhãn hiển thị nhóm nếu có)
- `updatedAt` (ms)
- `sessionId`
- `model`, `contextTokens`, `totalTokens`
- `thinkingLevel`, `verboseLevel`, `systemSent`, `abortedLastRun`
- `sendPolicy` (ghi đè phiên nếu được thiết lập)
- `lastChannel`, `lastTo`
- `deliveryContext` (được chuẩn hóa `{ channel, to, accountId }` khi có)
- `transcriptPath` (đường dẫn nỗ lực tốt nhất từ thư mục lưu trữ + sessionId)
- `messages?` (chỉ khi `messageLimit > 0`)

## sessions_history

Lấy bản ghi cho một phiên.

Tham số:

- `sessionKey` (bắt buộc; chấp nhận khóa phiên hoặc `sessionId` từ `sessions_list`)
- `limit?: number` số tin nhắn tối đa (máy chủ giới hạn)
- `includeTools?: boolean` (mặc định false)

Hành vi:

- `includeTools=false` lọc các tin nhắn `role: "toolResult"`.
- Trả về mảng tin nhắn ở định dạng bản ghi thô.
- Khi được cung cấp `sessionId`, OpenClaw giải quyết nó thành khóa phiên tương ứng (lỗi nếu thiếu id).

## API lịch sử phiên Gateway và bản ghi trực tiếp

Giao diện điều khiển và khách hàng gateway có thể sử dụng trực tiếp các bề mặt lịch sử và bản ghi trực tiếp cấp thấp hơn.

HTTP:

- `GET /sessions/{sessionKey}/history`
- Tham số truy vấn: `limit`, `cursor`, `includeTools=1`, `follow=1`
- Phiên không xác định trả về HTTP `404` với `error.type = "not_found"`
- `follow=1` nâng cấp phản hồi thành luồng SSE của các cập nhật bản ghi cho phiên đó

WebSocket:

- `sessions.subscribe` đăng ký tất cả các sự kiện vòng đời phiên và bản ghi có thể thấy được cho khách hàng
- `sessions.messages.subscribe { key }` chỉ đăng ký các sự kiện `session.message` cho một phiên
- `sessions.messages.unsubscribe { key }` loại bỏ đăng ký bản ghi mục tiêu đó
- `session.message` mang theo các tin nhắn bản ghi được thêm vào cùng với siêu dữ liệu sử dụng trực tiếp khi có
- `sessions.changed` phát `phase: "message"` cho các phần thêm bản ghi để danh sách phiên có thể làm mới bộ đếm và bản xem trước

## sessions_send

Gửi một tin nhắn vào phiên khác.

Tham số:

- `sessionKey` (bắt buộc; chấp nhận khóa phiên hoặc `sessionId` từ `sessions_list`)
- `message` (bắt buộc)
- `timeoutSeconds?: number` (mặc định >0; 0 = gửi và quên)

Hành vi:

- `timeoutSeconds = 0`: đưa vào hàng đợi và trả về `{ runId, status: "accepted" }`.
- `timeoutSeconds > 0`: chờ tối đa N giây để hoàn thành, sau đó trả về `{ runId, status: "ok", reply }`.
- Nếu chờ hết thời gian: `{ runId, status: "timeout", error }`. Chạy tiếp tục; gọi `sessions_history` sau.
- Nếu chạy thất bại: `{ runId, status: "error", error }`.
- Thông báo giao hàng chạy sau khi chạy chính hoàn tất và là nỗ lực tốt nhất; `status: "ok"` không đảm bảo thông báo đã được gửi.
- Chờ qua gateway `agent.wait` (phía máy chủ) để không bị mất chờ khi kết nối lại.
- Ngữ cảnh tin nhắn agent-to-agent được tiêm vào cho chạy chính.
- Tin nhắn giữa các phiên được lưu trữ với `message.provenance.kind = "inter_session"` để người đọc bản ghi có thể phân biệt hướng dẫn agent được định tuyến từ đầu vào người dùng bên ngoài.
- Sau khi chạy chính hoàn tất, OpenClaw chạy một **vòng phản hồi lại**:
  - Vòng 2+ luân phiên giữa agent yêu cầu và agent mục tiêu.
  - Phản hồi chính xác `REPLY_SKIP` để dừng ping-pong.
  - Số lượt tối đa là `session.agentToAgent.maxPingPongTurns` (0–5, mặc định 5).
- Khi vòng kết thúc, OpenClaw chạy bước **thông báo agent-to-agent** (chỉ agent mục tiêu):
  - Phản hồi chính xác `ANNOUNCE_SKIP` để giữ im lặng.
  - Bất kỳ phản hồi nào khác được gửi đến kênh mục tiêu.
  - Bước thông báo bao gồm yêu cầu ban đầu + phản hồi vòng 1 + phản hồi ping-pong mới nhất.

## Trường Kênh

- Đối với nhóm, `channel` là kênh được ghi lại trên mục phiên.
- Đối với chat trực tiếp, `channel` ánh xạ từ `lastChannel`.
- Đối với cron/hook/node, `channel` là `internal`.
- Nếu thiếu, `channel` là `unknown`.

## Bảo Mật / Chính Sách Gửi

Chặn dựa trên chính sách theo loại kênh/chat (không theo id phiên).

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

Ghi đè thời gian chạy (theo mục phiên):

- `sendPolicy: "allow" | "deny"` (không thiết lập = thừa kế cấu hình)
- Có thể thiết lập qua `sessions.patch` hoặc chỉ chủ sở hữu `/send on|off|inherit` (tin nhắn độc lập).

Điểm thực thi:

- `chat.send` / `agent` (gateway)
- logic giao hàng tự động trả lời

## sessions_spawn

Tạo một phiên chạy sub-agent trong một phiên cách ly và thông báo kết quả trở lại kênh chat yêu cầu.

Tham số:

- `task` (bắt buộc)
- `label?` (tùy chọn; dùng cho nhật ký/giao diện người dùng)
- `agentId?` (tùy chọn; tạo dưới một id agent khác nếu được phép)
- `model?` (tùy chọn; ghi đè mô hình sub-agent; giá trị không hợp lệ lỗi)
- `thinking?` (tùy chọn; ghi đè mức độ suy nghĩ cho chạy sub-agent)
- `runTimeoutSeconds?` (mặc định là `agents.defaults.subagents.runTimeoutSeconds` khi được thiết lập, nếu không `0`; khi được thiết lập, hủy chạy sub-agent sau N giây)
- `thread?` (mặc định false; yêu cầu định tuyến ràng buộc luồng cho phiên tạo này khi được hỗ trợ bởi kênh/plugin)
- `mode?` (`run|session`; mặc định là `run`, nhưng mặc định là `session` khi `thread=true`; `mode="session"` yêu cầu `thread=true`)
- `cleanup?` (`delete|keep`, mặc định `keep`)
- `sandbox?` (`inherit|require`, mặc định `inherit`; `require` từ chối tạo trừ khi runtime con mục tiêu được sandboxed)
- `attachments?` (mảng tùy chọn các tệp đính kèm nội tuyến; chỉ runtime subagent, ACP từ chối). Mỗi mục: `{ name, content, encoding?: "utf8" | "base64", mimeType? }`. Các tệp được hiện thực hóa vào không gian làm việc con tại `.openclaw/attachments/<uuid>/`. Trả về biên lai với sha256 cho mỗi tệp.
- `attachAs?` (tùy chọn; `{ mountPath? }` gợi ý dành riêng cho các triển khai gắn kết trong tương lai)

Danh sách cho phép:

- `agents.list[].subagents.allowAgents`: danh sách các id agent được phép qua `agentId` (`["*"]` để cho phép bất kỳ). Mặc định: chỉ agent yêu cầu.
- Bảo vệ thừa kế sandbox: nếu phiên yêu cầu được sandboxed, `sessions_spawn` từ chối các mục tiêu sẽ chạy không sandboxed.

Khám phá:

- Sử dụng `agents_list` để khám phá các id agent nào được phép cho `sessions_spawn`.

Hành vi:

- Bắt đầu một phiên `agent:<agentId>:subagent:<uuid>` mới với `deliver: false`.
- Sub-agents mặc định có bộ công cụ đầy đủ **trừ công cụ phiên** (có thể cấu hình qua `tools.subagents.tools`).
- Sub-agents không được phép gọi `sessions_spawn` (không có tạo sub-agent → sub-agent).
- Luôn không chặn: trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Với `thread=true`, các plugin kênh có thể ràng buộc giao hàng/định tuyến đến mục tiêu luồng (hỗ trợ Discord được kiểm soát bởi `session.threadBindings.*` và `channels.discord.threadBindings.*`).
- Sau khi hoàn tất, OpenClaw chạy bước **thông báo sub-agent** và đăng kết quả lên kênh chat yêu cầu.
  - Nếu phản hồi cuối cùng của trợ lý trống, `toolResult` mới nhất từ lịch sử sub-agent được bao gồm dưới dạng `Result`.
- Phản hồi chính xác `ANNOUNCE_SKIP` trong bước thông báo để giữ im lặng.
- Phản hồi thông báo được chuẩn hóa thành `Status`/`Result`/`Notes`; `Status` đến từ kết quả runtime (không phải văn bản mô hình).
- Các phiên sub-agent được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định: 60).
- Phản hồi thông báo bao gồm một dòng thống kê (thời gian chạy, tokens, sessionKey/sessionId, đường dẫn bản ghi, và chi phí tùy chọn).

## Tầm Nhìn Phiên Sandbox

Công cụ phiên có thể được giới hạn để giảm truy cập giữa các phiên.

Hành vi mặc định:

- `tools.sessions.visibility` mặc định là `tree` (phiên hiện tại + các phiên subagent được tạo ra).
- Đối với các phiên sandboxed, `agents.defaults.sandbox.sessionToolsVisibility` có thể giới hạn tầm nhìn.

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

- `self`: chỉ khóa phiên hiện tại.
- `tree`: phiên hiện tại + các phiên được tạo ra bởi phiên hiện tại.
- `agent`: bất kỳ phiên nào thuộc về id agent hiện tại.
- `all`: bất kỳ phiên nào (truy cập giữa các agent vẫn yêu cầu `tools.agentToAgent`).
- Khi một phiên được sandboxed và `sessionToolsVisibility="spawned"`, OpenClaw giới hạn tầm nhìn ở `tree` ngay cả khi bạn đặt `tools.sessions.visibility="all"`.
