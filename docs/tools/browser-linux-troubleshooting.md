---
summary: "Khắc phục sự cố khởi động Chrome/Brave/Edge/Chromium CDP cho điều khiển trình duyệt OpenClaw trên Linux"
read_when: "Điều khiển trình duyệt không hoạt động trên Linux, đặc biệt với snap Chromium"
title: "Khắc phục sự cố trình duyệt"
---

# Khắc phục sự cố trình duyệt (Linux)

## Vấn đề: "Không thể khởi động Chrome CDP trên cổng 18800"

Máy chủ điều khiển trình duyệt của OpenClaw không thể khởi động Chrome/Brave/Edge/Chromium với lỗi:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Nguyên nhân gốc rễ

Trên Ubuntu (và nhiều bản phân phối Linux khác), Chromium mặc định được cài đặt dưới dạng **gói snap**. Cơ chế bảo mật AppArmor của snap gây cản trở cho việc OpenClaw khởi chạy và giám sát quá trình trình duyệt.

Lệnh `apt install chromium` cài đặt một gói giả chỉ dẫn đến snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Đây KHÔNG phải là trình duyệt thực sự - chỉ là một lớp bọc.

### Giải pháp 1: Cài đặt Google Chrome (Khuyến nghị)

Cài đặt gói `.deb` chính thức của Google Chrome, không bị sandbox bởi snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # nếu có lỗi phụ thuộc
```

Sau đó cập nhật cấu hình OpenClaw (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Giải pháp 2: Sử dụng Snap Chromium với chế độ chỉ đính kèm

Nếu cần sử dụng snap Chromium, cấu hình OpenClaw để đính kèm vào trình duyệt đã khởi động thủ công:

1. Cập nhật cấu hình:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Khởi động Chromium thủ công:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Tùy chọn tạo dịch vụ người dùng systemd để tự động khởi động Chrome:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Kích hoạt với: `systemctl --user enable --now openclaw-browser.service`

### Kiểm tra trình duyệt hoạt động

Kiểm tra trạng thái:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Kiểm tra duyệt web:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Tham khảo cấu hình

| Tùy chọn                  | Mô tả                                                               | Mặc định                                                    |
| ------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`         | Bật điều khiển trình duyệt                                          | `true`                                                      |
| `browser.executablePath`  | Đường dẫn đến tệp thực thi của trình duyệt dựa trên Chromium        | tự động phát hiện (ưu tiên trình duyệt mặc định khi dựa trên Chromium) |
| `browser.headless`        | Chạy không có giao diện người dùng                                  | `false`                                                     |
| `browser.noSandbox`       | Thêm cờ `--no-sandbox` (cần thiết cho một số cấu hình Linux)        | `false`                                                     |
| `browser.attachOnly`      | Không khởi động trình duyệt, chỉ đính kèm vào trình duyệt hiện có   | `false`                                                     |
| `browser.cdpPort`         | Cổng giao thức Chrome DevTools                                      | `18800`                                                     |

### Vấn đề: "Không tìm thấy tab Chrome cho profile=\"user\""

Bạn đang sử dụng profile `existing-session` / Chrome MCP. OpenClaw có thể thấy Chrome cục bộ, nhưng không có tab nào mở để đính kèm.

Các cách khắc phục:

1. **Sử dụng trình duyệt được quản lý:** `openclaw browser start --browser-profile openclaw`
   (hoặc đặt `browser.defaultProfile: "openclaw"`).
2. **Sử dụng Chrome MCP:** đảm bảo Chrome cục bộ đang chạy với ít nhất một tab mở, sau đó thử lại với `--browser-profile user`.

Lưu ý:

- `user` chỉ dành cho máy chủ cục bộ. Đối với máy chủ Linux, container, hoặc máy chủ từ xa, ưu tiên sử dụng profile CDP.
- Profile `openclaw` cục bộ tự động gán `cdpPort`/`cdpUrl`; chỉ đặt những giá trị này cho CDP từ xa.
