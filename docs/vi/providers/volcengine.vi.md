---
title: "Volcengine (Doubao)"
summary: "Thiết lập Volcano Engine (mô hình Doubao, endpoint tổng quát + coding)"
read_when:
  - Muốn dùng Volcano Engine hoặc mô hình Doubao với OpenClaw
  - Cần thiết lập Volcengine API key
---

# Volcengine (Doubao)

Volcengine provider cho phép truy cập mô hình Doubao và mô hình bên thứ ba trên Volcano Engine, với endpoint riêng cho tác vụ tổng quát và coding.

- Providers: `volcengine` (tổng quát) + `volcengine-plan` (coding)
- Auth: `VOLCANO_ENGINE_API_KEY`
- API: Tương thích OpenAI

## Bắt đầu nhanh

1. Thiết lập API key:

```bash
openclaw onboard --auth-choice volcengine-api-key
```

2. Thiết lập model mặc định:

```json5
{
  agents: {
    defaults: {
      model: { primary: "volcengine-plan/ark-code-latest" },
    },
  },
}
```

## Ví dụ không tương tác

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

## Providers và endpoints

| Provider          | Endpoint                                  | Use case       |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Mô hình tổng quát |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Mô hình coding  |

Cả hai providers đều được cấu hình từ một API key duy nhất. Thiết lập sẽ tự động đăng ký cả hai.

## Các mô hình có sẵn

- **doubao-seed-1-8** - Doubao Seed 1.8 (tổng quát, mặc định)
- **doubao-seed-code-preview** - Mô hình coding Doubao
- **ark-code-latest** - Mặc định cho coding plan
- **Kimi K2.5** - Moonshot AI qua Volcano Engine
- **GLM-4.7** - GLM qua Volcano Engine
- **DeepSeek V3.2** - DeepSeek qua Volcano Engine

Hầu hết các mô hình hỗ trợ đầu vào text + image. Context windows từ 128K đến 256K tokens.

## Lưu ý môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `VOLCANO_ENGINE_API_KEY` có sẵn cho process đó (ví dụ, trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).\n