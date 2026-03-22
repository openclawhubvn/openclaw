---
summary: "Khám phá node và các phương thức truyền tải (Bonjour, Tailscale, SSH) để tìm gateway"
read_when:
  - Thực hiện hoặc thay đổi khám phá/quảng bá Bonjour
  - Điều chỉnh chế độ kết nối từ xa (trực tiếp vs SSH)
  - Thiết kế khám phá node + ghép nối cho các node từ xa
title: "Khám phá và Truyền tải"
---

# Khám phá & truyền tải

OpenClaw có hai vấn đề khác nhau nhưng trông giống nhau:

1. **Điều khiển từ xa**: ứng dụng trên thanh menu macOS điều khiển một gateway chạy ở nơi khác.
2. **Ghép nối node**: iOS/Android (và các node tương lai) tìm gateway và ghép nối an toàn.

Mục tiêu thiết kế là giữ tất cả khám phá/quảng bá mạng trong **Node Gateway** (`openclaw gateway`) và để các client (ứng dụng mac, iOS) làm người tiêu dùng.

## Thuật ngữ

- **Gateway**: một tiến trình gateway chạy lâu dài, quản lý trạng thái (session, ghép nối, đăng ký node) và chạy các channel. Thường mỗi host dùng một gateway; có thể thiết lập nhiều gateway cô lập.
- **Gateway WS (control plane)**: endpoint WebSocket mặc định tại `127.0.0.1:18789`; có thể bind vào LAN/tailnet qua `gateway.bind`.
- **Direct WS transport**: endpoint Gateway WS hướng LAN/tailnet (không SSH).
- **SSH transport (fallback)**: điều khiển từ xa bằng cách forward `127.0.0.1:18789` qua SSH.
- **Legacy TCP bridge (đã bỏ)**: phương thức node cũ (xem [Bridge protocol](/gateway/bridge-protocol)); không còn quảng bá để khám phá.

Chi tiết protocol:

- [Gateway protocol](/gateway/protocol)
- [Bridge protocol (legacy)](/gateway/bridge-protocol)

## Tại sao giữ cả "direct" và SSH

- **Direct WS** là UX tốt nhất trên cùng mạng và trong tailnet:
  - tự động khám phá trên LAN qua Bonjour
  - token ghép nối + ACL do gateway quản lý
  - không cần truy cập shell; bề mặt protocol có thể giữ chặt và dễ kiểm tra
- **SSH** vẫn là phương án dự phòng phổ biến:
  - hoạt động ở bất kỳ đâu có SSH access (ngay cả trên các mạng không liên quan)
  - vượt qua vấn đề multicast/mDNS
  - không cần mở cổng inbound mới ngoài SSH

## Đầu vào khám phá (cách client biết gateway ở đâu)

### 1) Bonjour / mDNS (chỉ LAN)

Bonjour là nỗ lực tốt nhất và không vượt qua mạng. Chỉ dùng cho tiện lợi “cùng LAN”.

Hướng mục tiêu:

- **Gateway** quảng bá endpoint WS qua Bonjour.
- Client duyệt và hiển thị danh sách “chọn một gateway”, sau đó lưu endpoint đã chọn.

Khắc phục sự cố và chi tiết beacon: [Bonjour](/gateway/bonjour).

#### Chi tiết beacon dịch vụ

- Loại dịch vụ:
  - `_openclaw-gw._tcp` (beacon truyền tải gateway)
- TXT keys (không bảo mật):
  - `role=gateway`
  - `lanHost=<hostname>.local`
  - `sshPort=22` (hoặc cổng được quảng bá)
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (chỉ khi TLS được bật)
  - `gatewayTlsSha256=<sha256>` (chỉ khi TLS được bật và có fingerprint)
  - `canvasPort=<port>` (cổng host canvas; hiện tại giống `gatewayPort` khi host canvas được bật)
  - `cliPath=<path>` (tùy chọn; đường dẫn tuyệt đối đến một `openclaw` entrypoint hoặc binary có thể chạy)
  - `tailnetDns=<magicdns>` (gợi ý tùy chọn; tự động phát hiện khi Tailscale có sẵn)

Ghi chú bảo mật:

- Bản ghi TXT Bonjour/mDNS **không xác thực**. Client phải coi giá trị TXT chỉ là gợi ý UX.
- Routing (host/port) nên ưu tiên **endpoint dịch vụ đã giải quyết** (SRV + A/AAAA) hơn `lanHost`, `tailnetDns`, hoặc `gatewayPort` từ TXT.
- TLS pinning không bao giờ cho phép `gatewayTlsSha256` quảng bá ghi đè pin đã lưu trước đó.
- Node iOS/Android nên coi kết nối trực tiếp dựa trên khám phá là **chỉ TLS** và yêu cầu xác nhận “tin tưởng fingerprint này” trước khi lưu pin lần đầu (xác minh ngoài băng).

Tắt/ghi đè:

- `OPENCLAW_DISABLE_BONJOUR=1` tắt quảng bá.
- `gateway.bind` trong `~/.openclaw/openclaw.json` điều khiển chế độ bind Gateway.
- `OPENCLAW_SSH_PORT` ghi đè cổng SSH quảng bá trong TXT (mặc định là 22).
- `OPENCLAW_TAILNET_DNS` công bố gợi ý `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` ghi đè đường dẫn CLI quảng bá.

### 2) Tailnet (xuyên mạng)

Với các thiết lập kiểu London/Vienna, Bonjour không giúp được. Mục tiêu “trực tiếp” được khuyến nghị là:

- Tên MagicDNS của Tailscale (ưu tiên) hoặc IP tailnet ổn định.

Nếu gateway phát hiện đang chạy dưới Tailscale, nó công bố `tailnetDns` như một gợi ý tùy chọn cho client (bao gồm beacon diện rộng).

### 3) Mục tiêu thủ công / SSH

Khi không có đường trực tiếp (hoặc trực tiếp bị tắt), client luôn có thể kết nối qua SSH bằng cách forward cổng gateway loopback.

Xem [Remote access](/gateway/remote).

## Lựa chọn truyền tải (chính sách client)

Hành vi client được khuyến nghị:

1. Nếu endpoint trực tiếp đã ghép nối được cấu hình và có thể truy cập, sử dụng nó.
2. Nếu Bonjour tìm thấy gateway trên LAN, cung cấp lựa chọn “Sử dụng gateway này” và lưu nó làm endpoint trực tiếp.
3. Nếu DNS/IP tailnet được cấu hình, thử trực tiếp.
4. Nếu không, quay lại SSH.

## Ghép nối + xác thực (truyền tải trực tiếp)

Gateway là nguồn xác thực cho việc chấp nhận node/client.

- Yêu cầu ghép nối được tạo/phê duyệt/từ chối trong gateway (xem [Gateway pairing](/gateway/pairing)).
- Gateway thực thi:
  - xác thực (token / keypair)
  - phạm vi/ACL (gateway không phải là proxy thô cho mọi phương thức)
  - giới hạn tốc độ

## Trách nhiệm theo thành phần

- **Gateway**: quảng bá beacon khám phá, quản lý quyết định ghép nối, và host endpoint WS.
- **Ứng dụng macOS**: giúp chọn gateway, hiển thị nhắc nhở ghép nối, và chỉ dùng SSH khi cần.
- **Node iOS/Android**: duyệt Bonjour để tiện lợi và kết nối với Gateway WS đã ghép nối.\n