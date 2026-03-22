---
summary: "Cách OpenClaw tạo, gộp và hiển thị các mục presence"
read_when:
  - Debug tab Instances
  - Điều tra dòng instance trùng lặp hoặc cũ
  - Thay đổi kết nối gateway WS hoặc beacon system-event
title: "Presence"
---

# Presence

OpenClaw "presence" cung cấp cái nhìn nhẹ nhàng, tối ưu về:

- **Gateway** và
- **client kết nối với Gateway** (mac app, WebChat, CLI, v.v.)

Presence chủ yếu dùng để hiển thị tab **Instances** trên macOS app và cung cấp cái nhìn nhanh cho operator.

## Các trường Presence (hiển thị gì)

Mục presence là các object có cấu trúc với các trường như:

- `instanceId` (không bắt buộc nhưng rất khuyến khích): định danh client ổn định (thường là `connect.client.instanceId`)
- `host`: tên host dễ đọc
- `ip`: địa chỉ IP tối ưu
- `version`: chuỗi phiên bản client
- `deviceFamily` / `modelIdentifier`: gợi ý phần cứng
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: "giây từ lần nhập cuối" (nếu biết)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: timestamp cập nhật cuối (ms từ epoch)

## Nguồn tạo (presence từ đâu)

Mục presence được tạo từ nhiều nguồn và **gộp lại**.

### 1) Gateway tự tạo

Gateway luôn tạo một mục "self" khi khởi động để UI hiển thị host gateway ngay cả khi chưa có client nào kết nối.

### 2) Kết nối WebSocket

Mỗi client WS bắt đầu với yêu cầu `connect`. Khi handshake thành công, Gateway cập nhật hoặc thêm mới một mục presence cho kết nối đó.

#### Tại sao lệnh CLI một lần không hiển thị

CLI thường kết nối để chạy lệnh ngắn. Để tránh làm đầy danh sách Instances, `client.mode === "cli"` **không** được chuyển thành mục presence.

### 3) Beacon `system-event`

Client có thể gửi beacon định kỳ phong phú hơn qua phương thức `system-event`. Mac app dùng cách này để báo cáo tên host, IP và `lastInputSeconds`.

### 4) Node kết nối (vai trò: node)

Khi một node kết nối qua Gateway WebSocket với `role: node`, Gateway cập nhật hoặc thêm mới một mục presence cho node đó (tương tự như các client WS khác).

## Quy tắc gộp + loại trùng (tại sao `instanceId` quan trọng)

Mục presence được lưu trong một map in-memory duy nhất:

- Mục được khóa bằng **presence key**.
- Khóa tốt nhất là `instanceId` ổn định (từ `connect.client.instanceId`) tồn tại qua các lần khởi động lại.
- Khóa không phân biệt chữ hoa/thường.

Nếu client kết nối lại mà không có `instanceId` ổn định, có thể xuất hiện dòng **trùng lặp**.

## TTL và kích thước giới hạn

Presence có tính chất tạm thời:

- **TTL:** mục cũ hơn 5 phút sẽ bị loại bỏ
- **Tối đa mục:** 200 (mục cũ nhất bị loại bỏ trước)

Điều này giữ danh sách luôn mới và tránh tăng trưởng bộ nhớ không kiểm soát.

## Lưu ý Remote/tunnel (IP loopback)

Khi client kết nối qua SSH tunnel / local port forward, Gateway có thể thấy địa chỉ remote là `127.0.0.1`. Để tránh ghi đè IP tốt do client báo cáo, địa chỉ remote loopback bị bỏ qua.

## Người dùng

### Tab Instances trên macOS

MacOS app hiển thị kết quả của `system-presence` và áp dụng chỉ báo trạng thái nhỏ (Active/Idle/Stale) dựa trên tuổi của cập nhật cuối.

## Mẹo debug

- Để xem danh sách thô, gọi `system-presence` trên Gateway.
- Nếu thấy trùng lặp:
  - xác nhận client gửi `client.instanceId` ổn định trong handshake
  - xác nhận beacon định kỳ dùng cùng `instanceId`
  - kiểm tra xem mục từ kết nối có thiếu `instanceId` không (trùng lặp là điều có thể xảy ra)\n