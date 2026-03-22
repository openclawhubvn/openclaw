---
summary: "Khám phá cách sử dụng công cụ web OpenClaw để tối ưu hóa quy trình làm việc và cải thiện hiệu suất dự án của bạn."
read_when:
  - You want to enable web_search or web_fetch
  - You need provider API key setup
  - You want to use Gemini with Google Search grounding
title: "Hướng Dẫn Sử Dụng Công Cụ Web OpenClaw"
---

# Công cụ web

OpenClaw cung cấp hai công cụ web nhẹ:

- `web_search` — Tìm kiếm trên web bằng Brave Search API, Firecrawl Search, Gemini với Google Search grounding, Grok, Kimi, Perplexity Search API, hoặc Tavily Search API.
- `web_fetch` — Thực hiện HTTP fetch và trích xuất nội dung dễ đọc (HTML → markdown/text).

Đây **không phải** là tự động hóa trình duyệt. Đối với các trang web nặng JavaScript hoặc cần đăng nhập, hãy sử dụng [Công cụ trình duyệt](/tools/browser).

## Cách hoạt động

- `web_search` gọi nhà cung cấp đã cấu hình và trả về kết quả.
- Kết quả được lưu trong bộ nhớ cache theo truy vấn trong 15 phút (có thể cấu hình).
- `web_fetch` thực hiện một HTTP GET đơn giản và trích xuất nội dung dễ đọc (HTML → markdown/text). Nó **không** thực thi JavaScript.
- `web_fetch` được bật mặc định (trừ khi bị tắt rõ ràng).
- Plugin Firecrawl đi kèm cũng thêm `firecrawl_search` và `firecrawl_scrape` khi được bật.
- Plugin Tavily đi kèm cũng thêm `tavily_search` và `tavily_extract` khi được bật.

Xem [Cài đặt Brave Search](/tools/brave-search), [Cài đặt Perplexity Search](/tools/perplexity-search), và [Cài đặt Tavily Search](/tools/tavily) để biết chi tiết cụ thể của từng nhà cung cấp.

## Chọn nhà cung cấp tìm kiếm

| Nhà cung cấp             | Dạng kết quả                          | Bộ lọc cụ thể của nhà cung cấp                                | Ghi chú                                                                         | API key                                     |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------- |
| **Brave Search API**     | Kết quả có cấu trúc với đoạn trích    | `country`, `language`, `ui_lang`, thời gian                   | Hỗ trợ chế độ Brave `llm-context`                                              | `BRAVE_API_KEY`                             |
| **Firecrawl Search**     | Kết quả có cấu trúc với đoạn trích    | Sử dụng `firecrawl_search` cho các tùy chọn tìm kiếm cụ thể của Firecrawl | Tốt nhất khi kết hợp tìm kiếm với trích xuất Firecrawl                          | `FIRECRAWL_API_KEY`                         |
| **Gemini**               | Câu trả lời tổng hợp AI + trích dẫn   | —                                                             | Sử dụng Google Search grounding                                                | `GEMINI_API_KEY`                            |
| **Grok**                 | Câu trả lời tổng hợp AI + trích dẫn   | —                                                             | Sử dụng phản hồi web-grounded của xAI                                          | `XAI_API_KEY`                               |
| **Kimi**                 | Câu trả lời tổng hợp AI + trích dẫn   | —                                                             | Sử dụng tìm kiếm web Moonshot                                                  | `KIMI_API_KEY` / `MOONSHOT_API_KEY`         |
| **Perplexity Search API**| Kết quả có cấu trúc với đoạn trích    | `country`, `language`, thời gian, `domain_filter`             | Hỗ trợ kiểm soát trích xuất nội dung; OpenRouter sử dụng đường dẫn tương thích Sonar | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` |
| **Tavily Search API**    | Kết quả có cấu trúc với đoạn trích    | Sử dụng `tavily_search` cho các tùy chọn tìm kiếm cụ thể của Tavily | Độ sâu tìm kiếm, lọc chủ đề, câu trả lời AI, trích xuất URL qua `tavily_extract` | `TAVILY_API_KEY`                            |

### Tự động phát hiện

Bảng trên được sắp xếp theo thứ tự chữ cái. Nếu không có `provider` nào được thiết lập rõ ràng, chế độ tự động phát hiện sẽ kiểm tra các nhà cung cấp theo thứ tự sau:

1. **Brave** — biến môi trường `BRAVE_API_KEY` hoặc `plugins.entries.brave.config.webSearch.apiKey`
2. **Gemini** — biến môi trường `GEMINI_API_KEY` hoặc `plugins.entries.google.config.webSearch.apiKey`
3. **Grok** — biến môi trường `XAI_API_KEY` hoặc `plugins.entries.xai.config.webSearch.apiKey`
4. **Kimi** — biến môi trường `KIMI_API_KEY` / `MOONSHOT_API_KEY` hoặc `plugins.entries.moonshot.config.webSearch.apiKey`
5. **Perplexity** — biến môi trường `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, hoặc `plugins.entries.perplexity.config.webSearch.apiKey`
6. **Firecrawl** — biến môi trường `FIRECRAWL_API_KEY` hoặc `plugins.entries.firecrawl.config.webSearch.apiKey`
7. **Tavily** — biến môi trường `TAVILY_API_KEY` hoặc `plugins.entries.tavily.config.webSearch.apiKey`

