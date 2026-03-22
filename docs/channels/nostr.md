---
summary: "Tìm hiểu cách cấu hình kênh Nostr DM với tin nhắn mã hóa NIP-04, đảm bảo an toàn và bảo mật cho giao tiếp của bạn."
read_when:
  - Bạn muốn OpenClaw nhận DMs qua Nostr
  - Bạn đang thiết lập nhắn tin phi tập trung
title: "Hướng Dẫn Cấu Hình Kênh Nostr DM"
---

# Nostr

**Trạng thái:** Plugin tùy chọn (mặc định không kích hoạt).

Nostr là một giao thức phi tập trung cho mạng xã hội. Kênh này cho phép OpenClaw nhận và phản hồi tin nhắn trực tiếp (DM) mã hóa qua NIP-04.

## Cài đặt (khi cần)

### Hướng dẫn cài đặt (khuyến nghị)

- Khi onboard (`openclaw onboard`) và `openclaw channels add` sẽ liệt kê các plugin kênh tùy chọn.
- Chọn Nostr sẽ yêu cầu cài đặt plugin khi cần.

Cài đặt mặc định:

- **Kênh Dev + git checkout có sẵn:** sử dụng đường dẫn plugin cục bộ.
- **Stable/Beta:** tải về từ npm.

Bạn luôn có thể thay đổi lựa chọn trong prompt.

### Cài đặt thủ công

```bash
openclaw plugins install @openclaw/nostr
```

Sử dụng bản checkout cục bộ (quy trình dev):

```bash
openclaw plugins install --link <path-to-openclaw>/extensions/nostr
```

Khởi động lại Gateway sau khi cài đặt hoặc kích hoạt plugin.

### Thiết lập không tương tác

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Sử dụng `--use-env` để giữ `NOSTR_PRIVATE_KEY` trong môi trường thay vì lưu khóa trong cấu hình.

## Thiết lập nhanh

1. Tạo một cặp khóa Nostr (nếu cần):

```bash
# Sử dụng nak
nak key generate
```

2. Thêm vào cấu hình:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Xuất khóa:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Khởi động lại Gateway.

## Tham khảo cấu hình

| Khóa         | Loại     | Mặc định                                    | Mô tả                                |
| ------------ | -------- | ------------------------------------------- | ------------------------------------ |
| `privateKey` | string   | bắt buộc                                    | Khóa riêng ở định dạng `nsec` hoặc hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL Relay (WebSocket)                |
| `dmPolicy`   | string   | `pairing`                                   | Chính sách truy cập DM               |
| `allowFrom`  | string[] | `[]`                                        | Pubkey người gửi được phép           |
| `enabled`    | boolean  | `true`                                      | Bật/tắt kênh                         |
| `name`       | string   | -                                           | Tên hiển thị                         |
| `profile`    | object   | -                                           | Metadata hồ sơ NIP-01                |

## Metadata hồ sơ

Dữ liệu hồ sơ được công bố dưới dạng sự kiện `kind:0` của NIP-01. Bạn có thể quản lý từ Control UI (Channels -> Nostr -> Profile) hoặc thiết lập trực tiếp trong cấu hình.

Ví dụ:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Bot trợ lý cá nhân DM",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

Lưu ý:

- URL hồ sơ phải sử dụng `https://`.
- Nhập từ relays sẽ hợp nhất các trường và giữ lại các ghi đè cục bộ.

## Kiểm soát truy cập

### Chính sách DM

- **pairing** (mặc định): người gửi không xác định nhận mã ghép đôi.
- **allowlist**: chỉ pubkey trong `allowFrom` có thể DM.
- **open**: DMs công khai (yêu cầu `allowFrom: ["*"]`).
- **disabled**: bỏ qua DMs đến.

### Ví dụ Allowlist

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## Định dạng khóa

Các định dạng chấp nhận:

- **Khóa riêng:** `nsec...` hoặc 64 ký tự hex
- **Pubkeys (`allowFrom`):** `npub...` hoặc hex

## Relays

Mặc định: `relay.damus.io` và `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

Mẹo:

- Sử dụng 2-3 relays để dự phòng.
- Tránh quá nhiều relays (độ trễ, trùng lặp).
- Relays trả phí có thể cải thiện độ tin cậy.
- Relays cục bộ phù hợp để thử nghiệm (`ws://localhost:7777`).

## Hỗ trợ giao thức

| NIP    | Trạng thái | Mô tả                                    |
| ------ | ---------- | ----------------------------------------- |
| NIP-01 | Hỗ trợ     | Định dạng sự kiện cơ bản + metadata hồ sơ |
| NIP-04 | Hỗ trợ     | DMs mã hóa (`kind:4`)                     |
| NIP-17 | Dự kiến    | DMs được gói quà                          |
| NIP-44 | Dự kiến    | Mã hóa có phiên bản                       |

## Kiểm tra

### Relay cục bộ

```bash
# Khởi động strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### Kiểm tra thủ công

1. Ghi lại pubkey bot (npub) từ logs.
2. Mở một client Nostr (Damus, Amethyst, v.v.).
3. DM pubkey bot.
4. Xác minh phản hồi.

## Khắc phục sự cố

### Không nhận được tin nhắn

- Xác minh khóa riêng hợp lệ.
- Đảm bảo URL relay có thể truy cập và sử dụng `wss://` (hoặc `ws://` cho cục bộ).
- Xác nhận `enabled` không phải là `false`.
- Kiểm tra logs Gateway để tìm lỗi kết nối relay.

### Không gửi phản hồi

- Kiểm tra relay chấp nhận ghi.
- Xác minh kết nối ra ngoài.
- Theo dõi giới hạn tốc độ relay.

### Phản hồi trùng lặp

- Dự kiến khi sử dụng nhiều relays.
- Tin nhắn được loại bỏ trùng lặp theo ID sự kiện; chỉ lần gửi đầu tiên kích hoạt phản hồi.

## Bảo mật

- Không bao giờ commit khóa riêng.
- Sử dụng biến môi trường cho khóa.
- Cân nhắc `allowlist` cho bot sản xuất.

## Giới hạn (MVP)

- Chỉ tin nhắn trực tiếp (không có chat nhóm).
- Không có tệp đính kèm media.
- Chỉ NIP-04 (NIP-17 gói quà dự kiến).
