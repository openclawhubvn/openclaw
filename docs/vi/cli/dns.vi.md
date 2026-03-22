---
summary: "Tham khảo CLI cho `openclaw dns` (trợ giúp khám phá diện rộng)"
read_when:
  - Cần khám phá diện rộng (DNS-SD) qua Tailscale + CoreDNS
  - Đang thiết lập split DNS cho domain khám phá tùy chỉnh (ví dụ: openclaw.internal)
title: "dns"
---

# `openclaw dns`

Trợ giúp DNS cho khám phá diện rộng (Tailscale + CoreDNS). Hiện tập trung vào macOS + Homebrew CoreDNS.

Liên quan:

- Khám phá Gateway: [Discovery](/gateway/discovery)
- Cấu hình khám phá diện rộng: [Configuration](/gateway/configuration)

## Thiết lập

```bash
openclaw dns setup
openclaw dns setup --apply
```\n