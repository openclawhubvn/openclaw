---
summary: "Ứng dụng iOS node: kết nối Gateway, ghép đôi, canvas và xử lý sự cố"
read_when:
  - Ghép đôi hoặc kết nối lại iOS node
  - Chạy ứng dụng iOS từ source
  - Debug phát hiện gateway hoặc lệnh canvas
title: "Ứng dụng iOS"
---

# Ứng dụng iOS (Node)

Khả dụng: xem trước nội bộ. Ứng dụng iOS chưa được phân phối công khai.

## Chức năng

- Kết nối Gateway qua WebSocket (LAN hoặc tailnet).
- Cung cấp khả năng node: Canvas, chụp màn hình, chụp camera, định vị, chế độ nói, đánh thức bằng giọng nói.
- Nhận lệnh `node.invoke` và báo cáo sự kiện trạng thái node.

## Yêu cầu

- Gateway chạy trên thiết bị khác (macOS, Linux hoặc Windows qua WSL2).
- Đường mạng:
  - Cùng LAN qua Bonjour, **hoặc**
  - Tailnet qua unicast DNS-SD (ví dụ: `openclaw.internal.`), **hoặc**
  - Host/port thủ công (dự phòng).

## Bắt đầu nhanh (ghép đôi + kết nối)

1. Khởi động Gateway:

```bash
openclaw gateway --port 18789
```

2. Trong ứng dụng iOS, mở Cài đặt và chọn gateway đã phát hiện (hoặc bật Host Thủ Công và nhập host/port).

3. Chấp nhận yêu cầu ghép đôi trên máy chủ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Nếu ứng dụng thử lại ghép đôi với thông tin xác thực thay đổi (vai trò/phạm vi/khóa công khai),
yêu cầu đang chờ trước đó sẽ bị thay thế và tạo `requestId` mới.
Chạy `openclaw devices list` lại trước khi chấp nhận.

4. Xác minh kết nối:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push qua relay cho bản build chính thức

Bản build iOS phân phối chính thức sử dụng relay push bên ngoài thay vì gửi token APNs thô đến gateway.

Yêu cầu phía Gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Luồng hoạt động:

- Ứng dụng iOS đăng ký với relay bằng App Attest và biên lai ứng dụng.
- Relay trả về một relay handle không rõ ràng cùng với quyền gửi theo phạm vi đăng ký.
- Ứng dụng iOS lấy danh tính gateway đã ghép đôi và đưa vào đăng ký relay, do đó đăng ký dựa trên relay được ủy quyền cho gateway cụ thể đó.
- Ứng dụng chuyển tiếp đăng ký dựa trên relay đó đến gateway đã ghép đôi với `push.apns.register`.
- Gateway sử dụng relay handle đã lưu cho `push.test`, đánh thức nền và đánh thức nhẹ.
- URL cơ sở relay của gateway phải khớp với URL relay được tích hợp trong bản build iOS chính thức/TestFlight.
- Nếu ứng dụng sau đó kết nối với gateway khác hoặc bản build có URL relay cơ sở khác, nó sẽ làm mới đăng ký relay thay vì sử dụng lại liên kết cũ.

Những gì gateway **không** cần cho luồng này:

- Không cần token relay toàn bộ triển khai.
- Không cần khóa APNs trực tiếp cho gửi dựa trên relay chính thức/TestFlight.

Luồng hoạt động của operator:

1. Cài đặt bản build iOS chính thức/TestFlight.
2. Đặt `gateway.push.apns.relay.baseUrl` trên gateway.
3. Ghép đôi ứng dụng với gateway và để nó hoàn tất kết nối.
4. Ứng dụng tự động công bố `push.apns.register` sau khi có token APNs, phiên operator được kết nối và đăng ký relay thành công.
5. Sau đó, `push.test`, đánh thức lại và đánh thức nhẹ có thể sử dụng đăng ký dựa trên relay đã lưu.

Lưu ý tương thích:

- `OPENCLAW_APNS_RELAY_BASE_URL` vẫn hoạt động như một override tạm thời cho gateway.

## Luồng xác thực và tin cậy

Relay tồn tại để thực thi hai ràng buộc mà APNs trực tiếp trên gateway không thể cung cấp cho
bản build iOS chính thức:

- Chỉ các bản build iOS OpenClaw chính thức phân phối qua Apple mới có thể sử dụng relay được host.
- Một gateway chỉ có thể gửi push dựa trên relay cho các thiết bị iOS đã ghép đôi với gateway cụ thể đó.

Từng bước:

1. `iOS app -> gateway`
   - Ứng dụng đầu tiên ghép đôi với gateway qua luồng xác thực Gateway thông thường.
   - Điều đó cung cấp cho ứng dụng một phiên node đã xác thực cùng với một phiên operator đã xác thực.
   - Phiên operator được sử dụng để gọi `gateway.identity.get`.

