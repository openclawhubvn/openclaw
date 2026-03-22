---
summary: "Công cụ tìm kiếm và lấy dữ liệu web (Brave, Firecrawl, Gemini, Grok, Kimi, Perplexity, và Tavily)"
read_when:
  - Muốn bật web_search hoặc web_fetch
  - Cần thiết lập API key cho provider
  - Muốn dùng Gemini với Google Search grounding
title: "Công cụ Web"
---

# Công cụ Web

OpenClaw cung cấp hai công cụ web nhẹ:

- `web_search` — Tìm kiếm web qua Brave Search API, Firecrawl Search, Gemini với Google Search grounding, Grok, Kimi, Perplexity Search API, hoặc Tavily Search API.
- `web_fetch` — Lấy dữ liệu HTTP + trích xuất nội dung dễ đọc (HTML → markdown/text).

Không phải tự động hóa trình duyệt. Với các trang nặng JS hoặc cần đăng nhập, dùng [Browser tool](/tools/browser).

## Cách hoạt động

- `web_search` gọi provider đã cấu hình và trả về kết quả.
- Kết quả được cache theo query trong 15 phút (có thể cấu hình).
- `web_fetch` thực hiện HTTP GET và trích xuất nội dung dễ đọc (HTML → markdown/text). Không chạy JavaScript.
- `web_fetch` bật mặc định (trừ khi tắt rõ ràng).
- Plugin Firecrawl đi kèm thêm `firecrawl_search` và `firecrawl_scrape` khi bật.
- Plugin Tavily đi kèm thêm `tavily_search` và `tavily_extract` khi bật.

Xem chi tiết cấu hình cho từng provider tại [Brave Search setup](/tools/brave-search), [Perplexity Search setup](/tools/perplexity-search), và [Tavily Search setup](/tools/tavily).

## Chọn provider tìm kiếm

| Provider                  | Dạng kết quả                        | Bộ lọc riêng của provider                                     | Ghi chú                                                                          | API key                                     |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------- |
| **Brave Search API**      | Kết quả có cấu trúc với snippets   | `country`, `language`, `ui_lang`, time                       | Hỗ trợ chế độ Brave `llm-context`                                              | `BRAVE_API_KEY`                             |
| **Firecrawl Search**      | Kết quả có cấu trúc với snippets   | Dùng `firecrawl_search` cho tùy chọn tìm kiếm riêng của Firecrawl | Tốt nhất khi kết hợp tìm kiếm với trích xuất Firecrawl                     | `FIRECRAWL_API_KEY`                         |
| **Gemini**                | Câu trả lời AI + trích dẫn         | —                                                            | Dùng Google Search grounding                                                   | `GEMINI_API_KEY`                            |
| **Grok**                  | Câu trả lời AI + trích dẫn         | —                                                            | Dùng phản hồi web-grounded của xAI                                             | `XAI_API_KEY`                               |
| **Kimi**                  | Câu trả lời AI + trích dẫn         | —                                                            | Dùng tìm kiếm web Moonshot                                                     | `KIMI_API_KEY` / `MOONSHOT_API_KEY`         |
| **Perplexity Search API** | Kết quả có cấu trúc với snippets   | `country`, `language`, time, `domain_filter`                 | Hỗ trợ kiểm soát trích xuất nội dung; OpenRouter dùng đường dẫn tương thích Sonar | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` |
| **Tavily Search API**     | Kết quả có cấu trúc với snippets   | Dùng `tavily_search` cho tùy chọn tìm kiếm riêng của Tavily  | Độ sâu tìm kiếm, lọc chủ đề, câu trả lời AI, trích xuất URL qua `tavily_extract` | `TAVILY_API_KEY`                            |

### Tự động phát hiện

Bảng trên sắp xếp theo thứ tự chữ cái. Nếu không đặt `provider` rõ ràng, runtime tự động kiểm tra các provider theo thứ tự:

1. **Brave** — `BRAVE_API_KEY` env var hoặc `plugins.entries.brave.config.webSearch.apiKey`
2. **Gemini** — `GEMINI_API_KEY` env var hoặc `plugins.entries.google.config.webSearch.apiKey`
3. **Grok** — `XAI_API_KEY` env var hoặc `plugins.entries.xai.config.webSearch.apiKey`
4. **Kimi** — `KIMI_API_KEY` / `MOONSHOT_API_KEY` env var hoặc `plugins.entries.moonshot.config.webSearch.apiKey`
5. **Perplexity** — `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, hoặc `plugins.entries.perplexity.config.webSearch.apiKey`
6. **Firecrawl** — `FIRECRAWL_API_KEY` env var hoặc `plugins.entries.firecrawl.config.webSearch.apiKey`
7. **Tavily** — `TAVILY_API_KEY` env var hoặc `plugins.entries.tavily.config.webSearch.apiKey`

