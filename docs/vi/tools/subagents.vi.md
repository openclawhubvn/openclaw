---
summary: "Sub-agents: tạo các phiên agent độc lập chạy nền và thông báo kết quả về kênh chat yêu cầu"
read_when:
  - Cần chạy nền hoặc song song qua agent
  - Đang thay đổi sessions_spawn hoặc chính sách công cụ sub-agent
  - Đang triển khai hoặc xử lý sự cố các phiên sub-agent gắn với thread
title: "Sub-Agents"
---

# Sub-agents

Sub-agents là các phiên agent chạy nền được tạo từ một phiên agent hiện có. Chúng chạy trong session riêng (`agent:<agentId>:subagent:<uuid>`) và khi hoàn thành, **thông báo** kết quả về kênh chat yêu cầu.

## Lệnh Slash

Dùng `/subagents` để kiểm tra hoặc điều khiển các phiên sub-agent trong **session hiện tại**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Điều khiển gắn thread:

Các lệnh này hoạt động trên các kênh hỗ trợ gắn thread liên tục. Xem **Thread supporting channels** bên dưới.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` hiển thị metadata của phiên chạy (trạng thái, timestamps, session id, transcript path, cleanup).

### Hành vi Spawn

`/subagents spawn` khởi động một sub-agent chạy nền như một lệnh người dùng, không phải chuyển tiếp nội bộ, và gửi một cập nhật hoàn thành cuối cùng về kênh chat yêu cầu khi phiên chạy kết thúc.

- Lệnh spawn không chặn; trả về run id ngay lập tức.
- Khi hoàn thành, sub-agent thông báo một tin nhắn tóm tắt/kết quả về kênh chat yêu cầu.
- Đối với spawn thủ công, việc giao hàng có tính bền bỉ:
  - OpenClaw thử giao hàng trực tiếp `agent` trước với một khóa idempotency ổn định.
  - Nếu giao hàng trực tiếp thất bại, nó chuyển sang định tuyến hàng đợi.
  - Nếu định tuyến hàng đợi vẫn không khả dụng, thông báo được thử lại với một backoff ngắn trước khi từ bỏ cuối cùng.
- Việc chuyển giao hoàn thành cho session yêu cầu là ngữ cảnh nội bộ được tạo runtime (không phải văn bản do người dùng tạo) và bao gồm:
  - `Result` (văn bản trả lời `assistant`, hoặc `toolResult` mới nhất nếu trả lời assistant trống)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - thống kê runtime/token gọn
  - một hướng dẫn giao hàng yêu cầu agent yêu cầu viết lại bằng giọng assistant bình thường (không chuyển tiếp metadata nội bộ thô)
- `--model` và `--thinking` ghi đè mặc định cho phiên chạy cụ thể đó.
- Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn thành.
- `/subagents spawn` là chế độ một lần (`mode: "run"`). Đối với các phiên gắn thread liên tục, dùng `sessions_spawn` với `thread: true` và `mode: "session"`.
- Đối với các phiên ACP harness (Codex, Claude Code, Gemini CLI), dùng `sessions_spawn` với `runtime: "acp"` và xem [ACP Agents](/tools/acp-agents).

Mục tiêu chính:

- Song song hóa công việc "nghiên cứu / tác vụ dài / công cụ chậm" mà không chặn phiên chạy chính.
- Giữ sub-agents tách biệt theo mặc định (phân tách session + sandboxing tùy chọn).
- Giữ bề mặt công cụ khó bị lạm dụng: sub-agents **không** nhận công cụ session theo mặc định.
- Hỗ trợ độ sâu lồng ghép có thể cấu hình cho các mẫu orchestrator.

Lưu ý chi phí: mỗi sub-agent có ngữ cảnh và sử dụng token **riêng**. Đối với các tác vụ nặng hoặc lặp lại, đặt một mô hình rẻ hơn cho sub-agents và giữ agent chính trên mô hình chất lượng cao hơn. Có thể cấu hình qua `agents.defaults.subagents.model` hoặc ghi đè theo agent.

## Công cụ

Dùng `sessions_spawn`:

- Bắt đầu một phiên chạy sub-agent (`deliver: false`, global lane: `subagent`)
- Sau đó chạy bước thông báo và đăng thông báo trả lời lên kênh chat yêu cầu
- Mô hình mặc định: kế thừa từ caller trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc theo agent `agents.list[].subagents.model`); một `sessions_spawn.model` rõ ràng vẫn thắng.
- Suy nghĩ mặc định: kế thừa từ caller trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc theo agent `agents.list[].subagents.thinking`); một `sessions_spawn.thinking` rõ ràng vẫn thắng.
- Thời gian chạy mặc định: nếu `sessions_spawn.runTimeoutSeconds` bị bỏ qua, OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không, nó quay lại `0` (không có timeout).

Tham số công cụ:

- `task` (bắt buộc)
- `label?` (tùy chọn)
- `agentId?` (tùy chọn; spawn dưới một agent id khác nếu được phép)
- `model?` (tùy chọn; ghi đè mô hình sub-agent; giá trị không hợp lệ bị bỏ qua và sub-agent chạy trên mô hình mặc định với cảnh báo trong kết quả công cụ)
- `thinking?` (tùy chọn; ghi đè mức độ suy nghĩ cho phiên chạy sub-agent)
- `runTimeoutSeconds?` (mặc định là `agents.defaults.subagents.runTimeoutSeconds` khi được đặt, nếu không `0`; khi được đặt, phiên chạy sub-agent bị hủy sau N giây)
- `thread?` (mặc định `false`; khi `true`, yêu cầu gắn thread kênh cho phiên sub-agent này)
- `mode?` (`run|session`)
  - mặc định là `run`
  - nếu `thread: true` và `mode` bị bỏ qua, mặc định trở thành `session`
  - `mode: "session"` yêu cầu `thread: true`
- `cleanup?` (`delete|keep`, mặc định `keep`)
- `sandbox?` (`inherit|require`, mặc định `inherit`; `require` từ chối spawn trừ khi runtime con mục tiêu được sandboxed)
- `sessions_spawn` **không** chấp nhận tham số giao hàng kênh (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Để giao hàng, dùng `message`/`sessions_send` từ phiên chạy đã spawn.

## Phiên gắn thread

Khi gắn thread được bật cho một kênh, một sub-agent có thể giữ gắn với một thread để các tin nhắn người dùng tiếp theo trong thread đó tiếp tục định tuyến đến cùng một phiên sub-agent.

### Kênh hỗ trợ thread

- Discord (hiện là kênh duy nhất được hỗ trợ): hỗ trợ các phiên sub-agent gắn thread liên tục (`sessions_spawn` với `thread: true`), điều khiển thread thủ công (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), và các khóa adapter `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, và `channels.discord.threadBindings.spawnSubagentSessions`.

