---
summary: "API Tìm kiếm Perplexity và khả năng tương thích Sonar/OpenRouter cho web_search"
read_when:
  - Bạn muốn sử dụng Tìm kiếm Perplexity cho tìm kiếm web
  - Bạn cần thiết lập PERPLEXITY_API_KEY hoặc OPENROUTER_API_KEY
title: "Tìm kiếm Perplexity"
---

# API Tìm kiếm Perplexity

OpenClaw hỗ trợ API Tìm kiếm Perplexity như một nhà cung cấp `web_search`.
Nó trả về kết quả có cấu trúc với các trường `title`, `url`, và `snippet`.

Để tương thích, OpenClaw cũng hỗ trợ các thiết lập Perplexity Sonar/OpenRouter cũ.
Nếu sử dụng `OPENROUTER_API_KEY`, một khóa `sk-or-...` trong `plugins.entries.perplexity.config.webSearch.apiKey`, hoặc thiết lập `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, nhà cung cấp sẽ chuyển sang đường dẫn chat-completions và trả về câu trả lời tổng hợp AI kèm trích dẫn thay vì kết quả API Tìm kiếm có cấu trúc.

## Lấy khóa API Perplexity

1. Tạo tài khoản Perplexity tại [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Tạo khóa API trong dashboard
3. Lưu khóa vào cấu hình hoặc thiết lập `PERPLEXITY_API_KEY` trong môi trường Gateway.

## Khả năng tương thích OpenRouter

Nếu đã sử dụng OpenRouter cho Perplexity Sonar, giữ `provider: "perplexity"` và thiết lập `OPENROUTER_API_KEY` trong môi trường Gateway, hoặc lưu một khóa `sk-or-...` trong `plugins.entries.perplexity.config.webSearch.apiKey`.

Các tùy chọn điều khiển tương thích tùy chọn:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Ví dụ cấu hình

### API Tìm kiếm Perplexity gốc

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

### Khả năng tương thích OpenRouter / Sonar

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

## Nơi đặt khóa

**Qua cấu hình:** chạy `openclaw configure --section web`. Nó lưu khóa trong
`~/.openclaw/openclaw.json` dưới `plugins.entries.perplexity.config.webSearch.apiKey`.
Trường này cũng chấp nhận các đối tượng SecretRef.

**Qua môi trường:** thiết lập `PERPLEXITY_API_KEY` hoặc `OPENROUTER_API_KEY`
trong môi trường quá trình Gateway. Đối với cài đặt gateway, đặt nó trong
`~/.openclaw/.env` (hoặc môi trường dịch vụ của bạn). Xem [Env vars](/help/faq#how-does-openclaw-load-environment-variables).

Nếu `provider: "perplexity"` được cấu hình và SecretRef khóa Perplexity không được giải quyết mà không có dự phòng môi trường, khởi động/tải lại sẽ thất bại nhanh chóng.

## Tham số công cụ

Các tham số này áp dụng cho đường dẫn API Tìm kiếm Perplexity gốc.

| Tham số               | Mô tả                                                 |
| --------------------- | ----------------------------------------------------- |
| `query`               | Truy vấn tìm kiếm (bắt buộc)                          |
| `count`               | Số lượng kết quả trả về (1-10, mặc định: 5)           |
| `country`             | Mã quốc gia ISO 2 chữ cái (ví dụ: "US", "DE")         |
| `language`            | Mã ngôn ngữ ISO 639-1 (ví dụ: "en", "de", "fr")       |
| `freshness`           | Bộ lọc thời gian: `day` (24h), `week`, `month`, hoặc `year` |
| `date_after`          | Chỉ kết quả xuất bản sau ngày này (YYYY-MM-DD)       |
| `date_before`         | Chỉ kết quả xuất bản trước ngày này (YYYY-MM-DD)     |
| `domain_filter`       | Mảng danh sách cho phép/chặn tên miền (tối đa 20)    |
| `max_tokens`          | Ngân sách nội dung tổng (mặc định: 25000, tối đa: 1000000) |
| `max_tokens_per_page` | Giới hạn token mỗi trang (mặc định: 2048)            |

Đối với đường dẫn tương thích Sonar/OpenRouter cũ, chỉ hỗ trợ `query` và `freshness`.
Các bộ lọc chỉ dành cho API Tìm kiếm như `country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, và `max_tokens_per_page` sẽ trả về lỗi rõ ràng.

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

// Lọc tên miền (danh sách cho phép)
await web_search({
  query: "nghiên cứu khí hậu",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Lọc tên miền (danh sách chặn - thêm tiền tố -)
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

### Quy tắc lọc tên miền

- Tối đa 20 tên miền mỗi bộ lọc
- Không thể kết hợp danh sách cho phép và danh sách chặn trong cùng một yêu cầu
- Sử dụng tiền tố `-` cho các mục trong danh sách chặn (ví dụ: `["-reddit.com"]`)

## Ghi chú

- API Tìm kiếm Perplexity trả về kết quả tìm kiếm web có cấu trúc (`title`, `url`, `snippet`)
- OpenRouter hoặc `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` rõ ràng chuyển Perplexity trở lại hoàn thành chat Sonar để tương thích
- Kết quả được lưu trong bộ nhớ cache trong 15 phút theo mặc định (có thể cấu hình qua `cacheTtlMinutes`)

Xem [Công cụ web](/tools/web) để biết cấu hình đầy đủ của web_search.
Xem [Tài liệu API Tìm kiếm Perplexity](https://docs.perplexity.ai/docs/search/quickstart) để biết thêm chi tiết.
