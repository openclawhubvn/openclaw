---
summary: "Thiết lập Brave Search API cho web_search"
read_when:
  - Muốn dùng Brave Search cho web_search
  - Cần BRAVE_API_KEY hoặc chi tiết gói
title: "Brave Search"
---

# Brave Search API

OpenClaw hỗ trợ Brave Search API làm provider cho `web_search`.

## Lấy API key

1. Tạo tài khoản Brave Search API tại [https://brave.com/search/api/](https://brave.com/search/api/)
2. Trong dashboard, chọn gói **Search** và tạo API key.
3. Lưu key vào config hoặc đặt `BRAVE_API_KEY` trong môi trường Gateway.

## Ví dụ cấu hình

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Cấu hình Brave search cụ thể nằm dưới `plugins.entries.brave.config.webSearch.*`.
Đường dẫn `tools.web.search.apiKey` cũ vẫn hoạt động qua compatibility shim, nhưng không còn là đường dẫn cấu hình chuẩn.

## Tham số công cụ

| Tham số       | Mô tả                                                               |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Truy vấn tìm kiếm (bắt buộc)                                        |
| `count`       | Số kết quả trả về (1-10, mặc định: 5)                               |
| `country`     | Mã quốc gia ISO 2 chữ cái (ví dụ: "US", "DE")                       |
| `language`    | Mã ngôn ngữ ISO 639-1 cho kết quả tìm kiếm (ví dụ: "en", "de", "fr")|
| `ui_lang`     | Mã ngôn ngữ cho giao diện                                           |
| `freshness`   | Bộ lọc thời gian: `day` (24h), `week`, `month`, hoặc `year`         |
| `date_after`  | Chỉ kết quả xuất bản sau ngày này (YYYY-MM-DD)                      |
| `date_before` | Chỉ kết quả xuất bản trước ngày này (YYYY-MM-DD)                    |

**Ví dụ:**

```javascript
// Tìm kiếm theo quốc gia và ngôn ngữ
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Kết quả gần đây (tuần qua)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Tìm kiếm theo khoảng thời gian
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Ghi chú

- OpenClaw sử dụng gói Brave **Search**. Nếu có gói cũ (ví dụ: gói Free ban đầu với 2,000 truy vấn/tháng), vẫn hợp lệ nhưng không bao gồm các tính năng mới như LLM Context hay giới hạn tốc độ cao hơn.
- Mỗi gói Brave bao gồm **\$5/tháng tín dụng miễn phí** (tự động gia hạn). Gói Search tốn \$5 cho 1,000 yêu cầu, nên tín dụng đủ cho 1,000 truy vấn/tháng. Đặt giới hạn sử dụng trong dashboard Brave để tránh phí bất ngờ. Xem [Brave API portal](https://brave.com/search/api/) cho các gói hiện tại.
- Gói Search bao gồm endpoint LLM Context và quyền suy luận AI. Lưu trữ kết quả để huấn luyện hoặc tinh chỉnh mô hình cần gói có quyền lưu trữ rõ ràng. Xem [Điều khoản dịch vụ Brave](https://api-dashboard.search.brave.com/terms-of-service).
- Kết quả được cache mặc định 15 phút (có thể cấu hình qua `cacheTtlMinutes`).

Xem [Web tools](/tools/web) để biết cấu hình đầy đủ của web_search.\n