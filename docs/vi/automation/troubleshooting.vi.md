---
summary: "Khắc phục sự cố cron và heartbeat trong lập lịch và gửi thông điệp"
read_when:
  - Cron không chạy
  - Cron chạy nhưng không có thông điệp nào được gửi
  - Heartbeat có vẻ im lặng hoặc bị bỏ qua
title: "Khắc phục sự cố tự động hóa"
---

# Khắc phục sự cố tự động hóa

Trang này dành cho các vấn đề về lập lịch và gửi thông điệp (`cron` + `heartbeat`).

## Lệnh kiểm tra

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sau đó chạy kiểm tra tự động hóa:

```bash
openclaw cron status
openclaw cron list
openclaw system heartbeat last
```

## Cron không chạy

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw logs --follow
```

Kết quả tốt:

- `cron status` báo đã bật và có `nextWakeAtMs` trong tương lai.
- Job đã bật và có lịch trình/múi giờ hợp lệ.
- `cron runs` hiển thị `ok` hoặc lý do bỏ qua rõ ràng.

Dấu hiệu thường gặp:

- `cron: scheduler disabled; jobs will not run automatically` → cron bị tắt trong config/env.
- `cron: timer tick failed` → scheduler tick bị crash; kiểm tra ngữ cảnh stack/log xung quanh.
- `reason: not-due` trong kết quả chạy → chạy thủ công mà không có `--force` và job chưa đến hạn.

## Cron chạy nhưng không gửi thông điệp

```bash
openclaw cron runs --id <jobId> --limit 20
openclaw cron list
openclaw channels status --probe
openclaw logs --follow
```

Kết quả tốt:

- Trạng thái chạy là `ok`.
- Chế độ/đích gửi được thiết lập cho các job độc lập.
- Channel probe báo cáo kênh đích đã kết nối.

Dấu hiệu thường gặp:

- Chạy thành công nhưng chế độ gửi là `none` → không có thông điệp bên ngoài nào được mong đợi.
- Đích gửi thiếu/hỏng (`channel`/`to`) → chạy có thể thành công nội bộ nhưng bỏ qua gửi ra ngoài.
- Lỗi xác thực kênh (`unauthorized`, `missing_scope`, `Forbidden`) → gửi bị chặn bởi thông tin xác thực/quyền kênh.

## Heartbeat bị ngăn hoặc bỏ qua

```bash
openclaw system heartbeat last
openclaw logs --follow
openclaw config get agents.defaults.heartbeat
openclaw channels status --probe
```

Kết quả tốt:

- Heartbeat bật với khoảng thời gian khác 0.
- Kết quả heartbeat cuối là `ran` (hoặc lý do bỏ qua đã hiểu rõ).

Dấu hiệu thường gặp:

- `heartbeat skipped` với `reason=quiet-hours` → ngoài `activeHours`.
- `requests-in-flight` → lane chính bận; heartbeat bị hoãn.
- `empty-heartbeat-file` → heartbeat theo khoảng bị bỏ qua vì `HEARTBEAT.md` không có nội dung hành động và không có sự kiện cron được gắn thẻ nào trong hàng đợi.
- `alerts-disabled` → cài đặt hiển thị ngăn thông điệp heartbeat ra ngoài.

## Lưu ý về múi giờ và activeHours

```bash
openclaw config get agents.defaults.heartbeat.activeHours
openclaw config get agents.defaults.heartbeat.activeHours.timezone
openclaw config get agents.defaults.userTimezone || echo "agents.defaults.userTimezone not set"
openclaw cron list
openclaw logs --follow
```

Quy tắc nhanh:

- `Config path not found: agents.defaults.userTimezone` nghĩa là key chưa được đặt; heartbeat sẽ dùng múi giờ của host (hoặc `activeHours.timezone` nếu có).
- Cron không có `--tz` sẽ dùng múi giờ của gateway host.
- Heartbeat `activeHours` dùng múi giờ đã cấu hình (`user`, `local`, hoặc IANA tz cụ thể).
- Dấu thời gian ISO không có múi giờ được coi là UTC cho lịch trình cron `at`.

Dấu hiệu thường gặp:

- Job chạy sai thời gian đồng hồ sau khi thay đổi múi giờ host.
- Heartbeat luôn bị bỏ qua trong giờ làm việc vì `activeHours.timezone` sai.

Liên quan:

- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)
- [/automation/cron-vs-heartbeat](/automation/cron-vs-heartbeat)
- [/concepts/timezone](/concepts/timezone)\n