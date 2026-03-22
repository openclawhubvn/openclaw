---
summary: "Tham khảo CLI cho `openclaw voicecall` (lệnh plugin voice-call)"
read_when:
  - Đang dùng plugin voice-call và cần điểm vào CLI
  - Cần ví dụ nhanh cho `voicecall call|continue|status|tail|expose`
title: "voicecall"
---

# `openclaw voicecall`

`voicecall` là lệnh do plugin cung cấp. Chỉ xuất hiện khi plugin voice-call được cài đặt và kích hoạt.

Tài liệu chính:

- Plugin voice-call: [Voice Call](/plugins/voice-call)

## Lệnh thường dùng

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Expose webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Lưu ý bảo mật: chỉ expose endpoint webhook cho mạng tin cậy. Ưu tiên dùng Tailscale Serve hơn Funnel khi có thể.\n