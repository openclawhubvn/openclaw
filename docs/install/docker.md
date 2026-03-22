---
summary: "Thiết lập Docker cho OpenClaw dễ dàng với hướng dẫn chi tiết từng bước. Tối ưu hóa hệ thống của bạn ngay hôm nay."
read_when:
  - Bạn muốn một gateway dạng container thay vì cài đặt cục bộ
  - Bạn đang kiểm tra quy trình Docker
title: "Hướng Dẫn Cài Đặt Docker Cho OpenClaw"
---

# Docker (tùy chọn)

Docker là **tùy chọn**. Chỉ sử dụng nếu bạn muốn một gateway dạng container hoặc để kiểm tra quy trình Docker.

## Docker có phù hợp với bạn không?

- **Có**: nếu bạn muốn một môi trường gateway cô lập, có thể xóa bỏ hoặc chạy OpenClaw trên máy chủ mà không cần cài đặt cục bộ.
- **Không**: nếu bạn đang chạy trên máy của mình và chỉ muốn vòng lặp phát triển nhanh nhất. Thay vào đó, hãy sử dụng quy trình cài đặt thông thường.
- **Lưu ý về sandboxing**: sandboxing agent cũng sử dụng Docker, nhưng không yêu cầu toàn bộ gateway chạy trong Docker. Xem [Sandboxing](/gateway/sandboxing).

## Yêu cầu trước

- Docker Desktop (hoặc Docker Engine) + Docker Compose v2
- Ít nhất 2 GB RAM để build image (`pnpm install` có thể bị OOM-killed trên máy chủ 1 GB với exit 137)
- Đủ dung lượng đĩa cho image và log
- Nếu chạy trên VPS/máy chủ công cộng, hãy xem xét
  [Tăng cường bảo mật cho việc phơi bày mạng](/gateway/security#0-4-network-exposure-bind-port-firewall),
  đặc biệt là chính sách firewall `DOCKER-USER` của Docker.

## Gateway dạng Container

<Steps>
  <Step title="Build image">
    Từ thư mục gốc của repo, chạy script thiết lập:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Điều này sẽ build image gateway cục bộ. Để sử dụng image đã build sẵn:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Các image đã build sẵn được công bố tại
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Các tag phổ biến: `main`, `latest`, `<version>` (ví dụ: `2026.2.26`).

  </Step>

  <Step title="Hoàn tất onboarding">
    Script thiết lập sẽ tự động chạy onboarding. Nó sẽ:

    - yêu cầu khóa API của nhà cung cấp
    - tạo một token gateway và ghi vào `.env`
    - khởi động gateway qua Docker Compose

  </Step>

  <Step title="Mở Control UI">
    Mở `http://127.0.0.1:18789/` trong trình duyệt và dán token vào
    Settings.

    Cần URL một lần nữa?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Cấu hình kênh (tùy chọn)">
    Sử dụng container CLI để thêm các kênh nhắn tin:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Tài liệu: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord)

  </Step>
</Steps>

### Quy trình thủ công

Nếu bạn muốn tự chạy từng bước thay vì sử dụng script thiết lập:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

<Note>
Chạy `docker compose` từ thư mục gốc của repo. Nếu bạn đã bật `OPENCLAW_EXTRA_MOUNTS`
hoặc `OPENCLAW_HOME_VOLUME`, script thiết lập sẽ ghi `docker-compose.extra.yml`;
bao gồm nó với `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

### Biến môi trường

Script thiết lập chấp nhận các biến môi trường tùy chọn sau:

| Biến                           | Mục đích                                                          |
| ------------------------------ | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Sử dụng image từ xa thay vì build cục bộ                         |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Cài đặt thêm gói apt trong quá trình build (cách nhau bằng dấu cách) |
| `OPENCLAW_EXTENSIONS`          | Cài đặt trước các phụ thuộc extension khi build (tên cách nhau bằng dấu cách) |
| `OPENCLAW_EXTRA_MOUNTS`        | Mount bind thêm từ host (cách nhau bằng dấu phẩy `source:target[:opts]`)  |
| `OPENCLAW_HOME_VOLUME`         | Duy trì `/home/node` trong một volume Docker được đặt tên        |
| `OPENCLAW_SANDBOX`             | Chọn tham gia sandbox bootstrap (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_DOCKER_SOCKET`       | Ghi đè đường dẫn socket Docker                                   |