Nếu không tìm thấy khóa nào, hệ thống sẽ quay lại Brave (bạn sẽ nhận được thông báo lỗi thiếu khóa yêu cầu cấu hình).

Hành vi Runtime SecretRef:

- SecretRefs của công cụ web được giải quyết đồng thời khi khởi động/tải lại gateway.
- Trong chế độ tự động phát hiện, OpenClaw chỉ giải quyết khóa của nhà cung cấp đã chọn. SecretRefs của nhà cung cấp không được chọn vẫn không hoạt động cho đến khi được chọn.
- Nếu SecretRef của nhà cung cấp đã chọn không được giải quyết và không có fallback env của nhà cung cấp, khởi động/tải lại sẽ thất bại nhanh chóng.

## Cài đặt tìm kiếm web

Sử dụng `openclaw configure --section web` để thiết lập API key và chọn nhà cung cấp.

### Brave Search

1. Tạo tài khoản Brave Search API tại [brave.com/search/api](https://brave.com/search/api/)
2. Trong dashboard, chọn gói **Search** và tạo một API key.
3. Chạy `openclaw configure --section web` để lưu khóa vào cấu hình, hoặc đặt `BRAVE_API_KEY` trong môi trường của bạn.

Mỗi gói Brave bao gồm **5 USD/tháng tín dụng miễn phí** (tự động gia hạn). Gói Search có giá 5 USD cho mỗi 1.000 yêu cầu, vì vậy tín dụng bao gồm 1.000 truy vấn/tháng. Đặt giới hạn sử dụng trong dashboard Brave để tránh các khoản phí không mong muốn. Xem [cổng API Brave](https://brave.com/search/api/) để biết các gói và giá hiện tại.

### Perplexity Search

1. Tạo tài khoản Perplexity tại [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Tạo một API key trong dashboard
3. Chạy `openclaw configure --section web` để lưu khóa vào cấu hình, hoặc đặt `PERPLEXITY_API_KEY` trong môi trường của bạn.

Để tương thích với Sonar/OpenRouter cũ, đặt `OPENROUTER_API_KEY` thay thế, hoặc cấu hình `plugins.entries.perplexity.config.webSearch.apiKey` với khóa `sk-or-...`. Đặt `plugins.entries.perplexity.config.webSearch.baseUrl` hoặc `model` cũng sẽ đưa Perplexity trở lại đường dẫn tương thích chat-completions.

Cấu hình tìm kiếm web cụ thể của nhà cung cấp hiện nằm dưới `plugins.entries.<plugin>.config.webSearch.*`.
Đường dẫn nhà cung cấp `tools.web.search.*` cũ vẫn tải qua một lớp tương thích trong một phiên bản, nhưng không nên sử dụng trong các cấu hình mới.

Xem [Tài liệu API Perplexity Search](https://docs.perplexity.ai/guides/search-quickstart) để biết thêm chi tiết.

### Nơi lưu trữ khóa

**Qua cấu hình:** chạy `openclaw configure --section web`. Nó lưu khóa dưới đường dẫn cấu hình cụ thể của nhà cung cấp:

- Brave: `plugins.entries.brave.config.webSearch.apiKey`
- Firecrawl: `plugins.entries.firecrawl.config.webSearch.apiKey`
- Gemini: `plugins.entries.google.config.webSearch.apiKey`
- Grok: `plugins.entries.xai.config.webSearch.apiKey`
- Kimi: `plugins.entries.moonshot.config.webSearch.apiKey`
- Perplexity: `plugins.entries.perplexity.config.webSearch.apiKey`
- Tavily: `plugins.entries.tavily.config.webSearch.apiKey`

Tất cả các trường này cũng hỗ trợ đối tượng SecretRef.

**Qua môi trường:** đặt biến môi trường của nhà cung cấp trong môi trường của quá trình Gateway:

- Brave: `BRAVE_API_KEY`
- Firecrawl: `FIRECRAWL_API_KEY`
- Gemini: `GEMINI_API_KEY`
- Grok: `XAI_API_KEY`
- Kimi: `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY`
- Perplexity: `PERPLEXITY_API_KEY` hoặc `OPENROUTER_API_KEY`
- Tavily: `TAVILY_API_KEY`

Đối với cài đặt gateway, đặt chúng trong `~/.openclaw/.env` (hoặc môi trường dịch vụ của bạn). Xem [Biến môi trường](/help/faq#how-does-openclaw-load-environment-variables).

### Ví dụ cấu hình

**Brave Search:**

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "YOUR_BRAVE_API_KEY", // tùy chọn nếu BRAVE_API_KEY đã được đặt // pragma: allowlist secret
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
      },
    },
  },
}
```

**Firecrawl Search:**

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
      },
    },
  },
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "fc-...", // tùy chọn nếu FIRECRAWL_API_KEY đã được đặt
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Khi bạn chọn Firecrawl trong quá trình onboarding hoặc `openclaw configure --section web`, OpenClaw tự động kích hoạt plugin Firecrawl đi kèm để `web_search`, `firecrawl_search`, và `firecrawl_scrape` đều có sẵn.

**Tavily Search:**

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // tùy chọn nếu TAVILY_API_KEY đã được đặt
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "tavily",
      },
    },
  },
}
```

Khi bạn chọn Tavily trong quá trình onboarding hoặc `openclaw configure --section web`, OpenClaw tự động kích hoạt plugin Tavily đi kèm để `web_search`, `tavily_search`, và `tavily_extract` đều có sẵn.

**Chế độ Brave LLM Context:**

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "YOUR_BRAVE_API_KEY", // tùy chọn nếu BRAVE_API_KEY đã được đặt // pragma: allowlist secret
            mode: "llm-context",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
      },
    },
  },
}
```

`llm-context` trả về các đoạn trang được trích xuất để làm nền tảng thay vì các đoạn trích tiêu chuẩn của Brave.
Trong chế độ này, `country` và `language` / `search_lang` vẫn hoạt động, nhưng `ui_lang`,
`freshness`, `date_after`, và `date_before` bị từ chối.

**Perplexity Search:**

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...", // tùy chọn nếu PERPLEXITY_API_KEY đã được đặt
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "perplexity",
      },
    },
  },
}
```

