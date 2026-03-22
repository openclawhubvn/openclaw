# OpenResponses API (HTTP)

Gateway của OpenClaw có thể cung cấp endpoint `POST /v1/responses` tương thích với OpenResponses.

Endpoint này **mặc định bị tắt**. Cần bật trong config trước.

- `POST /v1/responses`
- Cùng port với Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/responses`

Bên dưới, request được thực thi như một lần chạy agent của Gateway (cùng codepath với `openclaw agent`), nên routing/quyền/config sẽ khớp với Gateway.

## Xác thực, bảo mật và routing

Hoạt động tương tự [OpenAI Chat Completions](/gateway/openai-http-api):

- dùng `Authorization: Bearer <token>` với cấu hình auth của Gateway
- coi endpoint này như quyền operator đầy đủ cho instance gateway
- chọn agents với `model: "openclaw:<agentId>"`, `model: "agent:<agentId>"`, hoặc `x-openclaw-agent-id`
- dùng `x-openclaw-session-key` để routing session rõ ràng

Bật hoặc tắt endpoint này với `gateway.http.endpoints.responses.enabled`.

## Hành vi session

Mặc định, endpoint là **stateless per request** (mỗi lần gọi tạo một session key mới).

Nếu request có chuỗi `user` của OpenResponses, Gateway sẽ tạo session key ổn định từ đó, giúp các lần gọi lặp lại có thể chia sẻ session agent.

## Cấu trúc request (hỗ trợ)

Request tuân theo OpenResponses API với input dạng item. Hiện hỗ trợ:

- `input`: chuỗi hoặc mảng các đối tượng item.
- `instructions`: gộp vào system prompt.
- `tools`: định nghĩa công cụ client (function tools).
- `tool_choice`: lọc hoặc yêu cầu công cụ client.
- `stream`: kích hoạt SSE streaming.
- `max_output_tokens`: giới hạn output tối đa (phụ thuộc provider).
- `user`: routing session ổn định.

Chấp nhận nhưng **hiện tại bỏ qua**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `previous_response_id`
- `truncation`

## Items (input)

### `message`

Roles: `system`, `developer`, `user`, `assistant`.

- `system` và `developer` được thêm vào system prompt.
- Item `user` hoặc `function_call_output` gần nhất trở thành “current message.”
- Các message user/assistant trước đó được đưa vào làm lịch sử để tạo ngữ cảnh.

### `function_call_output` (công cụ theo lượt)

Gửi kết quả công cụ về model:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` và `item_reference`

Chấp nhận để tương thích schema nhưng bỏ qua khi xây dựng prompt.

## Tools (công cụ phía client)

Cung cấp công cụ với `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Nếu agent quyết định gọi công cụ, response sẽ trả về item `function_call`. Sau đó gửi request tiếp theo với `function_call_output` để tiếp tục lượt.

## Images (`input_image`)

Hỗ trợ nguồn base64 hoặc URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Các MIME type được phép (hiện tại): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Kích thước tối đa (hiện tại): 10MB.

## Files (`input_file`)

Hỗ trợ nguồn base64 hoặc URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Các MIME type được phép (hiện tại): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`.

Kích thước tối đa (hiện tại): 5MB.

Hành vi hiện tại:

- Nội dung file được giải mã và thêm vào **system prompt**, không phải message user, nên không lưu trữ trong lịch sử session.
- PDF được phân tích để lấy text. Nếu ít text, các trang đầu sẽ được raster hóa thành ảnh và chuyển cho model.

Phân tích PDF dùng `pdfjs-dist` legacy build (không worker). Build PDF.js hiện đại yêu cầu browser workers/DOM globals, nên không dùng trong Gateway.

Mặc định fetch URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (tổng số phần `input_file` + `input_image` dựa trên URL mỗi request)
- Requests được bảo vệ (DNS resolution, chặn IP private, giới hạn redirect, timeout).
- Hỗ trợ allowlist hostname tùy chọn cho từng loại input (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host chính xác: `"cdn.example.com"`
  - Subdomain wildcard: `"*.assets.example.com"` (không khớp apex)
  - Allowlist trống hoặc bỏ qua nghĩa là không có giới hạn allowlist hostname.
- Để tắt hoàn toàn fetch dựa trên URL, đặt `files.allowUrl: false` và/hoặc `images.allowUrl: false`.

## Giới hạn file + image (config)

Mặc định có thể điều chỉnh dưới `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image.heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Mặc định khi bỏ qua:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- Nguồn `input_image` HEIC/HEIF được chấp nhận và chuyển thành JPEG trước khi gửi đến provider.

Lưu ý bảo mật:

- Allowlist URL được áp dụng trước khi fetch và trên các bước redirect.
- Allowlist hostname không bỏ qua chặn IP private/internal.
- Với gateways phơi ra internet, áp dụng kiểm soát egress mạng ngoài các bảo vệ cấp ứng dụng.
  Xem [Security](/gateway/security).

## Streaming (SSE)

Đặt `stream: true` để nhận Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Mỗi dòng sự kiện là `event: <type>` và `data: <json>`
- Stream kết thúc với `data: [DONE]`

Các loại sự kiện hiện phát ra:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (khi lỗi)

## Usage

`usage` được điền khi provider cơ sở báo cáo số lượng token.

## Errors

Lỗi sử dụng đối tượng JSON như:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Các trường hợp phổ biến:

- `401` thiếu/sai auth
- `400` body request không hợp lệ
- `405` sai method

## Ví dụ

Không streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Streaming:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```\n