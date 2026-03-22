---
title: "Đóng góp vào Mô hình Mối đe dọa"
summary: "Hướng dẫn đóng góp vào mô hình mối đe dọa của OpenClaw"
read_when:
  - Muốn đóng góp phát hiện bảo mật hoặc kịch bản mối đe dọa
  - Xem xét hoặc cập nhật mô hình mối đe dọa
---

# Đóng góp vào Mô hình Mối đe dọa của OpenClaw

Cảm ơn đã giúp OpenClaw an toàn hơn. Mô hình mối đe dọa này là tài liệu sống và hoan nghênh mọi đóng góp - không cần phải là chuyên gia bảo mật.

## Cách Đóng góp

### Thêm Mối đe dọa

Phát hiện vector tấn công hoặc rủi ro chưa được đề cập? Mở issue trên [openclaw/trust](https://github.com/openclaw/trust/issues) và mô tả theo cách của bạn. Không cần biết framework hay điền đủ mọi trường - chỉ cần mô tả kịch bản.

**Nên bao gồm (không bắt buộc):**

- Kịch bản tấn công và cách khai thác
- Phần nào của OpenClaw bị ảnh hưởng (CLI, gateway, channels, ClawHub, MCP servers, v.v.)
- Mức độ nghiêm trọng (thấp / trung bình / cao / nghiêm trọng)
- Liên kết đến nghiên cứu liên quan, CVE, hoặc ví dụ thực tế

Chúng tôi sẽ xử lý mapping ATLAS, ID mối đe dọa, và đánh giá rủi ro trong quá trình xem xét. Nếu muốn bao gồm chi tiết đó, rất tốt - nhưng không bắt buộc.

> **Đây là để thêm vào mô hình mối đe dọa, không phải báo cáo lỗ hổng đang hoạt động.** Nếu phát hiện lỗ hổng có thể khai thác, xem hướng dẫn công bố có trách nhiệm trên [Trang Trust](https://trust.openclaw.ai).

### Đề xuất Giải pháp

Có ý tưởng giải quyết mối đe dọa hiện có? Mở issue hoặc PR tham chiếu mối đe dọa. Giải pháp hữu ích là cụ thể và có thể thực hiện - ví dụ, "giới hạn tốc độ gửi 10 tin nhắn/phút tại gateway" tốt hơn "thực hiện giới hạn tốc độ."

### Đề xuất Chuỗi Tấn công

Chuỗi tấn công cho thấy cách nhiều mối đe dọa kết hợp thành kịch bản tấn công thực tế. Nếu thấy kết hợp nguy hiểm, mô tả các bước và cách kẻ tấn công kết hợp chúng. Một câu chuyện ngắn về cách tấn công diễn ra thực tế có giá trị hơn mẫu chính thức.

### Sửa hoặc Cải thiện Nội dung Hiện có

Lỗi chính tả, làm rõ, thông tin lỗi thời, ví dụ tốt hơn - PR được chào đón, không cần issue.

## Chúng tôi Sử dụng

### MITRE ATLAS

Mô hình mối đe dọa này dựa trên [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), framework thiết kế riêng cho mối đe dọa AI/ML như prompt injection, lạm dụng công cụ, và khai thác agent. Không cần biết ATLAS để đóng góp - chúng tôi sẽ map submissions vào framework trong quá trình xem xét.

### Threat IDs

Mỗi mối đe dọa có ID như `T-EXEC-003`. Các danh mục gồm:

| Mã      | Danh mục                                    |
| ------- | -------------------------------------------- |
| RECON   | Trinh sát - thu thập thông tin               |
| ACCESS  | Truy cập ban đầu - xâm nhập                  |
| EXEC    | Thực thi - thực hiện hành động độc hại       |
| PERSIST | Duy trì - giữ quyền truy cập                 |
| EVADE   | Né tránh - tránh bị phát hiện                |
| DISC    | Khám phá - tìm hiểu môi trường               |
| EXFIL   | Rò rỉ - đánh cắp dữ liệu                     |
| IMPACT  | Tác động - gây thiệt hại hoặc gián đoạn      |

ID được gán bởi người duy trì trong quá trình xem xét. Không cần chọn.

### Mức độ Rủi ro

| Mức độ     | Ý nghĩa                                                            |
| ---------- | ------------------------------------------------------------------ |
| **Nghiêm trọng** | Toàn bộ hệ thống bị xâm nhập, hoặc khả năng cao + tác động nghiêm trọng |
| **Cao**    | Thiệt hại đáng kể có khả năng xảy ra, hoặc khả năng trung bình + tác động nghiêm trọng |
| **Trung bình** | Rủi ro vừa phải, hoặc khả năng thấp + tác động cao             |
| **Thấp**   | Không có khả năng và tác động hạn chế                              |

Nếu không chắc về mức độ rủi ro, chỉ cần mô tả tác động và chúng tôi sẽ đánh giá.

## Quy trình Xem xét

1. **Phân loại** - Xem xét submissions mới trong 48 giờ
2. **Đánh giá** - Xác minh tính khả thi, gán mapping ATLAS và ID mối đe dọa, xác thực mức độ rủi ro
3. **Tài liệu** - Đảm bảo mọi thứ được định dạng và hoàn chỉnh
4. **Hợp nhất** - Thêm vào mô hình mối đe dọa và visualization

## Tài nguyên

- [Trang web ATLAS](https://atlas.mitre.org/)
- [Kỹ thuật ATLAS](https://atlas.mitre.org/techniques/)
- [Nghiên cứu trường hợp ATLAS](https://atlas.mitre.org/studies/)
- [Mô hình Mối đe dọa OpenClaw](/security/THREAT-MODEL-ATLAS)

## Liên hệ

- **Lỗ hổng bảo mật:** Xem hướng dẫn báo cáo trên [Trang Trust](https://trust.openclaw.ai)
- **Câu hỏi về mô hình mối đe dọa:** Mở issue trên [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Trò chuyện chung:** Kênh Discord #security

## Ghi nhận

Những người đóng góp vào mô hình mối đe dọa được ghi nhận trong acknowledgments của mô hình, ghi chú phát hành, và bảng danh dự bảo mật của OpenClaw cho những đóng góp đáng kể.\n