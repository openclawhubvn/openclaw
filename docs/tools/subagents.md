---
summary: "Sub-agents: tạo các phiên agent độc lập chạy nền và thông báo kết quả về kênh chat yêu cầu"
read_when:
  - Bạn muốn thực hiện công việc nền hoặc song song qua agent
  - Bạn đang thay đổi chính sách sessions_spawn hoặc công cụ sub-agent
  - Bạn đang triển khai hoặc xử lý sự cố các phiên sub-agent gắn với luồng
title: "Sub-Agents"
---

# Sub-agents

Sub-agents là các phiên agent chạy nền được tạo từ một phiên agent hiện có. Chúng hoạt động trong phiên riêng của mình (`agent:<agentId>:subagent:<uuid>`) và khi hoàn thành, sẽ **thông báo** kết quả về kênh chat yêu cầu.

## Lệnh Slash

Sử dụng `/subagents` để kiểm tra hoặc điều khiển các phiên sub-agent cho **phiên hiện tại**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Điều khiển gắn luồng:

Các lệnh này hoạt động trên các kênh hỗ trợ gắn luồng liên tục. Xem **Kênh hỗ trợ luồng** bên dưới.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` hiển thị metadata chạy (trạng thái, dấu thời gian, id phiên, đường dẫn transcript, dọn dẹp).

### Hành vi Spawn

`/subagents spawn` khởi động một sub-agent nền như một lệnh người dùng, không phải là một chuyển tiếp nội bộ, và gửi một cập nhật hoàn thành cuối cùng về kênh chat yêu cầu khi chạy xong.

- Lệnh spawn không chặn; nó trả về một id chạy ngay lập tức.
- Khi hoàn thành, sub-agent thông báo một tin nhắn tóm tắt/kết quả về kênh chat yêu cầu.
- Đối với các spawn thủ công, việc giao hàng có độ bền:
  - OpenClaw thử giao hàng trực tiếp `agent` trước với một khóa idempotency ổn định.
  - Nếu giao hàng trực tiếp thất bại, nó chuyển sang định tuyến hàng đợi.
  - Nếu định tuyến hàng đợi vẫn không khả dụng, thông báo được thử lại với một backoff lũy thừa ngắn trước khi từ bỏ cuối cùng.
- Việc chuyển giao hoàn thành cho phiên yêu cầu là ngữ cảnh nội bộ được tạo ra trong thời gian chạy (không phải văn bản do người dùng tạo) và bao gồm:
  - `Result` (văn bản trả lời `assistant`, hoặc `toolResult` mới nhất nếu trả lời của assistant trống)
  - `Status` (`hoàn thành thành công` / `thất bại` / `hết thời gian` / `không xác định`)
  - thống kê runtime/token gọn
  - một hướng dẫn giao hàng yêu cầu agent yêu cầu viết lại bằng giọng assistant bình thường (không chuyển tiếp metadata nội bộ thô)
- `--model` và `--thinking` ghi đè mặc định cho lần chạy cụ thể đó.
- Sử dụng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn thành.
- `/subagents spawn` là chế độ một lần (`mode: "run"`). Đối với các phiên gắn luồng liên tục, sử dụng `sessions_spawn` với `thread: true` và `mode: "session"`.
- Đối với các phiên harness ACP (Codex, Claude Code, Gemini CLI), sử dụng `sessions_spawn` với `runtime: "acp"` và xem [ACP Agents](/tools/acp-agents).

Mục tiêu chính:

- Song song hóa công việc "nghiên cứu / nhiệm vụ dài / công cụ chậm" mà không chặn phiên chính.
- Giữ sub-agents tách biệt theo mặc định (tách phiên + tùy chọn sandboxing).
- Giữ bề mặt công cụ khó bị lạm dụng: sub-agents **không** nhận công cụ phiên theo mặc định.
- Hỗ trợ độ sâu lồng ghép có thể cấu hình cho các mẫu điều phối.

Lưu ý về chi phí: mỗi sub-agent có ngữ cảnh và sử dụng token **riêng**. Đối với các nhiệm vụ nặng hoặc lặp đi lặp lại, hãy đặt một mô hình rẻ hơn cho sub-agents và giữ agent chính của bạn trên một mô hình chất lượng cao hơn. Bạn có thể cấu hình điều này qua `agents.defaults.subagents.model` hoặc ghi đè theo từng agent.

## Công cụ

Sử dụng `sessions_spawn`:

- Bắt đầu một phiên sub-agent (`deliver: false`, làn toàn cầu: `subagent`)
- Sau đó chạy một bước thông báo và đăng câu trả lời thông báo lên kênh chat yêu cầu
- Mô hình mặc định: thừa hưởng từ người gọi trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc theo từng agent `agents.list[].subagents.model`); một `sessions_spawn.model` rõ ràng vẫn thắng.
- Suy nghĩ mặc định: thừa hưởng từ người gọi trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc theo từng agent `agents.list[].subagents.thinking`); một `sessions_spawn.thinking` rõ ràng vẫn thắng.
- Thời gian chạy mặc định: nếu `sessions_spawn.runTimeoutSeconds` bị bỏ qua, OpenClaw sử dụng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không, nó quay lại `0` (không có thời gian chờ).

Tham số công cụ:

- `task` (bắt buộc)
- `label?` (tùy chọn)
- `agentId?` (tùy chọn; spawn dưới một id agent khác nếu được phép)
- `model?` (tùy chọn; ghi đè mô hình sub-agent; các giá trị không hợp lệ bị bỏ qua và sub-agent chạy trên mô hình mặc định với cảnh báo trong kết quả công cụ)
- `thinking?` (tùy chọn; ghi đè mức độ suy nghĩ cho lần chạy sub-agent)
- `runTimeoutSeconds?` (mặc định là `agents.defaults.subagents.runTimeoutSeconds` khi được đặt, nếu không là `0`; khi được đặt, lần chạy sub-agent bị hủy sau N giây)
- `thread?` (mặc định `false`; khi `true`, yêu cầu gắn luồng kênh cho phiên sub-agent này)
- `mode?` (`run|session`)
  - mặc định là `run`
  - nếu `thread: true` và `mode` bị bỏ qua, mặc định trở thành `session`
  - `mode: "session"` yêu cầu `thread: true`
- `cleanup?` (`delete|keep`, mặc định `keep`)
- `sandbox?` (`inherit|require`, mặc định `inherit`; `require` từ chối spawn trừ khi runtime con mục tiêu được sandboxed)
- `sessions_spawn` **không** chấp nhận các tham số giao hàng kênh (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Để giao hàng, sử dụng `message`/`sessions_send` từ lần chạy được spawn.

## Phiên gắn luồng

Khi gắn luồng được bật cho một kênh, một sub-agent có thể giữ gắn với một luồng để các tin nhắn người dùng tiếp theo trong luồng đó tiếp tục định tuyến đến cùng một phiên sub-agent.

### Kênh hỗ trợ luồng

- Discord (hiện là kênh duy nhất được hỗ trợ): hỗ trợ các phiên sub-agent gắn luồng liên tục (`sessions_spawn` với `thread: true`), điều khiển luồng thủ công (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), và các khóa adapter `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, và `channels.discord.threadBindings.spawnSubagentSessions`.

