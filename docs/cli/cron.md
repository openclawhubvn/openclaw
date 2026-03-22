---
summary: "Tìm hiểu cách lên lịch và chạy công việc nền với OpenClaw Cron CLI. Hướng dẫn chi tiết giúp bạn tối ưu hóa quy trình tự động."
read_when:
  - Bạn muốn lên lịch công việc và đánh thức
  - Bạn đang gỡ lỗi thực thi cron và nhật ký
title: "Hướng Dẫn Cấu Hình OpenClaw Cron CLI"
---

# `openclaw cron`

Quản lý các công việc cron cho bộ lập lịch Gateway.

Liên quan:

- Công việc cron: [Công việc cron](/automation/cron-jobs)

Mẹo: chạy `openclaw cron --help` để xem toàn bộ lệnh.

Lưu ý: các công việc `cron add` độc lập mặc định sử dụng `--announce` để thông báo. Dùng `--no-deliver` để giữ kết quả nội bộ. `--deliver` vẫn là một alias đã lỗi thời cho `--announce`.

Lưu ý: các công việc một lần (`--at`) sẽ tự động xóa sau khi thành công. Dùng `--keep-after-run` để giữ lại.

Lưu ý: các công việc định kỳ hiện sử dụng cơ chế lùi thời gian thử lại theo cấp số nhân sau các lỗi liên tiếp (30s → 1m → 5m → 15m → 60m), sau đó quay lại lịch trình bình thường sau lần chạy thành công tiếp theo.

Lưu ý: `openclaw cron run` hiện trả về ngay khi lần chạy thủ công được xếp hàng để thực thi. Phản hồi thành công bao gồm `{ ok: true, enqueued: true, runId }`; dùng `openclaw cron runs --id <job-id>` để theo dõi kết quả cuối cùng.

Lưu ý: việc giữ lại/xóa bớt được kiểm soát trong cấu hình:

- `cron.sessionRetention` (mặc định `24h`) xóa các phiên chạy độc lập đã hoàn thành.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` xóa bớt `~/.openclaw/cron/runs/<jobId>.jsonl`.

Lưu ý nâng cấp: nếu bạn có các công việc cron cũ từ trước định dạng lưu trữ/giao hàng hiện tại, chạy `openclaw doctor --fix`. Doctor hiện chuẩn hóa các trường cron cũ (`jobId`, `schedule.cron`, các trường giao hàng cấp cao nhất, các alias giao hàng `provider` trong payload) và di chuyển các công việc webhook dự phòng đơn giản `notify: true` sang giao hàng webhook rõ ràng khi `cron.webhook` được cấu hình.

## Chỉnh sửa thông thường

Cập nhật cài đặt giao hàng mà không thay đổi thông điệp:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Vô hiệu hóa giao hàng cho một công việc độc lập:

```bash
openclaw cron edit <job-id> --no-deliver
```

Kích hoạt ngữ cảnh khởi động nhẹ cho một công việc độc lập:

```bash
openclaw cron edit <job-id> --light-context
```

Thông báo đến một kênh cụ thể:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Tạo một công việc độc lập với ngữ cảnh khởi động nhẹ:

```bash
openclaw cron add \
  --name "Tóm tắt buổi sáng nhẹ nhàng" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Tóm tắt các cập nhật qua đêm." \
  --light-context \
  --no-deliver
```

`--light-context` chỉ áp dụng cho các công việc agent-turn độc lập. Đối với các lần chạy cron, chế độ nhẹ giữ ngữ cảnh khởi động trống thay vì chèn toàn bộ bộ khởi động workspace.
