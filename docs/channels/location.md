---
summary: "Khám phá cách phân tích và cấu hình vị trí kênh inbound như Telegram, WhatsApp để tối ưu hóa ngữ cảnh và hiệu quả."
read_when:
  - Thêm hoặc chỉnh sửa phân tích vị trí kênh
  - Sử dụng các trường ngữ cảnh vị trí trong lời nhắc hoặc công cụ của agent
title: "Hướng Dẫn Cấu Hình Vị Trí Kênh Inbound"
---

# Phân tích vị trí kênh

OpenClaw chuẩn hóa các vị trí được chia sẻ từ các kênh chat thành:

- văn bản dễ đọc được thêm vào nội dung inbound, và
- các trường có cấu trúc trong payload ngữ cảnh tự động trả lời.

Hiện tại hỗ trợ:

- **Telegram** (ghim vị trí + địa điểm + vị trí trực tiếp)
- **WhatsApp** (locationMessage + liveLocationMessage)
- **Matrix** (`m.location` với `geo_uri`)

## Định dạng văn bản

Các vị trí được hiển thị dưới dạng dòng thân thiện không có dấu ngoặc:

- Ghim:
  - `📍 48.858844, 2.294351 ±12m`
- Địa điểm có tên:
  - `📍 Tháp Eiffel — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- Chia sẻ trực tiếp:
  - `🛰 Vị trí trực tiếp: 48.858844, 2.294351 ±12m`

Nếu kênh có bao gồm chú thích/bình luận, nó sẽ được thêm vào dòng tiếp theo:

```
📍 48.858844, 2.294351 ±12m
Gặp nhau ở đây
```

## Trường ngữ cảnh

Khi có vị trí, các trường sau được thêm vào `ctx`:

- `LocationLat` (số)
- `LocationLon` (số)
- `LocationAccuracy` (số, mét; tùy chọn)
- `LocationName` (chuỗi; tùy chọn)
- `LocationAddress` (chuỗi; tùy chọn)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (boolean)

## Ghi chú kênh

- **Telegram**: địa điểm được ánh xạ tới `LocationName/LocationAddress`; vị trí trực tiếp sử dụng `live_period`.
- **WhatsApp**: `locationMessage.comment` và `liveLocationMessage.caption` được thêm vào dưới dạng dòng chú thích.
- **Matrix**: `geo_uri` được phân tích như một vị trí ghim; độ cao bị bỏ qua và `LocationIsLive` luôn là false.
