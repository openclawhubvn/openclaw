---
summary: "Khám phá node và các phương thức truyền tải (Bonjour, Tailscale, SSH) để tìm gateway"
read_when:
  - Thực hiện hoặc thay đổi khám phá/quảng cáo Bonjour
  - Điều chỉnh chế độ kết nối từ xa (trực tiếp vs SSH)
  - Thiết kế khám phá node + ghép nối cho các node từ xa
title: "Khám phá và Phương thức truyền tải"
---

# Khám phá & Phương thức truyền tải

OpenClaw có hai vấn đề riêng biệt nhưng trông giống nhau:

1. **Điều khiển từ xa của người vận hành**: ứng dụng thanh menu macOS điều khiển một gateway chạy ở nơi khác.
2. **Ghép nối node**: iOS/Android (và các node trong tương lai) tìm một gateway và ghép nối an toàn.

Mục tiêu thiết kế là giữ tất cả việc khám phá/quảng cáo mạng trong **Node Gateway** (`openclaw gateway`) và giữ các client (ứng dụng mac, iOS) như là người tiêu thụ.

## Thuật ngữ

- **Gateway**: một tiến trình gateway chạy lâu dài, quản lý trạng thái (phiên, ghép nối, đăng ký node) và chạy các kênh. Hầu hết các thiết lập sử dụng một gateway cho mỗi máy chủ; có thể thiết lập nhiều gateway cô lập.
- **Gateway WS (mặt phẳng điều khiển)**: điểm cuối WebSocket trên `127.0.0.1:18789` mặc định; có thể được gán cho LAN/tailnet qua `gateway.bind`.
- **Phương thức WS trực tiếp**: một điểm cuối Gateway WS hướng LAN/tailnet (không có SSH).
- **Phương thức SSH (dự phòng)**: điều khiển từ xa bằng cách chuyển tiếp `127.0.0.1:18789` qua SSH.
- **Cầu nối TCP cũ (đã ngừng sử dụng/loại bỏ)**: phương thức node cũ (xem [Giao thức Bridge](/gateway/bridge-protocol)); không còn được quảng cáo để khám phá.

Chi tiết giao thức:

- [Giao thức Gateway](/gateway/protocol)
- [Giao thức Bridge (cũ)](/gateway/bridge-protocol)

## Tại sao giữ cả "trực tiếp" và SSH

- **WS trực tiếp** mang lại trải nghiệm người dùng tốt nhất trên cùng mạng và trong một tailnet:
  - tự động khám phá trên LAN qua Bonjour
  - token ghép nối + ACLs do gateway sở hữu
  - không cần truy cập shell; bề mặt giao thức có thể giữ chặt và có thể kiểm tra
- **SSH** vẫn là phương thức dự phòng phổ quát:
  - hoạt động ở bất kỳ đâu có truy cập SSH (ngay cả trên các mạng không liên quan)
  - vượt qua các vấn đề multicast/mDNS
  - không yêu cầu cổng vào mới ngoài SSH

## Đầu vào khám phá (cách các client biết vị trí gateway)

### 1) Bonjour / mDNS (chỉ LAN)

Bonjour là nỗ lực tốt nhất và không vượt qua các mạng. Chỉ được sử dụng cho sự tiện lợi "cùng LAN".

Hướng mục tiêu:

- **Gateway** quảng cáo điểm cuối WS của nó qua Bonjour.
- Các client duyệt và hiển thị danh sách "chọn một gateway", sau đó lưu trữ điểm cuối đã chọn.

Chi tiết khắc phục sự cố và beacon: [Bonjour](/gateway/bonjour).

#### Chi tiết beacon dịch vụ

- Loại dịch vụ:
  - `_openclaw-gw._tcp` (beacon truyền tải gateway)
