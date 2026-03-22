# LLM Task

`llm-task` là một **plugin tùy chọn** chạy task LLM chỉ với JSON và trả về output có cấu trúc (có thể được xác thực với JSON Schema).

Rất phù hợp cho các workflow engine như Lobster: thêm một bước LLM mà không cần viết code OpenClaw tùy chỉnh cho từng workflow.

## Kích hoạt plugin

1. Kích hoạt plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Cho phép tool (được đăng ký với `optional: true`):

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## Cấu hình (tùy chọn)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.4",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` là danh sách cho phép các chuỗi `provider/model`. Nếu thiết lập, bất kỳ yêu cầu nào ngoài danh sách sẽ bị từ chối.

## Tham số tool

- `prompt` (string, bắt buộc)
- `input` (bất kỳ, tùy chọn)
- `schema` (object, JSON Schema tùy chọn)
- `provider` (string, tùy chọn)
- `model` (string, tùy chọn)
- `thinking` (string, tùy chọn)
- `authProfileId` (string, tùy chọn)
- `temperature` (number, tùy chọn)
- `maxTokens` (number, tùy chọn)
- `timeoutMs` (number, tùy chọn)

`thinking` chấp nhận các preset lý luận chuẩn của OpenClaw như `low` hoặc `medium`.

## Output

Trả về `details.json` chứa JSON đã parse (và xác thực với `schema` nếu có).

## Ví dụ: Bước workflow Lobster

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## Lưu ý an toàn

- Tool chỉ hỗ trợ **JSON-only** và hướng dẫn model chỉ output JSON (không có code fences, không có chú thích).
- Không có tool nào được expose cho model trong lần chạy này.
- Xem output là không đáng tin cậy trừ khi đã xác thực với `schema`.
- Đặt phê duyệt trước bất kỳ bước nào có tác động phụ (send, post, exec).\n