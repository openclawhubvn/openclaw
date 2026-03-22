# Onboarding (macOS App)

Tài liệu này mô tả luồng thiết lập lần đầu cho OpenClaw trên macOS. Mục tiêu là trải nghiệm "ngày 0" mượt mà: chọn nơi chạy Gateway, kết nối auth, chạy wizard, và để agent tự khởi động. Để có cái nhìn tổng quan về các đường dẫn onboarding, xem [Onboarding Overview](/start/onboarding-overview).

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

- Mặc định, OpenClaw là agent cá nhân: một ranh giới operator tin cậy.
- Thiết lập chia sẻ/nhiều người dùng cần khóa chặt (chia ranh giới tin cậy, giữ quyền truy cập công cụ tối thiểu, và tuân theo [Security](/gateway/security)).
- Onboarding cục bộ hiện mặc định cấu hình mới là `tools.profile: "coding"` để thiết lập cục bộ mới giữ công cụ filesystem/runtime mà không ép buộc profile `full` không giới hạn.
- Nếu bật hooks/webhooks hoặc các nguồn nội dung không tin cậy khác, dùng mô hình hiện đại mạnh mẽ và giữ chính sách công cụ/sandboxing nghiêm ngặt.

</Step>
<Step title="Cục bộ vs Từ xa">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Gateway chạy ở đâu?

- **Máy này (Chỉ cục bộ):** onboarding có thể cấu hình auth và ghi thông tin xác thực cục bộ.
- **Từ xa (qua SSH/Tailnet):** onboarding **không** cấu hình auth cục bộ; thông tin xác thực phải tồn tại trên máy chủ gateway.
- **Cấu hình sau:** bỏ qua thiết lập và để ứng dụng chưa cấu hình.

<Tip>
**Mẹo auth Gateway:**

- Wizard giờ tạo **token** ngay cả cho loopback, nên các client WS cục bộ phải xác thực.
- Nếu tắt auth, bất kỳ tiến trình cục bộ nào cũng có thể kết nối; chỉ dùng trên máy hoàn toàn tin cậy.
- Dùng **token** cho truy cập nhiều máy hoặc kết nối không phải loopback.

</Tip>
</Step>
<Step title="Quyền truy cập">
<Frame caption="Chọn quyền truy cập muốn cấp cho OpenClaw">
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
  Ứng dụng có thể cài đặt CLI `openclaw` toàn cầu qua npm/pnpm để các workflow terminal và tác vụ launchd hoạt động ngay.
</Step>
<Step title="Onboarding Chat (phiên riêng biệt)">
  Sau khi thiết lập, ứng dụng mở một phiên chat onboarding riêng biệt để agent có thể tự giới thiệu và hướng dẫn các bước tiếp theo. Điều này giữ cho hướng dẫn lần đầu tách biệt khỏi cuộc trò chuyện thông thường. Xem [Bootstrapping](/start/bootstrapping) để biết điều gì xảy ra trên máy chủ gateway trong lần chạy agent đầu tiên.
</Step>
</Steps>\n