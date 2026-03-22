---
summary: "Tìm hiểu cách cấu hình giao thức Bridge với TCP JSONL, ghép đôi và RPC để tối ưu hóa kết nối hệ thống."
read_when:
  - Xây dựng hoặc gỡ lỗi các client node (chế độ node iOS/Android/macOS)
  - Điều tra lỗi ghép đôi hoặc xác thực bridge
  - Kiểm tra bề mặt node được gateway phơi bày
title: "Hướng Dẫn Cấu Hình Giao Thức Bridge"
---

# Giao thức Bridge (truyền tải node cũ)

Giao thức Bridge là một phương thức truyền tải node **cũ** (TCP JSONL). Các client node mới nên sử dụng giao thức Gateway WebSocket thống nhất.

Nếu bạn đang xây dựng một operator hoặc client node, hãy sử dụng [giao thức Gateway](/gateway/protocol).

**Lưu ý:** Các bản dựng OpenClaw hiện tại không còn cung cấp listener bridge TCP; tài liệu này được giữ lại để tham khảo lịch sử. Các khóa cấu hình `bridge.*` cũ không còn là một phần của schema cấu hình.

## Tại sao chúng ta có cả hai

- **Ranh giới bảo mật**: bridge chỉ phơi bày một danh sách cho phép nhỏ thay vì toàn bộ bề mặt API của gateway.
- **Ghép đôi + danh tính node**: việc chấp nhận node được quản lý bởi gateway và gắn liền với token cho từng node.
- **Trải nghiệm khám phá**: các node có thể khám phá gateway qua Bonjour trên LAN, hoặc kết nối trực tiếp qua tailnet.
- **Loopback WS**: toàn bộ mặt phẳng điều khiển WS ở lại cục bộ trừ khi được truyền qua SSH.

## Truyền tải

- TCP, một đối tượng JSON trên mỗi dòng (JSONL).
- TLS tùy chọn (khi `bridge.tls.enabled` là true).
- Cổng listener mặc định cũ là `18790` (các bản dựng hiện tại không khởi động bridge TCP).

Khi TLS được kích hoạt, các bản ghi TXT khám phá bao gồm `bridgeTls=1` cộng với `bridgeTlsSha256` như một gợi ý không bí mật. Lưu ý rằng các bản ghi TXT Bonjour/mDNS không được xác thực; các client không nên coi dấu vân tay được quảng cáo là một mã pin có thẩm quyền mà không có ý định rõ ràng của người dùng hoặc xác minh ngoài băng tần khác.

## Bắt tay + ghép đôi

1. Client gửi `hello` với metadata node + token (nếu đã ghép đôi).
2. Nếu chưa ghép đôi, gateway trả lời `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Client gửi `pair-request`.
4. Gateway chờ phê duyệt, sau đó gửi `pair-ok` và `hello-ok`.

`hello-ok` trả về `serverName` và có thể bao gồm `canvasHostUrl`.

## Khung

Client → Gateway:

- `req` / `res`: RPC gateway có phạm vi (chat, sessions, config, health, voicewake, skills.bins)
- `event`: tín hiệu node (bản ghi giọng nói, yêu cầu agent, đăng ký chat, vòng đời exec)

Gateway → Client:

- `invoke` / `invoke-res`: lệnh node (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`)
- `event`: cập nhật chat cho các phiên đã đăng ký
- `ping` / `pong`: giữ kết nối

Việc thực thi danh sách cho phép cũ nằm trong `src/gateway/server-bridge.ts` (đã bị loại bỏ).

## Sự kiện vòng đời Exec

Các node có thể phát ra sự kiện `exec.finished` hoặc `exec.denied` để hiển thị hoạt động system.run. Những sự kiện này được ánh xạ tới các sự kiện hệ thống trong gateway. (Các node cũ có thể vẫn phát ra `exec.started`.)

Các trường payload (tất cả đều tùy chọn trừ khi được ghi chú):

- `sessionKey` (bắt buộc): phiên agent để nhận sự kiện hệ thống.
- `runId`: id exec duy nhất để nhóm lại.
- `command`: chuỗi lệnh thô hoặc đã định dạng.
- `exitCode`, `timedOut`, `success`, `output`: chi tiết hoàn thành (chỉ khi kết thúc).
- `reason`: lý do từ chối (chỉ khi bị từ chối).

## Sử dụng Tailnet

- Ràng buộc bridge với IP tailnet: `bridge.bind: "tailnet"` trong `~/.openclaw/openclaw.json`.
- Các client kết nối qua tên MagicDNS hoặc IP tailnet.
- Bonjour **không** vượt qua các mạng; sử dụng host/port thủ công hoặc DNS-SD diện rộng khi cần.

## Phiên bản

Bridge hiện tại là **v1 ngầm định** (không có thương lượng min/max). Tương thích ngược được mong đợi; thêm một trường phiên bản giao thức bridge trước khi có bất kỳ thay đổi phá vỡ nào.
