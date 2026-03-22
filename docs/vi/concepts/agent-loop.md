---
summary: "Vòng đời của agent loop, luồng dữ liệu và cách chờ đợi"
read_when:
  - Cần hướng dẫn chi tiết về vòng lặp agent hoặc các sự kiện vòng đời
title: "Vòng Lặp Agent"
---

# Vòng Lặp Agent (OpenClaw)

Vòng lặp agent là quá trình chạy đầy đủ của một agent: tiếp nhận → lắp ráp ngữ cảnh → suy luận mô hình → thực thi công cụ → phát luồng phản hồi → lưu trữ. Đây là quy trình chính thức biến một thông điệp thành hành động và phản hồi cuối cùng, đồng thời duy trì trạng thái phiên nhất quán.

Trong OpenClaw, một vòng lặp là một lần chạy đơn lẻ, được tuần tự hóa cho mỗi phiên, phát ra các sự kiện vòng đời và luồng khi mô hình suy nghĩ, gọi công cụ và phát luồng đầu ra. Tài liệu này giải thích cách vòng lặp thực sự này được kết nối từ đầu đến cuối.

## Điểm bắt đầu

- Gateway RPC: `agent` và `agent.wait`.
- CLI: lệnh `agent`.

## Cách hoạt động (tổng quan)

1. RPC `agent` xác thực tham số, giải quyết phiên (sessionKey/sessionId), lưu trữ metadata phiên, trả về `{ runId, acceptedAt }` ngay lập tức.
2. `agentCommand` chạy agent:
   - giải quyết mô hình + mặc định suy nghĩ/chi tiết
   - tải snapshot kỹ năng
   - gọi `runEmbeddedPiAgent` (runtime pi-agent-core)
   - phát ra **vòng đời kết thúc/lỗi** nếu vòng lặp nhúng không phát ra
3. `runEmbeddedPiAgent`:
   - tuần tự hóa các lần chạy qua hàng đợi phiên + toàn cầu
   - giải quyết mô hình + hồ sơ xác thực và xây dựng phiên pi
   - đăng ký sự kiện pi và phát luồng delta trợ lý/công cụ
   - thực thi timeout -> hủy chạy nếu vượt quá
   - trả về payloads + metadata sử dụng
4. `subscribeEmbeddedPiSession` kết nối sự kiện pi-agent-core với luồng `agent` của OpenClaw:
   - sự kiện công cụ => `stream: "tool"`
   - delta trợ lý => `stream: "assistant"`
   - sự kiện vòng đời => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` sử dụng `waitForAgentJob`:
   - chờ **vòng đời kết thúc/lỗi** cho `runId`
   - trả về `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Hàng đợi + đồng thời

- Các lần chạy được tuần tự hóa theo khóa phiên (làn phiên) và tùy chọn qua làn toàn cầu.
- Điều này ngăn chặn các cuộc đua công cụ/phiên và giữ lịch sử phiên nhất quán.
- Các kênh nhắn tin có thể chọn chế độ hàng đợi (thu thập/điều hướng/theo dõi) để đưa vào hệ thống làn này.
  Xem [Hàng đợi Lệnh](/concepts/queue).

## Chuẩn bị phiên + không gian làm việc

- Không gian làm việc được giải quyết và tạo; các lần chạy sandbox có thể chuyển hướng đến gốc không gian làm việc sandbox.
- Kỹ năng được tải (hoặc tái sử dụng từ snapshot) và tiêm vào môi trường và prompt.
- Các tệp bootstrap/ngữ cảnh được giải quyết và tiêm vào báo cáo prompt hệ thống.
- Khóa ghi phiên được lấy; `SessionManager` được mở và chuẩn bị trước khi phát luồng.

## Lắp ráp prompt + prompt hệ thống

- Prompt hệ thống được xây dựng từ prompt cơ bản của OpenClaw, prompt kỹ năng, ngữ cảnh bootstrap và ghi đè từng lần chạy.
- Giới hạn mô hình cụ thể và dự trữ token nén được thực thi.
- Xem [Prompt hệ thống](/concepts/system-prompt) để biết mô hình thấy gì.

## Điểm móc (nơi bạn có thể can thiệp)

OpenClaw có hai hệ thống móc:

- **Móc nội bộ** (Gateway hooks): kịch bản dựa trên sự kiện cho các lệnh và sự kiện vòng đời.
- **Móc plugin**: điểm mở rộng bên trong vòng đời agent/công cụ và pipeline gateway.

### Móc nội bộ (Gateway hooks)

- **`agent:bootstrap`**: chạy khi xây dựng các tệp bootstrap trước khi prompt hệ thống được hoàn thiện. Sử dụng để thêm/xóa tệp ngữ cảnh bootstrap.
- Móc lệnh: `/new`, `/reset`, `/stop`, và các sự kiện lệnh khác (xem tài liệu Hooks).

