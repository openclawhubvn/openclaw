---
summary: "Tìm hiểu cách gỡ cài đặt OpenClaw hoàn toàn, bao gồm CLI, dịch vụ, trạng thái và workspace. Đảm bảo hệ thống sạch sẽ."
read_when:
  - Bạn muốn xóa OpenClaw khỏi máy
  - Dịch vụ gateway vẫn chạy sau khi gỡ cài đặt
title: "Hướng Dẫn Gỡ Cài Đặt OpenClaw"
---

# Gỡ cài đặt

Có hai cách:

- **Cách dễ** nếu `openclaw` vẫn còn cài đặt.
- **Gỡ dịch vụ thủ công** nếu CLI đã bị xóa nhưng dịch vụ vẫn đang chạy.

## Cách dễ (CLI vẫn còn cài đặt)

Khuyến nghị: sử dụng công cụ gỡ cài đặt tích hợp sẵn:

```bash
openclaw uninstall
```

Không tương tác (tự động hóa / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Các bước thủ công (kết quả tương tự):

1. Dừng dịch vụ gateway:

```bash
openclaw gateway stop
```

2. Gỡ cài đặt dịch vụ gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Xóa trạng thái + cấu hình:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Nếu bạn đã đặt `OPENCLAW_CONFIG_PATH` ở một vị trí tùy chỉnh ngoài thư mục trạng thái, hãy xóa tệp đó.

4. Xóa workspace của bạn (tùy chọn, xóa các tệp agent):

```bash
rm -rf ~/.openclaw/workspace
```

5. Gỡ cài đặt CLI (chọn cách bạn đã sử dụng):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Nếu bạn đã cài đặt ứng dụng macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Lưu ý:

- Nếu bạn sử dụng profiles (`--profile` / `OPENCLAW_PROFILE`), lặp lại bước 3 cho mỗi thư mục trạng thái (mặc định là `~/.openclaw-<profile>`).
- Ở chế độ remote, thư mục trạng thái nằm trên **gateway host**, vì vậy hãy thực hiện các bước 1-4 ở đó.

## Gỡ dịch vụ thủ công (CLI không còn cài đặt)

Sử dụng cách này nếu dịch vụ gateway vẫn chạy nhưng `openclaw` đã bị xóa.

### macOS (launchd)

Nhãn mặc định là `ai.openclaw.gateway` (hoặc `ai.openclaw.<profile>`; có thể vẫn tồn tại `com.openclaw.*` cũ):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Nếu bạn sử dụng profile, thay thế nhãn và tên plist bằng `ai.openclaw.<profile>`. Xóa bất kỳ plist `com.openclaw.*` cũ nếu có.

### Linux (systemd user unit)

Tên đơn vị mặc định là `openclaw-gateway.service` (hoặc `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Tên tác vụ mặc định là `OpenClaw Gateway` (hoặc `OpenClaw Gateway (<profile>)`).
Tập lệnh tác vụ nằm trong thư mục trạng thái của bạn.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Nếu bạn sử dụng profile, xóa tên tác vụ tương ứng và `~\.openclaw-<profile>\gateway.cmd`.

## Cài đặt thông thường vs kiểm tra từ nguồn

### Cài đặt thông thường (install.sh / npm / pnpm / bun)

Nếu bạn đã sử dụng `https://openclaw.ai/install.sh` hoặc `install.ps1`, CLI đã được cài đặt với `npm install -g openclaw@latest`.
Gỡ nó bằng `npm rm -g openclaw` (hoặc `pnpm remove -g` / `bun remove -g` nếu bạn đã cài đặt theo cách đó).

### Kiểm tra từ nguồn (git clone)

Nếu bạn chạy từ repo đã clone (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Gỡ cài đặt dịch vụ gateway **trước khi** xóa repo (sử dụng cách dễ ở trên hoặc gỡ dịch vụ thủ công).
2. Xóa thư mục repo.
3. Xóa trạng thái + workspace như đã chỉ dẫn ở trên.
