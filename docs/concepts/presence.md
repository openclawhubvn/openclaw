---
summary: "Khám phá cách OpenClaw tạo và hiển thị hiện diện, giúp tối ưu hóa trải nghiệm người dùng với thông tin hợp nhất."
read_when:
  - Gỡ lỗi tab Instances
  - Điều tra các hàng instance trùng lặp hoặc lỗi thời
  - Thay đổi kết nối gateway WS hoặc beacon sự kiện hệ thống
title: "Hướng Dẫn Cấu Hình Hiện Diện OpenClaw"
---

# Hiện diện

"Hiện diện" trong OpenClaw là một cái nhìn nhẹ nhàng, nỗ lực tốt nhất về:

- chính **Gateway**, và
- **các client kết nối với Gateway** (ứng dụng mac, WebChat, CLI, v.v.)

Hiện diện chủ yếu được sử dụng để hiển thị tab **Instances** của ứng dụng macOS và cung cấp khả năng quan sát nhanh cho người vận hành.

## Các trường hiện diện (những gì hiển thị)

Các mục hiện diện là các đối tượng có cấu trúc với các trường như:

- `instanceId` (không bắt buộc nhưng rất khuyến khích): định danh client ổn định (thường là `connect.client.instanceId`)
- `host`: tên host thân thiện với người dùng
- `ip`: địa chỉ IP nỗ lực tốt nhất
- `version`: chuỗi phiên bản client
- `deviceFamily` / `modelIdentifier`: gợi ý phần cứng
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: "số giây kể từ lần nhập cuối cùng của người dùng" (nếu biết)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: dấu thời gian cập nhật cuối cùng (ms kể từ epoch)

## Nguồn tạo (hiện diện đến từ đâu)

Các mục hiện diện được tạo ra từ nhiều nguồn và được **hợp nhất**.

### 1) Mục tự thân của Gateway

Gateway luôn khởi tạo một mục "tự thân" khi khởi động để giao diện người dùng hiển thị host gateway ngay cả khi chưa có client nào kết nối.

### 2) Kết nối WebSocket

Mỗi client WS bắt đầu với một yêu cầu `connect`. Khi bắt tay thành công, Gateway cập nhật hoặc thêm mới một mục hiện diện cho kết nối đó.

#### Tại sao các lệnh CLI một lần không hiển thị

CLI thường kết nối để thực hiện các lệnh ngắn, một lần. Để tránh làm đầy danh sách Instances, `client.mode === "cli"` **không** được chuyển thành một mục hiện diện.

### 3) Beacon `system-event`

Các client có thể gửi các beacon định kỳ phong phú hơn thông qua phương thức `system-event`. Ứng dụng mac sử dụng điều này để báo cáo tên host, IP và `lastInputSeconds`.

### 4) Kết nối Node (vai trò: node)

Khi một node kết nối qua Gateway WebSocket với `role: node`, Gateway cập nhật hoặc thêm mới một mục hiện diện cho node đó (quy trình tương tự như các client WS khác).

## Quy tắc hợp nhất + loại bỏ trùng lặp (tại sao `instanceId` quan trọng)

Các mục hiện diện được lưu trữ trong một bản đồ trong bộ nhớ:

- Các mục được khóa bằng một **khóa hiện diện**.
- Khóa tốt nhất là `instanceId` ổn định (từ `connect.client.instanceId`) có thể tồn tại qua các lần khởi động lại.
- Khóa không phân biệt chữ hoa chữ thường.

Nếu một client kết nối lại mà không có `instanceId` ổn định, nó có thể xuất hiện như một hàng **trùng lặp**.

## Thời gian tồn tại và kích thước giới hạn

Hiện diện được thiết kế để tồn tại ngắn hạn:

- **TTL:** các mục cũ hơn 5 phút sẽ bị loại bỏ
- **Số lượng mục tối đa:** 200 (mục cũ nhất bị loại bỏ trước)

Điều này giữ cho danh sách luôn mới và tránh tăng trưởng bộ nhớ không giới hạn.

## Lưu ý về kết nối từ xa/đường hầm (IP loopback)

Khi một client kết nối qua một đường hầm SSH / chuyển tiếp cổng địa phương, Gateway có thể thấy địa chỉ từ xa là `127.0.0.1`. Để tránh ghi đè một địa chỉ IP tốt do client báo cáo, các địa chỉ từ xa loopback bị bỏ qua.

## Người tiêu dùng

### Tab Instances trên macOS

Ứng dụng macOS hiển thị đầu ra của `system-presence` và áp dụng một chỉ báo trạng thái nhỏ (Hoạt động/Không hoạt động/Lỗi thời) dựa trên tuổi của lần cập nhật cuối cùng.

## Mẹo gỡ lỗi

- Để xem danh sách thô, gọi `system-presence` đối với Gateway.
- Nếu thấy trùng lặp:
  - xác nhận các client gửi một `client.instanceId` ổn định trong quá trình bắt tay
  - xác nhận các beacon định kỳ sử dụng cùng `instanceId`
  - kiểm tra xem mục được tạo từ kết nối có thiếu `instanceId` không (trùng lặp là điều có thể xảy ra)
