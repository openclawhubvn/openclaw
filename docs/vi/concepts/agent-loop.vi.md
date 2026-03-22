---
summary: "Vòng đời agent, streams và cách chờ"
read_when:
  - Cần hướng dẫn chi tiết về vòng lặp agent hoặc sự kiện vòng đời
title: "Vòng lặp Agent"
---

# Vòng lặp Agent (OpenClaw)

Vòng lặp agent là một lần chạy "thực" đầy đủ của agent: intake → context assembly → model inference → tool execution → streaming replies → persistence. Đây là đường dẫn chính thức biến một message thành hành động và phản hồi cuối cùng, đồng thời giữ trạng thái session nhất quán.

Trong OpenClaw, một vòng lặp là một lần chạy đơn, tuần tự cho mỗi session, phát ra các sự kiện vòng đời và stream khi model suy nghĩ, gọi công cụ và stream output. Tài liệu này giải thích cách vòng lặp thực sự này được kết nối từ đầu đến cuối.

## Điểm bắt đầu

- Gateway RPC: `agent` và `agent.wait`.
- CLI: lệnh `agent`.

## Cách hoạt động (tổng quan)

1. RPC `agent` xác thực tham số, giải quyết session (sessionKey/sessionId), lưu metadata session, trả về `{ runId, acceptedAt }` ngay lập tức.
2. `agentCommand` chạy agent:
   - giải quyết model + mặc định thinking/verbose
   - tải snapshot kỹ năng
   - gọi `runEmbeddedPiAgent` (runtime pi-agent-core)
   - phát ra **lifecycle end/error** nếu vòng lặp nhúng không phát ra
3. `runEmbeddedPiAgent`:
   - tuần tự hóa các lần chạy qua hàng đợi per-session + global
   - giải quyết model + auth profile và xây dựng pi session
   - đăng ký sự kiện pi và stream assistant/tool deltas
   - thực thi timeout -> hủy chạy nếu vượt quá
   - trả về payloads + metadata sử dụng
4. `subscribeEmbeddedPiSession` kết nối sự kiện pi-agent-core với stream `agent` OpenClaw:
   - sự kiện tool => `stream: "tool"`
   - assistant deltas => `stream: "assistant"`
   - sự kiện vòng đời => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` sử dụng `waitForAgentJob`:
   - chờ **lifecycle end/error** cho `runId`
   - trả về `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Hàng đợi + đồng thời

- Các lần chạy được tuần tự hóa theo session key (session lane) và tùy chọn qua global lane.
- Điều này ngăn chặn tool/session races và giữ lịch sử session nhất quán.
- Các kênh nhắn tin có thể chọn chế độ hàng đợi (collect/steer/followup) để đưa vào hệ thống lane này. Xem [Command Queue](/concepts/queue).

## Chuẩn bị Session + Workspace

- Workspace được giải quyết và tạo; các lần chạy sandboxed có thể chuyển hướng đến sandbox workspace root.
- Kỹ năng được tải (hoặc tái sử dụng từ snapshot) và tiêm vào env và prompt.
- Các file bootstrap/context được giải quyết và tiêm vào báo cáo system prompt.
- Khóa ghi session được lấy; `SessionManager` được mở và chuẩn bị trước khi streaming.

## Lắp ráp Prompt + System Prompt

- System prompt được xây dựng từ base prompt của OpenClaw, skills prompt, bootstrap context và các ghi đè per-run.
- Giới hạn model-specific và compaction reserve tokens được thực thi.
- Xem [System prompt](/concepts/system-prompt) để biết model thấy gì.

## Điểm hook (nơi có thể can thiệp)

OpenClaw có hai hệ thống hook:

- **Internal hooks** (Gateway hooks): script dựa trên sự kiện cho lệnh và sự kiện vòng đời.
- **Plugin hooks**: điểm mở rộng bên trong vòng đời agent/tool và pipeline gateway.

### Internal hooks (Gateway hooks)

- **`agent:bootstrap`**: chạy khi xây dựng file bootstrap trước khi system prompt được hoàn thiện. Dùng để thêm/xóa file bootstrap context.
- **Command hooks**: `/new`, `/reset`, `/stop`, và các sự kiện lệnh khác (xem tài liệu Hooks).

Xem [Hooks](/automation/hooks) để thiết lập và ví dụ.

### Plugin hooks (vòng đời agent + gateway)

