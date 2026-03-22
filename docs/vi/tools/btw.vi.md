---
summary: "Câu hỏi phụ tạm thời với /btw"
read_when:
  - Muốn hỏi nhanh một câu phụ về session hiện tại
  - Đang triển khai hoặc debug hành vi BTW trên các client
title: "Câu hỏi phụ BTW"
---

# Câu hỏi phụ BTW

`/btw` cho phép hỏi nhanh một câu phụ về **session hiện tại** mà không đưa câu hỏi đó vào lịch sử hội thoại thông thường.

Được mô phỏng theo hành vi `/btw` của Claude Code, nhưng đã điều chỉnh cho phù hợp với Gateway và kiến trúc đa kênh của OpenClaw.

## Chức năng

Khi gửi:

```text
/btw what changed?
```

OpenClaw sẽ:

1. snapshot ngữ cảnh session hiện tại,
2. chạy một cuộc gọi model riêng **không dùng tool**,
3. chỉ trả lời câu hỏi phụ,
4. không ảnh hưởng đến luồng chính,
5. **không** ghi câu hỏi/đáp BTW vào lịch sử session,
6. phát ra câu trả lời như một **kết quả phụ trực tiếp** thay vì tin nhắn trợ lý thông thường.

Mô hình tư duy quan trọng:

- cùng ngữ cảnh session
- truy vấn phụ một lần riêng biệt
- không gọi tool
- không làm ô nhiễm ngữ cảnh tương lai
- không lưu trữ transcript

## Những gì không làm

`/btw` **không**:

- tạo session mới bền vững,
- tiếp tục nhiệm vụ chính chưa hoàn thành,
- chạy tool hoặc vòng lặp tool agent,
- ghi dữ liệu câu hỏi/đáp BTW vào lịch sử transcript,
- xuất hiện trong `chat.history`,
- tồn tại sau khi reload.

Nó được thiết kế để **tạm thời**.

## Cách hoạt động của ngữ cảnh

BTW sử dụng session hiện tại làm **ngữ cảnh nền**.

Nếu luồng chính đang hoạt động, OpenClaw snapshot trạng thái tin nhắn hiện tại và bao gồm prompt chính đang xử lý làm ngữ cảnh nền, đồng thời chỉ rõ cho model:

- chỉ trả lời câu hỏi phụ,
- không tiếp tục hoặc hoàn thành nhiệm vụ chính chưa hoàn thành,
- không phát ra các cuộc gọi tool hoặc pseudo-tool.

Điều này giữ cho BTW tách biệt khỏi luồng chính nhưng vẫn nhận thức được session đang nói về gì.

## Mô hình phân phối

BTW **không** được phân phối như một tin nhắn transcript trợ lý thông thường.

Ở cấp độ giao thức Gateway:

- chat trợ lý thông thường sử dụng sự kiện `chat`
- BTW sử dụng sự kiện `chat.side_result`

Sự tách biệt này là có chủ ý. Nếu BTW tái sử dụng đường dẫn sự kiện `chat` thông thường, các client sẽ coi nó như lịch sử hội thoại thông thường.

Vì BTW sử dụng sự kiện trực tiếp riêng biệt và không được phát lại từ `chat.history`, nó sẽ biến mất sau khi reload.

## Hành vi bề mặt

### TUI

Trong TUI, BTW được hiển thị inline trong view session hiện tại, nhưng vẫn tạm thời:

- khác biệt rõ ràng với phản hồi trợ lý thông thường
- có thể loại bỏ bằng `Enter` hoặc `Esc`
- không phát lại khi reload

### Kênh bên ngoài

Trên các kênh như Telegram, WhatsApp và Discord, BTW được gửi như một phản hồi một lần rõ ràng vì các bề mặt này không có khái niệm overlay tạm thời cục bộ.

Câu trả lời vẫn được coi là kết quả phụ, không phải lịch sử session thông thường.

### Control UI / web

Gateway phát ra BTW đúng cách dưới dạng `chat.side_result`, và BTW không được bao gồm trong `chat.history`, vì vậy hợp đồng lưu trữ đã đúng cho web.

Control UI hiện tại vẫn cần một consumer `chat.side_result` chuyên dụng để hiển thị BTW trực tiếp trong trình duyệt. Cho đến khi hỗ trợ phía client này được triển khai, BTW là một tính năng cấp Gateway với đầy đủ hành vi TUI và kênh bên ngoài, nhưng chưa hoàn thiện UX trình duyệt.

## Khi nào dùng BTW

Dùng `/btw` khi cần:

- làm rõ nhanh về công việc hiện tại,
- câu trả lời phụ thực tế trong khi một luồng dài vẫn đang chạy,
- câu trả lời tạm thời không nên trở thành một phần của ngữ cảnh session tương lai.

Ví dụ:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Khi không nên dùng BTW

Không dùng `/btw` khi muốn câu trả lời trở thành một phần của ngữ cảnh làm việc tương lai của session.

Trong trường hợp đó, hãy hỏi bình thường trong session chính thay vì dùng BTW.

## Liên quan

- [Slash commands](/tools/slash-commands)
- [Thinking Levels](/tools/thinking)
- [Session](/concepts/session)\n