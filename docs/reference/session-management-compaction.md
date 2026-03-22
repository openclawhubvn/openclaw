---
summary: "Tìm hiểu cách lưu trữ, quản lý vòng đời phiên và nén dữ liệu tự động hiệu quả. Tối ưu hóa hệ thống của bạn ngay hôm nay."
read_when:
  - Cần gỡ lỗi session ids, transcript JSONL, hoặc các trường trong sessions.json
  - Đang thay đổi hành vi tự động nén hoặc thêm công việc dọn dẹp trước khi nén
  - Muốn triển khai xả bộ nhớ hoặc các thao tác hệ thống im lặng
title: "Hướng Dẫn Quản Lý Phiên và Nén Dữ Liệu"
---

# Quản Lý Phiên & Nén (Khám Phá Sâu)

Tài liệu này giải thích cách OpenClaw quản lý các phiên từ đầu đến cuối:

- **Định tuyến phiên** (cách các tin nhắn đến được ánh xạ tới `sessionKey`)
- **Lưu trữ phiên** (`sessions.json`) và những gì nó theo dõi
- **Lưu trữ bản ghi** (`*.jsonl`) và cấu trúc của nó
- **Vệ sinh bản ghi** (sửa chữa cụ thể theo nhà cung cấp trước khi chạy)
- **Giới hạn ngữ cảnh** (cửa sổ ngữ cảnh so với các token được theo dõi)
- **Nén** (nén thủ công + tự động) và nơi để gắn công việc trước khi nén
- **Dọn dẹp im lặng** (ví dụ: ghi bộ nhớ mà không tạo ra đầu ra thấy được cho người dùng)

Nếu muốn có cái nhìn tổng quan hơn, hãy bắt đầu với:

