---
summary: "Quy tắc xử lý hình ảnh và media cho gửi, gateway, và phản hồi agent"
read_when:
  - Sửa đổi media pipeline hoặc đính kèm
title: "Hỗ trợ Hình ảnh và Media"
---

# Hỗ trợ Hình ảnh & Media (2025-12-05)

Kênh WhatsApp chạy qua **Baileys Web**. Tài liệu này ghi lại các quy tắc xử lý media hiện tại cho gửi, gateway, và phản hồi agent.

## Mục tiêu

- Gửi media kèm chú thích tùy chọn qua `openclaw message send --media`.
- Cho phép auto-replies từ web inbox bao gồm media cùng với text.
- Giữ giới hạn theo loại hợp lý và dễ đoán.

## CLI Surface

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` tùy chọn; chú thích có thể để trống cho gửi chỉ media.
  - `--dry-run` in ra payload đã giải quyết; `--json` xuất `{ channel, to, messageId, mediaUrl, caption }`.

## Hành vi kênh WhatsApp Web

- Input: đường dẫn file local **hoặc** URL HTTP(S).
- Luồng: tải vào Buffer, phát hiện loại media, và xây dựng payload đúng:
  - **Hình ảnh:** resize & nén lại thành JPEG (cạnh tối đa 2048px) nhắm tới `agents.defaults.mediaMaxMb` (mặc định 5 MB), giới hạn 6 MB.
  - **Audio/Voice/Video:** truyền qua tối đa 16 MB; audio gửi dưới dạng voice note (`ptt: true`).
  - **Documents:** bất kỳ thứ gì khác, tối đa 100 MB, giữ nguyên tên file khi có.
- Phát lại kiểu GIF của WhatsApp: gửi MP4 với `gifPlayback: true` (CLI: `--gif-playback`) để client di động lặp lại inline.
- Phát hiện MIME ưu tiên magic bytes, sau đó headers, rồi đến phần mở rộng file.
- Chú thích lấy từ `--message` hoặc `reply.text`; cho phép chú thích trống.
- Logging: không chi tiết hiển thị `↩️`/`✅`; chi tiết bao gồm kích thước và đường dẫn/URL nguồn.

## Auto-Reply Pipeline

- `getReplyFromConfig` trả về `{ text?, mediaUrl?, mediaUrls? }`.
- Khi có media, web sender giải quyết đường dẫn local hoặc URL sử dụng cùng pipeline như `openclaw message send`.
- Nhiều mục media được gửi tuần tự nếu có.

## Media Inbound tới Commands (Pi)

- Khi tin nhắn web inbound bao gồm media, OpenClaw tải về file tạm và cung cấp biến template:
  - `{{MediaUrl}}` pseudo-URL cho media inbound.
  - `{{MediaPath}}` đường dẫn tạm local được ghi trước khi chạy lệnh.
- Khi sandbox Docker per-session được bật, media inbound được sao chép vào workspace sandbox và `MediaPath`/`MediaUrl` được viết lại thành đường dẫn tương đối như `media/inbound/<filename>`.
- Hiểu media (nếu cấu hình qua `tools.media.*` hoặc `tools.media.models` chia sẻ) chạy trước khi template và có thể chèn `[Image]`, `[Audio]`, và `[Video]` vào `Body`.
  - Audio đặt `{{Transcript}}` và sử dụng transcript để phân tích lệnh nên slash commands vẫn hoạt động.
  - Mô tả video và hình ảnh giữ nguyên text chú thích cho phân tích lệnh.
- Mặc định chỉ xử lý đính kèm hình ảnh/audio/video đầu tiên; đặt `tools.media.<cap>.attachments` để xử lý nhiều đính kèm.

## Giới hạn & Lỗi

**Giới hạn gửi outbound (WhatsApp web send)**

- Hình ảnh: ~6 MB sau khi nén lại.
- Audio/voice/video: 16 MB; documents: 100 MB.
- Media quá kích thước hoặc không đọc được → lỗi rõ ràng trong logs và bỏ qua phản hồi.

**Giới hạn hiểu media (transcription/description)**

- Hình ảnh mặc định: 10 MB (`tools.media.image.maxBytes`).
- Audio mặc định: 20 MB (`tools.media.audio.maxBytes`).
- Video mặc định: 50 MB (`tools.media.video.maxBytes`).
- Media quá kích thước bỏ qua hiểu, nhưng phản hồi vẫn đi qua với nội dung gốc.

## Ghi chú cho Kiểm thử

- Bao gồm luồng gửi + phản hồi cho các trường hợp hình ảnh/audio/document.
- Xác nhận nén lại cho hình ảnh (giới hạn kích thước) và cờ voice-note cho audio.
- Đảm bảo phản hồi đa phương tiện phân tán thành các gửi tuần tự.\n