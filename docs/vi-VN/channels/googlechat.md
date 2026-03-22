---
summary: "Trạng thái hỗ trợ, khả năng và cấu hình ứng dụng Google Chat"
read_when:
  - Đang làm việc với các tính năng kênh Google Chat
title: "Google Chat"
---

# Google Chat (Chat API)

Trạng thái: sẵn sàng cho tin nhắn trực tiếp và không gian qua webhook Google Chat API (chỉ HTTP).

## Thiết lập nhanh (dành cho người mới)

1. Tạo một dự án Google Cloud và kích hoạt **Google Chat API**.
   - Truy cập: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Kích hoạt API nếu chưa được kích hoạt.
2. Tạo một **Tài khoản Dịch vụ**:
   - Nhấn **Create Credentials** > **Service Account**.
   - Đặt tên tùy ý (ví dụ: `openclaw-chat`).
   - Để trống phần quyền (nhấn **Continue**).
   - Để trống phần người dùng có quyền truy cập (nhấn **Done**).
3. Tạo và tải xuống **Khóa JSON**:
   - Trong danh sách tài khoản dịch vụ, nhấp vào tài khoản vừa tạo.
   - Chuyển đến tab **Keys**.
   - Nhấp **Add Key** > **Create new key**.
   - Chọn **JSON** và nhấn **Create**.
