---
summary: "Tìm hiểu cách cài đặt OpenClaw tự động và an toàn với Ansible, Tailscale VPN và bảo mật tường lửa hiệu quả."
read_when:
  - Bạn muốn triển khai máy chủ tự động với bảo mật cao
  - Bạn cần thiết lập cách ly tường lửa với truy cập VPN
  - Bạn đang triển khai trên máy chủ Debian/Ubuntu từ xa
title: "Hướng Dẫn Cài Đặt OpenClaw Với Ansible"
---

# Cài đặt Ansible

Triển khai OpenClaw lên máy chủ sản xuất với **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** — một trình cài đặt tự động với kiến trúc ưu tiên bảo mật.

<Info>
Kho [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) là nguồn thông tin chính xác cho việc triển khai Ansible. Trang này cung cấp cái nhìn tổng quan nhanh.
</Info>

## Yêu cầu trước khi cài đặt

| Yêu cầu     | Chi tiết                                                   |
| ----------- | --------------------------------------------------------- |
| **Hệ điều hành** | Debian 11+ hoặc Ubuntu 20.04+                               |
| **Quyền truy cập**  | Quyền root hoặc sudo                                   |
| **Mạng** | Kết nối Internet để cài đặt gói                              |
| **Ansible** | 2.14+ (được cài đặt tự động bởi script khởi động nhanh) |

## Bạn sẽ nhận được gì

- **Bảo mật ưu tiên tường lửa** — UFW + cách ly Docker (chỉ truy cập SSH + Tailscale)
- **Tailscale VPN** — truy cập từ xa an toàn mà không cần công khai dịch vụ
- **Docker** — container sandbox cách ly, chỉ kết nối localhost
- **Bảo mật nhiều lớp** — kiến trúc bảo mật 4 lớp
- **Tích hợp Systemd** — tự động khởi động khi boot với bảo mật cao
- **Cài đặt một lệnh** — triển khai hoàn chỉnh trong vài phút

## Bắt đầu nhanh

Cài đặt bằng một lệnh:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Những gì được cài đặt

Playbook Ansible sẽ cài đặt và cấu hình:

1. **Tailscale** — VPN mesh cho truy cập từ xa an toàn
2. **Tường lửa UFW** — chỉ cổng SSH + Tailscale
3. **Docker CE + Compose V2** — cho sandbox agent
4. **Node.js 24 + pnpm** — các phụ thuộc runtime (Node 22 LTS, hiện tại `22.16+`, vẫn được hỗ trợ)
5. **OpenClaw** — chạy trực tiếp trên host, không container hóa
6. **Dịch vụ Systemd** — tự động khởi động với bảo mật cao

<Note>
Gateway chạy trực tiếp trên host (không trong Docker), nhưng sandbox agent sử dụng Docker để cách ly. Xem [Sandboxing](/gateway/sandboxing) để biết chi tiết.
</Note>

## Thiết lập sau cài đặt

<Steps>
  <Step title="Chuyển sang người dùng openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Chạy trình hướng dẫn cấu hình">
    Script sau cài đặt sẽ hướng dẫn bạn cấu hình các thiết lập OpenClaw.
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
    Tham gia vào VPN mesh của bạn để truy cập từ xa an toàn.
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

# Đăng nhập nhà cung cấp (chạy dưới người dùng openclaw)
sudo -i -u openclaw
openclaw channels login
```

## Kiến trúc bảo mật

Triển khai sử dụng mô hình bảo mật 4 lớp:

1. **Tường lửa (UFW)** — chỉ công khai cổng SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** — gateway chỉ truy cập được qua VPN mesh
3. **Cách ly Docker** — chuỗi iptables DOCKER-USER ngăn chặn công khai cổng ngoài
4. **Bảo mật Systemd** — NoNewPrivileges, PrivateTmp, người dùng không có quyền

Để kiểm tra bề mặt tấn công bên ngoài của bạn:

```bash
nmap -p- YOUR_SERVER_IP
```

Chỉ cổng 22 (SSH) nên mở. Tất cả các dịch vụ khác (gateway, Docker) đều bị khóa.

Docker được cài đặt cho sandbox agent (thực thi công cụ cách ly), không phải để chạy gateway. Xem [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) để cấu hình sandbox.

## Cài đặt thủ công

Nếu bạn muốn kiểm soát thủ công quá trình tự động:

<Steps>
  <Step title="Cài đặt các yêu cầu cần thiết">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clone kho lưu trữ">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Cài đặt các bộ sưu tập Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Chạy playbook">
    ```bash
    ./run-playbook.sh
    ```

    Hoặc chạy trực tiếp và sau đó thực hiện script thiết lập thủ công:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Sau đó chạy: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Cập nhật

Trình cài đặt Ansible thiết lập OpenClaw để cập nhật thủ công. Xem [Cập nhật](/install/updating) để biết quy trình cập nhật tiêu chuẩn.

Để chạy lại playbook Ansible (ví dụ, cho các thay đổi cấu hình):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Điều này là idempotent và an toàn để chạy nhiều lần.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Tường lửa chặn kết nối của tôi">
    - Đảm bảo bạn có thể truy cập qua Tailscale VPN trước
    - Truy cập SSH (cổng 22) luôn được cho phép
    - Gateway chỉ có thể truy cập qua Tailscale theo thiết kế
  </Accordion>
  <Accordion title="Dịch vụ không khởi động">
    ```bash
    # Kiểm tra log
    sudo journalctl -u openclaw -n 100

    # Xác minh quyền
    sudo ls -la /opt/openclaw

    # Thử khởi động thủ công
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Vấn đề với sandbox Docker">
    ```bash
    # Xác minh Docker đang chạy
    sudo systemctl status docker

    # Kiểm tra hình ảnh sandbox
    sudo docker images | grep openclaw-sandbox

    # Xây dựng hình ảnh sandbox nếu thiếu
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Đăng nhập nhà cung cấp thất bại">
    Đảm bảo bạn đang chạy dưới người dùng `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Cấu hình nâng cao

Để biết chi tiết về kiến trúc bảo mật và khắc phục sự cố, xem kho openclaw-ansible:

- [Kiến trúc bảo mật](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Chi tiết kỹ thuật](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Hướng dẫn khắc phục sự cố](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Liên quan

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) — hướng dẫn triển khai đầy đủ
- [Docker](/install/docker) — thiết lập gateway container hóa
- [Sandboxing](/gateway/sandboxing) — cấu hình sandbox agent
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) — cách ly từng agent
