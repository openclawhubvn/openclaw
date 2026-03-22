---
summary: "Công cụ tìm kiếm và trích xuất Tavily"
read_when:
  - Bạn muốn tìm kiếm web hỗ trợ bởi Tavily
  - Bạn cần một API key của Tavily
  - Bạn muốn sử dụng Tavily làm nhà cung cấp web_search
  - Bạn muốn trích xuất nội dung từ URL
title: "Tavily"
---

# Tavily

OpenClaw có thể sử dụng **Tavily** theo hai cách:

- như nhà cung cấp `web_search`
- như công cụ plugin riêng: `tavily_search` và `tavily_extract`

Tavily là một API tìm kiếm được thiết kế cho các ứng dụng AI, trả về kết quả có cấu trúc tối ưu cho việc tiêu thụ bởi LLM. Nó hỗ trợ độ sâu tìm kiếm có thể cấu hình, lọc chủ đề, lọc miền, tóm tắt câu trả lời do AI tạo ra và trích xuất nội dung từ URL (bao gồm cả các trang được render bằng JavaScript).

## Lấy API key

1. Tạo tài khoản Tavily tại [tavily.com](https://tavily.com/).
2. Tạo một API key trong dashboard.
3. Lưu trữ nó trong cấu hình hoặc đặt `TAVILY_API_KEY` trong môi trường gateway.

## Cấu hình tìm kiếm Tavily

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // không bắt buộc nếu đã đặt TAVILY_API_KEY
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

Ghi chú:

- Chọn Tavily trong quá trình onboarding hoặc `openclaw configure --section web` sẽ tự động kích hoạt plugin Tavily đi kèm.
- Lưu cấu hình Tavily dưới `plugins.entries.tavily.config.webSearch.*`.
- `web_search` với Tavily hỗ trợ `query` và `count` (tối đa 20 kết quả).
- Để kiểm soát cụ thể của Tavily như `search_depth`, `topic`, `include_answer`, hoặc lọc miền, sử dụng `tavily_search`.

## Công cụ plugin Tavily

### `tavily_search`

Sử dụng khi bạn muốn kiểm soát tìm kiếm cụ thể của Tavily thay vì `web_search` chung chung.

| Tham số            | Mô tả                                                               |
| ------------------ | ------------------------------------------------------------------- |
| `query`            | Chuỗi truy vấn tìm kiếm (giữ dưới 400 ký tự)                        |
| `search_depth`     | `basic` (mặc định, cân bằng) hoặc `advanced` (độ liên quan cao nhất, chậm hơn) |
| `topic`            | `general` (mặc định), `news` (cập nhật thời gian thực), hoặc `finance` |
| `max_results`      | Số lượng kết quả, 1-20 (mặc định: 5)                                |
| `include_answer`   | Bao gồm tóm tắt câu trả lời do AI tạo ra (mặc định: false)          |
| `time_range`       | Lọc theo độ mới: `day`, `week`, `month`, hoặc `year`                |
| `include_domains`  | Mảng các miền để giới hạn kết quả                                   |
| `exclude_domains`  | Mảng các miền để loại trừ khỏi kết quả                              |

**Độ sâu tìm kiếm:**

| Độ sâu     | Tốc độ | Độ liên quan | Tốt nhất cho                          |
| ---------- | ------ | ------------ | ------------------------------------- |
| `basic`    | Nhanh hơn | Cao         | Truy vấn mục đích chung (mặc định)   |
| `advanced` | Chậm hơn | Cao nhất    | Độ chính xác, thông tin cụ thể, nghiên cứu |

### `tavily_extract`

Sử dụng để trích xuất nội dung sạch từ một hoặc nhiều URL. Xử lý các trang được render bằng JavaScript và hỗ trợ chia nhỏ theo truy vấn để trích xuất mục tiêu.

| Tham số              | Mô tả                                                           |
| -------------------- | --------------------------------------------------------------- |
| `urls`               | Mảng các URL để trích xuất (1-20 mỗi yêu cầu)                   |
| `query`              | Xếp hạng lại các phần trích xuất theo độ liên quan đến truy vấn này |
| `extract_depth`      | `basic` (mặc định, nhanh) hoặc `advanced` (cho các trang nặng JS) |
| `chunks_per_source`  | Số phần mỗi URL, 1-5 (yêu cầu `query`)                          |
| `include_images`     | Bao gồm URL hình ảnh trong kết quả (mặc định: false)            |

**Độ sâu trích xuất:**

| Độ sâu     | Khi nào sử dụng                             |
| ---------- | ------------------------------------------- |
| `basic`    | Trang đơn giản - thử cái này trước          |
| `advanced` | SPAs render bằng JS, nội dung động, bảng    |

Mẹo:

- Tối đa 20 URL mỗi yêu cầu. Chia danh sách lớn hơn thành nhiều lần gọi.
- Sử dụng `query` + `chunks_per_source` để chỉ lấy nội dung liên quan thay vì toàn bộ trang.
- Thử `basic` trước; chuyển sang `advanced` nếu nội dung bị thiếu hoặc không đầy đủ.

## Chọn công cụ phù hợp

| Nhu cầu                              | Công cụ          |
| ------------------------------------ | ---------------- |
| Tìm kiếm web nhanh, không có tùy chọn đặc biệt | `web_search`     |
| Tìm kiếm với độ sâu, chủ đề, câu trả lời AI | `tavily_search`  |
| Trích xuất nội dung từ URL cụ thể    | `tavily_extract` |

Xem [Công cụ web](/tools/web) để biết thiết lập công cụ web đầy đủ và so sánh nhà cung cấp.
