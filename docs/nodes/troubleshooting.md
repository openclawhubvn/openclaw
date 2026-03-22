---
summary: "Tìm hiểu cách xử lý sự cố ghép nối node, yêu cầu foreground, quyền truy cập và lỗi công cụ hiệu quả."
read_when:
  - Node đã kết nối nhưng công cụ camera/canvas/screen/exec không hoạt động
  - Cần mô hình tư duy về ghép nối node và phê duyệt
title: "Hướng Dẫn Khắc Phục Sự Cố Node"
---

# Khắc phục sự cố Node

Sử dụng trang này khi một node hiển thị trong trạng thái nhưng công cụ node không hoạt động.

## Thứ tự lệnh

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sau đó chạy các kiểm tra cụ thể cho node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Dấu hiệu hoạt động tốt:

- Node đã kết nối và ghép nối cho vai trò `node`.
- `nodes describe` bao gồm khả năng bạn đang gọi.
- Phê duyệt exec hiển thị chế độ/danh sách cho phép mong đợi.

## Yêu cầu foreground

`canvas.*`, `camera.*`, và `screen.*` chỉ hoạt động foreground trên các node iOS/Android.

Kiểm tra và khắc phục nhanh:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Nếu thấy `NODE_BACKGROUND_UNAVAILABLE`, đưa ứng dụng node lên foreground và thử lại.

## Ma trận quyền truy cập

| Khả năng                      | iOS                                     | Android                                      | Ứng dụng node trên macOS      | Mã lỗi thường gặp              |
| ----------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip`  | Camera (+ mic cho âm thanh clip)        | Camera (+ mic cho âm thanh clip)             | Camera (+ mic cho âm thanh clip) | `*_PERMISSION_REQUIRED`        |
| `screen.record`               | Ghi màn hình (+ mic tùy chọn)           | Nhắc chụp màn hình (+ mic tùy chọn)          | Ghi màn hình                  | `*_PERMISSION_REQUIRED`        |
| `location.get`                | Khi sử dụng hoặc luôn (tùy thuộc vào chế độ) | Vị trí foreground/background dựa trên chế độ | Quyền truy cập vị trí         | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                  | n/a (đường dẫn host node)               | n/a (đường dẫn host node)                    | Cần phê duyệt exec            | `SYSTEM_RUN_DENIED`            |

## Ghép nối và phê duyệt

Đây là các cổng khác nhau:

1. **Ghép nối thiết bị**: node này có thể kết nối với gateway không?
2. **Phê duyệt exec**: node này có thể chạy một lệnh shell cụ thể không?

Kiểm tra nhanh:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Nếu thiếu ghép nối, phê duyệt thiết bị node trước.
Nếu ghép nối ổn nhưng `system.run` thất bại, sửa phê duyệt exec/danh sách cho phép.

## Mã lỗi thường gặp của node

- `NODE_BACKGROUND_UNAVAILABLE` → ứng dụng đang ở chế độ nền; đưa lên foreground.
- `CAMERA_DISABLED` → camera bị tắt trong cài đặt node.
- `*_PERMISSION_REQUIRED` → thiếu/quyền OS bị từ chối.
- `LOCATION_DISABLED` → chế độ vị trí tắt.
- `LOCATION_PERMISSION_REQUIRED` → chế độ vị trí yêu cầu không được cấp.
- `LOCATION_BACKGROUND_UNAVAILABLE` → ứng dụng ở chế độ nền nhưng chỉ có quyền Khi Sử Dụng.
- `SYSTEM_RUN_DENIED: approval required` → yêu cầu exec cần phê duyệt rõ ràng.
- `SYSTEM_RUN_DENIED: allowlist miss` → lệnh bị chặn bởi chế độ danh sách cho phép.
  Trên các host node Windows, các dạng shell-wrapper như `cmd.exe /c ...` được coi là thiếu danh sách cho phép trong
  chế độ danh sách cho phép trừ khi được phê duyệt qua luồng hỏi.

## Vòng lặp khôi phục nhanh

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Nếu vẫn gặp sự cố:

- Phê duyệt lại ghép nối thiết bị.
- Mở lại ứng dụng node (foreground).
- Cấp lại quyền OS.
- Tạo lại/điều chỉnh chính sách phê duyệt exec.

Liên quan:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
