# Streaming và Chunking

OpenClaw có hai lớp streaming riêng biệt:

- **Block streaming (channels):** phát các **blocks** hoàn chỉnh khi assistant viết. Đây là các tin nhắn channel bình thường (không phải token deltas).
- **Preview streaming (Telegram/Discord/Slack):** cập nhật **preview message** tạm thời trong khi tạo nội dung.

Hiện tại **không có streaming token-delta thực sự** cho tin nhắn channel. Preview streaming dựa trên tin nhắn (gửi + chỉnh sửa/thêm).

## Block streaming (tin nhắn channel)

Block streaming gửi output của assistant theo từng phần lớn khi có sẵn.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker phát blocks khi buffer lớn dần
       └─ (blockStreamingBreak=message_end)
            └─ chunker flush tại message_end
                   └─ channel send (block replies)
```

Giải thích:

- `text_delta/events`: sự kiện stream của model (có thể thưa thớt với model không streaming).
- `chunker`: `EmbeddedBlockChunker` áp dụng giới hạn min/max + ưu tiên break.
- `channel send`: tin nhắn outbound thực tế (block replies).

**Điều khiển:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (mặc định off).
- Channel overrides: `*.blockStreaming` (và các biến thể per-account) để ép `"on"`/`"off"` cho từng channel.
- `agents.defaults.blockStreamingBreak`: `"text_end"` hoặc `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gộp các blocks stream trước khi gửi).
- Giới hạn cứng của channel: `*.textChunkLimit` (ví dụ: `channels.whatsapp.textChunkLimit`).
- Chế độ chunk của channel: `*.chunkMode` (`length` mặc định, `newline` tách theo dòng trống trước khi chunk theo độ dài).
- Giới hạn mềm của Discord: `channels.discord.maxLinesPerMessage` (mặc định 17) tách replies cao để tránh UI clipping.

**Ngữ nghĩa ranh giới:**

- `text_end`: stream blocks ngay khi chunker phát; flush trên mỗi `text_end`.
- `message_end`: đợi đến khi tin nhắn assistant kết thúc, sau đó flush output đã buffer.

`message_end` vẫn dùng chunker nếu text đã buffer vượt `maxChars`, nên có thể phát nhiều chunks ở cuối.

## Thuật toán Chunking (giới hạn thấp/cao)

Block chunking được thực hiện bởi `EmbeddedBlockChunker`:

- **Giới hạn thấp:** không phát cho đến khi buffer >= `minChars` (trừ khi bị ép).
- **Giới hạn cao:** ưu tiên tách trước `maxChars`; nếu bị ép, tách tại `maxChars`.
- **Ưu tiên break:** `paragraph` → `newline` → `sentence` → `whitespace` → hard break.
- **Code fences:** không bao giờ tách trong fences; khi bị ép tại `maxChars`, đóng + mở lại fence để giữ Markdown hợp lệ.

`maxChars` bị giới hạn bởi `textChunkLimit` của channel, nên không thể vượt quá giới hạn của từng channel.

## Coalescing (gộp các blocks stream)

Khi block streaming được bật, OpenClaw có thể **gộp các block chunks liên tiếp** trước khi gửi. Điều này giảm "spam dòng đơn" trong khi vẫn cung cấp output tiến bộ.

- Coalescing đợi **khoảng trống idle** (`idleMs`) trước khi flush.
- Buffers bị giới hạn bởi `maxChars` và sẽ flush nếu vượt quá.
- `minChars` ngăn các mảnh nhỏ gửi đi cho đến khi đủ text tích lũy (flush cuối luôn gửi text còn lại).
- Joiner được lấy từ `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → space).
- Channel overrides có sẵn qua `*.blockStreamingCoalesce` (bao gồm cấu hình per-account).
- Coalesce `minChars` mặc định được tăng lên 1500 cho Signal/Slack/Discord trừ khi bị ghi đè.

## Tốc độ giống con người giữa các blocks

Khi block streaming được bật, có thể thêm **pause ngẫu nhiên** giữa các block replies (sau block đầu tiên). Điều này làm cho phản hồi nhiều bubble cảm giác tự nhiên hơn.

- Cấu hình: `agents.defaults.humanDelay` (ghi đè per agent qua `agents.list[].humanDelay`).
- Chế độ: `off` (mặc định), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Áp dụng chỉ cho **block replies**, không phải final replies hay tool summaries.

## "Stream chunks hoặc tất cả"

Điều này ánh xạ tới:

- **Stream chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (phát khi có). Các channel không phải Telegram cũng cần `*.blockStreaming: true`.
- **Stream tất cả ở cuối:** `blockStreamingBreak: "message_end"` (flush một lần, có thể nhiều chunks nếu rất dài).
- **Không block streaming:** `blockStreamingDefault: "off"` (chỉ final reply).

**Lưu ý channel:** Block streaming **tắt trừ khi** `*.blockStreaming` được đặt rõ ràng là `true`. Channels có thể stream preview trực tiếp (`channels.<channel>.streaming`) mà không cần block replies.

Nhắc nhở vị trí config: các mặc định `blockStreaming*` nằm dưới `agents.defaults`, không phải root config.

## Chế độ Preview streaming

Khóa chuẩn: `channels.<channel>.streaming`

Chế độ:

- `off`: tắt preview streaming.
- `partial`: một preview duy nhất được thay thế bằng text mới nhất.
- `block`: preview cập nhật theo từng bước chunked/appended.
- `progress`: preview tiến độ/trạng thái trong quá trình tạo, câu trả lời cuối cùng khi hoàn thành.

### Mapping channel

| Channel  | `off` | `partial` | `block` | `progress`        |
| -------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | maps to `partial` |
| Discord  | ✅    | ✅        | ✅      | maps to `partial` |
| Slack    | ✅    | ✅        | ✅      | ✅                |

Chỉ Slack:

- `channels.slack.nativeStreaming` bật/tắt các cuộc gọi API streaming gốc của Slack khi `streaming=partial` (mặc định: `true`).

Di chuyển khóa cũ:

- Telegram: `streamMode` + boolean `streaming` tự động di chuyển sang enum `streaming`.
- Discord: `streamMode` + boolean `streaming` tự động di chuyển sang enum `streaming`.
- Slack: `streamMode` tự động di chuyển sang enum `streaming`; boolean `streaming` tự động di chuyển sang `nativeStreaming`.

### Hành vi runtime

Telegram:

- Sử dụng `sendMessage` + `editMessageText` để cập nhật preview qua DMs và group/topics.
- Preview streaming bị bỏ qua khi block streaming của Telegram được bật rõ ràng (để tránh double-streaming).
- `/reasoning stream` có thể ghi reasoning vào preview.

Discord:

- Sử dụng send + edit preview messages.
- Chế độ `block` sử dụng draft chunking (`draftChunk`).
- Preview streaming bị bỏ qua khi block streaming của Discord được bật rõ ràng.

Slack:

- `partial` có thể sử dụng Slack native streaming (`chat.startStream`/`append`/`stop`) khi có sẵn.
- `block` sử dụng append-style draft previews.
- `progress` sử dụng status preview text, sau đó là câu trả lời cuối cùng.\n