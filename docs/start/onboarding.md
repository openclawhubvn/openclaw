---
summary: "Thiết lập OpenClaw trên macOS dễ dàng với hướng dẫn chi tiết từng bước. Bắt đầu trải nghiệm ngay!"
read_when:
  - Thiết kế trợ lý onboarding cho macOS
  - Triển khai xác thực hoặc thiết lập danh tính
title: "Hướng Dẫn Onboarding OpenClaw macOS"
sidebarTitle: "Onboarding: Ứng dụng macOS"
---

# Onboarding (Ứng dụng macOS)

Tài liệu này mô tả quy trình thiết lập lần đầu **hiện tại**. Mục tiêu là mang lại trải nghiệm "ngày 0" mượt mà: chọn nơi Gateway chạy, kết nối xác thực, chạy trình hướng dẫn và để agent tự khởi động. Để có cái nhìn tổng quan về các lộ trình onboarding, xem [Tổng quan Onboarding](/start/onboarding-overview).

<Steps>
<Step title="Chấp nhận cảnh báo macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Chấp nhận tìm mạng cục bộ">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Chào mừng và thông báo bảo mật">
<Frame caption="Đọc thông báo bảo mật hiển thị và quyết định phù hợp">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Mô hình tin cậy bảo mật:

- Mặc định, OpenClaw là một agent cá nhân: một ranh giới vận hành tin cậy.
- Thiết lập chia sẻ/nhiều người dùng yêu cầu khóa chặt (chia ranh giới tin cậy, giữ quyền truy cập công cụ ở mức tối thiểu và tuân theo [Bảo mật](/gateway/security)).
- Onboarding cục bộ hiện mặc định cấu hình mới là `tools.profile: "coding"` để các thiết lập cục bộ mới giữ công cụ hệ thống tập tin/thời gian chạy mà không bắt buộc sử dụng profile `full` không giới hạn.
- Nếu các hook/webhook hoặc nguồn nội dung không tin cậy khác được kích hoạt, hãy sử dụng mô hình hiện đại mạnh mẽ và giữ chính sách công cụ/sandboxing nghiêm ngặt.

</Step>
<Step title="Cục bộ vs Từ xa">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Gateway chạy ở đâu?

- **Máy Mac này (Chỉ cục bộ):** onboarding có thể cấu hình xác thực và ghi thông tin xác thực cục bộ.
- **Từ xa (qua SSH/Tailnet):** onboarding **không** cấu hình xác thực cục bộ; thông tin xác thực phải tồn tại trên máy chủ gateway.
- **Cấu hình sau:** bỏ qua thiết lập và để ứng dụng chưa được cấu hình.

<Tip>
**Mẹo xác thực Gateway:**

- Trình hướng dẫn hiện tạo một **token** ngay cả cho loopback, vì vậy các client WS cục bộ phải xác thực.
- Nếu bạn tắt xác thực, bất kỳ quy trình cục bộ nào cũng có thể kết nối; chỉ sử dụng điều đó trên các máy hoàn toàn tin cậy.
- Sử dụng **token** cho truy cập nhiều máy hoặc kết nối không phải loopback.

</Tip>
</Step>
<Step title="Quyền">
<Frame caption="Chọn quyền bạn muốn cấp cho OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Onboarding yêu cầu quyền TCC cần thiết cho:

- Tự động hóa (AppleScript)
- Thông báo
- Trợ năng
- Ghi màn hình
- Microphone
- Nhận diện giọng nói
- Camera
- Vị trí

</Step>
<Step title="CLI">
  <Info>Bước này là tùy chọn</Info>
  Ứng dụng có thể cài đặt CLI `openclaw` toàn cầu qua npm/pnpm để các quy trình làm việc trên terminal và các tác vụ launchd hoạt động ngay lập tức.
</Step>
<Step title="Chat Onboarding (phiên riêng biệt)">
  Sau khi thiết lập, ứng dụng mở một phiên chat onboarding riêng biệt để agent có thể tự giới thiệu và hướng dẫn các bước tiếp theo. Điều này giữ cho hướng dẫn lần đầu tách biệt khỏi cuộc trò chuyện thông thường của bạn. Xem [Bootstrapping](/start/bootstrapping) để biết điều gì xảy ra trên máy chủ gateway trong lần chạy agent đầu tiên.
</Step>
</Steps>
