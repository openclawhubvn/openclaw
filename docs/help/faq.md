---
summary: "Các câu hỏi thường gặp về cài đặt, cấu hình và sử dụng OpenClaw"
read_when:
  - Trả lời các câu hỏi thường gặp về cài đặt, cài đặt, onboarding hoặc hỗ trợ runtime
  - Phân loại các vấn đề do người dùng báo cáo trước khi đi sâu vào gỡ lỗi
title: "FAQ"
---

# FAQ

Câu trả lời nhanh và hướng dẫn khắc phục sự cố cho các thiết lập thực tế (phát triển cục bộ, VPS, multi-agent, OAuth/API keys, chuyển đổi mô hình). Để chẩn đoán runtime, xem [Troubleshooting](/gateway/troubleshooting). Để tham khảo cấu hình đầy đủ, xem [Configuration](/gateway/configuration).

## 60 giây đầu tiên nếu có sự cố

1. **Kiểm tra trạng thái nhanh (kiểm tra đầu tiên)**

   ```bash
   openclaw status
   ```

   Tóm tắt nhanh cục bộ: Hệ điều hành + cập nhật, khả năng truy cập gateway/dịch vụ, agents/sessions, cấu hình provider + vấn đề runtime (khi gateway có thể truy cập).

2. **Báo cáo có thể chia sẻ (an toàn để chia sẻ)**

   ```bash
   openclaw status --all
   ```

   Chẩn đoán chỉ đọc với log tail (tokens đã được ẩn).

3. **Trạng thái Daemon + cổng**

   ```bash
   openclaw gateway status
   ```

   Hiển thị runtime của supervisor so với khả năng truy cập RPC, URL mục tiêu probe và cấu hình dịch vụ có thể đã sử dụng.

4. **Kiểm tra sâu**

   ```bash
   openclaw status --deep
   ```

   Chạy kiểm tra sức khỏe gateway + kiểm tra provider (yêu cầu gateway có thể truy cập). Xem [Health](/gateway/health).

