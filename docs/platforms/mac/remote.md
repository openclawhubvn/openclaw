---
summary: "Khám phá cách điều khiển từ xa macOS qua SSH với OpenClaw, giúp quản lý hệ thống hiệu quả và an toàn."
read_when:
  - Cài đặt hoặc gỡ lỗi điều khiển mac từ xa
title: "Hướng Dẫn Điều Khiển Từ Xa macOS Qua SSH"
---

# Điều Khiển Từ Xa OpenClaw (macOS ⇄ máy chủ từ xa)

Quy trình này cho phép ứng dụng macOS hoạt động như một điều khiển từ xa hoàn chỉnh cho OpenClaw gateway chạy trên máy chủ khác (máy tính để bàn/máy chủ). Đây là tính năng **Remote over SSH** (chạy từ xa) của ứng dụng. Tất cả các tính năng—kiểm tra sức khỏe, chuyển tiếp Voice Wake, và Web Chat—sử dụng cùng cấu hình SSH từ xa từ _Settings → General_.

## Chế độ

- **Local (Mac này)**: Mọi thứ chạy trên laptop. Không sử dụng SSH.
- **Remote over SSH (mặc định)**: Các lệnh OpenClaw được thực thi trên máy chủ từ xa. Ứng dụng mac mở kết nối SSH với `-o BatchMode` cùng với danh tính/khóa bạn chọn và một cổng chuyển tiếp cục bộ.
- **Remote direct (ws/wss)**: Không có đường hầm SSH. Ứng dụng mac kết nối trực tiếp đến URL gateway (ví dụ, qua Tailscale Serve hoặc một proxy ngược HTTPS công khai).

## Phương thức truyền từ xa

Chế độ từ xa hỗ trợ hai phương thức truyền:

- **SSH tunnel** (mặc định): Sử dụng `ssh -N -L ...` để chuyển tiếp cổng gateway đến localhost. Gateway sẽ thấy IP của node là `127.0.0.1` vì đường hầm là loopback.
- **Direct (ws/wss)**: Kết nối trực tiếp đến URL gateway. Gateway sẽ thấy IP thực của client.

## Yêu cầu trên máy chủ từ xa

1. Cài đặt Node + pnpm và xây dựng/cài đặt OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Đảm bảo `openclaw` có trong PATH cho các shell không tương tác (tạo symlink vào `/usr/local/bin` hoặc `/opt/homebrew/bin` nếu cần).
3. Mở SSH với xác thực khóa. Khuyến nghị sử dụng IP **Tailscale** để đảm bảo kết nối ổn định ngoài LAN.

## Cài đặt ứng dụng macOS

1. Mở _Settings → General_.
2. Dưới **OpenClaw runs**, chọn **Remote over SSH** và thiết lập:
   - **Transport**: **SSH tunnel** hoặc **Direct (ws/wss)**.
   - **SSH target**: `user@host` (tùy chọn `:port`).
     - Nếu gateway nằm trong cùng LAN và quảng bá Bonjour, chọn từ danh sách đã phát hiện để tự động điền trường này.
   - **Gateway URL** (chỉ Direct): `wss://gateway.example.ts.net` (hoặc `ws://...` cho local/LAN).
   - **Identity file** (nâng cao): đường dẫn đến khóa của bạn.
   - **Project root** (nâng cao): đường dẫn checkout từ xa dùng cho các lệnh.
   - **CLI path** (nâng cao): đường dẫn tùy chọn đến một entrypoint/binary `openclaw` có thể chạy (tự động điền khi được quảng bá).
3. Nhấn **Test remote**. Thành công cho thấy `openclaw status --json` chạy đúng từ xa. Thất bại thường do vấn đề PATH/CLI; exit 127 nghĩa là CLI không tìm thấy từ xa.
4. Kiểm tra sức khỏe và Web Chat sẽ tự động chạy qua đường hầm SSH này.

## Web Chat

- **SSH tunnel**: Web Chat kết nối đến gateway qua cổng điều khiển WebSocket được chuyển tiếp (mặc định 18789).
- **Direct (ws/wss)**: Web Chat kết nối trực tiếp đến URL gateway đã cấu hình.
- Không còn máy chủ HTTP WebChat riêng biệt nữa.

## Quyền

- Máy chủ từ xa cần các phê duyệt TCC giống như máy cục bộ (Tự động hóa, Trợ năng, Ghi màn hình, Micro, Nhận diện giọng nói, Thông báo). Chạy onboarding trên máy đó để cấp quyền một lần.
- Các node quảng bá trạng thái quyền của chúng qua `node.list` / `node.describe` để các agent biết những gì có sẵn.

## Ghi chú bảo mật

- Ưu tiên kết nối loopback trên máy chủ từ xa và kết nối qua SSH hoặc Tailscale.
- Đường hầm SSH sử dụng kiểm tra khóa máy chủ nghiêm ngặt; tin tưởng khóa máy chủ trước để nó tồn tại trong `~/.ssh/known_hosts`.
- Nếu bạn kết nối Gateway đến một giao diện không phải loopback, yêu cầu xác thực token/mật khẩu.
- Xem [Bảo mật](/gateway/security) và [Tailscale](/gateway/tailscale).

## Quy trình đăng nhập WhatsApp (từ xa)

- Chạy `openclaw channels login --verbose` **trên máy chủ từ xa**. Quét mã QR với WhatsApp trên điện thoại của bạn.
- Chạy lại đăng nhập trên máy chủ đó nếu xác thực hết hạn. Kiểm tra sức khỏe sẽ hiển thị các vấn đề liên kết.

## Khắc phục sự cố

- **exit 127 / không tìm thấy**: `openclaw` không có trong PATH cho các shell không đăng nhập. Thêm nó vào `/etc/paths`, rc shell của bạn, hoặc tạo symlink vào `/usr/local/bin`/`/opt/homebrew/bin`.
- **Kiểm tra sức khỏe thất bại**: kiểm tra khả năng truy cập SSH, PATH, và rằng Baileys đã đăng nhập (`openclaw status --json`).
- **Web Chat bị kẹt**: xác nhận gateway đang chạy trên máy chủ từ xa và cổng được chuyển tiếp khớp với cổng WS của gateway; UI yêu cầu kết nối WS khỏe mạnh.
- **Node IP hiển thị 127.0.0.1**: điều này là bình thường với đường hầm SSH. Chuyển **Transport** sang **Direct (ws/wss)** nếu bạn muốn gateway thấy IP thực của client.
- **Voice Wake**: các cụm từ kích hoạt được chuyển tiếp tự động trong chế độ từ xa; không cần bộ chuyển tiếp riêng biệt.

## Âm thanh thông báo

Chọn âm thanh cho từng thông báo từ các script với `openclaw` và `node.invoke`, ví dụ:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Không còn tùy chọn "âm thanh mặc định" toàn cầu trong ứng dụng nữa; người gọi chọn âm thanh (hoặc không) cho từng yêu cầu.
