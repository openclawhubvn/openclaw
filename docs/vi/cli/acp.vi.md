---
summary: "Chạy cầu nối ACP cho tích hợp IDE"
read_when:
  - Cài đặt tích hợp IDE dựa trên ACP
  - Debug định tuyến session ACP tới Gateway
title: "acp"
---

# acp

Chạy cầu nối [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) để giao tiếp với OpenClaw Gateway.

Lệnh này sử dụng ACP qua stdio cho IDEs và chuyển tiếp prompt tới Gateway qua WebSocket. Nó duy trì các session ACP được ánh xạ tới session key của Gateway.

`openclaw acp` là cầu nối ACP dựa trên Gateway, không phải runtime editor hoàn toàn ACP-native. Nó tập trung vào định tuyến session, chuyển prompt và cập nhật streaming cơ bản.

## Bảng Tương Thích

| Khu vực ACP                                                           | Trạng thái  | Ghi chú                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Đã triển khai | Luồng cầu nối chính qua stdio tới Gateway chat/send + abort.                                                                                                                                                                                      |
| `listSessions`, slash commands                                        | Đã triển khai | Danh sách session hoạt động dựa trên trạng thái session của Gateway; các lệnh được quảng cáo qua `available_commands_update`.                                                                                                                     |
| `loadSession`                                                         | Một phần     | Liên kết lại session ACP với session key của Gateway và phát lại lịch sử văn bản người dùng/trợ lý đã lưu. Lịch sử công cụ/hệ thống chưa được tái tạo.                                                                                             |
| Nội dung Prompt (`text`, `resource` nhúng, hình ảnh)                  | Một phần     | Văn bản/tài nguyên được làm phẳng thành đầu vào chat; hình ảnh trở thành tệp đính kèm của Gateway.                                                                                                                                                 |
| Chế độ Session                                                        | Một phần     | `session/set_mode` được hỗ trợ và cầu nối cung cấp các điều khiển session ban đầu dựa trên Gateway cho mức độ suy nghĩ, độ chi tiết công cụ, lý luận, chi tiết sử dụng và hành động nâng cao. Các chế độ/cấu hình ACP-native rộng hơn vẫn chưa nằm trong phạm vi. |
| Thông tin session và cập nhật sử dụng                                 | Một phần     | Cầu nối phát ra thông báo `session_info_update` và `usage_update` tốt nhất từ các snapshot session của Gateway. Sử dụng là ước lượng và chỉ được gửi khi tổng số token của Gateway được đánh dấu là mới.                                        |
| Streaming công cụ                                                     | Một phần     | Sự kiện `tool_call` / `tool_call_update` bao gồm I/O thô, nội dung văn bản và vị trí tệp tốt nhất khi các tham số/kết quả công cụ của Gateway tiết lộ chúng. Các terminal nhúng và đầu ra diff-native phong phú hơn vẫn chưa được tiết lộ.        |
| MCP server theo session (`mcpServers`)                                | Không hỗ trợ | Chế độ cầu nối từ chối yêu cầu MCP server theo session. Cấu hình MCP trên Gateway hoặc agent của OpenClaw thay thế.                                                                                                                               |
| Phương thức filesystem client (`fs/read_text_file`, `fs/write_text_file`) | Không hỗ trợ | Cầu nối không gọi các phương thức filesystem client của ACP.                                                                                                                                                                                      |
| Phương thức terminal client (`terminal/*`)                            | Không hỗ trợ | Cầu nối không tạo terminal client của ACP hoặc stream id terminal qua các cuộc gọi công cụ.                                                                                                                                                       |
| Kế hoạch session / streaming suy nghĩ                                 | Không hỗ trợ | Cầu nối hiện phát ra văn bản đầu ra và trạng thái công cụ, không phải cập nhật kế hoạch hoặc suy nghĩ của ACP.                                                                                                                                     |

## Giới Hạn Đã Biết

