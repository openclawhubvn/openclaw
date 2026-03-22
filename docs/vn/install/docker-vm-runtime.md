---
summary: "Các bước runtime Docker VM chia sẻ cho các host OpenClaw Gateway lâu dài"
read_when:
  - Bạn đang triển khai OpenClaw trên một cloud VM với Docker
  - Bạn cần quy trình bake binary chia sẻ, duy trì và cập nhật
title: "Docker VM Runtime"
---

# Docker VM Runtime

Các bước runtime chia sẻ cho cài đặt Docker trên VM như GCP, Hetzner và các nhà cung cấp VPS tương tự.

## Tích hợp các binary cần thiết vào image

Cài đặt binary bên trong container đang chạy là một cái bẫy. Mọi thứ cài đặt tại runtime sẽ bị mất khi khởi động lại.

Tất cả các binary bên ngoài cần thiết cho các kỹ năng phải được cài đặt trong quá trình build image.

Dưới đây là ví dụ về ba binary phổ biến:

- `gog` để truy cập Gmail
- `goplaces` cho Google Places
- `wacli` cho WhatsApp

Đây chỉ là ví dụ, không phải danh sách đầy đủ. Bạn có thể cài đặt nhiều binary cần thiết theo cùng một mẫu.

Nếu bạn thêm kỹ năng mới sau này phụ thuộc vào các binary bổ sung, bạn phải:

1. Cập nhật Dockerfile
2. Rebuild image
3. Khởi động lại container

**Ví dụ Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Binary ví dụ 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Binary ví dụ 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Binary ví dụ 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# Thêm các binary khác bên dưới theo cùng mẫu

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
Các URL tải xuống trên là cho x86_64 (amd64). Đối với các VM dựa trên ARM (ví dụ: Hetzner ARM, GCP Tau T2A), thay thế các URL tải xuống bằng các biến thể ARM64 phù hợp từ trang phát hành của từng công cụ.
</Note>

## Build và khởi động

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Nếu build thất bại với lỗi `Killed` hoặc `exit code 137` trong quá trình `pnpm install --frozen-lockfile`, VM đã hết bộ nhớ. Sử dụng một lớp máy lớn hơn trước khi thử lại.

Kiểm tra các binary:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Kết quả mong đợi:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Kiểm tra Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Kết quả mong đợi:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Những gì được duy trì ở đâu

OpenClaw chạy trong Docker, nhưng Docker không phải là nguồn dữ liệu chính. Tất cả trạng thái lâu dài phải tồn tại qua các lần khởi động lại, rebuild và reboot.

| Thành phần          | Vị trí                             | Cơ chế duy trì         | Ghi chú                             |
| ------------------- | --------------------------------- | ---------------------- | ----------------------------------- |
| Cấu hình Gateway    | `/home/node/.openclaw/`           | Host volume mount      | Bao gồm `openclaw.json`, tokens     |
| Hồ sơ xác thực mô hình | `/home/node/.openclaw/`         | Host volume mount      | OAuth tokens, API keys              |
| Cấu hình kỹ năng    | `/home/node/.openclaw/skills/`    | Host volume mount      | Trạng thái cấp kỹ năng              |
| Không gian làm việc của Agent | `/home/node/.openclaw/workspace/` | Host volume mount | Mã và các artifact của agent        |
| Phiên WhatsApp      | `/home/node/.openclaw/`           | Host volume mount      | Bảo toàn đăng nhập QR               |
| Keyring Gmail       | `/home/node/.openclaw/`           | Host volume + password | Yêu cầu `GOG_KEYRING_PASSWORD`      |
| Binary bên ngoài    | `/usr/local/bin/`                 | Docker image           | Phải được tích hợp khi build        |
| Runtime Node        | Container filesystem              | Docker image           | Được rebuild mỗi lần build image    |
| Gói OS              | Container filesystem              | Docker image           | Không cài đặt tại runtime           |
| Docker container    | Tạm thời                          | Có thể khởi động lại   | An toàn để hủy                       |

## Cập nhật

Để cập nhật OpenClaw trên VM:

```bash
git pull
docker compose build
docker compose up -d
```
