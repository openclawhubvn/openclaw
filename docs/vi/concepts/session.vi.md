---
summary: "Quản lý session, khóa và lưu trữ cho chat"
read_when:
  - Sửa đổi xử lý hoặc lưu trữ session
title: "Quản lý Session"
---

# Quản lý Session

OpenClaw coi **một session chat trực tiếp mỗi agent** là chính. Chat trực tiếp gom lại thành `agent:<agentId>:<mainKey>` (mặc định `main`), trong khi chat nhóm/kênh có khóa riêng. `session.mainKey` được tôn trọng.

Dùng `session.dmScope` để kiểm soát cách **tin nhắn trực tiếp** được nhóm:

- `main` (mặc định): tất cả DM dùng chung session chính để liên tục.
- `per-peer`: tách biệt theo id người gửi qua các kênh.
- `per-channel-peer`: tách biệt theo kênh + người gửi (khuyến nghị cho hộp thư nhiều người dùng).
- `per-account-channel-peer`: tách biệt theo tài khoản + kênh + người gửi (khuyến nghị cho hộp thư nhiều tài khoản).
  Dùng `session.identityLinks` để ánh xạ id người dùng có tiền tố provider thành một danh tính chuẩn để cùng một người dùng chung session DM qua các kênh khi dùng `per-peer`, `per-channel-peer`, hoặc `per-account-channel-peer`.

## Chế độ DM bảo mật (khuyến nghị cho thiết lập nhiều người dùng)

> **Cảnh báo bảo mật:** Nếu agent có thể nhận DM từ **nhiều người**, nên bật chế độ DM bảo mật. Nếu không, tất cả người dùng sẽ chia sẻ cùng một ngữ cảnh hội thoại, có thể rò rỉ thông tin riêng tư giữa các người dùng.

**Ví dụ vấn đề với cài đặt mặc định:**

- Alice (`<SENDER_A>`) nhắn tin cho agent về một chủ đề riêng tư (ví dụ, cuộc hẹn y tế)
- Bob (`<SENDER_B>`) nhắn tin hỏi "Chúng ta đang nói về gì?"
- Vì cả hai DM dùng chung một session, mô hình có thể trả lời Bob bằng ngữ cảnh trước đó của Alice.