Luồng nhanh:

1. Spawn với `sessions_spawn` sử dụng `thread: true` (và tùy chọn `mode: "session"`).
2. OpenClaw tạo hoặc gắn một luồng vào mục tiêu phiên đó trong kênh hoạt động.
3. Các câu trả lời và tin nhắn tiếp theo trong luồng đó định tuyến đến phiên được gắn.
4. Sử dụng `/session idle` để kiểm tra/cập nhật tự động bỏ gắn khi không hoạt động và `/session max-age` để kiểm soát giới hạn cứng.
5. Sử dụng `/unfocus` để tách thủ công.

Điều khiển thủ công:

- `/focus <target>` gắn luồng hiện tại (hoặc tạo một luồng) vào một mục tiêu sub-agent/phiên.
- `/unfocus` loại bỏ gắn cho luồng hiện tại được gắn.
- `/agents` liệt kê các phiên chạy và trạng thái gắn (`thread:<id>` hoặc `unbound`).
- `/session idle` và `/session max-age` chỉ hoạt động cho các luồng được gắn tập trung.

Công tắc cấu hình:

- Mặc định toàn cầu: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Ghi đè kênh và các khóa tự động gắn spawn là cụ thể cho adapter. Xem **Kênh hỗ trợ luồng** ở trên.

Xem [Tham chiếu cấu hình](/gateway/configuration-reference) và [Lệnh Slash](/tools/slash-commands) để biết chi tiết adapter hiện tại.

Danh sách cho phép:

