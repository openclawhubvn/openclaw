---
summary: "Cách hoạt động của các script cài đặt (install.sh, install-cli.sh, install.ps1), các flag và tự động hóa"
read_when:
  - Bạn muốn hiểu `openclaw.ai/install.sh`
  - Bạn muốn tự động hóa cài đặt (CI / headless)
  - Bạn muốn cài đặt từ một bản checkout GitHub
title: "Chi tiết bên trong Installer"
---

# Chi tiết bên trong Installer

OpenClaw cung cấp ba script cài đặt, được phục vụ từ `openclaw.ai`.

| Script                             | Nền tảng            | Chức năng                                                                                     |
| ---------------------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL | Cài đặt Node nếu cần, cài đặt OpenClaw qua npm (mặc định) hoặc git, và có thể chạy onboarding. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL | Cài đặt Node + OpenClaw vào một prefix cục bộ (`~/.openclaw`). Không cần quyền root.          |
| [`install.ps1`](#installps1)       | Windows (PowerShell)| Cài đặt Node nếu cần, cài đặt OpenClaw qua npm (mặc định) hoặc git, và có thể chạy onboarding. |

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
Nếu cài đặt thành công nhưng không tìm thấy `openclaw` trong terminal mới, hãy xem [khắc phục sự cố Node.js](/install/node#troubleshooting).
</Note>

---

## install.sh

<Tip>
Khuyến nghị cho hầu hết các cài đặt tương tác trên macOS/Linux/WSL.
</Tip>

### Quy trình (install.sh)

<Steps>
  <Step title="Phát hiện hệ điều hành">
    Hỗ trợ macOS và Linux (bao gồm WSL). Nếu phát hiện macOS, cài đặt Homebrew nếu chưa có.
  </Step>
  <Step title="Đảm bảo Node.js 24 mặc định">
    Kiểm tra phiên bản Node và cài đặt Node 24 nếu cần (Homebrew trên macOS, script thiết lập NodeSource trên Linux apt/dnf/yum). OpenClaw vẫn hỗ trợ Node 22 LTS, hiện tại là `22.16+`, để tương thích.
  </Step>
  <Step title="Đảm bảo Git">
    Cài đặt Git nếu chưa có.
  </Step>
  <Step title="Cài đặt OpenClaw">
    - Phương pháp `npm` (mặc định): cài đặt npm toàn cầu
    - Phương pháp `git`: clone/cập nhật repo, cài đặt phụ thuộc với pnpm, build, sau đó cài đặt wrapper tại `~/.local/bin/openclaw`
  </Step>
  <Step title="Nhiệm vụ sau cài đặt">
    - Chạy `openclaw doctor --non-interactive` khi nâng cấp và cài đặt git (nỗ lực tốt nhất)
    - Thực hiện onboarding khi thích hợp (TTY có sẵn, onboarding không bị vô hiệu hóa, và kiểm tra bootstrap/cấu hình thành công)
    - Mặc định `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### Phát hiện checkout nguồn

Nếu chạy bên trong một checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), script cung cấp:

- sử dụng checkout (`git`), hoặc
- sử dụng cài đặt toàn cầu (`npm`)

Nếu không có TTY và không có phương pháp cài đặt nào được thiết lập, nó mặc định là `npm` và cảnh báo.

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
  <Accordion title="Tham khảo các flag">

| Flag                                  | Mô tả                                                      |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Chọn phương pháp cài đặt (mặc định: `npm`). Alias: `--method`  |
| `--npm`                               | Phím tắt cho phương pháp npm                               |
| `--git`                               | Phím tắt cho phương pháp git. Alias: `--github`            |
| `--version <version\|dist-tag\|spec>` | Phiên bản npm, dist-tag, hoặc spec package (mặc định: `latest`) |
| `--beta`                              | Sử dụng beta dist-tag nếu có, nếu không thì dùng `latest`  |
| `--git-dir <path>`                    | Thư mục checkout (mặc định: `~/openclaw`). Alias: `--dir`  |
| `--no-git-update`                     | Bỏ qua `git pull` cho checkout hiện có                      |
| `--no-prompt`                         | Vô hiệu hóa nhắc nhở                                        |
| `--no-onboard`                        | Bỏ qua onboarding                                           |
| `--onboard`                           | Kích hoạt onboarding                                        |
| `--dry-run`                           | In ra các hành động mà không áp dụng thay đổi               |
| `--verbose`                           | Kích hoạt đầu ra debug (`set -x`, nhật ký cấp độ thông báo npm) |
| `--help`                              | Hiển thị cách sử dụng (`-h`)                                |

  </Accordion>

  <Accordion title="Tham khảo các biến môi trường">

| Biến                                                   | Mô tả                                           |
| ------------------------------------------------------ | ----------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                     | Phương pháp cài đặt                             |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>`| Phiên bản npm, dist-tag, hoặc spec package      |
| `OPENCLAW_BETA=0\|1`                                   | Sử dụng beta nếu có                             |
| `OPENCLAW_GIT_DIR=<path>`                              | Thư mục checkout                                |
| `OPENCLAW_GIT_UPDATE=0\|1`                             | Bật/tắt cập nhật git                            |
| `OPENCLAW_NO_PROMPT=1`                                 | Vô hiệu hóa nhắc nhở                            |
| `OPENCLAW_NO_ONBOARD=1`                                | Bỏ qua onboarding                               |
| `OPENCLAW_DRY_RUN=1`                                   | Chế độ chạy thử                                 |
| `OPENCLAW_VERBOSE=1`                                   | Chế độ debug                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`            | Mức độ nhật ký npm                              |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                     | Kiểm soát hành vi sharp/libvips (mặc định: `1`) |

  </Accordion>
</AccordionGroup>

---

## install-cli.sh

<Info>
Thiết kế cho các môi trường mà bạn muốn mọi thứ nằm dưới một prefix cục bộ (mặc định `~/.openclaw`) và không phụ thuộc vào Node hệ thống.
</Info>

### Quy trình (install-cli.sh)

<Steps>
  <Step title="Cài đặt runtime Node cục bộ">
    Tải xuống một tarball Node LTS được hỗ trợ đã được ghim (phiên bản được nhúng trong script và cập nhật độc lập) vào `<prefix>/tools/node-v<version>` và xác minh SHA-256.
  </Step>
  <Step title="Đảm bảo Git">
    Nếu Git thiếu, cố gắng cài đặt qua apt/dnf/yum trên Linux hoặc Homebrew trên macOS.
  </Step>
  <Step title="Cài đặt OpenClaw dưới prefix">
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
  <Tab title="Prefix tùy chỉnh + phiên bản">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Đầu ra JSON tự động">
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
  <Accordion title="Tham khảo các flag">

| Flag                   | Mô tả                                                                           |
| ---------------------- | -------------------------------------------------------------------------------- |
| `--prefix <path>`      | Prefix cài đặt (mặc định: `~/.openclaw`)                                         |
| `--version <ver>`      | Phiên bản OpenClaw hoặc dist-tag (mặc định: `latest`)                            |
| `--node-version <ver>` | Phiên bản Node (mặc định: `22.22.0`)                                             |
| `--json`               | Xuất sự kiện NDJSON                                                              |
| `--onboard`            | Chạy `openclaw onboard` sau khi cài đặt                                          |
| `--no-onboard`         | Bỏ qua onboarding (mặc định)                                                     |
| `--set-npm-prefix`     | Trên Linux, buộc npm prefix thành `~/.npm-global` nếu prefix hiện tại không ghi được |
| `--help`               | Hiển thị cách sử dụng (`-h`)                                                     |

  </Accordion>

  <Accordion title="Tham khảo các biến môi trường">

| Biến                                       | Mô tả                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                   | Prefix cài đặt                                                                  |
| `OPENCLAW_VERSION=<ver>`                   | Phiên bản OpenClaw hoặc dist-tag                                                |
| `OPENCLAW_NODE_VERSION=<ver>`              | Phiên bản Node                                                                  |
| `OPENCLAW_NO_ONBOARD=1`                    | Bỏ qua onboarding                                                               |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`| Mức độ nhật ký npm                                                              |
| `OPENCLAW_GIT_DIR=<path>`                  | Đường dẫn tìm kiếm dọn dẹp cũ (sử dụng khi loại bỏ checkout submodule `Peekaboo` cũ) |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`         | Kiểm soát hành vi sharp/libvips (mặc định: `1`)                                 |

  </Accordion>
</AccordionGroup>

---

## install.ps1

### Quy trình (install.ps1)

<Steps>
  <Step title="Đảm bảo môi trường PowerShell + Windows">
    Yêu cầu PowerShell 5+.
  </Step>
  <Step title="Đảm bảo Node.js 24 mặc định">
    Nếu thiếu, cố gắng cài đặt qua winget, sau đó Chocolatey, rồi Scoop. Node 22 LTS, hiện tại là `22.16+`, vẫn được hỗ trợ để tương thích.
  </Step>
  <Step title="Cài đặt OpenClaw">
    - Phương pháp `npm` (mặc định): cài đặt npm toàn cầu sử dụng `-Tag` đã chọn
    - Phương pháp `git`: clone/cập nhật repo, cài đặt/xây dựng với pnpm, và cài đặt wrapper tại `%USERPROFILE%\.local\bin\openclaw.cmd`
  </Step>
  <Step title="Nhiệm vụ sau cài đặt">
    Thêm thư mục bin cần thiết vào PATH người dùng khi có thể, sau đó chạy `openclaw doctor --non-interactive` khi nâng cấp và cài đặt git (nỗ lực tốt nhất).
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
  <Tab title="Dấu vết debug">
    ```powershell
    # install.ps1 chưa có flag -Verbose riêng.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Tham khảo các flag">

| Flag                        | Mô tả                                                      |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Phương pháp cài đặt (mặc định: `npm`)                      |
| `-Tag <tag\|version\|spec>` | npm dist-tag, phiên bản, hoặc spec package (mặc định: `latest`) |
| `-GitDir <path>`            | Thư mục checkout (mặc định: `%USERPROFILE%\openclaw`)      |
| `-NoOnboard`                | Bỏ qua onboarding                                          |
| `-NoGitUpdate`              | Bỏ qua `git pull`                                          |
| `-DryRun`                   | Chỉ in ra các hành động                                    |

  </Accordion>

  <Accordion title="Tham khảo các biến môi trường">

| Biến                              | Mô tả                  |
| --------------------------------- | ---------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`| Phương pháp cài đặt    |
| `OPENCLAW_GIT_DIR=<path>`         | Thư mục checkout       |
| `OPENCLAW_NO_ONBOARD=1`           | Bỏ qua onboarding      |
| `OPENCLAW_GIT_UPDATE=0`           | Vô hiệu hóa git pull   |
| `OPENCLAW_DRY_RUN=1`              | Chế độ chạy thử        |

  </Accordion>
</AccordionGroup>

<Note>
Nếu sử dụng `-InstallMethod git` và Git thiếu, script sẽ thoát và in ra liên kết Git for Windows.
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
    Git cần thiết cho phương pháp cài đặt `git`. Đối với cài đặt `npm`, Git vẫn được kiểm tra/cài đặt để tránh lỗi `spawn git ENOENT` khi các phụ thuộc sử dụng URL git.
  </Accordion>

  <Accordion title="Tại sao npm gặp lỗi EACCES trên Linux?">
    Một số thiết lập Linux chỉ định npm global prefix đến các đường dẫn thuộc quyền root. `install.sh` có thể chuyển prefix thành `~/.npm-global` và thêm các xuất PATH vào các file rc shell (khi các file đó tồn tại).
  </Accordion>

  <Accordion title="Vấn đề sharp/libvips">
    Các script mặc định `SHARP_IGNORE_GLOBAL_LIBVIPS=1` để tránh sharp xây dựng dựa trên libvips hệ thống. Để ghi đè:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Cài đặt Git for Windows, mở lại PowerShell, chạy lại installer.
  </Accordion>

  <Accordion title='Windows: "openclaw không được nhận diện"'>
    Chạy `npm config get prefix` và thêm thư mục đó vào PATH người dùng của bạn (không cần hậu tố `\bin` trên Windows), sau đó mở lại PowerShell.
  </Accordion>

  <Accordion title="Windows: làm thế nào để có đầu ra installer chi tiết">
    `install.ps1` hiện không cung cấp switch `-Verbose`.
    Sử dụng theo dõi PowerShell để chẩn đoán cấp độ script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw không tìm thấy sau khi cài đặt">
    Thường là vấn đề PATH. Xem [khắc phục sự cố Node.js](/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>
