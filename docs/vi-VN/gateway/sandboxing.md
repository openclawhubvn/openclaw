---
summary: "Cách hoạt động của sandboxing trong OpenClaw: chế độ, phạm vi, quyền truy cập workspace và hình ảnh"
title: Sandboxing
read_when: "Bạn cần giải thích chi tiết về sandboxing hoặc cần điều chỉnh agents.defaults.sandbox."
status: active
---

# Sandboxing

OpenClaw có thể chạy **công cụ bên trong sandbox backend** để giảm thiểu rủi ro. Đây là tính năng **tùy chọn** và được kiểm soát qua cấu hình (`agents.defaults.sandbox` hoặc `agents.list[].sandbox`). Nếu sandboxing bị tắt, công cụ sẽ chạy trên host. Gateway vẫn ở trên host; khi bật, việc thực thi công cụ sẽ diễn ra trong một sandbox cách ly.

Đây không phải là một ranh giới bảo mật hoàn hảo, nhưng nó giới hạn đáng kể quyền truy cập vào hệ thống tệp và quy trình khi mô hình thực hiện điều gì đó không đúng.

## Những gì được sandbox

- Thực thi công cụ (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, v.v.).
- Trình duyệt sandbox tùy chọn (`agents.defaults.sandbox.browser`).
  - Mặc định, trình duyệt sandbox tự động khởi động (đảm bảo CDP có thể truy cập) khi công cụ trình duyệt cần. Cấu hình qua `agents.defaults.sandbox.browser.autoStart` và `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Mặc định, các container trình duyệt sandbox sử dụng một mạng Docker riêng biệt (`openclaw-sandbox-browser`) thay vì mạng `bridge` toàn cầu. Cấu hình với `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` tùy chọn giới hạn CDP ingress ở cạnh container với danh sách cho phép CIDR (ví dụ `172.21.0.1/32`).
  - Quyền truy cập noVNC observer được bảo vệ bằng mật khẩu mặc định; OpenClaw phát ra một URL token ngắn hạn phục vụ một trang bootstrap cục bộ và mở noVNC với mật khẩu trong đoạn URL (không phải query/header logs).
  - `agents.defaults.sandbox.browser.allowHostControl` cho phép các phiên sandbox nhắm mục tiêu trình duyệt host một cách rõ ràng.
  - Danh sách cho phép tùy chọn kiểm soát `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Không được sandbox:

- Quá trình Gateway.
- Bất kỳ công cụ nào được phép chạy trên host (ví dụ: `tools.elevated`).
  - **Thực thi nâng cao chạy trên host và bỏ qua sandboxing.**
  - Nếu sandboxing bị tắt, `tools.elevated` không thay đổi việc thực thi (đã trên host). Xem [Elevated Mode](/tools/elevated).

## Chế độ

`agents.defaults.sandbox.mode` kiểm soát **khi nào** sandboxing được sử dụng:

- `"off"`: không có sandboxing.
- `"non-main"`: chỉ sandbox các phiên **không chính** (mặc định nếu bạn muốn các cuộc trò chuyện bình thường trên host).
- `"all"`: mọi phiên đều chạy trong một sandbox.
  Lưu ý: `"non-main"` dựa trên `session.mainKey` (mặc định `"main"`), không phải id agent.
  Các phiên nhóm/kênh sử dụng khóa riêng của chúng, vì vậy chúng được tính là không chính và sẽ được sandbox.

## Phạm vi

`agents.defaults.sandbox.scope` kiểm soát **số lượng container** được tạo:

- `"session"` (mặc định): một container cho mỗi phiên.
- `"agent"`: một container cho mỗi agent.
- `"shared"`: một container được chia sẻ bởi tất cả các phiên sandboxed.

## Backend

`agents.defaults.sandbox.backend` kiểm soát **runtime nào** cung cấp sandbox:

- `"docker"` (mặc định): runtime sandbox dựa trên Docker cục bộ.
- `"ssh"`: runtime sandbox từ xa dựa trên SSH.
- `"openshell"`: runtime sandbox dựa trên OpenShell.

Cấu hình cụ thể cho SSH nằm dưới `agents.defaults.sandbox.ssh`.
Cấu hình cụ thể cho OpenShell nằm dưới `plugins.entries.openshell.config`.

