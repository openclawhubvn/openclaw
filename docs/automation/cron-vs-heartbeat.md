---
summary: "So sánh chi tiết giữa cron jobs và heartbeat để tối ưu hóa tự động hóa hệ thống của bạn. Tìm hiểu ưu và nhược điểm từng phương pháp."
read_when:
  - Quyết định cách lập lịch cho các tác vụ lặp lại
  - Thiết lập giám sát nền hoặc thông báo
  - Tối ưu hóa việc sử dụng token cho các kiểm tra định kỳ
title: "Hướng Dẫn Chọn Cron Jobs Hay Heartbeat"
---

# Cron vs Heartbeat: Khi nào nên sử dụng

Cả heartbeat và cron jobs đều cho phép bạn chạy các tác vụ theo lịch trình. Hướng dẫn này giúp bạn chọn cơ chế phù hợp cho trường hợp sử dụng của mình.

## Hướng dẫn quyết định nhanh

| Trường hợp sử dụng                     | Khuyến nghị          | Lý do                                      |
| ------------------------------------- | -------------------- | ------------------------------------------ |
| Kiểm tra hộp thư mỗi 30 phút          | Heartbeat            | Gộp với các kiểm tra khác, nhận biết ngữ cảnh |
| Gửi báo cáo hàng ngày lúc 9 giờ sáng  | Cron (riêng lẻ)      | Cần thời gian chính xác                    |
| Giám sát lịch cho sự kiện sắp tới     | Heartbeat            | Phù hợp tự nhiên cho nhận thức định kỳ     |
| Chạy phân tích sâu hàng tuần          | Cron (riêng lẻ)      | Tác vụ độc lập, có thể dùng mô hình khác   |
| Nhắc nhở trong 20 phút                | Cron (chính, `--at`) | Một lần với thời gian chính xác            |
| Kiểm tra sức khỏe dự án nền           | Heartbeat            | Tận dụng chu kỳ hiện có                    |

## Heartbeat: Nhận thức định kỳ

Heartbeat chạy trong **phiên chính** theo khoảng thời gian đều đặn (mặc định: 30 phút). Được thiết kế để agent kiểm tra và nêu bật những điều quan trọng.

### Khi nào nên dùng heartbeat

- **Nhiều kiểm tra định kỳ**: Thay vì 5 cron jobs riêng lẻ kiểm tra hộp thư, lịch, thời tiết, thông báo và trạng thái dự án, một heartbeat có thể gộp tất cả.
- **Quyết định nhận biết ngữ cảnh**: Agent có toàn bộ ngữ cảnh phiên chính, nên có thể đưa ra quyết định thông minh về điều gì là khẩn cấp.
- **Liên tục hội thoại**: Các lần chạy heartbeat chia sẻ cùng phiên, nên agent nhớ các cuộc hội thoại gần đây và có thể theo dõi tự nhiên.
- **Giám sát chi phí thấp**: Một heartbeat thay thế nhiều tác vụ polling nhỏ.

### Ưu điểm của heartbeat

- **Gộp nhiều kiểm tra**: Một lượt agent có thể xem xét hộp thư, lịch và thông báo cùng lúc.
- **Giảm cuộc gọi API**: Một heartbeat rẻ hơn 5 cron jobs riêng lẻ.
- **Nhận biết ngữ cảnh**: Agent biết bạn đang làm gì và có thể ưu tiên phù hợp.
- **Ngăn chặn thông minh**: Nếu không cần chú ý, agent trả lời `HEARTBEAT_OK` và không có thông báo nào được gửi.
- **Thời gian tự nhiên**: Trôi nhẹ dựa trên tải hàng đợi, phù hợp cho hầu hết giám sát.

### Ví dụ heartbeat: Danh sách kiểm tra HEARTBEAT.md

