---
summary: "Sử dụng các mô hình MiniMax trong OpenClaw"
read_when:
  - Bạn muốn sử dụng mô hình MiniMax trong OpenClaw
  - Bạn cần hướng dẫn thiết lập MiniMax
title: "MiniMax"
---

# MiniMax

Nhà cung cấp MiniMax của OpenClaw mặc định sử dụng **MiniMax M2.7** và giữ lại **MiniMax M2.5** trong danh mục để đảm bảo tương thích.

## Danh sách mô hình

- `MiniMax-M2.7`: mô hình văn bản mặc định được lưu trữ.
- `MiniMax-M2.7-highspeed`: phiên bản M2.7 nhanh hơn.
- `MiniMax-M2.5`: mô hình văn bản trước đó, vẫn có sẵn trong danh mục MiniMax.
- `MiniMax-M2.5-highspeed`: phiên bản M2.5 nhanh hơn.
- `MiniMax-VL-01`: mô hình xử lý văn bản + hình ảnh.

## Chọn một thiết lập

### MiniMax OAuth (Kế hoạch Coding) - khuyến nghị

**Phù hợp nhất cho:** thiết lập nhanh với Kế hoạch Coding của MiniMax qua OAuth, không cần khóa API.

Kích hoạt plugin OAuth đi kèm và xác thực:

```bash
openclaw plugins enable minimax  # bỏ qua nếu đã tải.
openclaw gateway restart  # khởi động lại nếu gateway đang chạy
openclaw onboard --auth-choice minimax-portal
```

Bạn sẽ được yêu cầu chọn một endpoint:

- **Global** - Người dùng quốc tế (`api.minimax.io`)
- **CN** - Người dùng tại Trung Quốc (`api.minimaxi.com`)

Xem [MiniMax plugin README](https://github.com/openclaw/openclaw/tree/main/extensions/minimax) để biết chi tiết.

### MiniMax M2.7 (khóa API)

**Phù hợp nhất cho:** sử dụng MiniMax được lưu trữ với API tương thích Anthropic.

Cấu hình qua CLI:

- Chạy `openclaw configure`
- Chọn **Model/auth**
- Chọn một tùy chọn xác thực **MiniMax**

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
          {
            id: "MiniMax-M2.7-highspeed",
            name: "MiniMax M2.7 Highspeed",
            reasoning: true,
            input: ["text"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
          {
            id: "MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
          {
            id: "MiniMax-M2.5-highspeed",
            name: "MiniMax M2.5 Highspeed",
            reasoning: true,
            input: ["text"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### MiniMax M2.7 làm dự phòng (ví dụ)

**Phù hợp nhất cho:** giữ mô hình thế hệ mới nhất mạnh nhất làm chính, chuyển sang MiniMax M2.7 khi cần. Ví dụ dưới đây sử dụng Opus làm chính; thay thế bằng mô hình thế hệ mới nhất mà bạn ưa thích.

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "primary" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

### Tùy chọn: Cục bộ qua LM Studio (thủ công)

**Phù hợp nhất cho:** suy luận cục bộ với LM Studio. Chúng tôi đã thấy kết quả tốt với MiniMax M2.5 trên phần cứng mạnh (ví dụ: máy tính để bàn/máy chủ) sử dụng máy chủ cục bộ của LM Studio.

Cấu hình thủ công qua `openclaw.json`:

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.5-gs32" },
      models: { "lmstudio/minimax-m2.5-gs32": { alias: "Minimax" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Cấu hình qua `openclaw configure`

Sử dụng trình hướng dẫn cấu hình tương tác để thiết lập MiniMax mà không cần chỉnh sửa JSON:

1. Chạy `openclaw configure`.
2. Chọn **Model/auth**.
3. Chọn một tùy chọn xác thực **MiniMax**.
4. Chọn mô hình mặc định khi được yêu cầu.

## Tùy chọn cấu hình

- `models.providers.minimax.baseUrl`: ưu tiên `https://api.minimax.io/anthropic` (tương thích Anthropic); `https://api.minimax.io/v1` là tùy chọn cho payload tương thích OpenAI.
- `models.providers.minimax.api`: ưu tiên `anthropic-messages`; `openai-completions` là tùy chọn cho payload tương thích OpenAI.
- `models.providers.minimax.apiKey`: khóa API MiniMax (`MINIMAX_API_KEY`).
- `models.providers.minimax.models`: định nghĩa `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost`.
- `agents.defaults.models`: đặt tên bí danh cho các mô hình bạn muốn trong danh sách cho phép.
- `models.mode`: giữ `merge` nếu bạn muốn thêm MiniMax cùng với các mô hình tích hợp sẵn.

## Ghi chú

- Tham chiếu mô hình là `minimax/<model>`.
- Mô hình văn bản mặc định: `MiniMax-M2.7`.
- Các mô hình văn bản thay thế: `MiniMax-M2.7-highspeed`, `MiniMax-M2.5`, `MiniMax-M2.5-highspeed`.
- API sử dụng Kế hoạch Coding: `https://api.minimaxi.com/v1/api/openplatform/coding-plan/remains` (yêu cầu khóa kế hoạch coding).
- Cập nhật giá trị giá trong `models.json` nếu bạn cần theo dõi chi phí chính xác.
- Liên kết giới thiệu cho Kế hoạch Coding của MiniMax (giảm 10%): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- Xem [/concepts/model-providers](/concepts/model-providers) để biết quy tắc của nhà cung cấp.
- Sử dụng `openclaw models list` và `openclaw models set minimax/MiniMax-M2.7` để chuyển đổi.

## Khắc phục sự cố

### "Unknown model: minimax/MiniMax-M2.7"

Điều này thường có nghĩa là **nhà cung cấp MiniMax chưa được cấu hình** (không có mục nhà cung cấp và không tìm thấy hồ sơ xác thực MiniMax/khóa môi trường). Một bản sửa lỗi cho việc phát hiện này sẽ có trong **2026.1.12** (chưa phát hành tại thời điểm viết). Khắc phục bằng cách:

- Nâng cấp lên **2026.1.12** (hoặc chạy từ nguồn `main`), sau đó khởi động lại gateway.
- Chạy `openclaw configure` và chọn một tùy chọn xác thực **MiniMax**, hoặc
- Thêm thủ công khối `models.providers.minimax`, hoặc
- Đặt `MINIMAX_API_KEY` (hoặc hồ sơ xác thực MiniMax) để nhà cung cấp có thể được chèn vào.

Đảm bảo id mô hình là **phân biệt chữ hoa chữ thường**:

- `minimax/MiniMax-M2.7`
- `minimax/MiniMax-M2.7-highspeed`
- `minimax/MiniMax-M2.5`
- `minimax/MiniMax-M2.5-highspeed`

Sau đó kiểm tra lại với:

```bash
openclaw models list
```
