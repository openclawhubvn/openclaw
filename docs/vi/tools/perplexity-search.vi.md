---
summary: "Perplexity Search API và tương thích Sonar/OpenRouter cho web_search"
read_when:
  - Muốn dùng Perplexity Search để tìm kiếm web
  - Cần thiết lập PERPLEXITY_API_KEY hoặc OPENROUTER_API_KEY
title: "Perplexity Search"
---

# Perplexity Search API

OpenClaw hỗ trợ Perplexity Search API làm `web_search` provider. Kết quả trả về có cấu trúc với các trường `title`, `url`, và `snippet`.

Để tương thích, OpenClaw cũng hỗ trợ cấu hình cũ của Perplexity Sonar/OpenRouter. Nếu dùng `OPENROUTER_API_KEY`, khóa `sk-or-...` trong `plugins.entries.perplexity.config.webSearch.apiKey`, hoặc thiết lập `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, provider sẽ chuyển sang đường dẫn chat-completions và trả về câu trả lời AI có trích dẫn thay vì kết quả Search API có cấu trúc.

## Lấy Perplexity API key

1. Tạo tài khoản Perplexity tại [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Tạo API key trong dashboard
3. Lưu key vào config hoặc thiết lập `PERPLEXITY_API_KEY` trong môi trường Gateway.

## Tương thích OpenRouter

Nếu đã dùng OpenRouter cho Perplexity Sonar, giữ `provider: "perplexity"` và thiết lập `OPENROUTER_API_KEY` trong môi trường Gateway, hoặc lưu khóa `sk-or-...` trong `plugins.entries.perplexity.config.webSearch.apiKey`.

Các tùy chọn tương thích:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Ví dụ cấu hình

### Native Perplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### Tương thích OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## Nơi đặt key

**Qua config:** chạy `openclaw configure --section web`. Key sẽ được lưu trong
`~/.openclaw/openclaw.json` dưới `plugins.entries.perplexity.config.webSearch.apiKey`.
Trường này cũng chấp nhận SecretRef objects.

**Qua môi trường:** thiết lập `PERPLEXITY_API_KEY` hoặc `OPENROUTER_API_KEY`
trong môi trường process Gateway. Với cài đặt gateway, đặt trong
`~/.openclaw/.env` (hoặc môi trường dịch vụ). Xem [Env vars](/help/faq#how-does-openclaw-load-environment-variables).

Nếu `provider: "perplexity"` được cấu hình và Perplexity key SecretRef không được giải quyết mà không có fallback từ môi trường, khởi động/tải lại sẽ thất bại ngay.

## Tham số công cụ

Các tham số này áp dụng cho đường dẫn native Perplexity Search API.

| Tham số               | Mô tả                                                |
| --------------------- | ---------------------------------------------------- |
| `query`               | Truy vấn tìm kiếm (bắt buộc)                         |
| `count`               | Số kết quả trả về (1-10, mặc định: 5)                |
| `country`             | Mã quốc gia ISO 2 chữ cái (ví dụ: "US", "DE")        |
| `language`            | Mã ngôn ngữ ISO 639-1 (ví dụ: "en", "de", "fr")      |
| `freshness`           | Bộ lọc thời gian: `day` (24h), `week`, `month`, `year` |
| `date_after`          | Chỉ kết quả sau ngày này (YYYY-MM-DD)                |
| `date_before`         | Chỉ kết quả trước ngày này (YYYY-MM-DD)              |
| `domain_filter`       | Mảng allowlist/denylist domain (tối đa 20)           |
| `max_tokens`          | Ngân sách nội dung tổng (mặc định: 25000, tối đa: 1000000) |
| `max_tokens_per_page` | Giới hạn token mỗi trang (mặc định: 2048)            |

Với đường dẫn tương thích Sonar/OpenRouter cũ, chỉ hỗ trợ `query` và `freshness`.
Các bộ lọc chỉ dành cho Search API như `country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, và `max_tokens_per_page` sẽ trả lỗi rõ ràng.

**Ví dụ:**

```javascript
// Tìm kiếm theo quốc gia và ngôn ngữ
await web_search({
  query: "năng lượng tái tạo",
  country: "DE",
  language: "de",
});

// Kết quả gần đây (tuần qua)
await web_search({
  query: "tin tức AI",
  freshness: "week",
});

// Tìm kiếm theo khoảng thời gian
await web_search({
  query: "phát triển AI",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Lọc domain (allowlist)
await web_search({
  query: "nghiên cứu khí hậu",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Lọc domain (denylist - thêm tiền tố -)
await web_search({
  query: "đánh giá sản phẩm",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Trích xuất nội dung nhiều hơn
await web_search({
  query: "nghiên cứu AI chi tiết",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Quy tắc lọc domain

- Tối đa 20 domain mỗi bộ lọc
- Không thể trộn allowlist và denylist trong cùng một yêu cầu
- Dùng tiền tố `-` cho các mục denylist (ví dụ: `["-reddit.com"]`)

## Ghi chú

- Perplexity Search API trả về kết quả tìm kiếm web có cấu trúc (`title`, `url`, `snippet`)
- OpenRouter hoặc `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` chuyển Perplexity về Sonar chat completions để tương thích
- Kết quả được cache mặc định 15 phút (có thể cấu hình qua `cacheTtlMinutes`)

Xem [Web tools](/tools/web) để biết cấu hình web_search đầy đủ.
Xem [Perplexity Search API docs](https://docs.perplexity.ai/docs/search/quickstart) để biết thêm chi tiết.\n