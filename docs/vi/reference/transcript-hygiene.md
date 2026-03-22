---
summary: "Tham khảo: Quy tắc làm sạch và sửa chữa bản ghi cụ thể cho từng nhà cung cấp"
read_when:
  - Bạn đang gỡ lỗi các yêu cầu bị từ chối do hình dạng bản ghi
  - Bạn đang thay đổi logic làm sạch hoặc sửa chữa cuộc gọi công cụ
  - Bạn đang điều tra sự không khớp id cuộc gọi công cụ giữa các nhà cung cấp
title: "Vệ sinh Bản ghi"
---

# Vệ sinh Bản ghi (Sửa chữa theo Nhà cung cấp)

Tài liệu này mô tả các **sửa chữa cụ thể cho từng nhà cung cấp** được áp dụng cho bản ghi trước khi chạy (xây dựng ngữ cảnh mô hình). Đây là các điều chỉnh **trong bộ nhớ** để đáp ứng yêu cầu nghiêm ngặt của nhà cung cấp. Các bước vệ sinh này **không** viết lại bản ghi JSONL lưu trữ trên đĩa; tuy nhiên, một lần sửa chữa file phiên riêng có thể viết lại các file JSONL bị lỗi bằng cách loại bỏ các dòng không hợp lệ trước khi tải phiên. Khi sửa chữa xảy ra, file gốc được sao lưu cùng với file phiên.

Phạm vi bao gồm:

- Làm sạch id cuộc gọi công cụ
- Xác thực đầu vào cuộc gọi công cụ
- Sửa chữa ghép đôi kết quả công cụ
- Xác thực / sắp xếp lượt
- Dọn dẹp chữ ký suy nghĩ
- Làm sạch payload hình ảnh
- Gắn thẻ nguồn gốc đầu vào người dùng (cho các lời nhắc được định tuyến giữa các phiên)

Nếu cần chi tiết lưu trữ bản ghi, xem:

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## Nơi thực hiện

Tất cả vệ sinh bản ghi được tập trung trong runner nhúng:

- Lựa chọn chính sách: `src/agents/transcript-policy.ts`
- Áp dụng làm sạch/sửa chữa: `sanitizeSessionHistory` trong `src/agents/pi-embedded-runner/google.ts`

Chính sách sử dụng `provider`, `modelApi`, và `modelId` để quyết định áp dụng gì.

Tách biệt với vệ sinh bản ghi, các file phiên được sửa chữa (nếu cần) trước khi tải:

- `repairSessionFileIfNeeded` trong `src/agents/session-file-repair.ts`
- Được gọi từ `run/attempt.ts` và `compact.ts` (runner nhúng)

---

## Quy tắc toàn cầu: làm sạch hình ảnh

Payload hình ảnh luôn được làm sạch để ngăn chặn từ chối từ phía nhà cung cấp do giới hạn kích thước (giảm kích thước/nén lại hình ảnh base64 quá lớn).

Điều này cũng giúp kiểm soát áp lực token do hình ảnh gây ra cho các mô hình có khả năng xử lý hình ảnh. Giảm kích thước tối đa thường giảm sử dụng token; kích thước lớn hơn giữ chi tiết.

Triển khai:

- `sanitizeSessionMessagesImages` trong `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` trong `src/agents/tool-images.ts`
- Kích thước cạnh hình ảnh tối đa có thể cấu hình qua `agents.defaults.imageMaxDimensionPx` (mặc định: `1200`).

---

## Quy tắc toàn cầu: cuộc gọi công cụ bị lỗi

Các khối cuộc gọi công cụ trợ lý thiếu cả `input` và `arguments` sẽ bị loại bỏ trước khi xây dựng ngữ cảnh mô hình. Điều này ngăn chặn từ chối từ nhà cung cấp do các cuộc gọi công cụ được lưu trữ một phần (ví dụ, sau khi gặp lỗi giới hạn tốc độ).

Triển khai:

- `sanitizeToolCallInputs` trong `src/agents/session-transcript-repair.ts`
- Áp dụng trong `sanitizeSessionHistory` trong `src/agents/pi-embedded-runner/google.ts`

---