Luồng nhanh:

1. Spawn với `sessions_spawn` dùng `thread: true` (và tùy chọn `mode: "session"`).
2. OpenClaw tạo hoặc gắn một thread vào mục tiêu session đó trong kênh đang hoạt động.
3. Các trả lời và tin nhắn tiếp theo trong thread đó định tuyến đến session đã gắn.
4. Dùng `/session idle` để kiểm tra/cập nhật tự động unfocus khi không hoạt động và `/session max-age` để kiểm soát giới hạn cứng.
5. Dùng `/unfocus` để tách thủ công.

Điều khiển thủ công:

- `/focus <target>` gắn thread hiện tại (hoặc tạo một) vào mục tiêu sub-agent/session.
- `/unfocus` loại bỏ gắn kết cho thread hiện tại đã gắn.
- `/agents` liệt kê các phiên chạy hoạt động và trạng thái gắn kết (`thread:<id>` hoặc `unbound`).
- `/session idle` và `/session max-age` chỉ hoạt động cho các thread đã gắn focus.

Công tắc cấu hình:

- Mặc định toàn cầu: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Ghi đè kênh và các khóa tự động gắn spawn là adapter-specific. Xem **Thread supporting channels** ở trên.

Xem [Configuration Reference](/gateway/configuration-reference) và [Slash commands](/tools/slash-commands) để biết chi tiết adapter hiện tại.

Danh sách cho phép:

- `agents.list[].subagents.allowAgents`: danh sách các agent id có thể được nhắm mục tiêu qua `agentId` (`["*"]` để cho phép bất kỳ). Mặc định: chỉ agent yêu cầu.
- Bảo vệ kế thừa sandbox: nếu session yêu cầu được sandboxed, `sessions_spawn` từ chối các mục tiêu sẽ chạy không sandboxed.