- Khóa TXT (không bí mật):
  - `role=gateway`
  - `lanHost=<hostname>.local`
  - `sshPort=22` (hoặc bất kỳ cổng nào được quảng cáo)
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (chỉ khi TLS được bật)
  - `gatewayTlsSha256=<sha256>` (chỉ khi TLS được bật và có sẵn dấu vân tay)
  - `canvasPort=<port>` (cổng máy chủ canvas; hiện tại giống như `gatewayPort` khi máy chủ canvas được bật)
  - `cliPath=<path>` (tùy chọn; đường dẫn tuyệt đối đến một điểm vào hoặc nhị phân `openclaw` có thể chạy)
  - `tailnetDns=<magicdns>` (gợi ý tùy chọn; tự động phát hiện khi Tailscale có sẵn)

Ghi chú bảo mật:

- Bản ghi TXT Bonjour/mDNS **không được xác thực**. Các client phải coi giá trị TXT chỉ là gợi ý UX.
- Định tuyến (host/port) nên ưu tiên **điểm cuối dịch vụ đã giải quyết** (SRV + A/AAAA) hơn `lanHost`, `tailnetDns`, hoặc `gatewayPort` được cung cấp bởi TXT.
- Ghim TLS không bao giờ được phép cho phép một `gatewayTlsSha256` được quảng cáo ghi đè một ghim đã lưu trước đó.
- Các node iOS/Android nên coi các kết nối trực tiếp dựa trên khám phá là **chỉ TLS** và yêu cầu xác nhận "tin tưởng dấu vân tay này" rõ ràng trước khi lưu một ghim lần đầu (xác minh ngoài băng).

Vô hiệu hóa/ghi đè:

- `OPENCLAW_DISABLE_BONJOUR=1` vô hiệu hóa quảng cáo.
- `gateway.bind` trong `~/.openclaw/openclaw.json` kiểm soát chế độ bind Gateway.
- `OPENCLAW_SSH_PORT` ghi đè cổng SSH được quảng cáo trong TXT (mặc định là 22).
- `OPENCLAW_TAILNET_DNS` công bố một gợi ý `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` ghi đè đường dẫn CLI được quảng cáo.

### 2) Tailnet (xuyên mạng)

Đối với các thiết lập kiểu London/Vienna, Bonjour sẽ không giúp ích. Mục tiêu "trực tiếp" được khuyến nghị là:

- Tên MagicDNS của Tailscale (ưu tiên) hoặc một IP tailnet ổn định.

Nếu gateway có thể phát hiện nó đang chạy dưới Tailscale, nó sẽ công bố `tailnetDns` như một gợi ý tùy chọn cho các client (bao gồm cả beacon diện rộng).

### 3) Mục tiêu Thủ công / SSH

Khi không có tuyến đường trực tiếp (hoặc trực tiếp bị vô hiệu hóa), các client luôn có thể kết nối qua SSH bằng cách chuyển tiếp cổng gateway loopback.

Xem [Truy cập từ xa](/gateway/remote).

## Lựa chọn phương thức truyền tải (chính sách client)

Hành vi client được khuyến nghị:

1. Nếu một điểm cuối trực tiếp đã ghép nối được cấu hình và có thể truy cập, sử dụng nó.
2. Nếu Bonjour tìm thấy một gateway trên LAN, cung cấp lựa chọn "Sử dụng gateway này" chỉ với một lần nhấn và lưu nó làm điểm cuối trực tiếp.
3. Nếu một DNS/IP tailnet được cấu hình, thử trực tiếp.
4. Nếu không, quay lại SSH.

## Ghép nối + xác thực (phương thức trực tiếp)

Gateway là nguồn xác thực cho việc chấp nhận node/client.

- Yêu cầu ghép nối được tạo/phê duyệt/từ chối trong gateway (xem [Ghép nối Gateway](/gateway/pairing)).
- Gateway thực thi:
  - xác thực (token / cặp khóa)
  - phạm vi/ACLs (gateway không phải là proxy thô cho mọi phương thức)
  - giới hạn tốc độ

## Trách nhiệm theo thành phần

- **Gateway**: quảng cáo beacon khám phá, sở hữu quyết định ghép nối, và lưu trữ điểm cuối WS.
- **Ứng dụng macOS**: giúp chọn một gateway, hiển thị lời nhắc ghép nối, và chỉ sử dụng SSH như một phương thức dự phòng.
- **Node iOS/Android**: duyệt Bonjour như một tiện ích và kết nối với Gateway WS đã ghép nối.
