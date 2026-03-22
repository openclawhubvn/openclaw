---
summary: "Tìm hiểu cách cấu hình và kiểm tra định kỳ Heartbeat Gateway để đảm bảo hệ thống hoạt động ổn định."
read_when:
  - Điều chỉnh tần suất kiểm tra định kỳ hoặc thông điệp
  - Quyết định giữa kiểm tra định kỳ và cron cho các tác vụ theo lịch
title: "Hướng Dẫn Cấu Hình Heartbeat Gateway"
---

# Kiểm tra định kỳ (Gateway)

> **Kiểm tra định kỳ hay Cron?** Xem [Cron vs Kiểm tra định kỳ](/automation/cron-vs-heartbeat) để biết khi nào nên sử dụng từng loại.

Kiểm tra định kỳ thực hiện **các lượt tác vụ định kỳ** trong phiên chính để mô hình có thể hiển thị những gì cần chú ý mà không làm phiền bạn.

Khắc phục sự cố: [/automation/troubleshooting](/automation/troubleshooting)

## Bắt đầu nhanh (dành cho người mới)

1. Giữ kiểm tra định kỳ được bật (mặc định là `30m`, hoặc `1h` cho Anthropic OAuth/setup-token) hoặc đặt tần suất riêng.
2. Tạo một danh sách kiểm tra nhỏ `HEARTBEAT.md` trong không gian làm việc của tác vụ (không bắt buộc nhưng nên làm).
3. Quyết định nơi thông điệp kiểm tra định kỳ sẽ được gửi (`target: "none"` là mặc định; đặt `target: "last"` để gửi đến liên hệ cuối cùng).
4. Tùy chọn: bật tính năng gửi lý do kiểm tra định kỳ để minh bạch.
5. Tùy chọn: sử dụng ngữ cảnh khởi động nhẹ nếu kiểm tra định kỳ chỉ cần `HEARTBEAT.md`.
6. Tùy chọn: bật các phiên cách ly để tránh gửi toàn bộ lịch sử hội thoại mỗi lần kiểm tra định kỳ.
7. Tùy chọn: giới hạn kiểm tra định kỳ trong giờ hoạt động (giờ địa phương).

