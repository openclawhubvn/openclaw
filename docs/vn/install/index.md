---
summary: "Cài đặt OpenClaw — script cài đặt, npm/pnpm, từ source, Docker và nhiều hơn nữa"
read_when:
  - Bạn cần phương pháp cài đặt khác ngoài hướng dẫn nhanh trong phần Bắt đầu
  - Bạn muốn triển khai lên nền tảng đám mây
  - Bạn cần cập nhật, di chuyển, hoặc gỡ cài đặt
title: "Cài đặt"
---

# Cài đặt

## Khuyến nghị: script cài đặt

Cách nhanh nhất để cài đặt. Script này tự động phát hiện hệ điều hành, cài đặt Node nếu cần, cài đặt OpenClaw và khởi chạy quá trình onboarding.

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

Để cài đặt mà không chạy onboarding:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Để biết tất cả các cờ và tùy chọn CI/tự động hóa, xem [Installer internals](/install/installer).

## Yêu cầu hệ thống

- **Node 24** (khuyến nghị) hoặc Node 22.16+ — script cài đặt sẽ tự động xử lý điều này
- **macOS, Linux, hoặc Windows** — hỗ trợ cả Windows gốc và WSL2; WSL2 ổn định hơn. Xem [Windows](/platforms/windows).
- `pnpm` chỉ cần thiết nếu bạn build từ source

## Phương pháp cài đặt thay thế

### npm hoặc pnpm

Nếu bạn đã tự quản lý Node:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm yêu cầu phê duyệt rõ ràng cho các package có script build. Chạy `pnpm approve-builds -g` sau lần cài đặt đầu tiên.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Khắc phục sự cố: lỗi build sharp (npm)">
  Nếu `sharp` gặp lỗi do libvips được cài đặt toàn cục:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Từ source

Dành cho những người đóng góp hoặc ai muốn chạy từ bản checkout cục bộ:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

Hoặc bỏ qua bước link và sử dụng `pnpm openclaw ...` từ trong repo. Xem [Setup](/start/setup) để biết quy trình phát triển đầy đủ.

### Cài đặt từ GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Containers và trình quản lý package

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    Triển khai container hoặc không có giao diện.
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Giải pháp container không root thay thế Docker.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Cài đặt khai báo qua Nix flake.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    Cung cấp tự động cho hệ thống.
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Sử dụng chỉ CLI qua runtime Bun.
  </Card>
</CardGroup>

## Xác minh cài đặt

```bash
openclaw --version      # xác nhận CLI có sẵn
openclaw doctor         # kiểm tra các vấn đề cấu hình
openclaw gateway status # xác minh Gateway đang chạy
```

## Lưu trữ và triển khai

Triển khai OpenClaw trên máy chủ đám mây hoặc VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/vps">Bất kỳ Linux VPS nào</Card>
  <Card title="Docker VM" href="/install/docker-vm-runtime">Các bước Docker chia sẻ</Card>
  <Card title="Kubernetes" href="/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/install/azure">Azure</Card>
  <Card title="Railway" href="/install/railway">Railway</Card>
  <Card title="Render" href="/install/render">Render</Card>
  <Card title="Northflank" href="/install/northflank">Northflank</Card>
</CardGroup>

## Cập nhật, di chuyển, hoặc gỡ cài đặt

<CardGroup cols={3}>
  <Card title="Cập nhật" href="/install/updating" icon="refresh-cw">
    Giữ OpenClaw luôn cập nhật.
  </Card>
  <Card title="Di chuyển" href="/install/migrating" icon="arrow-right">
    Chuyển sang máy mới.
  </Card>
  <Card title="Gỡ cài đặt" href="/install/uninstall" icon="trash-2">
    Gỡ bỏ hoàn toàn OpenClaw.
  </Card>
</CardGroup>

## Khắc phục sự cố: `openclaw` không tìm thấy

Nếu cài đặt thành công nhưng `openclaw` không tìm thấy trong terminal:

```bash
node -v           # Node đã cài đặt chưa?
npm prefix -g     # Các package toàn cục nằm ở đâu?
echo "$PATH"      # Thư mục bin toàn cục có trong PATH không?
```

Nếu `$(npm prefix -g)/bin` không có trong `$PATH`, thêm nó vào file khởi động shell (`~/.zshrc` hoặc `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Sau đó mở một terminal mới. Xem [Node setup](/install/node) để biết thêm chi tiết.
