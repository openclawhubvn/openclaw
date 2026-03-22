---
summary: "Tham khảo CLI cho `openclaw devices` (ghép nối thiết bị + xoay vòng/hủy token)"
read_when:
  - Duyệt yêu cầu ghép nối thiết bị
  - Cần xoay vòng hoặc hủy token thiết bị
title: "devices"
---

# `openclaw devices`

Quản lý yêu cầu ghép nối thiết bị và token theo thiết bị.

## Lệnh

### `openclaw devices list`

Liệt kê yêu cầu ghép nối đang chờ và thiết bị đã ghép nối.

```
openclaw devices list
openclaw devices list --json
```

Output yêu cầu chờ bao gồm vai trò và phạm vi yêu cầu để xem xét trước khi duyệt.

### `openclaw devices remove <deviceId>`

Xóa một thiết bị đã ghép nối.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Xóa hàng loạt thiết bị đã ghép nối.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Duyệt yêu cầu ghép nối thiết bị đang chờ. Nếu không có `requestId`, OpenClaw tự động duyệt yêu cầu chờ gần nhất.

Lưu ý: nếu thiết bị thử lại ghép nối với thông tin xác thực thay đổi (vai trò/phạm vi/public key), OpenClaw sẽ thay thế mục chờ trước đó và cấp `requestId` mới. Chạy `openclaw devices list` ngay trước khi duyệt để dùng ID hiện tại.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Từ chối yêu cầu ghép nối thiết bị đang chờ.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Xoay vòng token thiết bị cho một vai trò cụ thể (có thể cập nhật phạm vi).

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

### `openclaw devices revoke --device <id> --role <role>`

Hủy token thiết bị cho một vai trò cụ thể.

```
openclaw devices revoke --device <deviceId> --role node
```

## Tùy chọn chung

- `--url <url>`: Gateway WebSocket URL (mặc định là `gateway.remote.url` khi đã cấu hình).
- `--token <token>`: Gateway token (nếu cần).
- `--password <password>`: Gateway password (xác thực bằng mật khẩu).
- `--timeout <ms>`: RPC timeout.
- `--json`: Output JSON (khuyến nghị cho scripting).

Lưu ý: khi đặt `--url`, CLI không sử dụng cấu hình hoặc thông tin môi trường. Phải truyền `--token` hoặc `--password` rõ ràng. Thiếu thông tin xác thực sẽ gây lỗi.

## Ghi chú

- Xoay vòng token trả về token mới (nhạy cảm). Xử lý như một bí mật.
- Các lệnh này yêu cầu phạm vi `operator.pairing` (hoặc `operator.admin`).
- `devices clear` yêu cầu xác nhận `--yes`.
- Nếu phạm vi ghép nối không khả dụng trên local loopback (và không truyền `--url` rõ ràng), list/approve có thể dùng fallback ghép nối local.

## Checklist khôi phục token drift

Dùng khi Control UI hoặc client khác liên tục lỗi `AUTH_TOKEN_MISMATCH` hoặc `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Xác nhận nguồn token gateway hiện tại:

```bash
openclaw config get gateway.auth.token
```

2. Liệt kê thiết bị đã ghép nối và xác định device id bị ảnh hưởng:

```bash
openclaw devices list
```

3. Xoay vòng token operator cho thiết bị bị ảnh hưởng:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Nếu xoay vòng không đủ, xóa ghép nối cũ và duyệt lại:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Thử lại kết nối client với token/mật khẩu hiện tại.

Liên quan:

- [Khắc phục sự cố xác thực Dashboard](/web/dashboard#if-you-see-unauthorized-1008)
- [Khắc phục sự cố Gateway](/gateway/troubleshooting#dashboard-control-ui-connectivity)\n