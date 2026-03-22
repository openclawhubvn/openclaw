---
summary: "Ứng dụng node iOS: kết nối với Gateway, ghép đôi, canvas và xử lý sự cố"
read_when:
  - Ghép đôi hoặc kết nối lại node iOS
  - Chạy ứng dụng iOS từ mã nguồn
  - Gỡ lỗi phát hiện gateway hoặc lệnh canvas
title: "Ứng dụng iOS"
---

# Ứng dụng iOS (Node)

Khả dụng: xem trước nội bộ. Ứng dụng iOS chưa được phân phối công khai.

## Chức năng

- Kết nối với Gateway qua WebSocket (LAN hoặc tailnet).
- Cung cấp khả năng của node: Canvas, chụp màn hình, chụp ảnh từ camera, định vị, chế độ nói, đánh thức bằng giọng nói.
- Nhận lệnh `node.invoke` và báo cáo sự kiện trạng thái của node.

## Yêu cầu

- Gateway chạy trên thiết bị khác (macOS, Linux, hoặc Windows qua WSL2).
- Đường dẫn mạng:
  - Cùng LAN qua Bonjour, **hoặc**
  - Tailnet qua unicast DNS-SD (ví dụ: `openclaw.internal.`), **hoặc**
  - Host/port thủ công (dự phòng).

## Bắt đầu nhanh (ghép đôi + kết nối)

1. Khởi động Gateway:

```bash
openclaw gateway --port 18789
```

2. Trong ứng dụng iOS, mở Cài đặt và chọn một gateway đã được phát hiện (hoặc bật Host Thủ công và nhập host/port).

3. Phê duyệt yêu cầu ghép đôi trên máy chủ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Nếu ứng dụng thử ghép đôi lại với thông tin xác thực thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

4. Xác minh kết nối:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Đẩy qua relay cho các bản dựng chính thức

Các bản dựng iOS phân phối chính thức sử dụng relay đẩy bên ngoài thay vì công bố token APNs thô cho gateway.

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

Cách hoạt động của luồng:

- Ứng dụng iOS đăng ký với relay bằng App Attest và biên lai ứng dụng.
- Relay trả về một handle relay không rõ ràng cùng với quyền gửi theo phạm vi đăng ký.
- Ứng dụng iOS lấy danh tính gateway đã ghép đôi và bao gồm nó trong đăng ký relay, do đó đăng ký dựa trên relay được ủy quyền cho gateway cụ thể đó.
- Ứng dụng chuyển tiếp đăng ký dựa trên relay đó đến gateway đã ghép đôi với `push.apns.register`.
- Gateway sử dụng handle relay đã lưu trữ đó cho `push.test`, đánh thức nền và đánh thức nhắc nhở.
- URL cơ sở relay của gateway phải khớp với URL relay được tích hợp trong bản dựng iOS chính thức/TestFlight.
- Nếu ứng dụng sau đó kết nối với một gateway khác hoặc một bản dựng có URL cơ sở relay khác, nó sẽ làm mới đăng ký relay thay vì sử dụng lại liên kết cũ.

Những gì gateway **không** cần cho đường dẫn này:

- Không cần token relay trên toàn bộ triển khai.
- Không cần khóa APNs trực tiếp cho các gửi dựa trên relay chính thức/TestFlight.

Luồng hoạt động dự kiến:

1. Cài đặt bản dựng iOS chính thức/TestFlight.
2. Đặt `gateway.push.apns.relay.baseUrl` trên gateway.
3. Ghép đôi ứng dụng với gateway và để nó hoàn tất kết nối.
4. Ứng dụng tự động công bố `push.apns.register` sau khi có token APNs, phiên hoạt động được kết nối và đăng ký relay thành công.
5. Sau đó, `push.test`, đánh thức lại và đánh thức nhắc nhở có thể sử dụng đăng ký dựa trên relay đã lưu trữ.

Lưu ý về khả năng tương thích:

- `OPENCLAW_APNS_RELAY_BASE_URL` vẫn hoạt động như một ghi đè tạm thời cho gateway.

## Luồng xác thực và tin cậy

Relay tồn tại để thực thi hai ràng buộc mà APNs trực tiếp trên gateway không thể cung cấp cho các bản dựng iOS chính thức:

- Chỉ các bản dựng iOS OpenClaw chính hãng phân phối qua Apple mới có thể sử dụng relay được lưu trữ.
- Một gateway chỉ có thể gửi các đẩy dựa trên relay cho các thiết bị iOS đã ghép đôi với gateway cụ thể đó.

Từng bước:

1. `Ứng dụng iOS -> gateway`
   - Ứng dụng đầu tiên ghép đôi với gateway thông qua luồng xác thực Gateway thông thường.
   - Điều đó cung cấp cho ứng dụng một phiên node đã xác thực cùng với một phiên hoạt động đã xác thực.
   - Phiên hoạt động được sử dụng để gọi `gateway.identity.get`.

