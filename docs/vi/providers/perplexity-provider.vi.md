---
title: "Perplexity (Provider)"
summary: "Thiết lập Perplexity web search provider (API key, search modes, filtering)"
read_when:
  - Cần cấu hình Perplexity làm web search provider
  - Cần API key của Perplexity hoặc thiết lập proxy OpenRouter
---

# Perplexity (Web Search Provider)

Plugin Perplexity cung cấp khả năng tìm kiếm web qua Perplexity Search API hoặc Perplexity Sonar qua OpenRouter.

<Note>
Trang này hướng dẫn thiết lập **provider** Perplexity. Để biết cách dùng **tool** Perplexity (cách agent sử dụng), xem [Perplexity tool](/tools/perplexity-search).
</Note>

- Loại: web search provider (không phải model provider)
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

2. Agent sẽ tự động dùng Perplexity cho tìm kiếm web khi đã cấu hình.

## Chế độ tìm kiếm

Plugin tự chọn phương thức dựa trên tiền tố API key:

| Tiền tố key | Phương thức                  | Tính năng                                         |
| ----------- | ---------------------------- | ------------------------------------------------- |
| `pplx-`     | Native Perplexity Search API | Kết quả có cấu trúc, lọc theo domain/ngôn ngữ/ngày |
| `sk-or-`    | OpenRouter (Sonar)           | Câu trả lời AI có trích dẫn                        |

## Lọc API gốc

Khi dùng API gốc Perplexity (`pplx-` key), tìm kiếm hỗ trợ:

- **Country**: Mã quốc gia 2 chữ cái
- **Language**: Mã ngôn ngữ ISO 639-1
- **Date range**: ngày, tuần, tháng, năm
- **Domain filters**: danh sách cho phép/chặn (tối đa 20 domain)
- **Content budget**: `max_tokens`, `max_tokens_per_page`

## Lưu ý môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `PERPLEXITY_API_KEY` có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).\n