---
title: Lobster
summary: "Runtime workflow có kiểu cho OpenClaw với các điểm dừng phê duyệt có thể tiếp tục."
read_when:
  - Bạn muốn có các quy trình nhiều bước xác định với phê duyệt rõ ràng
  - Bạn cần tiếp tục một quy trình mà không phải chạy lại các bước trước đó
---

# Lobster

Lobster là một shell workflow cho phép OpenClaw thực hiện các chuỗi công cụ nhiều bước như một thao tác duy nhất, xác định với các điểm dừng phê duyệt rõ ràng.

## Hook

Trợ lý của bạn có thể xây dựng các công cụ để tự quản lý. Yêu cầu một workflow, và sau 30 phút bạn có một CLI cùng với các pipeline chạy như một lệnh duy nhất. Lobster là mảnh ghép còn thiếu: pipeline xác định, phê duyệt rõ ràng, và trạng thái có thể tiếp tục.

## Tại sao

Hiện nay, các quy trình phức tạp yêu cầu nhiều lần gọi công cụ qua lại. Mỗi lần gọi tốn token, và LLM phải điều phối từng bước. Lobster chuyển việc điều phối đó vào một runtime có kiểu:

- **Một lần gọi thay vì nhiều lần**: OpenClaw thực hiện một lần gọi công cụ Lobster và nhận kết quả có cấu trúc.
- **Phê duyệt tích hợp**: Các tác động phụ (gửi email, đăng bình luận) dừng quy trình cho đến khi được phê duyệt rõ ràng.
- **Có thể tiếp tục**: Quy trình bị dừng trả về một token; phê duyệt và tiếp tục mà không cần chạy lại mọi thứ.

## Tại sao dùng DSL thay vì chương trình thông thường?

Lobster được thiết kế nhỏ gọn. Mục tiêu không phải là "một ngôn ngữ mới," mà là một đặc tả pipeline thân thiện với AI, có phê duyệt và token tiếp tục là tính năng chính.

- **Phê duyệt/tiếp tục tích hợp**: Một chương trình thông thường có thể nhắc nhở con người, nhưng không thể _tạm dừng và tiếp tục_ với một token bền vững mà không cần bạn tự tạo runtime đó.
- **Xác định + có thể kiểm tra**: Pipeline là dữ liệu, nên dễ dàng ghi log, so sánh, chạy lại và xem xét.
- **Giới hạn bề mặt cho AI**: Ngữ pháp nhỏ + JSON piping giảm các đường dẫn mã "sáng tạo" và làm cho việc xác thực trở nên thực tế.
- **Chính sách an toàn tích hợp**: Thời gian chờ, giới hạn đầu ra, kiểm tra sandbox và danh sách cho phép được thực thi bởi runtime, không phải từng script.
- **Vẫn có thể lập trình**: Mỗi bước có thể gọi bất kỳ CLI hoặc script nào. Nếu bạn muốn JS/TS, tạo file `.lobster` từ mã.

## Cách hoạt động

OpenClaw khởi chạy CLI `lobster` cục bộ ở chế độ **tool mode** và phân tích một phong bì JSON từ stdout. Nếu pipeline tạm dừng để phê duyệt, công cụ trả về một `resumeToken` để bạn có thể tiếp tục sau.

## Mẫu: CLI nhỏ + JSON pipes + phê duyệt

