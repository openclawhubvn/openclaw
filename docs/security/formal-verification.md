---
title: Xác Minh Hình Thức (Mô Hình Bảo Mật)
summary: Mô hình bảo mật được kiểm tra bằng máy cho các đường dẫn có rủi ro cao nhất của OpenClaw.
read_when:
  - Xem xét các đảm bảo hoặc giới hạn của mô hình bảo mật hình thức
  - Tái tạo hoặc cập nhật các kiểm tra mô hình bảo mật TLA+/TLC
permalink: /security/formal-verification/
---

# Xác Minh Hình Thức (Mô Hình Bảo Mật)

Trang này theo dõi các **mô hình bảo mật hình thức** của OpenClaw (hiện tại là TLA+/TLC; sẽ bổ sung thêm khi cần).

> Lưu ý: một số liên kết cũ có thể tham chiếu đến tên dự án trước đây.

**Mục tiêu (hướng đi chính):** cung cấp một lập luận được kiểm tra bằng máy rằng OpenClaw thực thi chính sách bảo mật dự kiến của mình (ủy quyền, cô lập phiên, kiểm soát công cụ và an toàn cấu hình sai), dưới các giả định rõ ràng.

**Hiện tại là gì:** một bộ kiểm tra hồi quy bảo mật **có thể thực thi**, được điều khiển bởi kẻ tấn công:

- Mỗi tuyên bố có một mô hình kiểm tra có thể chạy trên không gian trạng thái hữu hạn.
- Nhiều tuyên bố có một **mô hình tiêu cực** đi kèm tạo ra một dấu vết phản ví dụ cho một lớp lỗi thực tế.

**Chưa phải là gì:** một bằng chứng rằng "OpenClaw an toàn về mọi mặt" hoặc rằng toàn bộ triển khai TypeScript là chính xác.

## Vị trí của các mô hình

Các mô hình được duy trì trong một repo riêng: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Lưu ý quan trọng

- Đây là **mô hình**, không phải toàn bộ triển khai TypeScript. Có thể xảy ra sự khác biệt giữa mô hình và mã.
- Kết quả bị giới hạn bởi không gian trạng thái mà TLC khám phá; "xanh" không ngụ ý an toàn ngoài các giả định và giới hạn đã mô hình hóa.
- Một số tuyên bố dựa vào các giả định môi trường rõ ràng (ví dụ: triển khai đúng, đầu vào cấu hình đúng).

## Tái tạo kết quả

Hiện tại, kết quả được tái tạo bằng cách clone repo mô hình về máy cục bộ và chạy TLC (xem bên dưới). Phiên bản tương lai có thể cung cấp:

- Mô hình chạy CI với các hiện vật công khai (dấu vết phản ví dụ, nhật ký chạy)
- Một quy trình "chạy mô hình này" được lưu trữ cho các kiểm tra nhỏ, có giới hạn

Bắt đầu:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Yêu cầu Java 11+ (TLC chạy trên JVM).
# Repo cung cấp một `tla2tools.jar` cố định (công cụ TLA+) và cung cấp `bin/tlc` + các mục tiêu Make.

