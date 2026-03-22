---
summary: "Thông điệp heartbeat và quy tắc thông báo"
read_when:
  - Điều chỉnh tần suất heartbeat hoặc tin nhắn
  - Quyết định giữa heartbeat và cron cho tác vụ định kỳ
title: "Heartbeat"
---

# Heartbeat (Gateway)

> **Heartbeat hay Cron?** Xem [Cron vs Heartbeat](/automation/cron-vs-heartbeat) để biết khi nào nên dùng.

Heartbeat chạy **các vòng lặp agent định kỳ** trong session chính để mô hình có thể
nổi bật những gì cần chú ý mà không spam.

Khắc phục sự cố: [/automation/troubleshooting](/automation/troubleshooting)

## Bắt đầu nhanh (cho người mới)

1. Để heartbeat bật (mặc định `30m`, hoặc `1h` cho Anthropic OAuth/setup-token) hoặc tự đặt tần suất.
2. Tạo một checklist nhỏ `HEARTBEAT.md` trong workspace của agent (không bắt buộc nhưng nên làm).
3. Quyết định nơi gửi thông điệp heartbeat (`target: "none"` là mặc định; đặt `target: "last"` để gửi đến liên hệ cuối).
4. Tuỳ chọn: bật gửi lý do heartbeat để minh bạch.
5. Tuỳ chọn: dùng context bootstrap nhẹ nếu chỉ cần `HEARTBEAT.md`.
6. Tuỳ chọn: bật session cô lập để tránh gửi lịch sử hội thoại mỗi lần heartbeat.
7. Tuỳ chọn: giới hạn heartbeat trong giờ hoạt động (giờ địa phương).

