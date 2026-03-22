---
summary: "Cài đặt OpenClaw tự động, bảo mật với Ansible, Tailscale VPN và firewall cách ly"
read_when:
  - Muốn triển khai server tự động với bảo mật cao
  - Cần thiết lập cách ly firewall với truy cập VPN
  - Đang triển khai trên server Debian/Ubuntu từ xa
title: "Ansible"
---

# Cài đặt Ansible

Triển khai OpenClaw lên server production với **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- công cụ cài đặt tự động với kiến trúc ưu tiên bảo mật.

<Info>
Repo [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) là nguồn chính cho triển khai Ansible. Trang này chỉ là tóm tắt nhanh.
</Info>

## Yêu cầu

| Yêu cầu     | Chi tiết                                                   |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ hoặc Ubuntu 20.04+                             |
| **Quyền**   | Root hoặc sudo                                            |
| **Mạng**    | Kết nối Internet để cài đặt package                       |
| **Ansible** | 2.14+ (cài tự động qua script quick-start)                |

## Bạn nhận được gì

- **Bảo mật ưu tiên firewall** -- UFW + Docker cách ly (chỉ SSH + Tailscale truy cập được)
- **Tailscale VPN** -- truy cập từ xa an toàn mà không cần công khai dịch vụ
- **Docker** -- container sandbox cách ly, chỉ bind localhost
- **Bảo mật nhiều lớp** -- kiến trúc bảo mật 4 lớp
- **Tích hợp Systemd** -- tự động khởi động với bảo mật cao
- **Cài đặt một lệnh** -- triển khai hoàn chỉnh trong vài phút

## Bắt đầu nhanh

Cài đặt một lệnh:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Cài đặt những gì

Playbook Ansible cài đặt và cấu hình:

1. **Tailscale** -- mesh VPN cho truy cập từ xa an toàn
2. **UFW firewall** -- chỉ mở cổng SSH + Tailscale
3. **Docker CE + Compose V2** -- cho sandbox agent
4. **Node.js 24 + pnpm** -- runtime dependencies (Node 22 LTS, hiện tại `22.16+`, vẫn được hỗ trợ)
5. **OpenClaw** -- chạy trực tiếp trên host, không container hóa
6. **Dịch vụ Systemd** -- tự động khởi động với bảo mật cao

<Note>
Gateway chạy trực tiếp trên host (không trong Docker), nhưng sandbox agent dùng Docker để cách ly. Xem [Sandboxing](/gateway/sandboxing) để biết thêm chi tiết.
</Note>

## Thiết lập sau cài đặt

<Steps>
  <Step title="Chuyển sang user openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Chạy wizard onboarding">
    Script sau cài đặt sẽ hướng dẫn cấu hình OpenClaw.
  </Step>
  <Step title="Kết nối các nhà cung cấp nhắn tin">
    Đăng nhập vào WhatsApp, Telegram, Discord, hoặc Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Xác minh cài đặt">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Kết nối với Tailscale">
    Tham gia mesh VPN để truy cập từ xa an toàn.
  </Step>
</Steps>

### Lệnh nhanh

```bash
# Kiểm tra trạng thái dịch vụ
sudo systemctl status openclaw

# Xem log trực tiếp
sudo journalctl -u openclaw -f

# Khởi động lại gateway
sudo systemctl restart openclaw

# Đăng nhập nhà cung cấp (chạy dưới user openclaw)
sudo -i -u openclaw
openclaw channels login
```

## Kiến trúc bảo mật

Triển khai sử dụng mô hình bảo mật 4 lớp:

1. **Firewall (UFW)** -- chỉ mở cổng SSH (22) + Tailscale (41641/udp) công khai
2. **VPN (Tailscale)** -- gateway chỉ truy cập qua mesh VPN
3. **Docker isolation** -- chuỗi iptables DOCKER-USER ngăn chặn lộ cổng ngoài
4. **Systemd hardening** -- NoNewPrivileges, PrivateTmp, user không đặc quyền

Để kiểm tra bề mặt tấn công bên ngoài:

```bash
nmap -p- YOUR_SERVER_IP
```

Chỉ cổng 22 (SSH) nên mở. Tất cả dịch vụ khác (gateway, Docker) đều bị khóa.

Docker được cài cho sandbox agent (thực thi công cụ cách ly), không phải để chạy gateway. Xem [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) để cấu hình sandbox.

## Cài đặt thủ công

Nếu muốn tự kiểm soát quá trình tự động:

<Steps>
  <Step title="Cài đặt các yêu cầu">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clone repository">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Cài đặt Ansible collections">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Chạy playbook">
    ```bash
    ./run-playbook.sh
    ```

    Hoặc chạy trực tiếp và sau đó thực thi script setup thủ công:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Sau đó chạy: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Cập nhật

Trình cài đặt Ansible thiết lập OpenClaw để cập nhật thủ công. Xem [Updating](/install/updating) để biết quy trình cập nhật chuẩn.

Để chạy lại playbook Ansible (ví dụ, thay đổi cấu hình):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Quá trình này là idempotent và an toàn để chạy nhiều lần.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Firewall chặn kết nối">
    - Đảm bảo có thể truy cập qua Tailscale VPN trước
    - Truy cập SSH (cổng 22) luôn được phép
    - Gateway chỉ truy cập qua Tailscale theo thiết kế
  </Accordion>
  <Accordion title="Dịch vụ không khởi động">
    ```bash
    # Kiểm tra log
    sudo journalctl -u openclaw -n 100

    # Kiểm tra quyền
    sudo ls -la /opt/openclaw

    # Thử khởi động thủ công
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Vấn đề với Docker sandbox">
    ```bash
    # Kiểm tra Docker đang chạy
    sudo systemctl status docker

    # Kiểm tra image sandbox
    sudo docker images | grep openclaw-sandbox

    # Build image sandbox nếu thiếu
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Đăng nhập nhà cung cấp thất bại">
    Đảm bảo đang chạy dưới user `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Cấu hình nâng cao

Để biết chi tiết về kiến trúc bảo mật và khắc phục sự cố, xem repo openclaw-ansible:

- [Security Architecture](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Liên quan

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- hướng dẫn triển khai đầy đủ
- [Docker](/install/docker) -- thiết lập gateway container hóa
- [Sandboxing](/gateway/sandboxing) -- cấu hình sandbox agent
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- cách ly từng agent\n