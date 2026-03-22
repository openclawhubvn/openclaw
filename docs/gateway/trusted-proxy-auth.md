---
title: "Xác Thực Proxy Tin Cậy"
summary: "Ủy quyền xác thực gateway cho một reverse proxy tin cậy (Pomerium, Caddy, nginx + OAuth)"
read_when:
  - Chạy OpenClaw sau một proxy nhận diện danh tính
  - Cài đặt Pomerium, Caddy, hoặc nginx với OAuth trước OpenClaw
  - Sửa lỗi WebSocket 1008 không được phép với cấu hình reverse proxy
  - Quyết định nơi đặt HSTS và các header bảo mật HTTP khác
---

# Xác Thực Proxy Tin Cậy

> ⚠️ **Tính năng nhạy cảm về bảo mật.** Chế độ này ủy quyền xác thực hoàn toàn cho reverse proxy của bạn. Cấu hình sai có thể khiến Gateway bị truy cập trái phép. Đọc kỹ trang này trước khi kích hoạt.

## Khi Nào Sử Dụng

Sử dụng chế độ xác thực `trusted-proxy` khi:

- Bạn chạy OpenClaw sau một **proxy nhận diện danh tính** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Proxy của bạn xử lý toàn bộ xác thực và truyền danh tính người dùng qua các header
- Bạn đang ở trong môi trường Kubernetes hoặc container nơi proxy là con đường duy nhất đến Gateway
- Bạn gặp lỗi WebSocket `1008 không được phép` vì trình duyệt không thể truyền token trong payload WS

## Khi Nào KHÔNG Sử Dụng

- Nếu proxy của bạn không xác thực người dùng (chỉ là một TLS terminator hoặc load balancer)
- Nếu có bất kỳ con đường nào đến Gateway mà bỏ qua proxy (lỗ hổng firewall, truy cập mạng nội bộ)
- Nếu bạn không chắc chắn liệu proxy của bạn có xóa/ghi đè đúng các header chuyển tiếp
- Nếu bạn chỉ cần truy cập cá nhân cho một người dùng (xem xét Tailscale Serve + loopback để thiết lập đơn giản hơn)

## Cách Hoạt Động

1. Reverse proxy của bạn xác thực người dùng (OAuth, OIDC, SAML, v.v.)
2. Proxy thêm một header với danh tính người dùng đã xác thực (ví dụ: `x-forwarded-user: nick@example.com`)
3. OpenClaw kiểm tra rằng yêu cầu đến từ một **IP proxy tin cậy** (được cấu hình trong `gateway.trustedProxies`)
4. OpenClaw trích xuất danh tính người dùng từ header đã cấu hình
5. Nếu mọi thứ đều ổn, yêu cầu được cho phép

## Kiểm Soát Hành Vi Ghép Đôi UI

Khi `gateway.auth.mode = "trusted-proxy"` được kích hoạt và yêu cầu vượt qua kiểm tra proxy tin cậy, các phiên WebSocket của Control UI có thể kết nối mà không cần ghép đôi danh tính thiết bị.

Ý nghĩa:

- Ghép đôi không còn là cổng chính cho truy cập Control UI trong chế độ này.
- Chính sách xác thực proxy của bạn và `allowUsers` trở thành kiểm soát truy cập hiệu quả.
- Giữ ingress gateway khóa chỉ với các IP proxy tin cậy (`gateway.trustedProxies` + firewall).

## Cấu Hình

```json5
{
  gateway: {
    // Sử dụng loopback cho các thiết lập proxy cùng máy; sử dụng lan/custom cho các host proxy từ xa
    bind: "loopback",

    // QUAN TRỌNG: Chỉ thêm IP của proxy của bạn ở đây
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header chứa danh tính người dùng đã xác thực (bắt buộc)
        userHeader: "x-forwarded-user",

        // Tùy chọn: các header phải có mặt (xác minh proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Tùy chọn: giới hạn cho người dùng cụ thể (trống = cho phép tất cả)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Nếu `gateway.bind` là `loopback`, bao gồm một địa chỉ proxy loopback trong `gateway.trustedProxies` (`127.0.0.1`, `::1`, hoặc một CIDR loopback tương đương).

### Tham Khảo Cấu Hình

| Trường                                      | Bắt buộc | Mô tả                                                                          |
| ------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| `gateway.trustedProxies`                    | Có       | Mảng các địa chỉ IP proxy được tin cậy. Yêu cầu từ các IP khác sẽ bị từ chối.  |
| `gateway.auth.mode`                         | Có       | Phải là `"trusted-proxy"`                                                      |
| `gateway.auth.trustedProxy.userHeader`      | Có       | Tên header chứa danh tính người dùng đã xác thực                               |
| `gateway.auth.trustedProxy.requiredHeaders` | Không    | Các header bổ sung phải có mặt để yêu cầu được tin cậy                         |
| `gateway.auth.trustedProxy.allowUsers`      | Không    | Danh sách trắng danh tính người dùng. Trống nghĩa là cho phép tất cả người dùng đã xác thực. |

## Kết Thúc TLS và HSTS

Sử dụng một điểm kết thúc TLS và áp dụng HSTS tại đó.

### Mô Hình Khuyến Nghị: Kết Thúc TLS Proxy

Khi reverse proxy của bạn xử lý HTTPS cho `https://control.example.com`, đặt `Strict-Transport-Security` tại proxy cho tên miền đó.

- Phù hợp cho các triển khai hướng internet.
- Giữ chính sách chứng chỉ + bảo mật HTTP ở một nơi.
- OpenClaw có thể giữ HTTP loopback phía sau proxy.

