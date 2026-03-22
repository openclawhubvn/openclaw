---
summary: "Tìm hiểu cách chạy nhiều Gateway OpenClaw trên một máy chủ, tối ưu hóa cách ly, cổng và cấu hình hiệu quả."
read_when:
  - Chạy nhiều hơn một Gateway trên cùng một máy
  - Cần cấu hình/trạng thái/cổng riêng biệt cho từng Gateway
title: "Hướng Dẫn Cấu Hình Nhiều Gateway OpenClaw"
---

# Nhiều Gateway (trên cùng một máy chủ)

Hầu hết các thiết lập nên sử dụng một Gateway vì một Gateway có thể xử lý nhiều kết nối tin nhắn và agent. Nếu cần cách ly mạnh hơn hoặc dự phòng (ví dụ, một bot cứu hộ), hãy chạy các Gateway riêng biệt với cấu hình và cổng riêng.

## Danh sách kiểm tra cách ly (bắt buộc)

- `OPENCLAW_CONFIG_PATH` — file cấu hình cho từng instance
- `OPENCLAW_STATE_DIR` — phiên, thông tin xác thực, bộ nhớ đệm cho từng instance
- `agents.defaults.workspace` — thư mục gốc workspace cho từng instance
- `gateway.port` (hoặc `--port`) — duy nhất cho từng instance
- Các cổng phát sinh (trình duyệt/canvas) không được trùng lặp

Nếu các yếu tố này được chia sẻ, bạn sẽ gặp xung đột cấu hình và cổng.

## Khuyến nghị: sử dụng profile (`--profile`)

Profile tự động định phạm vi cho `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` và thêm hậu tố vào tên dịch vụ.

```bash
# chính
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# cứu hộ
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Dịch vụ theo profile:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## Hướng dẫn bot cứu hộ

Chạy một Gateway thứ hai trên cùng máy chủ với:

- profile/cấu hình riêng
- thư mục trạng thái riêng
- workspace riêng
- cổng cơ sở (và các cổng phát sinh)

Điều này giúp bot cứu hộ cách ly khỏi bot chính để có thể gỡ lỗi hoặc áp dụng thay đổi cấu hình nếu bot chính bị ngừng hoạt động.

Khoảng cách cổng: để ít nhất 20 cổng giữa các cổng cơ sở để các cổng trình duyệt/canvas/CDP phát sinh không bị trùng.

### Cách cài đặt (bot cứu hộ)

```bash
# Bot chính (đã có hoặc mới, không có tham số --profile)
# Chạy trên cổng 18789 + cổng Chrome CDC/Canvas/...
openclaw onboard
openclaw gateway install

# Bot cứu hộ (profile và cổng cách ly)
openclaw --profile rescue onboard
# Lưu ý:
# - Tên workspace sẽ được thêm hậu tố -rescue theo mặc định
# - Cổng nên ít nhất là 18789 + 20 cổng,
#   tốt hơn là chọn cổng cơ sở hoàn toàn khác, như 19789,
# - phần còn lại của quá trình onboard giống như bình thường

# Để cài đặt dịch vụ (nếu chưa tự động thực hiện trong quá trình setup)
openclaw --profile rescue gateway install
```

## Ánh xạ cổng (phát sinh)

Cổng cơ sở = `gateway.port` (hoặc `OPENCLAW_GATEWAY_PORT` / `--port`).

- cổng dịch vụ điều khiển trình duyệt = cơ sở + 2 (chỉ loopback)
- máy chủ canvas được phục vụ trên máy chủ HTTP của Gateway (cùng cổng với `gateway.port`)
- Các cổng CDP của profile trình duyệt tự động phân bổ từ `browser.controlPort + 9 .. + 108`

Nếu bạn ghi đè bất kỳ cổng nào trong cấu hình hoặc môi trường, hãy đảm bảo chúng duy nhất cho từng instance.

## Lưu ý về Browser/CDP (lỗi thường gặp)

- Không ghim `browser.cdpUrl` vào cùng giá trị trên nhiều instance.
- Mỗi instance cần cổng điều khiển trình duyệt và dải CDP riêng (phát sinh từ cổng gateway của nó).
- Nếu cần cổng CDP cụ thể, đặt `browser.profiles.<name>.cdpPort` cho từng instance.
- Chrome từ xa: sử dụng `browser.profiles.<name>.cdpUrl` (cho từng profile, từng instance).

## Ví dụ môi trường thủ công

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## Kiểm tra nhanh

```bash
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```
