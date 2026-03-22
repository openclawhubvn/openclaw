---
title: "Bộ nhớ"
summary: "Cách hoạt động của bộ nhớ OpenClaw (tệp workspace + tự động xóa bộ nhớ)"
read_when:
  - Bạn muốn biết cấu trúc và quy trình làm việc của tệp bộ nhớ
  - Bạn muốn điều chỉnh tính năng tự động xóa bộ nhớ trước khi nén
---

# Bộ nhớ

Bộ nhớ của OpenClaw là **Markdown đơn giản trong workspace của agent**. Các tệp này là nguồn thông tin chính xác; mô hình chỉ "nhớ" những gì được ghi vào đĩa.

Công cụ tìm kiếm bộ nhớ được cung cấp bởi plugin bộ nhớ đang hoạt động (mặc định: `memory-core`). Vô hiệu hóa plugin bộ nhớ với `plugins.slots.memory = "none"`.

## Tệp bộ nhớ (Markdown)

Cấu trúc workspace mặc định sử dụng hai lớp bộ nhớ:

- `memory/YYYY-MM-DD.md`
  - Nhật ký hàng ngày (chỉ thêm vào).
  - Đọc hôm nay + hôm qua khi bắt đầu phiên.
- `MEMORY.md` (tùy chọn)
  - Bộ nhớ dài hạn được chọn lọc.
  - Nếu cả `MEMORY.md` và `memory.md` đều tồn tại ở gốc workspace, OpenClaw chỉ tải `MEMORY.md`.
  - `memory.md` viết thường chỉ được dùng khi `MEMORY.md` không có.
  - **Chỉ tải trong phiên chính, riêng tư** (không bao giờ trong ngữ cảnh nhóm).

Các tệp này nằm trong workspace (`agents.defaults.workspace`, mặc định `~/.openclaw/workspace`). Xem [Agent workspace](/concepts/agent-workspace) để biết cấu trúc đầy đủ.

## Công cụ bộ nhớ

OpenClaw cung cấp hai công cụ cho agent để làm việc với các tệp Markdown này:

- `memory_search` -- tìm kiếm ngữ nghĩa trên các đoạn đã được lập chỉ mục.
- `memory_get` -- đọc mục tiêu của một tệp/đoạn dòng Markdown cụ thể.

`memory_get` hiện **xử lý tốt khi tệp không tồn tại** (ví dụ, nhật ký hàng ngày của hôm nay trước khi có ghi đầu tiên). Cả trình quản lý tích hợp và backend QMD đều trả về `{ text: "", path }` thay vì ném lỗi `ENOENT`, giúp agent xử lý "chưa có gì được ghi lại" và tiếp tục quy trình làm việc mà không cần bọc lệnh gọi công cụ trong logic try/catch.

## Khi nào ghi bộ nhớ

- Quyết định, sở thích và thông tin bền vững nên ghi vào `MEMORY.md`.
- Ghi chú hàng ngày và ngữ cảnh đang chạy nên ghi vào `memory/YYYY-MM-DD.md`.
- Nếu ai đó nói "hãy nhớ điều này," hãy ghi lại (không giữ trong RAM).
- Khu vực này vẫn đang phát triển. Nên nhắc mô hình lưu trữ ký ức; nó sẽ biết phải làm gì.
- Nếu muốn điều gì đó được ghi nhớ, **yêu cầu bot ghi nó** vào bộ nhớ.

## Tự động xóa bộ nhớ (ping trước khi nén)

Khi một phiên **gần đến lúc tự động nén**, OpenClaw kích hoạt một **lượt im lặng, tự động** nhắc mô hình ghi bộ nhớ bền vững **trước khi** ngữ cảnh bị nén. Các lời nhắc mặc định nói rõ mô hình _có thể trả lời_, nhưng thường `NO_REPLY` là phản hồi đúng để người dùng không thấy lượt này.

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
          systemPrompt: "Phiên gần đến lúc nén. Lưu trữ ký ức bền vững ngay.",
          prompt: "Ghi bất kỳ ghi chú lâu dài nào vào memory/YYYY-MM-DD.md; trả lời với NO_REPLY nếu không có gì để lưu trữ.",
        },
      },
    },
  },
}
```

Chi tiết:

- **Ngưỡng mềm**: xóa kích hoạt khi ước tính token của phiên vượt qua `contextWindow - reserveTokensFloor - softThresholdTokens`.
- **Im lặng** theo mặc định: lời nhắc bao gồm `NO_REPLY` để không có gì được gửi đi.
- **Hai lời nhắc**: một lời nhắc người dùng cộng với một lời nhắc hệ thống thêm vào nhắc nhở.
- **Một lần xóa mỗi chu kỳ nén** (được theo dõi trong `sessions.json`).
- **Workspace phải có thể ghi**: nếu phiên chạy trong chế độ sandbox với `workspaceAccess: "ro"` hoặc `"none"`, xóa sẽ bị bỏ qua.

Để biết vòng đời nén đầy đủ, xem [Quản lý phiên + nén](/reference/session-management-compaction).

## Tìm kiếm bộ nhớ vector

OpenClaw có thể xây dựng một chỉ mục vector nhỏ trên `MEMORY.md` và `memory/*.md` để các truy vấn ngữ nghĩa có thể tìm thấy các ghi chú liên quan ngay cả khi cách diễn đạt khác nhau. Tìm kiếm kết hợp (BM25 + vector) có sẵn để kết hợp khớp ngữ nghĩa với tìm kiếm từ khóa chính xác.

Tìm kiếm bộ nhớ hỗ trợ nhiều nhà cung cấp embedding (OpenAI, Gemini, Voyage, Mistral, Ollama, và các mô hình GGUF cục bộ), một backend QMD tùy chọn cho việc truy xuất nâng cao, và các tính năng xử lý hậu kỳ như xếp hạng lại đa dạng MMR và suy giảm theo thời gian.

Để biết cấu hình đầy đủ -- bao gồm thiết lập nhà cung cấp embedding, backend QMD, điều chỉnh tìm kiếm kết hợp, bộ nhớ đa phương tiện, và tất cả các nút cấu hình -- xem [Tham khảo cấu hình bộ nhớ](/reference/memory-config).