Khám phá:

- Dùng `agents_list` để xem các agent id nào hiện được phép cho `sessions_spawn`.

Tự động lưu trữ:

- Các phiên sub-agent tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định: 60).
- Lưu trữ dùng `sessions.delete` và đổi tên transcript thành `*.deleted.<timestamp>` (cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau thông báo (vẫn giữ transcript qua đổi tên).
- Tự động lưu trữ là nỗ lực tốt nhất; các bộ đếm thời gian đang chờ bị mất nếu gateway khởi động lại.
- `runTimeoutSeconds` **không** tự động lưu trữ; nó chỉ dừng phiên chạy. Session vẫn còn cho đến khi tự động lưu trữ.
- Tự động lưu trữ áp dụng đồng đều cho các phiên depth-1 và depth-2.

## Sub-Agents lồng ghép

Theo mặc định, sub-agents không thể spawn sub-agents của riêng mình (`maxSpawnDepth: 1`). Có thể bật một mức độ lồng ghép bằng cách đặt `maxSpawnDepth: 2`, cho phép **mẫu orchestrator**: main → orchestrator sub-agent → worker sub-sub-agents.

### Cách bật

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // cho phép sub-agents spawn con (mặc định: 1)
        maxChildrenPerAgent: 5, // tối đa số con hoạt động mỗi phiên agent (mặc định: 5)
        maxConcurrent: 8, // giới hạn lane đồng thời toàn cầu (mặc định: 8)
        runTimeoutSeconds: 900, // timeout mặc định cho sessions_spawn khi bị bỏ qua (0 = không timeout)
      },
    },
  },
}
```

### Mức độ sâu

| Depth | Hình dạng khóa session                        | Vai trò                                        | Có thể spawn?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Main agent                                    | Luôn luôn                    |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orchestrator khi cho phép depth 2) | Chỉ khi `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (leaf worker)                   | Không bao giờ                |

### Chuỗi thông báo

Kết quả chảy ngược lên chuỗi:

1. Worker depth-2 hoàn thành → thông báo cho parent của nó (orchestrator depth-1)
2. Orchestrator depth-1 nhận thông báo, tổng hợp kết quả, hoàn thành → thông báo cho main
3. Main agent nhận thông báo và giao cho người dùng

Mỗi cấp chỉ thấy thông báo từ con trực tiếp của nó.

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi điều khiển được ghi vào metadata session tại thời điểm spawn. Điều này giữ cho các khóa session phẳng hoặc khôi phục không vô tình lấy lại quyền orchestrator.
- **Depth 1 (orchestrator, khi `maxSpawnDepth >= 2`)**: Nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để quản lý con của nó. Các công cụ session/hệ thống khác vẫn bị từ chối.
- **Depth 1 (leaf, khi `maxSpawnDepth == 1`)**: Không có công cụ session (hành vi mặc định hiện tại).
- **Depth 2 (leaf worker)**: Không có công cụ session — `sessions_spawn` luôn bị từ chối ở depth 2. Không thể spawn thêm con.

### Giới hạn spawn theo agent

