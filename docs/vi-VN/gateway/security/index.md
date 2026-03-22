---
summary: "Các cân nhắc về bảo mật và mô hình mối đe dọa khi chạy một AI gateway với quyền truy cập shell"
read_when:
  - Thêm các tính năng mở rộng quyền truy cập hoặc tự động hóa
title: "Bảo mật"
---

# Bảo mật

> [!WARNING]
> **Mô hình tin cậy trợ lý cá nhân:** hướng dẫn này giả định một ranh giới nhà điều hành tin cậy cho mỗi gateway (mô hình trợ lý cá nhân/người dùng đơn).
> OpenClaw **không** phải là ranh giới bảo mật đa người thuê thù địch cho nhiều người dùng đối kháng chia sẻ một agent/gateway.
> Nếu cần hoạt động với người dùng đối kháng hoặc tin cậy hỗn hợp, hãy tách ranh giới tin cậy (gateway + thông tin đăng nhập riêng biệt, lý tưởng là người dùng/hệ điều hành riêng biệt).

## Phạm vi đầu tiên: mô hình bảo mật trợ lý cá nhân

Hướng dẫn bảo mật của OpenClaw giả định một triển khai **trợ lý cá nhân**: một ranh giới nhà điều hành tin cậy, có thể có nhiều agent.

- Tư thế bảo mật được hỗ trợ: một người dùng/ranh giới tin cậy cho mỗi gateway (ưu tiên một người dùng/hệ điều hành/máy chủ ảo cho mỗi ranh giới).
- Không phải là ranh giới bảo mật được hỗ trợ: một gateway/agent chia sẻ được sử dụng bởi những người dùng không tin cậy hoặc đối kháng.
- Nếu cần cách ly người dùng đối kháng, hãy tách theo ranh giới tin cậy (gateway + thông tin đăng nhập riêng biệt, lý tưởng là người dùng/hệ điều hành riêng biệt).
- Nếu nhiều người dùng không tin cậy có thể nhắn tin cho một agent có công cụ, hãy coi họ như chia sẻ cùng quyền công cụ được ủy quyền cho agent đó.

Trang này giải thích cách tăng cường bảo mật **trong mô hình đó**. Nó không tuyên bố cách ly đa người thuê thù địch trên một gateway chia sẻ.

## Kiểm tra nhanh: `openclaw security audit`

Xem thêm: [Xác minh chính thức (Mô hình bảo mật)](/security/formal-verification)

Chạy lệnh này thường xuyên (đặc biệt sau khi thay đổi cấu hình hoặc mở bề mặt mạng):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

Nó sẽ cảnh báo các lỗi phổ biến (lộ thông tin xác thực Gateway, lộ quyền kiểm soát trình duyệt, danh sách cho phép nâng cao, quyền truy cập hệ thống tệp).

OpenClaw vừa là sản phẩm vừa là thử nghiệm: bạn đang kết nối hành vi mô hình tiên phong vào các bề mặt nhắn tin thực và công cụ thực. **Không có thiết lập nào "hoàn toàn an toàn".** Mục tiêu là cẩn thận về:

- ai có thể nói chuyện với bot của bạn
- nơi bot được phép hành động
- những gì bot có thể chạm vào

Bắt đầu với quyền truy cập nhỏ nhất có thể hoạt động, sau đó mở rộng khi bạn cảm thấy tự tin hơn.

## Giả định triển khai (quan trọng)

OpenClaw giả định rằng máy chủ và ranh giới cấu hình được tin cậy:

- Nếu ai đó có thể thay đổi trạng thái/cấu hình máy chủ Gateway (`~/.openclaw`, bao gồm `openclaw.json`), hãy coi họ như một nhà điều hành tin cậy.
- Chạy một Gateway cho nhiều nhà điều hành không tin cậy/đối kháng **không phải là thiết lập được khuyến nghị**.
- Đối với các nhóm tin cậy hỗn hợp, hãy tách ranh giới tin cậy với các gateway riêng biệt (hoặc ít nhất là người dùng/hệ điều hành riêng biệt).
- OpenClaw có thể chạy nhiều phiên bản gateway trên một máy, nhưng các hoạt động được khuyến nghị ưu tiên tách biệt ranh giới tin cậy rõ ràng.
- Mặc định được khuyến nghị: một người dùng cho mỗi máy/máy chủ (hoặc VPS), một gateway cho người dùng đó, và một hoặc nhiều agent trong gateway đó.
- Nếu nhiều người dùng muốn sử dụng OpenClaw, hãy sử dụng một VPS/máy chủ cho mỗi người dùng.

### Hệ quả thực tế (ranh giới tin cậy nhà điều hành)

Trong một phiên bản Gateway, quyền truy cập nhà điều hành đã xác thực là vai trò mặt phẳng điều khiển tin cậy, không phải vai trò người thuê theo người dùng.

- Các nhà điều hành có quyền truy cập đọc/mặt phẳng điều khiển có thể kiểm tra metadata/lịch sử phiên gateway theo thiết kế.
- Các định danh phiên (`sessionKey`, session IDs, labels) là các bộ chọn định tuyến, không phải là token ủy quyền.
- Ví dụ: mong đợi cách ly theo nhà điều hành cho các phương thức như `sessions.list`, `sessions.preview`, hoặc `chat.history` nằm ngoài mô hình này.
- Nếu cần cách ly người dùng đối kháng, hãy chạy các gateway riêng biệt cho mỗi ranh giới tin cậy.
- Nhiều gateway trên một máy là khả thi về mặt kỹ thuật, nhưng không phải là cơ sở khuyến nghị cho cách ly nhiều người dùng.

## Mô hình trợ lý cá nhân (không phải bus đa người thuê)

OpenClaw được thiết kế như một mô hình bảo mật trợ lý cá nhân: một ranh giới nhà điều hành tin cậy, có thể có nhiều agent.

- Nếu nhiều người có thể nhắn tin cho một agent có công cụ, mỗi người trong số họ có thể điều khiển cùng một tập quyền.
- Cách ly phiên/bộ nhớ theo người dùng giúp bảo mật quyền riêng tư, nhưng không chuyển đổi một agent chia sẻ thành ủy quyền máy chủ theo người dùng.
- Nếu người dùng có thể đối kháng với nhau, hãy chạy các gateway riêng biệt (hoặc người dùng/hệ điều hành riêng biệt) cho mỗi ranh giới tin cậy.

### Không gian làm việc Slack chia sẻ: rủi ro thực tế

Nếu "mọi người trong Slack có thể nhắn tin cho bot," rủi ro cốt lõi là quyền công cụ được ủy quyền:

- bất kỳ người gửi nào được phép có thể kích hoạt các cuộc gọi công cụ (`exec`, trình duyệt, công cụ mạng/tệp) trong chính sách của agent;
- tiêm nội dung/lời nhắc từ một người gửi có thể gây ra các hành động ảnh hưởng đến trạng thái, thiết bị hoặc đầu ra chia sẻ;
- nếu một agent chia sẻ có thông tin đăng nhập/tệp nhạy cảm, bất kỳ người gửi nào được phép có thể tiềm năng dẫn đến rò rỉ thông qua việc sử dụng công cụ.

Sử dụng các agent/gateway riêng biệt với công cụ tối thiểu cho quy trình làm việc nhóm; giữ các agent dữ liệu cá nhân riêng tư.

### Agent chia sẻ công ty: mô hình chấp nhận được

Điều này chấp nhận được khi mọi người sử dụng agent đó đều nằm trong cùng một ranh giới tin cậy (ví dụ một nhóm công ty) và agent chỉ giới hạn trong phạm vi công việc.

- chạy nó trên một máy/VM/container chuyên dụng;
- sử dụng một người dùng hệ điều hành chuyên dụng + trình duyệt/hồ sơ/tài khoản chuyên dụng cho runtime đó;
- không đăng nhập runtime đó vào tài khoản Apple/Google cá nhân hoặc hồ sơ trình quản lý mật khẩu/trình duyệt cá nhân.

Nếu bạn trộn lẫn danh tính cá nhân và công ty trên cùng một runtime, bạn sẽ làm sụp đổ sự tách biệt và tăng nguy cơ lộ dữ liệu cá nhân.

## Khái niệm tin cậy Gateway và node

Xem Gateway và node như một miền tin cậy nhà điều hành, với các vai trò khác nhau:

- **Gateway** là mặt phẳng điều khiển và bề mặt chính sách (`gateway.auth`, chính sách công cụ, định tuyến).
- **Node** là bề mặt thực thi từ xa được ghép nối với Gateway đó (lệnh, hành động thiết bị, khả năng cục bộ máy chủ).
- Một người gọi đã xác thực với Gateway được tin cậy ở phạm vi Gateway. Sau khi ghép nối, các hành động node được coi là hành động của nhà điều hành tin cậy trên node đó.
- `sessionKey` là lựa chọn định tuyến/ngữ cảnh, không phải là xác thực theo người dùng.
- Phê duyệt thực thi (danh sách cho phép + hỏi) là các rào chắn cho ý định của nhà điều hành, không phải là cách ly đa người thuê thù địch.
- Phê duyệt thực thi ràng buộc ngữ cảnh yêu cầu chính xác và nỗ lực tốt nhất để vận hành tệp cục bộ trực tiếp; chúng không mô hình hóa ngữ nghĩa mọi đường dẫn tải runtime/interpreter. Sử dụng sandboxing và cách ly máy chủ cho các ranh giới mạnh.

