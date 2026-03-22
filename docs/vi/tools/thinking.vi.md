---
summary: "Cú pháp directive cho /think, /fast, /verbose và hiển thị reasoning"
read_when:
  - Điều chỉnh parsing hoặc mặc định của directive thinking, fast-mode, hoặc verbose
title: "Các cấp độ Thinking"
---

# Các cấp độ Thinking (/think directives)

## Chức năng

- Directive inline trong bất kỳ inbound body nào: `/t <level>`, `/think:<level>`, hoặc `/thinking <level>`.
- Các cấp độ (alias): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (max budget)
  - xhigh → “ultrathink+” (chỉ GPT-5.2 + Codex models)
  - adaptive → budget reasoning adaptive do provider quản lý (hỗ trợ cho Anthropic Claude 4.6 model family)
  - `x-high`, `x_high`, `extra-high`, `extra high`, và `extra_high` map tới `xhigh`.
  - `highest`, `max` map tới `high`.
- Ghi chú provider:
  - Anthropic Claude 4.6 models mặc định là `adaptive` khi không có cấp độ thinking cụ thể.
  - Z.AI (`zai/*`) chỉ hỗ trợ thinking nhị phân (`on`/`off`). Bất kỳ cấp độ nào không phải `off` đều được coi là `on` (map tới `low`).
  - Moonshot (`moonshot/*`) map `/think off` thành `thinking: { type: "disabled" }` và bất kỳ cấp độ nào không phải `off` thành `thinking: { type: "enabled" }`. Khi thinking được bật, Moonshot chỉ chấp nhận `tool_choice` `auto|none`; OpenClaw chuẩn hóa các giá trị không tương thích thành `auto`.

## Thứ tự giải quyết

1. Directive inline trên message (chỉ áp dụng cho message đó).
2. Session override (đặt bằng cách gửi một message chỉ chứa directive).
3. Mặc định per-agent (`agents.list[].thinkingDefault` trong config).
4. Mặc định toàn cầu (`agents.defaults.thinkingDefault` trong config).
5. Fallback: `adaptive` cho Anthropic Claude 4.6 models, `low` cho các model có khả năng reasoning khác, `off` nếu không.

## Đặt mặc định cho session

- Gửi một message chỉ chứa directive (có thể có khoảng trắng), ví dụ `/think:medium` hoặc `/t high`.
- Áp dụng cho session hiện tại (mặc định per-sender); xóa bằng `/think:off` hoặc reset khi session idle.
- Có phản hồi xác nhận (`Thinking level set to high.` / `Thinking disabled.`). Nếu cấp độ không hợp lệ (ví dụ `/thinking big`), lệnh bị từ chối với gợi ý và trạng thái session không thay đổi.
- Gửi `/think` (hoặc `/think:`) không có tham số để xem cấp độ thinking hiện tại.

## Áp dụng theo agent

- **Embedded Pi**: cấp độ đã giải quyết được truyền vào runtime Pi agent in-process.

## Fast mode (/fast)

- Các cấp độ: `on|off`.
- Message chỉ chứa directive bật/tắt session fast-mode override và phản hồi `Fast mode enabled.` / `Fast mode disabled.`.
- Gửi `/fast` (hoặc `/fast status`) không có mode để xem trạng thái fast-mode hiện tại.
- OpenClaw giải quyết fast mode theo thứ tự:
  1. Inline/directive-only `/fast on|off`
  2. Session override
  3. Mặc định per-agent (`agents.list[].fastModeDefault`)
  4. Cấu hình per-model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Với `openai/*`, fast mode áp dụng profile fast của OpenAI: `service_tier=priority` khi được hỗ trợ, cùng với nỗ lực reasoning thấp và độ chi tiết văn bản thấp.
