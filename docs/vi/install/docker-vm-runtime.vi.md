---
summary: "Hướng dẫn runtime Docker VM cho OpenClaw Gateway lâu dài"
read_when:
  - Deploy OpenClaw trên cloud VM với Docker
  - Cần quy trình bake binary, lưu trữ và cập nhật chung
title: "Docker VM Runtime"
---

# Docker VM Runtime

Hướng dẫn runtime chung cho cài đặt Docker trên VM như GCP, Hetzner, và các nhà cung cấp VPS tương tự.

## Bake binary cần thiết vào image

Cài đặt binary trong container đang chạy là sai lầm. Mọi thứ cài đặt lúc runtime sẽ mất khi restart.

Tất cả binary bên ngoài cần cho skills phải được cài đặt lúc build image.

Ví dụ dưới đây chỉ minh họa ba binary phổ biến:

- `gog` để truy cập Gmail
- `goplaces` cho Google Places
- `wacli` cho WhatsApp

Đây chỉ là ví dụ, không phải danh sách đầy đủ. Có thể cài thêm binary theo cùng mẫu.

Nếu thêm skills mới cần binary khác, cần:

1. Cập nhật Dockerfile
2. Rebuild image
3. Restart containers

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

# Thêm binary khác bên dưới theo cùng mẫu

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
Các URL tải về trên là cho x86_64 (amd64). Với VM ARM (ví dụ Hetzner ARM, GCP Tau T2A), thay URL tải về bằng bản ARM64 từ trang phát hành của từng công cụ.
</Note>

## Build và khởi chạy

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Nếu build lỗi với `Killed` hoặc `exit code 137` khi `pnpm install --frozen-lockfile`, VM thiếu RAM. Dùng máy lớn hơn trước khi thử lại.

Kiểm tra binary:

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

## Lưu trữ ở đâu

OpenClaw chạy trong Docker, nhưng Docker không phải nguồn dữ liệu chính. Tất cả trạng thái lâu dài phải tồn tại qua restart, rebuild, và reboot.

| Thành phần          | Vị trí                            | Cơ chế lưu trữ         | Ghi chú                             |
| ------------------- | --------------------------------- | ---------------------- | ----------------------------------- |
| Gateway config      | `/home/node/.openclaw/`           | Host volume mount      | Bao gồm `openclaw.json`, tokens     |
| Model auth profiles | `/home/node/.openclaw/`           | Host volume mount      | OAuth tokens, API keys              |
| Skill configs       | `/home/node/.openclaw/skills/`    | Host volume mount      | Trạng thái cấp skill                |
| Agent workspace     | `/home/node/.openclaw/workspace/` | Host volume mount      | Code và artifacts của agent         |
| WhatsApp session    | `/home/node/.openclaw/`           | Host volume mount      | Giữ QR login                        |
| Gmail keyring       | `/home/node/.openclaw/`           | Host volume + password | Cần `GOG_KEYRING_PASSWORD`          |
| External binaries   | `/usr/local/bin/`                 | Docker image           | Phải bake lúc build image           |
| Node runtime        | Container filesystem              | Docker image           | Rebuild mỗi lần build image         |
| OS packages         | Container filesystem              | Docker image           | Không cài lúc runtime               |
| Docker container    | Ephemeral                         | Restartable            | An toàn để phá hủy                  |

## Cập nhật

Để cập nhật OpenClaw trên VM:

```bash
git pull
docker compose build
docker compose up -d
```\n