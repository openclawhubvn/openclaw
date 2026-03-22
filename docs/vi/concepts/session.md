---
summary: "Quy tắc quản lý phiên, khóa và lưu trữ cho các cuộc trò chuyện"
read_when:
  - Thay đổi xử lý hoặc lưu trữ phiên
title: "Quản lý Phiên"
---

# Quản lý Phiên

OpenClaw coi **một phiên trò chuyện trực tiếp cho mỗi agent** là chính. Các cuộc trò chuyện trực tiếp được gộp lại thành `agent:<agentId>:<mainKey>` (mặc định là `main`), trong khi các cuộc trò chuyện nhóm/kênh có khóa riêng. `session.mainKey` được tôn trọng.

Sử dụng `session.dmScope` để kiểm soát cách **tin nhắn trực tiếp** được nhóm:

- `main` (mặc định): tất cả các tin nhắn trực tiếp chia sẻ phiên chính để liên tục.
- `per-peer`: cô lập theo id người gửi qua các kênh.
- `per-channel-peer`: cô lập theo kênh + người gửi (khuyến nghị cho hộp thư nhiều người dùng).
- `per-account-channel-peer`: cô lập theo tài khoản + kênh + người gửi (khuyến nghị cho hộp thư nhiều tài khoản).
  Sử dụng `session.identityLinks` để ánh xạ id người gửi có tiền tố nhà cung cấp thành một danh tính chuẩn để cùng một người chia sẻ một phiên DM qua các kênh khi sử dụng `per-peer`, `per-channel-peer`, hoặc `per-account-channel-peer`.

## Chế độ DM an toàn (khuyến nghị cho thiết lập nhiều người dùng)

> **Cảnh báo Bảo mật:** Nếu agent của bạn có thể nhận DM từ **nhiều người**, bạn nên cân nhắc mạnh mẽ việc kích hoạt chế độ DM an toàn. Nếu không, tất cả người dùng sẽ chia sẻ cùng một ngữ cảnh cuộc trò chuyện, có thể làm rò rỉ thông tin riêng tư giữa các người dùng.

**Ví dụ về vấn đề với cài đặt mặc định:**

- Alice (`<SENDER_A>`) nhắn tin cho agent của bạn về một chủ đề riêng tư (ví dụ, một cuộc hẹn y tế)
- Bob (`<SENDER_B>`) nhắn tin cho agent của bạn hỏi "Chúng ta đã nói về điều gì?"
- Vì cả hai DM chia sẻ cùng một phiên, mô hình có thể trả lời Bob bằng ngữ cảnh trước đó của Alice.

