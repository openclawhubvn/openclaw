---
title: OpenShell
summary: "Sử dụng OpenShell làm backend sandbox quản lý cho OpenClaw agents"
read_when:
  - Cần sandbox quản lý trên cloud thay vì Docker local
  - Đang cài đặt plugin OpenShell
  - Cần chọn giữa chế độ mirror và remote workspace
---

# OpenShell

OpenShell là backend sandbox quản lý cho OpenClaw. Thay vì chạy Docker container local, OpenClaw giao việc quản lý vòng đời sandbox cho `openshell` CLI, tạo môi trường remote với thực thi lệnh qua SSH.

Plugin OpenShell tái sử dụng cùng giao thức SSH và cầu nối filesystem remote như [SSH backend](/gateway/sandboxing#ssh-backend). Nó thêm các thao tác vòng đời đặc thù của OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) và chế độ workspace `mirror` tùy chọn.

## Yêu cầu

- Cài `openshell` CLI và có trong `PATH` (hoặc đặt đường dẫn tùy chỉnh qua `plugins.entries.openshell.config.command`)
- Tài khoản OpenShell có quyền truy cập sandbox
- OpenClaw Gateway chạy trên host

## Bắt đầu nhanh

1. Kích hoạt plugin và đặt backend sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Khởi động lại Gateway. Ở lần chạy agent tiếp theo, OpenClaw tạo sandbox OpenShell và định tuyến thực thi công cụ qua đó.

3. Kiểm tra:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Chế độ Workspace

Đây là quyết định quan trọng nhất khi dùng OpenShell.

### `mirror`

Dùng `plugins.entries.openshell.config.mode: "mirror"` khi muốn **workspace local là chuẩn**.

Hoạt động:

- Trước `exec`, OpenClaw đồng bộ workspace local vào sandbox OpenShell.
- Sau `exec`, OpenClaw đồng bộ workspace remote về workspace local.
- Công cụ file vẫn hoạt động qua cầu nối sandbox, nhưng workspace local là nguồn chuẩn giữa các lần chạy.

Phù hợp khi:

- Chỉnh sửa file local ngoài OpenClaw và muốn thay đổi đó tự động hiện trong sandbox.
- Muốn sandbox OpenShell hoạt động giống backend Docker nhất có thể.
- Muốn workspace host phản ánh ghi chép sandbox sau mỗi lần exec.

Đánh đổi: chi phí đồng bộ thêm trước và sau mỗi exec.

### `remote`

Dùng `plugins.entries.openshell.config.mode: "remote"` khi muốn **workspace OpenShell là chuẩn**.

Hoạt động:

- Khi tạo sandbox lần đầu, OpenClaw khởi tạo workspace remote từ workspace local một lần.
- Sau đó, `exec`, `read`, `write`, `edit`, và `apply_patch` hoạt động trực tiếp trên workspace remote OpenShell.
- OpenClaw **không** đồng bộ thay đổi remote về workspace local.
- Đọc media lúc prompt vẫn hoạt động vì công cụ file và media đọc qua cầu nối sandbox.

Phù hợp khi:

- Sandbox chủ yếu sống ở phía remote.
- Muốn giảm chi phí đồng bộ mỗi lần chạy.
- Không muốn chỉnh sửa local host ghi đè trạng thái sandbox remote một cách âm thầm.

Quan trọng: nếu chỉnh sửa file trên host ngoài OpenClaw sau khi khởi tạo, sandbox remote **không** thấy thay đổi đó. Dùng `openclaw sandbox recreate` để khởi tạo lại.

### Chọn chế độ

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Workspace chuẩn**      | Host local                 | OpenShell remote          |
| **Hướng đồng bộ**        | Hai chiều (mỗi exec)       | Khởi tạo một lần          |
| **Chi phí mỗi lần chạy** | Cao hơn (upload + download) | Thấp hơn (thao tác remote trực tiếp) |
| **Chỉnh sửa local thấy?**| Có, ở lần exec tiếp theo   | Không, cho đến khi khởi tạo lại |
| **Phù hợp cho**          | Quy trình phát triển       | Agent chạy dài, CI        |

## Tham khảo cấu hình

Tất cả cấu hình OpenShell nằm dưới `plugins.entries.openshell.config`:

| Key                       | Type                     | Default       | Mô tả                                                  |
| ------------------------- | ------------------------ | ------------- | ------------------------------------------------------ |
| `mode`                    | `"mirror"` or `"remote"` | `"mirror"`    | Chế độ đồng bộ workspace                                |
| `command`                 | `string`                 | `"openshell"` | Đường dẫn hoặc tên của `openshell` CLI                  |
| `from`                    | `string`                 | `"openclaw"`  | Nguồn sandbox cho lần tạo đầu tiên                      |
| `gateway`                 | `string`                 | —             | Tên gateway OpenShell (`--gateway`)                     |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint gateway OpenShell (`--gateway-endpoint`)   |
| `policy`                  | `string`                 | —             | ID policy OpenShell cho việc tạo sandbox                |
| `providers`               | `string[]`               | `[]`          | Tên provider đính kèm khi tạo sandbox                   |
| `gpu`                     | `boolean`                | `false`       | Yêu cầu tài nguyên GPU                                  |
| `autoProviders`           | `boolean`                | `true`        | Truyền `--auto-providers` khi tạo sandbox               |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Workspace chính có thể ghi bên trong sandbox            |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Đường dẫn mount workspace agent (cho truy cập chỉ đọc)  |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout cho các thao tác `openshell` CLI                |

Cài đặt cấp sandbox (`mode`, `scope`, `workspaceAccess`) được cấu hình dưới `agents.defaults.sandbox` như bất kỳ backend nào. Xem [Sandboxing](/gateway/sandboxing) để biết đầy đủ.

## Ví dụ

### Cài đặt remote tối thiểu

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Chế độ Mirror với GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell cho từng agent với gateway tùy chỉnh

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Quản lý vòng đời

Sandbox OpenShell được quản lý qua CLI sandbox thông thường:

```bash
# Liệt kê tất cả runtime sandbox (Docker + OpenShell)
openclaw sandbox list

# Kiểm tra policy hiệu lực
openclaw sandbox explain

# Khởi tạo lại (xóa workspace remote, khởi tạo lại khi sử dụng tiếp theo)
openclaw sandbox recreate --all
```

Với chế độ `remote`, **khởi tạo lại rất quan trọng**: nó xóa workspace remote chuẩn cho phạm vi đó. Lần sử dụng tiếp theo sẽ khởi tạo workspace remote mới từ workspace local.

Với chế độ `mirror`, khởi tạo lại chủ yếu để reset môi trường thực thi remote vì workspace local vẫn là chuẩn.

### Khi nào cần khởi tạo lại

Khởi tạo lại sau khi thay đổi bất kỳ điều nào sau đây:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Hạn chế hiện tại

- Trình duyệt sandbox không được hỗ trợ trên backend OpenShell.
- `sandbox.docker.binds` không áp dụng cho OpenShell.
- Các nút runtime đặc thù Docker dưới `sandbox.docker.*` chỉ áp dụng cho backend Docker.

## Cách hoạt động

1. OpenClaw gọi `openshell sandbox create` (với các flag `--from`, `--gateway`, `--policy`, `--providers`, `--gpu` như đã cấu hình).
2. OpenClaw gọi `openshell sandbox ssh-config <name>` để lấy thông tin kết nối SSH cho sandbox.
3. Core ghi cấu hình SSH vào file tạm và mở phiên SSH sử dụng cùng cầu nối filesystem remote như backend SSH chung.
4. Ở chế độ `mirror`: đồng bộ local sang remote trước exec, chạy, đồng bộ lại sau exec.
5. Ở chế độ `remote`: khởi tạo một lần khi tạo, sau đó thao tác trực tiếp trên workspace remote.

## Xem thêm

- [Sandboxing](/gateway/sandboxing) -- chế độ, phạm vi, và so sánh backend
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- gỡ lỗi công cụ bị chặn
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- ghi đè theo agent
- [Sandbox CLI](/cli/sandbox) -- lệnh `openclaw sandbox`\n