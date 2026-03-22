# Ứng dụng Android (Node)

> **Lưu ý:** Ứng dụng Android chưa được phát hành công khai. Mã nguồn có sẵn trong [OpenClaw repository](https://github.com/openclaw/openclaw) tại `apps/android`. Có thể tự build bằng Java 17 và Android SDK (`./gradlew :app:assemblePlayDebug`). Xem hướng dẫn build trong [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).

## Hỗ trợ snapshot

- Vai trò: companion node app (Android không host Gateway).
- Yêu cầu Gateway: có (chạy trên macOS, Linux, hoặc Windows qua WSL2).
- Cài đặt: [Bắt đầu](/start/getting-started) + [Pairing](/channels/pairing).
- Gateway: [Runbook](/gateway) + [Cấu hình](/gateway/configuration).
  - Protocols: [Gateway protocol](/gateway/protocol) (nodes + control plane).

## Điều khiển hệ thống

Điều khiển hệ thống (launchd/systemd) nằm trên máy host Gateway. Xem [Gateway](/gateway).

## Connection Runbook

Ứng dụng Android node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android kết nối trực tiếp tới Gateway WebSocket (mặc định `ws://<host>:18789`) và sử dụng device pairing (`role: node`).

### Yêu cầu trước

- Có thể chạy Gateway trên máy "master".
- Thiết bị/emulator Android có thể truy cập Gateway WebSocket:
  - Cùng LAN với mDNS/NSD, **hoặc**
  - Cùng Tailscale tailnet dùng Wide-Area Bonjour / unicast DNS-SD (xem dưới), **hoặc**
  - Host/port Gateway thủ công (fallback)
- Có thể chạy CLI (`openclaw`) trên máy Gateway (hoặc qua SSH).

### 1) Khởi động Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Xác nhận trong logs thấy như sau:

- `listening on ws://0.0.0.0:18789`

Với setup chỉ dùng tailnet (khuyến nghị cho Vienna ⇄ London), bind Gateway vào IP tailnet:

- Đặt `gateway.bind: "tailnet"` trong `~/.openclaw/openclaw.json` trên máy host Gateway.
- Khởi động lại Gateway / ứng dụng menubar macOS.

### 2) Xác minh discovery (tùy chọn)

Từ máy Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Thêm ghi chú debug: [Bonjour](/gateway/bonjour).

#### Tailnet (Vienna ⇄ London) discovery qua unicast DNS-SD

Discovery NSD/mDNS của Android không vượt qua mạng. Nếu Android node và Gateway ở các mạng khác nhau nhưng kết nối qua Tailscale, dùng Wide-Area Bonjour / unicast DNS-SD:

1. Thiết lập DNS-SD zone (ví dụ `openclaw.internal.`) trên máy host Gateway và publish `_openclaw-gw._tcp` records.
2. Cấu hình Tailscale split DNS cho domain đã chọn trỏ tới DNS server đó.

Chi tiết và ví dụ cấu hình CoreDNS: [Bonjour](/gateway/bonjour).

### 3) Kết nối từ Android

Trong ứng dụng Android:

- Ứng dụng giữ kết nối Gateway qua **foreground service** (thông báo liên tục).
- Mở tab **Connect**.
- Dùng **Setup Code** hoặc chế độ **Manual**.
- Nếu discovery bị chặn, dùng host/port thủ công (và TLS/token/password khi cần) trong **Advanced controls**.

Sau lần pairing thành công đầu tiên, Android tự động kết nối lại khi khởi động:

- Endpoint thủ công (nếu bật), nếu không
- Gateway được phát hiện lần cuối (best-effort).

### 4) Phê duyệt pairing (CLI)

Trên máy Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Chi tiết pairing: [Pairing](/channels/pairing).

### 5) Xác minh node đã kết nối

- Qua trạng thái nodes:

  ```bash
  openclaw nodes status
  ```

- Qua Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + lịch sử

Tab Chat trên Android hỗ trợ chọn session (mặc định `main`, cùng các session khác):

- Lịch sử: `chat.history`
- Gửi: `chat.send`
- Cập nhật push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Gateway Canvas Host (khuyến nghị cho nội dung web)

Nếu muốn node hiển thị HTML/CSS/JS thực mà agent có thể chỉnh sửa trên disk, trỏ node tới Gateway canvas host.

Lưu ý: nodes tải canvas từ Gateway HTTP server (cùng port với `gateway.port`, mặc định `18789`).

1. Tạo `~/.openclaw/workspace/canvas/index.html` trên máy host Gateway.

2. Điều hướng node tới đó (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (tùy chọn): nếu cả hai thiết bị trên Tailscale, dùng tên MagicDNS hoặc IP tailnet thay vì `.local`, ví dụ `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Server này inject client live-reload vào HTML và reload khi file thay đổi.
A2UI host nằm tại `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Lệnh canvas (chỉ foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (dùng `{"url":""}` hoặc `{"url":"/"}` để quay lại scaffold mặc định). `canvas.snapshot` trả về `{ format, base64 }` (mặc định `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` alias cũ)

Lệnh camera (chỉ foreground; có kiểm soát quyền):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Xem [Camera node](/nodes/camera) để biết tham số và CLI helpers.

### 8) Voice + mở rộng command surface Android

- Voice: Android dùng một flow mic on/off duy nhất trong tab Voice với transcript capture và TTS playback (ElevenLabs khi cấu hình, fallback TTS hệ thống). Voice dừng khi ứng dụng rời foreground.
- Voice wake/talk-mode toggles hiện đã bị loại bỏ khỏi UX/runtime Android.
- Các nhóm lệnh Android bổ sung (tùy thuộc vào thiết bị + quyền):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions`
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`\n