5. **Theo dõi log mới nhất**

   ```bash
   openclaw logs --follow
   ```

   Nếu RPC không hoạt động, sử dụng:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   File logs tách biệt với logs dịch vụ; xem [Logging](/logging) và [Troubleshooting](/gateway/troubleshooting).

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
    Sử dụng một agent AI cục bộ có thể **xem máy của bạn**. Điều này hiệu quả hơn nhiều so với hỏi trên Discord, vì hầu hết các trường hợp "tôi bị kẹt" là **vấn đề cấu hình cục bộ hoặc môi trường** mà người hỗ trợ từ xa không thể kiểm tra.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Các công cụ này có thể đọc repo, chạy lệnh, kiểm tra logs và giúp sửa thiết lập cấp máy của bạn (PATH, dịch vụ, quyền, file xác thực). Cung cấp cho chúng **toàn bộ source checkout** thông qua cài đặt hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Điều này cài đặt OpenClaw **từ một git checkout**, vì vậy agent có thể đọc mã + tài liệu và suy luận về phiên bản chính xác bạn đang chạy. Bạn luôn có thể chuyển lại sang phiên bản ổn định sau bằng cách chạy lại trình cài đặt mà không có `--install-method git`.

    Mẹo: yêu cầu agent **lên kế hoạch và giám sát** việc sửa chữa (từng bước), sau đó chỉ thực hiện các lệnh cần thiết. Điều đó giữ cho các thay đổi nhỏ và dễ kiểm tra.

    Nếu bạn phát hiện ra lỗi thực sự hoặc sửa chữa, vui lòng gửi vấn đề trên GitHub hoặc gửi PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Bắt đầu với các lệnh này (chia sẻ đầu ra khi yêu cầu trợ giúp):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Chúng làm gì:

    - `openclaw status`: snapshot nhanh về sức khỏe gateway/agent + cấu hình cơ bản.
    - `openclaw models status`: kiểm tra xác thực provider + khả dụng mô hình.
    - `openclaw doctor`: xác thực và sửa chữa các vấn đề cấu hình/trạng thái phổ biến.

    Các kiểm tra CLI hữu ích khác: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Vòng lặp gỡ lỗi nhanh: [60 giây đầu tiên nếu có sự cố](#first-60-seconds-if-something-is-broken).
    Tài liệu cài đặt: [Install](/install), [Installer flags](/install/installer), [Updating](/install/updating).

  </Accordion>

  <Accordion title="Cách cài đặt và thiết lập OpenClaw được khuyến nghị">
    Repo khuyến nghị chạy từ source và sử dụng onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Trình hướng dẫn cũng có thể tự động xây dựng tài sản UI. Sau khi onboarding, bạn thường chạy Gateway trên cổng **18789**.

    Từ source (người đóng góp/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # tự động cài đặt các phụ thuộc UI lần đầu chạy
    openclaw onboard
    ```

    Nếu bạn chưa có cài đặt toàn cầu, chạy nó qua `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Làm thế nào để mở dashboard sau khi onboarding?">
    Trình hướng dẫn mở trình duyệt của bạn với một URL dashboard sạch (không có token) ngay sau khi onboarding và cũng in liên kết trong tóm tắt. Giữ tab đó mở; nếu nó không khởi chạy, sao chép/dán URL đã in trên cùng máy.
  </Accordion>

  <Accordion title="Làm thế nào để xác thực dashboard (token) trên localhost so với từ xa?">
    **Localhost (cùng máy):**

    - Mở `http://127.0.0.1:18789/`.
    - Nếu yêu cầu xác thực, dán token từ `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`) vào cài đặt Control UI.
    - Lấy nó từ máy chủ gateway: `openclaw config get gateway.auth.token` (hoặc tạo một cái: `openclaw doctor --generate-gateway-token`).

    **Không trên localhost:**

    - **Tailscale Serve** (khuyến nghị): giữ bind loopback, chạy `openclaw gateway --tailscale serve`, mở `https://<magicdns>/`. Nếu `gateway.auth.allowTailscale` là `true`, các header nhận dạng thỏa mãn xác thực Control UI/WebSocket (không cần token, giả định máy chủ gateway đáng tin cậy); HTTP APIs vẫn yêu cầu token/mật khẩu.
    - **Tailnet bind**: chạy `openclaw gateway --bind tailnet --token "<token>"`, mở `http://<tailscale-ip>:18789/`, dán token vào cài đặt dashboard.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` sau đó mở `http://127.0.0.1:18789/` và dán token vào cài đặt Control UI.

    Xem [Dashboard](/web/dashboard) và [Web surfaces](/web) để biết các chế độ bind và chi tiết xác thực.

  </Accordion>

  <Accordion title="Tôi cần runtime nào?">
    Node **>= 22** là bắt buộc. `pnpm` được khuyến nghị. Bun **không được khuyến nghị** cho Gateway.
  </Accordion>

  <Accordion title="Nó có chạy trên Raspberry Pi không?">
    Có. Gateway nhẹ - tài liệu liệt kê **512MB-1GB RAM**, **1 core**, và khoảng **500MB** đĩa là đủ cho sử dụng cá nhân, và lưu ý rằng **Raspberry Pi 4 có thể chạy nó**.

    Nếu bạn muốn thêm không gian (logs, media, dịch vụ khác), **2GB được khuyến nghị**, nhưng không phải là yêu cầu tối thiểu.

    Mẹo: một Pi/VPS nhỏ có thể lưu trữ Gateway, và bạn có thể ghép nối **nodes** trên laptop/điện thoại của bạn để sử dụng màn hình/camera/canvas cục bộ hoặc thực thi lệnh. Xem [Nodes](/nodes).

  </Accordion>

  <Accordion title="Có mẹo nào cho cài đặt Raspberry Pi không?">
    Phiên bản ngắn: nó hoạt động, nhưng mong đợi có những khó khăn.

    - Sử dụng hệ điều hành **64-bit** và giữ Node >= 22.
    - Ưu tiên cài đặt **hackable (git)** để bạn có thể xem logs và cập nhật nhanh chóng.
    - Bắt đầu mà không có channels/skills, sau đó thêm từng cái một.
    - Nếu bạn gặp vấn đề nhị phân kỳ lạ, thường là vấn đề **tương thích ARM**.

    Tài liệu: [Linux](/platforms/linux), [Install](/install).

  </Accordion>

  <Accordion title="Nó bị kẹt ở màn hình wake up my friend / onboarding không hoạt động. Làm gì bây giờ?">
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

    3. Nếu nó vẫn bị treo, chạy:

    ```bash
    openclaw doctor
    ```

    Nếu Gateway là từ xa, đảm bảo kết nối tunnel/Tailscale đang hoạt động và UI đang chỉ vào Gateway đúng. Xem [Remote access](/gateway/remote).

  </Accordion>

  <Accordion title="Tôi có thể di chuyển thiết lập của mình sang máy mới (Mac mini) mà không cần làm lại onboarding không?">
    Có. Sao chép **thư mục trạng thái** và **workspace**, sau đó chạy Doctor một lần. Điều này giữ cho bot của bạn "hoàn toàn giống nhau" (bộ nhớ, lịch sử phiên, xác thực và trạng thái kênh) miễn là bạn sao chép **cả hai** vị trí:

    1. Cài đặt OpenClaw trên máy mới.
    2. Sao chép `$OPENCLAW_STATE_DIR` (mặc định: `~/.openclaw`) từ máy cũ.
    3. Sao chép workspace của bạn (mặc định: `~/.openclaw/workspace`).
    4. Chạy `openclaw doctor` và khởi động lại dịch vụ Gateway.

    Điều này bảo toàn cấu hình, hồ sơ xác thực, thông tin đăng nhập WhatsApp, phiên và bộ nhớ. Nếu bạn đang ở chế độ từ xa, nhớ rằng máy chủ gateway sở hữu kho lưu trữ phiên và workspace.

    **Quan trọng:** nếu bạn chỉ commit/push workspace của mình lên GitHub, bạn đang sao lưu **bộ nhớ + file bootstrap**, nhưng **không phải** lịch sử phiên hoặc xác thực. Những thứ đó nằm dưới `~/.openclaw/` (ví dụ `~/.openclaw/agents/<agentId>/sessions/`).

    Liên quan: [Migrating](/install/migrating), [Nơi lưu trữ trên đĩa](#where-things-live-on-disk),
    [Agent workspace](/concepts/agent-workspace), [Doctor](/gateway/doctor),
    [Remote mode](/gateway/remote).

  </Accordion>

  <Accordion title="Tôi có thể xem những gì mới trong phiên bản mới nhất ở đâu?">
    Kiểm tra changelog trên GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Các mục mới nhất nằm ở đầu. Nếu phần trên cùng được đánh dấu **Unreleased**, phần có ngày tiếp theo là phiên bản mới nhất đã phát hành. Các mục được nhóm theo **Highlights**, **Changes**, và **Fixes** (cộng với các phần docs/khác khi cần thiết).

  </Accordion>

  <Accordion title="Không thể truy cập docs.openclaw.ai (lỗi SSL)">
    Một số kết nối Comcast/Xfinity chặn `docs.openclaw.ai` không chính xác thông qua Xfinity Advanced Security. Vô hiệu hóa nó hoặc cho phép `docs.openclaw.ai`, sau đó thử lại. Chi tiết thêm: [Troubleshooting](/help/faq#docsopenclawai-shows-an-ssl-error-comcast-xfinity).
    Vui lòng giúp chúng tôi mở khóa nó bằng cách báo cáo tại đây: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Nếu bạn vẫn không thể truy cập trang web, tài liệu được sao lưu trên GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Sự khác biệt giữa stable và beta">
    **Stable** và **beta** là **npm dist-tags**, không phải các dòng mã riêng biệt:

    - `latest` = stable
    - `beta` = bản dựng sớm để thử nghiệm

    Chúng tôi phát hành các bản dựng cho **beta**, thử nghiệm chúng, và khi một bản dựng ổn định, chúng tôi **thăng cấp phiên bản đó lên `latest`**. Đó là lý do tại sao beta và stable có thể chỉ vào **cùng một phiên bản**.

    Xem những gì đã thay đổi:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

  </Accordion>

  <Accordion title="Làm thế nào để cài đặt phiên bản beta và sự khác biệt giữa beta và dev là gì?">
    **Beta** là npm dist-tag `beta` (có thể khớp với `latest`).
    **Dev** là đầu di chuyển của `main` (git); khi được phát hành, nó sử dụng npm dist-tag `dev`.

    Một dòng lệnh (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Trình cài đặt Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Chi tiết thêm: [Development channels](/install/development-channels) và [Installer flags](/install/installer).

  </Accordion>

  <Accordion title="Làm thế nào để thử các phần mới nhất?">
    Hai lựa chọn:

    1. **Kênh Dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Điều này chuyển sang nhánh `main` và cập nhật từ source.

    2. **Cài đặt hackable (từ trang cài đặt):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Điều đó cung cấp cho bạn một repo cục bộ bạn có thể chỉnh sửa, sau đó cập nhật qua git.

    Nếu bạn thích một clone sạch thủ công, sử dụng:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Tài liệu: [Update](/cli/update), [Development channels](/install/development-channels),
    [Install](/install).

  </Accordion>

  <Accordion title="Cài đặt và onboarding thường mất bao lâu?">
    Hướng dẫn sơ bộ:

    - **Cài đặt:** 2-5 phút
    - **Onboarding:** 5-15 phút tùy thuộc vào số lượng kênh/mô hình bạn cấu hình

    Nếu nó bị treo, sử dụng [Installer stuck](#quick-start-and-first-run-setup)
    và vòng lặp gỡ lỗi nhanh trong [I am stuck](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Trình cài đặt bị kẹt? Làm thế nào để có thêm phản hồi?">
    Chạy lại trình cài đặt với **đầu ra chi tiết**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Cài đặt beta với chi tiết:

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

  <Accordion title="Cài đặt Windows báo không tìm thấy git hoặc không nhận diện được openclaw">
    Hai vấn đề phổ biến trên Windows:

    **1) npm error spawn git / không tìm thấy git**

    - Cài đặt **Git for Windows** và đảm bảo `git` có trong PATH của bạn.
    - Đóng và mở lại PowerShell, sau đó chạy lại trình cài đặt.

    **2) openclaw không được nhận diện sau khi cài đặt**

    - Thư mục bin toàn cầu npm của bạn không có trong PATH.
    - Kiểm tra đường dẫn:

      ```powershell
      npm config get prefix
      ```

    - Thêm thư mục đó vào PATH người dùng của bạn (không cần hậu tố `\bin` trên Windows; trên hầu hết các hệ thống là `%AppData%\npm`).
    - Đóng và mở lại PowerShell sau khi cập nhật PATH.

    Nếu bạn muốn thiết lập Windows mượt mà nhất, sử dụng **WSL2** thay vì Windows gốc.
    Tài liệu: [Windows](/platforms/windows).

  </Accordion>

  <Accordion title="Đầu ra exec trên Windows hiển thị văn bản tiếng Trung bị lỗi - tôi nên làm gì?">
    Đây thường là sự không khớp mã trang console trên các shell Windows gốc.

    Triệu chứng:

    - Đầu ra `system.run`/`exec` hiển thị tiếng Trung dưới dạng mojibake
    - Lệnh tương tự trông ổn trong một profile terminal khác

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
    Sử dụng cài đặt **hackable (git)** để bạn có toàn bộ source và tài liệu cục bộ, sau đó hỏi bot của bạn (hoặc Claude/Codex) _từ thư mục đó_ để nó có thể đọc repo và trả lời chính xác.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Chi tiết thêm: [Install](/install) và [Installer flags](/install/installer).

  </Accordion>

  <Accordion title="Làm thế nào để cài đặt OpenClaw trên Linux?">
    Câu trả lời ngắn: theo hướng dẫn Linux, sau đó chạy onboarding.

    - Đường dẫn nhanh Linux + cài đặt dịch vụ: [Linux](/platforms/linux).
    - Hướng dẫn đầy đủ: [Getting Started](/start/getting-started).
    - Trình cài đặt + cập nhật: [Install & updates](/install/updating).

  </Accordion>

  <Accordion title="Làm thế nào để cài đặt OpenClaw trên VPS?">
    Bất kỳ VPS Linux nào cũng hoạt động. Cài đặt trên máy chủ, sau đó sử dụng SSH/Tailscale để truy cập Gateway.

    Hướng dẫn: [exe.dev](/install/exe-dev), [Hetzner](/install/hetzner), [Fly.io](/install/fly).
    Truy cập từ xa: [Gateway remote](/gateway/remote).

  </Accordion>

  <Accordion title="Các hướng dẫn cài đặt cloud/VPS ở đâu?">
    Chúng tôi giữ một **trung tâm lưu trữ** với các nhà cung cấp phổ biến. Chọn một và làm theo hướng dẫn:

    - [VPS hosting](/vps) (tất cả các nhà cung cấp ở một nơi)
    - [Fly.io](/install/fly)
    - [Hetzner](/install/hetzner)
    - [exe.dev](/install/exe-dev)

    Cách hoạt động trên cloud: **Gateway chạy trên máy chủ**, và bạn truy cập nó
    từ laptop/điện thoại của bạn qua Control UI (hoặc Tailscale/SSH). Trạng thái + workspace của bạn
    sống trên máy chủ, vì vậy hãy coi máy chủ là nguồn gốc và sao lưu nó.

    Bạn có thể ghép nối **nodes** (Mac/iOS/Android/headless) với Gateway trên cloud để truy cập
    màn hình/camera/canvas cục bộ hoặc chạy lệnh trên laptop của bạn trong khi giữ
    Gateway trên cloud.

    Trung tâm: [Platforms](/platforms). Truy cập từ xa: [Gateway remote](/gateway/remote).
    Nodes: [Nodes](/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Tôi có thể yêu cầu OpenClaw tự cập nhật không?">
    Câu trả lời ngắn: **có thể, nhưng không khuyến nghị**. Quy trình cập nhật có thể khởi động lại
    Gateway (dẫn đến mất phiên hoạt động), có thể cần một git checkout sạch, và
    có thể yêu cầu xác nhận. An toàn hơn: chạy cập nhật từ shell với tư cách là người vận hành.

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

    Tài liệu: [Update](/cli/update), [Updating](/install/updating).

  </Accordion>

  <Accordion title="Onboarding thực sự làm gì?">
    `openclaw onboard` là con đường thiết lập được khuyến nghị. Trong **chế độ cục bộ**, nó hướng dẫn bạn qua:

    - **Thiết lập mô hình/xác thực** (hỗ trợ các luồng OAuth/setup-token của provider và API keys, cùng với các tùy chọn mô hình cục bộ như LM Studio)
    - Vị trí **Workspace** + file bootstrap
    - **Cài đặt Gateway** (bind/port/auth/tailscale)
    - **Providers** (WhatsApp, Telegram, Discord, Mattermost (plugin), Signal, iMessage)
    - **Cài đặt Daemon** (LaunchAgent trên macOS; systemd user unit trên Linux/WSL2)
    - **Kiểm tra sức khỏe** và lựa chọn **skills**

    Nó cũng cảnh báo nếu mô hình bạn cấu hình không xác định hoặc thiếu xác thực.

  </Accordion>

  <Accordion title="Tôi có cần đăng ký Claude hoặc OpenAI để chạy cái này không?">
    Không. Bạn có thể chạy OpenClaw với **API keys** (Anthropic/OpenAI/khác) hoặc với
    **mô hình chỉ cục bộ** để dữ liệu của bạn ở lại trên thiết bị của bạn. Đăng ký (Claude
    Pro/Max hoặc OpenAI Codex) là các cách tùy chọn để xác thực các provider đó.

    Nếu bạn chọn xác thực đăng ký Anthropic, tự quyết định xem có sử dụng nó không:
    Anthropic đã chặn một số sử dụng đăng ký ngoài Claude Code trong quá khứ.
    OpenAI Codex OAuth được hỗ trợ rõ ràng cho các công cụ bên ngoài như OpenClaw.

    Tài liệu: [Anthropic](/providers/anthropic), [OpenAI](/providers/openai),
    [Local models](/gateway/local-models), [Models](/concepts/models).

  </Accordion>

  <Accordion title="Tôi có thể sử dụng đăng ký Claude Max mà không cần API key không?">
    Có. Bạn có thể xác thực bằng **setup-token**
    thay vì API key. Đây là con đường đăng ký.

    Đăng ký Claude Pro/Max **không bao gồm API key**, vì vậy đây là
    con đường kỹ thuật cho các tài khoản đăng ký. Nhưng đây là quyết định của bạn: Anthropic
    đã chặn một số sử dụng đăng ký ngoài Claude Code trong quá khứ.
    Nếu bạn muốn con đường rõ ràng và an toàn nhất cho sản xuất, sử dụng một Anthropic API key.

  </Accordion>

  <Accordion title="Xác thực setup-token của Anthropic hoạt động như thế nào?">
    `claude setup-token` tạo ra một **chuỗi token** thông qua Claude Code CLI (nó không có sẵn trong web console). Bạn có thể chạy nó trên **bất kỳ máy nào**. Chọn **Anthropic token (paste setup-token)** trong onboarding hoặc dán nó với `openclaw models auth paste-token --provider anthropic`. Token được lưu trữ dưới dạng hồ sơ xác thực cho provider **anthropic** và được sử dụng như một API key (không tự động làm mới). Chi tiết thêm: [OAuth](/concepts/oauth).
  </Accordion>

  <Accordion title="Tôi tìm setup-token của Anthropic ở đâu?">
    Nó **không** có trong Anthropic Console. Setup-token được tạo ra bởi **Claude Code CLI** trên **bất kỳ máy nào**:

    ```bash
    claude setup-token
    ```

    Sao chép token mà nó in ra, sau đó chọn **Anthropic token (paste setup-token)** trong onboarding. Nếu bạn muốn chạy nó trên máy chủ gateway, sử dụng `openclaw models auth setup-token --provider anthropic`. Nếu bạn đã chạy `claude setup-token` ở nơi khác, dán nó trên máy chủ gateway với `openclaw models auth paste-token --provider anthropic`. Xem [Anthropic](/providers/anthropic).

  </Accordion>

  <Accordion title="Bạn có hỗ trợ xác thực đăng ký Claude (Claude Pro hoặc Max) không?">
    Có - thông qua **setup-token**. OpenClaw không còn tái sử dụng các token OAuth của Claude Code CLI; sử dụng setup-token hoặc một Anthropic API key. Tạo token ở bất kỳ đâu và dán nó trên máy chủ gateway. Xem [Anthropic](/providers/anthropic) và [OAuth](/concepts/oauth).

    Quan trọng: đây là khả năng tương thích kỹ thuật, không phải là đảm bảo chính sách. Anthropic
    đã chặn một số sử dụng đăng ký ngoài Claude Code trong quá khứ.
    Bạn cần quyết định xem có sử dụng nó không và xác minh các điều khoản hiện tại của Anthropic.
    Đối với sản xuất hoặc khối lượng công việc nhiều người dùng, xác thực API key của Anthropic là lựa chọn an toàn và được khuyến nghị.

  </Accordion>

  <Accordion title="Tại sao tôi thấy HTTP 429 rate_limit_error từ Anthropic?">
    Điều đó có nghĩa là **hạn ngạch/tốc độ giới hạn của Anthropic** của bạn đã hết cho cửa sổ hiện tại. Nếu bạn
    sử dụng một **đăng ký Claude** (setup-token), chờ cửa sổ
    đặt lại hoặc nâng cấp gói của bạn. Nếu bạn sử dụng một **Anthropic API key**, kiểm tra Anthropic Console
    để biết sử dụng/thanh toán và tăng giới hạn khi cần.

    Nếu thông báo cụ thể là:
    `Extra usage is required for long context requests`, yêu cầu đang cố gắng sử dụng
    Anthropic's 1M context beta (`context1m: true`). Điều đó chỉ hoạt động khi thông tin xác thực của bạn đủ điều kiện cho thanh toán long-context (API key billing hoặc đăng ký
    với Extra Usage được bật).

    Mẹo: đặt một **mô hình dự phòng** để OpenClaw có thể tiếp tục trả lời trong khi một provider bị giới hạn tốc độ.
    Xem [Models](/cli/models), [OAuth](/concepts/oauth), và
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock có được hỗ trợ không?">
    Có - thông qua provider **Amazon Bedrock (Converse)** của pi-ai với **cấu hình thủ công**. Bạn phải cung cấp thông tin xác thực AWS/khu vực trên máy chủ gateway và thêm một mục provider Bedrock trong cấu hình mô hình của bạn. Xem [Amazon Bedrock](/providers/bedrock) và [Model providers](/providers/models). Nếu bạn thích một luồng khóa quản lý, một proxy tương thích OpenAI trước Bedrock vẫn là một lựa chọn hợp lệ.
  </Accordion>

  <Accordion title="Xác thực Codex hoạt động như thế nào?">
    OpenClaw hỗ trợ **OpenAI Code (Codex)** thông qua OAuth (đăng nhập ChatGPT). Onboarding có thể chạy luồng OAuth và sẽ đặt mô hình mặc định thành `openai-codex/gpt-5.4` khi thích hợp. Xem [Model providers](/concepts/model-providers) và [Onboarding (CLI)](/start/wizard).
  </Accordion>

  <Accordion title="Bạn có hỗ trợ xác thực đăng ký OpenAI (Codex OAuth) không?">
    Có. OpenClaw hoàn toàn hỗ trợ **OpenAI Code (Codex) subscription OAuth**.
    OpenAI cho phép rõ ràng việc sử dụng subscription OAuth trong các công cụ/quy trình làm việc bên ngoài
    như OpenClaw. Onboarding có thể chạy luồng OAuth cho bạn.

    Xem [OAuth](/concepts/oauth), [Model providers](/concepts/model-providers), và [Onboarding (CLI)](/start/wizard).

  </Accordion>

  <Accordion title="Làm thế nào để thiết lập Gemini CLI OAuth?">
    Gemini CLI sử dụng một **luồng xác thực plugin**, không phải một client id hoặc secret trong `openclaw.json`.

    Các bước:

    1. Kích hoạt plugin: `openclaw plugins enable google`
    2. Đăng nhập: `openclaw models auth login --provider google-gemini-cli --set-default`

    Điều này lưu trữ các token OAuth trong hồ sơ xác thực trên máy chủ gateway. Chi tiết: [Model providers](/concepts/model-providers).

  </Accordion>

  <Accordion title="Mô hình cục bộ có ổn cho các cuộc trò chuyện thông thường không?">
    Thường thì không. OpenClaw cần ngữ cảnh lớn + an toàn mạnh; các thẻ nhỏ cắt ngắn và rò rỉ. Nếu bạn phải, chạy bản dựng **lớn nhất** MiniMax M2.5 mà bạn có thể cục bộ (LM Studio) và xem [/gateway/local-models](/gateway/local-models). Các mô hình nhỏ hơn/được lượng hóa tăng nguy cơ tiêm nhiễm prompt - xem [Security](/gateway/security).
  </Accordion>

  <Accordion title="Làm thế nào để giữ lưu lượng mô hình được lưu trữ trong một khu vực cụ thể?">
    Chọn các điểm cuối được ghim theo khu vực. OpenRouter cung cấp các tùy chọn lưu trữ tại Mỹ cho MiniMax, Kimi, và GLM; chọn biến thể lưu trữ tại Mỹ để giữ dữ liệu trong khu vực. Bạn vẫn có thể liệt kê Anthropic/OpenAI cùng với những cái này bằng cách sử dụng `models.mode: "merge"` để các dự phòng vẫn có sẵn trong khi tôn trọng provider theo khu vực bạn chọn.
  </Accordion>

  <Accordion title="Tôi có phải mua một Mac Mini để cài đặt cái này không?">
    Không. OpenClaw chạy trên macOS hoặc Linux (Windows qua WSL2). Một Mac mini là tùy chọn - một số người
    mua một cái như một máy chủ luôn bật, nhưng một VPS nhỏ, máy chủ tại nhà, hoặc hộp Raspberry Pi-class cũng hoạt động.

    Bạn chỉ cần một Mac **cho các công cụ chỉ dành cho macOS**. Đối với iMessage, sử dụng [BlueBubbles](/channels/bluebubbles) (khuyến nghị) - máy chủ BlueBubbles chạy trên bất kỳ Mac nào, và Gateway có thể chạy trên Linux hoặc nơi khác. Nếu bạn muốn các công cụ chỉ dành cho macOS khác, chạy Gateway trên một Mac hoặc ghép nối một node macOS.

    Tài liệu: [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes), [Mac remote mode](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Tôi có cần một Mac mini để hỗ trợ iMessage không?">
    Bạn cần **một thiết bị macOS nào đó** đã đăng nhập vào Messages. Nó **không** phải là một Mac mini -
    bất kỳ Mac nào cũng được. **Sử dụng [BlueBubbles](/channels/bluebubbles)** (khuyến nghị) cho iMessage - máy chủ BlueBubbles chạy trên macOS, trong khi Gateway có thể chạy trên Linux hoặc nơi khác.

    Các thiết lập phổ biến:

    - Chạy Gateway trên Linux/VPS, và chạy máy chủ BlueBubbles trên bất kỳ Mac nào đã đăng nhập vào Messages.
    - Chạy mọi thứ trên Mac nếu bạn muốn thiết lập đơn giản nhất trên một máy.

    Tài liệu: [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes),
    [Mac remote mode](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Nếu tôi mua một Mac mini để chạy OpenClaw, tôi có thể kết nối nó với MacBook Pro của mình không?">
    Có. **Mac mini có thể chạy Gateway**, và MacBook Pro của bạn có thể kết nối như một
    **node** (thiết bị đồng hành). Nodes không chạy Gateway - chúng cung cấp các khả năng bổ sung như màn hình/camera/canvas và `system.run` trên thiết bị đó.

    Mẫu phổ biến:

    - Gateway trên Mac mini (luôn bật).
    - MacBook Pro chạy ứng dụng macOS hoặc một node host và ghép nối với Gateway.
    - Sử dụng `openclaw nodes status` / `openclaw nodes list` để xem nó.

    Tài liệu: [Nodes](/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Tôi có thể sử dụng Bun không?">
    Bun **không được khuyến nghị**. Chúng tôi thấy các lỗi runtime, đặc biệt với WhatsApp và Telegram.
    Sử dụng **Node** cho các gateways ổn định.

    Nếu bạn vẫn muốn thử nghiệm với Bun, hãy làm điều đó trên một gateway không phải sản xuất
    mà không có WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: cái gì đi vào allowFrom?">
    `channels.telegram.allowFrom` là **ID người dùng Telegram của người gửi** (số). Nó không phải là tên người dùng bot.

    Onboarding chấp nhận đầu vào `@username` và chuyển đổi nó thành một ID số, nhưng xác thực OpenClaw chỉ sử dụng ID số.

    An toàn hơn (không có bot bên thứ ba):

    - DM bot của bạn, sau đó chạy `openclaw logs --follow` và đọc `from.id`.

    API Bot chính thức:

    - DM bot của bạn, sau đó gọi `https://api.telegram.org/bot<bot_token>/getUpdates` và đọc `message.from.id`.

    Bên thứ ba (ít riêng tư hơn):

    - DM `@userinfobot` hoặc `@getidsbot`.

    Xem [/channels/telegram](/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Nhiều người có thể sử dụng một số WhatsApp với các instance OpenClaw khác nhau không?">
    Có, thông qua **multi-agent routing**. Liên kết mỗi DM **người gửi** WhatsApp (peer `kind: "direct"`, người gửi E.164 như `+15551234567`) với một `agentId` khác nhau, để mỗi người có workspace và kho lưu trữ phiên riêng. Phản hồi vẫn đến từ **cùng một tài khoản WhatsApp**, và kiểm soát truy cập DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) là toàn cầu cho mỗi tài khoản WhatsApp. Xem [Multi-Agent Routing](/concepts/multi-agent) và [WhatsApp](/channels/whatsapp).
  </Accordion>

  <Accordion title='Tôi có thể chạy một agent "fast chat" và một agent "Opus for coding" không?'>
    Có. Sử dụng multi-agent routing: cung cấp cho mỗi agent mô hình mặc định riêng, sau đó liên kết các tuyến inbound (tài khoản provider hoặc peers cụ thể) với mỗi agent. Cấu hình ví dụ nằm trong [Multi-Agent Routing](/concepts/multi-agent). Xem thêm [Models](/concepts/models) và [Configuration](/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew có hoạt động trên Linux không?">
    Có. Homebrew hỗ trợ Linux (Linuxbrew). Thiết lập nhanh:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Nếu bạn chạy OpenClaw qua systemd, đảm bảo PATH dịch vụ bao gồm `/home/linuxbrew/.linuxbrew/bin` (hoặc prefix brew của bạn) để các công cụ cài đặt qua `brew` được giải quyết trong các shell không đăng nhập.
    Các bản dựng gần đây cũng thêm các thư mục bin người dùng phổ biến trên các dịch vụ systemd Linux (ví dụ `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) và tôn trọng `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, và `FNM_DIR` khi được thiết lập.

  </Accordion>

  <Accordion title="Sự khác biệt giữa cài đặt hackable git và npm install">
    - **Cài đặt hackable (git):** toàn bộ source checkout, có thể chỉnh sửa, tốt nhất cho người đóng góp.
      Bạn chạy các bản dựng cục bộ và có thể vá mã/tài liệu.
    - **npm install:** cài đặt CLI toàn cầu, không có repo, tốt nhất cho "chỉ cần chạy nó."
      Cập nhật đến từ npm dist-tags.

    Tài liệu: [Getting started](/start/getting-started), [Updating](/install/updating).

  </Accordion>

  <Accordion title="Tôi có thể chuyển đổi giữa cài đặt npm và git sau này không?">
    Có. Cài đặt hương vị khác, sau đó chạy Doctor để dịch vụ gateway chỉ vào điểm đầu vào mới.
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

    Doctor phát hiện sự không khớp điểm đầu vào dịch vụ gateway và đề nghị viết lại cấu hình dịch vụ để khớp với cài đặt hiện tại (sử dụng `--repair` trong tự động hóa).

    Mẹo sao lưu: xem [Backup strategy](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Tôi nên chạy Gateway trên laptop hay VPS?">
    Câu trả lời ngắn: **nếu bạn muốn độ tin cậy 24/7, sử dụng VPS**. Nếu bạn muốn
    ít ma sát nhất và bạn ổn với việc ngủ/khởi động lại, chạy nó cục bộ.

    **Laptop (Gateway cục bộ)**

    - **Ưu điểm:** không tốn chi phí máy chủ, truy cập trực tiếp vào file cục bộ, cửa sổ trình duyệt trực tiếp.
    - **Nhược điểm:** ngủ/mất kết nối mạng = ngắt kết nối, cập nhật/hệ điều hành khởi động lại gián đoạn, phải luôn thức.

    **VPS / cloud**

    - **Ưu điểm:** luôn bật, mạng ổn định, không có vấn đề ngủ laptop, dễ dàng giữ cho nó chạy.
    - **Nhược điểm:** thường chạy headless (sử dụng ảnh chụp màn hình), chỉ truy cập file từ xa, bạn phải SSH để cập nhật.

    **Lưu ý cụ thể của OpenClaw:** WhatsApp/Telegram/Slack/Mattermost (plugin)/Discord đều hoạt động tốt từ VPS. Sự khác biệt thực sự duy nhất là **trình duyệt headless** so với một cửa sổ có thể nhìn thấy. Xem [Browser](/tools/browser).

    **Mặc định khuyến nghị:** VPS nếu bạn đã gặp ngắt kết nối gateway trước đó. Cục bộ là tuyệt vời khi bạn đang sử dụng Mac tích cực và muốn truy cập file cục bộ hoặc tự động hóa UI với một trình duyệt có thể nhìn thấy.

  </Accordion>

  <Accordion title="Chạy OpenClaw trên một máy chuyên dụng quan trọng đến mức nào?">
    Không bắt buộc, nhưng **khuyến nghị cho độ tin cậy và cách ly**.

    - **Máy chủ chuyên dụng (VPS/Mac mini/Pi):** luôn bật, ít gián đoạn ngủ/khởi động lại, quyền sạch hơn, dễ dàng giữ cho nó chạy.
    - **Laptop/desktop chia sẻ:** hoàn toàn ổn cho thử nghiệm và sử dụng tích cực, nhưng mong đợi tạm dừng khi máy ngủ hoặc cập nhật.

    Nếu bạn muốn có cả hai thế giới, giữ Gateway trên một máy chủ chuyên dụng và ghép nối laptop của bạn như một **node** cho các công cụ màn hình/camera/exec cục bộ. Xem [Nodes](/nodes).
    Để biết hướng dẫn bảo mật, đọc [Security](/gateway/security).

  </Accordion>

  <Accordion title="Yêu cầu tối thiểu của VPS và hệ điều hành được khuyến nghị là gì?">
    OpenClaw nhẹ. Đối với một Gateway cơ bản + một kênh chat:

    - **Tối thiểu tuyệt đối:** 1 vCPU, 1GB RAM, ~500MB đĩa.
    - **Khuyến nghị:** 1-2 vCPU, 2GB RAM hoặc nhiều hơn để có không gian (logs, media, nhiều kênh). Các công cụ Node và tự động hóa trình duyệt có thể tiêu tốn tài nguyên.

    Hệ điều hành: sử dụng **Ubuntu LTS** (hoặc bất kỳ Debian/Ubuntu hiện đại nào). Đường dẫn cài đặt Linux được thử nghiệm tốt nhất ở đó.

    Tài liệu: [Linux](/platforms/linux), [VPS hosting](/vps).

  </Accordion>

  <Accordion title="Tôi có thể chạy OpenClaw trong một VM và yêu cầu là gì?">
    Có. Đối xử với một VM giống như một VPS: nó cần luôn bật, có thể truy cập, và có đủ
    RAM cho Gateway và bất kỳ kênh nào bạn kích hoạt.

    Hướng dẫn cơ bản:

    - **Tối thiểu tuyệt đối:** 1 vCPU, 1GB RAM.
    - **Khuyến nghị:** 2GB RAM hoặc nhiều hơn nếu bạn chạy nhiều kênh, tự động hóa trình duyệt, hoặc công cụ media.
    - **Hệ điều hành:** Ubuntu LTS hoặc một Debian/Ubuntu hiện đại khác.

    Nếu bạn đang sử dụng Windows, **WSL2 là thiết lập kiểu VM dễ nhất** và có công cụ
    tương thích tốt nhất. Xem [Windows](/platforms/windows), [VPS hosting](/vps).
    Nếu bạn đang chạy macOS trong một VM, xem [macOS VM](/install/macos-vm).

  </Accordion>
</AccordionGroup>

## OpenClaw là gì?

<AccordionGroup>
  <Accordion title="OpenClaw là gì, trong một đoạn văn?">
    OpenClaw là một trợ lý AI cá nhân bạn chạy trên các thiết bị của riêng bạn. Nó trả lời trên các nền tảng nhắn tin bạn đã sử dụng (WhatsApp, Telegram, Slack, Mattermost (plugin), Discord, Google Chat, Signal, iMessage, WebChat) và cũng có thể thực hiện giọng nói + Canvas trực tiếp trên các nền tảng được hỗ trợ. **Gateway** là mặt phẳng điều khiển luôn bật; trợ lý là sản phẩm.
  </Accordion>

  <Accordion title="Giá trị đề xuất">
    OpenClaw không chỉ là "một lớp bọc Claude." Nó là một **mặt phẳng điều khiển ưu tiên cục bộ** cho phép bạn chạy một
    trợ lý mạnh mẽ trên **phần cứng của riêng bạn**, có thể truy cập từ các ứng dụng chat bạn đã sử dụng, với
    các phiên có trạng thái, bộ nhớ và công cụ - mà không cần giao quyền kiểm soát quy trình làm việc của bạn cho một SaaS được lưu trữ.

    Điểm nổi bật:

    - **Thiết bị của bạn, dữ liệu của bạn:** chạy Gateway ở bất kỳ đâu bạn muốn (Mac, Linux, VPS) và giữ
      workspace + lịch sử phiên cục bộ.
    - **Kênh thực, không phải sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      cộng với giọng nói di động và Canvas trên các nền tảng được hỗ trợ.
    - **Không phụ thuộc mô hình:** sử dụng Anthropic, OpenAI, MiniMax, OpenRouter, v.v., với định tuyến
      và chuyển đổi dự phòng theo agent.
    - **Tùy chọn chỉ cục bộ:** chạy các mô hình cục bộ để **tất cả dữ liệu có thể ở lại trên thiết bị của bạn** nếu bạn muốn.
    - **Định tuyến multi-agent:** tách các agent theo kênh, tài khoản, hoặc nhiệm vụ, mỗi cái có workspace và mặc định riêng.
    - **Mã nguồn mở và có thể hack:** kiểm tra, mở rộng, và tự lưu trữ mà không bị khóa nhà cung cấp.

    Tài liệu: [Gateway](/gateway), [Channels](/channels), [Multi-agent](/concepts/multi-agent),
    [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="Tôi vừa thiết lập nó - tôi nên làm gì đầu tiên?">
    Dự án đầu tiên tốt:

    - Xây dựng một trang web (WordPress, Shopify, hoặc một trang tĩnh đơn giản).
    - Tạo mẫu một ứng dụng di động (phác thảo, màn hình, kế hoạch API).
    - Tổ chức file và thư mục (dọn dẹp, đặt tên, gắn thẻ).
    - Kết nối Gmail và tự động hóa tóm tắt hoặc theo dõi.

    Nó có thể xử lý các nhiệm vụ lớn, nhưng nó hoạt động tốt nhất khi bạn chia chúng thành các giai đoạn và
    sử dụng các sub agent cho công việc song song.

  </Accordion>

  <Accordion title="Năm trường hợp sử dụng hàng ngày hàng đầu cho OpenClaw là gì?">
    Những chiến thắng hàng ngày thường trông như:

    - **Tóm tắt cá nhân:** tóm tắt hộp thư đến, lịch, và tin tức bạn quan tâm.
    - **Nghiên cứu và soạn thảo:** nghiên cứu nhanh, tóm tắt, và bản thảo đầu tiên cho email hoặc tài liệu.
    - **Nhắc nhở và theo dõi:** nhắc nhở và danh sách kiểm tra dựa trên cron hoặc heartbeat.
    - **Tự động hóa trình duyệt:** điền vào biểu mẫu, thu thập dữ liệu, và lặp lại các nhiệm vụ web.
    - **Phối hợp thiết bị chéo:** gửi một nhiệm vụ từ điện thoại của bạn, để Gateway chạy nó trên máy chủ, và nhận kết quả trở lại trong chat.

  </Accordion>

  <Accordion title="OpenClaw có thể giúp gì với lead gen, tiếp cận, quảng cáo, và blog cho một SaaS không?">
    Có cho **nghiên cứu, đủ điều kiện, và soạn thảo**. Nó có thể quét các trang web, xây dựng danh sách ngắn,
    tóm tắt khách hàng tiềm năng, và viết bản thảo tiếp cận hoặc quảng cáo.

    Đối với **tiếp cận hoặc chạy quảng cáo**, giữ một người trong vòng lặp. Tránh spam, tuân thủ luật pháp địa phương và
    chính sách nền tảng, và xem xét mọi thứ trước khi gửi. Mẫu an toàn nhất là để
    OpenClaw soạn thảo và bạn phê duyệt.

    Tài liệu: [Security](/gateway/security).

  </Accordion>

  <Accordion title="Lợi thế so với Claude Code cho phát triển web là gì?">
    OpenClaw là một **trợ lý cá nhân** và lớp điều phối, không phải là một thay thế IDE. Sử dụng
    Claude Code hoặc Codex cho vòng lặp mã hóa trực tiếp nhanh nhất trong một repo. Sử dụng OpenClaw khi bạn
    muốn bộ nhớ bền vững, truy cập đa thiết bị, và điều phối công cụ.

    Lợi thế:

    - **Bộ nhớ + workspace bền vững** qua các phiên
    - **Truy cập đa nền tảng** (WhatsApp, Telegram, TUI, WebChat)
    - **Điều phối công cụ** (trình duyệt, file, lập lịch, hooks)
    - **Gateway luôn bật** (chạy trên VPS, tương tác từ bất kỳ đâu)
    - **Nodes** cho trình duyệt/màn hình/camera/exec cục bộ

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Kỹ năng và tự động hóa

<AccordionGroup>
  <Accordion title="Làm thế nào để tùy chỉnh kỹ năng mà không làm bẩn repo?">
    Sử dụng managed overrides thay vì chỉnh sửa bản sao của repo. Đặt các thay đổi vào `~/.openclaw/skills/<name>/SKILL.md` (hoặc thêm thư mục qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json`). Thứ tự ưu tiên là `<workspace>/skills` > `~/.openclaw/skills` > bundled, vì vậy managed overrides sẽ được ưu tiên mà không cần chạm vào git. Chỉ những chỉnh sửa đáng giá upstream mới nên tồn tại trong repo và được gửi đi dưới dạng PR.
  </Accordion>

  <Accordion title="Tôi có thể tải kỹ năng từ thư mục tùy chỉnh không?">
    Có. Thêm các thư mục bổ sung qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json` (ưu tiên thấp nhất). Thứ tự ưu tiên mặc định vẫn là: `<workspace>/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` cài đặt vào `./skills` theo mặc định, mà OpenClaw coi là `<workspace>/skills` trong phiên tiếp theo.
  </Accordion>

  <Accordion title="Làm thế nào để sử dụng các mô hình khác nhau cho các nhiệm vụ khác nhau?">
    Hiện tại các mẫu hỗ trợ là:

    - **Cron jobs**: các công việc độc lập có thể đặt một `model` override cho mỗi công việc.
    - **Sub-agents**: định tuyến nhiệm vụ đến các agent riêng biệt với các mô hình mặc định khác nhau.
    - **Chuyển đổi theo yêu cầu**: sử dụng `/model` để chuyển đổi mô hình phiên hiện tại bất cứ lúc nào.

    Xem [Cron jobs](/automation/cron-jobs), [Multi-Agent Routing](/concepts/multi-agent), và [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot bị treo khi thực hiện công việc nặng. Làm thế nào để giảm tải điều đó?">
    Sử dụng **sub-agents** cho các nhiệm vụ dài hoặc song song. Sub-agents chạy trong phiên riêng của chúng, trả về một bản tóm tắt và giữ cho cuộc trò chuyện chính của bạn luôn phản hồi.

    Yêu cầu bot "spawn a sub-agent for this task" hoặc sử dụng `/subagents`.
    Sử dụng `/status` trong chat để xem Gateway đang làm gì ngay bây giờ (và liệu nó có bận không).

    Mẹo về token: các nhiệm vụ dài và sub-agents đều tiêu thụ token. Nếu chi phí là một mối quan tâm, hãy đặt một mô hình rẻ hơn cho sub-agents qua `agents.defaults.subagents.model`.

    Tài liệu: [Sub-agents](/tools/subagents).

  </Accordion>

  <Accordion title="Các phiên subagent ràng buộc theo thread hoạt động như thế nào trên Discord?">
    Sử dụng thread bindings. Bạn có thể ràng buộc một thread Discord vào một subagent hoặc mục tiêu phiên để các tin nhắn tiếp theo trong thread đó duy trì trên phiên đã ràng buộc.

    Quy trình cơ bản:

    - Spawn với `sessions_spawn` sử dụng `thread: true` (và tùy chọn `mode: "session"` cho theo dõi liên tục).
    - Hoặc ràng buộc thủ công với `/focus <target>`.
    - Sử dụng `/agents` để kiểm tra trạng thái ràng buộc.
    - Sử dụng `/session idle <duration|off>` và `/session max-age <duration|off>` để kiểm soát tự động unfocus.
    - Sử dụng `/unfocus` để tách thread.

    Cấu hình yêu cầu:

    - Mặc định toàn cầu: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Ghi đè Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Tự động ràng buộc khi spawn: đặt `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Tài liệu: [Sub-agents](/tools/subagents), [Discord](/channels/discord), [Configuration Reference](/gateway/configuration-reference), [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title="Cron hoặc nhắc nhở không hoạt động. Tôi nên kiểm tra gì?">
    Cron chạy bên trong quá trình Gateway. Nếu Gateway không chạy liên tục, các công việc đã lên lịch sẽ không chạy.

    Danh sách kiểm tra:

    - Xác nhận cron được bật (`cron.enabled`) và `OPENCLAW_SKIP_CRON` không được đặt.
    - Kiểm tra Gateway đang chạy 24/7 (không ngủ/khởi động lại).
    - Xác minh cài đặt múi giờ cho công việc (`--tz` so với múi giờ máy chủ).

    Gỡ lỗi:

    ```bash
    openclaw cron run <jobId> --force
    openclaw cron runs --id <jobId> --limit 50
    ```

    Tài liệu: [Cron jobs](/automation/cron-jobs), [Cron vs Heartbeat](/automation/cron-vs-heartbeat).

  </Accordion>

  <Accordion title="Làm thế nào để cài đặt kỹ năng trên Linux?">
    Sử dụng **ClawHub** (CLI) hoặc thả kỹ năng vào workspace của bạn. Giao diện người dùng Skills trên macOS không có sẵn trên Linux.
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
    - **Isolated jobs** cho các agent tự động đăng tóm tắt hoặc gửi đến các cuộc trò chuyện.

    Tài liệu: [Cron jobs](/automation/cron-jobs), [Cron vs Heartbeat](/automation/cron-vs-heartbeat),
    [Heartbeat](/gateway/heartbeat).

  </Accordion>

  <Accordion title="Tôi có thể chạy các kỹ năng chỉ dành cho macOS từ Linux không?">
    Không trực tiếp. Các kỹ năng macOS bị giới hạn bởi `metadata.openclaw.os` cùng với các binary cần thiết, và các kỹ năng chỉ xuất hiện trong prompt hệ thống khi chúng đủ điều kiện trên **Gateway host**. Trên Linux, các kỹ năng chỉ dành cho `darwin` (như `apple-notes`, `apple-reminders`, `things-mac`) sẽ không tải trừ khi bạn ghi đè giới hạn.

    Bạn có ba mẫu hỗ trợ:

    **Tùy chọn A - chạy Gateway trên Mac (đơn giản nhất).**
    Chạy Gateway nơi các binary macOS tồn tại, sau đó kết nối từ Linux trong [remote mode](#gateway-ports-already-running-and-remote-mode) hoặc qua Tailscale. Các kỹ năng tải bình thường vì Gateway host là macOS.

    **Tùy chọn B - sử dụng một node macOS (không SSH).**
    Chạy Gateway trên Linux, ghép nối một node macOS (ứng dụng menubar), và đặt **Node Run Commands** thành "Always Ask" hoặc "Always Allow" trên Mac. OpenClaw có thể coi các kỹ năng chỉ dành cho macOS là đủ điều kiện khi các binary cần thiết tồn tại trên node. Agent chạy các kỹ năng đó qua công cụ `nodes`. Nếu bạn chọn "Always Ask", việc phê duyệt "Always Allow" trong prompt sẽ thêm lệnh đó vào danh sách cho phép.

    **Tùy chọn C - proxy các binary macOS qua SSH (nâng cao).**
    Giữ Gateway trên Linux, nhưng làm cho các binary CLI cần thiết giải quyết thành các wrapper SSH chạy trên Mac. Sau đó ghi đè kỹ năng để cho phép Linux để nó vẫn đủ điều kiện.

    1. Tạo một wrapper SSH cho binary (ví dụ: `memo` cho Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Đặt wrapper trên `PATH` trên host Linux (ví dụ `~/bin/memo`).
    3. Ghi đè metadata kỹ năng (workspace hoặc `~/.openclaw/skills`) để cho phép Linux:

       ```markdown
       ---
       name: apple-notes
       description: Quản lý Apple Notes qua memo CLI trên macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Bắt đầu một phiên mới để snapshot kỹ năng được làm mới.

  </Accordion>

  <Accordion title="Bạn có tích hợp Notion hoặc HeyGen không?">
    Hiện tại chưa có sẵn.

    Các tùy chọn:

    - **Kỹ năng tùy chỉnh / plugin:** tốt nhất cho truy cập API đáng tin cậy (cả Notion và HeyGen đều có API).
    - **Tự động hóa trình duyệt:** hoạt động mà không cần mã nhưng chậm hơn và dễ bị lỗi hơn.

    Nếu bạn muốn giữ ngữ cảnh cho mỗi khách hàng (quy trình làm việc của agency), một mẫu đơn giản là:

    - Một trang Notion cho mỗi khách hàng (ngữ cảnh + sở thích + công việc đang hoạt động).
    - Yêu cầu agent lấy trang đó khi bắt đầu một phiên.

    Nếu bạn muốn tích hợp gốc, mở một yêu cầu tính năng hoặc xây dựng một kỹ năng nhắm mục tiêu vào các API đó.

    Cài đặt kỹ năng:

    ```bash
    clawhub install <skill-slug>
    clawhub update --all
    ```

    ClawHub cài đặt vào `./skills` dưới thư mục hiện tại của bạn (hoặc quay lại workspace OpenClaw đã cấu hình); OpenClaw coi đó là `<workspace>/skills` trong phiên tiếp theo. Để chia sẻ kỹ năng giữa các agent, đặt chúng vào `~/.openclaw/skills/<name>/SKILL.md`. Một số kỹ năng yêu cầu các binary được cài đặt qua Homebrew; trên Linux điều đó có nghĩa là Linuxbrew (xem mục FAQ Homebrew Linux ở trên). Xem [Skills](/tools/skills) và [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="Làm thế nào để sử dụng Chrome đã đăng nhập sẵn với OpenClaw?">
    Sử dụng hồ sơ trình duyệt `user` tích hợp sẵn, kết nối qua Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Nếu bạn muốn một tên tùy chỉnh, tạo một hồ sơ MCP rõ ràng:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Đường dẫn này là host-local. Nếu Gateway chạy ở nơi khác, hãy chạy một node host trên máy trình duyệt hoặc sử dụng CDP từ xa thay thế.

  </Accordion>
</AccordionGroup>

## Sandboxing và bộ nhớ

<AccordionGroup>
  <Accordion title="Có tài liệu sandboxing riêng không?">
    Có. Xem [Sandboxing](/gateway/sandboxing). Đối với thiết lập Docker cụ thể (gateway đầy đủ trong Docker hoặc sandbox images), xem [Docker](/install/docker).
  </Accordion>

  <Accordion title="Docker cảm thấy bị giới hạn - làm thế nào để kích hoạt đầy đủ tính năng?">
    Hình ảnh mặc định ưu tiên bảo mật và chạy dưới dạng người dùng `node`, vì vậy nó không bao gồm các gói hệ thống, Homebrew, hoặc trình duyệt đi kèm. Để có một thiết lập đầy đủ hơn:

    - Duy trì `/home/node` với `OPENCLAW_HOME_VOLUME` để các bộ nhớ cache tồn tại.
    - Nướng các phụ thuộc hệ thống vào hình ảnh với `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Cài đặt trình duyệt Playwright qua CLI đi kèm:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Đặt `PLAYWRIGHT_BROWSERS_PATH` và đảm bảo đường dẫn được duy trì.

    Tài liệu: [Docker](/install/docker), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Tôi có thể giữ DMs cá nhân nhưng làm cho các nhóm công khai/sandboxed với một agent không?">
    Có - nếu lưu lượng riêng tư của bạn là **DMs** và lưu lượng công khai của bạn là **groups**.

    Sử dụng `agents.defaults.sandbox.mode: "non-main"` để các phiên nhóm/kênh (không phải khóa chính) chạy trong Docker, trong khi phiên DM chính vẫn ở trên host. Sau đó hạn chế những công cụ nào có sẵn trong các phiên sandboxed qua `tools.sandbox.tools`.

    Hướng dẫn thiết lập + cấu hình ví dụ: [Groups: personal DMs + public groups](/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Tham khảo cấu hình chính: [Gateway configuration](/gateway/configuration-reference#agents-defaults-sandbox)

  </Accordion>

  <Accordion title="Làm thế nào để ràng buộc một thư mục host vào sandbox?">
    Đặt `agents.defaults.sandbox.docker.binds` thành `["host:path:mode"]` (ví dụ, `"/home/user/src:/src:ro"`). Các bind toàn cầu + per-agent hợp nhất; các bind per-agent bị bỏ qua khi `scope: "shared"`. Sử dụng `:ro` cho bất kỳ thứ gì nhạy cảm và nhớ rằng các bind bỏ qua các tường lửa hệ thống tệp sandbox. Xem [Sandboxing](/gateway/sandboxing#custom-bind-mounts) và [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) để biết ví dụ và ghi chú an toàn.
  </Accordion>

  <Accordion title="Bộ nhớ hoạt động như thế nào?">
    Bộ nhớ OpenClaw chỉ là các tệp Markdown trong workspace của agent:

    - Ghi chú hàng ngày trong `memory/YYYY-MM-DD.md`
    - Ghi chú dài hạn được chọn lọc trong `MEMORY.md` (chỉ các phiên chính/riêng tư)

    OpenClaw cũng chạy một **silent pre-compaction memory flush** để nhắc mô hình viết các ghi chú bền vững trước khi tự động nén. Điều này chỉ chạy khi workspace có thể ghi (sandbox chỉ đọc bỏ qua nó). Xem [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="Bộ nhớ cứ quên mọi thứ. Làm thế nào để làm cho nó nhớ lâu hơn?">
    Yêu cầu bot **ghi nhớ thông tin vào bộ nhớ**. Ghi chú dài hạn thuộc về `MEMORY.md`, ngữ cảnh ngắn hạn đi vào `memory/YYYY-MM-DD.md`.

    Đây vẫn là một lĩnh vực chúng tôi đang cải thiện. Nó giúp nhắc mô hình lưu trữ ký ức; nó sẽ biết phải làm gì. Nếu nó cứ quên, hãy xác minh Gateway đang sử dụng cùng một workspace trong mỗi lần chạy.

    Tài liệu: [Memory](/concepts/memory), [Agent workspace](/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bộ nhớ có tồn tại mãi mãi không? Giới hạn là gì?">
    Các tệp bộ nhớ tồn tại trên đĩa và tồn tại cho đến khi bạn xóa chúng. Giới hạn là dung lượng lưu trữ của bạn, không phải mô hình. **Ngữ cảnh phiên** vẫn bị giới hạn bởi cửa sổ ngữ cảnh của mô hình, vì vậy các cuộc trò chuyện dài có thể nén hoặc cắt ngắn. Đó là lý do tại sao tìm kiếm bộ nhớ tồn tại - nó chỉ kéo các phần liên quan trở lại ngữ cảnh.

    Tài liệu: [Memory](/concepts/memory), [Context](/concepts/context).

  </Accordion>

  <Accordion title="Tìm kiếm bộ nhớ ngữ nghĩa có yêu cầu khóa API OpenAI không?">
    Chỉ khi bạn sử dụng **OpenAI embeddings**. Codex OAuth bao gồm chat/completions và **không** cấp quyền truy cập embeddings, vì vậy **đăng nhập bằng Codex (OAuth hoặc Codex CLI login)** không giúp ích cho tìm kiếm bộ nhớ ngữ nghĩa. OpenAI embeddings vẫn cần một khóa API thực (`OPENAI_API_KEY` hoặc `models.providers.openai.apiKey`).

    Nếu bạn không đặt một nhà cung cấp rõ ràng, OpenClaw tự động chọn một nhà cung cấp khi nó có thể giải quyết một khóa API (auth profiles, `models.providers.*.apiKey`, hoặc env vars). Nó ưu tiên OpenAI nếu một khóa OpenAI được giải quyết, nếu không thì Gemini nếu một khóa Gemini được giải quyết, sau đó là Voyage, rồi Mistral. Nếu không có khóa từ xa nào có sẵn, tìm kiếm bộ nhớ sẽ bị vô hiệu hóa cho đến khi bạn cấu hình nó. Nếu bạn có một đường dẫn mô hình cục bộ được cấu hình và có mặt, OpenClaw ưu tiên `local`. Ollama được hỗ trợ khi bạn đặt rõ ràng `memorySearch.provider = "ollama"`.

    Nếu bạn muốn giữ cục bộ, đặt `memorySearch.provider = "local"` (và tùy chọn `memorySearch.fallback = "none"`). Nếu bạn muốn Gemini embeddings, đặt `memorySearch.provider = "gemini"` và cung cấp `GEMINI_API_KEY` (hoặc `memorySearch.remote.apiKey`). Chúng tôi hỗ trợ **OpenAI, Gemini, Voyage, Mistral, Ollama, hoặc local** embedding models - xem [Memory](/concepts/memory) để biết chi tiết thiết lập.

  </Accordion>
</AccordionGroup>

## Nơi lưu trữ dữ liệu trên đĩa

<AccordionGroup>
  <Accordion title="Tất cả dữ liệu sử dụng với OpenClaw có được lưu trữ cục bộ không?">
    Không - **trạng thái của OpenClaw là cục bộ**, nhưng **các dịch vụ bên ngoài vẫn thấy những gì bạn gửi cho chúng**.

    - **Cục bộ theo mặc định:** các phiên, tệp bộ nhớ, cấu hình, và workspace sống trên Gateway host
      (`~/.openclaw` + thư mục workspace của bạn).
    - **Từ xa khi cần thiết:** các tin nhắn bạn gửi đến các nhà cung cấp mô hình (Anthropic/OpenAI/etc.) đi đến
      API của họ, và các nền tảng chat (WhatsApp/Telegram/Slack/etc.) lưu trữ dữ liệu tin nhắn trên máy chủ của họ.
    - **Bạn kiểm soát dấu chân:** sử dụng các mô hình cục bộ giữ các prompt trên máy của bạn, nhưng lưu lượng kênh
      vẫn đi qua máy chủ của kênh.

    Liên quan: [Agent workspace](/concepts/agent-workspace), [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw lưu trữ dữ liệu của nó ở đâu?">
    Mọi thứ sống dưới `$OPENCLAW_STATE_DIR` (mặc định: `~/.openclaw`):

    | Đường dẫn                                                      | Mục đích                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Cấu hình chính (JSON5)                                             |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Nhập OAuth cũ (sao chép vào hồ sơ xác thực khi sử dụng lần đầu)    |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Hồ sơ xác thực (OAuth, API keys, và tùy chọn `keyRef`/`tokenRef`)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Tệp tải bí mật dựa trên tệp tùy chọn cho các nhà cung cấp SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Tệp tương thích cũ (các mục `api_key` tĩnh đã được xóa)           |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Trạng thái nhà cung cấp (ví dụ `whatsapp/<accountId>/creds.json`)  |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Trạng thái per-agent (agentDir + sessions)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Lịch sử & trạng thái cuộc trò chuyện (per agent)                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadata phiên (per agent)                                         |

    Đường dẫn single-agent cũ: `~/.openclaw/agent/*` (được di chuyển bởi `openclaw doctor`).

    **Workspace** của bạn (AGENTS.md, tệp bộ nhớ, kỹ năng, v.v.) là riêng biệt và được cấu hình qua `agents.defaults.workspace` (mặc định: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nên sống ở đâu?">
    Các tệp này sống trong **agent workspace**, không phải `~/.openclaw`.

    - **Workspace (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (hoặc fallback cũ `memory.md` khi `MEMORY.md` không có),
      `memory/YYYY-MM-DD.md`, tùy chọn `HEARTBEAT.md`.
    - **Thư mục trạng thái (`~/.openclaw`)**: cấu hình, thông tin xác thực, hồ sơ xác thực, phiên, nhật ký,
      và kỹ năng chia sẻ (`~/.openclaw/skills`).

    Workspace mặc định là `~/.openclaw/workspace`, có thể cấu hình qua:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Nếu bot "quên" sau khi khởi động lại, xác nhận Gateway đang sử dụng cùng một
    workspace trong mỗi lần khởi động (và nhớ: chế độ từ xa sử dụng workspace của **gateway host**,
    không phải máy tính xách tay cục bộ của bạn).

    Mẹo: nếu bạn muốn một hành vi hoặc sở thích bền vững, yêu cầu bot **ghi nó vào
    AGENTS.md hoặc MEMORY.md** thay vì dựa vào lịch sử chat.

    Xem [Agent workspace](/concepts/agent-workspace) và [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="Chiến lược sao lưu được khuyến nghị">
    Đặt **agent workspace** của bạn vào một repo git **riêng tư** và sao lưu nó ở đâu đó
    riêng tư (ví dụ GitHub private). Điều này lưu trữ bộ nhớ + tệp AGENTS/SOUL/USER,
    và cho phép bạn khôi phục "tâm trí" của trợ lý sau này.

    Không **cam kết** bất cứ điều gì dưới `~/.openclaw` (thông tin xác thực, phiên, token, hoặc tải bí mật được mã hóa).
    Nếu bạn cần khôi phục đầy đủ, sao lưu cả workspace và thư mục trạng thái
    riêng biệt (xem câu hỏi di chuyển ở trên).

    Tài liệu: [Agent workspace](/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Làm thế nào để gỡ cài đặt hoàn toàn OpenClaw?">
    Xem hướng dẫn chuyên dụng: [Uninstall](/install/uninstall).
  </Accordion>

  <Accordion title="Các agent có thể hoạt động ngoài workspace không?">
    Có. Workspace là **cwd mặc định** và điểm neo bộ nhớ, không phải là một sandbox cứng.
    Các đường dẫn tương đối giải quyết bên trong workspace, nhưng các đường dẫn tuyệt đối có thể truy cập các
    vị trí host khác trừ khi sandboxing được bật. Nếu bạn cần cách ly, sử dụng
    [`agents.defaults.sandbox`](/gateway/sandboxing) hoặc cài đặt sandbox per-agent. Nếu bạn
    muốn một repo là thư mục làm việc mặc định, chỉ định `workspace` của agent đó đến gốc repo. Repo OpenClaw chỉ là mã nguồn; giữ workspace riêng biệt trừ khi bạn cố ý muốn agent làm việc bên trong nó.

    Ví dụ (repo làm cwd mặc định):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Tôi đang ở chế độ từ xa - nơi lưu trữ phiên ở đâu?">
    Trạng thái phiên thuộc về **gateway host**. Nếu bạn đang ở chế độ từ xa, kho lưu trữ phiên mà bạn quan tâm nằm trên máy từ xa, không phải máy tính xách tay cục bộ của bạn. Xem [Session management](/concepts/session).
  </Accordion>
</AccordionGroup>

## Cấu hình cơ bản

<AccordionGroup>
  <Accordion title="Định dạng cấu hình là gì? Nó ở đâu?">
    OpenClaw đọc một cấu hình **JSON5** tùy chọn từ `$OPENCLAW_CONFIG_PATH` (mặc định: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Nếu tệp bị thiếu, nó sử dụng các giá trị mặc định an toàn (bao gồm một workspace mặc định là `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Tôi đã đặt gateway.bind: "lan" (hoặc "tailnet") và bây giờ không có gì lắng nghe / giao diện người dùng nói không được ủy quyền'>
    Các bind không phải loopback **yêu cầu xác thực**. Cấu hình `gateway.auth.mode` + `gateway.auth.token` (hoặc sử dụng `OPENCLAW_GATEWAY_TOKEN`).

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Ghi chú:

    - `gateway.remote.token` / `.password` **không** kích hoạt xác thực gateway cục bộ một mình.
    - Các đường dẫn cuộc gọi cục bộ có thể sử dụng `gateway.remote.*` làm fallback chỉ khi `gateway.auth.*` không được đặt.
    - Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef và không được giải quyết, việc giải quyết sẽ thất bại (không có fallback từ xa che giấu).
    - Giao diện người dùng điều khiển xác thực qua `connect.params.auth.token` (lưu trữ trong cài đặt app/UI). Tránh đặt token trong URL.

  </Accordion>

  <Accordion title="Tại sao tôi cần một token trên localhost bây giờ?">
    OpenClaw thực thi xác thực token theo mặc định, bao gồm cả loopback. Nếu không có token nào được cấu hình, khởi động gateway sẽ tự động tạo một token và lưu nó vào `gateway.auth.token`, vì vậy **các client WS cục bộ phải xác thực**. Điều này ngăn chặn các quy trình cục bộ khác gọi Gateway.

    Nếu bạn **thực sự** muốn mở loopback, đặt `gateway.auth.mode: "none"` rõ ràng trong cấu hình của bạn. Doctor có thể tạo một token cho bạn bất cứ lúc nào: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Tôi có phải khởi động lại sau khi thay đổi cấu hình không?">
    Gateway theo dõi cấu hình và hỗ trợ tải lại nóng:

    - `gateway.reload.mode: "hybrid"` (mặc định): áp dụng nóng các thay đổi an toàn, khởi động lại cho những thay đổi quan trọng
    - `hot`, `restart`, `off` cũng được hỗ trợ

  </Accordion>

  <Accordion title="Làm thế nào để tắt các tagline hài hước của CLI?">
    Đặt `cli.banner.taglineMode` trong cấu hình:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: ẩn văn bản tagline nhưng giữ lại dòng tiêu đề/phiên bản banner.
    - `default`: sử dụng `All your chats, one OpenClaw.` mỗi lần.
    - `random`: xoay vòng các tagline hài hước/theo mùa (hành vi mặc định).
    - Nếu bạn không muốn banner nào cả, đặt env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Làm thế nào để kích hoạt tìm kiếm web (và web fetch)?">
    `web_fetch` hoạt động mà không cần khóa API. `web_search` yêu cầu một khóa cho nhà cung cấp bạn chọn (Brave, Gemini, Grok, Kimi, hoặc Perplexity).
    **Khuyến nghị:** chạy `openclaw configure --section web` và chọn một nhà cung cấp.
    Các lựa chọn thay thế môi trường:

    - Brave: `BRAVE_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` hoặc `OPENROUTER_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            enabled: true,
            provider: "brave",
            maxResults: 5,
          },
          fetch: {
            enabled: true,
          },
        },
      },
    }
    ```

    Cấu hình tìm kiếm web cụ thể cho nhà cung cấp hiện sống dưới `plugins.entries.<plugin>.config.webSearch.*`.
    Các đường dẫn nhà cung cấp `tools.web.search.*` cũ vẫn tải tạm thời để tương thích, nhưng không nên sử dụng cho các cấu hình mới.

    Ghi chú:

    - Nếu bạn sử dụng danh sách cho phép, thêm `web_search`/`web_fetch` hoặc `group:web`.
    - `web_fetch` được bật theo mặc định (trừ khi bị tắt rõ ràng).
    - Daemons đọc các biến môi trường từ `~/.openclaw/.env` (hoặc môi trường dịch vụ).

    Tài liệu: [Web tools](/tools/web).

  </Accordion>

  <Accordion title="config.apply đã xóa cấu hình của tôi. Làm thế nào để khôi phục và tránh điều này?">
    `config.apply` thay thế **toàn bộ cấu hình**. Nếu bạn gửi một đối tượng không đầy đủ, mọi thứ
    khác sẽ bị xóa.

    Khôi phục:

    - Khôi phục từ bản sao lưu (git hoặc một bản sao `~/.openclaw/openclaw.json`).
    - Nếu bạn không có bản sao lưu, chạy lại `openclaw doctor` và cấu hình lại các kênh/mô hình.
    - Nếu điều này không mong đợi, gửi một lỗi và bao gồm cấu hình cuối cùng bạn biết hoặc bất kỳ bản sao lưu nào.
    - Một agent mã hóa cục bộ thường có thể tái tạo một cấu hình hoạt động từ nhật ký hoặc lịch sử.

    Tránh nó:

    - Sử dụng `openclaw config set` cho các thay đổi nhỏ.
    - Sử dụng `openclaw configure` cho các chỉnh sửa tương tác.

    Tài liệu: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/gateway/doctor).

  </Accordion>

  <Accordion title="Làm thế nào để chạy một Gateway trung tâm với các worker chuyên biệt trên các thiết bị?">
    Mẫu phổ biến là **một Gateway** (ví dụ Raspberry Pi) cộng với **nodes** và **agents**:

    - **Gateway (trung tâm):** sở hữu các kênh (Signal/WhatsApp), định tuyến, và các phiên.
    - **Nodes (thiết bị):** Macs/iOS/Android kết nối như các thiết bị ngoại vi và cung cấp các công cụ cục bộ (`system.run`, `canvas`, `camera`).
    - **Agents (worker):** các bộ não/workspace riêng biệt cho các vai trò đặc biệt (ví dụ "Hetzner ops", "Dữ liệu cá nhân").
    - **Sub-agents:** tạo công việc nền từ một agent chính khi bạn muốn song song.
    - **TUI:** kết nối với Gateway và chuyển đổi agents/sessions.

    Tài liệu: [Nodes](/nodes), [Remote access](/gateway/remote), [Multi-Agent Routing](/concepts/multi-agent), [Sub-agents](/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Trình duyệt OpenClaw có thể chạy headless không?">
    Có. Đó là một tùy chọn cấu hình:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Mặc định là `false` (headful). Headless có khả năng kích hoạt các kiểm tra chống bot trên một số trang web. Xem [Browser](/tools/browser).

    Headless sử dụng **cùng một engine Chromium** và hoạt động cho hầu hết các tự động hóa (forms, clicks, scraping, logins). Sự khác biệt chính:

    - Không có cửa sổ trình duyệt hiển thị (sử dụng ảnh chụp màn hình nếu bạn cần hình ảnh).
    - Một số trang web nghiêm ngặt hơn về tự động hóa trong chế độ headless (CAPTCHAs, chống bot).
      Ví dụ, X/Twitter thường chặn các phiên headless.

  </Accordion>

  <Accordion title="Làm thế nào để sử dụng Brave cho điều khiển trình duyệt?">
    Đặt `browser.executablePath` đến binary Brave của bạn (hoặc bất kỳ trình duyệt dựa trên Chromium nào) và khởi động lại Gateway.
    Xem các ví dụ cấu hình đầy đủ trong [Browser](/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote gateways và nodes

<AccordionGroup>
  <Accordion title="Làm thế nào để các lệnh truyền giữa Telegram, gateway, và nodes?">
    Tin nhắn Telegram được xử lý bởi **gateway**. Gateway chạy agent và
    chỉ sau đó gọi nodes qua **Gateway WebSocket** khi cần một công cụ node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes không thấy lưu lượng nhà cung cấp đầu vào; chúng chỉ nhận các cuộc gọi RPC node.

  </Accordion>

  <Accordion title="Làm thế nào để agent của tôi truy cập máy tính của tôi nếu Gateway được lưu trữ từ xa?">
    Câu trả lời ngắn: **ghép nối máy tính của bạn như một node**. Gateway chạy ở nơi khác, nhưng nó có thể
    gọi các công cụ `node.*` (màn hình, camera, hệ thống) trên máy cục bộ của bạn qua Gateway WebSocket.

    Thiết lập điển hình:

    1. Chạy Gateway trên host luôn bật (VPS/home server).
    2. Đặt Gateway host + máy tính của bạn trên cùng một tailnet.
    3. Đảm bảo Gateway WS có thể truy cập (tailnet bind hoặc SSH tunnel).
    4. Mở ứng dụng macOS cục bộ và kết nối ở chế độ **Remote over SSH** (hoặc tailnet trực tiếp)
       để nó có thể đăng ký như một node.
    5. Phê duyệt node trên Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Không cần cầu TCP riêng biệt; nodes kết nối qua Gateway WebSocket.

    Nhắc nhở bảo mật: ghép nối một node macOS cho phép `system.run` trên máy đó. Chỉ
    ghép nối các thiết bị bạn tin tưởng, và xem xét [Security](/gateway/security).

    Tài liệu: [Nodes](/nodes), [Gateway protocol](/gateway/protocol), [macOS remote mode](/platforms/mac/remote), [Security](/gateway/security).

  </Accordion>

  <Accordion title="Tailscale đã kết nối nhưng tôi không nhận được phản hồi. Bây giờ phải làm gì?">
    Kiểm tra những điều cơ bản:

    - Gateway đang chạy: `openclaw gateway status`
    - Sức khỏe Gateway: `openclaw status`
    - Sức khỏe kênh: `openclaw channels status`

    Sau đó xác minh xác thực và định tuyến:

    - Nếu bạn sử dụng Tailscale Serve, đảm bảo `gateway.auth.allowTailscale` được đặt đúng.
    - Nếu bạn kết nối qua SSH tunnel, xác nhận tunnel cục bộ đang hoạt động và trỏ đến cổng đúng.
    - Xác nhận danh sách cho phép của bạn (DM hoặc nhóm) bao gồm tài khoản của bạn.

    Tài liệu: [Tailscale](/gateway/tailscale), [Remote access](/gateway/remote), [Channels](/channels).

  </Accordion>

  <Accordion title="Hai instance OpenClaw có thể nói chuyện với nhau (local + VPS) không?">
    Có. Không có cầu nối "bot-to-bot" tích hợp, nhưng bạn có thể kết nối nó theo một vài
    cách đáng tin cậy:

    **Đơn giản nhất:** sử dụng một kênh chat thông thường mà cả hai bot có thể truy cập (Telegram/Slack/WhatsApp).
    Để Bot A gửi một tin nhắn đến Bot B, sau đó để Bot B trả lời như bình thường.

    **Cầu nối CLI (tổng quát):** chạy một script gọi Gateway khác với
    `openclaw agent --message ... --deliver`, nhắm mục tiêu vào một chat nơi bot khác
    lắng nghe. Nếu một bot nằm trên VPS từ xa, trỏ CLI của bạn vào Gateway từ xa đó
    qua SSH/Tailscale (xem [Remote access](/gateway/remote)).

    Mẫu ví dụ (chạy từ một máy có thể truy cập Gateway mục tiêu):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Mẹo: thêm một rào chắn để hai bot không lặp lại vô tận (chỉ đề cập, danh sách
    cho phép kênh, hoặc một quy tắc "không trả lời tin nhắn bot").

    Tài liệu: [Remote access](/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/tools/agent-send).

  </Accordion>

  <Accordion title="Tôi có cần các VPS riêng biệt cho nhiều agent không?">
    Không. Một Gateway có thể lưu trữ nhiều agent, mỗi agent có workspace riêng, mô hình mặc định,
    và định tuyến. Đó là thiết lập bình thường và nó rẻ hơn và đơn giản hơn nhiều so với việc chạy
    một VPS cho mỗi agent.

    Chỉ sử dụng các VPS riêng biệt khi bạn cần cách ly cứng (ranh giới bảo mật) hoặc rất
    các cấu hình khác nhau mà bạn không muốn chia sẻ. Nếu không, giữ một Gateway và
    sử dụng nhiều agent hoặc sub-agents.

  </Accordion>

  <Accordion title="Có lợi ích gì khi sử dụng một node trên máy tính xách tay cá nhân của tôi thay vì SSH từ VPS không?">
    Có - nodes là cách chính để truy cập máy tính xách tay của bạn từ một Gateway từ xa, và chúng
    mở khóa nhiều hơn là truy cập shell. Gateway chạy trên macOS/Linux (Windows qua WSL2) và là
    nhẹ (một VPS nhỏ hoặc hộp Raspberry Pi-class là đủ; 4 GB RAM là đủ), vì vậy một thiết lập
    phổ biến là một host luôn bật cộng với máy tính xách tay của bạn như một node.

    - **Không cần SSH inbound.** Nodes kết nối ra ngoài đến Gateway WebSocket và sử dụng ghép nối thiết bị.
    - **Kiểm soát thực thi an toàn hơn.** `system.run` được kiểm soát bởi danh sách cho phép/phê duyệt node trên máy tính xách tay đó.
    - **Nhiều công cụ thiết bị hơn.** Nodes cung cấp `canvas`, `camera`, và `screen` ngoài `system.run`.
    - **Tự động hóa trình duyệt cục bộ.** Giữ Gateway trên VPS, nhưng chạy Chrome cục bộ qua một node host trên máy tính xách tay, hoặc kết nối với Chrome cục bộ trên host qua Chrome MCP.

    SSH là tốt cho truy cập shell ad-hoc, nhưng nodes đơn giản hơn cho các quy trình làm việc agent liên tục và
    tự động hóa thiết bị.

    Tài liệu: [Nodes](/nodes), [Nodes CLI](/cli/nodes), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Các node có chạy dịch vụ gateway không?">
    Không. Chỉ **một gateway** nên chạy trên mỗi host trừ khi bạn cố ý chạy các hồ sơ cách ly (xem [Multiple gateways](/gateway/multiple-gateways)). Nodes là các thiết bị ngoại vi kết nối
    với gateway (iOS/Android nodes, hoặc chế độ "node mode" trên macOS trong ứng dụng menubar). Đối với các node host headless và điều khiển CLI, xem [Node host CLI](/cli/node).

    Một khởi động lại đầy đủ là cần thiết cho các thay đổi `gateway`, `discovery`, và `canvasHost`.

  </Accordion>

  <Accordion title="Có cách nào để áp dụng cấu hình qua API / RPC không?">
    Có. `config.apply` xác thực + ghi cấu hình đầy đủ và khởi động lại Gateway như một phần của hoạt động.
  </Accordion>

  <Accordion title="Cấu hình tối thiểu hợp lý cho lần cài đặt đầu tiên">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Điều này thiết lập workspace của bạn và hạn chế ai có thể kích hoạt bot.

  </Accordion>

  <Accordion title="Làm thế nào để thiết lập Tailscale trên VPS và kết nối từ Mac của tôi?">
    Các bước tối thiểu:

    1. **Cài đặt + đăng nhập trên VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Cài đặt + đăng nhập trên Mac của bạn**
       - Sử dụng ứng dụng Tailscale và đăng nhập vào cùng một tailnet.
    3. **Kích hoạt MagicDNS (khuyến nghị)**
       - Trong bảng điều khiển quản trị Tailscale, kích hoạt MagicDNS để VPS có một tên ổn định.
    4. **Sử dụng hostname tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Nếu bạn muốn giao diện người dùng điều khiển mà không cần SSH, sử dụng Tailscale Serve trên VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Điều này giữ gateway được ràng buộc với loopback và cung cấp HTTPS qua Tailscale. Xem [Tailscale](/gateway/tailscale).

  </Accordion>

  <Accordion title="Làm thế nào để kết nối một node Mac với một Gateway từ xa (Tailscale Serve)?">
    Serve cung cấp **Gateway Control UI + WS**. Nodes kết nối qua cùng một điểm cuối Gateway WS.

    Thiết lập khuyến nghị:

    1. **Đảm bảo VPS + Mac nằm trên cùng một tailnet**.
    2. **Sử dụng ứng dụng macOS ở chế độ Remote** (mục tiêu SSH có thể là hostname tailnet).
       Ứng dụng sẽ tạo đường hầm cổng Gateway và kết nối như một node.
    3. **Phê duyệt node** trên gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Tài liệu: [Gateway protocol](/gateway/protocol), [Discovery](/gateway/discovery), [macOS remote mode](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Tôi nên cài đặt trên một máy tính xách tay thứ hai hay chỉ thêm một node?">
    Nếu bạn chỉ cần **công cụ cục bộ** (màn hình/camera/exec) trên máy tính xách tay thứ hai, hãy thêm nó như một
    **node**. Điều đó giữ một Gateway duy nhất và tránh cấu hình trùng lặp. Các công cụ node cục bộ hiện chỉ có trên macOS, nhưng chúng tôi dự định mở rộng chúng sang các hệ điều hành khác.

    Chỉ cài đặt một Gateway thứ hai khi bạn cần **cách ly cứng** hoặc hai bot hoàn toàn riêng biệt.

    Tài liệu: [Nodes](/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars và tải .env

<AccordionGroup>
  <Accordion title="OpenClaw tải các biến môi trường như thế nào?">
    OpenClaw đọc các biến môi trường từ quy trình cha (shell, launchd/systemd, CI, v.v.) và bổ sung tải:

    - `.env` từ thư mục làm việc hiện tại
    - một `.env` dự phòng toàn cầu từ `~/.openclaw/.env` (hay `$OPENCLAW_STATE_DIR/.env`)

    Không có tệp `.env` nào ghi đè các biến môi trường hiện có.

    Bạn cũng có thể định nghĩa các biến môi trường nội tuyến trong cấu hình (chỉ áp dụng nếu thiếu trong môi trường quy trình):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Xem [/environment](/help/environment) để biết đầy đủ thứ tự ưu tiên và nguồn.

  </Accordion>

  <Accordion title="Tôi đã khởi động Gateway qua dịch vụ và các biến môi trường của tôi biến mất. Bây giờ phải làm gì?">
    Hai cách khắc phục phổ biến:

    1. Đặt các khóa bị thiếu trong `~/.openclaw/.env` để chúng được chọn ngay cả khi dịch vụ không kế thừa môi trường shell của bạn.
    2. Kích hoạt nhập shell (tiện lợi opt-in):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Điều này chạy shell đăng nhập của bạn và chỉ nhập các khóa mong đợi bị thiếu (không bao giờ ghi đè). Các biến môi trường tương đương:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Tôi đã đặt COPILOT_GITHUB_TOKEN, nhưng trạng thái models hiển thị "Shell env: off." Tại sao?'>
    `openclaw models status` báo cáo liệu **nhập shell env** có được bật không. "Shell env: off"
    không có nghĩa là các biến môi trường của bạn bị thiếu - nó chỉ có nghĩa là OpenClaw sẽ không tải
    shell đăng nhập của bạn tự động.

    Nếu Gateway chạy như một dịch vụ (launchd/systemd), nó sẽ không kế thừa môi trường shell của bạn.
    Khắc phục bằng cách làm một trong những điều này:

    1. Đặt token trong `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Hoặc kích hoạt nhập shell (`env.shellEnv.enabled: true`).
    3. Hoặc thêm nó vào khối cấu hình `env` của bạn (chỉ áp dụng nếu thiếu).

    Sau đó khởi động lại gateway và kiểm tra lại:

    ```bash
    openclaw models status
    ```

    Các token Copilot được đọc từ `COPILOT_GITHUB_TOKEN` (cũng `GH_TOKEN` / `GITHUB_TOKEN`).
    Xem [/concepts/model-providers](/concepts/model-providers) và [/environment](/help/environment).

  </Accordion>
</AccordionGroup>

## Phiên làm việc và nhiều cuộc trò chuyện

<AccordionGroup>
  <Accordion title="Làm thế nào để bắt đầu một cuộc trò chuyện mới?">
    Gửi `/new` hoặc `/reset` như một tin nhắn độc lập. Xem thêm [Quản lý phiên làm việc](/concepts/session).
  </Accordion>

  <Accordion title="Phiên làm việc có tự động đặt lại nếu tôi không bao giờ gửi /new không?">
    Có. Phiên làm việc sẽ hết hạn sau `session.idleMinutes` (mặc định là **60**). Tin nhắn **tiếp theo** sẽ bắt đầu một ID phiên mới cho khóa trò chuyện đó. Điều này không xóa các bản ghi - chỉ bắt đầu một phiên mới.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Có cách nào để tạo một nhóm các phiên bản OpenClaw (một CEO và nhiều tác nhân) không?">
    Có, thông qua **định tuyến đa tác nhân** và **tác nhân phụ**. Bạn có thể tạo một tác nhân điều phối và nhiều tác nhân làm việc với không gian làm việc và mô hình riêng của họ.

    Tuy nhiên, đây nên được xem như một **thí nghiệm thú vị**. Nó tiêu tốn nhiều token và thường kém hiệu quả hơn so với việc sử dụng một bot với các phiên riêng biệt. Mô hình điển hình mà chúng tôi hình dung là một bot bạn nói chuyện với, với các phiên khác nhau cho công việc song song. Bot đó cũng có thể tạo ra các tác nhân phụ khi cần.

    Tài liệu: [Định tuyến đa tác nhân](/concepts/multi-agent), [Tác nhân phụ](/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Tại sao ngữ cảnh bị cắt giữa chừng? Làm thế nào để ngăn chặn điều này?">
    Ngữ cảnh phiên làm việc bị giới hạn bởi cửa sổ mô hình. Các cuộc trò chuyện dài, đầu ra công cụ lớn, hoặc nhiều tệp có thể kích hoạt việc nén hoặc cắt bớt.

    Những gì có thể giúp:

    - Yêu cầu bot tóm tắt trạng thái hiện tại và ghi vào một tệp.
    - Sử dụng `/compact` trước các nhiệm vụ dài, và `/new` khi chuyển chủ đề.
    - Giữ ngữ cảnh quan trọng trong không gian làm việc và yêu cầu bot đọc lại.
    - Sử dụng tác nhân phụ cho công việc dài hoặc song song để cuộc trò chuyện chính nhỏ hơn.
    - Chọn mô hình có cửa sổ ngữ cảnh lớn hơn nếu điều này xảy ra thường xuyên.

  </Accordion>

  <Accordion title="Làm thế nào để tôi hoàn toàn đặt lại OpenClaw nhưng vẫn giữ nó được cài đặt?">
    Sử dụng lệnh đặt lại:

    ```bash
    openclaw reset
    ```

    Đặt lại hoàn toàn không tương tác:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Sau đó chạy lại cài đặt:

    ```bash
    openclaw onboard --install-daemon
    ```

    Ghi chú:

    - Quá trình onboard cũng cung cấp **Đặt lại** nếu phát hiện cấu hình hiện có. Xem [Onboarding (CLI)](/start/wizard).
    - Nếu bạn đã sử dụng các hồ sơ (`--profile` / `OPENCLAW_PROFILE`), đặt lại từng thư mục trạng thái (mặc định là `~/.openclaw-<profile>`).
    - Đặt lại cho nhà phát triển: `openclaw gateway --dev --reset` (chỉ dành cho dev; xóa cấu hình dev + thông tin xác thực + phiên + không gian làm việc).

  </Accordion>

  <Accordion title='Tôi nhận được lỗi "context too large" - làm thế nào để đặt lại hoặc nén?'>
    Sử dụng một trong những cách sau:

    - **Nén** (giữ cuộc trò chuyện nhưng tóm tắt các lượt cũ hơn):

      ```
      /compact
      ```

      hoặc `/compact <instructions>` để hướng dẫn tóm tắt.

    - **Đặt lại** (ID phiên mới cho cùng khóa trò chuyện):

      ```
      /new
      /reset
      ```

    Nếu điều này tiếp tục xảy ra:

    - Bật hoặc điều chỉnh **cắt tỉa phiên** (`agents.defaults.contextPruning`) để cắt bớt đầu ra công cụ cũ.
    - Sử dụng mô hình có cửa sổ ngữ cảnh lớn hơn.

    Tài liệu: [Nén](/concepts/compaction), [Cắt tỉa phiên](/concepts/session-pruning), [Quản lý phiên](/concepts/session).

  </Accordion>

  <Accordion title='Tại sao tôi thấy "LLM request rejected: messages.content.tool_use.input field required"?'>
    Đây là lỗi xác thực của nhà cung cấp: mô hình đã phát ra một khối `tool_use` mà không có `input` cần thiết. Thường có nghĩa là lịch sử phiên đã cũ hoặc bị hỏng (thường sau các chuỗi dài hoặc thay đổi công cụ/lược đồ).

    Khắc phục: bắt đầu một phiên mới với `/new` (tin nhắn độc lập).

  </Accordion>

  <Accordion title="Tại sao tôi nhận được tin nhắn heartbeat mỗi 30 phút?">
    Heartbeat chạy mỗi **30 phút** theo mặc định. Điều chỉnh hoặc vô hiệu hóa chúng:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // hoặc "0m" để vô hiệu hóa
          },
        },
      },
    }
    ```

    Nếu `HEARTBEAT.md` tồn tại nhưng thực tế trống (chỉ có dòng trống và tiêu đề markdown như `# Heading`), OpenClaw bỏ qua việc chạy heartbeat để tiết kiệm cuộc gọi API. Nếu tệp bị thiếu, heartbeat vẫn chạy và mô hình quyết định phải làm gì.

    Ghi đè theo tác nhân sử dụng `agents.list[].heartbeat`. Tài liệu: [Heartbeat](/gateway/heartbeat).

  </Accordion>

  <Accordion title='Tôi có cần thêm "tài khoản bot" vào nhóm WhatsApp không?'>
    Không. OpenClaw chạy trên **tài khoản của bạn**, vì vậy nếu bạn có trong nhóm, OpenClaw có thể thấy nó. Theo mặc định, các phản hồi nhóm bị chặn cho đến khi bạn cho phép người gửi (`groupPolicy: "allowlist"`).

    Nếu bạn chỉ muốn **bạn** có thể kích hoạt phản hồi nhóm:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Làm thế nào để tôi lấy JID của một nhóm WhatsApp?">
    Lựa chọn 1 (nhanh nhất): theo dõi log và gửi một tin nhắn thử nghiệm trong nhóm:

    ```bash
    openclaw logs --follow --json
    ```

    Tìm `chatId` (hoặc `from`) kết thúc bằng `@g.us`, như:
    `1234567890-1234567890@g.us`.

    Lựa chọn 2 (nếu đã được cấu hình/cho phép): liệt kê các nhóm từ cấu hình:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Tài liệu: [WhatsApp](/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Tại sao OpenClaw không trả lời trong một nhóm?">
    Hai nguyên nhân phổ biến:

    - Chế độ chặn đề cập đang bật (mặc định). Bạn phải @mention bot (hoặc khớp với `mentionPatterns`).
    - Bạn đã cấu hình `channels.whatsapp.groups` mà không có `"*"` và nhóm không được cho phép.

    Xem [Groups](/channels/groups) và [Group messages](/channels/group-messages).

  </Accordion>

  <Accordion title="Các nhóm/chủ đề có chia sẻ ngữ cảnh với DMs không?">
    Các cuộc trò chuyện trực tiếp sụp đổ về phiên chính theo mặc định. Các nhóm/kênh có khóa phiên riêng của họ, và các chủ đề Telegram / luồng Discord là các phiên riêng biệt. Xem [Groups](/channels/groups) và [Group messages](/channels/group-messages).
  </Accordion>

  <Accordion title="Tôi có thể tạo bao nhiêu không gian làm việc và tác nhân?">
    Không có giới hạn cứng. Hàng chục (thậm chí hàng trăm) là ổn, nhưng hãy chú ý:

    - **Tăng trưởng đĩa:** các phiên + bản ghi sống dưới `~/.openclaw/agents/<agentId>/sessions/`.
    - **Chi phí token:** nhiều tác nhân có nghĩa là sử dụng mô hình đồng thời nhiều hơn.
    - **Chi phí vận hành:** hồ sơ xác thực, không gian làm việc và định tuyến kênh cho mỗi tác nhân.

    Mẹo:

    - Giữ một không gian làm việc **hoạt động** cho mỗi tác nhân (`agents.defaults.workspace`).
    - Cắt tỉa các phiên cũ (xóa JSONL hoặc lưu trữ các mục) nếu đĩa tăng trưởng.
    - Sử dụng `openclaw doctor` để phát hiện các không gian làm việc lạc và không khớp hồ sơ.

  </Accordion>

  <Accordion title="Tôi có thể chạy nhiều bot hoặc cuộc trò chuyện cùng lúc (Slack), và tôi nên thiết lập như thế nào?">
    Có. Sử dụng **Định tuyến Đa Tác Nhân** để chạy nhiều tác nhân cô lập và định tuyến tin nhắn đến theo kênh/tài khoản/người gửi. Slack được hỗ trợ như một kênh và có thể được gắn với các tác nhân cụ thể.

    Truy cập trình duyệt mạnh mẽ nhưng không phải "làm bất cứ điều gì một con người có thể" - chống bot, CAPTCHA, và MFA vẫn có thể chặn tự động hóa. Để kiểm soát trình duyệt đáng tin cậy nhất, sử dụng Chrome MCP cục bộ trên máy chủ, hoặc sử dụng CDP trên máy thực sự chạy trình duyệt.

    Thiết lập tốt nhất:

    - Máy chủ Gateway luôn bật (VPS/Mac mini).
    - Một tác nhân cho mỗi vai trò (ràng buộc).
    - Kênh Slack được gắn với các tác nhân đó.
    - Trình duyệt cục bộ qua Chrome MCP hoặc một node khi cần.

    Tài liệu: [Định tuyến Đa Tác Nhân](/concepts/multi-agent), [Slack](/channels/slack),
    [Trình duyệt](/tools/browser), [Nodes](/nodes).

  </Accordion>
</AccordionGroup>

## Mô hình: mặc định, lựa chọn, bí danh, chuyển đổi

<AccordionGroup>
  <Accordion title='Mô hình "mặc định" là gì?'>
    Mô hình mặc định của OpenClaw là bất kỳ mô hình nào bạn đã đặt:

    ```
    agents.defaults.model.primary
    ```

    Các mô hình được tham chiếu dưới dạng `provider/model` (ví dụ: `anthropic/claude-opus-4-6`). Nếu bạn bỏ qua nhà cung cấp, OpenClaw hiện tại giả định `anthropic` như một biện pháp tạm thời - nhưng bạn vẫn nên **rõ ràng** đặt `provider/model`.

  </Accordion>

  <Accordion title="Bạn đề xuất mô hình nào?">
    **Mặc định đề xuất:** sử dụng mô hình thế hệ mới mạnh nhất có sẵn trong ngăn xếp nhà cung cấp của bạn.
    **Đối với các tác nhân có công cụ hoặc đầu vào không đáng tin cậy:** ưu tiên sức mạnh mô hình hơn chi phí.
    **Đối với trò chuyện thường xuyên/ít rủi ro:** sử dụng các mô hình dự phòng rẻ hơn và định tuyến theo vai trò tác nhân.

    MiniMax có tài liệu riêng: [MiniMax](/providers/minimax) và
    [Mô hình cục bộ](/gateway/local-models).

    Quy tắc chung: sử dụng **mô hình tốt nhất bạn có thể chi trả** cho công việc quan trọng, và một mô hình rẻ hơn cho trò chuyện thường xuyên hoặc tóm tắt. Bạn có thể định tuyến mô hình theo tác nhân và sử dụng tác nhân phụ để song song hóa các nhiệm vụ dài (mỗi tác nhân phụ tiêu thụ token). Xem [Mô hình](/concepts/models) và [Tác nhân phụ](/tools/subagents).

    Cảnh báo mạnh: các mô hình yếu hơn/quá lượng hóa dễ bị tấn công chèn lệnh và hành vi không an toàn hơn. Xem [Bảo mật](/gateway/security).

    Thêm ngữ cảnh: [Mô hình](/concepts/models).

  </Accordion>

  <Accordion title="Làm thế nào để tôi chuyển đổi mô hình mà không xóa cấu hình của mình?">
    Sử dụng **lệnh mô hình** hoặc chỉ chỉnh sửa các trường **mô hình**. Tránh thay thế cấu hình hoàn toàn.

    Các tùy chọn an toàn:

    - `/model` trong trò chuyện (nhanh, theo phiên)
    - `openclaw models set ...` (cập nhật chỉ cấu hình mô hình)
    - `openclaw configure --section model` (tương tác)
    - chỉnh sửa `agents.defaults.model` trong `~/.openclaw/openclaw.json`

    Tránh `config.apply` với một đối tượng một phần trừ khi bạn định thay thế toàn bộ cấu hình.
    Nếu bạn đã ghi đè cấu hình, khôi phục từ bản sao lưu hoặc chạy lại `openclaw doctor` để sửa chữa.

    Tài liệu: [Mô hình](/concepts/models), [Cấu hình](/cli/configure), [Config](/cli/config), [Doctor](/gateway/doctor).

  </Accordion>

  <Accordion title="Tôi có thể sử dụng mô hình tự lưu trữ (llama.cpp, vLLM, Ollama) không?">
    Có. Ollama là con đường dễ nhất cho các mô hình cục bộ.

    Thiết lập nhanh nhất:

    1. Cài đặt Ollama từ `https://ollama.com/download`
    2. Kéo một mô hình cục bộ như `ollama pull glm-4.7-flash`
    3. Nếu bạn muốn Ollama Cloud, chạy `ollama signin`
    4. Chạy `openclaw onboard` và chọn `Ollama`
    5. Chọn `Local` hoặc `Cloud + Local`

    Ghi chú:

    - `Cloud + Local` cung cấp cho bạn các mô hình Ollama Cloud cộng với các mô hình Ollama cục bộ của bạn
    - các mô hình đám mây như `kimi-k2.5:cloud` không cần kéo cục bộ
    - để chuyển đổi thủ công, sử dụng `openclaw models list` và `openclaw models set ollama/<model>`

    Ghi chú bảo mật: các mô hình nhỏ hơn hoặc quá lượng hóa dễ bị tấn công chèn lệnh. Chúng tôi khuyến nghị mạnh mẽ **các mô hình lớn** cho bất kỳ bot nào có thể sử dụng công cụ.
    Nếu bạn vẫn muốn các mô hình nhỏ, hãy bật sandboxing và danh sách cho phép công cụ nghiêm ngặt.

    Tài liệu: [Ollama](/providers/ollama), [Mô hình cục bộ](/gateway/local-models),
    [Nhà cung cấp mô hình](/concepts/model-providers), [Bảo mật](/gateway/security),
    [Sandboxing](/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd và Krill sử dụng mô hình gì?">
    - Các triển khai này có thể khác nhau và có thể thay đổi theo thời gian; không có khuyến nghị nhà cung cấp cố định.
    - Kiểm tra cài đặt runtime hiện tại trên mỗi gateway với `openclaw models status`.
    - Đối với các tác nhân nhạy cảm với bảo mật/có công cụ, sử dụng mô hình thế hệ mới mạnh nhất có sẵn.
  </Accordion>

  <Accordion title="Làm thế nào để tôi chuyển đổi mô hình ngay lập tức (không cần khởi động lại)?">
    Sử dụng lệnh `/model` như một tin nhắn độc lập:

    ```
    /model sonnet
    /model haiku
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    ```

    Bạn có thể liệt kê các mô hình có sẵn với `/model`, `/model list`, hoặc `/model status`.

    `/model` (và `/model list`) hiển thị một danh sách chọn số gọn. Chọn theo số:

    ```
    /model 3
    ```

    Bạn cũng có thể buộc một hồ sơ xác thực cụ thể cho nhà cung cấp (theo phiên):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Mẹo: `/model status` hiển thị tác nhân nào đang hoạt động, tệp `auth-profiles.json` nào đang được sử dụng, và hồ sơ xác thực nào sẽ được thử tiếp theo.
    Nó cũng hiển thị điểm cuối nhà cung cấp được cấu hình (`baseUrl`) và chế độ API (`api`) khi có sẵn.

    **Làm thế nào để tôi bỏ ghim một hồ sơ tôi đã đặt với @profile?**

    Chạy lại `/model` **mà không có** hậu tố `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Nếu bạn muốn quay lại mặc định, chọn nó từ `/model` (hoặc gửi `/model <default provider/model>`).
    Sử dụng `/model status` để xác nhận hồ sơ xác thực nào đang hoạt động.

  </Accordion>

  <Accordion title="Tôi có thể sử dụng GPT 5.2 cho công việc hàng ngày và Codex 5.3 cho lập trình không?">
    Có. Đặt một cái làm mặc định và chuyển đổi khi cần:

    - **Chuyển đổi nhanh (theo phiên):** `/model gpt-5.2` cho công việc hàng ngày, `/model openai-codex/gpt-5.4` cho lập trình với Codex OAuth.
    - **Mặc định + chuyển đổi:** đặt `agents.defaults.model.primary` thành `openai/gpt-5.2`, sau đó chuyển sang `openai-codex/gpt-5.4` khi lập trình (hoặc ngược lại).
    - **Tác nhân phụ:** định tuyến các nhiệm vụ lập trình đến các tác nhân phụ với mô hình mặc định khác.

    Xem [Mô hình](/concepts/models) và [Lệnh gạch chéo](/tools/slash-commands).

  </Accordion>

  <Accordion title='Tại sao tôi thấy "Model ... is not allowed" và sau đó không có phản hồi?'>
    Nếu `agents.defaults.models` được đặt, nó trở thành **danh sách cho phép** cho `/model` và bất kỳ ghi đè phiên nào. Chọn một mô hình không có trong danh sách đó sẽ trả về:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Lỗi đó được trả về **thay vì** một phản hồi bình thường. Khắc phục: thêm mô hình vào
    `agents.defaults.models`, xóa danh sách cho phép, hoặc chọn một mô hình từ `/model list`.

  </Accordion>

  <Accordion title='Tại sao tôi thấy "Unknown model: minimax/MiniMax-M2.7"?'>
    Điều này có nghĩa là **nhà cung cấp chưa được cấu hình** (không tìm thấy cấu hình nhà cung cấp MiniMax hoặc hồ sơ xác thực), vì vậy mô hình không thể được giải quyết. Một bản sửa lỗi cho phát hiện này sẽ có trong **2026.1.12** (chưa phát hành tại thời điểm viết).

    Danh sách kiểm tra sửa lỗi:

    1. Nâng cấp lên **2026.1.12** (hoặc chạy từ nguồn `main`), sau đó khởi động lại gateway.
    2. Đảm bảo MiniMax được cấu hình (wizard hoặc JSON), hoặc rằng một khóa API MiniMax
       tồn tại trong hồ sơ môi trường/xác thực để nhà cung cấp có thể được tiêm.
    3. Sử dụng ID mô hình chính xác (phân biệt chữ hoa chữ thường): `minimax/MiniMax-M2.7`,
       `minimax/MiniMax-M2.7-highspeed`, `minimax/MiniMax-M2.5`, hoặc
       `minimax/MiniMax-M2.5-highspeed`.
    4. Chạy:

       ```bash
       openclaw models list
       ```

       và chọn từ danh sách (hoặc `/model list` trong trò chuyện).

    Xem [MiniMax](/providers/minimax) và [Mô hình](/concepts/models).

  </Accordion>

  <Accordion title="Tôi có thể sử dụng MiniMax làm mặc định và OpenAI cho các nhiệm vụ phức tạp không?">
    Có. Sử dụng **MiniMax làm mặc định** và chuyển đổi mô hình **theo phiên** khi cần.
    Dự phòng là cho **lỗi**, không phải "nhiệm vụ khó", vì vậy sử dụng `/model` hoặc một tác nhân riêng biệt.

    **Lựa chọn A: chuyển đổi theo phiên**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.2": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Sau đó:

    ```
    /model gpt
    ```

    **Lựa chọn B: tác nhân riêng biệt**

    - Tác nhân A mặc định: MiniMax
    - Tác nhân B mặc định: OpenAI
    - Định tuyến theo tác nhân hoặc sử dụng `/agent` để chuyển đổi

    Tài liệu: [Mô hình](/concepts/models), [Định tuyến Đa Tác Nhân](/concepts/multi-agent), [MiniMax](/providers/minimax), [OpenAI](/providers/openai).

  </Accordion>

  <Accordion title="Opus / sonnet / gpt có phải là các phím tắt tích hợp không?">
    Có. OpenClaw cung cấp một số phím tắt mặc định (chỉ áp dụng khi mô hình tồn tại trong `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5-mini`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Nếu bạn đặt bí danh của riêng mình với cùng tên, giá trị của bạn sẽ được ưu tiên.

  </Accordion>

  <Accordion title="Làm thế nào để tôi định nghĩa/ghi đè các phím tắt mô hình (bí danh)?">
    Bí danh đến từ `agents.defaults.models.<modelId>.alias`. Ví dụ:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Sau đó `/model sonnet` (hoặc `/<alias>` khi được hỗ trợ) sẽ giải quyết đến ID mô hình đó.

  </Accordion>

  <Accordion title="Làm thế nào để tôi thêm mô hình từ các nhà cung cấp khác như OpenRouter hoặc Z.AI?">
    OpenRouter (trả tiền theo token; nhiều mô hình):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (mô hình GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Nếu bạn tham chiếu một nhà cung cấp/mô hình nhưng khóa nhà cung cấp cần thiết bị thiếu, bạn sẽ nhận được lỗi xác thực runtime (ví dụ: `No API key found for provider "zai"`).

    **Không tìm thấy khóa API cho nhà cung cấp sau khi thêm một tác nhân mới**

    Điều này thường có nghĩa là **tác nhân mới** có một kho lưu trữ xác thực trống. Xác thực là theo tác nhân và
    được lưu trữ trong:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Các tùy chọn sửa lỗi:

    - Chạy `openclaw agents add <id>` và cấu hình xác thực trong wizard.
    - Hoặc sao chép `auth-profiles.json` từ `agentDir` của tác nhân chính vào `agentDir` của tác nhân mới.

    Không **tái sử dụng `agentDir` giữa các tác nhân; nó gây ra xung đột xác thực/phiên.

  </Accordion>
</AccordionGroup>

## Chuyển đổi mô hình và "Tất cả các mô hình đều thất bại"

<AccordionGroup>
  <Accordion title="Chuyển đổi dự phòng hoạt động như thế nào?">
    Chuyển đổi dự phòng diễn ra trong hai giai đoạn:

    1. **Xoay vòng hồ sơ xác thực** trong cùng một nhà cung cấp.
    2. **Dự phòng mô hình** sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`.

    Thời gian chờ áp dụng cho các hồ sơ thất bại (backoff theo cấp số nhân), vì vậy OpenClaw có thể tiếp tục phản hồi ngay cả khi một nhà cung cấp bị giới hạn tốc độ hoặc tạm thời thất bại.

  </Accordion>

  <Accordion title='Thông báo "No credentials found for profile anthropic:default" có nghĩa là gì?'>
    Điều này có nghĩa là hệ thống đã cố gắng sử dụng ID hồ sơ xác thực `anthropic:default`, nhưng không thể tìm thấy thông tin xác thực cho nó trong kho lưu trữ xác thực mong đợi.

    **Danh sách kiểm tra sửa lỗi:**

    - **Xác nhận nơi lưu trữ hồ sơ xác thực** (đường dẫn mới so với đường dẫn cũ)
      - Hiện tại: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Cũ: `~/.openclaw/agent/*` (được di chuyển bởi `openclaw doctor`)
    - **Xác nhận biến môi trường của bạn được tải bởi Gateway**
      - Nếu bạn đặt `ANTHROPIC_API_KEY` trong shell của bạn nhưng chạy Gateway qua systemd/launchd, nó có thể không kế thừa nó. Đặt nó trong `~/.openclaw/.env` hoặc bật `env.shellEnv`.
    - **Đảm bảo bạn đang chỉnh sửa tác nhân đúng**
      - Các thiết lập đa tác nhân có nghĩa là có thể có nhiều tệp `auth-profiles.json`.
    - **Kiểm tra trạng thái mô hình/xác thực**
      - Sử dụng `openclaw models status` để xem các mô hình đã cấu hình và liệu các nhà cung cấp có được xác thực hay không.

    **Danh sách kiểm tra sửa lỗi cho "No credentials found for profile anthropic"**

    Điều này có nghĩa là chạy được ghim vào một hồ sơ xác thực Anthropic, nhưng Gateway
    không thể tìm thấy nó trong kho lưu trữ xác thực của nó.

    - **Sử dụng mã thông báo cài đặt**
      - Chạy `claude setup-token`, sau đó dán nó với `openclaw models auth setup-token --provider anthropic`.
      - Nếu mã thông báo được tạo trên máy khác, sử dụng `openclaw models auth paste-token --provider anthropic`.
    - **Nếu bạn muốn sử dụng khóa API thay thế**
      - Đặt `ANTHROPIC_API_KEY` trong `~/.openclaw/.env` trên **máy chủ gateway**.
      - Xóa bất kỳ thứ tự ghim nào buộc một hồ sơ bị thiếu:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Xác nhận bạn đang chạy lệnh trên máy chủ gateway**
      - Trong chế độ từ xa, hồ sơ xác thực sống trên máy gateway, không phải máy tính xách tay của bạn.

  </Accordion>

  <Accordion title="Tại sao nó cũng thử Google Gemini và thất bại?">
    Nếu cấu hình mô hình của bạn bao gồm Google Gemini như một dự phòng (hoặc bạn đã chuyển sang một phím tắt Gemini), OpenClaw sẽ thử nó trong quá trình dự phòng mô hình. Nếu bạn chưa cấu hình thông tin xác thực Google, bạn sẽ thấy `No API key found for provider "google"`.

    Khắc phục: hoặc cung cấp xác thực Google, hoặc xóa/tránh các mô hình Google trong `agents.defaults.model.fallbacks` / bí danh để dự phòng không định tuyến đến đó.

    **Yêu cầu LLM bị từ chối: chữ ký suy nghĩ cần thiết (Google Antigravity)**

    Nguyên nhân: lịch sử phiên chứa **các khối suy nghĩ không có chữ ký** (thường từ
    một luồng bị hủy/bị cắt). Google Antigravity yêu cầu chữ ký cho các khối suy nghĩ.

    Khắc phục: OpenClaw hiện loại bỏ các khối suy nghĩ không có chữ ký cho Google Antigravity Claude. Nếu nó vẫn xuất hiện, bắt đầu một **phiên mới** hoặc đặt `/thinking off` cho tác nhân đó.

  </Accordion>
</AccordionGroup>

## Hồ sơ xác thực: chúng là gì và cách quản lý chúng

Liên quan: [/concepts/oauth](/concepts/oauth) (luồng OAuth, lưu trữ mã thông báo, mẫu nhiều tài khoản)

<AccordionGroup>
  <Accordion title="Hồ sơ xác thực là gì?">
    Hồ sơ xác thực là một bản ghi thông tin xác thực được đặt tên (OAuth hoặc khóa API) gắn liền với một nhà cung cấp. Hồ sơ sống trong:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="ID hồ sơ điển hình là gì?">
    OpenClaw sử dụng các ID có tiền tố nhà cung cấp như:

    - `anthropic:default` (phổ biến khi không có danh tính email)
    - `anthropic:<email>` cho danh tính OAuth
    - ID tùy chỉnh bạn chọn (ví dụ: `anthropic:work`)

  </Accordion>

  <Accordion title="Tôi có thể kiểm soát hồ sơ xác thực nào được thử trước không?">
    Có. Cấu hình hỗ trợ siêu dữ liệu tùy chọn cho hồ sơ và một thứ tự theo nhà cung cấp (`auth.order.<provider>`). Điều này **không** lưu trữ bí mật; nó ánh xạ ID đến nhà cung cấp/chế độ và đặt thứ tự xoay vòng.

    OpenClaw có thể tạm thời bỏ qua một hồ sơ nếu nó đang trong một **thời gian chờ** ngắn (giới hạn tốc độ/thời gian chờ/lỗi xác thực) hoặc một trạng thái **bị vô hiệu hóa** dài hơn (thanh toán/không đủ tín dụng). Để kiểm tra điều này, chạy `openclaw models status --json` và kiểm tra `auth.unusableProfiles`. Điều chỉnh: `auth.cooldowns.billingBackoffHours*`.

    Bạn cũng có thể đặt một ghi đè thứ tự **theo tác nhân** (được lưu trữ trong `auth-profiles.json` của tác nhân đó) qua CLI:

    ```bash
    # Mặc định cho tác nhân mặc định đã cấu hình (bỏ qua --agent)
    openclaw models auth order get --provider anthropic

    # Khóa xoay vòng vào một hồ sơ duy nhất (chỉ thử cái này)
    openclaw models auth order set --provider anthropic anthropic:default

    # Hoặc đặt một thứ tự rõ ràng (dự phòng trong nhà cung cấp)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Xóa ghi đè (quay lại cấu hình auth.order / vòng tròn)
    openclaw models auth order clear --provider anthropic
    ```

    Để nhắm mục tiêu một tác nhân cụ thể:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

  </Accordion>

  <Accordion title="OAuth vs API key - sự khác biệt là gì?">
    OpenClaw hỗ trợ cả hai:

    - **OAuth** thường tận dụng quyền truy cập đăng ký (nếu có).
    - **Khóa API** sử dụng thanh toán theo token.

    Wizard hỗ trợ rõ ràng mã thông báo cài đặt Anthropic và OpenAI Codex OAuth và có thể lưu trữ khóa API cho bạn.

  </Accordion>
</AccordionGroup>

## Gateway: cổng, "đã chạy", và chế độ từ xa

<AccordionGroup>
  <Accordion title="Gateway sử dụng cổng nào?">
    `gateway.port` kiểm soát cổng đơn được ghép nối cho WebSocket + HTTP (Giao diện điều khiển, hooks, v.v.).

    Thứ tự ưu tiên:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > mặc định 18789
    ```

  </Accordion>

  <Accordion title='Tại sao trạng thái openclaw gateway nói "Runtime: running" nhưng "RPC probe: failed"?'>
    Bởi vì "running" là cái nhìn của **supervisor** (launchd/systemd/schtasks). RPC probe là CLI thực sự kết nối với WebSocket gateway và gọi `status`.

    Sử dụng `openclaw gateway status` và tin tưởng vào các dòng này:

    - `Probe target:` (URL mà probe thực sự đã sử dụng)
    - `Listening:` (cái gì thực sự được gắn trên cổng)
    - `Last gateway error:` (nguyên nhân gốc phổ biến khi quá trình đang sống nhưng cổng không lắng nghe)

  </Accordion>

  <Accordion title='Tại sao trạng thái openclaw gateway hiển thị "Config (cli)" và "Config (service)" khác nhau?'>
    Bạn đang chỉnh sửa một tệp cấu hình trong khi dịch vụ đang chạy một tệp khác (thường là không khớp `--profile` / `OPENCLAW_STATE_DIR`).

    Khắc phục:

    ```bash
    openclaw gateway install --force
    ```

    Chạy điều đó từ cùng một `--profile` / môi trường bạn muốn dịch vụ sử dụng.

  </Accordion>

  <Accordion title='Thông báo "another gateway instance is already listening" có nghĩa là gì?'>
    OpenClaw thực thi khóa runtime bằng cách gắn ngay lập tức trình nghe WebSocket khi khởi động (mặc định `ws://127.0.0.1:18789`). Nếu việc gắn thất bại với `EADDRINUSE`, nó ném `GatewayLockError` chỉ ra rằng một phiên bản khác đã đang lắng nghe.

    Khắc phục: dừng phiên bản khác, giải phóng cổng, hoặc chạy với `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Làm thế nào để tôi chạy OpenClaw ở chế độ từ xa (khách hàng kết nối với một Gateway ở nơi khác)?">
    Đặt `gateway.mode: "remote"` và chỉ đến một URL WebSocket từ xa, tùy chọn với một mã thông báo/mật khẩu:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Ghi chú:

    - `openclaw gateway` chỉ bắt đầu khi `gateway.mode` là `local` (hoặc bạn truyền cờ ghi đè).
    - Ứng dụng macOS theo dõi tệp cấu hình và chuyển đổi chế độ trực tiếp khi các giá trị này thay đổi.

  </Accordion>

  <Accordion title='Giao diện điều khiển nói "unauthorized" (hoặc liên tục kết nối lại). Bây giờ phải làm gì?'>
    Gateway của bạn đang chạy với xác thực được bật (`gateway.auth.*`), nhưng UI không gửi mã thông báo/mật khẩu khớp.

    Thực tế (từ mã):

    - Giao diện điều khiển giữ mã thông báo trong `sessionStorage` cho phiên tab trình duyệt hiện tại và URL gateway đã chọn, vì vậy làm mới cùng tab vẫn hoạt động mà không cần khôi phục mã thông báo lưu trữ lâu dài.
    - Trên `AUTH_TOKEN_MISMATCH`, các khách hàng đáng tin cậy có thể thử một lần thử lại có giới hạn với mã thông báo thiết bị đã lưu khi gateway trả về gợi ý thử lại (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).

    Khắc phục:

    - Nhanh nhất: `openclaw dashboard` (in + sao chép URL bảng điều khiển, cố gắng mở; hiển thị gợi ý SSH nếu không có giao diện).
    - Nếu bạn chưa có mã thông báo: `openclaw doctor --generate-gateway-token`.
    - Nếu từ xa, trước tiên hãy tạo đường hầm: `ssh -N -L 18789:127.0.0.1:18789 user@host` sau đó mở `http://127.0.0.1:18789/`.
    - Đặt `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`) trên máy chủ gateway.
    - Trong cài đặt giao diện điều khiển, dán cùng mã thông báo.
    - Nếu không khớp vẫn tồn tại sau một lần thử lại, xoay vòng/làm mới mã thông báo thiết bị đã ghép đôi:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Vẫn bị kẹt? Chạy `openclaw status --all` và làm theo [Khắc phục sự cố](/gateway/troubleshooting). Xem [Dashboard](/web/dashboard) để biết chi tiết xác thực.

  </Accordion>

  <Accordion title="Tôi đã đặt gateway.bind tailnet nhưng không thể gắn và không có gì lắng nghe">
    `tailnet` bind chọn một IP Tailscale từ các giao diện mạng của bạn (100.64.0.0/10). Nếu máy không nằm trên Tailscale (hoặc giao diện bị tắt), không có gì để gắn vào.

    Khắc phục:

    - Khởi động Tailscale trên máy đó (để nó có địa chỉ 100.x), hoặc
    - Chuyển sang `gateway.bind: "loopback"` / `"lan"`.

    Lưu ý: `tailnet` là rõ ràng. `auto` ưu tiên loopback; sử dụng `gateway.bind: "tailnet"` khi bạn muốn một bind chỉ tailnet.

  </Accordion>

  <Accordion title="Tôi có thể chạy nhiều Gateway trên cùng một máy chủ không?">
    Thường thì không - một Gateway có thể chạy nhiều kênh nhắn tin và tác nhân. Sử dụng nhiều Gateway chỉ khi bạn cần dự phòng (ví dụ: bot cứu hộ) hoặc cách ly cứng.

    Có, nhưng bạn phải cách ly:

    - `OPENCLAW_CONFIG_PATH` (cấu hình theo phiên bản)
    - `OPENCLAW_STATE_DIR` (trạng thái theo phiên bản)
    - `agents.defaults.workspace` (cách ly không gian làm việc)
    - `gateway.port` (cổng duy nhất)

    Thiết lập nhanh (khuyến nghị):

    - Sử dụng `openclaw --profile <name> ...` cho mỗi phiên bản (tự động tạo `~/.openclaw-<name>`).
    - Đặt một `gateway.port` duy nhất trong mỗi cấu hình hồ sơ (hoặc truyền `--port` cho các lần chạy thủ công).
    - Cài đặt một dịch vụ theo hồ sơ: `openclaw --profile <name> gateway install`.

    Hồ sơ cũng thêm hậu tố tên dịch vụ (`ai.openclaw.<profile>`; cũ `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Hướng dẫn đầy đủ: [Nhiều gateway](/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Thông báo "invalid handshake" / mã 1008 có nghĩa là gì?'>
    Gateway là một **máy chủ WebSocket**, và nó mong đợi tin nhắn đầu tiên là
    một khung `connect`. Nếu nó nhận được bất cứ điều gì khác, nó đóng kết nối
    với **mã 1008** (vi phạm chính sách).

    Nguyên nhân phổ biến:

    - Bạn đã mở URL **HTTP** trong trình duyệt (`http://...`) thay vì một khách hàng WS.
    - Bạn đã sử dụng sai cổng hoặc đường dẫn.
    - Một proxy hoặc đường hầm đã loại bỏ tiêu đề xác thực hoặc gửi một yêu cầu không phải Gateway.

    Sửa nhanh:

    1. Sử dụng URL WS: `ws://<host>:18789` (hoặc `wss://...` nếu HTTPS).
    2. Không mở cổng WS trong một tab trình duyệt thông thường.
    3. Nếu xác thực đang bật, bao gồm mã thông báo/mật khẩu trong khung `connect`.

    Nếu bạn đang sử dụng CLI hoặc TUI, URL nên trông như:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Chi tiết giao thức: [Giao thức Gateway](/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Ghi log và gỡ lỗi

<AccordionGroup>
  <Accordion title="Log nằm ở đâu?">
    Log tệp (có cấu trúc):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Bạn có thể đặt một đường dẫn ổn định qua `logging.file`. Mức độ log tệp được kiểm soát bởi `logging.level`. Độ chi tiết của console được kiểm soát bởi `--verbose` và `logging.consoleLevel`.

    Theo dõi log nhanh nhất:

    ```bash
    openclaw logs --follow
    ```

    Log dịch vụ/supervisor (khi gateway chạy qua launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` và `gateway.err.log` (mặc định: `~/.openclaw/logs/...`; hồ sơ sử dụng `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Xem [Khắc phục sự cố](/gateway/troubleshooting) để biết thêm.

  </Accordion>

  <Accordion title="Làm thế nào để tôi bắt đầu/dừng/khởi động lại dịch vụ Gateway?">
    Sử dụng các trợ giúp gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Nếu bạn chạy gateway thủ công, `openclaw gateway --force` có thể thu hồi cổng. Xem [Gateway](/gateway).

  </Accordion>

  <Accordion title="Tôi đã đóng terminal của mình trên Windows - làm thế nào để tôi khởi động lại OpenClaw?">
    Có **hai chế độ cài đặt Windows**:

    **1) WSL2 (khuyến nghị):** Gateway chạy bên trong Linux.

    Mở PowerShell, vào WSL, sau đó khởi động lại:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Nếu bạn chưa bao giờ cài đặt dịch vụ, khởi động nó ở chế độ nền:

    ```bash
    openclaw gateway run
    ```

    **2) Windows gốc (không khuyến nghị):** Gateway chạy trực tiếp trên Windows.

    Mở PowerShell và chạy:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Nếu bạn chạy nó thủ công (không có dịch vụ), sử dụng:

    ```powershell
    openclaw gateway run
    ```

    Tài liệu: [Windows (WSL2)](/platforms/windows), [Sổ tay dịch vụ Gateway](/gateway).

  </Accordion>

  <Accordion title="Gateway đang hoạt động nhưng không có phản hồi nào đến. Tôi nên kiểm tra gì?">
    Bắt đầu với một kiểm tra sức khỏe nhanh:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Nguyên nhân phổ biến:

    - Xác thực mô hình không được tải trên **máy chủ gateway** (kiểm tra `models status`).
    - Ghép đôi kênh/danh sách cho phép chặn phản hồi (kiểm tra cấu hình kênh + log).
    - WebChat/Dashboard đang mở mà không có mã thông báo đúng.

    Nếu bạn đang từ xa, xác nhận kết nối đường hầm/Tailscale đang hoạt động và
    WebSocket Gateway có thể truy cập được.

    Tài liệu: [Kênh](/channels), [Khắc phục sự cố](/gateway/troubleshooting), [Truy cập từ xa](/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - bây giờ phải làm gì?'>
    Điều này thường có nghĩa là UI đã mất kết nối WebSocket. Kiểm tra:

    1. Gateway có đang chạy không? `openclaw gateway status`
    2. Gateway có khỏe không? `openclaw status`
    3. UI có mã thông báo đúng không? `openclaw dashboard`
    4. Nếu từ xa, liên kết đường hầm/Tailscale có hoạt động không?

    Sau đó theo dõi log:

    ```bash
    openclaw logs --follow
    ```

    Tài liệu: [Dashboard](/web/dashboard), [Truy cập từ xa](/gateway/remote), [Khắc phục sự cố](/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands thất bại. Tôi nên kiểm tra gì?">
    Bắt đầu với log và trạng thái kênh:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Sau đó khớp lỗi:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram có quá nhiều mục. OpenClaw đã cắt giảm đến giới hạn Telegram và thử lại với ít lệnh hơn, nhưng một số mục menu vẫn cần được loại bỏ. Giảm lệnh plugin/kỹ năng/tùy chỉnh, hoặc vô hiệu hóa `channels.telegram.commands.native` nếu bạn không cần menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, hoặc lỗi mạng tương tự: nếu bạn đang trên VPS hoặc sau một proxy, xác nhận HTTPS ra ngoài được phép và DNS hoạt động cho `api.telegram.org`.

    Nếu Gateway là từ xa, đảm bảo bạn đang xem log trên máy chủ Gateway.

    Tài liệu: [Telegram](/channels/telegram), [Khắc phục sự cố kênh](/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI không hiển thị đầu ra. Tôi nên kiểm tra gì?">
    Đầu tiên xác nhận Gateway có thể truy cập và tác nhân có thể chạy:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Trong TUI, sử dụng `/status` để xem trạng thái hiện tại. Nếu bạn mong đợi phản hồi trong một kênh trò chuyện,
    đảm bảo việc giao hàng được bật (`/deliver on`).

    Tài liệu: [TUI](/web/tui), [Lệnh gạch chéo](/tools/slash-commands).

  </Accordion>

  <Accordion title="Làm thế nào để tôi hoàn toàn dừng sau đó khởi động Gateway?">
    Nếu bạn đã cài đặt dịch vụ:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Điều này dừng/khởi động **dịch vụ giám sát** (launchd trên macOS, systemd trên Linux).
    Sử dụng điều này khi Gateway chạy ở chế độ nền như một daemon.

    Nếu bạn đang chạy ở chế độ nền, dừng với Ctrl-C, sau đó:

    ```bash
    openclaw gateway run
    ```

    Tài liệu: [Sổ tay dịch vụ Gateway](/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: khởi động lại **dịch vụ nền** (launchd/systemd).
    - `openclaw gateway`: chạy gateway **ở chế độ nền** cho phiên terminal này.

    Nếu bạn đã cài đặt dịch vụ, sử dụng các lệnh gateway. Sử dụng `openclaw gateway` khi
    bạn muốn một lần chạy nền.

  </Accordion>

  <Accordion title="Cách nhanh nhất để có thêm chi tiết khi có gì đó thất bại">
    Khởi động Gateway với `--verbose` để có thêm chi tiết console. Sau đó kiểm tra tệp log để biết xác thực kênh, định tuyến mô hình, và lỗi RPC.
  </Accordion>
</AccordionGroup>

## Phương tiện và tệp đính kèm

<AccordionGroup>
  <Accordion title="Kỹ năng của tôi đã tạo ra một hình ảnh/PDF, nhưng không có gì được gửi">
    Các tệp đính kèm gửi đi từ tác nhân phải bao gồm một dòng `MEDIA:<path-or-url>` (trên dòng riêng của nó). Xem [Thiết lập trợ lý OpenClaw](/start/openclaw) và [Gửi tác nhân](/tools/agent-send).

    Gửi qua CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Cũng kiểm tra:

    - Kênh mục tiêu hỗ trợ phương tiện gửi đi và không bị chặn bởi danh sách cho phép.
    - Tệp nằm trong giới hạn kích thước của nhà cung cấp (hình ảnh được thay đổi kích thước tối đa 2048px).

    Xem [Hình ảnh](/nodes/images).

  </Accordion>
</AccordionGroup>

## Bảo mật và kiểm soát truy cập

<AccordionGroup>
  <Accordion title="Có an toàn khi để OpenClaw nhận tin nhắn trực tiếp (DM) không?">
    Hãy coi tin nhắn trực tiếp (DM) như là dữ liệu không đáng tin cậy. Các thiết lập mặc định được thiết kế để giảm thiểu rủi ro:

    - Hành vi mặc định trên các kênh có khả năng DM là **pairing**:
      - Người gửi không xác định sẽ nhận mã pairing; bot không xử lý tin nhắn của họ.
      - Phê duyệt với: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Yêu cầu đang chờ xử lý bị giới hạn ở **3 mỗi kênh**; kiểm tra `openclaw pairing list --channel <channel> [--account <id>]` nếu không nhận được mã.
    - Mở DM công khai yêu cầu phải chọn tham gia rõ ràng (`dmPolicy: "open"` và danh sách cho phép `"*"`).

    Chạy `openclaw doctor` để phát hiện các chính sách DM có rủi ro.

  </Accordion>

  <Accordion title="Chỉ có bot công khai mới lo ngại về prompt injection?">
    Không. Prompt injection liên quan đến **nội dung không đáng tin cậy**, không chỉ ai có thể DM bot.
    Nếu trợ lý của bạn đọc nội dung bên ngoài (tìm kiếm/lấy dữ liệu web, trang trình duyệt, email,
    tài liệu, tệp đính kèm, nhật ký dán), nội dung đó có thể chứa hướng dẫn cố gắng chiếm quyền điều khiển mô hình. Điều này có thể xảy ra ngay cả khi **bạn là người gửi duy nhất**.

    Rủi ro lớn nhất là khi các công cụ được kích hoạt: mô hình có thể bị lừa để
    lấy cắp ngữ cảnh hoặc gọi công cụ thay bạn. Giảm thiểu rủi ro bằng cách:

    - sử dụng một agent "đọc" chỉ đọc hoặc không có công cụ để tóm tắt nội dung không đáng tin cậy
    - giữ `web_search` / `web_fetch` / `browser` tắt cho các agent có công cụ
    - sử dụng sandbox và danh sách cho phép công cụ nghiêm ngặt

    Chi tiết: [Bảo mật](/gateway/security).

  </Accordion>

  <Accordion title="Bot của tôi có nên có email, tài khoản GitHub, hoặc số điện thoại riêng không?">
    Có, đối với hầu hết các thiết lập. Cách ly bot với các tài khoản và số điện thoại riêng
    giúp giảm thiểu rủi ro nếu có sự cố xảy ra. Điều này cũng giúp dễ dàng xoay vòng
    thông tin xác thực hoặc thu hồi quyền truy cập mà không ảnh hưởng đến tài khoản cá nhân của bạn.

    Bắt đầu nhỏ. Chỉ cấp quyền truy cập vào các công cụ và tài khoản bạn thực sự cần, và mở rộng
    sau nếu cần thiết.

    Tài liệu: [Bảo mật](/gateway/security), [Pairing](/channels/pairing).

  </Accordion>

  <Accordion title="Tôi có thể cho phép nó tự động quản lý tin nhắn văn bản của mình và điều đó có an toàn không?">
    Chúng tôi **không** khuyến nghị cho phép tự động hoàn toàn quản lý tin nhắn cá nhân của bạn. Mô hình an toàn nhất là:

    - Giữ DM ở chế độ **pairing** hoặc danh sách cho phép chặt chẽ.
    - Sử dụng **số hoặc tài khoản riêng** nếu bạn muốn nó nhắn tin thay bạn.
    - Để nó soạn thảo, sau đó **phê duyệt trước khi gửi**.

    Nếu bạn muốn thử nghiệm, hãy thực hiện trên một tài khoản riêng biệt và giữ nó cách ly. Xem
    [Bảo mật](/gateway/security).

  </Accordion>

  <Accordion title="Tôi có thể sử dụng mô hình rẻ hơn cho các tác vụ trợ lý cá nhân không?">
    Có, **nếu** agent chỉ chat và đầu vào là đáng tin cậy. Các mô hình nhỏ hơn dễ bị tấn công chiếm quyền điều khiển, vì vậy tránh sử dụng chúng cho các agent có công cụ hoặc khi đọc nội dung không đáng tin cậy. Nếu bạn phải sử dụng mô hình nhỏ hơn, hãy khóa công cụ và chạy trong sandbox. Xem [Bảo mật](/gateway/security).
  </Accordion>

  <Accordion title="Tôi đã chạy /start trong Telegram nhưng không nhận được mã pairing">
    Mã pairing chỉ được gửi **khi** một người gửi không xác định nhắn tin cho bot và
    `dmPolicy: "pairing"` được kích hoạt. `/start` tự nó không tạo mã.

    Kiểm tra các yêu cầu đang chờ xử lý:

    ```bash
    openclaw pairing list telegram
    ```

    Nếu bạn muốn truy cập ngay lập tức, hãy thêm id người gửi vào danh sách cho phép hoặc đặt `dmPolicy: "open"`
    cho tài khoản đó.

  </Accordion>

  <Accordion title="WhatsApp: nó có nhắn tin cho danh bạ của tôi không? Pairing hoạt động như thế nào?">
    Không. Chính sách DM mặc định của WhatsApp là **pairing**. Người gửi không xác định chỉ nhận mã pairing và tin nhắn của họ **không được xử lý**. OpenClaw chỉ trả lời các cuộc trò chuyện mà nó nhận được hoặc các gửi đi rõ ràng mà bạn kích hoạt.

    Phê duyệt pairing với:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Liệt kê các yêu cầu đang chờ xử lý:

    ```bash
    openclaw pairing list whatsapp
    ```

    Nhắc nhở số điện thoại của wizard: nó được sử dụng để thiết lập **danh sách cho phép/chủ sở hữu** để DM của bạn được phép. Nó không được sử dụng để tự động gửi. Nếu bạn chạy trên số WhatsApp cá nhân của mình, hãy sử dụng số đó và kích hoạt `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Lệnh chat, hủy tác vụ, và "nó sẽ không dừng lại"

<AccordionGroup>
  <Accordion title="Làm thế nào để ngăn các tin nhắn hệ thống nội bộ hiển thị trong chat?">
    Hầu hết các tin nhắn nội bộ hoặc công cụ chỉ xuất hiện khi **verbose** hoặc **reasoning** được kích hoạt
    cho phiên đó.

    Sửa trong chat nơi bạn thấy nó:

    ```
    /verbose off
    /reasoning off
    ```

    Nếu vẫn còn ồn ào, kiểm tra cài đặt phiên trong Control UI và đặt verbose
    thành **inherit**. Cũng xác nhận bạn không sử dụng hồ sơ bot với `verboseDefault` đặt
    thành `on` trong cấu hình.

    Tài liệu: [Suy nghĩ và verbose](/tools/thinking), [Bảo mật](/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Làm thế nào để dừng/hủy một tác vụ đang chạy?">
    Gửi bất kỳ lệnh nào sau đây **như một tin nhắn độc lập** (không có dấu gạch chéo):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Đây là các kích hoạt hủy (không phải lệnh gạch chéo).

    Đối với các quy trình nền (từ công cụ exec), bạn có thể yêu cầu agent chạy:

    ```
    process action:kill sessionId:XXX
    ```

    Tổng quan về lệnh gạch chéo: xem [Lệnh gạch chéo](/tools/slash-commands).

    Hầu hết các lệnh phải được gửi như một tin nhắn **độc lập** bắt đầu bằng `/`, nhưng một số phím tắt (như `/status`) cũng hoạt động nội tuyến cho người gửi trong danh sách cho phép.

  </Accordion>

  <Accordion title='Làm thế nào để gửi tin nhắn Discord từ Telegram? ("Cross-context messaging denied")'>
    OpenClaw chặn nhắn tin **giữa các nhà cung cấp** theo mặc định. Nếu một cuộc gọi công cụ được ràng buộc
    với Telegram, nó sẽ không gửi đến Discord trừ khi bạn cho phép rõ ràng.

    Kích hoạt nhắn tin giữa các nhà cung cấp cho agent:

    ```json5
    {
      agents: {
        defaults: {
          tools: {
            message: {
              crossContext: {
                allowAcrossProviders: true,
                marker: { enabled: true, prefix: "[from {channel}] " },
              },
            },
          },
        },
      },
    }
    ```

    Khởi động lại gateway sau khi chỉnh sửa cấu hình. Nếu bạn chỉ muốn điều này cho một
    agent duy nhất, hãy đặt nó dưới `agents.list[].tools.message`.

  </Accordion>

  <Accordion title='Tại sao cảm giác như bot "bỏ qua" các tin nhắn gửi nhanh?'>
    Chế độ hàng đợi kiểm soát cách các tin nhắn mới tương tác với một tác vụ đang chạy. Sử dụng `/queue` để thay đổi chế độ:

    - `steer` - tin nhắn mới điều hướng tác vụ hiện tại
    - `followup` - chạy tin nhắn từng cái một
    - `collect` - gom tin nhắn và trả lời một lần (mặc định)
    - `steer-backlog` - điều hướng ngay, sau đó xử lý backlog
    - `interrupt` - hủy chạy hiện tại và bắt đầu lại

    Bạn có thể thêm các tùy chọn như `debounce:2s cap:25 drop:summarize` cho các chế độ followup.

  </Accordion>
</AccordionGroup>

## Khác

<AccordionGroup>
  <Accordion title='Mô hình mặc định cho Anthropic với khóa API là gì?'>
    Trong OpenClaw, thông tin xác thực và lựa chọn mô hình là riêng biệt. Thiết lập `ANTHROPIC_API_KEY` (hoặc lưu khóa API Anthropic trong hồ sơ xác thực) cho phép xác thực, nhưng mô hình mặc định thực tế là bất kỳ mô hình nào bạn cấu hình trong `agents.defaults.model.primary` (ví dụ, `anthropic/claude-sonnet-4-6` hoặc `anthropic/claude-opus-4-6`). Nếu bạn thấy `No credentials found for profile "anthropic:default"`, điều đó có nghĩa là Gateway không thể tìm thấy thông tin xác thực Anthropic trong `auth-profiles.json` như mong đợi cho agent đang chạy.
  </Accordion>
</AccordionGroup>

---

Vẫn gặp khó khăn? Hỏi trong [Discord](https://discord.com/invite/clawd) hoặc mở một [thảo luận trên GitHub](https://github.com/openclaw/openclaw/discussions).
