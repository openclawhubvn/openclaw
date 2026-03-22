---
summary: "Tìm hiểu cách thiết lập Brave Search API để tối ưu hóa tìm kiếm trên website của bạn một cách hiệu quả và nhanh chóng."
read_when:
  - Bạn muốn sử dụng Brave Search cho web_search
  - Bạn cần BRAVE_API_KEY hoặc thông tin chi tiết về gói
title: "Hướng Dẫn Cấu Hình Brave Search API"
---

# Brave Search API

OpenClaw hỗ trợ Brave Search API như một nhà cung cấp `web_search`.

## Lấy API key

1. Tạo tài khoản Brave Search API tại [https://brave.com/search/api/](https://brave.com/search/api/)
2. Trong dashboard, chọn gói **Search** và tạo API key.
3. Lưu key vào cấu hình hoặc thiết lập `BRAVE_API_KEY` trong môi trường Gateway.

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

Các thiết lập cụ thể cho Brave search hiện nằm dưới `plugins.entries.brave.config.webSearch.*`.
Đường dẫn cấu hình cũ `tools.web.search.apiKey` vẫn hoạt động qua compatibility shim, nhưng không còn là đường dẫn cấu hình chính thức.

## Tham số công cụ

| Tham số       | Mô tả                                                               |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Truy vấn tìm kiếm (bắt buộc)                                        |
| `count`       | Số lượng kết quả trả về (1-10, mặc định: 5)                         |
| `country`     | Mã quốc gia ISO 2 chữ cái (ví dụ: "US", "DE")                       |
| `language`    | Mã ngôn ngữ ISO 639-1 cho kết quả tìm kiếm (ví dụ: "en", "de", "fr")|
| `ui_lang`     | Mã ngôn ngữ cho các thành phần giao diện                            |
| `freshness`   | Bộ lọc thời gian: `day` (24h), `week`, `month`, hoặc `year`        |
| `date_after`  | Chỉ kết quả xuất bản sau ngày này (YYYY-MM-DD)                      |
| `date_before` | Chỉ kết quả xuất bản trước ngày này (YYYY-MM-DD)                    |

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
```

## Ghi chú

- OpenClaw sử dụng gói Brave **Search**. Nếu bạn có gói đăng ký cũ (ví dụ: gói Free ban đầu với 2,000 truy vấn/tháng), nó vẫn hợp lệ nhưng không bao gồm các tính năng mới như LLM Context hoặc giới hạn tốc độ cao hơn.
- Mỗi gói Brave bao gồm **5 USD/tháng tín dụng miễn phí** (tự động gia hạn). Gói Search có giá 5 USD cho mỗi 1,000 yêu cầu, vì vậy tín dụng bao phủ 1,000 truy vấn/tháng. Đặt giới hạn sử dụng trong dashboard Brave để tránh phí không mong muốn. Xem [cổng API Brave](https://brave.com/search/api/) để biết các gói hiện tại.
- Gói Search bao gồm endpoint LLM Context và quyền suy luận AI. Lưu trữ kết quả để huấn luyện hoặc tinh chỉnh mô hình yêu cầu gói có quyền lưu trữ rõ ràng. Xem [Điều khoản Dịch vụ](https://api-dashboard.search.brave.com/terms-of-service) của Brave.
- Kết quả được lưu trong bộ nhớ đệm mặc định 15 phút (có thể cấu hình qua `cacheTtlMinutes`).

Xem [Công cụ web](/tools/web) để biết cấu hình đầy đủ của web_search.
