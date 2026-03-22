---
summary: "Sử dụng mô hình xAI Grok trong OpenClaw"
read_when:
  - Muốn dùng mô hình Grok trong OpenClaw
  - Đang cấu hình xAI auth hoặc model ids
title: "xAI"
---

# xAI

OpenClaw tích hợp sẵn plugin `xai` cho mô hình Grok.

## Cài đặt

1. Tạo API key trong xAI console.
2. Đặt `XAI_API_KEY`, hoặc chạy lệnh:

```bash
openclaw onboard --auth-choice xai-api-key
```

3. Chọn mô hình, ví dụ:

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

## Danh mục mô hình hiện có

OpenClaw hiện bao gồm các mô hình xAI sau:

- `grok-4`, `grok-4-0709`
- `grok-4-fast-reasoning`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast-reasoning`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-reasoning`, `grok-4.20-non-reasoning`
- `grok-code-fast-1`

Plugin cũng tự động nhận diện các id `grok-4*` và `grok-code-fast*` mới nếu chúng tuân theo cấu trúc API tương tự.

## Tìm kiếm web

Provider tìm kiếm web `grok` tích hợp cũng dùng `XAI_API_KEY`:

```bash
openclaw config set tools.web.search.provider grok
```

## Giới hạn hiện tại

- Hiện chỉ hỗ trợ auth qua API-key. Chưa có OAuth/device-code flow cho xAI trong OpenClaw.
- `grok-4.20-multi-agent-experimental-beta-0304` không hỗ trợ trên đường dẫn provider xAI thông thường vì cần API khác với chuẩn OpenClaw xAI.
- Các công cụ server-side xAI như `x_search` và `code_execution` chưa phải là tính năng chính trong plugin tích hợp.

## Ghi chú

- OpenClaw tự động áp dụng các fix tương thích tool-schema và tool-call đặc thù xAI trên shared runner path.
- Để xem tổng quan về provider, tham khảo [Model providers](/providers/index).\n