- `agents.list[].subagents.allowAgents`: danh sách các id agent có thể được nhắm mục tiêu qua `agentId` (`["*"]` để cho phép bất kỳ). Mặc định: chỉ agent yêu cầu.
- Bảo vệ thừa kế sandbox: nếu phiên yêu cầu được sandboxed, `sessions_spawn` từ chối các mục tiêu sẽ chạy không được sandboxed.

Khám phá:

- Sử dụng `agents_list` để xem id agent nào hiện được phép cho `sessions_spawn`.

Tự động lưu trữ:

- Các phiên sub-agent được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định: 60).
- Lưu trữ sử dụng `sessions.delete` và đổi tên transcript thành `*.deleted.<timestamp>` (cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau thông báo (vẫn giữ transcript qua đổi tên).
- Tự động lưu trữ là nỗ lực tốt nhất; các bộ đếm thời gian đang chờ bị mất nếu gateway khởi động lại.
- `runTimeoutSeconds` **không** tự động lưu trữ; nó chỉ dừng chạy. Phiên vẫn còn cho đến khi tự động lưu trữ.
- Tự động lưu trữ áp dụng đồng đều cho các phiên độ sâu-1 và độ sâu-2.

## Sub-Agents Lồng Ghép

Theo mặc định, sub-agents không thể tạo sub-agents của riêng mình (`maxSpawnDepth: 1`). Bạn có thể cho phép một mức độ lồng ghép bằng cách đặt `maxSpawnDepth: 2`, cho phép **mẫu điều phối**: chính → sub-agent điều phối → sub-sub-agents công nhân.

### Cách kích hoạt

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // cho phép sub-agents tạo con (mặc định: 1)
        maxChildrenPerAgent: 5, // tối đa con hoạt động mỗi phiên agent (mặc định: 5)
        maxConcurrent: 8, // giới hạn làn đồng thời toàn cầu (mặc định: 8)
        runTimeoutSeconds: 900, // thời gian chờ mặc định cho sessions_spawn khi bị bỏ qua (0 = không có thời gian chờ)
      },
    },
  },
}
```

### Mức độ sâu

| Độ sâu | Hình dạng khóa phiên                            | Vai trò                                          | Có thể tạo?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agent chính                                    | Luôn luôn                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (hoặc điều phối khi cho phép độ sâu 2) | Chỉ khi `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (công nhân lá)                   | Không bao giờ                        |

### Chuỗi thông báo

Kết quả chảy ngược lên chuỗi:

1. Công nhân độ sâu-2 hoàn thành → thông báo cho cha mẹ của nó (điều phối độ sâu-1)
2. Điều phối độ sâu-1 nhận thông báo, tổng hợp kết quả, hoàn thành → thông báo cho chính
3. Agent chính nhận thông báo và giao cho người dùng

Mỗi cấp chỉ thấy thông báo từ con trực tiếp của nó.

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi điều khiển được viết vào metadata phiên khi spawn. Điều đó giữ cho các khóa phiên phẳng hoặc khôi phục không vô tình lấy lại đặc quyền điều phối.
- **Độ sâu 1 (điều phối, khi `maxSpawnDepth >= 2`)**: Nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể quản lý con của mình. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (lá, khi `maxSpawnDepth == 1`)**: Không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (công nhân lá)**: Không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể tạo thêm con.

### Giới hạn spawn theo agent

