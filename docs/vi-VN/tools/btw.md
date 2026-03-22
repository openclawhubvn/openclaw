---
summary: "Câu hỏi phụ tạm thời với /btw"
read_when:
  - Bạn muốn hỏi một câu hỏi phụ nhanh về phiên hiện tại
  - Bạn đang triển khai hoặc gỡ lỗi hành vi BTW trên các client
title: "Câu hỏi phụ BTW"
---

# Câu hỏi phụ BTW

`/btw` cho phép bạn đặt một câu hỏi phụ nhanh về **phiên hiện tại** mà không biến câu hỏi đó thành lịch sử hội thoại thông thường.

Nó được mô phỏng theo hành vi `/btw` của Claude Code, nhưng đã được điều chỉnh để phù hợp với Gateway và kiến trúc đa kênh của OpenClaw.

## Chức năng

Khi bạn gửi:

```text
/btw what changed?
```

OpenClaw sẽ:

1. chụp nhanh ngữ cảnh phiên hiện tại,
2. thực hiện một cuộc gọi mô hình riêng **không dùng công cụ**,
3. chỉ trả lời câu hỏi phụ,
4. giữ nguyên tiến trình chính,
5. **không** ghi câu hỏi hoặc câu trả lời BTW vào lịch sử phiên,
6. phát ra câu trả lời như một **kết quả phụ trực tiếp** thay vì một tin nhắn trợ lý thông thường.

Mô hình tư duy quan trọng là:

- cùng ngữ cảnh phiên
- truy vấn phụ một lần riêng biệt
- không gọi công cụ
- không làm ô nhiễm ngữ cảnh tương lai
- không lưu trữ bản ghi

## Những gì nó không làm

`/btw` **không**:

- tạo một phiên bền vững mới,
- tiếp tục nhiệm vụ chính chưa hoàn thành,
- chạy công cụ hoặc vòng lặp công cụ đại lý,
- ghi dữ liệu câu hỏi/đáp BTW vào lịch sử bản ghi,
- xuất hiện trong `chat.history`,
- tồn tại sau khi tải lại.

Nó được thiết kế để **tạm thời**.

## Cách hoạt động của ngữ cảnh

BTW sử dụng phiên hiện tại như **ngữ cảnh nền**.

Nếu tiến trình chính đang hoạt động, OpenClaw chụp nhanh trạng thái tin nhắn hiện tại và bao gồm lời nhắc chính đang xử lý như ngữ cảnh nền, đồng thời nói rõ với mô hình:

- chỉ trả lời câu hỏi phụ,
- không tiếp tục hoặc hoàn thành nhiệm vụ chính chưa hoàn thành,
- không phát ra các cuộc gọi công cụ hoặc các cuộc gọi công cụ giả.

Điều đó giữ cho BTW tách biệt khỏi tiến trình chính trong khi vẫn nhận thức được nội dung của phiên.

## Mô hình phân phối

BTW **không** được phân phối như một tin nhắn bản ghi trợ lý thông thường.

Ở cấp độ giao thức Gateway:

- chat trợ lý thông thường sử dụng sự kiện `chat`
- BTW sử dụng sự kiện `chat.side_result`

Sự tách biệt này là có chủ ý. Nếu BTW sử dụng lại đường dẫn sự kiện `chat` thông thường, các client sẽ coi nó như lịch sử hội thoại thông thường.

Vì BTW sử dụng một sự kiện trực tiếp riêng biệt và không được phát lại từ `chat.history`, nó sẽ biến mất sau khi tải lại.

## Hành vi bề mặt

### TUI

Trong TUI, BTW được hiển thị trực tiếp trong chế độ xem phiên hiện tại, nhưng vẫn tạm thời:

- khác biệt rõ ràng với phản hồi trợ lý thông thường
- có thể loại bỏ bằng `Enter` hoặc `Esc`
- không được phát lại khi tải lại

### Kênh bên ngoài

Trên các kênh như Telegram, WhatsApp và Discord, BTW được gửi dưới dạng một phản hồi rõ ràng vì các bề mặt đó không có khái niệm lớp phủ tạm thời cục bộ.

Câu trả lời vẫn được coi là kết quả phụ, không phải lịch sử phiên thông thường.

### Giao diện điều khiển / web

Gateway phát ra BTW chính xác dưới dạng `chat.side_result`, và BTW không được bao gồm trong `chat.history`, vì vậy hợp đồng lưu trữ đã đúng cho web.

Giao diện điều khiển hiện tại vẫn cần một bộ tiêu thụ `chat.side_result` chuyên dụng để hiển thị BTW trực tiếp trong trình duyệt. Cho đến khi hỗ trợ phía client đó được triển khai, BTW là một tính năng ở cấp độ Gateway với đầy đủ hành vi TUI và kênh bên ngoài, nhưng chưa phải là một trải nghiệm người dùng trình duyệt hoàn chỉnh.

## Khi nào nên sử dụng BTW

Sử dụng `/btw` khi bạn muốn:

- một sự làm rõ nhanh chóng về công việc hiện tại,
- một câu trả lời phụ thực tế trong khi một tiến trình dài vẫn đang diễn ra,
- một câu trả lời tạm thời không nên trở thành một phần của ngữ cảnh phiên trong tương lai.

Ví dụ:

```text
/btw chúng ta đang chỉnh sửa tệp nào?
/btw lỗi này có ý nghĩa gì?
/btw tóm tắt nhiệm vụ hiện tại trong một câu
/btw 17 * 19 là bao nhiêu?
```

## Khi nào không nên sử dụng BTW

Không sử dụng `/btw` khi bạn muốn câu trả lời trở thành một phần của ngữ cảnh làm việc trong tương lai của phiên.

Trong trường hợp đó, hãy hỏi bình thường trong phiên chính thay vì sử dụng BTW.

## Liên quan

- [Lệnh gạch chéo](/tools/slash-commands)
- [Cấp độ tư duy](/tools/thinking)
- [Phiên](/concepts/session)
