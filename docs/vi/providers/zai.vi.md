---
summary: "Sử dụng Z.AI (mô hình GLM) với OpenClaw"
read_when:
  - Muốn tích hợp mô hình Z.AI / GLM vào OpenClaw
  - Cần thiết lập ZAI_API_KEY đơn giản
title: "Z.AI"
---

# Z.AI

Z.AI là nền tảng API cho mô hình **GLM**. Cung cấp REST APIs cho GLM và dùng API key để xác thực. Tạo API key trong Z.AI console. OpenClaw dùng `zai` provider với API key từ Z.AI.

## Thiết lập CLI

```bash
# Coding Plan Global, khuyến nghị cho người dùng Coding Plan
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (khu vực Trung Quốc), khuyến nghị cho người dùng Coding Plan
openclaw onboard --auth-choice zai-coding-cn

# General API
openclaw onboard --auth-choice zai-global

# General API CN (khu vực Trung Quốc)
openclaw onboard --auth-choice zai-cn
```

## Đoạn cấu hình

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

## Ghi chú

- Mô hình GLM có sẵn dưới dạng `zai/<model>` (ví dụ: `zai/glm-5`).
- `tool_stream` mặc định bật cho Z.AI tool-call streaming. Đặt `agents.defaults.models["zai/<model>"].params.tool_stream` thành `false` để tắt.
- Xem [/providers/glm](/providers/glm) để biết tổng quan về dòng mô hình.
- Z.AI dùng Bearer auth với API key.\n