- `loadSession` phát lại lịch sử văn bản người dùng và trợ lý đã lưu, nhưng không tái tạo các cuộc gọi công cụ lịch sử, thông báo hệ thống hoặc các loại sự kiện ACP-native phong phú hơn.
- Nếu nhiều client ACP chia sẻ cùng một session key của Gateway, định tuyến sự kiện và hủy bỏ là nỗ lực tốt nhất thay vì cách ly nghiêm ngặt cho từng client. Ưu tiên session `acp:<uuid>` cách ly mặc định khi cần các lượt editor-local sạch.
- Trạng thái dừng của Gateway được dịch thành lý do dừng của ACP, nhưng ánh xạ đó ít biểu cảm hơn so với runtime hoàn toàn ACP-native.
- Các điều khiển session ban đầu hiện chỉ hiển thị một tập hợp con tập trung của các nút điều khiển Gateway: mức độ suy nghĩ, độ chi tiết công cụ, lý luận, chi tiết sử dụng và hành động nâng cao. Lựa chọn mô hình và điều khiển exec-host chưa được hiển thị dưới dạng tùy chọn cấu hình ACP.
- `session_info_update` và `usage_update` được lấy từ các snapshot session của Gateway, không phải từ việc tính toán runtime ACP-native trực tiếp. Sử dụng là ước lượng, không mang dữ liệu chi phí và chỉ được phát ra khi Gateway đánh dấu dữ liệu token tổng là mới.
- Dữ liệu theo dõi công cụ là nỗ lực tốt nhất. Cầu nối có thể hiển thị các đường dẫn tệp xuất hiện trong các tham số/kết quả công cụ đã biết, nhưng chưa phát ra các terminal ACP hoặc diff tệp có cấu trúc.

## Cách Sử Dụng

```bash
openclaw acp

# Gateway từ xa
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway từ xa (token từ file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Kết nối với session key hiện có
openclaw acp --session agent:main:main

# Kết nối bằng nhãn (phải tồn tại trước)
openclaw acp --session-label "support inbox"

# Đặt lại session key trước prompt đầu tiên
openclaw acp --session agent:main:main --reset-session
```

## ACP client (debug)

Sử dụng client ACP tích hợp để kiểm tra cầu nối mà không cần IDE.
Nó khởi chạy cầu nối ACP và cho phép nhập prompt tương tác.

```bash
openclaw acp client

# Chỉ định cầu nối khởi chạy tới Gateway từ xa
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Ghi đè lệnh server (mặc định: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Mô hình quyền (chế độ debug client):

- Tự động phê duyệt dựa trên danh sách cho phép và chỉ áp dụng cho các ID công cụ cốt lõi đáng tin cậy.
- Tự động phê duyệt `read` được giới hạn trong thư mục làm việc hiện tại (`--cwd` khi được đặt).
- Tên công cụ không xác định/không cốt lõi, đọc ngoài phạm vi và công cụ nguy hiểm luôn yêu cầu phê duyệt prompt rõ ràng.
- `toolCall.kind` do server cung cấp được coi là metadata không đáng tin cậy (không phải nguồn ủy quyền).

## Cách sử dụng

Sử dụng ACP khi một IDE (hoặc client khác) nói Agent Client Protocol và muốn điều khiển một session OpenClaw Gateway.

1. Đảm bảo Gateway đang chạy (local hoặc remote).
2. Cấu hình mục tiêu Gateway (config hoặc flags).
3. Chỉ định IDE chạy `openclaw acp` qua stdio.

Ví dụ config (lưu trữ):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Ví dụ chạy trực tiếp (không ghi config):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# ưu tiên cho an toàn tiến trình local
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Chọn agents

ACP không chọn agents trực tiếp. Nó định tuyến theo session key của Gateway.

Sử dụng session key theo agent để nhắm mục tiêu một agent cụ thể:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Mỗi session ACP ánh xạ tới một session key của Gateway. Một agent có thể có nhiều session; ACP mặc định là một session `acp:<uuid>` cách ly trừ khi bạn ghi đè key hoặc nhãn.

`mcpServers` theo session không được hỗ trợ trong chế độ cầu nối. Nếu một client ACP gửi chúng trong `newSession` hoặc `loadSession`, cầu nối trả về lỗi rõ ràng thay vì âm thầm bỏ qua chúng.

## Sử dụng từ `acpx` (Codex, Claude, các client ACP khác)

Nếu muốn một agent mã hóa như Codex hoặc Claude Code nói chuyện với bot OpenClaw qua ACP, sử dụng `acpx` với mục tiêu `openclaw` tích hợp sẵn.

Luồng điển hình:

1. Chạy Gateway và đảm bảo cầu nối ACP có thể kết nối tới nó.
2. Chỉ định `acpx openclaw` tới `openclaw acp`.
3. Nhắm mục tiêu session key OpenClaw mà agent mã hóa muốn sử dụng.

Ví dụ:

```bash
# Yêu cầu một lần vào session ACP OpenClaw mặc định
acpx openclaw exec "Tóm tắt trạng thái session OpenClaw hiện tại."