2. `Ứng dụng iOS -> relay`
   - Ứng dụng gọi các điểm cuối đăng ký relay qua HTTPS.
   - Đăng ký bao gồm bằng chứng App Attest cùng với biên lai ứng dụng.
   - Relay xác thực ID gói, bằng chứng App Attest và biên lai Apple, và yêu cầu đường dẫn phân phối chính thức/sản xuất.
   - Đây là điều ngăn chặn các bản dựng Xcode/dev cục bộ sử dụng relay được lưu trữ. Một bản dựng cục bộ có thể được ký, nhưng nó không đáp ứng bằng chứng phân phối chính thức của Apple mà relay mong đợi.

3. `ủy quyền danh tính gateway`
   - Trước khi đăng ký relay, ứng dụng lấy danh tính gateway đã ghép đôi từ `gateway.identity.get`.
   - Ứng dụng bao gồm danh tính gateway đó trong payload đăng ký relay.
   - Relay trả về một handle relay và một quyền gửi theo phạm vi đăng ký được ủy quyền cho danh tính gateway đó.

4. `gateway -> relay`
   - Gateway lưu trữ handle relay và quyền gửi từ `push.apns.register`.
   - Trên `push.test`, đánh thức lại và đánh thức nhắc nhở, gateway ký yêu cầu gửi với danh tính thiết bị của chính nó.
   - Relay xác minh cả quyền gửi đã lưu trữ và chữ ký gateway đối với danh tính gateway được ủy quyền từ đăng ký.
   - Một gateway khác không thể sử dụng lại đăng ký đã lưu trữ đó, ngay cả khi nó bằng cách nào đó có được handle.

5. `relay -> APNs`
   - Relay sở hữu thông tin xác thực APNs sản xuất và token APNs thô cho bản dựng chính thức.
   - Gateway không bao giờ lưu trữ token APNs thô cho các bản dựng chính thức dựa trên relay.
   - Relay gửi đẩy cuối cùng đến APNs thay mặt cho gateway đã ghép đôi.

Tại sao thiết kế này được tạo ra:

- Để giữ thông tin xác thực APNs sản xuất ra khỏi các gateway của người dùng.
- Để tránh lưu trữ token APNs thô của bản dựng chính thức trên gateway.
- Để chỉ cho phép sử dụng relay được lưu trữ cho các bản dựng OpenClaw chính thức/TestFlight.
- Để ngăn một gateway gửi đẩy đánh thức đến các thiết bị iOS thuộc sở hữu của một gateway khác.

Các bản dựng cục bộ/thủ công vẫn sử dụng APNs trực tiếp. Nếu bạn đang thử nghiệm các bản dựng đó mà không có relay, gateway vẫn cần thông tin xác thực APNs trực tiếp:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

## Đường dẫn phát hiện

### Bonjour (LAN)

Gateway quảng bá `_openclaw-gw._tcp` trên `local.`. Ứng dụng iOS tự động liệt kê các gateway này.

### Tailnet (mạng chéo)

Nếu mDNS bị chặn, sử dụng một vùng DNS-SD unicast (chọn một tên miền; ví dụ: `openclaw.internal.`) và Tailscale split DNS. Xem [Bonjour](/gateway/bonjour) cho ví dụ CoreDNS.

### Host/port thủ công

Trong Cài đặt, bật **Host Thủ công** và nhập host + port của gateway (mặc định `18789`).

## Canvas + A2UI

Node iOS hiển thị một canvas WKWebView. Sử dụng `node.invoke` để điều khiển:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Lưu ý:

- Máy chủ canvas Gateway phục vụ `/__openclaw__/canvas/` và `/__openclaw__/a2ui/`.
- Nó được phục vụ từ máy chủ HTTP của Gateway (cùng cổng với `gateway.port`, mặc định `18789`).
- Node iOS tự động điều hướng đến A2UI khi kết nối khi một URL máy chủ canvas được quảng bá.
- Quay lại scaffold tích hợp với `canvas.navigate` và `{"url":""}`.

### Đánh giá canvas / chụp nhanh

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

- `NODE_BACKGROUND_UNAVAILABLE`: đưa ứng dụng iOS lên nền trước (các lệnh canvas/camera/màn hình yêu cầu điều này).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway không quảng bá URL máy chủ canvas; kiểm tra `canvasHost` trong [Cấu hình Gateway](/gateway/configuration).
- Không xuất hiện lời nhắc ghép đôi: chạy `openclaw devices list` và phê duyệt thủ công.
- Kết nối lại thất bại sau khi cài đặt lại: token ghép đôi trong Keychain đã bị xóa; ghép đôi lại node.

## Tài liệu liên quan

- [Ghép đôi](/channels/pairing)
- [Phát hiện](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
