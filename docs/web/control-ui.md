---
summary: "Khám phá cách sử dụng giao diện điều khiển trên trình duyệt cho Gateway, bao gồm chat, nodes và cấu hình dễ dàng."
read_when:
  - Bạn muốn vận hành Gateway từ trình duyệt
  - Bạn muốn truy cập Tailnet mà không cần SSH tunnels
title: "Hướng Dẫn Sử Dụng Giao Diện Điều Khiển"
---

# Giao diện điều khiển (trình duyệt)

Giao diện điều khiển là một ứng dụng đơn trang nhỏ sử dụng **Vite + Lit** được Gateway phục vụ:

- mặc định: `http://<host>:18789/`
- tiền tố tùy chọn: thiết lập `gateway.controlUi.basePath` (ví dụ: `/openclaw`)

Nó kết nối **trực tiếp với Gateway WebSocket** trên cùng cổng.

## Mở nhanh (cục bộ)

Nếu Gateway đang chạy trên cùng máy tính, mở:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))

Nếu trang không tải được, hãy khởi động Gateway trước: `openclaw gateway`.

Xác thực được cung cấp trong quá trình bắt tay WebSocket qua:

- `connect.params.auth.token`
- `connect.params.auth.password`
  Bảng cài đặt dashboard giữ một token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu trữ.
  Quá trình onboarding tạo ra một token gateway mặc định, vì vậy hãy dán nó vào đây khi kết nối lần đầu.

## Ghép nối thiết bị (kết nối lần đầu)

Khi kết nối với Giao diện điều khiển từ một trình duyệt hoặc thiết bị mới, Gateway yêu cầu **phê duyệt ghép nối một lần** — ngay cả khi bạn đang trên cùng Tailnet với `gateway.auth.allowTailscale: true`. Đây là một biện pháp bảo mật để ngăn chặn truy cập trái phép.

**Bạn sẽ thấy:** "disconnected (1008): pairing required"

**Để phê duyệt thiết bị:**

```bash
# Liệt kê các yêu cầu đang chờ
openclaw devices list

# Phê duyệt theo ID yêu cầu
openclaw devices approve <requestId>
```

Nếu trình duyệt thử lại ghép nối với thông tin xác thực thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Khi đã được phê duyệt, thiết bị sẽ được ghi nhớ và không cần phê duyệt lại trừ khi bạn thu hồi nó với `openclaw devices revoke --device <id> --role <role>`. Xem [Devices CLI](/cli/devices) để biết về việc xoay vòng và thu hồi token.

**Lưu ý:**

- Kết nối cục bộ (`127.0.0.1`) được tự động phê duyệt.
- Kết nối từ xa (LAN, Tailnet, v.v.) yêu cầu phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo ra một ID thiết bị duy nhất, vì vậy chuyển đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép nối lại.

## Hỗ trợ ngôn ngữ

Giao diện điều khiển có thể tự động điều chỉnh ngôn ngữ dựa trên ngôn ngữ trình duyệt của bạn khi tải lần đầu, và bạn có thể thay đổi sau từ bộ chọn ngôn ngữ trong thẻ Truy cập.

