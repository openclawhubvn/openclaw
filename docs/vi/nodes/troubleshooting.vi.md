# Khắc phục sự cố Node

Dùng trang này khi node hiện trạng thái kết nối nhưng các công cụ node không hoạt động.

## Thứ tự lệnh cần chạy

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sau đó kiểm tra cụ thể cho node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Dấu hiệu hoạt động tốt:

- Node kết nối và ghép cặp với vai trò `node`.
- `nodes describe` có khả năng bạn đang gọi.
- Exec approvals hiển thị chế độ/danh sách cho phép như mong đợi.

## Yêu cầu foreground

`canvas.*`, `camera.*`, và `screen.*` chỉ hoạt động foreground trên node iOS/Android.

Kiểm tra và khắc phục nhanh:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Nếu thấy `NODE_BACKGROUND_UNAVAILABLE`, đưa app node lên foreground và thử lại.

## Ma trận quyền

| Khả năng                      | iOS                                     | Android                                      | macOS node app                | Mã lỗi thường gặp              |
| ----------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip`  | Camera (+ mic cho âm thanh clip)        | Camera (+ mic cho âm thanh clip)             | Camera (+ mic cho âm thanh clip) | `*_PERMISSION_REQUIRED`        |
| `screen.record`               | Ghi màn hình (+ mic tùy chọn)           | Nhắc nhở chụp màn hình (+ mic tùy chọn)      | Ghi màn hình                  | `*_PERMISSION_REQUIRED`        |
| `location.get`                | Khi sử dụng hoặc luôn (tùy chế độ)      | Vị trí foreground/background tùy chế độ      | Quyền vị trí                  | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                  | n/a (đường dẫn host node)               | n/a (đường dẫn host node)                    | Cần phê duyệt exec            | `SYSTEM_RUN_DENIED`            |

## Ghép cặp và phê duyệt

Đây là các cổng khác nhau:

1. **Ghép cặp thiết bị**: node có thể kết nối với gateway không?
2. **Phê duyệt exec**: node có thể chạy lệnh shell cụ thể không?

Kiểm tra nhanh:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Nếu thiếu ghép cặp, phê duyệt thiết bị node trước.
Nếu ghép cặp ổn nhưng `system.run` thất bại, sửa phê duyệt exec/danh sách cho phép.

## Mã lỗi node thường gặp

- `NODE_BACKGROUND_UNAVAILABLE` → app đang chạy nền; đưa lên foreground.
- `CAMERA_DISABLED` → camera bị tắt trong cài đặt node.
- `*_PERMISSION_REQUIRED` → thiếu quyền OS hoặc bị từ chối.
- `LOCATION_DISABLED` → chế độ vị trí tắt.
- `LOCATION_PERMISSION_REQUIRED` → chế độ vị trí yêu cầu không được cấp.
- `LOCATION_BACKGROUND_UNAVAILABLE` → app chạy nền nhưng chỉ có quyền Khi Sử Dụng.
- `SYSTEM_RUN_DENIED: approval required` → yêu cầu exec cần phê duyệt rõ ràng.
- `SYSTEM_RUN_DENIED: allowlist miss` → lệnh bị chặn bởi chế độ danh sách cho phép.
  Trên host node Windows, các dạng shell-wrapper như `cmd.exe /c ...` được coi là thiếu danh sách cho phép trong chế độ danh sách cho phép trừ khi được phê duyệt qua ask flow.

## Vòng lặp khôi phục nhanh

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Nếu vẫn gặp sự cố:

- Phê duyệt lại ghép cặp thiết bị.
- Mở lại app node (foreground).
- Cấp lại quyền OS.
- Tạo lại/điều chỉnh chính sách phê duyệt exec.

Liên quan:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)\n