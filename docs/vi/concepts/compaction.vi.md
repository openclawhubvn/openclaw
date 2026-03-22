# Context Window & Compaction

Mỗi model có một **context window** (số token tối đa có thể xử lý). Chat lâu dài sẽ tích lũy nhiều tin nhắn và kết quả công cụ; khi gần chạm ngưỡng, OpenClaw sẽ **nén** lịch sử cũ để giữ trong giới hạn.

## Compaction là gì

Compaction **tóm tắt cuộc trò chuyện cũ** thành một mục tóm tắt và giữ nguyên các tin nhắn gần đây. Tóm tắt này lưu trong lịch sử session, để các yêu cầu sau dùng:

- Tóm tắt compaction
- Tin nhắn gần đây sau điểm compaction

Compaction **lưu trữ** trong lịch sử JSONL của session.

## Cấu hình

Dùng `agents.defaults.compaction` trong `openclaw.json` để cấu hình compaction (chế độ, số token mục tiêu, v.v.). Mặc định, compaction giữ nguyên các định danh không rõ ràng (`identifierPolicy: "strict"`). Có thể thay đổi với `identifierPolicy: "off"` hoặc cung cấp văn bản tùy chỉnh với `identifierPolicy: "custom"` và `identifierInstructions`.

Có thể chỉ định model khác cho compaction qua `agents.defaults.compaction.model`. Hữu ích khi model chính là local hoặc nhỏ và muốn tóm tắt bằng model mạnh hơn. Override chấp nhận chuỗi `provider/model-id`:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Cũng hoạt động với model local, ví dụ model Ollama thứ hai chuyên tóm tắt hoặc compaction tinh chỉnh:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Nếu không đặt, compaction dùng model chính của agent.

## Auto-compaction (mặc định bật)

Khi session gần hoặc vượt quá context window của model, OpenClaw kích hoạt auto-compaction và có thể thử lại yêu cầu gốc với context đã nén.

Sẽ thấy:

- `🧹 Auto-compaction complete` ở chế độ verbose
- `/status` hiển thị `🧹 Compactions: <count>`

Trước compaction, OpenClaw có thể chạy **silent memory flush** để lưu ghi chú bền vững vào đĩa. Xem [Memory](/concepts/memory) để biết chi tiết và cấu hình.

## Manual compaction

Dùng `/compact` (có thể kèm hướng dẫn) để ép compaction:

```
/compact Focus on decisions and open questions
```

## Nguồn context window

Context window phụ thuộc vào model. OpenClaw dùng định nghĩa model từ catalog provider để xác định giới hạn.

## Compaction vs pruning

- **Compaction**: tóm tắt và **lưu trữ** trong JSONL.
- **Session pruning**: chỉ cắt bớt **kết quả công cụ** cũ, **trong bộ nhớ**, theo yêu cầu.

Xem [/concepts/session-pruning](/concepts/session-pruning) để biết chi tiết pruning.

## OpenAI server-side compaction

OpenClaw cũng hỗ trợ gợi ý compaction server-side của OpenAI cho các model OpenAI trực tiếp tương thích. Điều này tách biệt với compaction local của OpenClaw và có thể chạy song song.

- Compaction local: OpenClaw tóm tắt và lưu trữ vào JSONL session.
- Compaction server-side: OpenAI nén context phía provider khi `store` + `context_management` được bật.

Xem [OpenAI provider](/providers/openai) để biết tham số model và override.

## Custom context engines

Hành vi compaction thuộc về [context engine](/concepts/context-engine) đang hoạt động. Engine cũ dùng tóm tắt tích hợp như trên. Plugin engine (chọn qua `plugins.slots.contextEngine`) có thể triển khai bất kỳ chiến lược compaction nào — tóm tắt DAG, truy xuất vector, ngưng tụ dần, v.v.

Khi plugin engine đặt `ownsCompaction: true`, OpenClaw giao tất cả quyết định compaction cho engine và không chạy auto-compaction tích hợp.

Khi `ownsCompaction` là `false` hoặc không đặt, OpenClaw vẫn có thể dùng auto-compaction tích hợp của Pi, nhưng phương thức `compact()` của engine đang hoạt động vẫn xử lý `/compact` và phục hồi tràn. Không có fallback tự động về đường compaction của engine cũ.

Nếu xây dựng context engine không sở hữu, triển khai `compact()` bằng cách gọi `delegateCompactionToRuntime(...)` từ `openclaw/plugin-sdk/core`.

## Tips

- Dùng `/compact` khi session cảm thấy cũ hoặc context bị phình.
- Kết quả công cụ lớn đã bị cắt ngắn; pruning có thể giảm thêm tích tụ kết quả công cụ.
- Nếu cần bắt đầu lại, `/new` hoặc `/reset` khởi tạo session id mới.\n