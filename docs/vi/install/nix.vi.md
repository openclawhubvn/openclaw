---
summary: "Cài đặt OpenClaw theo cách khai báo với Nix"
read_when:
  - Muốn cài đặt có thể tái tạo, rollback dễ dàng
  - Đã dùng Nix/NixOS/Home Manager
  - Muốn quản lý mọi thứ theo cách khai báo
title: "Nix"
---

# Cài đặt Nix

Cài đặt OpenClaw theo cách khai báo với **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** -- một module Home Manager đầy đủ tính năng.

<Info>
Repo [nix-openclaw](https://github.com/openclaw/nix-openclaw) là nguồn thông tin chính xác nhất cho cài đặt Nix. Trang này chỉ là tóm tắt nhanh.
</Info>

## Bạn sẽ có gì

- Gateway + app macOS + công cụ (whisper, spotify, cameras) -- tất cả đều được cố định
- Dịch vụ Launchd sống sót qua các lần khởi động lại
- Hệ thống Plugin với cấu hình khai báo
- Rollback ngay lập tức: `home-manager switch --rollback`

## Bắt đầu nhanh

<Steps>
  <Step title="Cài đặt Determinate Nix">
    Nếu chưa cài Nix, làm theo hướng dẫn của [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Tạo flake local">
    Sử dụng template agent-first từ repo nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Sao chép templates/agent-first/flake.nix từ repo nix-openclaw
    ```
  </Step>
  <Step title="Cấu hình secrets">
    Thiết lập token bot nhắn tin và API key của nhà cung cấp model. File plain tại `~/.secrets/` là ổn.
  </Step>
  <Step title="Điền vào các chỗ trống trong template và chuyển đổi">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Xác minh">
    Xác nhận dịch vụ launchd đang chạy và bot phản hồi tin nhắn.
  </Step>
</Steps>

Xem [README nix-openclaw](https://github.com/openclaw/nix-openclaw) để biết đầy đủ tùy chọn module và ví dụ.

## Hành vi runtime của Nix Mode

Khi `OPENCLAW_NIX_MODE=1` được thiết lập (tự động với nix-openclaw), OpenClaw vào chế độ xác định, vô hiệu hóa các luồng cài đặt tự động.

Cũng có thể thiết lập thủ công:

```bash
export OPENCLAW_NIX_MODE=1
```

Trên macOS, app GUI không tự động nhận biến môi trường shell. Kích hoạt Nix mode qua defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Thay đổi trong Nix mode

- Vô hiệu hóa luồng cài đặt tự động và tự biến đổi
- Thiếu dependencies sẽ hiện thông báo khắc phục riêng cho Nix
- UI hiện banner Nix mode chỉ đọc

### Đường dẫn config và state

OpenClaw đọc config JSON5 từ `OPENCLAW_CONFIG_PATH` và lưu dữ liệu có thể thay đổi trong `OPENCLAW_STATE_DIR`. Khi chạy dưới Nix, thiết lập rõ ràng các đường dẫn này đến vị trí do Nix quản lý để trạng thái runtime và config không nằm trong store không thể thay đổi.

| Biến                   | Mặc định                                 |
| ---------------------- | ---------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()`  |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                            |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`      |

## Liên quan

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- hướng dẫn cài đặt đầy đủ
- [Wizard](/start/wizard) -- cài đặt CLI không dùng Nix
- [Docker](/install/docker) -- cài đặt containerized\n