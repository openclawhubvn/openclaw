---
summary: "Khám phá cách sử dụng Firecrawl để tìm kiếm, trích xuất dữ liệu web hỗ trợ vượt rào anti-bot hiệu quả."
read_when:
  - Bạn muốn trích xuất dữ liệu web với sự hỗ trợ của Firecrawl
  - Bạn cần thiết lập API key cho nền tảng Firecrawl
  - Bạn muốn sử dụng Firecrawl làm nhà cung cấp dịch vụ web_search
  - Bạn cần khả năng trích xuất chống bot (anti-bot) cho web_fetch
title: "Hướng Dẫn Cấu Hình Firecrawl Trích Xuất Dữ Liệu"
---

# Firecrawl

OpenClaw có thể sử dụng **Firecrawl** theo ba cách:

- Là nhà cung cấp `web_search`
- Là công cụ plugin cụ thể: `firecrawl_search` và `firecrawl_scrape`
- Là bộ trích xuất dự phòng cho `web_fetch`

Đây là dịch vụ trích xuất/tìm kiếm được lưu trữ, hỗ trợ vượt qua bot và lưu trữ đệm, giúp xử lý các trang web nặng JavaScript hoặc chặn truy cập HTTP thông thường.

## Lấy API key

1. Tạo tài khoản Firecrawl và tạo một API key.
2. Lưu trữ trong cấu hình hoặc thiết lập `FIRECRAWL_API_KEY` trong môi trường gateway.

## Cấu hình tìm kiếm Firecrawl

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

Ghi chú:

- Chọn Firecrawl trong quá trình khởi tạo hoặc `openclaw configure --section web` sẽ tự động kích hoạt plugin Firecrawl đi kèm.
- `web_search` với Firecrawl hỗ trợ `query` và `count`.
- Để điều khiển cụ thể của Firecrawl như `sources`, `categories`, hoặc trích xuất kết quả, sử dụng `firecrawl_search`.

## Cấu hình Firecrawl scrape + dự phòng web_fetch

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

Ghi chú:

- `firecrawl.enabled` mặc định là `true` trừ khi được đặt rõ ràng là `false`.
- Firecrawl fallback chỉ chạy khi có API key (`tools.web.fetch.firecrawl.apiKey` hoặc `FIRECRAWL_API_KEY`).
- `maxAgeMs` kiểm soát tuổi tối đa của kết quả lưu trữ đệm (ms). Mặc định là 2 ngày.

`firecrawl_scrape` tái sử dụng cùng cài đặt `tools.web.fetch.firecrawl.*` và biến môi trường.

## Công cụ plugin Firecrawl

### `firecrawl_search`

Sử dụng khi cần điều khiển tìm kiếm cụ thể của Firecrawl thay vì `web_search` chung.

Các tham số chính:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Sử dụng cho các trang nặng JS hoặc được bảo vệ bởi bot mà `web_fetch` thông thường không hiệu quả.

Các tham số chính:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Chế độ ẩn / vượt qua bot

Firecrawl cung cấp tham số **proxy mode** để vượt qua bot (`basic`, `stealth`, hoặc `auto`).
OpenClaw luôn sử dụng `proxy: "auto"` cùng `storeInCache: true` cho các yêu cầu Firecrawl.
Nếu không chỉ định proxy, Firecrawl mặc định là `auto`. `auto` sẽ thử lại với proxy ẩn nếu một lần thử cơ bản thất bại, có thể sử dụng nhiều credit hơn so với chỉ trích xuất cơ bản.

## Cách `web_fetch` sử dụng Firecrawl

Thứ tự trích xuất `web_fetch`:

1. Readability (local)
2. Firecrawl (nếu được cấu hình)
3. Dọn dẹp HTML cơ bản (dự phòng cuối cùng)

Xem [Công cụ web](/tools/web) để biết thiết lập công cụ web đầy đủ.
