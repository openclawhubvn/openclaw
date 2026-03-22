---
title: "Đóng góp cho Mô hình Đe dọa"
summary: "Cách đóng góp cho mô hình đe dọa của OpenClaw"
read_when:
  - Bạn muốn đóng góp phát hiện bảo mật hoặc kịch bản đe dọa
  - Đang xem xét hoặc cập nhật mô hình đe dọa
---

# Đóng góp cho Mô hình Đe dọa của OpenClaw

Cảm ơn bạn đã giúp OpenClaw trở nên an toàn hơn. Mô hình đe dọa này là một tài liệu sống và chúng tôi hoan nghênh mọi đóng góp từ bất kỳ ai - bạn không cần phải là chuyên gia bảo mật.

## Cách Đóng Góp

### Thêm một Đe dọa

Phát hiện một điểm tấn công hoặc rủi ro mà chúng tôi chưa đề cập? Hãy mở một issue trên [openclaw/trust](https://github.com/openclaw/trust/issues) và mô tả nó theo cách của bạn. Bạn không cần biết bất kỳ framework nào hay điền vào mọi trường - chỉ cần mô tả kịch bản.

**Nên bao gồm (nhưng không bắt buộc):**

- Kịch bản tấn công và cách nó có thể bị khai thác
- Phần nào của OpenClaw bị ảnh hưởng (CLI, gateway, channels, ClawHub, MCP servers, v.v.)
- Mức độ nghiêm trọng bạn nghĩ là (thấp / trung bình / cao / nghiêm trọng)
- Bất kỳ liên kết nào đến nghiên cứu liên quan, CVE, hoặc ví dụ thực tế

Chúng tôi sẽ xử lý việc ánh xạ ATLAS, ID đe dọa và đánh giá rủi ro trong quá trình xem xét. Nếu bạn muốn bao gồm những chi tiết đó, rất tốt - nhưng không bắt buộc.

> **Đây là để thêm vào mô hình đe dọa, không phải báo cáo lỗ hổng đang hoạt động.** Nếu bạn đã tìm thấy một lỗ hổng có thể khai thác, hãy xem trang [Trust của chúng tôi](https://trust.openclaw.ai) để biết hướng dẫn tiết lộ có trách nhiệm.

### Đề xuất một Biện pháp Giảm thiểu

Có ý tưởng về cách giải quyết một đe dọa hiện có? Mở một issue hoặc PR tham chiếu đến đe dọa đó. Các biện pháp giảm thiểu hữu ích là cụ thể và có thể thực hiện được - ví dụ, "giới hạn tốc độ gửi tin nhắn 10 tin/phút tại gateway" tốt hơn là "thực hiện giới hạn tốc độ."

### Đề xuất một Chuỗi Tấn công

Chuỗi tấn công cho thấy cách nhiều đe dọa kết hợp thành một kịch bản tấn công thực tế. Nếu bạn thấy một sự kết hợp nguy hiểm, hãy mô tả các bước và cách kẻ tấn công sẽ kết hợp chúng lại. Một câu chuyện ngắn về cách cuộc tấn công diễn ra trong thực tế có giá trị hơn là một mẫu chính thức.

### Sửa hoặc Cải thiện Nội dung Hiện có

Lỗi chính tả, làm rõ, thông tin lỗi thời, ví dụ tốt hơn - PRs được chào đón, không cần issue.

## Những Gì Chúng Tôi Sử Dụng

### MITRE ATLAS

Mô hình đe dọa này được xây dựng trên [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), một framework được thiết kế đặc biệt cho các mối đe dọa AI/ML như tiêm lệnh, lạm dụng công cụ và khai thác agent. Bạn không cần biết ATLAS để đóng góp - chúng tôi sẽ ánh xạ các đóng góp vào framework trong quá trình xem xét.

### ID Đe dọa

Mỗi đe dọa nhận được một ID như `T-EXEC-003`. Các danh mục bao gồm:

| Mã      | Danh mục                                    |
| ------- | -------------------------------------------- |
| RECON   | Trinh sát - thu thập thông tin               |
| ACCESS  | Truy cập ban đầu - xâm nhập                  |
| EXEC    | Thực thi - thực hiện hành động độc hại       |
| PERSIST | Duy trì - duy trì truy cập                   |
| EVADE   | Tránh né - tránh bị phát hiện                |
| DISC    | Khám phá - tìm hiểu về môi trường            |
| EXFIL   | Rò rỉ - đánh cắp dữ liệu                     |
| IMPACT  | Tác động - gây thiệt hại hoặc gián đoạn      |

ID được gán bởi người duy trì trong quá trình xem xét. Bạn không cần chọn một.

### Mức Độ Rủi ro

| Mức độ     | Ý nghĩa                                                            |
| ---------- | ------------------------------------------------------------------ |
| **Nghiêm trọng** | Toàn bộ hệ thống bị xâm nhập, hoặc khả năng cao + tác động nghiêm trọng |
| **Cao**    | Thiệt hại đáng kể có khả năng xảy ra, hoặc khả năng trung bình + tác động nghiêm trọng |
| **Trung bình** | Rủi ro vừa phải, hoặc khả năng thấp + tác động cao             |
| **Thấp**   | Không có khả năng và tác động hạn chế                              |

Nếu bạn không chắc về mức độ rủi ro, chỉ cần mô tả tác động và chúng tôi sẽ đánh giá.

## Quy Trình Xem Xét

1. **Phân loại** - Chúng tôi xem xét các đóng góp mới trong vòng 48 giờ
2. **Đánh giá** - Chúng tôi xác minh tính khả thi, gán ánh xạ ATLAS và ID đe dọa, xác nhận mức độ rủi ro
3. **Tài liệu** - Chúng tôi đảm bảo mọi thứ được định dạng và hoàn chỉnh
4. **Hợp nhất** - Thêm vào mô hình đe dọa và hình ảnh hóa

## Tài Nguyên

- [Trang web ATLAS](https://atlas.mitre.org/)
- [Kỹ thuật ATLAS](https://atlas.mitre.org/techniques/)
- [Nghiên cứu trường hợp ATLAS](https://atlas.mitre.org/studies/)
- [Mô hình Đe dọa OpenClaw](/security/THREAT-MODEL-ATLAS)

## Liên Hệ

- **Lỗ hổng bảo mật:** Xem trang [Trust của chúng tôi](https://trust.openclaw.ai) để biết hướng dẫn báo cáo
- **Câu hỏi về mô hình đe dọa:** Mở một issue trên [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Trò chuyện chung:** Kênh Discord #security

## Ghi Nhận

Những người đóng góp cho mô hình đe dọa được ghi nhận trong phần cảm ơn của mô hình đe dọa, ghi chú phát hành và bảng danh dự bảo mật của OpenClaw cho những đóng góp đáng kể.
