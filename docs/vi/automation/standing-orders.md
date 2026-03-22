---
summary: "Xác định quyền hoạt động lâu dài cho các chương trình tác nhân tự động"
read_when:
  - Thiết lập quy trình làm việc cho tác nhân tự động chạy mà không cần nhắc nhở từng nhiệm vụ
  - Xác định những gì tác nhân có thể làm độc lập và những gì cần sự phê duyệt của con người
  - Cấu trúc các tác nhân đa chương trình với ranh giới và quy tắc leo thang rõ ràng
title: "Lệnh Thường Trực"
---

# Lệnh Thường Trực

Lệnh thường trực cung cấp cho tác nhân quyền hoạt động **lâu dài** cho các chương trình đã được xác định. Thay vì đưa ra hướng dẫn cho từng nhiệm vụ, bạn xác định các chương trình với phạm vi, kích hoạt và quy tắc leo thang rõ ràng — và tác nhân sẽ tự động thực hiện trong các giới hạn đó.

Điều này khác với việc bảo trợ lý của bạn "gửi báo cáo hàng tuần" mỗi thứ Sáu so với việc cấp quyền thường trực: "Bạn phụ trách báo cáo hàng tuần. Tổng hợp nó mỗi thứ Sáu, gửi đi, và chỉ leo thang nếu có điều gì đó không ổn."

## Tại Sao Cần Lệnh Thường Trực?

**Không có lệnh thường trực:**

- Bạn phải nhắc nhở tác nhân cho mỗi nhiệm vụ
- Tác nhân không hoạt động giữa các yêu cầu
- Công việc thường xuyên bị quên hoặc trì hoãn
- Bạn trở thành nút thắt cổ chai

**Có lệnh thường trực:**

- Tác nhân tự động thực hiện trong các giới hạn đã xác định
- Công việc thường xuyên diễn ra đúng lịch mà không cần nhắc nhở
- Bạn chỉ tham gia khi có ngoại lệ và cần phê duyệt
- Tác nhân sử dụng thời gian rảnh một cách hiệu quả

## Cách Hoạt Động

Lệnh thường trực được xác định trong các file [agent workspace](/concepts/agent-workspace) của bạn. Cách tiếp cận được khuyến nghị là đưa chúng trực tiếp vào `AGENTS.md` (được tự động chèn vào mỗi phiên) để tác nhân luôn có chúng trong ngữ cảnh. Đối với các cấu hình lớn hơn, bạn cũng có thể đặt chúng trong một file riêng như `standing-orders.md` và tham chiếu từ `AGENTS.md`.

Mỗi chương trình xác định:

1. **Phạm vi** — những gì tác nhân được phép làm
2. **Kích hoạt** — khi nào thực hiện (lịch trình, sự kiện hoặc điều kiện)
3. **Cổng phê duyệt** — những gì cần sự phê duyệt của con người trước khi hành động
4. **Quy tắc leo thang** — khi nào dừng lại và yêu cầu trợ giúp

Tác nhân tải các hướng dẫn này mỗi phiên thông qua các file bootstrap của workspace (xem [Agent Workspace](/concepts/agent-workspace) để biết danh sách đầy đủ các file được tự động chèn) và thực hiện theo chúng, kết hợp với [cron jobs](/automation/cron-jobs) để thực thi theo thời gian.

<Tip>
Đặt lệnh thường trực trong `AGENTS.md` để đảm bảo chúng được tải mỗi phiên. Workspace bootstrap tự động chèn `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, và `MEMORY.md` — nhưng không phải các file tùy ý trong các thư mục con.
</Tip>

## Cấu Trúc Của Một Lệnh Thường Trực

```markdown
## Chương Trình: Báo Cáo Trạng Thái Hàng Tuần

**Quyền hạn:** Tổng hợp dữ liệu, tạo báo cáo, gửi đến các bên liên quan
**Kích hoạt:** Mỗi thứ Sáu lúc 4 PM (thực thi qua cron job)
**Cổng phê duyệt:** Không có cho báo cáo tiêu chuẩn. Đánh dấu bất thường để con người xem xét.
**Leo thang:** Nếu nguồn dữ liệu không khả dụng hoặc số liệu trông bất thường (>2σ so với chuẩn)

### Các Bước Thực Hiện

1. Lấy số liệu từ các nguồn đã cấu hình
2. So sánh với tuần trước và mục tiêu
3. Tạo báo cáo trong Reports/weekly/YYYY-MM-DD.md
4. Gửi tóm tắt qua kênh đã cấu hình
5. Ghi nhật ký hoàn thành vào Agent/Logs/

