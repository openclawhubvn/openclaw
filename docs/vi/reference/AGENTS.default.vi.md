---
title: "Default AGENTS.md"
summary: "Hướng dẫn và danh sách kỹ năng mặc định cho OpenClaw agent trong thiết lập trợ lý cá nhân"
read_when:
  - Bắt đầu một phiên OpenClaw agent mới
  - Kích hoạt hoặc kiểm tra kỹ năng mặc định
---

# AGENTS.md - OpenClaw Personal Assistant (mặc định)

## Chạy lần đầu (khuyến nghị)

OpenClaw dùng thư mục workspace riêng cho agent. Mặc định: `~/.openclaw/workspace` (có thể cấu hình qua `agents.defaults.workspace`).

1. Tạo workspace (nếu chưa có):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Sao chép mẫu workspace mặc định vào workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Tuỳ chọn: nếu muốn danh sách kỹ năng trợ lý cá nhân, thay AGENTS.md bằng file này:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Tuỳ chọn: chọn workspace khác bằng cách đặt `agents.defaults.workspace` (hỗ trợ `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Mặc định an toàn

- Không dump thư mục hay secrets vào chat.
- Không chạy lệnh phá hoại trừ khi được yêu cầu rõ ràng.
- Không gửi phản hồi từng phần/streaming ra ngoài (chỉ gửi phản hồi cuối cùng).

## Bắt đầu phiên (bắt buộc)

- Đọc `SOUL.md`, `USER.md`, và hôm nay + hôm qua trong `memory/`.
- Đọc `MEMORY.md` nếu có; chỉ fallback sang `memory.md` khi không có `MEMORY.md`.
- Thực hiện trước khi phản hồi.

## Soul (bắt buộc)

- `SOUL.md` định nghĩa danh tính, giọng điệu, và giới hạn. Luôn cập nhật.
- Nếu thay đổi `SOUL.md`, thông báo cho người dùng.
- Mỗi phiên là một instance mới; tính liên tục nằm trong các file này.

## Không gian chia sẻ (khuyến nghị)

- Không phải là tiếng nói của người dùng; cẩn thận trong group chat hay kênh công khai.
- Không chia sẻ dữ liệu riêng tư, thông tin liên lạc, hay ghi chú nội bộ.

## Hệ thống nhớ (khuyến nghị)

- Log hàng ngày: `memory/YYYY-MM-DD.md` (tạo `memory/` nếu cần).
- Nhớ dài hạn: `MEMORY.md` cho các sự kiện, sở thích, quyết định bền vững.
- `memory.md` chữ thường chỉ là fallback cũ; không giữ cả hai file root cùng lúc.
- Khi bắt đầu phiên, đọc hôm nay + hôm qua + `MEMORY.md` nếu có, nếu không thì `memory.md`.
- Ghi lại: quyết định, sở thích, ràng buộc, vòng lặp mở.
- Tránh secrets trừ khi được yêu cầu rõ ràng.

## Công cụ & kỹ năng

- Công cụ nằm trong kỹ năng; theo dõi `SKILL.md` của từng kỹ năng khi cần.
- Ghi chú môi trường cụ thể trong `TOOLS.md` (Ghi chú cho Kỹ năng).

## Mẹo sao lưu (khuyến nghị)

Nếu coi workspace này là "bộ nhớ" của Clawd, biến nó thành git repo (tốt nhất là private) để backup `AGENTS.md` và các file nhớ.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Tuỳ chọn: thêm remote private + push
```

## OpenClaw làm gì

- Chạy WhatsApp gateway + Pi coding agent để trợ lý có thể đọc/ghi chat, lấy ngữ cảnh, và chạy kỹ năng qua host Mac.
- Ứng dụng macOS quản lý quyền (ghi màn hình, thông báo, micro) và cung cấp `openclaw` CLI qua binary đi kèm.
- Chat trực tiếp gộp vào phiên `main` của agent mặc định; nhóm giữ riêng biệt như `agent:<agentId>:<channel>:group:<id>` (phòng/kênh: `agent:<agentId>:<channel>:channel:<id>`); heartbeats giữ cho các tác vụ nền hoạt động.

## Kỹ năng cốt lõi (bật trong Settings → Skills)

- **mcporter** — Tool server runtime/CLI quản lý backend kỹ năng ngoài.
- **Peekaboo** — Chụp màn hình macOS nhanh với phân tích AI tùy chọn.
- **camsnap** — Chụp khung hình, clip, hoặc cảnh báo chuyển động từ camera RTSP/ONVIF.
- **oracle** — Agent CLI sẵn sàng OpenAI với replay phiên và điều khiển trình duyệt.
- **eightctl** — Điều khiển giấc ngủ từ terminal.
- **imsg** — Gửi, đọc, stream iMessage & SMS.
- **wacli** — WhatsApp CLI: đồng bộ, tìm kiếm, gửi.
- **discord** — Hành động Discord: react, stickers, polls. Dùng `user:<id>` hoặc `channel:<id>` (id số không rõ ràng).
- **gog** — Google Suite CLI: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — Client Spotify terminal để tìm kiếm/queue/điều khiển phát.
- **sag** — ElevenLabs speech với UX kiểu mac; stream ra loa mặc định.
- **Sonos CLI** — Điều khiển loa Sonos (khám phá/trạng thái/phát/âm lượng/nhóm) từ script.
- **blucli** — Phát, nhóm, và tự động hóa BluOS players từ script.
- **OpenHue CLI** — Điều khiển ánh sáng Philips Hue cho cảnh và tự động hóa.
- **OpenAI Whisper** — Chuyển giọng nói thành văn bản local cho ghi nhanh và transcript voicemail.
- **Gemini CLI** — Mô hình Google Gemini từ terminal cho Q&A nhanh.
- **agent-tools** — Bộ công cụ tiện ích cho tự động hóa và script hỗ trợ.

## Ghi chú sử dụng

- Ưu tiên `openclaw` CLI cho scripting; ứng dụng mac xử lý quyền.
- Cài đặt từ tab Skills; ẩn nút nếu binary đã có.
- Giữ heartbeats bật để trợ lý có thể lên lịch nhắc nhở, giám sát inbox, và kích hoạt camera.
- Canvas UI chạy full-screen với overlay native. Tránh đặt điều khiển quan trọng ở góc trên trái/phải/dưới; thêm khoảng cách rõ ràng trong layout và không dựa vào safe-area insets.
- Để xác minh qua trình duyệt, dùng `openclaw browser` (tabs/status/screenshot) với profile Chrome do OpenClaw quản lý.
- Để kiểm tra DOM, dùng `openclaw browser eval|query|dom|snapshot` (và `--json`/`--out` khi cần output máy).
- Để tương tác, dùng `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type cần ref snapshot; dùng `evaluate` cho CSS selectors).\n