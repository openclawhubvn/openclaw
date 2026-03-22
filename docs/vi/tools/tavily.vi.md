---
summary: "Công cụ tìm kiếm và trích xuất Tavily"
read_when:
  - Cần tìm kiếm web qua Tavily
  - Cần API key của Tavily
  - Muốn dùng Tavily làm web_search provider
  - Cần trích xuất nội dung từ URL
title: "Tavily"
---

# Tavily

OpenClaw có thể dùng **Tavily** theo hai cách:

- làm `web_search` provider
- làm plugin cụ thể: `tavily_search` và `tavily_extract`

Tavily là API tìm kiếm thiết kế cho ứng dụng AI, trả về kết quả có cấu trúc tối ưu cho LLM. Hỗ trợ độ sâu tìm kiếm, lọc chủ đề, lọc domain, tóm tắt câu trả lời AI, và trích xuất nội dung từ URL (bao gồm trang render JavaScript).

## Lấy API key

1. Tạo tài khoản Tavily tại [tavily.com](https://tavily.com/).
2. Tạo API key trong dashboard.
3. Lưu vào config hoặc đặt `TAVILY_API_KEY` trong môi trường gateway.

## Cấu hình tìm kiếm Tavily

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // không cần nếu đã đặt TAVILY_API_KEY
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

Lưu ý:

- Chọn Tavily khi onboarding hoặc `openclaw configure --section web` sẽ tự động kích hoạt plugin Tavily.
- Lưu cấu hình Tavily dưới `plugins.entries.tavily.config.webSearch.*`.
- `web_search` với Tavily hỗ trợ `query` và `count` (tối đa 20 kết quả).
- Để điều khiển cụ thể như `search_depth`, `topic`, `include_answer`, hoặc lọc domain, dùng `tavily_search`.

## Công cụ plugin Tavily

### `tavily_search`

Dùng khi cần điều khiển tìm kiếm cụ thể của Tavily thay vì `web_search` chung chung.

| Tham số            | Mô tả                                                               |
| ------------------ | ------------------------------------------------------------------- |
| `query`            | Chuỗi tìm kiếm (dưới 400 ký tự)                                     |
| `search_depth`     | `basic` (mặc định, cân bằng) hoặc `advanced` (độ chính xác cao, chậm hơn) |
| `topic`            | `general` (mặc định), `news` (cập nhật thời gian thực), hoặc `finance` |
| `max_results`      | Số kết quả, 1-20 (mặc định: 5)                                      |
| `include_answer`   | Bao gồm tóm tắt câu trả lời AI (mặc định: false)                    |
| `time_range`       | Lọc theo thời gian: `day`, `week`, `month`, hoặc `year`             |
| `include_domains`  | Mảng domain để giới hạn kết quả                                     |
| `exclude_domains`  | Mảng domain để loại trừ khỏi kết quả                                |

**Độ sâu tìm kiếm:**

| Độ sâu    | Tốc độ | Độ chính xác | Tốt nhất cho                             |
| --------- | ------ | ------------ | ---------------------------------------- |
| `basic`   | Nhanh  | Cao          | Tìm kiếm mục đích chung (mặc định)       |
| `advanced`| Chậm   | Cao nhất     | Độ chính xác, thông tin cụ thể, nghiên cứu |

### `tavily_extract`

Dùng để trích xuất nội dung sạch từ một hoặc nhiều URL. Xử lý trang render JavaScript và hỗ trợ chia nhỏ theo truy vấn để trích xuất mục tiêu.

| Tham số             | Mô tả                                                        |
| ------------------- | ------------------------------------------------------------ |
| `urls`              | Mảng URL để trích xuất (1-20 mỗi yêu cầu)                    |
| `query`             | Sắp xếp lại các phần trích xuất theo độ liên quan với truy vấn này |
| `extract_depth`     | `basic` (mặc định, nhanh) hoặc `advanced` (cho trang nặng JS) |
| `chunks_per_source` | Số phần mỗi URL, 1-5 (cần `query`)                           |
| `include_images`    | Bao gồm URL hình ảnh trong kết quả (mặc định: false)         |

**Độ sâu trích xuất:**

| Độ sâu    | Khi nào dùng                               |
| --------- | ------------------------------------------ |
| `basic`   | Trang đơn giản - thử cái này trước          |
| `advanced`| Trang SPA render JS, nội dung động, bảng    |

Mẹo:

- Tối đa 20 URL mỗi yêu cầu. Chia danh sách lớn thành nhiều lần gọi.
- Dùng `query` + `chunks_per_source` để lấy nội dung liên quan thay vì toàn bộ trang.
- Thử `basic` trước; chuyển sang `advanced` nếu thiếu hoặc không đầy đủ nội dung.

## Chọn công cụ phù hợp

| Nhu cầu                              | Công cụ          |
| ------------------------------------ | ---------------- |
| Tìm kiếm web nhanh, không tùy chọn đặc biệt | `web_search`     |
| Tìm kiếm với độ sâu, chủ đề, câu trả lời AI | `tavily_search`  |
| Trích xuất nội dung từ URL cụ thể    | `tavily_extract` |

Xem [Công cụ web](/tools/web) để biết đầy đủ về thiết lập công cụ web và so sánh provider.\n