**Perplexity qua OpenRouter / Tương thích Sonar:**

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>", // tùy chọn nếu OPENROUTER_API_KEY đã được đặt
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
        enabled: true,
        provider: "perplexity",
      },
    },
  },
}
```

## Sử dụng Gemini (Google Search grounding)

Các mô hình Gemini hỗ trợ [Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding) tích hợp sẵn,
trả về các câu trả lời tổng hợp AI được hỗ trợ bởi kết quả tìm kiếm Google trực tiếp với trích dẫn.

### Lấy API key Gemini

1. Truy cập [Google AI Studio](https://aistudio.google.com/apikey)
2. Tạo một API key
3. Đặt `GEMINI_API_KEY` trong môi trường Gateway, hoặc cấu hình `plugins.entries.google.config.webSearch.apiKey`

### Cài đặt tìm kiếm Gemini

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            // API key (tùy chọn nếu GEMINI_API_KEY đã được đặt)
            apiKey: "AIza...",
            // Model (mặc định là "gemini-2.5-flash")
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Thay thế qua môi trường:** đặt `GEMINI_API_KEY` trong môi trường Gateway.
Đối với cài đặt gateway, đặt nó trong `~/.openclaw/.env`.

### Ghi chú

- URL trích dẫn từ Gemini grounding được tự động giải quyết từ URL chuyển hướng của Google
  sang URL trực tiếp.
- Giải quyết chuyển hướng sử dụng đường dẫn bảo vệ SSRF (HEAD + kiểm tra chuyển hướng + xác thực http/https) trước khi trả về URL trích dẫn cuối cùng.
- Giải quyết chuyển hướng sử dụng các mặc định SSRF nghiêm ngặt, vì vậy các chuyển hướng đến các mục tiêu riêng tư/nội bộ bị chặn.
- Mô hình mặc định (`gemini-2.5-flash`) nhanh và tiết kiệm chi phí.
  Bất kỳ mô hình Gemini nào hỗ trợ grounding đều có thể được sử dụng.

## web_search

Tìm kiếm trên web bằng nhà cung cấp đã cấu hình.

### Yêu cầu

- `tools.web.search.enabled` không được là `false` (mặc định: bật)
- API key cho nhà cung cấp đã chọn:
  - **Brave**: `BRAVE_API_KEY` hoặc `plugins.entries.brave.config.webSearch.apiKey`
  - **Firecrawl**: `FIRECRAWL_API_KEY` hoặc `plugins.entries.firecrawl.config.webSearch.apiKey`
  - **Gemini**: `GEMINI_API_KEY` hoặc `plugins.entries.google.config.webSearch.apiKey`
  - **Grok**: `XAI_API_KEY` hoặc `plugins.entries.xai.config.webSearch.apiKey`
  - **Kimi**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, hoặc `plugins.entries.moonshot.config.webSearch.apiKey`
  - **Perplexity**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, hoặc `plugins.entries.perplexity.config.webSearch.apiKey`
  - **Tavily**: `TAVILY_API_KEY` hoặc `plugins.entries.tavily.config.webSearch.apiKey`
- Tất cả các trường khóa nhà cung cấp trên đều hỗ trợ đối tượng SecretRef.

### Cấu hình

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "BRAVE_API_KEY_HERE", // tùy chọn nếu BRAVE_API_KEY đã được đặt
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

### Tham số công cụ

Các tham số phụ thuộc vào nhà cung cấp đã chọn.

Đường dẫn tương thích OpenRouter / Sonar của Perplexity chỉ hỗ trợ `query` và `freshness`.
Nếu bạn đặt `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, sử dụng `OPENROUTER_API_KEY`, hoặc cấu hình một khóa `sk-or-...` dưới `plugins.entries.perplexity.config.webSearch.apiKey`, các bộ lọc chỉ dành cho API Tìm kiếm sẽ trả về lỗi rõ ràng.

