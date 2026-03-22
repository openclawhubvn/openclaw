---
title: "Ngữ nghĩa thông tin xác thực Auth"
summary: "Ngữ nghĩa chuẩn về điều kiện và cách giải quyết thông tin xác thực cho các hồ sơ auth"
read_when:
  - Làm việc với giải quyết hồ sơ auth hoặc định tuyến thông tin xác thực
  - Debug lỗi auth model hoặc thứ tự hồ sơ
---

# Ngữ nghĩa thông tin xác thực Auth

Tài liệu này định nghĩa ngữ nghĩa chuẩn về điều kiện và cách giải quyết thông tin xác thực được sử dụng trong:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Mục tiêu là giữ cho hành vi lúc chọn và lúc chạy đồng nhất.

## Mã lý do ổn định

- `ok`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`

## Thông tin xác thực Token

Thông tin xác thực Token (`type: "token"`) hỗ trợ `token` và/hoặc `tokenRef` inline.

### Quy tắc điều kiện

1. Hồ sơ token không đủ điều kiện khi cả `token` và `tokenRef` đều không có.
2. `expires` là tùy chọn.
3. Nếu có `expires`, phải là số hữu hạn lớn hơn `0`.
4. Nếu `expires` không hợp lệ (`NaN`, `0`, âm, không hữu hạn, hoặc sai kiểu), hồ sơ không đủ điều kiện với `invalid_expires`.
5. Nếu `expires` đã qua, hồ sơ không đủ điều kiện với `expired`.
6. `tokenRef` không bỏ qua kiểm tra `expires`.

### Quy tắc giải quyết

1. Ngữ nghĩa giải quyết khớp với ngữ nghĩa điều kiện cho `expires`.
2. Với hồ sơ đủ điều kiện, thông tin token có thể được giải quyết từ giá trị inline hoặc `tokenRef`.
3. Ref không giải quyết được sẽ tạo `unresolved_ref` trong output của `models status --probe`.

## Thông điệp tương thích Legacy

Để tương thích với script, lỗi probe giữ nguyên dòng đầu tiên:

`Auth profile credentials are missing or expired.`

Chi tiết thân thiện với người dùng và mã lý do ổn định có thể được thêm vào các dòng tiếp theo.\n