Xem [Hooks](/automation/hooks) để biết cách thiết lập và ví dụ.

### Móc plugin (vòng đời agent + gateway)

Chạy bên trong vòng lặp agent hoặc pipeline gateway:

- **`before_model_resolve`**: chạy trước phiên (không có `messages`) để ghi đè nhà cung cấp/mô hình trước khi giải quyết mô hình.
- **`before_prompt_build`**: chạy sau khi tải phiên (với `messages`) để tiêm `prependContext`, `systemPrompt`, `prependSystemContext`, hoặc `appendSystemContext` trước khi gửi prompt. Sử dụng `prependContext` cho văn bản động từng lượt và các trường ngữ cảnh hệ thống cho hướng dẫn ổn định nên nằm trong không gian prompt hệ thống.
- **`before_agent_start`**: móc tương thích kế thừa có thể chạy trong bất kỳ giai đoạn nào; ưu tiên các móc rõ ràng ở trên.
- **`agent_end`**: kiểm tra danh sách thông điệp cuối cùng và metadata chạy sau khi hoàn thành.
- **`before_compaction` / `after_compaction`**: quan sát hoặc chú thích các chu kỳ nén.
- **`before_tool_call` / `after_tool_call`**: can thiệp tham số/kết quả công cụ.
- **`tool_result_persist`**: chuyển đổi đồng bộ kết quả công cụ trước khi chúng được ghi vào bản ghi phiên.
- **`message_received` / `message_sending` / `message_sent`**: móc thông điệp vào + ra.
- **`session_start` / `session_end`**: ranh giới vòng đời phiên.
- **`gateway_start` / `gateway_stop`**: sự kiện vòng đời gateway.

Xem [Móc plugin](/plugins/architecture#provider-runtime-hooks) để biết API móc và chi tiết đăng ký.

## Phát luồng + phản hồi từng phần

- Delta trợ lý được phát từ pi-agent-core và phát ra dưới dạng sự kiện `assistant`.
- Phát luồng khối có thể phát ra phản hồi từng phần trên `text_end` hoặc `message_end`.
- Phát luồng lý luận có thể được phát ra dưới dạng luồng riêng biệt hoặc dưới dạng phản hồi khối.
- Xem [Phát luồng](/concepts/streaming) để biết hành vi chia nhỏ và phản hồi khối.

## Thực thi công cụ + công cụ nhắn tin

- Sự kiện bắt đầu/cập nhật/kết thúc công cụ được phát ra trên luồng `tool`.
- Kết quả công cụ được làm sạch kích thước và payload hình ảnh trước khi ghi nhật ký/phát ra.
- Gửi công cụ nhắn tin được theo dõi để ngăn chặn xác nhận trợ lý trùng lặp.

## Định hình phản hồi + ngăn chặn

- Payload cuối cùng được lắp ráp từ:
  - văn bản trợ lý (và lý luận tùy chọn)
  - tóm tắt công cụ nội tuyến (khi chi tiết + cho phép)
  - văn bản lỗi trợ lý khi mô hình gặp lỗi
- `NO_REPLY` được coi là token im lặng và bị lọc khỏi danh sách payload gửi đi.
- Các bản sao công cụ nhắn tin bị loại bỏ khỏi danh sách payload cuối cùng.
- Nếu không còn payload có thể hiển thị và một công cụ gặp lỗi, một phản hồi lỗi công cụ dự phòng được phát ra (trừ khi một công cụ nhắn tin đã gửi phản hồi có thể thấy cho người dùng).

## Nén + thử lại

- Nén tự động phát ra sự kiện luồng `compaction` và có thể kích hoạt thử lại.
- Khi thử lại, bộ đệm trong bộ nhớ và tóm tắt công cụ được đặt lại để tránh đầu ra trùng lặp.
- Xem [Nén](/concepts/compaction) để biết pipeline nén.

## Luồng sự kiện (hiện tại)

- `lifecycle`: phát ra bởi `subscribeEmbeddedPiSession` (và như một dự phòng bởi `agentCommand`)
- `assistant`: delta phát từ pi-agent-core
- `tool`: sự kiện công cụ phát từ pi-agent-core

## Xử lý kênh chat

- Delta trợ lý được đệm thành thông điệp `delta` chat.
- Một chat `final` được phát ra khi **vòng đời kết thúc/lỗi**.

## Thời gian chờ

- Mặc định `agent.wait`: 30s (chỉ chờ). Tham số `timeoutMs` ghi đè.
- Thời gian chạy agent: `agents.defaults.timeoutSeconds` mặc định 600s; thực thi trong bộ hẹn giờ hủy `runEmbeddedPiAgent`.

## Nơi có thể kết thúc sớm

- Thời gian chờ agent (hủy)
- AbortSignal (hủy)
- Ngắt kết nối Gateway hoặc thời gian chờ RPC
- Thời gian chờ `agent.wait` (chỉ chờ, không dừng agent)