| Tham số                | Mô tả                                                |
| ---------------------- | ---------------------------------------------------- |
| `query`                | Truy vấn tìm kiếm (bắt buộc)                         |
| `count`                | Số kết quả trả về (1-10, mặc định: 5)                |
| `country`              | Mã quốc gia ISO 2 chữ cái (ví dụ: "US", "DE")        |
| `language`             | Mã ngôn ngữ ISO 639-1 (ví dụ: "en", "de")            |
| `freshness`            | Bộ lọc thời gian: `day`, `week`, `month`, hoặc `year`|
| `date_after`           | Kết quả sau ngày này (YYYY-MM-DD)                    |
| `date_before`          | Kết quả trước ngày này (YYYY-MM-DD)                  |
| `ui_lang`              | Mã ngôn ngữ giao diện (chỉ Brave)                    |
| `domain_filter`        | Mảng danh sách cho phép/chặn tên miền (chỉ Perplexity)|
| `max_tokens`           | Ngân sách nội dung tổng, mặc định 25000 (chỉ Perplexity)|
| `max_tokens_per_page`  | Giới hạn token mỗi trang, mặc định 2048 (chỉ Perplexity)|

Firecrawl `web_search` hỗ trợ `query` và `count`. Đối với các điều khiển cụ thể của Firecrawl như `sources`, `categories`, trích xuất kết quả, hoặc thời gian chờ trích xuất, sử dụng `firecrawl_search` từ plugin Firecrawl đi kèm.

