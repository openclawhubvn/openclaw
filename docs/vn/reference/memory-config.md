---
title: "Tham khảo cấu hình bộ nhớ"
summary: "Tham khảo đầy đủ cấu hình cho tìm kiếm bộ nhớ OpenClaw, nhà cung cấp embedding, backend QMD, tìm kiếm kết hợp và bộ nhớ đa phương tiện"
read_when:
  - Bạn muốn cấu hình nhà cung cấp tìm kiếm bộ nhớ hoặc mô hình embedding
  - Bạn muốn thiết lập backend QMD
  - Bạn muốn điều chỉnh tìm kiếm kết hợp, MMR hoặc suy giảm theo thời gian
  - Bạn muốn kích hoạt lập chỉ mục bộ nhớ đa phương tiện
---

# Tham khảo cấu hình bộ nhớ

Trang này bao gồm toàn bộ cấu hình cho tìm kiếm bộ nhớ OpenClaw. Để xem tổng quan khái niệm (bố cục file, công cụ bộ nhớ, khi nào ghi bộ nhớ và tự động flush), xem [Bộ nhớ](/concepts/memory).

## Mặc định tìm kiếm bộ nhớ

- Được kích hoạt mặc định.
- Theo dõi các file bộ nhớ để phát hiện thay đổi (debounced).
- Cấu hình tìm kiếm bộ nhớ dưới `agents.defaults.memorySearch` (không phải `memorySearch` cấp cao nhất).
- Sử dụng embedding từ xa mặc định. Nếu `memorySearch.provider` không được thiết lập, OpenClaw tự động chọn:
  1. `local` nếu `memorySearch.local.modelPath` được cấu hình và file tồn tại.
  2. `openai` nếu có thể giải quyết khóa OpenAI.
  3. `gemini` nếu có thể giải quyết khóa Gemini.
  4. `voyage` nếu có thể giải quyết khóa Voyage.
  5. `mistral` nếu có thể giải quyết khóa Mistral.
  6. Nếu không, tìm kiếm bộ nhớ sẽ bị vô hiệu hóa cho đến khi được cấu hình.
- Chế độ local sử dụng node-llama-cpp và có thể yêu cầu `pnpm approve-builds`.
- Sử dụng sqlite-vec (khi có sẵn) để tăng tốc tìm kiếm vector trong SQLite.
- `memorySearch.provider = "ollama"` cũng được hỗ trợ cho embedding Ollama local/self-hosted (`/api/embeddings`), nhưng không được tự động chọn.

Embedding từ xa **yêu cầu** một API key cho nhà cung cấp embedding. OpenClaw giải quyết các khóa từ hồ sơ xác thực, `models.providers.*.apiKey`, hoặc biến môi trường. Codex OAuth chỉ bao gồm chat/completions và **không** đáp ứng embedding cho tìm kiếm bộ nhớ. Đối với Gemini, sử dụng `GEMINI_API_KEY` hoặc `models.providers.google.apiKey`. Đối với Voyage, sử dụng `VOYAGE_API_KEY` hoặc `models.providers.voyage.apiKey`. Đối với Mistral, sử dụng `MISTRAL_API_KEY` hoặc `models.providers.mistral.apiKey`. Ollama thường không yêu cầu một API key thực (một placeholder như `OLLAMA_API_KEY=ollama-local` là đủ khi cần theo chính sách local).
Khi sử dụng một endpoint tương thích OpenAI tùy chỉnh, thiết lập `memorySearch.remote.apiKey` (và tùy chọn `memorySearch.remote.headers`).

## Backend QMD (thử nghiệm)

