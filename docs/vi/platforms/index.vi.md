---
summary: "Tổng quan hỗ trợ nền tảng (Gateway + ứng dụng đi kèm)"
read_when:
  - Tìm kiếm hỗ trợ hệ điều hành hoặc đường dẫn cài đặt
  - Quyết định nơi chạy Gateway
title: "Nền tảng"
---

# Nền tảng

OpenClaw core viết bằng TypeScript. **Node là runtime khuyến nghị**. Không khuyến nghị dùng Bun cho Gateway (lỗi WhatsApp/Telegram).

Ứng dụng đi kèm có sẵn cho macOS (ứng dụng menu bar) và mobile nodes (iOS/Android). Ứng dụng đi kèm cho Windows và Linux đang được phát triển, nhưng Gateway đã hỗ trợ đầy đủ. Ứng dụng đi kèm native cho Windows cũng đang được lên kế hoạch; khuyến nghị dùng Gateway qua WSL2.

## Chọn hệ điều hành

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS & hosting

- VPS hub: [VPS hosting](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner (Docker): [Hetzner](/install/hetzner)
- GCP (Compute Engine): [GCP](/install/gcp)
- Azure (Linux VM): [Azure](/install/azure)
- exe.dev (VM + HTTPS proxy): [exe.dev](/install/exe-dev)

## Liên kết thường dùng

- Hướng dẫn cài đặt: [Bắt đầu](/start/getting-started)
- Runbook Gateway: [Gateway](/gateway)
- Cấu hình Gateway: [Cấu hình](/gateway/configuration)
- Trạng thái dịch vụ: `openclaw gateway status`

## Cài đặt dịch vụ Gateway (CLI)

Dùng một trong các cách sau (đều được hỗ trợ):

- Wizard (khuyến nghị): `openclaw onboard --install-daemon`
- Trực tiếp: `openclaw gateway install`
- Cấu hình luồng: `openclaw configure` → chọn **Gateway service**
- Sửa chữa/di chuyển: `openclaw doctor` (cung cấp cài đặt hoặc sửa dịch vụ)

Dịch vụ mục tiêu phụ thuộc vào hệ điều hành:

- macOS: LaunchAgent (`ai.openclaw.gateway` hoặc `ai.openclaw.<profile>`; legacy `com.openclaw.*`)
- Linux/WSL2: systemd user service (`openclaw-gateway[-<profile>].service`)\n