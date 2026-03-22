---
summary: "Tìm hiểu cách cấu hình và sử dụng Z.AI, mô hình GLM, để tối ưu hóa trải nghiệm AI trên nền tảng OpenClaw."
read_when:
  - Bạn muốn tích hợp mô hình Z.AI / GLM vào OpenClaw
  - Bạn cần thiết lập ZAI_API_KEY đơn giản
title: "Hướng Dẫn Sử Dụng Z.AI Với OpenClaw"
---

# Z.AI

Z.AI là nền tảng API cho các mô hình **GLM**. Nó cung cấp REST APIs cho GLM và sử dụng API keys để xác thực. Tạo API key của bạn trong bảng điều khiển Z.AI. OpenClaw sử dụng nhà cung cấp `zai` với API key từ Z.AI.

## Thiết lập CLI

```bash
# Kế hoạch mã hóa toàn cầu, khuyến nghị cho người dùng Kế hoạch mã hóa
openclaw onboard --auth-choice zai-coding-global

# Kế hoạch mã hóa CN (khu vực Trung Quốc), khuyến nghị cho người dùng Kế hoạch mã hóa
openclaw onboard --auth-choice zai-coding-cn

# API chung
openclaw onboard --auth-choice zai-global

# API chung CN (khu vực Trung Quốc)
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

- Các mô hình GLM có sẵn dưới dạng `zai/<model>` (ví dụ: `zai/glm-5`).
- `tool_stream` được bật mặc định cho việc streaming công cụ của Z.AI. Đặt `agents.defaults.models["zai/<model>"].params.tool_stream` thành `false` để tắt.
- Xem [/providers/glm](/providers/glm) để có cái nhìn tổng quan về dòng mô hình.
- Z.AI sử dụng xác thực Bearer với API key của bạn.