- Ngôn ngữ hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`
- Các bản dịch không phải tiếng Anh được tải lười biếng trong trình duyệt.
- Ngôn ngữ đã chọn được lưu trong bộ nhớ trình duyệt và sử dụng lại trong các lần truy cập sau.
- Các khóa dịch thiếu sẽ quay về tiếng Anh.

## Những gì có thể làm (hiện tại)

- Chat với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Truyền tải cuộc gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Chat (sự kiện agent)
- Kênh: trạng thái WhatsApp/Telegram/Discord/Slack + kênh plugin (Mattermost, v.v.) + đăng nhập QR + cấu hình từng kênh (`channels.status`, `web.login.*`, `config.patch`)
- Phiên bản: danh sách hiện diện + làm mới (`system-presence`)
- Phiên: danh sách + ghi đè suy nghĩ/nhanh/chi tiết/lý luận cho từng phiên (`sessions.list`, `sessions.patch`)
- Công việc định kỳ: danh sách/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`)
- Kỹ năng: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`)
- Nodes: danh sách + khả năng (`node.list`)
- Phê duyệt thực thi: chỉnh sửa danh sách cho phép gateway hoặc node + hỏi chính sách cho `exec host=gateway/node` (`exec.approvals.*`)
- Cấu hình: xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Cấu hình: áp dụng + khởi động lại với xác thực (`config.apply`) và đánh thức phiên hoạt động cuối cùng
- Ghi cấu hình bao gồm bảo vệ base-hash để ngăn chặn ghi đè chỉnh sửa đồng thời
- Sơ đồ cấu hình + hiển thị biểu mẫu (`config.schema`, bao gồm sơ đồ plugin + kênh); Trình chỉnh sửa JSON thô vẫn có sẵn
- Gỡ lỗi: trạng thái/sức khỏe/mô hình snapshot + nhật ký sự kiện + cuộc gọi RPC thủ công (`status`, `health`, `models.list`)
- Nhật ký: theo dõi trực tiếp nhật ký file gateway với bộ lọc/xuất (`logs.tail`)
- Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) với báo cáo khởi động lại

Ghi chú bảng công việc định kỳ:

- Đối với công việc cô lập, mặc định giao hàng là thông báo tóm tắt. Bạn có thể chuyển sang không nếu muốn chỉ chạy nội bộ.
- Các trường kênh/mục tiêu xuất hiện khi chọn thông báo.
- Chế độ webhook sử dụng `delivery.mode = "webhook"` với `delivery.to` được đặt thành một URL webhook HTTP(S) hợp lệ.
- Đối với công việc phiên chính, các chế độ giao hàng webhook và không có sẵn.
- Các điều khiển chỉnh sửa nâng cao bao gồm xóa sau khi chạy, xóa ghi đè agent, tùy chọn cron chính xác/ngẫu nhiên, ghi đè mô hình/suy nghĩ agent, và chuyển đổi giao hàng nỗ lực tốt nhất.
- Xác thực biểu mẫu là nội tuyến với lỗi cấp trường; các giá trị không hợp lệ vô hiệu hóa nút lưu cho đến khi được sửa.
- Đặt `cron.webhookToken` để gửi một token bearer chuyên dụng, nếu không có thì webhook được gửi mà không có tiêu đề xác thực.
- Phương pháp dự phòng không còn được hỗ trợ: các công việc cũ được lưu trữ với `notify: true` vẫn có thể sử dụng `cron.webhook` cho đến khi được di chuyển.

## Hành vi chat

- `chat.send` là **không chặn**: nó xác nhận ngay lập tức với `{ runId, status: "started" }` và phản hồi được truyền qua các sự kiện `chat`.
- Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn thành.
- Phản hồi `chat.history` bị giới hạn kích thước để đảm bảo an toàn cho giao diện. Khi các mục nhập bản ghi quá lớn, Gateway có thể cắt bớt các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay thế các tin nhắn quá lớn bằng một chỗ trống (`[chat.history omitted: message too large]`).
- `chat.inject` thêm một ghi chú trợ lý vào bản ghi phiên và phát một sự kiện `chat` để cập nhật chỉ trên giao diện (không chạy agent, không giao hàng kênh).
- Dừng:
  - Nhấp **Dừng** (gọi `chat.abort`)
  - Gõ `/stop` (hoặc các cụm từ dừng độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để dừng ngoài băng
  - `chat.abort` hỗ trợ `{ sessionKey }` (không `runId`) để dừng tất cả các lần chạy đang hoạt động cho phiên đó
- Giữ lại một phần khi dừng:
  - Khi một lần chạy bị dừng, văn bản trợ lý một phần vẫn có thể được hiển thị trong giao diện
  - Gateway lưu trữ văn bản trợ lý một phần bị dừng vào lịch sử bản ghi khi có đầu ra được đệm
  - Các mục nhập được lưu trữ bao gồm siêu dữ liệu dừng để người tiêu dùng bản ghi có thể phân biệt giữa các phần dừng và đầu ra hoàn thành bình thường

## Truy cập Tailnet (khuyến nghị)

### Tích hợp Tailscale Serve (ưu tiên)

Giữ Gateway trên loopback và để Tailscale Serve proxy nó với HTTPS:

```bash
openclaw gateway --tailscale serve
```

Mở:

- `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

Theo mặc định, các yêu cầu Control UI/WebSocket Serve có thể xác thực qua tiêu đề nhận dạng Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh nhận dạng bằng cách giải quyết địa chỉ `x-forwarded-for` với `tailscale whois` và khớp nó với tiêu đề, và chỉ chấp nhận những yêu cầu này khi yêu cầu đến loopback với các tiêu đề `x-forwarded-*` của Tailscale. Đặt `gateway.auth.allowTailscale: false` (hoặc buộc `gateway.auth.mode: "password"`) nếu bạn muốn yêu cầu token/mật khẩu ngay cả cho lưu lượng Serve.
Xác thực Serve không cần token giả định rằng máy chủ gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin có thể chạy trên máy chủ đó, yêu cầu xác thực token/mật khẩu.

