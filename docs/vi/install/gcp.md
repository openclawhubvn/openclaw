---
summary: "Chạy OpenClaw Gateway 24/7 trên GCP Compute Engine VM (Docker) với trạng thái bền vững"
read_when:
  - Bạn muốn OpenClaw chạy 24/7 trên GCP
  - Bạn muốn một Gateway luôn hoạt động, đạt chuẩn sản xuất trên VM của riêng mình
  - Bạn muốn kiểm soát hoàn toàn việc lưu trữ, nhị phân và hành vi khởi động lại
title: "GCP"
---

# OpenClaw trên GCP Compute Engine (Docker, Hướng dẫn VPS sản xuất)

## Mục tiêu

Chạy OpenClaw Gateway bền vững trên GCP Compute Engine VM bằng Docker, với trạng thái bền vững, nhị phân tích hợp sẵn và hành vi khởi động lại an toàn.

Nếu bạn muốn "OpenClaw 24/7 với chi phí khoảng $5-12/tháng", đây là một thiết lập đáng tin cậy trên Google Cloud. Giá cả thay đổi theo loại máy và khu vực; chọn VM nhỏ nhất phù hợp với khối lượng công việc và mở rộng nếu gặp tình trạng thiếu bộ nhớ.

## Chúng ta sẽ làm gì (đơn giản)?

- Tạo một dự án GCP và kích hoạt thanh toán
- Tạo một Compute Engine VM
- Cài đặt Docker (môi trường chạy ứng dụng cách ly)
- Khởi động OpenClaw Gateway trong Docker
- Lưu trữ `~/.openclaw` + `~/.openclaw/workspace` trên máy chủ (tồn tại qua các lần khởi động lại/xây dựng lại)
- Truy cập Control UI từ laptop qua SSH tunnel

Gateway có thể được truy cập qua:

- Chuyển tiếp cổng SSH từ laptop
- Tiếp cận cổng trực tiếp nếu bạn tự quản lý firewall và token

Hướng dẫn này sử dụng Debian trên GCP Compute Engine. Ubuntu cũng hoạt động; chỉ cần điều chỉnh các gói tương ứng. Để biết quy trình Docker chung, xem [Docker](/install/docker).

---

## Đường tắt (dành cho người có kinh nghiệm)

1. Tạo dự án GCP + kích hoạt Compute Engine API
2. Tạo Compute Engine VM (e2-small, Debian 12, 20GB)
3. SSH vào VM
4. Cài đặt Docker
5. Clone repository OpenClaw
6. Tạo thư mục lưu trữ bền vững trên máy chủ
7. Cấu hình `.env` và `docker-compose.yml`
8. Tích hợp nhị phân cần thiết, xây dựng và khởi động

---

## Bạn cần gì

