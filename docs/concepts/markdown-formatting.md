---
summary: "Tìm hiểu cách định dạng Markdown cho các kênh outbound, giúp tối ưu hóa nội dung và giao tiếp hiệu quả hơn."
read_when:
  - Bạn đang thay đổi định dạng hoặc chia nhỏ Markdown cho các kênh outbound
  - Bạn đang thêm một bộ định dạng kênh mới hoặc ánh xạ kiểu dáng
  - Bạn đang gỡ lỗi các vấn đề định dạng trên các kênh
title: "Hướng Dẫn Định Dạng Markdown Hiệu Quả"
---

# Định dạng Markdown

OpenClaw định dạng Markdown outbound bằng cách chuyển đổi nó thành một biểu diễn trung gian chung (IR) trước khi tạo ra đầu ra cụ thể cho từng kênh. IR giữ nguyên văn bản gốc trong khi mang theo các đoạn định dạng/liên kết để việc chia nhỏ và hiển thị có thể nhất quán trên các kênh.

## Mục tiêu

- **Nhất quán:** một bước phân tích, nhiều bộ hiển thị.
- **Chia nhỏ an toàn:** chia nhỏ văn bản trước khi hiển thị để định dạng nội tuyến không bị phá vỡ giữa các đoạn.
- **Phù hợp với kênh:** ánh xạ cùng một IR tới Slack mrkdwn, Telegram HTML và Signal style ranges mà không cần phân tích lại Markdown.

## Quy trình

1. **Phân tích Markdown -> IR**
   - IR là văn bản thuần túy cộng với các đoạn định dạng (đậm/nghiêng/gạch ngang/mã/spoiler) và các đoạn liên kết.
   - Các vị trí là đơn vị mã UTF-16 để các phạm vi kiểu dáng của Signal phù hợp với API của nó.
   - Bảng chỉ được phân tích khi một kênh chọn chuyển đổi bảng.
2. **Chia nhỏ IR (ưu tiên định dạng)**
   - Việc chia nhỏ diễn ra trên văn bản IR trước khi hiển thị.
   - Định dạng nội tuyến không bị chia nhỏ giữa các đoạn; các đoạn được cắt theo từng đoạn.
3. **Hiển thị theo từng kênh**
   - **Slack:** các token mrkdwn (đậm/nghiêng/gạch ngang/mã), liên kết dưới dạng `<url|label>`.
   - **Telegram:** thẻ HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** văn bản thuần túy + phạm vi `text-style`; liên kết trở thành `label (url)` khi nhãn khác biệt.

## Ví dụ về IR

Markdown đầu vào:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (sơ đồ):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Nơi sử dụng

- Các bộ điều hợp outbound của Slack, Telegram và Signal hiển thị từ IR.
- Các kênh khác (WhatsApp, iMessage, Microsoft Teams, Discord) vẫn sử dụng văn bản thuần túy hoặc quy tắc định dạng riêng, với chuyển đổi bảng Markdown được áp dụng trước khi chia nhỏ khi được kích hoạt.

## Xử lý bảng

Bảng Markdown không được hỗ trợ nhất quán trên các ứng dụng chat. Sử dụng `markdown.tables` để kiểm soát chuyển đổi theo từng kênh (và từng tài khoản).

- `code`: hiển thị bảng dưới dạng khối mã (mặc định cho hầu hết các kênh).
- `bullets`: chuyển đổi mỗi hàng thành các điểm đầu dòng (mặc định cho Signal + WhatsApp).
- `off`: tắt phân tích và chuyển đổi bảng; văn bản bảng thô được truyền qua.

Các khóa cấu hình:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Quy tắc chia nhỏ

- Giới hạn chia nhỏ đến từ bộ điều hợp/cấu hình kênh và được áp dụng cho văn bản IR.
- Các hàng rào mã được giữ nguyên dưới dạng một khối duy nhất với một dòng mới ở cuối để các kênh hiển thị chúng đúng cách.
- Các tiền tố danh sách và tiền tố blockquote là một phần của văn bản IR, vì vậy việc chia nhỏ không tách giữa tiền tố.
- Các kiểu nội tuyến (đậm/nghiêng/gạch ngang/mã nội tuyến/spoiler) không bao giờ bị chia nhỏ giữa các đoạn; bộ hiển thị mở lại các kiểu bên trong mỗi đoạn.

Nếu cần thêm thông tin về hành vi chia nhỏ trên các kênh, xem [Streaming + chunking](/concepts/streaming).

## Chính sách liên kết

- **Slack:** `[label](url)` -> `<url|label>`; URL trần vẫn giữ nguyên. Tự động liên kết bị tắt trong quá trình phân tích để tránh liên kết kép.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (chế độ phân tích HTML).
- **Signal:** `[label](url)` -> `label (url)` trừ khi nhãn khớp với URL.

## Spoilers

Các dấu spoiler (`||spoiler||`) chỉ được phân tích cho Signal, nơi chúng ánh xạ tới các phạm vi kiểu SPOILER. Các kênh khác coi chúng là văn bản thuần túy.

## Cách thêm hoặc cập nhật bộ định dạng kênh

1. **Phân tích một lần:** sử dụng hàm trợ giúp `markdownToIR(...)` với các tùy chọn phù hợp với kênh (tự động liên kết, kiểu tiêu đề, tiền tố blockquote).
2. **Hiển thị:** triển khai một bộ hiển thị với `renderMarkdownWithMarkers(...)` và một bản đồ đánh dấu kiểu (hoặc phạm vi kiểu Signal).
3. **Chia nhỏ:** gọi `chunkMarkdownIR(...)` trước khi hiển thị; hiển thị từng đoạn.
4. **Kết nối bộ điều hợp:** cập nhật bộ điều hợp outbound của kênh để sử dụng bộ chia nhỏ và bộ hiển thị mới.
5. **Kiểm tra:** thêm hoặc cập nhật các bài kiểm tra định dạng và kiểm tra phân phối outbound nếu kênh sử dụng chia nhỏ.

## Những lưu ý thường gặp

- Các token dấu ngoặc nhọn của Slack (`<@U123>`, `<#C123>`, `<https://...>`) phải được giữ nguyên; thoát HTML thô một cách an toàn.
- HTML của Telegram yêu cầu thoát văn bản ngoài các thẻ để tránh hỏng đánh dấu.
- Các phạm vi kiểu Signal phụ thuộc vào các vị trí UTF-16; không sử dụng các vị trí điểm mã.
- Giữ nguyên các dòng mới ở cuối cho các khối mã có hàng rào để các dấu đóng nằm trên dòng riêng của chúng.