```md
# Danh sách kiểm tra Heartbeat

- Kiểm tra email cho tin nhắn khẩn cấp
- Xem lịch cho sự kiện trong 2 giờ tới
- Nếu tác vụ nền hoàn thành, tóm tắt kết quả
- Nếu không hoạt động trong 8+ giờ, gửi kiểm tra ngắn
```

Agent đọc danh sách này mỗi lần heartbeat và xử lý tất cả mục trong một lượt.

### Cấu hình heartbeat

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // khoảng thời gian
        target: "last", // mục tiêu gửi cảnh báo rõ ràng (mặc định là "none")
        activeHours: { start: "08:00", end: "22:00" }, // tùy chọn
      },
    },
  },
}
```

Xem [Heartbeat](/gateway/heartbeat) để biết cấu hình đầy đủ.

## Cron: Lập lịch chính xác

Cron jobs chạy vào thời điểm chính xác và có thể chạy trong các phiên riêng lẻ mà không ảnh hưởng đến ngữ cảnh chính. Lịch trình định kỳ đầu giờ được tự động phân bổ bằng một độ lệch xác định theo công việc trong khoảng 0-5 phút.

### Khi nào nên dùng cron

- **Cần thời gian chính xác**: "Gửi cái này lúc 9:00 sáng mỗi thứ Hai" (không phải "khoảng 9 giờ").
- **Tác vụ độc lập**: Tác vụ không cần ngữ cảnh hội thoại.
- **Mô hình/suy nghĩ khác**: Phân tích nặng cần mô hình mạnh hơn.
- **Nhắc nhở một lần**: "Nhắc tôi trong 20 phút" với `--at`.
- **Tác vụ ồn ào/thường xuyên**: Tác vụ sẽ làm lộn xộn lịch sử phiên chính.
- **Kích hoạt bên ngoài**: Tác vụ nên chạy độc lập với việc agent có hoạt động hay không.

### Ưu điểm của cron

- **Thời gian chính xác**: Biểu thức cron 5 trường hoặc 6 trường (giây) với hỗ trợ múi giờ.
- **Phân bổ tải tích hợp**: Lịch trình định kỳ đầu giờ được phân bổ trong vòng 5 phút theo mặc định.
- **Kiểm soát từng công việc**: Ghi đè phân bổ với `--stagger <duration>` hoặc buộc thời gian chính xác với `--exact`.
- **Cách ly phiên**: Chạy trong `cron:<jobId>` mà không làm ô nhiễm lịch sử chính.
- **Ghi đè mô hình**: Sử dụng mô hình rẻ hơn hoặc mạnh hơn cho từng công việc.
- **Kiểm soát gửi**: Công việc riêng lẻ mặc định là `announce` (tóm tắt); chọn `none` nếu cần.
- **Gửi ngay lập tức**: Chế độ thông báo đăng trực tiếp mà không chờ heartbeat.
- **Không cần ngữ cảnh agent**: Chạy ngay cả khi phiên chính không hoạt động hoặc bị nén.
- **Hỗ trợ một lần**: `--at` cho dấu thời gian tương lai chính xác.

### Ví dụ cron: Tóm tắt buổi sáng hàng ngày

```bash
openclaw cron add \
  --name "Tóm tắt buổi sáng" \
  --cron "0 7 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "Tạo tóm tắt hôm nay: thời tiết, lịch, email hàng đầu, tóm tắt tin tức." \
  --model opus \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

Chạy chính xác lúc 7:00 sáng giờ New York, sử dụng Opus cho chất lượng và thông báo tóm tắt trực tiếp đến WhatsApp.

### Ví dụ cron: Nhắc nhở một lần

```bash
openclaw cron add \
  --name "Nhắc nhở cuộc họp" \
  --at "20m" \
  --session main \
  --system-event "Nhắc nhở: cuộc họp đứng bắt đầu trong 10 phút." \
  --wake now \
  --delete-after-run
```

Xem [Cron jobs](/automation/cron-jobs) để biết tham chiếu CLI đầy đủ.

## Sơ đồ quyết định

