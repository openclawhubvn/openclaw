# `openclaw approvals`

Quản lý exec approvals cho **local host**, **gateway host**, hoặc **node host**. Mặc định, lệnh sẽ tác động lên file approvals local trên ổ đĩa. Dùng `--gateway` để nhắm đến gateway, hoặc `--node` để nhắm đến node cụ thể.

Liên quan:

- Exec approvals: [Exec approvals](/tools/exec-approvals)
- Nodes: [Nodes](/nodes)

## Lệnh thường dùng

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

## Thay thế approvals từ file

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

## Công cụ hỗ trợ Allowlist

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Ghi chú

- `--node` dùng cùng resolver như `openclaw nodes` (id, name, ip, hoặc id prefix).
- `--agent` mặc định là `"*"`, áp dụng cho tất cả agents.
- Node host phải quảng bá `system.execApprovals.get/set` (ứng dụng macOS hoặc node host headless).
- File approvals lưu trữ theo host tại `~/.openclaw/exec-approvals.json`.\n