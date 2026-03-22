# OpenCode

OpenCode cung cấp hai catalog hosted trên OpenClaw:

- `opencode/...` cho catalog **Zen**
- `opencode-go/...` cho catalog **Go**

Cả hai catalog dùng chung OpenCode API key. OpenClaw giữ riêng runtime provider ids để đảm bảo routing theo model đúng, nhưng onboarding và tài liệu xem chúng như một setup OpenCode duy nhất.

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

## Catalogs

### Zen

- Runtime provider: `opencode`
- Model ví dụ: `opencode/claude-opus-4-6`, `opencode/gpt-5.2`, `opencode/gemini-3-pro`
- Phù hợp khi cần proxy đa model OpenCode được chọn lọc

### Go

- Runtime provider: `opencode-go`
- Model ví dụ: `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5`
- Phù hợp khi cần lineup Kimi/GLM/MiniMax hosted bởi OpenCode

## Ghi chú

- `OPENCODE_ZEN_API_KEY` cũng được hỗ trợ.
- Nhập một OpenCode key trong quá trình setup sẽ lưu thông tin cho cả hai runtime providers.
- Đăng nhập OpenCode, thêm thông tin thanh toán, và copy API key.
- Quản lý thanh toán và catalog từ OpenCode dashboard.\n