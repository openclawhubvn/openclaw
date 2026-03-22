---
summary: "Câu hỏi thường gặp về cài đặt, cấu hình và sử dụng OpenClaw"
read_when:
  - Trả lời các câu hỏi thường gặp về cài đặt, cài đặt, onboarding hoặc hỗ trợ runtime
  - Phân loại các vấn đề do người dùng báo cáo trước khi debug sâu hơn
title: "FAQ"
---

# FAQ

Câu trả lời nhanh cùng với hướng dẫn xử lý sự cố cho các thiết lập thực tế (dev local, VPS, multi-agent, OAuth/API keys, model failover). Để chẩn đoán runtime, xem [Troubleshooting](/gateway/troubleshooting). Để tham khảo cấu hình đầy đủ, xem [Configuration](/gateway/configuration).

## 60 giây đầu tiên nếu có sự cố

1. **Kiểm tra trạng thái nhanh (kiểm tra đầu tiên)**

   ```bash
   openclaw status
   ```

   Tóm tắt nhanh local: OS + cập nhật, khả năng truy cập gateway/dịch vụ, agents/sessions, cấu hình provider + vấn đề runtime (khi gateway có thể truy cập).

2. **Báo cáo có thể chia sẻ (an toàn để chia sẻ)**

   ```bash
   openclaw status --all
   ```

   Chẩn đoán chỉ đọc với log tail (tokens đã được ẩn).

3. **Trạng thái Daemon + cổng**

   ```bash
   openclaw gateway status
   ```

   Hiển thị runtime supervisor so với khả năng truy cập RPC, URL mục tiêu probe, và cấu hình dịch vụ có thể đã sử dụng.

4. **Kiểm tra sâu**

   ```bash
   openclaw status --deep
   ```

   Chạy kiểm tra sức khỏe gateway + probes provider (yêu cầu gateway có thể truy cập). Xem [Health](/gateway/health).

5. **Theo dõi log mới nhất**

   ```bash
   openclaw logs --follow
   ```

   Nếu RPC bị down, fallback sang:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   File logs tách biệt với service logs; xem [Logging](/logging) và [Troubleshooting](/gateway/troubleshooting).

6. **Chạy doctor (sửa chữa)**

   ```bash
   openclaw doctor
   ```

   Sửa chữa/di chuyển cấu hình/trạng thái + chạy kiểm tra sức khỏe. Xem [Doctor](/gateway/doctor).

