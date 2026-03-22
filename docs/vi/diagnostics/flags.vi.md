---
summary: "Cờ chẩn đoán cho log debug mục tiêu"
read_when:
  - Cần log debug mục tiêu mà không tăng mức log toàn cục
  - Cần thu thập log theo từng subsystem để hỗ trợ
title: "Cờ Chẩn Đoán"
---

# Cờ Chẩn Đoán

Cờ chẩn đoán cho phép bật log debug mục tiêu mà không cần bật log chi tiết toàn bộ hệ thống. Cờ này chỉ có tác dụng khi subsystem kiểm tra chúng.

## Cách hoạt động

- Cờ là chuỗi ký tự (không phân biệt hoa thường).
- Có thể bật cờ trong config hoặc qua env override.
- Hỗ trợ wildcard:
  - `telegram.*` khớp với `telegram.http`
  - `*` bật tất cả cờ

## Bật qua config

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Nhiều cờ:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Khởi động lại gateway sau khi thay đổi cờ.

## Env override (một lần)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Tắt tất cả cờ:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Log đi đâu

Cờ sẽ ghi log vào file log chẩn đoán chuẩn. Mặc định:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Nếu đã đặt `logging.file`, dùng đường dẫn đó. Log là JSONL (mỗi dòng là một đối tượng JSON). Vẫn áp dụng redaction theo `logging.redactSensitive`.

## Trích xuất log

Chọn file log mới nhất:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Lọc log cho Telegram HTTP:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Hoặc tail khi tái hiện lỗi:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Với gateway từ xa, có thể dùng `openclaw logs --follow` (xem [/cli/logs](/cli/logs)).

## Lưu ý

- Nếu `logging.level` đặt cao hơn `warn`, log này có thể bị ẩn. Mặc định `info` là ổn.
- Cờ an toàn để bật lâu dài; chỉ ảnh hưởng đến lượng log của subsystem cụ thể.
- Dùng [/logging](/logging) để thay đổi đích log, mức độ và redaction.\n