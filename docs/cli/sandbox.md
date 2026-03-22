---
title: "Hướng Dẫn Cấu Hình Sandbox CLI"
summary: "Khám phá cách quản lý và kiểm tra môi trường sandbox hiệu quả với CLI. Tối ưu hóa chính sách bảo mật của bạn ngay hôm nay."
read_when: "Khi bạn quản lý môi trường sandbox hoặc gỡ lỗi hành vi sandbox/chính sách công cụ."
status: active
---

# Sandbox CLI

Quản lý môi trường sandbox để thực thi agent một cách cô lập.

## Tổng quan

OpenClaw có thể chạy các agent trong môi trường sandbox cô lập để đảm bảo an toàn. Các lệnh `sandbox` giúp bạn kiểm tra và tái tạo lại các môi trường này sau khi có cập nhật hoặc thay đổi cấu hình.

Hiện tại, điều này thường bao gồm:

- Container sandbox Docker
- Môi trường sandbox SSH khi `agents.defaults.sandbox.backend = "ssh"`
- Môi trường sandbox OpenShell khi `agents.defaults.sandbox.backend = "openshell"`

Với `ssh` và OpenShell `remote`, việc tái tạo quan trọng hơn so với Docker:

- Workspace từ xa là chuẩn sau khi được khởi tạo lần đầu
- `openclaw sandbox recreate` xóa workspace từ xa chuẩn cho phạm vi đã chọn
- Lần sử dụng tiếp theo sẽ khởi tạo lại từ workspace cục bộ hiện tại

## Các lệnh

### `openclaw sandbox explain`

Kiểm tra chế độ/phạm vi/truy cập workspace sandbox hiệu quả, chính sách công cụ sandbox và các cổng nâng cao (với đường dẫn cấu hình fix-it).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Liệt kê tất cả các môi trường sandbox cùng với trạng thái và cấu hình của chúng.

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

Xóa môi trường sandbox để buộc tái tạo với cấu hình cập nhật.

```bash
openclaw sandbox recreate --all                # Tái tạo tất cả container
openclaw sandbox recreate --session main       # Phiên cụ thể
openclaw sandbox recreate --agent mybot        # Agent cụ thể
openclaw sandbox recreate --browser            # Chỉ container trình duyệt
openclaw sandbox recreate --all --force        # Bỏ qua xác nhận
```

**Tùy chọn:**

- `--all`: Tái tạo tất cả container sandbox
- `--session <key>`: Tái tạo container cho phiên cụ thể
- `--agent <id>`: Tái tạo container cho agent cụ thể
- `--browser`: Chỉ tái tạo container trình duyệt
- `--force`: Bỏ qua yêu cầu xác nhận

**Quan trọng:** Các môi trường runtime sẽ tự động được tái tạo khi agent được sử dụng lần tiếp theo.

## Trường hợp sử dụng

### Sau khi cập nhật hình ảnh Docker

```bash
# Tải hình ảnh mới
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Cập nhật cấu hình để sử dụng hình ảnh mới
# Chỉnh sửa cấu hình: agents.defaults.sandbox.docker.image (hoặc agents.list[].sandbox.docker.image)

# Tái tạo container
openclaw sandbox recreate --all
```

### Sau khi thay đổi cấu hình sandbox

```bash
# Chỉnh sửa cấu hình: agents.defaults.sandbox.* (hoặc agents.list[].sandbox.*)

# Tái tạo để áp dụng cấu hình mới
openclaw sandbox recreate --all
```

### Sau khi thay đổi mục tiêu SSH hoặc thông tin xác thực SSH

```bash
# Chỉnh sửa cấu hình:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Với backend `ssh` cốt lõi, tái tạo sẽ xóa thư mục workspace từ xa theo phạm vi trên mục tiêu SSH. Lần chạy tiếp theo sẽ khởi tạo lại từ workspace cục bộ.

### Sau khi thay đổi nguồn, chính sách hoặc chế độ OpenShell

```bash
# Chỉnh sửa cấu hình:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Với chế độ `remote` của OpenShell, tái tạo sẽ xóa workspace từ xa chuẩn cho phạm vi đó. Lần chạy tiếp theo sẽ khởi tạo lại từ workspace cục bộ.

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

**Vấn đề:** Khi bạn cập nhật cấu hình sandbox:

- Các môi trường runtime hiện tại tiếp tục chạy với cài đặt cũ
- Các môi trường runtime chỉ được xóa sau 24 giờ không hoạt động
- Các agent được sử dụng thường xuyên giữ cho các môi trường runtime cũ tồn tại vô thời hạn

**Giải pháp:** Sử dụng `openclaw sandbox recreate` để buộc xóa các môi trường runtime cũ. Chúng sẽ được tái tạo tự động với cài đặt hiện tại khi cần.

Mẹo: ưu tiên `openclaw sandbox recreate` hơn là dọn dẹp thủ công theo backend cụ thể. Nó sử dụng registry runtime của Gateway và tránh sự không khớp khi các khóa phạm vi/phiên thay đổi.

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
          "idleHours": 24, // Tự động xóa sau 24h không hoạt động
          "maxAgeDays": 7, // Tự động xóa sau 7 ngày
        },
      },
    },
  },
}
```

## Xem thêm

- [Tài liệu Sandbox](/gateway/sandboxing)
- [Cấu hình Agent](/concepts/agent-workspace)
- [Lệnh Doctor](/gateway/doctor) - Kiểm tra thiết lập sandbox
