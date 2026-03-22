---
title: "Tham khảo cấu hình bộ nhớ"
summary: "Tham khảo cấu hình đầy đủ cho tìm kiếm bộ nhớ OpenClaw, nhà cung cấp embedding, backend QMD, tìm kiếm hybrid, và bộ nhớ đa phương tiện"
read_when:
  - Cần cấu hình nhà cung cấp tìm kiếm bộ nhớ hoặc mô hình embedding
  - Muốn thiết lập backend QMD
  - Muốn tinh chỉnh tìm kiếm hybrid, MMR, hoặc giảm dần theo thời gian
  - Muốn kích hoạt lập chỉ mục bộ nhớ đa phương tiện
---

# Tham khảo cấu hình bộ nhớ

Trang này bao gồm cấu hình đầy đủ cho tìm kiếm bộ nhớ OpenClaw. Để xem tổng quan khái niệm (bố cục file, công cụ bộ nhớ, khi nào ghi bộ nhớ, và tự động flush), xem [Memory](/concepts/memory).

## Mặc định tìm kiếm bộ nhớ

- Bật mặc định.
- Theo dõi thay đổi file bộ nhớ (debounced).
- Cấu hình tìm kiếm bộ nhớ dưới `agents.defaults.memorySearch` (không phải `memorySearch` cấp cao nhất).
- Mặc định dùng remote embeddings. Nếu `memorySearch.provider` không được thiết lập, OpenClaw tự động chọn:
  1. `local` nếu `memorySearch.local.modelPath` được cấu hình và file tồn tại.
  2. `openai` nếu có thể giải quyết key OpenAI.
  3. `gemini` nếu có thể giải quyết key Gemini.
  4. `voyage` nếu có thể giải quyết key Voyage.
  5. `mistral` nếu có thể giải quyết key Mistral.
  6. Nếu không, tìm kiếm bộ nhớ sẽ bị vô hiệu hóa cho đến khi được cấu hình.
- Chế độ local dùng node-llama-cpp và có thể cần `pnpm approve-builds`.
- Dùng sqlite-vec (khi có) để tăng tốc tìm kiếm vector trong SQLite.
- `memorySearch.provider = "ollama"` cũng được hỗ trợ cho embedding Ollama local/tự host (`/api/embeddings`), nhưng không tự động chọn.

Remote embeddings **yêu cầu** API key cho nhà cung cấp embedding. OpenClaw giải quyết key từ auth profiles, `models.providers.*.apiKey`, hoặc biến môi trường. Codex OAuth chỉ bao phủ chat/completions và **không** thỏa mãn embeddings cho tìm kiếm bộ nhớ. Đối với Gemini, dùng `GEMINI_API_KEY` hoặc `models.providers.google.apiKey`. Đối với Voyage, dùng `VOYAGE_API_KEY` hoặc `models.providers.voyage.apiKey`. Đối với Mistral, dùng `MISTRAL_API_KEY` hoặc `models.providers.mistral.apiKey`. Ollama thường không yêu cầu API key thực (một placeholder như `OLLAMA_API_KEY=ollama-local` là đủ khi cần theo chính sách local).
Khi dùng endpoint tương thích OpenAI tùy chỉnh, thiết lập `memorySearch.remote.apiKey` (và tùy chọn `memorySearch.remote.headers`).

## Backend QMD (thử nghiệm)

