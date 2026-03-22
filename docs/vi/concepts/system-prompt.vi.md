---
summary: "Nội dung và cách cấu trúc system prompt của OpenClaw"
read_when:
  - Chỉnh sửa nội dung system prompt, danh sách công cụ, hoặc phần thời gian/heartbeat
  - Thay đổi hành vi bootstrap workspace hoặc injection kỹ năng
title: "System Prompt"
---

# System Prompt

OpenClaw tạo system prompt tùy chỉnh cho mỗi lần chạy agent. Prompt này **thuộc sở hữu của OpenClaw** và không dùng prompt mặc định của pi-coding-agent.

Prompt được OpenClaw lắp ráp và tiêm vào mỗi lần chạy agent.

## Cấu trúc

Prompt được thiết kế gọn gàng với các phần cố định:

- **Tooling**: danh sách công cụ hiện tại + mô tả ngắn.
- **Safety**: nhắc nhở ngắn về bảo vệ để tránh hành vi tìm kiếm quyền lực hoặc vượt qua giám sát.
- **Skills** (nếu có): hướng dẫn model cách tải hướng dẫn kỹ năng khi cần.
- **OpenClaw Self-Update**: cách chạy `config.apply` và `update.run`.
- **Workspace**: thư mục làm việc (`agents.defaults.workspace`).
- **Documentation**: đường dẫn tới tài liệu OpenClaw (repo hoặc npm package) và khi nào cần đọc.
- **Workspace Files (injected)**: chỉ ra các file bootstrap được đính kèm bên dưới.
- **Sandbox** (nếu bật): chỉ ra runtime sandboxed, đường dẫn sandbox, và liệu có thể thực thi nâng cao.
- **Current Date & Time**: thời gian người dùng, múi giờ, và định dạng thời gian.
- **Reply Tags**: cú pháp tag trả lời tùy chọn cho các provider hỗ trợ.
- **Heartbeats**: prompt heartbeat và hành vi ack.
- **Runtime**: host, OS, node, repo root (nếu phát hiện), mức độ suy nghĩ (một dòng).
- **Reasoning**: mức độ hiển thị hiện tại + gợi ý chuyển đổi /reasoning.

Guardrail an toàn trong system prompt chỉ mang tính khuyến nghị. Chúng hướng dẫn hành vi model nhưng không thực thi chính sách. Dùng chính sách công cụ, phê duyệt thực thi, sandboxing, và allowlist kênh để thực thi cứng; operator có thể tắt chúng theo thiết kế.

## Chế độ Prompt

OpenClaw có thể tạo prompt hệ thống nhỏ hơn cho sub-agent. Runtime thiết lập `promptMode` cho mỗi lần chạy (không phải cấu hình người dùng):

- `full` (mặc định): bao gồm tất cả các phần trên.
- `minimal`: dùng cho sub-agent; bỏ qua **Skills**, **Memory Recall**, **OpenClaw Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**, **Messaging**, **Silent Replies**, và **Heartbeats**. Tooling, **Safety**, Workspace, Sandbox, Current Date & Time (nếu biết), Runtime, và ngữ cảnh injected vẫn có sẵn.
- `none`: chỉ trả về dòng nhận diện cơ bản.

Khi `promptMode=minimal`, các prompt injected thêm được gắn nhãn **Subagent Context** thay vì **Group Chat Context**.

## Injection bootstrap Workspace

Các file bootstrap được cắt gọn và đính kèm dưới **Project Context** để model thấy ngữ cảnh nhận diện và hồ sơ mà không cần đọc rõ ràng:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ trên workspace mới)
- `MEMORY.md` khi có, nếu không thì `memory.md` như một fallback viết thường

Tất cả các file này **được tiêm vào cửa sổ ngữ cảnh** mỗi lượt, nghĩa là chúng tiêu tốn token. Giữ chúng ngắn gọn — đặc biệt là `MEMORY.md`, có thể lớn dần theo thời gian và dẫn đến sử dụng ngữ cảnh cao bất ngờ và nén thường xuyên hơn.

> **Lưu ý:** Các file hàng ngày `memory/*.md` **không** được tiêm tự động. Chúng được truy cập theo yêu cầu qua công cụ `memory_search` và `memory_get`, nên không tính vào cửa sổ ngữ cảnh trừ khi model đọc rõ ràng.

Các file lớn bị cắt ngắn với một dấu hiệu. Kích thước tối đa mỗi file được kiểm soát bởi `agents.defaults.bootstrapMaxChars` (mặc định: 20000). Tổng nội dung bootstrap injected qua các file bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars` (mặc định: 150000). Các file thiếu tiêm một dấu hiệu thiếu file ngắn. Khi xảy ra cắt ngắn, OpenClaw có thể tiêm một khối cảnh báo trong Project Context; kiểm soát điều này với `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; mặc định: `once`).

Phiên sub-agent chỉ tiêm `AGENTS.md` và `TOOLS.md` (các file bootstrap khác bị lọc ra để giữ ngữ cảnh sub-agent nhỏ).

Các hook nội bộ có thể chặn bước này qua `agent:bootstrap` để thay đổi hoặc thay thế các file bootstrap injected (ví dụ thay `SOUL.md` bằng một persona thay thế).

Để kiểm tra mỗi file injected đóng góp bao nhiêu (thô so với injected, cắt ngắn, cộng với overhead schema công cụ), dùng `/context list` hoặc `/context detail`. Xem [Context](/concepts/context).

## Xử lý thời gian

System prompt bao gồm một phần **Current Date & Time** khi biết múi giờ người dùng. Để giữ cache-stable cho prompt, giờ chỉ bao gồm **múi giờ** (không có đồng hồ động hoặc định dạng thời gian).

Dùng `session_status` khi agent cần thời gian hiện tại; thẻ trạng thái bao gồm một dòng timestamp.

Cấu hình với:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Xem [Date & Time](/date-time) để biết chi tiết hành vi đầy đủ.

## Skills

Khi có kỹ năng đủ điều kiện, OpenClaw tiêm một **danh sách kỹ năng có sẵn** gọn (`formatSkillsForPrompt`) bao gồm **đường dẫn file** cho mỗi kỹ năng. Prompt hướng dẫn model dùng `read` để tải SKILL.md tại vị trí đã liệt kê (workspace, managed, hoặc bundled). Nếu không có kỹ năng đủ điều kiện, phần Skills bị bỏ qua.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Điều này giữ cho prompt cơ bản nhỏ trong khi vẫn cho phép sử dụng kỹ năng có mục tiêu.

## Documentation

Khi có sẵn, system prompt bao gồm một phần **Documentation** chỉ tới thư mục tài liệu OpenClaw cục bộ (hoặc `docs/` trong repo workspace hoặc tài liệu npm package bundled) và cũng ghi chú gương công khai, repo nguồn, Discord cộng đồng, và ClawHub ([https://clawhub.com](https://clawhub.com)) để khám phá kỹ năng. Prompt hướng dẫn model tham khảo tài liệu cục bộ trước cho hành vi, lệnh, cấu hình, hoặc kiến trúc OpenClaw, và tự chạy `openclaw status` khi có thể (chỉ hỏi người dùng khi thiếu quyền truy cập).\n