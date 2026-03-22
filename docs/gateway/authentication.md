---
summary: "Khám phá cách cấu hình xác thực cho Gateway, đảm bảo an toàn và bảo mật tối ưu cho hệ thống của bạn."
read_when:
  - Khi debug lỗi xác thực model hoặc OAuth hết hạn
  - Khi tài liệu hóa quy trình xác thực hoặc cách lưu trữ thông tin đăng nhập
title: "Hướng Dẫn Cấu Hình Xác Thực Gateway"
---

# Xác thực

OpenClaw hỗ trợ OAuth và API keys cho các nhà cung cấp mô hình. Đối với các máy chủ gateway hoạt động liên tục, API keys thường là lựa chọn ổn định nhất. Các luồng đăng ký/OAuth cũng được hỗ trợ khi phù hợp với mô hình tài khoản của nhà cung cấp.

Xem [OAuth](/concepts/oauth) để biết chi tiết về luồng OAuth và cách lưu trữ. Đối với xác thực dựa trên SecretRef (`env`/`file`/`exec` providers), xem [Quản lý Secrets](/gateway/secrets). Để biết quy tắc về tính hợp lệ của thông tin xác thực được sử dụng bởi `models status --probe`, xem [Ngữ nghĩa Thông tin Xác thực](/auth-credential-semantics).

## Cài đặt đề xuất (API key, bất kỳ nhà cung cấp nào)

Nếu bạn đang chạy một gateway lâu dài, hãy bắt đầu với một API key cho nhà cung cấp bạn chọn. Đối với Anthropic, xác thực bằng API key là con đường an toàn và được khuyến nghị hơn so với xác thực bằng setup-token.

1. Tạo một API key trong bảng điều khiển của nhà cung cấp.
2. Đặt nó trên **máy chủ gateway** (máy chạy `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Nếu Gateway chạy dưới systemd/launchd, nên đặt key trong `~/.openclaw/.env` để daemon có thể đọc:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Sau đó khởi động lại daemon (hoặc khởi động lại quá trình Gateway) và kiểm tra lại:

```bash
openclaw models status
openclaw doctor
```

Nếu bạn không muốn tự quản lý biến môi trường, quá trình onboarding có thể lưu trữ API keys để daemon sử dụng: `openclaw onboard`.

Xem [Trợ giúp](/help) để biết chi tiết về kế thừa biến môi trường (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd).

## Anthropic: setup-token (xác thực đăng ký)

Nếu bạn đang sử dụng đăng ký Claude, luồng setup-token được hỗ trợ. Chạy nó trên **máy chủ gateway**:

```bash
claude setup-token
```

Sau đó dán vào OpenClaw:

```bash
openclaw models auth setup-token --provider anthropic
```

Nếu token được tạo trên máy khác, dán thủ công:

```bash
openclaw models auth paste-token --provider anthropic
```

Nếu bạn thấy lỗi Anthropic như:

```
Thông tin xác thực này chỉ được ủy quyền sử dụng với Claude Code và không thể sử dụng cho các yêu cầu API khác.
```

...hãy sử dụng một API key của Anthropic thay thế.

<Warning>
Hỗ trợ setup-token của Anthropic chỉ là tương thích kỹ thuật. Anthropic đã chặn một số sử dụng đăng ký ngoài Claude Code trong quá khứ. Chỉ sử dụng nếu bạn chấp nhận rủi ro chính sách và tự xác minh điều khoản hiện tại của Anthropic.
</Warning>

Nhập token thủ công (bất kỳ nhà cung cấp nào; ghi `auth-profiles.json` + cập nhật cấu hình):

```bash
openclaw models auth paste-token --provider anthropic
openclaw models auth paste-token --provider openrouter
```

Các tham chiếu hồ sơ xác thực cũng được hỗ trợ cho thông tin xác thực tĩnh:

- Thông tin xác thực `api_key` có thể sử dụng `keyRef: { source, provider, id }`
- Thông tin xác thực `token` có thể sử dụng `tokenRef: { source, provider, id }`

Kiểm tra thân thiện với tự động hóa (thoát `1` khi hết hạn/thiếu, `2` khi sắp hết hạn):

```bash
openclaw models status --check
```

Các script ops tùy chọn (systemd/Termux) được tài liệu hóa tại đây:
[/automation/auth-monitoring](/automation/auth-monitoring)

> `claude setup-token` yêu cầu một TTY tương tác.

## Kiểm tra trạng thái xác thực mô hình

```bash
openclaw models status
openclaw doctor
```

## Hành vi xoay vòng API key (gateway)

Một số nhà cung cấp hỗ trợ thử lại yêu cầu với các key thay thế khi một cuộc gọi API gặp giới hạn tốc độ của nhà cung cấp.

- Thứ tự ưu tiên:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (ghi đè đơn lẻ)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Các nhà cung cấp Google cũng bao gồm `GOOGLE_API_KEY` như một phương án dự phòng bổ sung.
- Danh sách key tương tự được loại bỏ trùng lặp trước khi sử dụng.
- OpenClaw chỉ thử lại với key tiếp theo cho các lỗi giới hạn tốc độ (ví dụ `429`, `rate_limit`, `quota`, `resource exhausted`).
- Các lỗi không phải giới hạn tốc độ không được thử lại với các key thay thế.
- Nếu tất cả các key đều thất bại, lỗi cuối cùng từ lần thử cuối cùng sẽ được trả về.

## Kiểm soát thông tin xác thực nào được sử dụng

### Theo phiên (lệnh chat)

Sử dụng `/model <alias-or-id>@<profileId>` để ghim một thông tin xác thực nhà cung cấp cụ thể cho phiên hiện tại (ví dụ id hồ sơ: `anthropic:default`, `anthropic:work`).

Sử dụng `/model` (hoặc `/model list`) để có một bộ chọn gọn; sử dụng `/model status` để xem đầy đủ (ứng viên + hồ sơ xác thực tiếp theo, cùng với chi tiết điểm cuối nhà cung cấp khi được cấu hình).

### Theo agent (ghi đè CLI)

Đặt một thứ tự ghi đè hồ sơ xác thực rõ ràng cho một agent (được lưu trữ trong `auth-profiles.json` của agent đó):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Sử dụng `--agent <id>` để nhắm mục tiêu một agent cụ thể; bỏ qua nó để sử dụng agent mặc định đã cấu hình.

## Khắc phục sự cố

### "Không tìm thấy thông tin xác thực"

Nếu hồ sơ token Anthropic bị thiếu, chạy `claude setup-token` trên **máy chủ gateway**, sau đó kiểm tra lại:

```bash
openclaw models status
```

### Token sắp hết hạn/đã hết hạn

Chạy `openclaw models status` để xác nhận hồ sơ nào sắp hết hạn. Nếu hồ sơ bị thiếu, chạy lại `claude setup-token` và dán lại token.

## Yêu cầu

- Tài khoản đăng ký Anthropic (cho `claude setup-token`)
- Đã cài đặt Claude Code CLI (lệnh `claude` có sẵn)
