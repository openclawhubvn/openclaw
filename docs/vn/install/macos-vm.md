---
summary: "Chạy OpenClaw trong một máy ảo macOS được cách ly (local hoặc hosted) khi cần sự cô lập hoặc tích hợp iMessage"
read_when:
  - Bạn muốn OpenClaw được cách ly khỏi môi trường macOS chính
  - Bạn muốn tích hợp iMessage (BlueBubbles) trong một sandbox
  - Bạn muốn một môi trường macOS có thể reset và clone
  - Bạn muốn so sánh các tùy chọn máy ảo macOS local và hosted
title: "Máy ảo macOS"
---

# OpenClaw trên Máy Ảo macOS (Sandboxing)

## Khuyến nghị mặc định (dành cho hầu hết người dùng)

- **VPS Linux nhỏ** để có một Gateway luôn hoạt động với chi phí thấp. Xem [VPS hosting](/vps).
- **Phần cứng chuyên dụng** (Mac mini hoặc máy Linux) nếu bạn muốn kiểm soát hoàn toàn và có **IP dân cư** cho tự động hóa trình duyệt. Nhiều trang web chặn IP từ trung tâm dữ liệu, nên duyệt web local thường hiệu quả hơn.
- **Kết hợp:** giữ Gateway trên một VPS giá rẻ, và kết nối Mac của bạn như một **node** khi cần tự động hóa trình duyệt/UI. Xem [Nodes](/nodes) và [Gateway remote](/gateway/remote).

Sử dụng máy ảo macOS khi bạn cần các khả năng chỉ có trên macOS (iMessage/BlueBubbles) hoặc muốn cách ly hoàn toàn khỏi Mac hàng ngày.

## Các tùy chọn máy ảo macOS

### Máy ảo local trên Apple Silicon Mac (Lume)

