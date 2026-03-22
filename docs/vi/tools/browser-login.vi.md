# Đăng nhập trình duyệt + Đăng bài X/Twitter

## Đăng nhập thủ công (khuyến nghị)

Khi cần đăng nhập vào trang web, **đăng nhập thủ công** trên profile trình duyệt **host** (trình duyệt openclaw).

**Không** cung cấp thông tin đăng nhập cho model. Đăng nhập tự động dễ bị phát hiện là bot và có thể khóa tài khoản.

Xem thêm tài liệu trình duyệt chính: [Browser](/tools/browser).

## Profile Chrome nào được sử dụng?

OpenClaw điều khiển một **profile Chrome riêng biệt** (tên `openclaw`, giao diện màu cam). Khác với profile trình duyệt hàng ngày.

Khi gọi công cụ trình duyệt của agent:

- Mặc định: agent nên dùng trình duyệt `openclaw` riêng biệt.
- Dùng `profile="user"` chỉ khi cần các session đã đăng nhập và người dùng có mặt để xác nhận.
- Nếu có nhiều profile, chỉ định rõ profile thay vì đoán.

Hai cách dễ để truy cập:

1. **Yêu cầu agent mở trình duyệt** rồi tự đăng nhập.
2. **Mở qua CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Nếu có nhiều profile, dùng `--browser-profile <name>` (mặc định là `openclaw`).

## X/Twitter: luồng khuyến nghị

- **Đọc/tìm kiếm/chủ đề:** dùng trình duyệt **host** (đăng nhập thủ công).
- **Đăng bài:** dùng trình duyệt **host** (đăng nhập thủ công).

## Sandboxing + truy cập trình duyệt host

Phiên trình duyệt sandbox dễ bị phát hiện là bot hơn. Với X/Twitter (và các trang nghiêm ngặt khác), ưu tiên dùng trình duyệt **host**.

Nếu agent bị sandbox, công cụ trình duyệt mặc định vào sandbox. Để cho phép điều khiển host:

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

Sau đó nhắm đến trình duyệt host:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Hoặc tắt sandboxing cho agent đăng bài.\n