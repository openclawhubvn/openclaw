---
summary: "Tìm hiểu cách chạy cầu nối ACP để tích hợp hiệu quả với IDE, giúp tối ưu hóa quy trình phát triển phần mềm của bạn."
read_when:
  - Thiết lập tích hợp IDE dựa trên ACP
  - Gỡ lỗi định tuyến phiên ACP đến Gateway
title: "Hướng Dẫn Cấu Hình ACP Cho IDE"
---

# acp

Chạy cầu nối [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) để kết nối với OpenClaw Gateway.

Lệnh này sử dụng ACP qua stdio cho IDEs và chuyển tiếp các yêu cầu đến Gateway qua WebSocket. Nó giữ các phiên ACP được ánh xạ đến các khóa phiên của Gateway.

`openclaw acp` là cầu nối ACP dựa trên Gateway, không phải là môi trường chạy hoàn toàn ACP-native. Nó tập trung vào định tuyến phiên, chuyển giao yêu cầu và cập nhật luồng cơ bản.

## Bảng Tương Thích

| Khu vực ACP                                                           | Trạng thái  | Ghi chú                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Đã triển khai | Luồng cầu nối chính qua stdio đến Gateway chat/gửi + hủy bỏ.                                                                                                                                                                                     |
| `listSessions`, lệnh gạch chéo                                        | Đã triển khai | Danh sách phiên hoạt động với trạng thái phiên Gateway; các lệnh được quảng cáo qua `available_commands_update`.                                                                                                                                  |
| `loadSession`                                                         | Một phần     | Liên kết lại phiên ACP với khóa phiên Gateway và phát lại lịch sử văn bản người dùng/trợ lý đã lưu trữ. Lịch sử công cụ/hệ thống chưa được tái tạo.                                                                                              |
| Nội dung yêu cầu (`text`, `resource` nhúng, hình ảnh)                 | Một phần     | Văn bản/tài nguyên được làm phẳng thành đầu vào chat; hình ảnh trở thành tệp đính kèm Gateway.                                                                                                                                                   |
| Chế độ phiên                                                          | Một phần     | `session/set_mode` được hỗ trợ và cầu nối cung cấp các điều khiển phiên ban đầu dựa trên Gateway cho mức độ suy nghĩ, độ chi tiết công cụ, lý luận, chi tiết sử dụng và hành động nâng cao. Các chế độ/cấu hình ACP-native rộng hơn vẫn chưa nằm trong phạm vi. |
| Thông tin phiên và cập nhật sử dụng                                   | Một phần     | Cầu nối phát ra thông báo `session_info_update` và `usage_update` nỗ lực tốt nhất từ các ảnh chụp nhanh phiên Gateway đã lưu trữ. Sử dụng là ước tính và chỉ được gửi khi tổng số token Gateway được đánh dấu là mới.                           |
| Truyền dữ liệu công cụ                                                | Một phần     | Các sự kiện `tool_call` / `tool_call_update` bao gồm I/O thô, nội dung văn bản và vị trí tệp nỗ lực tốt nhất khi các tham số/kết quả công cụ Gateway tiết lộ chúng. Các đầu cuối nhúng và đầu ra diff-native phong phú hơn vẫn chưa được tiết lộ. |
| Máy chủ MCP theo phiên (`mcpServers`)                                 | Không hỗ trợ | Chế độ cầu nối từ chối các yêu cầu máy chủ MCP theo phiên. Cấu hình MCP trên Gateway hoặc agent của OpenClaw thay thế.                                                                                                                           |
| Phương thức hệ thống tệp khách (`fs/read_text_file`, `fs/write_text_file`) | Không hỗ trợ | Cầu nối không gọi các phương thức hệ thống tệp khách ACP.                                                                                                                                                                                         |
| Phương thức terminal khách (`terminal/*`)                             | Không hỗ trợ | Cầu nối không tạo các terminal khách ACP hoặc truyền id terminal qua các cuộc gọi công cụ.                                                                                                                                                        |
| Kế hoạch phiên / truyền dữ liệu suy nghĩ                              | Không hỗ trợ | Cầu nối hiện phát ra văn bản đầu ra và trạng thái công cụ, không phải là cập nhật kế hoạch hoặc suy nghĩ của ACP.                                                                                                                                 |

## Giới Hạn Đã Biết

