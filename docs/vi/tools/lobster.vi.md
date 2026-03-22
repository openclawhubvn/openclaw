---
title: Lobster
summary: "Runtime workflow có kiểu cho OpenClaw với các điểm dừng phê duyệt có thể tiếp tục."
read_when:
  - Cần workflow nhiều bước có phê duyệt rõ ràng
  - Muốn tiếp tục workflow mà không chạy lại các bước trước

---

# Lobster

Lobster là một shell workflow cho phép OpenClaw chạy chuỗi công cụ nhiều bước như một thao tác duy nhất, có các điểm dừng phê duyệt rõ ràng.

## Hook

Assistant có thể tự xây dựng công cụ quản lý. Yêu cầu một workflow, và sau 30 phút có ngay CLI cùng các pipeline chạy như một lệnh duy nhất. Lobster là mảnh ghép còn thiếu: pipeline có kiểu, phê duyệt rõ ràng, và trạng thái có thể tiếp tục.

## Tại sao

Hiện nay, workflow phức tạp cần nhiều lần gọi công cụ qua lại. Mỗi lần gọi tốn token, và LLM phải điều phối từng bước. Lobster chuyển điều phối đó vào runtime có kiểu:

- **Một lần gọi thay vì nhiều**: OpenClaw chạy một lệnh Lobster và nhận kết quả có cấu trúc.
- **Phê duyệt tích hợp**: Tác động phụ (gửi email, đăng bình luận) dừng workflow cho đến khi được phê duyệt.
- **Có thể tiếp tục**: Workflow bị dừng trả về token; phê duyệt và tiếp tục mà không cần chạy lại.

## Tại sao dùng DSL thay vì chương trình thông thường?

Lobster cố tình nhỏ gọn. Mục tiêu không phải "ngôn ngữ mới", mà là spec pipeline dễ đoán, thân thiện với AI, có phê duyệt và token tiếp tục.

- **Phê duyệt/tiếp tục tích hợp**: Chương trình thông thường có thể nhắc nhở người dùng, nhưng không thể _dừng và tiếp tục_ với token bền vững mà không tự tạo runtime.
- **Tính xác định + khả năng kiểm toán**: Pipeline là dữ liệu, dễ log, diff, replay, và review.
- **Giới hạn bề mặt cho AI**: Ngữ pháp nhỏ + JSON piping giảm đường dẫn code "sáng tạo" và làm cho việc xác thực thực tế.
- **Chính sách an toàn tích hợp**: Timeout, giới hạn output, kiểm tra sandbox, và allowlist được enforced bởi runtime, không phải từng script.
- **Vẫn có thể lập trình**: Mỗi bước có thể gọi bất kỳ CLI hay script nào. Nếu muốn JS/TS, tạo file `.lobster` từ code.

## Cách hoạt động

OpenClaw khởi chạy CLI `lobster` local ở **chế độ công cụ** và phân tích JSON từ stdout. Nếu pipeline dừng để phê duyệt, công cụ trả về `resumeToken` để tiếp tục sau.

## Mẫu: CLI nhỏ + JSON pipes + phê duyệt

Xây dựng lệnh nhỏ nói chuyện bằng JSON, rồi xâu chuỗi chúng thành một lệnh Lobster duy nhất. (Tên lệnh dưới đây chỉ là ví dụ — thay bằng của bạn.)

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

AI kích hoạt workflow; Lobster thực thi các bước. Cổng phê duyệt giữ cho tác động phụ rõ ràng và có thể kiểm toán.

Ví dụ: ánh xạ các mục đầu vào thành các lệnh công cụ:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Bước LLM chỉ dùng JSON (llm-task)

Với workflow cần bước LLM có cấu trúc, bật công cụ plugin `llm-task` tùy chọn và gọi từ Lobster. Điều này giữ cho workflow có kiểu trong khi vẫn cho phép phân loại/tóm tắt/soạn thảo với mô hình.

Bật công cụ:

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

Sử dụng trong pipeline:

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

## File Workflow (.lobster)

Lobster có thể chạy file workflow YAML/JSON với các trường `name`, `args`, `steps`, `env`, `condition`, và `approval`. Trong các lệnh công cụ OpenClaw, đặt `pipeline` thành đường dẫn file.

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

Ghi chú:

- `stdin: $step.stdout` và `stdin: $step.json` truyền output của bước trước.
- `condition` (hoặc `when`) có thể chặn bước dựa trên `$step.approved`.

## Cài đặt Lobster