Nếu không tìm thấy key, sẽ quay lại Brave (bạn sẽ nhận lỗi thiếu key yêu cầu cấu hình).

Hành vi SecretRef runtime:

- SecretRefs công cụ web được giải quyết đồng thời khi gateway khởi động/tải lại.
- Ở chế độ tự động phát hiện, OpenClaw chỉ giải quyết key provider đã chọn. SecretRefs provider không được chọn vẫn không hoạt động cho đến khi được chọn.
- Nếu SecretRef provider đã chọn không được giải quyết và không có fallback env provider, khởi động/tải lại sẽ thất bại nhanh chóng.

## Thiết lập web search

Dùng `openclaw configure --section web` để thiết lập API key và chọn provider.

### Brave Search

1. Tạo tài khoản Brave Search API tại [brave.com/search/api](https://brave.com/search/api/)
2. Trong dashboard, chọn gói **Search** và tạo API key.
3. Chạy `openclaw configure --section web` để lưu key vào config, hoặc đặt `BRAVE_API_KEY` trong môi trường.

Mỗi gói Brave bao gồm **\$5/tháng tín dụng miễn phí** (tự động gia hạn). Gói Search tốn \$5 cho mỗi 1,000 yêu cầu, nên tín dụng bao gồm 1,000 truy vấn/tháng. Đặt giới hạn sử dụng trong dashboard Brave để tránh phí không mong muốn. Xem [Brave API portal](https://brave.com/search/api/) để biết gói và giá hiện tại.

### Perplexity Search

1. Tạo tài khoản Perplexity tại [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Tạo API key trong dashboard
3. Chạy `openclaw configure --section web` để lưu key vào config, hoặc đặt `PERPLEXITY_API_KEY` trong môi trường.

Để tương thích Sonar/OpenRouter cũ, đặt `OPENROUTER_API_KEY` thay thế, hoặc cấu hình `plugins.entries.perplexity.config.webSearch.apiKey` với key `sk-or-...`. Đặt `plugins.entries.perplexity.config.webSearch.baseUrl` hoặc `model` cũng chọn Perplexity vào đường dẫn tương thích chat-completions.

Cấu hình tìm kiếm web riêng của provider hiện nằm dưới `plugins.entries.<plugin>.config.webSearch.*`.
Đường dẫn provider `tools.web.search.*` cũ vẫn tải qua shim tương thích trong một bản phát hành, nhưng không nên dùng trong cấu hình mới.

Xem [Perplexity Search API Docs](https://docs.perplexity.ai/guides/search-quickstart) để biết thêm chi tiết.

### Nơi lưu trữ key

**Qua config:** chạy `openclaw configure --section web`. Nó lưu key dưới đường dẫn cấu hình riêng của provider:

- Brave: `plugins.entries.brave.config.webSearch.apiKey`
- Firecrawl: `plugins.entries.firecrawl.config.webSearch.apiKey`
- Gemini: `plugins.entries.google.config.webSearch.apiKey`
- Grok: `plugins.entries.xai.config.webSearch.apiKey`
- Kimi: `plugins.entries.moonshot.config.webSearch.apiKey`
- Perplexity: `plugins.entries.perplexity.config.webSearch.apiKey`
- Tavily: `plugins.entries.tavily.config.webSearch.apiKey`

Tất cả các trường này cũng hỗ trợ đối tượng SecretRef.

**Qua môi trường:** đặt env vars provider trong môi trường Gateway:

- Brave: `BRAVE_API_KEY`
- Firecrawl: `FIRECRAWL_API_KEY`
- Gemini: `GEMINI_API_KEY`
- Grok: `XAI_API_KEY`
- Kimi: `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY`
- Perplexity: `PERPLEXITY_API_KEY` hoặc `OPENROUTER_API_KEY`
- Tavily: `TAVILY_API_KEY`

Với cài đặt gateway, đặt chúng trong `~/.openclaw/.env` (hoặc môi trường dịch vụ của bạn). Xem [Env vars](/help/faq#how-does-openclaw-load-environment-variables).

### Ví dụ cấu hình

**Brave Search:**

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "YOUR_BRAVE_API_KEY", // optional nếu BRAVE_API_KEY đã được đặt // pragma: allowlist secret
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
            apiKey: "fc-...", // optional nếu FIRECRAWL_API_KEY đã được đặt
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Khi chọn Firecrawl trong onboarding hoặc `openclaw configure --section web`, OpenClaw tự động bật plugin Firecrawl đi kèm để `web_search`, `firecrawl_search`, và `firecrawl_scrape` đều có sẵn.

**Tavily Search:**

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // optional nếu TAVILY_API_KEY đã được đặt
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

Khi chọn Tavily trong onboarding hoặc `openclaw configure --section web`, OpenClaw tự động bật plugin Tavily đi kèm để `web_search`, `tavily_search`, và `tavily_extract` đều có sẵn.

**Brave LLM Context mode:**

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "YOUR_BRAVE_API_KEY", // optional nếu BRAVE_API_KEY đã được đặt // pragma: allowlist secret
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

`llm-context` trả về các đoạn trang đã trích xuất để grounding thay vì snippets Brave chuẩn.
Ở chế độ này, `country` và `language` / `search_lang` vẫn hoạt động, nhưng `ui_lang`,
`freshness`, `date_after`, và `date_before` bị từ chối.

**Perplexity Search:**

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...", // optional nếu PERPLEXITY_API_KEY đã được đặt
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

**Perplexity qua OpenRouter / Sonar compatibility:**

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>", // optional nếu OPENROUTER_API_KEY đã được đặt
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

Các model Gemini hỗ trợ [Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding) tích hợp sẵn,
trả về câu trả lời AI với kết quả Google Search trực tiếp và trích dẫn.

### Lấy Gemini API key

1. Truy cập [Google AI Studio](https://aistudio.google.com/apikey)
2. Tạo API key
3. Đặt `GEMINI_API_KEY` trong môi trường Gateway, hoặc cấu hình `plugins.entries.google.config.webSearch.apiKey`

### Thiết lập tìm kiếm Gemini

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            // API key (optional nếu GEMINI_API_KEY đã được đặt)
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

**Cách thay thế qua môi trường:** đặt `GEMINI_API_KEY` trong môi trường Gateway.
Với cài đặt gateway, đặt nó trong `~/.openclaw/.env`.

### Ghi chú

- URL trích dẫn từ Gemini grounding tự động được giải quyết từ URL chuyển hướng của Google thành URL trực tiếp.
- Giải quyết chuyển hướng sử dụng đường dẫn bảo vệ SSRF (HEAD + kiểm tra chuyển hướng + xác thực http/https) trước khi trả về URL trích dẫn cuối cùng.
- Giải quyết chuyển hướng sử dụng mặc định SSRF nghiêm ngặt, nên chuyển hướng đến mục tiêu riêng tư/nội bộ bị chặn.
- Model mặc định (`gemini-2.5-flash`) nhanh và tiết kiệm chi phí.
  Bất kỳ model Gemini nào hỗ trợ grounding đều có thể dùng.

## web_search

Tìm kiếm web bằng provider đã cấu hình.

### Yêu cầu

- `tools.web.search.enabled` không được là `false` (mặc định: bật)
- API key cho provider đã chọn:
  - **Brave**: `BRAVE_API_KEY` hoặc `plugins.entries.brave.config.webSearch.apiKey`
  - **Firecrawl**: `FIRECRAWL_API_KEY` hoặc `plugins.entries.firecrawl.config.webSearch.apiKey`
  - **Gemini**: `GEMINI_API_KEY` hoặc `plugins.entries.google.config.webSearch.apiKey`
  - **Grok**: `XAI_API_KEY` hoặc `plugins.entries.xai.config.webSearch.apiKey`
  - **Kimi**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, hoặc `plugins.entries.moonshot.config.webSearch.apiKey`
  - **Perplexity**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, hoặc `plugins.entries.perplexity.config.webSearch.apiKey`
  - **Tavily**: `TAVILY_API_KEY` hoặc `plugins.entries.tavily.config.webSearch.apiKey`
- Tất cả các trường key provider trên hỗ trợ đối tượng SecretRef.

### Cấu hình

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "BRAVE_API_KEY_HERE", // optional nếu BRAVE_API_KEY đã được đặt
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

### Tham số công cụ

Tham số phụ thuộc vào provider đã chọn.

Đường dẫn tương thích OpenRouter / Sonar của Perplexity chỉ hỗ trợ `query` và `freshness`.
Nếu bạn đặt `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, dùng `OPENROUTER_API_KEY`, hoặc cấu hình key `sk-or-...` dưới `plugins.entries.perplexity.config.webSearch.apiKey`, các bộ lọc chỉ dành cho Search API trả về lỗi rõ ràng.

| Tham số                | Mô tả                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | Truy vấn tìm kiếm (bắt buộc)                          |
| `count`               | Số kết quả trả về (1-10, mặc định: 5)                 |
| `country`             | Mã quốc gia ISO 2 chữ cái (ví dụ: "US", "DE")         |
| `language`            | Mã ngôn ngữ ISO 639-1 (ví dụ: "en", "de")             |
| `freshness`           | Bộ lọc thời gian: `day`, `week`, `month`, hoặc `year` |
| `date_after`          | Kết quả sau ngày này (YYYY-MM-DD)                     |
| `date_before`         | Kết quả trước ngày này (YYYY-MM-DD)                   |
| `ui_lang`             | Mã ngôn ngữ giao diện (chỉ Brave)                     |
| `domain_filter`       | Mảng allowlist/denylist domain (chỉ Perplexity)       |
| `max_tokens`          | Ngân sách nội dung tổng, mặc định 25000 (chỉ Perplexity) |
| `max_tokens_per_page` | Giới hạn token mỗi trang, mặc định 2048 (chỉ Perplexity) |

Firecrawl `web_search` hỗ trợ `query` và `count`. Để kiểm soát riêng của Firecrawl như `sources`, `categories`, trích xuất kết quả, hoặc thời gian chờ trích xuất, dùng `firecrawl_search` từ plugin Firecrawl đi kèm.

Tavily `web_search` hỗ trợ `query` và `count` (tối đa 20 kết quả). Để kiểm soát riêng của Tavily như `search_depth`, `topic`, `include_answer`, hoặc bộ lọc domain, dùng `tavily_search` từ plugin Tavily đi kèm. Để trích xuất nội dung URL, dùng `tavily_extract`. Xem [Tavily](/tools/tavily) để biết chi tiết.

**Ví dụ:**

```javascript
// Tìm kiếm cụ thể cho Đức
await web_search({
  query: "TV online schauen",
  country: "DE",
  language: "de",
});

// Kết quả gần đây (tuần qua)
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

// Lọc domain (chỉ Perplexity)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Loại trừ domain (chỉ Perplexity)
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
`date_before` không được hỗ trợ. Dùng chế độ Brave `web` cho các bộ lọc đó.

## web_fetch

Lấy một URL và trích xuất nội dung dễ đọc.

### Yêu cầu web_fetch

- `tools.web.fetch.enabled` không được là `false` (mặc định: bật)
- Firecrawl fallback tùy chọn: đặt `tools.web.fetch.firecrawl.apiKey` hoặc `FIRECRAWL_API_KEY`.
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
          apiKey: "FIRECRAWL_API_KEY_HERE", // optional nếu FIRECRAWL_API_KEY đã được đặt
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

- `web_fetch` dùng Readability (trích xuất nội dung chính) trước, sau đó Firecrawl (nếu cấu hình). Nếu cả hai thất bại, công cụ trả về lỗi.
- Yêu cầu Firecrawl dùng chế độ tránh bot và cache kết quả mặc định.
- SecretRefs Firecrawl chỉ được giải quyết khi Firecrawl hoạt động (`tools.web.fetch.enabled !== false` và `tools.web.fetch.firecrawl.enabled !== false`).
- Nếu Firecrawl hoạt động và SecretRef của nó không được giải quyết với không có `FIRECRAWL_API_KEY` fallback, khởi động/tải lại thất bại nhanh chóng.
- `web_fetch` gửi User-Agent giống Chrome và `Accept-Language` mặc định; ghi đè `userAgent` nếu cần.
- `web_fetch` chặn hostname riêng tư/nội bộ và kiểm tra lại chuyển hướng (giới hạn với `maxRedirects`).
- `maxChars` bị giới hạn bởi `tools.web.fetch.maxCharsCap`.
- `web_fetch` giới hạn kích thước body phản hồi tải xuống đến `tools.web.fetch.maxResponseBytes` trước khi phân tích; phản hồi quá kích thước bị cắt ngắn và bao gồm cảnh báo.
- `web_fetch` là trích xuất nỗ lực tốt nhất; một số trang sẽ cần công cụ trình duyệt.
- Xem [Firecrawl](/tools/firecrawl) để biết thiết lập key và chi tiết dịch vụ.
- Phản hồi được cache (mặc định 15 phút) để giảm tải lại.
- Nếu bạn dùng profile công cụ/danh sách cho phép, thêm `web_search`/`web_fetch` hoặc `group:web`.
- Nếu thiếu API key, `web_search` trả về gợi ý thiết lập ngắn với link docs.\n