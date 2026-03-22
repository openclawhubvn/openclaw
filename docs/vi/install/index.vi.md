# Cài đặt

## Khuyến nghị: script cài đặt

Cách nhanh nhất để cài. Script tự động phát hiện hệ điều hành, cài Node nếu cần, cài OpenClaw và khởi động onboarding.

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

Cài đặt mà không chạy onboarding:

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

Xem tất cả các flag và tùy chọn CI/automation tại [Installer internals](/install/installer).

## Yêu cầu hệ thống

- **Node 24** (khuyến nghị) hoặc Node 22.16+ — script cài đặt tự xử lý
- **macOS, Linux, hoặc Windows** — hỗ trợ cả Windows native và WSL2; WSL2 ổn định hơn. Xem [Windows](/platforms/windows).
- `pnpm` chỉ cần nếu build từ source

## Phương pháp cài đặt khác

### npm hoặc pnpm

Nếu đã tự quản lý Node:

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
    pnpm yêu cầu phê duyệt rõ ràng cho các package có build scripts. Chạy `pnpm approve-builds -g` sau lần cài đầu tiên.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Khắc phục lỗi build sharp (npm)">
  Nếu `sharp` lỗi do libvips cài đặt toàn cục:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Từ source

Dành cho contributor hoặc ai muốn chạy từ local checkout:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

Hoặc bỏ qua link và dùng `pnpm openclaw ...` từ trong repo. Xem [Setup](/start/setup) để biết quy trình phát triển đầy đủ.

### Cài từ GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Containers và package managers

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    Triển khai container hoặc headless.
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Container rootless thay thế Docker.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Cài đặt khai báo qua Nix flake.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    Tự động provisioning fleet.
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Chỉ dùng CLI qua runtime Bun.
  </Card>
</CardGroup>

## Kiểm tra cài đặt

```bash
openclaw --version      # xác nhận CLI có sẵn
openclaw doctor         # kiểm tra lỗi cấu hình
openclaw gateway status # xác nhận Gateway đang chạy
```

## Hosting và triển khai

Triển khai OpenClaw trên cloud server hoặc VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/vps">Bất kỳ Linux VPS nào</Card>
  <Card title="Docker VM" href="/install/docker-vm-runtime">Bước Docker chung</Card>
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
    Giữ OpenClaw luôn mới nhất.
  </Card>
  <Card title="Di chuyển" href="/install/migrating" icon="arrow-right">
    Chuyển sang máy mới.
  </Card>
  <Card title="Gỡ cài đặt" href="/install/uninstall" icon="trash-2">
    Gỡ bỏ hoàn toàn OpenClaw.
  </Card>
</CardGroup>

## Khắc phục lỗi: `openclaw` không tìm thấy

Nếu cài đặt thành công nhưng `openclaw` không tìm thấy trong terminal:

```bash
node -v           # Node đã cài chưa?
npm prefix -g     # Thư mục package global ở đâu?
echo "$PATH"      # Thư mục bin global có trong PATH không?
```

Nếu `$(npm prefix -g)/bin` không có trong `$PATH`, thêm vào file khởi động shell (`~/.zshrc` hoặc `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Sau đó mở terminal mới. Xem [Node setup](/install/node) để biết thêm chi tiết.\n