---
summary: "Terminal UI (TUI): kết nối với Gateway từ bất kỳ máy nào"
read_when:
  - Bạn muốn hướng dẫn dễ hiểu về TUI
  - Bạn cần danh sách đầy đủ các tính năng, lệnh và phím tắt của TUI
title: "TUI"
---

# TUI (Giao diện dòng lệnh)

## Bắt đầu nhanh

1. Khởi động Gateway.

```bash
openclaw gateway
```

2. Mở TUI.

```bash
openclaw tui
```

3. Nhập tin nhắn và nhấn Enter.

Gateway từ xa:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Sử dụng `--password` nếu Gateway của bạn yêu cầu xác thực bằng mật khẩu.

## Những gì bạn thấy

- Header: URL kết nối, agent hiện tại, session hiện tại.
- Nhật ký chat: tin nhắn người dùng, phản hồi từ trợ lý, thông báo hệ thống, thẻ công cụ.
- Dòng trạng thái: trạng thái kết nối/chạy (đang kết nối, đang chạy, đang truyền, nhàn rỗi, lỗi).
- Footer: trạng thái kết nối + agent + session + model + think/fast/verbose/reasoning + số lượng token + deliver.
- Input: trình soạn thảo văn bản với tính năng tự động hoàn thành.

## Mô hình tư duy: agents + sessions

- Agents là các định danh duy nhất (ví dụ: `main`, `research`). Gateway cung cấp danh sách này.
- Sessions thuộc về agent hiện tại.
- Khóa session được lưu trữ dưới dạng `agent:<agentId>:<sessionKey>`.
  - Nếu nhập `/session main`, TUI sẽ mở rộng thành `agent:<currentAgent>:main`.
  - Nếu nhập `/session agent:other:main`, bạn sẽ chuyển sang session của agent đó.
- Phạm vi session:
  - `per-sender` (mặc định): mỗi agent có nhiều session.
  - `global`: TUI luôn sử dụng session `global` (trình chọn có thể trống).
- Agent + session hiện tại luôn hiển thị ở footer.

## Gửi + chuyển phát

- Tin nhắn được gửi đến Gateway; chuyển phát đến các nhà cung cấp mặc định là tắt.
- Bật chuyển phát:
  - `/deliver on`
  - hoặc bảng Cài đặt
  - hoặc bắt đầu với `openclaw tui --deliver`

## Trình chọn + lớp phủ

- Trình chọn model: liệt kê các model có sẵn và đặt ghi đè session.
- Trình chọn agent: chọn agent khác.
- Trình chọn session: chỉ hiển thị các session cho agent hiện tại.
- Cài đặt: bật/tắt chuyển phát, mở rộng đầu ra công cụ, và hiển thị suy nghĩ.

## Phím tắt

- Enter: gửi tin nhắn
- Esc: hủy chạy đang hoạt động
- Ctrl+C: xóa input (nhấn hai lần để thoát)
- Ctrl+D: thoát
- Ctrl+L: trình chọn model
- Ctrl+G: trình chọn agent
- Ctrl+P: trình chọn session
- Ctrl+O: bật/tắt mở rộng đầu ra công cụ
- Ctrl+T: bật/tắt hiển thị suy nghĩ (tải lại lịch sử)

## Lệnh gạch chéo