Tavily `web_search` hỗ trợ `query` và `count` (tối đa 20 kết quả). Đối với các điều khiển cụ thể của Tavily như `search_depth`, `topic`, `include_answer`, hoặc bộ lọc tên miền, sử dụng `tavily_search` từ plugin Tavily đi kèm. Để trích xuất nội dung URL, sử dụng `tavily_extract`. Xem [Tavily](/tools/tavily) để biết chi tiết.

**Ví dụ:**

```javascript
// Tìm kiếm cụ thể cho Đức
await web_search({
  query: "TV online schauen",
  country: "DE",
  language: "de",
});

// Kết quả gần đây (trong tuần qua)
await web_search({
  query: "TMBG interview",
  freshness: "week",
});

// Tìm kiếm theo khoảng thời gian
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Lọc tên miền (chỉ Perplexity)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Loại trừ tên miền (chỉ Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Trích xuất nội dung nhiều hơn (chỉ Perplexity)
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

Khi chế độ Brave `llm-context` được bật, `ui_lang`, `freshness`, `date_after`, và
`date_before` không được hỗ trợ. Sử dụng chế độ Brave `web` cho các bộ lọc đó.

## web_fetch

Lấy một URL và trích xuất nội dung dễ đọc.

### Yêu cầu web_fetch

- `tools.web.fetch.enabled` không được là `false` (mặc định: bật)
- Tùy chọn Firecrawl fallback: đặt `tools.web.fetch.firecrawl.apiKey` hoặc `FIRECRAWL_API_KEY`.
- `tools.web.fetch.firecrawl.apiKey` hỗ trợ đối tượng SecretRef.

### Cấu hình web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_2) AppleWebKit/537.36 (KHTML, như Gecko) Chrome/122.0.0.0 Safari/537.36",
        readability: true,
        firecrawl: {
          enabled: true,
          apiKey: "FIRECRAWL_API_KEY_HERE", // tùy chọn nếu FIRECRAWL_API_KEY đã được đặt
          baseUrl: "https://api.firecrawl.dev",
          onlyMainContent: true,
          maxAgeMs: 86400000, // ms (1 ngày)
          timeoutSeconds: 60,
        },
      },
    },
  },
}
```

### Tham số công cụ web_fetch

- `url` (bắt buộc, chỉ http/https)
- `extractMode` (`markdown` | `text`)
- `maxChars` (cắt ngắn các trang dài)

Ghi chú:

- `web_fetch` sử dụng Readability (trích xuất nội dung chính) trước, sau đó là Firecrawl (nếu được cấu hình). Nếu cả hai đều thất bại, công cụ sẽ trả về lỗi.
- Yêu cầu Firecrawl sử dụng chế độ tránh bot và lưu trữ kết quả trong bộ nhớ cache theo mặc định.
- SecretRefs của Firecrawl chỉ được giải quyết khi Firecrawl hoạt động (`tools.web.fetch.enabled !== false` và `tools.web.fetch.firecrawl.enabled !== false`).
- Nếu Firecrawl hoạt động và SecretRef của nó không được giải quyết với không có fallback `FIRECRAWL_API_KEY`, khởi động/tải lại sẽ thất bại nhanh chóng.
- `web_fetch` gửi một User-Agent giống Chrome và `Accept-Language` theo mặc định; ghi đè `userAgent` nếu cần.
- `web_fetch` chặn các tên miền riêng tư/nội bộ và kiểm tra lại các chuyển hướng (giới hạn với `maxRedirects`).
- `maxChars` bị giới hạn bởi `tools.web.fetch.maxCharsCap`.
- `web_fetch` giới hạn kích thước thân phản hồi tải xuống đến `tools.web.fetch.maxResponseBytes` trước khi phân tích; các phản hồi quá lớn bị cắt ngắn và bao gồm một cảnh báo.
- `web_fetch` là trích xuất nỗ lực tốt nhất; một số trang web sẽ cần công cụ trình duyệt.
- Xem [Firecrawl](/tools/firecrawl) để biết cài đặt khóa và chi tiết dịch vụ.
- Các phản hồi được lưu trữ trong bộ nhớ cache (mặc định 15 phút) để giảm các lần fetch lặp lại.
- Nếu bạn sử dụng hồ sơ công cụ/danh sách cho phép, thêm `web_search`/`web_fetch` hoặc `group:web`.
- Nếu thiếu API key, `web_search` trả về một gợi ý thiết lập ngắn với liên kết tài liệu.
