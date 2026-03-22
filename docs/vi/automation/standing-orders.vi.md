---
summary: "Xác định quyền hoạt động lâu dài cho các chương trình agent tự động"
read_when:
  - Thiết lập quy trình làm việc cho agent tự động chạy mà không cần nhắc nhở từng tác vụ
  - Xác định những gì agent có thể tự làm và những gì cần phê duyệt từ con người
  - Cấu trúc agent đa chương trình với ranh giới và quy tắc leo thang rõ ràng
title: "Lệnh Đứng"
---

# Lệnh Đứng

Lệnh đứng cấp quyền hoạt động lâu dài cho agent trong các chương trình đã định nghĩa. Thay vì phải chỉ dẫn từng tác vụ, bạn định nghĩa chương trình với phạm vi, kích hoạt và quy tắc leo thang rõ ràng — và agent tự động thực hiện trong các giới hạn đó.

Khác biệt giữa việc bảo trợ lý "gửi báo cáo hàng tuần" mỗi thứ Sáu và cấp quyền đứng: "Bạn phụ trách báo cáo hàng tuần. Tổng hợp mỗi thứ Sáu, gửi đi, và chỉ leo thang nếu có gì sai."

## Tại Sao Cần Lệnh Đứng?

**Không có lệnh đứng:**

- Phải nhắc agent cho từng tác vụ
- Agent ngồi không giữa các yêu cầu
- Công việc thường lệ bị quên hoặc trễ
- Bạn trở thành nút thắt cổ chai

**Có lệnh đứng:**

- Agent tự động thực hiện trong giới hạn đã định
- Công việc thường lệ diễn ra đúng lịch mà không cần nhắc
- Bạn chỉ tham gia khi có ngoại lệ và cần phê duyệt
- Agent tận dụng thời gian rảnh hiệu quả

## Cách Hoạt Động

Lệnh đứng được định nghĩa trong file [agent workspace](/concepts/agent-workspace). Cách tốt nhất là đưa trực tiếp vào `AGENTS.md` (tự động nạp mỗi phiên) để agent luôn có ngữ cảnh. Với cấu hình lớn hơn, có thể đặt trong file riêng như `standing-orders.md` và tham chiếu từ `AGENTS.md`.

Mỗi chương trình xác định:

1. **Phạm vi** — agent được phép làm gì
2. **Kích hoạt** — khi nào thực hiện (lịch trình, sự kiện, điều kiện)
3. **Cổng phê duyệt** — cần phê duyệt từ con người trước khi hành động
4. **Quy tắc leo thang** — khi nào dừng và yêu cầu trợ giúp

Agent nạp các hướng dẫn này mỗi phiên qua file bootstrap của workspace (xem [Agent Workspace](/concepts/agent-workspace) để biết danh sách đầy đủ các file tự động nạp) và thực hiện theo chúng, kết hợp với [cron jobs](/automation/cron-jobs) để thực thi theo thời gian.

<Tip>
Đặt lệnh đứng trong `AGENTS.md` để đảm bảo chúng được nạp mỗi phiên. Workspace bootstrap tự động nạp `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, và `MEMORY.md` — nhưng không phải file tùy ý trong thư mục con.
</Tip>

## Cấu Trúc Của Một Lệnh Đứng

```markdown
## Chương Trình: Báo Cáo Trạng Thái Hàng Tuần

**Quyền hạn:** Tổng hợp dữ liệu, tạo báo cáo, gửi đến các bên liên quan
**Kích hoạt:** Mỗi thứ Sáu lúc 4 PM (thực thi qua cron job)
**Cổng phê duyệt:** Không cần cho báo cáo chuẩn. Đánh dấu bất thường để con người xem xét.
**Leo thang:** Nếu nguồn dữ liệu không khả dụng hoặc số liệu bất thường (>2σ so với chuẩn)

### Bước Thực Hiện

1. Lấy số liệu từ các nguồn đã cấu hình
2. So sánh với tuần trước và mục tiêu
3. Tạo báo cáo trong Reports/weekly/YYYY-MM-DD.md
4. Gửi tóm tắt qua kênh đã cấu hình
5. Ghi nhật ký hoàn thành vào Agent/Logs/

### Không Được Làm

- Không gửi báo cáo ra bên ngoài
- Không sửa đổi dữ liệu nguồn
- Không bỏ qua gửi nếu số liệu xấu — báo cáo chính xác
```

## Lệnh Đứng + Cron Jobs

Lệnh đứng xác định **cái gì** agent được phép làm. [Cron jobs](/automation/cron-jobs) xác định **khi nào** thực hiện. Chúng hoạt động cùng nhau:

```
Lệnh Đứng: "Bạn phụ trách xử lý hộp thư hàng ngày"
    ↓
