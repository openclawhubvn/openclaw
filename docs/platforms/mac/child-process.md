---
summary: "Khám phá cách cấu hình và quản lý vòng đời Gateway trên macOS với launchd để tối ưu hiệu suất hệ thống."
read_when:
  - Tích hợp ứng dụng mac với vòng đời gateway
title: "Hướng Dẫn Cấu Hình Gateway Trên macOS"
---

# Vòng đời Gateway trên macOS

Ứng dụng macOS **quản lý Gateway qua launchd** theo mặc định và không khởi chạy Gateway như một tiến trình con. Ứng dụng sẽ cố gắng kết nối với Gateway đang chạy trên cổng đã cấu hình; nếu không có Gateway nào khả dụng, nó sẽ kích hoạt dịch vụ launchd thông qua CLI `openclaw` bên ngoài (không có runtime nhúng). Điều này giúp tự động khởi động khi đăng nhập và khởi động lại khi gặp sự cố.

Chế độ tiến trình con (Gateway được ứng dụng khởi chạy trực tiếp) **không được sử dụng** hiện nay. Nếu cần kết nối chặt chẽ hơn với giao diện người dùng, hãy chạy Gateway thủ công trong terminal.

## Hành vi mặc định (launchd)

- Ứng dụng cài đặt một LaunchAgent cho từng người dùng với nhãn `ai.openclaw.gateway` (hoặc `ai.openclaw.<profile>` khi sử dụng `--profile`/`OPENCLAW_PROFILE`; hỗ trợ `com.openclaw.*` cũ).
- Khi chế độ Local được kích hoạt, ứng dụng đảm bảo LaunchAgent được tải và khởi động Gateway nếu cần.
- Nhật ký được ghi vào đường dẫn nhật ký gateway của launchd (có thể xem trong Cài đặt Debug).

Các lệnh thông dụng:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Thay nhãn bằng `ai.openclaw.<profile>` khi chạy một profile có tên.

## Bản dựng dev không ký

`scripts/restart-mac.sh --no-sign` dành cho các bản dựng nhanh tại chỗ khi không có khóa ký. Để ngăn launchd trỏ đến một relay binary không ký, nó:

- Ghi vào `~/.openclaw/disable-launchagent`.

Các lần chạy có ký của `scripts/restart-mac.sh` sẽ xóa bỏ ghi đè này nếu có dấu hiệu. Để đặt lại thủ công:

```bash
rm ~/.openclaw/disable-launchagent
```

## Chế độ chỉ đính kèm

Để buộc ứng dụng macOS **không bao giờ cài đặt hoặc quản lý launchd**, khởi chạy với `--attach-only` (hoặc `--no-launchd`). Điều này thiết lập `~/.openclaw/disable-launchagent`, do đó ứng dụng chỉ kết nối với Gateway đang chạy. Bạn có thể chuyển đổi hành vi này trong Cài đặt Debug.

## Chế độ từ xa

Chế độ từ xa không bao giờ khởi động Gateway cục bộ. Ứng dụng sử dụng một đường hầm SSH đến máy chủ từ xa và kết nối qua đường hầm đó.

## Tại sao chúng tôi ưa chuộng launchd

- Tự động khởi động khi đăng nhập.
- Khả năng khởi động lại/KeepAlive tích hợp sẵn.
- Nhật ký và giám sát dễ dự đoán.

Nếu chế độ tiến trình con thực sự cần thiết trở lại, nó nên được tài liệu hóa như một chế độ chỉ dành cho phát triển riêng biệt và rõ ràng.
