# Cron vs Heartbeat: Khi nào dùng cái nào

Cả heartbeat và cron job đều giúp chạy task theo lịch. Hướng dẫn này giúp chọn cơ chế phù hợp cho từng trường hợp.

## Hướng dẫn quyết định nhanh

| Trường hợp sử dụng                     | Khuyến nghị          | Lý do                                      |
| ------------------------------------- | -------------------- | ------------------------------------------ |
| Kiểm tra inbox mỗi 30 phút            | Heartbeat            | Gom nhóm với các kiểm tra khác, có ngữ cảnh |
| Gửi báo cáo hàng ngày lúc 9h sáng     | Cron (isolated)      | Cần thời gian chính xác                    |
| Theo dõi lịch cho sự kiện sắp tới     | Heartbeat            | Phù hợp tự nhiên cho việc nhận thức định kỳ |
| Chạy phân tích sâu hàng tuần          | Cron (isolated)      | Task độc lập, có thể dùng mô hình khác     |
| Nhắc nhở sau 20 phút                  | Cron (main, `--at`)  | Một lần với thời gian chính xác            |
| Kiểm tra sức khỏe dự án nền           | Heartbeat            | Tận dụng chu kỳ có sẵn                     |

## Heartbeat: Nhận thức định kỳ

Heartbeat chạy trong **main session** theo khoảng thời gian cố định (mặc định: 30 phút). Thiết kế để agent kiểm tra và thông báo những gì quan trọng.

### Khi nào dùng heartbeat

- **Nhiều kiểm tra định kỳ**: Thay vì 5 cron job riêng lẻ kiểm tra inbox, lịch, thời tiết, thông báo, và trạng thái dự án, một heartbeat có thể gom tất cả.
- **Quyết định có ngữ cảnh**: Agent có toàn bộ ngữ cảnh main-session, nên có thể quyết định thông minh về việc gì cần ưu tiên.
- **Liên tục hội thoại**: Heartbeat chạy cùng session, nên agent nhớ các cuộc hội thoại gần đây và có thể theo dõi tự nhiên.
- **Giám sát nhẹ nhàng**: Một heartbeat thay thế nhiều task polling nhỏ.

### Ưu điểm của heartbeat

- **Gom nhiều kiểm tra**: Một lượt agent có thể xem xét inbox, lịch và thông báo cùng lúc.
- **Giảm API call**: Một heartbeat rẻ hơn 5 cron job riêng lẻ.
- **Có ngữ cảnh**: Agent biết bạn đang làm gì và ưu tiên theo đó.
- **Ngăn chặn thông minh**: Nếu không có gì cần chú ý, agent trả về `HEARTBEAT_OK` và không gửi thông báo.
- **Thời gian tự nhiên**: Trôi nhẹ theo tải hàng đợi, phù hợp cho hầu hết giám sát.

### Ví dụ heartbeat: Checklist HEARTBEAT.md

```md
# Heartbeat checklist

- Kiểm tra email cho tin nhắn khẩn cấp
- Xem lịch cho sự kiện trong 2 giờ tới
- Nếu task nền hoàn thành, tóm tắt kết quả
- Nếu không hoạt động trong 8+ giờ, gửi check-in ngắn
```

Agent đọc checklist này mỗi lần heartbeat và xử lý tất cả mục trong một lượt.