Cron Job (8 AM hàng ngày): "Thực hiện xử lý hộp thư theo lệnh đứng"
    ↓
Agent: Đọc lệnh đứng → thực hiện các bước → báo cáo kết quả
```

Cron job nên tham chiếu lệnh đứng thay vì lặp lại:

```bash
openclaw cron create \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Thực hiện xử lý hộp thư hàng ngày theo lệnh đứng. Kiểm tra thư mới. Phân loại, lưu trữ từng mục. Báo cáo tóm tắt cho chủ sở hữu. Leo thang nếu không rõ."
```

## Ví Dụ

### Ví Dụ 1: Nội Dung & Mạng Xã Hội (Chu Kỳ Hàng Tuần)

```markdown
## Chương Trình: Nội Dung & Mạng Xã Hội

**Quyền hạn:** Soạn thảo nội dung, lên lịch đăng bài, tổng hợp báo cáo tương tác
**Cổng phê duyệt:** Tất cả bài đăng cần chủ sở hữu duyệt trong 30 ngày đầu, sau đó được phê duyệt đứng
**Kích hoạt:** Chu kỳ hàng tuần (Thứ Hai xem xét → giữa tuần soạn thảo → Thứ Sáu tóm tắt)

### Chu Kỳ Hàng Tuần

- **Thứ Hai:** Xem xét số liệu nền tảng và tương tác khán giả
- **Thứ Ba–Thứ Năm:** Soạn thảo bài đăng xã hội, tạo nội dung blog
- **Thứ Sáu:** Tổng hợp tóm tắt tiếp thị hàng tuần → gửi cho chủ sở hữu

### Quy Tắc Nội Dung

- Giọng điệu phải phù hợp với thương hiệu (xem SOUL.md hoặc hướng dẫn giọng điệu thương hiệu)
- Không bao giờ nhận diện là AI trong nội dung công khai
- Bao gồm số liệu khi có
- Tập trung vào giá trị cho khán giả, không tự quảng cáo
```

### Ví Dụ 2: Hoạt Động Tài Chính (Kích Hoạt Theo Sự Kiện)

```markdown
## Chương Trình: Xử Lý Tài Chính

**Quyền hạn:** Xử lý dữ liệu giao dịch, tạo báo cáo, gửi tóm tắt
**Cổng phê duyệt:** Không cần cho phân tích. Khuyến nghị cần chủ sở hữu phê duyệt.
**Kích hoạt:** Phát hiện file dữ liệu mới HOẶC chu kỳ hàng tháng đã lên lịch

### Khi Có Dữ Liệu Mới

1. Phát hiện file mới trong thư mục đầu vào chỉ định
2. Phân tích và phân loại tất cả giao dịch
3. So sánh với mục tiêu ngân sách
4. Đánh dấu: mục bất thường, vi phạm ngưỡng, khoản phí định kỳ mới
5. Tạo báo cáo trong thư mục đầu ra chỉ định
6. Gửi tóm tắt cho chủ sở hữu qua kênh đã cấu hình

### Quy Tắc Leo Thang

- Mục đơn > $500: cảnh báo ngay lập tức
- Danh mục > ngân sách 20%: đánh dấu trong báo cáo
- Giao dịch không nhận diện được: hỏi chủ sở hữu để phân loại
- Xử lý thất bại sau 2 lần thử: báo cáo thất bại, không đoán
```

### Ví Dụ 3: Giám Sát & Cảnh Báo (Liên Tục)

```markdown
## Chương Trình: Giám Sát Hệ Thống

**Quyền hạn:** Kiểm tra sức khỏe hệ thống, khởi động lại dịch vụ, gửi cảnh báo
**Cổng phê duyệt:** Tự động khởi động lại dịch vụ. Leo thang nếu khởi động lại thất bại hai lần.
**Kích hoạt:** Mỗi chu kỳ nhịp tim

### Kiểm Tra

- Điểm cuối sức khỏe dịch vụ phản hồi
- Dung lượng đĩa trên ngưỡng
- Tác vụ chờ không bị trì trệ (>24 giờ)
- Kênh giao hàng hoạt động

### Ma Trận Phản Hồi

