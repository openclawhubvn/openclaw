---
summary: "Sử dụng mô hình xAI Grok trong OpenClaw"
read_when:
  - Bạn muốn sử dụng mô hình Grok trong OpenClaw
  - Bạn đang cấu hình xAI auth hoặc model ids
title: "xAI"
---

# xAI

OpenClaw tích hợp sẵn plugin nhà cung cấp `xai` cho các mô hình Grok.

## Thiết lập

1. Tạo một API key trong xAI console.
2. Đặt `XAI_API_KEY`, hoặc chạy lệnh:

```bash
openclaw onboard --auth-choice xai-api-key
```

3. Chọn một mô hình như sau:

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

## Danh mục mô hình hiện có

OpenClaw hiện bao gồm các dòng mô hình xAI sau:

- `grok-4`, `grok-4-0709`
- `grok-4-fast-reasoning`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast-reasoning`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-reasoning`, `grok-4.20-non-reasoning`
- `grok-code-fast-1`

Plugin cũng hỗ trợ tự động nhận diện các id `grok-4*` và `grok-code-fast*` mới hơn khi chúng tuân theo cấu trúc API tương tự.

## Tìm kiếm web

Nhà cung cấp tìm kiếm web `grok` tích hợp cũng sử dụng `XAI_API_KEY`:

```bash
openclaw config set tools.web.search.provider grok
```

## Giới hạn hiện tại

- Hiện tại chỉ hỗ trợ xác thực bằng API-key. Chưa có luồng xAI OAuth/device-code trong OpenClaw.
- `grok-4.20-multi-agent-experimental-beta-0304` không được hỗ trợ trên đường dẫn nhà cung cấp xAI thông thường vì nó yêu cầu một bề mặt API khác so với giao thức xAI tiêu chuẩn của OpenClaw.
- Các công cụ phía server xAI như `x_search` và `code_execution` chưa phải là tính năng nhà cung cấp mô hình chính thức trong plugin tích hợp.

## Ghi chú

- OpenClaw tự động áp dụng các sửa lỗi tương thích tool-schema và tool-call đặc thù của xAI trên đường dẫn runner chia sẻ.
- Để có cái nhìn tổng quan hơn về nhà cung cấp, xem [Nhà cung cấp mô hình](/providers/index).
