---
summary: "Cách hoạt động của sandboxing trong OpenClaw: chế độ, phạm vi, quyền truy cập workspace và hình ảnh"
title: Sandboxing
read_when: "Cần giải thích chi tiết về sandboxing hoặc cần tinh chỉnh agents.defaults.sandbox."
status: active
---

# Sandboxing

OpenClaw có thể chạy **công cụ trong sandbox backend** để giảm thiểu rủi ro. Tính năng này **không bắt buộc** và được điều khiển qua cấu hình (`agents.defaults.sandbox` hoặc `agents.list[].sandbox`). Nếu tắt sandboxing, công cụ sẽ chạy trên host. Gateway vẫn ở trên host; khi bật, công cụ sẽ chạy trong sandbox cách ly.

Sandboxing không phải là ranh giới bảo mật hoàn hảo, nhưng nó giới hạn đáng kể quyền truy cập vào filesystem và process khi model gặp lỗi.

## Những gì được sandbox

- Thực thi công cụ (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, v.v.).
- Trình duyệt sandbox tùy chọn (`agents.defaults.sandbox.browser`).
  - Mặc định, trình duyệt sandbox tự khởi động (đảm bảo CDP có thể truy cập) khi công cụ trình duyệt cần. Cấu hình qua `agents.defaults.sandbox.browser.autoStart` và `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Mặc định, container trình duyệt sandbox sử dụng mạng Docker riêng (`openclaw-sandbox-browser`) thay vì mạng `bridge` toàn cầu. Cấu hình với `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` tùy chọn giới hạn CDP ingress container-edge với danh sách CIDR cho phép (ví dụ `172.21.0.1/32`).
  - Truy cập noVNC observer được bảo vệ bằng mật khẩu mặc định; OpenClaw phát hành URL token ngắn hạn phục vụ trang bootstrap local và mở noVNC với mật khẩu trong URL fragment (không phải query/header logs).
  - `agents.defaults.sandbox.browser.allowHostControl` cho phép session sandbox nhắm mục tiêu trình duyệt host rõ ràng.
  - Danh sách cho phép tùy chọn chặn `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Không được sandbox:

- Quá trình Gateway.
- Bất kỳ công cụ nào được phép chạy trên host (ví dụ: `tools.elevated`).
  - **Elevated exec chạy trên host và bỏ qua sandboxing.**
  - Nếu tắt sandboxing, `tools.elevated` không thay đổi cách thực thi (đã trên host). Xem [Elevated Mode](/tools/elevated).

## Chế độ

`agents.defaults.sandbox.mode` điều khiển **khi nào** sử dụng sandboxing:

- `"off"`: không sandboxing.
- `"non-main"`: chỉ sandbox **non-main** sessions (mặc định nếu muốn chat bình thường trên host).
- `"all"`: mọi session chạy trong sandbox.
  Lưu ý: `"non-main"` dựa trên `session.mainKey` (mặc định `"main"`), không phải agent id.
  Group/channel sessions sử dụng key riêng, nên được tính là non-main và sẽ được sandbox.

## Phạm vi

`agents.defaults.sandbox.scope` điều khiển **số lượng container** được tạo:

- `"session"` (mặc định): một container cho mỗi session.
- `"agent"`: một container cho mỗi agent.
- `"shared"`: một container được chia sẻ bởi tất cả các session sandboxed.

## Backend

`agents.defaults.sandbox.backend` điều khiển **runtime nào** cung cấp sandbox:

- `"docker"` (mặc định): runtime sandbox dựa trên Docker local.
- `"ssh"`: runtime sandbox từ xa dựa trên SSH.
- `"openshell"`: runtime sandbox dựa trên OpenShell.

Cấu hình SSH cụ thể nằm dưới `agents.defaults.sandbox.ssh`.
Cấu hình OpenShell cụ thể nằm dưới `plugins.entries.openshell.config`.

