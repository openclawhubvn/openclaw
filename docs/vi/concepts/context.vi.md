---
summary: "Context: mô hình thấy gì, cách xây dựng và cách kiểm tra"
read_when:
  - Muốn hiểu "context" trong OpenClaw là gì
  - Đang debug lý do mô hình "biết" hoặc quên thông tin
  - Muốn giảm tải context (/context, /status, /compact)
title: "Context"
---

# Context

“Context” là **tất cả những gì OpenClaw gửi đến mô hình để chạy**. Nó bị giới hạn bởi **context window** của mô hình (giới hạn token).

Mô hình tư duy cơ bản:

- **System prompt** (do OpenClaw tạo): quy tắc, công cụ, danh sách kỹ năng, thời gian/thời gian chạy, và các file workspace được chèn vào.
- **Lịch sử hội thoại**: tin nhắn của bạn + tin nhắn của trợ lý trong phiên này.
- **Lệnh công cụ/kết quả + tệp đính kèm**: đầu ra lệnh, đọc file, hình ảnh/âm thanh, v.v.

Context _không giống_ với “memory”: memory có thể lưu trên đĩa và tải lại sau; context là những gì nằm trong cửa sổ hiện tại của mô hình.

## Bắt đầu nhanh (kiểm tra context)

- `/status` → xem nhanh “cửa sổ đầy bao nhiêu?” + cài đặt phiên.
- `/context list` → những gì được chèn vào + kích thước sơ bộ (mỗi file + tổng).
- `/context detail` → phân tích sâu hơn: kích thước mỗi file, mỗi schema công cụ, mỗi mục kỹ năng, và kích thước system prompt.
- `/usage tokens` → thêm footer sử dụng mỗi lần trả lời vào các trả lời thông thường.
- `/compact` → tóm tắt lịch sử cũ thành một mục gọn để giải phóng không gian cửa sổ.

Xem thêm: [Slash commands](/tools/slash-commands), [Token use & costs](/reference/token-use), [Compaction](/concepts/compaction).

## Ví dụ đầu ra

Giá trị thay đổi theo mô hình, provider, chính sách công cụ, và những gì có trong workspace.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 20,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## Những gì tính vào context window

Tất cả những gì mô hình nhận được đều tính vào, bao gồm:

- System prompt (tất cả các phần).
- Lịch sử hội thoại.
- Lệnh công cụ + kết quả công cụ.
- Tệp đính kèm/bản ghi (hình ảnh/âm thanh/tệp).
- Tóm tắt compaction và các artifact pruning.
- “Wrappers” của provider hoặc headers ẩn (không thấy, nhưng vẫn tính).

## Cách OpenClaw xây dựng system prompt

System prompt là **do OpenClaw sở hữu** và được xây dựng lại mỗi lần chạy. Nó bao gồm:

- Danh sách công cụ + mô tả ngắn.
- Danh sách kỹ năng (chỉ metadata; xem bên dưới).
- Vị trí workspace.
- Thời gian (UTC + thời gian người dùng nếu cấu hình).
- Metadata thời gian chạy (host/OS/mô hình/suy nghĩ).
- Các file bootstrap workspace được chèn vào dưới **Project Context**.

Phân tích đầy đủ: [System Prompt](/concepts/system-prompt).

## File workspace được chèn vào (Project Context)

Mặc định, OpenClaw chèn một tập hợp cố định các file workspace (nếu có):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ lần đầu chạy)

Các file lớn bị cắt ngắn theo từng file bằng `agents.defaults.bootstrapMaxChars` (mặc định `20000` chars). OpenClaw cũng áp dụng giới hạn tổng bootstrap trên các file với `agents.defaults.bootstrapTotalMaxChars` (mặc định `150000` chars). `/context` hiển thị kích thước **raw vs injected** và liệu có cắt ngắn hay không.

Khi cắt ngắn xảy ra, runtime có thể chèn một block cảnh báo trong prompt dưới Project Context. Cấu hình với `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; mặc định `once`).

## Kỹ năng: chèn vào vs tải khi cần

System prompt bao gồm danh sách **kỹ năng** gọn (tên + mô tả + vị trí). Danh sách này có overhead thực sự.

Hướng dẫn kỹ năng _không_ được chèn vào mặc định. Mô hình được kỳ vọng sẽ `read` `SKILL.md` của kỹ năng **chỉ khi cần**.

## Công cụ: có hai chi phí

Công cụ ảnh hưởng đến context theo hai cách:

1. **Văn bản danh sách công cụ** trong system prompt (những gì bạn thấy là “Tooling”).
2. **Tool schemas** (JSON). Chúng được gửi đến mô hình để nó có thể gọi công cụ. Chúng tính vào context dù bạn không thấy chúng dưới dạng văn bản thuần.

`/context detail` phân tích các schema công cụ lớn nhất để bạn thấy cái nào chiếm ưu thế.

## Lệnh, chỉ thị, và "inline shortcuts"

Slash commands được xử lý bởi Gateway. Có một số hành vi khác nhau:

- **Lệnh độc lập**: một tin nhắn chỉ có `/...` chạy như một lệnh.
- **Chỉ thị**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` bị loại bỏ trước khi mô hình thấy tin nhắn.
  - Tin nhắn chỉ có chỉ thị duy trì cài đặt phiên.
  - Chỉ thị trong một tin nhắn thông thường hoạt động như gợi ý cho từng tin nhắn.
- **Inline shortcuts** (chỉ cho phép người gửi trong danh sách trắng): một số token `/...` trong một tin nhắn thông thường có thể chạy ngay lập tức (ví dụ: “hey /status”), và bị loại bỏ trước khi mô hình thấy văn bản còn lại.

Chi tiết: [Slash commands](/tools/slash-commands).

## Phiên, compaction, và pruning (những gì tồn tại)

Những gì tồn tại qua các tin nhắn phụ thuộc vào cơ chế:

- **Lịch sử thông thường** tồn tại trong bản ghi phiên cho đến khi được compact/prune theo chính sách.
- **Compaction** lưu một tóm tắt vào bản ghi và giữ lại các tin nhắn gần đây.
- **Pruning** loại bỏ kết quả công cụ cũ khỏi prompt _trong bộ nhớ_ cho một lần chạy, nhưng không viết lại bản ghi.

Tài liệu: [Session](/concepts/session), [Compaction](/concepts/compaction), [Session pruning](/concepts/session-pruning).

Mặc định, OpenClaw sử dụng `legacy` context engine tích hợp sẵn cho việc lắp ráp và compaction. Nếu cài đặt một plugin cung cấp `kind: "context-engine"` và chọn nó với `plugins.slots.contextEngine`, OpenClaw ủy quyền lắp ráp context, `/compact`, và các hook vòng đời subagent liên quan đến context cho engine đó. `ownsCompaction: false` không tự động quay lại engine legacy; engine đang hoạt động vẫn phải triển khai `compact()` đúng cách. Xem [Context Engine](/concepts/context-engine) để biết giao diện pluggable đầy đủ, các hook vòng đời, và cấu hình.

## Những gì `/context` thực sự báo cáo

`/context` ưu tiên báo cáo system prompt **run-built** mới nhất khi có sẵn:

- `System prompt (run)` = được ghi lại từ lần chạy nhúng (có khả năng công cụ) cuối cùng và lưu trữ trong session store.
- `System prompt (estimate)` = tính toán ngay khi không có báo cáo chạy (hoặc khi chạy qua CLI backend không tạo báo cáo).

Dù cách nào, nó báo cáo kích thước và các yếu tố đóng góp hàng đầu; nó **không** dump toàn bộ system prompt hoặc tool schemas.\n