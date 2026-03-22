---
summary: "Sử dụng danh mục OpenCode Go với thiết lập OpenCode chung"
read_when:
  - Bạn muốn danh mục OpenCode Go
  - Bạn cần tham chiếu mô hình runtime cho các mô hình được lưu trữ trên Go
title: "OpenCode Go"
---

# OpenCode Go

OpenCode Go là danh mục Go trong [OpenCode](/providers/opencode). Nó sử dụng cùng `OPENCODE_API_KEY` như danh mục Zen, nhưng giữ id nhà cung cấp runtime là `opencode-go` để đảm bảo định tuyến theo mô hình ở phía trên vẫn chính xác.

## Các mô hình được hỗ trợ

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## Thiết lập CLI

```bash
openclaw onboard --auth-choice opencode-go
# hoặc không tương tác
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Đoạn cấu hình

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Hành vi định tuyến

OpenClaw tự động xử lý định tuyến theo mô hình khi tham chiếu mô hình sử dụng `opencode-go/...`.

## Ghi chú

- Sử dụng [OpenCode](/providers/opencode) cho việc onboarding chung và tổng quan danh mục.
- Tham chiếu runtime được giữ rõ ràng: `opencode/...` cho Zen, `opencode-go/...` cho Go.
