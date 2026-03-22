---
title: Sandbox vs Tool Policy vs Elevated
summary: "Tại sao một công cụ bị chặn: runtime sandbox, chính sách cho phép/chặn công cụ, và quyền chạy nâng cao"
read_when: "Gặp 'sandbox jail' hoặc thấy công cụ/bị từ chối nâng cao và muốn biết chính xác key cấu hình cần thay đổi."
status: active
---

# Sandbox vs Tool Policy vs Elevated

OpenClaw có ba cơ chế kiểm soát liên quan (nhưng khác nhau):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) quyết định **nơi công cụ chạy** (Docker hay host).
2. **Tool policy** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) quyết định **công cụ nào được phép sử dụng**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) là **cửa thoát chỉ chạy** trên host khi bị sandbox.

## Debug nhanh

Dùng inspector để xem OpenClaw thực sự đang làm gì:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Nó sẽ in ra:

- chế độ/scope sandbox hiệu lực/quyền truy cập workspace
- session hiện tại có bị sandbox không (main vs non-main)
- công cụ sandbox cho phép/chặn hiệu lực (và nó đến từ agent/global/default)
- cổng nâng cao và đường dẫn key fix-it

## Sandbox: nơi công cụ chạy

Sandboxing được kiểm soát bởi `agents.defaults.sandbox.mode`:

- `"off"`: mọi thứ chạy trên host.
- `"non-main"`: chỉ các session không phải main bị sandbox (hay gặp với nhóm/kênh).
- `"all"`: mọi thứ bị sandbox.

Xem [Sandboxing](/gateway/sandboxing) để biết đầy đủ (scope, workspace mounts, images).

### Bind mounts (kiểm tra nhanh bảo mật)

- `docker.binds` _xuyên_ qua filesystem sandbox: bất cứ gì mount sẽ thấy được trong container với chế độ bạn đặt (`:ro` hoặc `:rw`).
- Mặc định là read-write nếu không chỉ định chế độ; ưu tiên `:ro` cho source/secrets.
- `scope: "shared"` bỏ qua bind theo agent (chỉ áp dụng bind global).
- Bind `/var/run/docker.sock` thực chất trao quyền kiểm soát host cho sandbox; chỉ làm điều này có chủ đích.
- Quyền truy cập workspace (`workspaceAccess: "ro"`/`"rw"`) độc lập với chế độ bind.

## Tool policy: công cụ nào tồn tại/được gọi

Hai lớp quan trọng:

- **Tool profile**: `tools.profile` và `agents.list[].tools.profile` (danh sách cho phép cơ bản)
- **Provider tool profile**: `tools.byProvider[provider].profile` và `agents.list[].tools.byProvider[provider].profile`
- **Chính sách công cụ global/theo agent**: `tools.allow`/`tools.deny` và `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Chính sách công cụ theo provider**: `tools.byProvider[provider].allow/deny` và `agents.list[].tools.byProvider[provider].allow/deny`
- **Chính sách công cụ sandbox** (chỉ áp dụng khi bị sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` và `agents.list[].tools.sandbox.tools.*`

Nguyên tắc:

- `deny` luôn thắng.
- Nếu `allow` không rỗng, mọi thứ khác bị chặn.
- Tool policy là điểm dừng cứng: `/exec` không thể ghi đè công cụ bị từ chối `exec`.
- `/exec` chỉ thay đổi mặc định session cho sender được ủy quyền; không cấp quyền truy cập công cụ.
  Key công cụ provider chấp nhận `provider` (ví dụ `google-antigravity`) hoặc `provider/model` (ví dụ `openai/gpt-5.2`).

### Tool groups (viết tắt)

Chính sách công cụ (global, agent, sandbox) hỗ trợ `group:*` mở rộng thành nhiều công cụ:

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
- `group:openclaw`: tất cả công cụ OpenClaw tích hợp sẵn (không bao gồm plugin provider)

## Elevated: chỉ chạy "trên host"

Elevated **không** cấp thêm công cụ; chỉ ảnh hưởng `exec`.

- Nếu bị sandbox, `/elevated on` (hoặc `exec` với `elevated: true`) chạy trên host (vẫn có thể cần phê duyệt).
- Dùng `/elevated full` để bỏ qua phê duyệt exec cho session.
- Nếu đã chạy trực tiếp, elevated thực chất không có tác dụng (vẫn bị chặn).
- Elevated **không** theo scope skill và **không** ghi đè tool allow/deny.
- `/exec` tách biệt với elevated. Nó chỉ điều chỉnh mặc định exec theo session cho sender được ủy quyền.

Cổng:

- Kích hoạt: `tools.elevated.enabled` (và tùy chọn `agents.list[].tools.elevated.enabled`)
- Danh sách cho phép sender: `tools.elevated.allowFrom.<provider>` (và tùy chọn `agents.list[].tools.elevated.allowFrom.<provider>`)

Xem [Elevated Mode](/tools/elevated).

## Cách fix "sandbox jail" thường gặp

### "Tool X bị chặn bởi chính sách công cụ sandbox"

Key fix-it (chọn một):

- Tắt sandbox: `agents.defaults.sandbox.mode=off` (hoặc theo agent `agents.list[].sandbox.mode=off`)
- Cho phép công cụ trong sandbox:
  - xóa khỏi `tools.sandbox.tools.deny` (hoặc theo agent `agents.list[].tools.sandbox.tools.deny`)
  - hoặc thêm vào `tools.sandbox.tools.allow` (hoặc theo agent allow)

### "Tưởng đây là main, sao lại bị sandbox?"

Trong chế độ `"non-main"`, key nhóm/kênh _không_ phải main. Dùng key session main (hiển thị bởi `sandbox explain`) hoặc chuyển chế độ sang `"off"`.

## Xem thêm

- [Sandboxing](/gateway/sandboxing) -- tham khảo sandbox đầy đủ (modes, scopes, backends, images)
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- ghi đè theo agent và thứ tự ưu tiên
- [Elevated Mode](/tools/elevated)\n