Cấu hình ví dụ:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // gửi rõ ràng đến liên hệ cuối (mặc định là "none")
        directPolicy: "allow", // mặc định: cho phép gửi trực tiếp/DM; đặt "block" để chặn
        lightContext: true, // tuỳ chọn: chỉ chèn HEARTBEAT.md từ file bootstrap
        isolatedSession: true, // tuỳ chọn: session mới mỗi lần chạy (không có lịch sử hội thoại)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // tuỳ chọn: gửi thêm thông điệp `Reasoning:`
      },
    },
  },
}
```

## Mặc định

- Khoảng thời gian: `30m` (hoặc `1h` khi phát hiện chế độ xác thực Anthropic OAuth/setup-token). Đặt `agents.defaults.heartbeat.every` hoặc cho từng agent `agents.list[].heartbeat.every`; dùng `0m` để tắt.
- Nội dung prompt (có thể cấu hình qua `agents.defaults.heartbeat.prompt`):
  `Đọc HEARTBEAT.md nếu có (context workspace). Thực hiện nghiêm túc. Không suy diễn hoặc lặp lại nhiệm vụ cũ từ các cuộc trò chuyện trước. Nếu không có gì cần chú ý, trả lời HEARTBEAT_OK.`
- Prompt heartbeat được gửi **nguyên văn** như thông điệp người dùng. Prompt hệ thống
  bao gồm phần “Heartbeat” và chạy được đánh dấu nội bộ.
- Giờ hoạt động (`heartbeat.activeHours`) được kiểm tra theo múi giờ cấu hình.
  Ngoài khung giờ, heartbeat bị bỏ qua cho đến lần chạy tiếp theo trong khung giờ.

## Mục đích của prompt heartbeat

Prompt mặc định được thiết kế rộng:

- **Nhiệm vụ nền**: “Xem xét các nhiệm vụ còn lại” nhắc agent xem lại
  các công việc tiếp theo (hộp thư, lịch, nhắc nhở, công việc xếp hàng) và nổi bật những gì khẩn cấp.
- **Kiểm tra con người**: “Thỉnh thoảng kiểm tra con người của bạn vào ban ngày” nhắc nhở
  một thông điệp nhẹ “cần gì không?” nhưng tránh spam ban đêm
  bằng cách sử dụng múi giờ địa phương cấu hình (xem [/concepts/timezone](/concepts/timezone)).

Nếu muốn heartbeat làm gì đó cụ thể (ví dụ: “kiểm tra thống kê Gmail PubSub
hoặc “xác minh sức khỏe gateway”), đặt `agents.defaults.heartbeat.prompt` (hoặc
`agents.list[].heartbeat.prompt`) thành nội dung tùy chỉnh (gửi nguyên văn).

## Hợp đồng phản hồi

- Nếu không có gì cần chú ý, trả lời với **`HEARTBEAT_OK`**.
- Trong các lần chạy heartbeat, OpenClaw coi `HEARTBEAT_OK` là xác nhận khi xuất hiện
  ở **đầu hoặc cuối** phản hồi. Token bị loại bỏ và phản hồi bị bỏ qua nếu nội dung còn lại **≤ `ackMaxChars`** (mặc định: 300).
- Nếu `HEARTBEAT_OK` xuất hiện ở **giữa** phản hồi, không được xử lý đặc biệt.
- Đối với cảnh báo, **không** bao gồm `HEARTBEAT_OK`; chỉ trả về văn bản cảnh báo.

Ngoài heartbeat, `HEARTBEAT_OK` lạc lõng ở đầu/cuối thông điệp bị loại bỏ
và ghi lại; thông điệp chỉ có `HEARTBEAT_OK` bị bỏ qua.

## Cấu hình

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // mặc định: 30m (0m tắt)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // mặc định: false (gửi thông điệp Reasoning: riêng khi có)
        lightContext: false, // mặc định: false; true chỉ giữ HEARTBEAT.md từ file bootstrap workspace
        isolatedSession: false, // mặc định: false; true chạy mỗi heartbeat trong session mới (không có lịch sử hội thoại)
        target: "last", // mặc định: none | tùy chọn: last | none | <channel id> (core hoặc plugin, ví dụ "bluebubbles")
        to: "+15551234567", // tùy chọn ghi đè theo kênh
        accountId: "ops-bot", // tùy chọn id kênh đa tài khoản
        prompt: "Đọc HEARTBEAT.md nếu có (context workspace). Thực hiện nghiêm túc. Không suy diễn hoặc lặp lại nhiệm vụ cũ từ các cuộc trò chuyện trước. Nếu không có gì cần chú ý, trả lời HEARTBEAT_OK.",
        ackMaxChars: 300, // số ký tự tối đa cho phép sau HEARTBEAT_OK
      },
    },
  },
}
```

### Phạm vi và thứ tự ưu tiên

- `agents.defaults.heartbeat` thiết lập hành vi heartbeat toàn cầu.
- `agents.list[].heartbeat` gộp lên trên; nếu bất kỳ agent nào có block `heartbeat`, **chỉ những agent đó** chạy heartbeat.
- `channels.defaults.heartbeat` thiết lập mặc định hiển thị cho tất cả các kênh.
- `channels.<channel>.heartbeat` ghi đè mặc định kênh.
- `channels.<channel>.accounts.<id>.heartbeat` (kênh đa tài khoản) ghi đè cài đặt theo kênh.

### Heartbeat theo agent

Nếu bất kỳ mục `agents.list[]` nào bao gồm block `heartbeat`, **chỉ những agent đó**
chạy heartbeat. Block theo agent gộp lên trên `agents.defaults.heartbeat`
(vì vậy có thể đặt mặc định chung một lần và ghi đè theo agent).

Ví dụ: hai agent, chỉ agent thứ hai chạy heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // gửi rõ ràng đến liên hệ cuối (mặc định là "none")
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
          prompt: "Đọc HEARTBEAT.md nếu có (context workspace). Thực hiện nghiêm túc. Không suy diễn hoặc lặp lại nhiệm vụ cũ từ các cuộc trò chuyện trước. Nếu không có gì cần chú ý, trả lời HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Ví dụ giờ hoạt động

