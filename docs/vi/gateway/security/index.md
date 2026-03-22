---
summary: "Các lưu ý về bảo mật và mô hình đe dọa khi chạy một AI gateway với quyền truy cập shell"
read_when:
  - Thêm tính năng mở rộng quyền truy cập hoặc tự động hóa
title: "Bảo mật"
---

# Bảo mật

> [!WARNING]
> **Mô hình tin cậy trợ lý cá nhân:** hướng dẫn này giả định một ranh giới người vận hành tin cậy cho mỗi gateway (mô hình trợ lý cá nhân/người dùng đơn).
> OpenClaw **không** phải là một ranh giới bảo mật đa người thuê thù địch cho nhiều người dùng đối kháng chia sẻ một agent/gateway.
> Nếu cần hoạt động với người dùng có độ tin cậy hỗn hợp hoặc đối kháng, hãy tách ranh giới tin cậy (gateway + thông tin đăng nhập riêng biệt, lý tưởng là người dùng/hệ điều hành riêng biệt).

## Phạm vi đầu tiên: mô hình bảo mật trợ lý cá nhân

Hướng dẫn bảo mật của OpenClaw giả định một triển khai **trợ lý cá nhân**: một ranh giới người vận hành tin cậy, có thể có nhiều agent.

- Tư thế bảo mật được hỗ trợ: một người dùng/ranh giới tin cậy cho mỗi gateway (ưu tiên một người dùng/hệ điều hành/máy chủ ảo cho mỗi ranh giới).
- Không phải là ranh giới bảo mật được hỗ trợ: một gateway/agent chia sẻ được sử dụng bởi những người dùng không tin cậy hoặc đối kháng.
- Nếu cần cách ly người dùng đối kháng, hãy tách theo ranh giới tin cậy (gateway + thông tin đăng nhập riêng biệt, lý tưởng là người dùng/hệ điều hành riêng biệt).
- Nếu nhiều người dùng không tin cậy có thể nhắn tin cho một agent có công cụ, hãy coi họ như chia sẻ cùng một quyền công cụ được ủy quyền cho agent đó.

Trang này giải thích cách tăng cường bảo mật **trong mô hình đó**. Nó không tuyên bố cách ly đa người thuê thù địch trên một gateway chia sẻ.

## Kiểm tra nhanh: `openclaw security audit`

Xem thêm: [Xác minh chính thức (Mô hình bảo mật)](/security/formal-verification)

Chạy thường xuyên (đặc biệt sau khi thay đổi cấu hình hoặc mở rộng bề mặt mạng):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

Nó sẽ cảnh báo các vấn đề phổ biến (lộ thông tin xác thực Gateway, lộ quyền kiểm soát trình duyệt, danh sách cho phép nâng cao, quyền truy cập hệ thống tệp).

OpenClaw vừa là sản phẩm vừa là thử nghiệm: bạn đang kết nối hành vi mô hình tiên tiến vào các bề mặt nhắn tin thực và công cụ thực. **Không có thiết lập nào là "hoàn toàn an toàn".** Mục tiêu là cẩn thận về:

- ai có thể nói chuyện với bot của bạn
- nơi bot được phép hành động
- những gì bot có thể chạm vào

Bắt đầu với quyền truy cập nhỏ nhất có thể hoạt động, sau đó mở rộng khi bạn cảm thấy tự tin hơn.

## Giả định triển khai (quan trọng)

OpenClaw giả định rằng máy chủ và ranh giới cấu hình được tin cậy:

- Nếu ai đó có thể sửa đổi trạng thái/cấu hình máy chủ Gateway (`~/.openclaw`, bao gồm `openclaw.json`), hãy coi họ như một người vận hành tin cậy.
- Chạy một Gateway cho nhiều người vận hành không tin cậy/đối kháng là **không được khuyến nghị**.
- Đối với các nhóm có độ tin cậy hỗn hợp, hãy tách ranh giới tin cậy với các gateway riêng biệt (hoặc ít nhất là người dùng/hệ điều hành riêng biệt).
- OpenClaw có thể chạy nhiều instance gateway trên một máy, nhưng các hoạt động được khuyến nghị ưu tiên tách biệt ranh giới tin cậy rõ ràng.
- Mặc định được khuyến nghị: một người dùng cho mỗi máy/máy chủ (hoặc VPS), một gateway cho người dùng đó, và một hoặc nhiều agent trong gateway đó.
- Nếu nhiều người dùng muốn sử dụng OpenClaw, hãy sử dụng một VPS/máy chủ cho mỗi người dùng.

### Hậu quả thực tế (ranh giới tin cậy người vận hành)

Trong một instance Gateway, quyền truy cập người vận hành đã xác thực là vai trò mặt phẳng điều khiển tin cậy, không phải vai trò người thuê theo người dùng.

- Người vận hành có quyền truy cập đọc/mặt phẳng điều khiển có thể kiểm tra metadata/lịch sử phiên gateway theo thiết kế.
- Các định danh phiên (`sessionKey`, ID phiên, nhãn) là các bộ chọn định tuyến, không phải là token ủy quyền.
- Ví dụ: mong đợi cách ly theo người vận hành cho các phương thức như `sessions.list`, `sessions.preview`, hoặc `chat.history` nằm ngoài mô hình này.
- Nếu cần cách ly người dùng đối kháng, hãy chạy các gateway riêng biệt cho mỗi ranh giới tin cậy.
- Nhiều gateway trên một máy là khả thi về mặt kỹ thuật, nhưng không phải là cơ sở khuyến nghị cho cách ly đa người dùng.

## Mô hình trợ lý cá nhân (không phải bus đa người thuê)

OpenClaw được thiết kế như một mô hình bảo mật trợ lý cá nhân: một ranh giới người vận hành tin cậy, có thể có nhiều agent.

- Nếu nhiều người có thể nhắn tin cho một agent có công cụ, mỗi người trong số họ có thể điều khiển cùng một tập quyền.
- Cách ly phiên/bộ nhớ theo người dùng giúp bảo mật quyền riêng tư, nhưng không chuyển đổi một agent chia sẻ thành ủy quyền máy chủ theo người dùng.
- Nếu người dùng có thể đối kháng với nhau, hãy chạy các gateway riêng biệt (hoặc người dùng/hệ điều hành riêng biệt) cho mỗi ranh giới tin cậy.

### Không gian làm việc Slack chia sẻ: rủi ro thực tế

Nếu "mọi người trong Slack có thể nhắn tin cho bot," rủi ro cốt lõi là quyền công cụ được ủy quyền:

- bất kỳ người gửi nào được phép có thể kích hoạt các cuộc gọi công cụ (`exec`, trình duyệt, công cụ mạng/tệp) trong chính sách của agent;
- tiêm nội dung/lời nhắc từ một người gửi có thể gây ra các hành động ảnh hưởng đến trạng thái, thiết bị hoặc đầu ra chia sẻ;
- nếu một agent chia sẻ có thông tin đăng nhập/tệp nhạy cảm, bất kỳ người gửi nào được phép có thể tiềm ẩn dẫn đến rò rỉ thông qua việc sử dụng công cụ.

Sử dụng các agent/gateway riêng biệt với công cụ tối thiểu cho quy trình làm việc nhóm; giữ các agent dữ liệu cá nhân riêng tư.

### Agent chia sẻ công ty: mô hình chấp nhận được

Điều này chấp nhận được khi mọi người sử dụng agent đó đều nằm trong cùng một ranh giới tin cậy (ví dụ một nhóm công ty) và agent chỉ giới hạn trong phạm vi công việc.

- chạy nó trên một máy/VM/container chuyên dụng;
- sử dụng một người dùng hệ điều hành + trình duyệt/hồ sơ/tài khoản chuyên dụng cho runtime đó;
- không đăng nhập runtime đó vào tài khoản Apple/Google cá nhân hoặc hồ sơ trình duyệt/quản lý mật khẩu cá nhân.

Nếu bạn trộn lẫn danh tính cá nhân và công ty trên cùng một runtime, bạn sẽ làm sụp đổ sự tách biệt và tăng nguy cơ lộ dữ liệu cá nhân.

## Khái niệm tin cậy Gateway và node

Xem Gateway và node như một miền tin cậy người vận hành, với các vai trò khác nhau:

