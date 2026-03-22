---
summary: "Tìm hiểu cách cấu hình streaming và chunking để tối ưu hóa phản hồi và xem trước kênh hiệu quả."
read_when:
  - Giải thích cách streaming hoặc chunking hoạt động trên các kênh
  - Thay đổi hành vi streaming theo khối hoặc chunking kênh
  - Gỡ lỗi phản hồi theo khối trùng lặp/sớm hoặc streaming xem trước kênh
title: "Hướng Dẫn Streaming và Chunking"
---

# Streaming + chunking

OpenClaw có hai lớp streaming riêng biệt:

- **Streaming theo khối (channels):** phát ra các **khối** hoàn chỉnh khi trợ lý viết. Đây là các tin nhắn kênh thông thường (không phải token deltas).
- **Streaming xem trước (Telegram/Discord/Slack):** cập nhật một **tin nhắn xem trước tạm thời** trong khi tạo.

Hiện tại **không có streaming token-delta thực sự** cho các tin nhắn kênh. Streaming xem trước dựa trên tin nhắn (gửi + chỉnh sửa/thêm).

## Streaming theo khối (tin nhắn kênh)

Streaming theo khối gửi đầu ra của trợ lý theo các phần lớn khi có sẵn.

```
Đầu ra mô hình
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker phát ra các khối khi bộ đệm tăng
       └─ (blockStreamingBreak=message_end)
            └─ chunker xả tại message_end
                   └─ kênh gửi (phản hồi theo khối)
```

Chú thích:

- `text_delta/events`: sự kiện luồng mô hình (có thể thưa thớt đối với các mô hình không streaming).
- `chunker`: `EmbeddedBlockChunker` áp dụng giới hạn min/max + ưu tiên ngắt.
- `channel send`: tin nhắn gửi đi thực tế (phản hồi theo khối).

**Điều khiển:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (mặc định tắt).
- Ghi đè kênh: `*.blockStreaming` (và các biến thể theo tài khoản) để buộc `"on"`/`"off"` cho mỗi kênh.
- `agents.defaults.blockStreamingBreak`: `"text_end"` hoặc `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (hợp nhất các khối đã streaming trước khi gửi).
- Giới hạn cứng của kênh: `*.textChunkLimit` (ví dụ: `channels.whatsapp.textChunkLimit`).
- Chế độ chunk của kênh: `*.chunkMode` (`length` mặc định, `newline` chia trên các dòng trống (ranh giới đoạn) trước khi chunk theo độ dài).
- Giới hạn mềm của Discord: `channels.discord.maxLinesPerMessage` (mặc định 17) chia các phản hồi cao để tránh cắt giao diện người dùng.

**Ngữ nghĩa ranh giới:**

- `text_end`: stream các khối ngay khi chunker phát ra; xả trên mỗi `text_end`.
- `message_end`: chờ đến khi tin nhắn trợ lý kết thúc, sau đó xả đầu ra đã đệm.

`message_end` vẫn sử dụng chunker nếu văn bản đã đệm vượt quá `maxChars`, vì vậy nó có thể phát ra nhiều khối ở cuối.

## Thuật toán Chunking (giới hạn thấp/cao)

Chunking theo khối được thực hiện bởi `EmbeddedBlockChunker`:

- **Giới hạn thấp:** không phát ra cho đến khi bộ đệm >= `minChars` (trừ khi bị buộc).
- **Giới hạn cao:** ưu tiên chia trước `maxChars`; nếu bị buộc, chia tại `maxChars`.
- **Ưu tiên ngắt:** `paragraph` → `newline` → `sentence` → `whitespace` → ngắt cứng.
- **Code fences:** không bao giờ chia bên trong fences; khi bị buộc tại `maxChars`, đóng + mở lại fence để giữ Markdown hợp lệ.

`maxChars` bị giới hạn bởi `textChunkLimit` của kênh, vì vậy bạn không thể vượt quá giới hạn của từng kênh.

## Hợp nhất (hợp nhất các khối đã streaming)

Khi streaming theo khối được bật, OpenClaw có thể **hợp nhất các khối liên tiếp**
trước khi gửi chúng ra ngoài. Điều này giảm thiểu “spam dòng đơn” trong khi vẫn cung cấp
đầu ra tiến bộ.

- Hợp nhất chờ **khoảng trống nhàn rỗi** (`idleMs`) trước khi xả.
- Bộ đệm bị giới hạn bởi `maxChars` và sẽ xả nếu vượt quá.
- `minChars` ngăn các mảnh nhỏ gửi đi cho đến khi đủ văn bản tích lũy
  (xả cuối cùng luôn gửi văn bản còn lại).
- Joiner được lấy từ `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → khoảng trắng).
- Ghi đè kênh có sẵn thông qua `*.blockStreamingCoalesce` (bao gồm cấu hình theo tài khoản).
- Mặc định hợp nhất `minChars` được tăng lên 1500 cho Signal/Slack/Discord trừ khi bị ghi đè.

