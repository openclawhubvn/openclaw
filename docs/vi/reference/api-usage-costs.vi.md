---
summary: "Kiểm tra chi tiêu, khóa API sử dụng và cách xem mức sử dụng"
read_when:
  - Muốn biết tính năng nào có thể gọi API trả phí
  - Cần kiểm tra khóa, chi phí và khả năng xem mức sử dụng
  - Đang giải thích báo cáo chi phí /status hoặc /usage
title: "Sử dụng API và Chi phí"
---

# Sử dụng API & chi phí

Tài liệu này liệt kê **tính năng có thể gọi khóa API** và nơi hiển thị chi phí. Tập trung vào các tính năng OpenClaw có thể tạo ra mức sử dụng hoặc cuộc gọi API trả phí.

## Nơi hiển thị chi phí (chat + CLI)

**Chi phí theo phiên**

- `/status` hiển thị mô hình phiên hiện tại, mức sử dụng ngữ cảnh và token phản hồi cuối.
- Nếu mô hình dùng **API-key auth**, `/status` cũng hiển thị **chi phí ước tính** cho phản hồi cuối.

**Chi phí theo tin nhắn**

- `/usage full` thêm footer sử dụng vào mỗi phản hồi, bao gồm **chi phí ước tính** (chỉ API-key).
- `/usage tokens` chỉ hiển thị token; OAuth ẩn chi phí đô la.

**Cửa sổ sử dụng CLI (hạn ngạch nhà cung cấp)**

- `openclaw status --usage` và `openclaw channels list` hiển thị **cửa sổ sử dụng** nhà cung cấp
  (ảnh chụp hạn ngạch, không phải chi phí theo tin nhắn).

Xem [Token use & costs](/reference/token-use) để biết chi tiết và ví dụ.

## Cách phát hiện khóa

OpenClaw có thể lấy thông tin xác thực từ:

- **Auth profiles** (mỗi agent, lưu trong `auth-profiles.json`).
- **Biến môi trường** (ví dụ: `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Cấu hình** (`models.providers.*.apiKey`, `tools.web.search.*`, `tools.web.fetch.firecrawl.*`,
  `memorySearch.*`, `talk.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) có thể xuất khóa vào môi trường process của skill.

## Tính năng có thể tiêu khóa

### 1) Phản hồi mô hình cốt lõi (chat + tools)

Mỗi phản hồi hoặc cuộc gọi tool sử dụng **nhà cung cấp mô hình hiện tại** (OpenAI, Anthropic, v.v.). Đây là nguồn chính của mức sử dụng và chi phí.

Xem [Models](/providers/models) để biết cấu hình giá và [Token use & costs](/reference/token-use) để hiển thị.

### 2) Hiểu phương tiện (âm thanh/hình ảnh/video)

Phương tiện đầu vào có thể được tóm tắt/chuyển đổi trước khi phản hồi chạy. Sử dụng API mô hình/nhà cung cấp.

- Âm thanh: OpenAI / Groq / Deepgram (hiện **tự động bật** khi có khóa).
- Hình ảnh: OpenAI / Anthropic / Google.
- Video: Google.

Xem [Media understanding](/nodes/media-understanding).

### 3) Nhúng bộ nhớ + tìm kiếm ngữ nghĩa

Tìm kiếm bộ nhớ ngữ nghĩa sử dụng **embedding APIs** khi cấu hình cho nhà cung cấp từ xa:

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "ollama"` → Ollama embeddings (local/self-hosted; thường không có billing API)
- Tùy chọn fallback sang nhà cung cấp từ xa nếu nhúng local thất bại

Có thể giữ local với `memorySearch.provider = "local"` (không sử dụng API).

Xem [Memory](/concepts/memory).

### 4) Công cụ tìm kiếm web

`web_search` sử dụng khóa API và có thể phát sinh chi phí tùy thuộc vào nhà cung cấp:

- **Brave Search API**: `BRAVE_API_KEY` hoặc `plugins.entries.brave.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` hoặc `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` hoặc `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, hoặc `plugins.entries.moonshot.config.webSearch.apiKey`
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, hoặc `plugins.entries.perplexity.config.webSearch.apiKey`

Các đường dẫn nhà cung cấp `tools.web.search.*` cũ vẫn tải qua shim tương thích tạm thời, nhưng không còn là cấu hình khuyến nghị.

**Brave Search free credit:** Mỗi gói Brave bao gồm \$5/tháng tín dụng miễn phí tự động gia hạn. Gói Search có giá \$5 cho 1,000 yêu cầu, nên tín dụng bao gồm 1,000 yêu cầu/tháng miễn phí. Đặt giới hạn sử dụng trong dashboard Brave để tránh chi phí bất ngờ.

Xem [Web tools](/tools/web).

### 5) Công cụ lấy dữ liệu web (Firecrawl)

`web_fetch` có thể gọi **Firecrawl** khi có khóa API:

- `FIRECRAWL_API_KEY` hoặc `tools.web.fetch.firecrawl.apiKey`

Nếu Firecrawl không được cấu hình, công cụ sẽ fallback sang fetch trực tiếp + readability (không có API trả phí).

Xem [Web tools](/tools/web).

### 6) Ảnh chụp sử dụng nhà cung cấp (trạng thái/sức khỏe)

Một số lệnh trạng thái gọi **điểm cuối sử dụng nhà cung cấp** để hiển thị cửa sổ hạn ngạch hoặc sức khỏe xác thực. Thường là cuộc gọi khối lượng thấp nhưng vẫn truy cập API nhà cung cấp:

- `openclaw status --usage`
- `openclaw models status --json`

Xem [Models CLI](/cli/models).

### 7) Tóm tắt bảo vệ nén

Bảo vệ nén có thể tóm tắt lịch sử phiên bằng **mô hình hiện tại**, gọi API nhà cung cấp khi chạy.

Xem [Session management + compaction](/reference/session-management-compaction).

### 8) Quét / thăm dò mô hình

`openclaw models scan` có thể thăm dò mô hình OpenRouter và sử dụng `OPENROUTER_API_KEY` khi thăm dò được bật.

Xem [Models CLI](/cli/models).

### 9) Talk (giọng nói)

Chế độ Talk có thể gọi **ElevenLabs** khi được cấu hình:

- `ELEVENLABS_API_KEY` hoặc `talk.apiKey`

Xem [Talk mode](/nodes/talk).

### 10) Skills (API bên thứ ba)

Skills có thể lưu `apiKey` trong `skills.entries.<name>.apiKey`. Nếu skill sử dụng khóa đó cho API bên ngoài, có thể phát sinh chi phí theo nhà cung cấp của skill.

Xem [Skills](/tools/skills).\n