---
summary: "Tham khảo: Quy tắc làm sạch và sửa chữa transcript theo từng provider"
read_when:
  - Đang debug lỗi từ chối yêu cầu của provider liên quan đến cấu trúc transcript
  - Đang thay đổi logic làm sạch transcript hoặc sửa lỗi gọi tool
  - Đang điều tra lỗi không khớp id gọi tool giữa các provider
title: "Transcript Hygiene"

---

# Transcript Hygiene (Provider Fixups)

Tài liệu này mô tả các **sửa chữa theo từng provider** áp dụng cho transcript trước khi chạy (xây dựng ngữ cảnh model). Đây là các điều chỉnh **trong bộ nhớ** để đáp ứng yêu cầu nghiêm ngặt của provider. Các bước này **không** ghi đè transcript JSONL lưu trữ trên đĩa; tuy nhiên, một lần sửa chữa session-file riêng có thể ghi đè các file JSONL bị lỗi bằng cách loại bỏ các dòng không hợp lệ trước khi session được tải. Khi sửa chữa xảy ra, file gốc được sao lưu cùng với file session.

Phạm vi bao gồm:

- Làm sạch id gọi tool
- Xác thực input gọi tool
- Sửa chữa ghép cặp kết quả tool
- Xác thực / sắp xếp lượt
- Dọn dẹp chữ ký suy nghĩ
- Làm sạch payload hình ảnh
- Gắn thẻ nguồn gốc input người dùng (cho các prompt định tuyến giữa các session)

Nếu cần chi tiết lưu trữ transcript, xem:

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## Chạy ở đâu

Tất cả các bước làm sạch transcript được tập trung trong embedded runner:

- Chọn policy: `src/agents/transcript-policy.ts`
- Áp dụng làm sạch/sửa chữa: `sanitizeSessionHistory` trong `src/agents/pi-embedded-runner/google.ts`

Policy sử dụng `provider`, `modelApi`, và `modelId` để quyết định áp dụng gì.

Tách biệt với làm sạch transcript, các file session được sửa chữa (nếu cần) trước khi tải:

- `repairSessionFileIfNeeded` trong `src/agents/session-file-repair.ts`
- Gọi từ `run/attempt.ts` và `compact.ts` (embedded runner)

---

## Quy tắc toàn cầu: làm sạch hình ảnh

Payload hình ảnh luôn được làm sạch để tránh bị provider từ chối do giới hạn kích thước (giảm kích thước/nén lại hình ảnh base64 quá lớn).

Điều này cũng giúp kiểm soát áp lực token do hình ảnh gây ra cho các model có khả năng xử lý hình ảnh. Giảm kích thước tối đa thường giảm sử dụng token; kích thước lớn hơn giữ chi tiết.

Triển khai:

- `sanitizeSessionMessagesImages` trong `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` trong `src/agents/tool-images.ts`
- Kích thước tối đa của hình ảnh có thể cấu hình qua `agents.defaults.imageMaxDimensionPx` (mặc định: `1200`).

---

## Quy tắc toàn cầu: gọi tool bị lỗi

Các block gọi tool của assistant thiếu cả `input` và `arguments` sẽ bị loại bỏ trước khi xây dựng ngữ cảnh model. Điều này ngăn chặn provider từ chối do các gọi tool bị lưu trữ một phần (ví dụ, sau khi gặp lỗi giới hạn tốc độ).

Triển khai:

- `sanitizeToolCallInputs` trong `src/agents/session-transcript-repair.ts`
- Áp dụng trong `sanitizeSessionHistory` trong `src/agents/pi-embedded-runner/google.ts`

---

## Quy tắc toàn cầu: nguồn gốc input giữa các session

Khi một agent gửi prompt vào một session khác qua `sessions_send` (bao gồm các bước trả lời/thông báo agent-to-agent), OpenClaw lưu trữ lượt người dùng tạo ra với:

- `message.provenance.kind = "inter_session"`

Metadata này được ghi khi thêm transcript và không thay đổi vai trò (`role: "user"` vẫn giữ để tương thích với provider). Người đọc transcript có thể dùng thông tin này để tránh coi các prompt nội bộ định tuyến là hướng dẫn do người dùng cuối tạo ra.

Trong quá trình xây dựng lại ngữ cảnh, OpenClaw cũng thêm một dấu `[Inter-session message]` ngắn vào các lượt người dùng đó trong bộ nhớ để model có thể phân biệt chúng với hướng dẫn từ người dùng cuối bên ngoài.

---

## Ma trận provider (hành vi hiện tại)

**OpenAI / OpenAI Codex**

- Chỉ làm sạch hình ảnh.
- Loại bỏ chữ ký suy nghĩ mồ côi (các mục suy nghĩ độc lập không có block nội dung tiếp theo) cho transcript OpenAI Responses/Codex.
- Không làm sạch id gọi tool.
- Không sửa chữa ghép cặp kết quả tool.
- Không xác thực hoặc sắp xếp lại lượt.
- Không có kết quả tool tổng hợp.
- Không loại bỏ chữ ký suy nghĩ.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Làm sạch id gọi tool: chỉ cho phép ký tự chữ và số.
- Sửa chữa ghép cặp kết quả tool và kết quả tool tổng hợp.
- Xác thực lượt (luân phiên kiểu Gemini).
- Sửa chữa sắp xếp lượt Google (thêm một bootstrap người dùng nhỏ nếu lịch sử bắt đầu với assistant).
- Antigravity Claude: chuẩn hóa chữ ký suy nghĩ; loại bỏ block suy nghĩ không có chữ ký.

**Anthropic / Minimax (tương thích Anthropic)**

- Sửa chữa ghép cặp kết quả tool và kết quả tool tổng hợp.
- Xác thực lượt (gộp các lượt người dùng liên tiếp để đáp ứng luân phiên nghiêm ngặt).

**Mistral (bao gồm phát hiện dựa trên model-id)**

- Làm sạch id gọi tool: strict9 (độ dài chữ và số 9).

**OpenRouter Gemini**

- Dọn dẹp chữ ký suy nghĩ: loại bỏ giá trị `thought_signature` không phải base64 (giữ base64).

**Mọi thứ khác**

- Chỉ làm sạch hình ảnh.

---

## Hành vi lịch sử (trước 2026.1.22)

Trước bản phát hành 2026.1.22, OpenClaw áp dụng nhiều lớp làm sạch transcript:

- Một **extension transcript-sanitize** chạy trên mỗi lần xây dựng ngữ cảnh và có thể:
  - Sửa chữa ghép cặp sử dụng/kết quả tool.
  - Làm sạch id gọi tool (bao gồm chế độ không nghiêm ngặt giữ `_`/`-`).
- Runner cũng thực hiện làm sạch theo từng provider, gây trùng lặp công việc.
- Các thay đổi bổ sung xảy ra ngoài policy của provider, bao gồm:
  - Loại bỏ thẻ `<final>` khỏi văn bản assistant trước khi lưu trữ.
  - Loại bỏ các lượt lỗi trống của assistant.
  - Cắt bớt nội dung assistant sau khi gọi tool.

Sự phức tạp này gây ra các lỗi hồi quy giữa các provider (đặc biệt là `openai-responses` `call_id|fc_id` pairing). Bản dọn dẹp 2026.1.22 đã loại bỏ extension, tập trung logic trong runner, và làm cho OpenAI **không chạm** ngoài việc làm sạch hình ảnh.\n