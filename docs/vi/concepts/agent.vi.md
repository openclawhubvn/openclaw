---
summary: "Agent runtime, workspace contract, và session bootstrap"
read_when:
  - Thay đổi agent runtime, workspace bootstrap, hoặc hành vi session
title: "Agent Runtime"
---

# Agent Runtime

OpenClaw chạy một agent runtime nhúng duy nhất.

## Workspace (bắt buộc)

OpenClaw sử dụng một thư mục agent workspace (`agents.defaults.workspace`) làm thư mục làm việc **duy nhất** (`cwd`) cho công cụ và ngữ cảnh.

Khuyến nghị: dùng `openclaw setup` để tạo `~/.openclaw/openclaw.json` nếu chưa có và khởi tạo các file workspace.

Hướng dẫn đầy đủ về cấu trúc workspace + backup: [Agent workspace](/concepts/agent-workspace)

Nếu `agents.defaults.sandbox` được bật, các session không phải chính có thể ghi đè bằng workspace riêng dưới `agents.defaults.sandbox.workspaceRoot` (xem [Gateway configuration](/gateway/configuration)).

## Bootstrap files (được chèn)

Trong `agents.defaults.workspace`, OpenClaw yêu cầu các file có thể chỉnh sửa sau:

- `AGENTS.md` — hướng dẫn vận hành + “bộ nhớ”
- `SOUL.md` — persona, giới hạn, giọng điệu
- `TOOLS.md` — ghi chú công cụ do người dùng duy trì (ví dụ: `imsg`, `sag`, conventions)
- `BOOTSTRAP.md` — nghi thức chạy lần đầu (xóa sau khi hoàn thành)
- `IDENTITY.md` — tên/khí chất/emoji của agent
- `USER.md` — hồ sơ người dùng + địa chỉ ưa thích

Khi bắt đầu một session mới, OpenClaw chèn nội dung của các file này trực tiếp vào ngữ cảnh agent.

File trống sẽ bị bỏ qua. File lớn sẽ bị cắt và đánh dấu để giữ prompt gọn (đọc file để xem nội dung đầy đủ).

Nếu thiếu file, OpenClaw chèn một dòng đánh dấu “thiếu file” (và `openclaw setup` sẽ tạo mẫu mặc định an toàn).

`BOOTSTRAP.md` chỉ được tạo cho **workspace hoàn toàn mới** (không có file bootstrap khác). Nếu xóa sau khi hoàn thành nghi thức, nó sẽ không được tạo lại khi khởi động lại.

Để tắt hoàn toàn việc tạo file bootstrap (cho workspace đã có sẵn), đặt:

```json5
{ agent: { skipBootstrap: true } }
```

## Công cụ tích hợp

Công cụ cốt lõi (đọc/thực thi/chỉnh sửa/ghi và công cụ hệ thống liên quan) luôn có sẵn, tùy thuộc vào chính sách công cụ. `apply_patch` là tùy chọn và bị kiểm soát bởi `tools.exec.applyPatch`. `TOOLS.md` **không** kiểm soát công cụ nào tồn tại; nó là hướng dẫn cho cách _bạn_ muốn sử dụng chúng.

## Kỹ năng

OpenClaw tải kỹ năng từ ba nơi (workspace thắng khi trùng tên):

- Bundled (đi kèm với cài đặt)
- Managed/local: `~/.openclaw/skills`
- Workspace: `<workspace>/skills`

Kỹ năng có thể bị kiểm soát bởi config/env (xem `skills` trong [Gateway configuration](/gateway/configuration)).

## Giới hạn runtime

Agent runtime nhúng được xây dựng trên lõi Pi agent (models, tools, và prompt pipeline). Quản lý session, khám phá, kết nối công cụ, và phân phối channel là các lớp của OpenClaw trên lõi đó.

## Sessions

Bản ghi session được lưu dưới dạng JSONL tại:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Session ID ổn định và được chọn bởi OpenClaw. Thư mục session cũ từ công cụ khác không được đọc.

## Điều khiển khi streaming

Khi chế độ hàng đợi là `steer`, tin nhắn đến được chèn vào lần chạy hiện tại. Hàng đợi được kiểm tra **sau mỗi lần gọi công cụ**; nếu có tin nhắn trong hàng đợi, các lần gọi công cụ còn lại từ tin nhắn trợ lý hiện tại bị bỏ qua (kết quả công cụ lỗi với "Skipped due to queued user message."), sau đó tin nhắn người dùng trong hàng đợi được chèn trước phản hồi trợ lý tiếp theo.

Khi chế độ hàng đợi là `followup` hoặc `collect`, tin nhắn đến được giữ lại cho đến khi lượt hiện tại kết thúc, sau đó một lượt agent mới bắt đầu với payloads trong hàng đợi. Xem [Queue](/concepts/queue) để biết chế độ + hành vi debounce/cap.

Block streaming gửi các block trợ lý hoàn thành ngay khi chúng kết thúc; nó **tắt mặc định** (`agents.defaults.blockStreamingDefault: "off"`). Điều chỉnh giới hạn qua `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; mặc định là text_end). Kiểm soát chunking block mềm với `agents.defaults.blockStreamingChunk` (mặc định là 800–1200 ký tự; ưu tiên ngắt đoạn, sau đó là ngắt dòng; câu cuối cùng). Gom các chunk đã stream với `agents.defaults.blockStreamingCoalesce` để giảm spam dòng đơn (hợp nhất dựa trên idle trước khi gửi). Các channel không phải Telegram yêu cầu `*.blockStreaming: true` để bật phản hồi block. Tóm tắt công cụ chi tiết được phát ra khi công cụ bắt đầu (không debounce); Control UI stream đầu ra công cụ qua sự kiện agent khi có sẵn. Chi tiết thêm: [Streaming + chunking](/concepts/streaming).

## Model refs

Model refs trong config (ví dụ `agents.defaults.model` và `agents.defaults.models`) được phân tích bằng cách tách trên **dấu `/` đầu tiên**.

- Dùng `provider/model` khi cấu hình models.
- Nếu model ID tự nó chứa `/` (kiểu OpenRouter), bao gồm tiền tố provider (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bỏ qua provider, OpenClaw coi đầu vào là alias hoặc model cho **provider mặc định** (chỉ hoạt động khi không có `/` trong model ID).

## Cấu hình (tối thiểu)

Tối thiểu, đặt:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (rất khuyến nghị)

---

_Tiếp theo: [Group Chats](/channels/group-messages)_ 🦞\n