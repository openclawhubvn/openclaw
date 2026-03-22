---
summary: "Tìm kiếm, scrape và fallback web_fetch với Firecrawl"
read_when:
  - Cần trích xuất web với Firecrawl
  - Cần API key của Firecrawl
  - Muốn dùng Firecrawl làm web_search provider
  - Cần trích xuất chống bot cho web_fetch
title: "Firecrawl"
---

# Firecrawl

OpenClaw có thể dùng **Firecrawl** theo ba cách:

- làm `web_search` provider
- làm plugin tool: `firecrawl_search` và `firecrawl_scrape`
- làm fallback extractor cho `web_fetch`

Đây là dịch vụ trích xuất/tìm kiếm được host, hỗ trợ vượt qua bot và caching, hữu ích cho các trang nặng JS hoặc chặn HTTP fetch thông thường.

## Lấy API key

1. Tạo tài khoản Firecrawl và tạo API key.
2. Lưu vào config hoặc set `FIRECRAWL_API_KEY` trong môi trường gateway.

## Cấu hình Firecrawl search

```json5
{
  tools: {
    web: {
      search: {
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
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Lưu ý:

- Chọn Firecrawl trong onboarding hoặc `openclaw configure --section web` sẽ tự động kích hoạt plugin Firecrawl.
- `web_search` với Firecrawl hỗ trợ `query` và `count`.
- Để điều khiển cụ thể như `sources`, `categories`, hoặc scrape kết quả, dùng `firecrawl_search`.

## Cấu hình Firecrawl scrape + web_fetch fallback

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
      fetch: {
        firecrawl: {
          apiKey: "FIRECRAWL_API_KEY_HERE",
          baseUrl: "https://api.firecrawl.dev",
          onlyMainContent: true,
          maxAgeMs: 172800000,
          timeoutSeconds: 60,
        },
      },
    },
  },
}
```

Lưu ý:

- `firecrawl.enabled` mặc định là `true` trừ khi set `false`.
- Firecrawl fallback chỉ chạy khi có API key (`tools.web.fetch.firecrawl.apiKey` hoặc `FIRECRAWL_API_KEY`).
- `maxAgeMs` kiểm soát tuổi của kết quả cache (ms). Mặc định là 2 ngày.

`firecrawl_scrape` dùng lại các thiết lập `tools.web.fetch.firecrawl.*` và biến môi trường.

## Công cụ plugin Firecrawl

### `firecrawl_search`

Dùng khi cần điều khiển tìm kiếm cụ thể của Firecrawl thay vì `web_search` chung chung.

Tham số chính:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Dùng cho trang nặng JS hoặc bảo vệ bot mà `web_fetch` thường không hiệu quả.

Tham số chính:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / vượt qua bot

Firecrawl cung cấp tham số **proxy mode** để vượt qua bot (`basic`, `stealth`, hoặc `auto`).
OpenClaw luôn dùng `proxy: "auto"` và `storeInCache: true` cho yêu cầu Firecrawl.
Nếu không chỉ định proxy, Firecrawl mặc định là `auto`. `auto` sẽ thử lại với stealth proxy nếu basic thất bại, có thể tốn nhiều credit hơn so với chỉ dùng basic.

## Cách `web_fetch` dùng Firecrawl

Thứ tự trích xuất `web_fetch`:

1. Readability (local)
2. Firecrawl (nếu đã cấu hình)
3. Dọn dẹp HTML cơ bản (fallback cuối)

Xem [Web tools](/tools/web) để biết cấu hình đầy đủ của công cụ web.\n