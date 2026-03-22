---
summary: "Chạy OpenClaw với Ollama (model cloud và local)"
read_when:
  - Muốn chạy OpenClaw với model cloud hoặc local qua Ollama
  - Cần hướng dẫn cài đặt và cấu hình Ollama
title: "Ollama"
---

# Ollama

Ollama là runtime LLM local giúp chạy model open-source trên máy dễ dàng. OpenClaw tích hợp với API gốc của Ollama (`/api/chat`), hỗ trợ streaming và tool calling, tự động phát hiện model Ollama local khi bật `OLLAMA_API_KEY` (hoặc auth profile) và không định nghĩa `models.providers.ollama`.

<Warning>
**Người dùng Ollama remote**: Không dùng URL `/v1` tương thích OpenAI (`http://host:11434/v1`) với OpenClaw. Sẽ gây lỗi tool calling và model có thể xuất JSON tool thô dưới dạng plain text. Dùng URL API gốc của Ollama: `baseUrl: "http://host:11434"` (không có `/v1`).
</Warning>

## Bắt đầu nhanh

### Onboarding (khuyến nghị)

Thiết lập Ollama nhanh nhất qua onboarding:

```bash
openclaw onboard
```

Chọn **Ollama** từ danh sách provider. Onboarding sẽ:

1. Hỏi URL base của Ollama nơi instance có thể truy cập (mặc định `http://127.0.0.1:11434`).
2. Cho chọn **Cloud + Local** (model cloud và local) hoặc **Local** (chỉ model local).
3. Mở trình duyệt đăng nhập nếu chọn **Cloud + Local** và chưa đăng nhập ollama.com.
4. Phát hiện model có sẵn và gợi ý mặc định.
5. Tự động pull model đã chọn nếu chưa có local.

Hỗ trợ chế độ không tương tác:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

Tùy chọn chỉ định URL base hoặc model tùy chỉnh:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### Thiết lập thủ công

1. Cài đặt Ollama: [https://ollama.com/download](https://ollama.com/download)

2. Pull model local nếu muốn inference local:

```bash
ollama pull glm-4.7-flash
# hoặc
ollama pull gpt-oss:20b
# hoặc
ollama pull llama3.3
```

3. Nếu muốn model cloud, đăng nhập:

```bash
ollama signin
```

4. Chạy onboarding và chọn `Ollama`:

```bash
openclaw onboard
```

- `Local`: chỉ model local
- `Cloud + Local`: model local và cloud
- Model cloud như `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, và `glm-5:cloud` **không** cần `ollama pull` local

OpenClaw hiện gợi ý:

- mặc định local: `glm-4.7-flash`
- mặc định cloud: `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`

5. Nếu thích thiết lập thủ công, bật Ollama cho OpenClaw trực tiếp (giá trị nào cũng được; Ollama không cần key thật):

```bash
# Đặt biến môi trường
export OLLAMA_API_KEY="ollama-local"

# Hoặc cấu hình trong file config
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. Kiểm tra hoặc chuyển model:

```bash
openclaw models list
openclaw models set ollama/glm-4.7-flash
```

7. Hoặc đặt mặc định trong config:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/glm-4.7-flash" },
    },
  },
}
```

## Phát hiện model (provider ngầm định)

Khi đặt `OLLAMA_API_KEY` (hoặc auth profile) và **không** định nghĩa `models.providers.ollama`, OpenClaw phát hiện model từ instance Ollama local tại `http://127.0.0.1:11434`:

- Truy vấn `/api/tags`
- Dùng `/api/show` để đọc `contextWindow` khi có
- Đánh dấu `reasoning` với heuristic tên model (`r1`, `reasoning`, `think`)
- Đặt `maxTokens` theo giới hạn max-token Ollama mặc định dùng bởi OpenClaw
- Đặt tất cả chi phí là `0`

Tránh nhập model thủ công mà vẫn giữ catalog đồng bộ với instance Ollama local.

Để xem model có sẵn:

```bash
ollama list
openclaw models list
```

Để thêm model mới, chỉ cần pull với Ollama:

```bash
ollama pull mistral
```

Model mới sẽ tự động được phát hiện và có sẵn để dùng.

Nếu đặt `models.providers.ollama` rõ ràng, auto-discovery bị bỏ qua và phải định nghĩa model thủ công (xem bên dưới).

## Cấu hình

### Thiết lập cơ bản (phát hiện ngầm định)

Cách đơn giản nhất để bật Ollama là qua biến môi trường:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Thiết lập rõ ràng (model thủ công)

Dùng config rõ ràng khi:

- Ollama chạy trên host/port khác.
- Muốn ép context window hoặc danh sách model cụ thể.
- Muốn định nghĩa model hoàn toàn thủ công.

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

Nếu `OLLAMA_API_KEY` được đặt, có thể bỏ qua `apiKey` trong entry provider và OpenClaw sẽ tự điền để kiểm tra khả dụng.

### URL base tùy chỉnh (config rõ ràng)

Nếu Ollama chạy trên host hoặc port khác (config rõ ràng tắt auto-discovery, nên định nghĩa model thủ công):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // Không có /v1 - dùng URL API gốc của Ollama
        api: "ollama", // Đặt rõ ràng để đảm bảo hành vi tool-calling gốc
      },
    },
  },
}
```

<Warning>
Không thêm `/v1` vào URL. Đường dẫn `/v1` dùng chế độ tương thích OpenAI, nơi tool calling không đáng tin cậy. Dùng URL base của Ollama không có hậu tố đường dẫn.
</Warning>

### Chọn model

Khi đã cấu hình, tất cả model Ollama sẽ có sẵn:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Model cloud

Model cloud cho phép chạy model host trên cloud (ví dụ `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`) cùng với model local.

Để dùng model cloud, chọn chế độ **Cloud + Local** trong quá trình thiết lập. Wizard kiểm tra xem đã đăng nhập chưa và mở trình duyệt đăng nhập khi cần. Nếu không xác thực được, wizard sẽ quay lại mặc định model local.

Cũng có thể đăng nhập trực tiếp tại [ollama.com/signin](https://ollama.com/signin).

## Nâng cao

### Model reasoning

OpenClaw mặc định coi các model có tên như `deepseek-r1`, `reasoning`, hoặc `think` là có khả năng reasoning:

```bash
ollama pull deepseek-r1:32b
```

### Chi phí model

Ollama miễn phí và chạy local, nên tất cả chi phí model được đặt là $0.

### Cấu hình Streaming

Tích hợp Ollama của OpenClaw dùng **API gốc của Ollama** (`/api/chat`) mặc định, hỗ trợ đầy đủ streaming và tool calling đồng thời. Không cần cấu hình đặc biệt.

#### Chế độ tương thích OpenAI cũ

<Warning>
**Tool calling không đáng tin cậy trong chế độ tương thích OpenAI.** Chỉ dùng chế độ này nếu cần định dạng OpenAI cho proxy và không phụ thuộc vào hành vi tool calling gốc.
</Warning>

Nếu cần dùng endpoint tương thích OpenAI (ví dụ, sau proxy chỉ hỗ trợ định dạng OpenAI), đặt `api: "openai-completions"` rõ ràng:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // mặc định: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

Chế độ này có thể không hỗ trợ streaming + tool calling đồng thời. Có thể cần tắt streaming với `params: { streaming: false }` trong config model.

Khi `api: "openai-completions"` được dùng với Ollama, OpenClaw mặc định inject `options.num_ctx` để Ollama không âm thầm quay lại context window 4096. Nếu proxy/upstream từ chối trường `options` không xác định, tắt hành vi này:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: false,
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

### Context windows

Với model tự động phát hiện, OpenClaw dùng context window do Ollama báo cáo khi có, nếu không sẽ quay lại context window mặc định của Ollama dùng bởi OpenClaw. Có thể ghi đè `contextWindow` và `maxTokens` trong config provider rõ ràng.

## Khắc phục sự cố

### Ollama không được phát hiện

Đảm bảo Ollama đang chạy và đã đặt `OLLAMA_API_KEY` (hoặc auth profile), và không định nghĩa rõ ràng `models.providers.ollama`:

```bash
ollama serve
```

Và API có thể truy cập:

```bash
curl http://localhost:11434/api/tags
```

### Không có model nào khả dụng

Nếu model không được liệt kê, hoặc:

- Pull model local, hoặc
- Định nghĩa model rõ ràng trong `models.providers.ollama`.

Để thêm model:

```bash
ollama list  # Xem những gì đã cài đặt
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull llama3.3     # Hoặc model khác
```

### Kết nối bị từ chối

Kiểm tra Ollama đang chạy trên đúng port:

```bash
# Kiểm tra nếu Ollama đang chạy
ps aux | grep ollama

# Hoặc khởi động lại Ollama
ollama serve
```

## Xem thêm

- [Model Providers](/concepts/model-providers) - Tổng quan về tất cả các provider
- [Model Selection](/concepts/models) - Cách chọn model
- [Configuration](/gateway/configuration) - Tham khảo cấu hình đầy đủ\n