Ví dụ cấu hình:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // gửi rõ ràng đến liên hệ cuối cùng (mặc định là "none")
        directPolicy: "allow", // mặc định: cho phép gửi trực tiếp/DM; đặt "block" để chặn
        lightContext: true, // tùy chọn: chỉ chèn HEARTBEAT.md từ các tệp khởi động
        isolatedSession: true, // tùy chọn: phiên mới mỗi lần chạy (không có lịch sử hội thoại)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // tùy chọn: gửi thêm thông điệp `Reasoning:`
      },
    },
  },
}
```

## Mặc định

- Khoảng thời gian: `30m` (hoặc `1h` khi phát hiện chế độ xác thực Anthropic OAuth/setup-token). Đặt `agents.defaults.heartbeat.every` hoặc cho từng tác vụ `agents.list[].heartbeat.every`; sử dụng `0m` để tắt.
- Nội dung nhắc nhở (có thể cấu hình qua `agents.defaults.heartbeat.prompt`):
  `Đọc HEARTBEAT.md nếu có (ngữ cảnh không gian làm việc). Thực hiện nghiêm ngặt. Không suy diễn hoặc lặp lại các tác vụ cũ từ các cuộc trò chuyện trước. Nếu không có gì cần chú ý, trả lời HEARTBEAT_OK.`
- Lời nhắc kiểm tra định kỳ được gửi **nguyên văn** như thông điệp của người dùng. Lời nhắc hệ thống bao gồm phần “Kiểm tra định kỳ” và lượt chạy được đánh dấu nội bộ.
- Giờ hoạt động (`heartbeat.activeHours`) được kiểm tra theo múi giờ đã cấu hình. Ngoài khung giờ này, kiểm tra định kỳ bị bỏ qua cho đến lần chạy tiếp theo trong khung giờ.

## Mục đích của lời nhắc kiểm tra định kỳ

Lời nhắc mặc định được thiết kế rộng rãi:

- **Tác vụ nền**: “Xem xét các tác vụ còn lại” nhắc nhở tác vụ xem xét các công việc tiếp theo (hộp thư đến, lịch, nhắc nhở, công việc xếp hàng) và hiển thị bất kỳ điều gì khẩn cấp.
- **Kiểm tra con người**: “Thỉnh thoảng kiểm tra con người của bạn trong giờ làm việc” nhắc nhở một thông điệp nhẹ nhàng “có cần gì không?”, nhưng tránh gửi vào ban đêm bằng cách sử dụng múi giờ địa phương đã cấu hình (xem [/concepts/timezone](/concepts/timezone)).

Nếu bạn muốn kiểm tra định kỳ thực hiện điều gì đó rất cụ thể (ví dụ: “kiểm tra thống kê Gmail PubSub” hoặc “xác minh tình trạng gateway”), đặt `agents.defaults.heartbeat.prompt` (hoặc `agents.list[].heartbeat.prompt`) thành nội dung tùy chỉnh (gửi nguyên văn).

## Hợp đồng phản hồi

- Nếu không có gì cần chú ý, trả lời với **`HEARTBEAT_OK`**.
- Trong các lần chạy kiểm tra định kỳ, OpenClaw coi `HEARTBEAT_OK` là một xác nhận khi nó xuất hiện ở **đầu hoặc cuối** của phản hồi. Token này bị loại bỏ và phản hồi bị loại bỏ nếu nội dung còn lại **≤ `ackMaxChars`** (mặc định: 300).
- Nếu `HEARTBEAT_OK` xuất hiện ở **giữa** phản hồi, nó không được xử lý đặc biệt.
- Đối với cảnh báo, **không** bao gồm `HEARTBEAT_OK`; chỉ trả về văn bản cảnh báo.

Ngoài các lần kiểm tra định kỳ, `HEARTBEAT_OK` lạc lõng ở đầu/cuối thông điệp sẽ bị loại bỏ và ghi lại; một thông điệp chỉ có `HEARTBEAT_OK` sẽ bị loại bỏ.

## Cấu hình

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // mặc định: 30m (0m để tắt)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // mặc định: false (gửi thông điệp Reasoning: riêng khi có)
        lightContext: false, // mặc định: false; true chỉ giữ lại HEARTBEAT.md từ các tệp khởi động không gian làm việc
        isolatedSession: false, // mặc định: false; true chạy mỗi lần kiểm tra định kỳ trong một phiên mới (không có lịch sử hội thoại)
        target: "last", // mặc định: none | tùy chọn: last | none | <channel id> (core hoặc plugin, ví dụ: "bluebubbles")
        to: "+15551234567", // tùy chọn ghi đè kênh cụ thể
        accountId: "ops-bot", // tùy chọn id kênh đa tài khoản
        prompt: "Đọc HEARTBEAT.md nếu có (ngữ cảnh không gian làm việc). Thực hiện nghiêm ngặt. Không suy diễn hoặc lặp lại các tác vụ cũ từ các cuộc trò chuyện trước. Nếu không có gì cần chú ý, trả lời HEARTBEAT_OK.",
        ackMaxChars: 300, // số ký tự tối đa cho phép sau HEARTBEAT_OK
      },
    },
  },
}
```

### Phạm vi và thứ tự ưu tiên

- `agents.defaults.heartbeat` thiết lập hành vi kiểm tra định kỳ toàn cầu.
- `agents.list[].heartbeat` hợp nhất lên trên; nếu bất kỳ tác vụ nào có khối `heartbeat`, **chỉ những tác vụ đó** thực hiện kiểm tra định kỳ.
- `channels.defaults.heartbeat` thiết lập mặc định về khả năng hiển thị cho tất cả các kênh.
- `channels.<channel>.heartbeat` ghi đè mặc định của kênh.
- `channels.<channel>.accounts.<id>.heartbeat` (kênh đa tài khoản) ghi đè cài đặt theo kênh.

### Kiểm tra định kỳ theo tác vụ

Nếu bất kỳ mục `agents.list[]` nào bao gồm khối `heartbeat`, **chỉ những tác vụ đó** thực hiện kiểm tra định kỳ. Khối theo tác vụ hợp nhất lên trên `agents.defaults.heartbeat` (vì vậy bạn có thể thiết lập mặc định chung một lần và ghi đè theo từng tác vụ).

Ví dụ: hai tác vụ, chỉ tác vụ thứ hai thực hiện kiểm tra định kỳ.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // gửi rõ ràng đến liên hệ cuối cùng (mặc định là "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          prompt: "Đọc HEARTBEAT.md nếu có (ngữ cảnh không gian làm việc). Thực hiện nghiêm ngặt. Không suy diễn hoặc lặp lại các tác vụ cũ từ các cuộc trò chuyện trước. Nếu không có gì cần chú ý, trả lời HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Ví dụ về giờ hoạt động