Xây dựng các lệnh nhỏ nói chuyện bằng JSON, sau đó xâu chuỗi chúng thành một lần gọi Lobster duy nhất. (Tên lệnh ví dụ dưới đây — thay thế bằng của bạn.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Nếu pipeline yêu cầu phê duyệt, tiếp tục với token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI kích hoạt workflow; Lobster thực hiện các bước. Các điểm dừng phê duyệt giữ cho tác động phụ rõ ràng và có thể kiểm tra.

Ví dụ: ánh xạ các mục đầu vào thành các lần gọi công cụ:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Bước LLM chỉ dùng JSON (llm-task)

Đối với các workflow cần một **bước LLM có cấu trúc**, kích hoạt công cụ plugin `llm-task` tùy chọn và gọi nó từ Lobster. Điều này giữ cho workflow xác định trong khi vẫn cho phép bạn phân loại/tóm tắt/soạn thảo với một mô hình.

Kích hoạt công cụ:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

Sử dụng nó trong một pipeline:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Xem [LLM Task](/tools/llm-task) để biết chi tiết và tùy chọn cấu hình.

## File workflow (.lobster)

Lobster có thể chạy các file workflow YAML/JSON với các trường `name`, `args`, `steps`, `env`, `condition`, và `approval`. Trong các lần gọi công cụ OpenClaw, đặt `pipeline` thành đường dẫn file.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Lưu ý:

- `stdin: $step.stdout` và `stdin: $step.json` truyền đầu ra của bước trước đó.
- `condition` (hoặc `when`) có thể chặn các bước dựa trên `$step.approved`.

## Cài đặt Lobster

Cài đặt CLI Lobster trên **cùng máy chủ** chạy OpenClaw Gateway (xem [Lobster repo](https://github.com/openclaw/lobster)), và đảm bảo `lobster` có trong `PATH`.

## Kích hoạt công cụ

Lobster là một công cụ plugin **tùy chọn** (không được kích hoạt mặc định).

Khuyến nghị (bổ sung, an toàn):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Hoặc theo từng agent:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

Tránh sử dụng `tools.allow: ["lobster"]` trừ khi bạn định chạy ở chế độ danh sách cho phép hạn chế.

Lưu ý: danh sách cho phép là tùy chọn cho các plugin tùy chọn. Nếu danh sách cho phép của bạn chỉ định tên công cụ plugin (như `lobster`), OpenClaw vẫn giữ các công cụ cốt lõi được kích hoạt. Để hạn chế các công cụ cốt lõi, bao gồm cả các công cụ hoặc nhóm cốt lõi bạn muốn trong danh sách cho phép.

## Ví dụ: Phân loại email

Không có Lobster:

```
Người dùng: "Kiểm tra email của tôi và soạn thảo trả lời"
→ openclaw gọi gmail.list
→ LLM tóm tắt
→ Người dùng: "soạn thảo trả lời cho #2 và #5"
→ LLM soạn thảo
→ Người dùng: "gửi #2"
→ openclaw gọi gmail.send
(lặp lại hàng ngày, không có bộ nhớ về những gì đã được phân loại)
```

Với Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Trả về một phong bì JSON (rút gọn):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 cần trả lời, 2 cần hành động" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Gửi 2 bản nháp trả lời?",
    "items": [],
    "resumeToken": "..."
  }
}
```

Người dùng phê duyệt → tiếp tục:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Một workflow. Xác định. An toàn.

## Tham số công cụ

### `run`

Chạy một pipeline ở chế độ công cụ.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Chạy một file workflow với args:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Tiếp tục một workflow bị dừng sau khi phê duyệt.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Đầu vào tùy chọn

- `cwd`: Thư mục làm việc tương đối cho pipeline (phải nằm trong thư mục làm việc của tiến trình hiện tại).
- `timeoutMs`: Dừng tiến trình con nếu vượt quá thời gian này (mặc định: 20000).
- `maxStdoutBytes`: Dừng tiến trình con nếu stdout vượt quá kích thước này (mặc định: 512000).
- `argsJson`: Chuỗi JSON được truyền vào `lobster run --args-json` (chỉ dành cho file workflow).

## Phong bì đầu ra

Lobster trả về một phong bì JSON với một trong ba trạng thái:

- `ok` → hoàn thành thành công
- `needs_approval` → tạm dừng; `requiresApproval.resumeToken` cần thiết để tiếp tục
- `cancelled` → bị từ chối hoặc hủy bỏ rõ ràng

Công cụ hiển thị phong bì trong cả `content` (JSON đẹp) và `details` (đối tượng thô).

## Phê duyệt

Nếu `requiresApproval` có mặt, kiểm tra prompt và quyết định:

- `approve: true` → tiếp tục và thực hiện các tác động phụ
- `approve: false` → hủy bỏ và hoàn tất workflow

Sử dụng `approve --preview-from-stdin --limit N` để đính kèm một bản xem trước JSON vào các yêu cầu phê duyệt mà không cần dán nhãn jq/heredoc tùy chỉnh. Token tiếp tục hiện nay nhỏ gọn: Lobster lưu trữ trạng thái tiếp tục workflow dưới thư mục trạng thái của nó và trả lại một khóa token nhỏ.

## OpenProse

OpenProse kết hợp tốt với Lobster: sử dụng `/prose` để điều phối chuẩn bị nhiều agent, sau đó chạy một pipeline Lobster để có phê duyệt xác định. Nếu một chương trình Prose cần Lobster, cho phép công cụ `lobster` cho các sub-agent thông qua `tools.subagents.tools`. Xem [OpenProse](/prose).

## An toàn

- **Chỉ tiến trình con cục bộ** — không có cuộc gọi mạng từ chính plugin.
- **Không có bí mật** — Lobster không quản lý OAuth; nó gọi các công cụ OpenClaw thực hiện điều đó.
- **Nhận biết sandbox** — bị vô hiệu hóa khi ngữ cảnh công cụ bị sandbox.
- **Được bảo vệ** — tên thực thi cố định (`lobster`) trên `PATH`; thời gian chờ và giới hạn đầu ra được thực thi.

## Khắc phục sự cố

- **`lobster subprocess timed out`** → tăng `timeoutMs`, hoặc chia nhỏ một pipeline dài.
- **`lobster output exceeded maxStdoutBytes`** → tăng `maxStdoutBytes` hoặc giảm kích thước đầu ra.
- **`lobster returned invalid JSON`** → đảm bảo pipeline chạy ở chế độ công cụ và chỉ in JSON.
- **`lobster failed (code …)`** → chạy cùng pipeline trong terminal để kiểm tra stderr.

## Tìm hiểu thêm

- [Plugins](/tools/plugin)
- [Tạo công cụ plugin](/plugins/building-plugins#registering-agent-tools)

## Nghiên cứu trường hợp: quy trình cộng đồng

Một ví dụ công khai: một CLI "bộ não thứ hai" + các pipeline Lobster quản lý ba kho Markdown (cá nhân, đối tác, chia sẻ). CLI phát ra JSON cho thống kê, danh sách hộp thư đến, và quét cũ; Lobster xâu chuỗi các lệnh đó thành các workflow như `weekly-review`, `inbox-triage`, `memory-consolidation`, và `shared-task-sync`, mỗi cái có các điểm dừng phê duyệt. AI xử lý phán đoán (phân loại) khi có sẵn và quay lại các quy tắc xác định khi không có.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)
