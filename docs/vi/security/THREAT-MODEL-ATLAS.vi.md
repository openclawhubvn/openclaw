---
title: "Mô hình mối đe dọa (MITRE ATLAS)"
summary: "Mô hình mối đe dọa của OpenClaw theo khung MITRE ATLAS"
read_when:
  - Xem xét tư thế bảo mật hoặc kịch bản mối đe dọa
  - Làm việc trên các tính năng bảo mật hoặc phản hồi kiểm toán
---

# Mô hình mối đe dọa OpenClaw v1.0

## Khung MITRE ATLAS

**Phiên bản:** 1.0-draft  
**Cập nhật lần cuối:** 2026-02-04  
**Phương pháp:** MITRE ATLAS + Sơ đồ luồng dữ liệu  
**Khung:** [MITRE ATLAS](https://atlas.mitre.org/) (Cảnh quan mối đe dọa đối với hệ thống AI)

### Nguồn tài nguyên chính của ATLAS

- [Kỹ thuật ATLAS](https://atlas.mitre.org/techniques/)
- [Chiến thuật ATLAS](https://atlas.mitre.org/tactics/)
- [Nghiên cứu trường hợp ATLAS](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Đóng góp cho ATLAS](https://atlas.mitre.org/resources/contribute)

### Đóng góp cho mô hình mối đe dọa này

Đây là tài liệu sống được duy trì bởi cộng đồng OpenClaw. Xem [CONTRIBUTING-THREAT-MODEL.md](/security/CONTRIBUTING-THREAT-MODEL) để biết hướng dẫn đóng góp:

- Báo cáo mối đe dọa mới
- Cập nhật mối đe dọa hiện có
- Đề xuất chuỗi tấn công
- Đề xuất biện pháp giảm thiểu

---

## 1. Giới thiệu

### 1.1 Mục đích

Mô hình mối đe dọa này ghi lại các mối đe dọa đối với nền tảng AI agent OpenClaw và thị trường kỹ năng ClawHub, sử dụng khung MITRE ATLAS được thiết kế riêng cho hệ thống AI/ML.

### 1.2 Phạm vi

| Thành phần             | Bao gồm | Ghi chú                                           |
| ---------------------- | ------- | ------------------------------------------------- |
| OpenClaw Agent Runtime | Có      | Thực thi agent cốt lõi, gọi công cụ, phiên       |
| Gateway                | Có      | Xác thực, định tuyến, tích hợp kênh               |
| Tích hợp kênh          | Có      | WhatsApp, Telegram, Discord, Signal, Slack, v.v. |
| Thị trường ClawHub     | Có      | Xuất bản kỹ năng, kiểm duyệt, phân phối          |
| Máy chủ MCP            | Có      | Nhà cung cấp công cụ bên ngoài                   |
| Thiết bị người dùng    | Một phần| Ứng dụng di động, khách hàng máy tính để bàn     |

### 1.3 Ngoài phạm vi

Không có gì được loại trừ rõ ràng khỏi mô hình mối đe dọa này.

---

## 2. Kiến trúc hệ thống

### 2.1 Ranh giới tin cậy

```
┌─────────────────────────────────────────────────────────────────┐
│                    VÙNG KHÔNG TIN CẬY                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RANH GIỚI TIN CẬY 1: Truy cập kênh              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Ghép nối thiết bị (30s thời gian ân hạn)               │   │
│  │  • Xác thực AllowFrom / AllowList                         │   │
│  │  • Xác thực Token/Mật khẩu/Tailscale                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RANH GIỚI TIN CẬY 2: Cách ly phiên              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   PHIÊN AGENT                             │   │
│  │  • Khóa phiên = agent:kênh:peer                           │   │
│  │  • Chính sách công cụ cho mỗi agent                       │   │
│  │  • Ghi nhật ký phiên                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RANH GIỚI TIN CẬY 3: Thực thi công cụ          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  HỘP CÁT THỰC THI                         │   │
│  │  • Hộp cát Docker HOẶC Host (phê duyệt thực thi)          │   │
│  │  • Thực thi từ xa Node                                    │   │
│  │  • Bảo vệ SSRF (ghim DNS + chặn IP)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RANH GIỚI TIN CẬY 4: Nội dung bên ngoài        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              URL / EMAIL / WEBHOOK ĐƯỢC LẤY VỀ            │   │
│  │  • Bao bọc nội dung bên ngoài (thẻ XML)                   │   │
│  │  • Tiêm thông báo bảo mật                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RANH GIỚI TIN CẬY 5: Chuỗi cung ứng            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Xuất bản kỹ năng (semver, yêu cầu SKILL.md)            │   │
│  │  • Cờ kiểm duyệt dựa trên mẫu                             │   │
│  │  • Quét VirusTotal (sắp ra mắt)                           │   │
│  │  • Xác minh tuổi tài khoản GitHub                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Luồng dữ liệu

| Luồng | Nguồn  | Đích        | Dữ liệu             | Bảo vệ                |
| ----- | ------ | ----------- | ------------------- | --------------------- |
| F1    | Kênh   | Gateway     | Tin nhắn người dùng | TLS, AllowFrom        |
| F2    | Gateway| Agent       | Tin nhắn định tuyến | Cách ly phiên         |
| F3    | Agent  | Công cụ     | Gọi công cụ         | Thực thi chính sách   |
| F4    | Agent  | Bên ngoài   | Yêu cầu web_fetch   | Chặn SSRF             |
| F5    | ClawHub| Agent       | Mã kỹ năng          | Kiểm duyệt, quét      |
| F6    | Agent  | Kênh        | Phản hồi            | Lọc đầu ra            |

---

## 3. Phân tích mối đe dọa theo chiến thuật ATLAS

### 3.1 Trinh sát (AML.TA0002)

#### T-RECON-001: Khám phá điểm cuối Agent

| Thuộc tính             | Giá trị                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0006 - Quét chủ động                                             |
| **Mô tả**              | Kẻ tấn công quét các điểm cuối gateway OpenClaw bị lộ                 |
| **Vector tấn công**    | Quét mạng, truy vấn shodan, liệt kê DNS                               |
| **Thành phần bị ảnh hưởng** | Gateway, điểm cuối API bị lộ                                      |
| **Biện pháp giảm thiểu hiện tại** | Tùy chọn xác thực Tailscale, mặc định gắn với loopback     |
| **Rủi ro còn lại**     | Trung bình - Gateway công khai có thể bị phát hiện                    |
| **Khuyến nghị**        | Tài liệu triển khai an toàn, thêm giới hạn tốc độ trên điểm cuối phát hiện |

#### T-RECON-002: Thăm dò tích hợp kênh

| Thuộc tính             | Giá trị                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0006 - Quét chủ động                                           |
| **Mô tả**              | Kẻ tấn công thăm dò các kênh nhắn tin để xác định tài khoản do AI quản lý |
| **Vector tấn công**    | Gửi tin nhắn thử nghiệm, quan sát mẫu phản hồi                      |
| **Thành phần bị ảnh hưởng** | Tất cả tích hợp kênh                                           |
| **Biện pháp giảm thiểu hiện tại** | Không có cụ thể                                          |
| **Rủi ro còn lại**     | Thấp - Giá trị hạn chế từ việc phát hiện một mình                   |
| **Khuyến nghị**        | Cân nhắc ngẫu nhiên hóa thời gian phản hồi                          |

---

### 3.2 Truy cập ban đầu (AML.TA0004)

#### T-ACCESS-001: Chặn mã ghép nối

| Thuộc tính             | Giá trị                                                   |
| ---------------------- | --------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - Truy cập API suy luận mô hình AI              |
| **Mô tả**              | Kẻ tấn công chặn mã ghép nối trong thời gian ân hạn 30s   |
| **Vector tấn công**    | Nhìn trộm, nghe lén mạng, kỹ thuật xã hội                 |
| **Thành phần bị ảnh hưởng** | Hệ thống ghép nối thiết bị                           |
| **Biện pháp giảm thiểu hiện tại** | Hết hạn 30s, mã được gửi qua kênh hiện có      |
| **Rủi ro còn lại**     | Trung bình - Thời gian ân hạn có thể bị khai thác         |
| **Khuyến nghị**        | Giảm thời gian ân hạn, thêm bước xác nhận                 |

#### T-ACCESS-002: Giả mạo AllowFrom

| Thuộc tính             | Giá trị                                                                         |
| ---------------------- | ------------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - Truy cập API suy luận mô hình AI                                    |
| **Mô tả**              | Kẻ tấn công giả mạo danh tính người gửi được phép trong kênh                    |
| **Vector tấn công**    | Phụ thuộc vào kênh - giả mạo số điện thoại, mạo danh tên người dùng             |
| **Thành phần bị ảnh hưởng** | Xác thực AllowFrom cho mỗi kênh                                            |
| **Biện pháp giảm thiểu hiện tại** | Xác minh danh tính cụ thể cho từng kênh                             |
| **Rủi ro còn lại**     | Trung bình - Một số kênh dễ bị giả mạo                                          |
| **Khuyến nghị**        | Tài liệu rủi ro cụ thể cho từng kênh, thêm xác minh mật mã nếu có thể          |

#### T-ACCESS-003: Trộm token

| Thuộc tính             | Giá trị                                                        |
| ---------------------- | -------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - Truy cập API suy luận mô hình AI                   |
| **Mô tả**              | Kẻ tấn công đánh cắp token xác thực từ các tệp cấu hình        |
| **Vector tấn công**    | Phần mềm độc hại, truy cập thiết bị trái phép, lộ sao lưu cấu hình |
| **Thành phần bị ảnh hưởng** | ~/.openclaw/credentials/, lưu trữ cấu hình                 |
| **Biện pháp giảm thiểu hiện tại** | Quyền truy cập tệp                                   |
| **Rủi ro còn lại**     | Cao - Token được lưu trữ dưới dạng văn bản thuần túy           |
| **Khuyến nghị**        | Thực hiện mã hóa token khi lưu trữ, thêm xoay vòng token       |

---

### 3.3 Thực thi (AML.TA0005)

#### T-EXEC-001: Tiêm prompt trực tiếp

| Thuộc tính             | Giá trị                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0051.000 - Tiêm prompt LLM: Trực tiếp                                                 |
| **Mô tả**              | Kẻ tấn công gửi prompt được tạo để thao túng hành vi của agent                             |
| **Vector tấn công**    | Tin nhắn kênh chứa hướng dẫn đối kháng                                                      |
| **Thành phần bị ảnh hưởng** | Agent LLM, tất cả bề mặt đầu vào                                                       |
| **Biện pháp giảm thiểu hiện tại** | Phát hiện mẫu, bao bọc nội dung bên ngoài                                       |
| **Rủi ro còn lại**     | Nghiêm trọng - Chỉ phát hiện, không chặn; tấn công tinh vi có thể vượt qua                 |
| **Khuyến nghị**        | Thực hiện phòng thủ nhiều lớp, xác thực đầu ra, xác nhận người dùng cho các hành động nhạy cảm |

#### T-EXEC-002: Tiêm prompt gián tiếp

| Thuộc tính             | Giá trị                                                       |
| ---------------------- | ------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0051.001 - Tiêm prompt LLM: Gián tiếp                    |
| **Mô tả**              | Kẻ tấn công nhúng hướng dẫn độc hại trong nội dung được lấy về |
| **Vector tấn công**    | URL độc hại, email bị nhiễm độc, webhook bị xâm nhập          |
| **Thành phần bị ảnh hưởng** | web_fetch, nhập email, nguồn dữ liệu bên ngoài           |
| **Biện pháp giảm thiểu hiện tại** | Bao bọc nội dung với thẻ XML và thông báo bảo mật  |
| **Rủi ro còn lại**     | Cao - LLM có thể bỏ qua hướng dẫn bao bọc                      |
| **Khuyến nghị**        | Thực hiện làm sạch nội dung, tách biệt ngữ cảnh thực thi       |

#### T-EXEC-003: Tiêm tham số công cụ

| Thuộc tính             | Giá trị                                                        |
| ---------------------- | -------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0051.000 - Tiêm prompt LLM: Trực tiếp                     |
| **Mô tả**              | Kẻ tấn công thao túng tham số công cụ thông qua tiêm prompt    |
| **Vector tấn công**    | Prompt được tạo ảnh hưởng đến giá trị tham số công cụ          |
| **Thành phần bị ảnh hưởng** | Tất cả các lần gọi công cụ                                 |
| **Biện pháp giảm thiểu hiện tại** | Phê duyệt thực thi cho các lệnh nguy hiểm           |
| **Rủi ro còn lại**     | Cao - Phụ thuộc vào phán đoán của người dùng                   |
| **Khuyến nghị**        | Thực hiện xác thực tham số, gọi công cụ có tham số hóa         |

#### T-EXEC-004: Vượt qua phê duyệt thực thi

| Thuộc tính             | Giá trị                                                      |
| ---------------------- | ------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0043 - Tạo dữ liệu đối kháng                            |
| **Mô tả**              | Kẻ tấn công tạo lệnh vượt qua danh sách cho phép phê duyệt   |
| **Vector tấn công**    | Làm mờ lệnh, khai thác alias, thao tác đường dẫn             |
| **Thành phần bị ảnh hưởng** | exec-approvals.ts, danh sách cho phép lệnh              |
| **Biện pháp giảm thiểu hiện tại** | Danh sách cho phép + chế độ hỏi                   |
| **Rủi ro còn lại**     | Cao - Không có làm sạch lệnh                                  |
| **Khuyến nghị**        | Thực hiện chuẩn hóa lệnh, mở rộng danh sách chặn              |

---

### 3.4 Duy trì (AML.TA0006)

#### T-PERSIST-001: Cài đặt kỹ năng độc hại

| Thuộc tính             | Giá trị                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0010.001 - Xâm nhập chuỗi cung ứng: Phần mềm AI                       |
| **Mô tả**              | Kẻ tấn công xuất bản kỹ năng độc hại lên ClawHub                           |
| **Vector tấn công**    | Tạo tài khoản, xuất bản kỹ năng với mã độc hại ẩn                          |
| **Thành phần bị ảnh hưởng** | ClawHub, tải kỹ năng, thực thi agent                                  |
| **Biện pháp giảm thiểu hiện tại** | Xác minh tuổi tài khoản GitHub, cờ kiểm duyệt dựa trên mẫu      |
| **Rủi ro còn lại**     | Nghiêm trọng - Không có hộp cát, đánh giá hạn chế                          |
| **Khuyến nghị**        | Tích hợp VirusTotal (đang tiến hành), hộp cát kỹ năng, đánh giá cộng đồng  |

#### T-PERSIST-002: Nhiễm độc cập nhật kỹ năng

| Thuộc tính             | Giá trị                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0010.001 - Xâm nhập chuỗi cung ứng: Phần mềm AI            |
| **Mô tả**              | Kẻ tấn công xâm nhập kỹ năng phổ biến và đẩy bản cập nhật độc hại|
| **Vector tấn công**    | Xâm nhập tài khoản, kỹ thuật xã hội của chủ sở hữu kỹ năng      |
| **Thành phần bị ảnh hưởng** | Phiên bản ClawHub, luồng cập nhật tự động                   |
| **Biện pháp giảm thiểu hiện tại** | Dấu vân tay phiên bản                                 |
| **Rủi ro còn lại**     | Cao - Cập nhật tự động có thể kéo phiên bản độc hại              |
| **Khuyến nghị**        | Thực hiện ký cập nhật, khả năng quay lại, ghim phiên bản         |

#### T-PERSIST-003: Thay đổi cấu hình agent

| Thuộc tính             | Giá trị                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0010.002 - Xâm nhập chuỗi cung ứng: Dữ liệu                  |
| **Mô tả**              | Kẻ tấn công sửa đổi cấu hình agent để duy trì quyền truy cập      |
| **Vector tấn công**    | Sửa đổi tệp cấu hình, tiêm cài đặt                               |
| **Thành phần bị ảnh hưởng** | Cấu hình agent, chính sách công cụ                           |
| **Biện pháp giảm thiểu hiện tại** | Quyền truy cập tệp                                     |
| **Rủi ro còn lại**     | Trung bình - Yêu cầu truy cập cục bộ                              |
| **Khuyến nghị**        | Xác minh tính toàn vẹn cấu hình, ghi nhật ký kiểm toán cho thay đổi cấu hình |

---

### 3.5 Tránh né phòng thủ (AML.TA0007)

#### T-EVADE-001: Vượt qua mẫu kiểm duyệt

| Thuộc tính             | Giá trị                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0043 - Tạo dữ liệu đối kháng                                        |
| **Mô tả**              | Kẻ tấn công tạo nội dung kỹ năng để vượt qua mẫu kiểm duyệt              |
| **Vector tấn công**    | Homoglyph Unicode, thủ thuật mã hóa, tải động                            |
| **Thành phần bị ảnh hưởng** | Kiểm duyệt ClawHub moderation.ts                                    |
| **Biện pháp giảm thiểu hiện tại** | Cờ FLAG_RULES dựa trên mẫu                                    |
| **Rủi ro còn lại**     | Cao - Regex đơn giản dễ bị vượt qua                                      |
| **Khuyến nghị**        | Thêm phân tích hành vi (VirusTotal Code Insight), phát hiện dựa trên AST |

#### T-EVADE-002: Thoát khỏi bao bọc nội dung

| Thuộc tính             | Giá trị                                                     |
| ---------------------- | ----------------------------------------------------------- |
| **ATLAS ID**           | AML.T0043 - Tạo dữ liệu đối kháng                           |
| **Mô tả**              | Kẻ tấn công tạo nội dung thoát khỏi ngữ cảnh bao bọc XML    |
| **Vector tấn công**    | Thao tác thẻ, nhầm lẫn ngữ cảnh, ghi đè hướng dẫn           |
| **Thành phần bị ảnh hưởng** | Bao bọc nội dung bên ngoài                             |
| **Biện pháp giảm thiểu hiện tại** | Thẻ XML + thông báo bảo mật                       |
| **Rủi ro còn lại**     | Trung bình - Các thoát mới được phát hiện thường xuyên      |
| **Khuyến nghị**        | Nhiều lớp bao bọc, xác thực phía đầu ra                     |

---

### 3.6 Khám phá (AML.TA0008)

#### T-DISC-001: Liệt kê công cụ

| Thuộc tính             | Giá trị                                                 |
| ---------------------- | ------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - Truy cập API suy luận mô hình AI            |
| **Mô tả**              | Kẻ tấn công liệt kê các công cụ có sẵn thông qua prompt |
| **Vector tấn công**    | Các truy vấn kiểu "Bạn có công cụ nào?"                 |
| **Thành phần bị ảnh hưởng** | Đăng ký công cụ agent                               |
| **Biện pháp giảm thiểu hiện tại** | Không có cụ thể                               |
| **Rủi ro còn lại**     | Thấp - Công cụ thường được tài liệu hóa                 |
| **Khuyến nghị**        | Cân nhắc kiểm soát khả năng hiển thị công cụ            |

#### T-DISC-002: Trích xuất dữ liệu phiên

| Thuộc tính             | Giá trị                                                 |
| ---------------------- | ------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - Truy cập API suy luận mô hình AI            |
| **Mô tả**              | Kẻ tấn công trích xuất dữ liệu nhạy cảm từ ngữ cảnh phiên|
| **Vector tấn công**    | Các truy vấn kiểu "Chúng ta đã thảo luận gì?"           |
| **Thành phần bị ảnh hưởng** | Bản ghi phiên, cửa sổ ngữ cảnh                      |
| **Biện pháp giảm thiểu hiện tại** | Cách ly phiên cho mỗi người gửi               |
| **Rủi ro còn lại**     | Trung bình - Dữ liệu trong phiên có thể truy cập        |
| **Khuyến nghị**        | Thực hiện xóa dữ liệu nhạy cảm trong ngữ cảnh           |

---

### 3.7 Thu thập & Rò rỉ (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Trộm dữ liệu qua web_fetch

| Thuộc tính             | Giá trị                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0009 - Thu thập                                                     |
| **Mô tả**              | Kẻ tấn công rò rỉ dữ liệu bằng cách yêu cầu agent gửi đến URL bên ngoài |
| **Vector tấn công**    | Tiêm prompt khiến agent POST dữ liệu đến máy chủ kẻ tấn công             |
| **Thành phần bị ảnh hưởng** | Công cụ web_fetch                                                   |
| **Biện pháp giảm thiểu hiện tại** | Chặn SSRF cho mạng nội bộ                                     |
| **Rủi ro còn lại**     | Cao - URL bên ngoài được phép                                            |
| **Khuyến nghị**        | Thực hiện danh sách cho phép URL, nhận thức phân loại dữ liệu            |

#### T-EXFIL-002: Gửi tin nhắn trái phép

| Thuộc tính             | Giá trị                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0009 - Thu thập                                               |
| **Mô tả**              | Kẻ tấn công khiến agent gửi tin nhắn chứa dữ liệu nhạy cảm         |
| **Vector tấn công**    | Tiêm prompt khiến agent nhắn tin cho kẻ tấn công                   |
| **Thành phần bị ảnh hưởng** | Công cụ nhắn tin, tích hợp kênh                               |
| **Biện pháp giảm thiểu hiện tại** | Chặn nhắn tin ra ngoài                                  |
| **Rủi ro còn lại**     | Trung bình - Chặn có thể bị vượt qua                               |
| **Khuyến nghị**        | Yêu cầu xác nhận rõ ràng cho người nhận mới                        |

#### T-EXFIL-003: Thu thập thông tin xác thực

| Thuộc tính             | Giá trị                                                   |
| ---------------------- | --------------------------------------------------------- |
| **ATLAS ID**           | AML.T0009 - Thu thập                                      |
| **Mô tả**              | Kỹ năng độc hại thu thập thông tin xác thực từ ngữ cảnh agent |
| **Vector tấn công**    | Mã kỹ năng đọc biến môi trường, tệp cấu hình              |
| **Thành phần bị ảnh hưởng** | Môi trường thực thi kỹ năng                           |
| **Biện pháp giảm thiểu hiện tại** | Không có cụ thể cho kỹ năng                     |
| **Rủi ro còn lại**     | Nghiêm trọng - Kỹ năng chạy với quyền agent                |
| **Khuyến nghị**        | Hộp cát kỹ năng, cách ly thông tin xác thực                |

---

### 3.8 Tác động (AML.TA0011)

#### T-IMPACT-001: Thực thi lệnh trái phép

| Thuộc tính             | Giá trị                                               |
| ---------------------- | ----------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - Làm suy yếu tính toàn vẹn mô hình AI      |
| **Mô tả**              | Kẻ tấn công thực thi lệnh tùy ý trên hệ thống người dùng|
| **Vector tấn công**    | Tiêm prompt kết hợp với vượt qua phê duyệt thực thi   |
| **Thành phần bị ảnh hưởng** | Công cụ Bash, thực thi lệnh                       |
| **Biện pháp giảm thiểu hiện tại** | Phê duyệt thực thi, tùy chọn hộp cát Docker |
| **Rủi ro còn lại**     | Nghiêm trọng - Thực thi trên host mà không có hộp cát  |
| **Khuyến nghị**        | Mặc định sử dụng hộp cát, cải thiện UX phê duyệt       |

#### T-IMPACT-002: Cạn kiệt tài nguyên (DoS)

| Thuộc tính             | Giá trị                                              |
| ---------------------- | ---------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - Làm suy yếu tính toàn vẹn mô hình AI     |
| **Mô tả**              | Kẻ tấn công làm cạn kiệt tín dụng API hoặc tài nguyên tính toán |
| **Vector tấn công**    | Lũ lụt tin nhắn tự động, gọi công cụ tốn kém         |
| **Thành phần bị ảnh hưởng** | Gateway, phiên agent, nhà cung cấp API          |
| **Biện pháp giảm thiểu hiện tại** | Không có                                  |
| **Rủi ro còn lại**     | Cao - Không có giới hạn tốc độ                        |
| **Khuyến nghị**        | Thực hiện giới hạn tốc độ cho mỗi người gửi, ngân sách chi phí |

#### T-IMPACT-003: Thiệt hại danh tiếng

| Thuộc tính             | Giá trị                                                   |
| ---------------------- | --------------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - Làm suy yếu tính toàn vẹn mô hình AI          |
| **Mô tả**              | Kẻ tấn công khiến agent gửi nội dung có hại/xúc phạm      |
| **Vector tấn công**    | Tiêm prompt gây ra phản hồi không phù hợp                 |
| **Thành phần bị ảnh hưởng** | Tạo đầu ra, nhắn tin kênh                            |
| **Biện pháp giảm thiểu hiện tại** | Chính sách nội dung của nhà cung cấp LLM       |
| **Rủi ro còn lại**     | Trung bình - Bộ lọc của nhà cung cấp không hoàn hảo       |
| **Khuyến nghị**        | Lớp lọc đầu ra, kiểm soát người dùng                      |

---

## 4. Phân tích chuỗi cung ứng ClawHub

### 4.1 Kiểm soát bảo mật hiện tại

| Kiểm soát             | Triển khai                    | Hiệu quả                                             |
| --------------------- | ----------------------------- | ---------------------------------------------------- |
| Tuổi tài khoản GitHub | `requireGitHubAccountAge()`   | Trung bình - Tăng rào cản cho kẻ tấn công mới       |
| Làm sạch đường dẫn    | `sanitizePath()`              | Cao - Ngăn chặn truy cập đường dẫn                   |
| Xác thực loại tệp     | `isTextFile()`                | Trung bình - Chỉ tệp văn bản, nhưng vẫn có thể độc hại|
| Giới hạn kích thước   | Gói tổng cộng 50MB            | Cao - Ngăn chặn cạn kiệt tài nguyên                  |
| Yêu cầu SKILL.md      | Đọc bắt buộc                  | Giá trị bảo mật thấp - Chỉ mang tính thông tin       |
| Kiểm duyệt mẫu        | Cờ FLAG_RULES trong moderation.ts | Thấp - Dễ bị vượt qua                               |
| Trạng thái kiểm duyệt | Trường `moderationStatus`     | Trung bình - Có thể đánh giá thủ công                |

### 4.2 Mẫu cờ kiểm duyệt

Mẫu hiện tại trong `moderation.ts`:

```javascript
// Định danh xấu đã biết
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Từ khóa đáng ngờ
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Hạn chế:**

- Chỉ kiểm tra slug, displayName, summary, frontmatter, metadata, đường dẫn tệp
- Không phân tích nội dung mã kỹ năng thực tế
- Regex đơn giản dễ bị vượt qua với làm mờ
- Không có phân tích hành vi

### 4.3 Cải tiến dự kiến

| Cải tiến               | Trạng thái                             | Tác động                                                               |
| ---------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| Tích hợp VirusTotal    | Đang tiến hành                         | Cao - Phân tích hành vi Code Insight                                   |
| Báo cáo cộng đồng      | Một phần (`skillReports` table tồn tại) | Trung bình                                                             |
| Ghi nhật ký kiểm toán  | Một phần (`auditLogs` table tồn tại)   | Trung bình                                                             |
| Hệ thống huy hiệu      | Đã triển khai                          | Trung bình - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Ma trận rủi ro

### 5.1 Khả năng xảy ra vs Tác động

| ID mối đe dọa | Khả năng xảy ra | Tác động  | Mức độ rủi ro | Ưu tiên |
| ------------- | --------------- | --------- | ------------- | ------- |
| T-EXEC-001    | Cao             | Nghiêm trọng | **Nghiêm trọng** | P0    |
| T-PERSIST-001 | Cao             | Nghiêm trọng | **Nghiêm trọng** | P0    |
| T-EXFIL-003   | Trung bình      | Nghiêm trọng | **Nghiêm trọng** | P0    |
| T-IMPACT-001  | Trung bình      | Nghiêm trọng | **Cao**         | P1    |
| T-EXEC-002    | Cao             | Cao         | **Cao**         | P1    |
| T-EXEC-004    | Trung bình      | Cao         | **Cao**         | P1    |
| T-ACCESS-003  | Trung bình      | Cao         | **Cao**         | P1    |
| T-EXFIL-001   | Trung bình      | Cao         | **Cao**         | P1    |
| T-IMPACT-002  | Cao             | Trung bình  | **Cao**         | P1    |
| T-EVADE-001   | Cao             | Trung bình  | **Trung bình**  | P2    |
| T-ACCESS-001  | Thấp            | Cao         | **Trung bình**  | P2    |
| T-ACCESS-002  | Thấp            | Cao         | **Trung bình**  | P2    |
| T-PERSIST-002 | Thấp            | Cao         | **Trung bình**  | P2    |

### 5.2 Chuỗi tấn công đường dẫn quan trọng

**Chuỗi tấn công 1: Trộm dữ liệu dựa trên kỹ năng**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Xuất bản kỹ năng độc hại) → (Vượt qua kiểm duyệt) → (Thu thập thông tin xác thực)
```

**Chuỗi tấn công 2: Tiêm prompt để RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Tiêm prompt) → (Vượt qua phê duyệt thực thi) → (Thực thi lệnh)
```

**Chuỗi tấn công 3: Tiêm gián tiếp qua nội dung được lấy về**

```
T-EXEC-002 → T-EXFIL-001 → Rò rỉ bên ngoài
(Nhiễm độc nội dung URL) → (Agent lấy về & thực hiện hướng dẫn) → (Dữ liệu gửi đến kẻ tấn công)
```

---

## 6. Tóm tắt khuyến nghị

### 6.1 Ngay lập tức (P0)

| ID    | Khuyến nghị                                     | Giải quyết                  |
| ----- | ----------------------------------------------- | --------------------------- |
| R-001 | Hoàn thành tích hợp VirusTotal                  | T-PERSIST-001, T-EVADE-001  |
| R-002 | Thực hiện hộp cát kỹ năng                       | T-PERSIST-001, T-EXFIL-003  |
| R-003 | Thêm xác thực đầu ra cho các hành động nhạy cảm | T-EXEC-001, T-EXEC-002      |

### 6.2 Ngắn hạn (P1)

| ID    | Khuyến nghị                                    | Giải quyết    |
| ----- | ---------------------------------------------- | ------------- |
| R-004 | Thực hiện giới hạn tốc độ                      | T-IMPACT-002  |
| R-005 | Thêm mã hóa token khi lưu trữ                  | T-ACCESS-003  |
| R-006 | Cải thiện UX phê duyệt thực thi và xác thực    | T-EXEC-004    |
| R-007 | Thực hiện danh sách cho phép URL cho web_fetch | T-EXFIL-001   |

### 6.3 Trung hạn (P2)

| ID    | Khuyến nghị                                           | Giải quyết     |
| ----- | ----------------------------------------------------- | -------------- |
| R-008 | Thêm xác minh mật mã kênh nếu có thể                  | T-ACCESS-002   |
| R-009 | Thực hiện xác minh tính toàn vẹn cấu hình            | T-PERSIST-003  |
| R-010 | Thêm ký cập nhật và ghim phiên bản                    | T-PERSIST-002  |

---

## 7. Phụ lục

### 7.1 Ánh xạ kỹ thuật ATLAS

| ATLAS ID      | Tên kỹ thuật                  | Mối đe dọa OpenClaw                                                |
| ------------- | ----------------------------- | ------------------------------------------------------------------ |
| AML.T0006     | Quét chủ động                 | T-RECON-001, T-RECON-002                                           |
| AML.T0009     | Thu thập                      | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                              |
| AML.T0010.001 | Chuỗi cung ứng: Phần mềm AI   | T-PERSIST-001, T-PERSIST-002                                       |
| AML.T0010.002 | Chuỗi cung ứng: Dữ liệu       | T-PERSIST-003                                                      |
| AML.T0031     | Làm suy yếu tính toàn vẹn mô hình AI | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                           |
| AML.T0040     | Truy cập API suy luận mô hình AI | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002   |
| AML.T0043     | Tạo dữ liệu đối kháng         | T-EXEC-004, T-EVADE-001, T-EVADE-002                               |
| AML.T0051.000 | Tiêm prompt LLM: Trực tiếp    | T-EXEC-001, T-EXEC-003                                             |
| AML.T0051.001 | Tiêm prompt LLM: Gián tiếp    | T-EXEC-002                                                         |

### 7.2 Tệp bảo mật chính

| Đường dẫn                          | Mục đích                     | Mức độ rủi ro |
| ---------------------------------- | ---------------------------- | ------------- |
| `src/infra/exec-approvals.ts`      | Logic phê duyệt lệnh         | **Nghiêm trọng** |
| `src/gateway/auth.ts`              | Xác thực Gateway             | **Nghiêm trọng** |
| `src/web/inbound/access-control.ts`| Kiểm soát truy cập kênh      | **Nghiêm trọng** |
| `src/infra/net/ssrf.ts`            | Bảo vệ SSRF                  | **Nghiêm trọng** |
| `src/security/external-content.ts` | Giảm thiểu tiêm prompt       | **Nghiêm trọng** |
| `src/agents/sandbox/tool-policy.ts`| Thực thi chính sách công cụ  | **Nghiêm trọng** |
| `convex/lib/moderation.ts`         | Kiểm duyệt ClawHub           | **Cao**       |
| `convex/lib/skillPublish.ts`       | Luồng xuất bản kỹ năng       | **Cao**       |
| `src/routing/resolve-route.ts`     | Cách ly phiên                | **Trung bình** |

### 7.3 Thuật ngữ

| Thuật ngữ             | Định nghĩa                                                 |
| --------------------- | ---------------------------------------------------------- |
| **ATLAS**             | Cảnh quan mối đe dọa đối với hệ thống AI của MITRE         |
| **ClawHub**           | Thị trường kỹ năng của OpenClaw                            |
| **Gateway**           | Lớp định tuyến và xác thực tin nhắn của OpenClaw           |
| **MCP**               | Giao diện nhà cung cấp công cụ Model Context Protocol      |
| **Tiêm prompt**       | Tấn công trong đó hướng dẫn độc hại được nhúng trong đầu vào|
| **Kỹ năng**           | Tiện ích mở rộng có thể tải xuống cho agent OpenClaw       |
| **SSRF**              | Giả mạo yêu cầu phía máy chủ                               |

---

_Tài liệu mô hình mối đe dọa này là tài liệu sống. Báo cáo vấn đề bảo mật tới security@openclaw.ai_\n