### Những Điều Không Được Làm

- Không gửi báo cáo cho các bên ngoài
- Không sửa đổi dữ liệu nguồn
- Không bỏ qua việc gửi nếu số liệu xấu — báo cáo chính xác
```

## Lệnh Thường Trực + Cron Jobs

Lệnh thường trực xác định **những gì** tác nhân được phép làm. [Cron jobs](/automation/cron-jobs) xác định **khi nào** điều đó xảy ra. Chúng hoạt động cùng nhau:

```
Lệnh Thường Trực: "Bạn phụ trách phân loại hộp thư hàng ngày"
    ↓
Cron Job (8 AM hàng ngày): "Thực hiện phân loại hộp thư theo lệnh thường trực"
    ↓
Tác nhân: Đọc lệnh thường trực → thực hiện các bước → báo cáo kết quả
```

Lệnh cron job nên tham chiếu đến lệnh thường trực thay vì lặp lại nó:

```bash
openclaw cron create \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Thực hiện phân loại hộp thư hàng ngày theo lệnh thường trực. Kiểm tra thư để tìm cảnh báo mới. Phân tích, phân loại và lưu trữ từng mục. Báo cáo tóm tắt cho chủ sở hữu. Leo thang nếu không rõ."
```

## Ví Dụ

### Ví Dụ 1: Nội Dung & Truyền Thông Xã Hội (Chu Kỳ Hàng Tuần)

```markdown
## Chương Trình: Nội Dung & Truyền Thông Xã Hội

**Quyền hạn:** Soạn thảo nội dung, lên lịch đăng bài, tổng hợp báo cáo tương tác
**Cổng phê duyệt:** Tất cả bài đăng cần chủ sở hữu xem xét trong 30 ngày đầu, sau đó được phê duyệt thường trực
**Kích hoạt:** Chu kỳ hàng tuần (Thứ Hai xem xét → giữa tuần soạn thảo → Thứ Sáu tóm tắt)

### Chu Kỳ Hàng Tuần

- **Thứ Hai:** Xem xét số liệu nền tảng và tương tác của khán giả
- **Thứ Ba–Thứ Năm:** Soạn thảo bài đăng xã hội, tạo nội dung blog
- **Thứ Sáu:** Tổng hợp tóm tắt tiếp thị hàng tuần → gửi cho chủ sở hữu

### Quy Tắc Nội Dung

- Giọng điệu phải phù hợp với thương hiệu (xem SOUL.md hoặc hướng dẫn giọng điệu thương hiệu)
- Không bao giờ nhận dạng là AI trong nội dung công khai
- Bao gồm số liệu khi có sẵn
- Tập trung vào giá trị cho khán giả, không phải tự quảng cáo
```

### Ví Dụ 2: Hoạt Động Tài Chính (Kích Hoạt Theo Sự Kiện)

```markdown
## Chương Trình: Xử Lý Tài Chính

**Quyền hạn:** Xử lý dữ liệu giao dịch, tạo báo cáo, gửi tóm tắt
**Cổng phê duyệt:** Không có cho phân tích. Khuyến nghị cần sự phê duyệt của chủ sở hữu.
**Kích hoạt:** Phát hiện file dữ liệu mới HOẶC chu kỳ hàng tháng đã lên lịch

### Khi Có Dữ Liệu Mới

1. Phát hiện file mới trong thư mục đầu vào được chỉ định
2. Phân tích và phân loại tất cả giao dịch
3. So sánh với mục tiêu ngân sách
4. Đánh dấu: các mục bất thường, vi phạm ngưỡng, các khoản phí định kỳ mới
5. Tạo báo cáo trong thư mục đầu ra được chỉ định
6. Gửi tóm tắt cho chủ sở hữu qua kênh đã cấu hình

### Quy Tắc Leo Thang

- Mục đơn > $500: cảnh báo ngay lập tức
- Danh mục > ngân sách 20%: đánh dấu trong báo cáo
- Giao dịch không nhận dạng được: yêu cầu chủ sở hữu phân loại
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
- Nhiệm vụ đang chờ không bị trì trệ (>24 giờ)
- Kênh giao hàng hoạt động

### Ma Trận Phản Hồi

