---
summary: "Tìm hiểu cách cập nhật OpenClaw an toàn với hướng dẫn chi tiết và chiến lược quay lui hiệu quả."
read_when:
  - Cập nhật OpenClaw
  - Có sự cố sau khi cập nhật
title: "Hướng Dẫn Cập Nhật OpenClaw An Toàn"
---

# Cập nhật

Giữ cho OpenClaw luôn được cập nhật.

## Khuyến nghị: `openclaw update`

Cách nhanh nhất để cập nhật. Nó tự động phát hiện kiểu cài đặt (npm hoặc git), tải phiên bản mới nhất, chạy `openclaw doctor`, và khởi động lại gateway.

```bash
openclaw update
```

Để chuyển kênh hoặc chọn phiên bản cụ thể:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # xem trước mà không áp dụng
```

Xem [Kênh phát triển](/install/development-channels) để biết ý nghĩa của các kênh.

## Cách khác: chạy lại trình cài đặt

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Thêm `--no-onboard` để bỏ qua phần giới thiệu. Đối với cài đặt từ nguồn, sử dụng `--install-method git --no-onboard`.

## Cách khác: npm hoặc pnpm thủ công

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

## Tự động cập nhật

Tính năng tự động cập nhật mặc định bị tắt. Kích hoạt trong `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Kênh     | Hành vi                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Chờ `stableDelayHours`, sau đó áp dụng với độ trễ ngẫu nhiên trong `stableJitterHours` (triển khai dần).     |
| `beta`   | Kiểm tra mỗi `betaCheckIntervalHours` (mặc định: hàng giờ) và áp dụng ngay lập tức.                          |
| `dev`    | Không tự động áp dụng. Sử dụng `openclaw update` thủ công.                                                   |

Gateway cũng ghi lại gợi ý cập nhật khi khởi động (tắt với `update.checkOnStart: false`).

## Sau khi cập nhật

<Steps>

### Chạy doctor

```bash
openclaw doctor
```

Di chuyển cấu hình, kiểm tra chính sách DM, và kiểm tra sức khỏe gateway. Chi tiết: [Doctor](/gateway/doctor)

### Khởi động lại gateway

```bash
openclaw gateway restart
```

### Xác minh

```bash
openclaw health
```

</Steps>

## Quay lui

### Ghim một phiên bản (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Mẹo: `npm view openclaw version` hiển thị phiên bản hiện tại đã phát hành.

### Ghim một commit (nguồn)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Để quay lại phiên bản mới nhất: `git checkout main && git pull`.

## Nếu gặp khó khăn

- Chạy lại `openclaw doctor` và đọc kỹ kết quả.
- Kiểm tra: [Khắc phục sự cố](/gateway/troubleshooting)
- Hỏi trên Discord: [https://discord.gg/clawd](https://discord.gg/clawd)