Cài đặt CLI Lobster trên **cùng host** chạy OpenClaw Gateway (xem [repo Lobster](https://github.com/openclaw/lobster)), và đảm bảo `lobster` có trong `PATH`.

## Bật công cụ

Lobster là công cụ plugin **tùy chọn** (không bật mặc định).

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

Tránh dùng `tools.allow: ["lobster"]` trừ khi muốn chạy ở chế độ allowlist hạn chế.

Lưu ý: allowlist là tùy chọn cho plugin. Nếu allowlist chỉ định tên công cụ plugin (như `lobster`), OpenClaw giữ công cụ core bật. Để hạn chế công cụ core, thêm công cụ core hoặc nhóm vào allowlist.

## Ví dụ: Phân loại email

Không dùng Lobster:

```
User: "Kiểm tra email và soạn thảo trả lời"
→ openclaw gọi gmail.list
→ LLM tóm tắt
→ User: "soạn thảo trả lời cho #2 và #5"
→ LLM soạn thảo
→ User: "gửi #2"
→ openclaw gọi gmail.send
(lặp lại hàng ngày, không nhớ đã phân loại gì)
```

Dùng Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Trả về JSON envelope (rút gọn):

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

Chạy pipeline ở chế độ công cụ.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Chạy file workflow với args:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Tiếp tục workflow bị dừng sau khi phê duyệt.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Đầu vào tùy chọn

- `cwd`: Thư mục làm việc tương đối cho pipeline (phải nằm trong thư mục làm việc của tiến trình hiện tại).
- `timeoutMs`: Dừng subprocess nếu vượt quá thời gian này (mặc định: 20000).
- `maxStdoutBytes`: Dừng subprocess nếu stdout vượt quá kích thước này (mặc định: 512000).
- `argsJson`: Chuỗi JSON truyền vào `lobster run --args-json` (chỉ file workflow).

## JSON envelope đầu ra

Lobster trả về JSON envelope với một trong ba trạng thái:

- `ok` → hoàn thành thành công
- `needs_approval` → dừng; `requiresApproval.resumeToken` cần để tiếp tục
- `cancelled` → từ chối hoặc hủy bỏ rõ ràng

Công cụ hiển thị envelope trong cả `content` (JSON đẹp) và `details` (đối tượng thô).

## Phê duyệt

Nếu `requiresApproval` có mặt, kiểm tra prompt và quyết định:

- `approve: true` → tiếp tục và thực hiện tác động phụ
- `approve: false` → hủy và kết thúc workflow

Dùng `approve --preview-from-stdin --limit N` để đính kèm JSON preview vào yêu cầu phê duyệt mà không cần jq/heredoc tùy chỉnh. Token tiếp tục giờ nhỏ gọn: Lobster lưu trạng thái tiếp tục workflow dưới thư mục trạng thái và trả lại khóa token nhỏ.

## OpenProse

OpenProse kết hợp tốt với Lobster: dùng `/prose` để điều phối chuẩn bị nhiều agent, sau đó chạy pipeline Lobster cho phê duyệt có kiểu. Nếu chương trình Prose cần Lobster, cho phép công cụ `lobster` cho sub-agent qua `tools.subagents.tools`. Xem [OpenProse](/prose).

## An toàn

- **Chỉ subprocess local** — không có cuộc gọi mạng từ plugin.
- **Không có bí mật** — Lobster không quản lý OAuth; nó gọi công cụ OpenClaw thực hiện.
- **Nhận biết sandbox** — bị vô hiệu khi ngữ cảnh công cụ bị sandbox.
- **Cứng cáp** — tên thực thi cố định (`lobster`) trên `PATH`; enforced timeout và giới hạn output.

## Khắc phục sự cố

- **`lobster subprocess timed out`** → tăng `timeoutMs`, hoặc chia nhỏ pipeline dài.
- **`lobster output exceeded maxStdoutBytes`** → tăng `maxStdoutBytes` hoặc giảm kích thước output.
- **`lobster returned invalid JSON`** → đảm bảo pipeline chạy ở chế độ công cụ và chỉ in JSON.
- **`lobster failed (code …)`** → chạy cùng pipeline trong terminal để kiểm tra stderr.

## Tìm hiểu thêm

- [Plugins](/tools/plugin)
- [Tạo công cụ plugin](/plugins/building-plugins#registering-agent-tools)

## Case study: workflow cộng đồng

Một ví dụ công khai: CLI "bộ não thứ hai" + pipeline Lobster quản lý ba vault Markdown (cá nhân, đối tác, chia sẻ). CLI xuất JSON cho thống kê, danh sách inbox, và quét cũ; Lobster xâu chuỗi các lệnh thành workflow như `weekly-review`, `inbox-triage`, `memory-consolidation`, và `shared-task-sync`, mỗi cái có cổng phê duyệt. AI xử lý phán đoán (phân loại) khi có sẵn và quay lại quy tắc xác định khi không có.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)\n