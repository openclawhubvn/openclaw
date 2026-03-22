---
summary: "Lệnh location cho nodes (location.get), chế độ quyền truy cập và hành vi foreground trên Android"
read_when:
  - Thêm hỗ trợ node location hoặc UI quyền truy cập
  - Thiết kế quyền truy cập location trên Android hoặc hành vi foreground
title: "Lệnh Location"
---

# Lệnh location (nodes)

## Tóm tắt nhanh

- `location.get` là lệnh node (qua `node.invoke`).
- Mặc định tắt.
- Cài đặt app Android dùng selector: Tắt / Khi sử dụng.
- Có toggle riêng: Vị trí chính xác.

## Tại sao dùng selector (không chỉ là switch)

Quyền truy cập OS có nhiều cấp độ. Có thể dùng selector trong app, nhưng OS quyết định quyền thực tế.

- iOS/macOS có thể hiển thị **Khi sử dụng** hoặc **Luôn luôn** trong prompt/cài đặt hệ thống.
- App Android hiện chỉ hỗ trợ location foreground.
- Vị trí chính xác là quyền riêng (iOS 14+ “Precise”, Android “fine” vs “coarse”).

Selector trong UI điều khiển chế độ yêu cầu; quyền thực tế nằm trong cài đặt OS.

## Mô hình cài đặt

Theo thiết bị node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Hành vi UI:

- Chọn `whileUsing` yêu cầu quyền foreground.
- Nếu OS từ chối cấp độ yêu cầu, quay lại cấp độ cao nhất được cấp và hiển thị trạng thái.

## Mapping quyền truy cập (node.permissions)

Tùy chọn. Node macOS báo cáo `location` qua permissions map; iOS/Android có thể bỏ qua.

## Lệnh: `location.get`

Gọi qua `node.invoke`.

Tham số (đề xuất):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Payload phản hồi:

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

- `LOCATION_DISABLED`: selector đang tắt.
- `LOCATION_PERMISSION_REQUIRED`: thiếu quyền cho chế độ yêu cầu.
- `LOCATION_BACKGROUND_UNAVAILABLE`: app đang chạy nền nhưng chỉ cho phép Khi sử dụng.
- `LOCATION_TIMEOUT`: không có fix kịp thời.
- `LOCATION_UNAVAILABLE`: lỗi hệ thống / không có provider.

## Hành vi nền

- App Android từ chối `location.get` khi chạy nền.
- Giữ OpenClaw mở khi yêu cầu location trên Android.
- Các nền tảng node khác có thể khác.

## Tích hợp mô hình/công cụ

- Bề mặt công cụ: công cụ `nodes` thêm hành động `location_get` (cần node).
- CLI: `openclaw nodes location get --node <id>`.
- Hướng dẫn agent: chỉ gọi khi người dùng bật location và hiểu phạm vi.

## Nội dung UX (đề xuất)

- Tắt: “Chia sẻ vị trí đã bị tắt.”
- Khi sử dụng: “Chỉ khi OpenClaw đang mở.”
- Chính xác: “Sử dụng vị trí GPS chính xác. Tắt để chia sẻ vị trí gần đúng.”\n