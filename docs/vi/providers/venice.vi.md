---
summary: "Sử dụng mô hình Venice AI tập trung vào quyền riêng tư trong OpenClaw"
read_when:
  - Cần suy luận tập trung vào quyền riêng tư trong OpenClaw
  - Cần hướng dẫn thiết lập Venice AI
title: "Venice AI"
---

# Venice AI (Điểm nhấn Venice)

**Venice** là thiết lập nổi bật của Venice cho suy luận ưu tiên quyền riêng tư với quyền truy cập ẩn danh tùy chọn vào các mô hình độc quyền.

Venice AI cung cấp suy luận AI tập trung vào quyền riêng tư với hỗ trợ cho các mô hình không kiểm duyệt và truy cập vào các mô hình độc quyền lớn thông qua proxy ẩn danh. Mọi suy luận đều riêng tư mặc định—không huấn luyện trên dữ liệu, không ghi log.

## Tại sao chọn Venice trong OpenClaw

- **Suy luận riêng tư** cho các mô hình mã nguồn mở (không ghi log).
- **Mô hình không kiểm duyệt** khi cần.
- **Truy cập ẩn danh** vào các mô hình độc quyền (Opus/GPT/Gemini) khi chất lượng quan trọng.
- Endpoint `/v1` tương thích OpenAI.

## Chế độ quyền riêng tư

Venice cung cấp hai mức độ quyền riêng tư — hiểu rõ điều này là chìa khóa để chọn mô hình:

| Chế độ         | Mô tả                                                                                                                       | Mô hình                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private**    | Hoàn toàn riêng tư. Prompt/response **không bao giờ được lưu trữ hoặc ghi log**. Tạm thời.                                  | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, v.v. |
| **Anonymized** | Proxy qua Venice với metadata bị loại bỏ. Nhà cung cấp cơ bản (OpenAI, Anthropic, Google, xAI) chỉ thấy yêu cầu ẩn danh.    | Claude, GPT, Gemini, Grok                                     |

## Tính năng

- **Tập trung vào quyền riêng tư**: Chọn giữa chế độ "private" (hoàn toàn riêng tư) và "anonymized" (proxy)
- **Mô hình không kiểm duyệt**: Truy cập vào các mô hình không có hạn chế nội dung
- **Truy cập mô hình lớn**: Sử dụng Claude, GPT, Gemini và Grok qua proxy ẩn danh của Venice
- **API tương thích OpenAI**: Endpoint `/v1` chuẩn cho tích hợp dễ dàng
- **Streaming**: ✅ Hỗ trợ trên tất cả mô hình
- **Function calling**: ✅ Hỗ trợ trên một số mô hình (kiểm tra khả năng mô hình)
- **Vision**: ✅ Hỗ trợ trên các mô hình có khả năng vision
- **Không giới hạn tốc độ cứng**: Có thể áp dụng throttling sử dụng công bằng cho trường hợp sử dụng cực đoan

## Thiết lập

### 1. Lấy API Key

