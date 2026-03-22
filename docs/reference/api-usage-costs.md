---
summary: "Khám phá cách theo dõi chi phí API, quản lý khóa sử dụng và tối ưu hóa mức tiêu thụ hiệu quả."
read_when:
  - Bạn muốn hiểu tính năng nào có thể gọi API trả phí
  - Bạn cần kiểm tra khóa, chi phí và khả năng xem mức sử dụng
  - Bạn đang giải thích báo cáo chi phí /status hoặc /usage
title: "Hướng Dẫn Sử Dụng API và Quản Lý Chi Phí"
---

# Sử dụng API & Chi phí

Tài liệu này liệt kê **các tính năng có thể sử dụng khóa API** và nơi hiển thị chi phí của chúng. Nó tập trung vào các tính năng của OpenClaw có thể tạo ra mức sử dụng của nhà cung cấp hoặc các cuộc gọi API trả phí.

## Nơi hiển thị chi phí (chat + CLI)

**Ảnh chụp chi phí theo phiên**

- `/status` hiển thị mô hình phiên hiện tại, mức sử dụng ngữ cảnh và số token của phản hồi cuối cùng.
- Nếu mô hình sử dụng **xác thực khóa API**, `/status` cũng hiển thị **chi phí ước tính** cho phản hồi cuối cùng.

**Chân trang chi phí theo tin nhắn**

- `/usage full` thêm chân trang sử dụng vào mỗi phản hồi, bao gồm **chi phí ước tính** (chỉ khóa API).
- `/usage tokens` chỉ hiển thị token; các luồng OAuth ẩn chi phí bằng đô la.

**Cửa sổ sử dụng CLI (hạn ngạch nhà cung cấp)**

- `openclaw status --usage` và `openclaw channels list` hiển thị **cửa sổ sử dụng nhà cung cấp** (ảnh chụp hạn ngạch, không phải chi phí theo tin nhắn).

Xem [Sử dụng Token & Chi phí](/reference/token-use) để biết chi tiết và ví dụ.

## Cách phát hiện khóa

OpenClaw có thể lấy thông tin xác thực từ:

- **Hồ sơ xác thực** (theo từng agent, lưu trong `auth-profiles.json`).
- **Biến môi trường** (ví dụ: `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Cấu hình** (`models.providers.*.apiKey`, `tools.web.search.*`, `tools.web.fetch.firecrawl.*`, `memorySearch.*`, `talk.apiKey`).
- **Kỹ năng** (`skills.entries.<name>.apiKey`) có thể xuất khóa ra môi trường của quá trình kỹ năng.

## Các tính năng có thể tiêu khóa

### 1) Phản hồi mô hình cốt lõi (chat + công cụ)

Mỗi phản hồi hoặc cuộc gọi công cụ sử dụng **nhà cung cấp mô hình hiện tại** (OpenAI, Anthropic, v.v.). Đây là nguồn chính của mức sử dụng và chi phí.

Xem [Mô hình](/providers/models) để biết cấu hình giá và [Sử dụng Token & Chi phí](/reference/token-use) để hiển thị.

### 2) Hiểu phương tiện (âm thanh/hình ảnh/video)

Phương tiện đầu vào có thể được tóm tắt/chuyển đổi trước khi phản hồi chạy. Điều này sử dụng API của mô hình/nhà cung cấp.

- Âm thanh: OpenAI / Groq / Deepgram (hiện **tự động kích hoạt** khi có khóa).
- Hình ảnh: OpenAI / Anthropic / Google.
- Video: Google.

Xem [Hiểu phương tiện](/nodes/media-understanding).

### 3) Nhúng bộ nhớ + tìm kiếm ngữ nghĩa

Tìm kiếm bộ nhớ ngữ nghĩa sử dụng **API nhúng** khi được cấu hình cho các nhà cung cấp từ xa:

- `memorySearch.provider = "openai"` → Nhúng OpenAI
- `memorySearch.provider = "gemini"` → Nhúng Gemini
- `memorySearch.provider = "voyage"` → Nhúng Voyage
- `memorySearch.provider = "mistral"` → Nhúng Mistral
- `memorySearch.provider = "ollama"` → Nhúng Ollama (cục bộ/tự lưu trữ; thường không có hóa đơn API lưu trữ)
- Tùy chọn dự phòng cho nhà cung cấp từ xa nếu nhúng cục bộ thất bại

Bạn có thể giữ nó cục bộ với `memorySearch.provider = "local"` (không sử dụng API).

Xem [Bộ nhớ](/concepts/memory).

### 4) Công cụ tìm kiếm web

`web_search` sử dụng khóa API và có thể phát sinh phí sử dụng tùy thuộc vào nhà cung cấp của bạn:

- **Brave Search API**: `BRAVE_API_KEY` hoặc `plugins.entries.brave.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` hoặc `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` hoặc `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, hoặc `plugins.entries.moonshot.config.webSearch.apiKey`
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, hoặc `plugins.entries.perplexity.config.webSearch.apiKey`

Các đường dẫn nhà cung cấp `tools.web.search.*` cũ vẫn tải qua lớp tương thích tạm thời, nhưng không còn là bề mặt cấu hình được khuyến nghị.

**Tín dụng miễn phí Brave Search:** Mỗi gói Brave bao gồm \$5/tháng tín dụng miễn phí tái tạo. Gói Search có giá \$5 cho mỗi 1.000 yêu cầu, vì vậy tín dụng bao phủ 1.000 yêu cầu/tháng mà không tính phí. Đặt giới hạn sử dụng của bạn trong bảng điều khiển Brave để tránh các khoản phí không mong muốn.

Xem [Công cụ web](/tools/web).

### 5) Công cụ lấy dữ liệu web (Firecrawl)

`web_fetch` có thể gọi **Firecrawl** khi có khóa API:

- `FIRECRAWL_API_KEY` hoặc `tools.web.fetch.firecrawl.apiKey`

Nếu Firecrawl không được cấu hình, công cụ sẽ chuyển sang lấy trực tiếp + khả năng đọc (không có API trả phí).

Xem [Công cụ web](/tools/web).

### 6) Ảnh chụp mức sử dụng nhà cung cấp (trạng thái/sức khỏe)

Một số lệnh trạng thái gọi **điểm cuối mức sử dụng nhà cung cấp** để hiển thị cửa sổ hạn ngạch hoặc sức khỏe xác thực. Đây thường là các cuộc gọi có khối lượng thấp nhưng vẫn truy cập API của nhà cung cấp:

- `openclaw status --usage`
- `openclaw models status --json`

Xem [CLI Mô hình](/cli/models).

### 7) Tóm tắt bảo vệ nén

Bảo vệ nén có thể tóm tắt lịch sử phiên bằng **mô hình hiện tại**, điều này sẽ gọi API của nhà cung cấp khi nó chạy.

Xem [Quản lý phiên + nén](/reference/session-management-compaction).

### 8) Quét / thăm dò mô hình

`openclaw models scan` có thể thăm dò các mô hình OpenRouter và sử dụng `OPENROUTER_API_KEY` khi thăm dò được kích hoạt.

Xem [CLI Mô hình](/cli/models).

### 9) Nói (giọng nói)

Chế độ nói có thể gọi **ElevenLabs** khi được cấu hình:

- `ELEVENLABS_API_KEY` hoặc `talk.apiKey`

Xem [Chế độ nói](/nodes/talk).

### 10) Kỹ năng (API bên thứ ba)

Kỹ năng có thể lưu `apiKey` trong `skills.entries.<name>.apiKey`. Nếu một kỹ năng sử dụng khóa đó cho các API bên ngoài, nó có thể phát sinh chi phí theo nhà cung cấp của kỹ năng.

Xem [Kỹ năng](/tools/skills).
