---
summary: "Thiết kế hàng đợi lệnh để tuần tự hóa các lần chạy tự động trả lời đến"
read_when:
  - Thay đổi thực thi hoặc đồng thời của tự động trả lời
title: "Hàng Đợi Lệnh"
---

# Hàng Đợi Lệnh (2026-01-16)

Chúng tôi tuần tự hóa các lần chạy tự động trả lời đến (tất cả các kênh) thông qua một hàng đợi nhỏ trong quá trình để ngăn chặn các lần chạy tác nhân đồng thời va chạm, đồng thời vẫn cho phép thực hiện song song an toàn giữa các phiên.

## Tại sao

- Các lần chạy tự động trả lời có thể tốn kém (gọi LLM) và có thể va chạm khi nhiều tin nhắn đến gần nhau.
- Tuần tự hóa giúp tránh cạnh tranh tài nguyên chia sẻ (tệp phiên, nhật ký, CLI stdin) và giảm khả năng bị giới hạn tốc độ từ phía trên.

## Cách hoạt động

- Một hàng đợi FIFO nhận biết làn đường xả từng làn với giới hạn đồng thời có thể cấu hình (mặc định là 1 cho các làn chưa cấu hình; chính mặc định là 4, phụ là 8).
- `runEmbeddedPiAgent` đưa vào hàng đợi theo **khóa phiên** (làn `session:<key>`) để đảm bảo chỉ có một lần chạy hoạt động mỗi phiên.
- Mỗi lần chạy phiên sau đó được đưa vào một **làn toàn cầu** (`main` mặc định) để tổng thể song song được giới hạn bởi `agents.defaults.maxConcurrent`.
- Khi bật ghi nhật ký chi tiết, các lần chạy trong hàng đợi sẽ phát ra thông báo ngắn nếu chúng chờ hơn ~2 giây trước khi bắt đầu.
- Các chỉ báo gõ vẫn kích hoạt ngay lập tức khi đưa vào hàng đợi (khi được kênh hỗ trợ) để trải nghiệm người dùng không thay đổi trong khi chờ đợi.

## Chế độ hàng đợi (theo kênh)

Tin nhắn đến có thể điều khiển lần chạy hiện tại, chờ lượt tiếp theo, hoặc cả hai:

- `steer`: chèn ngay vào lần chạy hiện tại (hủy các cuộc gọi công cụ đang chờ sau ranh giới công cụ tiếp theo). Nếu không phát trực tuyến, sẽ quay lại lượt tiếp theo.
- `followup`: đưa vào hàng đợi cho lượt tác nhân tiếp theo sau khi lần chạy hiện tại kết thúc.
- `collect`: hợp nhất tất cả các tin nhắn trong hàng đợi thành một lượt tiếp theo duy nhất (mặc định). Nếu tin nhắn nhắm mục tiêu các kênh/chủ đề khác nhau, chúng sẽ xả riêng để bảo toàn định tuyến.
- `steer-backlog` (hay `steer+backlog`): điều khiển ngay bây giờ và bảo lưu tin nhắn cho lượt tiếp theo.
- `interrupt` (cũ): hủy lần chạy hoạt động cho phiên đó, sau đó chạy tin nhắn mới nhất.
- `queue` (bí danh cũ): giống như `steer`.

Steer-backlog có nghĩa là bạn có thể nhận được phản hồi tiếp theo sau lần chạy đã điều khiển, vì vậy các bề mặt phát trực tuyến có thể trông như bị trùng lặp. Ưu tiên `collect`/`steer` nếu bạn muốn một phản hồi cho mỗi tin nhắn đến.
Gửi `/queue collect` như một lệnh độc lập (theo phiên) hoặc đặt `messages.queue.byChannel.discord: "collect"`.

Mặc định (khi không được đặt trong cấu hình):

- Tất cả các bề mặt → `collect`

Cấu hình toàn cầu hoặc theo kênh qua `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Tùy chọn hàng đợi

Các tùy chọn áp dụng cho `followup`, `collect`, và `steer-backlog` (và cho `steer` khi nó quay lại lượt tiếp theo):

- `debounceMs`: chờ yên tĩnh trước khi bắt đầu lượt tiếp theo (ngăn “tiếp tục, tiếp tục”).
- `cap`: số lượng tin nhắn tối đa trong hàng đợi mỗi phiên.
- `drop`: chính sách tràn (`old`, `new`, `summarize`).

Summarize giữ một danh sách gạch đầu dòng ngắn của các tin nhắn bị bỏ qua và chèn nó như một lời nhắc theo dõi tổng hợp.
Mặc định: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Ghi đè theo phiên

- Gửi `/queue <mode>` như một lệnh độc lập để lưu trữ chế độ cho phiên hiện tại.
- Các tùy chọn có thể được kết hợp: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` hoặc `/queue reset` xóa ghi đè phiên.

## Phạm vi và đảm bảo

- Áp dụng cho các lần chạy tác nhân tự động trả lời trên tất cả các kênh đến sử dụng đường dẫn trả lời gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, v.v.).
- Làn mặc định (`main`) là toàn bộ quá trình cho nhịp tim đến + chính; đặt `agents.defaults.maxConcurrent` để cho phép nhiều phiên song song.
- Có thể tồn tại các làn bổ sung (ví dụ: `cron`, `subagent`) để các công việc nền có thể chạy song song mà không chặn các trả lời đến.
- Các làn theo phiên đảm bảo rằng chỉ có một lần chạy tác nhân chạm vào một phiên nhất định tại một thời điểm.
- Không có phụ thuộc bên ngoài hoặc luồng công nhân nền; chỉ TypeScript thuần túy + promises.

## Khắc phục sự cố

- Nếu các lệnh dường như bị kẹt, hãy bật nhật ký chi tiết và tìm các dòng “queued for …ms” để xác nhận hàng đợi đang xả.
- Nếu cần độ sâu hàng đợi, hãy bật nhật ký chi tiết và theo dõi các dòng thời gian hàng đợi.
