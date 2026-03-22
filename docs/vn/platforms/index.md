---
summary: "Tổng quan hỗ trợ nền tảng (Gateway + ứng dụng đi kèm)"
read_when:
  - Tìm kiếm hỗ trợ hệ điều hành hoặc đường dẫn cài đặt
  - Quyết định nơi chạy Gateway
title: "Nền tảng"
---

# Nền tảng

OpenClaw core được viết bằng TypeScript. **Node là runtime được khuyến nghị**.
Bun không được khuyến nghị cho Gateway (lỗi WhatsApp/Telegram).

Có các ứng dụng đi kèm cho macOS (ứng dụng thanh menu) và các node di động (iOS/Android). Ứng dụng đi kèm cho Windows và Linux đang được lên kế hoạch, nhưng Gateway hiện đã được hỗ trợ đầy đủ. Các ứng dụng đi kèm gốc cho Windows cũng đang được lên kế hoạch; khuyến nghị sử dụng Gateway qua WSL2.

## Chọn hệ điều hành của bạn

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS & hosting

- Trung tâm VPS: [VPS hosting](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner (Docker): [Hetzner](/install/hetzner)
- GCP (Compute Engine): [GCP](/install/gcp)
- Azure (Linux VM): [Azure](/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/install/exe-dev)

## Liên kết thông dụng

- Hướng dẫn cài đặt: [Bắt đầu](/start/getting-started)
- Sổ tay Gateway: [Gateway](/gateway)
- Cấu hình Gateway: [Cấu hình](/gateway/configuration)
- Trạng thái dịch vụ: `openclaw gateway status`

## Cài đặt dịch vụ Gateway (CLI)

Sử dụng một trong các cách sau (tất cả đều được hỗ trợ):

- Trình hướng dẫn (khuyến nghị): `openclaw onboard --install-daemon`
- Trực tiếp: `openclaw gateway install`
- Cấu hình luồng: `openclaw configure` → chọn **Dịch vụ Gateway**
- Sửa chữa/di chuyển: `openclaw doctor` (đề xuất cài đặt hoặc sửa dịch vụ)

Mục tiêu dịch vụ phụ thuộc vào hệ điều hành:

- macOS: LaunchAgent (`ai.openclaw.gateway` hoặc `ai.openclaw.<profile>`; legacy `com.openclaw.*`)
- Linux/WSL2: dịch vụ người dùng systemd (`openclaw-gateway[-<profile>].service`)
