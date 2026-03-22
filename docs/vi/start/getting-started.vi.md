# Bắt đầu với OpenClaw

Cài đặt OpenClaw, chạy onboarding và chat với AI assistant chỉ trong khoảng 5 phút. Sau khi hoàn tất, bạn sẽ có một Gateway đang chạy, cấu hình auth và một phiên chat hoạt động.

## Cần chuẩn bị

- **Node.js** — Khuyến nghị Node 24 (Node 22.16+ cũng hỗ trợ)
- **API key** từ một model provider (Anthropic, OpenAI, Google, v.v.) — onboarding sẽ yêu cầu

<Tip>
Kiểm tra phiên bản Node với `node --version`.
**Người dùng Windows:** hỗ trợ cả Windows native và WSL2. WSL2 ổn định hơn và được khuyến nghị. Xem thêm [Windows](/platforms/windows).
Cần cài Node? Xem [Node setup](/install/node).
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
    Các phương pháp cài đặt khác (Docker, Nix, npm): [Install](/install).
    </Note>

  </Step>
  <Step title="Chạy onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Wizard sẽ hướng dẫn chọn model provider, thiết lập API key và cấu hình Gateway. Mất khoảng 2 phút.

    Xem thêm [Onboarding (CLI)](/start/wizard) để biết chi tiết.

  </Step>
  <Step title="Kiểm tra Gateway đang chạy">
    ```bash
    openclaw gateway status
    ```

    Bạn sẽ thấy Gateway đang lắng nghe trên cổng 18789.

  </Step>
  <Step title="Mở dashboard">
    ```bash
    openclaw dashboard
    ```

    Mở Control UI trong trình duyệt. Nếu tải được, mọi thứ đã hoạt động.

  </Step>
  <Step title="Gửi tin nhắn đầu tiên">
    Nhập tin nhắn trong Control UI chat và bạn sẽ nhận được phản hồi từ AI.

    Muốn chat từ điện thoại? Kênh nhanh nhất để thiết lập là [Telegram](/channels/telegram) (chỉ cần bot token). Xem [Channels](/channels) để biết thêm tùy chọn.

  </Step>
</Steps>

## Tiếp theo làm gì

<Columns>
  <Card title="Kết nối kênh" href="/channels" icon="message-square">
    WhatsApp, Telegram, Discord, iMessage và nhiều hơn nữa.
  </Card>
  <Card title="Ghép đôi và bảo mật" href="/channels/pairing" icon="shield">
    Kiểm soát ai có thể nhắn tin với agent.
  </Card>
  <Card title="Cấu hình Gateway" href="/gateway/configuration" icon="settings">
    Models, công cụ, sandbox và cài đặt nâng cao.
  </Card>
  <Card title="Duyệt công cụ" href="/tools" icon="wrench">
    Trình duyệt, exec, tìm kiếm web, kỹ năng và plugins.
  </Card>
</Columns>

<Accordion title="Nâng cao: biến môi trường">
  Nếu chạy OpenClaw dưới dạng service account hoặc muốn đường dẫn tùy chỉnh:

- `OPENCLAW_HOME` — thư mục home cho việc giải quyết đường dẫn nội bộ
- `OPENCLAW_STATE_DIR` — ghi đè thư mục state
- `OPENCLAW_CONFIG_PATH` — ghi đè đường dẫn file config

Tham khảo đầy đủ: [Environment variables](/help/environment).
</Accordion>\n