## Tốc độ giống con người giữa các khối

Khi streaming theo khối được bật, bạn có thể thêm một **khoảng dừng ngẫu nhiên** giữa
các phản hồi theo khối (sau khối đầu tiên). Điều này làm cho các phản hồi nhiều bong bóng cảm thấy
tự nhiên hơn.

- Cấu hình: `agents.defaults.humanDelay` (ghi đè theo agent thông qua `agents.list[].humanDelay`).
- Chế độ: `off` (mặc định), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Áp dụng chỉ cho **phản hồi theo khối**, không phải phản hồi cuối cùng hoặc tóm tắt công cụ.

## "Stream chunks hoặc tất cả"

Điều này ánh xạ đến:

- **Stream chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (phát ra khi bạn đi). Các kênh không phải Telegram cũng cần `*.blockStreaming: true`.
- **Stream tất cả khi kết thúc:** `blockStreamingBreak: "message_end"` (xả một lần, có thể nhiều khối nếu rất dài).
- **Không streaming theo khối:** `blockStreamingDefault: "off"` (chỉ phản hồi cuối cùng).

**Lưu ý kênh:** Streaming theo khối **tắt trừ khi**
`*.blockStreaming` được đặt rõ ràng thành `true`. Các kênh có thể stream một bản xem trước trực tiếp
(`channels.<channel>.streaming`) mà không cần phản hồi theo khối.

Nhắc nhở vị trí cấu hình: các mặc định `blockStreaming*` nằm dưới
`agents.defaults`, không phải cấu hình gốc.

## Chế độ streaming xem trước

Khóa chuẩn: `channels.<channel>.streaming`

Chế độ:

- `off`: tắt streaming xem trước.
- `partial`: một bản xem trước duy nhất được thay thế bằng văn bản mới nhất.
- `block`: bản xem trước cập nhật theo từng bước chunked/thêm.
- `progress`: bản xem trước tiến độ/trạng thái trong quá trình tạo, câu trả lời cuối cùng khi hoàn thành.

### Ánh xạ kênh

| Kênh     | `off` | `partial` | `block` | `progress`        |
| -------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | ánh xạ đến `partial` |
| Discord  | ✅    | ✅        | ✅      | ánh xạ đến `partial` |
| Slack    | ✅    | ✅        | ✅      | ✅                |

Chỉ Slack:

- `channels.slack.nativeStreaming` chuyển đổi các cuộc gọi API streaming gốc của Slack khi `streaming=partial` (mặc định: `true`).

Di chuyển khóa cũ:

- Telegram: `streamMode` + boolean `streaming` tự động di chuyển sang enum `streaming`.
- Discord: `streamMode` + boolean `streaming` tự động di chuyển sang enum `streaming`.
- Slack: `streamMode` tự động di chuyển sang enum `streaming`; boolean `streaming` tự động di chuyển sang `nativeStreaming`.

### Hành vi thời gian chạy

Telegram:

- Sử dụng `sendMessage` + `editMessageText` để cập nhật xem trước trên DMs và nhóm/chủ đề.
- Streaming xem trước bị bỏ qua khi streaming theo khối của Telegram được bật rõ ràng (để tránh streaming kép).
- `/reasoning stream` có thể viết lý luận vào xem trước.

Discord:

- Sử dụng gửi + chỉnh sửa tin nhắn xem trước.
- Chế độ `block` sử dụng chunking nháp (`draftChunk`).
- Streaming xem trước bị bỏ qua khi streaming theo khối của Discord được bật rõ ràng.

Slack:

- `partial` có thể sử dụng streaming gốc của Slack (`chat.startStream`/`append`/`stop`) khi có sẵn.
- `block` sử dụng các bản xem trước nháp kiểu thêm.
- `progress` sử dụng văn bản xem trước trạng thái, sau đó là câu trả lời cuối cùng.