- Với `openai-codex/*`, fast mode áp dụng cùng profile low-latency trên Codex Responses. OpenClaw giữ một toggle `/fast` chung cho cả hai auth paths.
- Với yêu cầu API-key trực tiếp `anthropic/*`, fast mode map tới các service tiers của Anthropic: `/fast on` đặt `service_tier=auto`, `/fast off` đặt `service_tier=standard_only`.
- Fast mode của Anthropic chỉ dành cho API-key. OpenClaw bỏ qua injection service-tier của Anthropic cho Claude setup-token / OAuth auth và cho các base URLs proxy không phải Anthropic.

## Verbose directives (/verbose hoặc /v)

- Các cấp độ: `on` (minimal) | `full` | `off` (default).
- Message chỉ chứa directive bật/tắt session verbose và phản hồi `Verbose logging enabled.` / `Verbose logging disabled.`; các cấp độ không hợp lệ trả về gợi ý mà không thay đổi trạng thái.
- `/verbose off` lưu một session override rõ ràng; xóa nó qua Sessions UI bằng cách chọn `inherit`.
- Directive inline chỉ ảnh hưởng đến message đó; mặc định session/toàn cầu áp dụng nếu không.
- Gửi `/verbose` (hoặc `/verbose:`) không có tham số để xem cấp độ verbose hiện tại.
- Khi verbose bật, các agent phát ra kết quả công cụ có cấu trúc (Pi, các agent JSON khác) gửi mỗi lần gọi công cụ như một message chỉ chứa metadata, được tiền tố bằng `<emoji> <tool-name>: <arg>` khi có (path/command). Các tóm tắt công cụ này được gửi ngay khi mỗi công cụ bắt đầu (bong bóng riêng), không phải là streaming deltas.
- Tóm tắt lỗi công cụ vẫn hiển thị ở chế độ bình thường, nhưng chi tiết lỗi thô bị ẩn trừ khi verbose là `on` hoặc `full`.
- Khi verbose là `full`, đầu ra công cụ cũng được chuyển tiếp sau khi hoàn thành (bong bóng riêng, cắt ngắn đến độ dài an toàn). Nếu bạn chuyển `/verbose on|full|off` trong khi một run đang diễn ra, các bong bóng công cụ tiếp theo sẽ tuân theo cài đặt mới.

## Hiển thị reasoning (/reasoning)

- Các cấp độ: `on|off|stream`.
- Message chỉ chứa directive bật/tắt việc hiển thị các khối thinking trong phản hồi.
- Khi bật, reasoning được gửi như một **message riêng** tiền tố bằng `Reasoning:`.
- `stream` (chỉ Telegram): stream reasoning vào bong bóng draft của Telegram trong khi phản hồi đang được tạo, sau đó gửi câu trả lời cuối cùng mà không có reasoning.
- Alias: `/reason`.
- Gửi `/reasoning` (hoặc `/reasoning:`) không có tham số để xem cấp độ reasoning hiện tại.
- Thứ tự giải quyết: directive inline, sau đó session override, sau đó mặc định per-agent (`agents.list[].reasoningDefault`), sau đó fallback (`off`).

## Liên quan

- Tài liệu Elevated mode có tại [Elevated mode](/tools/elevated).

## Heartbeats

- Nội dung probe heartbeat là prompt heartbeat được cấu hình (mặc định: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Các directive inline trong message heartbeat áp dụng như thường (nhưng tránh thay đổi mặc định session từ heartbeats).
- Việc gửi heartbeat mặc định chỉ là payload cuối cùng. Để cũng gửi message `Reasoning:` riêng (khi có), đặt `agents.defaults.heartbeat.includeReasoning: true` hoặc per-agent `agents.list[].heartbeat.includeReasoning: true`.

## Web chat UI

- Bộ chọn thinking của web chat phản ánh cấp độ được lưu trữ của session từ inbound session store/config khi trang tải.
- Chọn cấp độ khác chỉ áp dụng cho message tiếp theo (`thinkingOnce`); sau khi gửi, bộ chọn sẽ quay lại cấp độ session được lưu trữ.
- Để thay đổi mặc định session, gửi một directive `/think:<level>` (như trước); bộ chọn sẽ phản ánh điều đó sau lần tải lại tiếp theo.\n