- `loadSession` phát lại lịch sử văn bản người dùng và trợ lý đã lưu trữ, nhưng không tái tạo các cuộc gọi công cụ lịch sử, thông báo hệ thống hoặc các loại sự kiện ACP-native phong phú hơn.
- Nếu nhiều khách hàng ACP chia sẻ cùng một khóa phiên Gateway, định tuyến sự kiện và hủy bỏ là nỗ lực tốt nhất thay vì tách biệt nghiêm ngặt cho từng khách hàng. Ưu tiên các phiên `acp:<uuid>` tách biệt mặc định khi cần các lượt chỉnh sửa cục bộ sạch.
- Trạng thái dừng Gateway được dịch thành lý do dừng ACP, nhưng ánh xạ đó ít biểu cảm hơn so với môi trường chạy hoàn toàn ACP-native.
- Các điều khiển phiên ban đầu hiện tại hiển thị một tập hợp con tập trung của các nút Gateway: mức độ suy nghĩ, độ chi tiết công cụ, lý luận, chi tiết sử dụng và hành động nâng cao. Lựa chọn mô hình và điều khiển máy chủ thực thi chưa được hiển thị dưới dạng tùy chọn cấu hình ACP.
- `session_info_update` và `usage_update` được lấy từ các ảnh chụp nhanh phiên Gateway, không phải là kế toán thời gian thực ACP-native. Sử dụng là ước tính, không mang dữ liệu chi phí và chỉ được phát ra khi Gateway đánh dấu dữ liệu token tổng là mới.
- Dữ liệu theo dõi công cụ là nỗ lực tốt nhất. Cầu nối có thể hiển thị các đường dẫn tệp xuất hiện trong các tham số/kết quả công cụ đã biết, nhưng chưa phát ra các terminal ACP hoặc các diff tệp có cấu trúc.

## Cách Sử Dụng

```bash
openclaw acp

# Gateway từ xa
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway từ xa (token từ file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Kết nối với khóa phiên hiện có
openclaw acp --session agent:main:main

# Kết nối bằng nhãn (phải đã tồn tại)
openclaw acp --session-label "support inbox"

# Đặt lại khóa phiên trước yêu cầu đầu tiên
openclaw acp --session agent:main:main --reset-session
```

## Khách hàng ACP (gỡ lỗi)

Sử dụng khách hàng ACP tích hợp để kiểm tra cầu nối mà không cần IDE.
Nó khởi chạy cầu nối ACP và cho phép nhập yêu cầu tương tác.

```bash
openclaw acp client

# Chỉ định cầu nối khởi chạy đến Gateway từ xa
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Ghi đè lệnh máy chủ (mặc định: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Mô hình quyền (chế độ gỡ lỗi khách hàng):

- Tự động phê duyệt dựa trên danh sách cho phép và chỉ áp dụng cho các ID công cụ cốt lõi đáng tin cậy.
- Tự động phê duyệt `read` được giới hạn trong thư mục làm việc hiện tại (`--cwd` khi được đặt).
- Tên công cụ không xác định/không phải cốt lõi, đọc ngoài phạm vi và công cụ nguy hiểm luôn yêu cầu phê duyệt yêu cầu rõ ràng.
- `toolCall.kind` do máy chủ cung cấp được coi là siêu dữ liệu không đáng tin cậy (không phải là nguồn ủy quyền).

## Cách sử dụng

Sử dụng ACP khi một IDE (hoặc khách hàng khác) sử dụng Agent Client Protocol và bạn muốn nó điều khiển một phiên Gateway của OpenClaw.

1. Đảm bảo Gateway đang chạy (cục bộ hoặc từ xa).
2. Cấu hình mục tiêu Gateway (cấu hình hoặc cờ).
3. Chỉ định IDE chạy `openclaw acp` qua stdio.

Cấu hình ví dụ (được lưu trữ):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Chạy trực tiếp ví dụ (không ghi cấu hình):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# ưu tiên cho an toàn quy trình cục bộ
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Chọn agents

ACP không chọn agents trực tiếp. Nó định tuyến theo khóa phiên Gateway.

Sử dụng khóa phiên theo phạm vi agent để nhắm mục tiêu một agent cụ thể:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Mỗi phiên ACP ánh xạ đến một khóa phiên Gateway duy nhất. Một agent có thể có nhiều phiên; ACP mặc định là một phiên `acp:<uuid>` tách biệt trừ khi bạn ghi đè khóa hoặc nhãn.

Các `mcpServers` theo phiên không được hỗ trợ trong chế độ cầu nối. Nếu một khách hàng ACP gửi chúng trong `newSession` hoặc `loadSession`, cầu nối trả về lỗi rõ ràng thay vì bỏ qua chúng một cách âm thầm.

## Sử dụng từ `acpx` (Codex, Claude, các khách hàng ACP khác)

Nếu bạn muốn một agent mã hóa như Codex hoặc Claude Code nói chuyện với bot OpenClaw của bạn qua ACP, sử dụng `acpx` với mục tiêu `openclaw` tích hợp sẵn.

Luồng điển hình:

1. Chạy Gateway và đảm bảo cầu nối ACP có thể tiếp cận nó.
2. Chỉ định `acpx openclaw` đến `openclaw acp`.
3. Nhắm mục tiêu khóa phiên OpenClaw mà bạn muốn agent mã hóa sử dụng.

Ví dụ:

```bash
# Yêu cầu một lần vào phiên ACP OpenClaw mặc định của bạn
acpx openclaw exec "Tóm tắt trạng thái phiên OpenClaw hiện tại."

