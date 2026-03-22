---
summary: "Chạy OpenClaw Gateway 24/7 trên GCP Compute Engine VM (Docker) với trạng thái bền vững"
read_when:
  - Muốn chạy OpenClaw 24/7 trên GCP
  - Cần Gateway luôn sẵn sàng trên VM tự quản lý
  - Muốn kiểm soát hoàn toàn về lưu trữ, binary và hành vi khởi động lại
title: "GCP"
---

# OpenClaw trên GCP Compute Engine (Docker, Hướng dẫn VPS Production)

## Mục tiêu

Chạy OpenClaw Gateway bền vững trên GCP Compute Engine VM bằng Docker, với trạng thái bền vững, binary tích hợp sẵn và hành vi khởi động lại an toàn.

Nếu muốn "OpenClaw 24/7 với chi phí ~$5-12/tháng", đây là cấu hình đáng tin cậy trên Google Cloud. Giá thay đổi theo loại máy và khu vực; chọn VM nhỏ nhất phù hợp với workload và nâng cấp nếu gặp OOM.

## Chúng ta sẽ làm gì (nói đơn giản)?

- Tạo dự án GCP và kích hoạt thanh toán
- Tạo Compute Engine VM
- Cài Docker (runtime ứng dụng cô lập)
- Khởi động OpenClaw Gateway trong Docker
- Lưu trữ `~/.openclaw` + `~/.openclaw/workspace` trên host (tồn tại qua các lần khởi động lại/xây dựng lại)
- Truy cập Control UI từ laptop qua SSH tunnel

Có thể truy cập Gateway qua:

- SSH port forwarding từ laptop
- Mở cổng trực tiếp nếu tự quản lý firewall và token

Hướng dẫn này dùng Debian trên GCP Compute Engine. Ubuntu cũng hoạt động; map package tương ứng. Để biết luồng Docker chung, xem [Docker](/install/docker).

---

## Đường tắt (dành cho người có kinh nghiệm)

1. Tạo dự án GCP + kích hoạt Compute Engine API
2. Tạo Compute Engine VM (e2-small, Debian 12, 20GB)
3. SSH vào VM
4. Cài Docker
5. Clone repository OpenClaw
6. Tạo thư mục host bền vững
7. Cấu hình `.env` và `docker-compose.yml`
8. Tích hợp binary cần thiết, build và khởi động

---

## Cần chuẩn bị

