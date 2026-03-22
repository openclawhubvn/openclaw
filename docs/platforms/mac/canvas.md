---
summary: "Bảng Canvas được agent điều khiển, được nhúng thông qua WKWebView + custom URL scheme"
read_when:
  - Khi triển khai Canvas panel trên macOS
  - Khi thêm các điều khiển agent cho không gian làm việc trực quan
  - Khi debug việc load canvas bằng WKWebView
title: "Hướng Dẫn Cấu Hình Canvas Trên MacOS"
---
# Canvas (Ứng dụng macOS)

Ứng dụng macOS tích hợp một **Canvas panel** được điều khiển bởi agent thông qua `WKWebView`. Đây là một không gian làm việc trực quan nhẹ cho HTML/CSS/JS, A2UI và các bề mặt UI tương tác nhỏ.

## Vị trí của Canvas

Trạng thái của Canvas được lưu trữ trong Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas panel phục vụ các tệp này thông qua một **custom URL scheme**:

- `openclaw-canvas://<session>/<path>`

Ví dụ:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Nếu không có `index.html` tại thư mục gốc, ứng dụng sẽ hiển thị một **trang scaffold tích hợp sẵn**.

## Hành vi của Panel

- Panel không viền, có thể thay đổi kích thước, neo gần thanh menu (hoặc con trỏ chuột).
- Ghi nhớ kích thước/vị trí cho mỗi phiên làm việc.
- Tự động tải lại khi các tệp canvas cục bộ thay đổi.
- Chỉ một Canvas panel được hiển thị tại một thời điểm (phiên làm việc được chuyển đổi khi cần).

Canvas có thể bị vô hiệu hóa từ Cài đặt → **Allow Canvas**. Khi bị vô hiệu hóa, các lệnh node của canvas trả về `CANVAS_DISABLED`.

## Giao diện API của Agent

Canvas được truy cập qua **Gateway WebSocket**, cho phép agent:

- hiển thị/ẩn panel
- điều hướng đến một đường dẫn hoặc URL
- thực thi JavaScript
- chụp ảnh chụp màn hình

Ví dụ CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Lưu ý:

- `canvas.navigate` chấp nhận **đường dẫn canvas cục bộ**, URL `http(s)`, và URL `file://`.
- Nếu bạn truyền `"/"`, Canvas sẽ hiển thị scaffold cục bộ hoặc `index.html`.

## A2UI trong Canvas

A2UI được host bởi Gateway canvas host và được render bên trong Canvas panel. Khi Gateway quảng cáo một Canvas host, ứng dụng macOS tự động điều hướng đến trang host A2UI khi mở lần đầu.

URL host A2UI mặc định:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Lệnh A2UI (v0.8)

Hiện tại, Canvas chấp nhận các thông điệp server→client của **A2UI v0.8**:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) không được hỗ trợ.

Ví dụ CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Kiểm tra nhanh:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Kích hoạt chạy agent từ Canvas

Canvas có thể kích hoạt các lần chạy agent mới thông qua deep links:

- `openclaw://agent?...`

Ví dụ (trong JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Ứng dụng sẽ yêu cầu xác nhận trừ khi có khóa hợp lệ được cung cấp.

## Ghi chú bảo mật

- Scheme của Canvas chặn việc truy cập thư mục trái phép; các tệp phải nằm dưới thư mục gốc của phiên làm việc.
- Nội dung Canvas cục bộ sử dụng một scheme tùy chỉnh (không cần server loopback).
- URL `http(s)` bên ngoài chỉ được phép khi điều hướng rõ ràng.
