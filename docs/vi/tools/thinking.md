---
summary: "Cú pháp chỉ thị cho /think, /fast, /verbose và khả năng hiển thị lý luận"
read_when:
  - Điều chỉnh phân tích cú pháp hoặc mặc định của chỉ thị thinking, fast-mode, hoặc verbose
title: "Các cấp độ tư duy"
---

# Các cấp độ tư duy (chỉ thị /think)

## Chức năng

- Chỉ thị nội tuyến trong bất kỳ nội dung nào: `/t <level>`, `/think:<level>`, hoặc `/thinking <level>`.
- Các cấp độ (tên gọi khác): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (ngân sách tối đa)
  - xhigh → “ultrathink+” (chỉ dành cho các mô hình GPT-5.2 + Codex)
  - adaptive → ngân sách lý luận thích ứng do nhà cung cấp quản lý (hỗ trợ cho dòng mô hình Anthropic Claude 4.6)
  - `x-high`, `x_high`, `extra-high`, `extra high`, và `extra_high` ánh xạ đến `xhigh`.
  - `highest`, `max` ánh xạ đến `high`.
- Ghi chú từ nhà cung cấp:
  - Các mô hình Anthropic Claude 4.6 mặc định là `adaptive` khi không có cấp độ tư duy rõ ràng.
  - Z.AI (`zai/*`) chỉ hỗ trợ tư duy nhị phân (`on`/`off`). Bất kỳ cấp độ nào không phải `off` đều được coi là `on` (ánh xạ đến `low`).
  - Moonshot (`moonshot/*`) ánh xạ `/think off` thành `thinking: { type: "disabled" }` và bất kỳ cấp độ nào không phải `off` thành `thinking: { type: "enabled" }`. Khi tư duy được bật, Moonshot chỉ chấp nhận `tool_choice` là `auto|none`; OpenClaw chuẩn hóa các giá trị không tương thích thành `auto`.

## Thứ tự giải quyết

1. Chỉ thị nội tuyến trên tin nhắn (chỉ áp dụng cho tin nhắn đó).
2. Ghi đè phiên (được thiết lập bằng cách gửi một tin nhắn chỉ có chỉ thị).
3. Mặc định theo từng agent (`agents.list[].thinkingDefault` trong cấu hình).
4. Mặc định toàn cầu (`agents.defaults.thinkingDefault` trong cấu hình).
5. Dự phòng: `adaptive` cho các mô hình Anthropic Claude 4.6, `low` cho các mô hình có khả năng lý luận khác, `off` nếu không.

## Thiết lập mặc định cho phiên

- Gửi một tin nhắn chỉ chứa chỉ thị (cho phép khoảng trắng), ví dụ: `/think:medium` hoặc `/t high`.
- Điều này sẽ giữ nguyên cho phiên hiện tại (mặc định theo từng người gửi); được xóa bằng `/think:off` hoặc khi phiên không hoạt động.
- Phản hồi xác nhận được gửi (`Thinking level set to high.` / `Thinking disabled.`). Nếu cấp độ không hợp lệ (ví dụ: `/thinking big`), lệnh bị từ chối với gợi ý và trạng thái phiên không thay đổi.
- Gửi `/think` (hoặc `/think:`) không có tham số để xem cấp độ tư duy hiện tại.

## Áp dụng theo agent

- **Embedded Pi**: cấp độ đã giải quyết được truyền đến runtime agent Pi trong quá trình.

## Chế độ nhanh (/fast)

- Các cấp độ: `on|off`.
- Tin nhắn chỉ có chỉ thị chuyển đổi ghi đè chế độ nhanh của phiên và phản hồi `Fast mode enabled.` / `Fast mode disabled.`.
- Gửi `/fast` (hoặc `/fast status`) không có chế độ để xem trạng thái chế độ nhanh hiện tại.
- OpenClaw giải quyết chế độ nhanh theo thứ tự này:
  1. Chỉ thị nội tuyến/chỉ thị duy nhất `/fast on|off`
  2. Ghi đè phiên
  3. Mặc định theo từng agent (`agents.list[].fastModeDefault`)
  4. Cấu hình theo mô hình: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Dự phòng: `off`
- Đối với `openai/*`, chế độ nhanh áp dụng hồ sơ nhanh của OpenAI: `service_tier=priority` khi được hỗ trợ, cùng với nỗ lực lý luận thấp và độ dài văn bản thấp.
- Đối với `openai-codex/*`, chế độ nhanh áp dụng cùng một hồ sơ độ trễ thấp trên các phản hồi Codex. OpenClaw giữ một công tắc `/fast` chung cho cả hai đường xác thực.
- Đối với các yêu cầu API-key trực tiếp `anthropic/*`, chế độ nhanh ánh xạ đến các cấp dịch vụ của Anthropic: `/fast on` đặt `service_tier=auto`, `/fast off` đặt `service_tier=standard_only`.
- Chế độ nhanh của Anthropic chỉ dành cho API-key. OpenClaw bỏ qua việc tiêm cấp dịch vụ của Anthropic cho thiết lập Claude-token / OAuth và cho các URL cơ sở proxy không phải Anthropic.