**Cách khắc phục:** Đặt `dmScope` để tách biệt session theo người dùng:

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    // Chế độ DM bảo mật: tách biệt ngữ cảnh DM theo kênh + người gửi.
    dmScope: "per-channel-peer",
  },
}
```

**Khi nào nên bật:**

- Có phê duyệt ghép đôi cho nhiều người gửi
- Dùng danh sách cho phép DM với nhiều mục
- Đặt `dmPolicy: "open"`
- Nhiều số điện thoại hoặc tài khoản có thể nhắn tin cho agent

Ghi chú:

- Mặc định là `dmScope: "main"` để liên tục (tất cả DM dùng chung session chính). Phù hợp cho thiết lập một người dùng.
- CLI onboarding local ghi `session.dmScope: "per-channel-peer"` mặc định khi chưa đặt (giá trị rõ ràng hiện có được giữ nguyên).
- Với hộp thư nhiều tài khoản trên cùng kênh, ưu tiên `per-account-channel-peer`.
- Nếu cùng một người liên hệ qua nhiều kênh, dùng `session.identityLinks` để gom session DM của họ thành một danh tính chuẩn.
- Có thể kiểm tra cài đặt DM với `openclaw security audit` (xem [security](/cli/security)).

## Gateway là nguồn sự thật

Tất cả trạng thái session **thuộc về gateway** (OpenClaw “master”). UI clients (ứng dụng macOS, WebChat, v.v.) phải truy vấn gateway để lấy danh sách session và số lượng token thay vì đọc file local.

- Trong **remote mode**, session store quan trọng nằm trên host gateway từ xa, không phải trên Mac.
- Số lượng token hiển thị trong UI lấy từ trường store của gateway (`inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`). Clients không phân tích JSONL transcripts để “sửa” tổng số.

## Trạng thái lưu trữ ở đâu

- Trên **gateway host**:
  - File lưu trữ: `~/.openclaw/agents/<agentId>/sessions/sessions.json` (mỗi agent).
- Transcripts: `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl` (session chủ đề Telegram dùng `.../<SessionId>-topic-<threadId>.jsonl`).
- Store là một map `sessionKey -> { sessionId, updatedAt, ... }`. Xóa mục là an toàn; chúng được tạo lại khi cần.
- Mục nhóm có thể bao gồm `displayName`, `channel`, `subject`, `room`, và `space` để gắn nhãn session trong UI.
- Mục session bao gồm metadata `origin` (nhãn + gợi ý routing) để UI có thể giải thích nguồn gốc session.
- OpenClaw **không** đọc thư mục session Pi/Tau cũ.

## Bảo trì

OpenClaw áp dụng bảo trì session-store để giữ `sessions.json` và transcript artifacts trong giới hạn thời gian.

### Mặc định

- `session.maintenance.mode`: `warn`
- `session.maintenance.pruneAfter`: `30d`
- `session.maintenance.maxEntries`: `500`
- `session.maintenance.rotateBytes`: `10mb`
- `session.maintenance.resetArchiveRetention`: mặc định là `pruneAfter` (`30d`)
- `session.maintenance.maxDiskBytes`: không đặt (vô hiệu hóa)
- `session.maintenance.highWaterBytes`: mặc định là `80%` của `maxDiskBytes` khi bật ngân sách

### Cách hoạt động

Bảo trì chạy trong quá trình ghi session-store, và có thể kích hoạt theo yêu cầu với `openclaw sessions cleanup`.

- `mode: "warn"`: báo cáo những gì sẽ bị loại bỏ nhưng không thay đổi mục/transcripts.
- `mode: "enforce"`: áp dụng dọn dẹp theo thứ tự:
  1. loại bỏ mục cũ hơn `pruneAfter`
  2. giới hạn số lượng mục đến `maxEntries` (cũ nhất trước)
  3. lưu trữ file transcript cho các mục bị loại bỏ không còn được tham chiếu
  4. xóa các archive `*.deleted.<timestamp>` và `*.reset.<timestamp>` cũ theo chính sách lưu trữ
  5. xoay `sessions.json` khi vượt quá `rotateBytes`
  6. nếu `maxDiskBytes` được đặt, thực thi ngân sách đĩa hướng tới `highWaterBytes` (artifacts cũ nhất trước, sau đó là session cũ nhất)

### Lưu ý hiệu suất cho store lớn

Store session lớn thường gặp trong thiết lập lưu lượng cao. Công việc bảo trì là công việc ghi, nên store rất lớn có thể tăng độ trễ ghi.

Những gì tăng chi phí nhất:

- giá trị `session.maintenance.maxEntries` rất cao
- cửa sổ `pruneAfter` dài giữ lại mục cũ
- nhiều transcript/artifact lưu trữ trong `~/.openclaw/agents/<agentId>/sessions/`
- bật ngân sách đĩa (`maxDiskBytes`) mà không có giới hạn hợp lý về pruning/cap

Nên làm gì:

- dùng `mode: "enforce"` trong sản xuất để tăng trưởng được giới hạn tự động
- đặt cả giới hạn thời gian và số lượng (`pruneAfter` + `maxEntries`), không chỉ một
- đặt `maxDiskBytes` + `highWaterBytes` cho giới hạn trên cứng trong triển khai lớn
- giữ `highWaterBytes` thấp hơn `maxDiskBytes` một cách có ý nghĩa (mặc định là 80%)
- chạy `openclaw sessions cleanup --dry-run --json` sau khi thay đổi cấu hình để xác minh tác động dự kiến trước khi thực thi
- với session hoạt động thường xuyên, truyền `--active-key` khi chạy dọn dẹp thủ công

### Ví dụ tùy chỉnh

Dùng chính sách thực thi bảo thủ:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "45d",
      maxEntries: 800,
      rotateBytes: "20mb",
      resetArchiveRetention: "14d",
    },
  },
}
```

Bật ngân sách đĩa cứng cho thư mục sessions:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      maxDiskBytes: "1gb",
      highWaterBytes: "800mb",
    },
  },
}
```

Điều chỉnh cho cài đặt lớn hơn (ví dụ):

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "14d",
      maxEntries: 2000,
      rotateBytes: "25mb",
      maxDiskBytes: "2gb",
      highWaterBytes: "1.6gb",
    },
  },
}
```

Xem trước hoặc buộc bảo trì từ CLI:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

## Cắt tỉa session

OpenClaw tự động cắt tỉa **kết quả công cụ cũ** khỏi ngữ cảnh trong bộ nhớ ngay trước khi gọi LLM theo mặc định.
Điều này **không** ghi lại lịch sử JSONL. Xem [/concepts/session-pruning](/concepts/session-pruning).

