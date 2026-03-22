---
summary: "Khám phá cách giải quyết các sự cố phổ biến trên OpenClaw, giúp bạn nhanh chóng khắc phục và tối ưu hóa hệ thống."
read_when:
  - OpenClaw không hoạt động và cần tìm cách khắc phục nhanh nhất
  - Muốn có quy trình phân loại trước khi đi sâu vào tài liệu chi tiết
title: "Hướng Dẫn Xử Lý Sự Cố OpenClaw"
---

# Xử lý sự cố

Nếu chỉ có 2 phút, hãy sử dụng trang này như một điểm khởi đầu để phân loại sự cố.

## 60 giây đầu tiên

Thực hiện theo thứ tự các lệnh sau:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Kết quả tốt trong một dòng:

- `openclaw status` → hiển thị các kênh đã cấu hình và không có lỗi xác thực rõ ràng.
- `openclaw status --all` → báo cáo đầy đủ có sẵn và có thể chia sẻ.
- `openclaw gateway probe` → mục tiêu gateway mong đợi có thể truy cập (`Reachable: yes`). `RPC: limited - missing scope: operator.read` là chẩn đoán suy giảm, không phải lỗi kết nối.
- `openclaw gateway status` → `Runtime: running` và `RPC probe: ok`.
- `openclaw doctor` → không có lỗi cấu hình/dịch vụ chặn.
- `openclaw channels status --probe` → các kênh báo cáo `connected` hoặc `ready`.
- `openclaw logs --follow` → hoạt động ổn định, không có lỗi nghiêm trọng lặp lại.

## Anthropic long context 429

