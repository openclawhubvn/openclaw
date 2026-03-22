---
summary: "Chụp ảnh và quay video ngắn (iOS/Android nodes + macOS app) cho agent: ảnh (jpg) và video ngắn (mp4)"
read_when:
  - Thêm hoặc chỉnh sửa chức năng chụp ảnh trên iOS/Android nodes hoặc macOS
  - Mở rộng quy trình xử lý file tạm MEDIA cho agent
title: "Chụp ảnh và quay video"
---

# Chụp ảnh và quay video (agent)

OpenClaw hỗ trợ **chụp ảnh và quay video** cho quy trình của agent:

- **iOS node** (kết nối qua Gateway): chụp **ảnh** (`jpg`) hoặc **video ngắn** (`mp4`, có thể kèm âm thanh) qua `node.invoke`.
- **Android node** (kết nối qua Gateway): chụp **ảnh** (`jpg`) hoặc **video ngắn** (`mp4`, có thể kèm âm thanh) qua `node.invoke`.
- **macOS app** (node qua Gateway): chụp **ảnh** (`jpg`) hoặc **video ngắn** (`mp4`, có thể kèm âm thanh) qua `node.invoke`.

Tất cả quyền truy cập camera đều được kiểm soát qua **cài đặt người dùng**.

## iOS node

### Cài đặt người dùng (mặc định bật)

- Tab Cài đặt iOS → **Camera** → **Cho phép Camera** (`camera.enabled`)
  - Mặc định: **bật** (khóa bị thiếu được coi là đã bật).
  - Khi tắt: lệnh `camera.*` trả về `CAMERA_DISABLED`.

### Lệnh (qua Gateway `node.invoke`)

- `camera.list`
  - Phản hồi:
    - `devices`: mảng `{ id, name, position, deviceType }`

- `camera.snap`
  - Tham số:
    - `facing`: `front|back` (mặc định: `front`)
    - `maxWidth`: số (tùy chọn; mặc định `1600` trên iOS node)
    - `quality`: `0..1` (tùy chọn; mặc định `0.9`)
    - `format`: hiện tại là `jpg`
    - `delayMs`: số (tùy chọn; mặc định `0`)
    - `deviceId`: chuỗi (tùy chọn; từ `camera.list`)
  - Phản hồi:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Giới hạn payload: ảnh được nén lại để giữ payload base64 dưới 5 MB.

- `camera.clip`
  - Tham số:
    - `facing`: `front|back` (mặc định: `front`)
    - `durationMs`: số (mặc định `3000`, tối đa `60000`)
    - `includeAudio`: boolean (mặc định `true`)
    - `format`: hiện tại là `mp4`
    - `deviceId`: chuỗi (tùy chọn; từ `camera.list`)
  - Phản hồi:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Yêu cầu foreground

Giống như `canvas.*`, iOS node chỉ cho phép lệnh `camera.*` trong **foreground**. Gọi trong background trả về `NODE_BACKGROUND_UNAVAILABLE`.

### CLI helper (file tạm + MEDIA)

Cách dễ nhất để lấy file đính kèm là qua CLI helper, ghi media đã giải mã vào file tạm và in `MEDIA:<path>`.

Ví dụ:

```bash
openclaw nodes camera snap --node <id>               # mặc định: cả trước + sau (2 dòng MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Lưu ý:

- `nodes camera snap` mặc định chụp **cả hai** hướng để cung cấp cả hai góc nhìn cho agent.
- File đầu ra là tạm thời (trong thư mục tạm của hệ điều hành) trừ khi tự xây dựng wrapper riêng.

## Android node

### Cài đặt người dùng Android (mặc định bật)

- Sheet Cài đặt Android → **Camera** → **Cho phép Camera** (`camera.enabled`)
  - Mặc định: **bật** (khóa bị thiếu được coi là đã bật).
  - Khi tắt: lệnh `camera.*` trả về `CAMERA_DISABLED`.

### Quyền

- Android yêu cầu quyền runtime:
  - `CAMERA` cho cả `camera.snap` và `camera.clip`.
  - `RECORD_AUDIO` cho `camera.clip` khi `includeAudio=true`.

Nếu thiếu quyền, app sẽ nhắc khi có thể; nếu bị từ chối, yêu cầu `camera.*` sẽ thất bại với lỗi `*_PERMISSION_REQUIRED`.

### Yêu cầu foreground Android

Giống như `canvas.*`, Android node chỉ cho phép lệnh `camera.*` trong **foreground**. Gọi trong background trả về `NODE_BACKGROUND_UNAVAILABLE`.

### Lệnh Android (qua Gateway `node.invoke`)

- `camera.list`
  - Phản hồi:
    - `devices`: mảng `{ id, name, position, deviceType }`

### Giới hạn payload

Ảnh được nén lại để giữ payload base64 dưới 5 MB.

## macOS app

### Cài đặt người dùng (mặc định tắt)

Ứng dụng macOS có một checkbox:

- **Cài đặt → Chung → Cho phép Camera** (`openclaw.cameraEnabled`)
  - Mặc định: **tắt**
  - Khi tắt: yêu cầu camera trả về “Camera bị tắt bởi người dùng”.

### CLI helper (node invoke)

Sử dụng CLI `openclaw` chính để gọi lệnh camera trên macOS node.

Ví dụ:

```bash
openclaw nodes camera list --node <id>            # liệt kê id camera
openclaw nodes camera snap --node <id>            # in MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # in MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # in MEDIA:<path> (cờ legacy)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Lưu ý:

- `openclaw nodes camera snap` mặc định `maxWidth=1600` trừ khi ghi đè.
- Trên macOS, `camera.snap` chờ `delayMs` (mặc định 2000ms) sau khi warm-up/ổn định phơi sáng trước khi chụp.
- Payload ảnh được nén lại để giữ base64 dưới 5 MB.

## An toàn + giới hạn thực tế

- Truy cập camera và micro kích hoạt các nhắc nhở quyền thông thường của hệ điều hành (và yêu cầu chuỗi sử dụng trong Info.plist).
- Video clip bị giới hạn (hiện tại `<= 60s`) để tránh payload node quá lớn (overhead base64 + giới hạn tin nhắn).

## Video màn hình macOS (cấp độ OS)

Để quay video _màn hình_ (không phải camera), sử dụng ứng dụng macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # in MEDIA:<path>
```

Lưu ý:

- Yêu cầu quyền **Screen Recording** trên macOS (TCC).\n