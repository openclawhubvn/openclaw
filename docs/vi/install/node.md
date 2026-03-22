---
title: "Node.js"
summary: "Cài đặt và cấu hình Node.js cho OpenClaw — yêu cầu phiên bản, tùy chọn cài đặt và xử lý sự cố PATH"
read_when:
  - "Cần cài đặt Node.js trước khi cài OpenClaw"
  - "Đã cài OpenClaw nhưng lệnh `openclaw` không tìm thấy"
  - "npm install -g gặp lỗi quyền hoặc vấn đề PATH"
---

# Node.js

OpenClaw yêu cầu **Node 22.16 trở lên**. **Node 24 là runtime mặc định và được khuyến nghị** cho cài đặt, CI và quy trình phát hành. Node 22 vẫn được hỗ trợ qua dòng LTS hiện tại. [Script cài đặt](/install#alternative-install-methods) sẽ tự động phát hiện và cài đặt Node — trang này dành cho những ai muốn tự thiết lập Node và đảm bảo mọi thứ được cấu hình đúng (phiên bản, PATH, cài đặt toàn cục).

## Kiểm tra phiên bản

```bash
node -v
```

Nếu kết quả là `v24.x.x` hoặc cao hơn, bạn đang dùng phiên bản mặc định được khuyến nghị. Nếu là `v22.16.x` hoặc cao hơn, bạn đang dùng Node 22 LTS được hỗ trợ, nhưng vẫn nên nâng cấp lên Node 24 khi có thể. Nếu Node chưa được cài đặt hoặc phiên bản quá cũ, hãy chọn một phương pháp cài đặt dưới đây.

## Cài đặt Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (khuyến nghị):

    ```bash
    brew install node
    ```

    Hoặc tải trình cài đặt macOS từ [nodejs.org](https://nodejs.org/).

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

    Hoặc sử dụng trình quản lý phiên bản (xem bên dưới).

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

    Hoặc tải trình cài đặt Windows từ [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Sử dụng trình quản lý phiên bản (nvm, fnm, mise, asdf)">
  Trình quản lý phiên bản giúp bạn dễ dàng chuyển đổi giữa các phiên bản Node. Các tùy chọn phổ biến:

- [**fnm**](https://github.com/Schniz/fnm) — nhanh, đa nền tảng
- [**nvm**](https://github.com/nvm-sh/nvm) — được sử dụng rộng rãi trên macOS/Linux
- [**mise**](https://mise.jdx.dev/) — hỗ trợ nhiều ngôn ngữ (Node, Python, Ruby, v.v.)

Ví dụ với fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Đảm bảo trình quản lý phiên bản của bạn được khởi tạo trong file khởi động shell (`~/.zshrc` hoặc `~/.bashrc`). Nếu không, `openclaw` có thể không được tìm thấy trong các phiên làm việc terminal mới vì PATH sẽ không bao gồm thư mục bin của Node.
  </Warning>
</Accordion>

## Xử lý sự cố

### `openclaw: command not found`

Điều này thường có nghĩa là thư mục bin toàn cục của npm không có trong PATH.

<Steps>
  <Step title="Tìm prefix toàn cục của npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Kiểm tra xem nó có trong PATH không">
    ```bash
    echo "$PATH"
    ```

    Tìm `<npm-prefix>/bin` (macOS/Linux) hoặc `<npm-prefix>` (Windows) trong kết quả.

  </Step>
  <Step title="Thêm vào file khởi động shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Thêm vào `~/.zshrc` hoặc `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Sau đó mở terminal mới (hoặc chạy `rehash` trong zsh / `hash -r` trong bash).
      </Tab>
      <Tab title="Windows">
        Thêm kết quả của `npm prefix -g` vào PATH hệ thống qua Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Lỗi quyền trên `npm install -g` (Linux)

Nếu gặp lỗi `EACCES`, hãy chuyển prefix toàn cục của npm sang thư mục có quyền ghi của người dùng:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Thêm dòng `export PATH=...` vào `~/.bashrc` hoặc `~/.zshrc` để thiết lập vĩnh viễn.
