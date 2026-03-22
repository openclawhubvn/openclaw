---
summary: "Tìm hiểu cách kết nối và sử dụng lệnh Connect, Chat, Voice, Canvas trên ứng dụng Android một cách hiệu quả."
read_when:
  - Ghép đôi hoặc kết nối lại node Android
  - Gỡ lỗi phát hiện hoặc xác thực gateway Android
  - Xác minh lịch sử chat đồng bộ trên các client
title: "Hướng Dẫn Kết Nối Ứng Dụng Android"
---

# Ứng dụng Android (Node)

> **Lưu ý:** Ứng dụng Android chưa được phát hành công khai. Mã nguồn có sẵn trong [kho OpenClaw](https://github.com/openclaw/openclaw) dưới `apps/android`. Bạn có thể tự xây dựng bằng Java 17 và Android SDK (`./gradlew :app:assemblePlayDebug`). Xem [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) để biết hướng dẫn xây dựng.

## Hỗ trợ snapshot

- Vai trò: ứng dụng node đồng hành (Android không lưu trữ Gateway).
- Yêu cầu Gateway: có (chạy trên macOS, Linux, hoặc Windows qua WSL2).
- Cài đặt: [Bắt đầu](/start/getting-started) + [Ghép đôi](/channels/pairing).
- Gateway: [Hướng dẫn](/gateway) + [Cấu hình](/gateway/configuration).
  - Giao thức: [Giao thức Gateway](/gateway/protocol) (nodes + control plane).

## Kiểm soát hệ thống

Kiểm soát hệ thống (launchd/systemd) nằm trên máy chủ Gateway. Xem [Gateway](/gateway).

## Hướng dẫn kết nối

Ứng dụng node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android kết nối trực tiếp đến Gateway WebSocket (mặc định `ws://<host>:18789`) và sử dụng ghép đôi thiết bị (`role: node`).

### Điều kiện tiên quyết

- Có thể chạy Gateway trên máy "chủ".
- Thiết bị/emulator Android có thể truy cập WebSocket của gateway:
  - Cùng mạng LAN với mDNS/NSD, **hoặc**
  - Cùng mạng Tailscale sử dụng Wide-Area Bonjour / unicast DNS-SD (xem bên dưới), **hoặc**
  - Thủ công nhập host/port của gateway (dự phòng)
- Có thể chạy CLI (`openclaw`) trên máy gateway (hoặc qua SSH).

### 1) Khởi động Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Xác nhận trong log bạn thấy điều gì đó như:

- `listening on ws://0.0.0.0:18789`

Đối với thiết lập chỉ tailnet (khuyến nghị cho Vienna ⇄ London), gán gateway vào IP tailnet:

- Đặt `gateway.bind: "tailnet"` trong `~/.openclaw/openclaw.json` trên máy chủ gateway.
- Khởi động lại Gateway / ứng dụng menubar macOS.

### 2) Xác minh phát hiện (tùy chọn)

Từ máy gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Thêm ghi chú gỡ lỗi: [Bonjour](/gateway/bonjour).

#### Phát hiện Tailnet (Vienna ⇄ London) qua unicast DNS-SD

Phát hiện NSD/mDNS của Android sẽ không vượt qua các mạng. Nếu node Android và gateway ở trên các mạng khác nhau nhưng kết nối qua Tailscale, sử dụng Wide-Area Bonjour / unicast DNS-SD thay thế:

1. Thiết lập một vùng DNS-SD (ví dụ `openclaw.internal.`) trên máy chủ gateway và công bố các bản ghi `_openclaw-gw._tcp`.
2. Cấu hình Tailscale split DNS cho miền đã chọn trỏ vào máy chủ DNS đó.

Chi tiết và cấu hình CoreDNS ví dụ: [Bonjour](/gateway/bonjour).

### 3) Kết nối từ Android

Trong ứng dụng Android:

- Ứng dụng giữ kết nối gateway thông qua một **dịch vụ nền** (thông báo liên tục).
- Mở tab **Connect**.
- Sử dụng **Setup Code** hoặc chế độ **Manual**.
- Nếu phát hiện bị chặn, sử dụng host/port thủ công (và TLS/token/mật khẩu khi cần) trong **Advanced controls**.

Sau lần ghép đôi thành công đầu tiên, Android tự động kết nối lại khi khởi động:

- Điểm cuối thủ công (nếu được bật), nếu không
- Gateway cuối cùng được phát hiện (nỗ lực tốt nhất).

### 4) Phê duyệt ghép đôi (CLI)

Trên máy gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Chi tiết ghép đôi: [Ghép đôi](/channels/pairing).

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

Tab Chat của Android hỗ trợ lựa chọn phiên (mặc định `main`, cùng với các phiên khác đã tồn tại):

- Lịch sử: `chat.history`
- Gửi: `chat.send`
- Cập nhật đẩy (nỗ lực tốt nhất): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Máy chủ Canvas Gateway (khuyến nghị cho nội dung web)

Nếu muốn node hiển thị HTML/CSS/JS thực mà agent có thể chỉnh sửa trên đĩa, hãy trỏ node vào máy chủ canvas của Gateway.

Lưu ý: nodes tải canvas từ máy chủ HTTP của Gateway (cùng cổng với `gateway.port`, mặc định `18789`).

1. Tạo `~/.openclaw/workspace/canvas/index.html` trên máy chủ gateway.

2. Điều hướng node đến đó (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (tùy chọn): nếu cả hai thiết bị đều trên Tailscale, sử dụng tên MagicDNS hoặc IP tailnet thay vì `.local`, ví dụ `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Máy chủ này chèn một client tải lại trực tiếp vào HTML và tải lại khi có thay đổi tệp.
Máy chủ A2UI nằm tại `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Lệnh Canvas (chỉ nền trước):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (sử dụng `{"url":""}` hoặc `{"url":"/"}` để quay lại scaffold mặc định). `canvas.snapshot` trả về `{ format, base64 }` (mặc định `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` alias cũ)

Lệnh Camera (chỉ nền trước; có quyền):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Xem [Node Camera](/nodes/camera) để biết tham số và trợ giúp CLI.

### 8) Voice + bề mặt lệnh Android mở rộng

- Voice: Android sử dụng một luồng mic bật/tắt duy nhất trong tab Voice với ghi âm và phát lại TTS (ElevenLabs khi được cấu hình, hệ thống TTS dự phòng). Voice dừng khi ứng dụng rời khỏi nền trước.
- Các công tắc wake/talk-mode của Voice hiện đã bị loại bỏ khỏi UX/runtime của Android.
- Các nhóm lệnh Android bổ sung (tùy thuộc vào thiết bị + quyền):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions`
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`