**Cách khắc phục:** Đặt `dmScope` để cô lập các phiên theo người dùng:

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    // Chế độ DM an toàn: cô lập ngữ cảnh DM theo kênh + người gửi.
    dmScope: "per-channel-peer",
  },
}
```

**Khi nào nên kích hoạt điều này:**

- Bạn có sự chấp thuận ghép đôi cho nhiều hơn một người gửi
- Bạn sử dụng danh sách cho phép DM với nhiều mục
- Bạn đặt `dmPolicy: "open"`
- Nhiều số điện thoại hoặc tài khoản có thể nhắn tin cho agent của bạn

Ghi chú:

- Mặc định là `dmScope: "main"` để liên tục (tất cả DM chia sẻ phiên chính). Điều này phù hợp cho thiết lập một người dùng.
- CLI cục bộ ghi `session.dmScope: "per-channel-peer"` mặc định khi chưa được đặt (giá trị rõ ràng hiện có được giữ nguyên).
- Đối với hộp thư nhiều tài khoản trên cùng một kênh, ưu tiên `per-account-channel-peer`.
- Nếu cùng một người liên hệ với bạn trên nhiều kênh, sử dụng `session.identityLinks` để gộp các phiên DM của họ thành một danh tính chuẩn.
- Bạn có thể xác minh cài đặt DM của mình với `openclaw security audit` (xem [bảo mật](/cli/security)).

## Gateway là nguồn sự thật

Tất cả trạng thái phiên được **sở hữu bởi gateway** (OpenClaw “chính”). Các khách hàng UI (ứng dụng macOS, WebChat, v.v.) phải truy vấn gateway để lấy danh sách phiên và số lượng token thay vì đọc các tệp cục bộ.

- Trong **chế độ từ xa**, kho lưu trữ phiên bạn quan tâm nằm trên máy chủ gateway từ xa, không phải trên máy Mac của bạn.
- Số lượng token hiển thị trong UI đến từ các trường lưu trữ của gateway (`inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`). Các khách hàng không phân tích các bản ghi JSONL để “sửa chữa” tổng số.

## Nơi lưu trữ trạng thái

- Trên **máy chủ gateway**:
  - Tệp lưu trữ: `~/.openclaw/agents/<agentId>/sessions/sessions.json` (mỗi agent).
- Bản ghi: `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl` (các phiên chủ đề Telegram sử dụng `.../<SessionId>-topic-<threadId>.jsonl`).
- Kho lưu trữ là một bản đồ `sessionKey -> { sessionId, updatedAt, ... }`. Xóa các mục là an toàn; chúng được tạo lại khi cần.
- Các mục nhóm có thể bao gồm `displayName`, `channel`, `subject`, `room`, và `space` để gắn nhãn các phiên trong UI.
- Các mục phiên bao gồm siêu dữ liệu `origin` (nhãn + gợi ý định tuyến) để UI có thể giải thích nguồn gốc của một phiên.
- OpenClaw **không** đọc các thư mục phiên Pi/Tau cũ.

## Bảo trì

OpenClaw áp dụng bảo trì kho lưu trữ phiên để giữ `sessions.json` và các bản ghi phiên trong giới hạn theo thời gian.

### Mặc định

- `session.maintenance.mode`: `warn`
- `session.maintenance.pruneAfter`: `30d`
- `session.maintenance.maxEntries`: `500`
- `session.maintenance.rotateBytes`: `10mb`
- `session.maintenance.resetArchiveRetention`: mặc định là `pruneAfter` (`30d`)
- `session.maintenance.maxDiskBytes`: không đặt (vô hiệu hóa)
- `session.maintenance.highWaterBytes`: mặc định là `80%` của `maxDiskBytes` khi ngân sách được kích hoạt

### Cách hoạt động

Bảo trì chạy trong quá trình ghi kho lưu trữ phiên, và bạn có thể kích hoạt nó theo yêu cầu với `openclaw sessions cleanup`.

- `mode: "warn"`: báo cáo những gì sẽ bị loại bỏ nhưng không thay đổi các mục/bản ghi.
- `mode: "enforce"`: áp dụng dọn dẹp theo thứ tự này:
  1. loại bỏ các mục cũ hơn `pruneAfter`
  2. giới hạn số lượng mục đến `maxEntries` (cũ nhất trước)
  3. lưu trữ các tệp bản ghi cho các mục đã bị loại bỏ không còn được tham chiếu
  4. xóa các bản lưu trữ `*.deleted.<timestamp>` và `*.reset.<timestamp>` cũ theo chính sách lưu trữ
  5. xoay `sessions.json` khi vượt quá `rotateBytes`
  6. nếu `maxDiskBytes` được đặt, thực thi ngân sách đĩa hướng tới `highWaterBytes` (các hiện vật cũ nhất trước, sau đó là các phiên cũ nhất)

### Lưu ý về hiệu suất cho các kho lưu trữ lớn

Các kho lưu trữ phiên lớn là phổ biến trong các thiết lập có lưu lượng cao. Công việc bảo trì là công việc trên đường ghi, vì vậy các kho lưu trữ rất lớn có thể tăng độ trễ ghi.

Những gì tăng chi phí nhất:

- giá trị `session.maintenance.maxEntries` rất cao
- cửa sổ `pruneAfter` dài giữ lại các mục cũ
- nhiều hiện vật bản ghi/lưu trữ trong `~/.openclaw/agents/<agentId>/sessions/`
- kích hoạt ngân sách đĩa (`maxDiskBytes`) mà không có giới hạn cắt tỉa/hạn chế hợp lý

Những gì cần làm:

- sử dụng `mode: "enforce"` trong sản xuất để tăng trưởng được giới hạn tự động
- đặt cả giới hạn thời gian và số lượng (`pruneAfter` + `maxEntries`), không chỉ một
- đặt `maxDiskBytes` + `highWaterBytes` cho giới hạn trên cứng trong các triển khai lớn
- giữ `highWaterBytes` thấp hơn đáng kể so với `maxDiskBytes` (mặc định là 80%)
- chạy `openclaw sessions cleanup --dry-run --json` sau khi thay đổi cấu hình để xác minh tác động dự kiến trước khi thực thi
- đối với các phiên hoạt động thường xuyên, truyền `--active-key` khi chạy dọn dẹp thủ công

### Ví dụ tùy chỉnh

Sử dụng chính sách thực thi bảo thủ:

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

Kích hoạt ngân sách đĩa cứng cho thư mục phiên:

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

Điều chỉnh cho các cài đặt lớn hơn (ví dụ):

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

## Cắt tỉa phiên

OpenClaw tự động loại bỏ **kết quả công cụ cũ** khỏi ngữ cảnh trong bộ nhớ ngay trước khi gọi LLM theo mặc định.
Điều này **không** viết lại lịch sử JSONL. Xem [/concepts/session-pruning](/concepts/session-pruning).

## Xả bộ nhớ trước khi nén

Khi một phiên gần đến tự động nén, OpenClaw có thể chạy một **lượt xả bộ nhớ im lặng**
nhắc nhở mô hình ghi chú bền vững vào đĩa. Điều này chỉ chạy khi
workspace có thể ghi. Xem [Memory](/concepts/memory) và
[Compaction](/concepts/compaction).

## Ánh xạ phương tiện → khóa phiên

- Các cuộc trò chuyện trực tiếp tuân theo `session.dmScope` (mặc định là `main`).
  - `main`: `agent:<agentId>:<mainKey>` (liên tục qua các thiết bị/kênh).
    - Nhiều số điện thoại và kênh có thể ánh xạ đến cùng một khóa chính của agent; chúng hoạt động như các phương tiện vào một cuộc trò chuyện.
  - `per-peer`: `agent:<agentId>:direct:<peerId>`.
  - `per-channel-peer`: `agent:<agentId>:<channel>:direct:<peerId>`.
  - `per-account-channel-peer`: `agent:<agentId>:<channel>:<accountId>:direct:<peerId>` (accountId mặc định là `default`).
  - Nếu `session.identityLinks` khớp với một id người gửi có tiền tố nhà cung cấp (ví dụ `telegram:123`), khóa chuẩn thay thế `<peerId>` để cùng một người chia sẻ một phiên qua các kênh.
- Các cuộc trò chuyện nhóm cô lập trạng thái: `agent:<agentId>:<channel>:group:<id>` (phòng/kênh sử dụng `agent:<agentId>:<channel>:channel:<id>`).
  - Các chủ đề diễn đàn Telegram thêm `:topic:<threadId>` vào id nhóm để cô lập.
  - Các khóa `group:<id>` cũ vẫn được công nhận để di chuyển.
- Các ngữ cảnh đầu vào có thể vẫn sử dụng `group:<id>`; kênh được suy ra từ `Provider` và chuẩn hóa thành dạng chuẩn `agent:<agentId>:<channel>:group:<id>`.
- Các nguồn khác:
  - Công việc cron: `cron:<job.id>` (cô lập) hoặc `session:<custom-id>` (bền vững)
  - Webhooks: `hook:<uuid>` (trừ khi được đặt rõ ràng bởi hook)
  - Chạy Node: `node-<nodeId>`

## Vòng đời

- Chính sách đặt lại: các phiên được tái sử dụng cho đến khi hết hạn, và hết hạn được đánh giá vào tin nhắn đầu vào tiếp theo.
- Đặt lại hàng ngày: mặc định là **4:00 AM theo giờ địa phương trên máy chủ gateway**. Một phiên là cũ khi cập nhật cuối cùng của nó sớm hơn thời gian đặt lại hàng ngày gần nhất.
- Đặt lại khi không hoạt động (tùy chọn): `idleMinutes` thêm một cửa sổ không hoạt động trượt. Khi cả đặt lại hàng ngày và không hoạt động được cấu hình, **bất kỳ cái nào hết hạn trước** sẽ buộc một phiên mới.
- Không hoạt động chỉ cũ: nếu bạn đặt `session.idleMinutes` mà không có bất kỳ cấu hình `session.reset`/`resetByType`, OpenClaw sẽ ở chế độ không hoạt động chỉ để tương thích ngược.
- Ghi đè theo loại (tùy chọn): `resetByType` cho phép bạn ghi đè chính sách cho các phiên `direct`, `group`, và `thread` (thread = các thread Slack/Discord, các chủ đề Telegram, các thread Matrix khi được cung cấp bởi connector).
- Ghi đè theo kênh (tùy chọn): `resetByChannel` ghi đè chính sách đặt lại cho một kênh (áp dụng cho tất cả các loại phiên cho kênh đó và có ưu tiên hơn `reset`/`resetByType`).
- Kích hoạt đặt lại: chính xác `/new` hoặc `/reset` (cộng với bất kỳ bổ sung nào trong `resetTriggers`) bắt đầu một id phiên mới và truyền phần còn lại của tin nhắn qua. `/new <model>` chấp nhận một bí danh mô hình, `provider/model`, hoặc tên nhà cung cấp (khớp mờ) để đặt mô hình phiên mới. Nếu `/new` hoặc `/reset` được gửi một mình, OpenClaw sẽ chạy một lượt chào ngắn để xác nhận đặt lại.
- Đặt lại thủ công: xóa các khóa cụ thể khỏi kho lưu trữ hoặc xóa bản ghi JSONL; tin nhắn tiếp theo sẽ tạo lại chúng.
- Các công việc cron cô lập luôn tạo một `sessionId` mới cho mỗi lần chạy (không tái sử dụng khi không hoạt động).

## Chính sách gửi (tùy chọn)

Chặn gửi cho các loại phiên cụ thể mà không cần liệt kê các id riêng lẻ.

```json5
{
  session: {
    sendPolicy: {
      rules: [
        { action: "deny", match: { channel: "discord", chatType: "group" } },
        { action: "deny", match: { keyPrefix: "cron:" } },
        // Khớp khóa phiên thô (bao gồm tiền tố `agent:<id>:`).
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ],
      default: "allow",
    },
  },
}
```

Ghi đè thời gian chạy (chỉ chủ sở hữu):

- `/send on` → cho phép cho phiên này
- `/send off` → từ chối cho phiên này
- `/send inherit` → xóa ghi đè và sử dụng quy tắc cấu hình
  Gửi những điều này dưới dạng tin nhắn độc lập để chúng được đăng ký.

## Cấu hình (ví dụ đổi tên tùy chọn)

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    scope: "per-sender", // giữ các khóa nhóm riêng biệt
    dmScope: "main", // liên tục DM (đặt per-channel-peer/per-account-channel-peer cho hộp thư chia sẻ)
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      // Mặc định: mode=daily, atHour=4 (giờ địa phương máy chủ gateway).
      // Nếu bạn cũng đặt idleMinutes, cái nào hết hạn trước sẽ thắng.
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

- `openclaw status` — hiển thị đường dẫn lưu trữ và các phiên gần đây.
- `openclaw sessions --json` — xuất tất cả các mục (lọc với `--active <minutes>`).
- `openclaw gateway call sessions.list --params '{}'` — lấy các phiên từ gateway đang chạy (sử dụng `--url`/`--token` để truy cập gateway từ xa).
- Gửi `/status` dưới dạng tin nhắn độc lập trong cuộc trò chuyện để xem liệu agent có thể truy cập được không, bao nhiêu ngữ cảnh phiên được sử dụng, các chuyển đổi hiện tại/nhanh/chi tiết, và khi nào thông tin đăng nhập web WhatsApp của bạn được làm mới lần cuối (giúp phát hiện nhu cầu liên kết lại).
- Gửi `/context list` hoặc `/context detail` để xem những gì có trong lời nhắc hệ thống và các tệp workspace được chèn (và các đóng góp ngữ cảnh lớn nhất).
- Gửi `/stop` (hoặc các cụm từ hủy độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`) để hủy bỏ lượt hiện tại, xóa các lượt theo dõi đã xếp hàng cho phiên đó, và dừng bất kỳ lượt chạy sub-agent nào được tạo ra từ nó (phản hồi bao gồm số lượng đã dừng).
- Gửi `/compact` (hướng dẫn tùy chọn) dưới dạng tin nhắn độc lập để tóm tắt ngữ cảnh cũ hơn và giải phóng không gian cửa sổ. Xem [/concepts/compaction](/concepts/compaction).
- Các bản ghi JSONL có thể được mở trực tiếp để xem lại các lượt đầy đủ.

