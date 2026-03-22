---
summary: "Ghép nối node do Gateway quản lý (Tùy chọn B) cho iOS và các node từ xa khác"
read_when:
  - Triển khai phê duyệt ghép nối node mà không cần giao diện macOS
  - Thêm luồng CLI để phê duyệt node từ xa
  - Mở rộng giao thức gateway với quản lý node
title: "Ghép Nối Do Gateway Quản Lý"
---

# Ghép nối do Gateway quản lý (Tùy chọn B)

Trong ghép nối do Gateway quản lý, **Gateway** là nguồn xác thực cho việc node nào được phép tham gia. Các giao diện người dùng (ứng dụng macOS, các client tương lai) chỉ là giao diện để phê duyệt hoặc từ chối các yêu cầu đang chờ xử lý.

**Quan trọng:** Các node WS sử dụng **ghép nối thiết bị** (vai trò `node`) trong quá trình `connect`. `node.pair.*` là một kho ghép nối riêng biệt và **không** kiểm soát handshake WS. Chỉ những client gọi rõ ràng `node.pair.*` mới sử dụng luồng này.

## Khái niệm

- **Yêu cầu đang chờ xử lý**: một node yêu cầu tham gia; cần được phê duyệt.
- **Node đã ghép nối**: node đã được phê duyệt với token xác thực đã cấp.
- **Transport**: điểm cuối Gateway WS chuyển tiếp yêu cầu nhưng không quyết định thành viên. (Hỗ trợ cầu nối TCP cũ đã bị loại bỏ.)

## Cách thức ghép nối hoạt động

1. Một node kết nối đến Gateway WS và yêu cầu ghép nối.
2. Gateway lưu trữ một **yêu cầu đang chờ xử lý** và phát ra `node.pair.requested`.
3. Phê duyệt hoặc từ chối yêu cầu (CLI hoặc UI).
4. Khi phê duyệt, Gateway cấp một **token mới** (token được xoay vòng khi ghép nối lại).
5. Node kết nối lại bằng token và được coi là đã “ghép nối”.

Yêu cầu đang chờ xử lý tự động hết hạn sau **5 phút**.

## Quy trình CLI (thân thiện với chế độ không giao diện)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` hiển thị các node đã ghép nối/kết nối và khả năng của chúng.

## Bề mặt API (giao thức gateway)

Sự kiện:

- `node.pair.requested` — phát ra khi một yêu cầu đang chờ xử lý mới được tạo.
- `node.pair.resolved` — phát ra khi một yêu cầu được phê duyệt/từ chối/hết hạn.

Phương thức:

- `node.pair.request` — tạo hoặc tái sử dụng một yêu cầu đang chờ xử lý.
- `node.pair.list` — liệt kê các node đang chờ xử lý + đã ghép nối.
- `node.pair.approve` — phê duyệt một yêu cầu đang chờ xử lý (cấp token).
- `node.pair.reject` — từ chối một yêu cầu đang chờ xử lý.
- `node.pair.verify` — xác minh `{ nodeId, token }`.

Ghi chú:

- `node.pair.request` là idempotent cho mỗi node: các lần gọi lặp lại trả về cùng một yêu cầu đang chờ xử lý.
- Phê duyệt **luôn** tạo ra một token mới; không có token nào được trả về từ `node.pair.request`.
- Yêu cầu có thể bao gồm `silent: true` như một gợi ý cho các luồng tự động phê duyệt.

## Tự động phê duyệt (ứng dụng macOS)

Ứng dụng macOS có thể tùy chọn thử **phê duyệt im lặng** khi:

- yêu cầu được đánh dấu `silent`, và
- ứng dụng có thể xác minh kết nối SSH đến máy chủ gateway bằng cùng một người dùng.

Nếu phê duyệt im lặng thất bại, nó sẽ quay lại nhắc nhở “Phê duyệt/Từ chối” thông thường.

## Lưu trữ (cục bộ, riêng tư)

Trạng thái ghép nối được lưu trữ dưới thư mục trạng thái Gateway (mặc định `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Nếu bạn ghi đè `OPENCLAW_STATE_DIR`, thư mục `nodes/` sẽ di chuyển theo.

Ghi chú bảo mật:

- Token là bí mật; xử lý `paired.json` như dữ liệu nhạy cảm.
- Xoay vòng token yêu cầu phê duyệt lại (hoặc xóa mục nhập node).

## Hành vi Transport

- Transport là **không trạng thái**; nó không lưu trữ thành viên.
- Nếu Gateway offline hoặc ghép nối bị vô hiệu hóa, các node không thể ghép nối.
- Nếu Gateway ở chế độ từ xa, ghép nối vẫn diễn ra với kho lưu trữ của Gateway từ xa.
