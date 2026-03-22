---
summary: "Đăng nhập GitHub Copilot từ OpenClaw bằng device flow"
read_when:
  - Bạn muốn sử dụng GitHub Copilot làm nhà cung cấp mô hình
  - Bạn cần quy trình `openclaw models auth login-github-copilot`
title: "GitHub Copilot"
---

# GitHub Copilot

## GitHub Copilot là gì?

GitHub Copilot là trợ lý lập trình AI của GitHub. Nó cung cấp quyền truy cập vào các mô hình Copilot cho tài khoản và gói GitHub của bạn. OpenClaw có thể sử dụng Copilot làm nhà cung cấp mô hình theo hai cách khác nhau.

## Hai cách sử dụng Copilot trong OpenClaw

### 1) Nhà cung cấp GitHub Copilot tích hợp sẵn (`github-copilot`)

Sử dụng quy trình đăng nhập thiết bị gốc để lấy token GitHub, sau đó đổi nó lấy token API Copilot khi OpenClaw chạy. Đây là cách **mặc định** và đơn giản nhất vì không cần VS Code.

### 2) Plugin Copilot Proxy (`copilot-proxy`)

Sử dụng tiện ích mở rộng **Copilot Proxy** trong VS Code như một cầu nối cục bộ. OpenClaw giao tiếp với endpoint `/v1` của proxy và sử dụng danh sách mô hình bạn cấu hình ở đó. Chọn cách này khi bạn đã chạy Copilot Proxy trong VS Code hoặc cần định tuyến qua nó. Bạn phải kích hoạt plugin và giữ cho tiện ích mở rộng VS Code hoạt động.

Sử dụng GitHub Copilot làm nhà cung cấp mô hình (`github-copilot`). Lệnh đăng nhập chạy quy trình thiết bị GitHub, lưu hồ sơ xác thực và cập nhật cấu hình để sử dụng hồ sơ đó.

## Thiết lập CLI

```bash
openclaw models auth login-github-copilot
```

Bạn sẽ được yêu cầu truy cập một URL và nhập mã dùng một lần. Giữ cửa sổ terminal mở cho đến khi hoàn tất.

### Các tùy chọn bổ sung

```bash
openclaw models auth login-github-copilot --profile-id github-copilot:work
openclaw models auth login-github-copilot --yes
```

## Đặt mô hình mặc định

```bash
openclaw models set github-copilot/gpt-4o
```

### Đoạn cấu hình

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## Lưu ý

- Yêu cầu TTY tương tác; chạy trực tiếp trong terminal.
- Khả dụng của mô hình Copilot phụ thuộc vào gói của bạn; nếu một mô hình bị từ chối, hãy thử ID khác (ví dụ `github-copilot/gpt-4.1`).
- Quá trình đăng nhập lưu token GitHub trong kho hồ sơ xác thực và đổi nó lấy token API Copilot khi OpenClaw chạy.