Giới hạn heartbeat trong giờ làm việc theo múi giờ cụ thể:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // gửi rõ ràng đến liên hệ cuối (mặc định là "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // tùy chọn; dùng userTimezone nếu có, nếu không thì dùng múi giờ host
        },
      },
    },
  },
}
```

Ngoài khung giờ này (trước 9h sáng hoặc sau 10h tối theo giờ Eastern), heartbeat bị bỏ qua. Lần chạy tiếp theo trong khung giờ sẽ diễn ra bình thường.

### Cài đặt 24/7

Nếu muốn heartbeat chạy cả ngày, dùng một trong các mẫu sau:

- Bỏ qua `activeHours` hoàn toàn (không giới hạn khung giờ; đây là hành vi mặc định).
- Đặt khung giờ cả ngày: `activeHours: { start: "00:00", end: "24:00" }`.

Không đặt cùng thời gian `start` và `end` (ví dụ `08:00` đến `08:00`).
Điều này được coi là khung giờ rộng bằng không, nên heartbeat luôn bị bỏ qua.

### Ví dụ đa tài khoản

Dùng `accountId` để nhắm mục tiêu tài khoản cụ thể trên các kênh đa tài khoản như Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // tùy chọn: gửi đến chủ đề/cuộc trò chuyện cụ thể
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

- `every`: khoảng thời gian heartbeat (chuỗi thời lượng; đơn vị mặc định = phút).
- `model`: ghi đè mô hình tùy chọn cho các lần chạy heartbeat (`provider/model`).
- `includeReasoning`: khi bật, cũng gửi thông điệp `Reasoning:` riêng khi có (cùng dạng với `/reasoning on`).
- `lightContext`: khi true, các lần chạy heartbeat dùng context bootstrap nhẹ và chỉ giữ `HEARTBEAT.md` từ file bootstrap workspace.
- `isolatedSession`: khi true, mỗi lần chạy heartbeat trong session mới không có lịch sử hội thoại trước. Dùng cùng mẫu cô lập như cron `sessionTarget: "isolated"`. Giảm đáng kể chi phí token mỗi lần heartbeat. Kết hợp với `lightContext: true` để tiết kiệm tối đa. Định tuyến gửi vẫn dùng context session chính.
- `session`: khóa session tùy chọn cho các lần chạy heartbeat.
  - `main` (mặc định): session chính của agent.
  - Khóa session rõ ràng (sao chép từ `openclaw sessions --json` hoặc [sessions CLI](/cli/sessions)).
  - Định dạng khóa session: xem [Sessions](/concepts/session) và [Groups](/channels/groups).
- `target`:
  - `last`: gửi đến kênh ngoài cùng được sử dụng gần nhất.
  - kênh rõ ràng: `whatsapp` / `telegram` / `discord` / `googlechat` / `slack` / `msteams` / `signal` / `imessage`.
  - `none` (mặc định): chạy heartbeat nhưng **không gửi** ra ngoài.
- `directPolicy`: kiểm soát hành vi gửi trực tiếp/DM:
  - `allow` (mặc định): cho phép gửi trực tiếp/DM heartbeat.
  - `block`: chặn gửi trực tiếp/DM (`reason=dm-blocked`).
- `to`: ghi đè người nhận tùy chọn (id kênh cụ thể, ví dụ E.164 cho WhatsApp hoặc id chat Telegram). Đối với chủ đề/cuộc trò chuyện Telegram, dùng `<chatId>:topic:<messageThreadId>`.
- `accountId`: id tài khoản tùy chọn cho các kênh đa tài khoản. Khi `target: "last"`, id tài khoản áp dụng cho kênh cuối được giải quyết nếu nó hỗ trợ tài khoản; nếu không thì bị bỏ qua. Nếu id tài khoản không khớp với tài khoản đã cấu hình cho kênh được giải quyết, việc gửi bị bỏ qua.
- `prompt`: ghi đè nội dung prompt mặc định (không gộp).
- `ackMaxChars`: số ký tự tối đa cho phép sau `HEARTBEAT_OK` trước khi gửi.
- `suppressToolErrorWarnings`: khi true, chặn cảnh báo lỗi công cụ trong các lần chạy heartbeat.
- `activeHours`: giới hạn các lần chạy heartbeat trong khung giờ. Đối tượng với `start` (HH:MM, bao gồm; dùng `00:00` cho đầu ngày), `end` (HH:MM không bao gồm; `24:00` cho cuối ngày), và `timezone` tùy chọn.
  - Bỏ qua hoặc `"user"`: dùng `agents.defaults.userTimezone` nếu có, nếu không thì dùng múi giờ hệ thống host.
  - `"local"`: luôn dùng múi giờ hệ thống host.
  - Bất kỳ định danh IANA nào (ví dụ `America/New_York`): dùng trực tiếp; nếu không hợp lệ, quay lại hành vi `"user"` ở trên.
  - `start` và `end` không được bằng nhau cho một khung giờ hoạt động; các giá trị bằng nhau được coi là khung giờ rộng bằng không (luôn ngoài khung giờ).
  - Ngoài khung giờ hoạt động, heartbeat bị bỏ qua cho đến lần chạy tiếp theo trong khung giờ.

## Hành vi gửi

- Heartbeat chạy trong session chính của agent theo mặc định (`agent:<id>:<mainKey>`),
  hoặc `global` khi `session.scope = "global"`. Đặt `session` để ghi đè sang
  session kênh cụ thể (Discord/WhatsApp/etc.).
- `session` chỉ ảnh hưởng đến context chạy; gửi được kiểm soát bởi `target` và `to`.
- Để gửi đến kênh/người nhận cụ thể, đặt `target` + `to`. Với
  `target: "last"`, gửi dùng kênh ngoài cuối cùng cho session đó.
- Gửi heartbeat cho phép mục tiêu trực tiếp/DM theo mặc định. Đặt `directPolicy: "block"` để chặn gửi mục tiêu trực tiếp trong khi vẫn chạy vòng lặp heartbeat.
- Nếu hàng đợi chính bận, heartbeat bị bỏ qua và thử lại sau.
- Nếu `target` không giải quyết được điểm đến ngoài, vòng lặp vẫn diễn ra nhưng không
  gửi thông điệp ra ngoài.
- Phản hồi chỉ có heartbeat **không** giữ session sống; `updatedAt` cuối cùng
  được khôi phục để hết hạn nhàn rỗi hoạt động bình thường.

## Kiểm soát hiển thị

Theo mặc định, xác nhận `HEARTBEAT_OK` bị chặn trong khi nội dung cảnh báo được
gửi. Có thể điều chỉnh điều này theo kênh hoặc theo tài khoản:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ẩn HEARTBEAT_OK (mặc định)
      showAlerts: true # Hiển thị thông điệp cảnh báo (mặc định)
      useIndicator: true # Phát sự kiện chỉ báo (mặc định)
  telegram:
    heartbeat:
      showOk: true # Hiển thị xác nhận OK trên Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Chặn gửi cảnh báo cho tài khoản này
```

