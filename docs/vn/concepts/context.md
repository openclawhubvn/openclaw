---
summary: "Ngữ cảnh: những gì mô hình thấy, cách nó được xây dựng và cách kiểm tra"
read_when:
  - Bạn muốn hiểu "ngữ cảnh" trong OpenClaw nghĩa là gì
  - Bạn đang gỡ lỗi tại sao mô hình "biết" điều gì đó (hoặc quên nó)
  - Bạn muốn giảm tải ngữ cảnh (/context, /status, /compact)
title: "Ngữ cảnh"
---

# Ngữ cảnh

"Ngữ cảnh" là **tất cả những gì OpenClaw gửi đến mô hình để thực thi**. Nó bị giới hạn bởi **cửa sổ ngữ cảnh** của mô hình (giới hạn token).

Mô hình tư duy cho người mới bắt đầu:

- **System prompt** (do OpenClaw tạo): quy tắc, công cụ, danh sách kỹ năng, thời gian/thời gian chạy, và các tệp workspace được chèn vào.
- **Lịch sử hội thoại**: tin nhắn của bạn + tin nhắn của trợ lý trong phiên này.
- **Lệnh công cụ/kết quả + tệp đính kèm**: đầu ra lệnh, đọc tệp, hình ảnh/âm thanh, v.v.

Ngữ cảnh _không giống_ như "bộ nhớ": bộ nhớ có thể được lưu trữ trên đĩa và tải lại sau; ngữ cảnh là những gì nằm trong cửa sổ hiện tại của mô hình.

## Bắt đầu nhanh (kiểm tra ngữ cảnh)

- `/status` → xem nhanh "cửa sổ của tôi đầy bao nhiêu?" + cài đặt phiên.
- `/context list` → những gì được chèn vào + kích thước sơ bộ (mỗi tệp + tổng cộng).
- `/context detail` → phân tích sâu hơn: kích thước từng tệp, từng công cụ, từng mục kỹ năng, và kích thước system prompt.
- `/usage tokens` → thêm footer sử dụng theo từng phản hồi vào các phản hồi thông thường.
- `/compact` → tóm tắt lịch sử cũ thành một mục gọn để giải phóng không gian cửa sổ.

Xem thêm: [Slash commands](/tools/slash-commands), [Token use & costs](/reference/token-use), [Compaction](/concepts/compaction).

## Ví dụ đầu ra

Giá trị thay đổi theo mô hình, nhà cung cấp, chính sách công cụ và những gì có trong workspace của bạn.

### `/context list`

```
🧠 Phân tích ngữ cảnh
Workspace: <workspaceDir>
Bootstrap tối đa/tệp: 20,000 ký tự
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 ký tự (~9,603 tok) (Ngữ cảnh dự án 23,901 ký tự (~5,976 tok))

Các tệp workspace được chèn vào:
- AGENTS.md: OK | raw 1,742 ký tự (~436 tok) | chèn 1,742 ký tự (~436 tok)
- SOUL.md: OK | raw 912 ký tự (~228 tok) | chèn 912 ký tự (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 ký tự (~13,553 tok) | chèn 20,962 ký tự (~5,241 tok)
- IDENTITY.md: OK | raw 211 ký tự (~53 tok) | chèn 211 ký tự (~53 tok)
- USER.md: OK | raw 388 ký tự (~97 tok) | chèn 388 ký tự (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | chèn 0
- BOOTSTRAP.md: OK | raw 0 ký tự (~0 tok) | chèn 0 ký tự (~0 tok)

Danh sách kỹ năng (văn bản system prompt): 2,184 ký tự (~546 tok) (12 kỹ năng)
Công cụ: đọc, chỉnh sửa, viết, thực thi, xử lý, trình duyệt, tin nhắn, sessions_send, …
Danh sách công cụ (văn bản system prompt): 1,032 ký tự (~258 tok)
Schemas công cụ (JSON): 31,988 ký tự (~7,997 tok) (tính vào ngữ cảnh; không hiển thị dưới dạng văn bản)
Công cụ: (như trên)

Token phiên (đã lưu): 14,250 tổng / ctx=32,000
```

### `/context detail`

```
🧠 Phân tích ngữ cảnh (chi tiết)
…
Kỹ năng hàng đầu (kích thước mục prompt):
- frontend-design: 412 ký tự (~103 tok)
- oracle: 401 ký tự (~101 tok)
… (+10 kỹ năng khác)

Công cụ hàng đầu (kích thước schema):
- trình duyệt: 9,812 ký tự (~2,453 tok)
- thực thi: 6,240 ký tự (~1,560 tok)
… (+N công cụ khác)
```

## Những gì tính vào cửa sổ ngữ cảnh

Mọi thứ mà mô hình nhận được đều tính vào, bao gồm:

- System prompt (tất cả các phần).
- Lịch sử hội thoại.
- Lệnh công cụ + kết quả công cụ.
- Tệp đính kèm/bản ghi (hình ảnh/âm thanh/tệp).
- Tóm tắt nén và các hiện vật cắt tỉa.
- "Wrappers" của nhà cung cấp hoặc tiêu đề ẩn (không hiển thị, vẫn được tính).

## Cách OpenClaw xây dựng system prompt

System prompt là **sở hữu của OpenClaw** và được xây dựng lại mỗi lần chạy. Nó bao gồm:

- Danh sách công cụ + mô tả ngắn.
- Danh sách kỹ năng (chỉ metadata; xem bên dưới).
- Vị trí workspace.
- Thời gian (UTC + thời gian người dùng đã chuyển đổi nếu được cấu hình).
- Metadata thời gian chạy (host/OS/mô hình/suy nghĩ).
- Các tệp bootstrap workspace được chèn vào dưới **Ngữ cảnh dự án**.

Phân tích đầy đủ: [System Prompt](/concepts/system-prompt).

## Các tệp workspace được chèn vào (Ngữ cảnh dự án)

Theo mặc định, OpenClaw chèn một tập hợp cố định các tệp workspace (nếu có):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ lần chạy đầu tiên)

Các tệp lớn bị cắt ngắn theo từng tệp sử dụng `agents.defaults.bootstrapMaxChars` (mặc định `20000` ký tự). OpenClaw cũng áp đặt giới hạn tổng số ký tự bootstrap trên các tệp với `agents.defaults.bootstrapTotalMaxChars` (mặc định `150000` ký tự). `/context` hiển thị kích thước **raw vs chèn** và liệu có xảy ra cắt ngắn hay không.

Khi cắt ngắn xảy ra, thời gian chạy có thể chèn một khối cảnh báo trong prompt dưới Ngữ cảnh dự án. Cấu hình điều này với `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; mặc định `once`).

## Kỹ năng: chèn vào vs tải theo yêu cầu

System prompt bao gồm một danh sách **kỹ năng** gọn (tên + mô tả + vị trí). Danh sách này có tải thực sự.

Hướng dẫn kỹ năng _không_ được bao gồm theo mặc định. Mô hình được kỳ vọng sẽ `đọc` `SKILL.md` của kỹ năng **chỉ khi cần thiết**.

## Công cụ: có hai chi phí

Công cụ ảnh hưởng đến ngữ cảnh theo hai cách:

1. **Văn bản danh sách công cụ** trong system prompt (những gì bạn thấy là "Tooling").
2. **Schemas công cụ** (JSON). Chúng được gửi đến mô hình để nó có thể gọi công cụ. Chúng tính vào ngữ cảnh mặc dù bạn không thấy chúng dưới dạng văn bản thuần túy.

`/context detail` phân tích các schemas công cụ lớn nhất để bạn có thể thấy những gì chiếm ưu thế.

## Lệnh, chỉ thị và "phím tắt nội tuyến"

Slash commands được xử lý bởi Gateway. Có một số hành vi khác nhau:

- **Lệnh độc lập**: một tin nhắn chỉ có `/...` chạy như một lệnh.
- **Chỉ thị**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` được loại bỏ trước khi mô hình thấy tin nhắn.
  - Tin nhắn chỉ có chỉ thị duy trì cài đặt phiên.
  - Chỉ thị nội tuyến trong một tin nhắn thông thường hoạt động như gợi ý theo tin nhắn.
- **Phím tắt nội tuyến** (chỉ người gửi được cho phép): một số token `/...` bên trong một tin nhắn thông thường có thể chạy ngay lập tức (ví dụ: “hey /status”), và được loại bỏ trước khi mô hình thấy văn bản còn lại.

Chi tiết: [Slash commands](/tools/slash-commands).

## Phiên, nén, và cắt tỉa (những gì tồn tại)

Những gì tồn tại qua các tin nhắn phụ thuộc vào cơ chế:

- **Lịch sử thông thường** tồn tại trong bản ghi phiên cho đến khi được nén/cắt tỉa theo chính sách.
- **Nén** tồn tại một tóm tắt vào bản ghi và giữ lại các tin nhắn gần đây.
- **Cắt tỉa** loại bỏ kết quả công cụ cũ khỏi prompt _trong bộ nhớ_ cho một lần chạy, nhưng không viết lại bản ghi.

Tài liệu: [Session](/concepts/session), [Compaction](/concepts/compaction), [Session pruning](/concepts/session-pruning).

Theo mặc định, OpenClaw sử dụng công cụ ngữ cảnh `legacy` tích hợp sẵn để lắp ráp và nén. Nếu bạn cài đặt một plugin cung cấp `kind: "context-engine"` và chọn nó với `plugins.slots.contextEngine`, OpenClaw sẽ ủy quyền lắp ráp ngữ cảnh, `/compact`, và các hook vòng đời ngữ cảnh subagent liên quan cho công cụ đó. `ownsCompaction: false` không tự động quay lại công cụ legacy; công cụ đang hoạt động vẫn phải thực hiện `compact()` đúng cách. Xem [Context Engine](/concepts/context-engine) để biết giao diện có thể cắm đầy đủ, các hook vòng đời, và cấu hình.

## Những gì `/context` thực sự báo cáo

`/context` ưu tiên báo cáo system prompt **được xây dựng trong lần chạy gần nhất** khi có sẵn:

- `System prompt (run)` = được ghi lại từ lần chạy nhúng (có khả năng công cụ) cuối cùng và được lưu trữ trong kho phiên.
- `System prompt (estimate)` = được tính toán ngay khi không có báo cáo chạy (hoặc khi chạy qua backend CLI không tạo báo cáo).

Dù bằng cách nào, nó báo cáo kích thước và các yếu tố đóng góp hàng đầu; nó **không** đổ toàn bộ system prompt hoặc schemas công cụ.