Giới hạn kiểm tra định kỳ trong giờ làm việc tại một múi giờ cụ thể:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // gửi rõ ràng đến liên hệ cuối cùng (mặc định là "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // tùy chọn; sử dụng userTimezone của bạn nếu đã đặt, nếu không thì múi giờ của máy chủ
        },
      },
    },
  },
}
```

Ngoài khung giờ này (trước 9 giờ sáng hoặc sau 10 giờ tối theo giờ miền Đông), kiểm tra định kỳ bị bỏ qua. Lần chạy tiếp theo trong khung giờ sẽ diễn ra bình thường.

### Cài đặt 24/7

Nếu bạn muốn kiểm tra định kỳ chạy cả ngày, sử dụng một trong các mẫu sau:

- Bỏ qua `activeHours` hoàn toàn (không có giới hạn thời gian; đây là hành vi mặc định).
- Đặt khung giờ cả ngày: `activeHours: { start: "00:00", end: "24:00" }`.

Không đặt cùng thời gian `start` và `end` (ví dụ `08:00` đến `08:00`). Điều này được coi là một khung giờ không có độ rộng, vì vậy kiểm tra định kỳ luôn bị bỏ qua.

### Ví dụ về đa tài khoản

Sử dụng `accountId` để nhắm mục tiêu một tài khoản cụ thể trên các kênh đa tài khoản như Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // tùy chọn: gửi đến một chủ đề/cuộc trò chuyện cụ thể
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Ghi chú trường

- `every`: khoảng thời gian kiểm tra định kỳ (chuỗi thời lượng; đơn vị mặc định = phút).
- `model`: ghi đè mô hình tùy chọn cho các lần chạy kiểm tra định kỳ (`provider/model`).
- `includeReasoning`: khi bật, cũng gửi thông điệp `Reasoning:` riêng khi có (cùng hình dạng với `/reasoning on`).
- `lightContext`: khi true, các lần chạy kiểm tra định kỳ sử dụng ngữ cảnh khởi động nhẹ và chỉ giữ lại `HEARTBEAT.md` từ các tệp khởi động không gian làm việc.
- `isolatedSession`: khi true, mỗi lần kiểm tra định kỳ chạy trong một phiên mới không có lịch sử hội thoại trước đó. Sử dụng cùng một mẫu cách ly như cron `sessionTarget: "isolated"`. Giảm đáng kể chi phí token cho mỗi lần kiểm tra định kỳ. Kết hợp với `lightContext: true` để tiết kiệm tối đa. Định tuyến gửi vẫn sử dụng ngữ cảnh phiên chính.
- `session`: khóa phiên tùy chọn cho các lần chạy kiểm tra định kỳ.
  - `main` (mặc định): phiên chính của tác vụ.
  - Khóa phiên rõ ràng (sao chép từ `openclaw sessions --json` hoặc [sessions CLI](/cli/sessions)).
  - Định dạng khóa phiên: xem [Sessions](/concepts/session) và [Groups](/channels/groups).
- `target`:
  - `last`: gửi đến kênh bên ngoài được sử dụng cuối cùng.
  - kênh rõ ràng: `whatsapp` / `telegram` / `discord` / `googlechat` / `slack` / `msteams` / `signal` / `imessage`.
  - `none` (mặc định): chạy kiểm tra định kỳ nhưng **không gửi** ra bên ngoài.
- `directPolicy`: kiểm soát hành vi gửi trực tiếp/DM:
  - `allow` (mặc định): cho phép gửi trực tiếp/DM kiểm tra định kỳ.
  - `block`: chặn gửi trực tiếp/DM (`reason=dm-blocked`).
- `to`: ghi đè người nhận tùy chọn (id kênh cụ thể, ví dụ E.164 cho WhatsApp hoặc id cuộc trò chuyện Telegram). Đối với chủ đề/cuộc trò chuyện Telegram, sử dụng `<chatId>:topic:<messageThreadId>`.
- `accountId`: id tài khoản tùy chọn cho các kênh đa tài khoản. Khi `target: "last"`, id tài khoản áp dụng cho kênh cuối cùng đã giải quyết nếu nó hỗ trợ tài khoản; nếu không thì bị bỏ qua. Nếu id tài khoản không khớp với tài khoản đã cấu hình cho kênh đã giải quyết, việc gửi bị bỏ qua.
- `prompt`: ghi đè nội dung nhắc nhở mặc định (không hợp nhất).
- `ackMaxChars`: số ký tự tối đa cho phép sau `HEARTBEAT_OK` trước khi gửi.
- `suppressToolErrorWarnings`: khi true, chặn các cảnh báo lỗi công cụ trong các lần chạy kiểm tra định kỳ.
- `activeHours`: giới hạn các lần chạy kiểm tra định kỳ trong một khung giờ. Đối tượng với `start` (HH:MM, bao gồm; sử dụng `00:00` cho đầu ngày), `end` (HH:MM không bao gồm; `24:00` cho phép cho cuối ngày), và `timezone` tùy chọn.
  - Bỏ qua hoặc `"user"`: sử dụng `agents.defaults.userTimezone` của bạn nếu đã đặt, nếu không thì sử dụng múi giờ hệ thống máy chủ.
  - `"local"`: luôn sử dụng múi giờ hệ thống máy chủ.
  - Bất kỳ định danh IANA nào (ví dụ `America/New_York`): sử dụng trực tiếp; nếu không hợp lệ, sử dụng hành vi `"user"` ở trên.
  - `start` và `end` không được bằng nhau cho một khung giờ hoạt động; các giá trị bằng nhau được coi là không có độ rộng (luôn ngoài khung giờ).
  - Ngoài khung giờ hoạt động, các lần kiểm tra định kỳ bị bỏ qua cho đến lần chạy tiếp theo trong khung giờ.

## Hành vi gửi

- Kiểm tra định kỳ chạy trong phiên chính của tác vụ theo mặc định (`agent:<id>:<mainKey>`),
  hoặc `global` khi `session.scope = "global"`. Đặt `session` để ghi đè sang một
  phiên kênh cụ thể (Discord/WhatsApp/v.v.).
- `session` chỉ ảnh hưởng đến ngữ cảnh chạy; việc gửi được kiểm soát bởi `target` và `to`.
- Để gửi đến một kênh/người nhận cụ thể, đặt `target` + `to`. Với
  `target: "last"`, việc gửi sử dụng kênh bên ngoài cuối cùng cho phiên đó.
- Việc gửi kiểm tra định kỳ cho phép các mục tiêu trực tiếp/DM theo mặc định. Đặt `directPolicy: "block"` để chặn gửi đến mục tiêu trực tiếp trong khi vẫn chạy lượt kiểm tra định kỳ.
- Nếu hàng đợi chính bận, kiểm tra định kỳ bị bỏ qua và thử lại sau.
- Nếu `target` không giải quyết được đến đích bên ngoài, lượt chạy vẫn diễn ra nhưng không có
  thông điệp gửi ra ngoài.
- Các phản hồi chỉ kiểm tra định kỳ **không** giữ phiên hoạt động; `updatedAt` cuối cùng
  được khôi phục để hết hạn không hoạt động hoạt động bình thường.

## Kiểm soát khả năng hiển thị

Theo mặc định, các xác nhận `HEARTBEAT_OK` bị chặn trong khi nội dung cảnh báo được
gửi. Bạn có thể điều chỉnh điều này theo kênh hoặc theo tài khoản:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ẩn HEARTBEAT_OK (mặc định)
      showAlerts: true # Hiển thị thông điệp cảnh báo (mặc định)
      useIndicator: true # Phát ra sự kiện chỉ báo (mặc định)
  telegram:
    heartbeat:
      showOk: true # Hiển thị xác nhận OK trên Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Chặn gửi cảnh báo cho tài khoản này
```