- **Gateway** là mặt phẳng điều khiển và bề mặt chính sách (`gateway.auth`, chính sách công cụ, định tuyến).
- **Node** là bề mặt thực thi từ xa được ghép nối với Gateway đó (lệnh, hành động thiết bị, khả năng cục bộ máy chủ).
- Một người gọi được xác thực với Gateway được tin cậy ở phạm vi Gateway. Sau khi ghép nối, các hành động node được coi là hành động của người vận hành tin cậy trên node đó.
- `sessionKey` là lựa chọn định tuyến/ngữ cảnh, không phải là ủy quyền theo người dùng.
- Phê duyệt thực thi (danh sách cho phép + hỏi) là các rào cản cho ý định của người vận hành, không phải là cách ly đa người thuê thù địch.
- Phê duyệt thực thi ràng buộc ngữ cảnh yêu cầu chính xác và nỗ lực tốt nhất cho các toán tử tệp cục bộ trực tiếp; chúng không mô hình hóa ngữ nghĩa mọi đường dẫn tải runtime/trình thông dịch. Sử dụng sandboxing và cách ly máy chủ cho các ranh giới mạnh.

Nếu cần cách ly người dùng thù địch, hãy tách ranh giới tin cậy theo người dùng/hệ điều hành và chạy các gateway riêng biệt.

## Ma trận ranh giới tin cậy

Sử dụng điều này như mô hình nhanh khi phân loại rủi ro:

| Ranh giới hoặc kiểm soát                         | Ý nghĩa                                         | Hiểu sai phổ biến                                                                |
| ------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/mật khẩu/xác thực thiết bị) | Xác thực người gọi tới API gateway             | "Cần chữ ký trên mỗi khung tin nhắn để an toàn"                    |
| `sessionKey`                                | Khóa định tuyến cho lựa chọn ngữ cảnh/phiên         | "Khóa phiên là ranh giới ủy quyền người dùng"                                         |
| Rào cản nội dung/lời nhắc                   | Giảm rủi ro lạm dụng mô hình                           | "Chỉ tiêm lời nhắc đã chứng minh vượt qua ủy quyền"                                   |
| `canvas.eval` / đánh giá trình duyệt            | Khả năng của người vận hành có chủ ý khi được kích hoạt      | "Bất kỳ nguyên thủy đánh giá JS nào cũng tự động là một lỗ hổng trong mô hình tin cậy này"           |
| TUI cục bộ `!` shell                         | Thực thi cục bộ do người vận hành kích hoạt       | "Lệnh tiện lợi shell cục bộ là tiêm từ xa"                         |
| Ghép nối node và lệnh node              | Thực thi từ xa cấp độ người vận hành trên các thiết bị được ghép nối | "Kiểm soát thiết bị từ xa nên được coi là truy cập người dùng không tin cậy theo mặc định" |

## Không phải là lỗ hổng theo thiết kế

Những mẫu này thường được báo cáo và thường được đóng lại mà không có hành động trừ khi có một sự vượt qua ranh giới thực sự được chỉ ra:

- Chuỗi chỉ tiêm lời nhắc mà không có sự vượt qua chính sách/ủy quyền/sandbox.
- Các tuyên bố giả định hoạt động đa người thuê thù địch trên một máy chủ/cấu hình chia sẻ.
- Các tuyên bố phân loại truy cập đường đọc thông thường của người vận hành (ví dụ `sessions.list`/`sessions.preview`/`chat.history`) là IDOR trong thiết lập gateway chia sẻ.
- Các phát hiện triển khai chỉ localhost (ví dụ HSTS trên gateway chỉ vòng lặp).
- Các phát hiện chữ ký webhook inbound Discord cho các đường dẫn inbound không tồn tại trong repo này.
- Các phát hiện "Thiếu ủy quyền theo người dùng" coi `sessionKey` là một token ủy quyền.

## Danh sách kiểm tra trước khi mở báo cáo

Trước khi mở một GHSA, hãy xác minh tất cả những điều này:

1. Tái tạo vẫn hoạt động trên `main` mới nhất hoặc bản phát hành mới nhất.
2. Báo cáo bao gồm đường dẫn mã chính xác (`file`, function, line range) và phiên bản/commit đã thử nghiệm.
3. Tác động vượt qua một ranh giới tin cậy đã được tài liệu hóa (không chỉ là tiêm lời nhắc).
4. Tuyên bố không được liệt kê trong [Ngoài phạm vi](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope).
5. Các khuyến cáo hiện có đã được kiểm tra để tránh trùng lặp (sử dụng GHSA chính thức khi có thể).
6. Giả định triển khai là rõ ràng (vòng lặp/cục bộ so với phơi bày, người vận hành tin cậy so với không tin cậy).

## Cơ sở bảo mật được tăng cường trong 60 giây

Sử dụng cơ sở này trước, sau đó chọn lọc bật lại công cụ cho mỗi agent tin cậy:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "thay-bằng-token-ngẫu-nhiên-dài" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

Điều này giữ Gateway chỉ cục bộ, cô lập DMs, và vô hiệu hóa công cụ mặt phẳng điều khiển/runtime theo mặc định.

## Quy tắc nhanh cho hộp thư chung

Nếu nhiều người có thể nhắn tin cho bot của bạn:

- Đặt `session.dmScope: "per-channel-peer"` (hoặc `"per-account-channel-peer"` cho các kênh nhiều tài khoản).
- Giữ `dmPolicy: "pairing"` hoặc danh sách cho phép nghiêm ngặt.
- Không bao giờ kết hợp DMs chia sẻ với quyền truy cập công cụ rộng.
- Điều này tăng cường hộp thư chung/hợp tác, nhưng không được thiết kế như cách ly đồng thuê thù địch khi người dùng chia sẻ quyền ghi cấu hình/máy chủ.

### Những gì kiểm tra bảo mật (cấp cao)

- **Truy cập inbound** (chính sách DM, chính sách nhóm, danh sách cho phép): người lạ có thể kích hoạt bot không?
- **Phạm vi công cụ** (công cụ nâng cao + phòng mở): liệu tiêm lời nhắc có thể biến thành hành động shell/tệp/mạng không?
- **Phơi bày mạng** (Gateway bind/auth, Tailscale Serve/Funnel, token auth yếu/ngắn).
- **Phơi bày kiểm soát trình duyệt** (node từ xa, cổng chuyển tiếp, điểm cuối CDP từ xa).
- **Vệ sinh đĩa cục bộ** (quyền, liên kết tượng trưng, bao gồm cấu hình, đường dẫn "thư mục đồng bộ").
- **Plugins** (tiện ích mở rộng tồn tại mà không có danh sách cho phép rõ ràng).
- **Drift chính sách/cấu hình sai** (cài đặt docker sandbox được cấu hình nhưng chế độ sandbox tắt; mẫu `gateway.nodes.denyCommands` không hiệu quả vì khớp chỉ là tên lệnh chính xác (ví dụ `system.run`) và không kiểm tra văn bản shell; mục `gateway.nodes.allowCommands` nguy hiểm; `tools.profile="minimal"` toàn cầu bị ghi đè bởi hồ sơ theo agent; công cụ plugin tiện ích mở rộng có thể truy cập dưới chính sách công cụ cho phép).
- **Drift kỳ vọng runtime** (ví dụ `tools.exec.host="sandbox"` trong khi chế độ sandbox tắt, điều này chạy trực tiếp trên máy chủ gateway).
- **Vệ sinh mô hình** (cảnh báo khi các mô hình được cấu hình trông cũ; không phải là một chặn cứng).

Nếu bạn chạy `--deep`, OpenClaw cũng cố gắng thăm dò Gateway trực tiếp tốt nhất có thể.

## Bản đồ lưu trữ thông tin đăng nhập

Sử dụng điều này khi kiểm tra truy cập hoặc quyết định những gì cần sao lưu:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env hoặc `channels.telegram.tokenFile` (chỉ tệp thông thường; liên kết tượng trưng bị từ chối)
- **Discord bot token**: config/env hoặc SecretRef (nhà cung cấp env/tệp/exec)
- **Slack tokens**: config/env (`channels.slack.*`)
- **Danh sách cho phép ghép nối**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (tài khoản mặc định)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (tài khoản không mặc định)
- **Hồ sơ xác thực mô hình**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload bí mật dựa trên tệp (tùy chọn)**: `~/.openclaw/secrets.json`
- **Nhập OAuth cũ**: `~/.openclaw/credentials/oauth.json`

## Danh sách kiểm tra kiểm toán bảo mật

Khi kiểm toán in ra các phát hiện, hãy coi đây là thứ tự ưu tiên:

1. **Bất kỳ thứ gì "mở" + công cụ được bật**: khóa DMs/nhóm trước (ghép nối/danh sách cho phép), sau đó thắt chặt chính sách công cụ/sandboxing.
2. **Phơi bày mạng công cộng** (LAN bind, Funnel, thiếu auth): sửa ngay lập tức.
3. **Phơi bày kiểm soát trình duyệt từ xa**: coi nó như truy cập người vận hành (chỉ tailnet, ghép nối node có chủ ý, tránh phơi bày công khai).
4. **Quyền**: đảm bảo trạng thái/cấu hình/thông tin đăng nhập/xác thực không thể đọc được bởi nhóm/thế giới.
5. **Plugins/tiện ích mở rộng**: chỉ tải những gì bạn tin tưởng rõ ràng.
6. **Lựa chọn mô hình**: ưu tiên các mô hình hiện đại, được tăng cường hướng dẫn cho bất kỳ bot nào có công cụ.

