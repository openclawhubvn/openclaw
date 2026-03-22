---
summary: "Chạy OpenClaw với Ollama (mô hình đám mây và cục bộ)"
read_when:
  - Bạn muốn chạy OpenClaw với mô hình đám mây hoặc cục bộ qua Ollama
  - Bạn cần hướng dẫn cài đặt và cấu hình Ollama
title: "Ollama"
---

# Ollama

Ollama là một runtime LLM cục bộ giúp bạn dễ dàng chạy các mô hình mã nguồn mở trên máy của mình. OpenClaw tích hợp với API gốc của Ollama (`/api/chat`), hỗ trợ streaming và gọi công cụ, và có thể tự động phát hiện các mô hình Ollama cục bộ khi bạn chọn tham gia với `OLLAMA_API_KEY` (hoặc hồ sơ xác thực) và không định nghĩa một mục `models.providers.ollama` rõ ràng.

<Warning>
**Người dùng Ollama từ xa**: Không sử dụng URL tương thích OpenAI `/v1` (`http://host:11434/v1`) với OpenClaw. Điều này sẽ phá vỡ việc gọi công cụ và mô hình có thể xuất ra JSON công cụ thô dưới dạng văn bản thuần túy. Thay vào đó, hãy sử dụng URL API gốc của Ollama: `baseUrl: "http://host:11434"` (không có `/v1`).
</Warning>

## Bắt đầu nhanh

### Onboarding (khuyến nghị)

Cách nhanh nhất để thiết lập Ollama là thông qua onboarding:

```bash
openclaw onboard
```

Chọn **Ollama** từ danh sách nhà cung cấp. Onboarding sẽ:

1. Yêu cầu URL cơ sở của Ollama nơi có thể truy cập instance của bạn (mặc định `http://127.0.0.1:11434`).
2. Cho phép bạn chọn **Cloud + Local** (mô hình đám mây và mô hình cục bộ) hoặc **Local** (chỉ mô hình cục bộ).
3. Mở luồng đăng nhập trình duyệt nếu bạn chọn **Cloud + Local** và chưa đăng nhập vào ollama.com.
4. Phát hiện các mô hình có sẵn và đề xuất mặc định.
5. Tự động tải mô hình đã chọn nếu nó không có sẵn cục bộ.

Chế độ không tương tác cũng được hỗ trợ:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

Tùy chọn chỉ định URL cơ sở hoặc mô hình tùy chỉnh:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### Thiết lập thủ công

1. Cài đặt Ollama: [https://ollama.com/download](https://ollama.com/download)

2. Tải một mô hình cục bộ nếu bạn muốn suy luận cục bộ:

```bash
ollama pull glm-4.7-flash
# hoặc
ollama pull gpt-oss:20b
# hoặc
ollama pull llama3.3
```

3. Nếu bạn muốn sử dụng mô hình đám mây, hãy đăng nhập:

```bash
ollama signin
```

4. Chạy onboarding và chọn `Ollama`:

```bash
openclaw onboard
```

- `Local`: chỉ mô hình cục bộ
- `Cloud + Local`: mô hình cục bộ cộng với mô hình đám mây
- Các mô hình đám mây như `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, và `glm-5:cloud` **không** yêu cầu `ollama pull` cục bộ

OpenClaw hiện đề xuất:

- mặc định cục bộ: `glm-4.7-flash`
- mặc định đám mây: `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`

5. Nếu bạn thích thiết lập thủ công, kích hoạt Ollama cho OpenClaw trực tiếp (bất kỳ giá trị nào cũng được; Ollama không yêu cầu khóa thực):

```bash
# Đặt biến môi trường
export OLLAMA_API_KEY="ollama-local"

# Hoặc cấu hình trong file cấu hình của bạn
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. Kiểm tra hoặc chuyển đổi mô hình:

```bash
openclaw models list
openclaw models set ollama/glm-4.7-flash
```

7. Hoặc đặt mặc định trong cấu hình:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/glm-4.7-flash" },
    },
  },
}
```

## Phát hiện mô hình (nhà cung cấp ngầm định)

Khi bạn đặt `OLLAMA_API_KEY` (hoặc hồ sơ xác thực) và **không** định nghĩa `models.providers.ollama`, OpenClaw sẽ phát hiện các mô hình từ instance Ollama cục bộ tại `http://127.0.0.1:11434`:

- Truy vấn `/api/tags`
- Sử dụng tra cứu `/api/show` tốt nhất để đọc `contextWindow` khi có sẵn
- Đánh dấu `reasoning` với một heuristic tên mô hình (`r1`, `reasoning`, `think`)
- Đặt `maxTokens` theo giới hạn token tối đa của Ollama mà OpenClaw sử dụng
- Đặt tất cả chi phí về `0`

Điều này tránh việc nhập mô hình thủ công trong khi vẫn giữ danh mục đồng bộ với instance Ollama cục bộ.

Để xem các mô hình có sẵn:

```bash
ollama list
openclaw models list
```

Để thêm một mô hình mới, chỉ cần tải nó với Ollama:

```bash
ollama pull mistral
```

Mô hình mới sẽ được tự động phát hiện và sẵn sàng sử dụng.

Nếu bạn đặt `models.providers.ollama` rõ ràng, việc tự động phát hiện sẽ bị bỏ qua và bạn phải định nghĩa mô hình thủ công (xem bên dưới).

## Cấu hình

### Thiết lập cơ bản (phát hiện ngầm định)

Cách đơn giản nhất để kích hoạt Ollama là qua biến môi trường:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Thiết lập rõ ràng (mô hình thủ công)

