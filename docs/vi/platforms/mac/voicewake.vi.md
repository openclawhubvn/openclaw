---
summary: "Chế độ kích hoạt bằng giọng nói và nhấn để nói cùng chi tiết routing trong ứng dụng macOS"
read_when:
  - Làm việc với đường dẫn kích hoạt giọng nói hoặc PTT
title: "Kích Hoạt Giọng Nói (macOS)"
---

# Kích Hoạt Giọng Nói & Nhấn Để Nói

## Chế Độ

- **Chế độ từ kích hoạt** (mặc định): Bộ nhận diện giọng nói luôn bật, chờ từ kích hoạt (`swabbleTriggerWords`). Khi khớp, bắt đầu ghi âm, hiển thị overlay với văn bản tạm thời và tự động gửi sau khi im lặng.
- **Nhấn để nói (Giữ phím Option phải)**: Giữ phím Option phải để ghi âm ngay lập tức—không cần từ kích hoạt. Overlay xuất hiện khi giữ; thả phím sẽ hoàn tất và gửi sau một khoảng thời gian ngắn để chỉnh sửa văn bản.

## Hành Vi Thời Gian Chạy (từ kích hoạt)

- Bộ nhận diện giọng nói hoạt động trong `VoiceWakeRuntime`.
- Chỉ kích hoạt khi có **khoảng dừng ý nghĩa** giữa từ kích hoạt và từ tiếp theo (~0.55s). Overlay/chime có thể bắt đầu khi dừng ngay cả trước khi lệnh bắt đầu.
- Cửa sổ im lặng: 2.0s khi giọng nói đang chảy, 5.0s nếu chỉ nghe thấy từ kích hoạt.
- Dừng cứng: 120s để ngăn phiên chạy quá lâu.
- Khoảng cách giữa các phiên: 350ms.
- Overlay được điều khiển qua `VoiceWakeOverlayController` với màu sắc cam kết/tạm thời.
- Sau khi gửi, bộ nhận diện khởi động lại sạch sẽ để lắng nghe kích hoạt tiếp theo.

## Nguyên Tắc Vòng Đời

- Nếu Kích Hoạt Giọng Nói được bật và quyền đã được cấp, bộ nhận diện từ kích hoạt phải đang lắng nghe (trừ khi đang ghi âm nhấn để nói).
- Hiển thị overlay (bao gồm việc đóng thủ công qua nút X) không bao giờ được ngăn bộ nhận diện tiếp tục.

## Chế Độ Lỗi Overlay Dính (trước đây)

Trước đây, nếu overlay bị kẹt và bạn đóng thủ công, Kích Hoạt Giọng Nói có thể "chết" vì nỗ lực khởi động lại runtime bị chặn bởi hiển thị overlay và không có khởi động lại nào được lên lịch.

Cải thiện:

- Khởi động lại runtime không còn bị chặn bởi hiển thị overlay.
- Hoàn tất đóng overlay kích hoạt `VoiceWakeRuntime.refresh(...)` qua `VoiceSessionCoordinator`, nên việc đóng X thủ công luôn tiếp tục lắng nghe.

## Chi Tiết Nhấn Để Nói

- Phát hiện phím nóng sử dụng giám sát `.flagsChanged` toàn cầu cho **Option phải** (`keyCode 61` + `.option`). Chỉ quan sát sự kiện (không nuốt sự kiện).
- Pipeline ghi âm nằm trong `VoicePushToTalk`: bắt đầu giọng nói ngay lập tức, truyền các phần tạm thời đến overlay, và gọi `VoiceWakeForwarder` khi thả phím.
- Khi nhấn để nói bắt đầu, tạm dừng runtime từ kích hoạt để tránh xung đột âm thanh; tự động khởi động lại sau khi thả phím.
- Quyền: yêu cầu Microphone + Speech; cần phê duyệt Accessibility/Input Monitoring để thấy sự kiện.
- Bàn phím ngoài: một số có thể không nhận diện Option phải như mong đợi—cung cấp phím tắt dự phòng nếu người dùng báo lỗi.

## Cài Đặt Hướng Đến Người Dùng

- **Kích Hoạt Giọng Nói**: bật runtime từ kích hoạt.
- **Giữ Cmd+Fn để nói**: bật giám sát nhấn để nói. Vô hiệu trên macOS < 26.
- Chọn ngôn ngữ & mic, đồng hồ đo mức sống, bảng từ kích hoạt, công cụ kiểm tra (chỉ local; không chuyển tiếp).
- Chọn mic giữ lựa chọn cuối cùng nếu thiết bị ngắt kết nối, hiển thị gợi ý ngắt kết nối, và tạm thời quay lại mặc định hệ thống cho đến khi trở lại.
- **Âm thanh**: chime khi phát hiện kích hoạt và khi gửi; mặc định là âm thanh hệ thống “Glass” của macOS. Có thể chọn bất kỳ file `NSSound`-loadable (ví dụ: MP3/WAV/AIFF) cho mỗi sự kiện hoặc chọn **Không Âm Thanh**.

## Hành Vi Chuyển Tiếp

- Khi Kích Hoạt Giọng Nói được bật, bản ghi được chuyển tiếp đến gateway/agent đang hoạt động (cùng chế độ local vs remote như phần còn lại của ứng dụng mac).
- Phản hồi được gửi đến **nhà cung cấp chính được sử dụng gần đây nhất** (WhatsApp/Telegram/Discord/WebChat). Nếu gửi thất bại, lỗi được ghi lại và phiên vẫn hiển thị qua WebChat/log phiên.

## Payload Chuyển Tiếp

- `VoiceWakeForwarder.prefixedTranscript(_:)` thêm tiền tố gợi ý máy trước khi gửi. Dùng chung giữa đường dẫn từ kích hoạt và nhấn để nói.

## Xác Minh Nhanh

- Bật nhấn để nói, giữ Cmd+Fn, nói, thả: overlay nên hiển thị các phần tạm thời rồi gửi.
- Trong khi giữ, biểu tượng tai trên thanh menu nên phóng to (sử dụng `triggerVoiceEars(ttl:nil)`); chúng sẽ thu nhỏ sau khi thả.\n