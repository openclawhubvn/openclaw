---
summary: "Khám phá cách cấu hình và áp dụng mô hình GLM trong OpenClaw để tối ưu hóa hiệu suất hệ thống của bạn."
read_when:
  - Bạn muốn sử dụng mô hình GLM trong OpenClaw
  - Bạn cần biết quy ước đặt tên và thiết lập mô hình
title: "Hướng Dẫn Sử Dụng Mô Hình GLM OpenClaw"
---

# Mô hình GLM

GLM là một **dòng mô hình** (không phải công ty) có sẵn thông qua nền tảng Z.AI. Trong OpenClaw, các mô hình GLM được truy cập qua nhà cung cấp `zai` và các ID mô hình như `zai/glm-5`.

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

- Phiên bản và khả dụng của GLM có thể thay đổi; hãy kiểm tra tài liệu của Z.AI để cập nhật mới nhất.
- Ví dụ về ID mô hình bao gồm `glm-5`, `glm-4.7`, và `glm-4.6`.
- Để biết chi tiết về nhà cung cấp, xem tại [/providers/zai](/providers/zai).
