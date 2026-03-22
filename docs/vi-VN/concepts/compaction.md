---
summary: "Cửa sổ ngữ cảnh và nén: cách OpenClaw giữ phiên trong giới hạn của mô hình"
read_when:
  - Bạn muốn hiểu về tự động nén và /compact
  - Bạn đang gỡ lỗi các phiên dài vượt quá giới hạn ngữ cảnh
title: "Nén"
---

# Cửa sổ Ngữ cảnh & Nén

Mỗi mô hình có một **cửa sổ ngữ cảnh** (số lượng token tối đa mà nó có thể xử lý). Các cuộc trò chuyện dài sẽ tích lũy tin nhắn và kết quả công cụ; khi cửa sổ trở nên chật chội, OpenClaw sẽ **nén** lịch sử cũ hơn để duy trì trong giới hạn.

## Nén là gì

Nén **tóm tắt cuộc trò chuyện cũ** thành một mục tóm tắt ngắn gọn và giữ nguyên các tin nhắn gần đây. Tóm tắt này được lưu trong lịch sử phiên, để các yêu cầu trong tương lai sử dụng:

- Tóm tắt nén
- Các tin nhắn gần đây sau điểm nén

Nén **duy trì** trong lịch sử JSONL của phiên.

## Cấu hình

Sử dụng cài đặt `agents.defaults.compaction` trong `openclaw.json` để cấu hình hành vi nén (chế độ, số lượng token mục tiêu, v.v.). Tóm tắt nén mặc định giữ nguyên các định danh không rõ (`identifierPolicy: "strict"`). Bạn có thể thay đổi điều này với `identifierPolicy: "off"` hoặc cung cấp văn bản tùy chỉnh với `identifierPolicy: "custom"` và `identifierInstructions`.

Bạn có thể chỉ định một mô hình khác cho tóm tắt nén thông qua `agents.defaults.compaction.model`. Điều này hữu ích khi mô hình chính của bạn là mô hình cục bộ hoặc nhỏ và bạn muốn tóm tắt nén được tạo ra bởi một mô hình mạnh mẽ hơn. Việc ghi đè chấp nhận bất kỳ chuỗi `provider/model-id` nào:

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

Điều này cũng hoạt động với các mô hình cục bộ, ví dụ như một mô hình Ollama thứ hai dành riêng cho tóm tắt hoặc một chuyên gia nén được tinh chỉnh:

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

Khi không được thiết lập, nén sử dụng mô hình chính của agent.

## Tự động nén (mặc định bật)

Khi một phiên gần hoặc vượt quá cửa sổ ngữ cảnh của mô hình, OpenClaw kích hoạt tự động nén và có thể thử lại yêu cầu gốc bằng ngữ cảnh đã nén.

Bạn sẽ thấy:

- `🧹 Auto-compaction complete` trong chế độ chi tiết
- `/status` hiển thị `🧹 Compactions: <count>`

Trước khi nén, OpenClaw có thể thực hiện một lượt **xóa bộ nhớ im lặng** để lưu các ghi chú bền vững vào đĩa. Xem [Memory](/concepts/memory) để biết chi tiết và cấu hình.

## Nén thủ công

Sử dụng `/compact` (có thể kèm theo hướng dẫn) để buộc thực hiện một lượt nén:

```
/compact Tập trung vào các quyết định và câu hỏi mở
```

## Nguồn cửa sổ ngữ cảnh

Cửa sổ ngữ cảnh là đặc thù của mô hình. OpenClaw sử dụng định nghĩa mô hình từ danh mục nhà cung cấp đã cấu hình để xác định giới hạn.

## Nén so với cắt tỉa

- **Nén**: tóm tắt và **duy trì** trong JSONL.
- **Cắt tỉa phiên**: chỉ cắt tỉa các **kết quả công cụ** cũ, **trong bộ nhớ**, theo từng yêu cầu.

Xem [/concepts/session-pruning](/concepts/session-pruning) để biết chi tiết về cắt tỉa.

## Nén phía máy chủ OpenAI

OpenClaw cũng hỗ trợ gợi ý nén phía máy chủ OpenAI Responses cho các mô hình OpenAI trực tiếp tương thích. Điều này tách biệt với nén cục bộ OpenClaw và có thể chạy song song.

- Nén cục bộ: OpenClaw tóm tắt và duy trì vào JSONL của phiên.
- Nén phía máy chủ: OpenAI nén ngữ cảnh phía nhà cung cấp khi `store` + `context_management` được bật.

Xem [OpenAI provider](/providers/openai) để biết tham số mô hình và ghi đè.

## Động cơ ngữ cảnh tùy chỉnh

Hành vi nén được quản lý bởi [động cơ ngữ cảnh](/concepts/context-engine) đang hoạt động. Động cơ cũ sử dụng tóm tắt tích hợp như đã mô tả ở trên. Các động cơ plugin (được chọn thông qua `plugins.slots.contextEngine`) có thể triển khai bất kỳ chiến lược nén nào — tóm tắt DAG, truy xuất vector, ngưng tụ gia tăng, v.v.

Khi một động cơ plugin đặt `ownsCompaction: true`, OpenClaw ủy quyền tất cả các quyết định nén cho động cơ và không chạy tự động nén tích hợp.

Khi `ownsCompaction` là `false` hoặc không được thiết lập, OpenClaw vẫn có thể sử dụng tự động nén trong nỗ lực của Pi, nhưng phương thức `compact()` của động cơ đang hoạt động vẫn xử lý `/compact` và phục hồi tràn. Không có sự quay lại tự động cho đường dẫn nén của động cơ cũ.

Nếu bạn đang xây dựng một động cơ ngữ cảnh không sở hữu, hãy triển khai `compact()` bằng cách gọi `delegateCompactionToRuntime(...)` từ `openclaw/plugin-sdk/core`.

## Mẹo

- Sử dụng `/compact` khi các phiên cảm thấy cũ kỹ hoặc ngữ cảnh bị phình to.
- Các đầu ra công cụ lớn đã bị cắt ngắn; cắt tỉa có thể giảm thêm sự tích tụ kết quả công cụ.
- Nếu cần một khởi đầu mới, `/new` hoặc `/reset` sẽ bắt đầu một ID phiên mới.