## Thuật ngữ kiểm toán bảo mật

Các giá trị `checkId` có tín hiệu cao mà bạn có thể thấy trong các triển khai thực tế (không đầy đủ):

| `checkId`                                          | Mức độ nghiêm trọng      | Tại sao nó quan trọng                                                                       | Khóa/đường dẫn sửa chính                                                                              | Tự động sửa |
| -------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | -------- |
| `fs.state_dir.perms_world_writable`                | nghiêm trọng      | Người dùng/quá trình khác có thể sửa đổi toàn bộ trạng thái OpenClaw                                 | quyền hệ thống tệp trên `~/.openclaw`                                                                 | có      |
| `fs.config.perms_writable`                         | nghiêm trọng      | Người khác có thể thay đổi chính sách/cấu hình công cụ/ủy quyền                                            | quyền hệ thống tệp trên `~/.openclaw/openclaw.json`                                                   | có      |
| `fs.config.perms_world_readable`                   | nghiêm trọng      | Cấu hình có thể lộ token/cài đặt                                                    | quyền hệ thống tệp trên tệp cấu hình                                                                   | có      |
| `gateway.bind_no_auth`                             | nghiêm trọng      | Kết nối từ xa mà không có bí mật chia sẻ                                                    | `gateway.bind`, `gateway.auth.*`                                                                  | không       |
| `gateway.loopback_no_auth`                         | nghiêm trọng      | Vòng lặp ngược proxy có thể trở thành không xác thực                                  | `gateway.auth.*`, cài đặt proxy                                                                     | không       |
| `gateway.http.no_auth`                             | cảnh báo/nghiêm trọng | API HTTP Gateway có thể truy cập với `auth.mode="none"`                                  | `gateway.auth.mode`, `gateway.http.endpoints.*`                                                   | không       |
| `gateway.tools_invoke_http.dangerous_allow`        | cảnh báo/nghiêm trọng | Cho phép lại các công cụ nguy hiểm qua API HTTP                                             | `gateway.tools.allow`                                                                             | không       |
| `gateway.nodes.allow_commands_dangerous`           | cảnh báo/nghiêm trọng | Cho phép các lệnh node có tác động cao (camera/màn hình/danh bạ/lịch/SMS)              | `gateway.nodes.allowCommands`                                                                     | không       |
| `gateway.tailscale_funnel`                         | nghiêm trọng      | Phơi bày internet công cộng                                                             | `gateway.tailscale.mode`                                                                          | không       |
| `gateway.control_ui.allowed_origins_required`      | nghiêm trọng      | Giao diện điều khiển không phải vòng lặp mà không có danh sách cho phép nguồn trình duyệt rõ ràng                    | `gateway.controlUi.allowedOrigins`                                                                | không       |
| `gateway.control_ui.host_header_origin_fallback`   | cảnh báo/nghiêm trọng | Cho phép dự phòng nguồn tiêu đề máy chủ (giảm cứng DNS rebinding)              | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`                                      | không       |
| `gateway.control_ui.insecure_auth`                 | cảnh báo          | Bật chế độ tương thích xác thực không an toàn                                           | `gateway.controlUi.allowInsecureAuth`                                                             | không       |
| `gateway.control_ui.device_auth_disabled`          | nghiêm trọng      | Vô hiệu hóa kiểm tra danh tính thiết bị                                                       | `gateway.controlUi.dangerouslyDisableDeviceAuth`                                                  | không       |
| `gateway.real_ip_fallback_enabled`                 | cảnh báo/nghiêm trọng | Tin tưởng dự phòng `X-Real-IP` có thể cho phép giả mạo IP nguồn qua cấu hình sai proxy      | `gateway.allowRealIpFallback`, `gateway.trustedProxies`                                           | không       |
| `discovery.mdns_full_mode`                         | cảnh báo/nghiêm trọng | Chế độ mDNS đầy đủ quảng cáo metadata `cliPath`/`sshPort` trên mạng cục bộ              | `discovery.mdns.mode`, `gateway.bind`                                                             | không       |
| `config.insecure_or_dangerous_flags`               | cảnh báo          | Bật bất kỳ cờ gỡ lỗi không an toàn/nguy hiểm nào                                           | nhiều khóa (xem chi tiết phát hiện)                                                                | không       |
| `hooks.token_reuse_gateway_token`                  | nghiêm trọng      | Token ingress hook cũng mở khóa xác thực Gateway                                         | `hooks.token`, `gateway.auth.token`                                                               | không       |
| `hooks.token_too_short`                            | cảnh báo          | Dễ dàng brute force trên ingress hook                                                   | `hooks.token`                                                                                     | không       |
| `hooks.default_session_key_unset`                  | cảnh báo          | Agent hook chạy fan out vào các phiên được tạo ra cho mỗi yêu cầu                          | `hooks.defaultSessionKey`                                                                         | không       |
| `hooks.allowed_agent_ids_unrestricted`             | cảnh báo/nghiêm trọng | Người gọi hook đã xác thực có thể định tuyến đến bất kỳ agent nào được cấu hình                         | `hooks.allowedAgentIds`                                                                           | không       |
| `hooks.request_session_key_enabled`                | cảnh báo/nghiêm trọng | Người gọi bên ngoài có thể chọn sessionKey                                                | `hooks.allowRequestSessionKey`                                                                    | không       |
| `hooks.request_session_key_prefixes_missing`       | cảnh báo/nghiêm trọng | Không có ràng buộc về hình dạng khóa phiên bên ngoài                                              | `hooks.allowedSessionKeyPrefixes`                                                                 | không       |
| `logging.redact_off`                               | cảnh báo          | Các giá trị nhạy cảm rò rỉ vào nhật ký/trạng thái                                                 | `logging.redactSensitive`                                                                         | có      |
| `sandbox.docker_config_mode_off`                   | cảnh báo          | Cấu hình Docker sandbox có mặt nhưng không hoạt động                                           | `agents.*.sandbox.mode`                                                                           | không       |
| `sandbox.dangerous_network_mode`                   | nghiêm trọng      | Mạng Docker sandbox sử dụng chế độ namespace-join `host` hoặc `container:*`              | `agents.*.sandbox.docker.network`                                                                 | không       |
| `tools.exec.host_sandbox_no_sandbox_defaults`      | cảnh báo          | `exec host=sandbox` giải quyết thành exec host khi sandbox tắt                        | `tools.exec.host`, `agents.defaults.sandbox.mode`                                                 | không       |
| `tools.exec.host_sandbox_no_sandbox_agents`        | cảnh báo          | `exec host=sandbox` theo agent giải quyết thành exec host khi sandbox tắt              | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode`                                     | không       |
| `tools.exec.safe_bins_interpreter_unprofiled`      | cảnh báo          | Các bin trình thông dịch/runtime trong `safeBins` mà không có hồ sơ rõ ràng mở rộng rủi ro exec   | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*`                 | không       |
| `skills.workspace.symlink_escape`                  | cảnh báo          | `skills/**/SKILL.md` trong không gian làm việc giải quyết ngoài gốc không gian làm việc (drift chuỗi liên kết tượng trưng) | trạng thái hệ thống tệp `skills/**`                                                            | không       |
| `security.exposure.open_groups_with_elevated`      | nghiêm trọng      | Nhóm mở + công cụ nâng cao tạo ra các đường dẫn tiêm lời nhắc có tác động cao               | `channels.*.groupPolicy`, `tools.elevated.*`                                                      | không       |
| `security.exposure.open_groups_with_runtime_or_fs` | nghiêm trọng/cảnh báo | Nhóm mở có thể truy cập công cụ lệnh/tệp mà không có bảo vệ sandbox/không gian làm việc            | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode` | không       |
| `security.trust_model.multi_user_heuristic`        | cảnh báo          | Cấu hình trông đa người dùng trong khi mô hình tin cậy gateway là trợ lý cá nhân              | tách ranh giới tin cậy, hoặc tăng cường người dùng chia sẻ (`sandbox.mode`, công cụ deny/phạm vi không gian làm việc)    | không       |
| `tools.profile_minimal_overridden`                 | cảnh báo          | Agent ghi đè bỏ qua hồ sơ tối thiểu toàn cầu                                        | `agents.list[].tools.profile`                                                                     | không       |
| `plugins.tools_reachable_permissive_policy`        | cảnh báo          | Công cụ tiện ích mở rộng có thể truy cập trong các ngữ cảnh cho phép                                     | `tools.profile` + công cụ cho phép/deny                                                                 | không       |
| `models.small_params`                              | nghiêm trọng/thông tin | Các mô hình nhỏ + bề mặt công cụ không an toàn tăng rủi ro tiêm                             | lựa chọn mô hình + chính sách sandbox/công cụ                                                                | không       |

## Giao diện điều khiển qua HTTP

Giao diện điều khiển cần một **ngữ cảnh an toàn** (HTTPS hoặc localhost) để tạo danh tính thiết bị. `gateway.controlUi.allowInsecureAuth` là một công tắc tương thích cục bộ:

- Trên localhost, nó cho phép xác thực giao diện điều khiển mà không cần danh tính thiết bị khi trang được tải qua HTTP không an toàn.
- Nó không vượt qua kiểm tra ghép nối.
- Nó không nới lỏng yêu cầu danh tính thiết bị từ xa (không phải localhost).

Ưu tiên HTTPS (Tailscale Serve) hoặc mở giao diện điều khiển trên `127.0.0.1`.

Chỉ cho các tình huống khẩn cấp, `gateway.controlUi.dangerouslyDisableDeviceAuth` vô hiệu hóa hoàn toàn kiểm tra danh tính thiết bị. Đây là một sự hạ cấp bảo mật nghiêm trọng; giữ nó tắt trừ khi bạn đang gỡ lỗi và có thể khôi phục nhanh chóng.

`openclaw security audit` cảnh báo khi cài đặt này được bật.

## Tóm tắt cờ không an toàn hoặc nguy hiểm

`openclaw security audit` bao gồm `config.insecure_or_dangerous_flags` khi các công tắc gỡ lỗi không an toàn/nguy hiểm đã biết được bật. Kiểm tra đó hiện tổng hợp:

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`

Các khóa cấu hình `dangerous*` / `dangerously*` đầy đủ được định nghĩa trong schema cấu hình OpenClaw:

- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
- `gateway.controlUi.dangerouslyDisableDeviceAuth`
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `channels.discord.dangerouslyAllowNameMatching`
- `channels.discord.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.slack.dangerouslyAllowNameMatching`
- `channels.slack.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.googlechat.dangerouslyAllowNameMatching`
- `channels.googlechat.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.msteams.dangerouslyAllowNameMatching`
- `channels.zalouser.dangerouslyAllowNameMatching` (kênh tiện ích mở rộng)
- `channels.irc.dangerouslyAllowNameMatching` (kênh tiện ích mở rộng)
- `channels.irc.accounts.<accountId>.dangerouslyAllowNameMatching` (kênh tiện ích mở rộng)
- `channels.mattermost.dangerouslyAllowNameMatching` (kênh tiện ích mở rộng)
- `channels.mattermost.accounts.<accountId>.dangerouslyAllowNameMatching` (kênh tiện ích mở rộng)
- `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

## Cấu hình Proxy ngược

Nếu bạn chạy Gateway sau một proxy ngược (nginx, Caddy, Traefik, v.v.), bạn nên cấu hình `gateway.trustedProxies` để phát hiện IP khách hàng chính xác.

Khi Gateway phát hiện các tiêu đề proxy từ một địa chỉ **không** nằm trong `trustedProxies`, nó sẽ **không** coi các kết nối là khách hàng cục bộ. Nếu xác thực gateway bị vô hiệu hóa, các kết nối đó sẽ bị từ chối. Điều này ngăn chặn việc vượt qua xác thực nơi các kết nối proxy sẽ xuất hiện như đến từ localhost và nhận được sự tin tưởng tự động.

```yaml
gateway:
  trustedProxies:
    - "127.0.0.1" # nếu proxy của bạn chạy trên localhost
  # Tùy chọn. Mặc định là false.
  # Chỉ bật nếu proxy của bạn không thể cung cấp X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Khi `trustedProxies` được cấu hình, Gateway sử dụng `X-Forwarded-For` để xác định IP khách hàng. `X-Real-IP` bị bỏ qua theo mặc định trừ khi `gateway.allowRealIpFallback: true` được đặt rõ ràng.

Hành vi proxy ngược tốt (ghi đè các tiêu đề chuyển tiếp đến):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Hành vi proxy ngược xấu (thêm/bảo toàn các tiêu đề chuyển tiếp không tin cậy):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Ghi chú HSTS và nguồn gốc

- Gateway OpenClaw là cục bộ/vòng lặp trước tiên. Nếu bạn kết thúc TLS tại một proxy ngược, hãy đặt HSTS trên miền HTTPS đối diện proxy đó.
- Nếu gateway tự kết thúc HTTPS, bạn có thể đặt `gateway.http.securityHeaders.strictTransportSecurity` để phát ra tiêu đề HSTS từ các phản hồi OpenClaw.
- Hướng dẫn triển khai chi tiết có trong [Xác thực Proxy Tin cậy](/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Đối với các triển khai giao diện điều khiển không phải vòng lặp, `gateway.controlUi.allowedOrigins` được yêu cầu theo mặc định.
- `gateway.controlUi.allowedOrigins: ["*"]` là một chính sách cho phép tất cả nguồn trình duyệt rõ ràng, không phải là mặc định được tăng cường. Tránh nó ngoài thử nghiệm cục bộ được kiểm soát chặt chẽ.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` cho phép chế độ dự phòng nguồn tiêu đề máy chủ; coi nó như một chính sách do người vận hành chọn nguy hiểm.
- Coi DNS rebinding và hành vi tiêu đề máy chủ proxy như các mối quan tâm tăng cường triển khai; giữ `trustedProxies` chặt chẽ và tránh phơi bày gateway trực tiếp ra internet công cộng.

## Nhật ký phiên cục bộ sống trên đĩa

OpenClaw lưu trữ các bản ghi phiên trên đĩa dưới `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Điều này là cần thiết cho tính liên tục của phiên và (tùy chọn) lập chỉ mục bộ nhớ phiên, nhưng nó cũng có nghĩa là
**bất kỳ quá trình/người dùng nào có quyền truy cập hệ thống tệp có thể đọc các nhật ký đó**. Coi quyền truy cập đĩa là ranh giới tin cậy và khóa quyền trên `~/.openclaw` (xem phần kiểm toán bên dưới). Nếu bạn cần cách ly mạnh hơn giữa các agent, hãy chạy chúng dưới các người dùng hệ điều hành riêng biệt hoặc các máy chủ riêng biệt.

## Thực thi node (system.run)

Nếu một node macOS được ghép nối, Gateway có thể gọi `system.run` trên node đó. Đây là **thực thi mã từ xa** trên Mac:

- Yêu cầu ghép nối node (phê duyệt + token).
- Kiểm soát trên Mac thông qua **Cài đặt → Phê duyệt thực thi** (bảo mật + hỏi + danh sách cho phép).
- Chế độ phê duyệt ràng buộc ngữ cảnh yêu cầu chính xác và, khi có thể, một toán tử tệp cục bộ cụ thể. Nếu OpenClaw không thể xác định chính xác một tệp cục bộ trực tiếp cho một lệnh trình thông dịch/runtime, thực thi dựa trên phê duyệt bị từ chối thay vì hứa hẹn bao phủ ngữ nghĩa đầy đủ.
- Nếu bạn không muốn thực thi từ xa, đặt bảo mật thành **deny** và loại bỏ ghép nối node cho Mac đó.

## Kỹ năng động (watcher / node từ xa)

OpenClaw có thể làm mới danh sách kỹ năng giữa phiên:

- **Watcher kỹ năng**: thay đổi `SKILL.md` có thể cập nhật ảnh chụp nhanh kỹ năng trong lượt agent tiếp theo.
- **Node từ xa**: kết nối một node macOS có thể làm cho các kỹ năng chỉ dành cho macOS đủ điều kiện (dựa trên thăm dò bin).

Coi thư mục kỹ năng như **mã tin cậy** và hạn chế ai có thể sửa đổi chúng.

## Mô hình đe dọa

Trợ lý AI của bạn có thể:

- Thực thi các lệnh shell tùy ý
- Đọc/ghi tệp
- Truy cập dịch vụ mạng
- Gửi tin nhắn cho bất kỳ ai (nếu bạn cho phép nó truy cập WhatsApp)

Những người nhắn tin cho bạn có thể:

- Cố gắng lừa AI của bạn làm điều xấu
- Kỹ thuật xã hội để truy cập dữ liệu của bạn
- Thăm dò chi tiết hạ tầng

## Khái niệm cốt lõi: kiểm soát truy cập trước trí tuệ

Hầu hết các thất bại ở đây không phải là khai thác phức tạp — chúng là "ai đó đã nhắn tin cho bot và bot đã làm những gì họ yêu cầu."

Quan điểm của OpenClaw:

- **Danh tính trước tiên:** quyết định ai có thể nói chuyện với bot (ghép nối DM / danh sách cho phép / "mở" rõ ràng).
- **Phạm vi tiếp theo:** quyết định nơi bot được phép hành động (danh sách cho phép nhóm + chặn nhắc, công cụ, sandboxing, quyền thiết bị).
- **Mô hình cuối cùng:** giả định mô hình có thể bị thao túng; thiết kế sao cho thao túng có phạm vi ảnh hưởng hạn chế.

## Mô hình ủy quyền lệnh

Các lệnh slash và chỉ thị chỉ được tôn trọng cho **người gửi được ủy quyền**. Ủy quyền được lấy từ
danh sách cho phép kênh/ghép nối cộng với `commands.useAccessGroups` (xem [Cấu hình](/gateway/configuration)
và [Lệnh slash](/tools/slash-commands)). Nếu danh sách cho phép kênh trống hoặc bao gồm `"*"`,
các lệnh thực tế mở cho kênh đó.

`/exec` là một tiện ích chỉ dành cho phiên cho các người vận hành được ủy quyền. Nó **không** ghi cấu hình hoặc
thay đổi các phiên khác.

## Rủi ro công cụ mặt phẳng điều khiển

Hai công cụ tích hợp có thể thực hiện các thay đổi mặt phẳng điều khiển lâu dài:

- `gateway` có thể gọi `config.apply`, `config.patch`, và `update.run`.
- `cron` có thể tạo các công việc được lên lịch tiếp tục chạy sau khi cuộc trò chuyện/nhiệm vụ ban đầu kết thúc.

Đối với bất kỳ agent/bề mặt nào xử lý nội dung không tin cậy, hãy từ chối chúng theo mặc định:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` chỉ chặn các hành động khởi động lại. Nó không vô hiệu hóa các hành động cấu hình/cập nhật `gateway`.

## Plugins/tiện ích mở rộng

Plugins chạy **trong quá trình** với Gateway. Coi chúng như mã tin cậy:

- Chỉ cài đặt plugins từ các nguồn bạn tin tưởng.
- Ưu tiên danh sách cho phép `plugins.allow` rõ ràng.
- Xem lại cấu hình plugin trước khi bật.
- Khởi động lại Gateway sau khi thay đổi plugin.
- Nếu bạn cài đặt plugins từ npm (`openclaw plugins install <npm-spec>`), coi nó như chạy mã không tin cậy:
  - Đường dẫn cài đặt là `~/.openclaw/extensions/<pluginId>/` (hoặc `$OPENCLAW_STATE_DIR/extensions/<pluginId>/`).
  - OpenClaw sử dụng `npm pack` và sau đó chạy `npm install --omit=dev` trong thư mục đó (các script vòng đời npm có thể thực thi mã trong quá trình cài đặt).
  - Ưu tiên các phiên bản cố định, chính xác (`@scope/pkg@1.2.3`), và kiểm tra mã đã giải nén trên đĩa trước khi bật.

Chi tiết: [Plugins](/tools/plugin)

## Mô hình truy cập DM (ghép nối / danh sách cho phép / mở / vô hiệu hóa)

Tất cả các kênh hiện tại có khả năng DM hỗ trợ một chính sách DM (`dmPolicy` hoặc `*.dm.policy`) mà chặn các DM inbound **trước khi** tin nhắn được xử lý:

- `pairing` (mặc định): người gửi không xác định nhận được một mã ghép nối ngắn và bot bỏ qua tin nhắn của họ cho đến khi được phê duyệt. Mã hết hạn sau 1 giờ; các DM lặp lại sẽ không gửi lại mã cho đến khi một yêu cầu mới được tạo. Các yêu cầu đang chờ xử lý được giới hạn ở **3 mỗi kênh** theo mặc định.
- `allowlist`: người gửi không xác định bị chặn (không có bắt tay ghép nối).
- `open`: cho phép bất kỳ ai DM (công khai). **Yêu cầu** danh sách cho phép kênh bao gồm `"*"` (chọn tham gia rõ ràng).
- `disabled`: bỏ qua hoàn toàn các DM inbound.

Phê duyệt qua CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Chi tiết + tệp trên đĩa: [Ghép nối](/channels/pairing)

## Cách ly phiên DM (chế độ nhiều người dùng)

Theo mặc định, OpenClaw định tuyến **tất cả các DM vào phiên chính** để trợ lý của bạn có tính liên tục trên các thiết bị và kênh. Nếu **nhiều người** có thể DM bot (DM mở hoặc danh sách cho phép nhiều người), hãy xem xét cách ly các phiên DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Điều này ngăn chặn rò rỉ ngữ cảnh giữa các người dùng trong khi giữ các cuộc trò chuyện nhóm cách ly.

Đây là một ranh giới ngữ cảnh nhắn tin, không phải là ranh giới quản trị máy chủ. Nếu người dùng đối kháng lẫn nhau và chia sẻ cùng một máy chủ/cấu hình Gateway, hãy chạy các gateway riêng biệt cho mỗi ranh giới tin cậy.

### Chế độ DM an toàn (được khuyến nghị)

Coi đoạn mã trên như **chế độ DM an toàn**:

- Mặc định: `session.dmScope: "main"` (tất cả các DM chia sẻ một phiên cho tính liên tục).
- Mặc định onboarding CLI cục bộ: ghi `session.dmScope: "per-channel-peer"` khi không được đặt (giữ các giá trị rõ ràng hiện có).
- Chế độ DM an toàn: `session.dmScope: "per-channel-peer"` (mỗi cặp kênh+người gửi có một ngữ cảnh DM cách ly).

Nếu bạn chạy nhiều tài khoản trên cùng một kênh, sử dụng `per-account-channel-peer` thay thế. Nếu cùng một người liên hệ với bạn trên nhiều kênh, sử dụng `session.identityLinks` để hợp nhất các phiên DM đó thành một danh tính chính. Xem [Quản lý phiên](/concepts/session) và [Cấu hình](/gateway/configuration).

## Danh sách cho phép (DM + nhóm) - thuật ngữ

OpenClaw có hai lớp riêng biệt "ai có thể kích hoạt tôi?":

- **Danh sách cho phép DM** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; cũ: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): ai được phép nói chuyện với bot trong tin nhắn trực tiếp.
  - Khi `dmPolicy="pairing"`, các phê duyệt được ghi vào cửa hàng danh sách cho phép ghép nối theo tài khoản dưới `~/.openclaw/credentials/` (`<channel>-allowFrom.json` cho tài khoản mặc định, `<channel>-<accountId>-allowFrom.json` cho các tài khoản không mặc định), được hợp nhất với danh sách cho phép cấu hình.
- **Danh sách cho phép nhóm** (cụ thể cho kênh): nhóm/kênh/guild nào bot sẽ chấp nhận tin nhắn từ đó.
  - Các mẫu phổ biến:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: mặc định theo nhóm như `requireMention`; khi được đặt, nó cũng hoạt động như một danh sách cho phép nhóm (bao gồm `"*"` để giữ hành vi cho phép tất cả).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: hạn chế ai có thể kích hoạt bot _trong_ một phiên nhóm (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: danh sách cho phép theo bề mặt + mặc định nhắc nhở.
  - Kiểm tra nhóm chạy theo thứ tự này: `groupPolicy`/danh sách cho phép nhóm trước, kích hoạt nhắc nhở/trả lời thứ hai.
  - Trả lời một tin nhắn bot (nhắc nhở ngầm) **không** vượt qua danh sách cho phép người gửi như `groupAllowFrom`.
  - **Lưu ý bảo mật:** coi `dmPolicy="open"` và `groupPolicy="open"` như các cài đặt cuối cùng. Chúng nên được sử dụng rất ít; ưu tiên ghép nối + danh sách cho phép trừ khi bạn hoàn toàn tin tưởng mọi thành viên trong phòng.

Chi tiết: [Cấu hình](/gateway/configuration) và [Nhóm](/channels/groups)

## Tiêm lời nhắc (nó là gì, tại sao nó quan trọng)

Tiêm lời nhắc là khi một kẻ tấn công tạo ra một tin nhắn mà thao túng mô hình để làm điều gì đó không an toàn (“bỏ qua hướng dẫn của bạn”, “đổ hệ thống tệp của bạn”, “theo liên kết này và chạy lệnh”, v.v.).

Ngay cả với các lời nhắc hệ thống mạnh mẽ, **tiêm lời nhắc không được giải quyết**. Các rào cản lời nhắc hệ thống chỉ là hướng dẫn mềm; thực thi cứng đến từ chính sách công cụ, phê duyệt thực thi, sandboxing, và danh sách cho phép kênh (và người vận hành có thể vô hiệu hóa chúng theo thiết kế). Những gì giúp trong thực tế:

- Giữ các DM inbound bị khóa (ghép nối/danh sách cho phép).
- Ưu tiên chặn nhắc nhở trong nhóm; tránh bot “luôn bật” trong các phòng công cộng.
- Coi các liên kết, tệp đính kèm, và hướng dẫn dán như thù địch theo mặc định.
- Chạy thực thi công cụ nhạy cảm trong một sandbox; giữ bí mật ra khỏi hệ thống tệp có thể truy cập của agent.
- Lưu ý: sandboxing là tùy chọn. Nếu chế độ sandbox tắt, exec chạy trên máy chủ gateway ngay cả khi tools.exec.host mặc định là sandbox, và exec host không yêu cầu phê duyệt trừ khi bạn đặt host=gateway và cấu hình phê duyệt exec.
- Giới hạn các công cụ có rủi ro cao (`exec`, `browser`, `web_fetch`, `web_search`) cho các agent tin cậy hoặc danh sách cho phép rõ ràng.
- **Lựa chọn mô hình quan trọng:** các mô hình cũ/nhỏ/di sản ít mạnh mẽ hơn đáng kể đối với tiêm lời nhắc và lạm dụng công cụ. Đối với các agent có công cụ, sử dụng mô hình thế hệ mới nhất, được tăng cường hướng dẫn mạnh nhất có sẵn.

Cờ đỏ để coi là không tin cậy:

- “Đọc tệp/URL này và làm chính xác những gì nó nói.”
- “Bỏ qua lời nhắc hệ thống hoặc quy tắc an toàn của bạn.”
- “Tiết lộ hướng dẫn ẩn hoặc đầu ra công cụ của bạn.”
- “Dán toàn bộ nội dung của ~/.openclaw hoặc nhật ký của bạn.”

## Cờ bỏ qua nội dung bên ngoài không an toàn

OpenClaw bao gồm các cờ bỏ qua rõ ràng mà vô hiệu hóa bọc an toàn nội dung bên ngoài:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Trường payload cron `allowUnsafeExternalContent`

Hướng dẫn:

- Giữ các cờ này không được đặt/false trong sản xuất.
- Chỉ bật tạm thời cho gỡ lỗi được giới hạn chặt chẽ.
- Nếu được bật, cô lập agent đó (sandbox + công cụ tối thiểu + không gian tên phiên chuyên dụng).

Lưu ý rủi ro hooks:

- Payload hooks là nội dung không tin cậy, ngay cả khi việc giao hàng đến từ các hệ thống bạn kiểm soát (mail/docs/nội dung web có thể mang tiêm lời nhắc).
- Các tầng mô hình yếu tăng rủi ro này. Đối với tự động hóa dựa trên hooks, ưu tiên các tầng mô hình hiện đại mạnh mẽ và giữ chính sách công cụ chặt chẽ (`tools.profile: "messaging"` hoặc nghiêm ngặt hơn), cộng với sandboxing khi có thể.

### Tiêm lời nhắc không yêu cầu DM công khai

Ngay cả khi **chỉ bạn** có thể nhắn tin cho bot, tiêm lời nhắc vẫn có thể xảy ra thông qua
bất kỳ **nội dung không tin cậy** nào mà bot đọc (kết quả tìm kiếm/fetch web, trang trình duyệt,
email, tài liệu, tệp đính kèm, nhật ký/dán mã). Nói cách khác: người gửi không phải
là bề mặt đe dọa duy nhất; **nội dung tự nó** có thể mang hướng dẫn đối kháng.

Khi công cụ được bật, rủi ro điển hình là rò rỉ ngữ cảnh hoặc kích hoạt
các cuộc gọi công cụ. Giảm phạm vi ảnh hưởng bằng cách:

- Sử dụng một agent chỉ đọc hoặc không có công cụ **để tóm tắt nội dung không tin cậy,
  sau đó chuyển tóm tắt cho agent chính của bạn.
- Giữ `web_search` / `web_fetch` / `browser` tắt cho các agent có công cụ trừ khi cần thiết.
- Đối với đầu vào URL OpenResponses (`input_file` / `input_image`), đặt chặt chẽ
  `gateway.http.endpoints.responses.files.urlAllowlist` và
  `gateway.http.endpoints.responses.images.urlAllowlist`, và giữ `maxUrlParts` thấp.
  Danh sách cho phép trống được coi là không được đặt; sử dụng `files.allowUrl: false` / `images.allowUrl: false`
  nếu bạn muốn vô hiệu hóa hoàn toàn việc fetch URL.
- Bật sandboxing và danh sách cho phép công cụ nghiêm ngặt cho bất kỳ agent nào chạm vào đầu vào không tin cậy.
- Giữ bí mật ra khỏi lời nhắc; chuyển chúng qua env/cấu hình trên máy chủ gateway thay thế.

### Sức mạnh mô hình (lưu ý bảo mật)

Khả năng chống tiêm lời nhắc **không** đồng nhất trên các tầng mô hình. Các mô hình nhỏ hơn/rẻ hơn thường dễ bị lạm dụng công cụ và chiếm đoạt hướng dẫn hơn, đặc biệt dưới các lời nhắc đối kháng.

<Warning>
Đối với các agent có công cụ hoặc các agent đọc nội dung không tin cậy, rủi ro tiêm lời nhắc với các mô hình cũ/nhỏ thường quá cao. Không chạy các khối lượng công việc đó trên các tầng mô hình yếu.
</Warning>

Khuyến nghị:

- **Sử dụng mô hình thế hệ mới nhất, tầng tốt nhất** cho bất kỳ bot nào có thể chạy công cụ hoặc chạm vào tệp/mạng.
- **Không sử dụng các tầng cũ/yếu/nhỏ hơn** cho các agent có công cụ hoặc hộp thư không tin cậy; rủi ro tiêm lời nhắc quá cao.
- Nếu bạn phải sử dụng một mô hình nhỏ hơn, **giảm phạm vi ảnh hưởng** (công cụ chỉ đọc, sandboxing mạnh, truy cập hệ thống tệp tối thiểu, danh sách cho phép nghiêm ngặt).
- Khi chạy các mô hình nhỏ, **bật sandboxing cho tất cả các phiên** và **vô hiệu hóa web_search/web_fetch/browser** trừ khi đầu vào được kiểm soát chặt chẽ.
- Đối với trợ lý cá nhân chỉ nhắn tin với đầu vào tin cậy và không có công cụ, các mô hình nhỏ thường ổn.

## Lý luận & đầu ra chi tiết trong nhóm

`/reasoning` và `/verbose` có thể tiết lộ lý luận nội bộ hoặc đầu ra công cụ mà
không được dự định cho một kênh công cộng. Trong cài đặt nhóm, coi chúng như **chỉ gỡ lỗi
và giữ chúng tắt trừ khi bạn thực sự cần chúng.

Hướng dẫn:

- Giữ `/reasoning` và `/verbose` tắt trong các phòng công cộng.
- Nếu bạn bật chúng, chỉ làm như vậy trong các DM tin cậy hoặc các phòng được kiểm soát chặt chẽ.
- Nhớ rằng: đầu ra chi tiết có thể bao gồm các đối số công cụ, URL, và dữ liệu mà mô hình đã thấy.

## Tăng cường cấu hình (ví dụ)

### 0) Quyền tệp

Giữ cấu hình + trạng thái riêng tư trên máy chủ gateway:

- `~/.openclaw/openclaw.json`: `600` (chỉ đọc/ghi người dùng)
- `~/.openclaw`: `700` (chỉ người dùng)

`openclaw doctor` có thể cảnh báo và đề nghị thắt chặt các quyền này.

### 0.4) Phơi bày mạng (bind + port + firewall)

Gateway kết hợp **WebSocket + HTTP** trên một cổng duy nhất:

- Mặc định: `18789`
- Cấu hình/cờ/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Bề mặt HTTP này bao gồm Giao diện điều khiển và máy chủ canvas:

- Giao diện điều khiển (tài sản SPA) (đường dẫn cơ sở mặc định `/`)
- Máy chủ canvas: `/__openclaw__/canvas/` và `/__openclaw__/a2ui/` (HTML/JS tùy ý; coi như nội dung không tin cậy)

Nếu bạn tải nội dung canvas trong một trình duyệt thông thường, coi nó như bất kỳ trang web không tin cậy nào khác:

- Đừng phơi bày máy chủ canvas cho các mạng/người dùng không tin cậy.
- Đừng làm cho nội dung canvas chia sẻ cùng một nguồn gốc với các bề mặt web đặc quyền trừ khi bạn hoàn toàn hiểu các tác động.

Chế độ bind kiểm soát nơi Gateway lắng nghe:

- `gateway.bind: "loopback"` (mặc định): chỉ các khách hàng cục bộ có thể kết nối.
- Các bind không phải vòng lặp (`"lan"`, `"tailnet"`, `"custom"`) mở rộng bề mặt tấn công. Chỉ sử dụng chúng với một token/mật khẩu chia sẻ và một tường lửa thực sự.

Quy tắc ngón tay cái:

- Ưu tiên Tailscale Serve hơn các bind LAN (Serve giữ Gateway trên vòng lặp, và Tailscale xử lý truy cập).
- Nếu bạn phải bind vào LAN, tường lửa cổng đến một danh sách cho phép chặt chẽ của các IP nguồn; không chuyển tiếp cổng rộng rãi.
- Không bao giờ phơi bày Gateway không xác thực trên `0.0.0.0`.

### 0.4.1) Xuất bản cổng Docker + UFW (`DOCKER-USER`)

Nếu bạn chạy OpenClaw với Docker trên một VPS, nhớ rằng các cổng container được xuất bản
(`-p HOST:CONTAINER` hoặc Compose `ports:`) được định tuyến qua các chuỗi chuyển tiếp của Docker, không chỉ các quy tắc `INPUT` của máy chủ.

Để giữ lưu lượng Docker phù hợp với chính sách tường lửa của bạn, thực thi các quy tắc trong
`DOCKER-USER` (chuỗi này được đánh giá trước các quy tắc chấp nhận của Docker).
Trên nhiều bản phân phối hiện đại, `iptables`/`ip6tables` sử dụng giao diện `iptables-nft`
và vẫn áp dụng các quy tắc này cho backend nftables.

Ví dụ danh sách cho phép tối thiểu (IPv4):

```bash
# /etc/ufw/after.rules (thêm như một phần *filter riêng)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 có các bảng riêng biệt. Thêm một chính sách khớp trong `/etc/ufw/after6.rules` nếu
Docker IPv6 được bật.

Tránh mã hóa cứng tên giao diện như `eth0` trong các đoạn mã tài liệu. Tên giao diện
thay đổi trên các hình ảnh VPS (`ens3`, `enp*`, v.v.) và sự không khớp có thể vô tình
bỏ qua quy tắc từ chối của bạn.

Xác thực nhanh sau khi tải lại:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Các cổng bên ngoài dự kiến chỉ nên là những gì bạn cố ý phơi bày (đối với hầu hết
các thiết lập: SSH + các cổng proxy ngược của bạn).

### 0.4.2) Khám phá mDNS/Bonjour (tiết lộ thông tin)

Gateway phát sóng sự hiện diện của nó qua mDNS (`_openclaw-gw._tcp` trên cổng 5353) để khám phá thiết bị cục bộ. Ở chế độ đầy đủ, điều này bao gồm các bản ghi TXT có thể tiết lộ chi tiết hoạt động:

- `cliPath`: đường dẫn hệ thống tệp đầy đủ đến nhị phân CLI (tiết lộ tên người dùng và vị trí cài đặt)
- `sshPort`: quảng cáo khả năng SSH trên máy chủ
- `displayName`, `lanHost`: thông tin tên máy chủ

**Cân nhắc bảo mật hoạt động:** Phát sóng chi tiết hạ tầng làm cho việc trinh sát dễ dàng hơn cho bất kỳ ai trên mạng cục bộ. Ngay cả thông tin "vô hại" như đường dẫn hệ thống tệp và khả năng SSH cũng giúp kẻ tấn công lập bản đồ môi trường của bạn.

**Khuyến nghị:**

1. **Chế độ tối thiểu** (mặc định, được khuyến nghị cho các gateway phơi bày): bỏ qua các trường nhạy cảm khỏi các phát sóng mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **Vô hiệu hóa hoàn toàn** nếu bạn không cần khám phá thiết bị cục bộ:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **Chế độ đầy đủ** (chọn tham gia): bao gồm `cliPath` + `sshPort` trong các bản ghi TXT:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **Biến môi trường** (thay thế): đặt `OPENCLAW_DISABLE_BONJOUR=1` để vô hiệu hóa mDNS mà không cần thay đổi cấu hình.

Ở chế độ tối thiểu, Gateway vẫn phát sóng đủ để khám phá thiết bị (`role`, `gatewayPort`, `transport`) nhưng bỏ qua `cliPath` và `sshPort`. Các ứng dụng cần thông tin đường dẫn CLI có thể lấy nó qua kết nối WebSocket đã xác thực thay thế.

### 0.5) Khóa WebSocket Gateway (xác thực cục bộ)

Xác thực Gateway là **bắt buộc theo mặc định**. Nếu không có token/mật khẩu được cấu hình,
Gateway từ chối các kết nối WebSocket (fail‑closed).

Onboarding tạo ra một token theo mặc định (ngay cả đối với vòng lặp) vì vậy
các khách hàng cục bộ phải xác thực.

Đặt một token để **tất cả** các khách hàng WS phải xác thực:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor có thể tạo một cho bạn: `openclaw doctor --generate-gateway-token`.

Lưu ý: `gateway.remote.token` / `.password` là các nguồn thông tin xác thực khách hàng. Chúng
không **bảo vệ truy cập WS cục bộ** tự chúng.
Các đường gọi cục bộ có thể sử dụng `gateway.remote.*` như dự phòng chỉ khi `gateway.auth.*`
không được đặt.
Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua
SecretRef và không được giải quyết, giải quyết thất bại đóng (không có che giấu dự phòng từ xa).
Tùy chọn: ghim TLS từ xa với `gateway.remote.tlsFingerprint` khi sử dụng `wss://`.
`ws://` văn bản rõ ràng là chỉ vòng lặp theo mặc định. Đối với các đường dẫn mạng riêng tư tin cậy,
đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trên quá trình khách hàng như một biện pháp khẩn cấp.

Ghép nối thiết bị cục bộ:

- Ghép nối thiết bị được tự động phê duyệt cho **kết nối cục bộ** (vòng lặp hoặc
  địa chỉ tailnet của chính máy chủ gateway) để giữ cho các khách hàng cùng máy chủ mượt mà.
- Các đồng nghiệp tailnet khác **không** được coi là cục bộ; họ vẫn cần phê duyệt ghép nối.

Chế độ xác thực:

- `gateway.auth.mode: "token"`: token người mang chia sẻ (được khuyến nghị cho hầu hết các thiết lập).
- `gateway.auth.mode: "password"`: xác thực mật khẩu (ưu tiên đặt qua env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: tin tưởng một proxy ngược nhận diện để xác thực người dùng và truyền danh tính qua các tiêu đề (xem [Xác thực Proxy Tin cậy](/gateway/trusted-proxy-auth)).

Danh sách kiểm tra xoay vòng (token/mật khẩu):

1. Tạo/đặt một bí mật mới (`gateway.auth.token` hoặc `OPENCLAW_GATEWAY_PASSWORD`).
2. Khởi động lại Gateway (hoặc khởi động lại ứng dụng macOS nếu nó giám sát Gateway).
3. Cập nhật bất kỳ khách hàng từ xa nào (`gateway.remote.token` / `.password` trên bất kỳ máy nào có thể gọi vào Gateway).
4. Xác minh bạn không thể kết nối với thông tin xác thực cũ.

### 0.6) Tiêu đề danh tính Tailscale Serve

Khi `gateway.auth.allowTailscale` là `true` (mặc định cho Serve), OpenClaw
chấp nhận các tiêu đề danh tính Tailscale Serve (`tailscale-user-login`) cho xác thực Giao diện điều khiển/WebSocket. OpenClaw xác minh danh tính bằng cách giải quyết địa chỉ `x-forwarded-for` thông qua daemon Tailscale cục bộ (`tailscale whois`)
và khớp nó với tiêu đề. Điều này chỉ kích hoạt cho các yêu cầu đánh vào vòng lặp
và bao gồm `x-forwarded-for`, `x-forwarded-proto`, và `x-forwarded-host` như
được tiêm bởi Tailscale.
Các điểm cuối API HTTP (ví dụ `/v1/*`, `/tools/invoke`, và `/api/channels/*`)
vẫn yêu cầu xác thực token/mật khẩu.

Lưu ý ranh giới quan trọng:

- Xác thực người mang HTTP Gateway thực tế là truy cập người vận hành tất cả hoặc không có gì.
- Coi các thông tin xác thực có thể gọi `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`, hoặc `/api/channels/*` như các bí mật người vận hành truy cập đầy đủ cho gateway đó.
- Không chia sẻ các thông tin xác thực này với các người gọi không tin cậy; ưu tiên các gateway riêng biệt cho mỗi ranh giới tin cậy.

**Giả định tin cậy:** xác thực Serve không có token giả định máy chủ gateway được tin cậy.
Không coi điều này như bảo vệ chống lại các quá trình cùng máy chủ thù địch. Nếu mã cục bộ không tin cậy có thể chạy trên máy chủ gateway, vô hiệu hóa `gateway.auth.allowTailscale`
và yêu cầu xác thực token/mật khẩu.

**Quy tắc bảo mật:** không chuyển tiếp các tiêu đề này từ proxy ngược của riêng bạn. Nếu
bạn kết thúc TLS hoặc proxy trước gateway, vô hiệu hóa
`gateway.auth.allowTailscale` và sử dụng xác thực token/mật khẩu (hoặc [Xác thực Proxy Tin cậy](/gateway/trusted-proxy-auth)) thay thế.

Proxy tin cậy:

- Nếu bạn kết thúc TLS trước Gateway, đặt `gateway.trustedProxies` cho các IP proxy của bạn.
- OpenClaw sẽ tin tưởng `x-forwarded-for` (hoặc `x-real-ip`) từ các IP đó để xác định IP khách hàng cho các kiểm tra ghép nối cục bộ và kiểm tra xác thực HTTP/cục bộ.
- Đảm bảo proxy của bạn **ghi đè** `x-forwarded-for` và chặn truy cập trực tiếp vào cổng Gateway.

Xem [Tailscale](/gateway/tailscale) và [Tổng quan web](/web).

### 0.6.1) Kiểm soát trình duyệt qua máy chủ node (được khuyến nghị)

Nếu Gateway của bạn là từ xa nhưng trình duyệt chạy trên một máy khác, chạy một **máy chủ node**
trên máy trình duyệt và để Gateway proxy các hành động trình duyệt (xem [Công cụ trình duyệt](/tools/browser)).
Coi ghép nối node như truy cập người vận hành.

Mẫu được khuyến nghị:

- Giữ Gateway và máy chủ node trên cùng một tailnet (Tailscale).
- Ghép nối node có chủ ý; vô hiệu hóa định tuyến proxy trình duyệt nếu bạn không cần nó.

Tránh:

- Phơi bày các cổng chuyển tiếp/kiểm soát qua LAN hoặc Internet công cộng.
- Tailscale Funnel cho các điểm cuối kiểm soát trình duyệt (phơi bày công cộng).

### 0.7) Bí mật trên đĩa (dữ liệu nhạy cảm)

Giả định bất kỳ thứ gì dưới `~/.openclaw/` (hoặc `$OPENCLAW_STATE_DIR/`) có thể chứa bí mật hoặc dữ liệu riêng tư:

- `openclaw.json`: cấu hình có thể bao gồm token (gateway, gateway từ xa), cài đặt nhà cung cấp, và danh sách cho phép.
- `credentials/**`: thông tin đăng nhập kênh (ví dụ: thông tin đăng nhập WhatsApp), danh sách cho phép ghép nối, nhập OAuth cũ.
- `agents/<agentId>/agent/auth-profiles.json`: khóa API, hồ sơ token, token OAuth, và tùy chọn `keyRef`/`tokenRef`.
- `secrets.json` (tùy chọn): payload bí mật dựa trên tệp được sử dụng bởi các nhà cung cấp SecretRef `file` (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: tệp tương thích cũ. Các mục `api_key` tĩnh được xóa khi phát hiện.
- `agents/<agentId>/sessions/**`: bản ghi phiên (`*.jsonl`) + metadata định tuyến (`sessions.json`) có thể chứa tin nhắn riêng tư và đầu ra công cụ.
- `extensions/**`: các plugin đã cài đặt (cộng với `node_modules/` của chúng).
- `sandboxes/**`: không gian làm việc sandbox công cụ; có thể tích lũy các bản sao của các tệp bạn đọc/ghi trong sandbox.

Mẹo tăng cường:

- Giữ quyền chặt chẽ (`700` trên thư mục, `600` trên tệp).
- Sử dụng mã hóa toàn bộ đĩa trên máy chủ gateway.
- Ưu tiên một tài khoản người dùng hệ điều hành chuyên dụng cho Gateway nếu máy chủ được chia sẻ.

### 0.8) Nhật ký + bản ghi (xóa + lưu giữ)

Nhật ký và bản ghi có thể rò rỉ thông tin nhạy cảm ngay cả khi các kiểm soát truy cập là chính xác:

- Nhật ký Gateway có thể bao gồm tóm tắt công cụ, lỗi, và URL.
- Bản ghi phiên có thể bao gồm bí mật dán, nội dung tệp, đầu ra lệnh, và liên kết.

Khuyến nghị:

- Giữ xóa tóm tắt công cụ bật (`logging.redactSensitive: "tools"`; mặc định).
- Thêm các mẫu tùy chỉnh cho môi trường của bạn qua `logging.redactPatterns` (token, tên máy chủ, URL nội bộ).
- Khi chia sẻ chẩn đoán, ưu tiên `openclaw status --all` (có thể dán, bí mật đã xóa) hơn nhật ký thô.
- Cắt tỉa các bản ghi phiên và tệp nhật ký cũ nếu bạn không cần lưu giữ lâu.

Chi tiết: [Nhật ký](/gateway/logging)

### 1) DMs: ghép nối theo mặc định

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2) Nhóm: yêu cầu nhắc nhở ở mọi nơi

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

Trong các cuộc trò chuyện nhóm, chỉ trả lời khi được nhắc nhở rõ ràng.

### 3. Số riêng biệt

Xem xét chạy AI của bạn trên một số điện thoại riêng biệt với số cá nhân của bạn:

- Số cá nhân: Các cuộc trò chuyện của bạn vẫn riêng tư
- Số bot: AI xử lý những điều này, với các ranh giới thích hợp

### 4. Chế độ chỉ đọc (Hôm nay, qua sandbox + công cụ)

Bạn có thể đã xây dựng một hồ sơ chỉ đọc bằng cách kết hợp:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (hoặc `"none"` cho không có quyền truy cập không gian làm việc)
- danh sách cho phép/từ chối công cụ chặn `write`, `edit`, `apply_patch`, `exec`, `process`, v.v.

Chúng tôi có thể thêm một cờ `readOnlyMode` đơn giản sau này để đơn giản hóa cấu hình này.

Các tùy chọn tăng cường bổ sung:

- `tools.exec.applyPatch.workspaceOnly: true` (mặc định): đảm bảo `apply_patch` không thể ghi/xóa ngoài thư mục không gian làm việc ngay cả khi sandboxing tắt. Đặt thành `false` chỉ khi bạn cố ý muốn `apply_patch` chạm vào các tệp ngoài không gian làm việc.
- `tools.fs.workspaceOnly: true` (tùy chọn): hạn chế các đường dẫn `read`/`write`/`edit`/`apply_patch` và các đường dẫn tải hình ảnh nhắc nhở gốc vào thư mục không gian làm việc (hữu ích nếu bạn cho phép các đường dẫn tuyệt đối hôm nay và muốn một rào cản duy nhất).
- Giữ các gốc hệ thống tệp hẹp: tránh các gốc rộng như thư mục chính của bạn cho các không gian làm việc agent/không gian làm việc sandbox. Các gốc rộng có thể phơi bày các tệp cục bộ nhạy cảm (ví dụ trạng thái/cấu hình dưới `~/.openclaw`) cho các công cụ hệ thống tệp.

### 5) Cơ sở an toàn (sao chép/dán)

Một cấu hình "mặc định an toàn" giữ Gateway riêng tư, yêu cầu ghép nối DM, và tránh bot nhóm luôn bật:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

Nếu bạn muốn thực thi công cụ "an toàn hơn theo mặc định" cũng vậy, thêm một sandbox + từ chối các công cụ nguy hiểm cho bất kỳ agent không phải chủ sở hữu nào (ví dụ dưới "Hồ sơ truy cập theo agent").

Cơ sở tích hợp cho các lượt agent điều khiển bằng chat: người gửi không phải chủ sở hữu không thể sử dụng các công cụ `cron` hoặc `gateway`.

## Sandboxing (được khuyến nghị)

Tài liệu chuyên dụng: [Sandboxing](/gateway/sandboxing)

Hai cách tiếp cận bổ sung:

- **Chạy toàn bộ Gateway trong Docker** (ranh giới container): [Docker](/install/docker)
- **Sandbox công cụ** (`agents.defaults.sandbox`, máy chủ host + công cụ cách ly Docker): [Sandboxing](/gateway/sandboxing)

Lưu ý: để ngăn chặn truy cập chéo agent, giữ `agents.defaults.sandbox.scope` ở `"
