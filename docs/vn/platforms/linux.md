---
summary: "Hỗ trợ Linux + trạng thái ứng dụng đi kèm"
read_when:
  - Tìm kiếm trạng thái ứng dụng đi kèm trên Linux
  - Lên kế hoạch hỗ trợ nền tảng hoặc đóng góp
title: "Ứng dụng Linux"
---

# Ứng dụng Linux

Gateway được hỗ trợ hoàn toàn trên Linux. **Node là runtime được khuyến nghị**.
Bun không được khuyến nghị cho Gateway (lỗi WhatsApp/Telegram).

Các ứng dụng đi kèm gốc trên Linux đang được lên kế hoạch. Chúng tôi hoan nghênh các đóng góp nếu bạn muốn tham gia phát triển.

## Lộ trình nhanh cho người mới (VPS)

1. Cài đặt Node 24 (khuyến nghị; Node 22 LTS, hiện tại `22.16+`, vẫn hoạt động để tương thích)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Từ máy tính xách tay của bạn: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Mở `http://127.0.0.1:18789/` và dán token của bạn

Hướng dẫn đầy đủ cho máy chủ Linux: [Máy chủ Linux](/vps). Ví dụ từng bước với VPS: [exe.dev](/install/exe-dev)

## Cài đặt

- [Bắt đầu](/start/getting-started)
- [Cài đặt & cập nhật](/install/updating)
- Các luồng tùy chọn: [Bun (thử nghiệm)](/install/bun), [Nix](/install/nix), [Docker](/install/docker)

## Gateway

- [Sổ tay Gateway](/gateway)
- [Cấu hình](/gateway/configuration)

## Cài đặt dịch vụ Gateway (CLI)

Sử dụng một trong các lệnh sau:

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

Chọn **dịch vụ Gateway** khi được yêu cầu.

Sửa chữa/di chuyển:

```
openclaw doctor
```

## Kiểm soát hệ thống (đơn vị người dùng systemd)

OpenClaw cài đặt một dịch vụ **người dùng** systemd theo mặc định. Sử dụng dịch vụ **hệ thống** cho các máy chủ chia sẻ hoặc luôn bật. Ví dụ đầy đủ về đơn vị và hướng dẫn có trong [sổ tay Gateway](/gateway).

Cài đặt tối thiểu:

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

Kích hoạt nó:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```