### Chọn backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Nơi chạy**        | Container cục bộ                 | Bất kỳ host nào có thể truy cập SSH | Sandbox được quản lý bởi OpenShell                  |
| **Thiết lập**       | `scripts/sandbox-setup.sh`       | Khóa SSH + host mục tiêu       | Plugin OpenShell được bật                           |
| **Mô hình workspace** | Bind-mount hoặc copy            | Remote-canonical (seed một lần) | `mirror` hoặc `remote`                              |
| **Kiểm soát mạng**  | `docker.network` (mặc định: không có) | Phụ thuộc vào host từ xa       | Phụ thuộc vào OpenShell                             |
| **Trình duyệt sandbox** | Được hỗ trợ                   | Không được hỗ trợ              | Chưa được hỗ trợ                                    |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Tốt nhất cho**    | Phát triển cục bộ, cách ly hoàn toàn | Chuyển tải sang máy từ xa      | Sandboxes từ xa được quản lý với đồng bộ hai chiều tùy chọn |

### Backend SSH

Sử dụng `backend: "ssh"` khi bạn muốn OpenClaw sandbox `exec`, công cụ tệp, và đọc media trên một máy có thể truy cập SSH bất kỳ.

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
          // Hoặc sử dụng SecretRefs / nội dung inline thay vì tệp cục bộ:
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

- OpenClaw tạo một root từ xa theo phạm vi dưới `sandbox.ssh.workspaceRoot`.
- Lần đầu sử dụng sau khi tạo hoặc tạo lại, OpenClaw seed workspace từ xa đó từ workspace cục bộ một lần.
- Sau đó, `exec`, `read`, `write`, `edit`, `apply_patch`, đọc media nhắc nhở, và dàn dựng media inbound chạy trực tiếp chống lại workspace từ xa qua SSH.
- OpenClaw không tự động đồng bộ hóa các thay đổi từ xa trở lại workspace cục bộ.

Vật liệu xác thực:

- `identityFile`, `certificateFile`, `knownHostsFile`: sử dụng các tệp cục bộ hiện có và truyền chúng qua cấu hình OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: sử dụng chuỗi inline hoặc SecretRefs. OpenClaw giải quyết chúng thông qua snapshot runtime bí mật thông thường, ghi chúng vào tệp tạm thời với `0600`, và xóa chúng khi phiên SSH kết thúc.
- Nếu cả `*File` và `*Data` đều được đặt cho cùng một mục, `*Data` sẽ thắng cho phiên SSH đó.

Đây là mô hình **remote-canonical**. Workspace SSH từ xa trở thành trạng thái sandbox thực sau khi seed ban đầu.

Hậu quả quan trọng:

- Các chỉnh sửa cục bộ trên host được thực hiện bên ngoài OpenClaw sau bước seed không được nhìn thấy từ xa cho đến khi bạn tạo lại sandbox.
- `openclaw sandbox recreate` xóa root từ xa theo phạm vi và seed lại từ cục bộ khi sử dụng lần tiếp theo.
- Trình duyệt sandbox không được hỗ trợ trên backend SSH.
- Các cài đặt `sandbox.docker.*` không áp dụng cho backend SSH.

### Backend OpenShell

Sử dụng `backend: "openshell"` khi bạn muốn OpenClaw sandbox công cụ trong một môi trường từ xa được quản lý bởi OpenShell. Để có hướng dẫn thiết lập đầy đủ, tham khảo cấu hình và so sánh chế độ workspace, xem trang [OpenShell](/gateway/openshell).

OpenShell tái sử dụng cùng một cầu nối hệ thống tệp từ xa và truyền tải SSH cốt lõi như backend SSH chung, và thêm vòng đời cụ thể của OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) cùng với chế độ workspace `mirror` tùy chọn.

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

Các chế độ OpenShell:

- `mirror` (mặc định): workspace cục bộ vẫn là nguồn chính. OpenClaw đồng bộ hóa các tệp cục bộ vào sandbox OpenShell trước khi thực thi và đồng bộ hóa workspace từ xa trở lại sau khi thực thi.
- `remote`: workspace OpenShell là nguồn chính sau khi sandbox được tạo. OpenClaw seed workspace từ xa một lần từ workspace cục bộ, sau đó các công cụ tệp và thực thi chạy trực tiếp chống lại sandbox từ xa mà không đồng bộ hóa các thay đổi trở lại.

