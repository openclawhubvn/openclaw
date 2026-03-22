---
title: "Model Studio"
summary: "Cài đặt Alibaba Cloud Model Studio (Coding Plan, dual region endpoints)"
read_when:
  - Muốn dùng Alibaba Cloud Model Studio với OpenClaw
  - Cần biến môi trường API key cho Model Studio
---

# Model Studio (Alibaba Cloud)

Provider Model Studio cho phép truy cập các mô hình Coding Plan của Alibaba Cloud, bao gồm Qwen và các mô hình bên thứ ba trên nền tảng này.

- Provider: `modelstudio`
- Auth: `MODELSTUDIO_API_KEY`
- API: Tương thích OpenAI

## Bắt đầu nhanh

1. Thiết lập API key:

```bash
openclaw onboard --auth-choice modelstudio-api-key
```

2. Thiết lập mô hình mặc định:

```json5
{
  agents: {
    defaults: {
      model: { primary: "modelstudio/qwen3.5-plus" },
    },
  },
}
```

## Region endpoints

Model Studio có hai endpoints dựa trên khu vực:

| Khu vực    | Endpoint                             |
| ---------- | ------------------------------------ |
| Trung Quốc | `coding.dashscope.aliyuncs.com`      |
| Toàn cầu   | `coding-intl.dashscope.aliyuncs.com` |

Provider tự động chọn dựa trên auth choice (`modelstudio-api-key` cho toàn cầu, `modelstudio-api-key-cn` cho Trung Quốc). Có thể ghi đè bằng `baseUrl` tùy chỉnh trong config.

## Các mô hình có sẵn

- **qwen3.5-plus** (mặc định) - Qwen 3.5 Plus
- **qwen3-max** - Qwen 3 Max
- **qwen3-coder** series - Mô hình mã hóa Qwen
- **GLM-5**, **GLM-4.7** - Mô hình GLM qua Alibaba
- **Kimi K2.5** - Moonshot AI qua Alibaba
- **MiniMax-M2.5** - MiniMax qua Alibaba

Hầu hết các mô hình hỗ trợ đầu vào hình ảnh. Cửa sổ ngữ cảnh từ 200K đến 1M tokens.

## Lưu ý môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `MODELSTUDIO_API_KEY` có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).\n