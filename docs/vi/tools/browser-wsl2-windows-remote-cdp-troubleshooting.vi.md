# Xử lý sự cố WSL2 + Windows + remote Chrome CDP

Hướng dẫn này dành cho setup phổ biến:

- OpenClaw Gateway chạy trong WSL2
- Chrome chạy trên Windows
- cần điều khiển trình duyệt qua biên giới WSL2/Windows

Cũng đề cập đến lỗi phân lớp từ [issue #39369](https://github.com/openclaw/openclaw/issues/39369): nhiều vấn đề độc lập có thể xuất hiện cùng lúc, khiến lớp sai trông như bị lỗi trước.

## Chọn chế độ trình duyệt phù hợp

Có hai mô hình hợp lệ:

### Tùy chọn 1: Raw remote CDP từ WSL2 đến Windows

Dùng profile trình duyệt remote trỏ từ WSL2 đến endpoint CDP của Chrome trên Windows.

Chọn khi:

- Gateway nằm trong WSL2
- Chrome chạy trên Windows
- cần điều khiển trình duyệt qua biên giới WSL2/Windows

### Tùy chọn 2: Host-local Chrome MCP

Dùng `existing-session` / `user` chỉ khi Gateway và Chrome chạy trên cùng máy.

Chọn khi:

- OpenClaw và Chrome trên cùng máy
- muốn trạng thái trình duyệt đã đăng nhập local
- không cần truyền trình duyệt qua host

Với WSL2 Gateway + Windows Chrome, ưu tiên raw remote CDP. Chrome MCP là host-local, không phải cầu nối WSL2-to-Windows.

## Kiến trúc hoạt động

Hình dạng tham khảo:

- WSL2 chạy Gateway trên `127.0.0.1:18789`
- Windows mở Control UI trong trình duyệt thường tại `http://127.0.0.1:18789/`
- Windows Chrome mở endpoint CDP trên cổng `9222`
- WSL2 có thể truy cập endpoint CDP của Windows
- OpenClaw trỏ profile trình duyệt đến địa chỉ có thể truy cập từ WSL2

## Tại sao setup này gây nhầm lẫn

Nhiều lỗi có thể chồng chéo:

- WSL2 không thể truy cập endpoint CDP của Windows
- Control UI mở từ nguồn không an toàn
- `gateway.controlUi.allowedOrigins` không khớp với nguồn trang
- thiếu token hoặc pairing
- profile trình duyệt trỏ sai địa chỉ

Vì vậy, sửa một lớp có thể vẫn để lại lỗi khác.

## Quy tắc quan trọng cho Control UI

Khi mở UI từ Windows, dùng localhost của Windows trừ khi có setup HTTPS cố ý.

Dùng:

`http://127.0.0.1:18789/`

Không mặc định dùng IP LAN cho Control UI. HTTP thường trên địa chỉ LAN hoặc tailnet có thể kích hoạt hành vi không an toàn không liên quan đến CDP. Xem [Control UI](/web/control-ui).

## Xác thực theo lớp

Làm từ trên xuống. Không bỏ qua bước nào.

### Lớp 1: Xác minh Chrome phục vụ CDP trên Windows

Khởi động Chrome trên Windows với remote debugging:

```powershell
chrome.exe --remote-debugging-port=9222
```

Từ Windows, xác minh Chrome:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Nếu thất bại trên Windows, OpenClaw chưa phải vấn đề.

### Lớp 2: Xác minh WSL2 có thể truy cập endpoint Windows

Từ WSL2, kiểm tra địa chỉ dự định dùng trong `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Kết quả tốt:

- `/json/version` trả về JSON với metadata Browser / Protocol-Version
- `/json/list` trả về JSON (mảng rỗng cũng được nếu không có trang mở)

Nếu thất bại:

- Windows chưa mở cổng cho WSL2
- địa chỉ sai cho phía WSL2
- thiếu firewall / port forwarding / proxy local

Sửa trước khi đụng đến config OpenClaw.

### Lớp 3: Cấu hình profile trình duyệt đúng

Với raw remote CDP, trỏ OpenClaw đến địa chỉ có thể truy cập từ WSL2:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Lưu ý:

- dùng địa chỉ WSL2 có thể truy cập, không phải chỉ hoạt động trên Windows
- giữ `attachOnly: true` cho trình duyệt quản lý bên ngoài
- thử URL với `curl` trước khi mong OpenClaw thành công

### Lớp 4: Xác minh lớp Control UI riêng

Mở UI từ Windows:

`http://127.0.0.1:18789/`

Sau đó xác minh:

- nguồn trang khớp với `gateway.controlUi.allowedOrigins`
- cấu hình token auth hoặc pairing đúng
- không debug vấn đề auth Control UI như thể là vấn đề trình duyệt

Trang hữu ích:

- [Control UI](/web/control-ui)

### Lớp 5: Xác minh điều khiển trình duyệt end-to-end

Từ WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Kết quả tốt:

- tab mở trong Windows Chrome
- `openclaw browser tabs` trả về mục tiêu
- các hành động sau (`snapshot`, `screenshot`, `navigate`) hoạt động từ cùng profile

## Lỗi gây hiểu lầm thường gặp

Xem mỗi thông báo như manh mối lớp cụ thể:

- `control-ui-insecure-auth`
  - vấn đề nguồn UI / secure-context, không phải vấn đề CDP transport
- `token_missing`
  - vấn đề cấu hình auth
- `pairing required`
  - vấn đề phê duyệt thiết bị
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 không thể truy cập `cdpUrl` đã cấu hình
- `gateway timeout after 1500ms`
  - thường vẫn là vấn đề CDP reachability hoặc endpoint remote chậm/không thể truy cập
- `No Chrome tabs found for profile="user"`
  - profile Chrome MCP local được chọn khi không có tab host-local

## Checklist xử lý nhanh

1. Windows: `curl http://127.0.0.1:9222/json/version` có hoạt động không?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` có hoạt động không?
3. Config OpenClaw: `browser.profiles.<name>.cdpUrl` có dùng đúng địa chỉ WSL2 có thể truy cập không?
4. Control UI: có mở `http://127.0.0.1:18789/` thay vì IP LAN không?
5. Có đang cố dùng `existing-session` giữa WSL2 và Windows thay vì raw remote CDP không?

## Kết luận thực tế

Setup thường khả thi. Khó khăn là transport trình duyệt, bảo mật nguồn Control UI, và token/pairing có thể thất bại độc lập nhưng trông giống nhau từ phía người dùng.

Khi nghi ngờ:

- xác minh endpoint Chrome Windows local trước
- xác minh cùng endpoint từ WSL2 thứ hai
- chỉ sau đó debug config OpenClaw hoặc auth Control UI\n