### Cấu hình heartbeat

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // khoảng thời gian
        target: "last", // mục tiêu gửi thông báo rõ ràng (mặc định là "none")
        activeHours: { start: "08:00", end: "22:00" }, // tùy chọn
      },
    },
  },
}
```

Xem [Heartbeat](/gateway/heartbeat) để cấu hình đầy đủ.

## Cron: Lên lịch chính xác

Cron job chạy vào thời điểm chính xác và có thể chạy trong session riêng mà không ảnh hưởng đến ngữ cảnh chính. Lịch trình định kỳ đầu giờ được tự động phân tán bằng một offset xác định trong cửa sổ 0-5 phút.

### Khi nào dùng cron

- **Cần thời gian chính xác**: "Gửi lúc 9:00 AM mỗi thứ Hai" (không phải "khoảng 9 giờ").
- **Task độc lập**: Task không cần ngữ cảnh hội thoại.
- **Mô hình/tư duy khác**: Phân tích nặng cần mô hình mạnh hơn.
- **Nhắc nhở một lần**: "Nhắc tôi sau 20 phút" với `--at`.
- **Task ồn ào/thường xuyên**: Task làm rối lịch sử session chính.
- **Kích hoạt bên ngoài**: Task chạy độc lập với hoạt động của agent.

### Ưu điểm của cron

- **Thời gian chính xác**: Biểu thức cron 5 hoặc 6 trường (giây) với hỗ trợ múi giờ.
- **Phân tán tải tích hợp**: Lịch trình định kỳ đầu giờ được phân tán đến 5 phút theo mặc định.
- **Kiểm soát từng job**: Ghi đè phân tán với `--stagger <duration>` hoặc buộc thời gian chính xác với `--exact`.
- **Cách ly session**: Chạy trong `cron:<jobId>` mà không làm rối lịch sử chính.
- **Ghi đè mô hình**: Dùng mô hình rẻ hơn hoặc mạnh hơn cho từng job.
- **Kiểm soát gửi**: Job cách ly mặc định là `announce` (tóm tắt); chọn `none` nếu cần.
- **Gửi ngay lập tức**: Chế độ announce gửi trực tiếp mà không chờ heartbeat.
- **Không cần ngữ cảnh agent**: Chạy ngay cả khi session chính không hoạt động.
- **Hỗ trợ một lần**: `--at` cho thời gian tương lai chính xác.

### Ví dụ cron: Tóm tắt buổi sáng hàng ngày

```bash
openclaw cron add \
  --name "Morning briefing" \
  --cron "0 7 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "Generate today's briefing: weather, calendar, top emails, news summary." \
  --model opus \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

Chạy chính xác lúc 7:00 AM giờ New York, dùng Opus cho chất lượng, và gửi tóm tắt trực tiếp qua WhatsApp.

### Ví dụ cron: Nhắc nhở một lần

```bash
openclaw cron add \
  --name "Meeting reminder" \
  --at "20m" \
  --session main \
  --system-event "Reminder: standup meeting starts in 10 minutes." \
  --wake now \
  --delete-after-run
```

Xem [Cron jobs](/automation/cron-jobs) để tham khảo CLI đầy đủ.

## Lưu đồ quyết định

```
Task cần chạy vào thời gian CHÍNH XÁC?
  CÓ -> Dùng cron
  KHÔNG -> Tiếp tục...

Task cần cách ly khỏi session chính?
  CÓ -> Dùng cron (isolated)
  KHÔNG -> Tiếp tục...

Task có thể gom nhóm với kiểm tra định kỳ khác?
  CÓ -> Dùng heartbeat (thêm vào HEARTBEAT.md)
  KHÔNG -> Dùng cron

Đây có phải nhắc nhở một lần?
  CÓ -> Dùng cron với --at
  KHÔNG -> Tiếp tục...

Cần mô hình hoặc mức tư duy khác?
  CÓ -> Dùng cron (isolated) với --model/--thinking
  KHÔNG -> Dùng heartbeat
```

## Kết hợp cả hai

Thiết lập hiệu quả nhất dùng **cả hai**:

1. **Heartbeat** xử lý giám sát định kỳ (inbox, lịch, thông báo) trong một lượt gom nhóm mỗi 30 phút.
2. **Cron** xử lý lịch trình chính xác (báo cáo hàng ngày, đánh giá hàng tuần) và nhắc nhở một lần.

### Ví dụ: Thiết lập tự động hóa hiệu quả

**HEARTBEAT.md** (kiểm tra mỗi 30 phút):

```md
# Heartbeat checklist

- Quét inbox cho email khẩn cấp
- Kiểm tra lịch cho sự kiện trong 2h tới
- Xem xét task đang chờ xử lý
- Check-in nhẹ nếu yên tĩnh trong 8+ giờ
```

**Cron jobs** (thời gian chính xác):

```bash
# Tóm tắt buổi sáng hàng ngày lúc 7h sáng
openclaw cron add --name "Morning brief" --cron "0 7 * * *" --session isolated --message "..." --announce

# Đánh giá dự án hàng tuần vào thứ Hai lúc 9h sáng
openclaw cron add --name "Weekly review" --cron "0 9 * * 1" --session isolated --message "..." --model opus

# Nhắc nhở một lần
openclaw cron add --name "Call back" --at "2h" --session main --system-event "Call back the client" --wake now
```

## Lobster: Quy trình xác định với phê duyệt

Lobster là runtime workflow cho **pipeline công cụ nhiều bước** cần thực thi xác định và phê duyệt rõ ràng. Dùng khi task nhiều hơn một lượt agent, và bạn muốn workflow có thể tiếp tục với điểm kiểm tra của con người.

