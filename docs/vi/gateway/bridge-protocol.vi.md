# Bridge Protocol (Giao thức cầu nối cho node cũ)

Bridge protocol là giao thức vận chuyển node **cũ** (TCP JSONL). Các client node mới nên dùng giao thức Gateway WebSocket thống nhất.

Nếu đang xây dựng operator hoặc client node, hãy dùng [Gateway protocol](/gateway/protocol).

**Lưu ý:** Các bản OpenClaw hiện tại không còn hỗ trợ TCP bridge listener; tài liệu này chỉ để tham khảo lịch sử. Các khóa cấu hình `bridge.*` cũ không còn trong schema cấu hình.

## Tại sao có cả hai

- **Ranh giới bảo mật**: bridge chỉ mở một danh sách cho phép nhỏ thay vì toàn bộ API của gateway.
- **Ghép đôi + nhận diện node**: gateway quản lý việc chấp nhận node và liên kết với token từng node.
- **Khám phá UX**: node có thể tìm gateway qua Bonjour trên LAN, hoặc kết nối trực tiếp qua tailnet.
- **Loopback WS**: toàn bộ mặt phẳng điều khiển WS ở local trừ khi được tunnel qua SSH.

## Transport

- TCP, mỗi dòng là một đối tượng JSON (JSONL).
- TLS tùy chọn (khi `bridge.tls.enabled` là true).
- Cổng listener mặc định cũ là `18790` (các bản hiện tại không khởi động TCP bridge).

Khi TLS được bật, các bản ghi TXT discovery bao gồm `bridgeTls=1` và `bridgeTlsSha256` như một gợi ý không bí mật. Lưu ý rằng các bản ghi TXT Bonjour/mDNS không được xác thực; client không nên coi dấu vân tay quảng cáo là một pin có thẩm quyền mà không có ý định người dùng rõ ràng hoặc xác minh ngoài băng tần khác.

## Handshake + ghép đôi

1. Client gửi `hello` với metadata node + token (nếu đã ghép đôi).
2. Nếu chưa ghép đôi, gateway trả về `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Client gửi `pair-request`.
4. Gateway chờ phê duyệt, sau đó gửi `pair-ok` và `hello-ok`.

`hello-ok` trả về `serverName` và có thể bao gồm `canvasHostUrl`.

## Frames

Client → Gateway:

- `req` / `res`: RPC gateway có phạm vi (chat, sessions, config, health, voicewake, skills.bins)
- `event`: tín hiệu node (voice transcript, agent request, chat subscribe, exec lifecycle)

Gateway → Client:

- `invoke` / `invoke-res`: lệnh node (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`)
- `event`: cập nhật chat cho các session đã đăng ký
- `ping` / `pong`: giữ kết nối

Danh sách cho phép cũ nằm trong `src/gateway/server-bridge.ts` (đã bị loại bỏ).

## Sự kiện vòng đời Exec

Node có thể phát `exec.finished` hoặc `exec.denied` để hiển thị hoạt động system.run. Những sự kiện này được ánh xạ tới sự kiện hệ thống trong gateway. (Node cũ có thể vẫn phát `exec.started`.)

Các trường payload (tất cả đều tùy chọn trừ khi được ghi chú):

- `sessionKey` (bắt buộc): session agent nhận sự kiện hệ thống.
- `runId`: id exec duy nhất để nhóm.
- `command`: chuỗi lệnh thô hoặc đã định dạng.
- `exitCode`, `timedOut`, `success`, `output`: chi tiết hoàn thành (chỉ khi kết thúc).
- `reason`: lý do từ chối (chỉ khi bị từ chối).

## Sử dụng Tailnet

- Gắn bridge vào IP tailnet: `bridge.bind: "tailnet"` trong `~/.openclaw/openclaw.json`.
- Client kết nối qua tên MagicDNS hoặc IP tailnet.
- Bonjour **không** vượt qua mạng; sử dụng host/port thủ công hoặc DNS-SD diện rộng khi cần.

## Phiên bản

Bridge hiện tại là **v1 ngầm định** (không có thương lượng min/max). Dự kiến sẽ tương thích ngược; thêm trường phiên bản giao thức bridge trước bất kỳ thay đổi phá vỡ nào.\n