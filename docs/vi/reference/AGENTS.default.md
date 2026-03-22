---
title: "Default AGENTS.md"
summary: "Hướng dẫn và danh sách kỹ năng mặc định cho trợ lý cá nhân OpenClaw"
read_when:
  - Bắt đầu một phiên OpenClaw agent mới
  - Kích hoạt hoặc kiểm tra kỹ năng mặc định
---

# AGENTS.md - Trợ lý cá nhân OpenClaw (mặc định)

## Lần đầu chạy (khuyến nghị)

OpenClaw sử dụng một thư mục workspace riêng cho agent. Mặc định: `~/.openclaw/workspace` (có thể cấu hình qua `agents.defaults.workspace`).

1. Tạo workspace (nếu chưa tồn tại):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Sao chép các mẫu workspace mặc định vào workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Tùy chọn: nếu muốn danh sách kỹ năng trợ lý cá nhân, thay thế AGENTS.md bằng file này:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Tùy chọn: chọn workspace khác bằng cách thiết lập `agents.defaults.workspace` (hỗ trợ `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Mặc định an toàn

- Không đổ thư mục hoặc thông tin bí mật vào chat.
- Không chạy lệnh phá hủy trừ khi được yêu cầu rõ ràng.
- Không gửi phản hồi từng phần/streaming đến các bề mặt nhắn tin bên ngoài (chỉ gửi phản hồi cuối cùng).

## Bắt đầu phiên (bắt buộc)

- Đọc `SOUL.md`, `USER.md`, và hôm nay + hôm qua trong `memory/`.
- Đọc `MEMORY.md` khi có; chỉ dùng `memory.md` viết thường khi `MEMORY.md` không có.
- Thực hiện trước khi phản hồi.

## Soul (bắt buộc)

- `SOUL.md` xác định danh tính, giọng điệu và giới hạn. Luôn cập nhật.
- Nếu thay đổi `SOUL.md`, thông báo cho người dùng.
- Mỗi phiên là một phiên bản mới; sự liên tục nằm trong các file này.

## Không gian chia sẻ (khuyến nghị)

- Không phải là tiếng nói của người dùng; cẩn thận trong các cuộc trò chuyện nhóm hoặc kênh công khai.
- Không chia sẻ dữ liệu riêng tư, thông tin liên lạc, hoặc ghi chú nội bộ.

## Hệ thống ghi nhớ (khuyến nghị)

- Nhật ký hàng ngày: `memory/YYYY-MM-DD.md` (tạo `memory/` nếu cần).
- Ghi nhớ dài hạn: `MEMORY.md` cho các sự kiện, sở thích và quyết định bền vững.
- `memory.md` viết thường chỉ là dự phòng cũ; không giữ cả hai file gốc cùng lúc.
- Khi bắt đầu phiên, đọc hôm nay + hôm qua + `MEMORY.md` khi có, nếu không thì `memory.md`.
- Ghi lại: quyết định, sở thích, giới hạn, vòng lặp mở.
- Tránh thông tin bí mật trừ khi được yêu cầu rõ ràng.

## Công cụ & kỹ năng

- Công cụ nằm trong kỹ năng; theo dõi `SKILL.md` của từng kỹ năng khi cần.
- Giữ ghi chú môi trường cụ thể trong `TOOLS.md` (Ghi chú cho Kỹ năng).

## Mẹo sao lưu (khuyến nghị)

Nếu coi workspace này là "bộ nhớ" của Clawd, hãy biến nó thành một repo git (tốt nhất là riêng tư) để `AGENTS.md` và các file bộ nhớ của bạn được sao lưu.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Thêm workspace Clawd"
# Tùy chọn: thêm remote riêng tư + đẩy lên
```

## OpenClaw làm gì

- Chạy gateway WhatsApp + agent mã hóa Pi để trợ lý có thể đọc/viết chat, lấy ngữ cảnh và chạy kỹ năng qua máy Mac chủ.
- Ứng dụng macOS quản lý quyền (ghi màn hình, thông báo, micro) và cung cấp CLI `openclaw` qua binary đi kèm.
- Chat trực tiếp mặc định gộp vào phiên `main` của agent; nhóm giữ riêng biệt như `agent:<agentId>:<channel>:group:<id>` (phòng/kênh: `agent:<agentId>:<channel>:channel:<id>`); heartbeats giữ cho các tác vụ nền hoạt động.

## Kỹ năng cốt lõi (kích hoạt trong Cài đặt → Kỹ năng)

- **mcporter** — Runtime/CLI máy chủ công cụ để quản lý backend kỹ năng bên ngoài.
- **Peekaboo** — Chụp màn hình macOS nhanh với phân tích AI tùy chọn.
- **camsnap** — Chụp khung hình, clip, hoặc cảnh báo chuyển động từ camera an ninh RTSP/ONVIF.
- **oracle** — Agent CLI sẵn sàng OpenAI với phát lại phiên và điều khiển trình duyệt.
- **eightctl** — Kiểm soát giấc ngủ từ terminal.
- **imsg** — Gửi, đọc, stream iMessage & SMS.
- **wacli** — WhatsApp CLI: đồng bộ, tìm kiếm, gửi.
- **discord** — Hành động Discord: phản ứng, nhãn dán, thăm dò ý kiến. Sử dụng mục tiêu `user:<id>` hoặc `channel:<id>` (id số không rõ ràng).
- **gog** — Google Suite CLI: Gmail, Lịch, Drive, Danh bạ.
- **spotify-player** — Khách hàng Spotify trên terminal để tìm kiếm/hàng đợi/kiểm soát phát lại.
- **sag** — ElevenLabs speech với UX nói kiểu mac; stream đến loa mặc định.
- **Sonos CLI** — Kiểm soát loa Sonos (khám phá/trạng thái/phát lại/âm lượng/nhóm) từ script.
- **blucli** — Phát, nhóm và tự động hóa trình phát BluOS từ script.
- **OpenHue CLI** — Kiểm soát ánh sáng Philips Hue cho cảnh và tự động hóa.
- **OpenAI Whisper** — Chuyển giọng nói thành văn bản cục bộ cho ghi nhanh và bản ghi thư thoại.
- **Gemini CLI** — Mô hình Google Gemini từ terminal cho Q&A nhanh.
- **agent-tools** — Bộ công cụ tiện ích cho tự động hóa và script hỗ trợ.

## Ghi chú sử dụng

- Ưu tiên sử dụng CLI `openclaw` cho scripting; ứng dụng mac xử lý quyền.
- Cài đặt từ tab Kỹ năng; nó ẩn nút nếu binary đã có sẵn.
- Giữ heartbeats bật để trợ lý có thể lên lịch nhắc nhở, giám sát hộp thư và kích hoạt chụp camera.
- Canvas UI chạy toàn màn hình với lớp phủ gốc. Tránh đặt điều khiển quan trọng ở góc trên trái/phải/dưới; thêm khoảng cách rõ ràng trong bố cục và không dựa vào insets vùng an toàn.
- Để xác minh qua trình duyệt, sử dụng `openclaw browser` (tab/trạng thái/chụp màn hình) với hồ sơ Chrome do OpenClaw quản lý.
- Để kiểm tra DOM, sử dụng `openclaw browser eval|query|dom|snapshot` (và `--json`/`--out` khi cần đầu ra máy).
- Để tương tác, sử dụng `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type yêu cầu tham chiếu snapshot; sử dụng `evaluate` cho CSS selectors).
