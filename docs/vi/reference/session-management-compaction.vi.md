---
summary: "Khám phá sâu: session store + transcripts, vòng đời, và nội bộ (tự động) nén"
read_when:
  - Cần debug session ids, transcript JSONL, hoặc các trường trong sessions.json
  - Đang thay đổi hành vi tự động nén hoặc thêm công việc dọn dẹp trước khi nén
  - Muốn triển khai bộ nhớ đệm hoặc các thao tác hệ thống im lặng
title: "Khám Phá Sâu Quản Lý Session"
---

# Quản Lý Session & Nén (Khám Phá Sâu)

Tài liệu này giải thích cách OpenClaw quản lý session từ đầu đến cuối:

- **Session routing** (cách ánh xạ tin nhắn đến `sessionKey`)
- **Session store** (`sessions.json`) và những gì nó theo dõi
- **Transcript persistence** (`*.jsonl`) và cấu trúc của nó
- **Transcript hygiene** (sửa lỗi cụ thể của provider trước khi chạy)
- **Context limits** (cửa sổ ngữ cảnh vs token được theo dõi)
- **Compaction** (nén thủ công + tự động) và nơi để gắn công việc trước khi nén
- **Silent housekeeping** (ví dụ: ghi bộ nhớ không tạo ra đầu ra thấy được cho người dùng)

Nếu cần cái nhìn tổng quan hơn, bắt đầu với:

- [/concepts/session](/concepts/session)
- [/concepts/compaction](/concepts/compaction)
- [/concepts/session-pruning](/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## Nguồn sự thật: Gateway

OpenClaw được thiết kế xoay quanh một **Gateway process** duy nhất quản lý trạng thái session.

- UIs (ứng dụng macOS, web Control UI, TUI) nên truy vấn Gateway để lấy danh sách session và số lượng token.
- Ở chế độ remote, file session nằm trên host remote; “kiểm tra file trên Mac local” sẽ không phản ánh những gì Gateway đang sử dụng.

---

## Hai lớp lưu trữ

OpenClaw lưu trữ session trong hai lớp:

1. **Session store (`sessions.json`)**
   - Bản đồ key/value: `sessionKey -> SessionEntry`
   - Nhỏ, có thể chỉnh sửa, an toàn để chỉnh sửa (hoặc xóa mục)
   - Theo dõi metadata session (id session hiện tại, hoạt động cuối, chuyển đổi, bộ đếm token, v.v.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Transcript chỉ thêm với cấu trúc cây (mục có `id` + `parentId`)
   - Lưu trữ cuộc trò chuyện thực tế + cuộc gọi công cụ + tóm tắt nén
   - Dùng để xây dựng lại ngữ cảnh mô hình cho các lượt tiếp theo

---

## Vị trí trên đĩa

Mỗi agent, trên host Gateway:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Session chủ đề Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw giải quyết những điều này qua `src/config/sessions.ts`.

---

## Bảo trì store và kiểm soát đĩa

Session persistence có các kiểm soát bảo trì tự động (`session.maintenance`) cho `sessions.json` và các artifact transcript:

- `mode`: `warn` (mặc định) hoặc `enforce`
- `pruneAfter`: cắt giảm tuổi mục không hoạt động (mặc định `30d`)
- `maxEntries`: giới hạn mục trong `sessions.json` (mặc định `500`)
- `rotateBytes`: xoay `sessions.json` khi quá kích thước (mặc định `10mb`)
- `resetArchiveRetention`: giữ lại cho các archive transcript `*.reset.<timestamp>` (mặc định: giống `pruneAfter`; `false` vô hiệu hóa dọn dẹp)
- `maxDiskBytes`: ngân sách thư mục session tùy chọn
- `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp (mặc định `80%` của `maxDiskBytes`)

Thứ tự thực thi cho dọn dẹp ngân sách đĩa (`mode: "enforce"`):

1. Xóa các artifact transcript lưu trữ hoặc mồ côi cũ nhất trước.
2. Nếu vẫn trên mục tiêu, loại bỏ các mục session cũ nhất và file transcript của chúng.
3. Tiếp tục cho đến khi sử dụng đạt hoặc dưới `highWaterBytes`.

Ở `mode: "warn"`, OpenClaw báo cáo các khả năng bị loại bỏ nhưng không thay đổi store/file.

Chạy bảo trì theo yêu cầu:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron sessions và run logs

Các lần chạy cron cô lập cũng tạo ra các mục session/transcript, và chúng có các kiểm soát giữ lại riêng:

- `cron.sessionRetention` (mặc định `24h`) cắt giảm các session chạy cron cô lập cũ từ session store (`false` vô hiệu hóa).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` cắt giảm file `~/.openclaw/cron/runs/<jobId>.jsonl` (mặc định: `2_000_000` bytes và `2000` dòng).

---

## Session keys (`sessionKey`)

Một `sessionKey` xác định _bucket cuộc trò chuyện nào_ bạn đang ở (routing + isolation).

Các mẫu phổ biến:

- Chat chính/trực tiếp (mỗi agent): `agent:<agentId>:<mainKey>` (mặc định `main`)
- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Phòng/kênh (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` hoặc `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (trừ khi bị ghi đè)

Các quy tắc chuẩn được tài liệu tại [/concepts/session](/concepts/session).

---

## Session ids (`sessionId`)

Mỗi `sessionKey` trỏ đến một `sessionId` hiện tại (file transcript tiếp tục cuộc trò chuyện).

Nguyên tắc:

- **Reset** (`/new`, `/reset`) tạo một `sessionId` mới cho `sessionKey` đó.
- **Reset hàng ngày** (mặc định 4:00 AM giờ địa phương trên host gateway) tạo một `sessionId` mới cho tin nhắn tiếp theo sau ranh giới reset.
- **Hết hạn không hoạt động** (`session.reset.idleMinutes` hoặc `session.idleMinutes` cũ) tạo một `sessionId` mới khi một tin nhắn đến sau khoảng thời gian không hoạt động. Khi cả hàng ngày + không hoạt động đều được cấu hình, cái nào hết hạn trước sẽ thắng.
- **Thread parent fork guard** (`session.parentForkMaxTokens`, mặc định `100000`) bỏ qua việc fork transcript cha khi session cha đã quá lớn; thread mới bắt đầu từ đầu. Đặt `0` để vô hiệu hóa.

Chi tiết triển khai: quyết định xảy ra trong `initSessionState()` trong `src/auto-reply/reply/session.ts`.

---

## Session store schema (`sessions.json`)

Kiểu giá trị của store là `SessionEntry` trong `src/config/sessions.ts`.

Các trường chính (không đầy đủ):

- `sessionId`: id transcript hiện tại (tên file được suy ra từ đây trừ khi `sessionFile` được đặt)
- `updatedAt`: dấu thời gian hoạt động cuối
- `sessionFile`: đường dẫn transcript rõ ràng tùy chọn
- `chatType`: `direct | group | room` (giúp UIs và chính sách gửi)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata cho nhãn nhóm/kênh
- Chuyển đổi:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (ghi đè theo session)
- Lựa chọn mô hình:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Bộ đếm token (cố gắng tốt nhất / phụ thuộc vào provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: số lần nén tự động hoàn thành cho session key này
- `memoryFlushAt`: dấu thời gian cho lần xả bộ nhớ trước khi nén cuối
- `memoryFlushCompactionCount`: số lần nén khi lần xả cuối chạy

Store an toàn để chỉnh sửa, nhưng Gateway là thẩm quyền: nó có thể viết lại hoặc tái tạo các mục khi session chạy.

---

## Cấu trúc Transcript (`*.jsonl`)

Transcripts được quản lý bởi `@mariozechner/pi-coding-agent`’s `SessionManager`.

File là JSONL:

- Dòng đầu tiên: tiêu đề session (`type: "session"`, bao gồm `id`, `cwd`, `timestamp`, `parentSession` tùy chọn)
- Sau đó: các mục session với `id` + `parentId` (cây)

Các loại mục đáng chú ý:

- `message`: tin nhắn người dùng/trợ lý/kết quả công cụ
- `custom_message`: tin nhắn được tiêm bởi extension mà _có_ vào ngữ cảnh mô hình (có thể ẩn khỏi UI)
- `custom`: trạng thái extension mà _không_ vào ngữ cảnh mô hình
- `compaction`: tóm tắt nén được lưu trữ với `firstKeptEntryId` và `tokensBefore`
- `branch_summary`: tóm tắt được lưu trữ khi điều hướng một nhánh cây

OpenClaw cố ý **không** “sửa chữa” transcripts; Gateway sử dụng `SessionManager` để đọc/ghi chúng.

---

## Cửa sổ ngữ cảnh vs token được theo dõi

Hai khái niệm khác nhau quan trọng:

1. **Cửa sổ ngữ cảnh mô hình**: giới hạn cứng cho mỗi mô hình (token thấy được cho mô hình)
2. **Bộ đếm store session**: thống kê cuộn được ghi vào `sessions.json` (dùng cho /status và dashboards)

Nếu bạn đang điều chỉnh giới hạn:

- Cửa sổ ngữ cảnh đến từ catalog mô hình (và có thể được ghi đè qua config).
- `contextTokens` trong store là giá trị ước tính/báo cáo runtime; không coi nó là đảm bảo nghiêm ngặt.

Để biết thêm, xem [/token-use](/reference/token-use).

---

## Nén: nó là gì

Nén tóm tắt cuộc trò chuyện cũ hơn thành một mục `compaction` được lưu trữ trong transcript và giữ lại các tin nhắn gần đây.

Sau khi nén, các lượt tiếp theo thấy:

- Tóm tắt nén
- Tin nhắn sau `firstKeptEntryId`

Nén là **bền vững** (không giống như cắt tỉa session). Xem [/concepts/session-pruning](/concepts/session-pruning).

---

## Khi nào tự động nén xảy ra (Pi runtime)

Trong agent Pi nhúng, tự động nén kích hoạt trong hai trường hợp:

1. **Khôi phục tràn**: mô hình trả về lỗi tràn ngữ cảnh → nén → thử lại.
2. **Bảo trì ngưỡng**: sau một lượt thành công, khi:

`contextTokens > contextWindow - reserveTokens`

Ở đâu:

- `contextWindow` là cửa sổ ngữ cảnh của mô hình
- `reserveTokens` là khoảng trống dành cho prompts + đầu ra mô hình tiếp theo

Đây là ngữ nghĩa runtime của Pi (OpenClaw tiêu thụ các sự kiện, nhưng Pi quyết định khi nào nén).

---

## Cài đặt nén (`reserveTokens`, `keepRecentTokens`)

Cài đặt nén của Pi nằm trong cài đặt Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw cũng thực thi một sàn an toàn cho các lần chạy nhúng:

- Nếu `compaction.reserveTokens < reserveTokensFloor`, OpenClaw tăng nó.
- Sàn mặc định là `20000` tokens.
- Đặt `agents.defaults.compaction.reserveTokensFloor: 0` để vô hiệu hóa sàn.
- Nếu nó đã cao hơn, OpenClaw để nguyên.

Tại sao: để lại đủ khoảng trống cho “housekeeping” nhiều lượt (như ghi bộ nhớ) trước khi nén trở nên không thể tránh khỏi.

Triển khai: `ensurePiCompactionReserveTokens()` trong `src/agents/pi-settings.ts`
(gọi từ `src/agents/pi-embedded-runner.ts`).

---

## Bề mặt thấy được cho người dùng

Bạn có thể quan sát nén và trạng thái session qua:

- `/status` (trong bất kỳ chat session nào)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Chế độ chi tiết: `🧹 Auto-compaction complete` + số lần nén

---

## Silent housekeeping (`NO_REPLY`)

OpenClaw hỗ trợ các lượt “im lặng” cho các tác vụ nền mà người dùng không nên thấy đầu ra trung gian.

Quy ước:

- Trợ lý bắt đầu đầu ra của mình với `NO_REPLY` để chỉ ra “không gửi trả lời cho người dùng”.
- OpenClaw loại bỏ/giảm bớt điều này trong lớp phân phối.

Từ `2026.1.10`, OpenClaw cũng giảm bớt **dự thảo/streaming gõ** khi một phần bắt đầu với `NO_REPLY`, vì vậy các thao tác im lặng không rò rỉ đầu ra giữa lượt.

---

## Xả bộ nhớ trước khi nén (đã triển khai)

Mục tiêu: trước khi tự động nén xảy ra, chạy một lượt agentic im lặng ghi trạng thái bền vững vào đĩa (ví dụ: `memory/YYYY-MM-DD.md` trong workspace của agent) để nén không thể xóa ngữ cảnh quan trọng.

OpenClaw sử dụng cách tiếp cận **xả trước ngưỡng**:

1. Giám sát việc sử dụng ngữ cảnh session.
2. Khi nó vượt qua một “ngưỡng mềm” (dưới ngưỡng nén của Pi), chạy một chỉ thị “ghi bộ nhớ ngay bây giờ” im lặng cho agent.
3. Sử dụng `NO_REPLY` để người dùng không thấy gì.

Cấu hình (`agents.defaults.compaction.memoryFlush`):

- `enabled` (mặc định: `true`)
- `softThresholdTokens` (mặc định: `4000`)
- `prompt` (tin nhắn người dùng cho lượt xả)
- `systemPrompt` (prompt hệ thống bổ sung cho lượt xả)

Ghi chú:

- Prompt/system prompt mặc định bao gồm một gợi ý `NO_REPLY` để giảm bớt phân phối.
- Xả chạy một lần mỗi chu kỳ nén (được theo dõi trong `sessions.json`).
- Xả chỉ chạy cho các session Pi nhúng (CLI backends bỏ qua nó).
- Xả bị bỏ qua khi workspace session chỉ đọc (`workspaceAccess: "ro"` hoặc `"none"`).
- Xem [Memory](/concepts/memory) để biết bố cục file workspace và mẫu ghi.

Pi cũng cung cấp một hook `session_before_compact` trong API extension, nhưng logic xả của OpenClaw hiện nằm ở phía Gateway.

---

## Danh sách kiểm tra khắc phục sự cố

- Session key sai? Bắt đầu với [/concepts/session](/concepts/session) và xác nhận `sessionKey` trong `/status`.
- Store vs transcript không khớp? Xác nhận host Gateway và đường dẫn store từ `openclaw status`.
- Nén spam? Kiểm tra:
  - cửa sổ ngữ cảnh mô hình (quá nhỏ)
  - cài đặt nén (`reserveTokens` quá cao cho cửa sổ mô hình có thể gây ra nén sớm hơn)
  - bloat kết quả công cụ: bật/điều chỉnh cắt tỉa session
- Lượt im lặng rò rỉ? Xác nhận trả lời bắt đầu với `NO_REPLY` (token chính xác) và bạn đang ở trên một bản build bao gồm sửa lỗi giảm bớt streaming.\n