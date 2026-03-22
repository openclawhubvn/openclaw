# Google Chat (Chat API)

Trạng thái: Sẵn sàng cho DMs + spaces qua Google Chat API webhooks (chỉ HTTP).

## Thiết lập nhanh (cho người mới)

1. Tạo Google Cloud project và bật **Google Chat API**.
   - Truy cập: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Bật API nếu chưa bật.
2. Tạo **Service Account**:
   - Nhấn **Create Credentials** > **Service Account**.
   - Đặt tên tùy ý (ví dụ: `openclaw-chat`).
   - Để trống quyền (nhấn **Continue**).
   - Để trống principals (nhấn **Done**).
3. Tạo và tải về **JSON Key**:
   - Trong danh sách service accounts, nhấp vào account vừa tạo.
   - Chuyển đến tab **Keys**.
   - Nhấn **Add Key** > **Create new key**.
   - Chọn **JSON** và nhấn **Create**.
4. Lưu file JSON tải về trên gateway host (ví dụ: `~/.openclaw/googlechat-service-account.json`).
5. Tạo Google Chat app trong [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Điền thông tin **Application info**:
     - **App name**: (ví dụ: `OpenClaw`)
     - **Avatar URL**: (ví dụ: `https://openclaw.ai/logo.png`)
     - **Description**: (ví dụ: `Personal AI Assistant`)
   - Bật **Interactive features**.
   - Trong **Functionality**, chọn **Join spaces and group conversations**.
   - Trong **Connection settings**, chọn **HTTP endpoint URL**.
   - Trong **Triggers**, chọn **Use a common HTTP endpoint URL for all triggers** và đặt URL công khai của gateway theo sau là `/googlechat`.
     - _Mẹo: Chạy `openclaw status` để tìm URL công khai của gateway._
   - Trong **Visibility**, chọn **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;**.
   - Nhập địa chỉ email (ví dụ: `user@example.com`) vào ô văn bản.
   - Nhấn **Save** ở dưới cùng.
6. **Bật trạng thái app**:
   - Sau khi lưu, **refresh trang**.
   - Tìm phần **App status** (thường ở trên cùng hoặc dưới cùng sau khi lưu).
   - Chuyển trạng thái thành **Live - available to users**.
   - Nhấn **Save** lần nữa.
7. Cấu hình OpenClaw với đường dẫn service account + webhook audience:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Hoặc config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Đặt loại + giá trị webhook audience (khớp với cấu hình Chat app).
9. Khởi động gateway. Google Chat sẽ POST đến đường dẫn webhook.

## Thêm vào Google Chat

Khi gateway đã chạy và email đã được thêm vào danh sách visibility:

1. Truy cập [Google Chat](https://chat.google.com/).
2. Nhấn biểu tượng **+** bên cạnh **Direct Messages**.
3. Trong thanh tìm kiếm (nơi thường thêm người), nhập **App name** đã cấu hình trong Google Cloud Console.
   - **Lưu ý**: Bot sẽ _không_ xuất hiện trong danh sách "Marketplace" vì là app riêng tư. Phải tìm theo tên.
4. Chọn bot từ kết quả.
5. Nhấn **Add** hoặc **Chat** để bắt đầu cuộc trò chuyện 1:1.
6. Gửi "Hello" để kích hoạt trợ lý!

## Public URL (Chỉ webhook)

Google Chat webhooks yêu cầu một endpoint HTTPS công khai. Để bảo mật, **chỉ expose đường dẫn `/googlechat`** ra internet. Giữ dashboard OpenClaw và các endpoint nhạy cảm khác trên mạng nội bộ.

### Option A: Tailscale Funnel (Khuyến nghị)

Dùng Tailscale Serve cho dashboard riêng tư và Funnel cho đường dẫn webhook công khai. Điều này giữ `/` riêng tư trong khi chỉ expose `/googlechat`.

1. **Kiểm tra địa chỉ mà gateway đang bind:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Ghi lại địa chỉ IP (ví dụ: `127.0.0.1`, `0.0.0.0`, hoặc Tailscale IP như `100.x.x.x`).

2. **Expose dashboard chỉ cho tailnet (port 8443):**

   ```bash
   # Nếu bind vào localhost (127.0.0.1 hoặc 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Nếu bind vào Tailscale IP (ví dụ: 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Chỉ expose đường dẫn webhook công khai:**

   ```bash
   # Nếu bind vào localhost (127.0.0.1 hoặc 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Nếu bind vào Tailscale IP (ví dụ: 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Authorize node để truy cập Funnel:**
   Nếu được yêu cầu, truy cập URL ủy quyền hiển thị trong output để bật Funnel cho node này trong chính sách tailnet.

5. **Xác minh cấu hình:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL webhook công khai sẽ là:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Dashboard riêng tư vẫn chỉ tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Dùng URL công khai (không có `:8443`) trong cấu hình Google Chat app.

> Lưu ý: Cấu hình này tồn tại qua các lần khởi động lại. Để xóa sau này, chạy `tailscale funnel reset` và `tailscale serve reset`.

### Option B: Reverse Proxy (Caddy)

Nếu dùng reverse proxy như Caddy, chỉ proxy đường dẫn cụ thể:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Với cấu hình này, bất kỳ yêu cầu nào đến `your-domain.com/` sẽ bị bỏ qua hoặc trả về 404, trong khi `your-domain.com/googlechat` được định tuyến an toàn đến OpenClaw.

### Option C: Cloudflare Tunnel

Cấu hình ingress rules của tunnel để chỉ định tuyến đường dẫn webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Cách hoạt động

1. Google Chat gửi webhook POSTs đến gateway. Mỗi yêu cầu bao gồm header `Authorization: Bearer <token>`.
   - OpenClaw xác minh bearer auth trước khi đọc/phân tích toàn bộ webhook bodies khi header có mặt.
   - Yêu cầu Google Workspace Add-on mang `authorizationEventObject.systemIdToken` trong body được hỗ trợ qua pre-auth body budget nghiêm ngặt hơn.
2. OpenClaw xác minh token với `audienceType` + `audience` đã cấu hình:
   - `audienceType: "app-url"` → audience là URL webhook HTTPS của bạn.
   - `audienceType: "project-number"` → audience là số project Cloud.
3. Tin nhắn được định tuyến theo space:
   - DMs dùng session key `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Spaces dùng session key `agent:<agentId>:googlechat:group:<spaceId>`.
4. Truy cập DM mặc định là pairing. Người gửi không xác định nhận mã pairing; phê duyệt với:
   - `openclaw pairing approve googlechat <code>`
5. Group spaces yêu cầu @-mention mặc định. Dùng `botUser` nếu phát hiện mention cần tên user của app.

## Targets

Dùng các định danh này cho delivery và allowlists:

- Tin nhắn trực tiếp: `users/<userId>` (khuyến nghị).
- Email thô `name@example.com` có thể thay đổi và chỉ dùng cho matching allowlist trực tiếp khi `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Đã ngừng sử dụng: `users/<email>` được coi là user id, không phải email allowlist.
- Spaces: `spaces/<spaceId>`.

## Điểm nổi bật cấu hình

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
          systemPrompt: "Short answers only.",
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

- Service account credentials cũng có thể được truyền inline với `serviceAccount` (chuỗi JSON).
- `serviceAccountRef` cũng được hỗ trợ (env/file SecretRef), bao gồm refs per-account dưới `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Đường dẫn webhook mặc định là `/googlechat` nếu `webhookPath` không được đặt.
- `dangerouslyAllowNameMatching` bật lại matching email principal có thể thay đổi cho allowlists (chế độ tương thích break-glass).
- Reactions có sẵn qua công cụ `reactions` và `channels action` khi `actions.reactions` được bật.
- `typingIndicator` hỗ trợ `none`, `message` (mặc định), và `reaction` (reaction yêu cầu user OAuth).
- Attachments được tải xuống qua Chat API và lưu trữ trong media pipeline (kích thước giới hạn bởi `mediaMaxMb`).

Chi tiết tham chiếu Secrets: [Secrets Management](/gateway/secrets).

## Khắc phục sự cố

### 405 Method Not Allowed

Nếu Google Cloud Logs Explorer hiển thị lỗi như:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Điều này có nghĩa là webhook handler chưa được đăng ký. Nguyên nhân phổ biến:

1. **Channel chưa cấu hình**: Phần `channels.googlechat` thiếu trong cấu hình. Kiểm tra với:

   ```bash
   openclaw config get channels.googlechat
   ```

   Nếu trả về "Config path not found", thêm cấu hình (xem [Điểm nổi bật cấu hình](#config-highlights)).

2. **Plugin chưa bật**: Kiểm tra trạng thái plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Nếu hiển thị "disabled", thêm `plugins.entries.googlechat.enabled: true` vào cấu hình.

3. **Gateway chưa khởi động lại**: Sau khi thêm cấu hình, khởi động lại gateway:

   ```bash
   openclaw gateway restart
   ```

Xác minh channel đang chạy:

```bash
openclaw channels status
# Nên hiển thị: Google Chat default: enabled, configured, ...
```

### Các vấn đề khác

- Kiểm tra `openclaw channels status --probe` để tìm lỗi auth hoặc thiếu cấu hình audience.
- Nếu không có tin nhắn nào đến, xác nhận URL webhook + event subscriptions của Chat app.
- Nếu mention gating chặn phản hồi, đặt `botUser` thành tên resource user của app và xác minh `requireMention`.
- Dùng `openclaw logs --follow` khi gửi tin nhắn thử nghiệm để xem yêu cầu có đến gateway không.

Tài liệu liên quan:

- [Gateway configuration](/gateway/configuration)
- [Security](/gateway/security)
- [Reactions](/tools/reactions)\n