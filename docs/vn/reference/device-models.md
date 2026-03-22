---
summary: "Cách OpenClaw chuyển đổi mã định danh thiết bị Apple thành tên thân thiện trong ứng dụng macOS."
read_when:
  - Cập nhật ánh xạ mã định danh thiết bị hoặc tệp NOTICE/license
  - Thay đổi cách giao diện Instances hiển thị tên thiết bị
title: "Cơ sở dữ liệu mô hình thiết bị"
---

# Cơ sở dữ liệu mô hình thiết bị (tên thân thiện)

Ứng dụng đi kèm trên macOS hiển thị tên thiết bị Apple thân thiện trong giao diện **Instances** bằng cách ánh xạ mã định danh mô hình Apple (ví dụ: `iPad16,6`, `Mac16,6`) sang tên dễ đọc.

Ánh xạ này được lưu trữ dưới dạng JSON tại:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Nguồn dữ liệu

Hiện tại, chúng tôi sử dụng ánh xạ từ kho MIT-licensed:

- `kyle-seongwoo-jun/apple-device-identifiers`

Để đảm bảo các bản build ổn định, các tệp JSON được gắn với các commit cụ thể từ upstream (được ghi lại trong `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Cập nhật cơ sở dữ liệu

1. Chọn các commit từ upstream mà bạn muốn gắn (một cho iOS, một cho macOS).
2. Cập nhật các hash commit trong `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Tải lại các tệp JSON, gắn với các commit đó:

```bash
IOS_COMMIT="<commit sha cho ios-device-identifiers.json>"
MAC_COMMIT="<commit sha cho mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Đảm bảo `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` vẫn khớp với upstream (thay thế nếu giấy phép upstream thay đổi).
5. Kiểm tra ứng dụng macOS build sạch sẽ (không có cảnh báo):

```bash
swift build --package-path apps/macos
```