Chi tiết truyền tải từ xa:

- OpenClaw yêu cầu OpenShell cung cấp cấu hình SSH cụ thể cho sandbox qua `openshell sandbox ssh-config <name>`.
- Core ghi cấu hình SSH đó vào một tệp tạm thời, mở phiên SSH, và tái sử dụng cùng cầu nối hệ thống tệp từ xa được sử dụng bởi `backend: "ssh"`.
- Chỉ trong chế độ `mirror`, vòng đời khác biệt: đồng bộ hóa cục bộ với từ xa trước khi thực thi, sau đó đồng bộ hóa trở lại sau khi thực thi.

Hạn chế hiện tại của OpenShell:

- Trình duyệt sandbox chưa được hỗ trợ
- `sandbox.docker.binds` không được hỗ trợ trên backend OpenShell
- Các nút runtime cụ thể của Docker dưới `sandbox.docker.*` vẫn chỉ áp dụng cho backend Docker

#### Các chế độ workspace

OpenShell có hai mô hình workspace. Đây là phần quan trọng nhất trong thực tế.

##### `mirror`

Sử dụng `plugins.entries.openshell.config.mode: "mirror"` khi bạn muốn **workspace cục bộ vẫn là nguồn chính**.

Hành vi:

- Trước khi `exec`, OpenClaw đồng bộ hóa workspace cục bộ vào sandbox OpenShell.
- Sau khi `exec`, OpenClaw đồng bộ hóa workspace từ xa trở lại workspace cục bộ.
- Các công cụ tệp vẫn hoạt động thông qua cầu nối sandbox, nhưng workspace cục bộ vẫn là nguồn sự thật giữa các lượt.

Sử dụng khi:

- bạn chỉnh sửa tệp cục bộ bên ngoài OpenClaw và muốn những thay đổi đó xuất hiện trong sandbox tự động
- bạn muốn sandbox OpenShell hoạt động giống như backend Docker nhất có thể
- bạn muốn workspace host phản ánh các ghi chép sandbox sau mỗi lượt thực thi

Đánh đổi:

- chi phí đồng bộ hóa bổ sung trước và sau khi thực thi

##### `remote`

Sử dụng `plugins.entries.openshell.config.mode: "remote"` khi bạn muốn **workspace OpenShell trở thành nguồn chính**.

Hành vi:

- Khi sandbox được tạo lần đầu, OpenClaw seed workspace từ xa từ workspace cục bộ một lần.
- Sau đó, `exec`, `read`, `write`, `edit`, và `apply_patch` hoạt động trực tiếp chống lại workspace OpenShell từ xa.
- OpenClaw **không** đồng bộ hóa các thay đổi từ xa trở lại workspace cục bộ sau khi thực thi.
- Đọc media nhắc nhở vẫn hoạt động vì các công cụ tệp và media đọc thông qua cầu nối sandbox thay vì giả định một đường dẫn host cục bộ.
- Truyền tải là SSH vào sandbox OpenShell được trả về bởi `openshell sandbox ssh-config`.

Hậu quả quan trọng:

- Nếu bạn chỉnh sửa tệp trên host bên ngoài OpenClaw sau bước seed, sandbox từ xa sẽ **không** thấy những thay đổi đó tự động.
- Nếu sandbox được tạo lại, workspace từ xa được seed lại từ workspace cục bộ.
- Với `scope: "agent"` hoặc `scope: "shared"`, workspace từ xa đó được chia sẻ ở cùng phạm vi đó.

Sử dụng khi:

- sandbox nên sống chủ yếu ở phía OpenShell từ xa
- bạn muốn giảm chi phí đồng bộ hóa mỗi lượt
- bạn không muốn các chỉnh sửa cục bộ trên host ghi đè trạng thái sandbox từ xa một cách âm thầm

Chọn `mirror` nếu bạn nghĩ sandbox như một môi trường thực thi tạm thời.
Chọn `remote` nếu bạn nghĩ sandbox như workspace thực sự.

#### Vòng đời OpenShell

Các sandbox OpenShell vẫn được quản lý thông qua vòng đời sandbox thông thường:

