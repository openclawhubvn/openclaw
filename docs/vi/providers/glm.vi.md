---
summary: "Tổng quan về dòng mô hình GLM + cách sử dụng trong OpenClaw"
read_when:
  - Cần mô hình GLM trong OpenClaw
  - Cần biết quy ước đặt tên và thiết lập mô hình
title: "Mô hình GLM"
---

# Mô hình GLM

GLM là một **dòng mô hình** (không phải công ty) có sẵn qua nền tảng Z.AI. Trong OpenClaw, truy cập mô hình GLM qua `zai` provider và các model ID như `zai/glm-5`.

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

- Phiên bản và khả dụng của GLM có thể thay đổi; kiểm tra tài liệu của Z.AI để cập nhật mới nhất.
- Ví dụ model ID gồm `glm-5`, `glm-4.7`, và `glm-4.6`.
- Chi tiết về provider, xem tại [/providers/zai](/providers/zai).\n