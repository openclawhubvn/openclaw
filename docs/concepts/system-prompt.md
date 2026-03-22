---
summary: "Khám phá cách cấu trúc System Prompt trong OpenClaw để tối ưu hóa hiệu suất và cải thiện trải nghiệm người dùng."
read_when:
  - Chỉnh sửa văn bản system prompt, danh sách công cụ, hoặc các phần thời gian/heartbeat
  - Thay đổi hành vi khởi tạo workspace hoặc chèn kỹ năng
title: "Hướng Dẫn Cấu Trúc System Prompt OpenClaw"
---

# System Prompt

OpenClaw tạo một system prompt tùy chỉnh cho mỗi lần chạy agent. Prompt này thuộc sở hữu của OpenClaw và không sử dụng prompt mặc định của pi-coding-agent.

Prompt được OpenClaw lắp ráp và chèn vào mỗi lần chạy agent.

## Cấu trúc

Prompt được thiết kế gọn gàng và sử dụng các phần cố định:

- **Tooling**: danh sách công cụ hiện tại kèm mô tả ngắn.
- **Safety**: nhắc nhở ngắn về việc tránh hành vi tìm kiếm quyền lực hoặc vượt qua giám sát.
- **Skills** (khi có): hướng dẫn model cách tải hướng dẫn kỹ năng theo yêu cầu.
- **OpenClaw Self-Update**: cách chạy `config.apply` và `update.run`.
- **Workspace**: thư mục làm việc (`agents.defaults.workspace`).
- **Documentation**: đường dẫn đến tài liệu OpenClaw (repo hoặc gói npm) và khi nào cần đọc.
- **Workspace Files (injected)**: chỉ ra các file bootstrap được chèn bên dưới.
- **Sandbox** (khi được kích hoạt): chỉ ra runtime sandboxed, đường dẫn sandbox, và liệu có sẵn thực thi nâng cao hay không.
- **Current Date & Time**: thời gian địa phương của người dùng, múi giờ và định dạng thời gian.
- **Reply Tags**: cú pháp thẻ trả lời tùy chọn cho các nhà cung cấp được hỗ trợ.
- **Heartbeats**: prompt heartbeat và hành vi xác nhận.
- **Runtime**: host, hệ điều hành, node, model, repo root (khi phát hiện), mức độ suy nghĩ (một dòng).
- **Reasoning**: mức độ hiển thị hiện tại + gợi ý chuyển đổi /reasoning.

Các hướng dẫn an toàn trong system prompt chỉ mang tính chất tư vấn. Chúng hướng dẫn hành vi của model nhưng không thực thi chính sách. Sử dụng chính sách công cụ, phê duyệt thực thi, sandboxing, và danh sách cho phép kênh để thực thi cứng; các nhà vận hành có thể tắt chúng theo thiết kế.

## Chế độ Prompt

OpenClaw có thể tạo các system prompt nhỏ hơn cho các sub-agent. Runtime thiết lập một `promptMode` cho mỗi lần chạy (không phải cấu hình hướng người dùng):

- `full` (mặc định): bao gồm tất cả các phần trên.
- `minimal`: dùng cho sub-agent; bỏ qua **Skills**, **Memory Recall**, **OpenClaw Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**, **Messaging**, **Silent Replies**, và **Heartbeats**. Tooling, **Safety**, Workspace, Sandbox, Current Date & Time (khi biết), Runtime, và ngữ cảnh chèn vẫn có sẵn.
- `none`: chỉ trả về dòng nhận diện cơ bản.

Khi `promptMode=minimal`, các prompt chèn thêm được gắn nhãn **Subagent Context** thay vì **Group Chat Context**.

## Chèn khởi tạo Workspace

Các file bootstrap được cắt gọn và thêm vào dưới **Project Context** để model thấy ngữ cảnh nhận diện và hồ sơ mà không cần đọc rõ ràng:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ trên workspace mới)
- `MEMORY.md` khi có, nếu không thì `memory.md` như một lựa chọn dự phòng viết thường

Tất cả các file này được **chèn vào cửa sổ ngữ cảnh** trong mỗi lượt, điều này có nghĩa là chúng tiêu tốn token. Giữ chúng ngắn gọn — đặc biệt là `MEMORY.md`, có thể phát triển theo thời gian và dẫn đến việc sử dụng ngữ cảnh cao bất ngờ và nén thường xuyên hơn.

> **Lưu ý:** các file hàng ngày `memory/*.md` **không** được chèn tự động. Chúng được truy cập theo yêu cầu qua các công cụ `memory_search` và `memory_get`, vì vậy chúng không tính vào cửa sổ ngữ cảnh trừ khi model đọc chúng rõ ràng.

Các file lớn bị cắt ngắn với một dấu hiệu. Kích thước tối đa mỗi file được kiểm soát bởi `agents.defaults.bootstrapMaxChars` (mặc định: 20000). Tổng nội dung bootstrap chèn qua các file bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars` (mặc định: 150000). Các file thiếu chèn một dấu hiệu file thiếu ngắn. Khi xảy ra cắt ngắn, OpenClaw có thể chèn một khối cảnh báo trong Project Context; kiểm soát điều này với `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; mặc định: `once`).

Các phiên sub-agent chỉ chèn `AGENTS.md` và `TOOLS.md` (các file bootstrap khác bị lọc ra để giữ ngữ cảnh sub-agent nhỏ).

Các hook nội bộ có thể chặn bước này qua `agent:bootstrap` để biến đổi hoặc thay thế các file bootstrap chèn (ví dụ thay `SOUL.md` bằng một persona thay thế).

Để kiểm tra mỗi file chèn đóng góp bao nhiêu (thô so với chèn, cắt ngắn, cộng với chi phí schema công cụ), sử dụng `/context list` hoặc `/context detail`. Xem [Context](/concepts/context).

## Xử lý thời gian

System prompt bao gồm một phần **Current Date & Time** khi biết múi giờ của người dùng. Để giữ cache prompt ổn định, nó chỉ bao gồm **múi giờ** (không có đồng hồ động hoặc định dạng thời gian).

Sử dụng `session_status` khi agent cần thời gian hiện tại; thẻ trạng thái bao gồm một dòng dấu thời gian.

Cấu hình với:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Xem [Date & Time](/date-time) để biết chi tiết hành vi đầy đủ.

## Kỹ năng

Khi có kỹ năng đủ điều kiện, OpenClaw chèn một danh sách **kỹ năng có sẵn** gọn gàng (`formatSkillsForPrompt`) bao gồm **đường dẫn file** cho mỗi kỹ năng. Prompt hướng dẫn model sử dụng `read` để tải SKILL.md tại vị trí đã liệt kê (workspace, quản lý, hoặc gói). Nếu không có kỹ năng nào đủ điều kiện, phần Skills bị bỏ qua.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Điều này giữ cho prompt cơ bản nhỏ trong khi vẫn cho phép sử dụng kỹ năng mục tiêu.

## Tài liệu

Khi có sẵn, system prompt bao gồm một phần **Documentation** chỉ đến thư mục tài liệu OpenClaw cục bộ (hoặc `docs/` trong workspace repo hoặc tài liệu gói npm) và cũng ghi chú gương công khai, repo nguồn, cộng đồng Discord, và ClawHub ([https://clawhub.com](https://clawhub.com)) để khám phá kỹ năng. Prompt hướng dẫn model tham khảo tài liệu cục bộ trước cho hành vi, lệnh, cấu hình, hoặc kiến trúc của OpenClaw, và tự chạy `openclaw status` khi có thể (chỉ hỏi người dùng khi thiếu quyền truy cập).