make <target>
```

### Phơi bày Gateway và cấu hình sai gateway mở

**Tuyên bố:** ràng buộc ngoài loopback mà không có xác thực có thể làm cho việc xâm nhập từ xa trở nên khả thi / tăng cường phơi bày; token/mật khẩu chặn kẻ tấn công không xác thực (theo các giả định mô hình).

- Chạy xanh:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Đỏ (dự kiến):
  - `make gateway-exposure-v2-negative`

Xem thêm: `docs/gateway-exposure-matrix.md` trong repo mô hình.

### Pipeline Nodes.run (khả năng rủi ro cao nhất)

**Tuyên bố:** `nodes.run` yêu cầu (a) danh sách lệnh cho phép node cùng với các lệnh đã khai báo và (b) phê duyệt trực tiếp khi được cấu hình; phê duyệt được mã hóa để ngăn chặn phát lại (trong mô hình).

- Chạy xanh:
  - `make nodes-pipeline`
  - `make approvals-token`
- Đỏ (dự kiến):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Lưu trữ ghép đôi (kiểm soát DM)

**Tuyên bố:** yêu cầu ghép đôi tuân thủ TTL và giới hạn yêu cầu đang chờ xử lý.

- Chạy xanh:
  - `make pairing`
  - `make pairing-cap`
- Đỏ (dự kiến):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Kiểm soát truy cập (đề cập + bỏ qua lệnh điều khiển)

**Tuyên bố:** trong các ngữ cảnh nhóm yêu cầu đề cập, một "lệnh điều khiển" không được phép không thể bỏ qua kiểm soát đề cập.

- Xanh:
  - `make ingress-gating`
- Đỏ (dự kiến):
  - `make ingress-gating-negative`

### Cách ly định tuyến/khóa phiên

**Tuyên bố:** DM từ các đối tác khác nhau không hợp nhất vào cùng một phiên trừ khi được liên kết/cấu hình rõ ràng.

- Xanh:
  - `make routing-isolation`
- Đỏ (dự kiến):
  - `make routing-isolation-negative`

## v1++: các mô hình có giới hạn bổ sung (đồng thời, thử lại, độ chính xác dấu vết)

Đây là các mô hình tiếp theo nhằm thắt chặt độ trung thực xung quanh các chế độ lỗi thực tế (cập nhật không nguyên tử, thử lại và phân tán thông điệp).

### Đồng thời lưu trữ ghép đôi / tính chất idempotency

**Tuyên bố:** một lưu trữ ghép đôi nên thực thi `MaxPending` và tính chất idempotency ngay cả khi có sự xen kẽ (tức là "kiểm tra-rồi-ghi" phải là nguyên tử / khóa; làm mới không nên tạo ra các bản sao).

Ý nghĩa:

- Dưới các yêu cầu đồng thời, bạn không thể vượt quá `MaxPending` cho một kênh.
- Các yêu cầu/làm mới lặp lại cho cùng một `(channel, sender)` không nên tạo ra các hàng đang chờ xử lý trùng lặp.

- Chạy xanh:
  - `make pairing-race` (kiểm tra giới hạn nguyên tử/khóa)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Đỏ (dự kiến):
  - `make pairing-race-negative` (cuộc đua giới hạn bắt đầu/kết thúc không nguyên tử)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Tương quan dấu vết truy cập / tính chất idempotency

**Tuyên bố:** việc truy cập nên bảo toàn tương quan dấu vết qua phân tán và là idempotent dưới các lần thử lại của nhà cung cấp.

Ý nghĩa:

- Khi một sự kiện bên ngoài trở thành nhiều thông điệp nội bộ, mọi phần đều giữ nguyên danh tính dấu vết/sự kiện.
- Các lần thử lại không dẫn đến xử lý kép.
- Nếu ID sự kiện của nhà cung cấp bị thiếu, việc loại bỏ trùng lặp sẽ quay lại một khóa an toàn (ví dụ: ID dấu vết) để tránh bỏ qua các sự kiện khác biệt.

- Xanh:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Đỏ (dự kiến):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Định tuyến ưu tiên dmScope + liên kết danh tính

**Tuyên bố:** định tuyến phải giữ các phiên DM cách ly theo mặc định và chỉ hợp nhất các phiên khi được cấu hình rõ ràng (ưu tiên kênh + liên kết danh tính).

Ý nghĩa:

- Các ghi đè dmScope cụ thể của kênh phải thắng các mặc định toàn cầu.
- Liên kết danh tính chỉ nên hợp nhất trong các nhóm liên kết rõ ràng, không phải giữa các đối tác không liên quan.

- Xanh:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Đỏ (dự kiến):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
