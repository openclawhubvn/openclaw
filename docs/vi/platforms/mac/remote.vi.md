---
summary: "Luồng điều khiển app macOS qua SSH cho OpenClaw gateway từ xa"
read_when:
  - Cài đặt hoặc debug điều khiển mac từ xa
title: "Điều Khiển Từ Xa"
---

# OpenClaw Từ Xa (macOS ⇄ remote host)

Luồng này cho phép app macOS hoạt động như một điều khiển từ xa hoàn chỉnh cho OpenClaw gateway chạy trên host khác (desktop/server). Đây là tính năng **Remote over SSH** (chạy từ xa) của app. Tất cả tính năng—kiểm tra sức khỏe, chuyển tiếp Voice Wake, và Web Chat—tái sử dụng cấu hình SSH từ _Settings → General_.

## Chế độ

- **Local (this Mac)**: Chạy hoàn toàn trên laptop. Không dùng SSH.
- **Remote over SSH (default)**: Lệnh OpenClaw thực thi trên host từ xa. App mac mở kết nối SSH với `-o BatchMode` cùng identity/key đã chọn và một local port-forward.
- **Remote direct (ws/wss)**: Không dùng SSH tunnel. App mac kết nối trực tiếp đến URL gateway (ví dụ, qua Tailscale Serve hoặc HTTPS reverse proxy công khai).

## Phương thức truyền từ xa

Chế độ từ xa hỗ trợ hai phương thức truyền:

- **SSH tunnel** (default): Dùng `ssh -N -L ...` để forward cổng gateway về localhost. Gateway sẽ thấy IP node là `127.0.0.1` do tunnel là loopback.
- **Direct (ws/wss)**: Kết nối thẳng đến URL gateway. Gateway thấy IP client thực.

## Yêu cầu trên host từ xa

1. Cài Node + pnpm và build/cài OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Đảm bảo `openclaw` có trong PATH cho shell không tương tác (symlink vào `/usr/local/bin` hoặc `/opt/homebrew/bin` nếu cần).
3. Mở SSH với key auth. Khuyến nghị dùng IP **Tailscale** để kết nối ổn định ngoài LAN.

## Cài đặt app macOS

1. Mở _Settings → General_.
2. Trong **OpenClaw runs**, chọn **Remote over SSH** và thiết lập:
   - **Transport**: **SSH tunnel** hoặc **Direct (ws/wss)**.
   - **SSH target**: `user@host` (tùy chọn `:port`).
     - Nếu gateway cùng LAN và quảng bá Bonjour, chọn từ danh sách để tự động điền trường này.
   - **Gateway URL** (chỉ Direct): `wss://gateway.example.ts.net` (hoặc `ws://...` cho local/LAN).
   - **Identity file** (nâng cao): đường dẫn đến key.
   - **Project root** (nâng cao): đường dẫn checkout từ xa dùng cho lệnh.
   - **CLI path** (nâng cao): đường dẫn tùy chọn đến entrypoint/binary `openclaw` có thể chạy (tự động điền khi quảng bá).
3. Nhấn **Test remote**. Thành công nghĩa là `openclaw status --json` chạy đúng từ xa. Thất bại thường do vấn đề PATH/CLI; exit 127 nghĩa là CLI không tìm thấy từ xa.
4. Kiểm tra sức khỏe và Web Chat sẽ tự động chạy qua SSH tunnel này.

## Web Chat

- **SSH tunnel**: Web Chat kết nối đến gateway qua cổng WebSocket control được forward (mặc định 18789).
- **Direct (ws/wss)**: Web Chat kết nối thẳng đến URL gateway đã cấu hình.
- Không còn server WebChat HTTP riêng biệt.

## Quyền truy cập

- Host từ xa cần phê duyệt TCC giống như local (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Chạy onboarding trên máy đó để cấp quyền một lần.
- Nodes quảng bá trạng thái quyền qua `node.list` / `node.describe` để agents biết những gì có sẵn.

## Ghi chú bảo mật

- Ưu tiên bind loopback trên host từ xa và kết nối qua SSH hoặc Tailscale.
- SSH tunneling dùng kiểm tra host-key nghiêm ngặt; tin tưởng host key trước để nó tồn tại trong `~/.ssh/known_hosts`.
- Nếu bind Gateway vào interface không phải loopback, yêu cầu auth token/password.
- Xem thêm [Security](/gateway/security) và [Tailscale](/gateway/tailscale).

## Luồng đăng nhập WhatsApp (từ xa)

- Chạy `openclaw channels login --verbose` **trên host từ xa**. Quét QR với WhatsApp trên điện thoại.
- Chạy lại đăng nhập trên host đó nếu auth hết hạn. Kiểm tra sức khỏe sẽ hiển thị vấn đề liên kết.

## Khắc phục sự cố

- **exit 127 / not found**: `openclaw` không có trong PATH cho shell không login. Thêm vào `/etc/paths`, shell rc, hoặc symlink vào `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: kiểm tra khả năng truy cập SSH, PATH, và Baileys đã đăng nhập (`openclaw status --json`).
- **Web Chat stuck**: xác nhận gateway đang chạy trên host từ xa và cổng được forward khớp với cổng WS gateway; UI cần kết nối WS khỏe mạnh.
- **Node IP shows 127.0.0.1**: mong đợi với SSH tunnel. Chuyển **Transport** sang **Direct (ws/wss)** nếu muốn gateway thấy IP client thực.
- **Voice Wake**: cụm từ kích hoạt được chuyển tiếp tự động trong chế độ từ xa; không cần forwarder riêng.

## Âm thanh thông báo

Chọn âm thanh cho từng thông báo từ scripts với `openclaw` và `node.invoke`, ví dụ:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Không còn tùy chọn "âm thanh mặc định" toàn cầu trong app nữa; người gọi chọn âm thanh (hoặc không) cho từng yêu cầu.\n