# Phiên được đặt tên liên tục cho các lượt theo dõi
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Hỏi agent làm việc OpenClaw của tôi về ngữ cảnh gần đây liên quan đến repo này."
```

Nếu bạn muốn `acpx openclaw` nhắm mục tiêu một Gateway và khóa phiên cụ thể mỗi lần, ghi đè lệnh agent `openclaw` trong `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Đối với một bản kiểm tra OpenClaw cục bộ repo, sử dụng điểm vào CLI trực tiếp thay vì trình chạy dev để luồng ACP được giữ sạch. Ví dụ:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Đây là cách dễ nhất để cho phép Codex, Claude Code hoặc một khách hàng khác nhận biết ACP lấy thông tin ngữ cảnh từ một agent OpenClaw mà không cần quét một terminal.

## Thiết lập trình chỉnh sửa Zed

Thêm một agent ACP tùy chỉnh trong `~/.config/zed/settings.json` (hoặc sử dụng giao diện cài đặt của Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Để nhắm mục tiêu một Gateway hoặc agent cụ thể:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Trong Zed, mở bảng Agent và chọn “OpenClaw ACP” để bắt đầu một luồng.

## Ánh xạ phiên

Theo mặc định, các phiên ACP nhận được một khóa phiên Gateway tách biệt với tiền tố `acp:`. Để sử dụng lại một phiên đã biết, truyền một khóa phiên hoặc nhãn:

- `--session <key>`: sử dụng một khóa phiên Gateway cụ thể.
- `--session-label <label>`: giải quyết một phiên hiện có theo nhãn.
- `--reset-session`: tạo một id phiên mới cho khóa đó (cùng khóa, bản ghi mới).

Nếu khách hàng ACP của bạn hỗ trợ siêu dữ liệu, bạn có thể ghi đè theo phiên:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Tìm hiểu thêm về khóa phiên tại [/concepts/session](/concepts/session).

## Tùy chọn

- `--url <url>`: URL WebSocket của Gateway (mặc định là gateway.remote.url khi được cấu hình).
- `--token <token>`: token xác thực Gateway.
- `--token-file <path>`: đọc token xác thực Gateway từ file.
- `--password <password>`: mật khẩu xác thực Gateway.
- `--password-file <path>`: đọc mật khẩu xác thực Gateway từ file.
- `--session <key>`: khóa phiên mặc định.
- `--session-label <label>`: nhãn phiên mặc định để giải quyết.
- `--require-existing`: thất bại nếu khóa/nhãn phiên không tồn tại.
- `--reset-session`: đặt lại khóa phiên trước khi sử dụng lần đầu.
- `--no-prefix-cwd`: không thêm tiền tố thư mục làm việc vào yêu cầu.
- `--verbose, -v`: ghi nhật ký chi tiết vào stderr.

Lưu ý bảo mật:

- `--token` và `--password` có thể hiển thị trong danh sách quy trình cục bộ trên một số hệ thống.
- Ưu tiên `--token-file`/`--password-file` hoặc biến môi trường (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Giải quyết xác thực Gateway tuân theo hợp đồng chia sẻ được sử dụng bởi các khách hàng Gateway khác:
  - chế độ cục bộ: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*` chỉ khi `gateway.auth.*` chưa được thiết lập (SecretRefs cục bộ đã cấu hình nhưng chưa giải quyết thất bại)
  - chế độ từ xa: `gateway.remote.*` với env/cấu hình dự phòng theo quy tắc ưu tiên từ xa
  - `--url` là an toàn ghi đè và không tái sử dụng thông tin xác thực cấu hình/env ngầm định; truyền `--token`/`--password` rõ ràng (hoặc các biến thể file)
- Các quy trình con backend runtime ACP nhận `OPENCLAW_SHELL=acp`, có thể được sử dụng cho các quy tắc shell/hồ sơ cụ thể theo ngữ cảnh.
- `openclaw acp client` đặt `OPENCLAW_SHELL=acp-client` trên quy trình cầu nối được khởi chạy.

### Tùy chọn `acp client`

- `--cwd <dir>`: thư mục làm việc cho phiên ACP.
- `--server <command>`: lệnh máy chủ ACP (mặc định: `openclaw`).
- `--server-args <args...>`: các tham số bổ sung được truyền đến máy chủ ACP.
- `--server-verbose`: bật ghi nhật ký chi tiết trên máy chủ ACP.
- `--verbose, -v`: ghi nhật ký chi tiết của khách hàng.
