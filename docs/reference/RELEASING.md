---
title: "Hướng Dẫn Chính Sách Phát Hành OpenClaw"
summary: "Khám phá kênh phát hành, quy tắc đặt tên phiên bản và tần suất phát hành cho OpenClaw. Tối ưu hóa quy trình của bạn ngay hôm nay."
read_when:
  - Tìm kiếm định nghĩa về kênh phát hành công khai
  - Tìm kiếm cách đặt tên phiên bản và tần suất phát hành
---

# Chính sách phát hành

OpenClaw có ba kênh phát hành công khai:

- stable: các phiên bản đã được gắn thẻ và phát hành trên npm `latest`
- beta: các thẻ phát hành trước và phát hành trên npm `beta`
- dev: phiên bản mới nhất của `main`

## Cách đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.D`
  - Thẻ Git: `vYYYY.M.D`
- Phiên bản phát hành trước beta: `YYYY.M.D-beta.N`
  - Thẻ Git: `vYYYY.M.D-beta.N`
- Không thêm số 0 vào tháng hoặc ngày
- `latest` nghĩa là phiên bản ổn định hiện tại trên npm
- `beta` nghĩa là phiên bản phát hành trước hiện tại trên npm
- Các phiên bản beta có thể phát hành trước khi ứng dụng macOS bắt kịp

## Tần suất phát hành

- Các phiên bản phát hành theo thứ tự beta trước
- Phiên bản ổn định chỉ phát hành sau khi phiên bản beta mới nhất được xác nhận
- Quy trình phát hành chi tiết, phê duyệt, thông tin đăng nhập và ghi chú khôi phục chỉ dành cho người duy trì

## Tham khảo công khai

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)

Người duy trì sử dụng tài liệu phát hành riêng tư trong
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
cho hướng dẫn thực tế.
