---
summary: "Hướng dẫn chi tiết cách xử lý lỗi crash Node.js khi sử dụng TSX, giúp hệ thống hoạt động ổn định và hiệu quả hơn."
read_when:
  - Gặp lỗi khi debug script dev chỉ chạy trên Node hoặc chế độ watch
  - Điều tra lỗi crash của tsx/esbuild loader trong OpenClaw
title: "Khắc Phục Lỗi Crash Node.js Với TSX"
---

# Lỗi Crash Node + tsx "\_\_name is not a function"

## Tóm tắt

Khi chạy OpenClaw qua Node với `tsx`, chương trình gặp lỗi ngay khi khởi động:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Lỗi này xuất hiện sau khi chuyển script dev từ Bun sang `tsx` (commit `2871657e`, ngày 06-01-2026). Trước đó, đường dẫn runtime này hoạt động tốt với Bun.

## Môi trường

- Node: v25.x (quan sát trên v25.3.0)
- tsx: 4.21.0
- Hệ điều hành: macOS (có thể tái hiện trên các nền tảng khác chạy Node 25)

## Tái hiện lỗi (chỉ với Node)

```bash
# tại thư mục gốc của repo
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Tái hiện lỗi tối thiểu trong repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Kiểm tra phiên bản Node

- Node 25.3.0: gặp lỗi
- Node 22.22.0 (Homebrew `node@22`): gặp lỗi
- Node 24: chưa cài đặt; cần xác minh thêm

## Ghi chú / giả thuyết

- `tsx` sử dụng esbuild để chuyển đổi TS/ESM. Tính năng `keepNames` của esbuild tạo ra một helper `__name` và bao bọc định nghĩa hàm với `__name(...)`.
- Lỗi này cho thấy `__name` tồn tại nhưng không phải là một hàm khi chạy, điều này ngụ ý helper bị thiếu hoặc bị ghi đè trong đường dẫn loader của Node 25.
- Các vấn đề tương tự với helper `__name` đã được báo cáo trong các trường hợp khác khi helper bị thiếu hoặc bị ghi đè.

## Lịch sử hồi quy

- `2871657e` (06-01-2026): script chuyển từ Bun sang tsx để làm cho Bun không bắt buộc.
- Trước đó (đường dẫn Bun), `openclaw status` và `gateway:watch` hoạt động tốt.

## Cách khắc phục

- Sử dụng Bun cho script dev (tạm thời quay lại).
- Sử dụng Node + tsc watch, sau đó chạy output đã biên dịch:

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

- Đã xác nhận tại chỗ: `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status` hoạt động trên Node 25.
- Tắt esbuild keepNames trong TS loader nếu có thể (ngăn chặn chèn helper `__name`); hiện tại tsx không hỗ trợ điều này.
- Thử nghiệm Node LTS (22/24) với `tsx` để xem liệu vấn đề có chỉ xảy ra trên Node 25 hay không.

## Tham khảo

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Bước tiếp theo

- Tái hiện lỗi trên Node 22/24 để xác nhận hồi quy trên Node 25.
- Thử nghiệm `tsx` phiên bản nightly hoặc quay lại phiên bản trước nếu có hồi quy đã biết.
- Nếu lỗi tái hiện trên Node LTS, gửi báo cáo tối thiểu lên upstream với stack trace của `__name`.
