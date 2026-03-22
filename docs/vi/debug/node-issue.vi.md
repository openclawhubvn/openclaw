---
summary: Ghi chú và cách khắc phục lỗi "__name is not a function" khi chạy Node + tsx
read_when:
  - Debug script dev chỉ chạy Node hoặc lỗi watch mode
  - Điều tra lỗi crash tsx/esbuild loader trong OpenClaw
title: "Lỗi Node + tsx"
---

# Lỗi Node + tsx "\_\_name is not a function"

## Tóm tắt

Chạy OpenClaw qua Node với `tsx` bị lỗi ngay khi khởi động:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Lỗi này xuất hiện sau khi chuyển script dev từ Bun sang `tsx` (commit `2871657e`, 2026-01-06). Trước đó chạy Bun không gặp lỗi.

## Môi trường

- Node: v25.x (thấy trên v25.3.0)
- tsx: 4.21.0
- OS: macOS (có thể tái hiện trên các nền tảng khác chạy Node 25)

## Tái hiện (chỉ Node)

```bash
# tại repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Tái hiện tối thiểu trong repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Kiểm tra phiên bản Node

- Node 25.3.0: lỗi
- Node 22.22.0 (Homebrew `node@22`): lỗi
- Node 24: chưa cài; cần kiểm tra thêm

## Ghi chú / giả thuyết

- `tsx` dùng esbuild để transform TS/ESM. esbuild’s `keepNames` tạo ra `__name` helper và bọc định nghĩa hàm với `__name(...)`.
- Lỗi cho thấy `__name` tồn tại nhưng không phải hàm khi runtime, có thể helper bị thiếu hoặc bị ghi đè trong Node 25 loader path.
- Các vấn đề tương tự với `__name` đã được báo cáo trong các consumer esbuild khác khi helper bị thiếu hoặc bị ghi đè.

## Lịch sử hồi quy

- `2871657e` (2026-01-06): script chuyển từ Bun sang tsx để làm Bun tùy chọn.
- Trước đó (Bun path), `openclaw status` và `gateway:watch` chạy tốt.

## Cách khắc phục

- Dùng Bun cho script dev (tạm thời quay lại).
- Dùng Node + tsc watch, sau đó chạy output đã compile:

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

- Đã xác nhận local: `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status` chạy tốt trên Node 25.
- Tắt esbuild keepNames trong TS loader nếu có thể (ngăn chèn `__name` helper); tsx hiện không hỗ trợ.
- Test Node LTS (22/24) với `tsx` để xem lỗi có phải chỉ Node 25.

## Tham khảo

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Bước tiếp theo

- Tái hiện trên Node 22/24 để xác nhận hồi quy Node 25.
- Test `tsx` nightly hoặc ghim về phiên bản trước nếu có hồi quy đã biết.
- Nếu tái hiện trên Node LTS, gửi báo cáo tối thiểu upstream với stack trace `__name`.\n