### Chọn backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Chạy ở đâu**      | Container local                  | Bất kỳ host nào có thể truy cập SSH | Sandbox được quản lý bởi OpenShell                  |
| **Thiết lập**       | `scripts/sandbox-setup.sh`       | SSH key + host mục tiêu        | Plugin OpenShell được bật                           |
| **Mô hình Workspace** | Bind-mount hoặc copy            | Remote-canonical (seed một lần) | `mirror` hoặc `remote`                              |
| **Kiểm soát mạng**  | `docker.network` (mặc định: không) | Phụ thuộc vào host từ xa       | Phụ thuộc vào OpenShell                             |
| **Sandbox trình duyệt** | Hỗ trợ                        | Không hỗ trợ                   | Chưa hỗ trợ                                         |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Tốt nhất cho**    | Dev local, cách ly hoàn toàn     | Chuyển tải sang máy từ xa      | Sandbox từ xa được quản lý với đồng bộ hai chiều tùy chọn |

### Backend SSH

Dùng `backend: "ssh"` khi muốn OpenClaw sandbox `exec`, công cụ file, và đọc media trên máy bất kỳ có thể truy cập SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Hoặc dùng SecretRefs / nội dung inline thay vì file local:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Cách hoạt động:

- OpenClaw tạo một remote root theo phạm vi dưới `sandbox.ssh.workspaceRoot`.
- Lần đầu sử dụng sau khi tạo hoặc tái tạo, OpenClaw seed workspace từ xa từ workspace local một lần.
- Sau đó, `exec`, `read`, `write`, `edit`, `apply_patch`, đọc media prompt, và staging media inbound chạy trực tiếp trên workspace từ xa qua SSH.
- OpenClaw không đồng bộ thay đổi từ xa về workspace local tự động.

Vật liệu xác thực:

- `identityFile`, `certificateFile`, `knownHostsFile`: sử dụng file local hiện có và truyền qua cấu hình OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: sử dụng chuỗi inline hoặc SecretRefs. OpenClaw giải quyết chúng qua snapshot runtime secrets bình thường, ghi chúng vào file tạm với `0600`, và xóa chúng khi session SSH kết thúc.
- Nếu cả `*File` và `*Data` được đặt cho cùng một mục, `*Data` sẽ thắng cho session SSH đó.

Đây là mô hình **remote-canonical**. Workspace SSH từ xa trở thành trạng thái sandbox thực sau khi seed ban đầu.

Hệ quả quan trọng:

- Chỉnh sửa host-local thực hiện ngoài OpenClaw sau bước seed không hiển thị từ xa cho đến khi tái tạo sandbox.
- `openclaw sandbox recreate` xóa remote root theo phạm vi và seed lại từ local khi sử dụng lần tiếp theo.
- Sandbox trình duyệt không được hỗ trợ trên backend SSH.
- Cài đặt `sandbox.docker.*` không áp dụng cho backend SSH.

### Backend OpenShell

Dùng `backend: "openshell"` khi muốn OpenClaw sandbox công cụ trong môi trường từ xa được quản lý bởi OpenShell. Để có hướng dẫn thiết lập đầy đủ, tham khảo cấu hình và so sánh chế độ workspace, xem trang [OpenShell](/gateway/openshell).

OpenShell tái sử dụng cùng cầu nối SSH và filesystem từ xa như backend SSH chung, và thêm vòng đời cụ thể của OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) cùng chế độ workspace `mirror` tùy chọn.

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
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Chế độ OpenShell:

- `mirror` (mặc định): workspace local vẫn là nguồn chính. OpenClaw đồng bộ file local vào OpenShell trước khi exec và đồng bộ workspace từ xa trở lại sau khi exec.
- `remote`: workspace OpenShell là nguồn chính sau khi sandbox được tạo. OpenClaw seed workspace từ xa một lần từ workspace local, sau đó công cụ file và exec chạy trực tiếp trên sandbox từ xa mà không đồng bộ thay đổi trở lại.

Chi tiết vận chuyển từ xa:

- OpenClaw yêu cầu OpenShell cung cấp cấu hình SSH cụ thể cho sandbox qua `openshell sandbox ssh-config <name>`.
- Core ghi cấu hình SSH đó vào file tạm, mở session SSH, và tái sử dụng cùng cầu nối filesystem từ xa được sử dụng bởi `backend: "ssh"`.
- Trong chế độ `mirror`, chỉ vòng đời khác biệt: đồng bộ local sang từ xa trước khi exec, sau đó đồng bộ lại sau khi exec.