- Tài khoản GCP (đủ điều kiện free tier cho e2-micro)
- gcloud CLI đã cài (hoặc dùng Cloud Console)
- Truy cập SSH từ laptop
- Thoải mái cơ bản với SSH + copy/paste
- ~20-30 phút
- Docker và Docker Compose
- Thông tin xác thực mô hình
- Thông tin xác thực provider tùy chọn
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="Cài gcloud CLI (hoặc dùng Console)">
    **Option A: gcloud CLI** (khuyến nghị cho tự động hóa)

    Cài từ [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Khởi tạo và xác thực:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Option B: Cloud Console**

    Tất cả các bước có thể thực hiện qua web UI tại [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Tạo dự án GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Kích hoạt thanh toán tại [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (cần thiết cho Compute Engine).

    Kích hoạt Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Vào IAM & Admin > Create Project
    2. Đặt tên và tạo
    3. Kích hoạt thanh toán cho dự án
    4. Điều hướng đến APIs & Services > Enable APIs > tìm "Compute Engine API" > Enable

  </Step>

  <Step title="Tạo VM">
    **Loại máy:**

    | Loại      | Thông số kỹ thuật        | Chi phí           | Ghi chú                                      |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/tháng         | Đáng tin cậy nhất cho build Docker local     |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/tháng         | Tối thiểu khuyến nghị cho build Docker       |
    | e2-micro  | 2 vCPU (chia sẻ), 1GB RAM | Đủ điều kiện free tier | Thường thất bại với build Docker OOM (exit 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Vào Compute Engine > VM instances > Create instance
    2. Tên: `openclaw-gateway`
    3. Region: `us-central1`, Zone: `us-central1-a`
    4. Loại máy: `e2-small`
    5. Boot disk: Debian 12, 20GB
    6. Tạo

  </Step>

  <Step title="SSH vào VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Nhấn nút "SSH" bên cạnh VM trong dashboard Compute Engine.

    Lưu ý: SSH key propagation có thể mất 1-2 phút sau khi tạo VM. Nếu kết nối bị từ chối, chờ và thử lại.

  </Step>

  <Step title="Cài Docker (trên VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Đăng xuất và đăng nhập lại để thay đổi nhóm có hiệu lực:

    ```bash
    exit
    ```

    Sau đó SSH lại:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Kiểm tra:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone repository OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Hướng dẫn này giả định bạn sẽ build một image tùy chỉnh để đảm bảo binary bền vững.

  </Step>

  <Step title="Tạo thư mục host bền vững">
    Docker container là tạm thời. Tất cả trạng thái dài hạn phải lưu trên host.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Cấu hình biến môi trường">
    Tạo `.env` trong thư mục gốc repository.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Tạo secret mạnh:

    ```bash
    openssl rand -hex 32
    ```

    **Không commit file này.**

  </Step>

  <Step title="Cấu hình Docker Compose">
    Tạo hoặc cập nhật `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Khuyến nghị: giữ Gateway chỉ loopback trên VM; truy cập qua SSH tunnel.
          # Để công khai, bỏ prefix `127.0.0.1:` và cấu hình firewall tương ứng.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` chỉ để tiện bootstrap, không thay thế cho cấu hình gateway đúng chuẩn. Vẫn cần đặt auth (`gateway.auth.token` hoặc password) và dùng cài đặt bind an toàn cho deployment.

  </Step>

  <Step title="Các bước runtime Docker VM chia sẻ">
    Sử dụng hướng dẫn runtime chia sẻ cho luồng host Docker chung:

    - [Tích hợp binary cần thiết vào image](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build và khởi động](/install/docker-vm-runtime#build-and-launch)
    - [Cái gì lưu trữ ở đâu](/install/docker-vm-runtime#what-persists-where)
    - [Cập nhật](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Ghi chú khởi động đặc thù GCP">
    Trên GCP, nếu build thất bại với `Killed` hoặc `exit code 137` trong `pnpm install --frozen-lockfile`, VM bị thiếu bộ nhớ. Dùng tối thiểu `e2-small`, hoặc `e2-medium` để build lần đầu đáng tin cậy hơn.

    Khi bind vào LAN (`OPENCLAW_GATEWAY_BIND=lan`), cấu hình một nguồn gốc trình duyệt tin cậy trước khi tiếp tục:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Nếu đã thay đổi cổng gateway, thay `18789` bằng cổng đã cấu hình.

  </Step>

  <Step title="Truy cập từ laptop">
    Tạo SSH tunnel để forward cổng Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Mở trong trình duyệt:

    `http://127.0.0.1:18789/`

    Lấy link dashboard tokenized mới:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Dán token từ URL đó.

    Nếu Control UI hiển thị `unauthorized` hoặc `disconnected (1008): pairing required`, phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Cần tham khảo lại lưu trữ và cập nhật chia sẻ?
    Xem [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where) và [Docker VM Runtime updates](/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Khắc phục sự cố

**SSH connection refused**

SSH key propagation có thể mất 1-2 phút sau khi tạo VM. Chờ và thử lại.

**Vấn đề OS Login**

Kiểm tra profile OS Login:

```bash
gcloud compute os-login describe-profile
```

Đảm bảo tài khoản có quyền IAM cần thiết (Compute OS Login hoặc Compute OS Admin Login).

**Out of memory (OOM)**

Nếu Docker build thất bại với `Killed` và `exit code 137`, VM bị OOM-killed. Nâng cấp lên e2-small (tối thiểu) hoặc e2-medium (khuyến nghị cho build local đáng tin cậy):

```bash
# Dừng VM trước
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Thay đổi loại máy
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Khởi động lại VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Tài khoản dịch vụ (thực hành bảo mật tốt nhất)

Đối với sử dụng cá nhân, tài khoản người dùng mặc định hoạt động tốt.

Đối với tự động hóa hoặc pipeline CI/CD, tạo tài khoản dịch vụ chuyên dụng với quyền tối thiểu:

1. Tạo tài khoản dịch vụ:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Cấp quyền Compute Instance Admin (hoặc role tùy chỉnh hẹp hơn):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Tránh sử dụng role Owner cho tự động hóa. Áp dụng nguyên tắc quyền tối thiểu.

Xem [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) để biết chi tiết về IAM role.

---

## Bước tiếp theo

- Thiết lập kênh nhắn tin: [Channels](/channels)
- Ghép nối thiết bị local làm node: [Nodes](/nodes)
- Cấu hình Gateway: [Gateway configuration](/gateway/configuration)\n