- `openclaw sandbox list` hiển thị cả runtime OpenShell và runtime Docker
- `openclaw sandbox recreate` xóa runtime hiện tại và cho phép OpenClaw tạo lại nó khi sử dụng lần tiếp theo
- logic prune cũng nhận biết backend

Đối với chế độ `remote`, tạo lại đặc biệt quan trọng:

- tạo lại xóa workspace từ xa chính cho phạm vi đó
- lần sử dụng tiếp theo seed một workspace từ xa mới từ workspace cục bộ

Đối với chế độ `mirror`, tạo lại chủ yếu đặt lại môi trường thực thi từ xa
vì workspace cục bộ vẫn là nguồn chính dù sao đi nữa.

## Quyền truy cập workspace

`agents.defaults.sandbox.workspaceAccess` kiểm soát **những gì sandbox có thể thấy**:

- `"none"` (mặc định): công cụ thấy một workspace sandbox dưới `~/.openclaw/sandboxes`.
- `"ro"`: gắn workspace agent chỉ đọc tại `/agent` (vô hiệu hóa `write`/`edit`/`apply_patch`).
- `"rw"`: gắn workspace agent đọc/ghi tại `/workspace`.

Với backend OpenShell:

- chế độ `mirror` vẫn sử dụng workspace cục bộ làm nguồn chính giữa các lượt thực thi
- chế độ `remote` sử dụng workspace OpenShell từ xa làm nguồn chính sau seed ban đầu
- `workspaceAccess: "ro"` và `"none"` vẫn hạn chế hành vi ghi chép theo cùng cách

Media inbound được sao chép vào workspace sandbox đang hoạt động (`media/inbound/*`).
Lưu ý kỹ năng: công cụ `read` được gốc sandbox. Với `workspaceAccess: "none"`,
OpenClaw phản chiếu các kỹ năng đủ điều kiện vào workspace sandbox (`.../skills`) để
chúng có thể được đọc. Với `"rw"`, các kỹ năng workspace có thể đọc từ
`/workspace/skills`.

## Bind mounts tùy chỉnh

`agents.defaults.sandbox.docker.binds` gắn thêm các thư mục host vào container.
Định dạng: `host:container:mode` (ví dụ, `"/home/user/source:/source:rw"`).

Bind toàn cầu và theo agent được **hợp nhất** (không thay thế). Dưới `scope: "shared"`, bind theo agent bị bỏ qua.

`agents.defaults.sandbox.browser.binds` gắn thêm các thư mục host vào chỉ container trình duyệt sandbox.

- Khi được đặt (bao gồm `[]`), nó thay thế `agents.defaults.sandbox.docker.binds` cho container trình duyệt.
- Khi bị bỏ qua, container trình duyệt quay lại `agents.defaults.sandbox.docker.binds` (tương thích ngược).

Ví dụ (nguồn chỉ đọc + một thư mục dữ liệu bổ sung):

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

Lưu ý bảo mật:

- Bind bỏ qua hệ thống tệp sandbox: chúng lộ ra các đường dẫn host với bất kỳ chế độ nào bạn đặt (`:ro` hoặc `:rw`).
- OpenClaw chặn các nguồn bind nguy hiểm (ví dụ: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, và các mount cha mẹ sẽ lộ ra chúng).
- Các mount nhạy cảm (bí mật, khóa SSH, thông tin xác thực dịch vụ) nên là `:ro` trừ khi thực sự cần thiết.
- Kết hợp với `workspaceAccess: "ro"` nếu bạn chỉ cần quyền đọc truy cập vào workspace; chế độ bind vẫn độc lập.
- Xem [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) để biết cách bind tương tác với chính sách công cụ và thực thi nâng cao.

## Hình ảnh + thiết lập

Hình ảnh Docker mặc định: `openclaw-sandbox:bookworm-slim`

Xây dựng một lần:

```bash
scripts/sandbox-setup.sh
```

Lưu ý: hình ảnh mặc định **không** bao gồm Node. Nếu một kỹ năng cần Node (hoặc các runtime khác), hãy tạo một hình ảnh tùy chỉnh hoặc cài đặt qua
`sandbox.docker.setupCommand` (yêu cầu egress mạng + root có thể ghi + người dùng root).

