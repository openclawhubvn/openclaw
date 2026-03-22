---
summary: "Tham khảo CLI cho `openclaw cron` (lên lịch và chạy các job nền)"
read_when:
  - Cần lên lịch job và wakeup
  - Debug cron execution và log
title: "cron"
---

# `openclaw cron`

Quản lý cron job cho Gateway scheduler.

Liên quan:

- Cron jobs: [Cron jobs](/automation/cron-jobs)

Mẹo: chạy `openclaw cron --help` để xem toàn bộ lệnh.

Lưu ý: job `cron add` mặc định dùng `--announce` để thông báo. Dùng `--no-deliver` để giữ output nội bộ. `--deliver` là alias cũ của `--announce`.

Lưu ý: job one-shot (`--at`) sẽ tự xóa sau khi chạy thành công. Dùng `--keep-after-run` để giữ lại.

Lưu ý: job định kỳ giờ dùng exponential retry backoff sau khi lỗi liên tiếp (30s → 1m → 5m → 15m → 60m), sau đó quay lại lịch bình thường khi chạy thành công.

Lưu ý: `openclaw cron run` giờ trả về ngay khi manual run được xếp hàng. Phản hồi thành công gồm `{ ok: true, enqueued: true, runId }`; dùng `openclaw cron runs --id <job-id>` để theo dõi kết quả.

Lưu ý: retention/pruning được điều khiển trong config:

- `cron.sessionRetention` (mặc định `24h`) xóa các session chạy isolated đã hoàn thành.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` xóa `~/.openclaw/cron/runs/<jobId>.jsonl`.

Lưu ý nâng cấp: nếu có cron job cũ trước định dạng delivery/store hiện tại, chạy `openclaw doctor --fix`. Doctor giờ chuẩn hóa các trường cron cũ (`jobId`, `schedule.cron`, các trường delivery top-level, alias delivery `provider` payload) và di chuyển job webhook fallback `notify: true` đơn giản sang webhook delivery rõ ràng khi `cron.webhook` được cấu hình.

## Chỉnh sửa thường gặp

Cập nhật cài đặt delivery mà không đổi message:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Tắt delivery cho job isolated:

```bash
openclaw cron edit <job-id> --no-deliver
```

Bật lightweight bootstrap context cho job isolated:

```bash
openclaw cron edit <job-id> --light-context
```

Thông báo đến một channel cụ thể:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Tạo job isolated với lightweight bootstrap context:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` chỉ áp dụng cho job agent-turn isolated. Với cron run, chế độ lightweight giữ bootstrap context trống thay vì inject toàn bộ workspace bootstrap set.\n