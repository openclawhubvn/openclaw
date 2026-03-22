---
summary: "Cách hoạt động của các script cài đặt (install.sh, install-cli.sh, install.ps1), các flag và tự động hóa"
read_when:
  - Muốn hiểu `openclaw.ai/install.sh`
  - Muốn tự động hóa cài đặt (CI / headless)
  - Muốn cài đặt từ GitHub checkout
title: "Cấu trúc bên trong Installer"
---

# Cấu trúc bên trong Installer

OpenClaw cung cấp ba script cài đặt, từ `openclaw.ai`.

| Script                             | Nền tảng            | Chức năng                                                                                     |
| ---------------------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL | Cài Node nếu cần, cài OpenClaw qua npm (mặc định) hoặc git, và có thể chạy onboarding.        |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL | Cài Node + OpenClaw vào một local prefix (`~/.openclaw`). Không cần quyền root.               |
| [`install.ps1`](#installps1)       | Windows (PowerShell)| Cài Node nếu cần, cài OpenClaw qua npm (mặc định) hoặc git, và có thể chạy onboarding.        |

## Lệnh nhanh

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Nếu cài đặt thành công nhưng không tìm thấy `openclaw` trong terminal mới, xem [Node.js troubleshooting](/install/node#troubleshooting).
</Note>

---

## install.sh

<Tip>
Khuyến nghị cho hầu hết các cài đặt tương tác trên macOS/Linux/WSL.
</Tip>

### Luồng hoạt động (install.sh)

<Steps>
  <Step title="Phát hiện hệ điều hành">
    Hỗ trợ macOS và Linux (bao gồm WSL). Nếu phát hiện macOS, cài Homebrew nếu thiếu.
  </Step>
  <Step title="Đảm bảo Node.js 24 mặc định">
    Kiểm tra phiên bản Node và cài Node 24 nếu cần (Homebrew trên macOS, script setup NodeSource trên Linux apt/dnf/yum). OpenClaw vẫn hỗ trợ Node 22 LTS, hiện tại là `22.16+`, để tương thích.
  </Step>
  <Step title="Đảm bảo Git">
    Cài Git nếu thiếu.
  </Step>
  <Step title="Cài OpenClaw">
    - Phương pháp `npm` (mặc định): cài npm toàn cầu
    - Phương pháp `git`: clone/cập nhật repo, cài deps với pnpm, build, sau đó cài wrapper tại `~/.local/bin/openclaw`
  </Step>
  <Step title="Nhiệm vụ sau cài đặt">
    - Chạy `openclaw doctor --non-interactive` khi nâng cấp và cài git (cố gắng tốt nhất)
    - Thực hiện onboarding khi phù hợp (TTY có sẵn, onboarding không bị vô hiệu hóa, và kiểm tra bootstrap/config thành công)
    - Mặc định `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### Phát hiện source checkout

Nếu chạy trong một OpenClaw checkout (`package.json` + `pnpm-workspace.yaml`), script cung cấp:

- sử dụng checkout (`git`), hoặc
- sử dụng cài đặt toàn cầu (`npm`)

Nếu không có TTY và không có phương pháp cài đặt nào được thiết lập, mặc định là `npm` và cảnh báo.

Script thoát với mã `2` cho lựa chọn phương pháp không hợp lệ hoặc giá trị `--install-method` không hợp lệ.

### Ví dụ (install.sh)

<Tabs>
  <Tab title="Mặc định">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Bỏ qua onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Cài đặt Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main qua npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Chạy thử">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Tham khảo Flags">

| Flag                                  | Mô tả                                                      |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Chọn phương pháp cài đặt (mặc định: `npm`). Alias: `--method`  |
| `--npm`                               | Lối tắt cho phương pháp npm                                |
| `--git`                               | Lối tắt cho phương pháp git. Alias: `--github`             |
| `--version <version\|dist-tag\|spec>` | Phiên bản npm, dist-tag, hoặc package spec (mặc định: `latest`) |
| `--beta`                              | Sử dụng beta dist-tag nếu có, nếu không thì fallback về `latest`  |
| `--git-dir <path>`                    | Thư mục checkout (mặc định: `~/openclaw`). Alias: `--dir`  |
| `--no-git-update`                     | Bỏ qua `git pull` cho checkout hiện có                      |
| `--no-prompt`                         | Vô hiệu hóa prompt                                         |
| `--no-onboard`                        | Bỏ qua onboarding                                          |
| `--onboard`                           | Bật onboarding                                             |
| `--dry-run`                           | In ra các hành động mà không áp dụng thay đổi               |
| `--verbose`                           | Bật debug output (`set -x`, npm notice-level logs)         |
| `--help`                              | Hiển thị cách sử dụng (`-h`)                               |

  </Accordion>

  <Accordion title="Tham khảo biến môi trường">

| Biến                                                    | Mô tả                                           |
| ------------------------------------------------------- | ----------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Phương pháp cài đặt                             |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Phiên bản npm, dist-tag, hoặc package spec      |
| `OPENCLAW_BETA=0\|1`                                    | Sử dụng beta nếu có                             |
| `OPENCLAW_GIT_DIR=<path>`                               | Thư mục checkout                                |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Bật/tắt cập nhật git                            |
| `OPENCLAW_NO_PROMPT=1`                                  | Vô hiệu hóa prompt                              |
| `OPENCLAW_NO_ONBOARD=1`                                 | Bỏ qua onboarding                               |
| `OPENCLAW_DRY_RUN=1`                                    | Chế độ chạy thử                                 |
| `OPENCLAW_VERBOSE=1`                                    | Chế độ debug                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Mức log của npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Kiểm soát hành vi sharp/libvips (mặc định: `1`) |

  </Accordion>
</AccordionGroup>

---

## install-cli.sh

<Info>
Thiết kế cho môi trường muốn mọi thứ dưới một local prefix (mặc định `~/.openclaw`) và không phụ thuộc vào Node hệ thống.
</Info>

### Luồng hoạt động (install-cli.sh)

<Steps>
  <Step title="Cài đặt Node runtime local">
    Tải về một Node LTS tarball được hỗ trợ (phiên bản được nhúng trong script và cập nhật độc lập) vào `<prefix>/tools/node-v<version>` và xác minh SHA-256.
  </Step>
  <Step title="Đảm bảo Git">
    Nếu thiếu Git, cố gắng cài đặt qua apt/dnf/yum trên Linux hoặc Homebrew trên macOS.
  </Step>
  <Step title="Cài OpenClaw dưới prefix">
    Cài đặt với npm sử dụng `--prefix <prefix>`, sau đó ghi wrapper vào `<prefix>/bin/openclaw`.
  </Step>
</Steps>

### Ví dụ (install-cli.sh)

<Tabs>
  <Tab title="Mặc định">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Prefix + phiên bản tùy chỉnh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Output JSON cho tự động hóa">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Chạy onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Tham khảo Flags">

| Flag                   | Mô tả                                                                           |
| ---------------------- | -------------------------------------------------------------------------------- |
| `--prefix <path>`      | Prefix cài đặt (mặc định: `~/.openclaw`)                                         |
| `--version <ver>`      | Phiên bản OpenClaw hoặc dist-tag (mặc định: `latest`)                            |
| `--node-version <ver>` | Phiên bản Node (mặc định: `22.22.0`)                                             |
| `--json`               | Xuất NDJSON events                                                               |
| `--onboard`            | Chạy `openclaw onboard` sau khi cài đặt                                          |
| `--no-onboard`         | Bỏ qua onboarding (mặc định)                                                     |
| `--set-npm-prefix`     | Trên Linux, buộc npm prefix thành `~/.npm-global` nếu prefix hiện tại không ghi được |
| `--help`               | Hiển thị cách sử dụng (`-h`)                                                     |

  </Accordion>

  <Accordion title="Tham khảo biến môi trường">

| Biến                                        | Mô tả                                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefix cài đặt                                                                      |
| `OPENCLAW_VERSION=<ver>`                    | Phiên bản OpenClaw hoặc dist-tag                                                    |
| `OPENCLAW_NODE_VERSION=<ver>`               | Phiên bản Node                                                                      |
| `OPENCLAW_NO_ONBOARD=1`                     | Bỏ qua onboarding                                                                   |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Mức log của npm                                                                     |
| `OPENCLAW_GIT_DIR=<path>`                   | Đường dẫn tìm kiếm dọn dẹp legacy (sử dụng khi xóa bỏ checkout submodule `Peekaboo` cũ) |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Kiểm soát hành vi sharp/libvips (mặc định: `1`)                                     |

  </Accordion>
</AccordionGroup>

---

## install.ps1

### Luồng hoạt động (install.ps1)

<Steps>
  <Step title="Đảm bảo môi trường PowerShell + Windows">
    Yêu cầu PowerShell 5+.
  </Step>
  <Step title="Đảm bảo Node.js 24 mặc định">
    Nếu thiếu, cố gắng cài đặt qua winget, sau đó Chocolatey, rồi Scoop. Node 22 LTS, hiện tại là `22.16+`, vẫn được hỗ trợ để tương thích.
  </Step>
  <Step title="Cài OpenClaw">
    - Phương pháp `npm` (mặc định): cài npm toàn cầu sử dụng `-Tag` đã chọn
    - Phương pháp `git`: clone/cập nhật repo, cài đặt/xây dựng với pnpm, và cài wrapper tại `%USERPROFILE%\.local\bin\openclaw.cmd`
  </Step>
  <Step title="Nhiệm vụ sau cài đặt">
    Thêm thư mục bin cần thiết vào PATH người dùng khi có thể, sau đó chạy `openclaw doctor --non-interactive` khi nâng cấp và cài git (cố gắng tốt nhất).
  </Step>
</Steps>

### Ví dụ (install.ps1)

<Tabs>
  <Tab title="Mặc định">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Cài đặt Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main qua npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Thư mục git tùy chỉnh">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Chạy thử">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug trace">
    ```powershell
    # install.ps1 chưa có flag -Verbose riêng.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Tham khảo Flags">

| Flag                        | Mô tả                                                      |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Phương pháp cài đặt (mặc định: `npm`)                      |
| `-Tag <tag\|version\|spec>` | npm dist-tag, phiên bản, hoặc package spec (mặc định: `latest`) |
| `-GitDir <path>`            | Thư mục checkout (mặc định: `%USERPROFILE%\openclaw`)      |
| `-NoOnboard`                | Bỏ qua onboarding                                          |
| `-NoGitUpdate`              | Bỏ qua `git pull`                                          |
| `-DryRun`                   | Chỉ in ra các hành động                                    |

  </Accordion>

  <Accordion title="Tham khảo biến môi trường">

| Biến                               | Mô tả               |
| ---------------------------------- | ------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Phương pháp cài đặt |
| `OPENCLAW_GIT_DIR=<path>`          | Thư mục checkout    |
| `OPENCLAW_NO_ONBOARD=1`            | Bỏ qua onboarding   |
| `OPENCLAW_GIT_UPDATE=0`            | Vô hiệu hóa git pull|
| `OPENCLAW_DRY_RUN=1`               | Chế độ chạy thử     |

  </Accordion>
</AccordionGroup>

<Note>
Nếu sử dụng `-InstallMethod git` và thiếu Git, script sẽ thoát và in ra link Git for Windows.
</Note>

---

## CI và tự động hóa

Sử dụng các flag/biến môi trường không tương tác để chạy ổn định.

<Tabs>
  <Tab title="install.sh (npm không tương tác)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git không tương tác)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (bỏ qua onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Tại sao cần Git?">
    Git cần thiết cho phương pháp cài đặt `git`. Đối với cài đặt `npm`, Git vẫn được kiểm tra/cài đặt để tránh lỗi `spawn git ENOENT` khi các dependency sử dụng URL git.
  </Accordion>

  <Accordion title="Tại sao npm gặp lỗi EACCES trên Linux?">
    Một số cấu hình Linux chỉ định npm global prefix đến các đường dẫn thuộc quyền sở hữu root. `install.sh` có thể chuyển prefix sang `~/.npm-global` và thêm các xuất PATH vào các file rc shell (khi các file đó tồn tại).
  </Accordion>

  <Accordion title="Vấn đề sharp/libvips">
    Các script mặc định `SHARP_IGNORE_GLOBAL_LIBVIPS=1` để tránh sharp build dựa trên libvips hệ thống. Để ghi đè:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Cài đặt Git for Windows, mở lại PowerShell, chạy lại installer.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Chạy `npm config get prefix` và thêm thư mục đó vào PATH người dùng (không cần thêm `\bin` trên Windows), sau đó mở lại PowerShell.
  </Accordion>

  <Accordion title="Windows: cách lấy output chi tiết từ installer">
    `install.ps1` hiện chưa có switch `-Verbose`.
    Sử dụng PowerShell tracing để chẩn đoán ở mức script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw không tìm thấy sau khi cài đặt">
    Thường là vấn đề PATH. Xem [Node.js troubleshooting](/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>\n