Nếu bạn muốn một hình ảnh sandbox chức năng hơn với các công cụ phổ biến (ví dụ
`curl`, `jq`, `nodejs`, `python3`, `git`), xây dựng:

```bash
scripts/sandbox-common-setup.sh
```

Sau đó đặt `agents.defaults.sandbox.docker.image` thành
`openclaw-sandbox-common:bookworm-slim`.

Hình ảnh trình duyệt sandbox:

```bash
scripts/sandbox-browser-setup.sh
```

Mặc định, các container sandbox Docker chạy **không có mạng**.
Ghi đè với `agents.defaults.sandbox.docker.network`.

Hình ảnh trình duyệt sandbox đi kèm cũng áp dụng các mặc định khởi động Chromium bảo thủ
cho khối lượng công việc container hóa. Các mặc định container hiện tại bao gồm:

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
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` cho các luồng phụ thuộc vào tiện ích mở rộng.
- `--renderer-process-limit=2` được kiểm soát bởi
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, nơi `0` giữ mặc định của Chromium.

Nếu bạn cần một hồ sơ runtime khác, sử dụng một hình ảnh trình duyệt tùy chỉnh và cung cấp
entrypoint của riêng bạn. Đối với hồ sơ Chromium cục bộ (không container), sử dụng
`browser.extraArgs` để thêm các cờ khởi động bổ sung.

Mặc định bảo mật:

- `network: "host"` bị chặn.
- `network: "container:<id>"` bị chặn mặc định (rủi ro bỏ qua namespace join).
- Ghi đè khẩn cấp: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Cài đặt Docker và gateway container hóa sống ở đây:
[Docker](/install/docker)

Đối với triển khai gateway Docker, `scripts/docker/setup.sh` có thể bootstrap cấu hình sandbox.
Đặt `OPENCLAW_SANDBOX=1` (hoặc `true`/`yes`/`on`) để kích hoạt đường dẫn đó. Bạn có thể
ghi đè vị trí socket với `OPENCLAW_DOCKER_SOCKET`. Thiết lập đầy đủ và tham khảo môi trường: [Docker](/install/docker#enable-agent-sandbox-for-docker-gateway-opt-in).

## setupCommand (thiết lập container một lần)

`setupCommand` chạy **một lần** sau khi container sandbox được tạo (không phải mỗi lần chạy).
Nó thực thi bên trong container qua `sh -lc`.

Đường dẫn:

- Toàn cầu: `agents.defaults.sandbox.docker.setupCommand`
- Theo agent: `agents.list[].sandbox.docker.setupCommand`

Các lỗi phổ biến:

- Mặc định `docker.network` là `"none"` (không có egress), vì vậy cài đặt gói sẽ thất bại.
- `docker.network: "container:<id>"` yêu cầu `dangerouslyAllowContainerNamespaceJoin: true` và chỉ là ghi đè khẩn cấp.
- `readOnlyRoot: true` ngăn chặn ghi; đặt `readOnlyRoot: false` hoặc tạo một hình ảnh tùy chỉnh.
- `user` phải là root để cài đặt gói (bỏ qua `user` hoặc đặt `user: "0:0"`).
- Thực thi sandbox **không** kế thừa `process.env` của host. Sử dụng
  `agents.defaults.sandbox.docker.env` (hoặc một hình ảnh tùy chỉnh) cho các khóa API kỹ năng.

## Chính sách công cụ + lối thoát

Chính sách cho phép/từ chối công cụ vẫn áp dụng trước các quy tắc sandbox. Nếu một công cụ bị từ chối
toàn cầu hoặc theo agent, sandboxing không mang nó trở lại.

`tools.elevated` là một lối thoát rõ ràng chạy `exec` trên host.
Chỉ thị `/exec` chỉ áp dụng cho các sender được ủy quyền và tồn tại theo phiên; để vô hiệu hóa
`exec`, sử dụng từ chối chính sách công cụ (xem [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)).

Gỡ lỗi:

- Sử dụng `openclaw sandbox explain` để kiểm tra chế độ sandbox hiệu quả, chính sách công cụ, và các khóa cấu hình sửa chữa.
- Xem [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) để có mô hình tư duy "tại sao điều này bị chặn?".
  Giữ nó bị khóa.

## Ghi đè nhiều agent

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
- [Security](/gateway/security)
