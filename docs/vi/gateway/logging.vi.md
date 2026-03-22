# Logging

Xem tổng quan cho người dùng (CLI + Control UI + config) tại [/logging](/logging).

OpenClaw có hai dạng log:

- **Console output** (hiển thị trên terminal / Debug UI).
- **File logs** (dạng JSON lines) ghi bởi gateway logger.

## File-based logger

- Log file mặc định lưu tại `/tmp/openclaw/` (mỗi ngày một file): `openclaw-YYYY-MM-DD.log`
  - Ngày tháng theo timezone của gateway host.
- Có thể cấu hình đường dẫn và mức độ log qua `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

File log có định dạng mỗi dòng là một JSON object.

Tab Logs trong Control UI đọc file này qua gateway (`logs.tail`).
CLI cũng có thể làm tương tự:

```bash
openclaw logs --follow
```

**Verbose vs. log levels**

- **File logs** chỉ bị ảnh hưởng bởi `logging.level`.
- `--verbose` chỉ ảnh hưởng **console verbosity** (và WS log style); không nâng mức độ file log.
- Để ghi chi tiết verbose vào file logs, đặt `logging.level` thành `debug` hoặc `trace`.

## Console capture

CLI ghi lại `console.log/info/warn/error/debug/trace` và ghi vào file logs, đồng thời vẫn in ra stdout/stderr.

Có thể điều chỉnh độ chi tiết của console qua:

- `logging.consoleLevel` (mặc định `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Tool summary redaction

Tóm tắt công cụ chi tiết (ví dụ: `🛠️ Exec: ...`) có thể che giấu token nhạy cảm trước khi xuất ra console. Chỉ áp dụng cho **tools** và không thay đổi file logs.

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: mảng regex strings (ghi đè mặc định)
  - Sử dụng regex strings thô (tự động `gi`), hoặc `/pattern/flags` nếu cần flags tùy chỉnh.
  - Kết quả khớp sẽ bị che giấu, giữ lại 6 ký tự đầu + 4 ký tự cuối (độ dài >= 18), nếu không thì `***`.
  - Mặc định bao gồm các key assignments phổ biến, CLI flags, JSON fields, bearer headers, PEM blocks, và các tiền tố token phổ biến.

## Gateway WebSocket logs

Gateway in log giao thức WebSocket theo hai chế độ:

- **Normal mode (không `--verbose`)**: chỉ in kết quả RPC “đáng chú ý”:
  - lỗi (`ok=false`)
  - gọi chậm (ngưỡng mặc định: `>= 50ms`)
  - lỗi phân tích
- **Verbose mode (`--verbose`)**: in toàn bộ traffic request/response WS.

### WS log style

`openclaw gateway` hỗ trợ chuyển đổi style theo gateway:

- `--ws-log auto` (mặc định): chế độ thường tối ưu; chế độ verbose dùng output compact
- `--ws-log compact`: output compact (ghép cặp request/response) khi verbose
- `--ws-log full`: output đầy đủ từng frame khi verbose
- `--compact`: alias cho `--ws-log compact`

Ví dụ:

```bash
# tối ưu (chỉ lỗi/chậm)
openclaw gateway

# hiển thị toàn bộ traffic WS (ghép cặp)
openclaw gateway --verbose --ws-log compact

# hiển thị toàn bộ traffic WS (đầy đủ meta)
openclaw gateway --verbose --ws-log full
```

## Console formatting (subsystem logging)

Console formatter **nhận biết TTY** và in các dòng có tiền tố nhất quán.
Subsystem loggers giữ output được nhóm và dễ quét.

Hành vi:

- **Tiền tố subsystem** trên mỗi dòng (ví dụ: `[gateway]`, `[canvas]`, `[tailscale]`)
- **Màu subsystem** (ổn định theo subsystem) cộng với màu mức độ
- **Màu khi output là TTY hoặc môi trường giống terminal phong phú** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), tôn trọng `NO_COLOR`
- **Tiền tố subsystem rút gọn**: bỏ `gateway/` + `channels/` đầu, giữ lại 2 segment cuối (ví dụ: `whatsapp/outbound`)
- **Sub-loggers theo subsystem** (tự động tiền tố + trường cấu trúc `{ subsystem }`)
- **`logRaw()`** cho output QR/UX (không tiền tố, không định dạng)
- **Console styles** (ví dụ: `pretty | compact | json`)
- **Console log level** tách biệt với file log level (file giữ chi tiết đầy đủ khi `logging.level` được đặt thành `debug`/`trace`)
- **Nội dung tin nhắn WhatsApp** được log ở mức `debug` (dùng `--verbose` để xem)

Điều này giữ cho file logs hiện tại ổn định trong khi làm cho output tương tác dễ quét.\n