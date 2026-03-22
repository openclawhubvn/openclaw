---
summary: "Kiến trúc IPC trên macOS cho ứng dụng OpenClaw, gateway node transport và PeekabooBridge"
read_when:
  - Chỉnh sửa hợp đồng IPC hoặc IPC của ứng dụng menu bar
title: "macOS IPC"
---

# Kiến trúc IPC trên macOS của OpenClaw

**Mô hình hiện tại:** Sử dụng Unix socket local để kết nối **node host service** với **ứng dụng macOS** nhằm phê duyệt exec và `system.run`. Có CLI debug `openclaw-mac` để kiểm tra discovery/connect; các hành động của agent vẫn qua Gateway WebSocket và `node.invoke`. Tự động hóa UI dùng PeekabooBridge.

## Mục tiêu

- Một instance GUI app duy nhất quản lý toàn bộ công việc liên quan đến TCC (thông báo, ghi màn hình, mic, speech, AppleScript).
- Bề mặt nhỏ cho tự động hóa: Gateway + lệnh node, cộng với PeekabooBridge cho tự động hóa UI.
- Quyền truy cập dự đoán được: luôn cùng bundle ID đã ký, khởi chạy bởi launchd, đảm bảo TCC grants ổn định.

## Cách hoạt động

### Gateway + node transport

- Ứng dụng chạy Gateway (chế độ local) và kết nối như một node.
- Hành động của agent thực hiện qua `node.invoke` (ví dụ: `system.run`, `system.notify`, `canvas.*`).

### Node service + app IPC

- Node host service không giao diện kết nối với Gateway WebSocket.
- Yêu cầu `system.run` chuyển tiếp đến ứng dụng macOS qua Unix socket local.
- Ứng dụng thực hiện exec trong ngữ cảnh UI, nhắc nhở nếu cần, và trả về output.

Sơ đồ (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (tự động hóa UI)

- Tự động hóa UI dùng UNIX socket riêng tên `bridge.sock` và giao thức JSON của PeekabooBridge.
- Thứ tự ưu tiên host (client-side): Peekaboo.app → Claude.app → OpenClaw.app → thực thi local.
- Bảo mật: host bridge yêu cầu TeamID cho phép; lối thoát DEBUG-only cùng UID được bảo vệ bởi `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (quy ước Peekaboo).
- Xem chi tiết: [Sử dụng PeekabooBridge](/platforms/mac/peekaboo).

## Luồng hoạt động

- Khởi động lại/xây dựng lại: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Kết thúc các instance hiện có
  - Xây dựng Swift + đóng gói
  - Ghi/khởi động/kích hoạt LaunchAgent
- Instance đơn: ứng dụng thoát sớm nếu có instance khác với cùng bundle ID đang chạy.

## Ghi chú bảo mật

- Ưu tiên yêu cầu TeamID khớp cho tất cả bề mặt đặc quyền.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (DEBUG-only) có thể cho phép caller cùng UID cho phát triển local.
- Tất cả giao tiếp chỉ diễn ra local; không có socket mạng nào được mở.
- TCC prompts chỉ xuất phát từ GUI app bundle; giữ bundle ID đã ký ổn định qua các lần xây dựng lại.
- Củng cố IPC: chế độ socket `0600`, token, kiểm tra peer-UID, thách thức/đáp ứng HMAC, TTL ngắn.\n