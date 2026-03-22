---
summary: "Cách OpenClaw xây dựng ngữ cảnh prompt và báo cáo sử dụng token + chi phí"
read_when:
  - Giải thích về sử dụng token, chi phí, hoặc cửa sổ ngữ cảnh
  - Gỡ lỗi hành vi tăng trưởng hoặc nén ngữ cảnh
title: "Sử dụng Token và Chi phí"
---

# Sử dụng Token & Chi phí

OpenClaw theo dõi **token**, không phải ký tự. Token phụ thuộc vào từng mô hình, nhưng hầu hết các mô hình kiểu OpenAI trung bình khoảng 4 ký tự mỗi token cho văn bản tiếng Anh.

## Cách hệ thống xây dựng prompt

OpenClaw tự động tạo prompt hệ thống trong mỗi lần chạy. Nó bao gồm:

- Danh sách công cụ + mô tả ngắn
- Danh sách kỹ năng (chỉ metadata; hướng dẫn được tải khi cần với `read`)
- Hướng dẫn tự cập nhật
- Tệp Workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` khi mới, và `MEMORY.md` khi có hoặc `memory.md` như một lựa chọn thay thế viết thường). Các tệp lớn bị cắt ngắn bởi `agents.defaults.bootstrapMaxChars` (mặc định: 20000), và tổng số ký tự bootstrap được giới hạn bởi `agents.defaults.bootstrapTotalMaxChars` (mặc định: 150000). Các tệp `memory/*.md` được tải theo yêu cầu qua công cụ memory và không tự động được chèn vào.
- Thời gian (UTC + múi giờ người dùng)
- Thẻ trả lời + hành vi heartbeat
- Metadata thời gian chạy (host/OS/model/thinking)

Xem chi tiết đầy đủ trong [System Prompt](/concepts/system-prompt).

## Những gì được tính trong cửa sổ ngữ cảnh

Mọi thứ mà mô hình nhận được đều tính vào giới hạn ngữ cảnh:

- Prompt hệ thống (tất cả các phần đã liệt kê ở trên)
- Lịch sử hội thoại (tin nhắn người dùng + trợ lý)
- Lời gọi công cụ và kết quả công cụ
- Tệp đính kèm/bản ghi (hình ảnh, âm thanh, tệp)
- Tóm tắt nén và các hiện vật cắt tỉa
- Bao bọc của nhà cung cấp hoặc tiêu đề an toàn (không hiển thị, nhưng vẫn được tính)

Đối với hình ảnh, OpenClaw giảm kích thước tải trọng hình ảnh transcript/công cụ trước khi gọi nhà cung cấp. Sử dụng `agents.defaults.imageMaxDimensionPx` (mặc định: `1200`) để điều chỉnh:

- Giá trị thấp hơn thường giảm sử dụng token hình ảnh và kích thước tải trọng.
- Giá trị cao hơn giữ lại nhiều chi tiết hình ảnh hơn cho các ảnh chụp màn hình nặng OCR/UI.

Để có phân tích thực tế (theo từng tệp được chèn, công cụ, kỹ năng và kích thước prompt hệ thống), sử dụng `/context list` hoặc `/context detail`. Xem [Context](/concepts/context).

## Cách xem sử dụng token hiện tại

Sử dụng các lệnh sau trong chat:

- `/status` → **thẻ trạng thái phong phú emoji** với mô hình phiên, sử dụng ngữ cảnh, token đầu vào/đầu ra của phản hồi cuối cùng, và **ước tính chi phí** (chỉ với API key).
- `/usage off|tokens|full` → thêm **chân trang sử dụng theo phản hồi** vào mỗi trả lời.
  - Lưu trữ theo phiên (lưu dưới dạng `responseUsage`).
  - Xác thực OAuth **ẩn chi phí** (chỉ token).
- `/usage cost` → hiển thị tóm tắt chi phí cục bộ từ nhật ký phiên OpenClaw.

Các bề mặt khác:

- **TUI/Web TUI:** `/status` + `/usage` được hỗ trợ.
- **CLI:** `openclaw status --usage` và `openclaw channels list` hiển thị cửa sổ hạn ngạch nhà cung cấp (không phải chi phí theo phản hồi).

## Ước tính chi phí (khi được hiển thị)

Chi phí được ước tính từ cấu hình giá mô hình của bạn:

```
models.providers.<provider>.models[].cost
```

Đây là **USD cho mỗi 1 triệu token** cho `input`, `output`, `cacheRead`, và `cacheWrite`. Nếu thiếu giá, OpenClaw chỉ hiển thị token. Token OAuth không bao giờ hiển thị chi phí đô la.

## Thời gian tồn tại của bộ nhớ cache và tác động cắt tỉa

Bộ nhớ cache prompt của nhà cung cấp chỉ áp dụng trong cửa sổ TTL của bộ nhớ cache. OpenClaw có thể tùy chọn chạy **cắt tỉa TTL bộ nhớ cache**: nó cắt tỉa phiên khi TTL của bộ nhớ cache đã hết hạn, sau đó đặt lại cửa sổ bộ nhớ cache để các yêu cầu tiếp theo có thể sử dụng lại ngữ cảnh đã được lưu trữ thay vì lưu trữ lại toàn bộ lịch sử. Điều này giữ chi phí ghi bộ nhớ cache thấp hơn khi một phiên không hoạt động quá TTL.

Cấu hình nó trong [Gateway configuration](/gateway/configuration) và xem chi tiết hành vi trong [Session pruning](/concepts/session-pruning).

Heartbeat có thể giữ bộ nhớ cache **ấm** qua các khoảng trống không hoạt động. Nếu TTL bộ nhớ cache mô hình của bạn là `1h`, đặt khoảng thời gian heartbeat ngay dưới đó (ví dụ: `55m`) có thể tránh lưu trữ lại toàn bộ prompt, giảm chi phí ghi bộ nhớ cache.

Trong các thiết lập đa tác nhân, bạn có thể giữ một cấu hình mô hình chia sẻ và điều chỉnh hành vi bộ nhớ cache cho từng tác nhân với `agents.list[].params.cacheRetention`.

Để có hướng dẫn chi tiết từng nút, xem [Prompt Caching](/reference/prompt-caching).

Đối với giá API của Anthropic, đọc bộ nhớ cache rẻ hơn đáng kể so với token đầu vào, trong khi ghi bộ nhớ cache được tính với hệ số nhân cao hơn. Xem giá bộ nhớ cache prompt của Anthropic cho các mức giá và hệ số TTL mới nhất: [https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Ví dụ: giữ bộ nhớ cache 1h ấm với heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Ví dụ: lưu lượng hỗn hợp với chiến lược bộ nhớ cache theo tác nhân

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # cơ sở mặc định cho hầu hết các tác nhân
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # giữ bộ nhớ cache dài ấm cho các phiên sâu
    - id: "alerts"
      params:
        cacheRetention: "none" # tránh ghi bộ nhớ cache cho thông báo đột biến
```

`agents.list[].params` hợp nhất trên các `params` của mô hình đã chọn, vì vậy bạn có thể chỉ ghi đè `cacheRetention` và kế thừa các mặc định mô hình khác không thay đổi.

### Ví dụ: kích hoạt tiêu đề beta ngữ cảnh 1M của Anthropic

Cửa sổ ngữ cảnh 1M của Anthropic hiện đang trong giai đoạn beta. OpenClaw có thể chèn giá trị `anthropic-beta` cần thiết khi bạn kích hoạt `context1m` trên các mô hình Opus hoặc Sonnet được hỗ trợ.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Điều này ánh xạ tới tiêu đề beta `context-1m-2025-08-07` của Anthropic.

Điều này chỉ áp dụng khi `context1m: true` được đặt trên mục mô hình đó.

Yêu cầu: thông tin xác thực phải đủ điều kiện để sử dụng ngữ cảnh dài (thanh toán API key, hoặc đăng ký với Extra Usage được kích hoạt). Nếu không, Anthropic phản hồi với `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Nếu bạn xác thực Anthropic với token OAuth/đăng ký (`sk-ant-oat-*`), OpenClaw bỏ qua tiêu đề beta `context-1m-*` vì Anthropic hiện từ chối kết hợp đó với HTTP 401.

## Mẹo để giảm áp lực token

- Sử dụng `/compact` để tóm tắt các phiên dài.
- Cắt ngắn đầu ra công cụ lớn trong quy trình làm việc của bạn.
- Giảm `agents.defaults.imageMaxDimensionPx` cho các phiên nặng ảnh chụp màn hình.
- Giữ mô tả kỹ năng ngắn gọn (danh sách kỹ năng được chèn vào prompt).
- Ưu tiên các mô hình nhỏ hơn cho công việc dài dòng, khám phá.

Xem [Skills](/tools/skills) để biết công thức chi phí danh sách kỹ năng chính xác.
