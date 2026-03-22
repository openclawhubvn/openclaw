# Trạng Thái Icon Trên Thanh Menu

Tác giả: steipete · Cập nhật: 2025-12-06 · Phạm vi: Ứng dụng macOS (`apps/macos`)

- **Idle:** Icon bình thường với hiệu ứng nhấp nháy, thỉnh thoảng lắc nhẹ.
- **Paused:** Icon dùng `appearsDisabled`; không có chuyển động.
- **Voice trigger (big ears):** Khi nghe từ khóa, voice wake detector gọi `AppState.triggerVoiceEars(ttl: nil)`, giữ `earBoostActive=true` trong lúc thu âm. Tai phóng to (1.9x), có lỗ tai tròn để dễ đọc, rồi dừng qua `stopVoiceEars()` sau 1 giây im lặng. Chỉ kích hoạt từ voice pipeline trong app.
- **Working (agent running):** `AppState.isWorking=true` tạo hiệu ứng “tail/leg scurry”: chân lắc nhanh hơn và lệch nhẹ khi đang xử lý. Hiện chỉ kích hoạt khi chạy WebChat agent; cần thêm cho các tác vụ dài khác khi kết nối.

Điểm kết nối

- Voice wake: runtime/tester gọi `AppState.triggerVoiceEars(ttl: nil)` khi kích hoạt và `stopVoiceEars()` sau 1 giây im lặng để khớp với cửa sổ thu âm.
- Hoạt động agent: đặt `AppStateStore.shared.setWorking(true/false)` quanh các khoảng thời gian làm việc (đã thực hiện trong WebChat agent call). Giữ khoảng thời gian ngắn và reset trong `defer` blocks để tránh animation bị kẹt.

Hình dạng & kích thước

- Icon gốc vẽ trong `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- Tai mặc định `earScale=1.0`; voice boost đặt `earScale=1.9` và bật `earHoles=true` mà không thay đổi khung tổng thể (hình mẫu 18×18 pt render vào 36×36 px Retina backing store).
- Scurry dùng leg wiggle lên đến ~1.0 với một chút lắc ngang; cộng thêm vào bất kỳ idle wiggle nào có sẵn.

Lưu ý hành vi

- Không có toggle CLI/broker bên ngoài cho ears/working; giữ nội bộ trong tín hiệu của app để tránh nhấp nháy không mong muốn.
- Giữ TTL ngắn (&lt;10s) để icon nhanh chóng trở về trạng thái ban đầu nếu công việc bị treo.\n