Mỗi phiên agent (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent` (mặc định: 5) con hoạt động cùng lúc. Điều này ngăn chặn fan-out không kiểm soát từ một orchestrator duy nhất.

### Dừng theo tầng

Dừng một orchestrator depth-1 tự động dừng tất cả các con depth-2 của nó:

- `/stop` trong chat chính dừng tất cả các agent depth-1 và lan truyền đến các con depth-2 của chúng.
- `/subagents kill <id>` dừng một sub-agent cụ thể và lan truyền đến các con của nó.
- `/subagents kill all` dừng tất cả các sub-agents cho yêu cầu và lan truyền.

## Xác thực

Xác thực sub-agent được giải quyết theo **agent id**, không phải theo loại session:

- Khóa session sub-agent là `agent:<agentId>:subagent:<uuid>`.
- Kho lưu trữ xác thực được tải từ `agentDir` của agent đó.
- Hồ sơ xác thực của agent chính được hợp nhất làm **dự phòng**; hồ sơ agent ghi đè hồ sơ chính khi có xung đột.

Lưu ý: việc hợp nhất là bổ sung, vì vậy hồ sơ chính luôn có sẵn làm dự phòng. Xác thực hoàn toàn cách ly cho mỗi agent chưa được hỗ trợ.

## Thông báo

Sub-agents báo cáo lại qua một bước thông báo:

- Bước thông báo chạy bên trong session sub-agent (không phải session yêu cầu).
- Nếu sub-agent trả lời chính xác `ANNOUNCE_SKIP`, không có gì được đăng.
- Nếu không, việc giao hàng phụ thuộc vào độ sâu của người yêu cầu:
  - các session yêu cầu cấp cao nhất sử dụng một cuộc gọi `agent` tiếp theo với giao hàng bên ngoài (`deliver=true`)
  - các session subagent yêu cầu lồng ghép nhận một tiêm nội bộ tiếp theo (`deliver=false`) để orchestrator có thể tổng hợp kết quả con trong session
  - nếu một session subagent yêu cầu lồng ghép đã biến mất, OpenClaw quay lại session yêu cầu của session đó khi có sẵn
- Tổng hợp hoàn thành của con được giới hạn trong phiên chạy yêu cầu hiện tại khi xây dựng các phát hiện hoàn thành lồng ghép, ngăn chặn các đầu ra con của phiên chạy trước bị rò rỉ vào thông báo hiện tại.
- Các trả lời thông báo giữ nguyên định tuyến thread/topic khi có sẵn trên các adapter kênh.
- Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:
  - nguồn (`subagent` hoặc `cron`)
  - khóa/id session con
  - loại thông báo + nhãn tác vụ
  - dòng trạng thái được suy ra từ kết quả runtime (`success`, `error`, `timeout`, hoặc `unknown`)
  - nội dung kết quả từ bước thông báo (hoặc `(no output)` nếu thiếu)
  - một hướng dẫn tiếp theo mô tả khi nào nên trả lời so với giữ im lặng
- `Status` không được suy ra từ đầu ra mô hình; nó đến từ các tín hiệu kết quả runtime.

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bọc):

- Runtime (ví dụ: `runtime 5m12s`)
- Sử dụng token (input/output/tổng)
- Chi phí ước tính khi định giá mô hình được cấu hình (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId`, và transcript path (để agent chính có thể lấy lịch sử qua `sessions_history` hoặc kiểm tra file trên đĩa)
- Metadata nội bộ chỉ dành cho điều phối; các trả lời hướng người dùng nên được viết lại bằng giọng assistant bình thường.

## Chính sách công cụ (công cụ sub-agent)

Theo mặc định, sub-agents nhận **tất cả công cụ trừ công cụ session** và công cụ hệ thống:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Khi `maxSpawnDepth >= 2`, sub-agents orchestrator depth-1 nhận thêm `sessions_spawn`, `subagents`, `sessions_list`, và `sessions_history` để quản lý con của chúng.

Ghi đè qua cấu hình:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // nếu allow được đặt, nó trở thành chỉ cho phép (deny vẫn thắng)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Đồng thời

Sub-agents sử dụng một hàng đợi lane trong quá trình chuyên dụng:

- Tên lane: `subagent`
- Đồng thời: `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Dừng

- Gửi `/stop` trong chat yêu cầu hủy session yêu cầu và dừng bất kỳ phiên chạy sub-agent nào đã spawn từ nó, lan truyền đến các con lồng ghép.
- `/subagents kill <id>` dừng một sub-agent cụ thể và lan truyền đến các con của nó.

## Hạn chế

- Thông báo sub-agent là **nỗ lực tốt nhất**. Nếu gateway khởi động lại, công việc "thông báo lại" đang chờ bị mất.
- Sub-agents vẫn chia sẻ cùng tài nguyên quy trình gateway; coi `maxConcurrent` như một van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh sub-agent chỉ tiêm `AGENTS.md` + `TOOLS.md` (không `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, hoặc `BOOTSTRAP.md`).
- Độ sâu lồng ghép tối đa là 5 (`maxSpawnDepth` phạm vi: 1–5). Depth 2 được khuyến nghị cho hầu hết các trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số con hoạt động mỗi session (mặc định: 5, phạm vi: 1–20).\n