Thiết lập `memory.backend = "qmd"` để thay thế indexer SQLite tích hợp bằng [QMD](https://github.com/tobi/qmd): một sidecar tìm kiếm ưu tiên local kết hợp BM25 + vectors + reranking. Markdown vẫn là nguồn sự thật; OpenClaw gọi QMD để truy xuất. Điểm chính:

### Yêu cầu

- Vô hiệu hóa mặc định. Opt in theo cấu hình (`memory.backend = "qmd"`).
- Cài đặt CLI QMD riêng (`bun install -g https://github.com/tobi/qmd` hoặc lấy bản phát hành) và đảm bảo binary `qmd` có trên `PATH` của gateway.
- QMD cần một bản build SQLite cho phép extensions (`brew install sqlite` trên macOS).
- QMD chạy hoàn toàn local qua Bun + `node-llama-cpp` và tự động tải xuống mô hình GGUF từ HuggingFace khi sử dụng lần đầu (không cần daemon Ollama riêng).
- Gateway chạy QMD trong một XDG home tự chứa dưới `~/.openclaw/agents/<agentId>/qmd/` bằng cách thiết lập `XDG_CONFIG_HOME` và `XDG_CACHE_HOME`.
- Hỗ trợ OS: macOS và Linux hoạt động ngay khi Bun + SQLite được cài đặt. Windows được hỗ trợ tốt nhất qua WSL2.

### Cách sidecar chạy

- Gateway ghi một QMD home tự chứa dưới `~/.openclaw/agents/<agentId>/qmd/` (config + cache + sqlite DB).
- Tạo collections qua `qmd collection add` từ `memory.qmd.paths` (cộng với file bộ nhớ workspace mặc định), sau đó `qmd update` + `qmd embed` chạy khi khởi động và theo khoảng thời gian cấu hình (`memory.qmd.update.interval`, mặc định 5 phút).
- Gateway hiện khởi tạo QMD manager khi khởi động, vì vậy bộ đếm thời gian cập nhật định kỳ được kích hoạt ngay cả trước khi gọi `memory_search` đầu tiên.
- Làm mới khi khởi động hiện chạy nền mặc định để khởi động chat không bị chặn; thiết lập `memory.qmd.update.waitForBootSync = true` để giữ hành vi chặn trước đó.
- Tìm kiếm chạy qua `memory.qmd.searchMode` (mặc định `qmd search --json`; cũng hỗ trợ `vsearch` và `query`). Nếu chế độ đã chọn từ chối cờ trên bản build QMD của bạn, OpenClaw thử lại với `qmd query`. Nếu QMD thất bại hoặc binary bị thiếu, OpenClaw tự động quay lại với SQLite manager tích hợp để công cụ bộ nhớ vẫn hoạt động.
- OpenClaw hiện không cung cấp điều chỉnh kích thước batch QMD embed; hành vi batch được kiểm soát bởi QMD.
- **Tìm kiếm đầu tiên có thể chậm**: QMD có thể tải xuống mô hình GGUF local (reranker/query expansion) khi chạy `qmd query` lần đầu.
  - OpenClaw tự động thiết lập `XDG_CONFIG_HOME`/`XDG_CACHE_HOME` khi chạy QMD.
  - Nếu muốn tải xuống mô hình thủ công trước (và làm nóng cùng index OpenClaw sử dụng), chạy một truy vấn một lần với thư mục XDG của agent.

    Trạng thái QMD của OpenClaw nằm dưới **thư mục trạng thái** của bạn (mặc định là `~/.openclaw`).
    Bạn có thể chỉ định `qmd` vào cùng index bằng cách xuất cùng biến XDG mà OpenClaw sử dụng:

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
- `sessions`: chọn lập chỉ mục JSONL phiên (`enabled`, `retentionDays`, `exportDir`).
- `update`: kiểm soát tần suất làm mới và thực thi bảo trì: (`interval`, `debounceMs`, `onBoot`, `waitForBootSync`, `embedInterval`, `commandTimeoutMs`, `updateTimeoutMs`, `embedTimeoutMs`).
- `limits`: giới hạn tải trọng recall (`maxResults`, `maxSnippetChars`, `maxInjectedChars`, `timeoutMs`).
- `scope`: cùng schema như [`session.sendPolicy`](/gateway/configuration-reference#session).
  Mặc định là chỉ DM (`deny` tất cả, `allow` chat trực tiếp); nới lỏng để hiển thị kết quả QMD trong nhóm/kênh.
  - `match.keyPrefix` khớp với khóa phiên **đã chuẩn hóa** (viết thường, bỏ bất kỳ `agent:<id>:` đầu tiên). Ví dụ: `discord:channel:`.
  - `match.rawKeyPrefix` khớp với khóa phiên **thô** (viết thường), bao gồm `agent:<id>:`. Ví dụ: `agent:main:discord:`.
  - Legacy: `match.keyPrefix: "agent:..."` vẫn được coi là tiền tố khóa thô, nhưng nên dùng `rawKeyPrefix` để rõ ràng.
- Khi `scope` từ chối tìm kiếm, OpenClaw ghi log cảnh báo với `channel`/`chatType` đã suy ra để dễ debug kết quả rỗng.
- Snippets nguồn ngoài workspace xuất hiện dưới dạng `qmd/<collection>/<relative-path>` trong kết quả `memory_search`; `memory_get` hiểu tiền tố đó và đọc từ gốc collection QMD đã cấu hình.
- Khi `memory.qmd.sessions.enabled = true`, OpenClaw xuất các bản ghi phiên đã được làm sạch (User/Assistant turns) vào một collection QMD chuyên dụng dưới `~/.openclaw/agents/<id>/qmd/sessions/`, để `memory_search` có thể nhớ lại các cuộc trò chuyện gần đây mà không cần chạm vào index SQLite tích hợp.
- Snippets `memory_search` hiện bao gồm footer `Source: <path#line>` khi `memory.citations` là `auto`/`on`; thiết lập `memory.citations = "off"` để giữ metadata đường dẫn nội bộ (agent vẫn nhận đường dẫn cho `memory_get`, nhưng văn bản snippet bỏ qua footer và prompt hệ thống cảnh báo agent không trích dẫn nó).

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
        // Tiền tố khóa phiên đã chuẩn hóa (bỏ `agent:<id>:`).
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

### Trích dẫn và fallback

- `memory.citations` áp dụng bất kể backend (`auto`/`on`/`off`).
- Khi `qmd` chạy, chúng tôi gắn thẻ `status().backend = "qmd"` để chẩn đoán hiển thị engine nào đã phục vụ kết quả. Nếu subprocess QMD thoát hoặc đầu ra JSON không thể phân tích, search manager ghi log cảnh báo và trả về provider tích hợp (embedding Markdown hiện có) cho đến khi QMD phục hồi.

## Đường dẫn bộ nhớ bổ sung

Nếu muốn lập chỉ mục file Markdown ngoài bố cục workspace mặc định, thêm đường dẫn rõ ràng:

```json5
agents: {
  defaults: {
    memorySearch: {
      extraPaths: ["../team-docs", "/srv/shared-notes/overview.md"]
    }
  }
}
```

Ghi chú:

- Đường dẫn có thể là tuyệt đối hoặc tương đối workspace.
- Thư mục được quét đệ quy cho file `.md`.
- Mặc định, chỉ file Markdown được lập chỉ mục.
- Nếu `memorySearch.multimodal.enabled = true`, OpenClaw cũng lập chỉ mục file hình ảnh/âm thanh được hỗ trợ chỉ dưới `extraPaths`. Gốc bộ nhớ mặc định (`MEMORY.md`, `memory.md`, `memory/**/*.md`) vẫn chỉ là Markdown.
- Symlinks bị bỏ qua (file hoặc thư mục).

## File bộ nhớ đa phương tiện (Gemini hình ảnh + âm thanh)

OpenClaw có thể lập chỉ mục file hình ảnh và âm thanh từ `memorySearch.extraPaths` khi sử dụng Gemini embedding 2:

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

Ghi chú:

- Bộ nhớ đa phương tiện hiện chỉ được hỗ trợ cho `gemini-embedding-2-preview`.
- Lập chỉ mục đa phương tiện chỉ áp dụng cho file được phát hiện qua `memorySearch.extraPaths`.
- Các phương thức được hỗ trợ trong giai đoạn này: hình ảnh và âm thanh.
- `memorySearch.fallback` phải giữ `"none"` trong khi bộ nhớ đa phương tiện được bật.
- Byte file hình ảnh/âm thanh khớp được tải lên endpoint embedding Gemini đã cấu hình trong quá trình lập chỉ mục.
- Phần mở rộng hình ảnh được hỗ trợ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`.
- Phần mở rộng âm thanh được hỗ trợ: `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac`.
- Truy vấn tìm kiếm vẫn là văn bản, nhưng Gemini có thể so sánh các truy vấn văn bản đó với embedding hình ảnh/âm thanh đã lập chỉ mục.
- `memory_get` vẫn chỉ đọc Markdown; file nhị phân có thể tìm kiếm nhưng không được trả về dưới dạng nội dung file thô.

## Embedding Gemini (native)

Thiết lập provider thành `gemini` để sử dụng trực tiếp API embedding Gemini:

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

Ghi chú:

- `remote.baseUrl` là tùy chọn (mặc định là URL cơ sở API Gemini).
- `remote.headers` cho phép thêm header bổ sung nếu cần.
- Mô hình mặc định: `gemini-embedding-001`.
- `gemini-embedding-2-preview` cũng được hỗ trợ: giới hạn 8192 token và kích thước có thể cấu hình (768 / 1536 / 3072, mặc định 3072).

### Gemini Embedding 2 (preview)

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

> **Yêu cầu re-index:** Chuyển từ `gemini-embedding-001` (768 dimensions)
> sang `gemini-embedding-2-preview` (3072 dimensions) thay đổi kích thước vector. Điều tương tự cũng xảy ra nếu bạn
> thay đổi `outputDimensionality` giữa 768, 1536, và 3072.
> OpenClaw sẽ tự động reindex khi phát hiện thay đổi mô hình hoặc kích thước.

## Endpoint tương thích OpenAI tùy chỉnh

Nếu muốn sử dụng endpoint tương thích OpenAI tùy chỉnh (OpenRouter, vLLM, hoặc proxy),
bạn có thể sử dụng cấu hình `remote` với provider OpenAI:

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

Nếu không muốn thiết lập API key, sử dụng `memorySearch.provider = "local"` hoặc thiết lập
`memorySearch.fallback = "none"`.

### Fallbacks

- `memorySearch.fallback` có thể là `openai`, `gemini`, `voyage`, `mistral`, `ollama`, `local`, hoặc `none`.
- Nhà cung cấp fallback chỉ được sử dụng khi nhà cung cấp embedding chính thất bại.

### Lập chỉ mục batch (OpenAI + Gemini + Voyage)

- Vô hiệu hóa mặc định. Thiết lập `agents.defaults.memorySearch.remote.batch.enabled = true` để bật cho lập chỉ mục corpus lớn (OpenAI, Gemini, và Voyage).
- Hành vi mặc định chờ hoàn thành batch; điều chỉnh `remote.batch.wait`, `remote.batch.pollIntervalMs`, và `remote.batch.timeoutMinutes` nếu cần.
- Thiết lập `remote.batch.concurrency` để kiểm soát số lượng công việc batch chúng tôi gửi song song (mặc định: 2).
- Chế độ batch áp dụng khi `memorySearch.provider = "openai"` hoặc `"gemini"` và sử dụng API key tương ứng.
- Công việc batch Gemini sử dụng endpoint batch embeddings không đồng bộ và yêu cầu khả dụng API Gemini Batch.

Tại sao OpenAI batch nhanh và rẻ:

- Đối với backfill lớn, OpenAI thường là tùy chọn nhanh nhất chúng tôi hỗ trợ vì chúng tôi có thể gửi nhiều yêu cầu embedding trong một công việc batch duy nhất và để OpenAI xử lý chúng không đồng bộ.
- OpenAI cung cấp giá chiết khấu cho khối lượng công việc API Batch, vì vậy các lần chạy lập chỉ mục lớn thường rẻ hơn so với gửi cùng yêu cầu đồng bộ.
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

## Cách công cụ bộ nhớ hoạt động

- `memory_search` tìm kiếm ngữ nghĩa các đoạn Markdown (~400 token mục tiêu, 80-token overlap) từ `MEMORY.md` + `memory/**/*.md`. Nó trả về văn bản snippet (giới hạn ~700 ký tự), đường dẫn file, phạm vi dòng, điểm số, provider/mô hình, và liệu chúng tôi có fallback từ embedding local sang remote. Không có payload file đầy đủ nào được trả về.
- `memory_get` đọc một file Markdown bộ nhớ cụ thể (tương đối workspace), tùy chọn từ dòng bắt đầu và cho N dòng. Đường dẫn ngoài `MEMORY.md` / `memory/` bị từ chối.
- Cả hai công cụ chỉ được bật khi `memorySearch.enabled` giải quyết true cho agent.

## Những gì được lập chỉ mục (và khi nào)

- Loại file: Chỉ Markdown (`MEMORY.md`, `memory/**/*.md`).
- Lưu trữ index: SQLite per-agent tại `~/.openclaw/memory/<agentId>.sqlite` (có thể cấu hình qua `agents.defaults.memorySearch.store.path`, hỗ trợ token `{agentId}`).
- Tính mới: watcher trên `MEMORY.md` + `memory/` đánh dấu index bẩn (debounce 1.5s). Đồng bộ được lên lịch khi bắt đầu phiên, khi tìm kiếm, hoặc theo khoảng thời gian và chạy không đồng bộ. Bản ghi phiên sử dụng ngưỡng delta để kích hoạt đồng bộ nền.
- Kích hoạt reindex: index lưu trữ **provider/mô hình embedding + dấu vân tay endpoint + tham số chunking**. Nếu bất kỳ điều nào trong số đó thay đổi, OpenClaw tự động đặt lại và reindex toàn bộ store.

## Tìm kiếm hybrid (BM25 + vector)

Khi được bật, OpenClaw kết hợp:

- **Vector similarity** (khớp ngữ nghĩa, cách diễn đạt có thể khác)
- **BM25 keyword relevance** (token chính xác như ID, biến môi trường, ký hiệu mã)

Nếu tìm kiếm toàn văn không khả dụng trên nền tảng của bạn, OpenClaw quay lại tìm kiếm chỉ vector.

### Tại sao hybrid

Tìm kiếm vector rất tốt ở "điều này có nghĩa giống nhau":

- "Mac Studio gateway host" vs "the machine running the gateway"
- "debounce file updates" vs "avoid indexing on every write"

Nhưng nó có thể yếu ở token chính xác, tín hiệu cao:

- ID (`a828e60`, `b3b9895a...`)
- ký hiệu mã (`memorySearch.query.hybrid`)
- chuỗi lỗi ("sqlite-vec unavailable")

BM25 (toàn văn) thì ngược lại: mạnh ở token chính xác, yếu hơn ở diễn đạt lại.
Tìm kiếm hybrid là giải pháp trung gian thực dụng: **sử dụng cả hai tín hiệu truy xuất** để bạn có
kết quả tốt cho cả truy vấn "ngôn ngữ tự nhiên" và truy vấn "kim trong đống cỏ".

### Cách chúng tôi hợp nhất kết quả (thiết kế hiện tại)

Phác thảo triển khai:

1. Truy xuất một pool ứng viên từ cả hai phía:

- **Vector**: top `maxResults * candidateMultiplier` theo cosine similarity.
- **BM25**: top `maxResults * candidateMultiplier` theo xếp hạng BM25 FTS5 (thấp hơn là tốt hơn).

2. Chuyển đổi xếp hạng BM25 thành điểm 0..1-ish:

- `textScore = 1 / (1 + max(0, bm25Rank))`

3. Hợp nhất ứng viên theo chunk id và tính điểm có trọng số:

- `finalScore = vectorWeight * vectorScore + textWeight * textScore`

Ghi chú:

- `vectorWeight` + `textWeight` được chuẩn hóa thành 1.0 trong giải quyết cấu hình, vì vậy trọng số hoạt động như phần trăm.
- Nếu embedding không khả dụng (hoặc provider trả về vector không), chúng tôi vẫn chạy BM25 và trả về khớp từ khóa.
- Nếu FTS5 không thể được tạo, chúng tôi giữ tìm kiếm chỉ vector (không có lỗi nghiêm trọng).

Điều này không phải là "hoàn hảo lý thuyết IR", nhưng nó đơn giản, nhanh chóng, và có xu hướng cải thiện recall/precision trên ghi chú thực tế.
Nếu muốn làm phức tạp hơn sau này, các bước tiếp theo phổ biến là Reciprocal Rank Fusion (RRF) hoặc chuẩn hóa điểm
(min/max hoặc z-score) trước khi trộn.

### Pipeline xử lý hậu kỳ

Sau khi hợp nhất điểm vector và từ khóa, hai giai đoạn xử lý hậu kỳ tùy chọn
tinh chỉnh danh sách kết quả trước khi nó đến agent:

```
Vector + Keyword -> Weighted Merge -> Temporal Decay -> Sort -> MMR -> Top-K Results
```

Cả hai giai đoạn đều **tắt mặc định** và có thể được bật độc lập.

### MMR re-ranking (đa dạng)

Khi tìm kiếm hybrid trả về kết quả, nhiều đoạn có thể chứa nội dung tương tự hoặc trùng lặp.
Ví dụ, tìm kiếm "home network setup" có thể trả về năm snippet gần như giống nhau
từ các ghi chú hàng ngày khác nhau đều đề cập đến cùng cấu hình router.

**MMR (Maximal Marginal Relevance)** sắp xếp lại kết quả để cân bằng sự liên quan với đa dạng,
đảm bảo kết quả hàng đầu bao phủ các khía cạnh khác nhau của truy vấn thay vì lặp lại cùng thông tin.

Cách hoạt động:

1. Kết quả được chấm điểm theo sự liên quan ban đầu của chúng (điểm có trọng số vector + BM25).
2. MMR chọn lặp lại các kết quả tối đa hóa: `lambda x relevance - (1-lambda) x max_similarity_to_selected`.
3. Tương tự giữa các kết quả được đo bằng Jaccard text similarity trên nội dung đã token hóa.

Tham số `lambda` kiểm soát sự đánh đổi:

- `lambda = 1.0` -- chỉ sự liên quan (không có hình phạt đa dạng)
- `lambda = 0.0` -- đa dạng tối đa (bỏ qua sự liên quan)
- Mặc định: `0.7` (cân bằng, hơi thiên về sự liên quan)

**Ví dụ -- truy vấn: "home network setup"**

Với các file bộ nhớ này:

```
memory/2026-02-10.md  -> "Configured Omada router, set VLAN 10 for IoT devices"
memory/2026-02-08.md  -> "Configured Omada router, moved IoT to VLAN 10"
memory/2026-02-05.md  -> "Set up AdGuard DNS on 192.168.10.2"
memory/network.md     -> "Router: Omada ER605, AdGuard: 192.168.10.2, VLAN 10: IoT"
```

Không có MMR -- top 3 kết quả:

```
1. memory/2026-02-10.md  (score: 0.92)  <- router + VLAN
2. memory/2026-02-08.md  (score: 0.89)  <- router + VLAN (gần như trùng lặp!)
3. memory/network.md     (score: 0.85)  <- tài liệu tham khảo
```

Với MMR (lambda=0.7) -- top 3 kết quả:

```
1. memory/2026-02-10.md  (score: 0.92)  <- router + VLAN
2. memory/network.md     (score: 0.85)  <- tài liệu tham khảo (đa dạng!)
3. memory/2026-02-05.md  (score: 0.78)  <- AdGuard DNS (đa dạng!)
```

Gần như trùng lặp từ ngày 8 tháng 2 bị loại, và agent nhận được ba mảnh thông tin khác nhau.

**Khi nào bật:** Nếu bạn nhận thấy `memory_search` trả về snippet dư thừa hoặc gần như trùng lặp,
đặc biệt với ghi chú hàng ngày thường lặp lại thông tin tương tự qua các ngày.

### Temporal decay (tăng cường gần đây)

Agent với ghi chú hàng ngày tích lũy hàng trăm file có ngày theo thời gian. Không có decay,
một ghi chú được viết tốt từ sáu tháng trước có thể vượt qua bản cập nhật hôm qua về cùng chủ đề.

**Temporal decay** áp dụng một nhân số mũ cho điểm dựa trên tuổi của mỗi kết quả,
vì vậy những ký ức gần đây tự nhiên xếp hạng cao hơn trong khi những ký ức cũ mờ dần:

```
decayedScore = score x e^(-lambda x ageInDays)
```

với `lambda = ln(2) / halfLifeDays`.

Với half-life mặc định là 30 ngày:

- Ghi chú hôm nay: **100%** điểm gốc
- 7 ngày trước: **~84%**
- 30 ngày trước: **50%**
- 90 ngày trước: **12.5%**
- 180 ngày trước: **~1.6%**

**File evergreen không bao giờ bị decay:**

- `MEMORY.md` (file bộ nhớ gốc)
- File không có ngày trong `memory/` (ví dụ: `memory/projects.md`, `memory/network.md`)
- Chúng chứa thông tin tham khảo bền vững nên luôn xếp hạng bình thường.

**File hàng ngày có ngày** (`memory/YYYY-MM-DD.md`) sử dụng ngày được trích xuất từ tên file.
Các nguồn khác (ví dụ: bản ghi phiên) dựa vào thời gian sửa đổi file (`mtime`).

**Ví dụ -- truy vấn: "what's Rod's work schedule?"**

Với các file bộ nhớ này (hôm nay là ngày 10 tháng 2):

```
memory/2025-09-15.md  -> "Rod works Mon-Fri, standup at 10am, pairing at 2pm"  (148 ngày tuổi)
memory/2026-02-10.md  -> "Rod has standup at 14:15, 1:1 with Zeb at 14:45"    (hôm nay)
memory/2026-02-03.md  -> "Rod started new team, standup moved to 14:15"        (7 ngày tuổi)
```

Không có decay:

```
1. memory/2025-09-15.md  (score: 0.91)  <- khớp ngữ nghĩa tốt nhất, nhưng cũ!
2. memory/2026-02-10.md  (score: 0.82)
3. memory/2026-02-03.md  (score: 0.80)
```

Với decay (halfLife=30):

```
1. memory/2026-02-10.md  (score: 0.82 x 1.00 = 0.82)  <- hôm nay, không decay
2. memory/2026-02-03.md  (score: 0.80 x 0.85 = 0.68)  <- 7 ngày, decay nhẹ
3. memory/2025-09-15.md  (score: 0.91 x 0.03 = 0.03)  <- 148 ngày, gần như biến mất
```

Ghi chú tháng 9 cũ rơi xuống cuối mặc dù có khớp ngữ nghĩa tốt nhất.

**Khi nào bật:** Nếu agent của bạn có hàng tháng ghi chú hàng ngày và bạn thấy thông tin cũ,
lỗi thời vượt qua ngữ cảnh gần đây. Half-life 30 ngày hoạt động tốt cho
quy trình làm việc nặng ghi chú hàng ngày; tăng nó (ví dụ: 90 ngày) nếu bạn thường xuyên tham khảo ghi chú cũ.

### Cấu hình tìm kiếm hybrid

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
          // Đa dạng: giảm kết quả dư thừa
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

Bạn có thể bật từng tính năng độc lập:

- **Chỉ MMR** -- hữu ích khi bạn có nhiều ghi chú tương tự nhưng tuổi không quan trọng.
- **Chỉ Temporal decay** -- hữu ích khi gần đây quan trọng nhưng kết quả của bạn đã đa dạng.
- **Cả hai** -- khuyến nghị cho agent với lịch sử ghi chú hàng ngày lớn, lâu dài.

## Cache embedding

OpenClaw có thể cache **chunk embeddings** trong SQLite để reindexing và cập nhật thường xuyên (đặc biệt là bản ghi phiên) không re-embed văn bản không thay đổi.

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

Ghi chú:

- Lập chỉ mục phiên là **opt-in** (tắt mặc định).
- Cập nhật phiên được debounce và **lập chỉ mục không đồng bộ** khi chúng vượt qua ngưỡng delta (cố gắng tốt nhất).
- `memory_search` không bao giờ chặn lập chỉ mục; kết quả có thể hơi cũ cho đến khi đồng bộ nền hoàn thành.
- Kết quả vẫn chỉ bao gồm snippet; `memory_get` vẫn giới hạn ở file bộ nhớ.
- Lập chỉ mục phiên được cách ly theo agent (chỉ bản ghi phiên của agent đó được lập chỉ mục).
- Bản ghi phiên sống trên đĩa (`~/.openclaw/agents/<agentId>/sessions/*.jsonl`). Bất kỳ process/người dùng nào có quyền truy cập hệ thống file đều có thể đọc chúng, vì vậy hãy coi quyền truy cập đĩa là ranh giới tin cậy. Để cách ly nghiêm ngặt hơn, chạy agent dưới người dùng OS hoặc host riêng biệt.

Ngưỡng delta (mặc định hiển thị):

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

Khi extension sqlite-vec có sẵn, OpenClaw lưu trữ embeddings trong một
bảng ảo SQLite (`vec0`) và thực hiện truy vấn khoảng cách vector trong
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

Ghi chú:

- `enabled` mặc định là true; khi bị vô hiệu hóa, tìm kiếm quay lại với
  cosine similarity trong quá trình trên các embedding đã lưu trữ.
- Nếu extension sqlite-vec bị thiếu hoặc không tải được, OpenClaw ghi log
  lỗi và tiếp tục với JS fallback (không có bảng vector).
- `extensionPath` ghi đè đường dẫn sqlite-vec đi kèm (hữu ích cho các bản build tùy chỉnh
  hoặc vị trí cài đặt không chuẩn).

## Tự động tải xuống embedding local

- Mô hình embedding local mặc định: `hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB).
- Khi `memorySearch.provider = "local"`, `node-llama-cpp` giải quyết `modelPath`; nếu GGUF bị thiếu nó **tự động tải xuống** vào cache (hoặc `local.modelCacheDir` nếu được thiết lập), sau đó tải nó. Tải xuống tiếp tục khi thử lại.
- Yêu cầu build native: chạy `pnpm approve-builds`, chọn `node-llama-cpp`, sau đó `pnpm rebuild node-llama-cpp`.
- Fallback: nếu thiết lập local thất bại và `memorySearch.fallback = "openai"`, chúng tôi tự động chuyển sang embedding remote (`openai/text-embedding-3-small` trừ khi bị ghi đè) và ghi lại lý do.

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

Ghi chú:

- `remote.*` có ưu tiên hơn `models.providers.openai.*`.
- `remote.headers` hợp nhất với header OpenAI; remote thắng khi có xung đột key. Bỏ qua `remote.headers` để sử dụng mặc định OpenAI.\n