Hạn chế hiện tại của OpenShell:

- sandbox trình duyệt chưa được hỗ trợ
- `sandbox.docker.binds` không được hỗ trợ trên backend OpenShell
- Các nút runtime cụ thể của Docker dưới `sandbox.docker.*` vẫn chỉ áp dụng cho backend Docker

#### Chế độ Workspace

OpenShell có hai mô hình workspace. Đây là phần quan trọng nhất trong thực tế.

##### `mirror`

Dùng `plugins.entries.openshell.config.mode: "mirror"` khi muốn **workspace local vẫn là nguồn chính**.

Hành vi:

- Trước `exec`, OpenClaw đồng bộ workspace local vào sandbox OpenShell.
- Sau `exec`, OpenClaw đồng bộ workspace từ xa trở lại workspace local.
- Công cụ file vẫn hoạt động qua cầu nối sandbox, nhưng workspace local vẫn là nguồn sự thật giữa các lượt.

Dùng khi:

- bạn chỉnh sửa file local ngoài OpenClaw và muốn những thay đổi đó xuất hiện trong sandbox tự động
- bạn muốn sandbox OpenShell hoạt động giống như backend Docker nhất có thể
- bạn muốn workspace host phản ánh các ghi sandbox sau mỗi lượt exec

Đánh đổi:

- chi phí đồng bộ thêm trước và sau exec

##### `remote`

Dùng `plugins.entries.openshell.config.mode: "remote"` khi muốn **workspace OpenShell trở thành nguồn chính**.

Hành vi:

- Khi sandbox được tạo lần đầu, OpenClaw seed workspace từ xa từ workspace local một lần.
- Sau đó, `exec`, `read`, `write`, `edit`, và `apply_patch` hoạt động trực tiếp trên workspace OpenShell từ xa.
- OpenClaw **không** đồng bộ thay đổi từ xa trở lại workspace local sau exec.
- Đọc media prompt vẫn hoạt động vì công cụ file và media đọc qua cầu nối sandbox thay vì giả định đường dẫn host local.
- Vận chuyển là SSH vào sandbox OpenShell được trả về bởi `openshell sandbox ssh-config`.

Hệ quả quan trọng:

- Nếu bạn chỉnh sửa file trên host ngoài OpenClaw sau bước seed, sandbox từ xa sẽ **không** thấy những thay đổi đó tự động.
- Nếu sandbox được tái tạo, workspace từ xa được seed lại từ workspace local.
- Với `scope: "agent"` hoặc `scope: "shared"`, workspace từ xa đó được chia sẻ ở cùng phạm vi đó.

Dùng khi:

- sandbox nên sống chủ yếu ở phía OpenShell từ xa
- bạn muốn giảm chi phí đồng bộ mỗi lượt
- bạn không muốn chỉnh sửa host-local ghi đè trạng thái sandbox từ xa một cách âm thầm

Chọn `mirror` nếu bạn nghĩ sandbox như một môi trường thực thi tạm thời.
Chọn `remote` nếu bạn nghĩ sandbox như workspace thực sự.

#### Vòng đời OpenShell

Sandbox OpenShell vẫn được quản lý qua vòng đời sandbox bình thường:

- `openclaw sandbox list` hiển thị runtime OpenShell cũng như runtime Docker
- `openclaw sandbox recreate` xóa runtime hiện tại và cho phép OpenClaw tái tạo nó khi sử dụng lần tiếp theo
- logic prune cũng nhận biết backend

Đối với chế độ `remote`, tái tạo đặc biệt quan trọng:

- tái tạo xóa workspace từ xa chính cho phạm vi đó
- lần sử dụng tiếp theo seed một workspace từ xa mới từ workspace local

Đối với chế độ `mirror`, tái tạo chủ yếu đặt lại môi trường thực thi từ xa
vì workspace local vẫn là nguồn chính dù sao đi nữa.

## Quyền truy cập Workspace

`agents.defaults.sandbox.workspaceAccess` điều khiển **những gì sandbox có thể thấy**:

