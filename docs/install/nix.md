---
summary: "Tìm hiểu cách cài đặt OpenClaw bằng Nix, giúp bạn dễ dàng quản lý và triển khai hệ thống một cách hiệu quả."
read_when:
  - Bạn muốn cài đặt có thể tái tạo và quay lại phiên bản trước
  - Bạn đã sử dụng Nix/NixOS/Home Manager
  - Bạn muốn mọi thứ được quản lý và cố định một cách khai báo
title: "Hướng Dẫn Cài Đặt OpenClaw Với Nix"
---

# Cài đặt Nix

Cài đặt OpenClaw một cách khai báo với **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — một module Home Manager đầy đủ tính năng.

<Info>
Kho [nix-openclaw](https://github.com/openclaw/nix-openclaw) là nguồn thông tin chính xác cho việc cài đặt Nix. Trang này chỉ là một cái nhìn tổng quan nhanh.
</Info>

## Những gì bạn nhận được

- Gateway + ứng dụng macOS + công cụ (whisper, spotify, cameras) — tất cả đều được cố định
- Dịch vụ Launchd tồn tại qua các lần khởi động lại
- Hệ thống plugin với cấu hình khai báo
- Khả năng quay lại ngay lập tức: `home-manager switch --rollback`

## Bắt đầu nhanh

<Steps>
  <Step title="Cài đặt Determinate Nix">
    Nếu Nix chưa được cài đặt, hãy làm theo hướng dẫn của [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Tạo một flake cục bộ">
    Sử dụng mẫu agent-first từ kho nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Sao chép templates/agent-first/flake.nix từ kho nix-openclaw
    ```
  </Step>
  <Step title="Cấu hình secrets">
    Thiết lập token bot nhắn tin và khóa API của nhà cung cấp mô hình. Các file đơn giản tại `~/.secrets/` là đủ.
  </Step>
  <Step title="Điền vào các chỗ trống trong mẫu và chuyển đổi">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Xác minh">
    Xác nhận dịch vụ launchd đang chạy và bot của bạn phản hồi tin nhắn.
  </Step>
</Steps>

Xem [README của nix-openclaw](https://github.com/openclaw/nix-openclaw) để biết đầy đủ các tùy chọn module và ví dụ.

## Hành vi thời gian chạy của Nix Mode

Khi `OPENCLAW_NIX_MODE=1` được thiết lập (tự động với nix-openclaw), OpenClaw sẽ vào chế độ xác định, vô hiệu hóa các luồng cài đặt tự động.

Bạn cũng có thể thiết lập thủ công:

```bash
export OPENCLAW_NIX_MODE=1
```

Trên macOS, ứng dụng GUI không tự động thừa hưởng các biến môi trường shell. Thay vào đó, kích hoạt chế độ Nix qua defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Những thay đổi trong chế độ Nix

- Các luồng cài đặt tự động và tự biến đổi bị vô hiệu hóa
- Các phụ thuộc thiếu sẽ hiển thị thông báo khắc phục cụ thể cho Nix
- Giao diện hiển thị một biểu ngữ chế độ Nix chỉ đọc

### Đường dẫn cấu hình và trạng thái

OpenClaw đọc cấu hình JSON5 từ `OPENCLAW_CONFIG_PATH` và lưu trữ dữ liệu có thể thay đổi trong `OPENCLAW_STATE_DIR`. Khi chạy dưới Nix, hãy thiết lập rõ ràng các đường dẫn này đến các vị trí được Nix quản lý để trạng thái và cấu hình thời gian chạy không nằm trong kho lưu trữ không thể thay đổi.

| Biến                   | Mặc định                                 |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

## Liên quan

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) — hướng dẫn thiết lập đầy đủ
- [Wizard](/start/wizard) — thiết lập CLI không dùng Nix
- [Docker](/install/docker) — thiết lập dạng container
