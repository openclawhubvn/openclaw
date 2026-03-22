---
summary: "Chạy nhiều OpenClaw Gateway trên một host (cách ly, cổng, và profile)"
read_when:
  - Chạy nhiều hơn một Gateway trên cùng một máy
  - Cần cấu hình/trạng thái/cổng riêng biệt cho từng Gateway
title: "Nhiều Gateways"
---

# Nhiều Gateways (cùng host)

Thông thường, chỉ cần một Gateway vì một Gateway có thể xử lý nhiều kết nối messaging và agent. Nếu cần cách ly mạnh hơn hoặc dự phòng (ví dụ: bot cứu hộ), chạy các Gateway riêng với profile/cổng cách ly.

## Danh sách kiểm tra cách ly (bắt buộc)

- `OPENCLAW_CONFIG_PATH` — file config cho từng instance
- `OPENCLAW_STATE_DIR` — session, creds, cache cho từng instance
- `agents.defaults.workspace` — workspace root cho từng instance
- `gateway.port` (hoặc `--port`) — duy nhất cho từng instance
- Cổng phát sinh (browser/canvas) không được trùng

Nếu dùng chung, sẽ gặp xung đột config và cổng.

## Khuyến nghị: dùng profiles (`--profile`)

Profiles tự động scope `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` và thêm hậu tố vào tên dịch vụ.

```bash
# main
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Dịch vụ theo profile:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## Hướng dẫn bot cứu hộ

Chạy Gateway thứ hai trên cùng host với:

- profile/config riêng
- state dir riêng
- workspace riêng
- cổng cơ bản (và cổng phát sinh) riêng

Giữ bot cứu hộ cách ly với bot chính để có thể debug hoặc thay đổi config nếu bot chính gặp sự cố.

Khoảng cách cổng: để ít nhất 20 cổng giữa các cổng cơ bản để tránh trùng cổng browser/canvas/CDP phát sinh.

### Cách cài đặt (bot cứu hộ)

```bash
# Bot chính (đã có hoặc mới, không dùng tham số --profile)
# Chạy trên cổng 18789 + Chrome CDC/Canvas/... Ports
openclaw onboard
openclaw gateway install

# Bot cứu hộ (profile + cổng cách ly)
openclaw --profile rescue onboard
# Lưu ý:
# - Tên workspace sẽ được thêm hậu tố -rescue mặc định
# - Cổng nên ít nhất là 18789 + 20 cổng,
#   tốt nhất chọn cổng cơ bản hoàn toàn khác, như 19789,
# - phần còn lại của onboarding giống như bình thường

# Để cài đặt dịch vụ (nếu chưa tự động trong quá trình setup)
openclaw --profile rescue gateway install
```

## Mapping cổng (phát sinh)

Cổng cơ bản = `gateway.port` (hoặc `OPENCLAW_GATEWAY_PORT` / `--port`).

- cổng dịch vụ điều khiển browser = cơ bản + 2 (chỉ loopback)
- canvas host được phục vụ trên Gateway HTTP server (cùng cổng với `gateway.port`)
- Cổng CDP profile Browser tự động phân bổ từ `browser.controlPort + 9 .. + 108`

Nếu override trong config hoặc env, phải giữ duy nhất cho từng instance.

## Lưu ý Browser/CDP (hay gặp lỗi)

- **Không** ghim `browser.cdpUrl` cùng giá trị trên nhiều instance.
- Mỗi instance cần cổng điều khiển browser và dải CDP riêng (phát sinh từ cổng gateway của nó).
- Nếu cần cổng CDP cụ thể, đặt `browser.profiles.<name>.cdpPort` cho từng instance.
- Chrome từ xa: dùng `browser.profiles.<name>.cdpUrl` (theo profile, theo instance).

## Ví dụ env thủ công

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
```\n