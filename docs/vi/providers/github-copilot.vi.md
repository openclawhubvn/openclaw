---
summary: "Đăng nhập GitHub Copilot từ OpenClaw bằng device flow"
read_when:
  - Muốn dùng GitHub Copilot làm model provider
  - Cần flow `openclaw models auth login-github-copilot`
title: "GitHub Copilot"
---

# GitHub Copilot

## GitHub Copilot là gì?

GitHub Copilot là trợ lý AI cho code của GitHub. Nó cung cấp quyền truy cập vào các model Copilot cho tài khoản và gói GitHub. OpenClaw có thể dùng Copilot làm model provider theo hai cách.

## Hai cách dùng Copilot trong OpenClaw

### 1) Built-in GitHub Copilot provider (`github-copilot`)

Dùng device-login flow để lấy GitHub token, sau đó đổi lấy Copilot API tokens khi OpenClaw chạy. Đây là cách **mặc định** và đơn giản nhất vì không cần VS Code.

### 2) Copilot Proxy plugin (`copilot-proxy`)

Dùng extension **Copilot Proxy** của VS Code như cầu nối local. OpenClaw kết nối với endpoint `/v1` của proxy và dùng danh sách model bạn cấu hình ở đó. Chọn cách này khi đã chạy Copilot Proxy trong VS Code hoặc cần routing qua nó. Phải bật plugin và giữ cho extension VS Code chạy.

Dùng GitHub Copilot làm model provider (`github-copilot`). Lệnh login chạy device flow của GitHub, lưu auth profile và cập nhật config để dùng profile đó.

## Thiết lập CLI

```bash
openclaw models auth login-github-copilot
```

Sẽ có yêu cầu truy cập URL và nhập mã một lần. Giữ terminal mở cho đến khi hoàn tất.

### Flags tùy chọn

```bash
openclaw models auth login-github-copilot --profile-id github-copilot:work
openclaw models auth login-github-copilot --yes
```

## Đặt model mặc định

```bash
openclaw models set github-copilot/gpt-4o
```

### Đoạn cấu hình

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## Ghi chú

- Cần TTY tương tác; chạy trực tiếp trong terminal.
- Khả dụng của model Copilot phụ thuộc vào gói; nếu model bị từ chối, thử ID khác (ví dụ `github-copilot/gpt-4.1`).
- Lệnh login lưu GitHub token trong auth profile store và đổi lấy Copilot API token khi OpenClaw chạy.\n