Thứ tự ưu tiên: theo tài khoản → theo kênh → mặc định kênh → mặc định tích hợp.

### Tác dụng của từng cờ

- `showOk`: gửi xác nhận `HEARTBEAT_OK` khi mô hình trả về phản hồi chỉ OK.
- `showAlerts`: gửi nội dung cảnh báo khi mô hình trả về phản hồi không OK.
- `useIndicator`: phát sự kiện chỉ báo cho giao diện người dùng.

Nếu **cả ba** đều false, OpenClaw bỏ qua vòng lặp heartbeat hoàn toàn (không gọi mô hình).

### Ví dụ theo kênh và theo tài khoản

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # tất cả tài khoản Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # chặn cảnh báo chỉ cho tài khoản ops
  telegram:
    heartbeat:
      showOk: true
```

### Mẫu phổ biến

| Mục tiêu                                 | Cấu hình                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Hành vi mặc định (OK im lặng, cảnh báo bật) | _(không cần cấu hình)_                                                                     |
| Hoàn toàn im lặng (không thông điệp, không chỉ báo) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Chỉ chỉ báo (không thông điệp)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK chỉ trong một kênh                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (tùy chọn)

Nếu file `HEARTBEAT.md` tồn tại trong workspace, prompt mặc định yêu cầu
agent đọc nó. Hãy coi nó như “checklist heartbeat”: nhỏ, ổn định, và
an toàn để bao gồm mỗi 30 phút.

Nếu `HEARTBEAT.md` tồn tại nhưng thực tế trống (chỉ có dòng trống và tiêu đề markdown như `# Heading`), OpenClaw bỏ qua vòng lặp heartbeat để tiết kiệm API call.
Nếu file bị thiếu, heartbeat vẫn chạy và mô hình quyết định phải làm gì.