Nếu cần cách ly người dùng thù địch, hãy tách ranh giới tin cậy theo người dùng/hệ điều hành và chạy các gateway riêng biệt.

## Ma trận ranh giới tin cậy

Sử dụng điều này như mô hình nhanh khi phân loại rủi ro:

| Ranh giới hoặc kiểm soát                         | Ý nghĩa                                         | Hiểu sai phổ biến                                                                |
| ------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (xác thực token/mật khẩu/thiết bị) | Xác thực người gọi tới API gateway             | "Cần chữ ký trên mỗi khung để bảo mật"                    |
| `sessionKey`                                | Khóa định tuyến cho lựa chọn ngữ cảnh/phiên         | "Khóa phiên là ranh giới xác thực người dùng"                                         |
| Rào chắn nội dung/lời nhắc                   | Giảm rủi ro lạm dụng mô hình                           | "Chỉ tiêm lời nhắc đã chứng minh vượt qua xác thực"                                   |
| `canvas.eval` / đánh giá trình duyệt            | Khả năng của nhà điều hành có chủ ý khi được bật      | "Bất kỳ nguyên thủy JS eval nào cũng tự động là lỗ hổng trong mô hình tin cậy này"           |
| TUI cục bộ `!` shell                         | Thực thi cục bộ do nhà điều hành kích hoạt       | "Lệnh tiện lợi shell cục bộ là tiêm từ xa"                         |
| Ghép nối node và lệnh node              | Thực thi từ xa cấp độ nhà điều hành trên các thiết bị ghép nối | "Điều khiển thiết bị từ xa nên được coi là truy cập người dùng không tin cậy theo mặc định" |

## Không phải lỗ hổng theo thiết kế

Những mẫu này thường được báo cáo và thường bị đóng mà không có hành động trừ khi có sự vượt qua ranh giới thực sự:

- Chuỗi chỉ tiêm lời nhắc mà không có sự vượt qua chính sách/xác thực/sandbox.
- Các tuyên bố giả định hoạt động đa người thuê thù địch trên một máy chủ/cấu hình chia sẻ.
- Các tuyên bố phân loại truy cập đường đọc thông thường của nhà điều hành (ví dụ `sessions.list`/`sessions.preview`/`chat.history`) là IDOR trong thiết lập gateway chia sẻ.
- Các phát hiện triển khai chỉ localhost (ví dụ HSTS trên gateway chỉ loopback).
- Các phát hiện chữ ký webhook inbound Discord cho các đường dẫn inbound không tồn tại trong repo này.
- Các phát hiện "Thiếu xác thực theo người dùng" coi `sessionKey` là token xác thực.

## Danh sách kiểm tra trước khi nghiên cứu

Trước khi mở một GHSA, hãy xác minh tất cả những điều này:

1. Tái tạo vẫn hoạt động trên `main` mới nhất hoặc bản phát hành mới nhất.
2. Báo cáo bao gồm đường dẫn mã chính xác (`file`, function, line range) và phiên bản/commit đã thử nghiệm.
3. Tác động vượt qua một ranh giới tin cậy đã được tài liệu hóa (không chỉ là tiêm lời nhắc).
4. Tuyên bố không được liệt kê trong [Ngoài phạm vi](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope).
5. Các khuyến cáo hiện có đã được kiểm tra để tránh trùng lặp (sử dụng GHSA chính thức khi có thể).
6. Các giả định triển khai được nêu rõ (loopback/cục bộ so với phơi bày, nhà điều hành tin cậy so với không tin cậy).

## Cơ sở tăng cường trong 60 giây

Sử dụng cơ sở này trước, sau đó chọn lọc bật lại công cụ cho từng agent tin cậy:

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

Nếu hơn một người có thể DM bot của bạn:

- Đặt `session.dmScope: "per-channel-peer"` (hoặc `"per-account-channel-peer"` cho các kênh nhiều tài khoản).
- Giữ `dmPolicy: "pairing"` hoặc danh sách cho phép nghiêm ngặt.
- Không bao giờ kết hợp DMs chia sẻ với quyền truy cập công cụ rộng.
- Điều này tăng cường hộp thư chung/hợp tác, nhưng không được thiết kế như cách ly đồng thuê thù địch khi người dùng chia sẻ quyền ghi cấu hình/máy chủ.

### Những gì kiểm tra audit (cấp cao)

- **Quyền truy cập inbound** (chính sách DM, chính sách nhóm, danh sách cho phép): người lạ có thể kích hoạt bot không?
- **Phạm vi công cụ** (công cụ nâng cao + phòng mở): liệu tiêm lời nhắc có thể biến thành hành động shell/tệp/mạng không?
- **Phơi bày mạng** (Gateway bind/auth, Tailscale Serve/Funnel, token xác thực yếu/ngắn).
- **Phơi bày kiểm soát trình duyệt** (node từ xa, cổng chuyển tiếp, điểm cuối CDP từ xa).
- **Vệ sinh đĩa cục bộ** (quyền, symlink, bao gồm cấu hình, đường dẫn "thư mục đồng bộ").
- **Plugins** (tiện ích mở rộng tồn tại mà không có danh sách cho phép rõ ràng).
- **Trôi dạt chính sách/cấu hình sai** (cài đặt docker sandbox được cấu hình nhưng chế độ sandbox tắt; mẫu `gateway.nodes.denyCommands` không hiệu quả vì khớp chỉ là tên lệnh chính xác (ví dụ `system.run`) và không kiểm tra văn bản shell; các mục `gateway.nodes.allowCommands` nguy hiểm; `tools.profile="minimal"` toàn cầu bị ghi đè bởi hồ sơ từng agent; công cụ plugin tiện ích mở rộng có thể truy cập dưới chính sách công cụ cho phép).
- **Trôi dạt kỳ vọng runtime** (ví dụ `tools.exec.host="sandbox"` trong khi chế độ sandbox tắt, điều này chạy trực tiếp trên máy chủ gateway).
- **Vệ sinh mô hình** (cảnh báo khi các mô hình được cấu hình trông cũ; không phải là chặn cứng).

Nếu bạn chạy `--deep`, OpenClaw cũng cố gắng thăm dò Gateway trực tiếp tốt nhất có thể.

## Bản đồ lưu trữ thông tin xác thực

Sử dụng điều này khi kiểm tra quyền truy cập hoặc quyết định những gì cần sao lưu:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env hoặc `channels.telegram.tokenFile` (chỉ tệp thông thường; symlink bị từ chối)
- **Discord bot token**: config/env hoặc SecretRef (nhà cung cấp env/file/exec)
- **Slack tokens**: config/env (`channels.slack.*`)
- **Danh sách cho phép ghép nối**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (tài khoản mặc định)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (tài khoản không mặc định)
- **Hồ sơ xác thực mô hình**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Tải trọng bí mật dựa trên tệp (tùy chọn)**: `~/.openclaw/secrets.json`
- **Nhập OAuth cũ**: `~/.openclaw/credentials/oauth.json`

## Danh sách kiểm tra bảo mật

Khi audit in ra các phát hiện, hãy coi đây là thứ tự ưu tiên:

1. **Bất kỳ thứ gì "mở" + công cụ được bật**: khóa DMs/nhóm trước (ghép nối/danh sách cho phép), sau đó thắt chặt chính sách công cụ/sandboxing.
2. **Phơi bày mạng công cộng** (LAN bind, Funnel, thiếu xác thực): sửa ngay lập tức.
3. **Phơi bày kiểm soát trình duyệt từ xa**: coi nó như quyền truy cập nhà điều hành (chỉ tailnet, ghép nối node có chủ ý, tránh phơi bày công cộng).
4. **Quyền**: đảm bảo trạng thái/cấu hình/thông tin xác thực/xác thực không thể đọc được bởi nhóm/thế giới.
5. **Plugins/tiện ích mở rộng**: chỉ tải những gì bạn tin tưởng rõ ràng.
6. **Lựa chọn mô hình**: ưu tiên các mô hình hiện đại, được tăng cường hướng dẫn cho bất kỳ bot nào có công cụ.

## Thuật ngữ kiểm tra bảo mật

Các giá trị `checkId` có tín hiệu cao mà bạn có thể thấy trong các triển khai thực tế (không đầy đủ):

