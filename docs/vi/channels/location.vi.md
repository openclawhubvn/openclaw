---
summary: "Phân tích vị trí kênh inbound (Telegram + WhatsApp) và trường ngữ cảnh"
read_when:
  - Thêm hoặc chỉnh sửa phân tích vị trí kênh
  - Sử dụng trường ngữ cảnh vị trí trong prompt hoặc công cụ của agent
title: "Phân Tích Vị Trí Kênh"
---

# Phân Tích Vị Trí Kênh

OpenClaw chuẩn hóa vị trí chia sẻ từ các kênh chat thành:

- văn bản dễ đọc thêm vào nội dung inbound, và
- trường có cấu trúc trong payload ngữ cảnh auto-reply.

Hiện hỗ trợ:

- **Telegram** (pin vị trí + địa điểm + vị trí trực tiếp)
- **WhatsApp** (locationMessage + liveLocationMessage)
- **Matrix** (`m.location` với `geo_uri`)

## Định dạng văn bản

Vị trí được hiển thị dưới dạng dòng thân thiện, không có ngoặc:

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Địa điểm có tên:
  - `📍 Tháp Eiffel — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- Chia sẻ trực tiếp:
  - `🛰 Vị trí trực tiếp: 48.858844, 2.294351 ±12m`

Nếu kênh có chú thích/bình luận, sẽ được thêm vào dòng tiếp theo:

```
📍 48.858844, 2.294351 ±12m
Gặp ở đây
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

- **Telegram**: địa điểm map tới `LocationName/LocationAddress`; vị trí trực tiếp dùng `live_period`.
- **WhatsApp**: `locationMessage.comment` và `liveLocationMessage.caption` được thêm làm dòng chú thích.
- **Matrix**: `geo_uri` được phân tích như vị trí pin; độ cao bị bỏ qua và `LocationIsLive` luôn là false.\n