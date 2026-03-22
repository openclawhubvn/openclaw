---
summary: "Chạy OpenClaw trong container Podman không cần quyền root"
read_when:
  - Muốn dùng Podman thay vì Docker để container hóa gateway
title: "Podman"
---

# Podman

Chạy OpenClaw Gateway trong container Podman **không cần quyền root**. Dùng cùng image với Docker (build từ [Dockerfile](https://github.com/openclaw/openclaw/blob/main/Dockerfile)).

## Yêu cầu

- **Podman** (chế độ không cần quyền root)
- Quyền **sudo** để setup một lần (tạo user riêng và build image)

## Bắt đầu nhanh

<Steps>
  <Step title="Setup một lần">
    Từ thư mục gốc của repo, chạy script setup. Script này tạo user `openclaw`, build image container và cài đặt script khởi chạy:

    ```bash
    ./scripts/podman/setup.sh
    ```

    Script cũng tạo config tối thiểu tại `~openclaw/.openclaw/openclaw.json` (đặt `gateway.mode` là `"local"`) để Gateway có thể khởi động mà không cần wizard.

    Mặc định container **không** được cài làm dịch vụ systemd — bạn sẽ khởi động thủ công ở bước sau. Để setup kiểu production với tự động khởi động và restart, thêm `--quadlet`:

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    (Hoặc đặt `OPENCLAW_PODMAN_QUADLET=1`. Dùng `--container` để chỉ cài container và script khởi chạy.)

    **Biến môi trường build-time tùy chọn** (đặt trước khi chạy `scripts/podman/setup.sh`):

    - `OPENCLAW_DOCKER_APT_PACKAGES` — cài thêm gói apt khi build image.
    - `OPENCLAW_EXTENSIONS` — cài trước các dependency của extension (tên cách nhau bằng dấu cách, ví dụ `diagnostics-otel matrix`).

  </Step>

  <Step title="Khởi động Gateway">
    Để khởi động nhanh thủ công:

    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

  </Step>

  <Step title="Chạy wizard onboarding">
    Để thêm channel hoặc provider tương tác:

    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Sau đó mở `http://127.0.0.1:18789/` và dùng token từ `~openclaw/.openclaw/.env` (hoặc giá trị được in ra bởi setup).

  </Step>
</Steps>

## Systemd (Quadlet, tùy chọn)

Nếu đã chạy `./scripts/podman/setup.sh --quadlet` (hoặc `OPENCLAW_PODMAN_QUADLET=1`), một unit [Podman Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html) được cài để gateway chạy như dịch vụ systemd user cho user openclaw. Dịch vụ được bật và khởi động cuối setup.

- **Start:** `sudo systemctl --machine openclaw@ --user start openclaw.service`
- **Stop:** `sudo systemctl --machine openclaw@ --user stop openclaw.service`
- **Status:** `sudo systemctl --machine openclaw@ --user status openclaw.service`
- **Logs:** `sudo journalctl --machine openclaw@ --user -u openclaw.service -f`

File quadlet nằm tại `~openclaw/.config/containers/systemd/openclaw.container`. Để thay đổi port hoặc env, sửa file đó (hoặc `.env` mà nó sử dụng), rồi `sudo systemctl --machine openclaw@ --user daemon-reload` và khởi động lại dịch vụ. Khi boot, dịch vụ tự động khởi động nếu lingering được bật cho openclaw (setup sẽ làm điều này khi loginctl có sẵn).

Để thêm quadlet **sau** khi setup ban đầu không dùng nó, chạy lại: `./scripts/podman/setup.sh --quadlet`.

## User openclaw (không login)

`scripts/podman/setup.sh` tạo user hệ thống `openclaw`:

- **Shell:** `nologin` — không login tương tác; giảm bề mặt tấn công.
- **Home:** ví dụ `/home/openclaw` — chứa `~/.openclaw` (config, workspace) và script khởi chạy `run-openclaw-podman.sh`.
- **Rootless Podman:** User phải có dải **subuid** và **subgid**. Nhiều distro tự động gán khi tạo user. Nếu setup cảnh báo, thêm dòng vào `/etc/subuid` và `/etc/subgid`:

  ```text
  openclaw:100000:65536
  ```

  Sau đó khởi động gateway với user đó (ví dụ từ cron hoặc systemd):

  ```bash
  sudo -u openclaw /home/openclaw/run-openclaw-podman.sh
  sudo -u openclaw /home/openclaw/run-openclaw-podman.sh setup
  ```

- **Config:** Chỉ `openclaw` và root có thể truy cập `/home/openclaw/.openclaw`. Để sửa config: dùng Control UI khi gateway đang chạy, hoặc `sudo -u openclaw $EDITOR /home/openclaw/.openclaw/openclaw.json`.

## Môi trường và config

- **Token:** Lưu trong `~openclaw/.openclaw/.env` dưới dạng `OPENCLAW_GATEWAY_TOKEN`. `scripts/podman/setup.sh` và `run-openclaw-podman.sh` tạo nếu thiếu (dùng `openssl`, `python3`, hoặc `od`).
- **Tùy chọn:** Trong `.env` đó có thể đặt khóa provider (ví dụ `GROQ_API_KEY`, `OLLAMA_API_KEY`) và các biến môi trường OpenClaw khác.
- **Host ports:** Mặc định script map `18789` (gateway) và `18790` (bridge). Ghi đè mapping **host** port với `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` và `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` khi khởi chạy.
- **Gateway bind:** Mặc định, `run-openclaw-podman.sh` khởi động gateway với `--bind loopback` để truy cập local an toàn. Để expose trên LAN, đặt `OPENCLAW_GATEWAY_BIND=lan` và cấu hình `gateway.controlUi.allowedOrigins` (hoặc bật fallback host-header) trong `openclaw.json`.
- **Paths:** Config và workspace trên host mặc định là `~openclaw/.openclaw` và `~openclaw/.openclaw/workspace`. Ghi đè đường dẫn host dùng bởi script khởi chạy với `OPENCLAW_CONFIG_DIR` và `OPENCLAW_WORKSPACE_DIR`.

## Mô hình lưu trữ

- **Dữ liệu host persistent:** `OPENCLAW_CONFIG_DIR` và `OPENCLAW_WORKSPACE_DIR` được bind-mount vào container và giữ trạng thái trên host.
- **Sandbox tmpfs ephemeral:** nếu bật `agents.defaults.sandbox`, các container sandbox tool mount `tmpfs` tại `/tmp`, `/var/tmp`, và `/run`. Các đường dẫn này được hỗ trợ bộ nhớ và biến mất cùng container sandbox; setup container Podman cấp cao không thêm mount tmpfs riêng.
- **Điểm nóng tăng trưởng đĩa:** các đường dẫn chính cần chú ý là `media/`, `agents/<agentId>/sessions/sessions.json`, file JSONL transcript, `cron/runs/*.jsonl`, và log file rolling dưới `/tmp/openclaw/` (hoặc `logging.file` đã cấu hình).

`scripts/podman/setup.sh` hiện stage image tar trong thư mục temp riêng tư và in ra thư mục gốc được chọn trong quá trình setup. Đối với các lần chạy không root, nó chỉ chấp nhận `TMPDIR` khi thư mục gốc đó an toàn để sử dụng; nếu không, nó sẽ fallback về `/var/tmp`, sau đó `/tmp`. Tar đã lưu giữ quyền sở hữu riêng và được stream vào `podman load` của user mục tiêu, vì vậy thư mục temp riêng tư của caller không chặn setup.

## Lệnh hữu ích

- **Logs:** Với quadlet: `sudo journalctl --machine openclaw@ --user -u openclaw.service -f`. Với script: `sudo -u openclaw podman logs -f openclaw`
- **Stop:** Với quadlet: `sudo systemctl --machine openclaw@ --user stop openclaw.service`. Với script: `sudo -u openclaw podman stop openclaw`
- **Khởi động lại:** Với quadlet: `sudo systemctl --machine openclaw@ --user start openclaw.service`. Với script: chạy lại script khởi chạy hoặc `podman start openclaw`
- **Xóa container:** `sudo -u openclaw podman rm -f openclaw` — config và workspace trên host được giữ lại

## Khắc phục sự cố

- **Permission denied (EACCES) trên config hoặc auth-profiles:** Container mặc định `--userns=keep-id` và chạy với cùng uid/gid như user host chạy script. Đảm bảo `OPENCLAW_CONFIG_DIR` và `OPENCLAW_WORKSPACE_DIR` trên host thuộc sở hữu của user đó.
- **Gateway không khởi động được (thiếu `gateway.mode=local`):** Đảm bảo `~openclaw/.openclaw/openclaw.json` tồn tại và đặt `gateway.mode="local"`. `scripts/podman/setup.sh` tạo file này nếu thiếu.
- **Rootless Podman không chạy được cho user openclaw:** Kiểm tra `/etc/subuid` và `/etc/subgid` có dòng cho `openclaw` (ví dụ `openclaw:100000:65536`). Thêm nếu thiếu và khởi động lại.
- **Tên container đang được sử dụng:** Script khởi chạy dùng `podman run --replace`, nên container hiện tại được thay thế khi bạn khởi động lại. Để dọn dẹp thủ công: `podman rm -f openclaw`.
- **Script không tìm thấy khi chạy với openclaw:** Đảm bảo `scripts/podman/setup.sh` đã chạy để `run-openclaw-podman.sh` được sao chép vào home của openclaw (ví dụ `/home/openclaw/run-openclaw-podman.sh`).
- **Dịch vụ Quadlet không tìm thấy hoặc không khởi động được:** Chạy `sudo systemctl --machine openclaw@ --user daemon-reload` sau khi sửa file `.container`. Quadlet yêu cầu cgroups v2: `podman info --format '{{.Host.CgroupsVersion}}'` nên hiển thị `2`.

## Tùy chọn: chạy với user của bạn

Để chạy gateway với user bình thường (không cần user openclaw riêng): build image, tạo `~/.openclaw/.env` với `OPENCLAW_GATEWAY_TOKEN`, và chạy container với `--userns=keep-id` và mount vào `~/.openclaw` của bạn. Script khởi chạy được thiết kế cho flow user openclaw; cho setup single-user bạn có thể chạy lệnh `podman run` từ script thủ công, trỏ config và workspace về home của bạn. Khuyến nghị cho hầu hết người dùng: dùng `scripts/podman/setup.sh` và chạy với user openclaw để config và process được cô lập.\n