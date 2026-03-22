# Khắc phục sự cố trình duyệt (Linux)

## Vấn đề: "Failed to start Chrome CDP on port 18800"

Server điều khiển trình duyệt của OpenClaw không khởi động được Chrome/Brave/Edge/Chromium với lỗi:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Nguyên nhân

Trên Ubuntu (và nhiều distro Linux khác), Chromium mặc định được cài qua **snap package**. AppArmor của snap gây cản trở khi OpenClaw khởi chạy và giám sát tiến trình trình duyệt.

Lệnh `apt install chromium` chỉ cài một gói stub chuyển hướng đến snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Đây không phải là trình duyệt thực sự - chỉ là một wrapper.

### Giải pháp 1: Cài Google Chrome (Khuyến nghị)

Cài gói `.deb` chính thức của Google Chrome, không bị sandbox bởi snap:

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

### Giải pháp 2: Dùng Snap Chromium với chế độ Attach-Only

Nếu cần dùng snap Chromium, cấu hình OpenClaw để gắn vào trình duyệt đã khởi động thủ công:

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

3. Tùy chọn tạo service user systemd để tự động khởi động Chrome:

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
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Bật điều khiển trình duyệt                                           | `true`                                                      |
| `browser.executablePath` | Đường dẫn đến file thực thi của trình duyệt Chromium-based           | tự động phát hiện (ưu tiên trình duyệt mặc định khi Chromium-based) |
| `browser.headless`       | Chạy không giao diện GUI                                             | `false`                                                     |
| `browser.noSandbox`      | Thêm cờ `--no-sandbox` (cần cho một số cấu hình Linux)               | `false`                                                     |
| `browser.attachOnly`     | Không khởi động trình duyệt, chỉ gắn vào trình duyệt có sẵn          | `false`                                                     |
| `browser.cdpPort`        | Cổng Chrome DevTools Protocol                                        | `18800`                                                     |

### Vấn đề: "No Chrome tabs found for profile=\"user\""

Đang dùng profile `existing-session` / Chrome MCP. OpenClaw thấy Chrome local, nhưng không có tab nào mở để gắn vào.

Cách khắc phục:

1. **Dùng trình duyệt quản lý:** `openclaw browser start --browser-profile openclaw`
   (hoặc đặt `browser.defaultProfile: "openclaw"`).
2. **Dùng Chrome MCP:** đảm bảo Chrome local đang chạy với ít nhất một tab mở, sau đó thử lại với `--browser-profile user`.

Lưu ý:

- `user` chỉ dùng cho host local. Với server Linux, container, hoặc host remote, ưu tiên dùng profile CDP.
- Profile `openclaw` local tự động gán `cdpPort`/`cdpUrl`; chỉ cần đặt cho CDP remote.\n