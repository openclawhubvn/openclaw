---
title: "Hướng Dẫn Ngữ Nghĩa Chứng Thực Credential"
summary: "Tìm hiểu ngữ nghĩa và cách xử lý credential trong hồ sơ chứng thực, đảm bảo an toàn và hiệu quả."
read_when:
  - Làm việc với việc giải quyết hồ sơ chứng thực hoặc định tuyến credential
  - Gỡ lỗi các lỗi chứng thực mô hình hoặc thứ tự hồ sơ
---

# Ngữ Nghĩa Chứng Thực Credential

Tài liệu này định nghĩa ngữ nghĩa chuẩn về điều kiện và cách giải quyết credential được sử dụng trong:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Mục tiêu là giữ cho hành vi khi chọn và khi chạy đồng nhất.

## Mã Lý Do Ổn Định

- `ok`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`

## Credential Token

Credential token (`type: "token"`) hỗ trợ `token` và/hoặc `tokenRef` trực tiếp.

### Quy tắc điều kiện

1. Hồ sơ token không đủ điều kiện khi cả `token` và `tokenRef` đều không có.
2. `expires` là tùy chọn.
3. Nếu có `expires`, nó phải là một số hữu hạn lớn hơn `0`.
4. Nếu `expires` không hợp lệ (`NaN`, `0`, âm, không hữu hạn, hoặc sai kiểu), hồ sơ không đủ điều kiện với `invalid_expires`.
5. Nếu `expires` đã qua, hồ sơ không đủ điều kiện với `expired`.
6. `tokenRef` không bỏ qua việc kiểm tra `expires`.

### Quy tắc giải quyết

1. Ngữ nghĩa của bộ giải quyết khớp với ngữ nghĩa điều kiện cho `expires`.
2. Đối với các hồ sơ đủ điều kiện, token có thể được giải quyết từ giá trị trực tiếp hoặc `tokenRef`.
3. Các tham chiếu không thể giải quyết sẽ tạo ra `unresolved_ref` trong kết quả `models status --probe`.

## Thông Điệp Tương Thích Với Legacy

Để tương thích với script, các lỗi probe giữ nguyên dòng đầu tiên này:

`Auth profile credentials are missing or expired.`

Chi tiết thân thiện với người dùng và mã lý do ổn định có thể được thêm vào các dòng tiếp theo.
