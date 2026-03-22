---
summary: "Ghép nối node do Gateway quản lý (Option B) cho iOS và các node từ xa khác"
read_when:
  - Triển khai phê duyệt ghép nối node mà không cần UI macOS
  - Thêm luồng CLI để phê duyệt node từ xa
  - Mở rộng giao thức gateway với quản lý node
title: "Ghép Nối Do Gateway Quản Lý"
---

# Ghép nối do Gateway quản lý (Option B)

Trong ghép nối do Gateway quản lý, **Gateway** là nguồn xác thực cho các node được phép tham gia. Các UI (ứng dụng macOS, client tương lai) chỉ là giao diện để phê duyệt hoặc từ chối yêu cầu đang chờ.

**Quan trọng:** Các node WS sử dụng **device pairing** (vai trò `node`) khi `connect`. `node.pair.*` là một kho ghép nối riêng và **không** kiểm soát WS handshake. Chỉ các client gọi rõ ràng `node.pair.*` mới sử dụng luồng này.

## Khái niệm

- **Yêu cầu đang chờ**: một node yêu cầu tham gia; cần phê duyệt.
- **Node đã ghép nối**: node được phê duyệt với token xác thực đã cấp.
- **Transport**: Gateway WS endpoint chuyển tiếp yêu cầu nhưng không quyết định thành viên. (Hỗ trợ cầu TCP cũ đã bị loại bỏ.)

## Cách ghép nối hoạt động

1. Một node kết nối tới Gateway WS và yêu cầu ghép nối.
2. Gateway lưu **yêu cầu đang chờ** và phát `node.pair.requested`.
3. Phê duyệt hoặc từ chối yêu cầu (CLI hoặc UI).
4. Khi phê duyệt, Gateway cấp **token mới** (token được xoay vòng khi ghép lại).
5. Node kết nối lại bằng token và được coi là “đã ghép nối”.

Yêu cầu đang chờ tự động hết hạn sau **5 phút**.

## Luồng CLI (thân thiện với headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` hiển thị các node đã ghép nối/kết nối và khả năng của chúng.

## API surface (giao thức gateway)

Sự kiện:

- `node.pair.requested` — phát khi tạo yêu cầu đang chờ mới.
- `node.pair.resolved` — phát khi yêu cầu được phê duyệt/từ chối/hết hạn.

Phương thức:

- `node.pair.request` — tạo hoặc tái sử dụng yêu cầu đang chờ.
- `node.pair.list` — liệt kê các node đang chờ + đã ghép nối.
- `node.pair.approve` — phê duyệt yêu cầu đang chờ (cấp token).
- `node.pair.reject` — từ chối yêu cầu đang chờ.
- `node.pair.verify` — xác minh `{ nodeId, token }`.

Ghi chú:

- `node.pair.request` là idempotent cho mỗi node: gọi lặp lại trả về cùng yêu cầu đang chờ.
- Phê duyệt **luôn** tạo token mới; không token nào được trả về từ `node.pair.request`.
- Yêu cầu có thể bao gồm `silent: true` như gợi ý cho luồng tự động phê duyệt.

## Tự động phê duyệt (ứng dụng macOS)

Ứng dụng macOS có thể thử **tự động phê duyệt** khi:

- yêu cầu được đánh dấu `silent`, và
- ứng dụng có thể xác minh kết nối SSH tới máy chủ gateway bằng cùng người dùng.

Nếu tự động phê duyệt thất bại, nó sẽ quay lại nhắc nhở “Phê duyệt/Từ chối” thông thường.

## Lưu trữ (local, private)

Trạng thái ghép nối được lưu dưới thư mục trạng thái Gateway (mặc định `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Nếu override `OPENCLAW_STATE_DIR`, thư mục `nodes/` sẽ di chuyển theo.

Ghi chú bảo mật:

- Token là bí mật; xử lý `paired.json` như dữ liệu nhạy cảm.
- Xoay vòng token yêu cầu phê duyệt lại (hoặc xóa mục node).

## Hành vi Transport

- Transport là **stateless**; không lưu trữ thành viên.
- Nếu Gateway offline hoặc ghép nối bị vô hiệu hóa, node không thể ghép nối.
- Nếu Gateway ở chế độ từ xa, ghép nối vẫn diễn ra với kho lưu trữ của Gateway từ xa.\n