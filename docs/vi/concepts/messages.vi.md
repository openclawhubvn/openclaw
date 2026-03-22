# Messages

Trang này giải thích cách OpenClaw xử lý tin nhắn đến, session, queueing, streaming và reasoning visibility.

## Luồng tin nhắn (tổng quan)

```
Tin nhắn đến
  -> routing/bindings -> session key
  -> queue (nếu đang chạy)
  -> agent run (streaming + tools)
  -> phản hồi ra ngoài (giới hạn kênh + chunking)
```

Các cấu hình quan trọng:

- `messages.*` cho prefix, queueing và hành vi nhóm.
- `agents.defaults.*` cho block streaming và chunking mặc định.
- Channel overrides (`channels.whatsapp.*`, `channels.telegram.*`, v.v.) cho giới hạn và bật/tắt streaming.

Xem [Configuration](/gateway/configuration) để biết đầy đủ schema.

## Inbound dedupe

Kênh có thể gửi lại cùng một tin nhắn sau khi kết nối lại. OpenClaw giữ cache ngắn hạn theo channel/account/peer/session/message id để tránh chạy lại agent khi nhận trùng.

## Inbound debouncing

Tin nhắn liên tiếp nhanh từ **cùng người gửi** có thể gộp thành một lượt agent qua `messages.inbound`. Debouncing áp dụng theo từng channel + cuộc trò chuyện và dùng tin nhắn mới nhất cho threading/IDs.

Cấu hình (mặc định toàn cầu + override theo channel):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Lưu ý:

- Debounce chỉ áp dụng cho tin nhắn **chỉ văn bản**; media/attachments xử lý ngay.
- Lệnh điều khiển không bị debouncing, luôn độc lập.

## Sessions và thiết bị

Sessions thuộc về gateway, không phải client.

- Chat trực tiếp gộp vào session key chính của agent.
- Nhóm/kênh có session key riêng.
- Session store và transcripts nằm trên gateway host.

Nhiều thiết bị/kênh có thể map vào cùng session, nhưng lịch sử không đồng bộ hoàn toàn về mọi client. Khuyến nghị: dùng một thiết bị chính cho cuộc trò chuyện dài để tránh ngữ cảnh bị lệch. Control UI và TUI luôn hiển thị transcript session từ gateway, là nguồn chính xác nhất.

Chi tiết: [Session management](/concepts/session).

## Inbound bodies và history context

OpenClaw tách biệt **prompt body** và **command body**:

- `Body`: văn bản prompt gửi đến agent. Có thể bao gồm channel envelopes và history wrappers tùy chọn.
- `CommandBody`: văn bản người dùng thô để phân tích directive/command.
- `RawBody`: alias cũ cho `CommandBody` (giữ để tương thích).

Khi kênh cung cấp lịch sử, dùng wrapper chung:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Với **non-direct chats** (nhóm/kênh/phòng), **current message body** được thêm nhãn người gửi (cùng kiểu với history entries). Điều này giữ cho tin nhắn real-time và queued/history nhất quán trong agent prompt.

History buffers là **pending-only**: bao gồm tin nhắn nhóm không kích hoạt run (ví dụ, tin nhắn chỉ định danh) và **loại trừ** tin nhắn đã có trong session transcript.

Directive stripping chỉ áp dụng cho phần **current message** để giữ nguyên lịch sử. Kênh wrap history nên đặt `CommandBody` (hoặc `RawBody`) là văn bản gốc và giữ `Body` là prompt kết hợp. History buffers có thể cấu hình qua `messages.groupChat.historyLimit` (mặc định toàn cầu) và override theo channel như `channels.slack.historyLimit` hoặc `channels.telegram.accounts.<id>.historyLimit` (đặt `0` để tắt).

## Queueing và followups

Nếu đang có run, tin nhắn đến có thể được queue, điều hướng vào run hiện tại, hoặc thu thập cho lượt tiếp theo.

- Cấu hình qua `messages.queue` (và `messages.queue.byChannel`).
- Các chế độ: `interrupt`, `steer`, `followup`, `collect`, và các biến thể backlog.

Chi tiết: [Queueing](/concepts/queue).

## Streaming, chunking và batching

Block streaming gửi phản hồi từng phần khi model tạo ra text blocks. Chunking tôn trọng giới hạn văn bản kênh và tránh chia nhỏ code block.

Cài đặt chính:

- `agents.defaults.blockStreamingDefault` (`on|off`, mặc định off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching dựa trên idle)
- `agents.defaults.humanDelay` (tạm dừng giống con người giữa các block replies)
- Channel overrides: `*.blockStreaming` và `*.blockStreamingCoalesce` (các kênh không phải Telegram cần `*.blockStreaming: true`)

Chi tiết: [Streaming + chunking](/concepts/streaming).

## Reasoning visibility và tokens

OpenClaw có thể hiển thị hoặc ẩn reasoning của model:

- `/reasoning on|off|stream` điều khiển visibility.
- Nội dung reasoning vẫn tính vào token usage khi model tạo ra.
- Telegram hỗ trợ reasoning stream vào draft bubble.

Chi tiết: [Thinking + reasoning directives](/tools/thinking) và [Token use](/reference/token-use).

## Prefixes, threading và replies

Định dạng tin nhắn outbound tập trung trong `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, và `channels.<channel>.accounts.<id>.responsePrefix` (outbound prefix cascade), cùng `channels.whatsapp.messagePrefix` (WhatsApp inbound prefix)
- Reply threading qua `replyToMode` và mặc định theo channel

Chi tiết: [Configuration](/gateway/configuration-reference#messages) và tài liệu kênh.\n