- `"none"` (mặc định): công cụ thấy một workspace sandbox dưới `~/.openclaw/sandboxes`.
- `"ro"`: mount workspace agent chỉ đọc tại `/agent` (vô hiệu hóa `write`/`edit`/`apply_patch`).
- `"rw"`: mount workspace agent đọc/ghi tại `/workspace`.

Với backend OpenShell:

- chế độ `mirror` vẫn sử dụng workspace local làm nguồn chính giữa các lượt exec
- chế độ `remote` sử dụng workspace OpenShell từ xa làm nguồn chính sau khi seed ban đầu
- `workspaceAccess: "ro"` và `"none"` vẫn hạn chế hành vi ghi theo cách tương tự

Media inbound được sao chép vào workspace sandbox đang hoạt động (`media/inbound/*`).
Kỹ năng lưu ý: công cụ `read` được sandbox-rooted. Với `workspaceAccess: "none"`,
OpenClaw phản chiếu các kỹ năng đủ điều kiện vào workspace sandbox (`.../skills`) để
chúng có thể được đọc. Với `"rw"`, kỹ năng workspace có thể đọc từ
`/workspace/skills`.

## Bind mounts tùy chỉnh

`agents.defaults.sandbox.docker.binds` mount thêm các thư mục host vào container.
Định dạng: `host:container:mode` (ví dụ, `"/home/user/source:/source:rw"`).

Bind toàn cầu và theo agent được **gộp** (không thay thế). Dưới `scope: "shared"`, bind theo agent bị bỏ qua.

`agents.defaults.sandbox.browser.binds` mount thêm các thư mục host vào container **sandbox browser** chỉ.

- Khi được đặt (bao gồm `[]`), nó thay thế `agents.defaults.sandbox.docker.binds` cho container browser.
- Khi bỏ qua, container browser quay lại `agents.defaults.sandbox.docker.binds` (tương thích ngược).

Ví dụ (source chỉ đọc + một thư mục dữ liệu bổ sung):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Ghi chú bảo mật:

- Bind bỏ qua filesystem sandbox: chúng lộ ra đường dẫn host với bất kỳ chế độ nào bạn đặt (`:ro` hoặc `:rw`).
- OpenClaw chặn các nguồn bind nguy hiểm (ví dụ: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, và các mount cha mẹ sẽ lộ ra chúng).
- Mount nhạy cảm (secrets, SSH keys, thông tin xác thực dịch vụ) nên là `:ro` trừ khi thực sự cần thiết.
- Kết hợp với `workspaceAccess: "ro"` nếu bạn chỉ cần quyền đọc vào workspace; chế độ bind vẫn độc lập.
- Xem [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) để biết cách bind tương tác với chính sách công cụ và exec nâng cao.

## Hình ảnh + thiết lập

Hình ảnh Docker mặc định: `openclaw-sandbox:bookworm-slim`

Build một lần:

```bash
scripts/sandbox-setup.sh
```

Lưu ý: hình ảnh mặc định **không** bao gồm Node. Nếu một kỹ năng cần Node (hoặc runtime khác), hoặc bake một hình ảnh tùy chỉnh hoặc cài đặt qua
`sandbox.docker.setupCommand` (yêu cầu egress mạng + root có thể ghi + người dùng root).

Nếu muốn một hình ảnh sandbox chức năng hơn với công cụ phổ biến (ví dụ
`curl`, `jq`, `nodejs`, `python3`, `git`), build:

```bash
scripts/sandbox-common-setup.sh
```

Sau đó đặt `agents.defaults.sandbox.docker.image` thành
`openclaw-sandbox-common:bookworm-slim`.

Hình ảnh sandboxed browser:

```bash
scripts/sandbox-browser-setup.sh
```

Mặc định, container sandbox Docker chạy với **không có mạng**.
Ghi đè với `agents.defaults.sandbox.docker.network`.

Hình ảnh sandbox browser đi kèm cũng áp dụng các mặc định khởi động Chromium bảo thủ
cho khối lượng công việc containerized. Các mặc định container hiện tại bao gồm:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` và `--disable-setuid-sandbox` khi `noSandbox` được bật.
- Ba cờ bảo vệ đồ họa (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) là tùy chọn và hữu ích
  khi container thiếu hỗ trợ GPU. Đặt `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  nếu khối lượng công việc của bạn yêu cầu WebGL hoặc các tính năng 3D/trình duyệt khác.
