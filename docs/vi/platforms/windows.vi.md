# Windows

OpenClaw hỗ trợ cả **native Windows** và **WSL2**. WSL2 ổn định hơn và được khuyến nghị để có trải nghiệm đầy đủ — CLI, Gateway và các công cụ chạy trong Linux với khả năng tương thích hoàn toàn. Native Windows hoạt động tốt cho CLI và Gateway cơ bản, nhưng có một số lưu ý dưới đây.

Ứng dụng companion cho native Windows đang được lên kế hoạch.

## WSL2 (khuyến nghị)

- [Bắt đầu](/start/getting-started) (sử dụng trong WSL)
- [Cài đặt & cập nhật](/install/updating)
- Hướng dẫn WSL2 chính thức (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Tình trạng Native Windows

CLI trên native Windows đang được cải thiện, nhưng WSL2 vẫn là lựa chọn khuyến nghị.

Những gì hoạt động tốt trên native Windows hiện nay:

- Cài đặt qua website bằng `install.ps1`
- Sử dụng CLI local như `openclaw --version`, `openclaw doctor`, và `openclaw plugins list --json`
- Chạy thử local-agent/provider như:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Những lưu ý hiện tại:

- `openclaw onboard --non-interactive` vẫn yêu cầu một local gateway có thể truy cập trừ khi dùng `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` và `openclaw gateway install` thử dùng Windows Scheduled Tasks trước
- Nếu tạo Scheduled Task bị từ chối, OpenClaw sẽ chuyển sang mục khởi động trong thư mục Startup của người dùng và khởi động gateway ngay lập tức
- Nếu `schtasks` bị treo hoặc ngừng phản hồi, OpenClaw sẽ nhanh chóng hủy bỏ và chuyển hướng thay vì treo mãi
- Scheduled Tasks vẫn được ưu tiên khi có thể vì cung cấp trạng thái giám sát tốt hơn

Nếu chỉ cần CLI native mà không cần cài đặt dịch vụ gateway, dùng một trong các lệnh sau:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Nếu muốn quản lý khởi động trên native Windows:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Nếu tạo Scheduled Task bị chặn, chế độ dịch vụ dự phòng vẫn tự động khởi động sau khi đăng nhập qua thư mục Startup của người dùng hiện tại.

## Gateway

- [Gateway runbook](/gateway)
- [Cấu hình](/gateway/configuration)

## Cài đặt dịch vụ Gateway (CLI)

Trong WSL2:

```
openclaw onboard --install-daemon
```

Hoặc:

```
openclaw gateway install
```

Hoặc:

```
openclaw configure
```

Chọn **Gateway service** khi được hỏi.

Sửa chữa/di chuyển:

```
openclaw doctor
```

## Tự động khởi động Gateway trước khi đăng nhập Windows

Đối với các thiết lập không màn hình, đảm bảo chuỗi khởi động đầy đủ chạy ngay cả khi không ai đăng nhập vào Windows.

### 1) Giữ dịch vụ người dùng chạy mà không cần đăng nhập

Trong WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Cài đặt dịch vụ người dùng OpenClaw gateway

Trong WSL:

```bash
openclaw gateway install
```

### 3) Tự động khởi động WSL khi Windows boot

Trong PowerShell với quyền Admin:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Thay `Ubuntu` bằng tên distro của bạn từ:

```powershell
wsl --list --verbose
```

### Xác minh chuỗi khởi động

Sau khi khởi động lại (trước khi đăng nhập Windows), kiểm tra từ WSL:

```bash
systemctl --user is-enabled openclaw-gateway
systemctl --user status openclaw-gateway --no-pager
```

## Nâng cao: mở dịch vụ WSL qua LAN (portproxy)

WSL có mạng ảo riêng. Nếu máy khác cần truy cập dịch vụ chạy **trong WSL** (SSH, server TTS local, hoặc Gateway), cần chuyển tiếp một cổng Windows tới IP WSL hiện tại. IP WSL thay đổi sau khi khởi động lại, nên có thể cần làm mới quy tắc chuyển tiếp.

Ví dụ (PowerShell **với quyền Admin**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Cho phép cổng qua Windows Firewall (một lần):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Làm mới portproxy sau khi WSL khởi động lại:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Ghi chú:

- SSH từ máy khác nhắm tới **IP host Windows** (ví dụ: `ssh user@windows-host -p 2222`).
- Các node từ xa phải trỏ tới URL Gateway **có thể truy cập** (không phải `127.0.0.1`); dùng
  `openclaw status --all` để xác nhận.
- Dùng `listenaddress=0.0.0.0` để truy cập LAN; `127.0.0.1` chỉ giữ nội bộ.
- Nếu muốn tự động, đăng ký một Scheduled Task để chạy bước làm mới khi đăng nhập.

## Hướng dẫn từng bước cài đặt WSL2

### 1) Cài đặt WSL2 + Ubuntu

Mở PowerShell (Admin):

```powershell
wsl --install
# Hoặc chọn distro cụ thể:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Khởi động lại nếu Windows yêu cầu.

### 2) Bật systemd (cần thiết cho cài đặt gateway)

Trong terminal WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Sau đó từ PowerShell:

```powershell
wsl --shutdown
```

Mở lại Ubuntu, rồi kiểm tra:

```bash
systemctl --user status
```

### 3) Cài đặt OpenClaw (trong WSL)

Làm theo hướng dẫn Bắt đầu trên Linux trong WSL:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # tự động cài đặt UI deps lần đầu chạy
pnpm build
openclaw onboard
```

Hướng dẫn đầy đủ: [Bắt đầu](/start/getting-started)

## Ứng dụng companion cho Windows

Hiện chưa có ứng dụng companion cho Windows. Đóng góp được chào đón nếu bạn muốn tham gia phát triển.\n