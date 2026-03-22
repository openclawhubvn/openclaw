---
summary: "Kênh Nostr DM qua tin nhắn mã hóa NIP-04"
read_when:
  - Muốn OpenClaw nhận DM qua Nostr
  - Đang thiết lập nhắn tin phi tập trung
title: "Nostr"
---

# Nostr

**Trạng thái:** Plugin tùy chọn (mặc định tắt).

Nostr là giao thức phi tập trung cho mạng xã hội. Kênh này cho phép OpenClaw nhận và phản hồi tin nhắn trực tiếp (DM) mã hóa qua NIP-04.

## Cài đặt (khi cần)

### Onboarding (khuyến nghị)

- Onboarding (`openclaw onboard`) và `openclaw channels add` liệt kê các plugin kênh tùy chọn.
- Chọn Nostr sẽ nhắc cài plugin khi cần.

Cài đặt mặc định:

- **Dev channel + git checkout có sẵn:** dùng đường dẫn plugin local.
- **Stable/Beta:** tải từ npm.

Luôn có thể ghi đè lựa chọn trong prompt.

### Cài đặt thủ công

```bash
openclaw plugins install @openclaw/nostr
```

Dùng local checkout (dev workflows):

```bash
openclaw plugins install --link <path-to-openclaw>/extensions/nostr
```

Khởi động lại Gateway sau khi cài hoặc bật plugin.

### Thiết lập không tương tác

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Dùng `--use-env` để giữ `NOSTR_PRIVATE_KEY` trong môi trường thay vì lưu trong config.

## Thiết lập nhanh

1. Tạo Nostr keypair (nếu cần):

```bash
# Dùng nak
nak key generate
```

2. Thêm vào config:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Xuất key:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Khởi động lại Gateway.

## Tham chiếu cấu hình

| Key          | Type     | Default                                     | Mô tả                                |
| ------------ | -------- | ------------------------------------------- | ------------------------------------ |
| `privateKey` | string   | required                                    | Private key dạng `nsec` hoặc hex     |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay URLs (WebSocket)               |
| `dmPolicy`   | string   | `pairing`                                   | Chính sách truy cập DM               |
| `allowFrom`  | string[] | `[]`                                        | Pubkey người gửi được phép           |
| `enabled`    | boolean  | `true`                                      | Bật/tắt kênh                         |
| `name`       | string   | -                                           | Tên hiển thị                         |
| `profile`    | object   | -                                           | Metadata profile NIP-01              |

## Metadata profile

Dữ liệu profile được publish dưới dạng sự kiện NIP-01 `kind:0`. Quản lý từ Control UI (Channels -> Nostr -> Profile) hoặc thiết lập trực tiếp trong config.

Ví dụ:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
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

- URL profile phải dùng `https://`.
- Import từ relays sẽ gộp trường và giữ lại ghi đè local.

## Kiểm soát truy cập

### Chính sách DM

- **pairing** (mặc định): người gửi lạ nhận mã pairing.
- **allowlist**: chỉ pubkey trong `allowFrom` được DM.
- **open**: DM công khai (yêu cầu `allowFrom: ["*"]`).
- **disabled**: bỏ qua DM đến.

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

## Định dạng key

Các định dạng chấp nhận:

- **Private key:** `nsec...` hoặc 64-char hex
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

- Dùng 2-3 relays để dự phòng.
- Tránh quá nhiều relays (độ trễ, trùng lặp).
- Relays trả phí có thể cải thiện độ tin cậy.
- Relays local ổn cho test (`ws://localhost:7777`).

## Hỗ trợ giao thức

| NIP    | Trạng thái | Mô tả                                    |
| ------ | ---------- | ----------------------------------------- |
| NIP-01 | Hỗ trợ     | Định dạng sự kiện cơ bản + metadata profile |
| NIP-04 | Hỗ trợ     | DM mã hóa (`kind:4`)                      |
| NIP-17 | Dự kiến    | DM gói quà                                |
| NIP-44 | Dự kiến    | Mã hóa có phiên bản                       |

## Kiểm thử

### Relay local

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

### Test thủ công

1. Ghi lại pubkey bot (npub) từ logs.
2. Mở client Nostr (Damus, Amethyst, v.v.).
3. DM pubkey bot.
4. Xác nhận phản hồi.

## Khắc phục sự cố

### Không nhận được tin nhắn

- Kiểm tra private key hợp lệ.
- Đảm bảo relay URLs có thể truy cập và dùng `wss://` (hoặc `ws://` cho local).
- Xác nhận `enabled` không phải `false`.
- Kiểm tra logs Gateway lỗi kết nối relay.

### Không gửi được phản hồi

- Kiểm tra relay chấp nhận ghi.
- Xác nhận kết nối outbound.
- Theo dõi giới hạn tốc độ relay.

### Phản hồi trùng lặp

- Dự kiến khi dùng nhiều relays.
- Tin nhắn được loại trùng theo event ID; chỉ lần gửi đầu tiên kích hoạt phản hồi.

## Bảo mật

- Không bao giờ commit private keys.
- Dùng biến môi trường cho keys.
- Cân nhắc `allowlist` cho bot production.

## Giới hạn (MVP)

- Chỉ tin nhắn trực tiếp (không chat nhóm).
- Không đính kèm media.
- Chỉ NIP-04 (dự kiến NIP-17 gói quà).\n