Chạy OpenClaw trong một máy ảo macOS được cách ly trên Apple Silicon Mac hiện có của bạn bằng [Lume](https://cua.ai/docs/lume).

Điều này mang lại cho bạn:

- Môi trường macOS đầy đủ trong sự cách ly (máy chủ của bạn vẫn sạch)
- Hỗ trợ iMessage qua BlueBubbles (không thể trên Linux/Windows)
- Khả năng reset nhanh chóng bằng cách clone máy ảo
- Không cần thêm phần cứng hoặc chi phí đám mây

### Nhà cung cấp Mac hosted (cloud)

Nếu bạn muốn macOS trên đám mây, các nhà cung cấp Mac hosted cũng hoạt động tốt:

- [MacStadium](https://www.macstadium.com/) (Mac hosted)
- Các nhà cung cấp Mac hosted khác cũng hoạt động; làm theo tài liệu VM + SSH của họ

Khi bạn có quyền truy cập SSH vào một máy ảo macOS, tiếp tục từ bước 6 dưới đây.

---

## Lộ trình nhanh (Lume, người dùng có kinh nghiệm)

1. Cài đặt Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Hoàn tất Setup Assistant, bật Remote Login (SSH)
4. `lume run openclaw --no-display`
5. SSH vào, cài đặt OpenClaw, cấu hình các kênh
6. Hoàn tất

---

## Những gì bạn cần (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia hoặc mới hơn trên máy chủ
- ~60 GB dung lượng đĩa trống cho mỗi máy ảo
- ~20 phút

---

## 1) Cài đặt Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Nếu `~/.local/bin` chưa có trong PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Xác minh:

```bash
lume --version
```

Tài liệu: [Lume Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Tạo máy ảo macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Lệnh này tải xuống macOS và tạo máy ảo. Một cửa sổ VNC sẽ tự động mở.

Lưu ý: Quá trình tải xuống có thể mất thời gian tùy thuộc vào kết nối của bạn.

---

## 3) Hoàn tất Setup Assistant

Trong cửa sổ VNC:

1. Chọn ngôn ngữ và khu vực
2. Bỏ qua Apple ID (hoặc đăng nhập nếu bạn muốn iMessage sau này)
3. Tạo tài khoản người dùng (nhớ tên người dùng và mật khẩu)
4. Bỏ qua tất cả các tính năng tùy chọn

Sau khi hoàn tất thiết lập, bật SSH:

1. Mở System Settings → General → Sharing
2. Bật "Remote Login"

---

## 4) Lấy địa chỉ IP của máy ảo

```bash
lume get openclaw
```

Tìm địa chỉ IP (thường là `192.168.64.x`).

---

## 5) SSH vào máy ảo

```bash
ssh youruser@192.168.64.X
```

Thay `youruser` bằng tài khoản bạn đã tạo, và IP bằng IP của máy ảo.

---

## 6) Cài đặt OpenClaw

Bên trong máy ảo:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Làm theo hướng dẫn để thiết lập nhà cung cấp mô hình của bạn (Anthropic, OpenAI, v.v.).

---

## 7) Cấu hình các kênh

Chỉnh sửa file cấu hình:

```bash
nano ~/.openclaw/openclaw.json
```

Thêm các kênh của bạn:

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

Sau đó đăng nhập vào WhatsApp (quét mã QR):

```bash
openclaw channels login
```

---

## 8) Chạy máy ảo không hiển thị

Dừng máy ảo và khởi động lại mà không cần hiển thị:

```bash
lume stop openclaw
lume run openclaw --no-display
```

Máy ảo sẽ chạy ngầm. Daemon của OpenClaw giữ cho gateway hoạt động.

Để kiểm tra trạng thái:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Thêm: Tích hợp iMessage

Đây là tính năng nổi bật khi chạy trên macOS. Sử dụng [BlueBubbles](https://bluebubbles.app) để thêm iMessage vào OpenClaw.

Bên trong máy ảo:

1. Tải BlueBubbles từ bluebubbles.app
2. Đăng nhập bằng Apple ID của bạn
3. Bật Web API và đặt mật khẩu
4. Trỏ webhook của BlueBubbles vào gateway của bạn (ví dụ: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Thêm vào cấu hình OpenClaw của bạn:

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

Khởi động lại gateway. Bây giờ agent của bạn có thể gửi và nhận iMessages.

Chi tiết thiết lập đầy đủ: [BlueBubbles channel](/channels/bluebubbles)

---

## Lưu một hình ảnh vàng

Trước khi tùy chỉnh thêm, hãy chụp ảnh trạng thái sạch của bạn:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Reset bất cứ lúc nào:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Chạy 24/7

Giữ máy ảo chạy bằng cách:

- Giữ Mac của bạn cắm điện
- Tắt chế độ ngủ trong System Settings → Energy Saver
- Sử dụng `caffeinate` nếu cần

Để luôn hoạt động thực sự, hãy cân nhắc một Mac mini chuyên dụng hoặc một VPS nhỏ. Xem [VPS hosting](/vps).

---

## Khắc phục sự cố

| Vấn đề                   | Giải pháp                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Không thể SSH vào máy ảo | Kiểm tra "Remote Login" đã được bật trong System Settings của máy ảo               |
| IP máy ảo không hiển thị | Chờ máy ảo khởi động hoàn toàn, chạy lại `lume get openclaw`                       |
| Lệnh Lume không tìm thấy | Thêm `~/.local/bin` vào PATH của bạn                                               |
| QR WhatsApp không quét   | Đảm bảo bạn đang đăng nhập vào máy ảo (không phải máy chủ) khi chạy `openclaw channels login` |

---

## Tài liệu liên quan

- [VPS hosting](/vps)
- [Nodes](/nodes)
- [Gateway remote](/gateway/remote)
- [BlueBubbles channel](/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (nâng cao)
- [Docker Sandboxing](/install/docker) (phương pháp cách ly thay thế)