| Điều kiện        | Hành động                | Leo thang?               |
| ---------------- | ------------------------ | ------------------------ |
| Dịch vụ ngừng    | Tự động khởi động lại    | Chỉ khi khởi động lại thất bại 2x |
| Dung lượng đĩa < 10% | Cảnh báo chủ sở hữu     | Có                      |
| Tác vụ trì trệ > 24h | Nhắc nhở chủ sở hữu     | Không                   |
| Kênh offline     | Ghi nhật ký và thử lại chu kỳ sau | Nếu offline > 2 giờ     |
```

## Mô Hình Thực Hiện-Xác Minh-Báo Cáo

Lệnh đứng hoạt động tốt nhất khi kết hợp với kỷ luật thực hiện nghiêm ngặt. Mỗi tác vụ trong lệnh đứng nên tuân theo vòng lặp này:

1. **Thực hiện** — Làm công việc thực tế (không chỉ xác nhận chỉ dẫn)
2. **Xác minh** — Xác nhận kết quả đúng (file tồn tại, tin nhắn được gửi, dữ liệu được phân tích)
3. **Báo cáo** — Thông báo cho chủ sở hữu những gì đã làm và đã xác minh

```markdown
### Quy Tắc Thực Hiện

- Mỗi tác vụ tuân theo Thực hiện-Xác minh-Báo cáo. Không ngoại lệ.
- "Tôi sẽ làm điều đó" không phải là thực hiện. Làm đi, rồi báo cáo.
- "Xong" mà không xác minh là không chấp nhận được. Chứng minh đi.
- Nếu thực hiện thất bại: thử lại một lần với cách tiếp cận điều chỉnh.
- Nếu vẫn thất bại: báo cáo thất bại với chẩn đoán. Không bao giờ thất bại trong im lặng.
- Không bao giờ thử lại vô thời hạn — tối đa 3 lần, sau đó leo thang.
```

Mô hình này ngăn chặn chế độ thất bại phổ biến nhất của agent: xác nhận một tác vụ mà không hoàn thành nó.

## Kiến Trúc Đa Chương Trình

Đối với agent quản lý nhiều mối quan tâm, tổ chức lệnh đứng thành các chương trình riêng biệt với ranh giới rõ ràng:

```markdown
# Lệnh Đứng

## Chương Trình 1: [Miền A] (Hàng Tuần)

...

## Chương Trình 2: [Miền B] (Hàng Tháng + Theo Yêu Cầu)

...

## Chương Trình 3: [Miền C] (Khi Cần)

...

## Quy Tắc Leo Thang (Tất Cả Chương Trình)

- [Tiêu chí leo thang chung]
- [Cổng phê duyệt áp dụng cho tất cả chương trình]
```

Mỗi chương trình nên có:

- **Chu kỳ kích hoạt** riêng (hàng tuần, hàng tháng, theo sự kiện, liên tục)
- **Cổng phê duyệt** riêng (một số chương trình cần giám sát nhiều hơn)
- **Ranh giới** rõ ràng (agent nên biết nơi một chương trình kết thúc và chương trình khác bắt đầu)

## Thực Hành Tốt Nhất

### Nên

- Bắt đầu với quyền hạn hẹp và mở rộng khi tin tưởng tăng
- Định nghĩa cổng phê duyệt rõ ràng cho hành động rủi ro cao
- Bao gồm phần "Không Được Làm" — ranh giới quan trọng như quyền hạn
- Kết hợp với cron jobs để thực thi theo thời gian đáng tin cậy
- Xem xét nhật ký agent hàng tuần để xác minh lệnh đứng được tuân thủ
- Cập nhật lệnh đứng khi nhu cầu thay đổi — chúng là tài liệu sống

### Không Nên

- Cấp quyền rộng ngay từ đầu ("làm bất cứ điều gì bạn nghĩ là tốt nhất")
- Bỏ qua quy tắc leo thang — mỗi chương trình cần một điều khoản "khi nào dừng và hỏi"
- Giả định agent sẽ nhớ hướng dẫn bằng lời — đưa mọi thứ vào file
- Trộn lẫn mối quan tâm trong một chương trình — chương trình riêng cho miền riêng
- Quên thực thi với cron jobs — lệnh đứng không có kích hoạt trở thành gợi ý

## Liên Quan

- [Cron Jobs](/automation/cron-jobs) — Lên lịch thực thi cho lệnh đứng
- [Agent Workspace](/concepts/agent-workspace) — Nơi lệnh đứng tồn tại, bao gồm danh sách đầy đủ các file bootstrap tự động nạp (AGENTS.md, SOUL.md, v.v.)\n