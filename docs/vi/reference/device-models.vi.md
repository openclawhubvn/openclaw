---
summary: "Cách OpenClaw ánh xạ mã định danh model thiết bị Apple thành tên thân thiện trong app macOS."
read_when:
  - Cập nhật ánh xạ mã định danh model thiết bị hoặc file NOTICE/license
  - Thay đổi cách Instances UI hiển thị tên thiết bị
title: "Cơ sở dữ liệu model thiết bị"
---

# Cơ sở dữ liệu model thiết bị (tên thân thiện)

App macOS của OpenClaw hiển thị tên thân thiện của model thiết bị Apple trong giao diện **Instances** bằng cách ánh xạ mã định danh model Apple (ví dụ: `iPad16,6`, `Mac16,6`) sang tên dễ đọc.

Ánh xạ này được lưu dưới dạng JSON tại:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Nguồn dữ liệu

Hiện tại, ánh xạ được lấy từ repository có giấy phép MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Để đảm bảo build ổn định, các file JSON được gắn với các commit cụ thể từ upstream (ghi lại trong `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Cập nhật cơ sở dữ liệu

1. Chọn commit upstream muốn gắn (một cho iOS, một cho macOS).
2. Cập nhật hash commit trong `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Tải lại file JSON, gắn với các commit đó:

```bash
IOS_COMMIT="<commit sha cho ios-device-identifiers.json>"
MAC_COMMIT="<commit sha cho mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Đảm bảo `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` vẫn khớp với upstream (thay thế nếu license upstream thay đổi).
5. Kiểm tra app macOS build sạch (không có cảnh báo):

```bash
swift build --package-path apps/macos
```\n