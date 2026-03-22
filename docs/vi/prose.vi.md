# OpenProse

OpenProse là định dạng workflow ưu tiên markdown, dễ di chuyển, dùng để điều phối các phiên AI. Trong OpenClaw, OpenProse được cung cấp dưới dạng plugin, cài đặt kèm một bộ kỹ năng OpenProse và lệnh `/prose`. Các chương trình nằm trong file `.prose` và có thể tạo nhiều sub-agent với luồng điều khiển rõ ràng.

Trang chính thức: [https://www.prose.md](https://www.prose.md)

## Khả năng

- Nghiên cứu + tổng hợp đa agent với tính song song rõ ràng.
- Workflow an toàn, có thể lặp lại (code review, xử lý sự cố, pipeline nội dung).
- Chương trình `.prose` tái sử dụng, chạy trên các runtime agent hỗ trợ.

## Cài đặt + kích hoạt

Plugin đi kèm mặc định bị vô hiệu hóa. Kích hoạt OpenProse:

```bash
openclaw plugins enable open-prose
```

Khởi động lại Gateway sau khi kích hoạt plugin.

Dev/local checkout: `openclaw plugins install ./extensions/open-prose`

Tài liệu liên quan: [Plugins](/tools/plugin), [Plugin manifest](/plugins/manifest), [Skills](/tools/skills).

## Lệnh Slash

OpenProse đăng ký `/prose` như một lệnh kỹ năng người dùng có thể gọi. Nó điều hướng đến hướng dẫn VM của OpenProse và sử dụng công cụ OpenClaw.

Các lệnh thường dùng:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Ví dụ: file `.prose` đơn giản

```prose
# Nghiên cứu + tổng hợp với hai agent chạy song song.

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

session "Kết hợp kết quả + bản nháp thành câu trả lời cuối cùng."
context: { findings, draft }
```

## Vị trí file

OpenProse lưu trữ trạng thái dưới `.prose/` trong workspace:

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

Agent cấp người dùng lưu tại:

```
~/.prose/agents/
```

## Chế độ lưu trữ trạng thái

OpenProse hỗ trợ nhiều backend lưu trữ trạng thái:

- **filesystem** (mặc định): `.prose/runs/...`
- **in-context**: tạm thời, cho chương trình nhỏ
- **sqlite** (thử nghiệm): cần binary `sqlite3`
- **postgres** (thử nghiệm): cần `psql` và chuỗi kết nối

Lưu ý:

- sqlite/postgres là tùy chọn và thử nghiệm.
- Thông tin đăng nhập postgres có thể vào log subagent; dùng DB chuyên dụng, quyền hạn tối thiểu.

## Chương trình từ xa

`/prose run <handle/slug>` chuyển thành `https://p.prose.md/<handle>/<slug>`.
URL trực tiếp được fetch nguyên trạng. Dùng công cụ `web_fetch` (hoặc `exec` cho POST).

## Mapping runtime OpenClaw

Chương trình OpenProse map tới các công cụ OpenClaw:

| Khái niệm OpenProse       | Công cụ OpenClaw |
| ------------------------- | ---------------- |
| Spawn session / Task tool | `sessions_spawn` |
| File read/write           | `read` / `write` |
| Web fetch                 | `web_fetch`      |

Nếu danh sách cho phép công cụ của bạn chặn các công cụ này, chương trình OpenProse sẽ thất bại. Xem [Skills config](/tools/skills-config).

## Bảo mật + phê duyệt

Xử lý file `.prose` như code. Kiểm tra trước khi chạy. Dùng danh sách cho phép công cụ OpenClaw và cổng phê duyệt để kiểm soát tác động phụ.

Để có workflow xác định, có cổng phê duyệt, so sánh với [Lobster](/tools/lobster).\n