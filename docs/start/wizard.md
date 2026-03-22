---
summary: "Thiết lập gateway, workspace, kênh và kỹ năng với hướng dẫn CLI chi tiết. Bắt đầu nhanh chóng và hiệu quả."
read_when:
  - Chạy hoặc cấu hình CLI onboarding
  - Thiết lập máy mới
title: "Hướng Dẫn Onboarding CLI OpenClaw"
sidebarTitle: "Onboarding: CLI"
---

# Onboarding (CLI)

CLI onboarding là cách **được khuyến nghị** để thiết lập OpenClaw trên macOS, Linux hoặc Windows (qua WSL2; rất khuyến nghị). Nó cấu hình một Gateway cục bộ hoặc kết nối Gateway từ xa, cùng với các kênh, kỹ năng và mặc định workspace trong một quy trình hướng dẫn.

```bash
openclaw onboard
```

<Info>
Chat nhanh nhất: mở Control UI (không cần thiết lập kênh). Chạy `openclaw dashboard` và chat trong trình duyệt. Tài liệu: [Dashboard](/web/dashboard).
</Info>

Để cấu hình lại sau:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` không có nghĩa là chế độ không tương tác. Đối với script, sử dụng `--non-interactive`.
</Note>

<Tip>
CLI onboarding bao gồm bước tìm kiếm web nơi bạn có thể chọn nhà cung cấp (Perplexity, Brave, Gemini, Grok, hoặc Kimi) và dán API key để agent có thể sử dụng `web_search`. Bạn cũng có thể cấu hình điều này sau với `openclaw configure --section web`. Tài liệu: [Web tools](/tools/web).
</Tip>

## QuickStart vs Advanced

Onboarding bắt đầu với **QuickStart** (mặc định) hoặc **Advanced** (kiểm soát đầy đủ).

<Tabs>
  <Tab title="QuickStart (mặc định)">
    - Gateway cục bộ (loopback)
    - Mặc định workspace (hoặc workspace hiện có)
    - Cổng Gateway **18789**
    - Xác thực Gateway **Token** (tự động tạo, ngay cả trên loopback)
    - Chính sách công cụ mặc định cho thiết lập cục bộ mới: `tools.profile: "coding"` (hồ sơ rõ ràng hiện có được giữ nguyên)
    - Mặc định cô lập DM: onboarding cục bộ ghi `session.dmScope: "per-channel-peer"` khi chưa đặt. Chi tiết: [CLI Setup Reference](/start/wizard-cli-reference#outputs-and-internals)
    - Phơi bày Tailscale **Tắt**
    - DM Telegram + WhatsApp mặc định là **danh sách cho phép** (bạn sẽ được yêu cầu nhập số điện thoại)
  </Tab>
  <Tab title="Advanced (kiểm soát đầy đủ)">
    - Hiển thị từng bước (chế độ, workspace, gateway, kênh, daemon, kỹ năng).
  </Tab>
</Tabs>

## Những gì onboarding cấu hình

**Chế độ cục bộ (mặc định)** hướng dẫn bạn qua các bước sau:

1. **Model/Auth** — chọn bất kỳ nhà cung cấp/hình thức xác thực nào được hỗ trợ (API key, OAuth, hoặc setup-token), bao gồm Nhà cung cấp Tùy chỉnh (tương thích OpenAI, tương thích Anthropic, hoặc Tự động phát hiện Không xác định). Chọn mô hình mặc định. Lưu ý bảo mật: nếu agent này sẽ chạy công cụ hoặc xử lý nội dung webhook/hooks, nên chọn mô hình thế hệ mới nhất mạnh nhất có sẵn và giữ chính sách công cụ nghiêm ngặt. Các cấp yếu hơn/cũ hơn dễ bị tiêm lệnh. Đối với các lần chạy không tương tác, `--secret-input-mode ref` lưu trữ tham chiếu dựa trên môi trường trong hồ sơ xác thực thay vì giá trị API key dạng văn bản thuần túy. Trong chế độ `ref` không tương tác, biến môi trường nhà cung cấp phải được đặt; truyền cờ khóa nội tuyến mà không có biến môi trường đó sẽ thất bại nhanh chóng. Trong các lần chạy tương tác, chọn chế độ tham chiếu bí mật cho phép bạn chỉ định biến môi trường hoặc tham chiếu nhà cung cấp đã cấu hình (`file` hoặc `exec`), với xác thực nhanh trước khi lưu.
2. **Workspace** — Vị trí cho các tệp agent (mặc định `~/.openclaw/workspace`). Khởi tạo các tệp bootstrap.
3. **Gateway** — Cổng, địa chỉ bind, chế độ xác thực, phơi bày Tailscale. Trong chế độ token tương tác, chọn lưu trữ token dạng văn bản thuần túy mặc định hoặc chọn SecretRef. Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kênh** — WhatsApp, Telegram, Discord, Google Chat, Mattermost, Signal, BlueBubbles, hoặc iMessage.
5. **Daemon** — Cài đặt LaunchAgent (macOS) hoặc đơn vị người dùng systemd (Linux/WSL2). Nếu xác thực token yêu cầu token và `gateway.auth.token` được quản lý bởi SecretRef, cài đặt daemon xác thực nó nhưng không lưu trữ token đã giải quyết vào siêu dữ liệu môi trường dịch vụ giám sát. Nếu xác thực token yêu cầu token và SecretRef token đã cấu hình chưa được giải quyết, cài đặt daemon bị chặn với hướng dẫn có thể thực hiện. Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, cài đặt daemon bị chặn cho đến khi chế độ được đặt rõ ràng.
6. **Kiểm tra sức khỏe** — Khởi động Gateway và xác minh nó đang chạy.
7. **Kỹ năng** — Cài đặt các kỹ năng được khuyến nghị và các phụ thuộc tùy chọn.

<Note>
Chạy lại onboarding **không** xóa bất cứ thứ gì trừ khi bạn chọn **Reset** (hoặc truyền `--reset`). CLI `--reset` mặc định là cấu hình, thông tin xác thực và phiên; sử dụng `--reset-scope full` để bao gồm workspace. Nếu cấu hình không hợp lệ hoặc chứa các khóa cũ, onboarding yêu cầu bạn chạy `openclaw doctor` trước.
</Note>

**Chế độ từ xa** chỉ cấu hình client cục bộ để kết nối với Gateway ở nơi khác. Nó **không** cài đặt hoặc thay đổi bất cứ thứ gì trên máy chủ từ xa.

## Thêm agent khác

Sử dụng `openclaw agents add <name>` để tạo một agent riêng với workspace, phiên và hồ sơ xác thực riêng. Chạy mà không có `--workspace` sẽ khởi động onboarding.

Những gì nó thiết lập:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Lưu ý:

- Workspace mặc định theo `~/.openclaw/workspace-<agentId>`.
- Thêm `bindings` để định tuyến tin nhắn đến (onboarding có thể làm điều này).
- Cờ không tương tác: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tham khảo đầy đủ

Để có hướng dẫn chi tiết từng bước và đầu ra cấu hình, xem [CLI Setup Reference](/start/wizard-cli-reference). Đối với các ví dụ không tương tác, xem [CLI Automation](/start/wizard-cli-automation). Để tham khảo kỹ thuật sâu hơn, bao gồm chi tiết RPC, xem [Onboarding Reference](/reference/wizard).

## Tài liệu liên quan

- Tham khảo lệnh CLI: [`openclaw onboard`](/cli/onboard)
- Tổng quan về onboarding: [Onboarding Overview](/start/onboarding-overview)
- Onboarding ứng dụng macOS: [Onboarding](/start/onboarding)
- Nghi thức chạy đầu tiên của Agent: [Agent Bootstrapping](/start/bootstrapping)
