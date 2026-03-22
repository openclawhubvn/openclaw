---
summary: "Cách ứng dụng macOS nhúng WebChat gateway và cách debug"
read_when:
  - Debug giao diện WebChat trên mac hoặc cổng loopback
title: "WebChat (macOS)"
---

# WebChat (ứng dụng macOS)

Ứng dụng trên thanh menu macOS nhúng giao diện WebChat dưới dạng view SwiftUI gốc. Kết nối với Gateway và mặc định vào **main session** cho agent đã chọn (có thể chuyển session khác).

- **Local mode**: kết nối trực tiếp với Gateway WebSocket local.
- **Remote mode**: chuyển tiếp cổng điều khiển Gateway qua SSH và dùng tunnel đó làm data plane.

## Khởi chạy & debug

- Thủ công: Menu Lobster → “Open Chat”.
- Tự động mở để test:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Log: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`).

## Cách kết nối

- Data plane: Gateway WS methods `chat.history`, `chat.send`, `chat.abort`, `chat.inject` và events `chat`, `agent`, `presence`, `tick`, `health`.
- Session: mặc định vào session chính (`main`, hoặc `global` khi scope là global). UI có thể chuyển giữa các session.
- Onboarding dùng session riêng để tách biệt thiết lập lần đầu.

## Bề mặt bảo mật

- Remote mode chỉ chuyển tiếp cổng điều khiển WebSocket của Gateway qua SSH.

## Hạn chế đã biết

- UI tối ưu cho chat session (không phải sandbox trình duyệt đầy đủ).\n