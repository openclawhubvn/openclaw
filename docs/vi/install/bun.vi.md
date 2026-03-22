# Bun (Experimental)

> **Cảnh báo**  
> Bun **không khuyến nghị** dùng cho gateway runtime (có vấn đề với WhatsApp và Telegram). Dùng Node cho production.

Bun là runtime tùy chọn để chạy trực tiếp TypeScript (`bun run ...`, `bun --watch ...`). Package manager mặc định vẫn là `pnpm`, được hỗ trợ đầy đủ và dùng cho tài liệu. Bun không dùng được `pnpm-lock.yaml` và sẽ bỏ qua file này.

## Cài đặt

### Cài đặt dependencies

```sh
bun install
```

`bun.lock` / `bun.lockb` bị gitignore, nên không ảnh hưởng repo. Để bỏ qua ghi lockfile hoàn toàn:

```sh
bun install --no-save
```

### Build và test

```sh
bun run build
bun run vitest run
```

## Lifecycle Scripts

Bun chặn các script lifecycle của dependency trừ khi được tin tưởng rõ ràng. Với repo này, các script thường bị chặn không cần thiết:

- `@whiskeysockets/baileys` `preinstall` -- kiểm tra Node major >= 20 (OpenClaw mặc định Node 24 và vẫn hỗ trợ Node 22 LTS, hiện tại `22.16+`)
- `protobufjs` `postinstall` -- cảnh báo về các scheme version không tương thích (không có build artifacts)

Nếu gặp vấn đề runtime cần các script này, hãy tin tưởng chúng rõ ràng:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Lưu ý

Một số script vẫn hardcode pnpm (ví dụ `docs:build`, `ui:*`, `protocol:check`). Tạm thời chạy chúng qua pnpm.\n