---
summary: "Tích hợp PeekabooBridge cho tự động hóa giao diện người dùng trên macOS"
read_when:
  - Lưu trữ PeekabooBridge trong OpenClaw.app
  - Tích hợp Peekaboo qua Swift Package Manager
  - Thay đổi giao thức/đường dẫn của PeekabooBridge
title: "Peekaboo Bridge"
---

# Peekaboo Bridge (Tự động hóa giao diện người dùng trên macOS)

OpenClaw có thể lưu trữ **PeekabooBridge** như một môi giới tự động hóa giao diện người dùng cục bộ, có nhận thức về quyền. Điều này cho phép CLI `peekaboo` điều khiển tự động hóa giao diện người dùng trong khi tái sử dụng quyền TCC của ứng dụng macOS.

## Đây là gì (và không phải là gì)

- **Host**: OpenClaw.app có thể hoạt động như một host PeekabooBridge.
- **Client**: sử dụng CLI `peekaboo` (không có giao diện `openclaw ui ...` riêng biệt).
- **UI**: các lớp phủ hình ảnh vẫn nằm trong Peekaboo.app; OpenClaw chỉ là một host môi giới mỏng.

## Kích hoạt cầu nối

Trong ứng dụng macOS:

- Cài đặt → **Kích hoạt Peekaboo Bridge**

Khi được kích hoạt, OpenClaw sẽ khởi động một máy chủ socket UNIX cục bộ. Nếu bị vô hiệu hóa, host sẽ dừng và `peekaboo` sẽ chuyển sang các host khác có sẵn.

## Thứ tự khám phá client

Các client Peekaboo thường thử các host theo thứ tự sau:

1. Peekaboo.app (trải nghiệm người dùng đầy đủ)
2. Claude.app (nếu đã cài đặt)
3. OpenClaw.app (môi giới mỏng)

Sử dụng `peekaboo bridge status --verbose` để xem host nào đang hoạt động và đường dẫn socket nào đang được sử dụng. Bạn có thể ghi đè bằng:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Bảo mật & quyền

- Cầu nối xác thực **chữ ký mã của người gọi**; một danh sách cho phép TeamID được thực thi (TeamID của host Peekaboo + TeamID của ứng dụng OpenClaw).
- Yêu cầu sẽ hết thời gian sau khoảng 10 giây.
- Nếu thiếu quyền cần thiết, cầu nối sẽ trả về thông báo lỗi rõ ràng thay vì mở Cài đặt Hệ thống.

## Hành vi chụp nhanh (tự động hóa)

Các ảnh chụp nhanh được lưu trữ trong bộ nhớ và tự động hết hạn sau một khoảng thời gian ngắn. Nếu cần lưu trữ lâu hơn, hãy chụp lại từ client.

## Khắc phục sự cố

- Nếu `peekaboo` báo cáo “client cầu nối không được ủy quyền”, hãy đảm bảo client được ký đúng cách hoặc chạy host với `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` chỉ trong chế độ **debug**.
- Nếu không tìm thấy host nào, hãy mở một trong các ứng dụng host (Peekaboo.app hoặc OpenClaw.app) và xác nhận quyền đã được cấp.
