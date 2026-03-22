---
summary: "Tham khảo CLI cho `openclaw devices` (ghép nối thiết bị + xoay vòng/hủy token)"
read_when:
  - Bạn đang phê duyệt yêu cầu ghép nối thiết bị
  - Bạn cần xoay vòng hoặc hủy token thiết bị
title: "devices"
---

# `openclaw devices`

Quản lý yêu cầu ghép nối thiết bị và token theo phạm vi thiết bị.

## Lệnh

### `openclaw devices list`

Liệt kê các yêu cầu ghép nối đang chờ và các thiết bị đã ghép nối.

```
openclaw devices list
openclaw devices list --json
```

Kết quả của yêu cầu đang chờ bao gồm vai trò và phạm vi yêu cầu để bạn có thể xem xét trước khi phê duyệt.

### `openclaw devices remove <deviceId>`

Xóa một thiết bị đã ghép nối.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Xóa hàng loạt các thiết bị đã ghép nối.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Phê duyệt một yêu cầu ghép nối thiết bị đang chờ. Nếu không có `requestId`, OpenClaw tự động phê duyệt yêu cầu đang chờ gần nhất.

Lưu ý: nếu một thiết bị thử lại ghép nối với thông tin xác thực thay đổi (vai trò/phạm vi/khóa công khai), OpenClaw sẽ thay thế mục đang chờ trước đó và cấp một `requestId` mới. Chạy `openclaw devices list` ngay trước khi phê duyệt để sử dụng ID hiện tại.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Từ chối một yêu cầu ghép nối thiết bị đang chờ.

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

- `--url <url>`: URL WebSocket của Gateway (mặc định là `gateway.remote.url` khi đã cấu hình).
- `--token <token>`: Token của Gateway (nếu cần).
- `--password <password>`: Mật khẩu của Gateway (xác thực bằng mật khẩu).
- `--timeout <ms>`: Thời gian chờ RPC.
- `--json`: Đầu ra JSON (khuyến nghị cho scripting).

Lưu ý: khi bạn đặt `--url`, CLI sẽ không sử dụng thông tin cấu hình hoặc môi trường. Phải truyền `--token` hoặc `--password` rõ ràng. Thiếu thông tin xác thực rõ ràng sẽ gây lỗi.

## Ghi chú

- Xoay vòng token trả về một token mới (nhạy cảm). Hãy xử lý như một bí mật.
- Các lệnh này yêu cầu phạm vi `operator.pairing` (hoặc `operator.admin`).
- `devices clear` yêu cầu xác nhận bằng `--yes`.
- Nếu phạm vi ghép nối không khả dụng trên loopback cục bộ (và không có `--url` rõ ràng), list/approve có thể sử dụng fallback ghép nối cục bộ.

## Danh sách kiểm tra khôi phục token drift

Sử dụng khi Control UI hoặc các client khác liên tục gặp lỗi `AUTH_TOKEN_MISMATCH` hoặc `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Xác nhận nguồn token gateway hiện tại:

```bash
openclaw config get gateway.auth.token
```

2. Liệt kê các thiết bị đã ghép nối và xác định ID thiết bị bị ảnh hưởng:

```bash
openclaw devices list
```

3. Xoay vòng token operator cho thiết bị bị ảnh hưởng:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Nếu xoay vòng không đủ, xóa ghép nối cũ và phê duyệt lại:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Thử kết nối lại client với token/mật khẩu hiện tại.

Liên quan:

- [Khắc phục sự cố xác thực Dashboard](/web/dashboard#if-you-see-unauthorized-1008)
- [Khắc phục sự cố Gateway](/gateway/troubleshooting#dashboard-control-ui-connectivity)
