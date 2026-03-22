---
summary: "Khám phá cách sử dụng lệnh OpenClaw VoiceCall CLI để quản lý cuộc gọi hiệu quả. Hướng dẫn chi tiết và dễ hiểu."
read_when:
  - Bạn sử dụng plugin voice-call và muốn biết các điểm vào CLI
  - Bạn cần ví dụ nhanh cho `voicecall call|continue|status|tail|expose`
title: "Hướng Dẫn Sử Dụng OpenClaw VoiceCall CLI"
---

# `openclaw voicecall`

`voicecall` là một lệnh do plugin cung cấp. Nó chỉ xuất hiện khi plugin voice-call được cài đặt và kích hoạt.

Tài liệu chính:

- Plugin voice-call: [Voice Call](/plugins/voice-call)

## Các lệnh thông dụng

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Mở webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Lưu ý bảo mật: chỉ mở endpoint webhook cho các mạng mà bạn tin tưởng. Ưu tiên sử dụng Tailscale Serve thay vì Funnel khi có thể.
