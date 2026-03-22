---
title: Sandbox vs Chính sách Công cụ vs Chế độ Nâng cao
summary: "Tại sao một công cụ bị chặn: runtime sandbox, chính sách cho phép/từ chối công cụ, và cổng thực thi nâng cao"
read_when: "Khi gặp 'sandbox jail' hoặc thấy từ chối công cụ/chế độ nâng cao và muốn biết chính xác khóa cấu hình cần thay đổi."
status: active
---

# Sandbox vs Chính sách Công cụ vs Chế độ Nâng cao

OpenClaw có ba cơ chế kiểm soát liên quan nhưng khác nhau:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) quyết định **nơi công cụ chạy** (Docker hay host).
2. **Chính sách công cụ** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) quyết định **công cụ nào được phép sử dụng**.
3. **Chế độ Nâng cao** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) là một **cổng thoát chỉ dành cho thực thi** để chạy trên host khi đang bị sandbox.

## Kiểm tra nhanh

Sử dụng công cụ kiểm tra để xem OpenClaw thực sự đang làm gì:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Nó sẽ hiển thị:

- chế độ/scope/sandbox truy cập workspace hiệu quả
- phiên hiện tại có bị sandbox hay không (main vs non-main)
- công cụ sandbox cho phép/từ chối hiệu quả (và nó đến từ agent/toàn cầu/mặc định)
- cổng nâng cao và đường dẫn khóa sửa lỗi

## Sandbox: nơi công cụ chạy

Sandboxing được kiểm soát bởi `agents.defaults.sandbox.mode`:

- `"off"`: mọi thứ chạy trên host.
- `"non-main"`: chỉ các phiên không phải main bị sandbox (thường gây "ngạc nhiên" cho nhóm/kênh).
- `"all"`: mọi thứ đều bị sandbox.

Xem [Sandboxing](/gateway/sandboxing) để biết ma trận đầy đủ (scope, mounts workspace, images).

### Bind mounts (kiểm tra nhanh bảo mật)

- `docker.binds` _xuyên qua_ hệ thống tệp sandbox: bất kỳ thứ gì bạn mount sẽ hiển thị bên trong container với chế độ bạn đặt (`:ro` hoặc `:rw`).
- Mặc định là đọc-ghi nếu bạn bỏ qua chế độ; ưu tiên `:ro` cho nguồn/tài liệu bí mật.
- `scope: "shared"` bỏ qua các bind theo từng agent (chỉ áp dụng bind toàn cầu).
- Binding `/var/run/docker.sock` thực sự trao quyền kiểm soát host cho sandbox; chỉ làm điều này khi có chủ đích.
- Truy cập workspace (`workspaceAccess: "ro"`/`"rw"`) độc lập với chế độ bind.

## Chính sách công cụ: công cụ nào tồn tại/được gọi

Hai lớp quan trọng:

- **Hồ sơ công cụ**: `tools.profile` và `agents.list[].tools.profile` (danh sách cho phép cơ bản)
- **Hồ sơ công cụ nhà cung cấp**: `tools.byProvider[provider].profile` và `agents.list[].tools.byProvider[provider].profile`
- **Chính sách công cụ toàn cầu/theo agent**: `tools.allow`/`tools.deny` và `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Chính sách công cụ nhà cung cấp**: `tools.byProvider[provider].allow/deny` và `agents.list[].tools.byProvider[provider].allow/deny`
- **Chính sách công cụ sandbox** (chỉ áp dụng khi bị sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` và `agents.list[].tools.sandbox.tools.*`

Nguyên tắc chung:

- `deny` luôn thắng.
- Nếu `allow` không rỗng, mọi thứ khác được coi là bị chặn.
- Chính sách công cụ là điểm dừng cứng: `/exec` không thể ghi đè một công cụ `exec` bị từ chối.
- `/exec` chỉ thay đổi mặc định phiên cho người gửi được ủy quyền; nó không cấp quyền truy cập công cụ.
  Khóa công cụ nhà cung cấp chấp nhận `provider` (ví dụ: `google-antigravity`) hoặc `provider/model` (ví dụ: `openai/gpt-5.2`).

### Nhóm công cụ (viết tắt)

Chính sách công cụ (toàn cầu, agent, sandbox) hỗ trợ các mục `group:*` mở rộng thành nhiều công cụ:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Các nhóm có sẵn:

- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: tất cả công cụ tích hợp sẵn của OpenClaw (không bao gồm plugin nhà cung cấp)

## Chế độ Nâng cao: chỉ thực thi "chạy trên host"

Chế độ Nâng cao **không** cấp thêm công cụ; nó chỉ ảnh hưởng đến `exec`.

- Nếu bạn đang bị sandbox, `/elevated on` (hoặc `exec` với `elevated: true`) chạy trên host (có thể vẫn cần phê duyệt).
- Sử dụng `/elevated full` để bỏ qua phê duyệt exec cho phiên.
- Nếu bạn đã chạy trực tiếp, chế độ nâng cao thực tế là không có tác dụng (vẫn bị kiểm soát).
- Chế độ Nâng cao **không** bị giới hạn theo kỹ năng và **không** ghi đè cho phép/từ chối công cụ.
- `/exec` tách biệt với chế độ nâng cao. Nó chỉ điều chỉnh mặc định thực thi theo phiên cho người gửi được ủy quyền.

Cổng:

- Kích hoạt: `tools.elevated.enabled` (và tùy chọn `agents.list[].tools.elevated.enabled`)
- Danh sách cho phép người gửi: `tools.elevated.allowFrom.<provider>` (và tùy chọn `agents.list[].tools.elevated.allowFrom.<provider>`)

Xem [Chế độ Nâng cao](/tools/elevated).

## Các cách sửa lỗi "sandbox jail" phổ biến

### "Công cụ X bị chặn bởi chính sách công cụ sandbox"

Khóa sửa lỗi (chọn một):

- Tắt sandbox: `agents.defaults.sandbox.mode=off` (hoặc theo agent `agents.list[].sandbox.mode=off`)
- Cho phép công cụ bên trong sandbox:
  - xóa nó khỏi `tools.sandbox.tools.deny` (hoặc theo agent `agents.list[].tools.sandbox.tools.deny`)
  - hoặc thêm nó vào `tools.sandbox.tools.allow` (hoặc theo agent allow)

### "Tôi nghĩ đây là main, tại sao lại bị sandbox?"

Trong chế độ `"non-main"`, các khóa nhóm/kênh _không_ phải là main. Sử dụng khóa phiên main (hiển thị bởi `sandbox explain`) hoặc chuyển chế độ sang `"off"`.

## Xem thêm

- [Sandboxing](/gateway/sandboxing) -- tham khảo sandbox đầy đủ (chế độ, phạm vi, backend, images)
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- ghi đè theo agent và thứ tự ưu tiên
- [Chế độ Nâng cao](/tools/elevated)
