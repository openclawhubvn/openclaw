---
title: "Hướng Dẫn Cấu Hình Volcengine Doubao"
summary: "Thiết lập Volcengine với mô hình Doubao, hướng dẫn cấu hình endpoint và mã hóa chi tiết."
read_when:
  - Bạn muốn sử dụng Volcano Engine hoặc mô hình Doubao với OpenClaw
  - Bạn cần thiết lập khóa API của Volcengine
---

# Volcengine (Doubao)

Nhà cung cấp Volcengine cho phép truy cập vào các mô hình Doubao và mô hình bên thứ ba được lưu trữ trên Volcano Engine, với các endpoint riêng biệt cho công việc tổng quát và mã hóa.

- Nhà cung cấp: `volcengine` (tổng quát) + `volcengine-plan` (mã hóa)
- Xác thực: `VOLCANO_ENGINE_API_KEY`
- API: Tương thích với OpenAI

## Bắt đầu nhanh

1. Thiết lập khóa API:

```bash
openclaw onboard --auth-choice volcengine-api-key
```

2. Thiết lập mô hình mặc định:

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

## Nhà cung cấp và endpoint

| Nhà cung cấp      | Endpoint                                  | Trường hợp sử dụng |
| ----------------- | ----------------------------------------- | ------------------ |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Mô hình tổng quát  |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Mô hình mã hóa     |

Cả hai nhà cung cấp đều được cấu hình từ một khóa API duy nhất. Thiết lập sẽ tự động đăng ký cả hai.

## Các mô hình có sẵn

- **doubao-seed-1-8** - Doubao Seed 1.8 (tổng quát, mặc định)
- **doubao-seed-code-preview** - Mô hình mã hóa Doubao
- **ark-code-latest** - Mặc định cho kế hoạch mã hóa
- **Kimi K2.5** - Moonshot AI qua Volcano Engine
- **GLM-4.7** - GLM qua Volcano Engine
- **DeepSeek V3.2** - DeepSeek qua Volcano Engine

Hầu hết các mô hình hỗ trợ đầu vào văn bản + hình ảnh. Cửa sổ ngữ cảnh dao động từ 128K đến 256K token.

## Lưu ý về môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo rằng `VOLCANO_ENGINE_API_KEY` có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`).