Cốt lõi:

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
- `/elevated <on|off|ask|full>` (bí danh: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Vòng đời session:

- `/new` hoặc `/reset` (đặt lại session)
- `/abort` (hủy chạy đang hoạt động)
- `/settings`
- `/exit`

Các lệnh gạch chéo khác của Gateway (ví dụ, `/context`) được chuyển tiếp đến Gateway và hiển thị dưới dạng đầu ra hệ thống. Xem [Lệnh gạch chéo](/tools/slash-commands).

## Lệnh shell cục bộ

- Thêm `!` trước dòng để chạy lệnh shell cục bộ trên máy chủ TUI.
- TUI sẽ hỏi một lần mỗi session để cho phép thực thi cục bộ; từ chối sẽ giữ `!` bị vô hiệu hóa cho session đó.
- Lệnh chạy trong shell mới, không tương tác trong thư mục làm việc của TUI (không có `cd`/env tồn tại).
- Lệnh shell cục bộ nhận `OPENCLAW_SHELL=tui-local` trong môi trường của chúng.
- Một `!` đơn lẻ được gửi như một tin nhắn bình thường; khoảng trắng đầu dòng không kích hoạt thực thi cục bộ.

## Đầu ra công cụ

- Các cuộc gọi công cụ hiển thị dưới dạng thẻ với tham số + kết quả.
- Ctrl+O chuyển đổi giữa chế độ thu gọn/mở rộng.
- Trong khi công cụ chạy, các cập nhật từng phần được truyền vào cùng một thẻ.

## Màu sắc terminal

- TUI giữ văn bản của trợ lý theo màu nền mặc định của terminal để cả terminal tối và sáng đều dễ đọc.
- Nếu terminal của bạn sử dụng nền sáng và tự động phát hiện sai, đặt `OPENCLAW_THEME=light` trước khi khởi chạy `openclaw tui`.
- Để buộc sử dụng bảng màu tối gốc, đặt `OPENCLAW_THEME=dark`.

## Lịch sử + truyền tải

- Khi kết nối, TUI tải lịch sử mới nhất (mặc định 200 tin nhắn).
- Phản hồi truyền tải cập nhật tại chỗ cho đến khi hoàn tất.
- TUI cũng lắng nghe sự kiện công cụ của agent để có thẻ công cụ phong phú hơn.

## Chi tiết kết nối

- TUI đăng ký với Gateway dưới dạng `mode: "tui"`.
- Kết nối lại hiển thị thông báo hệ thống; khoảng trống sự kiện được hiển thị trong nhật ký.

## Tùy chọn

- `--url <url>`: URL WebSocket của Gateway (mặc định theo cấu hình hoặc `ws://127.0.0.1:<port>`)
- `--token <token>`: Token của Gateway (nếu cần)
- `--password <password>`: Mật khẩu của Gateway (nếu cần)
- `--session <key>`: Khóa session (mặc định: `main`, hoặc `global` khi phạm vi là toàn cầu)
- `--deliver`: Chuyển phát phản hồi của trợ lý đến nhà cung cấp (mặc định tắt)
- `--thinking <level>`: Ghi đè mức độ suy nghĩ khi gửi
- `--timeout-ms <ms>`: Thời gian chờ của agent tính bằng ms (mặc định theo `agents.defaults.timeoutSeconds`)

Lưu ý: khi bạn đặt `--url`, TUI không sử dụng cấu hình hoặc thông tin xác thực môi trường. Phải truyền `--token` hoặc `--password` rõ ràng. Thiếu thông tin xác thực rõ ràng sẽ gây lỗi.

## Khắc phục sự cố

Không có đầu ra sau khi gửi tin nhắn:

- Chạy `/status` trong TUI để xác nhận Gateway đã kết nối và đang nhàn rỗi/bận.
- Kiểm tra nhật ký Gateway: `openclaw logs --follow`.
- Xác nhận agent có thể chạy: `openclaw status` và `openclaw models status`.
- Nếu bạn mong đợi tin nhắn trong kênh chat, bật chuyển phát (`/deliver on` hoặc `--deliver`).
- `--history-limit <n>`: Số lượng mục lịch sử để tải (mặc định 200)

## Khắc phục sự cố kết nối

- `disconnected`: đảm bảo Gateway đang chạy và `--url/--token/--password` của bạn đúng.
- Không có agent trong trình chọn: kiểm tra `openclaw agents list` và cấu hình định tuyến của bạn.
- Trình chọn session trống: bạn có thể đang ở phạm vi toàn cầu hoặc chưa có session nào.
