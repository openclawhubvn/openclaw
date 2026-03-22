---
summary: "Tìm hiểu cách cấu hình cờ chẩn đoán để tối ưu hóa quá trình gỡ lỗi và cải thiện hiệu suất hệ thống của bạn."
read_when:
  - Cần nhật ký gỡ lỗi mục tiêu mà không cần tăng mức độ ghi nhật ký toàn cầu
  - Cần thu thập nhật ký cụ thể của từng hệ thống con để hỗ trợ
title: "Hướng Dẫn Cấu Hình Cờ Chẩn Đoán"
---

# Cờ Chẩn Đoán

Cờ chẩn đoán cho phép bật nhật ký gỡ lỗi mục tiêu mà không cần bật ghi nhật ký chi tiết ở mọi nơi. Cờ này là tùy chọn và không có tác dụng trừ khi một hệ thống con kiểm tra chúng.

## Cách hoạt động

- Cờ là chuỗi ký tự (không phân biệt chữ hoa chữ thường).
- Có thể bật cờ trong cấu hình hoặc thông qua ghi đè môi trường.
- Hỗ trợ ký tự đại diện:
  - `telegram.*` khớp với `telegram.http`
  - `*` bật tất cả các cờ

## Bật qua cấu hình

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

## Ghi đè môi trường (một lần)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Tắt tất cả cờ:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Nơi lưu nhật ký

Cờ sẽ ghi nhật ký vào tệp nhật ký chẩn đoán tiêu chuẩn. Mặc định:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Nếu bạn đặt `logging.file`, hãy sử dụng đường dẫn đó. Nhật ký ở định dạng JSONL (mỗi đối tượng JSON trên một dòng). Việc che giấu vẫn áp dụng dựa trên `logging.redactSensitive`.

## Trích xuất nhật ký

Chọn tệp nhật ký mới nhất:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Lọc nhật ký chẩn đoán Telegram HTTP:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Hoặc theo dõi khi tái tạo:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Đối với các gateway từ xa, bạn cũng có thể sử dụng `openclaw logs --follow` (xem [/cli/logs](/cli/logs)).

## Lưu ý

- Nếu `logging.level` được đặt cao hơn `warn`, các nhật ký này có thể bị ẩn. Mặc định `info` là ổn.
- Cờ an toàn để bật; chúng chỉ ảnh hưởng đến khối lượng nhật ký của hệ thống con cụ thể.
- Sử dụng [/logging](/logging) để thay đổi đích đến, mức độ và việc che giấu nhật ký.
