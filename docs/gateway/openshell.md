---
title: "Hướng Dẫn Sử Dụng OpenShell Backend"
summary: "Tìm hiểu cách sử dụng OpenShell làm sandbox quản lý cho agent OpenClaw, tối ưu hóa hiệu suất và bảo mật."
read_when:
  - Bạn muốn sử dụng sandbox được quản lý trên cloud thay vì Docker cục bộ
  - Bạn đang thiết lập plugin OpenShell
  - Bạn cần chọn giữa chế độ workspace mirror và remote
---

# OpenShell

OpenShell là một backend sandbox được quản lý cho OpenClaw. Thay vì chạy các container Docker cục bộ, OpenClaw ủy quyền vòng đời của sandbox cho CLI `openshell`, giúp tạo môi trường từ xa với việc thực thi lệnh dựa trên SSH.

Plugin OpenShell tái sử dụng cùng giao thức SSH và cầu nối hệ thống tệp từ xa như [SSH backend](/gateway/sandboxing#ssh-backend) chung. Nó thêm các chức năng vòng đời đặc thù của OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) và một chế độ workspace `mirror` tùy chọn.

## Yêu cầu trước

- CLI `openshell` đã được cài đặt và có trong `PATH` (hoặc thiết lập đường dẫn tùy chỉnh qua `plugins.entries.openshell.config.command`)
- Tài khoản OpenShell có quyền truy cập sandbox
- OpenClaw Gateway đang chạy trên máy chủ

## Bắt đầu nhanh

1. Kích hoạt plugin và thiết lập backend sandbox:

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

2. Khởi động lại Gateway. Ở lần chạy tiếp theo của agent, OpenClaw sẽ tạo một sandbox OpenShell và định tuyến việc thực thi công cụ qua đó.

3. Kiểm tra:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Chế độ Workspace

Đây là quyết định quan trọng nhất khi sử dụng OpenShell.

### `mirror`

Sử dụng `plugins.entries.openshell.config.mode: "mirror"` khi bạn muốn **workspace cục bộ là nguồn chính**.

Hành vi:

- Trước khi `exec`, OpenClaw đồng bộ workspace cục bộ vào sandbox OpenShell.
- Sau khi `exec`, OpenClaw đồng bộ workspace từ xa trở lại workspace cục bộ.
- Các công cụ tệp vẫn hoạt động qua cầu nối sandbox, nhưng workspace cục bộ vẫn là nguồn chính giữa các lần chạy.

Phù hợp nhất cho:

- Bạn chỉnh sửa tệp cục bộ ngoài OpenClaw và muốn những thay đổi đó tự động hiển thị trong sandbox.
- Bạn muốn sandbox OpenShell hoạt động giống như backend Docker nhất có thể.
- Bạn muốn workspace trên máy chủ phản ánh các ghi chép trong sandbox sau mỗi lần thực thi.

Đánh đổi: chi phí đồng bộ thêm trước và sau mỗi lần thực thi.

### `remote`

Sử dụng `plugins.entries.openshell.config.mode: "remote"` khi bạn muốn **workspace OpenShell trở thành nguồn chính**.

Hành vi:

- Khi sandbox được tạo lần đầu, OpenClaw sẽ khởi tạo workspace từ xa từ workspace cục bộ một lần.
- Sau đó, `exec`, `read`, `write`, `edit`, và `apply_patch` hoạt động trực tiếp trên workspace OpenShell từ xa.
- OpenClaw **không** đồng bộ các thay đổi từ xa trở lại workspace cục bộ.
- Đọc media khi nhắc vẫn hoạt động vì các công cụ tệp và media đọc qua cầu nối sandbox.

Phù hợp nhất cho:

- Sandbox nên tồn tại chủ yếu ở phía từ xa.
- Bạn muốn giảm chi phí đồng bộ cho mỗi lần chạy.
- Bạn không muốn các chỉnh sửa cục bộ trên máy chủ ghi đè trạng thái sandbox từ xa một cách âm thầm.

Quan trọng: nếu bạn chỉnh sửa tệp trên máy chủ ngoài OpenClaw sau khi khởi tạo ban đầu, sandbox từ xa **không** thấy những thay đổi đó. Sử dụng `openclaw sandbox recreate` để khởi tạo lại.

### Chọn chế độ

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Workspace chính**      | Máy chủ cục bộ             | OpenShell từ xa           |
| **Hướng đồng bộ**        | Hai chiều (mỗi lần exec)   | Khởi tạo một lần          |
| **Chi phí mỗi lần chạy** | Cao hơn (tải lên + tải về) | Thấp hơn (thao tác từ xa) |
| **Chỉnh sửa cục bộ thấy được?** | Có, ở lần exec tiếp theo | Không, cho đến khi khởi tạo lại |
| **Phù hợp nhất cho**     | Quy trình phát triển       | Agent chạy dài, CI        |

## Tham khảo cấu hình

Tất cả cấu hình OpenShell nằm dưới `plugins.entries.openshell.config`:

| Key                       | Type                     | Default       | Description                                           |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` or `"remote"` | `"mirror"`    | Chế độ đồng bộ workspace                               |
| `command`                 | `string`                 | `"openshell"` | Đường dẫn hoặc tên của CLI `openshell`                 |
| `from`                    | `string`                 | `"openclaw"`  | Nguồn sandbox cho lần tạo đầu tiên                     |
| `gateway`                 | `string`                 | —             | Tên gateway OpenShell (`--gateway`)                    |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint gateway OpenShell (`--gateway-endpoint`)  |
| `policy`                  | `string`                 | —             | ID chính sách OpenShell cho việc tạo sandbox           |
| `providers`               | `string[]`               | `[]`          | Tên nhà cung cấp để đính kèm khi tạo sandbox           |
| `gpu`                     | `boolean`                | `false`       | Yêu cầu tài nguyên GPU                                  |
| `autoProviders`           | `boolean`                | `true`        | Truyền `--auto-providers` trong quá trình tạo sandbox   |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Workspace chính có thể ghi bên trong sandbox           |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Đường dẫn mount workspace agent (cho truy cập chỉ đọc) |
| `timeoutSeconds`          | `number`                 | `120`         | Thời gian chờ cho các thao tác CLI `openshell`         |

Các thiết lập cấp sandbox (`mode`, `scope`, `workspaceAccess`) được cấu hình dưới `agents.defaults.sandbox` như với bất kỳ backend nào. Xem [Sandboxing](/gateway/sandboxing) để biết ma trận đầy đủ.

## Ví dụ

### Thiết lập từ xa tối thiểu

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

Các sandbox OpenShell được quản lý thông qua CLI sandbox thông thường:

```bash
# Liệt kê tất cả các runtime sandbox (Docker + OpenShell)
openclaw sandbox list

# Kiểm tra chính sách hiệu lực
openclaw sandbox explain

# Tạo lại (xóa workspace từ xa, khởi tạo lại khi sử dụng tiếp theo)
openclaw sandbox recreate --all
```

Đối với chế độ `remote`, **tạo lại đặc biệt quan trọng**: nó xóa workspace từ xa chính cho phạm vi đó. Lần sử dụng tiếp theo sẽ khởi tạo một workspace từ xa mới từ workspace cục bộ.

Đối với chế độ `mirror`, tạo lại chủ yếu đặt lại môi trường thực thi từ xa vì workspace cục bộ vẫn là nguồn chính.

### Khi nào cần tạo lại

Tạo lại sau khi thay đổi bất kỳ điều nào sau đây:

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
- Các nút điều chỉnh runtime đặc thù của Docker dưới `sandbox.docker.*` chỉ áp dụng cho backend Docker.

## Cách hoạt động

1. OpenClaw gọi `openshell sandbox create` (với các cờ `--from`, `--gateway`, `--policy`, `--providers`, `--gpu` như đã cấu hình).
2. OpenClaw gọi `openshell sandbox ssh-config <name>` để lấy thông tin kết nối SSH cho sandbox.
3. Core ghi cấu hình SSH vào một tệp tạm thời và mở một phiên SSH sử dụng cùng cầu nối hệ thống tệp từ xa như backend SSH chung.
4. Trong chế độ `mirror`: đồng bộ từ cục bộ đến từ xa trước khi thực thi, chạy, đồng bộ lại sau khi thực thi.
5. Trong chế độ `remote`: khởi tạo một lần khi tạo, sau đó thao tác trực tiếp trên workspace từ xa.

## Xem thêm

- [Sandboxing](/gateway/sandboxing) -- các chế độ, phạm vi, và so sánh backend
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- gỡ lỗi công cụ bị chặn
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- ghi đè cho từng agent
- [Sandbox CLI](/cli/sandbox) -- các lệnh `openclaw sandbox`
