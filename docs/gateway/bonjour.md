---
summary: "Tìm hiểu cách cấu hình và gỡ lỗi Bonjour/mDNS, xử lý Gateway beacons và các lỗi thường gặp hiệu quả."
read_when:
  - Gỡ lỗi vấn đề khám phá Bonjour trên macOS/iOS
  - Thay đổi loại dịch vụ mDNS, bản ghi TXT, hoặc trải nghiệm khám phá
title: "Hướng Dẫn Cấu Hình Bonjour/mDNS"
---

# Khám phá Bonjour / mDNS

OpenClaw sử dụng Bonjour (mDNS / DNS‑SD) như một **tiện ích chỉ dành cho mạng LAN** để tìm kiếm Gateway đang hoạt động (điểm cuối WebSocket). Đây là phương pháp nỗ lực tối đa và **không** thay thế cho kết nối SSH hoặc dựa trên Tailnet.

## Bonjour diện rộng (Unicast DNS-SD) qua Tailscale

Nếu node và gateway nằm trên các mạng khác nhau, multicast mDNS sẽ không vượt qua được ranh giới. Bạn có thể giữ trải nghiệm khám phá tương tự bằng cách chuyển sang **unicast DNS‑SD** ("Bonjour diện rộng") qua Tailscale.

Các bước cơ bản:

1. Chạy một máy chủ DNS trên máy chủ gateway (có thể truy cập qua Tailnet).
2. Công bố các bản ghi DNS‑SD cho `_openclaw-gw._tcp` dưới một vùng riêng biệt (ví dụ: `openclaw.internal.`).
3. Cấu hình Tailscale **split DNS** để tên miền bạn chọn được giải quyết qua máy chủ DNS đó cho các client (bao gồm iOS).

OpenClaw hỗ trợ bất kỳ tên miền khám phá nào; `openclaw.internal.` chỉ là một ví dụ. Các node iOS/Android duyệt cả `local.` và tên miền diện rộng bạn đã cấu hình.

### Cấu hình Gateway (khuyến nghị)

```json5
{
  gateway: { bind: "tailnet" }, // chỉ tailnet (khuyến nghị)
  discovery: { wideArea: { enabled: true } }, // kích hoạt công bố DNS-SD diện rộng
}
```

### Thiết lập máy chủ DNS một lần (máy chủ gateway)

```bash
openclaw dns setup --apply
```

Lệnh này cài đặt CoreDNS và cấu hình để:

- lắng nghe trên cổng 53 chỉ trên các giao diện Tailscale của gateway
- phục vụ tên miền bạn chọn (ví dụ: `openclaw.internal.`) từ `~/.openclaw/dns/<domain>.db`

Xác thực từ một máy kết nối tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Cài đặt DNS Tailscale

Trong bảng điều khiển quản trị Tailscale:

- Thêm một máy chủ tên trỏ đến IP tailnet của gateway (UDP/TCP 53).
- Thêm split DNS để tên miền khám phá của bạn sử dụng máy chủ tên đó.

Khi các client chấp nhận DNS tailnet, các node iOS có thể duyệt
`_openclaw-gw._tcp` trong tên miền khám phá của bạn mà không cần multicast.

### Bảo mật listener Gateway (khuyến nghị)

Cổng WS của Gateway (mặc định `18789`) mặc định chỉ kết nối với loopback. Để truy cập LAN/tailnet, hãy cấu hình rõ ràng và giữ cho xác thực được bật.

Đối với các thiết lập chỉ tailnet:

- Đặt `gateway.bind: "tailnet"` trong `~/.openclaw/openclaw.json`.
- Khởi động lại Gateway (hoặc khởi động lại ứng dụng menubar trên macOS).

## Ai quảng bá

Chỉ Gateway quảng bá `_openclaw-gw._tcp`.

## Loại dịch vụ

- `_openclaw-gw._tcp` — beacon vận chuyển gateway (được sử dụng bởi các node macOS/iOS/Android).

## Khóa TXT (gợi ý không bảo mật)

Gateway quảng bá các gợi ý nhỏ không bảo mật để làm cho luồng giao diện người dùng thuận tiện:

