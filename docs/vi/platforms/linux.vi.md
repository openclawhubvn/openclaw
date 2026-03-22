---
summary: "Hỗ trợ Linux + trạng thái ứng dụng đi kèm"
read_when:
  - Tìm trạng thái ứng dụng đi kèm Linux
  - Lên kế hoạch hỗ trợ nền tảng hoặc đóng góp
title: "Ứng dụng Linux"
---

# Ứng dụng Linux

Gateway hỗ trợ đầy đủ trên Linux. **Node là runtime được khuyến nghị**. Không khuyến nghị dùng Bun cho Gateway (lỗi WhatsApp/Telegram).

Ứng dụng đi kèm Linux bản native đang được lên kế hoạch. Hoan nghênh đóng góp nếu muốn tham gia phát triển.

## Lộ trình nhanh cho người mới (VPS)

1. Cài Node 24 (khuyến nghị; Node 22 LTS, hiện tại `22.16+`, vẫn tương thích)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Từ laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Mở `http://127.0.0.1:18789/` và dán token

Hướng dẫn đầy đủ cho server Linux: [Linux Server](/vps). Ví dụ VPS từng bước: [exe.dev](/install/exe-dev)

## Cài đặt

- [Bắt đầu](/start/getting-started)
- [Cài đặt & cập nhật](/install/updating)
- Luồng tùy chọn: [Bun (thử nghiệm)](/install/bun), [Nix](/install/nix), [Docker](/install/docker)

## Gateway

- [Gateway runbook](/gateway)
- [Cấu hình](/gateway/configuration)

## Cài đặt dịch vụ Gateway (CLI)

Dùng một trong các lệnh sau:

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

Sửa chữa/chuyển đổi:

```
openclaw doctor
```

## Kiểm soát hệ thống (systemd user unit)

OpenClaw mặc định cài đặt dịch vụ **user** systemd. Dùng dịch vụ **system** cho server chia sẻ hoặc luôn bật. Ví dụ đầy đủ và hướng dẫn có trong [Gateway runbook](/gateway).

Thiết lập tối thiểu:

Tạo `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

Kích hoạt:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```\n