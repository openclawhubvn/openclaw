---
title: "Perplexity (Provider)"
summary: "Thiết lập nhà cung cấp tìm kiếm web Perplexity (API key, chế độ tìm kiếm, lọc)"
read_when:
  - Bạn muốn cấu hình Perplexity làm nhà cung cấp tìm kiếm web
  - Bạn cần API key của Perplexity hoặc thiết lập proxy OpenRouter
---

# Perplexity (Nhà cung cấp tìm kiếm web)

Plugin Perplexity cung cấp khả năng tìm kiếm web thông qua Perplexity Search API hoặc Perplexity Sonar qua OpenRouter.

<Note>
Trang này hướng dẫn thiết lập **nhà cung cấp** Perplexity. Để biết cách sử dụng **công cụ** Perplexity (cách agent sử dụng), xem [công cụ Perplexity](/tools/perplexity-search).
</Note>

- Loại: nhà cung cấp tìm kiếm web (không phải nhà cung cấp mô hình)
- Xác thực: `PERPLEXITY_API_KEY` (trực tiếp) hoặc `OPENROUTER_API_KEY` (qua OpenRouter)
- Đường dẫn cấu hình: `plugins.entries.perplexity.config.webSearch.apiKey`

## Bắt đầu nhanh

1. Thiết lập API key:

```bash
openclaw configure --section web
```

Hoặc thiết lập trực tiếp:

```bash
openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
```

2. Agent sẽ tự động sử dụng Perplexity cho tìm kiếm web khi đã cấu hình.

## Chế độ tìm kiếm

Plugin tự động chọn phương thức dựa trên tiền tố của API key:

| Tiền tố key | Phương thức                   | Tính năng                                          |
| ----------- | ----------------------------- | -------------------------------------------------- |
| `pplx-`     | Native Perplexity Search API  | Kết quả có cấu trúc, bộ lọc miền/ngôn ngữ/ngày     |
| `sk-or-`    | OpenRouter (Sonar)            | Câu trả lời tổng hợp AI kèm trích dẫn              |

## Lọc API gốc

Khi sử dụng API gốc của Perplexity (key `pplx-`), tìm kiếm hỗ trợ:

- **Quốc gia**: mã quốc gia 2 chữ cái
- **Ngôn ngữ**: mã ngôn ngữ ISO 639-1
- **Khoảng thời gian**: ngày, tuần, tháng, năm
- **Bộ lọc miền**: danh sách cho phép/chặn (tối đa 20 miền)
- **Ngân sách nội dung**: `max_tokens`, `max_tokens_per_page`

## Lưu ý về môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `PERPLEXITY_API_KEY` có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).
