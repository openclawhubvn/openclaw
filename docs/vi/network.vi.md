# Network hub

Hub này liên kết tài liệu cốt lõi về cách OpenClaw kết nối, ghép cặp và bảo mật thiết bị qua localhost, LAN và tailnet.

## Mô hình cốt lõi

- [Kiến trúc Gateway](/concepts/architecture)
- [Giao thức Gateway](/gateway/protocol)
- [Runbook Gateway](/gateway)
- [Web surfaces + chế độ bind](/web)

## Ghép cặp + danh tính

- [Tổng quan ghép cặp (DM + nodes)](/channels/pairing)
- [Ghép cặp node thuộc sở hữu Gateway](/gateway/pairing)
- [CLI Devices (ghép cặp + xoay vòng token)](/cli/devices)
- [CLI Ghép cặp (phê duyệt DM)](/cli/pairing)

Tin cậy cục bộ:

- Kết nối cục bộ (loopback hoặc địa chỉ tailnet của host gateway) có thể tự động phê duyệt để ghép cặp, giữ UX cùng host mượt mà.
- Khách hàng tailnet/LAN không cục bộ vẫn cần phê duyệt ghép cặp rõ ràng.

## Khám phá + vận chuyển

- [Khám phá & vận chuyển](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [Truy cập từ xa (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## Nodes + vận chuyển

- [Tổng quan Nodes](/nodes)
- [Giao thức Bridge (nodes cũ)](/gateway/bridge-protocol)
- [Runbook Node: iOS](/platforms/ios)
- [Runbook Node: Android](/platforms/android)

## Bảo mật

- [Tổng quan bảo mật](/gateway/security)
- [Tham chiếu cấu hình Gateway](/gateway/configuration)
- [Khắc phục sự cố](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)\n