---
title: Xác minh chính thức (Mô hình bảo mật)
summary: Mô hình bảo mật được kiểm tra bằng máy cho các đường dẫn rủi ro cao nhất của OpenClaw.
read_when:
  - Xem xét đảm bảo hoặc giới hạn của mô hình bảo mật chính thức
  - Tái tạo hoặc cập nhật kiểm tra mô hình bảo mật TLA+/TLC
permalink: /security/formal-verification/
---

# Xác minh chính thức (Mô hình bảo mật)

Trang này theo dõi **mô hình bảo mật chính thức** của OpenClaw (hiện tại là TLA+/TLC; có thể thêm nếu cần).

> Lưu ý: một số liên kết cũ có thể tham chiếu tên dự án trước đây.

**Mục tiêu:** cung cấp lập luận được kiểm tra bằng máy rằng OpenClaw thực thi chính sách bảo mật dự kiến (ủy quyền, cách ly phiên, kiểm soát công cụ, an toàn cấu hình sai), dưới các giả định rõ ràng.

**Hiện tại:** một bộ kiểm tra hồi quy bảo mật có thể chạy, hướng tấn công:

- Mỗi tuyên bố có một mô hình kiểm tra có thể chạy trên không gian trạng thái hữu hạn.
- Nhiều tuyên bố có một **mô hình tiêu cực** đi kèm tạo ra dấu vết phản ví dụ cho một lớp lỗi thực tế.

**Chưa phải:** bằng chứng rằng “OpenClaw an toàn ở mọi khía cạnh” hoặc rằng toàn bộ triển khai TypeScript là chính xác.

## Vị trí của các mô hình

Mô hình được duy trì trong repo riêng: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Lưu ý quan trọng

- Đây là **mô hình**, không phải toàn bộ triển khai TypeScript. Có thể có sự lệch giữa mô hình và mã.
- Kết quả bị giới hạn bởi không gian trạng thái được TLC khám phá; “xanh” không ngụ ý bảo mật ngoài các giả định và giới hạn đã mô hình hóa.
- Một số tuyên bố dựa vào giả định môi trường rõ ràng (ví dụ: triển khai đúng, đầu vào cấu hình đúng).

## Tái tạo kết quả

Hiện tại, kết quả được tái tạo bằng cách clone repo mô hình về local và chạy TLC. Tương lai có thể cung cấp:

- Mô hình chạy CI với các artifact công khai (dấu vết phản ví dụ, log chạy)
- Workflow “chạy mô hình này” được host cho các kiểm tra nhỏ, có giới hạn

Bắt đầu:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Yêu cầu Java 11+ (TLC chạy trên JVM).
# Repo có sẵn `tla2tools.jar` (công cụ TLA+) và cung cấp `bin/tlc` + các mục tiêu Make.

make <target>
```

### Phơi bày Gateway và cấu hình sai gateway mở

**Tuyên bố:** ràng buộc ngoài loopback mà không có auth có thể làm cho việc xâm nhập từ xa khả thi / tăng phơi bày; token/mật khẩu chặn kẻ tấn công không được ủy quyền (theo giả định mô hình).

- Chạy xanh:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Đỏ (dự kiến):
  - `make gateway-exposure-v2-negative`

Xem thêm: `docs/gateway-exposure-matrix.md` trong repo mô hình.

### Pipeline Nodes.run (khả năng rủi ro cao nhất)

**Tuyên bố:** `nodes.run` yêu cầu (a) danh sách lệnh cho phép node cộng với các lệnh đã khai báo và (b) phê duyệt trực tiếp khi được cấu hình; phê duyệt được mã hóa để ngăn chặn phát lại (trong mô hình).

- Chạy xanh:
  - `make nodes-pipeline`
  - `make approvals-token`
- Đỏ (dự kiến):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Lưu trữ ghép đôi (DM gating)

**Tuyên bố:** yêu cầu ghép đôi tôn trọng TTL và giới hạn yêu cầu đang chờ xử lý.

- Chạy xanh:
  - `make pairing`
  - `make pairing-cap`
- Đỏ (dự kiến):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Gating Ingress (đề cập + bỏ qua lệnh điều khiển)

**Tuyên bố:** trong ngữ cảnh nhóm yêu cầu đề cập, một “lệnh điều khiển” không được ủy quyền không thể bỏ qua gating đề cập.

- Xanh:
  - `make ingress-gating`
- Đỏ (dự kiến):
  - `make ingress-gating-negative`

### Cách ly routing/session-key

**Tuyên bố:** DMs từ các peer khác nhau không hợp nhất vào cùng một session trừ khi được liên kết/cấu hình rõ ràng.

- Xanh:
  - `make routing-isolation`
- Đỏ (dự kiến):
  - `make routing-isolation-negative`

## v1++: mô hình giới hạn bổ sung (đồng thời, thử lại, độ chính xác dấu vết)

Đây là các mô hình tiếp theo thắt chặt độ trung thực xung quanh các chế độ lỗi thực tế (cập nhật không nguyên tử, thử lại và fan-out thông điệp).

### Đồng thời lưu trữ ghép đôi / idempotency

**Tuyên bố:** một lưu trữ ghép đôi nên thực thi `MaxPending` và idempotency ngay cả dưới các interleaving (tức là “kiểm tra-rồi-ghi” phải nguyên tử / khóa; làm mới không nên tạo bản sao).

Ý nghĩa:

- Dưới các yêu cầu đồng thời, không thể vượt quá `MaxPending` cho một channel.
- Yêu cầu/làm mới lặp lại cho cùng `(channel, sender)` không nên tạo ra các hàng đang chờ xử lý trùng lặp.

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

### Tương quan dấu vết Ingress / idempotency

**Tuyên bố:** ingestion nên giữ nguyên tương quan dấu vết qua fan-out và idempotent dưới thử lại của provider.

Ý nghĩa:

- Khi một sự kiện bên ngoài trở thành nhiều thông điệp nội bộ, mọi phần giữ nguyên danh tính dấu vết/sự kiện.
- Thử lại không dẫn đến xử lý kép.
- Nếu thiếu ID sự kiện của provider, dedupe quay lại một khóa an toàn (ví dụ: ID dấu vết) để tránh bỏ qua các sự kiện khác biệt.

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

### Routing dmScope precedence + identityLinks

**Tuyên bố:** routing phải giữ các session DM cách ly theo mặc định, và chỉ hợp nhất session khi được cấu hình rõ ràng (ưu tiên channel + liên kết danh tính).

Ý nghĩa:

- Ghi đè dmScope cụ thể của channel phải thắng các mặc định toàn cầu.
- identityLinks chỉ nên hợp nhất trong các nhóm liên kết rõ ràng, không phải giữa các peer không liên quan.

- Xanh:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Đỏ (dự kiến):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`\n