## Xả bộ nhớ trước khi nén

Khi một session gần tự động nén, OpenClaw có thể chạy một **lần xả bộ nhớ im lặng**
nhắc mô hình ghi ghi chú bền vững vào đĩa. Chỉ chạy khi workspace có thể ghi. Xem [Memory](/concepts/memory) và
[Compaction](/concepts/compaction).

## Ánh xạ transports → khóa session

- Chat trực tiếp theo `session.dmScope` (mặc định `main`).
  - `main`: `agent:<agentId>:<mainKey>` (liên tục qua thiết bị/kênh).
    - Nhiều số điện thoại và kênh có thể ánh xạ đến cùng một khóa chính agent; chúng hoạt động như transports vào một cuộc trò chuyện.
  - `per-peer`: `agent:<agentId>:direct:<peerId>`.
  - `per-channel-peer`: `agent:<agentId>:<channel>:direct:<peerId>`.
  - `per-account-channel-peer`: `agent:<agentId>:<channel>:<accountId>:direct:<peerId>` (accountId mặc định là `default`).
  - Nếu `session.identityLinks` khớp với id người dùng có tiền tố provider (ví dụ `telegram:123`), khóa chuẩn thay thế `<peerId>` để cùng một người dùng chung session qua các kênh.
- Chat nhóm tách biệt trạng thái: `agent:<agentId>:<channel>:group:<id>` (phòng/kênh dùng `agent:<agentId>:<channel>:channel:<id>`).
  - Chủ đề diễn đàn Telegram thêm `:topic:<threadId>` vào id nhóm để tách biệt.
  - Khóa `group:<id>` cũ vẫn được nhận diện để di chuyển.
- Ngữ cảnh inbound có thể vẫn dùng `group:<id>`; kênh được suy ra từ `Provider` và chuẩn hóa thành dạng chuẩn `agent:<agentId>:<channel>:group:<id>`.
- Nguồn khác:
  - Cron jobs: `cron:<job.id>` (tách biệt) hoặc `session:<custom-id>` (bền vững)
  - Webhooks: `hook:<uuid>` (trừ khi được đặt rõ ràng bởi hook)
  - Node runs: `node-<nodeId>`

## Vòng đời

- Chính sách reset: session được tái sử dụng cho đến khi hết hạn, và hết hạn được đánh giá trên tin nhắn inbound tiếp theo.
- Reset hàng ngày: mặc định là **4:00 AM giờ địa phương trên gateway host**. Một session là cũ khi cập nhật cuối cùng của nó sớm hơn thời gian reset hàng ngày gần nhất.
- Reset khi không hoạt động (tùy chọn): `idleMinutes` thêm một cửa sổ không hoạt động trượt. Khi cả reset hàng ngày và không hoạt động được cấu hình, **cái nào hết hạn trước** sẽ buộc một session mới.
- Idle-only cũ: nếu đặt `session.idleMinutes` mà không có cấu hình `session.reset`/`resetByType`, OpenClaw ở chế độ chỉ không hoạt động để tương thích ngược.
- Ghi đè theo loại (tùy chọn): `resetByType` cho phép ghi đè chính sách cho session `direct`, `group`, và `thread` (thread = Slack/Discord threads, chủ đề Telegram, thread Matrix khi được cung cấp bởi connector).
- Ghi đè theo kênh (tùy chọn): `resetByChannel` ghi đè chính sách reset cho một kênh (áp dụng cho tất cả loại session cho kênh đó và ưu tiên hơn `reset`/`resetByType`).
- Kích hoạt reset: chính xác `/new` hoặc `/reset` (cộng với bất kỳ extras nào trong `resetTriggers`) bắt đầu một session id mới và truyền phần còn lại của tin nhắn qua. `/new <model>` chấp nhận một alias model, `provider/model`, hoặc tên provider (khớp mờ) để đặt model session mới. Nếu `/new` hoặc `/reset` được gửi một mình, OpenClaw chạy một lượt “hello” ngắn để xác nhận reset.
- Reset thủ công: xóa các khóa cụ thể khỏi store hoặc xóa transcript JSONL; tin nhắn tiếp theo sẽ tạo lại chúng.
- Cron jobs tách biệt luôn tạo một `sessionId` mới mỗi lần chạy (không tái sử dụng khi không hoạt động).