Thứ tự ưu tiên: theo tài khoản → theo kênh → mặc định kênh → mặc định tích hợp sẵn.

### Tác dụng của từng cờ

- `showOk`: gửi xác nhận `HEARTBEAT_OK` khi mô hình trả về phản hồi chỉ OK.
- `showAlerts`: gửi nội dung cảnh báo khi mô hình trả về phản hồi không OK.
- `useIndicator`: phát ra sự kiện chỉ báo cho các bề mặt trạng thái giao diện người dùng.

Nếu **cả ba** đều là false, OpenClaw bỏ qua lượt chạy kiểm tra định kỳ hoàn toàn (không gọi mô hình).

### Ví dụ theo kênh so với theo tài khoản

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # tất cả các tài khoản Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # chặn cảnh báo chỉ cho tài khoản ops
  telegram:
    heartbeat:
      showOk: true
```

### Mẫu phổ biến

| Mục tiêu                                   | Cấu hình                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Hành vi mặc định (OK im lặng, cảnh báo bật) | _(không cần cấu hình)_                                                                     |
| Hoàn toàn im lặng (không thông điệp, không chỉ báo) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Chỉ chỉ báo (không thông điệp)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK chỉ trong một kênh                      | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (không bắt buộc)

Nếu tệp `HEARTBEAT.md` tồn tại trong không gian làm việc, lời nhắc mặc định yêu cầu
tác vụ đọc nó. Hãy coi nó như “danh sách kiểm tra định kỳ” của bạn: nhỏ, ổn định và
an toàn để bao gồm mỗi 30 phút.

Nếu `HEARTBEAT.md` tồn tại nhưng thực tế trống (chỉ có dòng trống và tiêu đề markdown
như `# Heading`), OpenClaw bỏ qua lượt chạy kiểm tra định kỳ để tiết kiệm cuộc gọi API.
Nếu tệp bị thiếu, kiểm tra định kỳ vẫn chạy và mô hình quyết định phải làm gì.

