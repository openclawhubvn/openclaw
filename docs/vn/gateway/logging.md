---
summary: "Các bề mặt log, log file, kiểu log WS và định dạng console"
read_when:
  - Thay đổi đầu ra hoặc định dạng log
  - Gỡ lỗi CLI hoặc đầu ra gateway
title: "Logging"
---

# Logging

Để có cái nhìn tổng quan cho người dùng (CLI + Control UI + cấu hình), xem tại [/logging](/logging).

OpenClaw có hai bề mặt log:

- **Đầu ra console** (những gì bạn thấy trong terminal / Debug UI).
- **Log file** (dòng JSON) được ghi bởi gateway logger.

## Logger dựa trên file

- File log mặc định được lưu tại `/tmp/openclaw/` (một file mỗi ngày): `openclaw-YYYY-MM-DD.log`
  - Ngày sử dụng múi giờ địa phương của máy chủ gateway.
- Đường dẫn và mức độ log có thể cấu hình qua `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Định dạng file là một đối tượng JSON trên mỗi dòng.

Tab Logs trong Control UI theo dõi file này qua gateway (`logs.tail`).
CLI cũng có thể làm tương tự:

```bash
openclaw logs --follow
```

**Chi tiết và mức độ log**

- **Log file** được kiểm soát hoàn toàn bởi `logging.level`.
- `--verbose` chỉ ảnh hưởng đến **độ chi tiết của console** (và kiểu log WS); nó **không** nâng mức độ log file.
- Để ghi lại chi tiết chỉ có trong chế độ verbose vào log file, đặt `logging.level` thành `debug` hoặc `trace`.

## Ghi nhận console

CLI ghi nhận `console.log/info/warn/error/debug/trace` và ghi chúng vào log file, đồng thời vẫn in ra stdout/stderr.

Có thể điều chỉnh độ chi tiết của console độc lập qua:

- `logging.consoleLevel` (mặc định `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Tóm tắt công cụ và che giấu thông tin nhạy cảm

Tóm tắt công cụ chi tiết (ví dụ: `🛠️ Exec: ...`) có thể che giấu token nhạy cảm trước khi chúng xuất hiện trên luồng console. Đây là **chỉ dành cho công cụ** và không thay đổi log file.

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: mảng các chuỗi regex (ghi đè mặc định)
  - Sử dụng chuỗi regex thô (tự động `gi`), hoặc `/pattern/flags` nếu cần cờ tùy chỉnh.
  - Các kết quả khớp được che giấu bằng cách giữ 6 ký tự đầu + 4 ký tự cuối (độ dài >= 18), nếu không thì `***`.
  - Mặc định bao gồm các gán khóa phổ biến, cờ CLI, trường JSON, tiêu đề bearer, khối PEM và tiền tố token phổ biến.

## Log WebSocket của Gateway

Gateway in log giao thức WebSocket ở hai chế độ:

- **Chế độ thường (không `--verbose`)**: chỉ in kết quả RPC “thú vị”:
  - lỗi (`ok=false`)
  - cuộc gọi chậm (ngưỡng mặc định: `>= 50ms`)
  - lỗi phân tích cú pháp
- **Chế độ chi tiết (`--verbose`)**: in tất cả lưu lượng yêu cầu/đáp ứng WS.

### Kiểu log WS

`openclaw gateway` hỗ trợ chuyển đổi kiểu theo từng gateway:

- `--ws-log auto` (mặc định): chế độ thường được tối ưu hóa; chế độ chi tiết sử dụng đầu ra gọn
- `--ws-log compact`: đầu ra gọn (yêu cầu/đáp ứng ghép đôi) khi chi tiết
- `--ws-log full`: đầu ra đầy đủ theo từng khung khi chi tiết
- `--compact`: bí danh cho `--ws-log compact`

Ví dụ:

```bash
# tối ưu hóa (chỉ lỗi/chậm)
openclaw gateway

# hiển thị tất cả lưu lượng WS (ghép đôi)
openclaw gateway --verbose --ws-log compact

# hiển thị tất cả lưu lượng WS (đầy đủ meta)
openclaw gateway --verbose --ws-log full
```

## Định dạng console (logging subsystem)

Trình định dạng console **nhận biết TTY** và in các dòng có tiền tố nhất quán.
Logger subsystem giữ cho đầu ra được nhóm và dễ quét.

Hành vi:

- **Tiền tố subsystem** trên mỗi dòng (ví dụ: `[gateway]`, `[canvas]`, `[tailscale]`)
- **Màu subsystem** (ổn định theo từng subsystem) cộng với màu mức độ
- **Màu khi đầu ra là TTY hoặc môi trường trông giống như terminal phong phú** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), tôn trọng `NO_COLOR`
- **Tiền tố subsystem rút gọn**: bỏ `gateway/` + `channels/` dẫn đầu, giữ lại 2 đoạn cuối (ví dụ: `whatsapp/outbound`)
- **Sub-loggers theo subsystem** (tự động tiền tố + trường cấu trúc `{ subsystem }`)
- **`logRaw()`** cho đầu ra QR/UX (không tiền tố, không định dạng)
- **Kiểu console** (ví dụ: `pretty | compact | json`)
- **Mức độ log console** tách biệt với mức độ log file (file giữ chi tiết đầy đủ khi `logging.level` được đặt thành `debug`/`trace`)
- **Nội dung tin nhắn WhatsApp** được log ở mức `debug` (sử dụng `--verbose` để xem chúng)

Điều này giữ cho log file hiện có ổn định trong khi làm cho đầu ra tương tác dễ quét.
