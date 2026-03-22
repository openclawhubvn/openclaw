---
summary: "Chạy OpenClaw trong container Podman không cần quyền root"
read_when:
  - Bạn muốn sử dụng Podman thay vì Docker để chạy gateway dưới dạng container
title: "Podman"
---

# Podman

Chạy OpenClaw Gateway trong container Podman **không cần quyền root**. Sử dụng cùng một image như Docker (được xây dựng từ [Dockerfile](https://github.com/openclaw/openclaw/blob/main/Dockerfile)).

## Yêu cầu

- **Podman** (chế độ không cần quyền root)
- Quyền **sudo** để thiết lập một lần (tạo người dùng riêng và xây dựng image)

## Bắt đầu nhanh

<Steps>
  <Step title="Thiết lập một lần">
    Từ thư mục gốc của repo, chạy script thiết lập. Nó tạo người dùng `openclaw` riêng, xây dựng image container và cài đặt script khởi động:

    ```bash
    ./scripts/podman/setup.sh
    ```

    Điều này cũng tạo một cấu hình tối thiểu tại `~openclaw/.openclaw/openclaw.json` (đặt `gateway.mode` thành `"local"`) để Gateway có thể khởi động mà không cần chạy wizard.

    Mặc định, container **không** được cài đặt như một dịch vụ systemd — bạn sẽ khởi động nó thủ công ở bước tiếp theo. Để thiết lập kiểu sản xuất với tự động khởi động và khởi động lại, hãy thêm `--quadlet`:

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    (Hoặc đặt `OPENCLAW_PODMAN_QUADLET=1`. Sử dụng `--container` để chỉ cài đặt container và script khởi động.)

    **Biến môi trường tùy chọn khi xây dựng** (đặt trước khi chạy `scripts/podman/setup.sh`):

    - `OPENCLAW_DOCKER_APT_PACKAGES` — cài đặt thêm các gói apt trong quá trình xây dựng image.
    - `OPENCLAW_EXTENSIONS` — cài đặt trước các phụ thuộc của extension (tên cách nhau bằng dấu cách, ví dụ: `diagnostics-otel matrix`).

  </Step>

  <Step title="Khởi động Gateway">
    Để khởi động thủ công nhanh chóng:

    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

  </Step>

  <Step title="Chạy wizard onboarding">
    Để thêm kênh hoặc nhà cung cấp một cách tương tác:

    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Sau đó mở `http://127.0.0.1:18789/` và sử dụng token từ `~openclaw/.openclaw/.env` (hoặc giá trị được in ra bởi setup).

  </Step>
</Steps>

## Systemd (Quadlet, tùy chọn)

Nếu bạn đã chạy `./scripts/podman/setup.sh --quadlet` (hoặc `OPENCLAW_PODMAN_QUADLET=1`), một đơn vị [Podman Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html) được cài đặt để gateway chạy như một dịch vụ người dùng systemd cho người dùng openclaw. Dịch vụ được kích hoạt và bắt đầu khi kết thúc thiết lập.

- **Khởi động:** `sudo systemctl --machine openclaw@ --user start openclaw.service`
- **Dừng:** `sudo systemctl --machine openclaw@ --user stop openclaw.service`
- **Trạng thái:** `sudo systemctl --machine openclaw@ --user status openclaw.service`
- **Nhật ký:** `sudo journalctl --machine openclaw@ --user -u openclaw.service -f`

Tệp quadlet nằm tại `~openclaw/.config/containers/systemd/openclaw.container`. Để thay đổi cổng hoặc môi trường, chỉnh sửa tệp đó (hoặc `.env` mà nó sử dụng), sau đó `sudo systemctl --machine openclaw@ --user daemon-reload` và khởi động lại dịch vụ. Khi khởi động, dịch vụ tự động bắt đầu nếu chế độ lingering được bật cho openclaw (thiết lập thực hiện điều này khi loginctl có sẵn).

Để thêm quadlet **sau** khi thiết lập ban đầu không sử dụng nó, chạy lại: `./scripts/podman/setup.sh --quadlet`.

## Người dùng openclaw (không đăng nhập)

`scripts/podman/setup.sh` tạo một người dùng hệ thống riêng `openclaw`:

- **Shell:** `nologin` — không có đăng nhập tương tác; giảm bề mặt tấn công.
- **Thư mục chính:** ví dụ `/home/openclaw` — chứa `~/.openclaw` (cấu hình, workspace) và script khởi động `run-openclaw-podman.sh`.
- **Podman không cần quyền root:** Người dùng phải có phạm vi **subuid** và **subgid**. Nhiều bản phân phối tự động gán các phạm vi này khi người dùng được tạo. Nếu thiết lập in ra cảnh báo, thêm dòng vào `/etc/subuid` và `/etc/subgid`:

  ```text
  openclaw:100000:65536
  ```

  Sau đó khởi động gateway dưới dạng người dùng đó (ví dụ từ cron hoặc systemd):

  ```bash
  sudo -u openclaw /home/openclaw/run-openclaw-podman.sh
  sudo -u openclaw /home/openclaw/run-openclaw-podman.sh setup
  ```

- **Cấu hình:** Chỉ `openclaw` và root có thể truy cập `/home/openclaw/.openclaw`. Để chỉnh sửa cấu hình: sử dụng Control UI khi gateway đang chạy, hoặc `sudo -u openclaw $EDITOR /home/openclaw/.openclaw/openclaw.json`.

## Môi trường và cấu hình

- **Token:** Lưu trữ trong `~openclaw/.openclaw/.env` dưới dạng `OPENCLAW_GATEWAY_TOKEN`. `scripts/podman/setup.sh` và `run-openclaw-podman.sh` tạo nó nếu thiếu (sử dụng `openssl`, `python3`, hoặc `od`).
- **Tùy chọn:** Trong `.env` đó, bạn có thể đặt các khóa nhà cung cấp (ví dụ: `GROQ_API_KEY`, `OLLAMA_API_KEY`) và các biến môi trường OpenClaw khác.
- **Cổng máy chủ:** Mặc định, script ánh xạ `18789` (gateway) và `18790` (bridge). Ghi đè ánh xạ cổng **host** với `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` và `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` khi khởi động.
- **Gateway bind:** Mặc định, `run-openclaw-podman.sh` khởi động gateway với `--bind loopback` để truy cập cục bộ an toàn. Để mở trên LAN, đặt `OPENCLAW_GATEWAY_BIND=lan` và cấu hình `gateway.controlUi.allowedOrigins` (hoặc bật fallback host-header rõ ràng) trong `openclaw.json`.
- **Đường dẫn:** Cấu hình và workspace trên host mặc định là `~openclaw/.openclaw` và `~openclaw/.openclaw/workspace`. Ghi đè đường dẫn host được sử dụng bởi script khởi động với `OPENCLAW_CONFIG_DIR` và `OPENCLAW_WORKSPACE_DIR`.

## Mô hình lưu trữ

- **Dữ liệu host bền vững:** `OPENCLAW_CONFIG_DIR` và `OPENCLAW_WORKSPACE_DIR` được gắn kết vào container và giữ trạng thái trên host.
- **Tmpfs sandbox tạm thời:** nếu bạn bật `agents.defaults.sandbox`, các container sandbox công cụ gắn `tmpfs` tại `/tmp`, `/var/tmp`, và `/run`. Các đường dẫn này được hỗ trợ bởi bộ nhớ và biến mất với container sandbox; thiết lập container Podman cấp cao nhất không thêm các gắn kết tmpfs riêng.
- **Điểm nóng tăng trưởng đĩa:** các đường dẫn chính cần chú ý là `media/`, `agents/<agentId>/sessions/sessions.json`, các tệp JSONL transcript, `cron/runs/*.jsonl`, và các tệp nhật ký cuộn dưới `/tmp/openclaw/` (hoặc `logging.file` bạn đã cấu hình).

`scripts/podman/setup.sh` hiện dàn dựng image tar trong thư mục tạm thời riêng tư và in ra thư mục cơ sở đã chọn trong quá trình thiết lập. Đối với các lần chạy không root, nó chấp nhận `TMPDIR` chỉ khi cơ sở đó an toàn để sử dụng; nếu không, nó sẽ quay lại `/var/tmp`, sau đó `/tmp`. Tệp tar đã lưu giữ quyền sở hữu riêng tư và được truyền vào `podman load` của người dùng mục tiêu, vì vậy các thư mục tạm thời của người gọi riêng tư không chặn thiết lập.

## Lệnh hữu ích

- **Nhật ký:** Với quadlet: `sudo journalctl --machine openclaw@ --user -u openclaw.service -f`. Với script: `sudo -u openclaw podman logs -f openclaw`
- **Dừng:** Với quadlet: `sudo systemctl --machine openclaw@ --user stop openclaw.service`. Với script: `sudo -u openclaw podman stop openclaw`
- **Khởi động lại:** Với quadlet: `sudo systemctl --machine openclaw@ --user start openclaw.service`. Với script: chạy lại script khởi động hoặc `podman start openclaw`
- **Xóa container:** `sudo -u openclaw podman rm -f openclaw` — cấu hình và workspace trên host được giữ lại

## Khắc phục sự cố

- **Permission denied (EACCES) trên cấu hình hoặc hồ sơ xác thực:** Container mặc định sử dụng `--userns=keep-id` và chạy với cùng uid/gid như người dùng host chạy script. Đảm bảo `OPENCLAW_CONFIG_DIR` và `OPENCLAW_WORKSPACE_DIR` trên host thuộc sở hữu của người dùng đó.
- **Khởi động Gateway bị chặn (thiếu `gateway.mode=local`):** Đảm bảo `~openclaw/.openclaw/openclaw.json` tồn tại và đặt `gateway.mode="local"`. `scripts/podman/setup.sh` tạo tệp này nếu thiếu.
- **Podman không cần quyền root thất bại cho người dùng openclaw:** Kiểm tra `/etc/subuid` và `/etc/subgid` có chứa dòng cho `openclaw` (ví dụ: `openclaw:100000:65536`). Thêm nó nếu thiếu và khởi động lại.
- **Tên container đang được sử dụng:** Script khởi động sử dụng `podman run --replace`, vì vậy container hiện có được thay thế khi bạn khởi động lại. Để dọn dẹp thủ công: `podman rm -f openclaw`.
- **Script không tìm thấy khi chạy dưới dạng openclaw:** Đảm bảo `scripts/podman/setup.sh` đã được chạy để `run-openclaw-podman.sh` được sao chép vào thư mục chính của openclaw (ví dụ: `/home/openclaw/run-openclaw-podman.sh`).
- **Dịch vụ Quadlet không tìm thấy hoặc không khởi động được:** Chạy `sudo systemctl --machine openclaw@ --user daemon-reload` sau khi chỉnh sửa tệp `.container`. Quadlet yêu cầu cgroups v2: `podman info --format '{{.Host.CgroupsVersion}}'` nên hiển thị `2`.

## Tùy chọn: chạy dưới dạng người dùng của bạn

Để chạy gateway dưới dạng người dùng thông thường của bạn (không cần người dùng openclaw riêng): xây dựng image, tạo `~/.openclaw/.env` với `OPENCLAW_GATEWAY_TOKEN`, và chạy container với `--userns=keep-id` và gắn kết vào `~/.openclaw` của bạn. Script khởi động được thiết kế cho luồng người dùng openclaw; đối với thiết lập một người dùng, bạn có thể chạy lệnh `podman run` từ script thủ công, chỉ định cấu hình và workspace vào thư mục chính của bạn. Được khuyến nghị cho hầu hết người dùng: sử dụng `scripts/podman/setup.sh` và chạy dưới dạng người dùng openclaw để cấu hình và quy trình được cách ly.
