---
summary: "Tìm hiểu cách cấu hình Gateway, node và canvas host để tối ưu hóa kết nối mạng hiệu quả."
read_when:
  - Bạn muốn có cái nhìn ngắn gọn về mô hình mạng của Gateway
title: "Hướng Dẫn Cấu Hình Mô Hình Mạng Gateway"
---

# Mô hình mạng

Hầu hết các hoạt động đều thông qua Gateway (`openclaw gateway`), một tiến trình chạy lâu dài duy nhất quản lý các kết nối kênh và mặt phẳng điều khiển WebSocket.

## Quy tắc cốt lõi

- Khuyến nghị sử dụng một Gateway cho mỗi máy chủ. Đây là tiến trình duy nhất được phép sở hữu phiên WhatsApp Web. Đối với bot cứu hộ hoặc yêu cầu cách ly nghiêm ngặt, hãy chạy nhiều gateway với hồ sơ và cổng cách ly. Xem [Nhiều gateway](/gateway/multiple-gateways).
- Ưu tiên loopback: Gateway WS mặc định là `ws://127.0.0.1:18789`. Trình hướng dẫn sẽ tạo token gateway mặc định, ngay cả khi sử dụng loopback. Để truy cập tailnet, chạy `openclaw gateway --bind tailnet --token ...` vì cần token cho các kết nối không phải loopback.
- Các node kết nối với Gateway WS qua LAN, tailnet hoặc SSH khi cần. Cầu nối TCP cũ đã bị loại bỏ.
- Canvas host được phục vụ bởi máy chủ HTTP của Gateway trên **cùng cổng** với Gateway (mặc định `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Khi `gateway.auth` được cấu hình và Gateway kết nối ngoài loopback, các tuyến này được bảo vệ bởi xác thực Gateway. Các client node sử dụng URL khả năng theo phạm vi node gắn liền với phiên WS đang hoạt động của chúng. Xem [Cấu hình Gateway](/gateway/configuration) (`canvasHost`, `gateway`).
- Sử dụng từ xa thường là thông qua SSH tunnel hoặc VPN tailnet. Xem [Truy cập từ xa](/gateway/remote) và [Khám phá](/gateway/discovery).