Sử dụng cấu hình rõ ràng khi:

- Ollama chạy trên một host/port khác.
- Bạn muốn ép buộc các cửa sổ ngữ cảnh cụ thể hoặc danh sách mô hình.
- Bạn muốn định nghĩa mô hình hoàn toàn thủ công.

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

Nếu `OLLAMA_API_KEY` được đặt, bạn có thể bỏ qua `apiKey` trong mục nhà cung cấp và OpenClaw sẽ tự động điền cho các kiểm tra khả dụng.

### URL cơ sở tùy chỉnh (cấu hình rõ ràng)

Nếu Ollama đang chạy trên một host hoặc port khác (cấu hình rõ ràng vô hiệu hóa tự động phát hiện, vì vậy hãy định nghĩa mô hình thủ công):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // Không có /v1 - sử dụng URL API gốc của Ollama
        api: "ollama", // Đặt rõ ràng để đảm bảo hành vi gọi công cụ gốc
      },
    },
  },
}
```

<Warning>
Không thêm `/v1` vào URL. Đường dẫn `/v1` sử dụng chế độ tương thích OpenAI, nơi việc gọi công cụ không đáng tin cậy. Sử dụng URL cơ sở của Ollama mà không có hậu tố đường dẫn.
</Warning>

### Lựa chọn mô hình

Khi đã cấu hình, tất cả các mô hình Ollama của bạn sẽ có sẵn:

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

## Mô hình đám mây

Mô hình đám mây cho phép bạn chạy các mô hình được lưu trữ trên đám mây (ví dụ `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`) cùng với các mô hình cục bộ của bạn.

Để sử dụng mô hình đám mây, chọn chế độ **Cloud + Local** trong quá trình thiết lập. Trình hướng dẫn sẽ kiểm tra xem bạn đã đăng nhập chưa và mở luồng đăng nhập trình duyệt khi cần. Nếu không thể xác thực, trình hướng dẫn sẽ quay lại các mặc định mô hình cục bộ.

Bạn cũng có thể đăng nhập trực tiếp tại [ollama.com/signin](https://ollama.com/signin).

## Nâng cao

### Mô hình suy luận

OpenClaw mặc định coi các mô hình có tên như `deepseek-r1`, `reasoning`, hoặc `think` là có khả năng suy luận:

```bash
ollama pull deepseek-r1:32b
```

### Chi phí mô hình

Ollama miễn phí và chạy cục bộ, vì vậy tất cả chi phí mô hình được đặt là $0.

### Cấu hình Streaming

Tích hợp Ollama của OpenClaw sử dụng **API gốc của Ollama** (`/api/chat`) theo mặc định, hỗ trợ đầy đủ streaming và gọi công cụ đồng thời. Không cần cấu hình đặc biệt.

#### Chế độ tương thích OpenAI cũ

<Warning>
**Việc gọi công cụ không đáng tin cậy trong chế độ tương thích OpenAI.** Chỉ sử dụng chế độ này nếu bạn cần định dạng OpenAI cho một proxy và không phụ thuộc vào hành vi gọi công cụ gốc.
</Warning>

Nếu bạn cần sử dụng endpoint tương thích OpenAI thay thế (ví dụ, đằng sau một proxy chỉ hỗ trợ định dạng OpenAI), đặt `api: "openai-completions"` rõ ràng:

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

Chế độ này có thể không hỗ trợ streaming + gọi công cụ đồng thời. Bạn có thể cần tắt streaming với `params: { streaming: false }` trong cấu hình mô hình.

Khi `api: "openai-completions"` được sử dụng với Ollama, OpenClaw tự động chèn `options.num_ctx` để Ollama không âm thầm quay lại cửa sổ ngữ cảnh 4096. Nếu proxy/upstream của bạn từ chối các trường `options` không xác định, hãy tắt hành vi này:

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

### Cửa sổ ngữ cảnh

Đối với các mô hình được phát hiện tự động, OpenClaw sử dụng cửa sổ ngữ cảnh được báo cáo bởi Ollama khi có sẵn, nếu không sẽ quay lại cửa sổ ngữ cảnh mặc định của Ollama mà OpenClaw sử dụng. Bạn có thể ghi đè `contextWindow` và `maxTokens` trong cấu hình nhà cung cấp rõ ràng.

## Khắc phục sự cố

### Ollama không được phát hiện

Đảm bảo rằng Ollama đang chạy và bạn đã đặt `OLLAMA_API_KEY` (hoặc hồ sơ xác thực), và bạn **không** định nghĩa một mục `models.providers.ollama` rõ ràng:

```bash
ollama serve
```

Và API có thể truy cập:

```bash
curl http://localhost:11434/api/tags
```

### Không có mô hình nào khả dụng

Nếu mô hình của bạn không được liệt kê, hãy:

- Tải mô hình cục bộ, hoặc
- Định nghĩa mô hình rõ ràng trong `models.providers.ollama`.

Để thêm mô hình:

```bash
ollama list  # Xem những gì đã cài đặt
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull llama3.3     # Hoặc một mô hình khác
```

### Kết nối bị từ chối

Kiểm tra xem Ollama có đang chạy trên cổng đúng không:

```bash
# Kiểm tra xem Ollama có đang chạy không
ps aux | grep ollama

# Hoặc khởi động lại Ollama
ollama serve
```

## Xem thêm

- [Nhà cung cấp mô hình](/concepts/model-providers) - Tổng quan về tất cả các nhà cung cấp
- [Lựa chọn mô hình](/concepts/models) - Cách chọn mô hình
- [Cấu hình](/gateway/configuration) - Tham khảo cấu hình đầy đủ