# Session có tên liên tục cho các lượt theo dõi
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Hỏi agent làm việc OpenClaw của tôi về ngữ cảnh gần đây liên quan đến repo này."
```

Nếu muốn `acpx openclaw` nhắm mục tiêu một Gateway và session key cụ thể mỗi lần, ghi đè lệnh agent `openclaw` trong `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Đối với OpenClaw checkout repo-local, sử dụng điểm vào CLI trực tiếp thay vì dev runner để luồng ACP giữ sạch. Ví dụ:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Đây là cách dễ nhất để cho phép Codex, Claude Code hoặc một client nhận biết ACP khác lấy thông tin ngữ cảnh từ một agent OpenClaw mà không cần quét terminal.

## Cài đặt Zed editor

Thêm một agent ACP tùy chỉnh trong `~/.config/zed/settings.json` (hoặc sử dụng UI Cài đặt của Zed):

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

## Ánh xạ session

Mặc định, các session ACP nhận một session key Gateway cách ly với tiền tố `acp:`. Để tái sử dụng một session đã biết, truyền một session key hoặc nhãn:

- `--session <key>`: sử dụng một session key Gateway cụ thể.
- `--session-label <label>`: giải quyết một session hiện có theo nhãn.
- `--reset-session`: tạo một session id mới cho key đó (cùng key, transcript mới).

Nếu client ACP hỗ trợ metadata, bạn có thể ghi đè theo session:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Tìm hiểu thêm về session key tại [/concepts/session](/concepts/session).

## Tùy chọn

- `--url <url>`: URL WebSocket của Gateway (mặc định là gateway.remote.url khi được cấu hình).
- `--token <token>`: token xác thực Gateway.
- `--token-file <path>`: đọc token xác thực Gateway từ file.
- `--password <password>`: mật khẩu xác thực Gateway.
- `--password-file <path>`: đọc mật khẩu xác thực Gateway từ file.
- `--session <key>`: session key mặc định.
- `--session-label <label>`: nhãn session mặc định để giải quyết.
- `--require-existing`: thất bại nếu session key/label không tồn tại.
- `--reset-session`: đặt lại session key trước khi sử dụng lần đầu.
- `--no-prefix-cwd`: không thêm tiền tố thư mục làm việc vào prompt.
- `--verbose, -v`: ghi log chi tiết ra stderr.

Lưu ý bảo mật:

- `--token` và `--password` có thể hiển thị trong danh sách tiến trình local trên một số hệ thống.
- Ưu tiên `--token-file`/`--password-file` hoặc biến môi trường (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Giải quyết xác thực Gateway tuân theo hợp đồng chia sẻ được sử dụng bởi các client Gateway khác:
  - chế độ local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*` chỉ khi `gateway.auth.*` chưa được đặt (SecretRefs local đã cấu hình nhưng chưa giải quyết thất bại đóng)
  - chế độ remote: `gateway.remote.*` với env/config fallback theo quy tắc ưu tiên remote
  - `--url` là an toàn ghi đè và không tái sử dụng thông tin xác thực config/env ngầm định; truyền `--token`/`--password` rõ ràng (hoặc các biến thể file)
- Các tiến trình con backend runtime ACP nhận `OPENCLAW_SHELL=acp`, có thể được sử dụng cho các quy tắc shell/profile cụ thể theo ngữ cảnh.
- `openclaw acp client` đặt `OPENCLAW_SHELL=acp-client` trên tiến trình cầu nối được khởi chạy.

### Tùy chọn `acp client`

- `--cwd <dir>`: thư mục làm việc cho session ACP.
- `--server <command>`: lệnh server ACP (mặc định: `openclaw`).
- `--server-args <args...>`: các tham số bổ sung truyền cho server ACP.
- `--server-verbose`: bật ghi log chi tiết trên server ACP.
- `--verbose, -v`: ghi log chi tiết client.\n