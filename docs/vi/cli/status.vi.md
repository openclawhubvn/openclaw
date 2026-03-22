# `openclaw status`

Chẩn đoán cho channels và sessions.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Ghi chú:

- `--deep` chạy probes trực tiếp (WhatsApp Web, Telegram, Discord, Google Chat, Slack, Signal).
- Output bao gồm session stores cho từng agent khi có nhiều agents được cấu hình.
- Tổng quan bao gồm trạng thái cài đặt/dịch vụ runtime của Gateway và node host nếu có.
- Tổng quan có thông tin kênh cập nhật và git SHA (cho source checkouts).
- Nếu có bản cập nhật, status sẽ gợi ý chạy `openclaw update` (xem [Updating](/install/updating)).
- Status chỉ đọc (`status`, `status --json`, `status --all`) sẽ giải quyết SecretRefs hỗ trợ cho các config paths mục tiêu nếu có thể.
- Nếu SecretRef của channel được cấu hình nhưng không có sẵn trong command path hiện tại, status vẫn chỉ đọc và báo output suy giảm thay vì crash. Output cho người dùng sẽ có cảnh báo như “token được cấu hình không có sẵn trong command path này”, và output JSON sẽ có `secretDiagnostics`.
- Khi giải quyết SecretRef command-local thành công, status ưu tiên snapshot đã giải quyết và xóa các dấu hiệu “secret không có sẵn” tạm thời khỏi output cuối cùng.
- `status --all` bao gồm một hàng tổng quan về Secrets và một phần chẩn đoán tóm tắt secret diagnostics (rút gọn để dễ đọc) mà không dừng việc tạo báo cáo.\n