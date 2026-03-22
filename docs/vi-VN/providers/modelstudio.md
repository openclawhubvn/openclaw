---
title: "Model Studio"
summary: "Thiết lập Alibaba Cloud Model Studio (Kế hoạch mã hóa, điểm cuối hai khu vực)"
read_when:
  - Bạn muốn sử dụng Alibaba Cloud Model Studio với OpenClaw
  - Bạn cần biến môi trường API key cho Model Studio
---

# Model Studio (Alibaba Cloud)

Nhà cung cấp Model Studio cho phép truy cập vào các mô hình Kế hoạch mã hóa của Alibaba Cloud, bao gồm Qwen và các mô hình bên thứ ba được lưu trữ trên nền tảng này.

- Nhà cung cấp: `modelstudio`
- Xác thực: `MODELSTUDIO_API_KEY`
- API: Tương thích với OpenAI

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

## Điểm cuối khu vực

Model Studio có hai điểm cuối dựa trên khu vực:

| Khu vực    | Điểm cuối                             |
| ---------- | ------------------------------------- |
| Trung Quốc (CN) | `coding.dashscope.aliyuncs.com`      |
| Toàn cầu   | `coding-intl.dashscope.aliyuncs.com` |

Nhà cung cấp tự động chọn dựa trên lựa chọn xác thực (`modelstudio-api-key` cho toàn cầu, `modelstudio-api-key-cn` cho Trung Quốc). Bạn có thể ghi đè bằng `baseUrl` tùy chỉnh trong cấu hình.

## Các mô hình có sẵn

- **qwen3.5-plus** (mặc định) - Qwen 3.5 Plus
- **qwen3-max** - Qwen 3 Max
- Dòng **qwen3-coder** - Các mô hình mã hóa Qwen
- **GLM-5**, **GLM-4.7** - Các mô hình GLM qua Alibaba
- **Kimi K2.5** - Moonshot AI qua Alibaba
- **MiniMax-M2.5** - MiniMax qua Alibaba

Hầu hết các mô hình hỗ trợ đầu vào hình ảnh. Cửa sổ ngữ cảnh dao động từ 200K đến 1 triệu token.

## Lưu ý về môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `MODELSTUDIO_API_KEY` có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`).
