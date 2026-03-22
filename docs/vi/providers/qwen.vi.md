---
summary: "Sử dụng Qwen OAuth (miễn phí) trong OpenClaw"
read_when:
  - Muốn dùng Qwen với OpenClaw
  - Cần OAuth miễn phí cho Qwen Coder
title: "Qwen"
---

# Qwen

Qwen cung cấp OAuth miễn phí cho Qwen Coder và Qwen Vision (2,000 requests/ngày, tuân theo giới hạn của Qwen).

## Kích hoạt plugin

```bash
openclaw plugins enable qwen-portal-auth
```

Khởi động lại Gateway sau khi kích hoạt.

## Xác thực

```bash
openclaw models auth login --provider qwen-portal --set-default
```

Chạy OAuth device-code của Qwen và ghi thông tin provider vào `models.json` (thêm alias `qwen` để chuyển nhanh).

## Model IDs

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

Chuyển model bằng:

```bash
openclaw models set qwen-portal/coder-model
```

## Tái sử dụng đăng nhập Qwen Code CLI

Nếu đã đăng nhập bằng Qwen Code CLI, OpenClaw sẽ đồng bộ credentials từ `~/.qwen/oauth_creds.json` khi tải auth store. Vẫn cần mục `models.providers.qwen-portal` (dùng lệnh login trên để tạo).

## Lưu ý

- Tokens tự động làm mới; chạy lại lệnh login nếu refresh thất bại hoặc bị thu hồi quyền truy cập.
- URL mặc định: `https://portal.qwen.ai/v1` (có thể override với `models.providers.qwen-portal.baseUrl` nếu Qwen cung cấp endpoint khác).
- Xem [Model providers](/concepts/model-providers) để biết quy tắc chung cho provider.\n