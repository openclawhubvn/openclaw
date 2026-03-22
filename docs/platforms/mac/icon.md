---
summary: "Khám phá cách cấu hình biểu tượng thanh menu cho OpenClaw trên macOS, tối ưu trạng thái và hoạt ảnh dễ dàng."
read_when:
  - Thay đổi hành vi biểu tượng thanh menu
title: "Hướng Dẫn Cấu Hình Biểu Tượng Menu macOS"
---

# Trạng Thái Biểu Tượng Thanh Menu

Tác giả: steipete · Cập nhật: 2025-12-06 · Phạm vi: Ứng dụng macOS (`apps/macos`)

- **Nhàn rỗi:** Biểu tượng có hoạt ảnh bình thường (nhấp nháy, thỉnh thoảng lắc nhẹ).
- **Tạm dừng:** Mục trạng thái sử dụng `appearsDisabled`; không có chuyển động.
- **Kích hoạt giọng nói (tai lớn):** Bộ phát hiện giọng nói gọi `AppState.triggerVoiceEars(ttl: nil)` khi nghe từ kích hoạt, giữ `earBoostActive=true` trong khi thu âm. Tai phóng to (1.9x), có lỗ tai tròn để dễ đọc, sau đó dừng qua `stopVoiceEars()` sau 1 giây im lặng. Chỉ kích hoạt từ đường dẫn giọng nói trong ứng dụng.
- **Đang làm việc (agent đang chạy):** `AppState.isWorking=true` kích hoạt chuyển động nhỏ “đuôi/chân chạy”: chân lắc nhanh hơn và lệch nhẹ khi công việc đang diễn ra. Hiện tại được bật tắt xung quanh các lần chạy agent WebChat; thêm bật tắt tương tự cho các tác vụ dài khác khi kết nối.

Điểm kết nối

- Kích hoạt giọng nói: gọi `AppState.triggerVoiceEars(ttl: nil)` khi kích hoạt và `stopVoiceEars()` sau 1 giây im lặng để khớp với cửa sổ thu âm.
- Hoạt động của agent: đặt `AppStateStore.shared.setWorking(true/false)` xung quanh các khoảng thời gian làm việc (đã thực hiện trong cuộc gọi agent WebChat). Giữ khoảng thời gian ngắn và đặt lại trong các khối `defer` để tránh hoạt ảnh bị kẹt.

Hình dạng & kích thước

- Biểu tượng cơ bản được vẽ trong `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- Tỷ lệ tai mặc định là `1.0`; tăng cường giọng nói đặt `earScale=1.9` và bật `earHoles=true` mà không thay đổi khung tổng thể (hình ảnh mẫu 18×18 pt được hiển thị vào kho lưu trữ Retina 36×36 px).
- Chạy nhanh sử dụng chân lắc lên đến ~1.0 với một chút lắc ngang; nó được cộng thêm vào bất kỳ lắc nhàn rỗi nào hiện có.

Ghi chú hành vi

- Không có bật tắt CLI/broker bên ngoài cho tai/đang làm việc; giữ nội bộ trong các tín hiệu của ứng dụng để tránh nhấp nháy không mong muốn.
- Giữ TTL ngắn (&lt;10 giây) để biểu tượng nhanh chóng trở về trạng thái ban đầu nếu một công việc bị treo.
