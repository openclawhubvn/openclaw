---
summary: "Khám phá cách cài đặt Bun và so sánh với pnpm. Tối ưu hóa hệ thống của bạn với công nghệ mới nhất."
read_when:
  - Bạn muốn vòng lặp phát triển local nhanh nhất (bun + watch)
  - Bạn gặp vấn đề với Bun install/patch/lifecycle script
title: "Hướng Dẫn Cài Đặt Bun - Trợ Lý AI"
---

# Bun (Thử nghiệm)

<Warning>
Bun **không được khuyến nghị cho runtime gateway** (có vấn đề đã biết với WhatsApp và Telegram). Sử dụng Node cho môi trường sản xuất.
</Warning>

Bun là một runtime tùy chọn để chạy trực tiếp TypeScript (`bun run ...`, `bun --watch ...`). Trình quản lý gói mặc định vẫn là `pnpm`, được hỗ trợ đầy đủ và sử dụng bởi công cụ tài liệu. Bun không thể sử dụng `pnpm-lock.yaml` và sẽ bỏ qua nó.

## Cài đặt

<Steps>
  <Step title="Cài đặt các phụ thuộc">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` được gitignore, nên không gây thay đổi trong repo. Để bỏ qua việc ghi lockfile hoàn toàn:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Xây dựng và kiểm tra">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Script Vòng đời

Bun chặn các script vòng đời phụ thuộc trừ khi được tin tưởng rõ ràng. Đối với repo này, các script thường bị chặn không cần thiết:

- `@whiskeysockets/baileys` `preinstall` -- kiểm tra Node major >= 20 (OpenClaw mặc định Node 24 và vẫn hỗ trợ Node 22 LTS, hiện tại là `22.16+`)
- `protobufjs` `postinstall` -- phát cảnh báo về các phiên bản không tương thích (không có build artifacts)

Nếu gặp vấn đề runtime cần các script này, hãy tin tưởng chúng rõ ràng:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Lưu ý

Một số script vẫn cứng nhắc sử dụng pnpm (ví dụ `docs:build`, `ui:*`, `protocol:check`). Hiện tại, hãy chạy chúng qua pnpm.
