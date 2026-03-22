---
summary: "Sử dụng OpenAI qua API keys hoặc Codex subscription trong OpenClaw"
read_when:
  - Muốn dùng OpenAI models trong OpenClaw
  - Muốn dùng Codex subscription auth thay vì API keys
title: "OpenAI"
---

# OpenAI

OpenAI cung cấp API cho các model GPT. Codex hỗ trợ **đăng nhập ChatGPT** cho truy cập subscription hoặc **API key** cho truy cập dựa trên mức sử dụng. Codex cloud yêu cầu đăng nhập ChatGPT. OpenAI hỗ trợ rõ ràng việc dùng OAuth subscription trong các công cụ/workflow bên ngoài như OpenClaw.

## Lựa chọn A: OpenAI API key (OpenAI Platform)

**Phù hợp nhất cho:** truy cập API trực tiếp và thanh toán dựa trên mức sử dụng. Lấy API key từ OpenAI dashboard.

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

Tài liệu API hiện tại của OpenAI liệt kê `gpt-5.4` và `gpt-5.4-pro` cho việc sử dụng API trực tiếp. OpenClaw chuyển tiếp cả hai qua đường dẫn `openai/*` Responses. OpenClaw cố tình loại bỏ dòng `openai/gpt-5.3-codex-spark` cũ, vì các cuộc gọi API trực tiếp của OpenAI từ chối nó trong lưu lượng thực tế.

OpenClaw **không** hiển thị `openai/gpt-5.3-codex-spark` trên đường dẫn API trực tiếp của OpenAI. `pi-ai` vẫn cung cấp một dòng tích hợp cho model đó, nhưng các yêu cầu API trực tiếp của OpenAI hiện tại từ chối nó. Spark được coi là chỉ dành cho Codex trong OpenClaw.

## Lựa chọn B: OpenAI Code (Codex) subscription

**Phù hợp nhất cho:** sử dụng truy cập subscription ChatGPT/Codex thay vì API key. Codex cloud yêu cầu đăng nhập ChatGPT, trong khi Codex CLI hỗ trợ đăng nhập ChatGPT hoặc API key.

### Thiết lập CLI (Codex OAuth)

```bash
# Chạy Codex OAuth trong wizard
openclaw onboard --auth-choice openai-codex

# Hoặc chạy OAuth trực tiếp
openclaw models auth login --provider openai-codex
```

### Đoạn cấu hình (Codex subscription)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

Tài liệu Codex hiện tại của OpenAI liệt kê `gpt-5.4` là model Codex hiện tại. OpenClaw ánh xạ điều đó thành `openai-codex/gpt-5.4` cho việc sử dụng OAuth ChatGPT/Codex.

Nếu tài khoản Codex có quyền truy cập Codex Spark, OpenClaw cũng hỗ trợ:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw coi Codex Spark là chỉ dành cho Codex. Nó không hiển thị đường dẫn API-key trực tiếp `openai/gpt-5.3-codex-spark`.

OpenClaw cũng giữ lại `openai-codex/gpt-5.3-codex-spark` khi `pi-ai` phát hiện ra nó. Xem nó như là phụ thuộc vào quyền và thử nghiệm: Codex Spark tách biệt với GPT-5.4 `/fast`, và khả dụng phụ thuộc vào tài khoản Codex / ChatGPT đã đăng nhập.

### Transport mặc định

OpenClaw sử dụng `pi-ai` cho streaming model. Đối với cả `openai/*` và `openai-codex/*`, transport mặc định là `"auto"` (ưu tiên WebSocket, sau đó fallback SSE).

Có thể đặt `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: bắt buộc SSE
- `"websocket"`: bắt buộc WebSocket
- `"auto"`: thử WebSocket, sau đó fallback SSE

Đối với `openai/*` (Responses API), OpenClaw cũng bật warm-up WebSocket mặc định (`openaiWsWarmup: true`) khi sử dụng transport WebSocket.

Tài liệu liên quan của OpenAI:

- [Realtime API với WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

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

### OpenAI WebSocket warm-up

Tài liệu OpenAI mô tả warm-up là tùy chọn. OpenClaw bật mặc định cho `openai/*` để giảm độ trễ lượt đầu khi sử dụng transport WebSocket.

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

### Bật warm-up rõ ràng

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

### Xử lý ưu tiên OpenAI

API của OpenAI cung cấp xử lý ưu tiên qua `service_tier=priority`. Trong OpenClaw, đặt `agents.defaults.models["openai/<model>"].params.serviceTier` để truyền trường đó qua các yêu cầu Responses trực tiếp `openai/*`.

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

Các giá trị hỗ trợ là `auto`, `default`, `flex`, và `priority`.

### Chế độ nhanh OpenAI

OpenClaw cung cấp một toggle chế độ nhanh chung cho cả `openai/*` và `openai-codex/*` sessions:

- Chat/UI: `/fast status|on|off`
- Config: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Khi chế độ nhanh được bật, OpenClaw áp dụng một profile OpenAI độ trễ thấp:

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

Session overrides thắng config. Xóa session override trong Sessions UI sẽ trả session về mặc định đã cấu hình.

### Nén phía server OpenAI Responses

Đối với các model OpenAI Responses trực tiếp (`openai/*` sử dụng `api: "openai-responses"` với `baseUrl` trên `api.openai.com`), OpenClaw hiện tự động bật gợi ý payload nén phía server OpenAI:

- Bắt buộc `store: true` (trừ khi model compat đặt `supportsStore: false`)
- Chèn `context_management: [{ type: "compaction", compact_threshold: ... }]`

Mặc định, `compact_threshold` là `70%` của `contextWindow` model (hoặc `80000` khi không có sẵn).

### Bật nén phía server rõ ràng

Dùng khi muốn bắt buộc chèn `context_management` trên các model Responses tương thích (ví dụ Azure OpenAI Responses):

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

### Bật với ngưỡng tùy chỉnh

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

`responsesServerCompaction` chỉ kiểm soát việc chèn `context_management`. Các model OpenAI Responses trực tiếp vẫn bắt buộc `store: true` trừ khi compat đặt `supportsStore: false`.

## Ghi chú

- Model refs luôn sử dụng `provider/model` (xem [/concepts/models](/concepts/models)).
- Chi tiết auth + quy tắc tái sử dụng có trong [/concepts/oauth](/concepts/oauth).\n