---
summary: "Kiến trúc IPC trên macOS cho ứng dụng OpenClaw, vận chuyển node gateway, và PeekabooBridge"
read_when:
  - Chỉnh sửa hợp đồng IPC hoặc IPC của ứng dụng thanh menu
title: "IPC trên macOS"
---

# Kiến trúc IPC của OpenClaw trên macOS

**Mô hình hiện tại:** Một socket Unix cục bộ kết nối **dịch vụ host node** với **ứng dụng macOS** để phê duyệt thực thi và `system.run`. Có một CLI debug `openclaw-mac` để kiểm tra khám phá/kết nối; các hành động của agent vẫn thông qua Gateway WebSocket và `node.invoke`. Tự động hóa giao diện người dùng sử dụng PeekabooBridge.

## Mục tiêu

- Một phiên bản ứng dụng GUI duy nhất quản lý tất cả công việc liên quan đến TCC (thông báo, ghi màn hình, mic, giọng nói, AppleScript).
- Bề mặt nhỏ cho tự động hóa: lệnh Gateway + node, cộng với PeekabooBridge cho tự động hóa giao diện người dùng.
- Quyền truy cập dự đoán: luôn sử dụng cùng một bundle ID đã ký, được khởi chạy bởi launchd, để TCC cấp quyền ổn định.

## Cách hoạt động

### Vận chuyển Gateway + node

- Ứng dụng chạy Gateway (chế độ cục bộ) và kết nối với nó như một node.
- Các hành động của agent được thực hiện qua `node.invoke` (ví dụ: `system.run`, `system.notify`, `canvas.*`).

### Dịch vụ node + IPC của ứng dụng

- Một dịch vụ host node không giao diện kết nối với Gateway WebSocket.
- Các yêu cầu `system.run` được chuyển tiếp đến ứng dụng macOS qua một socket Unix cục bộ.
- Ứng dụng thực hiện lệnh trong ngữ cảnh giao diện người dùng, hiển thị thông báo nếu cần, và trả về kết quả.

Sơ đồ (SCI):

```
Agent -> Gateway -> Dịch vụ Node (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Ứng dụng Mac (UI + TCC + system.run)
```

### PeekabooBridge (tự động hóa giao diện người dùng)

- Tự động hóa giao diện người dùng sử dụng một socket UNIX riêng tên là `bridge.sock` và giao thức JSON của PeekabooBridge.
- Thứ tự ưu tiên host (phía client): Peekaboo.app → Claude.app → OpenClaw.app → thực thi cục bộ.
- Bảo mật: các host bridge yêu cầu một TeamID được phép; lối thoát DEBUG-only cùng UID được bảo vệ bởi `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (quy ước Peekaboo).
- Xem: [Sử dụng PeekabooBridge](/platforms/mac/peekaboo) để biết chi tiết.

## Quy trình hoạt động

- Khởi động lại/xây dựng lại: `SIGN_IDENTITY="Apple Development: <Tên Nhà Phát Triển> (<TEAMID>)" scripts/restart-mac.sh`
  - Kết thúc các phiên bản hiện có
  - Xây dựng Swift + đóng gói
  - Ghi/khởi tạo/khởi động LaunchAgent
- Phiên bản đơn: ứng dụng thoát sớm nếu có phiên bản khác với cùng bundle ID đang chạy.

## Ghi chú bảo mật

- Ưu tiên yêu cầu khớp TeamID cho tất cả các bề mặt đặc quyền.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (chỉ DEBUG) có thể cho phép các cuộc gọi cùng UID cho phát triển cục bộ.
- Tất cả giao tiếp chỉ diễn ra cục bộ; không có socket mạng nào được mở.
- Các thông báo TCC chỉ xuất phát từ bundle ứng dụng GUI; giữ ổn định bundle ID đã ký qua các lần xây dựng lại.
- Bảo mật IPC: chế độ socket `0600`, kiểm tra token, peer-UID, thách thức/đáp ứng HMAC, TTL ngắn.
