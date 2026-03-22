---
summary: "Gỡ cài đặt OpenClaw hoàn toàn (CLI, service, state, workspace)"
read_when:
  - Muốn xóa OpenClaw khỏi máy
  - Dịch vụ gateway vẫn chạy sau khi gỡ cài đặt
title: "Gỡ cài đặt"
---

# Gỡ cài đặt

Có hai cách:

- **Cách dễ** nếu `openclaw` vẫn còn cài.
- **Gỡ dịch vụ thủ công** nếu CLI đã mất nhưng dịch vụ vẫn chạy.

## Cách dễ (CLI vẫn còn)

Khuyến nghị: dùng uninstaller tích hợp sẵn:

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

2. Gỡ dịch vụ gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Xóa state + config:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Nếu đã đặt `OPENCLAW_CONFIG_PATH` ở vị trí khác ngoài state dir, xóa file đó luôn.

4. Xóa workspace (tùy chọn, xóa file agent):

```bash
rm -rf ~/.openclaw/workspace
```

5. Gỡ cài đặt CLI (chọn cách đã dùng):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Nếu đã cài app macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Lưu ý:

- Nếu dùng profiles (`--profile` / `OPENCLAW_PROFILE`), lặp lại bước 3 cho từng state dir (mặc định là `~/.openclaw-<profile>`).
- Ở chế độ remote, state dir nằm trên **gateway host**, nên chạy bước 1-4 ở đó.

## Gỡ dịch vụ thủ công (CLI không còn)

Dùng cách này nếu dịch vụ gateway vẫn chạy nhưng `openclaw` đã mất.

### macOS (launchd)

Label mặc định là `ai.openclaw.gateway` (hoặc `ai.openclaw.<profile>`; có thể còn `com.openclaw.*` cũ):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Nếu dùng profile, thay label và tên plist bằng `ai.openclaw.<profile>`. Xóa các plist `com.openclaw.*` cũ nếu có.

### Linux (systemd user unit)

Tên unit mặc định là `openclaw-gateway.service` (hoặc `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Tên task mặc định là `OpenClaw Gateway` (hoặc `OpenClaw Gateway (<profile>)`).
Script task nằm trong state dir.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Nếu dùng profile, xóa task tương ứng và `~\.openclaw-<profile>\gateway.cmd`.

## Cài đặt bình thường vs từ source

### Cài đặt bình thường (install.sh / npm / pnpm / bun)

Nếu dùng `https://openclaw.ai/install.sh` hoặc `install.ps1`, CLI được cài với `npm install -g openclaw@latest`.
Gỡ bằng `npm rm -g openclaw` (hoặc `pnpm remove -g` / `bun remove -g` nếu đã cài theo cách đó).

### Từ source (git clone)

Nếu chạy từ repo checkout (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Gỡ dịch vụ gateway **trước khi** xóa repo (dùng cách dễ ở trên hoặc gỡ dịch vụ thủ công).
2. Xóa thư mục repo.
3. Xóa state + workspace như trên.\n