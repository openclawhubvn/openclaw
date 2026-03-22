---
summary: "Bonjour/mDNS discovery + debugging (Gateway beacons, clients, và các lỗi thường gặp)"
read_when:
  - Debugging vấn đề Bonjour discovery trên macOS/iOS
  - Thay đổi mDNS service types, TXT records, hoặc discovery UX
title: "Bonjour Discovery"
---

# Bonjour / mDNS discovery

OpenClaw dùng Bonjour (mDNS / DNS‑SD) để **tìm Gateway trong LAN**. Đây là giải pháp tiện lợi, không thay thế SSH hay kết nối dựa trên Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) qua Tailscale

Nếu node và gateway ở mạng khác nhau, multicast mDNS không vượt qua được ranh giới mạng. Có thể dùng **unicast DNS‑SD** ("Wide‑Area Bonjour") qua Tailscale để giữ nguyên trải nghiệm discovery.

Các bước chính:

1. Chạy DNS server trên máy chủ gateway (có thể truy cập qua Tailnet).
2. Publish DNS‑SD records cho `_openclaw-gw._tcp` dưới một zone riêng (ví dụ: `openclaw.internal.`).
3. Cấu hình Tailscale **split DNS** để domain đã chọn được giải qua DNS server đó cho các client (bao gồm iOS).

OpenClaw hỗ trợ bất kỳ discovery domain nào; `openclaw.internal.` chỉ là ví dụ. Các node iOS/Android duyệt cả `local.` và domain wide‑area đã cấu hình.

### Cấu hình Gateway (khuyến nghị)

```json5
{
  gateway: { bind: "tailnet" }, // chỉ tailnet (khuyến nghị)
  discovery: { wideArea: { enabled: true } }, // bật wide-area DNS-SD publishing
}
```

### Thiết lập DNS server một lần (trên máy chủ gateway)

```bash
openclaw dns setup --apply
```

Lệnh này cài đặt CoreDNS và cấu hình để:

- Lắng nghe trên cổng 53 chỉ trên các giao diện Tailscale của gateway
- Phục vụ domain đã chọn (ví dụ: `openclaw.internal.`) từ `~/.openclaw/dns/<domain>.db`

Kiểm tra từ máy kết nối tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Cài đặt DNS Tailscale

Trong admin console của Tailscale:

- Thêm nameserver trỏ đến IP tailnet của gateway (UDP/TCP 53).
- Thêm split DNS để domain discovery dùng nameserver đó.

Khi client chấp nhận DNS tailnet, các node iOS có thể duyệt
`_openclaw-gw._tcp` trong domain discovery mà không cần multicast.

### Bảo mật listener Gateway (khuyến nghị)

Cổng WS của Gateway (mặc định `18789`) mặc định bind vào loopback. Để truy cập LAN/tailnet, bind rõ ràng và giữ auth bật.

Đối với thiết lập chỉ tailnet:

- Đặt `gateway.bind: "tailnet"` trong `~/.openclaw/openclaw.json`.
- Khởi động lại Gateway (hoặc khởi động lại ứng dụng menubar trên macOS).

## Ai quảng bá

Chỉ Gateway quảng bá `_openclaw-gw._tcp`.

## Loại dịch vụ

- `_openclaw-gw._tcp` — beacon transport gateway (dùng bởi các node macOS/iOS/Android).

## TXT keys (gợi ý không bảo mật)

Gateway quảng bá các gợi ý nhỏ không bảo mật để làm cho UI tiện lợi:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (chỉ khi TLS bật)
- `gatewayTlsSha256=<sha256>` (chỉ khi TLS bật và có fingerprint)
- `canvasPort=<port>` (chỉ khi host canvas bật; hiện tại giống `gatewayPort`)
- `sshPort=<port>` (mặc định là 22 khi không ghi đè)
- `transport=gateway`
- `cliPath=<path>` (tùy chọn; đường dẫn tuyệt đối đến entrypoint `openclaw` có thể chạy)
- `tailnetDns=<magicdns>` (gợi ý tùy chọn khi Tailnet có sẵn)

Ghi chú bảo mật:

- TXT records của Bonjour/mDNS **không được xác thực**. Client không nên coi TXT là routing chính thức.
- Client nên route bằng cách sử dụng service endpoint đã giải (SRV + A/AAAA). Chỉ coi `lanHost`, `tailnetDns`, `gatewayPort`, và `gatewayTlsSha256` là gợi ý.
- TLS pinning không bao giờ cho phép `gatewayTlsSha256` quảng bá ghi đè pin đã lưu trước đó.
- Các node iOS/Android nên coi kết nối trực tiếp dựa trên discovery là **chỉ TLS** và yêu cầu xác nhận người dùng trước khi tin tưởng fingerprint lần đầu.

## Debugging trên macOS

Công cụ tích hợp hữu ích:

- Duyệt các instance:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Giải quyết một instance (thay `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Nếu duyệt được nhưng giải quyết không được, thường gặp vấn đề chính sách LAN hoặc resolver mDNS.

## Debugging trong log Gateway

Gateway ghi log rolling (in ra khi khởi động là `gateway log file: ...`). Tìm các dòng `bonjour:`, đặc biệt:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Debugging trên node iOS

Node iOS dùng `NWBrowser` để tìm `_openclaw-gw._tcp`.

Để lấy log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → tái hiện → **Copy**

Log bao gồm các chuyển đổi trạng thái browser và thay đổi tập kết quả.

## Các lỗi thường gặp

- **Bonjour không vượt qua mạng**: dùng Tailnet hoặc SSH.
- **Multicast bị chặn**: một số mạng Wi‑Fi tắt mDNS.
- **Sleep / interface churn**: macOS có thể tạm thời mất kết quả mDNS; thử lại.
- **Duyệt được nhưng giải quyết không được**: giữ tên máy đơn giản (tránh emoji hoặc dấu câu), sau đó khởi động lại Gateway. Tên instance dịch vụ lấy từ tên host, nên tên quá phức tạp có thể gây nhầm lẫn cho một số resolver.

## Tên instance đã thoát (`\032`)

Bonjour/DNS‑SD thường thoát byte trong tên instance dịch vụ dưới dạng chuỗi thập phân `\DDD` (ví dụ: khoảng trắng thành `\032`).

- Đây là bình thường ở mức giao thức.
- UI nên giải mã để hiển thị (iOS dùng `BonjourEscapes.decode`).

## Tắt / cấu hình

- `OPENCLAW_DISABLE_BONJOUR=1` tắt quảng bá (cũ: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` trong `~/.openclaw/openclaw.json` điều khiển chế độ bind của Gateway.
- `OPENCLAW_SSH_PORT` ghi đè cổng SSH quảng bá trong TXT (cũ: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` xuất bản gợi ý MagicDNS trong TXT (cũ: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` ghi đè đường dẫn CLI quảng bá (cũ: `OPENCLAW_CLI_PATH`).

## Tài liệu liên quan

- Chính sách discovery và lựa chọn transport: [Discovery](/gateway/discovery)
- Ghép đôi node + phê duyệt: [Gateway pairing](/gateway/pairing)\n