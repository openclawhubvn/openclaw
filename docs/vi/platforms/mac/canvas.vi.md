---
summary: "Panel Canvas điều khiển bởi agent nhúng qua WKWebView + custom URL scheme"
read_when:
  - Triển khai panel Canvas trên macOS
  - Thêm điều khiển agent cho không gian làm việc trực quan
  - Debug tải canvas WKWebView
title: "Canvas"
---

# Canvas (ứng dụng macOS)

Ứng dụng macOS nhúng một **Canvas panel** điều khiển bởi agent sử dụng `WKWebView`. Đây là không gian làm việc trực quan nhẹ cho HTML/CSS/JS, A2UI và các bề mặt UI tương tác nhỏ.

## Vị trí của Canvas

Trạng thái Canvas lưu trữ dưới Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas panel phục vụ các file qua **custom URL scheme**:

- `openclaw-canvas://<session>/<path>`

Ví dụ:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Nếu không có `index.html` ở root, ứng dụng sẽ hiển thị **trang scaffold tích hợp**.

## Hành vi của Panel

- Panel không viền, có thể thay đổi kích thước, neo gần thanh menu (hoặc con trỏ chuột).
- Nhớ kích thước/vị trí theo từng session.
- Tự động tải lại khi file canvas local thay đổi.
- Chỉ một Canvas panel hiển thị tại một thời điểm (chuyển session khi cần).

Có thể tắt Canvas từ Settings → **Allow Canvas**. Khi tắt, lệnh node canvas trả về `CANVAS_DISABLED`.

## API của Agent

Canvas được expose qua **Gateway WebSocket**, cho phép agent:

- hiển thị/ẩn panel
- điều hướng đến một path hoặc URL
- thực thi JavaScript
- chụp ảnh snapshot

Ví dụ CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Lưu ý:

- `canvas.navigate` chấp nhận **local canvas paths**, URL `http(s)`, và URL `file://`.
- Nếu truyền `"/"`, Canvas sẽ hiển thị scaffold local hoặc `index.html`.

## A2UI trong Canvas

A2UI được host bởi Gateway canvas host và render trong Canvas panel. Khi Gateway quảng cáo một Canvas host, ứng dụng macOS tự động điều hướng đến trang host A2UI khi mở lần đầu.

URL host A2UI mặc định:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Lệnh A2UI (v0.8)

Canvas hiện chấp nhận các message server→client **A2UI v0.8**:

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

## Kích hoạt agent từ Canvas

Canvas có thể kích hoạt chạy agent mới qua deep links:

- `openclaw://agent?...`

Ví dụ (trong JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Ứng dụng sẽ yêu cầu xác nhận trừ khi có key hợp lệ.

## Ghi chú bảo mật

- Scheme Canvas chặn truy cập thư mục; file phải nằm dưới root session.
- Nội dung Canvas local sử dụng custom scheme (không cần server loopback).
- URL `http(s)` bên ngoài chỉ được phép khi điều hướng rõ ràng.\n