Nếu thấy:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
hãy truy cập [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Cài đặt plugin thất bại do thiếu openclaw extensions

Nếu cài đặt thất bại với lỗi `package.json missing openclaw.extensions`, gói plugin đang sử dụng cấu trúc cũ mà OpenClaw không còn chấp nhận.

Khắc phục trong gói plugin:

1. Thêm `openclaw.extensions` vào `package.json`.
2. Chỉ định các mục nhập đến các file runtime đã xây dựng (thường là `./dist/index.js`).
3. Xuất bản lại plugin và chạy `openclaw plugins install <npm-spec>` lại.

Ví dụ:

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Tham khảo: [Kiến trúc Plugin](/plugins/architecture)

## Cây quyết định

```mermaid
flowchart TD
  A[OpenClaw không hoạt động] --> B{Điều gì bị hỏng đầu tiên}
  B --> C[Không có phản hồi]
  B --> D[Dashboard hoặc Control UI không kết nối được]
  B --> E[Gateway không khởi động hoặc dịch vụ không chạy]
  B --> F[Kênh kết nối nhưng tin nhắn không truyền]
  B --> G[Cron hoặc heartbeat không kích hoạt hoặc không gửi]
  B --> H[Node đã ghép đôi nhưng công cụ camera canvas không thực thi]
  B --> I[Công cụ trình duyệt thất bại]

  C --> C1[/Phần không có phản hồi/]
  D --> D1[/Phần Control UI/]
  E --> E1[/Phần Gateway/]
  F --> F1[/Phần luồng kênh/]
  G --> G1[/Phần tự động hóa/]
  H --> H1[/Phần công cụ Node/]
  I --> I1[/Phần trình duyệt/]
```

<AccordionGroup>
  <Accordion title="Không có phản hồi">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    Kết quả tốt trông như:

    - `Runtime: running`
    - `RPC probe: ok`
    - Kênh của bạn hiển thị kết nối/sẵn sàng trong `channels status --probe`
    - Người gửi được phê duyệt (hoặc chính sách DM mở/danh sách cho phép)

    Các dấu hiệu nhật ký phổ biến:

    - `drop guild message (mention required` → chặn tin nhắn trong Discord do yêu cầu nhắc đến.
    - `pairing request` → người gửi chưa được phê duyệt và đang chờ phê duyệt ghép đôi DM.
    - `blocked` / `allowlist` trong nhật ký kênh → người gửi, phòng, hoặc nhóm bị lọc.

    Các trang chi tiết:

    - [/gateway/troubleshooting#no-replies](/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/channels/troubleshooting)
    - [/channels/pairing](/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard hoặc Control UI không kết nối được">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Kết quả tốt trông như:

    - `Dashboard: http://...` được hiển thị trong `openclaw gateway status`
    - `RPC probe: ok`
    - Không có vòng lặp xác thực trong nhật ký

    Các dấu hiệu nhật ký phổ biến:

    - `device identity required` → HTTP/ngữ cảnh không bảo mật không thể hoàn tất xác thực thiết bị.
    - `AUTH_TOKEN_MISMATCH` với gợi ý thử lại (`canRetryWithDeviceToken=true`) → một lần thử lại với token thiết bị đáng tin cậy có thể tự động xảy ra.
    - lặp lại `unauthorized` sau lần thử lại đó → token/mật khẩu sai, chế độ xác thực không khớp, hoặc token thiết bị ghép đôi đã cũ.
    - `gateway connect failed:` → UI đang nhắm đến URL/cổng sai hoặc gateway không thể truy cập.

    Các trang chi tiết:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/web/control-ui)
    - [/gateway/authentication](/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway không khởi động hoặc dịch vụ đã cài đặt nhưng không chạy">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Kết quả tốt trông như:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `RPC probe: ok`

    Các dấu hiệu nhật ký phổ biến:

    - `Gateway start blocked: set gateway.mode=local` → chế độ gateway chưa được đặt/cách xa.
    - `refusing to bind gateway ... without auth` → không thể kết nối không vòng lặp mà không có token/mật khẩu.
    - `another gateway instance is already listening` hoặc `EADDRINUSE` → cổng đã bị chiếm.

    Các trang chi tiết:

    - [/gateway/troubleshooting#gateway-service-not-running](/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/gateway/background-process)
    - [/gateway/configuration](/gateway/configuration)

  </Accordion>

  <Accordion title="Kênh kết nối nhưng tin nhắn không truyền">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Kết quả tốt trông như:

    - Kênh vận chuyển đã kết nối.
    - Kiểm tra ghép đôi/danh sách cho phép thành công.
    - Nhắc đến được phát hiện khi cần thiết.

    Các dấu hiệu nhật ký phổ biến:

    - `mention required` → chặn xử lý do yêu cầu nhắc đến nhóm.
    - `pairing` / `pending` → người gửi DM chưa được phê duyệt.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → vấn đề với token quyền kênh.

    Các trang chi tiết:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron hoặc heartbeat không kích hoạt hoặc không gửi">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    Kết quả tốt trông như:

    - `cron.status` hiển thị đã bật với lần thức dậy tiếp theo.
    - `cron runs` hiển thị các mục `ok` gần đây.
    - Heartbeat đã bật và không nằm ngoài giờ hoạt động.

    Các dấu hiệu nhật ký phổ biến:

    - `cron: scheduler disabled; jobs will not run automatically` → cron bị vô hiệu hóa.
    - `heartbeat skipped` với `reason=quiet-hours` → ngoài giờ hoạt động đã cấu hình.
    - `requests-in-flight` → làn chính bận; thức dậy heartbeat bị hoãn.
    - `unknown accountId` → tài khoản mục tiêu gửi heartbeat không tồn tại.

    Các trang chi tiết:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/troubleshooting](/automation/troubleshooting)
    - [/gateway/heartbeat](/gateway/heartbeat)

  </Accordion>

  <Accordion title="Node đã ghép đôi nhưng công cụ thất bại khi thực thi camera canvas">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw nodes status
    openclaw nodes describe --node <idOrNameOrIp>
    openclaw logs --follow
    ```

    Kết quả tốt trông như:

    - Node được liệt kê là đã kết nối và ghép đôi cho vai trò `node`.
    - Có khả năng cho lệnh bạn đang gọi.
    - Trạng thái quyền được cấp cho công cụ.

    Các dấu hiệu nhật ký phổ biến:

    - `NODE_BACKGROUND_UNAVAILABLE` → đưa ứng dụng node lên nền trước.
    - `*_PERMISSION_REQUIRED` → quyền hệ điều hành bị từ chối/thiếu.
    - `SYSTEM_RUN_DENIED: approval required` → phê duyệt thực thi đang chờ.
    - `SYSTEM_RUN_DENIED: allowlist miss` → lệnh không có trong danh sách cho phép thực thi.

    Các trang chi tiết:

    - [/gateway/troubleshooting#node-paired-tool-fails](/gateway/troubleshooting#node-paired-tool-fails)
    - [/nodes/troubleshooting](/nodes/troubleshooting)
    - [/tools/exec-approvals](/tools/exec-approvals)

  </Accordion>

  <Accordion title="Công cụ trình duyệt thất bại">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw browser status
    openclaw logs --follow
    openclaw doctor
    ```

    Kết quả tốt trông như:

    - Trạng thái trình duyệt hiển thị `running: true` và trình duyệt/hồ sơ đã chọn.
    - `openclaw` khởi động, hoặc `user` có thể thấy các tab Chrome cục bộ.

    Các dấu hiệu nhật ký phổ biến:

    - `Failed to start Chrome CDP on port` → khởi động trình duyệt cục bộ thất bại.
    - `browser.executablePath not found` → đường dẫn nhị phân cấu hình sai.
    - `No Chrome tabs found for profile="user"` → hồ sơ đính kèm Chrome MCP không có tab Chrome cục bộ mở.
    - `Browser attachOnly is enabled ... not reachable` → hồ sơ chỉ đính kèm không có mục tiêu CDP đang hoạt động.

    Các trang chi tiết:

    - [/gateway/troubleshooting#browser-tool-fails](/gateway/troubleshooting#browser-tool-fails)
    - [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
    - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

  </Accordion>
</AccordionGroup>