- [/concepts/session](/concepts/session)
- [/concepts/compaction](/concepts/compaction)
- [/concepts/session-pruning](/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## Nguồn sự thật: Gateway

OpenClaw được thiết kế xoay quanh một **quá trình Gateway duy nhất** sở hữu trạng thái phiên.

- Các giao diện người dùng (ứng dụng macOS, giao diện điều khiển web, TUI) nên truy vấn Gateway để lấy danh sách phiên và số lượng token.
- Ở chế độ từ xa, các tệp phiên nằm trên máy chủ từ xa; “kiểm tra các tệp trên máy Mac của bạn” sẽ không phản ánh những gì Gateway đang sử dụng.

---

## Hai lớp lưu trữ

OpenClaw lưu trữ các phiên trong hai lớp:

1. **Lưu trữ phiên (`sessions.json`)**
   - Bản đồ khóa/giá trị: `sessionKey -> SessionEntry`
   - Nhỏ, có thể chỉnh sửa, an toàn để chỉnh sửa (hoặc xóa các mục)
   - Theo dõi siêu dữ liệu phiên (id phiên hiện tại, hoạt động cuối cùng, chuyển đổi, bộ đếm token, v.v.)

2. **Bản ghi (`<sessionId>.jsonl`)**
   - Bản ghi chỉ thêm với cấu trúc cây (các mục có `id` + `parentId`)
   - Lưu trữ cuộc trò chuyện thực tế + các cuộc gọi công cụ + tóm tắt nén
   - Dùng để tái tạo ngữ cảnh mô hình cho các lượt tiếp theo

---

## Vị trí trên đĩa

Mỗi agent, trên máy chủ Gateway:

- Lưu trữ: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Bản ghi: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Phiên chủ đề Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw giải quyết những điều này thông qua `src/config/sessions.ts`.

---

## Bảo trì lưu trữ và kiểm soát đĩa

Lưu trữ phiên có các kiểm soát bảo trì tự động (`session.maintenance`) cho `sessions.json` và các bản ghi:

- `mode`: `warn` (mặc định) hoặc `enforce`
- `pruneAfter`: ngưỡng tuổi mục không hoạt động (mặc định `30d`)
- `maxEntries`: giới hạn số mục trong `sessions.json` (mặc định `500`)
- `rotateBytes`: xoay `sessions.json` khi quá kích thước (mặc định `10mb`)
- `resetArchiveRetention`: thời gian lưu trữ cho các bản ghi `*.reset.<timestamp>` (mặc định: giống `pruneAfter`; `false` vô hiệu hóa dọn dẹp)
- `maxDiskBytes`: ngân sách tùy chọn cho thư mục phiên
- `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp (mặc định `80%` của `maxDiskBytes`)

Thứ tự thực thi cho dọn dẹp ngân sách đĩa (`mode: "enforce"`):

1. Xóa các bản ghi lưu trữ hoặc mồ côi cũ nhất trước.
2. Nếu vẫn trên mục tiêu, loại bỏ các mục phiên cũ nhất và các tệp bản ghi của chúng.
3. Tiếp tục cho đến khi sử dụng đạt hoặc dưới `highWaterBytes`.

Trong `mode: "warn"`, OpenClaw báo cáo các khả năng loại bỏ nhưng không thay đổi lưu trữ/tệp.

Chạy bảo trì theo yêu cầu:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Phiên cron và nhật ký chạy

Các lần chạy cron cô lập cũng tạo ra các mục phiên/bản ghi, và chúng có các kiểm soát lưu trữ riêng:

- `cron.sessionRetention` (mặc định `24h`) loại bỏ các phiên chạy cron cô lập cũ khỏi lưu trữ phiên (`false` vô hiệu hóa).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` loại bỏ các tệp `~/.openclaw/cron/runs/<jobId>.jsonl` (mặc định: `2_000_000` byte và `2000` dòng).

---

## Khóa phiên (`sessionKey`)

Một `sessionKey` xác định _bucket cuộc trò chuyện nào_ bạn đang ở (định tuyến + cô lập).

Các mẫu phổ biến:

- Chat chính/trực tiếp (mỗi agent): `agent:<agentId>:<mainKey>` (mặc định `main`)
- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Phòng/kênh (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` hoặc `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (trừ khi bị ghi đè)

Các quy tắc chuẩn được ghi lại tại [/concepts/session](/concepts/session).

---

## Id phiên (`sessionId`)

Mỗi `sessionKey` trỏ đến một `sessionId` hiện tại (tệp bản ghi tiếp tục cuộc trò chuyện).

Nguyên tắc chung:

- **Reset** (`/new`, `/reset`) tạo một `sessionId` mới cho `sessionKey` đó.
- **Reset hàng ngày** (mặc định 4:00 AM giờ địa phương trên máy chủ gateway) tạo một `sessionId` mới vào tin nhắn tiếp theo sau ranh giới reset.
- **Hết hạn không hoạt động** (`session.reset.idleMinutes` hoặc `session.idleMinutes` cũ) tạo một `sessionId` mới khi một tin nhắn đến sau cửa sổ không hoạt động. Khi cả hai cấu hình hàng ngày + không hoạt động, cái nào hết hạn trước sẽ thắng.
- **Bảo vệ fork cha luồng** (`session.parentForkMaxTokens`, mặc định `100000`) bỏ qua fork bản ghi cha khi phiên cha đã quá lớn; luồng mới bắt đầu từ đầu. Đặt `0` để vô hiệu hóa.

Chi tiết triển khai: quyết định xảy ra trong `initSessionState()` trong `src/auto-reply/reply/session.ts`.

---

## Schema lưu trữ phiên (`sessions.json`)

Giá trị của lưu trữ là `SessionEntry` trong `src/config/sessions.ts`.

Các trường chính (không đầy đủ):

- `sessionId`: id bản ghi hiện tại (tên tệp được suy ra từ đây trừ khi `sessionFile` được đặt)
- `updatedAt`: dấu thời gian hoạt động cuối cùng
- `sessionFile`: đường dẫn bản ghi rõ ràng tùy chọn
- `chatType`: `direct | group | room` (giúp các giao diện người dùng và chính sách gửi)
- `provider`, `subject`, `room`, `space`, `displayName`: siêu dữ liệu cho nhãn nhóm/kênh
- Chuyển đổi:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (ghi đè theo phiên)
- Lựa chọn mô hình:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Bộ đếm token (nỗ lực tốt nhất / phụ thuộc vào nhà cung cấp):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: số lần nén tự động hoàn thành cho khóa phiên này
- `memoryFlushAt`: dấu thời gian cho lần xả bộ nhớ trước khi nén cuối cùng
- `memoryFlushCompactionCount`: số lần nén khi lần xả cuối cùng chạy

Lưu trữ an toàn để chỉnh sửa, nhưng Gateway là thẩm quyền: nó có thể viết lại hoặc tái tạo các mục khi các phiên chạy.

---

## Cấu trúc bản ghi (`*.jsonl`)

Bản ghi được quản lý bởi `@mariozechner/pi-coding-agent`’s `SessionManager`.

Tệp là JSONL:

- Dòng đầu tiên: tiêu đề phiên (`type: "session"`, bao gồm `id`, `cwd`, `timestamp`, `parentSession` tùy chọn)
- Sau đó: các mục phiên với `id` + `parentId` (cây)

Các loại mục đáng chú ý:

- `message`: tin nhắn người dùng/trợ lý/kết quả công cụ
- `custom_message`: tin nhắn được tiêm bởi tiện ích mở rộng mà _có_ vào ngữ cảnh mô hình (có thể bị ẩn khỏi giao diện người dùng)
- `custom`: trạng thái tiện ích mở rộng mà _không_ vào ngữ cảnh mô hình
- `compaction`: tóm tắt nén được lưu trữ với `firstKeptEntryId` và `tokensBefore`
- `branch_summary`: tóm tắt được lưu trữ khi điều hướng một nhánh cây

OpenClaw cố ý **không** “sửa chữa” các bản ghi; Gateway sử dụng `SessionManager` để đọc/ghi chúng.

---

## Cửa sổ ngữ cảnh so với các token được theo dõi

Hai khái niệm khác nhau quan trọng:

1. **Cửa sổ ngữ cảnh mô hình**: giới hạn cứng cho mỗi mô hình (các token thấy được bởi mô hình)
2. **Bộ đếm lưu trữ phiên**: thống kê cuộn được ghi vào `sessions.json` (dùng cho /status và bảng điều khiển)

Nếu bạn đang điều chỉnh giới hạn:

- Cửa sổ ngữ cảnh đến từ danh mục mô hình (và có thể được ghi đè qua cấu hình).
- `contextTokens` trong lưu trữ là giá trị ước tính/báo cáo thời gian chạy; không coi đó là một đảm bảo nghiêm ngặt.

Để biết thêm, xem [/token-use](/reference/token-use).

---

## Nén: nó là gì

Nén tóm tắt cuộc trò chuyện cũ hơn thành một mục `compaction` được lưu trữ trong bản ghi và giữ lại các tin nhắn gần đây.

Sau khi nén, các lượt tương lai thấy:

- Tóm tắt nén
- Tin nhắn sau `firstKeptEntryId`

Nén là **bền vững** (không giống như cắt tỉa phiên). Xem [/concepts/session-pruning](/concepts/session-pruning).

---

## Khi nào tự động nén xảy ra (Pi runtime)

Trong agent Pi nhúng, tự động nén kích hoạt trong hai trường hợp:

1. **Phục hồi tràn**: mô hình trả về lỗi tràn ngữ cảnh → nén → thử lại.
2. **Bảo trì ngưỡng**: sau một lượt thành công, khi:

`contextTokens > contextWindow - reserveTokens`

Trong đó:

- `contextWindow` là cửa sổ ngữ cảnh của mô hình
- `reserveTokens` là khoảng trống dành cho các lời nhắc + đầu ra mô hình tiếp theo

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
- Sàn mặc định là `20000` token.
- Đặt `agents.defaults.compaction.reserveTokensFloor: 0` để vô hiệu hóa sàn.
- Nếu nó đã cao hơn, OpenClaw để yên.

Lý do: để lại đủ khoảng trống cho “dọn dẹp” nhiều lượt (như ghi bộ nhớ) trước khi nén trở nên không thể tránh khỏi.

Triển khai: `ensurePiCompactionReserveTokens()` trong `src/agents/pi-settings.ts`
(gọi từ `src/agents/pi-embedded-runner.ts`).

---

## Bề mặt thấy được cho người dùng

Bạn có thể quan sát nén và trạng thái phiên qua:

- `/status` (trong bất kỳ phiên chat nào)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Chế độ chi tiết: `🧹 Auto-compaction complete` + số lần nén

---

## Dọn dẹp im lặng (`NO_REPLY`)

OpenClaw hỗ trợ các lượt “im lặng” cho các tác vụ nền mà người dùng không nên thấy đầu ra trung gian.

Quy ước:

- Trợ lý bắt đầu đầu ra của mình với `NO_REPLY` để chỉ ra “không gửi trả lời cho người dùng”.
- OpenClaw loại bỏ/ẩn điều này trong lớp phân phối.

Từ `2026.1.10`, OpenClaw cũng ẩn **dự thảo/đánh máy streaming** khi một phần bắt đầu với `NO_REPLY`, vì vậy các hoạt động im lặng không rò rỉ đầu ra trung gian giữa lượt.

---

## Xả bộ nhớ trước khi nén (đã triển khai)

Mục tiêu: trước khi tự động nén xảy ra, chạy một lượt agent im lặng ghi trạng thái bền vững vào đĩa (ví dụ: `memory/YYYY-MM-DD.md` trong không gian làm việc của agent) để nén không thể xóa ngữ cảnh quan trọng.

OpenClaw sử dụng cách tiếp cận **xả trước ngưỡng**:

1. Giám sát việc sử dụng ngữ cảnh phiên.
2. Khi nó vượt qua một “ngưỡng mềm” (dưới ngưỡng nén của Pi), chạy một chỉ thị “ghi bộ nhớ ngay” im lặng cho agent.
3. Sử dụng `NO_REPLY` để người dùng không thấy gì.

Cấu hình (`agents.defaults.compaction.memoryFlush`):

- `enabled` (mặc định: `true`)
- `softThresholdTokens` (mặc định: `4000`)
- `prompt` (tin nhắn người dùng cho lượt xả)
- `systemPrompt` (lời nhắc hệ thống bổ sung được thêm vào cho lượt xả)

Ghi chú:

- Lời nhắc mặc định/lời nhắc hệ thống bao gồm một gợi ý `NO_REPLY` để ẩn phân phối.
- Xả chạy một lần mỗi chu kỳ nén (được theo dõi trong `sessions.json`).
- Xả chỉ chạy cho các phiên Pi nhúng (CLI backends bỏ qua nó).
- Xả bị bỏ qua khi không gian làm việc của phiên chỉ đọc (`workspaceAccess: "ro"` hoặc `"none"`).
- Xem [Memory](/concepts/memory) để biết bố cục tệp không gian làm việc và các mẫu ghi.

Pi cũng cung cấp một hook `session_before_compact` trong API tiện ích mở rộng, nhưng logic xả của OpenClaw hiện nằm ở phía Gateway.

---

## Danh sách kiểm tra khắc phục sự cố

- Khóa phiên sai? Bắt đầu với [/concepts/session](/concepts/session) và xác nhận `sessionKey` trong `/status`.
- Lưu trữ so với bản ghi không khớp? Xác nhận máy chủ Gateway và đường dẫn lưu trữ từ `openclaw status`.
- Nén spam? Kiểm tra:
  - cửa sổ ngữ cảnh mô hình (quá nhỏ)
  - cài đặt nén (`reserveTokens` quá cao cho cửa sổ mô hình có thể gây ra nén sớm hơn)
  - phình to kết quả công cụ: bật/điều chỉnh cắt tỉa phiên
- Lượt im lặng bị rò rỉ? Xác nhận trả lời bắt đầu với `NO_REPLY` (token chính xác) và bạn đang ở trên bản dựng bao gồm sửa lỗi ẩn streaming.
