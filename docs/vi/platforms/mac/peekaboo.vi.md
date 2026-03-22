---
summary: "Tích hợp PeekabooBridge cho tự động hóa UI trên macOS"
read_when:
  - Host PeekabooBridge trong OpenClaw.app
  - Tích hợp Peekaboo qua Swift Package Manager
  - Thay đổi giao thức/đường dẫn PeekabooBridge
title: "Peekaboo Bridge"
---

# Peekaboo Bridge (Tự động hóa UI trên macOS)

OpenClaw có thể host **PeekabooBridge** như một broker tự động hóa UI local, có nhận diện quyền. Điều này cho phép CLI `peekaboo` điều khiển tự động hóa UI trong khi tái sử dụng quyền TCC của ứng dụng macOS.

## Đây là gì (và không phải là gì)

- **Host**: OpenClaw.app có thể hoạt động như một host PeekabooBridge.
- **Client**: sử dụng CLI `peekaboo` (không có giao diện `openclaw ui ...` riêng).
- **UI**: các overlay hình ảnh vẫn nằm trong Peekaboo.app; OpenClaw chỉ là một host broker mỏng.

## Kích hoạt bridge

Trong ứng dụng macOS:

- Settings → **Enable Peekaboo Bridge**

Khi kích hoạt, OpenClaw sẽ khởi động một server UNIX socket local. Nếu tắt, host sẽ dừng và `peekaboo` sẽ chuyển sang các host khác có sẵn.

## Thứ tự tìm kiếm client

Các client Peekaboo thường thử các host theo thứ tự sau:

1. Peekaboo.app (đầy đủ UX)
2. Claude.app (nếu đã cài đặt)
3. OpenClaw.app (broker mỏng)

Dùng `peekaboo bridge status --verbose` để xem host nào đang hoạt động và đường dẫn socket nào đang được sử dụng. Có thể ghi đè bằng:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Bảo mật & quyền

- Bridge xác thực **chữ ký mã của caller**; danh sách cho phép TeamID được áp dụng (TeamID của host Peekaboo + TeamID của app OpenClaw).
- Yêu cầu sẽ hết hạn sau khoảng 10 giây.
- Nếu thiếu quyền cần thiết, bridge sẽ trả về thông báo lỗi rõ ràng thay vì mở System Settings.

## Hành vi Snapshot (tự động hóa)

Snapshots được lưu trữ trong bộ nhớ và tự động hết hạn sau một khoảng thời gian ngắn. Nếu cần lưu trữ lâu hơn, hãy chụp lại từ client.

## Khắc phục sự cố

- Nếu `peekaboo` báo “bridge client is not authorized”, đảm bảo client được ký đúng hoặc chạy host với `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` chỉ trong chế độ **debug**.
- Nếu không tìm thấy host nào, mở một trong các ứng dụng host (Peekaboo.app hoặc OpenClaw.app) và xác nhận quyền đã được cấp.\n