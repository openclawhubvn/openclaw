---
summary: "Tìm hiểu cách sử dụng catalog Zen và Go của OpenCode để tối ưu hóa trải nghiệm với OpenClaw."
read_when:
  - Bạn muốn truy cập mô hình được lưu trữ bởi OpenCode
  - Bạn muốn chọn giữa catalog Zen và Go
title: "Hướng Dẫn Sử Dụng OpenCode Với OpenClaw"
---

# OpenCode

OpenCode cung cấp hai catalog được lưu trữ trong OpenClaw:

- `opencode/...` cho catalog **Zen**
- `opencode-go/...` cho catalog **Go**

Cả hai catalog đều sử dụng cùng một API key của OpenCode. OpenClaw giữ các id nhà cung cấp runtime tách biệt để đảm bảo định tuyến theo mô hình ở phía trên đúng, nhưng quá trình onboarding và tài liệu thì coi chúng như một thiết lập OpenCode duy nhất.

## Thiết lập CLI

### Catalog Zen

```bash
openclaw onboard --auth-choice opencode-zen
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

### Catalog Go

```bash
openclaw onboard --auth-choice opencode-go
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Đoạn cấu hình

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Catalog

### Zen

- Nhà cung cấp runtime: `opencode`
- Mô hình ví dụ: `opencode/claude-opus-4-6`, `opencode/gpt-5.2`, `opencode/gemini-3-pro`
- Tốt nhất khi bạn muốn proxy đa mô hình được chọn lọc của OpenCode

### Go

- Nhà cung cấp runtime: `opencode-go`
- Mô hình ví dụ: `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5`
- Tốt nhất khi bạn muốn dòng sản phẩm Kimi/GLM/MiniMax được lưu trữ bởi OpenCode

## Ghi chú

- `OPENCODE_ZEN_API_KEY` cũng được hỗ trợ.
- Nhập một API key của OpenCode trong quá trình thiết lập sẽ lưu thông tin đăng nhập cho cả hai nhà cung cấp runtime.
- Đăng nhập vào OpenCode, thêm thông tin thanh toán và sao chép API key của bạn.
- Quản lý thanh toán và khả năng truy cập catalog từ bảng điều khiển OpenCode.
