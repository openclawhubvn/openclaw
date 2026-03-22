---
summary: "Runbook cho dịch vụ Gateway, vòng đời và vận hành"
read_when:
  - Chạy hoặc debug quá trình gateway
title: "Gateway Runbook"
---

# Gateway runbook

Dùng trang này cho khởi động ngày-1 và vận hành ngày-2 của dịch vụ Gateway.

<CardGroup cols={2}>
  <Card title="Khắc phục sự cố sâu" icon="siren" href="/gateway/troubleshooting">
    Chẩn đoán theo triệu chứng với các lệnh và dấu hiệu log chính xác.
  </Card>
  <Card title="Cấu hình" icon="sliders" href="/gateway/configuration">
    Hướng dẫn thiết lập theo nhiệm vụ + tham chiếu cấu hình đầy đủ.
  </Card>
  <Card title="Quản lý secrets" icon="key-round" href="/gateway/secrets">
    Hợp đồng SecretRef, hành vi snapshot runtime, và các thao tác di chuyển/tải lại.
  </Card>
  <Card title="Hợp đồng kế hoạch secrets" icon="shield-check" href="/gateway/secrets-plan-contract">
    Quy tắc mục tiêu/đường dẫn `secrets apply` và hành vi auth-profile chỉ tham chiếu.
  </Card>
</CardGroup>

## Khởi động local trong 5 phút

<Steps>
  <Step title="Khởi động Gateway">

```bash
openclaw gateway --port 18789
# debug/trace được phản chiếu tới stdio
openclaw gateway --port 18789 --verbose
# buộc dừng listener trên cổng đã chọn, sau đó khởi động
openclaw gateway --force
```

  </Step>

  <Step title="Kiểm tra sức khỏe dịch vụ">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Trạng thái khỏe mạnh: `Runtime: running` và `RPC probe: ok`.

  </Step>

  <Step title="Xác nhận kênh sẵn sàng">

```bash
openclaw channels status --probe
```

  </Step>
</Steps>

<Note>
Cấu hình reload của Gateway theo dõi đường dẫn file cấu hình đang hoạt động (được giải quyết từ profile/state mặc định, hoặc `OPENCLAW_CONFIG_PATH` khi được thiết lập).
Chế độ mặc định là `gateway.reload.mode="hybrid"`.
</Note>

## Mô hình runtime

- Một tiến trình luôn bật cho routing, control plane, và kết nối kênh.
- Một cổng multiplexed cho:
  - WebSocket control/RPC
  - HTTP APIs (tương thích OpenAI, Responses, gọi công cụ)
  - Control UI và hooks
- Chế độ bind mặc định: `loopback`.
- Mặc định yêu cầu xác thực (`gateway.auth.token` / `gateway.auth.password`, hoặc `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).

### Thứ tự ưu tiên cổng và bind

| Cài đặt      | Thứ tự giải quyết                                              |
| ------------ | ------------------------------------------------------------- |
| Cổng Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Chế độ bind  | CLI/override → `gateway.bind` → `loopback`                    |

### Chế độ reload nóng

| `gateway.reload.mode` | Hành vi                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | Không reload cấu hình                      |
| `hot`                 | Chỉ áp dụng thay đổi an toàn nóng          |
| `restart`             | Khởi động lại khi cần reload               |
| `hybrid` (mặc định)   | Áp dụng nóng khi an toàn, khởi động lại khi cần |

## Bộ lệnh cho operator

```bash
openclaw gateway status
openclaw gateway status --deep
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

## Truy cập từ xa

Ưu tiên: Tailscale/VPN.
Dự phòng: SSH tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Sau đó kết nối client tới `ws://127.0.0.1:18789` local.

<Warning>
Nếu gateway có cấu hình auth, client vẫn phải gửi auth (`token`/`password`) ngay cả khi qua SSH tunnels.
</Warning>

Xem thêm: [Remote Gateway](/gateway/remote), [Authentication](/gateway/authentication), [Tailscale](/gateway/tailscale).

## Giám sát và vòng đời dịch vụ

Dùng chạy giám sát để đảm bảo độ tin cậy như môi trường sản xuất.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Nhãn LaunchAgent là `ai.openclaw.gateway` (mặc định) hoặc `ai.openclaw.<profile>` (profile được đặt tên). `openclaw doctor` kiểm tra và sửa chữa cấu hình dịch vụ bị lệch.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Để duy trì sau khi logout, bật lingering:

```bash
sudo loginctl enable-linger <user>
```

  </Tab>

  <Tab title="Linux (system service)">

Dùng system unit cho host nhiều người dùng/luôn bật.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

  </Tab>
</Tabs>

## Nhiều gateway trên một host

Hầu hết các thiết lập nên chạy **một** Gateway.
Dùng nhiều chỉ khi cần cách ly/độ dự phòng nghiêm ngặt (ví dụ profile cứu hộ).

Danh sách kiểm tra cho mỗi instance:

- `gateway.port` duy nhất
- `OPENCLAW_CONFIG_PATH` duy nhất
- `OPENCLAW_STATE_DIR` duy nhất
- `agents.defaults.workspace` duy nhất

Ví dụ:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Xem thêm: [Multiple gateways](/gateway/multiple-gateways).

### Đường tắt profile dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Mặc định bao gồm state/config cách ly và cổng gateway cơ bản `19001`.

## Tham khảo nhanh giao thức (góc nhìn operator)

- Frame đầu tiên của client phải là `connect`.
- Gateway trả về snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- Yêu cầu: `req(method, params)` → `res(ok/payload|error)`.
- Sự kiện phổ biến: `connect.challenge`, `agent`, `chat`, `presence`, `tick`, `health`, `heartbeat`, `shutdown`.

Chạy agent gồm hai giai đoạn:

1. Xác nhận chấp nhận ngay lập tức (`status:"accepted"`)
2. Phản hồi hoàn thành cuối cùng (`status:"ok"|"error"`), với các sự kiện `agent` được stream giữa chừng.

Xem tài liệu giao thức đầy đủ: [Gateway Protocol](/gateway/protocol).

## Kiểm tra vận hành

### Liveness

- Mở WS và gửi `connect`.
- Mong đợi phản hồi `hello-ok` với snapshot.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Khôi phục khoảng trống

Sự kiện không được phát lại. Khi có khoảng trống, làm mới state (`health`, `system-presence`) trước khi tiếp tục.

## Dấu hiệu lỗi phổ biến

| Dấu hiệu                                                      | Vấn đề có thể xảy ra                     |
| ------------------------------------------------------------- | ---------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Non-loopback bind không có token/password |
| `another gateway instance is already listening` / `EADDRINUSE` | Xung đột cổng                            |
| `Gateway start blocked: set gateway.mode=local`               | Cấu hình đặt ở chế độ remote             |
| `unauthorized` trong quá trình connect                        | Không khớp auth giữa client và gateway   |

Để chẩn đoán đầy đủ, sử dụng [Gateway Troubleshooting](/gateway/troubleshooting).

## Đảm bảo an toàn

- Client giao thức Gateway thất bại nhanh khi Gateway không khả dụng (không có fallback direct-channel ngầm định).
- Frame đầu tiên không hợp lệ/không phải connect bị từ chối và đóng.
- Tắt máy nhẹ nhàng phát ra sự kiện `shutdown` trước khi đóng socket.

---

Liên quan:

- [Troubleshooting](/gateway/troubleshooting)
- [Background Process](/gateway/background-process)
- [Configuration](/gateway/configuration)
- [Health](/gateway/health)
- [Doctor](/gateway/doctor)
- [Authentication](/gateway/authentication)\n