| Điều Kiện        | Hành Động                 | Leo Thang?               |
| ---------------- | ------------------------ | ------------------------ |
| Dịch vụ ngừng    | Tự động khởi động lại    | Chỉ khi khởi động lại thất bại 2 lần |
| Dung lượng đĩa < 10% | Cảnh báo chủ sở hữu    | Có                      |
| Nhiệm vụ trì trệ > 24h | Nhắc nhở chủ sở hữu  | Không                   |
| Kênh ngoại tuyến | Ghi nhật ký và thử lại chu kỳ tiếp theo | Nếu ngoại tuyến > 2 giờ |
```

## Mô Hình Thực Hiện-Xác Minh-Báo Cáo

Lệnh thường trực hoạt động tốt nhất khi kết hợp với kỷ luật thực hiện nghiêm ngặt. Mỗi nhiệm vụ trong lệnh thường trực nên tuân theo vòng lặp này:

1. **Thực hiện** — Thực hiện công việc thực tế (không chỉ xác nhận hướng dẫn)
2. **Xác minh** — Xác nhận kết quả là chính xác (file tồn tại, tin nhắn đã gửi, dữ liệu đã phân tích)
3. **Báo cáo** — Thông báo cho chủ sở hữu về những gì đã làm và đã xác minh

```markdown
### Quy Tắc Thực Hiện

- Mỗi nhiệm vụ tuân theo Thực hiện-Xác minh-Báo cáo. Không có ngoại lệ.
- "Tôi sẽ làm điều đó" không phải là thực hiện. Hãy làm, sau đó báo cáo.
- "Đã xong" mà không có xác minh là không chấp nhận được. Chứng minh điều đó.
- Nếu thực hiện thất bại: thử lại một lần với cách tiếp cận điều chỉnh.
- Nếu vẫn thất bại: báo cáo thất bại với chẩn đoán. Không bao giờ thất bại trong im lặng.
- Không bao giờ thử lại vô thời hạn — tối đa 3 lần, sau đó leo thang.
```

Mô hình này ngăn chặn chế độ thất bại phổ biến nhất của tác nhân: xác nhận một nhiệm vụ mà không hoàn thành nó.

## Kiến Trúc Đa Chương Trình

Đối với các tác nhân quản lý nhiều mối quan tâm, tổ chức lệnh thường trực thành các chương trình riêng biệt với ranh giới rõ ràng:

```markdown
# Lệnh Thường Trực

## Chương Trình 1: [Lĩnh Vực A] (Hàng Tuần)

...

## Chương Trình 2: [Lĩnh Vực B] (Hàng Tháng + Theo Yêu Cầu)

...

## Chương Trình 3: [Lĩnh Vực C] (Khi Cần)

...

## Quy Tắc Leo Thang (Tất Cả Chương Trình)

- [Tiêu chí leo thang chung]
- [Cổng phê duyệt áp dụng cho tất cả chương trình]
```

Mỗi chương trình nên có:

- Nhịp kích hoạt riêng (hàng tuần, hàng tháng, theo sự kiện, liên tục)
- Cổng phê duyệt riêng (một số chương trình cần giám sát nhiều hơn)
- Ranh giới rõ ràng (tác nhân nên biết nơi một chương trình kết thúc và chương trình khác bắt đầu)

## Thực Hành Tốt Nhất

### Nên

- Bắt đầu với quyền hạn hẹp và mở rộng khi niềm tin tăng lên
- Xác định cổng phê duyệt rõ ràng cho các hành động có rủi ro cao
- Bao gồm các phần "Những Điều Không Được Làm" — ranh giới quan trọng như quyền hạn
- Kết hợp với cron jobs để thực thi theo thời gian đáng tin cậy
- Xem xét nhật ký tác nhân hàng tuần để xác minh lệnh thường trực đang được tuân thủ
- Cập nhật lệnh thường trực khi nhu cầu của bạn phát triển — chúng là tài liệu sống

### Không Nên

- Cấp quyền hạn rộng ngay từ đầu ("làm bất cứ điều gì bạn nghĩ là tốt nhất")
- Bỏ qua quy tắc leo thang — mỗi chương trình cần một điều khoản "khi nào dừng lại và hỏi"
- Giả định tác nhân sẽ nhớ hướng dẫn bằng lời nói — đặt mọi thứ vào file
- Trộn lẫn các mối quan tâm trong một chương trình — chương trình riêng cho các lĩnh vực riêng
- Quên thực thi với cron jobs — lệnh thường trực không có kích hoạt trở thành gợi ý

## Liên Quan

- [Cron Jobs](/automation/cron-jobs) — Lên lịch thực thi cho lệnh thường trực
- [Agent Workspace](/concepts/agent-workspace) — Nơi lệnh thường trực tồn tại, bao gồm danh sách đầy đủ các file bootstrap tự động chèn (AGENTS.md, SOUL.md, v.v.)
