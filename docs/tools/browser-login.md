---
summary: "Tìm hiểu cách đăng nhập tự động trên trình duyệt để tối ưu hóa việc đăng bài trên X/Twitter nhanh chóng và hiệu quả."
read_when:
  - Cần đăng nhập vào các trang web để tự động hóa trình duyệt
  - Muốn đăng bài cập nhật lên X/Twitter
title: "Hướng Dẫn Đăng Nhập Trình Duyệt Tự Động"
---

# Đăng nhập trình duyệt + đăng bài trên X/Twitter

## Đăng nhập thủ công (khuyến nghị)

Khi một trang web yêu cầu đăng nhập, hãy **đăng nhập thủ công** trong hồ sơ trình duyệt **host** (trình duyệt openclaw).

**Không** cung cấp thông tin đăng nhập cho mô hình. Đăng nhập tự động thường kích hoạt các biện pháp chống bot và có thể khóa tài khoản.

Quay lại tài liệu trình duyệt chính: [Browser](/tools/browser).

## Hồ sơ Chrome nào được sử dụng?

OpenClaw kiểm soát một **hồ sơ Chrome riêng biệt** (tên là `openclaw`, giao diện có màu cam). Hồ sơ này tách biệt với hồ sơ trình duyệt hàng ngày của bạn.

Đối với các cuộc gọi công cụ trình duyệt của agent:

- Lựa chọn mặc định: agent nên sử dụng trình duyệt `openclaw` cách ly của nó.
- Sử dụng `profile="user"` chỉ khi các phiên đăng nhập hiện có quan trọng và người dùng đang ở máy tính để nhấp/chấp thuận bất kỳ lời nhắc nào.
- Nếu có nhiều hồ sơ trình duyệt người dùng, hãy chỉ định hồ sơ rõ ràng thay vì đoán.

Hai cách dễ dàng để truy cập:

1. **Yêu cầu agent mở trình duyệt** và sau đó tự đăng nhập.
2. **Mở qua CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Nếu có nhiều hồ sơ, sử dụng `--browser-profile <name>` (mặc định là `openclaw`).

## X/Twitter: quy trình khuyến nghị

- **Đọc/tìm kiếm/chủ đề:** sử dụng trình duyệt **host** (đăng nhập thủ công).
- **Đăng cập nhật:** sử dụng trình duyệt **host** (đăng nhập thủ công).

## Sandboxing + truy cập trình duyệt host

Các phiên trình duyệt sandboxed **có khả năng cao hơn** kích hoạt phát hiện bot. Đối với X/Twitter (và các trang nghiêm ngặt khác), ưu tiên sử dụng trình duyệt **host**.

Nếu agent đang ở chế độ sandboxed, công cụ trình duyệt mặc định sẽ là sandbox. Để cho phép kiểm soát host:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

Sau đó, nhắm mục tiêu trình duyệt host:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Hoặc tắt sandboxing cho agent đăng bài cập nhật.
