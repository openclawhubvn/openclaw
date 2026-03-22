---
summary: "Tìm hiểu cách cài đặt và cấu hình OpenClaw trên hệ điều hành Windows để tối ưu hóa hiệu suất và trải nghiệm người dùng."
read_when:
  - Installing OpenClaw on Windows
  - Choosing between native Windows and WSL2
  - Looking for Windows companion app status
title: "Hướng Dẫn Cấu Hình OpenClaw Trên Windows"
---

# Windows

OpenClaw hỗ trợ cả hai phương thức cài đặt trên **Windows gốc** và **WSL2**. WSL2 là lựa chọn ổn định hơn và được khuyến nghị để có trải nghiệm đầy đủ — CLI, Gateway và các công cụ chạy trong môi trường Linux với khả năng tương thích hoàn toàn. Windows gốc hoạt động tốt cho việc sử dụng CLI và Gateway cơ bản, nhưng có một số lưu ý dưới đây.

Các ứng dụng đồng hành trên Windows gốc đang được lên kế hoạch.

## WSL2 (khuyến nghị)

- [Bắt đầu](/start/getting-started) (sử dụng trong WSL)
- [Cài đặt & cập nhật](/install/updating)
- Hướng dẫn chính thức về WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Tình trạng Windows gốc

Các luồng CLI trên Windows gốc đang được cải thiện, nhưng WSL2 vẫn là lựa chọn được khuyến nghị.

Những gì hoạt động tốt trên Windows gốc hiện nay:

- Trình cài đặt trang web qua `install.ps1`
- Sử dụng CLI cục bộ như `openclaw --version`, `openclaw doctor`, và `openclaw plugins list --json`
- Kiểm tra nhanh local-agent/provider nhúng như:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Những lưu ý hiện tại:

- `openclaw onboard --non-interactive` vẫn yêu cầu một gateway cục bộ có thể truy cập trừ khi bạn sử dụng `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` và `openclaw gateway install` thử sử dụng Windows Scheduled Tasks trước
- nếu việc tạo Scheduled Task bị từ chối, OpenClaw sẽ chuyển sang mục đăng nhập trong thư mục Startup của người dùng và khởi động gateway ngay lập tức
- nếu `schtasks` bị treo hoặc ngừng phản hồi, OpenClaw sẽ nhanh chóng hủy bỏ đường dẫn đó và chuyển sang phương án khác thay vì treo mãi mãi
- Scheduled Tasks vẫn được ưu tiên khi có sẵn vì chúng cung cấp trạng thái giám sát tốt hơn

Nếu chỉ muốn sử dụng CLI gốc mà không cần cài đặt dịch vụ gateway, hãy sử dụng một trong các lệnh sau:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Nếu muốn khởi động được quản lý trên Windows gốc:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Nếu việc tạo Scheduled Task bị chặn, chế độ dịch vụ dự phòng vẫn tự động khởi động sau khi đăng nhập thông qua thư mục Startup của người dùng hiện tại.

## Gateway

- [Hướng dẫn sử dụng Gateway](/gateway)
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

Chọn **Dịch vụ Gateway** khi được yêu cầu.

Sửa chữa/chuyển đổi:

```
openclaw doctor
```

## Tự động khởi động Gateway trước khi đăng nhập Windows

Đối với các thiết lập không có màn hình, đảm bảo chuỗi khởi động đầy đủ chạy ngay cả khi không ai đăng nhập vào Windows.

### 1) Giữ cho các dịch vụ người dùng chạy mà không cần đăng nhập

Trong WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Cài đặt dịch vụ người dùng OpenClaw gateway

Trong WSL:

```bash
openclaw gateway install
```

### 3) Tự động khởi động WSL khi Windows khởi động

Trong PowerShell với quyền Admin:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Thay `Ubuntu` bằng tên bản phân phối của bạn từ:

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

WSL có mạng ảo riêng. Nếu một máy khác cần truy cập dịch vụ chạy **trong WSL** (SSH, máy chủ TTS cục bộ, hoặc Gateway), bạn phải chuyển tiếp một cổng Windows đến IP hiện tại của WSL. IP của WSL thay đổi sau khi khởi động lại, vì vậy bạn có thể cần làm mới quy tắc chuyển tiếp.

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

Lưu ý:

- SSH từ máy khác nhắm đến **IP của máy chủ Windows** (ví dụ: `ssh user@windows-host -p 2222`).
- Các node từ xa phải trỏ đến URL Gateway **có thể truy cập** (không phải `127.0.0.1`); sử dụng
  `openclaw status --all` để xác nhận.
- Sử dụng `listenaddress=0.0.0.0` để truy cập LAN; `127.0.0.1` chỉ giữ nó cục bộ.
- Nếu muốn tự động, đăng ký một Scheduled Task để chạy bước làm mới khi đăng nhập.

## Hướng dẫn cài đặt WSL2 từng bước

### 1) Cài đặt WSL2 + Ubuntu

Mở PowerShell (Admin):

```powershell
wsl --install
# Hoặc chọn một bản phân phối cụ thể:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Khởi động lại nếu Windows yêu cầu.

### 2) Kích hoạt systemd (cần thiết cho cài đặt gateway)

Trong terminal WSL của bạn:

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

Mở lại Ubuntu, sau đó xác minh:

```bash
systemctl --user status
```

### 3) Cài đặt OpenClaw (trong WSL)

Thực hiện theo hướng dẫn Bắt đầu trên Linux trong WSL:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # tự động cài đặt các phụ thuộc UI lần đầu chạy
pnpm build
openclaw onboard
```

Hướng dẫn đầy đủ: [Bắt đầu](/start/getting-started)

## Ứng dụng đồng hành trên Windows

Hiện tại chưa có ứng dụng đồng hành trên Windows. Chúng tôi hoan nghênh các đóng góp nếu bạn muốn tham gia phát triển ứng dụng này.
