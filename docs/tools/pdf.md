---
title: "Hướng Dẫn Phân Tích Tài Liệu PDF"
summary: "Khám phá cách phân tích tài liệu PDF hiệu quả với công cụ hỗ trợ và chế độ dự phòng trích xuất. Tối ưu hóa quy trình làm việc của bạn."
read_when:
  - Bạn muốn phân tích PDF từ các agent
  - Bạn cần biết chính xác tham số và giới hạn của công cụ PDF
  - Bạn đang gỡ lỗi chế độ PDF gốc so với chế độ dự phòng trích xuất
---

# Công cụ PDF

`pdf` phân tích một hoặc nhiều tài liệu PDF và trả về văn bản.

Hành vi nhanh:

- Chế độ nhà cung cấp gốc cho các nhà cung cấp mô hình Anthropic và Google.
- Chế độ dự phòng trích xuất cho các nhà cung cấp khác (trích xuất văn bản trước, sau đó là hình ảnh trang khi cần).
- Hỗ trợ đầu vào đơn (`pdf`) hoặc đa (`pdfs`), tối đa 10 PDF mỗi lần gọi.

## Khả dụng

Công cụ chỉ được đăng ký khi OpenClaw có thể giải quyết cấu hình mô hình hỗ trợ PDF cho agent:

1. `agents.defaults.pdfModel`
2. dự phòng sang `agents.defaults.imageModel`
3. dự phòng sang mặc định của nhà cung cấp dựa trên xác thực có sẵn

Nếu không thể giải quyết mô hình sử dụng được, công cụ `pdf` sẽ không được hiển thị.

## Tham chiếu đầu vào

- `pdf` (`string`): một đường dẫn hoặc URL PDF
- `pdfs` (`string[]`): nhiều đường dẫn hoặc URL PDF, tối đa 10
- `prompt` (`string`): yêu cầu phân tích, mặc định là `Analyze this PDF document.`
- `pages` (`string`): bộ lọc trang như `1-5` hoặc `1,3,7-9`
- `model` (`string`): ghi đè mô hình tùy chọn (`provider/model`)
- `maxBytesMb` (`number`): giới hạn kích thước mỗi PDF tính bằng MB

Ghi chú đầu vào:

- `pdf` và `pdfs` được hợp nhất và loại bỏ trùng lặp trước khi tải.
- Nếu không có đầu vào PDF, công cụ sẽ báo lỗi.
- `pages` được phân tích dưới dạng số trang bắt đầu từ 1, loại bỏ trùng lặp, sắp xếp và giới hạn theo số trang tối đa đã cấu hình.
- `maxBytesMb` mặc định là `agents.defaults.pdfMaxBytesMb` hoặc `10`.

## Tham chiếu PDF được hỗ trợ

- đường dẫn tệp cục bộ (bao gồm mở rộng `~`)
- URL `file://`
- URL `http://` và `https://`

Ghi chú tham chiếu:

- Các giao thức URI khác (ví dụ `ftp://`) bị từ chối với lỗi `unsupported_pdf_reference`.
- Trong chế độ sandbox, URL `http(s)` từ xa bị từ chối.
- Với chính sách chỉ cho phép tệp trong workspace, các đường dẫn tệp cục bộ ngoài các thư mục cho phép bị từ chối.

## Chế độ thực thi

### Chế độ nhà cung cấp gốc

Chế độ gốc được sử dụng cho nhà cung cấp `anthropic` và `google`.
Công cụ gửi trực tiếp byte PDF thô đến API của nhà cung cấp.

Giới hạn chế độ gốc:

- `pages` không được hỗ trợ. Nếu được đặt, công cụ sẽ trả về lỗi.

### Chế độ dự phòng trích xuất

Chế độ dự phòng được sử dụng cho các nhà cung cấp không phải gốc.

Quy trình:

1. Trích xuất văn bản từ các trang đã chọn (tối đa `agents.defaults.pdfMaxPages`, mặc định `20`).
2. Nếu độ dài văn bản trích xuất dưới `200` ký tự, chuyển các trang đã chọn thành hình ảnh PNG và bao gồm chúng.
3. Gửi nội dung đã trích xuất cùng yêu cầu đến mô hình đã chọn.

Chi tiết dự phòng:

- Trích xuất hình ảnh trang sử dụng ngân sách pixel là `4,000,000`.
- Nếu mô hình mục tiêu không hỗ trợ đầu vào hình ảnh và không có văn bản nào có thể trích xuất, công cụ sẽ báo lỗi.
- Dự phòng trích xuất yêu cầu `pdfjs-dist` (và `@napi-rs/canvas` để kết xuất hình ảnh).

## Cấu hình

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Xem [Tham chiếu Cấu hình](/gateway/configuration-reference) để biết chi tiết đầy đủ về các trường.

## Chi tiết đầu ra

Công cụ trả về văn bản trong `content[0].text` và metadata có cấu trúc trong `details`.

Các trường `details` phổ biến:

- `model`: tham chiếu mô hình đã giải quyết (`provider/model`)
- `native`: `true` cho chế độ nhà cung cấp gốc, `false` cho dự phòng
- `attempts`: số lần thử dự phòng thất bại trước khi thành công

Các trường đường dẫn:

- đầu vào PDF đơn: `details.pdf`
- đầu vào PDF đa: `details.pdfs[]` với các mục `pdf`
- metadata viết lại đường dẫn sandbox (khi áp dụng): `rewrittenFrom`

## Hành vi lỗi

- Thiếu đầu vào PDF: ném lỗi `pdf required: provide a path or URL to a PDF document`
- Quá nhiều PDF: trả về lỗi có cấu trúc trong `details.error = "too_many_pdfs"`
- Tham chiếu không được hỗ trợ: trả về `details.error = "unsupported_pdf_reference"`
- Chế độ gốc với `pages`: ném lỗi rõ ràng `pages is not supported with native PDF providers`

## Ví dụ

PDF đơn:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Tóm tắt báo cáo này trong 5 gạch đầu dòng"
}
```

Nhiều PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "So sánh rủi ro và thay đổi thời gian giữa cả hai tài liệu"
}
```

Mô hình dự phòng có lọc trang:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5-mini",
  "prompt": "Chỉ trích xuất các sự cố ảnh hưởng đến khách hàng"
}
```
