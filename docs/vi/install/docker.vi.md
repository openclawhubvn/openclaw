---
summary: "Thiết lập và onboard OpenClaw bằng Docker (tùy chọn)"
read_when:
  - Muốn dùng gateway dạng container thay vì cài đặt local
  - Đang kiểm tra quy trình Docker
title: "Docker"
---

# Docker (tùy chọn)

Docker là **tùy chọn**. Dùng khi cần gateway dạng container hoặc kiểm tra quy trình Docker.

## Docker có phù hợp?

- **Có**: cần môi trường gateway cách ly, dễ xóa hoặc chạy OpenClaw trên host không cài đặt local.
- **Không**: chạy trên máy cá nhân và muốn vòng lặp dev nhanh nhất. Dùng quy trình cài đặt thông thường.
- **Lưu ý Sandboxing**: agent sandboxing cũng dùng Docker nhưng **không** cần chạy toàn bộ gateway trong Docker. Xem [Sandboxing](/gateway/sandboxing).

## Yêu cầu

- Docker Desktop (hoặc Docker Engine) + Docker Compose v2
- Ít nhất 2 GB RAM để build image (`pnpm install` có thể bị OOM-killed trên host 1 GB với exit 137)
- Đủ dung lượng đĩa cho images và logs
- Nếu chạy trên VPS/host công khai, xem xét
  [Tăng cường bảo mật cho phơi bày mạng](/gateway/security#0-4-network-exposure-bind-port-firewall),
  đặc biệt là chính sách firewall Docker `DOCKER-USER`.

## Gateway dạng container

<Steps>
  <Step title="Build image">
    Từ thư mục gốc repo, chạy script setup:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Script này build image gateway local. Để dùng image đã build sẵn:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Images đã build sẵn được publish tại
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Các tag phổ biến: `main`, `latest`, `<version>` (ví dụ: `2026.2.26`).

  </Step>

  <Step title="Hoàn tất onboarding">
    Script setup tự động chạy onboarding. Nó sẽ:

    - yêu cầu nhập API keys của provider
    - tạo token gateway và ghi vào `.env`
    - khởi động gateway qua Docker Compose

  </Step>

  <Step title="Mở Control UI">
    Mở `http://127.0.0.1:18789/` trong trình duyệt và dán token vào Settings.

    Cần URL lại?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Cấu hình channels (tùy chọn)">
    Dùng container CLI để thêm các kênh nhắn tin:

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

Nếu muốn tự chạy từng bước thay vì dùng script setup:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

<Note>
Chạy `docker compose` từ thư mục gốc repo. Nếu đã bật `OPENCLAW_EXTRA_MOUNTS`
hoặc `OPENCLAW_HOME_VOLUME`, script setup sẽ ghi `docker-compose.extra.yml`;
bao gồm nó với `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

### Biến môi trường

Script setup chấp nhận các biến môi trường tùy chọn sau:

| Biến                           | Mục đích                                                          |
| ------------------------------ | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Dùng image từ xa thay vì build local                             |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Cài đặt thêm apt packages trong quá trình build (cách nhau bằng dấu cách) |
| `OPENCLAW_EXTENSIONS`          | Cài đặt trước các phụ thuộc extension khi build (tên cách nhau bằng dấu cách) |
| `OPENCLAW_EXTRA_MOUNTS`        | Thêm host bind mounts (cách nhau bằng dấu phẩy `source:target[:opts]`)  |
| `OPENCLAW_HOME_VOLUME`         | Lưu trữ `/home/node` trong một Docker volume có tên              |
| `OPENCLAW_SANDBOX`             | Chọn tham gia sandbox bootstrap (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_DOCKER_SOCKET`       | Ghi đè đường dẫn socket Docker                                   |

### Kiểm tra sức khỏe

Các endpoint probe của container (không cần auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Image Docker có `HEALTHCHECK` tích hợp sẵn ping `/healthz`.
Nếu kiểm tra liên tục thất bại, Docker đánh dấu container là `unhealthy` và
hệ thống điều phối có thể khởi động lại hoặc thay thế nó.

Snapshot sức khỏe sâu có xác thực:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` mặc định `OPENCLAW_GATEWAY_BIND=lan` để host truy cập
`http://127.0.0.1:18789` hoạt động với Docker port publishing.

- `lan` (mặc định): trình duyệt host và CLI host có thể truy cập cổng gateway đã publish.
- `loopback`: chỉ các tiến trình bên trong network namespace của container có thể truy cập
  gateway trực tiếp.

<Note>
Dùng giá trị bind mode trong `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), không dùng alias host như `0.0.0.0` hoặc `127.0.0.1`.
</Note>

### Lưu trữ và duy trì

Docker Compose bind-mounts `OPENCLAW_CONFIG_DIR` vào `/home/node/.openclaw` và
`OPENCLAW_WORKSPACE_DIR` vào `/home/node/.openclaw/workspace`, nên các đường dẫn này
sẽ tồn tại sau khi thay thế container.

Để biết chi tiết đầy đủ về duy trì trên VM, xem
[Docker VM Runtime - What persists where](/install/docker-vm-runtime#what-persists-where).

**Điểm nóng tăng trưởng đĩa:** theo dõi `media/`, các file session JSONL, `cron/runs/*.jsonl`,
và file log rolling dưới `/tmp/openclaw/`.

### Trợ giúp shell (tùy chọn)

Để quản lý Docker hàng ngày dễ dàng hơn, cài đặt `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/shell-helpers/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Sau đó dùng `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, v.v. Chạy
`clawdock-help` để xem tất cả lệnh.
Xem [`ClawDock` Helper README](https://github.com/openclaw/openclaw/blob/main/scripts/shell-helpers/README.md).

<AccordionGroup>
  <Accordion title="Bật agent sandbox cho Docker gateway">
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

    Script chỉ mount `docker.sock` sau khi các điều kiện tiên quyết sandbox được đáp ứng. Nếu
    không thể hoàn tất thiết lập sandbox, script sẽ đặt lại `agents.defaults.sandbox.mode`
    thành `off`.

  </Accordion>

  <Accordion title="Tự động hóa / CI (không tương tác)">
    Tắt phân bổ pseudo-TTY của Compose với `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Lưu ý bảo mật mạng chia sẻ">
    `openclaw-cli` dùng `network_mode: "service:openclaw-gateway"` để các lệnh CLI
    có thể truy cập gateway qua `127.0.0.1`. Xem đây như một ranh giới tin cậy chia sẻ. Cấu hình compose loại bỏ `NET_RAW`/`NET_ADMIN` và bật
    `no-new-privileges` trên `openclaw-cli`.
  </Accordion>

  <Accordion title="Quyền và EACCES">
    Image chạy dưới quyền `node` (uid 1000). Nếu thấy lỗi quyền trên
    `/home/node/.openclaw`, đảm bảo các bind mounts của host thuộc sở hữu của uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Tái build nhanh hơn">
    Sắp xếp Dockerfile để các layer phụ thuộc được cache. Điều này tránh việc chạy lại
    `pnpm install` trừ khi lockfiles thay đổi:

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
    Image mặc định ưu tiên bảo mật và chạy dưới quyền không root `node`. Để có container đầy đủ tính năng hơn:

    1. **Lưu trữ `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Nướng các phụ thuộc hệ thống**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Cài đặt trình duyệt Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Lưu trữ tải xuống trình duyệt**: đặt
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` và dùng
       `OPENCLAW_HOME_VOLUME` hoặc `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker headless)">
    Nếu chọn OpenAI Codex OAuth trong wizard, nó mở một URL trình duyệt. Trong
    Docker hoặc thiết lập headless, sao chép URL redirect đầy đủ và dán lại vào wizard để hoàn tất xác thực.
  </Accordion>

  <Accordion title="Metadata image cơ sở">
    Image Docker chính dùng `node:24-bookworm` và publish các annotation OCI base-image
    bao gồm `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, và các annotation khác. Xem
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Chạy trên VPS?

Xem [Hetzner (Docker VPS)](/install/hetzner) và
[Docker VM Runtime](/install/docker-vm-runtime) để biết các bước triển khai VM chia sẻ
bao gồm nướng binary, duy trì và cập nhật.

## Agent Sandbox

Khi `agents.defaults.sandbox` được bật, gateway chạy thực thi công cụ agent
(shell, đọc/ghi file, v.v.) bên trong các container Docker cách ly trong khi
gateway tự nó vẫn ở trên host. Điều này cung cấp một bức tường cứng xung quanh các session agent không tin cậy hoặc đa tenant mà không cần container hóa toàn bộ gateway.

Phạm vi sandbox có thể là per-agent (mặc định), per-session, hoặc shared. Mỗi phạm vi
có workspace riêng được mount tại `/workspace`. Bạn cũng có thể cấu hình
chính sách công cụ cho phép/từ chối, cách ly mạng, giới hạn tài nguyên, và container trình duyệt.

Để biết cấu hình đầy đủ, images, ghi chú bảo mật, và profile multi-agent, xem:

- [Sandboxing](/gateway/sandboxing) -- tài liệu tham khảo sandbox đầy đủ
- [OpenShell](/gateway/openshell) -- truy cập shell tương tác vào các container sandbox
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- ghi đè per-agent

### Bật nhanh

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
    Containers được tạo tự động cho mỗi session khi cần.
  </Accordion>

  <Accordion title="Lỗi quyền trong sandbox">
    Đặt `docker.user` thành UID:GID khớp với quyền sở hữu workspace đã mount,
    hoặc chown thư mục workspace.
  </Accordion>

  <Accordion title="Không tìm thấy công cụ tùy chỉnh trong sandbox">
    OpenClaw chạy lệnh với `sh -lc` (login shell), cái này sẽ source
    `/etc/profile` và có thể reset PATH. Đặt `docker.env.PATH` để thêm đường dẫn công cụ tùy chỉnh của bạn, hoặc thêm script dưới `/etc/profile.d/` trong Dockerfile của bạn.
  </Accordion>

  <Accordion title="Bị OOM-killed trong quá trình build image (exit 137)">
    VM cần ít nhất 2 GB RAM. Dùng class máy lớn hơn và thử lại.
  </Accordion>

  <Accordion title="Không được ủy quyền hoặc yêu cầu ghép đôi trong Control UI">
    Lấy link dashboard mới và phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Chi tiết thêm: [Dashboard](/web/dashboard), [Devices](/cli/devices).

  </Accordion>

  <Accordion title="Mục tiêu gateway hiển thị ws://172.x.x.x hoặc lỗi ghép đôi từ Docker CLI">
    Đặt lại chế độ gateway và bind:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.mode local
    docker compose run --rm openclaw-cli config set gateway.bind lan
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

\n