Giữ nó nhỏ (danh sách kiểm tra ngắn hoặc nhắc nhở) để tránh phình to lời nhắc.

Ví dụ `HEARTBEAT.md`:

```md
# Danh sách kiểm tra định kỳ

- Quét nhanh: có gì khẩn cấp trong hộp thư đến không?
- Nếu là ban ngày, thực hiện kiểm tra nhẹ nhàng nếu không có gì khác đang chờ.
- Nếu một tác vụ bị chặn, ghi lại _những gì còn thiếu_ và hỏi Peter lần sau.
```

### Tác vụ có thể cập nhật HEARTBEAT.md không?

Có — nếu bạn yêu cầu nó.

`HEARTBEAT.md` chỉ là một tệp bình thường trong không gian làm việc của tác vụ, vì vậy bạn có thể yêu cầu
tác vụ (trong một cuộc trò chuyện bình thường) điều gì đó như:

- “Cập nhật `HEARTBEAT.md` để thêm kiểm tra lịch hàng ngày.”
- “Viết lại `HEARTBEAT.md` để nó ngắn hơn và tập trung vào các công việc tiếp theo trong hộp thư đến.”

Nếu bạn muốn điều này xảy ra chủ động, bạn cũng có thể bao gồm một dòng rõ ràng trong
lời nhắc kiểm tra định kỳ của bạn như: “Nếu danh sách kiểm tra trở nên lỗi thời, cập nhật HEARTBEAT.md
với một danh sách tốt hơn.”

Lưu ý an toàn: đừng đặt thông tin bí mật (khóa API, số điện thoại, token riêng tư) vào
`HEARTBEAT.md` — nó trở thành một phần của ngữ cảnh lời nhắc.

## Đánh thức thủ công (theo yêu cầu)

Bạn có thể xếp hàng một sự kiện hệ thống và kích hoạt kiểm tra định kỳ ngay lập tức với:

```bash
openclaw system event --text "Kiểm tra các công việc khẩn cấp" --mode now
```

Nếu nhiều tác vụ có cấu hình `heartbeat`, một lần đánh thức thủ công sẽ chạy ngay lập tức các kiểm tra định kỳ của những tác vụ đó.

Sử dụng `--mode next-heartbeat` để chờ lần chạy theo lịch tiếp theo.

## Gửi lý do (tùy chọn)

Theo mặc định, kiểm tra định kỳ chỉ gửi tải trọng “câu trả lời” cuối cùng.

Nếu bạn muốn minh bạch, bật:

- `agents.defaults.heartbeat.includeReasoning: true`

Khi bật, kiểm tra định kỳ cũng sẽ gửi một thông điệp riêng biệt có tiền tố
`Reasoning:` (cùng hình dạng với `/reasoning on`). Điều này có thể hữu ích khi tác vụ
đang quản lý nhiều phiên/codex và bạn muốn biết lý do tại sao nó quyết định gửi thông điệp cho bạn — nhưng nó cũng có thể tiết lộ nhiều chi tiết nội bộ hơn bạn muốn. Nên giữ nó tắt trong các cuộc trò chuyện nhóm.

## Nhận thức về chi phí

Kiểm tra định kỳ chạy toàn bộ lượt tác vụ. Khoảng thời gian ngắn hơn tiêu tốn nhiều token hơn. Để giảm chi phí:

- Sử dụng `isolatedSession: true` để tránh gửi toàn bộ lịch sử hội thoại (~100K token giảm xuống còn ~2-5K mỗi lần chạy).
- Sử dụng `lightContext: true` để giới hạn các tệp khởi động chỉ còn `HEARTBEAT.md`.
- Đặt một mô hình rẻ hơn (ví dụ: `ollama/llama3.2:1b`).
- Giữ `HEARTBEAT.md` nhỏ.
- Sử dụng `target: "none"` nếu bạn chỉ muốn cập nhật trạng thái nội bộ.
