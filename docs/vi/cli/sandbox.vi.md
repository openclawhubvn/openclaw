# Sandbox CLI

Quản lý sandbox runtimes để chạy agent cách ly.

## Tổng quan

OpenClaw có thể chạy agent trong sandbox runtime cách ly để tăng cường bảo mật. Lệnh `sandbox` giúp kiểm tra và tái tạo lại các runtime sau khi cập nhật hoặc thay đổi cấu hình.

Hiện tại thường dùng:

- Docker sandbox containers
- SSH sandbox runtimes khi `agents.defaults.sandbox.backend = "ssh"`
- OpenShell sandbox runtimes khi `agents.defaults.sandbox.backend = "openshell"`

Với `ssh` và OpenShell `remote`, việc tái tạo quan trọng hơn Docker:

- Workspace remote là chuẩn sau khi seed lần đầu
- `openclaw sandbox recreate` xóa workspace remote chuẩn cho phạm vi đã chọn
- Lần sử dụng tiếp theo sẽ seed lại từ workspace local hiện tại

## Lệnh

### `openclaw sandbox explain`

Kiểm tra chế độ/scope/workspace truy cập sandbox hiệu quả, chính sách công cụ sandbox, và các cổng nâng cao (với đường dẫn cấu hình fix-it).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Liệt kê tất cả sandbox runtimes với trạng thái và cấu hình của chúng.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Chỉ liệt kê container trình duyệt
openclaw sandbox list --json     # Xuất ra JSON
```

**Thông tin bao gồm:**

- Tên và trạng thái runtime
- Backend (`docker`, `openshell`, v.v.)
- Nhãn cấu hình và xem có khớp với cấu hình hiện tại không
- Tuổi (thời gian từ khi tạo)
- Thời gian không hoạt động (thời gian từ lần sử dụng cuối)
- Phiên/agent liên quan

### `openclaw sandbox recreate`

Xóa sandbox runtimes để buộc tái tạo với cấu hình cập nhật.

```bash
openclaw sandbox recreate --all                # Tái tạo tất cả containers
openclaw sandbox recreate --session main       # Phiên cụ thể
openclaw sandbox recreate --agent mybot        # Agent cụ thể
openclaw sandbox recreate --browser            # Chỉ container trình duyệt
openclaw sandbox recreate --all --force        # Bỏ qua xác nhận
```

**Tùy chọn:**

- `--all`: Tái tạo tất cả sandbox containers
- `--session <key>`: Tái tạo container cho phiên cụ thể
- `--agent <id>`: Tái tạo containers cho agent cụ thể
- `--browser`: Chỉ tái tạo container trình duyệt
- `--force`: Bỏ qua xác nhận

**Quan trọng:** Runtimes tự động tái tạo khi agent được sử dụng tiếp theo.

## Trường hợp sử dụng

### Sau khi cập nhật Docker image

```bash
# Kéo image mới
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Cập nhật cấu hình để sử dụng image mới
# Chỉnh sửa cấu hình: agents.defaults.sandbox.docker.image (hoặc agents.list[].sandbox.docker.image)

# Tái tạo containers
openclaw sandbox recreate --all
```

### Sau khi thay đổi cấu hình sandbox

```bash
# Chỉnh sửa cấu hình: agents.defaults.sandbox.* (hoặc agents.list[].sandbox.*)

# Tái tạo để áp dụng cấu hình mới
openclaw sandbox recreate --all
```

### Sau khi thay đổi SSH target hoặc SSH auth material

```bash
# Chỉnh sửa cấu hình:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Với backend `ssh` cốt lõi, tái tạo xóa workspace root remote theo phạm vi trên SSH target. Lần chạy tiếp theo sẽ seed lại từ workspace local.

### Sau khi thay đổi OpenShell source, policy, hoặc mode

```bash
# Chỉnh sửa cấu hình:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Với chế độ OpenShell `remote`, tái tạo xóa workspace remote chuẩn cho phạm vi đó. Lần chạy tiếp theo sẽ seed lại từ workspace local.

### Sau khi thay đổi setupCommand

```bash
openclaw sandbox recreate --all
# hoặc chỉ một agent:
openclaw sandbox recreate --agent family
```

### Chỉ cho một agent cụ thể

```bash
# Cập nhật chỉ container của một agent
openclaw sandbox recreate --agent alfred
```

## Tại sao cần thiết?

**Vấn đề:** Khi cập nhật cấu hình sandbox:

- Runtimes hiện tại tiếp tục chạy với cài đặt cũ
- Runtimes chỉ bị loại bỏ sau 24h không hoạt động
- Agent thường xuyên sử dụng giữ runtimes cũ sống mãi

**Giải pháp:** Dùng `openclaw sandbox recreate` để buộc loại bỏ runtimes cũ. Chúng sẽ tự động tái tạo với cài đặt hiện tại khi cần.

Mẹo: ưu tiên `openclaw sandbox recreate` hơn việc dọn dẹp thủ công theo backend. Nó sử dụng registry runtime của Gateway và tránh sai lệch khi thay đổi khóa scope/session.

## Cấu hình

Cài đặt sandbox nằm trong `~/.openclaw/openclaw.json` dưới `agents.defaults.sandbox` (ghi đè theo agent nằm trong `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... thêm tùy chọn Docker
        },
        "prune": {
          "idleHours": 24, // Tự động loại bỏ sau 24h không hoạt động
          "maxAgeDays": 7, // Tự động loại bỏ sau 7 ngày
        },
      },
    },
  },
}
```

## Xem thêm

- [Tài liệu Sandbox](/gateway/sandboxing)
- [Cấu hình Agent](/concepts/agent-workspace)
- [Lệnh Doctor](/gateway/doctor) - Kiểm tra thiết lập sandbox\n