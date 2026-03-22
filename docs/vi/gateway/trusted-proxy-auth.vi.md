---
title: "Trusted Proxy Auth"
summary: "Ủy quyền xác thực gateway cho reverse proxy đáng tin cậy (Pomerium, Caddy, nginx + OAuth)"
read_when:
  - Chạy OpenClaw sau proxy nhận diện danh tính
  - Cài đặt Pomerium, Caddy, hoặc nginx với OAuth trước OpenClaw
  - Sửa lỗi WebSocket 1008 unauthorized với cấu hình reverse proxy
  - Quyết định nơi đặt HSTS và các header bảo mật HTTP khác
---

# Trusted Proxy Auth

> ⚠️ **Tính năng nhạy cảm về bảo mật.** Chế độ này ủy quyền xác thực hoàn toàn cho reverse proxy. Cấu hình sai có thể khiến Gateway bị truy cập trái phép. Đọc kỹ trước khi bật.

## Khi nào dùng

Dùng chế độ `trusted-proxy` khi:

- Chạy OpenClaw sau proxy nhận diện danh tính (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Proxy xử lý toàn bộ xác thực và truyền danh tính người dùng qua headers
- Đang trong môi trường Kubernetes hoặc container, nơi proxy là đường duy nhất đến Gateway
- Gặp lỗi WebSocket `1008 unauthorized` do trình duyệt không thể truyền token trong payload WS

## Khi nào KHÔNG dùng

- Proxy không xác thực người dùng (chỉ là TLS terminator hoặc load balancer)
- Có đường nào đến Gateway mà không qua proxy (lỗ hổng firewall, truy cập mạng nội bộ)
- Không chắc proxy có xóa/ghi đè headers chuyển tiếp đúng cách
- Chỉ cần truy cập cá nhân một người dùng (xem xét Tailscale Serve + loopback cho đơn giản hơn)

## Cách hoạt động

1. Reverse proxy xác thực người dùng (OAuth, OIDC, SAML, v.v.)
2. Proxy thêm header với danh tính người dùng đã xác thực (ví dụ: `x-forwarded-user: nick@example.com`)
3. OpenClaw kiểm tra yêu cầu đến từ IP proxy đáng tin cậy (cấu hình trong `gateway.trustedProxies`)
4. OpenClaw trích xuất danh tính người dùng từ header đã cấu hình
5. Nếu mọi thứ ổn, yêu cầu được chấp nhận

## Kiểm soát hành vi ghép cặp UI

Khi `gateway.auth.mode = "trusted-proxy"` hoạt động và yêu cầu vượt qua kiểm tra trusted-proxy, các phiên WebSocket của Control UI có thể kết nối mà không cần ghép cặp thiết bị.

Ý nghĩa:

- Ghép cặp không còn là cổng chính cho truy cập Control UI trong chế độ này.
- Chính sách xác thực proxy và `allowUsers` trở thành kiểm soát truy cập hiệu quả.
- Giữ ingress gateway khóa chỉ cho IP proxy đáng tin cậy (`gateway.trustedProxies` + firewall).

## Cấu hình

```json5
{
  gateway: {
    // Dùng loopback cho proxy cùng host; dùng lan/custom cho proxy từ xa
    bind: "loopback",

    // QUAN TRỌNG: Chỉ thêm IP proxy vào đây
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header chứa danh tính người dùng đã xác thực (bắt buộc)
        userHeader: "x-forwarded-user",

        // Tùy chọn: headers bắt buộc phải có (xác minh proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Tùy chọn: giới hạn người dùng cụ thể (rỗng = cho phép tất cả)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Nếu `gateway.bind` là `loopback`, bao gồm địa chỉ proxy loopback trong `gateway.trustedProxies` (`127.0.0.1`, `::1`, hoặc loopback CIDR tương đương).

### Tham khảo cấu hình

| Trường                                      | Bắt buộc | Mô tả                                                                         |
| ------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Có       | Mảng địa chỉ IP proxy đáng tin cậy. Yêu cầu từ IP khác sẽ bị từ chối.         |
| `gateway.auth.mode`                         | Có       | Phải là `"trusted-proxy"`                                                     |
| `gateway.auth.trustedProxy.userHeader`      | Có       | Tên header chứa danh tính người dùng đã xác thực                              |
| `gateway.auth.trustedProxy.requiredHeaders` | Không    | Các header bổ sung phải có để yêu cầu được tin cậy                           |
| `gateway.auth.trustedProxy.allowUsers`      | Không    | Danh sách trắng danh tính người dùng. Rỗng nghĩa là cho phép tất cả người dùng đã xác thực. |

## Kết thúc TLS và HSTS

Sử dụng một điểm kết thúc TLS và áp dụng HSTS tại đó.

### Mô hình khuyến nghị: proxy TLS termination

Khi reverse proxy xử lý HTTPS cho `https://control.example.com`, đặt `Strict-Transport-Security` tại proxy cho domain đó.

- Phù hợp cho triển khai hướng internet.
- Giữ chính sách chứng chỉ + bảo mật HTTP tại một nơi.
- OpenClaw có thể chạy HTTP loopback sau proxy.

Giá trị header ví dụ:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Gateway TLS termination

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

`strictTransportSecurity` chấp nhận giá trị header dạng chuỗi, hoặc `false` để tắt rõ ràng.

### Hướng dẫn triển khai

- Bắt đầu với thời gian tồn tại ngắn (ví dụ `max-age=300`) trong khi xác thực lưu lượng.
- Tăng lên giá trị dài hạn (ví dụ `max-age=31536000`) chỉ sau khi đã tự tin.
- Thêm `includeSubDomains` chỉ khi mọi subdomain đã sẵn sàng cho HTTPS.
- Sử dụng preload chỉ khi cố ý đáp ứng yêu cầu preload cho toàn bộ domain.
- Phát triển local chỉ loopback không hưởng lợi từ HSTS.

## Ví dụ cấu hình Proxy

### Pomerium

Pomerium truyền danh tính trong `x-pomerium-claim-email` (hoặc các header claim khác) và JWT trong `x-pomerium-jwt-assertion`.

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

Caddy với plugin `caddy-security` có thể xác thực người dùng và truyền header danh tính.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["127.0.0.1"], // IP của Caddy (nếu cùng host)
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

## Checklist bảo mật

Trước khi bật trusted-proxy auth, kiểm tra:

- [ ] **Proxy là đường duy nhất**: Cổng Gateway bị firewall chặn mọi thứ trừ proxy
- [ ] **trustedProxies tối thiểu**: Chỉ IP proxy thực tế, không phải toàn bộ subnet
- [ ] **Proxy xóa headers**: Proxy ghi đè (không thêm) các header `x-forwarded-*` từ client
- [ ] **Kết thúc TLS**: Proxy xử lý TLS; người dùng kết nối qua HTTPS
- [ ] **allowUsers được đặt** (khuyến nghị): Giới hạn người dùng đã biết thay vì cho phép bất kỳ ai đã xác thực

## Kiểm tra bảo mật

`openclaw security audit` sẽ đánh dấu trusted-proxy auth với mức độ nghiêm trọng **critical**. Đây là nhắc nhở rằng bạn đang ủy quyền bảo mật cho cấu hình proxy.

Kiểm tra bao gồm:

- Thiếu cấu hình `trustedProxies`
- Thiếu cấu hình `userHeader`
- `allowUsers` trống (cho phép bất kỳ người dùng đã xác thực nào)

## Khắc phục sự cố

### "trusted_proxy_untrusted_source"

Yêu cầu không đến từ IP trong `gateway.trustedProxies`. Kiểm tra:

- IP proxy có đúng không? (IP container Docker có thể thay đổi)
- Có load balancer trước proxy không?
- Dùng `docker inspect` hoặc `kubectl get pods -o wide` để tìm IP thực tế

### "trusted_proxy_user_missing"

Header người dùng trống hoặc thiếu. Kiểm tra:

- Proxy có cấu hình truyền header danh tính không?
- Tên header có đúng không? (không phân biệt chữ hoa/thường, nhưng chính tả quan trọng)
- Người dùng có thực sự được xác thực tại proxy không?

### "trusted_proxy_missing_header"

Header bắt buộc không có. Kiểm tra:

- Cấu hình proxy cho các header cụ thể đó
- Có bị xóa header ở đâu đó trong chuỗi không

### "trusted_proxy_user_not_allowed"

Người dùng đã xác thực nhưng không có trong `allowUsers`. Thêm họ vào hoặc xóa danh sách trắng.

### WebSocket vẫn lỗi

Đảm bảo proxy:

- Hỗ trợ nâng cấp WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Truyền header danh tính khi nâng cấp WebSocket (không chỉ HTTP)
- Không có đường xác thực riêng cho kết nối WebSocket

## Chuyển từ Token Auth

Nếu chuyển từ token auth sang trusted-proxy:

1. Cấu hình proxy xác thực người dùng và truyền header
2. Kiểm tra cấu hình proxy độc lập (curl với headers)
3. Cập nhật cấu hình OpenClaw với trusted-proxy auth
4. Khởi động lại Gateway
5. Kiểm tra kết nối WebSocket từ Control UI
6. Chạy `openclaw security audit` và xem xét kết quả

## Liên quan

- [Security](/gateway/security) — hướng dẫn bảo mật đầy đủ
- [Configuration](/gateway/configuration) — tham khảo cấu hình
- [Remote Access](/gateway/remote) — các mô hình truy cập từ xa khác
- [Tailscale](/gateway/tailscale) — giải pháp thay thế đơn giản hơn cho truy cập chỉ trong tailnet\n