### Khi nào Lobster phù hợp

- **Tự động hóa nhiều bước**: Cần pipeline công cụ cố định, không phải prompt một lần.
- **Cổng phê duyệt**: Tác động phụ nên tạm dừng cho đến khi bạn phê duyệt, sau đó tiếp tục.
- **Chạy tiếp tục**: Tiếp tục workflow tạm dừng mà không chạy lại bước trước đó.

### Cách kết hợp với heartbeat và cron

- **Heartbeat/cron** quyết định _khi nào_ chạy.
- **Lobster** định nghĩa _các bước_ xảy ra khi chạy bắt đầu.

Với workflow theo lịch, dùng cron hoặc heartbeat để kích hoạt lượt agent gọi Lobster. Với workflow ad-hoc, gọi Lobster trực tiếp.

### Ghi chú vận hành (từ mã)

- Lobster chạy như một **local subprocess** (`lobster` CLI) ở chế độ công cụ và trả về một **JSON envelope**.
- Nếu công cụ trả về `needs_approval`, bạn tiếp tục với `resumeToken` và cờ `approve`.
- Công cụ là một **plugin tùy chọn**; kích hoạt bổ sung qua `tools.alsoAllow: ["lobster"]` (khuyến nghị).
- Lobster yêu cầu `lobster` CLI có sẵn trên `PATH`.

Xem [Lobster](/tools/lobster) để sử dụng và ví dụ đầy đủ.

## Main Session vs Isolated Session

Cả heartbeat và cron đều có thể tương tác với main session, nhưng khác nhau:

|         | Heartbeat                       | Cron (main)              | Cron (isolated)                                 |
| ------- | ------------------------------- | ------------------------ | ----------------------------------------------- |
| Session | Main                            | Main (qua system event)  | `cron:<jobId>` hoặc session tùy chỉnh           |
| History | Chia sẻ                         | Chia sẻ                  | Mới mỗi lần chạy (isolated) / Liên tục (tùy chỉnh) |
| Context | Đầy đủ                          | Đầy đủ                   | Không có (isolated) / Tích lũy (tùy chỉnh)      |
| Model   | Mô hình session chính           | Mô hình session chính    | Có thể ghi đè                                   |
| Output  | Gửi nếu không `HEARTBEAT_OK`    | Heartbeat prompt + event | Tóm tắt thông báo (mặc định)                    |

### Khi nào dùng cron session chính

Dùng `--session main` với `--system-event` khi bạn muốn:

- Nhắc nhở/sự kiện xuất hiện trong ngữ cảnh session chính
- Agent xử lý trong heartbeat tiếp theo với ngữ cảnh đầy đủ
- Không chạy riêng biệt

```bash
openclaw cron add \
  --name "Check project" \
  --every "4h" \
  --session main \
  --system-event "Time for a project health check" \
  --wake now
```

### Khi nào dùng cron cách ly

Dùng `--session isolated` khi bạn muốn:

- Khởi đầu mới không có ngữ cảnh trước đó
- Cài đặt mô hình hoặc tư duy khác
- Tóm tắt thông báo trực tiếp đến kênh
- Lịch sử không làm rối session chính

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 0" \
  --session isolated \
  --message "Weekly codebase analysis..." \
  --model opus \
  --thinking high \
  --announce
```

## Cân nhắc chi phí

| Cơ chế          | Hồ sơ chi phí                                           |
| --------------- | ------------------------------------------------------- |
| Heartbeat       | Một lượt mỗi N phút; mở rộng với kích thước HEARTBEAT.md |
| Cron (main)     | Thêm sự kiện vào heartbeat tiếp theo (không lượt cách ly) |
| Cron (isolated) | Lượt agent đầy đủ mỗi job; có thể dùng mô hình rẻ hơn   |

**Mẹo**:

- Giữ `HEARTBEAT.md` nhỏ để giảm chi phí token.
- Gom nhóm kiểm tra tương tự vào heartbeat thay vì nhiều cron job.
- Dùng `target: "none"` trên heartbeat nếu chỉ muốn xử lý nội bộ.
- Dùng cron cách ly với mô hình rẻ hơn cho task thường xuyên.

## Liên quan

- [Heartbeat](/gateway/heartbeat) - cấu hình heartbeat đầy đủ
- [Cron jobs](/automation/cron-jobs) - tham khảo CLI và API cron đầy đủ
- [System](/cli/system) - sự kiện hệ thống + điều khiển heartbeat\n