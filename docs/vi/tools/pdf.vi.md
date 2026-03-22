---
title: "PDF Tool"
summary: "Phân tích một hoặc nhiều tài liệu PDF với hỗ trợ native provider và chế độ dự phòng trích xuất"
read_when:
  - Cần phân tích PDF từ agents
  - Cần thông số và giới hạn cụ thể của công cụ PDF
  - Đang debug chế độ PDF native so với dự phòng trích xuất
---

# PDF tool

`pdf` phân tích một hoặc nhiều tài liệu PDF và trả về text.

Tóm tắt nhanh:

- Chế độ native provider cho Anthropic và Google.
- Chế độ dự phòng trích xuất cho các provider khác (trích xuất text trước, sau đó là hình ảnh trang khi cần).
- Hỗ trợ đầu vào đơn (`pdf`) hoặc đa (`pdfs`), tối đa 10 PDF mỗi lần gọi.

## Khả dụng

Công cụ chỉ được đăng ký khi OpenClaw có thể giải quyết cấu hình model hỗ trợ PDF cho agent:

1. `agents.defaults.pdfModel`
2. dự phòng sang `agents.defaults.imageModel`
3. dự phòng theo mặc định của provider dựa trên auth có sẵn

Nếu không thể giải quyết model, công cụ `pdf` không được hiển thị.

## Tham chiếu đầu vào

- `pdf` (`string`): một đường dẫn hoặc URL PDF
- `pdfs` (`string[]`): nhiều đường dẫn hoặc URL PDF, tối đa 10
- `prompt` (`string`): prompt phân tích, mặc định `Analyze this PDF document.`
- `pages` (`string`): lọc trang như `1-5` hoặc `1,3,7-9`
- `model` (`string`): ghi đè model tùy chọn (`provider/model`)
- `maxBytesMb` (`number`): giới hạn kích thước mỗi PDF tính bằng MB

Ghi chú đầu vào:

- `pdf` và `pdfs` được gộp và loại bỏ trùng lặp trước khi tải.
- Nếu không có đầu vào PDF, công cụ sẽ báo lỗi.
- `pages` được phân tích dưới dạng số trang bắt đầu từ 1, loại bỏ trùng lặp, sắp xếp và giới hạn theo số trang tối đa đã cấu hình.
- `maxBytesMb` mặc định là `agents.defaults.pdfMaxBytesMb` hoặc `10`.

## Tham chiếu PDF được hỗ trợ

- Đường dẫn file local (bao gồm mở rộng `~`)
- URL `file://`
- URL `http://` và `https://`

Ghi chú tham chiếu:

- Các scheme URI khác (ví dụ `ftp://`) bị từ chối với lỗi `unsupported_pdf_reference`.
- Trong chế độ sandbox, URL `http(s)` từ xa bị từ chối.
- Với chính sách chỉ cho phép file trong workspace, đường dẫn file local ngoài root cho phép bị từ chối.

## Chế độ thực thi

### Chế độ native provider

Chế độ native dùng cho provider `anthropic` và `google`.
Công cụ gửi trực tiếp bytes PDF thô tới API của provider.

Giới hạn chế độ native:

- `pages` không được hỗ trợ. Nếu đặt, công cụ sẽ báo lỗi.

### Chế độ dự phòng trích xuất

Chế độ dự phòng dùng cho các provider không native.

Luồng hoạt động:

1. Trích xuất text từ các trang đã chọn (tối đa `agents.defaults.pdfMaxPages`, mặc định `20`).
2. Nếu độ dài text trích xuất dưới `200` ký tự, render các trang đã chọn thành hình ảnh PNG và bao gồm chúng.
3. Gửi nội dung trích xuất cùng prompt tới model đã chọn.

Chi tiết dự phòng:

- Trích xuất hình ảnh trang sử dụng ngân sách pixel `4,000,000`.
- Nếu model mục tiêu không hỗ trợ đầu vào hình ảnh và không có text trích xuất được, công cụ sẽ báo lỗi.
- Dự phòng trích xuất yêu cầu `pdfjs-dist` (và `@napi-rs/canvas` để render hình ảnh).

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

Xem [Configuration Reference](/gateway/configuration-reference) để biết chi tiết đầy đủ.

## Chi tiết đầu ra

Công cụ trả về text trong `content[0].text` và metadata có cấu trúc trong `details`.

Các trường `details` phổ biến:

- `model`: model đã giải quyết (`provider/model`)
- `native`: `true` cho chế độ native provider, `false` cho dự phòng
- `attempts`: số lần dự phòng thất bại trước khi thành công

Trường đường dẫn:

- Đầu vào PDF đơn: `details.pdf`
- Đầu vào PDF đa: `details.pdfs[]` với các mục `pdf`
- Metadata viết lại đường dẫn sandbox (khi áp dụng): `rewrittenFrom`

## Hành vi lỗi

- Thiếu đầu vào PDF: báo lỗi `pdf required: provide a path or URL to a PDF document`
- Quá nhiều PDF: trả về lỗi có cấu trúc trong `details.error = "too_many_pdfs"`
- Scheme tham chiếu không được hỗ trợ: trả về `details.error = "unsupported_pdf_reference"`
- Chế độ native với `pages`: báo lỗi rõ ràng `pages is not supported with native PDF providers`

## Ví dụ

PDF đơn:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Nhiều PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Model dự phòng lọc trang:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```\n