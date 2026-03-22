---
summary: "Sử dụng OpenCode Go catalog với thiết lập OpenCode chung"
read_when:
  - Cần OpenCode Go catalog
  - Cần runtime model refs cho các model chạy trên Go
title: "OpenCode Go"
---

# OpenCode Go

OpenCode Go là catalog Go trong [OpenCode](/providers/opencode). Dùng chung `OPENCODE_API_KEY` với Zen catalog, nhưng giữ `opencode-go` làm runtime provider id để đảm bảo routing theo model đúng.

## Model hỗ trợ

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

## Hành vi routing

OpenClaw tự động xử lý routing theo model khi model ref dùng `opencode-go/...`.

## Ghi chú

- Dùng [OpenCode](/providers/opencode) cho onboarding chung và tổng quan catalog.
- Runtime refs rõ ràng: `opencode/...` cho Zen, `opencode-go/...` cho Go.\n