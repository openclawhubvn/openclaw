# Định dạng Markdown

OpenClaw xử lý Markdown outbound bằng cách chuyển đổi sang một dạng trung gian (IR) trước khi render output cho từng kênh cụ thể. IR giữ nguyên văn bản gốc và các đoạn style/link để việc chia nhỏ và render nhất quán trên các kênh.

## Mục tiêu

- **Nhất quán:** một bước parse, nhiều renderer.
- **Chia nhỏ an toàn:** chia văn bản trước khi render để định dạng inline không bị phá vỡ.
- **Phù hợp kênh:** map cùng IR sang Slack mrkdwn, Telegram HTML, và Signal style mà không cần parse lại Markdown.

## Quy trình

1. **Parse Markdown -> IR**
   - IR là văn bản thuần cộng với các đoạn style (bold/italic/strike/code/spoiler) và link.
   - Offset là UTF-16 để phù hợp với API của Signal.
   - Bảng chỉ được parse khi kênh chọn chuyển đổi bảng.
2. **Chia nhỏ IR (ưu tiên định dạng)**
   - Chia nhỏ trên văn bản IR trước khi render.
   - Định dạng inline không bị chia nhỏ; các đoạn được cắt theo từng phần.
3. **Render theo kênh**
   - **Slack:** token mrkdwn (bold/italic/strike/code), link dạng `<url|label>`.
   - **Telegram:** thẻ HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** văn bản thuần + `text-style` ranges; link thành `label (url)` khi label khác.

## Ví dụ IR

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

## Ứng dụng

- Adapter outbound của Slack, Telegram, và Signal render từ IR.
- Các kênh khác (WhatsApp, iMessage, Microsoft Teams, Discord) vẫn dùng văn bản thuần hoặc quy tắc định dạng riêng, với chuyển đổi bảng Markdown trước khi chia nhỏ nếu được bật.

## Xử lý bảng

Bảng Markdown không được hỗ trợ nhất quán trên các client chat. Dùng `markdown.tables` để kiểm soát chuyển đổi theo kênh (và tài khoản).

- `code`: render bảng thành code block (mặc định cho hầu hết kênh).
- `bullets`: chuyển mỗi hàng thành bullet point (mặc định cho Signal + WhatsApp).
- `off`: tắt parse và chuyển đổi bảng; văn bản bảng thô được giữ nguyên.

Khóa cấu hình:

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

- Giới hạn chia nhỏ từ adapter/config kênh và áp dụng lên văn bản IR.
- Code fence được giữ nguyên thành một block với newline cuối để kênh render đúng.
- Tiền tố danh sách và blockquote là một phần của văn bản IR, không chia giữa tiền tố.
- Style inline (bold/italic/strike/inline-code/spoiler) không bị chia nhỏ; renderer mở lại style trong mỗi phần.

Nếu cần thêm về hành vi chia nhỏ trên các kênh, xem [Streaming + chunking](/concepts/streaming).

## Chính sách link

- **Slack:** `[label](url)` -> `<url|label>`; URL trần giữ nguyên. Tắt autolink khi parse để tránh link đôi.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (chế độ parse HTML).
- **Signal:** `[label](url)` -> `label (url)` trừ khi label trùng URL.

## Spoilers

Dấu spoiler (`||spoiler||`) chỉ được parse cho Signal, nơi chúng map thành style SPOILER. Các kênh khác coi như văn bản thuần.

## Cách thêm hoặc cập nhật formatter kênh

1. **Parse một lần:** dùng `markdownToIR(...)` với tùy chọn phù hợp kênh (autolink, heading style, blockquote prefix).
2. **Render:** triển khai renderer với `renderMarkdownWithMarkers(...)` và map style marker (hoặc Signal style ranges).
3. **Chia nhỏ:** gọi `chunkMarkdownIR(...)` trước khi render; render từng phần.
4. **Kết nối adapter:** cập nhật adapter outbound kênh để dùng chunker và renderer mới.
5. **Test:** thêm hoặc cập nhật test định dạng và test gửi outbound nếu kênh dùng chia nhỏ.

## Lưu ý thường gặp

- Token angle-bracket của Slack (`<@U123>`, `<#C123>`, `<https://...>`) phải được giữ nguyên; escape HTML thô an toàn.
- HTML của Telegram cần escape văn bản ngoài thẻ để tránh markup lỗi.
- Signal style ranges phụ thuộc vào offset UTF-16; không dùng offset code point.
- Giữ newline cuối cho code block để marker đóng nằm trên dòng riêng.\n