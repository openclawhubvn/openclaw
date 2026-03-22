---
summary: "Tham khảo CLI cho `openclaw sessions` (danh sách các phiên đã lưu + cách sử dụng)"
read_when:
  - Bạn muốn liệt kê các phiên đã lưu và xem hoạt động gần đây
title: "sessions"
---

# `openclaw sessions`

Liệt kê các phiên hội thoại đã lưu.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --json
```

Lựa chọn phạm vi:

- mặc định: kho lưu trữ agent đã cấu hình mặc định
- `--agent <id>`: một kho lưu trữ agent đã cấu hình
- `--all-agents`: tổng hợp tất cả các kho lưu trữ agent đã cấu hình
- `--store <path>`: đường dẫn kho lưu trữ cụ thể (không thể kết hợp với `--agent` hoặc `--all-agents`)

`openclaw sessions --all-agents` đọc các kho lưu trữ agent đã cấu hình. Việc khám phá phiên của Gateway và ACP rộng hơn: chúng cũng bao gồm các kho lưu trữ chỉ trên đĩa được tìm thấy dưới gốc `agents/` mặc định hoặc gốc `session.store` theo mẫu. Những kho lưu trữ được phát hiện này phải giải quyết thành các file `sessions.json` thông thường bên trong gốc agent; các symlink và đường dẫn ngoài gốc sẽ bị bỏ qua.

Ví dụ JSON:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Bảo trì dọn dẹp

Thực hiện bảo trì ngay bây giờ (thay vì chờ chu kỳ ghi tiếp theo):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` sử dụng cài đặt `session.maintenance` từ cấu hình:

- Lưu ý phạm vi: `openclaw sessions cleanup` chỉ bảo trì các kho lưu trữ phiên/bản ghi. Nó không xóa các log chạy cron (`cron/runs/<jobId>.jsonl`), những log này được quản lý bởi `cron.runLog.maxBytes` và `cron.runLog.keepLines` trong [Cấu hình Cron](/automation/cron-jobs#configuration) và được giải thích trong [Bảo trì Cron](/automation/cron-jobs#maintenance).

- `--dry-run`: xem trước có bao nhiêu mục sẽ bị xóa/cắt mà không ghi.
  - Ở chế độ văn bản, dry-run in ra bảng hành động cho mỗi phiên (`Action`, `Key`, `Age`, `Model`, `Flags`) để bạn thấy những gì sẽ được giữ lại hoặc xóa.
- `--enforce`: thực hiện bảo trì ngay cả khi `session.maintenance.mode` là `warn`.
- `--active-key <key>`: bảo vệ một khóa hoạt động cụ thể khỏi việc xóa do giới hạn dung lượng đĩa.
- `--agent <id>`: thực hiện dọn dẹp cho một kho lưu trữ agent đã cấu hình.
- `--all-agents`: thực hiện dọn dẹp cho tất cả các kho lưu trữ agent đã cấu hình.
- `--store <path>`: thực hiện trên một file `sessions.json` cụ thể.
- `--json`: in ra bản tóm tắt JSON. Với `--all-agents`, đầu ra bao gồm một bản tóm tắt cho mỗi kho lưu trữ.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Liên quan:

- Cấu hình phiên: [Tham khảo cấu hình](/gateway/configuration-reference#session)