### Kết nối với tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Sau đó mở:

- `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

Dán token vào cài đặt giao diện (gửi dưới dạng `connect.params.auth.token`).

## HTTP không an toàn

Nếu bạn mở dashboard qua HTTP thông thường (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt sẽ chạy trong **ngữ cảnh không an toàn** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** các kết nối Control UI không có nhận dạng thiết bị.

**Khuyến nghị sửa lỗi:** sử dụng HTTPS (Tailscale Serve) hoặc mở giao diện cục bộ:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (trên máy chủ gateway)

**Hành vi chuyển đổi xác thực không an toàn:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` chỉ là một chuyển đổi tương thích cục bộ:

- Nó cho phép các phiên Control UI localhost tiếp tục mà không cần nhận dạng thiết bị trong ngữ cảnh HTTP không an toàn.
- Nó không bỏ qua các kiểm tra ghép nối.
- Nó không nới lỏng yêu cầu nhận dạng thiết bị từ xa (không phải localhost).

**Chỉ sử dụng trong trường hợp khẩn cấp:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` vô hiệu hóa các kiểm tra nhận dạng thiết bị Control UI và là một sự hạ cấp bảo mật nghiêm trọng. Nhanh chóng hoàn nguyên sau khi sử dụng khẩn cấp.

Xem [Tailscale](/gateway/tailscale) để được hướng dẫn thiết lập HTTPS.

## Xây dựng giao diện

Gateway phục vụ các file tĩnh từ `dist/control-ui`. Xây dựng chúng với:

```bash
pnpm ui:build # tự động cài đặt các phụ thuộc UI lần đầu chạy
```

Cơ sở tuyệt đối tùy chọn (khi bạn muốn URL tài sản cố định):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Đối với phát triển cục bộ (máy chủ dev riêng biệt):

```bash
pnpm ui:dev # tự động cài đặt các phụ thuộc UI lần đầu chạy
```

Sau đó chỉ định URL Gateway WS của bạn cho giao diện (ví dụ: `ws://127.0.0.1:18789`).

## Gỡ lỗi/kiểm tra: máy chủ dev + Gateway từ xa

Giao diện điều khiển là các file tĩnh; mục tiêu WebSocket có thể cấu hình và có thể khác với nguồn gốc HTTP. Điều này hữu ích khi bạn muốn máy chủ dev Vite cục bộ nhưng Gateway chạy ở nơi khác.

1. Khởi động máy chủ dev giao diện: `pnpm ui:dev`
2. Mở một URL như:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Xác thực một lần tùy chọn (nếu cần):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Ghi chú:

- `gatewayUrl` được lưu trữ trong localStorage sau khi tải và bị xóa khỏi URL.
- `token` nên được truyền qua đoạn URL (`#token=...`) bất cứ khi nào có thể. Đoạn URL không được gửi đến máy chủ, điều này tránh rò rỉ nhật ký yêu cầu và Referer. Các tham số truy vấn `?token=` cũ vẫn được nhập một lần để tương thích, nhưng chỉ là phương pháp dự phòng, và bị loại bỏ ngay sau khi khởi động.
- `password` chỉ được giữ trong bộ nhớ.
- Khi `gatewayUrl` được đặt, giao diện không quay về cấu hình hoặc thông tin xác thực môi trường.
  Cung cấp `token` (hoặc `password`) rõ ràng. Thiếu thông tin xác thực rõ ràng là một lỗi.
- Sử dụng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
- `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn chặn clickjacking.
- Các triển khai Control UI không phải loopback phải đặt `gateway.controlUi.allowedOrigins`
  rõ ràng (các nguồn đầy đủ). Điều này bao gồm các thiết lập dev từ xa.
- Không sử dụng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ cho thử nghiệm cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép bất kỳ nguồn gốc trình duyệt nào, không phải “khớp với bất kỳ máy chủ nào tôi đang sử dụng.”
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` kích hoạt
  chế độ dự phòng nguồn gốc tiêu đề Host, nhưng đây là một chế độ bảo mật nguy hiểm.

Ví dụ:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Chi tiết thiết lập truy cập từ xa: [Truy cập từ xa](/gateway/remote).
