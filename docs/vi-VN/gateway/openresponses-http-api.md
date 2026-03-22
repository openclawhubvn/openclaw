---
summary: "Cung cấp endpoint HTTP /v1/responses tương thích với OpenResponses từ Gateway"
read_when:
  - Tích hợp các client sử dụng API OpenResponses
  - Cần đầu vào theo từng mục, gọi công cụ client, hoặc sự kiện SSE
title: "API OpenResponses"
---

# API OpenResponses (HTTP)

Gateway của OpenClaw có thể cung cấp endpoint `POST /v1/responses` tương thích với OpenResponses.

Endpoint này **mặc định bị vô hiệu hóa**. Cần kích hoạt trong cấu hình trước.

- `POST /v1/responses`
- Cùng cổng với Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/responses`

Về mặt kỹ thuật, các yêu cầu được thực thi như một lần chạy agent thông thường của Gateway (cùng đường dẫn mã với `openclaw agent`), do đó việc định tuyến/quyền hạn/cấu hình sẽ khớp với Gateway của bạn.

## Xác thực, bảo mật và định tuyến

Hành vi hoạt động tương tự [OpenAI Chat Completions](/gateway/openai-http-api):

- sử dụng `Authorization: Bearer <token>` với cấu hình xác thực Gateway thông thường
- coi endpoint này như quyền truy cập đầy đủ cho instance gateway
- chọn agent với `model: "openclaw:<agentId>"`, `model: "agent:<agentId>"`, hoặc `x-openclaw-agent-id`
- sử dụng `x-openclaw-session-key` để định tuyến phiên rõ ràng

Kích hoạt hoặc vô hiệu hóa endpoint này với `gateway.http.endpoints.responses.enabled`.

## Hành vi phiên

Mặc định, endpoint này là **không trạng thái cho mỗi yêu cầu** (một khóa phiên mới được tạo mỗi lần gọi).

Nếu yêu cầu bao gồm chuỗi `user` của OpenResponses, Gateway sẽ tạo ra một khóa phiên ổn định từ đó, cho phép các lần gọi lặp lại có thể chia sẻ một phiên agent.

## Định dạng yêu cầu (hỗ trợ)

Yêu cầu tuân theo API OpenResponses với đầu vào theo từng mục. Hỗ trợ hiện tại:

- `input`: chuỗi hoặc mảng các đối tượng mục.
- `instructions`: được gộp vào lời nhắc hệ thống.
- `tools`: định nghĩa công cụ client (công cụ chức năng).
- `tool_choice`: lọc hoặc yêu cầu công cụ client.
- `stream`: kích hoạt streaming SSE.
- `max_output_tokens`: giới hạn đầu ra tối đa (phụ thuộc vào nhà cung cấp).
- `user`: định tuyến phiên ổn định.

Chấp nhận nhưng **hiện tại bị bỏ qua**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `previous_response_id`
- `truncation`

## Mục (đầu vào)

### `message`

Vai trò: `system`, `developer`, `user`, `assistant`.

- `system` và `developer` được thêm vào lời nhắc hệ thống.
- Mục `user` hoặc `function_call_output` gần nhất trở thành "tin nhắn hiện tại."
- Các tin nhắn user/assistant trước đó được bao gồm như lịch sử để làm ngữ cảnh.

### `function_call_output` (công cụ theo lượt)

Gửi kết quả công cụ trở lại mô hình:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` và `item_reference`

Chấp nhận để tương thích với schema nhưng bị bỏ qua khi xây dựng lời nhắc.

## Công cụ (công cụ chức năng phía client)

Cung cấp công cụ với `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Nếu agent quyết định gọi một công cụ, phản hồi sẽ trả về một mục đầu ra `function_call`.
Sau đó, bạn gửi một yêu cầu tiếp theo với `function_call_output` để tiếp tục lượt.

## Hình ảnh (`input_image`)

Hỗ trợ nguồn base64 hoặc URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Các loại MIME được phép (hiện tại): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Kích thước tối đa (hiện tại): 10MB.

## Tệp tin (`input_file`)

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

Các loại MIME được phép (hiện tại): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Kích thước tối đa (hiện tại): 5MB.

Hành vi hiện tại:

- Nội dung tệp được giải mã và thêm vào **lời nhắc hệ thống**, không phải tin nhắn user,
  do đó nó không được lưu trữ trong lịch sử phiên.
- PDF được phân tích để lấy văn bản. Nếu tìm thấy ít văn bản, các trang đầu tiên sẽ được chuyển thành hình ảnh
  và gửi đến mô hình.

Phân tích PDF sử dụng bản dựng `pdfjs-dist` thân thiện với Node (không có worker). Bản dựng PDF.js hiện đại yêu cầu worker trình duyệt/globals DOM, do đó không được sử dụng trong Gateway.

Mặc định khi lấy URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (tổng số phần `input_file` + `input_image` dựa trên URL cho mỗi yêu cầu)
- Các yêu cầu được bảo vệ (giải quyết DNS, chặn IP riêng, giới hạn chuyển hướng, timeout).
- Hỗ trợ danh sách cho phép hostname tùy chọn cho mỗi loại đầu vào (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host chính xác: `"cdn.example.com"`
  - Tên miền phụ wildcard: `"*.assets.example.com"` (không khớp với apex)
  - Danh sách cho phép trống hoặc bị bỏ qua có nghĩa là không có hạn chế danh sách cho phép hostname.
- Để vô hiệu hóa hoàn toàn việc lấy dựa trên URL, đặt `files.allowUrl: false` và/hoặc `images.allowUrl: false`.

## Giới hạn tệp + hình ảnh (cấu hình)

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
              "image/heif",
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

Mặc định khi bị bỏ qua:

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
- Nguồn `input_image` HEIC/HEIF được chấp nhận và chuẩn hóa thành JPEG trước khi gửi đến nhà cung cấp.

Lưu ý bảo mật:

- Danh sách cho phép URL được thực thi trước khi lấy và trên các bước chuyển hướng.
- Cho phép một hostname không bỏ qua việc chặn IP riêng/nội bộ.
- Đối với các gateway tiếp xúc với internet, áp dụng kiểm soát egress mạng ngoài các biện pháp bảo vệ cấp ứng dụng.
  Xem [Bảo mật](/gateway/security).

## Streaming (SSE)

Đặt `stream: true` để nhận Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Mỗi dòng sự kiện là `event: <type>` và `data: <json>`
- Stream kết thúc với `data: [DONE]`

Các loại sự kiện hiện tại được phát ra:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (khi có lỗi)

## Sử dụng

`usage` được điền khi nhà cung cấp cơ bản báo cáo số lượng token.

## Lỗi

Lỗi sử dụng một đối tượng JSON như:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Các trường hợp phổ biến:

- `401` thiếu/sai xác thực
- `400` yêu cầu không hợp lệ
- `405` phương thức sai

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
```
