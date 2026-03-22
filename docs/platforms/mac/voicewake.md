---
summary: "Khám phá cách kích hoạt giọng nói và nhấn để nói trên macOS, tối ưu hóa trải nghiệm điều khiển bằng giọng nói của bạn."
read_when:
  - Làm việc với đường dẫn kích hoạt giọng nói hoặc nhấn để nói
title: "Hướng Dẫn Kích Hoạt Giọng Nói Trên macOS"
---

# Kích Hoạt Giọng Nói & Nhấn Để Nói

## Chế Độ

- **Chế độ kích hoạt bằng từ khóa** (mặc định): Bộ nhận diện giọng nói luôn bật, chờ từ khóa kích hoạt (`swabbleTriggerWords`). Khi khớp, nó bắt đầu thu âm, hiển thị lớp phủ với văn bản tạm thời và tự động gửi sau khi im lặng.
- **Nhấn để nói (Giữ phím Option phải)**: Giữ phím Option phải để thu âm ngay lập tức mà không cần từ khóa. Lớp phủ xuất hiện khi giữ; thả ra sẽ hoàn tất và gửi sau một khoảng thời gian ngắn để bạn có thể chỉnh sửa văn bản.

## Hành Vi Thời Gian Chạy (kích hoạt bằng từ khóa)

- Bộ nhận diện giọng nói hoạt động trong `VoiceWakeRuntime`.
- Chỉ kích hoạt khi có **khoảng dừng ý nghĩa** giữa từ kích hoạt và từ tiếp theo (khoảng 0.55 giây). Lớp phủ/âm thanh có thể bắt đầu trong khoảng dừng ngay cả trước khi lệnh bắt đầu.
- Khoảng im lặng: 2.0 giây khi giọng nói đang chảy, 5.0 giây nếu chỉ nghe thấy từ kích hoạt.
- Dừng cứng: 120 giây để ngăn phiên chạy quá lâu.
- Khoảng thời gian giữa các phiên: 350ms.
- Lớp phủ được điều khiển qua `VoiceWakeOverlayController` với màu sắc cam kết/tạm thời.
- Sau khi gửi, bộ nhận diện khởi động lại sạch sẽ để lắng nghe kích hoạt tiếp theo.

## Nguyên Tắc Vòng Đời

- Nếu Kích Hoạt Giọng Nói được bật và quyền đã được cấp, bộ nhận diện từ khóa phải đang lắng nghe (trừ khi đang thu âm nhấn để nói).
- Khả năng hiển thị của lớp phủ (bao gồm việc đóng thủ công qua nút X) không bao giờ được ngăn bộ nhận diện tiếp tục.

## Chế Độ Lỗi Lớp Phủ Dính (trước đây)

Trước đây, nếu lớp phủ bị kẹt và bạn đóng thủ công, Kích Hoạt Giọng Nói có thể xuất hiện như "chết" vì nỗ lực khởi động lại của runtime có thể bị chặn bởi lớp phủ và không có khởi động lại nào được lên lịch sau đó.

Cải thiện:

- Khởi động lại runtime không còn bị chặn bởi lớp phủ.
- Hoàn tất đóng lớp phủ kích hoạt `VoiceWakeRuntime.refresh(...)` qua `VoiceSessionCoordinator`, vì vậy đóng X thủ công luôn tiếp tục lắng nghe.

## Chi Tiết Nhấn Để Nói

- Phát hiện phím nóng sử dụng một bộ giám sát `.flagsChanged` toàn cầu cho **Option phải** (`keyCode 61` + `.option`). Chỉ quan sát sự kiện (không chặn).
- Quy trình thu âm nằm trong `VoicePushToTalk`: bắt đầu nhận diện giọng nói ngay lập tức, truyền văn bản tạm thời đến lớp phủ, và gọi `VoiceWakeForwarder` khi thả ra.
- Khi nhấn để nói bắt đầu, chúng tôi tạm dừng runtime từ khóa để tránh xung đột âm thanh; nó tự động khởi động lại sau khi thả ra.
- Quyền: yêu cầu Microphone + Speech; xem sự kiện cần phê duyệt Accessibility/Input Monitoring.
- Bàn phím ngoài: một số có thể không hiển thị Option phải như mong đợi—cung cấp phím tắt dự phòng nếu người dùng báo cáo lỗi.

## Cài Đặt Hướng Đến Người Dùng

- **Kích Hoạt Giọng Nói**: bật runtime từ khóa.
- **Giữ Cmd+Fn để nói**: bật giám sát nhấn để nói. Vô hiệu trên macOS < 26.
- Chọn ngôn ngữ & mic, đồng hồ đo mức sống, bảng từ khóa kích hoạt, công cụ kiểm tra (chỉ cục bộ; không chuyển tiếp).
- Chọn mic giữ lại lựa chọn cuối cùng nếu thiết bị ngắt kết nối, hiển thị gợi ý ngắt kết nối và tạm thời quay lại mặc định hệ thống cho đến khi nó trở lại.
- **Âm thanh**: âm thanh khi phát hiện kích hoạt và khi gửi; mặc định là âm thanh hệ thống “Glass” của macOS. Bạn có thể chọn bất kỳ tệp nào có thể tải bằng `NSSound` (ví dụ: MP3/WAV/AIFF) cho mỗi sự kiện hoặc chọn **Không Âm Thanh**.

## Hành Vi Chuyển Tiếp

- Khi Kích Hoạt Giọng Nói được bật, bản ghi được chuyển tiếp đến gateway/agent đang hoạt động (cùng chế độ cục bộ hoặc từ xa được sử dụng bởi phần còn lại của ứng dụng mac).
- Phản hồi được gửi đến **nhà cung cấp chính được sử dụng gần đây nhất** (WhatsApp/Telegram/Discord/WebChat). Nếu gửi thất bại, lỗi được ghi lại và phiên vẫn hiển thị qua WebChat/nhật ký phiên.

## Tải Trọng Chuyển Tiếp

- `VoiceWakeForwarder.prefixedTranscript(_:)` thêm gợi ý máy trước khi gửi. Chia sẻ giữa các đường dẫn từ khóa và nhấn để nói.

## Xác Minh Nhanh

- Bật nhấn để nói, giữ Cmd+Fn, nói, thả: lớp phủ nên hiển thị văn bản tạm thời sau đó gửi.
- Trong khi giữ, biểu tượng tai trên thanh menu nên phóng to (sử dụng `triggerVoiceEars(ttl:nil)`); chúng sẽ thu nhỏ sau khi thả.
