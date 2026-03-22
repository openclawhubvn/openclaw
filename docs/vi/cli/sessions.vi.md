# `openclaw sessions`

Liệt kê các session hội thoại đã lưu.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --json
```

Lựa chọn phạm vi:

- Mặc định: agent store đã cấu hình mặc định
- `--agent <id>`: một agent store đã cấu hình
- `--all-agents`: tổng hợp tất cả agent store đã cấu hình
- `--store <path>`: đường dẫn store cụ thể (không kết hợp với `--agent` hoặc `--all-agents`)

`openclaw sessions --all-agents` đọc các agent store đã cấu hình. Gateway và ACP phát hiện session rộng hơn: bao gồm cả các store chỉ trên đĩa nằm dưới `agents/` mặc định hoặc `session.store` theo mẫu. Các store phát hiện phải là file `sessions.json` thông thường trong agent root; bỏ qua symlink và đường dẫn ngoài root.

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

Chạy bảo trì ngay (thay vì chờ chu kỳ ghi tiếp theo):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` sử dụng cài đặt `session.maintenance` từ config:

- Lưu ý phạm vi: `openclaw sessions cleanup` chỉ bảo trì session store/transcript. Không xóa log chạy cron (`cron/runs/<jobId>.jsonl`), quản lý bởi `cron.runLog.maxBytes` và `cron.runLog.keepLines` trong [Cấu hình Cron](/automation/cron-jobs#configuration) và giải thích trong [Bảo trì Cron](/automation/cron-jobs#maintenance).

- `--dry-run`: xem trước số lượng entry sẽ bị xóa/cắt mà không ghi.
  - Ở chế độ text, dry-run in bảng hành động từng session (`Action`, `Key`, `Age`, `Model`, `Flags`) để thấy cái nào giữ lại và cái nào xóa.
- `--enforce`: áp dụng bảo trì ngay cả khi `session.maintenance.mode` là `warn`.
- `--active-key <key>`: bảo vệ một key đang hoạt động khỏi bị xóa do giới hạn dung lượng đĩa.
- `--agent <id>`: dọn dẹp cho một agent store đã cấu hình.
- `--all-agents`: dọn dẹp cho tất cả agent store đã cấu hình.
- `--store <path>`: chạy trên một file `sessions.json` cụ thể.
- `--json`: in tóm tắt JSON. Với `--all-agents`, output bao gồm một tóm tắt cho mỗi store.

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

- Cấu hình Session: [Tham khảo cấu hình](/gateway/configuration-reference#session)\n