Giữ nó nhỏ (danh sách kiểm tra ngắn hoặc nhắc nhở) để tránh phình to prompt.

Ví dụ `HEARTBEAT.md`:

```md
# Danh sách kiểm tra Heartbeat

- Quét nhanh: có gì khẩn cấp trong hộp thư không?
- Nếu là ban ngày, kiểm tra nhẹ nếu không có gì khác đang chờ.
- Nếu nhiệm vụ bị chặn, ghi lại _cái gì đang thiếu_ và hỏi Peter lần tới.
```

### Agent có thể cập nhật HEARTBEAT.md không?

Có — nếu bạn yêu cầu.

`HEARTBEAT.md` chỉ là file bình thường trong workspace của agent, vì vậy bạn có thể yêu cầu agent (trong cuộc trò chuyện bình thường) như:

- “Cập nhật `HEARTBEAT.md` để thêm kiểm tra lịch hàng ngày.”
- “Viết lại `HEARTBEAT.md` để ngắn hơn và tập trung vào theo dõi hộp thư.”

Nếu muốn điều này xảy ra chủ động, bạn cũng có thể bao gồm một dòng rõ ràng trong
prompt heartbeat của bạn như: “Nếu danh sách kiểm tra trở nên lỗi thời, cập nhật HEARTBEAT.md với một cái tốt hơn.”

Lưu ý an toàn: đừng đặt bí mật (API key, số điện thoại, token riêng tư) vào
`HEARTBEAT.md` — nó trở thành một phần của context prompt.

## Đánh thức thủ công (theo yêu cầu)

Bạn có thể xếp hàng một sự kiện hệ thống và kích hoạt heartbeat ngay lập tức với:

```bash
openclaw system event --text "Kiểm tra các công việc khẩn cấp" --mode now
```

Nếu nhiều agent có cấu hình `heartbeat`, một lần đánh thức thủ công sẽ chạy heartbeat của từng agent đó ngay lập tức.

Dùng `--mode next-heartbeat` để chờ lần chạy tiếp theo theo lịch.

## Gửi lý do (tùy chọn)

Theo mặc định, heartbeat chỉ gửi payload “câu trả lời” cuối cùng.

Nếu muốn minh bạch, bật:

- `agents.defaults.heartbeat.includeReasoning: true`

Khi bật, heartbeat cũng sẽ gửi một thông điệp riêng có tiền tố
`Reasoning:` (cùng dạng với `/reasoning on`). Điều này có thể hữu ích khi agent
quản lý nhiều session/codex và bạn muốn thấy lý do tại sao nó quyết định ping
bạn — nhưng cũng có thể tiết lộ nhiều chi tiết nội bộ hơn bạn muốn. Nên giữ tắt trong các cuộc trò chuyện nhóm.

## Nhận thức chi phí

Heartbeat chạy đầy đủ các vòng lặp agent. Khoảng thời gian ngắn hơn tiêu tốn nhiều token hơn. Để giảm chi phí:

- Dùng `isolatedSession: true` để tránh gửi toàn bộ lịch sử hội thoại (~100K token giảm xuống ~2-5K mỗi lần chạy).
- Dùng `lightContext: true` để giới hạn file bootstrap chỉ còn `HEARTBEAT.md`.
- Đặt mô hình rẻ hơn (ví dụ `ollama/llama3.2:1b`).
- Giữ `HEARTBEAT.md` nhỏ.
- Dùng `target: "none"` nếu chỉ muốn cập nhật trạng thái nội bộ.\n