---
summary: "Khắc phục sự cố WSL2 Gateway + Windows Chrome remote CDP theo từng lớp"
read_when:
  - Chạy OpenClaw Gateway trong WSL2 trong khi Chrome chạy trên Windows
  - Gặp lỗi trình duyệt/giao diện điều khiển chồng chéo giữa WSL2 và Windows
  - Quyết định giữa Chrome MCP host-local và remote CDP thô trong cấu hình chia tách host
title: "Khắc phục sự cố WSL2 + Windows + remote Chrome CDP"
---

# Khắc phục sự cố WSL2 + Windows + remote Chrome CDP

Hướng dẫn này bao gồm cấu hình chia tách host phổ biến khi:

- OpenClaw Gateway chạy trong WSL2
- Chrome chạy trên Windows
- điều khiển trình duyệt phải vượt qua ranh giới WSL2/Windows

Nó cũng đề cập đến mô hình lỗi phân lớp từ [issue #39369](https://github.com/openclaw/openclaw/issues/39369): nhiều vấn đề độc lập có thể xuất hiện cùng lúc, khiến lớp sai trông như bị hỏng trước.

## Chọn chế độ trình duyệt phù hợp trước

Có hai mô hình hợp lệ:

### Lựa chọn 1: Remote CDP thô từ WSL2 đến Windows

Sử dụng hồ sơ trình duyệt từ xa trỏ từ WSL2 đến một endpoint CDP của Chrome trên Windows.

Chọn cách này khi:

- Gateway nằm trong WSL2
- Chrome chạy trên Windows
- cần điều khiển trình duyệt vượt qua ranh giới WSL2/Windows

### Lựa chọn 2: Host-local Chrome MCP

Chỉ sử dụng `existing-session` / `user` khi Gateway tự chạy trên cùng host với Chrome.

Chọn cách này khi:

- OpenClaw và Chrome trên cùng một máy
- muốn trạng thái trình duyệt đã đăng nhập cục bộ
- không cần truyền trình duyệt qua host

Đối với WSL2 Gateway + Windows Chrome, ưu tiên remote CDP thô. Chrome MCP là host-local, không phải cầu nối từ WSL2 đến Windows.

## Kiến trúc hoạt động

Hình dạng tham khảo:

- WSL2 chạy Gateway trên `127.0.0.1:18789`
- Windows mở Giao diện Điều khiển trong trình duyệt thông thường tại `http://127.0.0.1:18789/`
- Windows Chrome mở một endpoint CDP trên cổng `9222`
- WSL2 có thể truy cập endpoint CDP của Windows
- OpenClaw trỏ một hồ sơ trình duyệt đến địa chỉ có thể truy cập từ WSL2

## Tại sao cấu hình này gây nhầm lẫn

Nhiều lỗi có thể chồng chéo:

- WSL2 không thể truy cập endpoint CDP của Windows
- Giao diện Điều khiển được mở từ một nguồn không an toàn
- `gateway.controlUi.allowedOrigins` không khớp với nguồn trang
- thiếu token hoặc ghép đôi
- hồ sơ trình duyệt trỏ đến địa chỉ sai

Vì vậy, sửa một lớp có thể vẫn để lại lỗi khác hiển thị.

## Quy tắc quan trọng cho Giao diện Điều khiển

Khi giao diện được mở từ Windows, sử dụng localhost của Windows trừ khi có cấu hình HTTPS cụ thể.

Sử dụng:

`http://127.0.0.1:18789/`

Không mặc định sử dụng IP LAN cho Giao diện Điều khiển. HTTP thông thường trên địa chỉ LAN hoặc tailnet có thể kích hoạt hành vi không an toàn liên quan đến CDP. Xem [Control UI](/web/control-ui).

## Xác thực theo từng lớp

Làm từ trên xuống dưới. Không bỏ qua bước nào.

### Lớp 1: Xác minh Chrome đang phục vụ CDP trên Windows

Khởi động Chrome trên Windows với chế độ gỡ lỗi từ xa:

```powershell
chrome.exe --remote-debugging-port=9222
```

Từ Windows, xác minh Chrome trước:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Nếu thất bại trên Windows, OpenClaw chưa phải là vấn đề.

### Lớp 2: Xác minh WSL2 có thể truy cập endpoint của Windows

Từ WSL2, kiểm tra địa chỉ chính xác bạn dự định sử dụng trong `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Kết quả tốt:

- `/json/version` trả về JSON với metadata Browser / Protocol-Version
- `/json/list` trả về JSON (mảng rỗng cũng được nếu không có trang nào mở)

Nếu thất bại:

- Windows chưa mở cổng cho WSL2
- địa chỉ sai cho phía WSL2
- firewall / chuyển tiếp cổng / proxy cục bộ vẫn thiếu

Sửa điều đó trước khi chỉnh cấu hình OpenClaw.

### Lớp 3: Cấu hình hồ sơ trình duyệt đúng

Đối với remote CDP thô, trỏ OpenClaw đến địa chỉ có thể truy cập từ WSL2:

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

Ghi chú:

- sử dụng địa chỉ có thể truy cập từ WSL2, không phải địa chỉ chỉ hoạt động trên Windows
- giữ `attachOnly: true` cho trình duyệt được quản lý bên ngoài
- kiểm tra cùng URL với `curl` trước khi mong đợi OpenClaw thành công

### Lớp 4: Xác minh lớp Giao diện Điều khiển riêng biệt

Mở giao diện từ Windows:

`http://127.0.0.1:18789/`

Sau đó xác minh:

- nguồn trang khớp với những gì `gateway.controlUi.allowedOrigins` mong đợi
- xác thực token hoặc ghép đôi được cấu hình đúng
- không gỡ lỗi vấn đề xác thực Giao diện Điều khiển như thể đó là vấn đề trình duyệt

Trang hữu ích:

- [Control UI](/web/control-ui)

### Lớp 5: Xác minh điều khiển trình duyệt từ đầu đến cuối

Từ WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Kết quả tốt:

- tab mở trong Windows Chrome
- `openclaw browser tabs` trả về mục tiêu
- các hành động sau (`snapshot`, `screenshot`, `navigate`) hoạt động từ cùng hồ sơ

## Lỗi gây hiểu lầm phổ biến

Xem mỗi thông báo như một manh mối cụ thể cho từng lớp:

- `control-ui-insecure-auth`
  - vấn đề nguồn UI / ngữ cảnh an toàn, không phải vấn đề truyền CDP
- `token_missing`
  - vấn đề cấu hình xác thực
- `pairing required`
  - vấn đề phê duyệt thiết bị
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 không thể truy cập `cdpUrl` đã cấu hình
- `gateway timeout after 1500ms`
  - thường vẫn là vấn đề truy cập CDP hoặc endpoint từ xa chậm/không thể truy cập
- `No Chrome tabs found for profile="user"`
  - hồ sơ Chrome MCP cục bộ được chọn khi không có tab host-local nào có sẵn

## Danh sách kiểm tra nhanh

1. Windows: `curl http://127.0.0.1:9222/json/version` có hoạt động không?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` có hoạt động không?
3. Cấu hình OpenClaw: `browser.profiles.<name>.cdpUrl` có sử dụng địa chỉ chính xác có thể truy cập từ WSL2 không?
4. Giao diện Điều khiển: bạn có mở `http://127.0.0.1:18789/` thay vì IP LAN không?
5. Bạn có đang cố sử dụng `existing-session` giữa WSL2 và Windows thay vì remote CDP thô không?

## Kết luận thực tiễn

Cấu hình này thường khả thi. Phần khó là truyền trình duyệt, bảo mật nguồn Giao diện Điều khiển và token/ghép đôi có thể thất bại độc lập trong khi trông giống nhau từ phía người dùng.

Khi nghi ngờ:

- xác minh endpoint Chrome trên Windows trước
- xác minh cùng endpoint từ WSL2 thứ hai
- chỉ sau đó mới gỡ lỗi cấu hình OpenClaw hoặc xác thực Giao diện Điều khiển
