---
summary: "Tham khảo CLI cho `openclaw status` (chẩn đoán, kiểm tra, ảnh chụp nhanh sử dụng)"
read_when:
  - Bạn muốn chẩn đoán nhanh tình trạng kênh và người nhận phiên gần đây
  - Bạn cần trạng thái “tất cả” có thể dán để gỡ lỗi
title: "status"
---

# `openclaw status`

Chẩn đoán cho kênh và phiên.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Ghi chú:

- `--deep` thực hiện kiểm tra trực tiếp (WhatsApp Web, Telegram, Discord, Google Chat, Slack, Signal).
- Kết quả bao gồm lưu trữ phiên cho từng agent khi có nhiều agent được cấu hình.
- Tổng quan bao gồm trạng thái cài đặt/dịch vụ runtime của Gateway và node host khi có sẵn.
- Tổng quan bao gồm kênh cập nhật và git SHA (đối với các bản kiểm tra nguồn).
- Thông tin cập nhật xuất hiện trong Tổng quan; nếu có bản cập nhật, trạng thái sẽ gợi ý chạy `openclaw update` (xem [Cập nhật](/install/updating)).
- Trạng thái chỉ đọc (`status`, `status --json`, `status --all`) giải quyết SecretRefs được hỗ trợ cho các đường dẫn cấu hình mục tiêu khi có thể.
- Nếu một SecretRef kênh được hỗ trợ được cấu hình nhưng không có sẵn trong đường dẫn lệnh hiện tại, trạng thái vẫn chỉ đọc và báo cáo kết quả suy giảm thay vì bị lỗi. Kết quả cho người dùng sẽ hiển thị cảnh báo như “token được cấu hình không có sẵn trong đường dẫn lệnh này”, và kết quả JSON bao gồm `secretDiagnostics`.
- Khi giải quyết SecretRef cục bộ thành công, trạng thái ưu tiên ảnh chụp nhanh đã giải quyết và xóa các dấu hiệu kênh “secret không có sẵn” tạm thời khỏi kết quả cuối cùng.
- `status --all` bao gồm một hàng tổng quan về Secrets và một phần chẩn đoán tóm tắt các chẩn đoán secret (được rút gọn để dễ đọc) mà không dừng việc tạo báo cáo.
