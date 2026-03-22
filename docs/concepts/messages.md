---
summary: "Khám phá cách quản lý luồng tin nhắn, phiên làm việc và hàng đợi hiệu quả trong OpenClaw. Tối ưu hóa khả năng hiển thị và xử lý."
read_when:
  - Giải thích cách tin nhắn đến trở thành phản hồi
  - Làm rõ về phiên làm việc, chế độ hàng đợi hoặc hành vi streaming
  - Tài liệu về khả năng hiển thị lý do và tác động sử dụng
title: "Hướng Dẫn Quản Lý Tin Nhắn Trong OpenClaw"
---

# Tin nhắn

Trang này giải thích cách OpenClaw xử lý tin nhắn đến, phiên làm việc, hàng đợi, streaming và khả năng hiển thị lý do.

## Luồng tin nhắn (cấp cao)

```
Tin nhắn đến
  -> định tuyến/ràng buộc -> khóa phiên
  -> hàng đợi (nếu một phiên đang hoạt động)
  -> chạy tác nhân (streaming + công cụ)
  -> phản hồi ra ngoài (giới hạn kênh + chia nhỏ)
```

Các thiết lập quan trọng nằm trong cấu hình:

- `messages.*` cho tiền tố, hàng đợi và hành vi nhóm.
- `agents.defaults.*` cho mặc định streaming và chia nhỏ.
- Ghi đè kênh (`channels.whatsapp.*`, `channels.telegram.*`, v.v.) cho giới hạn và chuyển đổi streaming.

Xem [Cấu hình](/gateway/configuration) để biết đầy đủ cấu trúc.

## Loại bỏ trùng lặp tin nhắn đến

Các kênh có thể gửi lại cùng một tin nhắn sau khi kết nối lại. OpenClaw giữ một bộ nhớ đệm ngắn hạn dựa trên khóa kênh/tài khoản/người gửi/phiên/tin nhắn để tránh kích hoạt lại phiên tác nhân.

## Giảm nhiễu tin nhắn đến

Các tin nhắn liên tiếp nhanh từ **cùng một người gửi** có thể được gộp thành một lượt tác nhân thông qua `messages.inbound`. Giảm nhiễu được áp dụng theo từng kênh + cuộc trò chuyện và sử dụng tin nhắn gần nhất để luồng phản hồi/ID.

Cấu hình (mặc định toàn cầu + ghi đè theo kênh):

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

- Giảm nhiễu chỉ áp dụng cho tin nhắn **chỉ văn bản**; phương tiện/tệp đính kèm sẽ được xử lý ngay lập tức.
- Các lệnh điều khiển bỏ qua giảm nhiễu để giữ nguyên độc lập.

## Phiên làm việc và thiết bị

Phiên làm việc được quản lý bởi gateway, không phải bởi khách hàng.

- Các cuộc trò chuyện trực tiếp gộp vào khóa phiên chính của tác nhân.
- Nhóm/kênh có khóa phiên riêng.
- Lưu trữ phiên và bản ghi nằm trên máy chủ gateway.

Nhiều thiết bị/kênh có thể ánh xạ đến cùng một phiên, nhưng lịch sử không được đồng bộ hoàn toàn trở lại mọi khách hàng. Khuyến nghị: sử dụng một thiết bị chính cho các cuộc trò chuyện dài để tránh ngữ cảnh bị phân tán. Giao diện điều khiển và TUI luôn hiển thị bản ghi phiên từ gateway, vì vậy chúng là nguồn thông tin chính xác.

Chi tiết: [Quản lý phiên](/concepts/session).

## Nội dung tin nhắn đến và ngữ cảnh lịch sử

OpenClaw tách biệt **nội dung nhắc nhở** khỏi **nội dung lệnh**:

- `Body`: văn bản nhắc nhở gửi đến tác nhân. Có thể bao gồm phong bì kênh và các gói lịch sử tùy chọn.
- `CommandBody`: văn bản người dùng thô để phân tích chỉ thị/lệnh.
- `RawBody`: bí danh cũ cho `CommandBody` (giữ để tương thích).

