---
summary: "Khám phá cách sử dụng công cụ CLI 'openclaw dns' để quản lý và cấu hình DNS hiệu quả, hỗ trợ khám phá diện rộng."
read_when:
  - Bạn muốn khám phá diện rộng (DNS-SD) qua Tailscale + CoreDNS
  - Bạn đang thiết lập DNS phân tách cho một miền khám phá tùy chỉnh (ví dụ: openclaw.internal)
title: "Hướng Dẫn Cấu Hình DNS Với OpenClaw"
---

# `openclaw dns`

Công cụ hỗ trợ DNS cho khám phá diện rộng (Tailscale + CoreDNS). Hiện tại tập trung vào macOS + Homebrew CoreDNS.

Liên quan:

- Khám phá Gateway: [Discovery](/gateway/discovery)
- Cấu hình khám phá diện rộng: [Configuration](/gateway/configuration)

## Thiết lập

```bash
openclaw dns setup
openclaw dns setup --apply
```
