---
summary: "Khám phá cách cấu hình gateway, ghép nối và bảo mật mạng hiệu quả. Tối ưu hóa hệ thống mạng của bạn ngay hôm nay."
read_when:
  - Cần tổng quan về kiến trúc mạng và bảo mật
  - Đang gỡ lỗi truy cập cục bộ so với tailnet hoặc ghép nối
  - Muốn danh sách tài liệu mạng chuẩn
title: "Hướng Dẫn Cấu Hình Mạng và Bảo Mật"
---

# Trung tâm mạng

Trung tâm này liên kết các tài liệu cốt lõi về cách OpenClaw kết nối, ghép nối và bảo mật thiết bị qua localhost, LAN và tailnet.

## Mô hình cốt lõi

- [Kiến trúc Gateway](/concepts/architecture)
- [Giao thức Gateway](/gateway/protocol)
- [Sổ tay vận hành Gateway](/gateway)
- [Bề mặt web + chế độ bind](/web)

## Ghép nối + danh tính

- [Tổng quan về ghép nối (DM + nodes)](/channels/pairing)
- [Ghép nối node thuộc sở hữu Gateway](/gateway/pairing)
- [CLI thiết bị (ghép nối + xoay vòng token)](/cli/devices)
- [CLI ghép nối (phê duyệt DM)](/cli/pairing)

Tin cậy cục bộ:

- Kết nối cục bộ (loopback hoặc địa chỉ tailnet của chính máy chủ gateway) có thể được tự động phê duyệt để ghép nối, giúp trải nghiệm người dùng trên cùng máy chủ mượt mà.
- Các client tailnet/LAN không cục bộ vẫn cần phê duyệt ghép nối rõ ràng.

## Khám phá + truyền tải

- [Khám phá & truyền tải](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [Truy cập từ xa (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## Nodes + truyền tải

- [Tổng quan về Nodes](/nodes)
- [Giao thức Bridge (nodes cũ)](/gateway/bridge-protocol)
- [Sổ tay vận hành Node: iOS](/platforms/ios)
- [Sổ tay vận hành Node: Android](/platforms/android)

## Bảo mật

- [Tổng quan về bảo mật](/gateway/security)
- [Tham khảo cấu hình Gateway](/gateway/configuration)
- [Khắc phục sự cố](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
