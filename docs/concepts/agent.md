---
summary: "Tìm hiểu cách cấu hình thời gian chạy của Agent, quản lý hợp đồng workspace và khởi động phiên hiệu quả."
read_when:
  - Thay đổi thời gian chạy của agent, khởi động workspace, hoặc hành vi phiên
title: "Hướng Dẫn Cấu Hình Thời Gian Chạy Agent"
---

# Thời Gian Chạy của Agent

OpenClaw chạy một thời gian chạy agent nhúng duy nhất.

## Workspace (bắt buộc)

OpenClaw sử dụng một thư mục workspace agent duy nhất (`agents.defaults.workspace`) làm thư mục làm việc **duy nhất** (`cwd`) cho công cụ và ngữ cảnh.

Khuyến nghị: sử dụng `openclaw setup` để tạo `~/.openclaw/openclaw.json` nếu thiếu và khởi tạo các tệp workspace.

Bố cục workspace đầy đủ + hướng dẫn sao lưu: [Agent workspace](/concepts/agent-workspace)

Nếu `agents.defaults.sandbox` được bật, các phiên không phải chính có thể ghi đè điều này với các workspace theo phiên dưới `agents.defaults.sandbox.workspaceRoot` (xem [Cấu hình Gateway](/gateway/configuration)).

## Tệp khởi động (được chèn)

Bên trong `agents.defaults.workspace`, OpenClaw mong đợi các tệp có thể chỉnh sửa bởi người dùng sau:

- `AGENTS.md` — hướng dẫn vận hành + “bộ nhớ”
- `SOUL.md` — cá tính, giới hạn, giọng điệu
- `TOOLS.md` — ghi chú công cụ do người dùng duy trì (ví dụ: `imsg`, `sag`, quy ước)
- `BOOTSTRAP.md` — nghi thức chạy lần đầu (bị xóa sau khi hoàn thành)
- `IDENTITY.md` — tên/vibe/emoji của agent
- `USER.md` — hồ sơ người dùng + địa chỉ ưa thích

Trong lần đầu tiên của một phiên mới, OpenClaw chèn nội dung của các tệp này trực tiếp vào ngữ cảnh của agent.

Các tệp trống sẽ bị bỏ qua. Các tệp lớn sẽ được cắt và rút gọn với một dấu hiệu để giữ cho các gợi ý gọn nhẹ (đọc tệp để có nội dung đầy đủ).

Nếu thiếu tệp, OpenClaw chèn một dòng dấu hiệu “thiếu tệp” duy nhất (và `openclaw setup` sẽ tạo một mẫu mặc định an toàn).

`BOOTSTRAP.md` chỉ được tạo cho một **workspace hoàn toàn mới** (không có tệp khởi động nào khác). Nếu bạn xóa nó sau khi hoàn thành nghi thức, nó sẽ không được tạo lại trong các lần khởi động sau.

Để vô hiệu hóa hoàn toàn việc tạo tệp khởi động (cho các workspace đã được chuẩn bị trước), thiết lập:

```json5
{ agent: { skipBootstrap: true } }
```

## Công cụ tích hợp sẵn

Các công cụ cốt lõi (đọc/thực thi/chỉnh sửa/ghi và các công cụ hệ thống liên quan) luôn có sẵn, tùy thuộc vào chính sách công cụ. `apply_patch` là tùy chọn và được kiểm soát bởi `tools.exec.applyPatch`. `TOOLS.md` **không** kiểm soát công cụ nào tồn tại; nó là hướng dẫn cho cách _bạn_ muốn sử dụng chúng.

## Kỹ năng

OpenClaw tải kỹ năng từ ba vị trí (workspace sẽ ưu tiên nếu có xung đột tên):

- Được đóng gói (đi kèm với cài đặt)
- Quản lý/cục bộ: `~/.openclaw/skills`
- Workspace: `<workspace>/skills`

Kỹ năng có thể bị kiểm soát bởi cấu hình/môi trường (xem `skills` trong [Cấu hình Gateway](/gateway/configuration)).

## Giới hạn thời gian chạy

Thời gian chạy agent nhúng được xây dựng trên lõi agent Pi (mô hình, công cụ và quy trình gợi ý). Quản lý phiên, khám phá, kết nối công cụ, và phân phối kênh là các lớp do OpenClaw sở hữu trên lõi đó.

## Phiên

Bản ghi phiên được lưu trữ dưới dạng JSONL tại:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

ID phiên là ổn định và được chọn bởi OpenClaw. Các thư mục phiên cũ từ các công cụ khác không được đọc.

## Điều khiển khi đang truyền

Khi chế độ hàng đợi là `steer`, các tin nhắn đến được chèn vào lần chạy hiện tại. Hàng đợi được kiểm tra **sau mỗi lần gọi công cụ**; nếu có tin nhắn trong hàng đợi, các lần gọi công cụ còn lại từ tin nhắn trợ lý hiện tại sẽ bị bỏ qua (kết quả công cụ lỗi với "Bỏ qua do tin nhắn người dùng trong hàng đợi."), sau đó tin nhắn người dùng trong hàng đợi được chèn trước khi có phản hồi từ trợ lý tiếp theo.

Khi chế độ hàng đợi là `followup` hoặc `collect`, các tin nhắn đến được giữ lại cho đến khi lượt hiện tại kết thúc, sau đó một lượt agent mới bắt đầu với các tải trọng trong hàng đợi. Xem [Hàng đợi](/concepts/queue) để biết chế độ + hành vi debounce/cap.

Truyền khối gửi các khối trợ lý hoàn thành ngay khi chúng kết thúc; nó **tắt theo mặc định** (`agents.defaults.blockStreamingDefault: "off"`). Điều chỉnh giới hạn qua `agents.defaults.blockStreamingBreak` (`text_end` so với `message_end`; mặc định là text_end). Kiểm soát phân đoạn khối mềm với `agents.defaults.blockStreamingChunk` (mặc định từ 800–1200 ký tự; ưu tiên ngắt đoạn, sau đó là ngắt dòng; câu cuối cùng). Kết hợp các khối truyền với `agents.defaults.blockStreamingCoalesce` để giảm spam dòng đơn (hợp nhất dựa trên thời gian nhàn rỗi trước khi gửi). Các kênh không phải Telegram yêu cầu `*.blockStreaming: true` để kích hoạt phản hồi khối. Tóm tắt công cụ chi tiết được phát ra khi bắt đầu công cụ (không debounce); Giao diện người dùng điều khiển luồng đầu ra công cụ qua sự kiện agent khi có sẵn. Chi tiết thêm: [Truyền + phân đoạn](/concepts/streaming).

## Tham chiếu mô hình

Tham chiếu mô hình trong cấu hình (ví dụ `agents.defaults.model` và `agents.defaults.models`) được phân tích bằng cách tách trên `/` **đầu tiên**.

- Sử dụng `provider/model` khi cấu hình mô hình.
- Nếu ID mô hình tự nó chứa `/` (kiểu OpenRouter), bao gồm tiền tố nhà cung cấp (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua nhà cung cấp, OpenClaw coi đầu vào là một bí danh hoặc một mô hình cho **nhà cung cấp mặc định** (chỉ hoạt động khi không có `/` trong ID mô hình).

## Cấu hình (tối thiểu)

Tối thiểu, thiết lập:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (rất khuyến nghị)

---

_Tiếp theo: [Nhóm Chat](/channels/group-messages)_ 🦞
