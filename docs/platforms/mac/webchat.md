---
summary: "Tìm hiểu cách nhúng WebChat vào ứng dụng macOS và thực hiện debug dễ dàng, nâng cao trải nghiệm người dùng."
read_when:
  - Debug giao diện WebChat trên mac hoặc cổng loopback
title: "Hướng Dẫn Nhúng WebChat Trên macOS"
---

# WebChat (ứng dụng macOS)

Ứng dụng trên thanh menu của macOS nhúng giao diện WebChat dưới dạng một view SwiftUI gốc. Nó kết nối với Gateway và mặc định sử dụng **phiên chính** cho agent đã chọn (có thể chuyển đổi phiên cho các phiên khác).

- **Chế độ cục bộ**: kết nối trực tiếp với Gateway WebSocket cục bộ.
- **Chế độ từ xa**: chuyển tiếp cổng điều khiển Gateway qua SSH và sử dụng đường hầm đó làm kênh dữ liệu.

## Khởi chạy & debug

- Thủ công: Menu Lobster → “Open Chat”.
- Tự động mở để kiểm tra:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Nhật ký: `./scripts/clawlog.sh` (hệ thống con `ai.openclaw`, danh mục `WebChatSwiftUI`).

## Cách hoạt động

- Kênh dữ liệu: Các phương thức Gateway WS `chat.history`, `chat.send`, `chat.abort`, `chat.inject` và các sự kiện `chat`, `agent`, `presence`, `tick`, `health`.
- Phiên: mặc định là phiên chính (`main`, hoặc `global` khi phạm vi là toàn cầu). Giao diện người dùng có thể chuyển đổi giữa các phiên.
- Onboarding sử dụng một phiên riêng biệt để giữ cho thiết lập lần đầu không bị lẫn lộn.

## Bề mặt bảo mật

- Chế độ từ xa chỉ chuyển tiếp cổng điều khiển WebSocket của Gateway qua SSH.

## Hạn chế đã biết

- Giao diện người dùng được tối ưu hóa cho các phiên chat (không phải là một sandbox trình duyệt đầy đủ).
