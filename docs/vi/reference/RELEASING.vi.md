---
title: "Chính sách phát hành"
summary: "Các kênh phát hành công khai, cách đặt tên phiên bản và tần suất phát hành"
read_when:
  - Tìm định nghĩa kênh phát hành công khai
  - Tìm cách đặt tên phiên bản và tần suất phát hành
---

# Chính sách phát hành

OpenClaw có ba kênh phát hành công khai:

- stable: các bản phát hành gắn thẻ, xuất bản lên npm `latest`
- beta: các thẻ phát hành trước, xuất bản lên npm `beta`
- dev: phiên bản mới nhất của `main`

## Cách đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.D`
  - Git tag: `vYYYY.M.D`
- Phiên bản phát hành trước beta: `YYYY.M.D-beta.N`
  - Git tag: `vYYYY.M.D-beta.N`
- Không thêm số 0 vào tháng hoặc ngày
- `latest` là bản phát hành ổn định hiện tại trên npm
- `beta` là bản phát hành trước hiện tại trên npm
- Các bản phát hành beta có thể ra trước khi ứng dụng macOS cập nhật kịp

## Tần suất phát hành

- Phát hành theo thứ tự beta trước
- Bản ổn định chỉ theo sau khi beta mới nhất được xác nhận
- Quy trình phát hành chi tiết, phê duyệt, thông tin đăng nhập và ghi chú khôi phục chỉ dành cho người duy trì

## Tham khảo công khai

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)

Người duy trì sử dụng tài liệu phát hành riêng tư trong
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
cho hướng dẫn thực tế.\n