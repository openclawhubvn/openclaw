---
summary: "Lệnh vị trí cho các node (location.get), chế độ quyền truy cập và hành vi nền trên Android"
read_when:
  - Thêm hỗ trợ node vị trí hoặc giao diện quyền truy cập
  - Thiết kế quyền truy cập vị trí trên Android hoặc hành vi nền
title: "Lệnh Vị Trí"
---

# Lệnh vị trí (các node)

## Tóm tắt nhanh

- `location.get` là lệnh cho node (thông qua `node.invoke`).
- Mặc định tắt.
- Cài đặt ứng dụng Android sử dụng bộ chọn: Tắt / Khi Sử Dụng.
- Công tắc riêng: Vị trí Chính Xác.

## Tại sao dùng bộ chọn (không chỉ là công tắc)

Quyền truy cập của hệ điều hành có nhiều cấp độ. Chúng ta có thể hiển thị bộ chọn trong ứng dụng, nhưng hệ điều hành vẫn quyết định quyền thực tế.

- iOS/macOS có thể hiển thị **Khi Sử Dụng** hoặc **Luôn Luôn** trong thông báo hệ thống/Cài đặt.
- Ứng dụng Android hiện chỉ hỗ trợ vị trí nền trước.
- Vị trí chính xác là quyền riêng biệt (iOS 14+ “Chính Xác”, Android “chính xác” so với “gần đúng”).

Bộ chọn trong giao diện điều khiển chế độ yêu cầu của chúng ta; quyền thực tế nằm trong cài đặt hệ điều hành.

## Mô hình cài đặt

Theo từng thiết bị node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Hành vi giao diện:

- Chọn `whileUsing` yêu cầu quyền nền trước.
- Nếu hệ điều hành từ chối cấp độ yêu cầu, quay lại cấp độ cao nhất đã được cấp và hiển thị trạng thái.

## Ánh xạ quyền truy cập (node.permissions)

Tùy chọn. Node macOS báo cáo `location` thông qua bản đồ quyền truy cập; iOS/Android có thể bỏ qua.

## Lệnh: `location.get`

Gọi thông qua `node.invoke`.

Tham số (đề xuất):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Dữ liệu phản hồi:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Lỗi (mã ổn định):

- `LOCATION_DISABLED`: bộ chọn đang tắt.
- `LOCATION_PERMISSION_REQUIRED`: thiếu quyền cho chế độ yêu cầu.
- `LOCATION_BACKGROUND_UNAVAILABLE`: ứng dụng đang chạy nền nhưng chỉ cho phép Khi Sử Dụng.
- `LOCATION_TIMEOUT`: không có kết quả trong thời gian quy định.
- `LOCATION_UNAVAILABLE`: lỗi hệ thống / không có nhà cung cấp.

## Hành vi nền

- Ứng dụng Android từ chối `location.get` khi chạy nền.
- Giữ OpenClaw mở khi yêu cầu vị trí trên Android.
- Các nền tảng node khác có thể khác.

## Tích hợp mô hình/công cụ

- Bề mặt công cụ: công cụ `nodes` thêm hành động `location_get` (cần node).
- CLI: `openclaw nodes location get --node <id>`.
- Hướng dẫn cho agent: chỉ gọi khi người dùng đã bật vị trí và hiểu phạm vi.

## Nội dung UX (đề xuất)

- Tắt: “Chia sẻ vị trí đã bị vô hiệu hóa.”
- Khi Sử Dụng: “Chỉ khi OpenClaw đang mở.”
- Chính Xác: “Sử dụng vị trí GPS chính xác. Tắt để chia sẻ vị trí gần đúng.”