Giá trị header ví dụ:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Kết Thúc TLS Gateway

Nếu OpenClaw tự phục vụ HTTPS trực tiếp (không có proxy kết thúc TLS), đặt:

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

`strictTransportSecurity` chấp nhận một giá trị header chuỗi, hoặc `false` để tắt rõ ràng.

### Hướng Dẫn Triển Khai

- Bắt đầu với thời gian tồn tại ngắn trước (ví dụ `max-age=300`) trong khi xác thực lưu lượng.
- Tăng lên các giá trị lâu dài (ví dụ `max-age=31536000`) chỉ sau khi đã tự tin.
- Thêm `includeSubDomains` chỉ khi mọi tên miền phụ đã sẵn sàng cho HTTPS.
- Sử dụng preload chỉ khi bạn cố ý đáp ứng yêu cầu preload cho toàn bộ tập tên miền của bạn.
- Phát triển cục bộ chỉ loopback không có lợi từ HSTS.

## Ví Dụ Cài Đặt Proxy

### Pomerium

Pomerium truyền danh tính trong `x-pomerium-claim-email` (hoặc các header claim khác) và một JWT trong `x-pomerium-jwt-assertion`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP của Pomerium
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Đoạn cấu hình Pomerium:

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy với OAuth

Caddy với plugin `caddy-security` có thể xác thực người dùng và truyền các header danh tính.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["127.0.0.1"], // IP của Caddy (nếu trên cùng máy)
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Đoạn Caddyfile:

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy xác thực người dùng và truyền danh tính trong `x-auth-request-email`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP của nginx/oauth2-proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

Đoạn cấu hình nginx:

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik với Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // IP của container Traefik
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## Danh Sách Kiểm Tra Bảo Mật

Trước khi kích hoạt xác thực proxy tin cậy, hãy xác minh:

- [ ] **Proxy là con đường duy nhất**: Cổng Gateway được firewall từ mọi thứ ngoại trừ proxy của bạn
- [ ] **trustedProxies là tối thiểu**: Chỉ các IP proxy thực tế của bạn, không phải toàn bộ subnet
- [ ] **Proxy xóa header**: Proxy của bạn ghi đè (không thêm) các header `x-forwarded-*` từ client
- [ ] **Kết thúc TLS**: Proxy của bạn xử lý TLS; người dùng kết nối qua HTTPS
- [ ] **allowUsers được đặt** (khuyến nghị): Giới hạn cho người dùng đã biết thay vì cho phép bất kỳ ai đã xác thực

## Kiểm Toán Bảo Mật

`openclaw security audit` sẽ đánh dấu xác thực proxy tin cậy với mức độ nghiêm trọng **critical**. Đây là một lời nhắc nhở rằng bạn đang ủy quyền bảo mật cho cấu hình proxy của mình.

Kiểm toán kiểm tra:

- Thiếu cấu hình `trustedProxies`
- Thiếu cấu hình `userHeader`
- `allowUsers` trống (cho phép bất kỳ người dùng đã xác thực nào)

## Khắc Phục Sự Cố

### "trusted_proxy_untrusted_source"

Yêu cầu không đến từ một IP trong `gateway.trustedProxies`. Kiểm tra:

- IP proxy có đúng không? (IP container Docker có thể thay đổi)
- Có load balancer nào trước proxy của bạn không?
- Sử dụng `docker inspect` hoặc `kubectl get pods -o wide` để tìm IP thực tế

### "trusted_proxy_user_missing"

Header người dùng trống hoặc thiếu. Kiểm tra:

- Proxy của bạn có được cấu hình để truyền các header danh tính không?
- Tên header có đúng không? (không phân biệt chữ hoa/thường, nhưng chính tả quan trọng)
- Người dùng có thực sự được xác thực tại proxy không?

### "trusted_proxy_missing_header"

Một header bắt buộc không có mặt. Kiểm tra:

- Cấu hình proxy của bạn cho các header cụ thể đó
- Liệu các header có bị xóa ở đâu đó trong chuỗi không

### "trusted_proxy_user_not_allowed"

Người dùng đã được xác thực nhưng không có trong `allowUsers`. Hoặc thêm họ hoặc xóa danh sách trắng.

### WebSocket Vẫn Thất Bại

Đảm bảo proxy của bạn:

- Hỗ trợ nâng cấp WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Truyền các header danh tính trên các yêu cầu nâng cấp WebSocket (không chỉ HTTP)
- Không có một đường dẫn xác thực riêng cho các kết nối WebSocket

## Di Chuyển Từ Xác Thực Token

Nếu bạn đang chuyển từ xác thực token sang proxy tin cậy:

1. Cấu hình proxy của bạn để xác thực người dùng và truyền các header
2. Kiểm tra thiết lập proxy độc lập (curl với các header)
3. Cập nhật cấu hình OpenClaw với xác thực proxy tin cậy
4. Khởi động lại Gateway
5. Kiểm tra các kết nối WebSocket từ Control UI
6. Chạy `openclaw security audit` và xem xét các phát hiện

## Liên Quan

- [Bảo Mật](/gateway/security) — hướng dẫn bảo mật đầy đủ
- [Cấu Hình](/gateway/configuration) — tham khảo cấu hình
- [Truy Cập Từ Xa](/gateway/remote) — các mô hình truy cập từ xa khác
- [Tailscale](/gateway/tailscale) — giải pháp thay thế đơn giản hơn cho truy cập chỉ qua tailnet