## Chính sách gửi (tùy chọn)

Chặn gửi cho các loại session cụ thể mà không cần liệt kê id riêng lẻ.

```json5
{
  session: {
    sendPolicy: {
      rules: [
        { action: "deny", match: { channel: "discord", chatType: "group" } },
        { action: "deny", match: { keyPrefix: "cron:" } },
        // Khớp khóa session thô (bao gồm tiền tố `agent:<id>:`).
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ],
      default: "allow",
    },
  },
}
```

Ghi đè runtime (chỉ chủ sở hữu):

- `/send on` → cho phép cho session này
- `/send off` → từ chối cho session này
- `/send inherit` → xóa ghi đè và dùng quy tắc cấu hình
  Gửi những điều này dưới dạng tin nhắn độc lập để chúng được ghi nhận.

## Cấu hình (ví dụ đổi tên tùy chọn)

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    scope: "per-sender", // giữ khóa nhóm riêng biệt
    dmScope: "main", // liên tục DM (đặt per-channel-peer/per-account-channel-peer cho hộp thư chia sẻ)
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      // Mặc định: mode=daily, atHour=4 (giờ địa phương gateway host).
      // Nếu cũng đặt idleMinutes, cái nào hết hạn trước sẽ thắng.
      mode: "daily",
      atHour: 4,
      idleMinutes: 120,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    mainKey: "main",
  },
}
```

## Kiểm tra

- `openclaw status` — hiển thị đường dẫn store và các session gần đây.
- `openclaw sessions --json` — xuất mọi mục (lọc với `--active <minutes>`).
- `openclaw gateway call sessions.list --params '{}'` — lấy session từ gateway đang chạy (dùng `--url`/`--token` để truy cập gateway từ xa).
- Gửi `/status` dưới dạng tin nhắn độc lập trong chat để xem agent có thể truy cập không, bao nhiêu ngữ cảnh session được sử dụng, các chuyển đổi thinking/fast/verbose hiện tại, và khi nào thông tin đăng nhập WhatsApp web được làm mới lần cuối (giúp phát hiện nhu cầu liên kết lại).
- Gửi `/context list` hoặc `/context detail` để xem những gì có trong system prompt và file workspace được chèn (và các đóng góp ngữ cảnh lớn nhất).
- Gửi `/stop` (hoặc các cụm từ dừng độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`) để dừng chạy hiện tại, xóa các followup đã xếp hàng cho session đó, và dừng bất kỳ chạy sub-agent nào được tạo từ nó (phản hồi bao gồm số lượng đã dừng).
- Gửi `/compact` (hướng dẫn tùy chọn) dưới dạng tin nhắn độc lập để tóm tắt ngữ cảnh cũ hơn và giải phóng không gian cửa sổ. Xem [/concepts/compaction](/concepts/compaction).
- Transcripts JSONL có thể mở trực tiếp để xem lại các lượt đầy đủ.

## Mẹo

- Giữ khóa chính dành riêng cho lưu lượng 1:1; để nhóm giữ khóa riêng của họ.
- Khi tự động dọn dẹp, xóa các khóa riêng lẻ thay vì toàn bộ store để giữ ngữ cảnh ở nơi khác.

## Metadata nguồn gốc session

Mỗi mục session ghi lại nguồn gốc của nó (cố gắng tốt nhất) trong `origin`:

- `label`: nhãn người dùng (giải quyết từ nhãn hội thoại + chủ đề nhóm/kênh)
- `provider`: id kênh chuẩn hóa (bao gồm các phần mở rộng)
- `from`/`to`: id định tuyến thô từ phong bì inbound
- `accountId`: id tài khoản provider (khi nhiều tài khoản)
- `threadId`: id thread/topic khi kênh hỗ trợ
  Các trường nguồn gốc được điền cho tin nhắn trực tiếp, kênh, và nhóm. Nếu một
  connector chỉ cập nhật định tuyến giao hàng (ví dụ, để giữ session DM chính
  mới), nó vẫn nên cung cấp ngữ cảnh inbound để session giữ metadata giải thích của nó. Các phần mở rộng có thể làm điều này bằng cách gửi `ConversationLabel`,
  `GroupSubject`, `GroupChannel`, `GroupSpace`, và `SenderName` trong ngữ cảnh inbound và gọi `recordSessionMetaFromInbound` (hoặc truyền cùng ngữ cảnh
  đến `updateLastRoute`).\n