Chạy bên trong vòng lặp agent hoặc pipeline gateway:

- **`before_model_resolve`**: chạy trước session (không có `messages`) để ghi đè provider/model trước khi giải quyết model.
- **`before_prompt_build`**: chạy sau khi tải session (với `messages`) để tiêm `prependContext`, `systemPrompt`, `prependSystemContext`, hoặc `appendSystemContext` trước khi gửi prompt. Dùng `prependContext` cho văn bản động per-turn và các trường system-context cho hướng dẫn ổn định nên nằm trong không gian system prompt.
- **`before_agent_start`**: hook tương thích legacy có thể chạy ở bất kỳ giai đoạn nào; ưu tiên các hook rõ ràng ở trên.
- **`agent_end`**: kiểm tra danh sách message cuối cùng và metadata chạy sau khi hoàn thành.
- **`before_compaction` / `after_compaction`**: quan sát hoặc chú thích các chu kỳ compaction.
- **`before_tool_call` / `after_tool_call`**: can thiệp tham số/kết quả tool.
- **`tool_result_persist`**: đồng bộ hóa chuyển đổi kết quả tool trước khi chúng được ghi vào transcript session.
- **`message_received` / `message_sending` / `message_sent`**: hook message inbound + outbound.
- **`session_start` / `session_end`**: ranh giới vòng đời session.
- **`gateway_start` / `gateway_stop`**: sự kiện vòng đời gateway.

Xem [Plugin hooks](/plugins/architecture#provider-runtime-hooks) để biết API hook và chi tiết đăng ký.

## Streaming + phản hồi từng phần

- Assistant deltas được stream từ pi-agent-core và phát ra dưới dạng sự kiện `assistant`.
- Block streaming có thể phát ra phản hồi từng phần trên `text_end` hoặc `message_end`.
- Reasoning streaming có thể được phát ra dưới dạng stream riêng hoặc dưới dạng block replies.
- Xem [Streaming](/concepts/streaming) để biết hành vi chunking và block reply.

## Thực thi công cụ + công cụ nhắn tin

- Sự kiện bắt đầu/cập nhật/kết thúc công cụ được phát ra trên stream `tool`.
- Kết quả công cụ được làm sạch kích thước và payload hình ảnh trước khi ghi log/phát ra.
- Gửi công cụ nhắn tin được theo dõi để ngăn chặn xác nhận trùng lặp của assistant.

## Định hình + ngăn chặn phản hồi

- Payloads cuối cùng được lắp ráp từ:
  - văn bản assistant (và reasoning tùy chọn)
  - tóm tắt công cụ inline (khi verbose + cho phép)
  - văn bản lỗi assistant khi model lỗi
- `NO_REPLY` được coi là token im lặng và lọc khỏi payloads gửi đi.
- Các bản sao công cụ nhắn tin được loại bỏ khỏi danh sách payloads cuối cùng.
- Nếu không còn payloads có thể render và một công cụ lỗi, một phản hồi lỗi công cụ dự phòng được phát ra (trừ khi một công cụ nhắn tin đã gửi một phản hồi có thể thấy cho người dùng).

## Compaction + retries

- Auto-compaction phát ra sự kiện stream `compaction` và có thể kích hoạt retry.
- Khi retry, bộ đệm trong bộ nhớ và tóm tắt công cụ được đặt lại để tránh output trùng lặp.
- Xem [Compaction](/concepts/compaction) để biết pipeline compaction.

## Event streams (hiện tại)

- `lifecycle`: phát ra bởi `subscribeEmbeddedPiSession` (và như một phương án dự phòng bởi `agentCommand`)
- `assistant`: streamed deltas từ pi-agent-core
- `tool`: streamed tool events từ pi-agent-core

## Xử lý kênh chat

- Assistant deltas được đệm vào message `delta` chat.
- Một chat `final` được phát ra khi **lifecycle end/error**.

## Timeouts

- `agent.wait` mặc định: 30s (chỉ chờ). Tham số `timeoutMs` ghi đè.
- Thời gian chạy agent: `agents.defaults.timeoutSeconds` mặc định 600s; thực thi trong `runEmbeddedPiAgent` abort timer.

## Nơi có thể kết thúc sớm

- Agent timeout (abort)
- AbortSignal (cancel)
- Gateway disconnect hoặc RPC timeout
- `agent.wait` timeout (chỉ chờ, không dừng agent)\n