- Tài khoản GCP (đủ điều kiện cho e2-micro miễn phí)
- gcloud CLI đã cài đặt (hoặc sử dụng Cloud Console)
- Truy cập SSH từ laptop
- Thoải mái cơ bản với SSH + copy/paste
- Khoảng 20-30 phút
- Docker và Docker Compose
- Thông tin xác thực mô hình
- Thông tin xác thực nhà cung cấp tùy chọn
  - Mã QR WhatsApp
  - Token bot Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Cài đặt gcloud CLI (hoặc sử dụng Console)">
    **Lựa chọn A: gcloud CLI** (khuyến nghị cho tự động hóa)

    Cài đặt từ [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Khởi tạo và xác thực:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Lựa chọn B: Cloud Console**

    Tất cả các bước có thể thực hiện qua giao diện web tại [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Tạo một dự án GCP">
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

    1. Đi tới IAM & Admin > Tạo Dự án
    2. Đặt tên và tạo
    3. Kích hoạt thanh toán cho dự án
    4. Điều hướng đến APIs & Services > Enable APIs > tìm kiếm "Compute Engine API" > Kích hoạt

  </Step>

  <Step title="Tạo VM">
    **Loại máy:**

    | Loại      | Thông số kỹ thuật        | Chi phí           | Ghi chú                                      |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/tháng         | Đáng tin cậy nhất cho xây dựng Docker cục bộ |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/tháng         | Khuyến nghị tối thiểu cho xây dựng Docker    |
    | e2-micro  | 2 vCPU (chia sẻ), 1GB RAM | Miễn phí          | Thường thất bại với Docker build OOM (exit 137) |

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

    1. Đi tới Compute Engine > VM instances > Tạo instance
    2. Tên: `openclaw-gateway`
    3. Vùng: `us-central1`, Khu vực: `us-central1-a`
    4. Loại máy: `e2-small`
    5. Đĩa khởi động: Debian 12, 20GB
    6. Tạo

  </Step>

  <Step title="SSH vào VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Nhấp vào nút "SSH" bên cạnh VM của bạn trong bảng điều khiển Compute Engine.

    Lưu ý: Việc truyền khóa SSH có thể mất 1-2 phút sau khi tạo VM. Nếu kết nối bị từ chối, hãy chờ và thử lại.

  </Step>

  <Step title="Cài đặt Docker (trên VM)">
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

    Sau đó SSH lại vào:

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

    Hướng dẫn này giả định bạn sẽ xây dựng một hình ảnh tùy chỉnh để đảm bảo lưu trữ nhị phân.

  </Step>

  <Step title="Tạo thư mục lưu trữ bền vững trên máy chủ">
    Các container Docker là tạm thời. Tất cả trạng thái lâu dài phải được lưu trên máy chủ.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Cấu hình biến môi trường">
    Tạo `.env` trong thư mục gốc của repository.

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

    Tạo các khóa bí mật mạnh:

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
          # Khuyến nghị: giữ Gateway chỉ trên loopback của VM; truy cập qua SSH tunnel.
          # Để công khai, loại bỏ tiền tố `127.0.0.1:` và cấu hình firewall tương ứng.
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

    `--allow-unconfigured` chỉ để thuận tiện cho khởi động, không thay thế cho cấu hình gateway đúng. Vẫn cần thiết lập xác thực (`gateway.auth.token` hoặc mật khẩu) và sử dụng cài đặt bind an toàn cho triển khai của bạn.

  </Step>

  <Step title="Các bước runtime Docker VM chung">
    Sử dụng hướng dẫn runtime chung cho quy trình Docker host:

    - [Tích hợp nhị phân cần thiết vào hình ảnh](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Xây dựng và khởi động](/install/docker-vm-runtime#build-and-launch)
    - [Những gì được lưu trữ ở đâu](/install/docker-vm-runtime#what-persists-where)
    - [Cập nhật](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Ghi chú khởi động cụ thể cho GCP">
    Trên GCP, nếu xây dựng thất bại với `Killed` hoặc `exit code 137` trong quá trình `pnpm install --frozen-lockfile`, VM đã hết bộ nhớ. Sử dụng tối thiểu `e2-small`, hoặc `e2-medium` để đảm bảo xây dựng đầu tiên đáng tin cậy.

    Khi bind vào LAN (`OPENCLAW_GATEWAY_BIND=lan`), cấu hình một nguồn gốc trình duyệt đáng tin cậy trước khi tiếp tục:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Nếu bạn đã thay đổi cổng gateway, thay `18789` bằng cổng đã cấu hình của bạn.

  </Step>

  <Step title="Truy cập từ laptop của bạn">
    Tạo một SSH tunnel để chuyển tiếp cổng Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Mở trong trình duyệt của bạn:

    `http://127.0.0.1:18789/`

    Lấy liên kết dashboard có token mới:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Dán token từ URL đó.

    Nếu Control UI hiển thị `unauthorized` hoặc `disconnected (1008): pairing required`, phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Cần tham khảo lại về lưu trữ và cập nhật chung?
    Xem [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where) và [Cập nhật Docker VM Runtime](/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Khắc phục sự cố

**Kết nối SSH bị từ chối**

Việc truyền khóa SSH có thể mất 1-2 phút sau khi tạo VM. Chờ và thử lại.

**Vấn đề OS Login**

Kiểm tra hồ sơ OS Login của bạn:

```bash
gcloud compute os-login describe-profile
```

Đảm bảo tài khoản của bạn có quyền IAM cần thiết (Compute OS Login hoặc Compute OS Admin Login).

**Thiếu bộ nhớ (OOM)**

Nếu Docker build thất bại với `Killed` và `exit code 137`, VM đã bị OOM-killed. Nâng cấp lên e2-small (tối thiểu) hoặc e2-medium (khuyến nghị cho xây dựng cục bộ đáng tin cậy):

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

Đối với sử dụng cá nhân, tài khoản người dùng mặc định của bạn hoạt động tốt.

Đối với tự động hóa hoặc pipeline CI/CD, tạo một tài khoản dịch vụ chuyên dụng với quyền tối thiểu:

1. Tạo một tài khoản dịch vụ:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Cấp vai trò Quản trị Instance Compute (hoặc vai trò tùy chỉnh hẹp hơn):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Tránh sử dụng vai trò Owner cho tự động hóa. Sử dụng nguyên tắc quyền tối thiểu.

Xem [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) để biết chi tiết về vai trò IAM.

---

## Bước tiếp theo

- Thiết lập các kênh nhắn tin: [Channels](/channels)
- Ghép nối các thiết bị cục bộ làm node: [Nodes](/nodes)
- Cấu hình Gateway: [Gateway configuration](/gateway/configuration)