## Chỉ thị chi tiết (/verbose hoặc /v)

- Các cấp độ: `on` (tối thiểu) | `full` | `off` (mặc định).
- Tin nhắn chỉ có chỉ thị chuyển đổi chế độ chi tiết của phiên và phản hồi `Verbose logging enabled.` / `Verbose logging disabled.`; các cấp độ không hợp lệ trả về gợi ý mà không thay đổi trạng thái.
- `/verbose off` lưu trữ một ghi đè phiên rõ ràng; xóa nó qua giao diện Sessions UI bằng cách chọn `inherit`.
- Chỉ thị nội tuyến chỉ ảnh hưởng đến tin nhắn đó; mặc định phiên/toàn cầu áp dụng nếu không.
- Gửi `/verbose` (hoặc `/verbose:`) không có tham số để xem cấp độ chi tiết hiện tại.
- Khi chế độ chi tiết được bật, các agent phát ra kết quả công cụ có cấu trúc (Pi, các agent JSON khác) gửi mỗi lần gọi công cụ trở lại dưới dạng tin nhắn chỉ có siêu dữ liệu, được tiền tố bằng `<emoji> <tool-name>: <arg>` khi có sẵn (đường dẫn/lệnh). Các tóm tắt công cụ này được gửi ngay khi mỗi công cụ bắt đầu (bong bóng riêng biệt), không phải dưới dạng các delta streaming.
- Các tóm tắt lỗi công cụ vẫn hiển thị ở chế độ bình thường, nhưng các chi tiết lỗi thô được ẩn trừ khi chế độ chi tiết là `on` hoặc `full`.
- Khi chế độ chi tiết là `full`, các đầu ra công cụ cũng được chuyển tiếp sau khi hoàn thành (bong bóng riêng biệt, bị cắt ngắn đến độ dài an toàn). Nếu bạn chuyển đổi `/verbose on|full|off` trong khi một lần chạy đang diễn ra, các bong bóng công cụ tiếp theo sẽ tuân theo cài đặt mới.

## Khả năng hiển thị lý luận (/reasoning)

- Các cấp độ: `on|off|stream`.
- Tin nhắn chỉ có chỉ thị chuyển đổi việc hiển thị các khối tư duy trong các phản hồi.
- Khi được bật, lý luận được gửi dưới dạng một **tin nhắn riêng biệt** được tiền tố bằng `Reasoning:`.
- `stream` (chỉ Telegram): truyền lý luận vào bong bóng nháp của Telegram trong khi phản hồi đang được tạo, sau đó gửi câu trả lời cuối cùng mà không có lý luận.
- Tên gọi khác: `/reason`.
- Gửi `/reasoning` (hoặc `/reasoning:`) không có tham số để xem cấp độ lý luận hiện tại.
- Thứ tự giải quyết: chỉ thị nội tuyến, sau đó ghi đè phiên, sau đó mặc định theo từng agent (`agents.list[].reasoningDefault`), sau đó dự phòng (`off`).

## Liên quan

- Tài liệu chế độ nâng cao có tại [Elevated mode](/tools/elevated).

## Heartbeats

- Nội dung thăm dò nhịp tim là lời nhắc nhịp tim được cấu hình (mặc định: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Các chỉ thị nội tuyến trong một tin nhắn nhịp tim áp dụng như bình thường (nhưng tránh thay đổi mặc định phiên từ nhịp tim).
- Giao hàng nhịp tim mặc định chỉ là tải trọng cuối cùng. Để cũng gửi tin nhắn `Reasoning:` riêng biệt (khi có sẵn), đặt `agents.defaults.heartbeat.includeReasoning: true` hoặc theo từng agent `agents.list[].heartbeat.includeReasoning: true`.

## Giao diện trò chuyện web

- Bộ chọn tư duy trò chuyện web phản ánh cấp độ được lưu trữ của phiên từ kho lưu trữ phiên đầu vào/cấu hình khi trang tải.
- Chọn cấp độ khác chỉ áp dụng cho tin nhắn tiếp theo (`thinkingOnce`); sau khi gửi, bộ chọn sẽ trở lại cấp độ phiên được lưu trữ.
- Để thay đổi mặc định phiên, gửi một chỉ thị `/think:<level>` (như trước); bộ chọn sẽ phản ánh điều đó sau lần tải lại tiếp theo.