1. Đăng ký tại [venice.ai](https://venice.ai)
2. Vào **Settings → API Keys → Create new key**
3. Sao chép API key (định dạng: `vapi_xxxxxxxxxxxx`)

### 2. Cấu hình OpenClaw

**Option A: Environment Variable**

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

**Option B: Interactive Setup (Khuyến nghị)**

```bash
openclaw onboard --auth-choice venice-api-key
```

Quá trình này sẽ:

1. Yêu cầu nhập API key (hoặc sử dụng `VENICE_API_KEY` hiện có)
2. Hiển thị tất cả mô hình Venice có sẵn
3. Cho phép chọn mô hình mặc định
4. Tự động cấu hình provider

**Option C: Non-interactive**

```bash
openclaw onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. Kiểm tra thiết lập

```bash
openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
```

## Chọn mô hình

Sau khi thiết lập, OpenClaw hiển thị tất cả mô hình Venice có sẵn. Chọn dựa trên nhu cầu:

- **Mô hình mặc định**: `venice/kimi-k2-5` cho suy luận riêng tư mạnh mẽ cộng thêm vision.
- **Tùy chọn khả năng cao**: `venice/claude-opus-4-6` cho đường Venice ẩn danh mạnh nhất.
- **Quyền riêng tư**: Chọn mô hình "private" cho suy luận hoàn toàn riêng tư.
- **Khả năng**: Chọn mô hình "anonymized" để truy cập Claude, GPT, Gemini qua proxy của Venice.

Thay đổi mô hình mặc định bất kỳ lúc nào:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Liệt kê tất cả mô hình có sẵn:

```bash
openclaw models list | grep venice
```

## Cấu hình qua `openclaw configure`

1. Chạy `openclaw configure`
2. Chọn **Model/auth**
3. Chọn **Venice AI**

## Nên dùng mô hình nào?

| Trường hợp sử dụng         | Mô hình khuyến nghị             | Lý do                                      |
| -------------------------- | ------------------------------- | ------------------------------------------ |
| **Chat chung (mặc định)**  | `kimi-k2-5`                     | Suy luận riêng tư mạnh mẽ cộng thêm vision |
| **Chất lượng tổng thể tốt nhất** | `claude-opus-4-6`           | Tùy chọn Venice ẩn danh mạnh nhất          |
| **Quyền riêng tư + coding** | `qwen3-coder-480b-a35b-instruct` | Mô hình coding riêng tư với ngữ cảnh lớn  |
| **Vision riêng tư**        | `kimi-k2-5`                     | Hỗ trợ vision mà không rời chế độ riêng tư |
| **Nhanh + rẻ**             | `qwen3-4b`                      | Mô hình suy luận nhẹ                       |
| **Nhiệm vụ phức tạp riêng tư** | `deepseek-v3.2`             | Suy luận mạnh, nhưng không hỗ trợ công cụ Venice |
| **Không kiểm duyệt**       | `venice-uncensored`             | Không có hạn chế nội dung                  |

## Mô hình có sẵn (Tổng 41)

### Mô hình Private (26) - Hoàn toàn riêng tư, Không ghi log

| Model ID                               | Tên                                 | Context | Tính năng                   |
| -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
| `kimi-k2-5`                            | Kimi K2.5                           | 256k    | Mặc định, suy luận, vision |
| `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Suy luận                  |
| `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | Chung                    |
| `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | Chung                    |
| `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k    | Chung, công cụ bị tắt    |
| `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k    | Suy luận                  |
| `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k    | Chung                    |
| `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k    | Coding                     |
| `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k    | Coding                     |
| `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k    | Suy luận, vision          |
| `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k    | Chung                    |
| `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k    | Vision                     |
| `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k     | Nhanh, suy luận            |
| `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k    | Suy luận, công cụ bị tắt  |
| `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Không kiểm duyệt, công cụ bị tắt |
| `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k    | Vision                     |
| `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k    | Vision                     |
| `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k    | Chung                    |
| `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k    | Chung                    |
| `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k    | Suy luận                  |
| `zai-org-glm-4.6`                      | GLM 4.6                             | 198k    | Chung                    |
| `zai-org-glm-4.7`                      | GLM 4.7                             | 198k    | Suy luận                  |
| `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k    | Suy luận                  |
| `zai-org-glm-5`                        | GLM 5                               | 198k    | Suy luận                  |
| `minimax-m21`                          | MiniMax M2.1                        | 198k    | Suy luận                  |
| `minimax-m25`                          | MiniMax M2.5                        | 198k    | Suy luận                  |

### Mô hình Anonymized (15) - Qua Proxy Venice

| Model ID                        | Tên                            | Context | Tính năng                  |
| ------------------------------- | ------------------------------ | ------- | ------------------------- |
| `claude-opus-4-6`               | Claude Opus 4.6 (qua Venice)   | 1M      | Suy luận, vision         |
| `claude-opus-4-5`               | Claude Opus 4.5 (qua Venice)   | 198k    | Suy luận, vision         |
| `claude-sonnet-4-6`             | Claude Sonnet 4.6 (qua Venice) | 1M      | Suy luận, vision         |
| `claude-sonnet-4-5`             | Claude Sonnet 4.5 (qua Venice) | 198k    | Suy luận, vision         |
| `openai-gpt-54`                 | GPT-5.4 (qua Venice)           | 1M      | Suy luận, vision         |
| `openai-gpt-53-codex`           | GPT-5.3 Codex (qua Venice)     | 400k    | Suy luận, vision, coding |
| `openai-gpt-52`                 | GPT-5.2 (qua Venice)           | 256k    | Suy luận                 |
| `openai-gpt-52-codex`           | GPT-5.2 Codex (qua Venice)     | 256k    | Suy luận, vision, coding |
| `openai-gpt-4o-2024-11-20`      | GPT-4o (qua Venice)            | 128k    | Vision                    |
| `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (qua Venice)       | 128k    | Vision                    |
| `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (qua Venice)    | 1M      | Suy luận, vision         |
| `gemini-3-pro-preview`          | Gemini 3 Pro (qua Venice)      | 198k    | Suy luận, vision         |
| `gemini-3-flash-preview`        | Gemini 3 Flash (qua Venice)    | 256k    | Suy luận, vision         |
| `grok-41-fast`                  | Grok 4.1 Fast (qua Venice)     | 1M      | Suy luận, vision         |
| `grok-code-fast-1`              | Grok Code Fast 1 (qua Venice)  | 256k    | Suy luận, coding         |

## Khám phá mô hình

OpenClaw tự động phát hiện mô hình từ API Venice khi `VENICE_API_KEY` được thiết lập. Nếu API không thể truy cập, nó sẽ sử dụng danh mục tĩnh.

Endpoint `/models` là công khai (không cần auth để liệt kê), nhưng suy luận yêu cầu API key hợp lệ.

## Hỗ trợ Streaming & Công cụ

| Tính năng              | Hỗ trợ                                                 |
| ---------------------- | ------------------------------------------------------- |
| **Streaming**          | ✅ Tất cả mô hình                                       |
| **Function calling**   | ✅ Hầu hết mô hình (kiểm tra `supportsFunctionCalling` trong API) |
| **Vision/Images**      | ✅ Mô hình có tính năng "Vision"                        |
| **JSON mode**          | ✅ Hỗ trợ qua `response_format`                         |

## Giá cả

Venice sử dụng hệ thống dựa trên credit. Kiểm tra [venice.ai/pricing](https://venice.ai/pricing) để biết giá hiện tại:

- **Mô hình private**: Thường có chi phí thấp hơn
- **Mô hình anonymized**: Tương tự giá API trực tiếp + phí nhỏ của Venice

## So sánh: Venice vs API trực tiếp

| Khía cạnh      | Venice (Anonymized)           | API trực tiếp       |
| -------------- | ----------------------------- | ------------------- |
| **Quyền riêng tư** | Metadata bị loại bỏ, ẩn danh | Tài khoản của bạn liên kết |
| **Độ trễ**     | +10-50ms (proxy)              | Trực tiếp           |
| **Tính năng**  | Hầu hết tính năng được hỗ trợ | Đầy đủ tính năng    |
| **Thanh toán** | Credit của Venice             | Thanh toán của nhà cung cấp |

## Ví dụ sử dụng

```bash
# Sử dụng mô hình private mặc định
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Sử dụng Claude Opus qua Venice (ẩn danh)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Sử dụng mô hình không kiểm duyệt
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Sử dụng mô hình vision với hình ảnh
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Sử dụng mô hình coding
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Khắc phục sự cố

### API key không được nhận diện

```bash
echo $VENICE_API_KEY
openclaw models list | grep venice
```

Đảm bảo key bắt đầu với `vapi_`.

### Mô hình không có sẵn

Danh mục mô hình Venice cập nhật động. Chạy `openclaw models list` để xem các mô hình hiện có. Một số mô hình có thể tạm thời offline.

### Vấn đề kết nối

API Venice tại `https://api.venice.ai/api/v1`. Đảm bảo mạng cho phép kết nối HTTPS.

## Ví dụ file cấu hình

```json5
{
  env: { VENICE_API_KEY: "vapi_..." },
  agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
  models: {
    mode: "merge",
    providers: {
      venice: {
        baseUrl: "https://api.venice.ai/api/v1",
        apiKey: "${VENICE_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2-5",
            name: "Kimi K2.5",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Liên kết

- [Venice AI](https://venice.ai)
- [Tài liệu API](https://docs.venice.ai)
- [Giá cả](https://venice.ai/pricing)
- [Trạng thái](https://status.venice.ai)\n