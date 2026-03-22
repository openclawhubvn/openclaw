# Mô hình mạng

Hầu hết các thao tác đều thông qua Gateway (`openclaw gateway`), một tiến trình chạy lâu dài duy nhất quản lý kết nối channel và WebSocket control plane.

## Nguyên tắc chính

- Khuyến nghị mỗi host chỉ có một Gateway. Đây là tiến trình duy nhất được phép sở hữu session WhatsApp Web. Để dùng rescue bots hoặc cách ly nghiêm ngặt, chạy nhiều gateway với profile và port riêng biệt. Xem thêm [Multiple gateways](/gateway/multiple-gateways).
- Ưu tiên loopback: Gateway WS mặc định là `ws://127.0.0.1:18789`. Wizard tự động tạo gateway token, kể cả khi dùng loopback. Để truy cập tailnet, chạy `openclaw gateway --bind tailnet --token ...` vì cần token cho các bind không phải loopback.
- Node kết nối tới Gateway WS qua LAN, tailnet, hoặc SSH khi cần. Cầu nối TCP cũ đã bị loại bỏ.
- Canvas host được phục vụ bởi Gateway HTTP server trên **cùng port** với Gateway (mặc định `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Khi `gateway.auth` được cấu hình và Gateway bind ngoài loopback, các route này được bảo vệ bởi Gateway auth. Node client sử dụng URL khả năng theo node gắn với session WS đang hoạt động. Xem thêm [Gateway configuration](/gateway/configuration) (`canvasHost`, `gateway`).
- Sử dụng từ xa thường qua SSH tunnel hoặc tailnet VPN. Xem thêm [Remote access](/gateway/remote) và [Discovery](/gateway/discovery).\n