Mỗi phiên agent (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent` (mặc định: 5) con hoạt động cùng một lúc. Điều này ngăn chặn sự mở rộng không kiểm soát từ một điều phối viên duy nhất.

### Dừng theo tầng

Dừng một điều phối viên độ sâu-1 tự động dừng tất cả các con độ sâu-2 của nó:

- `/stop` trong chat chính dừng tất cả các agent độ sâu-1 và dừng theo tầng đến các con độ sâu-2 của chúng.
- `/subagents kill <id>` dừng một sub-agent cụ thể và dừng theo tầng đến các con của nó.
- `/subagents kill all` dừng tất cả các sub-agent cho người yêu cầu và dừng theo tầng.

## Xác thực

Xác thực sub-agent được giải quyết theo **id agent**, không phải theo loại phiên:

- Khóa phiên sub-agent là `agent:<agentId>:subagent:<uuid>`.
- Kho lưu trữ xác thực được tải từ `agentDir` của agent đó.
- Hồ sơ xác thực của agent chính được hợp nhất làm **dự phòng**; hồ sơ agent ghi đè hồ sơ chính khi có xung đột.

Lưu ý: việc hợp nhất là bổ sung, vì vậy hồ sơ chính luôn có sẵn làm dự phòng. Xác thực hoàn toàn cách ly theo agent chưa được hỗ trợ.

## Thông báo

Sub-agents báo cáo lại qua một bước thông báo:

- Bước thông báo chạy bên trong phiên sub-agent (không phải phiên yêu cầu).
- Nếu sub-agent trả lời chính xác `ANNOUNCE_SKIP`, không có gì được đăng.
- Nếu không, việc giao hàng phụ thuộc vào độ sâu của người yêu cầu:
  - các phiên yêu cầu cấp cao nhất sử dụng một cuộc gọi `agent` tiếp theo với giao hàng bên ngoài (`deliver=true`)
  - các phiên subagent yêu cầu lồng ghép nhận một tiêm nội bộ tiếp theo (`deliver=false`) để điều phối viên có thể tổng hợp kết quả con trong phiên
  - nếu một phiên subagent yêu cầu lồng ghép đã biến mất, OpenClaw quay lại người yêu cầu của phiên đó khi có sẵn
- Tổng hợp hoàn thành con được giới hạn trong lần chạy yêu cầu hiện tại khi xây dựng các phát hiện hoàn thành lồng ghép, ngăn chặn các đầu ra con từ lần chạy trước bị rò rỉ vào thông báo hiện tại.
- Các câu trả lời thông báo giữ nguyên định tuyến luồng/chủ đề khi có sẵn trên các adapter kênh.
- Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:
  - nguồn (`subagent` hoặc `cron`)
  - khóa/id phiên con
  - loại thông báo + nhãn nhiệm vụ
  - dòng trạng thái được suy ra từ kết quả runtime (`thành công`, `lỗi`, `hết thời gian`, hoặc `không xác định`)
  - nội dung kết quả từ bước thông báo (hoặc `(không có đầu ra)` nếu thiếu)
  - một hướng dẫn tiếp theo mô tả khi nào nên trả lời so với giữ im lặng
- `Status` không được suy ra từ đầu ra mô hình; nó đến từ các tín hiệu kết quả runtime.

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bao bọc):

- Runtime (ví dụ: `runtime 5m12s`)
- Sử dụng token (đầu vào/đầu ra/tổng)
- Chi phí ước tính khi định giá mô hình được cấu hình (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId`, và đường dẫn transcript (để agent chính có thể lấy lịch sử qua `sessions_history` hoặc kiểm tra tệp trên đĩa)
- Metadata nội bộ chỉ dành cho điều phối; các câu trả lời hướng đến người dùng nên được viết lại bằng giọng assistant bình thường.

## Chính sách Công cụ (công cụ sub-agent)

Theo mặc định, sub-agents nhận **tất cả các công cụ ngoại trừ công cụ phiên** và công cụ hệ thống:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Khi `maxSpawnDepth >= 2`, sub-agents điều phối độ sâu-1 nhận thêm `sessions_spawn`, `subagents`, `sessions_list`, và `sessions_history` để có thể quản lý con của mình.

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
        // từ chối thắng
        deny: ["gateway", "cron"],
        // nếu cho phép được đặt, nó trở thành chỉ cho phép (từ chối vẫn thắng)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Đồng thời

Sub-agents sử dụng một làn hàng đợi trong quá trình chuyên dụng:

- Tên làn: `subagent`
- Đồng thời: `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Dừng

- Gửi `/stop` trong chat yêu cầu hủy phiên yêu cầu và dừng bất kỳ phiên sub-agent nào đang hoạt động được tạo từ đó, dừng theo tầng đến các con lồng ghép.
- `/subagents kill <id>` dừng một sub-agent cụ thể và dừng theo tầng đến các con của nó.

## Hạn chế

- Thông báo sub-agent là **nỗ lực tốt nhất**. Nếu gateway khởi động lại, công việc "thông báo lại" đang chờ bị mất.
- Sub-agents vẫn chia sẻ cùng tài nguyên quy trình gateway; coi `maxConcurrent` như một van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh sub-agent chỉ tiêm `AGENTS.md` + `TOOLS.md` (không có `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, hoặc `BOOTSTRAP.md`).
- Độ sâu lồng ghép tối đa là 5 (`maxSpawnDepth` phạm vi: 1–5). Độ sâu 2 được khuyến nghị cho hầu hết các trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn con hoạt động mỗi phiên (mặc định: 5, phạm vi: 1–20).
