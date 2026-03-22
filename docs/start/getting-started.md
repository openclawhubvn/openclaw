---
summary: "Cài đặt OpenClaw và bắt đầu cuộc trò chuyện đầu tiên chỉ trong vài phút."
read_when:
  - Thiết lập lần đầu từ đầu
  - Bạn muốn con đường nhanh nhất để có một cuộc trò chuyện hoạt động
title: "Bắt đầu"
---

# Bắt đầu

Cài đặt OpenClaw, chạy onboarding và trò chuyện với trợ lý AI của bạn — tất cả chỉ trong khoảng 5 phút. Sau khi hoàn tất, bạn sẽ có một Gateway đang chạy, cấu hình xác thực và một phiên trò chuyện hoạt động.

## Những gì bạn cần

- **Node.js** — Khuyến nghị sử dụng Node 24 (Node 22.16+ cũng được hỗ trợ)
- **Một API key** từ nhà cung cấp mô hình (Anthropic, OpenAI, Google, v.v.) — onboarding sẽ yêu cầu bạn cung cấp

<Tip>
Kiểm tra phiên bản Node của bạn với `node --version`.
**Người dùng Windows:** cả Windows gốc và WSL2 đều được hỗ trợ. WSL2 ổn định hơn và được khuyến nghị để có trải nghiệm đầy đủ. Xem [Windows](/platforms/windows).
Cần cài đặt Node? Xem [Cài đặt Node](/install/node).
</Tip>

## Thiết lập nhanh

<Steps>
  <Step title="Cài đặt OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Quá trình cài đặt script"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Các phương pháp cài đặt khác (Docker, Nix, npm): [Cài đặt](/install).
    </Note>

  </Step>
  <Step title="Chạy onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Trình hướng dẫn sẽ giúp bạn chọn nhà cung cấp mô hình, thiết lập API key và cấu hình Gateway. Quá trình này mất khoảng 2 phút.

    Xem [Onboarding (CLI)](/start/wizard) để tham khảo đầy đủ.

  </Step>
  <Step title="Xác minh Gateway đang chạy">
    ```bash
    openclaw gateway status
    ```

    Bạn sẽ thấy Gateway đang lắng nghe trên cổng 18789.

  </Step>
  <Step title="Mở dashboard">
    ```bash
    openclaw dashboard
    ```

    Điều này sẽ mở giao diện điều khiển trong trình duyệt của bạn. Nếu nó tải được, mọi thứ đang hoạt động.

  </Step>
  <Step title="Gửi tin nhắn đầu tiên của bạn">
    Nhập một tin nhắn trong giao diện điều khiển và bạn sẽ nhận được phản hồi từ AI.

    Muốn trò chuyện từ điện thoại của bạn? Kênh nhanh nhất để thiết lập là [Telegram](/channels/telegram) (chỉ cần một bot token). Xem [Kênh](/channels) để biết tất cả các tùy chọn.

  </Step>
</Steps>

## Làm gì tiếp theo

<Columns>
  <Card title="Kết nối một kênh" href="/channels" icon="message-square">
    WhatsApp, Telegram, Discord, iMessage và nhiều hơn nữa.
  </Card>
  <Card title="Ghép đôi và an toàn" href="/channels/pairing" icon="shield">
    Kiểm soát ai có thể nhắn tin cho agent của bạn.
  </Card>
  <Card title="Cấu hình Gateway" href="/gateway/configuration" icon="settings">
    Mô hình, công cụ, sandbox và cài đặt nâng cao.
  </Card>
  <Card title="Duyệt công cụ" href="/tools" icon="wrench">
    Trình duyệt, exec, tìm kiếm web, kỹ năng và plugin.
  </Card>
</Columns>

<Accordion title="Nâng cao: biến môi trường">
  Nếu bạn chạy OpenClaw dưới dạng tài khoản dịch vụ hoặc muốn đường dẫn tùy chỉnh:

- `OPENCLAW_HOME` — thư mục chính để giải quyết đường dẫn nội bộ
- `OPENCLAW_STATE_DIR` — ghi đè thư mục trạng thái
- `OPENCLAW_CONFIG_PATH` — ghi đè đường dẫn tệp cấu hình

Tham khảo đầy đủ: [Biến môi trường](/help/environment).
</Accordion>
