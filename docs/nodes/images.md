---
summary: "Khám phá quy tắc xử lý hình ảnh, phương tiện cho gửi, gateway và phản hồi của agent. Tối ưu hóa hiệu suất và chất lượng."
read_when:
  - Sửa đổi pipeline phương tiện hoặc tệp đính kèm
title: "Hướng Dẫn Cấu Hình Hình Ảnh và Phương Tiện"
---

# Hỗ trợ Hình ảnh & Phương tiện (2025-12-05)

Kênh WhatsApp hoạt động qua **Baileys Web**. Tài liệu này ghi lại các quy tắc xử lý phương tiện hiện tại cho gửi, gateway và phản hồi của agent.

## Mục tiêu

- Gửi phương tiện kèm chú thích tùy chọn qua `openclaw message send --media`.
- Cho phép tự động phản hồi từ web inbox bao gồm phương tiện cùng với văn bản.
- Giữ giới hạn theo loại hợp lý và dễ dự đoán.

## Giao diện CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` là tùy chọn; chú thích có thể để trống cho gửi chỉ phương tiện.
  - `--dry-run` in ra payload đã giải quyết; `--json` xuất `{ channel, to, messageId, mediaUrl, caption }`.

## Hành vi kênh WhatsApp Web

- Đầu vào: đường dẫn tệp cục bộ **hoặc** URL HTTP(S).
- Quy trình: tải vào Buffer, phát hiện loại phương tiện và xây dựng payload đúng:
  - **Hình ảnh:** thay đổi kích thước & nén lại thành JPEG (cạnh tối đa 2048px) nhắm đến `agents.defaults.mediaMaxMb` (mặc định 5 MB), giới hạn ở 6 MB.
  - **Âm thanh/Giọng nói/Video:** truyền qua tối đa 16 MB; âm thanh được gửi dưới dạng ghi chú giọng nói (`ptt: true`).
  - **Tài liệu:** bất kỳ thứ gì khác, tối đa 100 MB, với tên tệp được giữ nguyên khi có sẵn.
- Phát lại kiểu GIF của WhatsApp: gửi một MP4 với `gifPlayback: true` (CLI: `--gif-playback`) để các ứng dụng di động lặp lại trong dòng.
- Phát hiện MIME ưu tiên magic bytes, sau đó là headers, rồi đến phần mở rộng tệp.
- Chú thích lấy từ `--message` hoặc `reply.text`; chú thích trống được phép.
- Ghi log: không chi tiết hiển thị `↩️`/`✅`; chi tiết bao gồm kích thước và đường dẫn/URL nguồn.

## Pipeline Tự động Phản hồi

- `getReplyFromConfig` trả về `{ text?, mediaUrl?, mediaUrls? }`.
- Khi có phương tiện, web sender giải quyết đường dẫn cục bộ hoặc URL sử dụng cùng pipeline như `openclaw message send`.
- Nhiều mục phương tiện được gửi tuần tự nếu có.

## Phương tiện Đầu vào cho Lệnh (Pi)

- Khi tin nhắn web đầu vào bao gồm phương tiện, OpenClaw tải xuống tệp tạm và cung cấp biến mẫu:
  - `{{MediaUrl}}` pseudo-URL cho phương tiện đầu vào.
  - `{{MediaPath}}` đường dẫn tạm cục bộ được ghi trước khi chạy lệnh.
- Khi sandbox Docker theo phiên được bật, phương tiện đầu vào được sao chép vào workspace sandbox và `MediaPath`/`MediaUrl` được viết lại thành đường dẫn tương đối như `media/inbound/<filename>`.
- Hiểu phương tiện (nếu được cấu hình qua `tools.media.*` hoặc `tools.media.models` chia sẻ) chạy trước khi tạo mẫu và có thể chèn các khối `[Image]`, `[Audio]`, và `[Video]` vào `Body`.
  - Âm thanh thiết lập `{{Transcript}}` và sử dụng bản ghi để phân tích lệnh nên các lệnh slash vẫn hoạt động.
  - Mô tả video và hình ảnh giữ nguyên bất kỳ văn bản chú thích nào để phân tích lệnh.
- Mặc định chỉ xử lý tệp đính kèm hình ảnh/âm thanh/video đầu tiên; đặt `tools.media.<cap>.attachments` để xử lý nhiều tệp đính kèm.

## Giới hạn & Lỗi

**Giới hạn gửi ra ngoài (gửi WhatsApp web)**

- Hình ảnh: ~6 MB sau khi nén lại.
- Âm thanh/giọng nói/video: 16 MB; tài liệu: 100 MB.
- Phương tiện quá kích thước hoặc không đọc được → lỗi rõ ràng trong log và bỏ qua phản hồi.

**Giới hạn hiểu phương tiện (chuyển ngữ/mô tả)**

- Hình ảnh mặc định: 10 MB (`tools.media.image.maxBytes`).
- Âm thanh mặc định: 20 MB (`tools.media.audio.maxBytes`).
- Video mặc định: 50 MB (`tools.media.video.maxBytes`).
- Phương tiện quá kích thước bỏ qua hiểu, nhưng phản hồi vẫn được gửi với nội dung gốc.

## Ghi chú cho Kiểm tra

- Bao gồm các luồng gửi + phản hồi cho các trường hợp hình ảnh/âm thanh/tài liệu.
- Xác thực nén lại cho hình ảnh (giới hạn kích thước) và cờ ghi chú giọng nói cho âm thanh.
- Đảm bảo phản hồi đa phương tiện được gửi tuần tự.