4. Lưu file JSON đã tải xuống trên máy chủ gateway (ví dụ: `~/.openclaw/googlechat-service-account.json`).
5. Tạo một ứng dụng Google Chat trong [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Điền thông tin **Application info**:
     - **App name**: (ví dụ: `OpenClaw`)
     - **Avatar URL**: (ví dụ: `https://openclaw.ai/logo.png`)
     - **Description**: (ví dụ: `Trợ lý AI cá nhân`)
   - Kích hoạt **Interactive features**.
   - Dưới **Functionality**, chọn **Join spaces and group conversations**.
   - Dưới **Connection settings**, chọn **HTTP endpoint URL**.
   - Dưới **Triggers**, chọn **Use a common HTTP endpoint URL for all triggers** và đặt URL công khai của gateway theo sau là `/googlechat`.
     - _Mẹo: Chạy `openclaw status` để tìm URL công khai của gateway._
   - Dưới **Visibility**, chọn **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;**.
   - Nhập địa chỉ email của bạn (ví dụ: `user@example.com`) vào ô văn bản.
   - Nhấp **Save** ở dưới cùng.
6. **Kích hoạt trạng thái ứng dụng**:
   - Sau khi lưu, **làm mới trang**.
   - Tìm phần **App status** (thường ở gần đầu hoặc cuối sau khi lưu).
   - Thay đổi trạng thái thành **Live - available to users**.
   - Nhấp **Save** lần nữa.
7. Cấu hình OpenClaw với đường dẫn tài khoản dịch vụ + đối tượng webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Hoặc config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Đặt loại đối tượng webhook + giá trị (khớp với cấu hình ứng dụng Chat của bạn).
9. Khởi động gateway. Google Chat sẽ gửi POST đến đường dẫn webhook của bạn.

## Thêm vào Google Chat

Khi gateway đang chạy và email của bạn đã được thêm vào danh sách hiển thị:

1. Truy cập [Google Chat](https://chat.google.com/).
2. Nhấp vào biểu tượng **+** bên cạnh **Direct Messages**.
3. Trong thanh tìm kiếm (nơi bạn thường thêm người), nhập **App name** bạn đã cấu hình trong Google Cloud Console.
   - **Lưu ý**: Bot sẽ _không_ xuất hiện trong danh sách duyệt "Marketplace" vì đây là ứng dụng riêng tư. Bạn phải tìm kiếm theo tên.
4. Chọn bot của bạn từ kết quả.
5. Nhấp **Add** hoặc **Chat** để bắt đầu cuộc trò chuyện 1:1.
6. Gửi "Hello" để kích hoạt trợ lý!

## URL công khai (Chỉ webhook)

Webhook Google Chat yêu cầu một endpoint HTTPS công khai. Để bảo mật, **chỉ nên mở đường dẫn `/googlechat`** ra internet. Giữ dashboard OpenClaw và các endpoint nhạy cảm khác trong mạng riêng của bạn.

### Lựa chọn A: Tailscale Funnel (Khuyến nghị)

Sử dụng Tailscale Serve cho dashboard riêng tư và Funnel cho đường dẫn webhook công khai. Điều này giữ `/` riêng tư trong khi chỉ mở `/googlechat`.

1. **Kiểm tra địa chỉ mà gateway của bạn đang kết nối:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Ghi lại địa chỉ IP (ví dụ: `127.0.0.1`, `0.0.0.0`, hoặc IP Tailscale của bạn như `100.x.x.x`).

2. **Chỉ mở dashboard cho tailnet (cổng 8443):**

   ```bash
   # Nếu kết nối với localhost (127.0.0.1 hoặc 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Nếu kết nối chỉ với IP Tailscale (ví dụ: 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Chỉ mở đường dẫn webhook công khai:**

   ```bash
   # Nếu kết nối với localhost (127.0.0.1 hoặc 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Nếu kết nối chỉ với IP Tailscale (ví dụ: 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Ủy quyền cho node để truy cập Funnel:**
   Nếu được yêu cầu, truy cập URL ủy quyền hiển thị trong output để kích hoạt Funnel cho node này trong chính sách tailnet của bạn.

5. **Xác minh cấu hình:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL webhook công khai của bạn sẽ là:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Dashboard riêng tư của bạn chỉ dành cho tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Sử dụng URL công khai (không có `:8443`) trong cấu hình ứng dụng Google Chat.

> Lưu ý: Cấu hình này sẽ tồn tại qua các lần khởi động lại. Để xóa sau này, chạy `tailscale funnel reset` và `tailscale serve reset`.

### Lựa chọn B: Reverse Proxy (Caddy)

Nếu bạn sử dụng reverse proxy như Caddy, chỉ proxy đường dẫn cụ thể:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Với cấu hình này, bất kỳ yêu cầu nào đến `your-domain.com/` sẽ bị bỏ qua hoặc trả về 404, trong khi `your-domain.com/googlechat` được định tuyến an toàn đến OpenClaw.

### Lựa chọn C: Cloudflare Tunnel

Cấu hình quy tắc ingress của tunnel để chỉ định tuyến đường dẫn webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Cách hoạt động

1. Google Chat gửi các yêu cầu POST webhook đến gateway. Mỗi yêu cầu bao gồm một header `Authorization: Bearer <token>`.
   - OpenClaw xác minh xác thực bearer trước khi đọc/phân tích toàn bộ nội dung webhook khi header có mặt.
   - Các yêu cầu Google Workspace Add-on mang `authorizationEventObject.systemIdToken` trong nội dung được hỗ trợ qua ngân sách tiền xác thực nghiêm ngặt hơn.
2. OpenClaw xác minh token dựa trên `audienceType` + `audience` đã cấu hình:
   - `audienceType: "app-url"` → audience là URL webhook HTTPS của bạn.
   - `audienceType: "project-number"` → audience là số dự án Cloud.
3. Tin nhắn được định tuyến theo không gian:
   - Tin nhắn trực tiếp sử dụng khóa phiên `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Không gian sử dụng khóa phiên `agent:<agentId>:googlechat:group:<spaceId>`.
4. Truy cập tin nhắn trực tiếp mặc định là ghép đôi. Người gửi không xác định nhận mã ghép đôi; phê duyệt với:
   - `openclaw pairing approve googlechat <code>`
5. Không gian nhóm yêu cầu @-mention mặc định. Sử dụng `botUser` nếu phát hiện mention cần tên người dùng của ứng dụng.

## Mục tiêu

Sử dụng các định danh này cho việc gửi và danh sách cho phép:

- Tin nhắn trực tiếp: `users/<userId>` (khuyến nghị).
- Email thô `name@example.com` có thể thay đổi và chỉ được sử dụng cho việc khớp danh sách cho phép trực tiếp khi `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Đã ngừng sử dụng: `users/<email>` được coi là id người dùng, không phải danh sách cho phép email.
- Không gian: `spaces/<spaceId>`.

## Điểm nổi bật của cấu hình

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // hoặc serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // tùy chọn; giúp phát hiện mention
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Chỉ trả lời ngắn gọn.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Ghi chú:

- Thông tin xác thực tài khoản dịch vụ cũng có thể được truyền inline với `serviceAccount` (chuỗi JSON).
- `serviceAccountRef` cũng được hỗ trợ (env/file SecretRef), bao gồm các tham chiếu theo tài khoản dưới `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Đường dẫn webhook mặc định là `/googlechat` nếu `webhookPath` không được đặt.
- `dangerouslyAllowNameMatching` kích hoạt lại việc khớp email có thể thay đổi cho danh sách cho phép (chế độ tương thích khẩn cấp).
- Reactions có sẵn qua công cụ `reactions` và `channels action` khi `actions.reactions` được kích hoạt.
- `typingIndicator` hỗ trợ `none`, `message` (mặc định), và `reaction` (reaction yêu cầu OAuth người dùng).
- Tệp đính kèm được tải xuống qua Chat API và lưu trữ trong pipeline media (kích thước giới hạn bởi `mediaMaxMb`).

Chi tiết tham chiếu bí mật: [Quản lý Bí mật](/gateway/secrets).

## Khắc phục sự cố

### 405 Method Not Allowed

Nếu Google Cloud Logs Explorer hiển thị lỗi như:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Điều này có nghĩa là trình xử lý webhook chưa được đăng ký. Nguyên nhân phổ biến:

1. **Kênh chưa được cấu hình**: Phần `channels.googlechat` thiếu trong cấu hình của bạn. Xác minh với:

   ```bash
   openclaw config get channels.googlechat
   ```

   Nếu trả về "Config path not found", thêm cấu hình (xem [Điểm nổi bật của cấu hình](#config-highlights)).

2. **Plugin chưa được kích hoạt**: Kiểm tra trạng thái plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Nếu hiển thị "disabled", thêm `plugins.entries.googlechat.enabled: true` vào cấu hình của bạn.

3. **Gateway chưa được khởi động lại**: Sau khi thêm cấu hình, khởi động lại gateway:

   ```bash
   openclaw gateway restart
   ```

Xác minh kênh đang chạy:

```bash
openclaw channels status
# Nên hiển thị: Google Chat default: enabled, configured, ...
```

### Các vấn đề khác

- Kiểm tra `openclaw channels status --probe` để tìm lỗi xác thực hoặc cấu hình audience thiếu.
- Nếu không có tin nhắn nào đến, xác nhận URL webhook + đăng ký sự kiện của ứng dụng Chat.
- Nếu việc chặn mention ngăn cản phản hồi, đặt `botUser` thành tên tài nguyên người dùng của ứng dụng và xác minh `requireMention`.
- Sử dụng `openclaw logs --follow` trong khi gửi tin nhắn thử nghiệm để xem liệu yêu cầu có đến gateway không.

Tài liệu liên quan:

- [Cấu hình Gateway](/gateway/configuration)
- [Bảo mật](/gateway/security)
- [Reactions](/tools/reactions)