Khi một kênh cung cấp lịch sử, nó sử dụng một gói chung:

- `[Tin nhắn trò chuyện từ lần trả lời cuối của bạn - để tham khảo]`
- `[Tin nhắn hiện tại - trả lời tin này]`

Đối với **trò chuyện không trực tiếp** (nhóm/kênh/phòng), **nội dung tin nhắn hiện tại** được thêm tiền tố nhãn người gửi (cùng kiểu với các mục lịch sử). Điều này giữ cho tin nhắn thời gian thực và hàng đợi/lịch sử nhất quán trong nhắc nhở tác nhân.

Bộ đệm lịch sử chỉ bao gồm các tin nhắn nhóm không kích hoạt một phiên (ví dụ, tin nhắn bị chặn bởi điều kiện nhắc nhở) và **không bao gồm** các tin nhắn đã có trong bản ghi phiên.

Chỉ việc loại bỏ chỉ thị chỉ áp dụng cho phần **tin nhắn hiện tại** để lịch sử vẫn nguyên vẹn. Các kênh gói lịch sử nên đặt `CommandBody` (hoặc `RawBody`) thành văn bản tin nhắn gốc và giữ `Body` là nhắc nhở kết hợp. Bộ đệm lịch sử có thể cấu hình qua `messages.groupChat.historyLimit` (mặc định toàn cầu) và ghi đè theo kênh như `channels.slack.historyLimit` hoặc `channels.telegram.accounts.<id>.historyLimit` (đặt `0` để vô hiệu hóa).

## Hàng đợi và theo dõi

Nếu một phiên đã hoạt động, tin nhắn đến có thể được xếp hàng, điều hướng vào phiên hiện tại hoặc thu thập cho một lượt theo dõi.

- Cấu hình qua `messages.queue` (và `messages.queue.byChannel`).
- Các chế độ: `interrupt`, `steer`, `followup`, `collect`, cùng các biến thể tồn đọng.

Chi tiết: [Hàng đợi](/concepts/queue).

## Streaming, chia nhỏ và gộp

Streaming khối gửi các phản hồi từng phần khi mô hình tạo ra các khối văn bản. Chia nhỏ tôn trọng giới hạn văn bản của kênh và tránh chia nhỏ mã được bao quanh.

Các thiết lập chính:

- `agents.defaults.blockStreamingDefault` (`on|off`, mặc định tắt)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (gộp dựa trên thời gian nhàn rỗi)
- `agents.defaults.humanDelay` (tạm dừng giống con người giữa các phản hồi khối)
- Ghi đè kênh: `*.blockStreaming` và `*.blockStreamingCoalesce` (các kênh không phải Telegram yêu cầu `*.blockStreaming: true` rõ ràng)

Chi tiết: [Streaming + chia nhỏ](/concepts/streaming).

## Khả năng hiển thị lý do và token

OpenClaw có thể hiển thị hoặc ẩn lý do của mô hình:

- `/reasoning on|off|stream` kiểm soát khả năng hiển thị.
- Nội dung lý do vẫn tính vào việc sử dụng token khi được mô hình tạo ra.
- Telegram hỗ trợ luồng lý do vào bong bóng nháp.

Chi tiết: [Chỉ thị suy nghĩ + lý do](/tools/thinking) và [Sử dụng token](/reference/token-use).

## Tiền tố, luồng và phản hồi

Định dạng tin nhắn ra ngoài được tập trung trong `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, và `channels.<channel>.accounts.<id>.responsePrefix` (chuỗi tiền tố ra ngoài), cùng với `channels.whatsapp.messagePrefix` (tiền tố vào WhatsApp)
- Luồng phản hồi qua `replyToMode` và mặc định theo kênh

Chi tiết: [Cấu hình](/gateway/configuration-reference#messages) và tài liệu kênh.