2. `iOS app -> relay`
   - Ứng dụng gọi các endpoint đăng ký relay qua HTTPS.
   - Đăng ký bao gồm bằng chứng App Attest cùng với biên lai ứng dụng.
   - Relay xác thực ID bundle, bằng chứng App Attest và biên lai Apple, và yêu cầu đường phân phối chính thức/sản xuất.
   - Đây là điều ngăn chặn các bản build Xcode/dev cục bộ sử dụng relay được host. Một bản build cục bộ có thể được ký, nhưng không đáp ứng bằng chứng phân phối chính thức của Apple mà relay mong đợi.

3. `gateway identity delegation`
   - Trước khi đăng ký relay, ứng dụng lấy danh tính gateway đã ghép đôi từ
     `gateway.identity.get`.
   - Ứng dụng đưa danh tính gateway đó vào payload đăng ký relay.
   - Relay trả về một relay handle và một quyền gửi theo phạm vi đăng ký được ủy quyền cho
     danh tính gateway đó.

4. `gateway -> relay`
   - Gateway lưu trữ relay handle và quyền gửi từ `push.apns.register`.
   - Trên `push.test`, đánh thức lại và đánh thức nhẹ, gateway ký yêu cầu gửi với
     danh tính thiết bị của chính nó.
   - Relay xác minh cả quyền gửi đã lưu và chữ ký gateway đối với danh tính gateway được ủy quyền từ đăng ký.
   - Gateway khác không thể sử dụng lại đăng ký đã lưu đó, ngay cả khi nó bằng cách nào đó có được handle.

5. `relay -> APNs`
   - Relay sở hữu thông tin xác thực APNs sản xuất và token APNs thô cho bản build chính thức.
   - Gateway không bao giờ lưu trữ token APNs thô cho các bản build chính thức dựa trên relay.
   - Relay gửi push cuối cùng đến APNs thay mặt cho gateway đã ghép đôi.

Tại sao thiết kế này được tạo ra:

- Để giữ thông tin xác thực APNs sản xuất khỏi các gateway người dùng.
- Để tránh lưu trữ token APNs thô của bản build chính thức trên gateway.
- Để cho phép sử dụng relay được host chỉ cho các bản build OpenClaw chính thức/TestFlight.
- Để ngăn một gateway gửi push đánh thức đến các thiết bị iOS thuộc sở hữu của gateway khác.

Các bản build cục bộ/thủ công vẫn sử dụng APNs trực tiếp. Nếu đang thử nghiệm các bản build đó mà không có relay, gateway vẫn cần thông tin xác thực APNs trực tiếp:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

## Đường phát hiện

### Bonjour (LAN)

Gateway quảng bá `_openclaw-gw._tcp` trên `local.`. Ứng dụng iOS tự động liệt kê các gateway này.

### Tailnet (mạng chéo)

Nếu mDNS bị chặn, sử dụng một vùng DNS-SD unicast (chọn một domain; ví dụ: `openclaw.internal.`) và Tailscale split DNS.
Xem [Bonjour](/gateway/bonjour) cho ví dụ CoreDNS.

### Host/port thủ công

Trong Cài đặt, bật **Host Thủ Công** và nhập host + port của gateway (mặc định `18789`).

## Canvas + A2UI

Node iOS render một canvas WKWebView. Sử dụng `node.invoke` để điều khiển:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Ghi chú:

- Host canvas của Gateway phục vụ `/__openclaw__/canvas/` và `/__openclaw__/a2ui/`.
- Được phục vụ từ máy chủ HTTP của Gateway (cùng port với `gateway.port`, mặc định `18789`).
- Node iOS tự động điều hướng đến A2UI khi kết nối khi một URL host canvas được quảng bá.
- Quay lại scaffold tích hợp với `canvas.navigate` và `{"url":""}`.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Đánh thức bằng giọng nói + chế độ nói

- Đánh thức bằng giọng nói và chế độ nói có sẵn trong Cài đặt.
- iOS có thể tạm dừng âm thanh nền; coi các tính năng giọng nói là nỗ lực tốt nhất khi ứng dụng không hoạt động.

## Lỗi thường gặp

- `NODE_BACKGROUND_UNAVAILABLE`: đưa ứng dụng iOS ra nền trước (các lệnh canvas/camera/màn hình yêu cầu điều này).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway không quảng bá URL host canvas; kiểm tra `canvasHost` trong [Cấu hình Gateway](/gateway/configuration).
- Không xuất hiện yêu cầu ghép đôi: chạy `openclaw devices list` và chấp nhận thủ công.
- Kết nối lại thất bại sau khi cài đặt lại: token ghép đôi Keychain đã bị xóa; ghép đôi lại node.

## Tài liệu liên quan

- [Ghép đôi](/channels/pairing)
- [Phát hiện](/gateway/discovery)
- [Bonjour](/gateway/bonjour)\n