| `checkId`                                          | Mức độ nghiêm trọng      | Tại sao nó quan trọng                                                                       | Khóa/đường dẫn sửa chính                                                                              | Tự động sửa |
| -------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | -------- |
| `fs.state_dir.perms_world_writable`                | nghiêm trọng      | Người dùng/quá trình khác có thể thay đổi trạng thái OpenClaw đầy đủ                                 | quyền hệ thống tệp trên `~/.openclaw`                                                                 | có      |
| `fs.config.perms_writable`                         | nghiêm trọng      | Người khác có thể thay đổi chính sách xác thực/công cụ/cấu hình                                            | quyền hệ thống tệp trên `~/.openclaw/openclaw.json`                                                   | có      |
| `fs.config.perms_world_readable`                   | nghiêm trọng      | Cấu hình có thể lộ token/cài đặt                                                    | quyền hệ thống tệp trên tệp cấu hình                                                                   | có      |
| `gateway.bind_no_auth`                             | nghiêm trọng      | Kết nối từ xa mà không có bí mật chia sẻ                                                    | `gateway.bind`, `gateway.auth.*`                                                                  | không       |
| `gateway.loopback_no_auth`                         | nghiêm trọng      | Loopback được reverse-proxy có thể trở thành không xác thực                                  | `gateway.auth.*`, cài đặt proxy                                                                     | không       |
| `gateway.http.no_auth`                             | cảnh báo/nghiêm trọng | API HTTP Gateway có thể truy cập với `auth.mode="none"`                                  | `gateway.auth.mode`, `gateway.http.endpoints.*`                                                   | không       |
| `gateway.tools_invoke_http.dangerous_allow`        | cảnh báo/nghiêm trọng | Cho phép lại các công cụ nguy hiểm qua API HTTP                                             | `gateway.tools.allow`                                                                             | không       |
| `gateway.nodes.allow_commands_dangerous`           | cảnh báo/nghiêm trọng | Cho phép các lệnh node có tác động cao (camera/màn hình/danh bạ/lịch/SMS)              | `gateway.nodes.allowCommands`                                                                     | không       |
| `gateway.tailscale_funnel`                         | nghiêm trọng      | Phơi bày internet công cộng                                                             | `gateway.tailscale.mode`                                                                          | không       |
| `gateway.control_ui.allowed_origins_required`      | nghiêm trọng      | Giao diện điều khiển không phải loopback mà không có danh sách cho phép nguồn trình duyệt rõ ràng                    | `gateway.controlUi.allowedOrigins`                                                                | không       |
| `gateway.control_ui.host_header_origin_fallback`   | cảnh báo/nghiêm trọng | Cho phép fallback nguồn tiêu đề Host (giảm cứng DNS rebinding)              | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`                                      | không       |
| `gateway.control_ui.insecure_auth`                 | cảnh báo          | Bật công tắc tương thích xác thực không an toàn                                           | `gateway.controlUi.allowInsecureAuth`                                                             | không       |
| `gateway.control_ui.device_auth_disabled`          | nghiêm trọng      | Vô hiệu hóa kiểm tra danh tính thiết bị                                                       | `gateway.controlUi.dangerouslyDisableDeviceAuth`                                                  | không       |
| `gateway.real_ip_fallback_enabled`                 | cảnh báo/nghiêm trọng | Tin tưởng fallback `X-Real-IP` có thể cho phép giả mạo IP nguồn qua cấu hình sai proxy      | `gateway.allowRealIpFallback`, `gateway.trustedProxies`                                           | không       |
| `discovery.mdns_full_mode`                         | cảnh báo/nghiêm trọng | Chế độ mDNS đầy đủ quảng cáo metadata `cliPath`/`sshPort` trên mạng cục bộ              | `discovery.mdns.mode`, `gateway.bind`                                                             | không       |
| `config.insecure_or_dangerous_flags`               | cảnh báo          | Bật bất kỳ cờ gỡ lỗi không an toàn/nguy hiểm nào                                           | nhiều khóa (xem chi tiết phát hiện)                                                                | không       |
| `hooks.token_reuse_gateway_token`                  | nghiêm trọng      | Token ingress hook cũng mở khóa xác thực Gateway                                         | `hooks.token`, `gateway.auth.token`                                                               | không       |
| `hooks.token_too_short`                            | cảnh báo          | Dễ dàng brute force trên ingress hook                                                   | `hooks.token`                                                                                     | không       |
| `hooks.default_session_key_unset`                  | cảnh báo          | Agent hook chạy fan out vào các phiên được tạo cho mỗi yêu cầu                          | `hooks.defaultSessionKey`                                                                         | không       |
| `hooks.allowed_agent_ids_unrestricted`             | cảnh báo/nghiêm trọng | Người gọi hook đã xác thực có thể định tuyến đến bất kỳ agent nào được cấu hình                         | `hooks.allowedAgentIds`                                                                           | không       |
| `hooks.request_session_key_enabled`                | cảnh báo/nghiêm trọng | Người gọi bên ngoài có thể chọn sessionKey                                                | `hooks.allowRequestSessionKey`                                                                    | không       |
| `hooks.request_session_key_prefixes_missing`       | cảnh báo/nghiêm trọng | Không có ràng buộc về hình dạng khóa phiên bên ngoài                                              | `hooks.allowedSessionKeyPrefixes`                                                                 | không       |
| `logging.redact_off`                               | cảnh báo          | Các giá trị nhạy cảm rò rỉ vào nhật ký/trạng thái                                                 | `logging.redactSensitive`                                                                         | có      |
| `sandbox.docker_config_mode_off`                   | cảnh báo          | Cấu hình Docker sandbox có mặt nhưng không hoạt động                                           | `agents.*.sandbox.mode`                                                                           | không       |
| `sandbox.dangerous_network_mode`                   | nghiêm trọng      | Mạng Docker sandbox sử dụng chế độ namespace-join `host` hoặc `container:*`              | `agents.*.sandbox.docker.network`                                                                 | không       |
| `tools.exec.host_sandbox_no_sandbox_defaults`      | cảnh báo          | `exec host=sandbox` giải quyết thành exec host khi sandbox tắt                        | `tools.exec.host`, `agents.defaults.sandbox.mode`                                                 | không       |
| `tools.exec.host_sandbox_no_sandbox_agents`        | cảnh báo          | `exec host=sandbox` cho từng agent giải quyết thành exec host khi sandbox tắt              | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode`                                     | không       |
| `tools.exec.safe_bins_interpreter_unprofiled`      | cảnh báo          | Các bin interpreter/runtime trong `safeBins` mà không có hồ sơ rõ ràng mở rộng rủi ro exec   | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*`                 | không       |
| `skills.workspace.symlink_escape`                  | cảnh báo          | `skills/**/SKILL.md` trong không gian làm việc giải quyết ngoài gốc không gian làm việc (trôi dạt chuỗi symlink) | trạng thái hệ thống tệp `skills/**` trong không gian làm việc                                                            | không       |
| `security.exposure.open_groups_with_elevated`      | nghiêm trọng      | Các nhóm mở + công cụ nâng cao tạo ra các đường dẫn tiêm lời nhắc có tác động cao               | `channels.*.groupPolicy`, `tools.elevated.*`                                                      | không       |
| `security.exposure.open_groups_with_runtime_or_fs` | nghiêm trọng/cảnh báo | Các nhóm mở có thể truy cập công cụ lệnh/tệp mà không có rào chắn sandbox/không gian làm việc            | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode` | không       |
| `security.trust_model.multi_user_heuristic`        | cảnh báo          | Cấu hình trông giống nhiều người dùng trong khi mô hình tin cậy gateway là trợ lý cá nhân              | tách ranh giới tin cậy, hoặc tăng cường người dùng chia sẻ (`sandbox.mode`, công cụ deny/phạm vi không gian làm việc)    | không       |
| `tools.profile_minimal_overridden`                 | cảnh báo          | Agent ghi đè bỏ qua hồ sơ tối thiểu toàn cầu                                        | `agents.list[].tools.profile`                                                                     | không       |
| `plugins.tools_reachable_permissive_policy`        | cảnh báo          | Công cụ tiện ích mở rộng có thể truy cập trong các ngữ cảnh cho phép                                     | `tools.profile` + công cụ cho phép/deny                                                                 | không       |
| `models.small_params`                              | nghiêm trọng/thông tin | Các mô hình nhỏ + bề mặt công cụ không an toàn tăng rủi ro tiêm                             | lựa chọn mô hình + chính sách sandbox/công cụ                                                                | không       |

## Giao diện điều khiển qua HTTP

Giao diện điều khiển cần một **ngữ cảnh an toàn** (HTTPS hoặc localhost) để tạo danh tính thiết bị. `gateway.controlUi.allowInsecureAuth` là một công tắc tương thích cục bộ:

- Trên localhost, nó cho phép xác thực giao diện điều khiển mà không cần danh tính thiết bị khi trang được tải qua HTTP không an toàn.
- Nó không vượt qua kiểm tra ghép nối.
- Nó không nới lỏng yêu cầu danh tính thiết bị từ xa (không phải localhost).

Ưu tiên HTTPS (Tailscale Serve) hoặc mở giao diện điều khiển trên `127.0.0.1`.

Chỉ cho các tình huống khẩn cấp, `gateway.controlUi.dangerouslyDisableDeviceAuth` vô hiệu hóa hoàn toàn kiểm tra danh tính thiết bị. Đây là một sự hạ cấp bảo mật nghiêm trọng; giữ nó tắt trừ khi bạn đang gỡ lỗi tích cực và có thể khôi phục nhanh chóng.

`openclaw security audit` cảnh báo khi cài đặt này được bật.

## Tóm tắt các cờ không an toàn hoặc nguy hiểm

`openclaw security audit` bao gồm `config.insecure_or_dangerous_flags` khi các công tắc gỡ lỗi không an toàn/nguy hiểm đã biết được bật. Kiểm tra đó hiện tổng hợp:

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`

Các khóa cấu hình `dangerous*` / `dangerously*` hoàn chỉnh được định nghĩa trong schema cấu hình OpenClaw:

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

## Cấu hình Reverse Proxy

Nếu bạn chạy Gateway sau một reverse proxy (nginx, Caddy, Traefik, v.v.), bạn nên cấu hình `gateway.trustedProxies` để phát hiện IP khách hàng chính xác.

Khi Gateway phát hiện các tiêu đề proxy từ một địa chỉ **không** nằm trong `trustedProxies`, nó sẽ **không** coi các kết nối là khách hàng cục bộ. Nếu xác thực gateway bị vô hiệu hóa, các kết nối đó sẽ bị từ chối. Điều này ngăn chặn vượt qua xác thực nơi các kết nối proxy sẽ xuất hiện như đến từ localhost và nhận được sự tin tưởng tự động.

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

## HSTS và ghi chú nguồn gốc

- Gateway OpenClaw là cục bộ/loopback trước tiên. Nếu bạn kết thúc TLS tại một reverse proxy, hãy đặt HSTS trên miền HTTPS đối diện proxy đó.
- Nếu gateway tự kết thúc HTTPS, bạn có thể đặt `gateway.http.securityHeaders.strictTransportSecurity` để phát ra tiêu đề HSTS từ các phản hồi OpenClaw.
- Hướng dẫn triển khai chi tiết có trong [Xác thực Proxy Tin cậy](/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Đối với các triển khai giao diện điều khiển không phải loopback, `gateway.controlUi.allowedOrigins` là bắt buộc theo mặc định.
- `gateway.controlUi.allowedOrigins: ["*"]` là một chính sách cho phép tất cả nguồn trình duyệt rõ ràng, không phải là mặc định được tăng cường. Tránh nó ngoài các thử nghiệm cục bộ được kiểm soát chặt chẽ.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ fallback nguồn tiêu đề Host; coi nó như một chính sách do nhà điều hành chọn nguy hiểm.
- Coi DNS rebinding và hành vi tiêu đề proxy-host như các mối quan tâm tăng cường triển khai; giữ `trustedProxies` chặt chẽ và tránh phơi bày gateway trực tiếp ra internet công cộng.

## Nhật ký phiên cục bộ sống trên đĩa

OpenClaw lưu trữ các bản ghi phiên trên đĩa dưới `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Điều này là cần thiết cho tính liên tục của phiên và (tùy chọn) lập chỉ mục bộ nhớ phiên, nhưng nó cũng có nghĩa là
**bất kỳ quá trình/người dùng nào có quyền truy cập hệ thống tệp có thể đọc các nhật ký đó**. Coi quyền truy cập đĩa là ranh giới tin cậy và khóa quyền trên `~/.openclaw` (xem phần audit bên dưới). Nếu bạn cần cách ly mạnh hơn giữa các agent, hãy chạy chúng dưới các người dùng hệ điều hành riêng biệt hoặc các máy chủ riêng biệt.

## Thực thi node (system.run)

Nếu một node macOS được ghép nối, Gateway có thể gọi `system.run` trên node đó. Đây là **thực thi mã từ xa** trên Mac:

- Yêu cầu ghép nối node (phê duyệt + token).
- Được kiểm soát trên Mac thông qua **Cài đặt → Phê duyệt thực thi** (bảo mật + hỏi + danh sách cho phép).
- Chế độ phê duyệt ràng buộc ngữ cảnh yêu cầu chính xác và, khi có thể, một tệp/script cục bộ cụ thể. Nếu OpenClaw không thể xác định chính xác một tệp cục bộ trực tiếp cho một lệnh interpreter/runtime, thực thi được hỗ trợ phê duyệt sẽ bị từ chối thay vì hứa hẹn bao phủ ngữ nghĩa đầy đủ.
- Nếu bạn không muốn thực thi từ xa, đặt bảo mật thành **deny** và loại bỏ ghép nối node cho Mac đó.

## Kỹ năng động (watcher / node từ xa)

OpenClaw có thể làm mới danh sách kỹ năng giữa phiên:

- **Watcher kỹ năng**: thay đổi `SKILL.md` có thể cập nhật ảnh chụp nhanh kỹ năng trong lượt agent tiếp theo.
- **Node từ xa**: kết nối một node macOS có thể làm cho các kỹ năng chỉ dành cho macOS đủ điều kiện (dựa trên thăm dò bin).

Coi thư mục kỹ năng như **mã tin cậy** và hạn chế ai có thể sửa đổi chúng.

## Mô hình mối đe dọa

Trợ lý AI của bạn có thể:

- Thực thi các lệnh shell tùy ý
- Đọc/ghi tệp
- Truy cập dịch vụ mạng
- Gửi tin nhắn cho bất kỳ ai (nếu bạn cấp quyền truy cập WhatsApp)

Những người nhắn tin cho bạn có thể:

- Cố gắng lừa AI của bạn làm điều xấu
- Kỹ thuật xã hội để truy cập dữ liệu của bạn
- Thăm dò chi tiết hạ tầng

## Khái niệm cốt lõi: kiểm soát truy cập trước trí tuệ

Hầu hết các thất bại ở đây không phải là các khai thác phức tạp — chúng là "ai đó đã nhắn tin cho bot và bot đã làm theo yêu cầu của họ."

Quan điểm của OpenClaw:

- **Danh tính trước tiên:** quyết định ai có thể nói chuyện với bot (ghép nối DM / danh sách cho phép / "mở" rõ ràng).
- **Phạm vi tiếp theo:** quyết định nơi bot được phép hành động (danh sách cho phép nhóm + chặn nhắc, công cụ, sandboxing, quyền thiết bị).
- **Mô hình cuối cùng:** giả định mô hình có thể bị thao túng; thiết kế sao cho thao túng có phạm vi ảnh hưởng hạn chế.

## Mô hình ủy quyền lệnh

Các lệnh và chỉ thị Slash chỉ được tôn trọng cho **người gửi được ủy quyền**. Ủy quyền được lấy từ
danh sách cho phép kênh/ghép nối cộng với `commands.useAccessGroups` (xem [Cấu hình](/gateway/configuration)
và [Lệnh Slash](/tools/slash-commands)). Nếu danh sách cho phép kênh trống hoặc bao gồm `"*"`,
các lệnh sẽ mở cho kênh đó.

`/exec` chỉ là một tiện ích phiên cho các nhà điều hành được ủy quyền. Nó **không** ghi cấu hình hoặc
thay đổi các phiên khác.

## Rủi ro công cụ mặt phẳng điều khiển

Hai công cụ tích hợp có thể thực hiện các thay đổi mặt phẳng điều khiển lâu dài:

- `gateway` có thể gọi `config.apply`, `config.patch`, và `update.run`.
- `cron` có thể tạo các công việc được lên lịch mà tiếp tục chạy sau khi cuộc trò chuyện/nhiệm vụ ban đầu kết thúc.

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
- Xem xét cấu hình plugin trước khi bật.
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

Đây là một ranh giới ngữ cảnh nhắn tin, không phải là ranh giới quản trị máy chủ. Nếu người dùng đối kháng với nhau và chia sẻ cùng một máy chủ/cấu hình Gateway, hãy chạy các gateway riêng biệt cho mỗi ranh giới tin cậy.

### Chế độ DM an toàn (được khuyến nghị)

Coi đoạn mã trên như **chế độ DM an toàn**:

- Mặc định: `session.dmScope: "main"` (tất cả các DM chia sẻ một phiên để có tính liên tục).
- Mặc định onboarding CLI cục bộ: ghi `session.dmScope: "per-channel-peer"` khi không được đặt (giữ các giá trị rõ ràng hiện có).
- Chế độ DM an toàn: `session.dmScope: "per-channel-peer"` (mỗi cặp kênh+người gửi có một ngữ cảnh DM cách ly).

Nếu bạn chạy nhiều tài khoản trên cùng một kênh, hãy sử dụng `per-account-channel-peer` thay thế. Nếu cùng một người liên hệ với bạn trên nhiều kênh, hãy sử dụng `session.identityLinks` để hợp nhất các phiên DM đó thành một danh tính chính. Xem [Quản lý phiên](/concepts/session) và [Cấu hình](/gateway/configuration).

## Danh sách cho phép (DM + nhóm) - thuật ngữ

OpenClaw có hai lớp "ai có thể kích hoạt tôi?" riêng biệt:

- **Danh sách cho phép DM** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; cũ: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): ai được phép nói chuyện với bot trong tin nhắn trực tiếp.
  - Khi `dmPolicy="pairing"`, các phê duyệt được ghi vào kho lưu trữ danh sách cho phép ghép nối theo tài khoản dưới `~/.openclaw/credentials/` (`<channel>-allowFrom.json` cho tài khoản mặc định, `<channel>-<accountId>-allowFrom.json` cho các tài khoản không mặc định), được hợp nhất với danh sách cho phép cấu hình.
- **Danh sách cho phép nhóm** (cụ thể cho kênh): nhóm/kênh/guild nào bot sẽ chấp nhận tin nhắn từ.
  - Các mẫu phổ biến:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: mặc định theo nhóm như `requireMention`; khi được đặt, nó cũng hoạt động như một danh sách cho phép nhóm (bao gồm `"*"` để giữ hành vi cho phép tất cả).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: hạn chế ai có thể kích hoạt bot _trong_ một phiên nhóm (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: danh sách cho phép theo bề mặt + mặc định nhắc.
  - Kiểm tra nhóm chạy theo thứ tự này: `groupPolicy`/danh sách cho phép nhóm trước, kích hoạt nhắc/trả lời thứ hai.
  - Trả lời một tin nhắn bot (nhắc ngầm) **không** vượt qua danh sách cho phép người gửi như `groupAllowFrom`.
  - **Lưu ý bảo mật:** coi `dmPolicy="open"` và `groupPolicy="open"` như các cài đặt cuối cùng. Chúng nên được sử dụng rất ít; ưu tiên ghép nối + danh sách cho phép trừ khi bạn hoàn toàn tin tưởng mọi thành viên trong phòng.

Chi tiết: [Cấu hình](/gateway/configuration) và [Nhóm](/channels/groups)

## Tiêm lời nhắc (nó là gì, tại sao nó quan trọng)

Tiêm lời nhắc là khi một kẻ tấn công tạo ra một tin nhắn để thao túng mô hình làm điều gì đó không an toàn (“bỏ qua hướng dẫn của bạn”, “đổ hệ thống tệp của bạn”, “theo liên kết này và chạy lệnh”, v.v.).

Ngay cả với các lời nhắc hệ thống mạnh mẽ, **tiêm lời nhắc không được giải quyết**. Các rào chắn lời nhắc hệ thống chỉ là hướng dẫn mềm; thực thi cứng đến từ chính sách công cụ, phê duyệt thực thi, sandboxing, và danh sách cho phép kênh (và các nhà điều hành có thể vô hiệu hóa chúng theo thiết kế). Những gì giúp trong thực tế:

- Giữ các DM inbound bị khóa (ghép nối/danh sách cho phép).
- Ưu tiên chặn nhắc trong nhóm; tránh bot "luôn bật" trong các phòng công cộng.
- Coi các liên kết, tệp đính kèm, và hướng dẫn dán là thù địch theo mặc định.
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

OpenClaw bao gồm các cờ bỏ qua rõ ràng vô hiệu hóa bao bọc an toàn nội dung bên ngoài:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Trường tải trọng Cron `allowUnsafeExternalContent`

Hướng dẫn:

- Giữ chúng không được đặt/false trong sản xuất.
- Chỉ bật tạm thời cho gỡ lỗi có phạm vi chặt chẽ.
- Nếu được bật, cách ly agent đó (sandbox + công cụ tối thiểu + không gian tên phiên chuyên dụng).

Lưu ý rủi ro hooks:

- Tải trọng hook là nội dung không tin cậy, ngay cả khi việc giao hàng đến từ các hệ thống bạn kiểm soát (mail/docs/nội dung web có thể mang theo tiêm lời nhắc).
- Các tầng mô hình yếu làm tăng rủi ro này. Đối với tự động hóa dựa trên hook, ưu tiên các tầng mô hình hiện đại mạnh mẽ và giữ chính sách công cụ chặt chẽ (`tools.profile: "messaging"` hoặc nghiêm ngặt hơn), cộng với sandboxing khi có thể.

### Tiêm Prompt không cần DMs công khai

Ngay cả khi **chỉ bạn** có thể nhắn tin cho bot, tiêm prompt vẫn có thể xảy ra qua bất kỳ **nội dung không tin cậy** nào mà bot đọc được (kết quả tìm kiếm web, trang trình duyệt, email, tài liệu, tệp đính kèm, log/code dán vào). Nói cách khác: người gửi không phải là bề mặt đe dọa duy nhất; **nội dung** cũng có thể mang theo hướng dẫn có hại.

Khi các công cụ được kích hoạt, rủi ro điển hình là rò rỉ ngữ cảnh hoặc kích hoạt các cuộc gọi công cụ. Giảm thiểu tác động bằng cách:

- Sử dụng một **agent đọc** chỉ đọc hoặc không có công cụ để tóm tắt nội dung không tin cậy, sau đó chuyển tóm tắt cho agent chính.
- Giữ `web_search` / `web_fetch` / `browser` tắt cho các agent có công cụ trừ khi cần thiết.
- Đối với đầu vào URL của OpenResponses (`input_file` / `input_image`), thiết lập chặt chẽ `gateway.http.endpoints.responses.files.urlAllowlist` và `gateway.http.endpoints.responses.images.urlAllowlist`, và giữ `maxUrlParts` thấp. Danh sách cho phép trống được coi là chưa thiết lập; sử dụng `files.allowUrl: false` / `images.allowUrl: false` nếu muốn tắt hoàn toàn việc lấy URL.
- Kích hoạt sandboxing và danh sách cho phép công cụ nghiêm ngặt cho bất kỳ agent nào xử lý đầu vào không tin cậy.
- Giữ bí mật ra khỏi prompt; truyền chúng qua env/config trên máy chủ gateway thay thế.

### Sức mạnh của mô hình (ghi chú bảo mật)

Khả năng chống tiêm prompt **không** đồng đều giữa các cấp mô hình. Các mô hình nhỏ hơn/rẻ hơn thường dễ bị lạm dụng công cụ và chiếm đoạt hướng dẫn hơn, đặc biệt là dưới các prompt có tính chất đối kháng.

<Warning>
Đối với các agent có công cụ hoặc đọc nội dung không tin cậy, rủi ro tiêm prompt với các mô hình cũ/nhỏ hơn thường quá cao. Không chạy các tác vụ đó trên các cấp mô hình yếu.
</Warning>

Khuyến nghị:

- **Sử dụng mô hình thế hệ mới nhất, cấp tốt nhất** cho bất kỳ bot nào có thể chạy công cụ hoặc xử lý tệp/mạng.
- **Không sử dụng các cấp cũ/yếu/nhỏ hơn** cho các agent có công cụ hoặc hộp thư không tin cậy; rủi ro tiêm prompt quá cao.
- Nếu phải sử dụng mô hình nhỏ hơn, **giảm thiểu tác động** (công cụ chỉ đọc, sandboxing mạnh, truy cập hệ thống tệp tối thiểu, danh sách cho phép nghiêm ngặt).
- Khi chạy các mô hình nhỏ, **kích hoạt sandboxing cho tất cả các phiên** và **tắt web_search/web_fetch/browser** trừ khi đầu vào được kiểm soát chặt chẽ.
- Đối với trợ lý cá nhân chỉ chat với đầu vào tin cậy và không có công cụ, các mô hình nhỏ thường ổn.

## Lý do & đầu ra chi tiết trong nhóm

`/reasoning` và `/verbose` có thể tiết lộ lý do nội bộ hoặc đầu ra công cụ không dành cho kênh công khai. Trong môi trường nhóm, coi chúng là **chỉ để gỡ lỗi** và giữ chúng tắt trừ khi thực sự cần.

Hướng dẫn:

- Giữ `/reasoning` và `/verbose` tắt trong các phòng công khai.
- Nếu bật chúng, chỉ làm vậy trong DMs tin cậy hoặc phòng được kiểm soát chặt chẽ.
- Nhớ rằng: đầu ra chi tiết có thể bao gồm tham số công cụ, URL và dữ liệu mà mô hình đã thấy.

## Cấu hình bảo mật (ví dụ)

### 0) Quyền tệp

Giữ cấu hình + trạng thái riêng tư trên máy chủ gateway:

- `~/.openclaw/openclaw.json`: `600` (chỉ đọc/ghi người dùng)
- `~/.openclaw`: `700` (chỉ người dùng)

`openclaw doctor` có thể cảnh báo và đề xuất thắt chặt các quyền này.

### 0.4) Phơi nhiễm mạng (bind + port + firewall)

Gateway kết hợp **WebSocket + HTTP** trên một cổng duy nhất:

- Mặc định: `18789`
- Cấu hình/cờ/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Bề mặt HTTP này bao gồm giao diện điều khiển và máy chủ canvas:

- Giao diện điều khiển (tài sản SPA) (đường dẫn cơ sở mặc định `/`)
- Máy chủ canvas: `/__openclaw__/canvas/` và `/__openclaw__/a2ui/` (HTML/JS tùy ý; coi như nội dung không tin cậy)

Nếu tải nội dung canvas trong trình duyệt thông thường, coi nó như bất kỳ trang web không tin cậy nào khác:

- Không phơi bày máy chủ canvas cho mạng/người dùng không tin cậy.
- Không để nội dung canvas chia sẻ cùng nguồn gốc với các bề mặt web đặc quyền trừ khi hoàn toàn hiểu rõ các tác động.

Chế độ bind kiểm soát nơi Gateway lắng nghe:

- `gateway.bind: "loopback"` (mặc định): chỉ các client cục bộ có thể kết nối.
- Các bind không loopback (`"lan"`, `"tailnet"`, `"custom"`) mở rộng bề mặt tấn công. Chỉ sử dụng chúng với token/mật khẩu chia sẻ và firewall thực sự.

Nguyên tắc chung:

- Ưu tiên Tailscale Serve hơn các bind LAN (Serve giữ Gateway trên loopback, và Tailscale xử lý truy cập).
- Nếu phải bind tới LAN, firewall cổng tới danh sách cho phép chặt chẽ của các IP nguồn; không chuyển tiếp cổng rộng rãi.
- Không bao giờ phơi bày Gateway không xác thực trên `0.0.0.0`.

### 0.4.1) Xuất bản cổng Docker + UFW (`DOCKER-USER`)

Nếu chạy OpenClaw với Docker trên VPS, nhớ rằng các cổng container được xuất bản (`-p HOST:CONTAINER` hoặc Compose `ports:`) được định tuyến qua các chuỗi chuyển tiếp của Docker, không chỉ các quy tắc `INPUT` của máy chủ.

Để giữ lưu lượng Docker phù hợp với chính sách firewall của bạn, thực thi các quy tắc trong `DOCKER-USER` (chuỗi này được đánh giá trước các quy tắc chấp nhận của Docker). Trên nhiều distro hiện đại, `iptables`/`ip6tables` sử dụng frontend `iptables-nft` và vẫn áp dụng các quy tắc này cho backend nftables.

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

IPv6 có các bảng riêng biệt. Thêm chính sách tương ứng trong `/etc/ufw/after6.rules` nếu Docker IPv6 được kích hoạt.

Tránh hardcode tên giao diện như `eth0` trong các đoạn mã tài liệu. Tên giao diện thay đổi giữa các hình ảnh VPS (`ens3`, `enp*`, v.v.) và sự không khớp có thể vô tình bỏ qua quy tắc từ chối của bạn.

Kiểm tra nhanh sau khi tải lại:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Các cổng bên ngoài mong đợi chỉ nên là những gì bạn cố ý phơi bày (đối với hầu hết các thiết lập: SSH + các cổng proxy ngược của bạn).

### 0.4.2) Khám phá mDNS/Bonjour (tiết lộ thông tin)

Gateway phát sóng sự hiện diện của nó qua mDNS (`_openclaw-gw._tcp` trên cổng 5353) để khám phá thiết bị cục bộ. Ở chế độ đầy đủ, điều này bao gồm các bản ghi TXT có thể tiết lộ chi tiết hoạt động:

- `cliPath`: đường dẫn hệ thống tệp đầy đủ tới CLI binary (tiết lộ tên người dùng và vị trí cài đặt)
- `sshPort`: quảng cáo khả năng SSH trên máy chủ
- `displayName`, `lanHost`: thông tin tên máy chủ

**Cân nhắc bảo mật hoạt động:** Phát sóng chi tiết hạ tầng làm cho việc trinh sát dễ dàng hơn cho bất kỳ ai trên mạng cục bộ. Ngay cả thông tin "vô hại" như đường dẫn hệ thống tệp và khả năng SSH cũng giúp kẻ tấn công lập bản đồ môi trường của bạn.

**Khuyến nghị:**

1. **Chế độ tối thiểu** (mặc định, khuyến nghị cho các gateway phơi bày): bỏ qua các trường nhạy cảm khỏi các bản phát sóng mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **Tắt hoàn toàn** nếu không cần khám phá thiết bị cục bộ:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **Chế độ đầy đủ** (tùy chọn): bao gồm `cliPath` + `sshPort` trong các bản ghi TXT:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **Biến môi trường** (thay thế): đặt `OPENCLAW_DISABLE_BONJOUR=1` để tắt mDNS mà không cần thay đổi cấu hình.

Ở chế độ tối thiểu, Gateway vẫn phát sóng đủ để khám phá thiết bị (`role`, `gatewayPort`, `transport`) nhưng bỏ qua `cliPath` và `sshPort`. Các ứng dụng cần thông tin đường dẫn CLI có thể lấy nó qua kết nối WebSocket đã xác thực.

### 0.5) Khóa WebSocket Gateway (xác thực cục bộ)

Xác thực Gateway là **bắt buộc theo mặc định**. Nếu không có token/mật khẩu nào được cấu hình, Gateway từ chối các kết nối WebSocket (đóng thất bại).

Quá trình onboarding tạo ra một token theo mặc định (ngay cả cho loopback) nên các client cục bộ phải xác thực.

Đặt một token để **tất cả** các client WS phải xác thực:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor có thể tạo một cho bạn: `openclaw doctor --generate-gateway-token`.

Lưu ý: `gateway.remote.token` / `.password` là các nguồn thông tin xác thực client. Chúng **không** bảo vệ truy cập WS cục bộ tự chúng.
Các đường dẫn gọi cục bộ có thể sử dụng `gateway.remote.*` như dự phòng chỉ khi `gateway.auth.*` chưa được thiết lập.
Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef và không được giải quyết, việc giải quyết sẽ thất bại (không có che giấu dự phòng từ xa).
Tùy chọn: ghim TLS từ xa với `gateway.remote.tlsFingerprint` khi sử dụng `wss://`.
`ws://` không mã hóa chỉ dành cho loopback theo mặc định. Đối với các đường dẫn mạng riêng tư tin cậy, đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trên tiến trình client như một biện pháp khẩn cấp.

Ghép nối thiết bị cục bộ:

- Ghép nối thiết bị được tự động phê duyệt cho các kết nối **cục bộ** (loopback hoặc địa chỉ tailnet của chính máy chủ gateway) để giữ cho các client cùng máy chủ mượt mà.
- Các peer tailnet khác **không** được coi là cục bộ; chúng vẫn cần phê duyệt ghép nối.

Chế độ xác thực:

- `gateway.auth.mode: "token"`: token chia sẻ (khuyến nghị cho hầu hết các thiết lập).
- `gateway.auth.mode: "password"`: xác thực mật khẩu (ưu tiên thiết lập qua env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: tin tưởng một proxy ngược nhận diện để xác thực người dùng và truyền nhận diện qua các header (xem [Trusted Proxy Auth](/gateway/trusted-proxy-auth)).

Danh sách kiểm tra xoay vòng (token/mật khẩu):

1. Tạo/đặt một bí mật mới (`gateway.auth.token` hoặc `OPENCLAW_GATEWAY_PASSWORD`).
2. Khởi động lại Gateway (hoặc khởi động lại ứng dụng macOS nếu nó giám sát Gateway).
3. Cập nhật bất kỳ client từ xa nào (`gateway.remote.token` / `.password` trên các máy gọi vào Gateway).
4. Xác minh rằng bạn không thể kết nối với thông tin xác thực cũ.

### 0.6) Header nhận diện Tailscale Serve

Khi `gateway.auth.allowTailscale` là `true` (mặc định cho Serve), OpenClaw chấp nhận các header nhận diện Tailscale Serve (`tailscale-user-login`) cho xác thực Control UI/WebSocket. OpenClaw xác minh nhận diện bằng cách giải quyết địa chỉ `x-forwarded-for` thông qua daemon Tailscale cục bộ (`tailscale whois`) và khớp nó với header. Điều này chỉ kích hoạt cho các yêu cầu đánh vào loopback và bao gồm `x-forwarded-for`, `x-forwarded-proto`, và `x-forwarded-host` như được tiêm bởi Tailscale.
Các điểm cuối API HTTP (ví dụ `/v1/*`, `/tools/invoke`, và `/api/channels/*`) vẫn yêu cầu xác thực token/mật khẩu.

Lưu ý quan trọng về ranh giới:

- Xác thực HTTP bearer của Gateway thực chất là quyền truy cập toàn bộ của nhà điều hành.
- Xem các thông tin xác thực có thể gọi `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`, hoặc `/api/channels/*` như các bí mật của nhà điều hành truy cập toàn bộ cho gateway đó.
- Không chia sẻ các thông tin xác thực này với các người gọi không tin cậy; ưu tiên các gateway riêng biệt cho mỗi ranh giới tin cậy.

**Giả định tin cậy:** xác thực Serve không có token giả định máy chủ gateway là tin cậy. Không coi đây là bảo vệ chống lại các tiến trình cùng máy chủ thù địch. Nếu mã cục bộ không tin cậy có thể chạy trên máy chủ gateway, tắt `gateway.auth.allowTailscale` và yêu cầu xác thực token/mật khẩu.

**Quy tắc bảo mật:** không chuyển tiếp các header này từ proxy ngược của bạn. Nếu bạn kết thúc TLS hoặc proxy trước gateway, tắt `gateway.auth.allowTailscale` và sử dụng xác thực token/mật khẩu (hoặc [Trusted Proxy Auth](/gateway/trusted-proxy-auth)) thay thế.

Proxy tin cậy:

- Nếu bạn kết thúc TLS trước Gateway, đặt `gateway.trustedProxies` thành các IP proxy của bạn.
- OpenClaw sẽ tin tưởng `x-forwarded-for` (hoặc `x-real-ip`) từ các IP đó để xác định IP client cho các kiểm tra ghép nối cục bộ và xác thực HTTP/kiểm tra cục bộ.
- Đảm bảo proxy của bạn **ghi đè** `x-forwarded-for` và chặn truy cập trực tiếp vào cổng Gateway.

Xem [Tailscale](/gateway/tailscale) và [Tổng quan Web](/web).

### 0.6.1) Kiểm soát trình duyệt qua máy chủ node (khuyến nghị)

Nếu Gateway của bạn là từ xa nhưng trình duyệt chạy trên máy khác, chạy một **máy chủ node** trên máy trình duyệt và để Gateway proxy các hành động trình duyệt (xem [Công cụ trình duyệt](/tools/browser)). Coi ghép nối node như quyền truy cập quản trị.

Mẫu khuyến nghị:

- Giữ Gateway và máy chủ node trên cùng một tailnet (Tailscale).
- Ghép nối node có chủ ý; tắt định tuyến proxy trình duyệt nếu không cần.

Tránh:

- Phơi bày các cổng điều khiển/chuyển tiếp qua LAN hoặc Internet công cộng.
- Tailscale Funnel cho các điểm cuối điều khiển trình duyệt (phơi bày công cộng).

### 0.7) Bí mật trên đĩa (dữ liệu nhạy cảm)

Giả định rằng bất kỳ thứ gì dưới `~/.openclaw/` (hoặc `$OPENCLAW_STATE_DIR/`) có thể chứa bí mật hoặc dữ liệu riêng tư:

- `openclaw.json`: cấu hình có thể bao gồm token (gateway, gateway từ xa), cài đặt nhà cung cấp, và danh sách cho phép.
- `credentials/**`: thông tin xác thực kênh (ví dụ: thông tin xác thực WhatsApp), danh sách cho phép ghép nối, nhập OAuth cũ.
- `agents/<agentId>/agent/auth-profiles.json`: khóa API, hồ sơ token, token OAuth, và tùy chọn `keyRef`/`tokenRef`.
- `secrets.json` (tùy chọn): tải trọng bí mật dựa trên tệp được sử dụng bởi các nhà cung cấp SecretRef `file` (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: tệp tương thích cũ. Các mục `api_key` tĩnh bị xóa khi được phát hiện.
- `agents/<agentId>/sessions/**`: bản ghi phiên (`*.jsonl`) + siêu dữ liệu định tuyến (`sessions.json`) có thể chứa tin nhắn riêng tư và đầu ra công cụ.
- `extensions/**`: các plugin đã cài đặt (cùng với `node_modules/` của chúng).
- `sandboxes/**`: không gian làm việc sandbox công cụ; có thể tích lũy các bản sao của các tệp bạn đọc/ghi trong sandbox.

Mẹo bảo mật:

- Giữ quyền chặt chẽ (`700` trên thư mục, `600` trên tệp).
- Sử dụng mã hóa toàn bộ đĩa trên máy chủ gateway.
- Ưu tiên một tài khoản người dùng hệ điều hành riêng biệt cho Gateway nếu máy chủ được chia sẻ.

### 0.8) Nhật ký + bản ghi (xóa + lưu trữ)

Nhật ký và bản ghi có thể rò rỉ thông tin nhạy cảm ngay cả khi các kiểm soát truy cập là chính xác:

- Nhật ký Gateway có thể bao gồm tóm tắt công cụ, lỗi, và URL.
- Bản ghi phiên có thể bao gồm các bí mật dán vào, nội dung tệp, đầu ra lệnh, và liên kết.

Khuyến nghị:

- Giữ xóa tóm tắt công cụ bật (`logging.redactSensitive: "tools"`; mặc định).
- Thêm các mẫu tùy chỉnh cho môi trường của bạn qua `logging.redactPatterns` (token, tên máy chủ, URL nội bộ).
- Khi chia sẻ chẩn đoán, ưu tiên `openclaw status --all` (có thể dán, bí mật đã xóa) hơn nhật ký thô.
- Cắt tỉa các bản ghi phiên cũ và tệp nhật ký nếu không cần lưu trữ lâu dài.

Chi tiết: [Nhật ký](/gateway/logging)

### 1) DMs: ghép nối theo mặc định

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2) Nhóm: yêu cầu đề cập ở mọi nơi

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

Trong các cuộc trò chuyện nhóm, chỉ phản hồi khi được đề cập rõ ràng.

### 3. Số riêng biệt

Cân nhắc chạy AI của bạn trên một số điện thoại riêng biệt với số cá nhân của bạn:

- Số cá nhân: Cuộc trò chuyện của bạn được giữ riêng tư
- Số bot: AI xử lý các cuộc trò chuyện này, với các ranh giới thích hợp

### 4. Chế độ chỉ đọc (Hôm nay, qua sandbox + công cụ)

Bạn có thể xây dựng một hồ sơ chỉ đọc bằng cách kết hợp:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (hoặc `"none"` để không có quyền truy cập không gian làm việc)
- danh sách cho phép/chặn công cụ chặn `write`, `edit`, `apply_patch`, `exec`, `process`, v.v.

Chúng tôi có thể thêm một cờ `readOnlyMode` đơn giản sau này để đơn giản hóa cấu hình này.

Các tùy chọn bảo mật bổ sung:

- `tools.exec.applyPatch.workspaceOnly: true` (mặc định): đảm bảo `apply_patch` không thể ghi/xóa ngoài thư mục không gian làm việc ngay cả khi sandboxing tắt. Đặt thành `false` chỉ khi bạn cố ý muốn `apply_patch` chạm vào các tệp ngoài không gian làm việc.
- `tools.fs.workspaceOnly: true` (tùy chọn): giới hạn các đường dẫn `read`/`write`/`edit`/`apply_patch` và các đường dẫn tự động tải hình ảnh prompt gốc vào thư mục không gian làm việc (hữu ích nếu bạn cho phép các đường dẫn tuyệt đối hôm nay và muốn một rào chắn duy nhất).
- Giữ các gốc hệ thống tệp hẹp: tránh các gốc rộng như thư mục chính của bạn cho các không gian làm việc của agent/sandbox. Các gốc rộng có thể phơi bày các tệp cục bộ nhạy cảm (ví dụ trạng thái/cấu hình dưới `~/.openclaw`) cho các công cụ hệ thống tệp.

### 5) Cấu hình an toàn cơ bản (sao chép/dán)

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

Nếu bạn muốn thực thi công cụ "an toàn hơn theo mặc định" nữa, thêm một sandbox + chặn các công cụ nguy hiểm cho bất kỳ agent không phải chủ sở hữu nào (ví dụ dưới "Hồ sơ truy cập theo agent").

Cấu hình cơ bản tích hợp cho các lượt agent điều khiển qua chat: người gửi không phải chủ sở hữu không thể sử dụng các công cụ `cron` hoặc `gateway`.

## Sandboxing (khuyến nghị)

Tài liệu chuyên dụng: [Sandboxing](/gateway/sandboxing)

Hai cách tiếp cận bổ sung:

- **Chạy toàn bộ Gateway trong Docker** (ranh giới container): [Docker](/install/docker)
- **Sandbox công cụ** (`agents.defaults.sandbox`, gateway host + công cụ cách ly Docker): [Sandboxing](/gateway/sandboxing)

Lưu ý: để ngăn chặn truy cập chéo agent, giữ `agents.defaults.sandbox.scope` ở `"agent"` (mặc định) hoặc `"session"` để cách ly nghiêm ngặt hơn theo phiên. `scope: "shared"` sử dụng một container/không gian làm việc duy nhất.

Cũng xem xét quyền truy cập không gian làm việc của agent trong sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (mặc định) giữ không gian làm việc của agent ngoài tầm với; các công cụ chạy chống lại một không gian làm việc sandbox dưới `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` gắn không gian làm việc của agent chỉ đọc tại `/agent` (vô hiệu hóa `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` gắn không gian làm việc của agent đọc/ghi tại `/workspace`

Quan trọng: `tools.elevated` là lối thoát toàn cầu chạy exec trên máy chủ. Giữ `tools.elevated.allowFrom` chặt chẽ và không kích hoạt nó cho người lạ. Bạn có thể hạn chế thêm quyền nâng cao theo agent qua `agents.list[].tools.elevated`. Xem [Chế độ Nâng cao](/tools/elevated).

### Rào chắn ủy quyền sub-agent

Nếu bạn cho phép các công cụ phiên, coi các lượt chạy sub-agent được ủy quyền như một quyết định ranh giới khác:

- Từ chối `sessions_spawn` trừ khi agent thực sự cần ủy quyền.
- Giữ `agents.list[].subagents.allowAgents` hạn chế đối với các agent mục tiêu an toàn đã biết.
- Đối với bất kỳ quy trình làm việc nào phải duy trì trong sandbox, gọi `sessions_spawn` với `sandbox: "require"` (mặc định là `inherit`).
- `sandbox: "require"` thất bại nhanh khi runtime con mục tiêu không được sandbox.

## Rủi ro kiểm soát trình duyệt

Kích hoạt kiểm soát trình duyệt cho phép mô hình điều khiển một trình duyệt thực sự. Nếu hồ sơ trình duyệt đó đã chứa các phiên đăng nhập, mô hình có thể truy cập các tài khoản và dữ liệu đó. Coi các hồ sơ trình duyệt như **trạng thái nhạy cảm**:

- Ưu tiên một hồ sơ riêng biệt cho agent (hồ sơ mặc định `openclaw`).
- Tránh chỉ định agent vào hồ sơ trình duyệt cá nhân hàng ngày của bạn.
- Giữ kiểm soát trình duyệt máy chủ tắt cho các agent được sandbox trừ khi bạn tin tưởng chúng.
- Coi các tải xuống trình duyệt như đầu vào không tin cậy; ưu tiên một thư mục tải xuống cách ly.
- Tắt đồng bộ hóa trình duyệt/quản lý mật khẩu trong hồ sơ agent nếu có thể (giảm tác động).
- Đối với các gateway từ xa, giả định "kiểm soát trình duyệt" tương đương với "quyền truy cập nhà điều hành" vào bất kỳ thứ gì hồ sơ đó có thể truy cập.
- Giữ Gateway và máy chủ node chỉ tailnet; tránh phơi bày các cổng điều khiển trình duyệt ra LAN hoặc Internet công cộng.
- Tắt định tuyến proxy trình duyệt khi không cần (`gateway.nodes.browser.mode="off"`).
- Chế độ phiên hiện có của Chrome MCP **không** "an toàn hơn"; nó có thể hành động như bạn trong bất kỳ thứ gì hồ sơ Chrome của máy chủ đó có thể truy cập.

### Chính sách SSRF trình duyệt (mặc định mạng tin cậy)

Chính sách mạng trình duyệt của OpenClaw mặc định theo mô hình nhà điều hành tin cậy: các điểm đến riêng tư/nội bộ được phép trừ khi bạn tắt chúng rõ ràng.

- Mặc định: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` (ngầm định khi chưa thiết lập).
- Alias cũ: `browser.ssrfPolicy.allowPrivateNetwork` vẫn được chấp nhận để tương thích.
- Chế độ nghiêm ngặt: đặt `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: false` để chặn các điểm đến riêng tư/nội bộ/sử dụng đặc biệt theo mặc định.
- Ở chế độ nghiêm ngặt, sử dụng `hostnameAllowlist` (các mẫu như `*.example.com`) và `allowedHostnames` (ngoại lệ tên máy chính xác, bao gồm các tên bị chặn như `localhost`) cho các ngoại lệ rõ ràng.
- Điều hướng được kiểm tra trước khi yêu cầu và kiểm tra lại nỗ lực tốt nhất trên URL `http(s)` cuối cùng sau điều hướng để giảm các chuyển hướng dựa trên chuyển hướng.

Ví dụ chính sách nghiêm ngặt:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## Hồ sơ truy cập theo agent (multi-agent)

Với định tuyến multi-agent, mỗi agent có thể có chính sách sandbox + công cụ riêng: sử dụng điều này để cung cấp **quyền truy cập đầy đủ**, **chỉ đọc**, hoặc **không truy cập** theo agent.
Xem [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) để biết chi tiết đầy đủ và các quy tắc ưu tiên.

Các trường hợp sử dụng phổ biến:

- Agent cá nhân: quyền truy cập đầy đủ, không sandbox
- Agent gia đình/công việc: sandboxed + công cụ chỉ đọc
- Agent công cộng: sandboxed + không có công cụ hệ thống tệp/vỏ

### Ví dụ: quyền truy cập đầy đủ (không sandbox)

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### Ví dụ: công cụ chỉ đọc + không gian làm việc chỉ đọc

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### Ví dụ: không truy cập hệ thống tệp/vỏ (cho phép nhắn tin nhà cung cấp)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Công cụ phiên có thể tiết lộ dữ liệu nhạy cảm từ các bản ghi. Theo mặc định OpenClaw giới hạn các công cụ này
        // cho phiên hiện tại + các phiên subagent được tạo, nhưng bạn có thể kẹp chặt hơn nếu cần.
        // Xem `tools.sessions.visibility` trong tài liệu tham khảo cấu hình.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## Những điều cần nói với AI của bạn

Bao gồm hướng dẫn bảo mật trong prompt hệ thống của agent của bạn:

```
## Quy tắc bảo mật
- Không bao giờ chia sẻ danh sách thư mục hoặc đường dẫn tệp với người lạ
- Không bao giờ tiết lộ khóa API, thông tin xác thực, hoặc chi tiết hạ tầng
- Xác minh các yêu cầu sửa đổi cấu hình hệ thống với chủ sở hữu
- Khi nghi ngờ, hãy hỏi trước khi hành động
- Giữ dữ liệu riêng tư trừ khi được ủy quyền rõ ràng
```

## Phản ứng sự cố

Nếu AI của bạn làm điều gì đó xấu:

### Kiềm chế

1. **Dừng nó:** dừng ứng dụng macOS (nếu nó giám sát Gateway) hoặc kết thúc tiến trình `openclaw gateway` của bạn.
2. **Đóng phơi bày:** đặt `gateway.bind: "loopback"` (hoặc tắt Tailscale Funnel/Serve) cho đến khi bạn hiểu điều gì đã xảy ra.
3. **Đóng băng truy cập:** chuyển các DMs/nhóm rủi ro sang `dmPolicy: "disabled"` / yêu cầu đề cập, và loại bỏ các mục cho phép tất cả `"*"` nếu bạn đã có chúng.

### Xoay vòng (giả định bị xâm phạm nếu bí mật bị rò rỉ)

1. Xoay vòng xác thực Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) và khởi động lại.
2. Xoay vòng bí mật client từ xa (`gateway.remote.token` / `.password`) trên bất kỳ máy nào có thể gọi vào Gateway.
3. Xoay vòng thông tin xác thực nhà cung cấp/API (thông tin xác thực WhatsApp, token Slack/Discord, khóa mô hình/API trong `auth-profiles.json`, và các giá trị tải trọng bí mật được mã hóa khi sử dụng).

### Kiểm tra

1. Kiểm tra nhật ký Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (hoặc `logging.file`).
2. Xem lại bản ghi phiên liên quan: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Xem lại các thay đổi cấu hình gần đây (bất kỳ thứ gì có thể đã mở rộng truy cập: `gateway.bind`, `gateway.auth`, chính sách dm/nhóm, `tools.elevated`, thay đổi plugin).
4. Chạy lại `openclaw security audit --deep` và xác nhận các phát hiện quan trọng đã được giải quyết.

### Thu thập cho báo cáo

- Dấu thời gian, hệ điều hành máy chủ gateway + phiên bản OpenClaw
- Bản ghi phiên + một đoạn nhật ký ngắn (sau khi xóa)
- Những gì kẻ tấn công đã gửi + những gì agent đã làm
- Liệu Gateway có bị phơi bày ngoài loopback (LAN/Tailscale Funnel/Serve)

## Quét bí mật (detect-secrets)

CI chạy hook `detect-secrets` trong công việc `secrets`.
Các lần đẩy vào `main` luôn chạy quét tất cả các tệp. Các yêu cầu kéo sử dụng đường dẫn nhanh tệp thay đổi khi có sẵn commit cơ sở, và quay lại quét tất cả các tệp nếu không. Nếu nó thất bại, có các ứng viên mới chưa có trong cơ sở.

### Nếu CI thất bại

1. Tái tạo cục bộ:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. Hiểu các công cụ:
   - `detect-secrets` trong pre-commit chạy `detect-secrets-hook` với cơ sở và loại trừ của repo.
   - `detect-secrets audit` mở một đánh giá tương tác để đánh dấu từng mục cơ sở là thực hay dương tính giả.
3. Đối với các bí mật thực: xoay vòng/xóa chúng, sau đó chạy lại quét để cập nhật cơ sở.
4. Đối với các dương tính giả: chạy đánh giá tương tác và đánh dấu chúng là giả:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. Nếu cần loại trừ mới, thêm chúng vào `.detect-secrets.cfg` và tạo lại cơ sở với các cờ `--exclude-files` / `--exclude-lines` phù hợp (tệp cấu hình chỉ là tham khảo; detect-secrets không đọc nó tự động).

Commit `.secrets.baseline` đã cập nhật khi nó phản ánh trạng thái dự định.

## Báo cáo vấn đề bảo mật

Tìm thấy lỗ hổng trong OpenClaw? Vui lòng báo cáo có trách nhiệm:

1. Email: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Đừng đăng công khai cho đến khi được sửa
3. Chúng tôi sẽ ghi nhận bạn (trừ khi bạn muốn ẩn danh)
