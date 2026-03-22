---
title: "Node.js"
summary: "Cài đặt và cấu hình Node.js cho OpenClaw — yêu cầu phiên bản, tùy chọn cài đặt và xử lý lỗi PATH"
read_when:
  - "Cần cài Node.js trước khi cài OpenClaw"
  - "Đã cài OpenClaw nhưng `openclaw` báo không tìm thấy lệnh"
  - "`npm install -g` lỗi quyền hoặc PATH"

# Node.js

OpenClaw cần **Node 22.16 trở lên**. **Node 24 là runtime mặc định và khuyến nghị** cho cài đặt, CI và release. Node 22 vẫn được hỗ trợ qua LTS. [Script cài đặt](/install#alternative-install-methods) sẽ tự động phát hiện và cài Node — trang này dành cho ai muốn tự setup Node và đảm bảo mọi thứ đúng (phiên bản, PATH, cài đặt global).

## Kiểm tra phiên bản

```bash
node -v
```

Nếu in ra `v24.x.x` hoặc cao hơn, đang dùng bản mặc định khuyến nghị. Nếu in ra `v22.16.x` hoặc cao hơn, đang dùng Node 22 LTS, nhưng vẫn nên nâng cấp lên Node 24 khi tiện. Nếu chưa cài Node hoặc phiên bản quá cũ, chọn phương pháp cài dưới đây.

## Cài đặt Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (khuyến nghị):

    ```bash
    brew install node
    ```

    Hoặc tải installer cho macOS từ [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    Hoặc dùng version manager (xem dưới).

  </Tab>
  <Tab title="Windows">
    **winget** (khuyến nghị):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Hoặc tải installer cho Windows từ [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Dùng version manager (nvm, fnm, mise, asdf)">
  Version manager giúp chuyển đổi giữa các phiên bản Node dễ dàng. Các lựa chọn phổ biến:

- [**fnm**](https://github.com/Schniz/fnm) — nhanh, đa nền tảng
- [**nvm**](https://github.com/nvm-sh/nvm) — phổ biến trên macOS/Linux
- [**mise**](https://mise.jdx.dev/) — hỗ trợ nhiều ngôn ngữ (Node, Python, Ruby, v.v.)

Ví dụ với fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Đảm bảo version manager được khởi tạo trong file startup shell (`~/.zshrc` hoặc `~/.bashrc`). Nếu không, `openclaw` có thể không tìm thấy trong các phiên làm việc mới vì PATH không bao gồm thư mục bin của Node.
  </Warning>
</Accordion>

## Xử lý sự cố

### `openclaw: command not found`

Thường do thư mục bin global của npm không có trong PATH.

<Steps>
  <Step title="Tìm global npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Kiểm tra xem có trong PATH không">
    ```bash
    echo "$PATH"
    ```

    Tìm `<npm-prefix>/bin` (macOS/Linux) hoặc `<npm-prefix>` (Windows) trong output.

  </Step>
  <Step title="Thêm vào file startup shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Thêm vào `~/.zshrc` hoặc `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Sau đó mở terminal mới (hoặc chạy `rehash` trong zsh / `hash -r` trong bash).
      </Tab>
      <Tab title="Windows">
        Thêm output của `npm prefix -g` vào system PATH qua Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Lỗi quyền khi `npm install -g` (Linux)

Nếu gặp lỗi `EACCES`, chuyển global prefix của npm sang thư mục có quyền ghi:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Thêm dòng `export PATH=...` vào `~/.bashrc` hoặc `~/.zshrc` để cố định.\n