## Quy tắc toàn cầu: nguồn gốc đầu vào giữa các phiên

Khi một agent gửi một lời nhắc vào một phiên khác qua `sessions_send` (bao gồm các bước trả lời/thông báo agent-to-agent), OpenClaw lưu trữ lượt người dùng được tạo với:

- `message.provenance.kind = "inter_session"`

Metadata này được ghi vào thời điểm thêm bản ghi và không thay đổi vai trò (`role: "user"` vẫn giữ để tương thích với nhà cung cấp). Người đọc bản ghi có thể sử dụng điều này để tránh coi các lời nhắc nội bộ được định tuyến là hướng dẫn do người dùng cuối tạo ra.

Trong quá trình xây dựng lại ngữ cảnh, OpenClaw cũng thêm một dấu `[Inter-session message]` ngắn vào các lượt người dùng đó trong bộ nhớ để mô hình có thể phân biệt chúng với các hướng dẫn từ người dùng cuối bên ngoài.

---

## Ma trận nhà cung cấp (hành vi hiện tại)

**OpenAI / OpenAI Codex**

- Chỉ làm sạch hình ảnh.
- Loại bỏ chữ ký suy nghĩ mồ côi (các mục suy nghĩ độc lập không có khối nội dung theo sau) cho bản ghi OpenAI Responses/Codex.
- Không làm sạch id cuộc gọi công cụ.
- Không sửa chữa ghép đôi kết quả công cụ.
- Không xác thực hoặc sắp xếp lại lượt.
- Không có kết quả công cụ tổng hợp.
- Không loại bỏ chữ ký suy nghĩ.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Làm sạch id cuộc gọi công cụ: chỉ cho phép chữ và số.
- Sửa chữa ghép đôi kết quả công cụ và kết quả công cụ tổng hợp.
- Xác thực lượt (luân phiên kiểu Gemini).
- Sửa chữa sắp xếp lượt của Google (thêm một lượt khởi động người dùng nhỏ nếu lịch sử bắt đầu với trợ lý).
- Antigravity Claude: chuẩn hóa chữ ký suy nghĩ; loại bỏ các khối suy nghĩ không có chữ ký.

**Anthropic / Minimax (tương thích với Anthropic)**

- Sửa chữa ghép đôi kết quả công cụ và kết quả công cụ tổng hợp.
- Xác thực lượt (gộp các lượt người dùng liên tiếp để đáp ứng luân phiên nghiêm ngặt).

**Mistral (bao gồm phát hiện dựa trên model-id)**

- Làm sạch id cuộc gọi công cụ: strict9 (độ dài chữ và số 9).

**OpenRouter Gemini**

- Dọn dẹp chữ ký suy nghĩ: loại bỏ các giá trị `thought_signature` không phải base64 (giữ base64).

**Mọi thứ khác**

- Chỉ làm sạch hình ảnh.

---

## Hành vi lịch sử (trước 2026.1.22)

Trước bản phát hành 2026.1.22, OpenClaw áp dụng nhiều lớp vệ sinh bản ghi:

- Một **mở rộng làm sạch bản ghi** chạy trên mỗi lần xây dựng ngữ cảnh và có thể:
  - Sửa chữa ghép đôi sử dụng/kết quả công cụ.
  - Làm sạch id cuộc gọi công cụ (bao gồm chế độ không nghiêm ngặt giữ `_`/`-`).
- Runner cũng thực hiện làm sạch cụ thể cho nhà cung cấp, điều này gây trùng lặp công việc.
- Các thay đổi bổ sung xảy ra ngoài chính sách nhà cung cấp, bao gồm:
  - Loại bỏ thẻ `<final>` khỏi văn bản trợ lý trước khi lưu trữ.
  - Loại bỏ các lượt lỗi trợ lý trống.
  - Cắt bớt nội dung trợ lý sau các cuộc gọi công cụ.

Sự phức tạp này gây ra các hồi quy giữa các nhà cung cấp (đặc biệt là `openai-responses` `call_id|fc_id` ghép đôi). Việc dọn dẹp 2026.1.22 đã loại bỏ mở rộng, tập trung logic trong runner, và làm cho OpenAI **không chạm** ngoài việc làm sạch hình ảnh.