## Mẹo

- Giữ khóa chính dành riêng cho lưu lượng 1:1; để các nhóm giữ khóa riêng của họ.
- Khi tự động hóa dọn dẹp, xóa các khóa riêng lẻ thay vì toàn bộ kho lưu trữ để bảo toàn ngữ cảnh ở nơi khác.

## Siêu dữ liệu nguồn gốc phiên

Mỗi mục phiên ghi lại nơi nó đến (cố gắng tốt nhất) trong `origin`:

- `label`: nhãn người dùng (được giải quyết từ nhãn cuộc trò chuyện + chủ đề nhóm/kênh)
- `provider`: id kênh đã chuẩn hóa (bao gồm các phần mở rộng)
- `from`/`to`: id định tuyến thô từ phong bì đầu vào
- `accountId`: id tài khoản nhà cung cấp (khi nhiều tài khoản)
- `threadId`: id thread/chủ đề khi kênh hỗ trợ
  Các trường nguồn gốc được điền cho tin nhắn trực tiếp, kênh, và nhóm. Nếu một
  connector chỉ cập nhật định tuyến giao hàng (ví dụ, để giữ một phiên DM chính
  mới), nó vẫn nên cung cấp ngữ cảnh đầu vào để phiên giữ lại siêu dữ liệu giải thích của nó. Các phần mở rộng có thể làm điều này bằng cách gửi `ConversationLabel`,
  `GroupSubject`, `GroupChannel`, `GroupSpace`, và `SenderName` trong ngữ cảnh đầu vào và gọi `recordSessionMetaFromInbound` (hoặc truyền cùng ngữ cảnh
  đến `updateLastRoute`).