- `role=gateway`
- `displayName=<tên thân thiện>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (chỉ khi TLS được bật)
- `gatewayTlsSha256=<sha256>` (chỉ khi TLS được bật và có sẵn dấu vân tay)
- `canvasPort=<port>` (chỉ khi máy chủ canvas được bật; hiện tại giống với `gatewayPort`)
- `sshPort=<port>` (mặc định là 22 khi không được ghi đè)
- `transport=gateway`
- `cliPath=<path>` (tùy chọn; đường dẫn tuyệt đối đến một điểm đầu vào `openclaw` có thể chạy)
- `tailnetDns=<magicdns>` (gợi ý tùy chọn khi Tailnet có sẵn)

Ghi chú bảo mật:

- Bản ghi TXT của Bonjour/mDNS **không được xác thực**. Các client không nên coi TXT là định tuyến có thẩm quyền.
- Các client nên định tuyến bằng cách sử dụng điểm cuối dịch vụ đã giải quyết (SRV + A/AAAA). Chỉ coi `lanHost`, `tailnetDns`, `gatewayPort`, và `gatewayTlsSha256` là gợi ý.
- TLS pinning không bao giờ được phép cho một `gatewayTlsSha256` quảng bá ghi đè lên một pin đã lưu trước đó.
- Các node iOS/Android nên coi các kết nối trực tiếp dựa trên khám phá là **chỉ TLS** và yêu cầu xác nhận người dùng rõ ràng trước khi tin tưởng một dấu vân tay lần đầu.

## Gỡ lỗi trên macOS

Các công cụ tích hợp hữu ích:

- Duyệt các phiên bản:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Giải quyết một phiên bản (thay thế `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Nếu duyệt được nhưng giải quyết không thành công, thường là do chính sách LAN hoặc vấn đề với trình giải quyết mDNS.

## Gỡ lỗi trong nhật ký Gateway

Gateway ghi một tệp nhật ký cuộn (được in khi khởi động là
`gateway log file: ...`). Tìm các dòng `bonjour:`, đặc biệt là:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Gỡ lỗi trên node iOS

Node iOS sử dụng `NWBrowser` để khám phá `_openclaw-gw._tcp`.

Để thu thập nhật ký:

- Cài đặt → Gateway → Nâng cao → **Nhật ký gỡ lỗi khám phá**
- Cài đặt → Gateway → Nâng cao → **Nhật ký khám phá** → tái tạo → **Sao chép**

Nhật ký bao gồm các chuyển đổi trạng thái trình duyệt và thay đổi tập hợp kết quả.

## Các lỗi thường gặp

- **Bonjour không vượt qua các mạng**: sử dụng Tailnet hoặc SSH.
- **Multicast bị chặn**: một số mạng Wi‑Fi vô hiệu hóa mDNS.
- **Ngủ / thay đổi giao diện**: macOS có thể tạm thời bỏ qua kết quả mDNS; thử lại.
- **Duyệt được nhưng giải quyết không thành công**: giữ tên máy đơn giản (tránh biểu tượng cảm xúc hoặc dấu câu), sau đó khởi động lại Gateway. Tên phiên bản dịch vụ được lấy từ tên máy chủ, vì vậy tên quá phức tạp có thể gây nhầm lẫn cho một số trình giải quyết.

## Tên phiên bản thoát (`\032`)

Bonjour/DNS‑SD thường thoát các byte trong tên phiên bản dịch vụ dưới dạng chuỗi thập phân `\DDD` (ví dụ: khoảng trắng trở thành `\032`).

- Điều này là bình thường ở cấp độ giao thức.
- Giao diện người dùng nên giải mã để hiển thị (iOS sử dụng `BonjourEscapes.decode`).

## Vô hiệu hóa / cấu hình

- `OPENCLAW_DISABLE_BONJOUR=1` vô hiệu hóa quảng bá (cũ: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` trong `~/.openclaw/openclaw.json` kiểm soát chế độ bind của Gateway.
- `OPENCLAW_SSH_PORT` ghi đè cổng SSH được quảng bá trong TXT (cũ: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` công bố một gợi ý MagicDNS trong TXT (cũ: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` ghi đè đường dẫn CLI được quảng bá (cũ: `OPENCLAW_CLI_PATH`).

## Tài liệu liên quan

- Chính sách khám phá và lựa chọn vận chuyển: [Khám phá](/gateway/discovery)
- Ghép nối node + phê duyệt: [Ghép nối Gateway](/gateway/pairing)
