---
summary: "Khám phá cách cấu hình và sử dụng OpenAI qua API keys, đăng ký Codex để tích hợp vào OpenClaw hiệu quả."
read_when:
  - Bạn muốn sử dụng mô hình OpenAI trong OpenClaw
  - Bạn muốn xác thực đăng ký Codex thay vì API keys
title: "Hướng Dẫn Sử Dụng OpenAI API Key"
---

# OpenAI

OpenAI cung cấp API cho các nhà phát triển để sử dụng mô hình GPT. Codex hỗ trợ **đăng nhập ChatGPT** cho truy cập đăng ký hoặc **đăng nhập bằng API key** cho truy cập dựa trên sử dụng. Codex cloud yêu cầu đăng nhập ChatGPT. OpenAI hỗ trợ rõ ràng việc sử dụng OAuth đăng ký trong các công cụ/quy trình bên ngoài như OpenClaw.

## Lựa chọn A: API key của OpenAI (Nền tảng OpenAI)

**Phù hợp nhất cho:** truy cập API trực tiếp và thanh toán dựa trên sử dụng.
Lấy API key từ dashboard của OpenAI.

### Thiết lập CLI

```bash
openclaw onboard --auth-choice openai-api-key
# hoặc không tương tác
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Đoạn cấu hình

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

Tài liệu API hiện tại của OpenAI liệt kê `gpt-5.4` và `gpt-5.4-pro` cho việc sử dụng API trực tiếp của OpenAI. OpenClaw chuyển tiếp cả hai qua đường dẫn `openai/*` Responses. OpenClaw cố ý loại bỏ dòng `openai/gpt-5.3-codex-spark` cũ, vì các cuộc gọi API trực tiếp của OpenAI từ chối nó trong lưu lượng truy cập thực tế.

OpenClaw **không** hiển thị `openai/gpt-5.3-codex-spark` trên đường dẫn API trực tiếp của OpenAI. `pi-ai` vẫn cung cấp một dòng tích hợp cho mô hình đó, nhưng các yêu cầu API trực tiếp của OpenAI hiện tại từ chối nó. Spark được coi là chỉ dành cho Codex trong OpenClaw.

## Lựa chọn B: Đăng ký OpenAI Code (Codex)

**Phù hợp nhất cho:** sử dụng truy cập đăng ký ChatGPT/Codex thay vì API key.
Codex cloud yêu cầu đăng nhập ChatGPT, trong khi Codex CLI hỗ trợ đăng nhập ChatGPT hoặc API key.

### Thiết lập CLI (Codex OAuth)

```bash
# Chạy Codex OAuth trong wizard
openclaw onboard --auth-choice openai-codex

# Hoặc chạy OAuth trực tiếp
openclaw models auth login --provider openai-codex
```

### Đoạn cấu hình (đăng ký Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

Tài liệu Codex hiện tại của OpenAI liệt kê `gpt-5.4` là mô hình Codex hiện tại. OpenClaw ánh xạ điều đó thành `openai-codex/gpt-5.4` cho việc sử dụng OAuth ChatGPT/Codex.

Nếu tài khoản Codex của bạn có quyền truy cập Codex Spark, OpenClaw cũng hỗ trợ:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw coi Codex Spark là chỉ dành cho Codex. Nó không hiển thị đường dẫn API-key trực tiếp `openai/gpt-5.3-codex-spark`.

OpenClaw cũng giữ lại `openai-codex/gpt-5.3-codex-spark` khi `pi-ai` phát hiện ra nó. Hãy coi nó là phụ thuộc vào quyền và thử nghiệm: Codex Spark tách biệt với GPT-5.4 `/fast`, và khả dụng phụ thuộc vào tài khoản Codex / ChatGPT đã đăng nhập.

### Giao thức mặc định

OpenClaw sử dụng `pi-ai` cho streaming mô hình. Đối với cả `openai/*` và `openai-codex/*`, giao thức mặc định là `"auto"` (ưu tiên WebSocket, sau đó là SSE).

Bạn có thể thiết lập `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: buộc dùng SSE
- `"websocket"`: buộc dùng WebSocket
- `"auto"`: thử WebSocket, sau đó chuyển sang SSE nếu cần

Đối với `openai/*` (API Responses), OpenClaw cũng kích hoạt warm-up WebSocket mặc định (`openaiWsWarmup: true`) khi sử dụng giao thức WebSocket.

Tài liệu liên quan của OpenAI:

- [API thời gian thực với WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Phản hồi API streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### Warm-up WebSocket của OpenAI

Tài liệu OpenAI mô tả warm-up là tùy chọn. OpenClaw kích hoạt nó mặc định cho `openai/*` để giảm độ trễ lượt đầu tiên khi sử dụng giao thức WebSocket.

### Tắt warm-up

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Kích hoạt warm-up rõ ràng

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Xử lý ưu tiên của OpenAI

API của OpenAI cung cấp xử lý ưu tiên qua `service_tier=priority`. Trong OpenClaw, thiết lập `agents.defaults.models["openai/<model>"].params.serviceTier` để truyền trường đó qua các yêu cầu Responses trực tiếp `openai/*`.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Các giá trị được hỗ trợ là `auto`, `default`, `flex`, và `priority`.

### Chế độ nhanh của OpenAI

OpenClaw cung cấp một công tắc chế độ nhanh chung cho cả phiên `openai/*` và `openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Cấu hình: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Khi chế độ nhanh được kích hoạt, OpenClaw áp dụng một hồ sơ OpenAI độ trễ thấp:

- `reasoning.effort = "low"` khi payload chưa chỉ định reasoning
- `text.verbosity = "low"` khi payload chưa chỉ định verbosity
- `service_tier = "priority"` cho các cuộc gọi Responses trực tiếp `openai/*` tới `api.openai.com`

Ví dụ:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Ghi đè phiên sẽ thắng cấu hình. Xóa ghi đè phiên trong giao diện Sessions sẽ trả phiên về mặc định đã cấu hình.

### Nén phía server của OpenAI Responses

Đối với các mô hình OpenAI Responses trực tiếp (`openai/*` sử dụng `api: "openai-responses"` với `baseUrl` trên `api.openai.com`), OpenClaw hiện tự động kích hoạt gợi ý nén payload phía server của OpenAI:

- Buộc `store: true` (trừ khi mô hình tương thích đặt `supportsStore: false`)
- Chèn `context_management: [{ type: "compaction", compact_threshold: ... }]`

Mặc định, `compact_threshold` là `70%` của `contextWindow` mô hình (hoặc `80000` khi không có sẵn).

### Kích hoạt nén phía server rõ ràng

Sử dụng điều này khi bạn muốn buộc chèn `context_management` trên các mô hình Responses tương thích (ví dụ Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Kích hoạt với ngưỡng tùy chỉnh

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Tắt nén phía server

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` chỉ kiểm soát việc chèn `context_management`. Các mô hình OpenAI Responses trực tiếp vẫn buộc `store: true` trừ khi tương thích đặt `supportsStore: false`.

## Ghi chú

- Tham chiếu mô hình luôn sử dụng `provider/model` (xem [/concepts/models](/concepts/models)).
- Chi tiết xác thực + quy tắc tái sử dụng có trong [/concepts/oauth](/concepts/oauth).
