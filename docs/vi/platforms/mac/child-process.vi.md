# Vòng đời Gateway trên macOS

Ứng dụng macOS **quản lý Gateway qua launchd** mặc định, không tạo Gateway như một child process. Đầu tiên, ứng dụng cố gắng kết nối với Gateway đang chạy trên cổng đã cấu hình; nếu không có, nó kích hoạt dịch vụ launchd qua CLI `openclaw` bên ngoài (không có runtime nhúng). Điều này giúp tự động khởi động khi đăng nhập và khởi động lại khi gặp sự cố.

Chế độ child-process (Gateway được ứng dụng tạo trực tiếp) **không được sử dụng** hiện nay. Nếu cần kết nối chặt chẽ với UI, chạy Gateway thủ công trong terminal.

## Hành vi mặc định (launchd)

- Ứng dụng cài đặt một LaunchAgent cho từng người dùng với nhãn `ai.openclaw.gateway` (hoặc `ai.openclaw.<profile>` khi dùng `--profile`/`OPENCLAW_PROFILE`; hỗ trợ legacy `com.openclaw.*`).
- Khi bật chế độ Local, ứng dụng đảm bảo LaunchAgent được tải và khởi động Gateway nếu cần.
- Log được ghi vào đường dẫn log của launchd gateway (có thể xem trong Debug Settings).

Lệnh thường dùng:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Thay nhãn bằng `ai.openclaw.<profile>` khi chạy profile có tên.

## Build dev không ký

`scripts/restart-mac.sh --no-sign` dành cho build local nhanh khi không có khóa ký. Để ngăn launchd trỏ vào binary relay không ký, nó:

- Ghi `~/.openclaw/disable-launchagent`.

Chạy `scripts/restart-mac.sh` đã ký sẽ xóa ghi đè này nếu có marker. Để reset thủ công:

```bash
rm ~/.openclaw/disable-launchagent
```

## Chế độ chỉ đính kèm

Để buộc ứng dụng macOS **không cài đặt hoặc quản lý launchd**, khởi chạy với `--attach-only` (hoặc `--no-launchd`). Điều này thiết lập `~/.openclaw/disable-launchagent`, nên ứng dụng chỉ đính kèm vào Gateway đang chạy. Có thể bật/tắt hành vi này trong Debug Settings.

## Chế độ Remote

Chế độ Remote không bao giờ khởi động Gateway local. Ứng dụng sử dụng SSH tunnel đến host remote và kết nối qua tunnel đó.

## Tại sao chọn launchd

- Tự động khởi động khi đăng nhập.
- Khả năng restart/KeepAlive tích hợp sẵn.
- Log và giám sát dự đoán được.

Nếu cần chế độ child-process thực sự, nên được tài liệu hóa như một chế độ dev-only riêng biệt.\n