### Kiểm tra sức khỏe

Các endpoint kiểm tra container (không yêu cầu xác thực):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Image Docker bao gồm một `HEALTHCHECK` tích hợp sẵn ping `/healthz`.
Nếu các kiểm tra liên tục thất bại, Docker đánh dấu container là `unhealthy` và
các hệ thống điều phối có thể khởi động lại hoặc thay thế nó.

Ảnh chụp nhanh sức khỏe sâu có xác thực:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` mặc định `OPENCLAW_GATEWAY_BIND=lan` để truy cập host vào
`http://127.0.0.1:18789` hoạt động với việc xuất cổng Docker.

- `lan` (mặc định): trình duyệt host và CLI host có thể truy cập cổng gateway đã xuất bản.
- `loopback`: chỉ các tiến trình bên trong namespace mạng container có thể truy cập
  trực tiếp vào gateway.

<Note>
Sử dụng các giá trị chế độ bind trong `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), không sử dụng các alias host như `0.0.0.0` hoặc `127.0.0.1`.
</Note>

### Lưu trữ và duy trì

Docker Compose bind-mounts `OPENCLAW_CONFIG_DIR` vào `/home/node/.openclaw` và
`OPENCLAW_WORKSPACE_DIR` vào `/home/node/.openclaw/workspace`, vì vậy các đường dẫn đó
sẽ tồn tại sau khi thay thế container.

Để biết chi tiết đầy đủ về duy trì trên các triển khai VM, xem
[Docker VM Runtime - What persists where](/install/docker-vm-runtime#what-persists-where).

**Điểm nóng tăng trưởng đĩa:** theo dõi `media/`, các file JSONL phiên, `cron/runs/*.jsonl`,
và các log file cuộn dưới `/tmp/openclaw/`.

### Trợ giúp shell (tùy chọn)

Để quản lý Docker hàng ngày dễ dàng hơn, cài đặt `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/shell-helpers/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Sau đó sử dụng `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, v.v. Chạy
`clawdock-help` để xem tất cả các lệnh.
Xem [README Trợ giúp ClawDock](https://github.com/openclaw/openclaw/blob/main/scripts/shell-helpers/README.md).

<AccordionGroup>
  <Accordion title="Kích hoạt sandbox agent cho gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Đường dẫn socket tùy chỉnh (ví dụ: Docker không root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Script chỉ mount `docker.sock` sau khi các điều kiện tiên quyết của sandbox được đáp ứng. Nếu
    thiết lập sandbox không thể hoàn tất, script sẽ đặt lại `agents.defaults.sandbox.mode`
    thành `off`.

  </Accordion>

  <Accordion title="Tự động hóa / CI (không tương tác)">
    Vô hiệu hóa phân bổ pseudo-TTY của Compose với `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Lưu ý bảo mật mạng chia sẻ">
    `openclaw-cli` sử dụng `network_mode: "service:openclaw-gateway"` để các lệnh CLI
    có thể truy cập gateway qua `127.0.0.1`. Xem đây là một ranh giới tin cậy chia sẻ. Cấu hình compose loại bỏ `NET_RAW`/`NET_ADMIN` và bật
    `no-new-privileges` trên `openclaw-cli`.
  </Accordion>

  <Accordion title="Quyền và EACCES">
    Image chạy dưới dạng `node` (uid 1000). Nếu bạn thấy lỗi quyền trên
    `/home/node/.openclaw`, hãy đảm bảo các mount bind của host thuộc sở hữu của uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Tái build nhanh hơn">
    Sắp xếp Dockerfile của bạn để các lớp phụ thuộc được cache. Điều này tránh việc chạy lại
    `pnpm install` trừ khi các file lock thay đổi:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="Tùy chọn container cho người dùng chuyên nghiệp">
    Image mặc định ưu tiên bảo mật và chạy dưới dạng `node` không root. Để có một container đầy đủ tính năng hơn:

    1. **Duy trì `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Nướng các phụ thuộc hệ thống**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Cài đặt trình duyệt Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Duy trì tải xuống trình duyệt**: đặt
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` và sử dụng
       `OPENCLAW_HOME_VOLUME` hoặc `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker không giao diện)">
    Nếu bạn chọn OpenAI Codex OAuth trong wizard, nó sẽ mở một URL trình duyệt. Trong
    Docker hoặc các thiết lập không giao diện, sao chép URL chuyển hướng đầy đủ mà bạn đến và dán
    nó trở lại vào wizard để hoàn tất xác thực.
  </Accordion>

  <Accordion title="Metadata image cơ sở">
    Image Docker chính sử dụng `node:24-bookworm` và công bố các chú thích OCI base-image
    bao gồm `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, và các chú thích khác. Xem
    [Chú thích image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Chạy trên VPS?

Xem [Hetzner (Docker VPS)](/install/hetzner) và
[Docker VM Runtime](/install/docker-vm-runtime) để biết các bước triển khai VM chia sẻ
bao gồm nướng nhị phân, duy trì và cập nhật.

## Agent Sandbox

Khi `agents.defaults.sandbox` được bật, gateway chạy thực thi công cụ agent
(shell, đọc/ghi file, v.v.) bên trong các container Docker cô lập trong khi
gateway tự nó vẫn ở trên host. Điều này cung cấp một bức tường cứng xung quanh các phiên agent không tin cậy hoặc đa người thuê mà không cần container hóa toàn bộ gateway.

Phạm vi sandbox có thể là theo agent (mặc định), theo phiên, hoặc chia sẻ. Mỗi phạm vi
có workspace riêng được mount tại `/workspace`. Bạn cũng có thể cấu hình
chính sách cho phép/từ chối công cụ, cô lập mạng, giới hạn tài nguyên, và các container trình duyệt.

Để biết cấu hình đầy đủ, image, ghi chú bảo mật, và các profile đa agent, xem:

- [Sandboxing](/gateway/sandboxing) -- tài liệu tham khảo sandbox đầy đủ
- [OpenShell](/gateway/openshell) -- truy cập shell tương tác vào các container sandbox
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- ghi đè theo agent

### Kích hoạt nhanh

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Build image sandbox mặc định:

```bash
scripts/sandbox-setup.sh
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Thiếu image hoặc container sandbox không khởi động">
    Build image sandbox với
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    hoặc đặt `agents.defaults.sandbox.docker.image` thành image tùy chỉnh của bạn.
    Các container được tạo tự động theo phiên khi cần.
  </Accordion>

  <Accordion title="Lỗi quyền trong sandbox">
    Đặt `docker.user` thành một UID:GID khớp với quyền sở hữu workspace được mount của bạn,
    hoặc chown thư mục workspace.
  </Accordion>

  <Accordion title="Công cụ tùy chỉnh không tìm thấy trong sandbox">
    OpenClaw chạy các lệnh với `sh -lc` (shell đăng nhập), cái mà nguồn
    `/etc/profile` và có thể đặt lại PATH. Đặt `docker.env.PATH` để thêm vào trước các đường dẫn công cụ tùy chỉnh của bạn, hoặc thêm một script dưới `/etc/profile.d/` trong Dockerfile của bạn.
  </Accordion>

  <Accordion title="Bị OOM-killed trong quá trình build image (exit 137)">
    VM cần ít nhất 2 GB RAM. Sử dụng một lớp máy lớn hơn và thử lại.
  </Accordion>

  <Accordion title="Không được ủy quyền hoặc yêu cầu ghép đôi trong Control UI">
    Lấy một liên kết dashboard mới và phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Chi tiết thêm: [Dashboard](/web/dashboard), [Devices](/cli/devices).

  </Accordion>

  <Accordion title="Mục tiêu gateway hiển thị ws://172.x.x.x hoặc lỗi ghép đôi từ Docker CLI">
    Đặt lại chế độ và bind của gateway:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.mode local
    docker compose run --rm openclaw-cli config set gateway.bind lan
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>
