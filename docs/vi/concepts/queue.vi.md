---
summary: "Thiết kế hàng đợi lệnh để tuần tự hóa các lần chạy tự động trả lời"
read_when:
  - Thay đổi thực thi hoặc đồng thời của tự động trả lời
title: "Hàng đợi lệnh"
---

# Hàng đợi lệnh (2026-01-16)

Chúng ta tuần tự hóa các lần chạy tự động trả lời (tất cả các kênh) qua một hàng đợi nhỏ trong tiến trình để tránh xung đột khi nhiều agent chạy cùng lúc, đồng thời vẫn cho phép chạy song song an toàn giữa các session.

## Tại sao

- Các lần chạy tự động trả lời có thể tốn kém (gọi LLM) và có thể xung đột khi nhiều tin nhắn đến gần nhau.
- Tuần tự hóa giúp tránh cạnh tranh tài nguyên chung (file session, log, CLI stdin) và giảm nguy cơ bị giới hạn tốc độ upstream.

## Cách hoạt động

- Hàng đợi FIFO nhận biết lane sẽ xử lý từng lane với giới hạn đồng thời có thể cấu hình (mặc định 1 cho các lane chưa cấu hình; main mặc định là 4, subagent là 8).
- `runEmbeddedPiAgent` đưa vào hàng đợi theo **session key** (lane `session:<key>`) để đảm bảo chỉ có một lần chạy hoạt động mỗi session.
- Mỗi lần chạy session sau đó được đưa vào một **global lane** (`main` mặc định) để tổng thể song song bị giới hạn bởi `agents.defaults.maxConcurrent`.
- Khi bật logging chi tiết, các lần chạy trong hàng đợi sẽ phát thông báo ngắn nếu chờ hơn ~2s trước khi bắt đầu.
- Chỉ báo gõ vẫn kích hoạt ngay khi đưa vào hàng đợi (khi kênh hỗ trợ) nên trải nghiệm người dùng không thay đổi trong khi chờ.

## Chế độ hàng đợi (theo kênh)

Tin nhắn đến có thể điều khiển lần chạy hiện tại, chờ lượt tiếp theo, hoặc cả hai:

- `steer`: chèn ngay vào lần chạy hiện tại (hủy các cuộc gọi công cụ đang chờ sau ranh giới công cụ tiếp theo). Nếu không streaming, sẽ chuyển sang followup.
- `followup`: đưa vào hàng đợi cho lượt agent tiếp theo sau khi lần chạy hiện tại kết thúc.
- `collect`: gom tất cả tin nhắn trong hàng đợi thành một lượt followup duy nhất (mặc định). Nếu tin nhắn nhắm đến các kênh/chủ đề khác nhau, chúng sẽ được xử lý riêng để giữ nguyên routing.
- `steer-backlog` (hay `steer+backlog`): điều khiển ngay **và** giữ lại tin nhắn cho lượt followup.
- `interrupt` (cũ): hủy lần chạy hoạt động cho session đó, sau đó chạy tin nhắn mới nhất.
- `queue` (bí danh cũ): giống như `steer`.

Steer-backlog cho phép nhận phản hồi followup sau lần chạy steer, nên bề mặt streaming có thể trông như bị trùng lặp. Ưu tiên `collect`/`steer` nếu muốn một phản hồi cho mỗi tin nhắn đến.
Gửi `/queue collect` như một lệnh độc lập (theo session) hoặc đặt `messages.queue.byChannel.discord: "collect"`.

Mặc định (khi không đặt trong config):

- Tất cả bề mặt → `collect`

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

Tùy chọn áp dụng cho `followup`, `collect`, và `steer-backlog` (và cho `steer` khi chuyển sang followup):

- `debounceMs`: chờ yên tĩnh trước khi bắt đầu lượt followup (ngăn “tiếp tục, tiếp tục”).
- `cap`: số lượng tin nhắn tối đa trong hàng đợi mỗi session.
- `drop`: chính sách tràn (`old`, `new`, `summarize`).

Summarize giữ một danh sách gạch đầu dòng ngắn của các tin nhắn bị bỏ qua và chèn nó như một prompt followup tổng hợp.
Mặc định: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Ghi đè theo session

- Gửi `/queue <mode>` như một lệnh độc lập để lưu chế độ cho session hiện tại.
- Có thể kết hợp tùy chọn: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` hoặc `/queue reset` xóa ghi đè session.

## Phạm vi và đảm bảo

- Áp dụng cho các lần chạy agent tự động trả lời trên tất cả các kênh đến sử dụng pipeline trả lời gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, v.v.).
- Lane mặc định (`main`) là toàn bộ tiến trình cho inbound + main heartbeats; đặt `agents.defaults.maxConcurrent` để cho phép nhiều session song song.
- Có thể có các lane bổ sung (ví dụ: `cron`, `subagent`) để các công việc nền có thể chạy song song mà không chặn các phản hồi inbound.
- Các lane theo session đảm bảo chỉ có một lần chạy agent chạm vào một session nhất định tại một thời điểm.
- Không có phụ thuộc bên ngoài hoặc luồng công nhân nền; thuần TypeScript + promises.

## Khắc phục sự cố

- Nếu lệnh có vẻ bị kẹt, bật log chi tiết và tìm dòng “queued for …ms” để xác nhận hàng đợi đang xử lý.
- Nếu cần độ sâu hàng đợi, bật log chi tiết và theo dõi các dòng thời gian hàng đợi.\n