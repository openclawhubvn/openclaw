---
summary: "Chạy OpenClaw trong VM macOS sandboxed (local hoặc hosted) khi cần cách ly hoặc iMessage"
read_when:
  - Muốn OpenClaw cách ly khỏi môi trường macOS chính
  - Muốn tích hợp iMessage (BlueBubbles) trong sandbox
  - Muốn môi trường macOS có thể reset và clone
  - Muốn so sánh VM macOS local và hosted
title: "VM macOS"
---

# OpenClaw trên VM macOS (Sandboxing)

## Khuyến nghị mặc định (đa số người dùng)

- **Linux VPS nhỏ** cho Gateway luôn bật và chi phí thấp. Xem [VPS hosting](/vps).
- **Phần cứng riêng** (Mac mini hoặc Linux box) nếu muốn toàn quyền kiểm soát và IP **residential** cho tự động hóa trình duyệt. Nhiều trang web chặn IP data center, nên duyệt local thường hiệu quả hơn.
- **Kết hợp:** giữ Gateway trên VPS rẻ, và kết nối Mac làm **node** khi cần tự động hóa trình duyệt/UI. Xem [Nodes](/nodes) và [Gateway remote](/gateway/remote).

Dùng VM macOS khi cần tính năng chỉ có trên macOS (iMessage/BlueBubbles) hoặc muốn cách ly hoàn toàn khỏi Mac hàng ngày.

## Tùy chọn VM macOS

### VM local trên Apple Silicon Mac (Lume)

Chạy OpenClaw trong VM macOS sandboxed trên Apple Silicon Mac hiện có bằng [Lume](https://cua.ai/docs/lume).

Lợi ích:

- Môi trường macOS đầy đủ, cách ly (host sạch)
- Hỗ trợ iMessage qua BlueBubbles (không thể trên Linux/Windows)
- Reset nhanh bằng cách clone VM
- Không cần phần cứng hay chi phí cloud thêm

### Nhà cung cấp Mac hosted (cloud)

Nếu muốn macOS trên cloud, các nhà cung cấp Mac hosted cũng hoạt động tốt:

- [MacStadium](https://www.macstadium.com/) (Mac hosted)
- Các nhà cung cấp Mac hosted khác cũng hoạt động; làm theo tài liệu VM + SSH của họ

Khi có SSH vào VM macOS, tiếp tục từ bước 6 dưới đây.

---

## Đường tắt (Lume, người dùng có kinh nghiệm)

1. Cài Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Hoàn tất Setup Assistant, bật Remote Login (SSH)
4. `lume run openclaw --no-display`
5. SSH vào, cài OpenClaw, cấu hình channels
6. Xong

---

## Cần chuẩn bị gì (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia hoặc mới hơn trên host
- ~60 GB trống mỗi VM
- ~20 phút

---

## 1) Cài Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Nếu `~/.local/bin` chưa có trong PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Kiểm tra:

```bash
lume --version
```

Tài liệu: [Lume Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Tạo VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Lệnh này tải macOS và tạo VM. Cửa sổ VNC tự động mở.

Lưu ý: Tải có thể lâu tùy kết nối.

---

## 3) Hoàn tất Setup Assistant

Trong cửa sổ VNC:

1. Chọn ngôn ngữ và vùng
2. Bỏ qua Apple ID (hoặc đăng nhập nếu muốn iMessage sau)
3. Tạo tài khoản người dùng (nhớ username và password)
4. Bỏ qua các tính năng tùy chọn

Sau khi hoàn tất, bật SSH:

1. Mở System Settings → General → Sharing
2. Bật "Remote Login"

---

## 4) Lấy địa chỉ IP của VM

```bash
lume get openclaw
```

Tìm địa chỉ IP (thường là `192.168.64.x`).

---

## 5) SSH vào VM

```bash
ssh youruser@192.168.64.X
```

Thay `youruser` bằng tài khoản đã tạo, và IP bằng IP của VM.

---

## 6) Cài OpenClaw

Trong VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Làm theo hướng dẫn để thiết lập model provider (Anthropic, OpenAI, v.v.).

---

## 7) Cấu hình channels

Chỉnh file config:

```bash
nano ~/.openclaw/openclaw.json
```

Thêm channels:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Sau đó đăng nhập WhatsApp (quét QR):

```bash
openclaw channels login
```

---

## 8) Chạy VM không hiển thị

Dừng VM và khởi động lại không hiển thị:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM chạy nền. Daemon của OpenClaw giữ Gateway hoạt động.

Kiểm tra trạng thái:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: Tích hợp iMessage

Đây là tính năng nổi bật khi chạy trên macOS. Dùng [BlueBubbles](https://bluebubbles.app) để thêm iMessage vào OpenClaw.

Trong VM:

1. Tải BlueBubbles từ bluebubbles.app
2. Đăng nhập với Apple ID
3. Bật Web API và đặt mật khẩu
4. Trỏ webhooks của BlueBubbles vào gateway (ví dụ: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Thêm vào config OpenClaw:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Khởi động lại gateway. Giờ agent có thể gửi và nhận iMessages.

Chi tiết thiết lập: [BlueBubbles channel](/channels/bluebubbles)

---

## Lưu ảnh vàng

Trước khi tùy chỉnh thêm, snapshot trạng thái sạch:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Reset bất kỳ lúc nào:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Chạy 24/7

Giữ VM chạy bằng cách:

- Giữ Mac cắm điện
- Tắt sleep trong System Settings → Energy Saver
- Dùng `caffeinate` nếu cần

Để luôn bật thực sự, cân nhắc Mac mini riêng hoặc VPS nhỏ. Xem [VPS hosting](/vps).

---

## Khắc phục sự cố

| Vấn đề                   | Giải pháp                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Không SSH vào VM được    | Kiểm tra "Remote Login" đã bật trong System Settings của VM                        |
| Không thấy IP của VM     | Đợi VM khởi động hoàn toàn, chạy lại `lume get openclaw`                           |
| Không tìm thấy lệnh Lume | Thêm `~/.local/bin` vào PATH                                                       |
| QR WhatsApp không quét   | Đảm bảo đang đăng nhập vào VM (không phải host) khi chạy `openclaw channels login` |

---

## Tài liệu liên quan

- [VPS hosting](/vps)
- [Nodes](/nodes)
- [Gateway remote](/gateway/remote)
- [BlueBubbles channel](/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (nâng cao)
- [Docker Sandboxing](/install/docker) (cách ly thay thế)\n