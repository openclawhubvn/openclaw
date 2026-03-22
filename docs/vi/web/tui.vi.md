# TUI (Terminal UI)

## Khởi động nhanh

1. Khởi động Gateway.

```bash
openclaw gateway
```

2. Mở TUI.

```bash
openclaw tui
```

3. Gõ tin nhắn và nhấn Enter.

Gateway từ xa:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Dùng `--password` nếu Gateway dùng xác thực mật khẩu.

## Giao diện

- Header: URL kết nối, agent hiện tại, session hiện tại.
- Chat log: tin nhắn người dùng, phản hồi assistant, thông báo hệ thống, tool cards.
- Status line: trạng thái kết nối/chạy (connecting, running, streaming, idle, error).
- Footer: trạng thái kết nối + agent + session + model + think/fast/verbose/reasoning + token counts + deliver.
- Input: text editor có autocomplete.

## Mô hình tư duy: agents + sessions

- Agents là các slug duy nhất (ví dụ: `main`, `research`). Gateway cung cấp danh sách này.
- Sessions thuộc về agent hiện tại.
- Session keys lưu dưới dạng `agent:<agentId>:<sessionKey>`.
  - Gõ `/session main`, TUI mở rộng thành `agent:<currentAgent>:main`.
  - Gõ `/session agent:other:main`, chuyển sang session agent đó.
- Phạm vi session:
  - `per-sender` (mặc định): mỗi agent có nhiều sessions.
  - `global`: TUI luôn dùng session `global` (picker có thể trống).
- Agent + session hiện tại luôn hiển thị ở footer.

## Gửi + chuyển phát

- Tin nhắn gửi đến Gateway; chuyển phát đến providers mặc định tắt.
- Bật chuyển phát:
  - `/deliver on`
  - hoặc Settings panel
  - hoặc khởi động với `openclaw tui --deliver`

## Pickers + overlays

- Model picker: liệt kê các model có sẵn và đặt session override.
- Agent picker: chọn agent khác.
- Session picker: chỉ hiển thị sessions cho agent hiện tại.
- Settings: bật/tắt deliver, mở rộng output tool, và hiển thị thinking.

## Phím tắt

- Enter: gửi tin nhắn
- Esc: hủy chạy hiện tại
- Ctrl+C: xóa input (nhấn hai lần để thoát)
- Ctrl+D: thoát
- Ctrl+L: model picker
- Ctrl+G: agent picker
- Ctrl+P: session picker
- Ctrl+O: bật/tắt mở rộng output tool
- Ctrl+T: bật/tắt hiển thị thinking (tải lại lịch sử)

## Slash commands

Core:

- `/help`
- `/status`
- `/agent <id>` (hoặc `/agents`)
- `/session <key>` (hoặc `/sessions`)
- `/model <provider/model>` (hoặc `/models`)

Điều khiển session:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Vòng đời session:

- `/new` hoặc `/reset` (reset session)
- `/abort` (hủy chạy hiện tại)
- `/settings`
- `/exit`

Các lệnh slash khác của Gateway (ví dụ, `/context`) được chuyển tiếp đến Gateway và hiển thị dưới dạng output hệ thống. Xem [Slash commands](/tools/slash-commands).

## Lệnh shell local

- Thêm `!` trước dòng để chạy lệnh shell local trên host TUI.
- TUI hỏi một lần mỗi session để cho phép thực thi local; từ chối giữ `!` bị vô hiệu hóa cho session.
- Lệnh chạy trong shell mới, không tương tác trong thư mục làm việc của TUI (không có `cd`/env persistent).
- Lệnh shell local nhận `OPENCLAW_SHELL=tui-local` trong môi trường.
- `!` đơn lẻ được gửi như tin nhắn bình thường; khoảng trắng đầu dòng không kích hoạt thực thi local.

## Output tool

- Tool calls hiển thị dưới dạng cards với args + kết quả.
- Ctrl+O chuyển đổi giữa chế độ thu gọn/mở rộng.
- Khi tools chạy, cập nhật từng phần stream vào cùng card.

## Màu sắc terminal

- TUI giữ text body assistant theo foreground mặc định của terminal để cả terminal tối và sáng đều dễ đọc.
- Nếu terminal dùng nền sáng và auto-detection sai, đặt `OPENCLAW_THEME=light` trước khi chạy `openclaw tui`.
- Để ép dùng palette tối gốc, đặt `OPENCLAW_THEME=dark`.

## Lịch sử + streaming

- Khi kết nối, TUI tải lịch sử mới nhất (mặc định 200 tin nhắn).
- Phản hồi streaming cập nhật tại chỗ cho đến khi hoàn tất.
- TUI cũng lắng nghe sự kiện tool agent để có tool cards phong phú hơn.

## Chi tiết kết nối

- TUI đăng ký với Gateway dưới dạng `mode: "tui"`.
- Kết nối lại hiển thị thông báo hệ thống; khoảng trống sự kiện được hiển thị trong log.

## Tùy chọn

- `--url <url>`: Gateway WebSocket URL (mặc định từ config hoặc `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway token (nếu cần)
- `--password <password>`: Gateway password (nếu cần)
- `--session <key>`: Session key (mặc định: `main`, hoặc `global` khi phạm vi là global)
- `--deliver`: Chuyển phát phản hồi assistant đến provider (mặc định tắt)
- `--thinking <level>`: Ghi đè mức thinking khi gửi
- `--timeout-ms <ms>`: Agent timeout tính bằng ms (mặc định từ `agents.defaults.timeoutSeconds`)

Lưu ý: khi đặt `--url`, TUI không dùng config hoặc environment credentials. Phải truyền `--token` hoặc `--password` rõ ràng. Thiếu credentials rõ ràng là lỗi.

## Khắc phục sự cố

Không có output sau khi gửi tin nhắn:

- Chạy `/status` trong TUI để xác nhận Gateway đã kết nối và đang idle/busy.
- Kiểm tra log Gateway: `openclaw logs --follow`.
- Xác nhận agent có thể chạy: `openclaw status` và `openclaw models status`.
- Nếu mong đợi tin nhắn trong chat channel, bật chuyển phát (`/deliver on` hoặc `--deliver`).
- `--history-limit <n>`: Số lượng mục lịch sử để tải (mặc định 200)

## Khắc phục sự cố kết nối

- `disconnected`: đảm bảo Gateway đang chạy và `--url/--token/--password` đúng.
- Không có agents trong picker: kiểm tra `openclaw agents list` và config routing.
- Session picker trống: có thể đang ở phạm vi global hoặc chưa có sessions.\n