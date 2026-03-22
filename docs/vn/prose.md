---
summary: "OpenProse: quy trình .prose, lệnh gạch chéo, và trạng thái trong OpenClaw"
read_when:
  - Bạn muốn chạy hoặc viết quy trình .prose
  - Bạn muốn kích hoạt plugin OpenProse
  - Bạn cần hiểu về lưu trữ trạng thái
title: "OpenProse"
---

# OpenProse

OpenProse là một định dạng quy trình làm việc di động, ưu tiên markdown để điều phối các phiên AI. Trong OpenClaw, nó được cung cấp dưới dạng một plugin cài đặt gói kỹ năng OpenProse cùng với lệnh gạch chéo `/prose`. Các chương trình tồn tại trong các tệp `.prose` và có thể tạo ra nhiều tác nhân phụ với luồng điều khiển rõ ràng.

Trang chính thức: [https://www.prose.md](https://www.prose.md)

## Khả năng

- Nghiên cứu và tổng hợp đa tác nhân với tính song song rõ ràng.
- Quy trình làm việc có thể lặp lại và an toàn cho phê duyệt (xem xét mã, phân loại sự cố, quy trình nội dung).
- Các chương trình `.prose` có thể tái sử dụng và chạy trên các môi trường tác nhân được hỗ trợ.

## Cài đặt và kích hoạt

Các plugin đi kèm bị vô hiệu hóa theo mặc định. Để kích hoạt OpenProse:

```bash
openclaw plugins enable open-prose
```

Khởi động lại Gateway sau khi kích hoạt plugin.

Kiểm tra dev/cục bộ: `openclaw plugins install ./extensions/open-prose`

Tài liệu liên quan: [Plugins](/tools/plugin), [Plugin manifest](/plugins/manifest), [Skills](/tools/skills).

## Lệnh gạch chéo

OpenProse đăng ký `/prose` như một lệnh kỹ năng mà người dùng có thể gọi. Nó điều hướng đến các hướng dẫn VM của OpenProse và sử dụng các công cụ của OpenClaw.

Các lệnh phổ biến:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Ví dụ: một tệp `.prose` đơn giản

```prose
# Nghiên cứu và tổng hợp với hai tác nhân chạy song song.

input topic: "Chúng ta nên nghiên cứu gì?"

agent researcher:
  model: sonnet
  prompt: "Bạn nghiên cứu kỹ lưỡng và trích dẫn nguồn."

agent writer:
  model: opus
  prompt: "Bạn viết một bản tóm tắt ngắn gọn."

parallel:
  findings = session: researcher
    prompt: "Nghiên cứu {topic}."
  draft = session: writer
    prompt: "Tóm tắt {topic}."

session "Kết hợp các phát hiện và bản nháp thành câu trả lời cuối cùng."
context: { findings, draft }
```

## Vị trí tệp

OpenProse lưu trữ trạng thái dưới thư mục `.prose/` trong workspace của bạn:

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Các tác nhân lưu trữ lâu dài ở cấp người dùng nằm tại:

```
~/.prose/agents/
```

## Chế độ trạng thái

OpenProse hỗ trợ nhiều backend trạng thái:

- **filesystem** (mặc định): `.prose/runs/...`
- **in-context**: tạm thời, cho các chương trình nhỏ
- **sqlite** (thử nghiệm): yêu cầu binary `sqlite3`
- **postgres** (thử nghiệm): yêu cầu `psql` và chuỗi kết nối

Lưu ý:

- sqlite/postgres là tùy chọn và đang thử nghiệm.
- Thông tin đăng nhập postgres sẽ xuất hiện trong nhật ký tác nhân phụ; sử dụng cơ sở dữ liệu chuyên dụng, ít quyền nhất.

## Chương trình từ xa

`/prose run <handle/slug>` sẽ chuyển thành `https://p.prose.md/<handle>/<slug>`.
Các URL trực tiếp được lấy nguyên trạng. Điều này sử dụng công cụ `web_fetch` (hoặc `exec` cho POST).

## Ánh xạ runtime OpenClaw

Các chương trình OpenProse ánh xạ đến các công cụ OpenClaw:

| Khái niệm OpenProse       | Công cụ OpenClaw |
| ------------------------- | ---------------- |
| Tạo phiên / Công cụ Task  | `sessions_spawn` |
| Đọc/ghi tệp               | `read` / `write` |
| Lấy dữ liệu web           | `web_fetch`      |

Nếu danh sách cho phép công cụ của bạn chặn các công cụ này, các chương trình OpenProse sẽ thất bại. Xem [Cấu hình kỹ năng](/tools/skills-config).

## Bảo mật và phê duyệt

Xem các tệp `.prose` như mã nguồn. Kiểm tra trước khi chạy. Sử dụng danh sách cho phép công cụ OpenClaw và cổng phê duyệt để kiểm soát các tác động phụ.

Đối với các quy trình làm việc có thể dự đoán và được phê duyệt, hãy so sánh với [Lobster](/tools/lobster).