```
Tác vụ có cần chạy vào thời điểm CHÍNH XÁC không?
  CÓ -> Sử dụng cron
  KHÔNG -> Tiếp tục...

Tác vụ có cần cách ly khỏi phiên chính không?
  CÓ -> Sử dụng cron (riêng lẻ)
  KHÔNG -> Tiếp tục...

Tác vụ này có thể gộp với các kiểm tra định kỳ khác không?
  CÓ -> Sử dụng heartbeat (thêm vào HEARTBEAT.md)
  KHÔNG -> Sử dụng cron

Đây có phải là nhắc nhở một lần không?
  CÓ -> Sử dụng cron với --at
  KHÔNG -> Tiếp tục...

Có cần mô hình hoặc mức suy nghĩ khác không?
  CÓ -> Sử dụng cron (riêng lẻ) với --model/--thinking
  KHÔNG -> Sử dụng heartbeat
```

## Kết hợp cả hai

Thiết lập hiệu quả nhất sử dụng **cả hai**:

1. **Heartbeat** xử lý giám sát định kỳ (hộp thư, lịch, thông báo) trong một lượt gộp mỗi 30 phút.
2. **Cron** xử lý lịch trình chính xác (báo cáo hàng ngày, đánh giá hàng tuần) và nhắc nhở một lần.

### Ví dụ: Thiết lập tự động hóa hiệu quả

**HEARTBEAT.md** (kiểm tra mỗi 30 phút):

```md
# Danh sách kiểm tra Heartbeat

- Quét hộp thư cho email khẩn cấp
- Kiểm tra lịch cho sự kiện trong 2 giờ tới
- Xem xét bất kỳ tác vụ đang chờ xử lý
- Kiểm tra nhẹ nếu yên tĩnh trong 8+ giờ
```

**Cron jobs** (thời gian chính xác):

```bash
# Tóm tắt buổi sáng hàng ngày lúc 7 giờ sáng
openclaw cron add --name "Tóm tắt buổi sáng" --cron "0 7 * * *" --session isolated --message "..." --announce

# Đánh giá dự án hàng tuần vào thứ Hai lúc 9 giờ sáng
openclaw cron add --name "Đánh giá hàng tuần" --cron "0 9 * * 1" --session isolated --message "..." --model opus

# Nhắc nhở một lần
openclaw cron add --name "Gọi lại" --at "2h" --session main --system-event "Gọi lại khách hàng" --wake now
```

## Lobster: Quy trình làm việc xác định với phê duyệt

Lobster là runtime quy trình làm việc cho **các pipeline công cụ nhiều bước** cần thực thi xác định và phê duyệt rõ ràng. Sử dụng khi tác vụ nhiều hơn một lượt agent và bạn muốn một quy trình làm việc có thể tiếp tục với các điểm kiểm tra của con người.

### Khi nào Lobster phù hợp

- **Tự động hóa nhiều bước**: Bạn cần một pipeline công cụ cố định, không phải một lời nhắc một lần.
- **Cổng phê duyệt**: Các tác động phụ nên tạm dừng cho đến khi bạn phê duyệt, sau đó tiếp tục.
- **Chạy có thể tiếp tục**: Tiếp tục một quy trình làm việc bị tạm dừng mà không chạy lại các bước trước đó.

### Cách kết hợp với heartbeat và cron

- **Heartbeat/cron** quyết định _khi nào_ một lượt chạy xảy ra.
- **Lobster** xác định _các bước nào_ xảy ra khi lượt chạy bắt đầu.

Đối với các quy trình làm việc theo lịch trình, sử dụng cron hoặc heartbeat để kích hoạt một lượt agent gọi Lobster. Đối với các quy trình làm việc ad-hoc, gọi Lobster trực tiếp.

### Ghi chú vận hành (từ mã)

