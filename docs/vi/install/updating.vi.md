# Cập nhật

Giữ OpenClaw luôn mới nhất.

## Khuyến nghị: `openclaw update`

Cách nhanh nhất để cập nhật. Tự động nhận diện kiểu cài đặt (npm hoặc git), lấy phiên bản mới nhất, chạy `openclaw doctor`, và khởi động lại gateway.

```bash
openclaw update
```

Để chuyển kênh hoặc chọn phiên bản cụ thể:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # xem trước mà không áp dụng
```

Xem [Kênh phát triển](/install/development-channels) để hiểu rõ hơn về kênh.

## Cách khác: chạy lại installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Thêm `--no-onboard` để bỏ qua onboarding. Với cài đặt từ source, dùng `--install-method git --no-onboard`.

## Cách khác: thủ công với npm hoặc pnpm

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

## Auto-updater

Auto-updater mặc định tắt. Bật trong `~/.openclaw/openclaw.json`:

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
| `stable` | Chờ `stableDelayHours`, sau đó áp dụng với jitter ngẫu nhiên trong `stableJitterHours` (triển khai dần).     |
| `beta`   | Kiểm tra mỗi `betaCheckIntervalHours` (mặc định: mỗi giờ) và áp dụng ngay.                                   |
| `dev`    | Không tự động áp dụng. Dùng `openclaw update` thủ công.                                                      |

Gateway cũng ghi log gợi ý cập nhật khi khởi động (tắt với `update.checkOnStart: false`).

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

### Kiểm tra

```bash
openclaw health
```

</Steps>

## Rollback

### Ghim phiên bản (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Mẹo: `npm view openclaw version` để xem phiên bản hiện tại đã phát hành.

### Ghim commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Để quay lại phiên bản mới nhất: `git checkout main && git pull`.

## Nếu gặp khó khăn

- Chạy lại `openclaw doctor` và đọc kỹ output.
- Kiểm tra: [Troubleshooting](/gateway/troubleshooting)
- Hỏi trên Discord: [https://discord.gg/clawd](https://discord.gg/clawd)\n