- `--disable-extensions` được bật mặc định và có thể bị vô hiệu hóa với
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` cho các luồng phụ thuộc vào extension.
- `--renderer-process-limit=2` được điều khiển bởi
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, nơi `0` giữ mặc định của Chromium.

Nếu cần một profile runtime khác, sử dụng hình ảnh browser tùy chỉnh và cung cấp
entrypoint của riêng bạn. Đối với profile Chromium local (không container), sử dụng
`browser.extraArgs` để thêm cờ khởi động bổ sung.

Mặc định bảo mật:

- `network: "host"` bị chặn.
- `network: "container:<id>"` bị chặn mặc định (rủi ro bypass namespace join).
- Ghi đè break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Cài đặt Docker và gateway containerized sống ở đây:
[Docker](/install/docker)

Đối với triển khai gateway Docker, `scripts/docker/setup.sh` có thể bootstrap cấu hình sandbox.
Đặt `OPENCLAW_SANDBOX=1` (hoặc `true`/`yes`/`on`) để bật đường dẫn đó. Bạn có thể
ghi đè vị trí socket với `OPENCLAW_DOCKER_SOCKET`. Thiết lập đầy đủ và tham khảo env:
[Docker](/install/docker#enable-agent-sandbox-for-docker-gateway-opt-in).

## setupCommand (thiết lập container một lần)

`setupCommand` chạy **một lần** sau khi container sandbox được tạo (không phải mỗi lần chạy).
Nó thực thi bên trong container qua `sh -lc`.

Đường dẫn:

- Toàn cầu: `agents.defaults.sandbox.docker.setupCommand`
- Theo agent: `agents.list[].sandbox.docker.setupCommand`

Những lỗi thường gặp:

- Mặc định `docker.network` là `"none"` (không có egress), nên cài đặt package sẽ thất bại.
- `docker.network: "container:<id>"` yêu cầu `dangerouslyAllowContainerNamespaceJoin: true` và chỉ là break-glass.
- `readOnlyRoot: true` ngăn chặn ghi; đặt `readOnlyRoot: false` hoặc bake một hình ảnh tùy chỉnh.
- `user` phải là root để cài đặt package (bỏ qua `user` hoặc đặt `user: "0:0"`).
- Exec sandbox **không** thừa kế `process.env` của host. Sử dụng
  `agents.defaults.sandbox.docker.env` (hoặc một hình ảnh tùy chỉnh) cho API key kỹ năng.

## Chính sách công cụ + escape hatches

Chính sách cho phép/từ chối công cụ vẫn áp dụng trước quy tắc sandbox. Nếu một công cụ bị từ chối
toàn cầu hoặc theo agent, sandboxing không mang nó trở lại.

`tools.elevated` là một escape hatch rõ ràng chạy `exec` trên host.
Chỉ thị `/exec` chỉ áp dụng cho người gửi được ủy quyền và tồn tại mỗi session; để vô hiệu hóa
`exec`, sử dụng chính sách công cụ deny (xem [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)).

Gỡ lỗi:

- Sử dụng `openclaw sandbox explain` để kiểm tra chế độ sandbox hiệu quả, chính sách công cụ, và fix-it config keys.
- Xem [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) để có mô hình tư duy "tại sao điều này bị chặn?".
  Giữ nó bị khóa.

## Ghi đè Multi-agent

Mỗi agent có thể ghi đè sandbox + công cụ:
`agents.list[].sandbox` và `agents.list[].tools` (cộng với `agents.list[].tools.sandbox.tools` cho chính sách công cụ sandbox).
Xem [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) để biết thứ tự ưu tiên.

## Ví dụ kích hoạt tối thiểu

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Tài liệu liên quan

- [OpenShell](/gateway/openshell) -- thiết lập backend sandbox được quản lý, chế độ workspace, và tham khảo cấu hình
- [Sandbox Configuration](/gateway/configuration-reference#agents-defaults-sandbox)
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- gỡ lỗi "tại sao điều này bị chặn?"
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- ghi đè theo agent và thứ tự ưu tiên
- [Security](/gateway/security)\n