---
title: "Memory"
summary: "Cách hoạt động của bộ nhớ OpenClaw (file workspace + tự động flush bộ nhớ)"
read_when:
  - Cần layout file bộ nhớ và workflow
  - Muốn tinh chỉnh tự động flush bộ nhớ trước khi nén
---

# Memory

Bộ nhớ OpenClaw là **Markdown đơn giản trong workspace của agent**. File là nguồn dữ liệu chính; model chỉ "nhớ" những gì được ghi vào đĩa.

Công cụ tìm kiếm bộ nhớ được cung cấp bởi plugin bộ nhớ đang hoạt động (mặc định: `memory-core`). Tắt plugin bộ nhớ bằng `plugins.slots.memory = "none"`.

## File bộ nhớ (Markdown)

Layout workspace mặc định sử dụng hai lớp bộ nhớ:

- `memory/YYYY-MM-DD.md`
  - Log hàng ngày (chỉ thêm).
  - Đọc hôm nay + hôm qua khi bắt đầu session.
- `MEMORY.md` (tùy chọn)
  - Bộ nhớ dài hạn đã chọn lọc.
  - Nếu cả `MEMORY.md` và `memory.md` tồn tại ở gốc workspace, OpenClaw chỉ tải `MEMORY.md`.
  - `memory.md` chữ thường chỉ dùng khi không có `MEMORY.md`.
  - **Chỉ tải trong session chính, riêng tư** (không bao giờ trong ngữ cảnh nhóm).

Các file này nằm trong workspace (`agents.defaults.workspace`, mặc định `~/.openclaw/workspace`). Xem [Agent workspace](/concepts/agent-workspace) để biết layout đầy đủ.

## Công cụ bộ nhớ

OpenClaw cung cấp hai công cụ cho agent với các file Markdown này:

- `memory_search` -- tìm kiếm ngữ nghĩa qua các đoạn đã được index.
- `memory_get` -- đọc mục tiêu một file/dòng Markdown cụ thể.

`memory_get` giờ **xử lý tốt khi file không tồn tại** (ví dụ, log hàng ngày của hôm nay trước lần ghi đầu tiên). Cả trình quản lý tích hợp và backend QMD trả về `{ text: "", path }` thay vì ném `ENOENT`, giúp agent xử lý "chưa ghi gì" và tiếp tục workflow mà không cần bọc lệnh gọi công cụ trong try/catch.

## Khi nào ghi bộ nhớ

- Quyết định, sở thích, và thông tin bền vững ghi vào `MEMORY.md`.
- Ghi chú hàng ngày và ngữ cảnh đang chạy ghi vào `memory/YYYY-MM-DD.md`.
- Nếu ai đó nói "nhớ cái này," hãy ghi lại (không giữ trong RAM).
- Khu vực này vẫn đang phát triển. Nhắc model lưu trữ ký ức; nó sẽ biết phải làm gì.
- Nếu muốn điều gì đó được ghi nhớ, **yêu cầu bot ghi vào bộ nhớ**.

## Tự động flush bộ nhớ (ping trước khi nén)

Khi session **gần đến lúc tự động nén**, OpenClaw kích hoạt một **lượt agentic im lặng** nhắc model ghi bộ nhớ bền vững **trước khi** ngữ cảnh bị nén. Prompt mặc định nói rõ model _có thể trả lời_, nhưng thường `NO_REPLY` là phản hồi đúng để người dùng không thấy lượt này.

Điều này được kiểm soát bởi `agents.defaults.compaction.memoryFlush`:

```json5
{
  agents: {
    defaults: {
      compaction: {
        reserveTokensFloor: 20000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 4000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

Chi tiết:

- **Ngưỡng mềm**: flush kích hoạt khi ước tính token của session vượt qua `contextWindow - reserveTokensFloor - softThresholdTokens`.
- **Im lặng** theo mặc định: prompt bao gồm `NO_REPLY` nên không có gì được gửi đi.
- **Hai prompt**: một prompt người dùng và một prompt hệ thống thêm nhắc nhở.
- **Một flush mỗi chu kỳ nén** (theo dõi trong `sessions.json`).
- **Workspace phải có quyền ghi**: nếu session chạy trong sandbox với `workspaceAccess: "ro"` hoặc `"none"`, flush bị bỏ qua.

Để biết vòng đời nén đầy đủ, xem [Quản lý session + nén](/reference/session-management-compaction).

## Tìm kiếm bộ nhớ vector

OpenClaw có thể xây dựng một index vector nhỏ trên `MEMORY.md` và `memory/*.md` để truy vấn ngữ nghĩa có thể tìm thấy ghi chú liên quan ngay cả khi cách diễn đạt khác nhau. Tìm kiếm kết hợp (BM25 + vector) có sẵn để kết hợp khớp ngữ nghĩa với tìm kiếm từ khóa chính xác.

Tìm kiếm bộ nhớ hỗ trợ nhiều nhà cung cấp embedding (OpenAI, Gemini, Voyage, Mistral, Ollama, và mô hình GGUF local), một backend QMD sidecar tùy chọn cho truy xuất nâng cao, và các tính năng xử lý hậu kỳ như xếp hạng lại đa dạng MMR và suy giảm theo thời gian.

Để biết cấu hình đầy đủ -- bao gồm thiết lập nhà cung cấp embedding, backend QMD, tinh chỉnh tìm kiếm kết hợp, bộ nhớ đa phương tiện, và tất cả các nút cấu hình -- xem [Tham khảo cấu hình bộ nhớ](/reference/memory-config).\n