- Lobster chạy như một **quá trình con cục bộ** (`lobster` CLI) ở chế độ công cụ và trả về một **phong bì JSON**.
- Nếu công cụ trả về `needs_approval`, bạn tiếp tục với một `resumeToken` và cờ `approve`.
- Công cụ là một **plugin tùy chọn**; kích hoạt nó bổ sung qua `tools.alsoAllow: ["lobster"]` (khuyến nghị).
- Lobster yêu cầu CLI `lobster` có sẵn trên `PATH`.

Xem [Lobster](/tools/lobster) để biết cách sử dụng và ví dụ đầy đủ.

## Phiên chính vs Phiên riêng lẻ

Cả heartbeat và cron đều có thể tương tác với phiên chính, nhưng theo cách khác nhau:

|         | Heartbeat                       | Cron (chính)              | Cron (riêng lẻ)                                 |
| ------- | ------------------------------- | ------------------------- | ----------------------------------------------- |
| Phiên   | Chính                           | Chính (qua sự kiện hệ thống) | `cron:<jobId>` hoặc phiên tùy chỉnh             |
| Lịch sử | Chia sẻ                         | Chia sẻ                   | Mới mỗi lần chạy (riêng lẻ) / Liên tục (tùy chỉnh) |
| Ngữ cảnh| Đầy đủ                          | Đầy đủ                    | Không có (riêng lẻ) / Tích lũy (tùy chỉnh)      |
| Mô hình | Mô hình phiên chính             | Mô hình phiên chính       | Có thể ghi đè                                    |
| Đầu ra  | Được gửi nếu không phải `HEARTBEAT_OK` | Lời nhắc heartbeat + sự kiện | Thông báo tóm tắt (mặc định)                      |

### Khi nào nên dùng cron phiên chính

Sử dụng `--session main` với `--system-event` khi bạn muốn:

- Nhắc nhở/sự kiện xuất hiện trong ngữ cảnh phiên chính
- Agent xử lý nó trong lần heartbeat tiếp theo với ngữ cảnh đầy đủ
- Không có lần chạy riêng lẻ nào

```bash
openclaw cron add \
  --name "Kiểm tra dự án" \
  --every "4h" \
  --session main \
  --system-event "Đã đến lúc kiểm tra sức khỏe dự án" \
  --wake now
```

### Khi nào nên dùng cron riêng lẻ

Sử dụng `--session isolated` khi bạn muốn:

- Một khởi đầu mới mà không có ngữ cảnh trước đó
- Cài đặt mô hình hoặc suy nghĩ khác
- Thông báo tóm tắt trực tiếp đến một kênh
- Lịch sử không làm lộn xộn phiên chính

```bash
openclaw cron add \
  --name "Phân tích sâu" \
  --cron "0 6 * * 0" \
  --session isolated \
  --message "Phân tích mã nguồn hàng tuần..." \
  --model opus \
  --thinking high \
  --announce
```

## Cân nhắc chi phí

| Cơ chế         | Hồ sơ chi phí                                            |
| --------------- | ------------------------------------------------------- |
| Heartbeat       | Một lượt mỗi N phút; mở rộng với kích thước HEARTBEAT.md |
| Cron (chính)    | Thêm sự kiện vào lần heartbeat tiếp theo (không có lượt riêng lẻ) |
| Cron (riêng lẻ) | Lượt agent đầy đủ cho mỗi công việc; có thể sử dụng mô hình rẻ hơn |

**Mẹo**:

- Giữ `HEARTBEAT.md` nhỏ để giảm thiểu chi phí token.
- Gộp các kiểm tra tương tự vào heartbeat thay vì nhiều cron jobs.
- Sử dụng `target: "none"` trên heartbeat nếu bạn chỉ muốn xử lý nội bộ.
- Sử dụng cron riêng lẻ với mô hình rẻ hơn cho các tác vụ thường xuyên.

## Liên quan

- [Heartbeat](/gateway/heartbeat) - cấu hình heartbeat đầy đủ
- [Cron jobs](/automation/cron-jobs) - tham chiếu CLI và API cron đầy đủ
- [System](/cli/system) - sự kiện hệ thống + điều khiển heartbeat
