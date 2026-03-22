---
summary: "Khám phá cách cấu hình nhiệm vụ LLM với JSON, tối ưu quy trình làm việc và tích hợp công cụ plugin hiệu quả."
read_when:
  - Bạn muốn một bước LLM chỉ sử dụng JSON trong quy trình làm việc
  - Bạn cần đầu ra LLM được xác thực theo schema cho tự động hóa
title: "Hướng Dẫn Cấu Hình Nhiệm Vụ LLM"
---

# Nhiệm vụ LLM

`llm-task` là một **công cụ plugin tùy chọn** thực hiện nhiệm vụ LLM chỉ sử dụng JSON và trả về đầu ra có cấu trúc (có thể được xác thực theo JSON Schema).

Điều này lý tưởng cho các công cụ quy trình làm việc như Lobster: bạn có thể thêm một bước LLM mà không cần viết mã OpenClaw tùy chỉnh cho từng quy trình.

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

2. Cho phép công cụ (được đăng ký với `optional: true`):

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

`allowedModels` là danh sách cho phép các chuỗi `provider/model`. Nếu được thiết lập, bất kỳ yêu cầu nào ngoài danh sách này sẽ bị từ chối.

## Tham số công cụ

- `prompt` (chuỗi, bắt buộc)
- `input` (bất kỳ, tùy chọn)
- `schema` (đối tượng, JSON Schema tùy chọn)
- `provider` (chuỗi, tùy chọn)
- `model` (chuỗi, tùy chọn)
- `thinking` (chuỗi, tùy chọn)
- `authProfileId` (chuỗi, tùy chọn)
- `temperature` (số, tùy chọn)
- `maxTokens` (số, tùy chọn)
- `timeoutMs` (số, tùy chọn)

`thinking` chấp nhận các thiết lập lý luận tiêu chuẩn của OpenClaw, như `low` hoặc `medium`.

## Đầu ra

Trả về `details.json` chứa JSON đã được phân tích (và xác thực theo `schema` nếu có).

## Ví dụ: Bước quy trình làm việc Lobster

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

- Công cụ này **chỉ sử dụng JSON** và hướng dẫn mô hình chỉ xuất ra JSON (không có code fence, không có chú thích).
- Không có công cụ nào được cung cấp cho mô hình trong lần chạy này.
- Xem đầu ra là không đáng tin cậy trừ khi bạn xác thực với `schema`.
- Đặt phê duyệt trước bất kỳ bước nào có thể gây ra tác động phụ (gửi, đăng, thực thi).
