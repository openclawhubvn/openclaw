---
summary: "Tìm hiểu cách cấu hình OpenClaw Approvals để quản lý phê duyệt thực thi cho gateway và node hosts hiệu quả."
read_when:
  - Bạn muốn chỉnh sửa phê duyệt thực thi từ CLI
  - Bạn cần quản lý danh sách cho phép trên gateway hoặc node hosts
title: "Hướng Dẫn Cấu Hình OpenClaw Approvals"
---

# `openclaw approvals`

Quản lý phê duyệt thực thi cho **máy chủ cục bộ**, **máy chủ gateway**, hoặc **máy chủ node**.
Mặc định, các lệnh sẽ nhắm đến file phê duyệt cục bộ trên ổ đĩa. Sử dụng `--gateway` để nhắm đến gateway, hoặc `--node` để nhắm đến một node cụ thể.

Liên quan:

- Phê duyệt thực thi: [Phê duyệt thực thi](/tools/exec-approvals)
- Nodes: [Nodes](/nodes)

## Các lệnh thông dụng

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

## Thay thế phê duyệt từ một file

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

## Trợ giúp danh sách cho phép

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Ghi chú

- `--node` sử dụng cùng bộ giải quyết như `openclaw nodes` (id, tên, ip, hoặc tiền tố id).
- `--agent` mặc định là `"*"`, áp dụng cho tất cả các agent.
- Máy chủ node phải quảng cáo `system.execApprovals.get/set` (ứng dụng macOS hoặc máy chủ node không giao diện).
- Các file phê duyệt được lưu trữ theo từng máy chủ tại `~/.openclaw/exec-approvals.json`.
