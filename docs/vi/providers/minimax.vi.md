---
summary: "Sử dụng mô hình MiniMax trong OpenClaw"
read_when:
  - Cần mô hình MiniMax trong OpenClaw
  - Cần hướng dẫn cài đặt MiniMax
title: "MiniMax"
---

# MiniMax

MiniMax provider của OpenClaw mặc định dùng **MiniMax M2.7** và giữ **MiniMax M2.5** trong catalog để tương thích.

## Danh sách mô hình

- `MiniMax-M2.7`: mô hình text mặc định.
- `MiniMax-M2.7-highspeed`: phiên bản M2.7 nhanh hơn.
- `MiniMax-M2.5`: mô hình text trước đây, vẫn có trong catalog MiniMax.
- `MiniMax-M2.5-highspeed`: phiên bản M2.5 nhanh hơn.
- `MiniMax-VL-01`: mô hình vision cho đầu vào text + image.

## Chọn cài đặt

### MiniMax OAuth (Coding Plan) - khuyến nghị

**Phù hợp nhất cho:** cài nhanh với MiniMax Coding Plan qua OAuth, không cần API key.

Kích hoạt OAuth plugin và xác thực:

```bash
openclaw plugins enable minimax  # bỏ qua nếu đã load.
openclaw gateway restart  # restart nếu gateway đang chạy
openclaw onboard --auth-choice minimax-portal
```

Chọn endpoint:

- **Global** - Người dùng quốc tế (`api.minimax.io`)
- **CN** - Người dùng tại Trung Quốc (`api.minimaxi.com`)

Xem chi tiết tại [MiniMax plugin README](https://github.com/openclaw/openclaw/tree/main/extensions/minimax).

### MiniMax M2.7 (API key)

**Phù hợp nhất cho:** MiniMax hosted với API tương thích Anthropic.

Cấu hình qua CLI:

- Chạy `openclaw configure`
- Chọn **Model/auth**
- Chọn một tùy chọn auth **MiniMax**

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

### MiniMax M2.7 làm fallback (ví dụ)

**Phù hợp nhất cho:** giữ mô hình thế hệ mới mạnh nhất làm chính, fallback về MiniMax M2.7.
Ví dụ dưới dùng Opus làm mô hình chính; thay bằng mô hình thế hệ mới ưa thích.

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

### Tùy chọn: Local qua LM Studio (thủ công)

**Phù hợp nhất cho:** inference local với LM Studio.
MiniMax M2.5 cho kết quả tốt trên phần cứng mạnh (ví dụ: desktop/server) dùng server local của LM Studio.

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

Dùng wizard cấu hình tương tác để set MiniMax mà không cần chỉnh JSON:

1. Chạy `openclaw configure`.
2. Chọn **Model/auth**.
3. Chọn một tùy chọn auth **MiniMax**.
4. Chọn mô hình mặc định khi được hỏi.

## Tùy chọn cấu hình

- `models.providers.minimax.baseUrl`: ưu tiên `https://api.minimax.io/anthropic` (tương thích Anthropic); `https://api.minimax.io/v1` là tùy chọn cho payload tương thích OpenAI.
- `models.providers.minimax.api`: ưu tiên `anthropic-messages`; `openai-completions` là tùy chọn cho payload tương thích OpenAI.
- `models.providers.minimax.apiKey`: MiniMax API key (`MINIMAX_API_KEY`).
- `models.providers.minimax.models`: định nghĩa `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost`.
- `agents.defaults.models`: alias các mô hình muốn trong allowlist.
- `models.mode`: giữ `merge` nếu muốn thêm MiniMax cùng built-ins.

## Ghi chú

- Model refs là `minimax/<model>`.
- Mô hình text mặc định: `MiniMax-M2.7`.
- Mô hình text thay thế: `MiniMax-M2.7-highspeed`, `MiniMax-M2.5`, `MiniMax-M2.5-highspeed`.
- API sử dụng Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (yêu cầu coding plan key).
- Cập nhật giá trị pricing trong `models.json` nếu cần theo dõi chi phí chính xác.
- Link giới thiệu MiniMax Coding Plan (giảm 10%): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- Xem [/concepts/model-providers](/concepts/model-providers) để biết quy tắc provider.
- Dùng `openclaw models list` và `openclaw models set minimax/MiniMax-M2.7` để chuyển đổi.

## Khắc phục sự cố

### "Unknown model: minimax/MiniMax-M2.7"

Thường do **MiniMax provider chưa được cấu hình** (không có entry provider và không tìm thấy profile/env key auth MiniMax). Fix cho phát hiện này có trong **2026.1.12** (chưa phát hành tại thời điểm viết). Fix bằng cách:

- Nâng cấp lên **2026.1.12** (hoặc chạy từ source `main`), sau đó restart gateway.
- Chạy `openclaw configure` và chọn một tùy chọn auth **MiniMax**, hoặc
- Thêm block `models.providers.minimax` thủ công, hoặc
- Set `MINIMAX_API_KEY` (hoặc profile auth MiniMax) để provider có thể được inject.

Đảm bảo model id **phân biệt chữ hoa-thường**:

- `minimax/MiniMax-M2.7`
- `minimax/MiniMax-M2.7-highspeed`
- `minimax/MiniMax-M2.5`
- `minimax/MiniMax-M2.5-highspeed`

Sau đó kiểm tra lại với:

```bash
openclaw models list
```\n