7. **Snapshot Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # hiển thị URL mục tiêu + đường dẫn cấu hình khi có lỗi
   ```

   Yêu cầu gateway đang chạy cho một snapshot đầy đủ (chỉ WS). Xem [Health](/gateway/health).

## Bắt đầu nhanh và thiết lập lần đầu

<AccordionGroup>
  <Accordion title="Tôi bị kẹt, cách nhanh nhất để thoát khỏi tình trạng này">
    Sử dụng một agent AI local có thể **xem máy của bạn**. Điều này hiệu quả hơn nhiều so với hỏi trên Discord, vì hầu hết các trường hợp "tôi bị kẹt" là **vấn đề cấu hình local hoặc môi trường** mà người hỗ trợ từ xa không thể kiểm tra.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Các công cụ này có thể đọc repo, chạy lệnh, kiểm tra logs và giúp sửa máy của bạn (PATH, services, permissions, auth files). Cung cấp cho chúng **full source checkout** thông qua cài đặt hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Điều này cài đặt OpenClaw **từ một git checkout**, vì vậy agent có thể đọc code + docs và suy luận về phiên bản chính xác bạn đang chạy. Bạn luôn có thể chuyển lại sang stable sau bằng cách chạy lại installer mà không có `--install-method git`.

    Mẹo: yêu cầu agent **lên kế hoạch và giám sát** việc sửa chữa (từng bước), sau đó chỉ thực hiện các lệnh cần thiết. Điều đó giữ cho các thay đổi nhỏ và dễ kiểm tra.

    Nếu bạn phát hiện ra một lỗi thực sự hoặc sửa chữa, vui lòng gửi một issue trên GitHub hoặc gửi một PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Bắt đầu với các lệnh này (chia sẻ outputs khi yêu cầu trợ giúp):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Chúng làm gì:

    - `openclaw status`: snapshot nhanh về sức khỏe gateway/agent + cấu hình cơ bản.
    - `openclaw models status`: kiểm tra xác thực provider + khả dụng model.
    - `openclaw doctor`: xác thực và sửa chữa các vấn đề cấu hình/trạng thái phổ biến.

    Các kiểm tra CLI hữu ích khác: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Vòng lặp debug nhanh: [60 giây đầu tiên nếu có sự cố](#first-60-seconds-if-something-is-broken).
    Tài liệu cài đặt: [Install](/install), [Installer flags](/install/installer), [Updating](/install/updating).

  </Accordion>

  <Accordion title="Cách cài đặt và thiết lập OpenClaw được khuyến nghị">
    Repo khuyến nghị chạy từ source và sử dụng onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Wizard cũng có thể tự động build UI assets. Sau khi onboarding, bạn thường chạy Gateway trên cổng **18789**.

    Từ source (contributors/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # tự động cài đặt UI deps lần đầu chạy
    openclaw onboard
    ```

    Nếu bạn chưa có cài đặt global, chạy nó qua `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Làm thế nào để mở dashboard sau khi onboarding?">
    Wizard mở trình duyệt với một URL dashboard sạch (không token) ngay sau khi onboarding và cũng in ra link trong phần tóm tắt. Giữ tab đó mở; nếu nó không tự mở, sao chép/dán URL đã in trên cùng máy.

  </Accordion>

  <Accordion title="Làm thế nào để xác thực dashboard (token) trên localhost so với remote?">
    **Localhost (cùng máy):**

    - Mở `http://127.0.0.1:18789/`.
    - Nếu yêu cầu xác thực, dán token từ `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`) vào cài đặt Control UI.
    - Lấy nó từ gateway host: `openclaw config get gateway.auth.token` (hoặc tạo một cái: `openclaw doctor --generate-gateway-token`).

    **Không trên localhost:**

    - **Tailscale Serve** (khuyến nghị): giữ bind loopback, chạy `openclaw gateway --tailscale serve`, mở `https://<magicdns>/`. Nếu `gateway.auth.allowTailscale` là `true`, headers identity thỏa mãn xác thực Control UI/WebSocket (không cần token, giả định trusted gateway host); HTTP APIs vẫn yêu cầu token/password.
    - **Tailnet bind**: chạy `openclaw gateway --bind tailnet --token "<token>"`, mở `http://<tailscale-ip>:18789/`, dán token vào cài đặt dashboard.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` sau đó mở `http://127.0.0.1:18789/` và dán token vào cài đặt Control UI.

    Xem [Dashboard](/web/dashboard) và [Web surfaces](/web) để biết chi tiết về bind modes và auth.

  </Accordion>

  <Accordion title="Cần runtime nào?">
    Node **>= 22** là bắt buộc. `pnpm` được khuyến nghị. Bun **không được khuyến nghị** cho Gateway.

  </Accordion>

  <Accordion title="Nó có chạy trên Raspberry Pi không?">
    Có. Gateway nhẹ - docs liệt kê **512MB-1GB RAM**, **1 core**, và khoảng **500MB** disk là đủ cho sử dụng cá nhân, và lưu ý rằng **Raspberry Pi 4 có thể chạy nó**.

    Nếu bạn muốn thêm không gian (logs, media, dịch vụ khác), **2GB được khuyến nghị**, nhưng không phải là tối thiểu cứng.

    Mẹo: một Pi/VPS nhỏ có thể host Gateway, và bạn có thể ghép **nodes** trên laptop/điện thoại để truy cập màn hình/camera/canvas local hoặc thực thi lệnh. Xem [Nodes](/nodes).

  </Accordion>

  <Accordion title="Có mẹo nào cho cài đặt Raspberry Pi không?">
    Phiên bản ngắn: nó hoạt động, nhưng mong đợi có những góc cạnh thô.

    - Sử dụng OS **64-bit** và giữ Node >= 22.
    - Ưu tiên cài đặt **hackable (git)** để bạn có thể xem logs và cập nhật nhanh.
    - Bắt đầu mà không có channels/skills, sau đó thêm từng cái một.
    - Nếu bạn gặp vấn đề binary kỳ lạ, thường là vấn đề **tương thích ARM**.

    Docs: [Linux](/platforms/linux), [Install](/install).

  </Accordion>

  <Accordion title="Nó bị kẹt ở wake up my friend / onboarding sẽ không hatch. Bây giờ làm gì?">
    Màn hình đó phụ thuộc vào việc Gateway có thể truy cập và xác thực. TUI cũng tự động gửi "Wake up, my friend!" khi hatch lần đầu. Nếu bạn thấy dòng đó mà **không có phản hồi** và tokens vẫn ở 0, agent chưa bao giờ chạy.

    1. Khởi động lại Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Kiểm tra trạng thái + xác thực:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Nếu nó vẫn treo, chạy:

    ```bash
    openclaw doctor
    ```

    Nếu Gateway là remote, đảm bảo kết nối tunnel/Tailscale đang hoạt động và UI đang chỉ vào đúng Gateway. Xem [Remote access](/gateway/remote).

  </Accordion>

  <Accordion title="Tôi có thể di chuyển thiết lập của mình sang máy mới (Mac mini) mà không cần làm lại onboarding không?">
    Có. Sao chép **thư mục trạng thái** và **workspace**, sau đó chạy Doctor một lần. Điều này giữ cho bot của bạn "chính xác như cũ" (bộ nhớ, lịch sử session, auth, và trạng thái channel) miễn là bạn sao chép **cả hai** vị trí:

    1. Cài đặt OpenClaw trên máy mới.
    2. Sao chép `$OPENCLAW_STATE_DIR` (mặc định: `~/.openclaw`) từ máy cũ.
    3. Sao chép workspace của bạn (mặc định: `~/.openclaw/workspace`).
    4. Chạy `openclaw doctor` và khởi động lại dịch vụ Gateway.

    Điều này bảo toàn cấu hình, hồ sơ xác thực, thông tin đăng nhập WhatsApp, sessions, và bộ nhớ. Nếu bạn đang ở chế độ remote, nhớ rằng gateway host sở hữu session store và workspace.

    **Quan trọng:** nếu bạn chỉ commit/push workspace của mình lên GitHub, bạn đang sao lưu **bộ nhớ + tệp bootstrap**, nhưng **không phải** lịch sử session hoặc xác thực. Những thứ đó nằm dưới `~/.openclaw/` (ví dụ `~/.openclaw/agents/<agentId>/sessions/`).

    Liên quan: [Migrating](/install/migrating), [Where things live on disk](#where-things-live-on-disk),
    [Agent workspace](/concepts/agent-workspace), [Doctor](/gateway/doctor),
    [Remote mode](/gateway/remote).

  </Accordion>

  <Accordion title="Tôi có thể xem những gì mới trong phiên bản mới nhất ở đâu?">
    Kiểm tra changelog trên GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Các mục mới nhất ở trên cùng. Nếu phần trên cùng được đánh dấu **Unreleased**, phần có ngày tiếp theo là phiên bản mới nhất đã phát hành. Các mục được nhóm theo **Highlights**, **Changes**, và **Fixes** (cộng với các phần docs/khác khi cần).

  </Accordion>

  <Accordion title="Không thể truy cập docs.openclaw.ai (lỗi SSL)">
    Một số kết nối Comcast/Xfinity chặn `docs.openclaw.ai` không chính xác thông qua Xfinity Advanced Security. Vô hiệu hóa nó hoặc cho phép `docs.openclaw.ai`, sau đó thử lại. Chi tiết thêm: [Troubleshooting](/help/faq#docsopenclawai-shows-an-ssl-error-comcast-xfinity).
    Vui lòng giúp chúng tôi mở khóa nó bằng cách báo cáo tại đây: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Nếu bạn vẫn không thể truy cập trang web, tài liệu được phản chiếu trên GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Sự khác biệt giữa stable và beta">
    **Stable** và **beta** là **npm dist-tags**, không phải các dòng code riêng biệt:

    - `latest` = stable
    - `beta` = bản build sớm để thử nghiệm

    Chúng tôi phát hành các bản build cho **beta**, thử nghiệm chúng, và khi một bản build ổn định, chúng tôi **thăng cấp phiên bản đó lên `latest`**. Đó là lý do tại sao beta và stable có thể chỉ vào **cùng một phiên bản**.

    Xem những gì đã thay đổi:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

  </Accordion>

  <Accordion title="Làm thế nào để cài đặt phiên bản beta và sự khác biệt giữa beta và dev là gì?">
    **Beta** là npm dist-tag `beta` (có thể trùng với `latest`).
    **Dev** là đầu di chuyển của `main` (git); khi được phát hành, nó sử dụng npm dist-tag `dev`.

    One-liners (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows installer (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Chi tiết thêm: [Development channels](/install/development-channels) và [Installer flags](/install/installer).

  </Accordion>

  <Accordion title="Làm thế nào để thử các bits mới nhất?">
    Hai lựa chọn:

    1. **Dev channel (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Điều này chuyển sang nhánh `main` và cập nhật từ source.

    2. **Cài đặt hackable (từ trang installer):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Điều đó cung cấp cho bạn một repo local bạn có thể chỉnh sửa, sau đó cập nhật qua git.

    Nếu bạn thích một clone sạch thủ công, sử dụng:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Docs: [Update](/cli/update), [Development channels](/install/development-channels),
    [Install](/install).

  </Accordion>

  <Accordion title="Cài đặt và onboarding thường mất bao lâu?">
    Hướng dẫn sơ bộ:

    - **Cài đặt:** 2-5 phút
    - **Onboarding:** 5-15 phút tùy thuộc vào số lượng channels/models bạn cấu hình

    Nếu nó bị treo, sử dụng [Installer stuck](#quick-start-and-first-run-setup)
    và vòng lặp debug nhanh trong [I am stuck](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer bị kẹt? Làm thế nào để có thêm phản hồi?">
    Chạy lại installer với **verbose output**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Cài đặt beta với verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Đối với cài đặt hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Tương đương Windows (PowerShell):

    ```powershell
    # install.ps1 chưa có flag -Verbose riêng.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Nhiều tùy chọn hơn: [Installer flags](/install/installer).

  </Accordion>

  <Accordion title="Cài đặt Windows báo git không tìm thấy hoặc openclaw không được nhận diện">
    Hai vấn đề Windows phổ biến:

    **1) npm error spawn git / git không tìm thấy**

    - Cài đặt **Git for Windows** và đảm bảo `git` có trong PATH.
    - Đóng và mở lại PowerShell, sau đó chạy lại installer.

    **2) openclaw không được nhận diện sau khi cài đặt**

    - Thư mục npm global bin không có trong PATH.
    - Kiểm tra đường dẫn:

      ```powershell
      npm config get prefix
      ```

    - Thêm thư mục đó vào PATH của người dùng (không cần hậu tố `\bin` trên Windows; trên hầu hết các hệ thống là `%AppData%\npm`).
    - Đóng và mở lại PowerShell sau khi cập nhật PATH.

    Nếu bạn muốn thiết lập Windows mượt mà nhất, sử dụng **WSL2** thay vì Windows native.
    Docs: [Windows](/platforms/windows).

  </Accordion>

  <Accordion title="Output exec Windows hiển thị văn bản Trung Quốc bị lỗi - tôi nên làm gì?">
    Đây thường là sự không khớp mã code console trên các shell Windows native.

    Triệu chứng:

    - `system.run`/`exec` output hiển thị tiếng Trung Quốc dưới dạng mojibake
    - Cùng lệnh trông ổn trong một profile terminal khác

    Giải pháp nhanh trong PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Sau đó khởi động lại Gateway và thử lại lệnh của bạn:

    ```powershell
    openclaw gateway restart
    ```

    Nếu bạn vẫn gặp phải điều này trên OpenClaw mới nhất, theo dõi/báo cáo nó trong:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Tài liệu không trả lời câu hỏi của tôi - làm thế nào để có câu trả lời tốt hơn?">
    Sử dụng cài đặt **hackable (git)** để bạn có full source và docs local, sau đó hỏi bot của bạn (hoặc Claude/Codex) _từ thư mục đó_ để nó có thể đọc repo và trả lời chính xác.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Chi tiết thêm: [Install](/install) và [Installer flags](/install/installer).

  </Accordion>

  <Accordion title="Làm thế nào để cài đặt OpenClaw trên Linux?">
    Câu trả lời ngắn: theo hướng dẫn Linux, sau đó chạy onboarding.

    - Đường dẫn nhanh Linux + cài đặt dịch vụ: [Linux](/platforms/linux).
    - Hướng dẫn đầy đủ: [Getting Started](/start/getting-started).
    - Installer + cập nhật: [Install & updates](/install/updating).

  </Accordion>

  <Accordion title="Làm thế nào để cài đặt OpenClaw trên VPS?">
    Bất kỳ Linux VPS nào cũng hoạt động. Cài đặt trên server, sau đó sử dụng SSH/Tailscale để truy cập Gateway.

    Hướng dẫn: [exe.dev](/install/exe-dev), [Hetzner](/install/hetzner), [Fly.io](/install/fly).
    Truy cập từ xa: [Gateway remote](/gateway/remote).

  </Accordion>

  <Accordion title="Hướng dẫn cài đặt cloud/VPS ở đâu?">
    Chúng tôi giữ một **hosting hub** với các nhà cung cấp phổ biến. Chọn một và làm theo hướng dẫn:

    - [VPS hosting](/vps) (tất cả các nhà cung cấp ở một nơi)
    - [Fly.io](/install/fly)
    - [Hetzner](/install/hetzner)
    - [exe.dev](/install/exe-dev)

    Cách hoạt động trên cloud: **Gateway chạy trên server**, và bạn truy cập nó từ laptop/điện thoại qua Control UI (hoặc Tailscale/SSH). Trạng thái + workspace của bạn sống trên server, vì vậy hãy coi host là nguồn gốc và sao lưu nó.

    Bạn có thể ghép **nodes** (Mac/iOS/Android/headless) với Gateway cloud đó để truy cập màn hình/camera/canvas local hoặc chạy lệnh trên laptop của bạn trong khi giữ Gateway trên cloud.

    Hub: [Platforms](/platforms). Truy cập từ xa: [Gateway remote](/gateway/remote).
    Nodes: [Nodes](/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Tôi có thể yêu cầu OpenClaw tự cập nhật không?">
    Câu trả lời ngắn: **có thể, không khuyến nghị**. Luồng cập nhật có thể khởi động lại Gateway (dẫn đến mất session đang hoạt động), có thể cần một git checkout sạch, và có thể yêu cầu xác nhận. An toàn hơn: chạy cập nhật từ shell với tư cách operator.

    Sử dụng CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Nếu bạn phải tự động hóa từ một agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Docs: [Update](/cli/update), [Updating](/install/updating).

  </Accordion>

  <Accordion title="Onboarding thực sự làm gì?">
    `openclaw onboard` là đường dẫn thiết lập được khuyến nghị. Trong **local mode** nó hướng dẫn bạn qua:

    - **Thiết lập Model/auth** (provider OAuth/setup-token flows và API keys được hỗ trợ, cộng với các tùy chọn model local như LM Studio)
    - Vị trí **Workspace** + tệp bootstrap
    - **Cài đặt Gateway** (bind/port/auth/tailscale)
    - **Providers** (WhatsApp, Telegram, Discord, Mattermost (plugin), Signal, iMessage)
    - **Cài đặt Daemon** (LaunchAgent trên macOS; systemd user unit trên Linux/WSL2)
    - **Kiểm tra sức khỏe** và **lựa chọn skills**

    Nó cũng cảnh báo nếu model bạn cấu hình không xác định hoặc thiếu xác thực.

  </Accordion>

  <Accordion title="Tôi có cần đăng ký Claude hoặc OpenAI để chạy cái này không?">
    Không. Bạn có thể chạy OpenClaw với **API keys** (Anthropic/OpenAI/khác) hoặc với **models chỉ local** để dữ liệu của bạn ở lại trên thiết bị của bạn. Đăng ký (Claude Pro/Max hoặc OpenAI Codex) là các cách tùy chọn để xác thực các providers đó.

    Nếu bạn chọn xác thực đăng ký Anthropic, tự quyết định xem có sử dụng nó không:
    Anthropic đã chặn một số sử dụng đăng ký ngoài Claude Code trong quá khứ.
    OpenAI Codex OAuth được hỗ trợ rõ ràng cho các công cụ bên ngoài như OpenClaw.

    Docs: [Anthropic](/providers/anthropic), [OpenAI](/providers/openai),
    [Local models](/gateway/local-models), [Models](/concepts/models).

  </Accordion>

  <Accordion title="Tôi có thể sử dụng đăng ký Claude Max mà không cần API key không?">
    Có. Bạn có thể xác thực bằng **setup-token** thay vì API key. Đây là đường dẫn đăng ký.

    Đăng ký Claude Pro/Max **không bao gồm API key**, vì vậy đây là đường dẫn kỹ thuật cho các tài khoản đăng ký. Nhưng đây là quyết định của bạn: Anthropic đã chặn một số sử dụng đăng ký ngoài Claude Code trong quá khứ.
    Nếu bạn muốn đường dẫn rõ ràng và an toàn nhất cho sản xuất, sử dụng một Anthropic API key.

  </Accordion>

  <Accordion title="Xác thực setup-token Anthropic hoạt động như thế nào?">
    `claude setup-token` tạo một **chuỗi token** thông qua Claude Code CLI (nó không có sẵn trong web console). Bạn có thể chạy nó trên **bất kỳ máy nào**. Chọn **Anthropic token (paste setup-token)** trong onboarding hoặc dán nó với `openclaw models auth paste-token --provider anthropic`. Token được lưu trữ dưới dạng hồ sơ xác thực cho provider **anthropic** và được sử dụng như một API key (không tự động làm mới). Chi tiết thêm: [OAuth](/concepts/oauth).

  </Accordion>

  <Accordion title="Tôi tìm setup-token Anthropic ở đâu?">
    Nó **không** có trong Anthropic Console. Setup-token được tạo bởi **Claude Code CLI** trên **bất kỳ máy nào**:

    ```bash
    claude setup-token
    ```

    Sao chép token nó in ra, sau đó chọn **Anthropic token (paste setup-token)** trong onboarding. Nếu bạn muốn chạy nó trên gateway host, sử dụng `openclaw models auth setup-token --provider anthropic`. Nếu bạn đã chạy `claude setup-token` ở nơi khác, dán nó trên gateway host với `openclaw models auth paste-token --provider anthropic`. Xem [Anthropic](/providers/anthropic).

  </Accordion>

  <Accordion title="Bạn có hỗ trợ xác thực đăng ký Claude (Claude Pro hoặc Max) không?">
    Có - thông qua **setup-token**. OpenClaw không còn tái sử dụng Claude Code CLI OAuth tokens; sử dụng setup-token hoặc một Anthropic API key. Tạo token ở bất kỳ đâu và dán nó trên gateway host. Xem [Anthropic](/providers/anthropic) và [OAuth](/concepts/oauth).

    Quan trọng: đây là khả năng tương thích kỹ thuật, không phải là đảm bảo chính sách. Anthropic
    đã chặn một số sử dụng đăng ký ngoài Claude Code trong quá khứ.
    Bạn cần quyết định xem có sử dụng nó không và xác minh các điều khoản hiện tại của Anthropic.
    Đối với sản xuất hoặc workloads nhiều người dùng, xác thực API key Anthropic là lựa chọn an toàn, được khuyến nghị.

  </Accordion>

  <Accordion title="Tại sao tôi thấy HTTP 429 rate_limit_error từ Anthropic?">
    Điều đó có nghĩa là **Anthropic quota/rate limit** của bạn đã hết cho cửa sổ hiện tại. Nếu bạn
    sử dụng một **Claude subscription** (setup-token), chờ cửa sổ đặt lại hoặc nâng cấp kế hoạch của bạn. Nếu bạn sử dụng một **Anthropic API key**, kiểm tra Anthropic Console
    để biết sử dụng/thanh toán và tăng giới hạn nếu cần.

    Nếu thông báo cụ thể là:
    `Extra usage is required for long context requests`, yêu cầu đang cố gắng sử dụng
    Anthropic's 1M context beta (`context1m: true`). Điều đó chỉ hoạt động khi
    thông tin xác thực của bạn đủ điều kiện cho billing long-context (API key billing hoặc subscription
    với Extra Usage được bật).

    Mẹo: đặt một **fallback model** để OpenClaw có thể tiếp tục trả lời trong khi một provider bị giới hạn rate.
    Xem [Models](/cli/models), [OAuth](/concepts/oauth), và
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock có được hỗ trợ không?">
    Có - thông qua provider **Amazon Bedrock (Converse)** của pi-ai với **cấu hình thủ công**. Bạn phải cung cấp AWS credentials/region trên gateway host và thêm một mục provider Bedrock trong cấu hình models của bạn. Xem [Amazon Bedrock](/providers/bedrock) và [Model providers](/providers/models). Nếu bạn thích một luồng key quản lý, một proxy tương thích OpenAI trước Bedrock vẫn là một tùy chọn hợp lệ.

  </Accordion>

  <Accordion title="Xác thực Codex hoạt động như thế nào?">
    OpenClaw hỗ trợ **OpenAI Code (Codex)** thông qua OAuth (ChatGPT sign-in). Onboarding có thể chạy luồng OAuth và sẽ đặt model mặc định thành `openai-codex/gpt-5.4` khi thích hợp. Xem [Model providers](/concepts/model-providers) và [Onboarding (CLI)](/start/wizard).

  </Accordion>

  <Accordion title="Bạn có hỗ trợ xác thực đăng ký OpenAI (Codex OAuth) không?">
    Có. OpenClaw hoàn toàn hỗ trợ **OpenAI Code (Codex) subscription OAuth**.
    OpenAI cho phép rõ ràng việc sử dụng subscription OAuth trong các công cụ/quy trình làm việc bên ngoài
    như OpenClaw. Onboarding có thể chạy luồng OAuth cho bạn.

    Xem [OAuth](/concepts/oauth), [Model providers](/concepts/model-providers), và [Onboarding (CLI)](/start/wizard).

  </Accordion>

  <Accordion title="Làm thế nào để thiết lập Gemini CLI OAuth?">
    Gemini CLI sử dụng một **plugin auth flow**, không phải client id hoặc secret trong `openclaw.json`.

    Các bước:

    1. Kích hoạt plugin: `openclaw plugins enable google`
    2. Đăng nhập: `openclaw models auth login --provider google-gemini-cli --set-default`

    Điều này lưu trữ OAuth tokens trong hồ sơ xác thực trên gateway host. Chi tiết: [Model providers](/concepts/model-providers).

  </Accordion>

  <Accordion title="Một model local có ổn cho các cuộc trò chuyện thông thường không?">
    Thường thì không. OpenClaw cần context lớn + độ an toàn mạnh; các thẻ nhỏ bị cắt ngắn và rò rỉ. Nếu bạn phải, chạy build MiniMax M2.5 lớn nhất bạn có thể local (LM Studio) và xem [/gateway/local-models](/gateway/local-models). Các models nhỏ hơn/được lượng tử hóa tăng nguy cơ prompt-injection - xem [Security](/gateway/security).

  </Accordion>

  <Accordion title="Làm thế nào để giữ lưu lượng model hosted trong một khu vực cụ thể?">
    Chọn endpoints gắn vùng. OpenRouter cung cấp các tùy chọn hosted tại Mỹ cho MiniMax, Kimi, và GLM; chọn biến thể hosted tại Mỹ để giữ dữ liệu trong vùng. Bạn vẫn có thể liệt kê Anthropic/OpenAI cùng với những cái này bằng cách sử dụng `models.mode: "merge"` để fallbacks vẫn có sẵn trong khi tôn trọng provider vùng bạn chọn.

  </Accordion>

  <Accordion title="Tôi có phải mua một Mac Mini để cài đặt cái này không?">
    Không. OpenClaw chạy trên macOS hoặc Linux (Windows qua WSL2). Một Mac mini là tùy chọn - một số người
    mua một cái như một host luôn bật, nhưng một VPS nhỏ, server tại nhà, hoặc hộp Raspberry Pi-class cũng hoạt động.

    Bạn chỉ cần một Mac **cho các công cụ chỉ macOS**. Đối với iMessage, sử dụng [BlueBubbles](/channels/bluebubbles) (khuyến nghị) - server BlueBubbles chạy trên bất kỳ Mac nào, và Gateway có thể chạy trên Linux hoặc nơi khác. Nếu bạn muốn các công cụ chỉ macOS khác, chạy Gateway trên một Mac hoặc ghép một node macOS.

    Docs: [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes), [Mac remote mode](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Tôi có cần một Mac mini để hỗ trợ iMessage không?">
    Bạn cần **một thiết bị macOS nào đó** đã đăng nhập vào Messages. Nó **không** phải là một Mac mini -
    bất kỳ Mac nào cũng hoạt động. **Sử dụng [BlueBubbles](/channels/bluebubbles)** (khuyến nghị) cho iMessage - server BlueBubbles chạy trên macOS, trong khi Gateway có thể chạy trên Linux hoặc nơi khác.

    Các thiết lập phổ biến:

    - Chạy Gateway trên Linux/VPS, và chạy server BlueBubbles trên bất kỳ Mac nào đã đăng nhập vào Messages.
    - Chạy mọi thứ trên Mac nếu bạn muốn thiết lập đơn giản nhất trên một máy.

    Docs: [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes),
    [Mac remote mode](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Nếu tôi mua một Mac mini để chạy OpenClaw, tôi có thể kết nối nó với MacBook Pro của mình không?">
    Có. **Mac mini có thể chạy Gateway**, và MacBook Pro của bạn có thể kết nối như một
    **node** (thiết bị đồng hành). Nodes không chạy Gateway - chúng cung cấp các khả năng bổ sung như màn hình/camera/canvas và `system.run` trên thiết bị đó.

    Mẫu phổ biến:

    - Gateway trên Mac mini (luôn bật).
    - MacBook Pro chạy ứng dụng macOS hoặc một node host và ghép với Gateway.
    - Sử dụng `openclaw nodes status` / `openclaw nodes list` để xem nó.

    Docs: [Nodes](/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Tôi có thể sử dụng Bun không?">
    Bun **không được khuyến nghị**. Chúng tôi thấy các lỗi runtime, đặc biệt với WhatsApp và Telegram.
    Sử dụng **Node** cho các gateways ổn định.

    Nếu bạn vẫn muốn thử nghiệm với Bun, hãy làm điều đó trên một gateway không phải sản xuất
    mà không có WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: cái gì đi vào allowFrom?">
    `channels.telegram.allowFrom` là **Telegram user ID của người gửi** (số). Nó không phải là bot username.

    Onboarding chấp nhận đầu vào `@username` và giải quyết nó thành một ID số, nhưng xác thực OpenClaw sử dụng chỉ ID số.

    An toàn hơn (không có bot bên thứ ba):

    - DM bot của bạn, sau đó chạy `openclaw logs --follow` và đọc `from.id`.

    Bot API chính thức:

    - DM bot của bạn, sau đó gọi `https://api.telegram.org/bot<bot_token>/getUpdates` và đọc `message.from.id`.

    Bên thứ ba (ít riêng tư hơn):

    - DM `@userinfobot` hoặc `@getidsbot`.

    Xem [/channels/telegram](/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Nhiều người có thể sử dụng một số WhatsApp với các instances OpenClaw khác nhau không?">
    Có, thông qua **multi-agent routing**. Bind mỗi DM WhatsApp của người gửi **(peer `kind: "direct"`, sender E.164 như `+15551234567`)** đến một `agentId` khác nhau, để mỗi người có workspace và session store riêng của họ. Phản hồi vẫn đến từ **cùng một tài khoản WhatsApp**, và kiểm soát truy cập DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) là toàn cầu cho mỗi tài khoản WhatsApp. Xem [Multi-Agent Routing](/concepts/multi-agent) và [WhatsApp](/channels/whatsapp).

  </Accordion>

  <Accordion title='Tôi có thể chạy một agent "fast chat" và một agent "Opus for coding" không?'>
    Có. Sử dụng multi-agent routing: cung cấp cho mỗi agent model mặc định riêng của nó, sau đó bind các routes inbound (tài khoản provider hoặc peers cụ thể) đến mỗi agent. Cấu hình ví dụ nằm trong [Multi-Agent Routing](/concepts/multi-agent). Xem thêm [Models](/concepts/models) và [Configuration](/gateway/configuration).

  </Accordion>

  <Accordion title="Homebrew có hoạt động trên Linux không?">
    Có. Homebrew hỗ trợ Linux (Linuxbrew). Thiết lập nhanh:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Nếu bạn chạy OpenClaw qua systemd, đảm bảo PATH dịch vụ bao gồm `/home/linuxbrew/.linuxbrew/bin` (hoặc brew prefix của bạn) để các công cụ cài đặt qua `brew` được giải quyết trong các shell không đăng nhập.
    Các bản build gần đây cũng thêm các thư mục bin người dùng phổ biến trên các dịch vụ Linux systemd (ví dụ `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) và tôn trọng `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, và `FNM_DIR` khi được thiết lập.

  </Accordion>

  <Accordion title="Sự khác biệt giữa cài đặt hackable git và npm install">
    - **Cài đặt Hackable (git):** full source checkout, có thể chỉnh sửa, tốt nhất cho contributors.
      Bạn chạy builds local và có thể patch code/docs.
    - **npm install:** cài đặt CLI global, không có repo, tốt nhất cho "chỉ cần chạy nó."
      Cập nhật đến từ npm dist-tags.

    Docs: [Getting started](/start/getting-started), [Updating](/install/updating).

  </Accordion>

  <Accordion title="Tôi có thể chuyển đổi giữa npm và git installs sau này không?">
    Có. Cài đặt hương vị khác, sau đó chạy Doctor để dịch vụ gateway trỏ vào entrypoint mới.
    Điều này **không xóa dữ liệu của bạn** - nó chỉ thay đổi cài đặt mã OpenClaw. Trạng thái của bạn
    (`~/.openclaw`) và workspace (`~/.openclaw/workspace`) vẫn không bị ảnh hưởng.

    Từ npm sang git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Từ git sang npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor phát hiện sự không khớp entrypoint dịch vụ gateway và đề nghị viết lại cấu hình dịch vụ để khớp với cài đặt hiện tại (sử dụng `--repair` trong tự động hóa).

    Mẹo sao lưu: xem [Backup strategy](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Tôi nên chạy Gateway trên laptop hay VPS?">
    Câu trả lời ngắn: **nếu bạn muốn độ tin cậy 24/7, sử dụng VPS**. Nếu bạn muốn ít ma sát nhất và bạn ổn với sleep/restarts, chạy nó local.

    **Laptop (local Gateway)**

    - **Ưu điểm:** không tốn chi phí server, truy cập trực tiếp vào tệp local, cửa sổ trình duyệt trực tiếp.
    - **Nhược điểm:** sleep/mất kết nối mạng = ngắt kết nối, cập nhật/reboots OS gián đoạn, phải giữ cho máy thức.

    **VPS / cloud**

    - **Ưu điểm:** luôn bật, mạng ổn định, không có vấn đề sleep laptop, dễ dàng giữ cho nó chạy.
    - **Nhược điểm:** thường chạy headless (sử dụng screenshots), chỉ truy cập tệp từ xa, bạn phải SSH để cập nhật.

    **Ghi chú OpenClaw:** WhatsApp/Telegram/Slack/Mattermost (plugin)/Discord đều hoạt động tốt từ VPS. Sự đánh đổi thực sự duy nhất là **trình duyệt headless** so với cửa sổ có thể nhìn thấy. Xem [Browser](/tools/browser).

    **Khuyến nghị mặc định:** VPS nếu bạn đã gặp ngắt kết nối gateway trước đó. Local rất tốt khi bạn đang sử dụng Mac và muốn truy cập tệp local hoặc tự động hóa UI với một trình duyệt có thể nhìn thấy.

  </Accordion>

  <Accordion title="Chạy OpenClaw trên một máy chuyên dụng quan trọng đến mức nào?">
    Không bắt buộc, nhưng **khuyến nghị để có độ tin cậy và cách ly**.

    - **Host chuyên dụng (VPS/Mac mini/Pi):** luôn bật, ít gián đoạn sleep/reboot hơn, quyền hạn sạch hơn, dễ dàng giữ cho nó chạy.
    - **Laptop/desktop chia sẻ:** hoàn toàn ổn cho thử nghiệm và sử dụng tích cực, nhưng mong đợi tạm dừng khi máy ngủ hoặc cập nhật.

    Nếu bạn muốn tốt nhất của cả hai thế giới, giữ Gateway trên một host chuyên dụng và ghép laptop của bạn như một **node** để có các công cụ màn hình/camera/exec local. Xem [Nodes](/nodes).
    Để biết hướng dẫn bảo mật, đọc [Security](/gateway/security).

  </Accordion>

  <Accordion title="Yêu cầu VPS tối thiểu và OS được khuyến nghị là gì?">
    OpenClaw nhẹ. Đối với một Gateway cơ bản + một kênh chat:

    - **Tối thiểu tuyệt đối:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Khuyến nghị:** 1-2 vCPU, 2GB RAM hoặc nhiều hơn để có không gian (logs, media, nhiều kênh). Các công cụ Node và tự động hóa trình duyệt có thể tiêu tốn tài nguyên.

    OS: sử dụng **Ubuntu LTS** (hoặc bất kỳ Debian/Ubuntu hiện đại nào). Đường dẫn cài đặt Linux được thử nghiệm tốt nhất ở đó.

    Docs: [Linux](/platforms/linux), [VPS hosting](/vps).

  </Accordion>

  <Accordion title="Tôi có thể chạy OpenClaw trong một VM và yêu cầu là gì?">
    Có. Đối xử với một VM giống như một VPS: nó cần luôn bật, có thể truy cập, và có đủ
    RAM cho Gateway và bất kỳ kênh nào bạn kích hoạt.

    Hướng dẫn cơ bản:

    - **Tối thiểu tuyệt đối:** 1 vCPU, 1GB RAM.
    - **Khuyến nghị:** 2GB RAM hoặc nhiều hơn nếu bạn chạy nhiều kênh, tự động hóa trình duyệt, hoặc công cụ media.
    - **OS:** Ubuntu LTS hoặc một Debian/Ubuntu hiện đại khác.

    Nếu bạn đang trên Windows, **WSL2 là thiết lập kiểu VM dễ nhất** và có sự tương thích công cụ tốt nhất. Xem [Windows](/platforms/windows), [VPS hosting](/vps).
    Nếu bạn đang chạy macOS trong một VM, xem [macOS VM](/install/macos-vm).

  </Accordion>
</AccordionGroup>

## OpenClaw là gì?

<AccordionGroup>
  <Accordion title="OpenClaw là gì, trong một đoạn văn?">
    OpenClaw là một trợ lý AI cá nhân bạn chạy trên các thiết bị của mình. Nó trả lời trên các bề mặt nhắn tin bạn đã sử dụng (WhatsApp, Telegram, Slack, Mattermost (plugin), Discord, Google Chat, Signal, iMessage, WebChat) và cũng có thể làm giọng nói + một Canvas trực tiếp trên các nền tảng được hỗ trợ. **Gateway** là mặt phẳng điều khiển luôn bật; trợ lý là sản phẩm.
  </Accordion>

  <Accordion title="Giá trị đề xuất">
    OpenClaw không phải là "chỉ là một Claude wrapper." Nó là một **mặt phẳng điều khiển ưu tiên local** cho phép bạn chạy một trợ lý mạnh mẽ trên **phần cứng của riêng bạn**, có thể truy cập từ các ứng dụng chat bạn đã sử dụng, với các phiên làm việc có trạng thái, bộ nhớ, và công cụ - mà không cần giao quyền kiểm soát quy trình làm việc của bạn cho một SaaS được host.

    Điểm nổi bật:

    - **Thiết bị của bạn, dữ liệu của bạn:** chạy Gateway ở bất kỳ đâu bạn muốn (Mac, Linux, VPS) và giữ
      workspace + lịch sử session local.
    - **Các kênh thực, không phải sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      cộng với giọng nói di động và Canvas trên các nền tảng được hỗ trợ.
    - **Không phụ thuộc vào model:** sử dụng Anthropic, OpenAI, MiniMax, OpenRouter, v.v., với routing
      và failover theo agent.
    - **Tùy chọn chỉ local:** chạy models local để **tất cả dữ liệu có thể ở lại trên thiết bị của bạn** nếu bạn muốn.
    - **Multi-agent routing:** tách agents theo kênh, tài khoản, hoặc nhiệm vụ, mỗi cái có workspace và mặc định riêng.
    - **Mã nguồn mở và có thể hack:** kiểm tra, mở rộng, và tự host mà không bị khóa bởi nhà cung cấp.

    Docs: [Gateway](/gateway), [Channels](/channels), [Multi-agent](/concepts/multi-agent),
    [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="Tôi vừa thiết lập nó - tôi nên làm gì đầu tiên?">
    Các dự án đầu tiên tốt:

    - Xây dựng một trang web (WordPress, Shopify, hoặc một trang tĩnh đơn giản).
    - Prototype một ứng dụng di động (outline, screens, kế hoạch API).
    - Tổ chức tệp và thư mục (dọn dẹp, đặt tên, gắn thẻ).
    - Kết nối Gmail và tự động hóa tóm tắt hoặc theo dõi.

    Nó có thể xử lý các nhiệm vụ lớn, nhưng nó hoạt động tốt nhất khi bạn chia chúng thành các giai đoạn và
    sử dụng sub agents cho công việc song song.

  </Accordion>

  <Accordion title="Năm trường hợp sử dụng hàng ngày hàng đầu cho OpenClaw là gì?">
    Những chiến thắng hàng ngày thường trông như:

    - **Tóm tắt cá nhân:** tóm tắt hộp thư đến, lịch, và tin tức bạn quan tâm.
    - **Nghiên cứu và soạn thảo:** nghiên cứu nhanh, tóm tắt, và bản nháp đầu tiên cho email hoặc tài liệu.
    - **Nhắc nhở và theo dõi:** cron hoặc nhịp tim điều khiển nhắc nhở và danh sách kiểm tra.
    - **Tự động hóa trình duyệt:** điền vào biểu mẫu, thu thập dữ liệu, và lặp lại các nhiệm vụ web.
    - **Phối hợp thiết bị chéo:** gửi một nhiệm vụ từ điện thoại của bạn, để Gateway chạy nó trên server, và nhận kết quả trở lại trong chat.

  </Accordion>

  <Accordion title="OpenClaw có thể giúp với lead gen, outreach, ads, và blogs cho một SaaS không?">
    Có cho **nghiên cứu, đủ điều kiện, và soạn thảo**. Nó có thể quét các trang web, xây dựng danh sách ngắn,
    tóm tắt khách hàng tiềm năng, và viết bản nháp outreach hoặc ad copy.

    Đối với **outreach hoặc ad runs**, giữ một người trong vòng lặp. Tránh spam, tuân thủ luật pháp địa phương và
    chính sách nền tảng, và xem xét mọi thứ trước khi gửi. Mẫu an toàn nhất là để
    OpenClaw soạn thảo và bạn phê duyệt.

    Docs: [Security](/gateway/security).

  </Accordion>

  <Accordion title="Lợi thế so với Claude Code cho phát triển web là gì?">
    OpenClaw là một **trợ lý cá nhân** và lớp điều phối, không phải là một thay thế IDE. Sử dụng
    Claude Code hoặc Codex cho vòng lặp mã hóa trực tiếp nhanh nhất trong một repo. Sử dụng OpenClaw khi bạn
    muốn bộ nhớ bền vững, truy cập đa thiết bị, và điều phối công cụ.

    Lợi thế:

    - **Bộ nhớ + workspace bền vững** qua các phiên
    - **Truy cập đa nền tảng** (WhatsApp, Telegram, TUI, WebChat)
    - **Điều phối công cụ** (trình duyệt, tệp, lập lịch, hooks)
    - **Gateway luôn bật** (chạy trên VPS, tương tác từ bất kỳ đâu)
    - **Nodes** cho trình duyệt/màn hình/camera/exec local

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Kỹ năng và tự động hóa

<AccordionGroup>
  <Accordion title="Làm thế nào để tùy chỉnh kỹ năng mà không giữ repo bẩn?">
    Sử dụng overrides được quản lý thay vì chỉnh sửa bản sao repo. Đặt các thay đổi của bạn trong `~/.openclaw/skills/<name>/SKILL.md` (hoặc thêm một thư mục qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json`). Thứ tự ưu tiên là `<workspace>/skills` > `~/.openclaw/skills` > bundled, vì vậy overrides được quản lý thắng mà không chạm vào git. Chỉ các chỉnh sửa đáng giá upstream mới nên sống trong repo và đi ra ngoài dưới dạng PRs.

  </Accordion>

  <Accordion title="Tôi có thể tải kỹ năng từ một thư mục tùy chỉnh không?">
    Có. Thêm các thư mục bổ sung qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json` (thứ tự ưu tiên thấp nhất). Thứ tự ưu tiên mặc định vẫn là: `<workspace>/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` cài đặt vào `./skills` theo mặc định, mà OpenClaw coi là `<workspace>/skills` trong phiên tiếp theo.

  </Accordion>

  <Accordion title="Làm thế nào để sử dụng các models khác nhau cho các nhiệm vụ khác nhau?">
    Hôm nay các mẫu được hỗ trợ là:

    - **Cron jobs**: các công việc cô lập có thể đặt một override `model` cho mỗi công việc.
    - **Sub-agents**: định tuyến các nhiệm vụ đến các agents riêng biệt với các models mặc định khác nhau.
    - **Chuyển đổi theo yêu cầu**: sử dụng `/model` để chuyển đổi model phiên hiện tại bất kỳ lúc nào.

    Xem [Cron jobs](/automation/cron-jobs), [Multi-Agent Routing](/concepts/multi-agent), và [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot bị đóng băng khi làm việc nặng. Làm thế nào để giảm tải điều đó?">
    Sử dụng **sub-agents** cho các nhiệm vụ dài hoặc song song. Sub-agents chạy trong phiên riêng của chúng,
    trả về một tóm tắt, và giữ cho chat chính của bạn phản hồi.

    Yêu cầu bot của bạn "spawn a sub-agent for this task" hoặc sử dụng `/subagents`.
    Sử dụng `/status` trong chat để xem Gateway đang làm gì ngay bây giờ (và liệu nó có bận không).

    Mẹo token: các nhiệm vụ dài và sub-agents đều tiêu thụ tokens. Nếu chi phí là một mối quan tâm, đặt một
    model rẻ hơn cho sub-agents qua `agents.defaults.subagents.model`.

    Docs: [Sub-agents](/tools/subagents).

  </Accordion>

  <Accordion title="Làm thế nào để các phiên subagent ràng buộc theo thread hoạt động trên Discord?">
    Sử dụng ràng buộc thread. Bạn có thể ràng buộc một thread Discord với một subagent hoặc mục tiêu phiên để các tin nhắn tiếp theo trong thread đó giữ nguyên trên phiên đã ràng buộc.

    Luồng cơ bản:

    - Spawn với `sessions_spawn` sử dụng `thread: true` (và tùy chọn `mode: "session"` cho follow-up bền vững).
    - Hoặc ràng buộc thủ công với `/focus <target>`.
    - Sử dụng `/agents` để kiểm tra trạng thái ràng buộc.
    - Sử dụng `/session idle <duration|off>` và `/session max-age <duration|off>` để kiểm soát tự động unfocus.
    - Sử dụng `/unfocus` để tách thread.

    Cấu hình yêu cầu:

    - Mặc định toàn cầu: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Overrides Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Tự động ràng buộc khi spawn: đặt `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Docs: [Sub-agents](/tools/subagents), [Discord](/channels/discord), [Configuration Reference](/gateway/configuration-reference), [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title="Cron hoặc nhắc nhở không chạy. Tôi nên kiểm tra gì?">
    Cron chạy bên trong quá trình Gateway. Nếu Gateway không chạy liên tục,
    các công việc đã lên lịch sẽ không chạy.

    Danh sách kiểm tra:

    - Xác nhận cron được bật (`cron.enabled`) và `OPENCLAW_SKIP_CRON` không được thiết lập.
    - Kiểm tra Gateway đang chạy 24/7 (không sleep/restarts).
    - Xác minh cài đặt múi giờ cho công việc (`--tz` so với múi giờ host).

    Debug:

    ```bash
    openclaw cron run <jobId> --force
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs: [Cron jobs](/automation/cron-jobs), [Cron vs Heartbeat](/automation/cron-vs-heartbeat).

  </Accordion>

  <Accordion title="Làm thế nào để cài đặt kỹ năng trên Linux?">
    Sử dụng **ClawHub** (CLI) hoặc thả kỹ năng vào workspace của bạn. UI Skills macOS không có sẵn trên Linux.
    Duyệt kỹ năng tại [https://clawhub.com](https://clawhub.com).

    Cài đặt ClawHub CLI (chọn một trình quản lý gói):

    ```bash
    npm i -g clawhub
    ```

    ```bash
    pnpm add -g clawhub
    ```

  </Accordion>

  <Accordion title="OpenClaw có thể chạy các nhiệm vụ theo lịch trình hoặc liên tục trong nền không?">
    Có. Sử dụng bộ lập lịch Gateway:

    - **Cron jobs** cho các nhiệm vụ theo lịch trình hoặc định kỳ (duy trì qua các lần khởi động lại).
    - **Heartbeat** cho các kiểm tra định kỳ "main session".
    - **Isolated jobs** cho các agents tự trị đăng tóm tắt hoặc gửi đến chats.

    Docs: [Cron jobs](/automation/cron-jobs), [Cron vs Heartbeat](/automation/cron-vs-heartbeat),
    [Heartbeat](/gateway/heartbeat).

  </Accordion>

  <Accordion title="Tôi có thể chạy các kỹ năng chỉ dành cho macOS từ Linux không?">
    Không trực tiếp. Các kỹ năng macOS bị giới hạn bởi `metadata.openclaw.os` cộng với các binaries yêu cầu, và các kỹ năng chỉ xuất hiện trong prompt hệ thống khi chúng đủ điều kiện trên **Gateway host**. Trên Linux, các kỹ năng chỉ dành cho `darwin` (như `apple-notes`, `apple-reminders`, `things-mac`) sẽ không tải trừ khi bạn override việc giới hạn.

    Bạn có ba mẫu được hỗ trợ:

    **Option A - chạy Gateway trên một Mac (đơn giản nhất).**
    Chạy Gateway nơi các binaries macOS tồn tại, sau đó kết nối từ Linux trong [remote mode](#gateway-ports-already-running-and-remote-mode) hoặc qua Tailscale. Các kỹ năng tải bình thường vì Gateway host là macOS.

    **Option B - sử dụng một node macOS (không SSH).**
    Chạy Gateway trên Linux, ghép một node macOS (ứng dụng menubar), và đặt **Node Run Commands** thành "Always Ask" hoặc "Always Allow" trên Mac. OpenClaw có thể coi các kỹ năng chỉ dành cho macOS là đủ điều kiện khi các binaries yêu cầu tồn tại trên node. Agent chạy các kỹ năng đó qua công cụ `nodes`. Nếu bạn chọn "Always Ask", phê duyệt "Always Allow" trong prompt thêm lệnh đó vào danh sách cho phép.

    **Option C - proxy các binaries macOS qua SSH (nâng cao).**
    Giữ Gateway trên Linux, nhưng làm cho các binaries CLI yêu cầu giải quyết thành các wrappers SSH chạy trên một Mac. Sau đó override kỹ năng để cho phép Linux để nó vẫn đủ điều kiện.

    1. Tạo một wrapper SSH cho binary (ví dụ: `memo` cho Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Đặt wrapper trên `PATH` trên host Linux (ví dụ `~/bin/memo`).
    3. Override metadata kỹ năng (workspace hoặc `~/.openclaw/skills`) để cho phép Linux:

       ```markdown
       ---
       name: apple-notes
       description: Quản lý Apple Notes qua memo CLI trên macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Bắt đầu một phiên mới để snapshot kỹ năng làm mới.

  </Accordion>

  <Accordion title="Bạn có tích hợp Notion hoặc HeyGen không?">
    Không có sẵn hôm nay.

    Các tùy chọn:

    - **Kỹ năng tùy chỉnh / plugin:** tốt nhất cho truy cập API đáng tin cậy (cả Notion/HeyGen đều có APIs).
    - **Tự động hóa trình duyệt:** hoạt động mà không cần mã nhưng chậm hơn và dễ vỡ hơn.

    Nếu bạn muốn giữ context cho mỗi khách hàng (quy trình làm việc của agency), một mẫu đơn giản là:

    - Một trang Notion cho mỗi khách hàng (context + preferences + công việc đang hoạt động).
    - Yêu cầu agent lấy trang đó khi bắt đầu một phiên.

    Nếu bạn muốn một tích hợp native, mở một yêu cầu tính năng hoặc xây dựng một kỹ năng
    nhắm mục tiêu các APIs đó.

    Cài đặt kỹ năng:

    ```bash
    clawhub install <skill-slug>
    clawhub update --all
    ```

    ClawHub cài đặt vào `./skills` dưới thư mục hiện tại của bạn (hoặc fallback vào workspace OpenClaw đã cấu hình của bạn); OpenClaw coi đó là `<workspace>/skills` trong phiên tiếp theo. Đối với các kỹ năng chia sẻ giữa các agents, đặt chúng trong `~/.openclaw/skills/<name>/SKILL.md`. Một số kỹ năng mong đợi các binaries được cài đặt qua Homebrew; trên Linux điều đó có nghĩa là Linuxbrew (xem mục FAQ Homebrew Linux ở trên). Xem [Skills](/tools/skills) và [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="Làm thế nào để sử dụng Chrome đã đăng nhập của tôi với OpenClaw?">
    Sử dụng profile trình duyệt `user` tích hợp, kết nối qua Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Nếu bạn muốn một tên tùy chỉnh, tạo một profile MCP rõ ràng:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Đường dẫn này là host-local. Nếu Gateway chạy ở nơi khác, hoặc chạy một node host trên máy trình duyệt hoặc sử dụng remote CDP thay thế.

  </Accordion>
</AccordionGroup>

## Sandboxing và bộ nhớ

<AccordionGroup>
  <Accordion title="Có tài liệu sandboxing chuyên dụng không?">
    Có. Xem [Sandboxing](/gateway/sandboxing). Đối với thiết lập Docker cụ thể (full gateway trong Docker hoặc sandbox images), xem [Docker](/install/docker).

  </Accordion>

  <Accordion title="Docker cảm thấy bị giới hạn - làm thế nào để kích hoạt đầy đủ các tính năng?">
    Image mặc định là bảo mật trước tiên và chạy dưới dạng người dùng `node`, vì vậy nó không
    bao gồm các gói hệ thống, Homebrew, hoặc trình duyệt bundled. Để có một thiết lập đầy đủ hơn:

    - Duy trì `/home/node` với `OPENCLAW_HOME_VOLUME` để caches tồn tại.
    - Nướng các phụ thuộc hệ thống vào image với `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Cài đặt trình duyệt Playwright qua CLI bundled:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Đặt `PLAYWRIGHT_BROWSERS_PATH` và đảm bảo đường dẫn được duy trì.

    Docs: [Docker](/install/docker), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Tôi có thể giữ DMs cá nhân nhưng làm cho các nhóm công khai/sandboxed với một agent không?">
    Có - nếu lưu lượng cá nhân của bạn là **DMs** và lưu lượng công khai của bạn là **groups**.

    Sử dụng `agents.defaults.sandbox.mode: "non-main"` để các phiên group/channel (không phải main keys) chạy trong Docker, trong khi phiên DM chính vẫn ở trên host. Sau đó hạn chế các công cụ nào có sẵn trong các phiên sandboxed qua `tools.sandbox.tools`.

    Hướng dẫn thiết lập + cấu hình ví dụ: [Groups: personal DMs + public groups](/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Tham khảo cấu hình chính: [Gateway configuration](/gateway/configuration-reference#agents-defaults-sandbox)

  </Accordion>

  <Accordion title="Làm thế nào để bind một thư mục host vào sandbox?">
    Đặt `agents.defaults.sandbox.docker.binds` thành `["host:path:mode"]` (ví dụ, `"/home/user/src:/src:ro"`). Các binds global + per-agent hợp nhất; các binds per-agent bị bỏ qua khi `scope: "shared"`. Sử dụng `:ro` cho bất kỳ thứ gì nhạy cảm và nhớ rằng binds bỏ qua các bức tường hệ thống tệp sandbox. Xem [Sandboxing](/gateway/sandboxing#custom-bind-mounts) và [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) để biết ví dụ và ghi chú an toàn.

  </Accordion>

  <Accordion title="Bộ nhớ hoạt động như thế nào?">
    Bộ nhớ OpenClaw chỉ là các tệp Markdown trong workspace agent:

    - Ghi chú hàng ngày trong `memory/YYYY-MM-DD.md`
    - Ghi chú dài hạn được chọn lọc trong `MEMORY.md` (chỉ main/private sessions)

    OpenClaw cũng chạy một **flush bộ nhớ pre-compaction im lặng** để nhắc model
    viết ghi chú bền vững trước khi tự động compaction. Điều này chỉ chạy khi workspace
    có thể ghi (các sandboxes chỉ đọc bỏ qua nó). Xem [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="Bộ nhớ cứ quên mọi thứ. Làm thế nào để làm cho nó nhớ?">
    Yêu cầu bot **ghi nhớ vào bộ nhớ**. Ghi chú dài hạn thuộc về `MEMORY.md`,
    context ngắn hạn đi vào `memory/YYYY-MM-DD.md`.

    Đây vẫn là một khu vực chúng tôi đang cải thiện. Nó giúp nhắc model lưu trữ bộ nhớ;
    nó sẽ biết phải làm gì. Nếu nó cứ quên, xác minh Gateway đang sử dụng cùng
    workspace trên mỗi lần chạy.

    Docs: [Memory](/concepts/memory), [Agent workspace](/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bộ nhớ có tồn tại mãi mãi không? Giới hạn là gì?">
    Các tệp bộ nhớ sống trên đĩa và tồn tại cho đến khi bạn xóa chúng. Giới hạn là
    lưu trữ của bạn, không phải model. **Session context** vẫn bị giới hạn bởi cửa sổ context model,
    vì vậy các cuộc trò chuyện dài có thể compact hoặc truncate. Đó là lý do tại sao
    tìm kiếm bộ nhớ tồn tại - nó chỉ kéo các phần liên quan trở lại vào context.

    Docs: [Memory](/concepts/memory), [Context](/concepts/context).

  </Accordion>

  <Accordion title="Tìm kiếm bộ nhớ ngữ nghĩa có yêu cầu một OpenAI API key không?">
    Chỉ khi bạn sử dụng **OpenAI embeddings**. Codex OAuth bao phủ chat/completions và
    **không** cấp quyền truy cập embeddings, vì vậy **đăng nhập với Codex (OAuth hoặc
    Codex CLI login)** không giúp cho tìm kiếm bộ nhớ ngữ nghĩa. OpenAI embeddings
    vẫn cần một API key thực (`OPENAI_API_KEY` hoặc `models.providers.openai.apiKey`).

    Nếu bạn không đặt một provider rõ ràng, OpenClaw tự động chọn một provider khi nó
    có thể giải quyết một API key (hồ sơ xác thực, `models.providers.*.apiKey`, hoặc env vars).
    Nó ưu tiên OpenAI nếu một OpenAI key được giải quyết, nếu không thì Gemini nếu một Gemini key
    được giải quyết, sau đó Voyage, sau đó Mistral. Nếu không có key từ xa nào có sẵn, tìm kiếm bộ nhớ
    vẫn bị vô hiệu hóa cho đến khi bạn cấu hình nó. Nếu bạn có một đường dẫn model local
    được cấu hình và có mặt, OpenClaw
    ưu tiên `local`. Ollama được hỗ trợ khi bạn rõ ràng đặt
    `memorySearch.provider = "ollama"`.

    Nếu bạn muốn ở lại local, đặt `memorySearch.provider = "local"` (và tùy chọn
    `memorySearch.fallback = "none"`). Nếu bạn muốn Gemini embeddings, đặt
    `memorySearch.provider = "gemini"` và cung cấp `GEMINI_API_KEY` (hoặc
    `memorySearch.remote.apiKey`). Chúng tôi hỗ trợ **OpenAI, Gemini, Voyage, Mistral, Ollama, hoặc local** embedding
    models - xem [Memory](/concepts/memory) để biết chi tiết thiết lập.

  </Accordion>
</AccordionGroup>

## Nơi lưu trữ dữ liệu trên đĩa

<AccordionGroup>
  <Accordion title="Tất cả dữ liệu sử dụng với OpenClaw có được lưu trữ local không?">
    Không - **trạng thái của OpenClaw là local**, nhưng **các dịch vụ bên ngoài vẫn thấy những gì bạn gửi cho chúng**.

    - **Local theo mặc định:** sessions, tệp bộ nhớ, cấu hình, và workspace sống trên Gateway host
      (`~/.openclaw` + thư mục workspace của bạn).
    - **Từ xa theo nhu cầu:** các tin nhắn bạn gửi đến các model providers (Anthropic/OpenAI/etc.) đi đến
      APIs của họ, và các nền tảng chat (WhatsApp/Telegram/Slack/etc.) lưu trữ dữ liệu tin nhắn trên
      servers của họ.
    - **Bạn kiểm soát footprint:** sử dụng models local giữ prompts trên máy của bạn, nhưng lưu lượng kênh
      vẫn đi qua servers của kênh.

    Liên quan: [Agent workspace](/concepts/agent-workspace), [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw lưu trữ dữ liệu của nó ở đâu?">
    Mọi thứ sống dưới `$OPENCLAW_STATE_DIR` (mặc định: `~/.openclaw`):

    | Đường dẫn                                                            | Mục đích                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Cấu hình chính (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Nhập OAuth cũ (sao chép vào hồ sơ xác thực khi sử dụng lần đầu)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Hồ sơ xác thực (OAuth, API keys, và tùy chọn `keyRef`/`tokenRef`)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Tệp payload bí mật dựa trên tệp tùy chọn cho các nhà cung cấp SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Tệp tương thích cũ (các mục `api_key` tĩnh đã được xóa)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Trạng thái provider (ví dụ `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Trạng thái per-agent (agentDir + sessions)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Lịch sử & trạng thái cuộc trò chuyện (per agent)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadata session (per agent)                                       |

    Đường dẫn single-agent cũ: `~/.openclaw/agent/*` (di chuyển bởi `openclaw doctor`).

    **Workspace** của bạn (AGENTS.md, tệp bộ nhớ, kỹ năng, v.v.) là riêng biệt và được cấu hình qua `agents.defaults.workspace` (mặc định: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nên sống ở đâu?">
    Các tệp này sống trong **workspace agent**, không phải `~/.openclaw`.

    - **Workspace (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (hoặc fallback cũ `memory.md` khi `MEMORY.md` không có),
      `memory/YYYY-MM-DD.md`, tùy chọn `HEARTBEAT.md`.
    - **Thư mục trạng thái (`~/.openclaw`)**: cấu hình, thông tin đăng nhập, hồ sơ xác thực, sessions, logs,
      và kỹ năng chia sẻ (`~/.openclaw/skills`).

    Workspace mặc định là `~/.openclaw/workspace`, có thể cấu hình qua:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Nếu bot "quên" sau khi khởi động lại, hãy xác nhận Gateway đang sử dụng cùng
    workspace trên mỗi lần khởi chạy.

  </Accordion>

  <Accordion title="Chiến lược sao lưu được đề xuất">
    Đặt **workspace agent** của bạn trong một repo git riêng tư và sao lưu nơi nào đó an toàn. Điều này ghi lại bộ nhớ + các tệp AGENTS/SOUL/USER.
  </Accordion>
</AccordionGroup>\n