Thiết lập `memory.backend = "qmd"` để thay thế indexer SQLite tích hợp bằng [QMD](https://github.com/tobi/qmd): một sidecar tìm kiếm ưu tiên local kết hợp BM25 + vectors + reranking. Markdown vẫn là nguồn thông tin chính; OpenClaw sử dụng QMD để truy xuất. Các điểm chính:

### Yêu cầu

- Vô hiệu hóa mặc định. Chọn tham gia theo cấu hình (`memory.backend = "qmd"`).
- Cài đặt CLI QMD riêng (`bun install -g https://github.com/tobi/qmd` hoặc tải bản phát hành) và đảm bảo binary `qmd` có trong `PATH` của gateway.
- QMD cần một bản dựng SQLite cho phép mở rộng (`brew install sqlite` trên macOS).
- QMD chạy hoàn toàn local qua Bun + `node-llama-cpp` và tự động tải xuống các mô hình GGUF từ HuggingFace khi sử dụng lần đầu (không cần daemon Ollama riêng).
- Gateway chạy QMD trong một XDG home tự chứa dưới `~/.openclaw/agents/<agentId>/qmd/` bằng cách thiết lập `XDG_CONFIG_HOME` và `XDG_CACHE_HOME`.
- Hỗ trợ hệ điều hành: macOS và Linux hoạt động ngay khi Bun + SQLite được cài đặt. Windows được hỗ trợ tốt nhất qua WSL2.

### Cách sidecar hoạt động

- Gateway ghi một QMD home tự chứa dưới `~/.openclaw/agents/<agentId>/qmd/` (cấu hình + cache + sqlite DB).
- Các bộ sưu tập được tạo qua `qmd collection add` từ `memory.qmd.paths` (cộng với các file bộ nhớ workspace mặc định), sau đó `qmd update` + `qmd embed` chạy khi khởi động và theo một khoảng thời gian có thể cấu hình (`memory.qmd.update.interval`, mặc định 5 phút).
- Gateway hiện khởi tạo trình quản lý QMD khi khởi động, vì vậy các bộ đếm thời gian cập nhật định kỳ được kích hoạt ngay cả trước khi gọi `memory_search` đầu tiên.
- Làm mới khi khởi động hiện chạy nền mặc định để khởi động chat không bị chặn; thiết lập `memory.qmd.update.waitForBootSync = true` để giữ hành vi chặn trước đó.
- Tìm kiếm chạy qua `memory.qmd.searchMode` (mặc định `qmd search --json`; cũng hỗ trợ `vsearch` và `query`). Nếu chế độ đã chọn từ chối cờ trên bản dựng QMD của bạn, OpenClaw thử lại với `qmd query`. Nếu QMD thất bại hoặc binary bị thiếu, OpenClaw tự động quay lại trình quản lý SQLite tích hợp để các công cụ bộ nhớ tiếp tục hoạt động.
- OpenClaw không tiết lộ điều chỉnh kích thước batch QMD embed hôm nay; hành vi batch được kiểm soát bởi chính QMD.
- **Tìm kiếm đầu tiên có thể chậm**: QMD có thể tải xuống các mô hình GGUF local (reranker/query expansion) khi chạy `qmd query` lần đầu tiên.
  - OpenClaw thiết lập `XDG_CONFIG_HOME`/`XDG_CACHE_HOME` tự động khi chạy QMD.
  - Nếu bạn muốn tải xuống các mô hình thủ công trước (và làm nóng cùng một index OpenClaw sử dụng), chạy một truy vấn một lần với các thư mục XDG của agent.

    Trạng thái QMD của OpenClaw nằm dưới **thư mục trạng thái** của bạn (mặc định là `~/.openclaw`).
    Bạn có thể chỉ định `qmd` vào cùng một index bằng cách xuất các biến XDG giống như OpenClaw sử dụng:

    ```bash
    # Chọn cùng thư mục trạng thái mà OpenClaw sử dụng
    STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"

    export XDG_CONFIG_HOME="$STATE_DIR/agents/main/qmd/xdg-config"
    export XDG_CACHE_HOME="$STATE_DIR/agents/main/qmd/xdg-cache"

    # (Tùy chọn) buộc làm mới index + embeddings
    qmd update
    qmd embed

    # Làm nóng / kích hoạt tải xuống mô hình lần đầu
    qmd query "test" -c memory-root --json >/dev/null 2>&1
    ```

### Bề mặt cấu hình (`memory.qmd.*`)

- `command` (mặc định `qmd`): ghi đè đường dẫn thực thi.
- `searchMode` (mặc định `search`): chọn lệnh QMD nào hỗ trợ `memory_search` (`search`, `vsearch`, `query`).
- `includeDefaultMemory` (mặc định `true`): tự động lập chỉ mục `MEMORY.md` + `memory/**/*.md`.
- `paths[]`: thêm thư mục/file bổ sung (`path`, `pattern` tùy chọn, `name` ổn định tùy chọn).
- `sessions`: chọn tham gia lập chỉ mục JSONL phiên (`enabled`, `retentionDays`, `exportDir`).
- `update`: kiểm soát tần suất làm mới và thực thi bảo trì: (`interval`, `debounceMs`, `onBoot`, `waitForBootSync`, `embedInterval`, `commandTimeoutMs`, `updateTimeoutMs`, `embedTimeoutMs`).
- `limits`: giới hạn tải trọng recall (`maxResults`, `maxSnippetChars`, `maxInjectedChars`, `timeoutMs`).
- `scope`: cùng schema như [`session.sendPolicy`](/gateway/configuration-reference#session).
  Mặc định là chỉ DM (`deny` tất cả, `allow` chat trực tiếp); nới lỏng để hiển thị kết quả QMD trong nhóm/kênh.
  - `match.keyPrefix` khớp với khóa phiên **đã chuẩn hóa** (viết thường, loại bỏ bất kỳ `agent:<id>:` nào ở đầu). Ví dụ: `discord:channel:`.
  - `match.rawKeyPrefix` khớp với khóa phiên **thô** (viết thường), bao gồm `agent:<id>:`. Ví dụ: `agent:main:discord:`.
  - Legacy: `match.keyPrefix: "agent:..."` vẫn được coi là một tiền tố khóa thô, nhưng nên sử dụng `rawKeyPrefix` để rõ ràng.
- Khi `scope` từ chối một tìm kiếm, OpenClaw ghi lại cảnh báo với `channel`/`chatType` đã được suy ra để dễ dàng gỡ lỗi kết quả trống.
- Các đoạn trích nguồn từ bên ngoài workspace xuất hiện dưới dạng `qmd/<collection>/<relative-path>` trong kết quả `memory_search`; `memory_get` hiểu tiền tố đó và đọc từ gốc bộ sưu tập QMD đã cấu hình.
- Khi `memory.qmd.sessions.enabled = true`, OpenClaw xuất các bản ghi phiên đã được làm sạch (User/Assistant turns) vào một bộ sưu tập QMD chuyên dụng dưới `~/.openclaw/agents/<id>/qmd/sessions/`, vì vậy `memory_search` có thể nhớ lại các cuộc trò chuyện gần đây mà không cần chạm vào index SQLite tích hợp.
- Các đoạn trích `memory_search` hiện bao gồm một footer `Source: <path#line>` khi `memory.citations` là `auto`/`on`; thiết lập `memory.citations = "off"` để giữ thông tin metadata nội bộ (agent vẫn nhận được đường dẫn cho `memory_get`, nhưng văn bản đoạn trích bỏ qua footer và hệ thống nhắc nhở agent không trích dẫn nó).

### Ví dụ QMD

```json5
memory: {
  backend: "qmd",
  citations: "auto",
  qmd: {
    includeDefaultMemory: true,
    update: { interval: "5m", debounceMs: 15000 },
    limits: { maxResults: 6, timeoutMs: 4000 },
    scope: {
      default: "deny",
      rules: [
        { action: "allow", match: { chatType: "direct" } },
        // Tiền tố khóa phiên đã chuẩn hóa (loại bỏ `agent:<id>:`).
        { action: "deny", match: { keyPrefix: "discord:channel:" } },
        // Tiền tố khóa phiên thô (bao gồm `agent:<id>:`).
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ]
    },
    paths: [
      { name: "docs", path: "~/notes", pattern: "**/*.md" }
    ]
  }
}
```

### Trích dẫn và dự phòng

- `memory.citations` áp dụng bất kể backend (`auto`/`on`/`off`).
- Khi `qmd` chạy, chúng tôi gắn thẻ `status().backend = "qmd"` để chẩn đoán hiển thị động cơ nào đã phục vụ kết quả. Nếu quy trình con QMD thoát hoặc đầu ra JSON không thể phân tích, trình quản lý tìm kiếm ghi lại cảnh báo và trả về nhà cung cấp tích hợp (embedding Markdown hiện có) cho đến khi QMD phục hồi.

## Đường dẫn bộ nhớ bổ sung

Nếu bạn muốn lập chỉ mục các file Markdown ngoài bố cục workspace mặc định, thêm các đường dẫn rõ ràng:

```json5
agents: {
  defaults: {
    memorySearch: {
      extraPaths: ["../team-docs", "/srv/shared-notes/overview.md"]
    }
  }
}
```

Lưu ý:

- Đường dẫn có thể là tuyệt đối hoặc tương đối với workspace.
- Thư mục được quét đệ quy cho các file `.md`.
- Mặc định, chỉ các file Markdown được lập chỉ mục.
- Nếu `memorySearch.multimodal.enabled = true`, OpenClaw cũng lập chỉ mục các file hình ảnh/âm thanh được hỗ trợ chỉ dưới `extraPaths`. Các gốc bộ nhớ mặc định (`MEMORY.md`, `memory.md`, `memory/**/*.md`) vẫn chỉ là Markdown.
- Symlinks bị bỏ qua (file hoặc thư mục).

## File bộ nhớ đa phương tiện (hình ảnh + âm thanh Gemini)

OpenClaw có thể lập chỉ mục các file hình ảnh và âm thanh từ `memorySearch.extraPaths` khi sử dụng embedding Gemini 2:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-2-preview",
      extraPaths: ["assets/reference", "voice-notes"],
      multimodal: {
        enabled: true,
        modalities: ["image", "audio"], // hoặc ["all"]
        maxFileBytes: 10000000
      },
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

Lưu ý:

- Bộ nhớ đa phương tiện hiện chỉ được hỗ trợ cho `gemini-embedding-2-preview`.
- Lập chỉ mục đa phương tiện chỉ áp dụng cho các file được phát hiện qua `memorySearch.extraPaths`.
- Các loại hình thức được hỗ trợ trong giai đoạn này: hình ảnh và âm thanh.
- `memorySearch.fallback` phải giữ là `"none"` trong khi bộ nhớ đa phương tiện được kích hoạt.
- Các byte file hình ảnh/âm thanh phù hợp được tải lên endpoint embedding Gemini đã cấu hình trong quá trình lập chỉ mục.
- Các phần mở rộng hình ảnh được hỗ trợ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`.
- Các phần mở rộng âm thanh được hỗ trợ: `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac`.
- Các truy vấn tìm kiếm vẫn là văn bản, nhưng Gemini có thể so sánh các truy vấn văn bản đó với các embedding hình ảnh/âm thanh đã lập chỉ mục.
- `memory_get` vẫn chỉ đọc Markdown; các file nhị phân có thể tìm kiếm nhưng không được trả về dưới dạng nội dung file thô.

## Embedding Gemini (native)

Thiết lập nhà cung cấp thành `gemini` để sử dụng API embedding Gemini trực tiếp:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-001",
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

Lưu ý:

- `remote.baseUrl` là tùy chọn (mặc định là URL cơ sở API Gemini).
- `remote.headers` cho phép bạn thêm các header bổ sung nếu cần.
- Mô hình mặc định: `gemini-embedding-001`.
- `gemini-embedding-2-preview` cũng được hỗ trợ: giới hạn 8192 token và các kích thước có thể cấu hình (768 / 1536 / 3072, mặc định 3072).

### Embedding Gemini 2 (preview)

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-2-preview",
      outputDimensionality: 3072,  // tùy chọn: 768, 1536, hoặc 3072 (mặc định)
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

> **Yêu cầu lập chỉ mục lại:** Chuyển từ `gemini-embedding-001` (768 dimensions)
> sang `gemini-embedding-2-preview` (3072 dimensions) thay đổi kích thước vector. Điều tương tự cũng xảy ra nếu bạn
> thay đổi `outputDimensionality` giữa 768, 1536 và 3072.
> OpenClaw sẽ tự động lập chỉ mục lại khi phát hiện thay đổi mô hình hoặc kích thước.

## Endpoint tương thích OpenAI tùy chỉnh

Nếu bạn muốn sử dụng một endpoint tương thích OpenAI tùy chỉnh (OpenRouter, vLLM, hoặc proxy),
bạn có thể sử dụng cấu hình `remote` với nhà cung cấp OpenAI:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_OPENAI_COMPAT_API_KEY",
        headers: { "X-Custom-Header": "value" }
      }
    }
  }
}
```

Nếu bạn không muốn thiết lập một API key, sử dụng `memorySearch.provider = "local"` hoặc thiết lập
`memorySearch.fallback = "none"`.

### Dự phòng

- `memorySearch.fallback` có thể là `openai`, `gemini`, `voyage`, `mistral`, `ollama`, `local`, hoặc `none`.
- Nhà cung cấp dự phòng chỉ được sử dụng khi nhà cung cấp embedding chính thất bại.

### Lập chỉ mục batch (OpenAI + Gemini + Voyage)

- Vô hiệu hóa mặc định. Thiết lập `agents.defaults.memorySearch.remote.batch.enabled = true` để kích hoạt cho lập chỉ mục corpus lớn (OpenAI, Gemini, và Voyage).
- Hành vi mặc định chờ hoàn thành batch; điều chỉnh `remote.batch.wait`, `remote.batch.pollIntervalMs`, và `remote.batch.timeoutMinutes` nếu cần.
- Thiết lập `remote.batch.concurrency` để kiểm soát số lượng công việc batch chúng tôi gửi song song (mặc định: 2).
- Chế độ batch áp dụng khi `memorySearch.provider = "openai"` hoặc `"gemini"` và sử dụng API key tương ứng.
- Công việc batch Gemini sử dụng endpoint batch embedding không đồng bộ và yêu cầu khả dụng API Batch Gemini.

Tại sao batch OpenAI nhanh và rẻ:

- Đối với các backfill lớn, OpenAI thường là tùy chọn nhanh nhất chúng tôi hỗ trợ vì chúng tôi có thể gửi nhiều yêu cầu embedding trong một công việc batch duy nhất và để OpenAI xử lý chúng không đồng bộ.
- OpenAI cung cấp giá ưu đãi cho các công việc API Batch, vì vậy các lần chạy lập chỉ mục lớn thường rẻ hơn so với gửi cùng các yêu cầu đó đồng bộ.
- Xem tài liệu API Batch OpenAI và giá cả để biết chi tiết:
  - [https://platform.openai.com/docs/api-reference/batch](https://platform.openai.com/docs/api-reference/batch)
  - [https://platform.openai.com/pricing](https://platform.openai.com/pricing)

Ví dụ cấu hình:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      fallback: "openai",
      remote: {
        batch: { enabled: true, concurrency: 2 }
      },
      sync: { watch: true }
    }
  }
}
```

## Cách các công cụ bộ nhớ hoạt động

- `memory_search` tìm kiếm ngữ nghĩa các đoạn Markdown (~400 token mục tiêu, 80-token chồng chéo) từ `MEMORY.md` + `memory/**/*.md`. Nó trả về văn bản đoạn trích (giới hạn ~700 ký tự), đường dẫn file, phạm vi dòng, điểm số, nhà cung cấp/mô hình, và liệu chúng tôi có dự phòng từ embedding local sang từ xa hay không. Không có tải trọng file đầy đủ nào được trả về.
- `memory_get` đọc một file Markdown bộ nhớ cụ thể (tương đối với workspace), tùy chọn từ một dòng bắt đầu và trong N dòng. Các đường dẫn ngoài `MEMORY.md` / `memory/` bị từ chối.
- Cả hai công cụ chỉ được kích hoạt khi `memorySearch.enabled` giải quyết đúng cho agent.

## Những gì được lập chỉ mục (và khi nào)

- Loại file: Chỉ Markdown (`MEMORY.md`, `memory/**/*.md`).
- Lưu trữ chỉ mục: SQLite per-agent tại `~/.openclaw/memory/<agentId>.sqlite` (có thể cấu hình qua `agents.defaults.memorySearch.store.path`, hỗ trợ token `{agentId}`).
- Tính mới: watcher trên `MEMORY.md` + `memory/` đánh dấu chỉ mục là bẩn (debounce 1.5s). Đồng bộ được lên lịch khi bắt đầu phiên, khi tìm kiếm, hoặc theo khoảng thời gian và chạy không đồng bộ. Bản ghi phiên sử dụng ngưỡng delta để kích hoạt đồng bộ nền.
- Kích hoạt lập chỉ mục lại: chỉ mục lưu trữ embedding **provider/model + endpoint fingerprint + chunking params**. Nếu bất kỳ điều nào trong số đó thay đổi, OpenClaw tự động đặt lại và lập chỉ mục lại toàn bộ cửa hàng.

## Tìm kiếm kết hợp (BM25 + vector)

Khi được kích hoạt, OpenClaw kết hợp:

- **Vector similarity** (khớp ngữ nghĩa, cách diễn đạt có thể khác)
- **BM25 keyword relevance** (các token chính xác như ID, biến môi trường, ký hiệu mã)

Nếu tìm kiếm toàn văn không khả dụng trên nền tảng của bạn, OpenClaw quay lại tìm kiếm chỉ vector.

### Tại sao kết hợp

Tìm kiếm vector rất tốt cho "điều này có nghĩa là cùng một điều":

- "Máy chủ gateway Mac Studio" so với "máy chạy gateway"
- "debounce cập nhật file" so với "tránh lập chỉ mục trên mỗi lần ghi"

Nhưng nó có thể yếu với các token chính xác, tín hiệu cao:

- ID (`a828e60`, `b3b9895a...`)
- ký hiệu mã (`memorySearch.query.hybrid`)
- chuỗi lỗi ("sqlite-vec không khả dụng")

BM25 (toàn văn) thì ngược lại: mạnh với các token chính xác, yếu hơn với các diễn đạt lại.
Tìm kiếm kết hợp là giải pháp trung gian thực dụng: **sử dụng cả hai tín hiệu truy xuất** để bạn có
kết quả tốt cho cả truy vấn "ngôn ngữ tự nhiên" và truy vấn "kim trong đống rơm".

### Cách chúng tôi hợp nhất kết quả (thiết kế hiện tại)

Phác thảo triển khai:

1. Truy xuất một pool ứng viên từ cả hai bên:

- **Vector**: top `maxResults * candidateMultiplier` theo cosine similarity.
- **BM25**: top `maxResults * candidateMultiplier` theo xếp hạng BM25 FTS5 (thấp hơn là tốt hơn).

2. Chuyển đổi xếp hạng BM25 thành điểm 0..1-ish:

- `textScore = 1 / (1 + max(0, bm25Rank))`

3. Hợp nhất ứng viên theo id chunk và tính toán điểm có trọng số:

- `finalScore = vectorWeight * vectorScore + textWeight * textScore`

Lưu ý:

- `vectorWeight` + `textWeight` được chuẩn hóa thành 1.0 trong giải quyết cấu hình, vì vậy trọng số hoạt động như phần trăm.
- Nếu embedding không khả dụng (hoặc nhà cung cấp trả về một vector không), chúng tôi vẫn chạy BM25 và trả về các khớp từ khóa.
- Nếu FTS5 không thể được tạo, chúng tôi giữ tìm kiếm chỉ vector (không có lỗi nghiêm trọng).

Điều này không phải là "hoàn hảo theo lý thuyết IR", nhưng nó đơn giản, nhanh chóng và có xu hướng cải thiện recall/precision trên các ghi chú thực tế.
Nếu chúng tôi muốn làm phức tạp hơn sau này, các bước tiếp theo phổ biến là Hợp nhất Xếp hạng Tương hỗ (RRF) hoặc chuẩn hóa điểm
(min/max hoặc z-score) trước khi trộn.

### Quy trình xử lý hậu kỳ

Sau khi hợp nhất điểm vector và từ khóa, hai giai đoạn xử lý hậu kỳ tùy chọn
tinh chỉnh danh sách kết quả trước khi nó đến agent:

```
Vector + Keyword -> Weighted Merge -> Temporal Decay -> Sort -> MMR -> Top-K Results
```

Cả hai giai đoạn đều **tắt mặc định** và có thể được kích hoạt độc lập.

### MMR re-ranking (đa dạng)

Khi tìm kiếm kết hợp trả về kết quả, nhiều đoạn có thể chứa nội dung tương tự hoặc chồng chéo.
Ví dụ, tìm kiếm "cài đặt mạng gia đình" có thể trả về năm đoạn gần như giống nhau
từ các ghi chú hàng ngày khác nhau đều đề cập đến cùng một cấu hình router.

**MMR (Maximal Marginal Relevance)** sắp xếp lại kết quả để cân bằng sự liên quan với đa dạng,
đảm bảo các kết quả hàng đầu bao gồm các khía cạnh khác nhau của truy vấn thay vì lặp lại cùng một thông tin.

Cách hoạt động:

1. Kết quả được chấm điểm theo sự liên quan ban đầu của chúng (điểm có trọng số vector + BM25).
2. MMR chọn lặp lại các kết quả tối đa hóa: `lambda x relevance - (1-lambda) x max_similarity_to_selected`.
3. Sự tương đồng giữa các kết quả được đo bằng sự tương đồng văn bản Jaccard trên nội dung đã được token hóa.

Tham số `lambda` kiểm soát sự đánh đổi:

- `lambda = 1.0` -- chỉ sự liên quan (không có hình phạt đa dạng)
- `lambda = 0.0` -- đa dạng tối đa (bỏ qua sự liên quan)
- Mặc định: `0.7` (cân bằng, hơi thiên về sự liên quan)

**Ví dụ -- truy vấn: "cài đặt mạng gia đình"**

Với các file bộ nhớ này:

```
memory/2026-02-10.md  -> "Đã cấu hình router Omada, đặt VLAN 10 cho thiết bị IoT"
memory/2026-02-08.md  -> "Đã cấu hình router Omada, chuyển IoT sang VLAN 10"
memory/2026-02-05.md  -> "Đã thiết lập DNS AdGuard trên 192.168.10.2"
memory/network.md     -> "Router: Omada ER605, AdGuard: 192.168.10.2, VLAN 10: IoT"
```

Không có MMR -- top 3 kết quả:

```
1. memory/2026-02-10.md  (điểm: 0.92)  <- router + VLAN
2. memory/2026-02-08.md  (điểm: 0.89)  <- router + VLAN (gần như trùng lặp!)
3. memory/network.md     (điểm: 0.85)  <- tài liệu tham khảo
```

Với MMR (lambda=0.7) -- top 3 kết quả:

```
1. memory/2026-02-10.md  (điểm: 0.92)  <- router + VLAN
2. memory/network.md     (điểm: 0.85)  <- tài liệu tham khảo (đa dạng!)
3. memory/2026-02-05.md  (điểm: 0.78)  <- DNS AdGuard (đa dạng!)
```

Gần như trùng lặp từ ngày 8 tháng 2 bị loại bỏ, và agent nhận được ba mảnh thông tin khác nhau.

**Khi nào kích hoạt:** Nếu bạn nhận thấy `memory_search` trả về các đoạn trùng lặp hoặc gần như trùng lặp,
đặc biệt với các ghi chú hàng ngày thường lặp lại thông tin tương tự qua các ngày.

### Suy giảm theo thời gian (tăng cường gần đây)

Các agent với ghi chú hàng ngày tích lũy hàng trăm file có ngày theo thời gian. Không có suy giảm,
một ghi chú được viết tốt từ sáu tháng trước có thể vượt qua bản cập nhật hôm qua về cùng một chủ đề.

**Suy giảm theo thời gian** áp dụng một hệ số nhân theo cấp số nhân cho điểm dựa trên tuổi của mỗi kết quả,
vì vậy các ký ức gần đây tự nhiên xếp hạng cao hơn trong khi các ký ức cũ mờ dần:

```
decayedScore = score x e^(-lambda x ageInDays)
```

trong đó `lambda = ln(2) / halfLifeDays`.

Với thời gian bán rã mặc định là 30 ngày:

- Ghi chú hôm nay: **100%** điểm gốc
- 7 ngày trước: **~84%**
- 30 ngày trước: **50%**
- 90 ngày trước: **12.5%**
- 180 ngày trước: **~1.6%**

**Các file luôn xanh không bao giờ bị suy giảm:**

- `MEMORY.md` (file bộ nhớ gốc)
- Các file không có ngày trong `memory/` (ví dụ: `memory/projects.md`, `memory/network.md`)
- Chúng chứa thông tin tham khảo bền vững nên luôn xếp hạng bình thường.

**Các file hàng ngày có ngày** (`memory/YYYY-MM-DD.md`) sử dụng ngày được trích xuất từ tên file.
Các nguồn khác (ví dụ: bản ghi phiên) quay lại thời gian sửa đổi file (`mtime`).

**Ví dụ -- truy vấn: "lịch làm việc của Rod là gì?"**

Với các file bộ nhớ này (hôm nay là ngày 10 tháng 2):

```
memory/2025-09-15.md  -> "Rod làm việc từ thứ Hai đến thứ Sáu, họp đứng lúc 10 giờ sáng, ghép đôi lúc 2 giờ chiều"  (148 ngày tuổi)
memory/2026-02-10.md  -> "Rod có họp đứng lúc 14:15, 1:1 với Zeb lúc 14:45"    (hôm nay)
memory/2026-02-03.md  -> "Rod bắt đầu nhóm mới, họp đứng chuyển sang 14:15"        (7 ngày tuổi)
```

Không có suy giảm:

```
1. memory/2025-09-15.md  (điểm: 0.91)  <- khớp ngữ nghĩa tốt nhất, nhưng cũ!
2. memory/2026-02-10.md  (điểm: 0.82)
3. memory/2026-02-03.md  (điểm: 0.80)
```

Với suy giảm (halfLife=30):

```
1. memory/2026-02-10.md  (điểm: 0.82 x 1.00 = 0.82)  <- hôm nay, không suy giảm
2. memory/2026-02-03.md  (điểm: 0.80 x 0.85 = 0.68)  <- 7 ngày, suy giảm nhẹ
3. memory/2025-09-15.md  (điểm: 0.91 x 0.03 = 0.03)  <- 148 ngày, gần như biến mất
```

Ghi chú cũ từ tháng 9 rơi xuống cuối mặc dù có khớp ngữ nghĩa tốt nhất.

**Khi nào kích hoạt:** Nếu agent của bạn có hàng tháng ghi chú hàng ngày và bạn thấy rằng thông tin cũ,
cũ kỹ vượt qua ngữ cảnh gần đây. Thời gian bán rã 30 ngày hoạt động tốt cho các quy trình công việc nặng ghi chú hàng ngày; tăng nó (ví dụ: 90 ngày) nếu bạn thường xuyên tham khảo các ghi chú cũ hơn.

### Cấu hình tìm kiếm kết hợp

Cả hai tính năng được cấu hình dưới `memorySearch.query.hybrid`:

```json5
agents: {
  defaults: {
    memorySearch: {
      query: {
        hybrid: {
          enabled: true,
          vectorWeight: 0.7,
          textWeight: 0.3,
          candidateMultiplier: 4,
          // Đa dạng: giảm kết quả trùng lặp
          mmr: {
            enabled: true,    // mặc định: false
            lambda: 0.7       // 0 = đa dạng tối đa, 1 = liên quan tối đa
          },
          // Gần đây: tăng cường ký ức mới hơn
          temporalDecay: {
            enabled: true,    // mặc định: false
            halfLifeDays: 30  // điểm giảm một nửa mỗi 30 ngày
          }
        }
      }
    }
  }
}
```

Bạn có thể kích hoạt từng tính năng độc lập:

- **Chỉ MMR** -- hữu ích khi bạn có nhiều ghi chú tương tự nhưng tuổi không quan trọng.
- **Chỉ suy giảm theo thời gian** -- hữu ích khi gần đây quan trọng nhưng kết quả của bạn đã đa dạng.
- **Cả hai** -- được khuyến nghị cho các agent có lịch sử ghi chú hàng ngày lớn, lâu dài.

## Bộ nhớ đệm embedding

OpenClaw có thể lưu trữ **chunk embeddings** trong SQLite để việc lập chỉ mục lại và cập nhật thường xuyên (đặc biệt là bản ghi phiên) không cần phải re-embed văn bản không thay đổi.

Cấu hình:

```json5
agents: {
  defaults: {
    memorySearch: {
      cache: {
        enabled: true,
        maxEntries: 50000
      }
    }
  }
}
```

## Tìm kiếm bộ nhớ phiên (thử nghiệm)

Bạn có thể tùy chọn lập chỉ mục **bản ghi phiên** và hiển thị chúng qua `memory_search`.
Điều này được kiểm soát bởi một cờ thử nghiệm.

```json5
agents: {
  defaults: {
    memorySearch: {
      experimental: { sessionMemory: true },
      sources: ["memory", "sessions"]
    }
  }
}
```

Lưu ý:

- Lập chỉ mục phiên là **tùy chọn** (tắt mặc định).
- Cập nhật phiên được debounce và **lập chỉ mục không đồng bộ** khi chúng vượt qua ngưỡng delta (nỗ lực tốt nhất).
- `memory_search` không bao giờ chặn lập chỉ mục; kết quả có thể hơi cũ cho đến khi đồng bộ nền hoàn thành.
- Kết quả vẫn chỉ bao gồm các đoạn trích; `memory_get` vẫn giới hạn ở các file bộ nhớ.
- Lập chỉ mục phiên được cách ly theo agent (chỉ các bản ghi phiên của agent đó được lập chỉ mục).
- Bản ghi phiên sống trên đĩa (`~/.openclaw/agents/<agentId>/sessions/*.jsonl`). Bất kỳ quy trình/người dùng nào có quyền truy cập hệ thống file đều có thể đọc chúng, vì vậy hãy coi quyền truy cập đĩa là ranh giới tin cậy. Để cách ly nghiêm ngặt hơn, chạy các agent dưới các người dùng hoặc máy chủ OS riêng biệt.

Ngưỡng delta (mặc định được hiển thị):

```json5
agents: {
  defaults: {
    memorySearch: {
      sync: {
        sessions: {
          deltaBytes: 100000,   // ~100 KB
          deltaMessages: 50     // dòng JSONL
        }
      }
    }
  }
}
```

## Tăng tốc vector SQLite (sqlite-vec)

Khi phần mở rộng sqlite-vec có sẵn, OpenClaw lưu trữ embedding trong một
bảng ảo SQLite (`vec0`) và thực hiện các truy vấn khoảng cách vector trong
cơ sở dữ liệu. Điều này giữ cho tìm kiếm nhanh mà không cần tải mọi embedding vào JS.

Cấu hình (tùy chọn):

```json5
agents: {
  defaults: {
    memorySearch: {
      store: {
        vector: {
          enabled: true,
          extensionPath: "/path/to/sqlite-vec"
        }
      }
    }
  }
}
```

Lưu ý:

- `enabled` mặc định là true; khi bị vô hiệu hóa, tìm kiếm quay lại với cosine similarity trong quá trình xử lý
  trên các embedding đã lưu trữ.
- Nếu phần mở rộng sqlite-vec bị thiếu hoặc không tải được, OpenClaw ghi lại lỗi
  và tiếp tục với phương án dự phòng JS (không có bảng vector).
- `extensionPath` ghi đè đường dẫn sqlite-vec đi kèm (hữu ích cho các bản dựng tùy chỉnh
  hoặc vị trí cài đặt không chuẩn).

## Tự động tải xuống embedding local

- Mô hình embedding local mặc định: `hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB).
- Khi `memorySearch.provider = "local"`, `node-llama-cpp` giải quyết `modelPath`; nếu GGUF bị thiếu, nó **tự động tải xuống** vào cache (hoặc `local.modelCacheDir` nếu được thiết lập), sau đó tải nó. Tải xuống tiếp tục khi thử lại.
- Yêu cầu xây dựng native: chạy `pnpm approve-builds`, chọn `node-llama-cpp`, sau đó `pnpm rebuild node-llama-cpp`.
- Dự phòng: nếu thiết lập local thất bại và `memorySearch.fallback = "openai"`, chúng tôi tự động chuyển sang embedding từ xa (`openai/text-embedding-3-small` trừ khi được ghi đè) và ghi lại lý do.

## Ví dụ endpoint tương thích OpenAI tùy chỉnh

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_REMOTE_API_KEY",
        headers: {
          "X-Organization": "org-id",
          "X-Project": "project-id"
        }
      }
    }
  }
}
```

Lưu ý:

- `remote.*` có ưu tiên hơn `models.providers.openai.*`.
- `remote.headers` hợp nhất với các header OpenAI; remote thắng trong các xung đột khóa. Bỏ qua `remote.headers` để sử dụng mặc định của OpenAI.
